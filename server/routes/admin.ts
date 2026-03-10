import { Router, Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

interface CacheEntry {
  data: any;
  expires: number;
}

const dashboardCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute cache for dashboard stats

function getCached(key: string): any | null {
  const entry = dashboardCache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  dashboardCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  dashboardCache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL
  });
}

router.get('/dashboard', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    
    // Try to get cached stats
    let cachedStats = !forceRefresh ? getCached('dashboard_stats') : null;
    
    let stats;
    if (cachedStats) {
      stats = cachedStats;
    } else {
      const statsResult = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'USER') as total_users,
          (SELECT COUNT(*) FROM users WHERE role = 'USER' AND created_at > CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
          (SELECT COUNT(*) FROM users WHERE role = 'USER' AND created_at > CURRENT_DATE - INTERVAL '7 days') as new_users_7d,
          (SELECT COUNT(*) FROM merchants) as total_merchants,
          (SELECT COUNT(*) FROM merchants WHERE status = 'PENDING') as pending_merchants,
          (SELECT COUNT(*) FROM merchants WHERE status = 'VERIFIED') as verified_merchants,
          (SELECT COUNT(*) FROM merchants WHERE status = 'SUSPENDED') as suspended_merchants,
          (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
          (SELECT COUNT(*) FROM products WHERE is_active = false) as inactive_products,
          (SELECT COUNT(*) FROM orders) as total_orders,
          (SELECT COUNT(*) FROM orders WHERE created_at > CURRENT_DATE - INTERVAL '30 days') as orders_30d,
          (SELECT COUNT(*) FROM orders WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as orders_7d,
          (SELECT COUNT(*) FROM orders WHERE status = 'PENDING') as pending_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'PROCESSING') as processing_orders,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'DELIVERED') as total_revenue,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'DELIVERED' AND created_at > CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'DELIVERED' AND created_at > CURRENT_DATE - INTERVAL '7 days') as revenue_7d,
          (SELECT COUNT(*) FROM stores WHERE is_active = true) as active_stores,
          (SELECT COUNT(*) FROM journal_entries WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as active_cycles_7d,
          (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status = 'DELIVERED') as avg_order_value
      `);
      stats = statsResult.rows[0];
      setCache('dashboard_stats', stats);
    }
    
    // Recent orders (always fresh)
    const recentOrders = await query(`
      SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_status, o.created_at,
             u.name as customer_name, u.email as customer_email,
             m.business_name as merchant_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN merchants m ON m.id = o.merchant_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    // Pending merchants needing approval
    const pendingMerchants = await query(`
      SELECT m.id, m.business_name, m.business_type, m.created_at, 
             u.email, u.name, u.phone,
             (SELECT COUNT(*) FROM merchant_documents WHERE merchant_id = m.id) as documents_submitted
      FROM merchants m
      JOIN users u ON u.id = m.user_id
      WHERE m.status = 'PENDING'
      ORDER BY m.created_at ASC
      LIMIT 10
    `);
    
    // Low stock alerts with urgency levels
    const lowStockAlerts = await query(`
      SELECT p.id, p.name, p.image_url, pi.quantity, pi.low_stock_threshold, 
             m.business_name, s.name as store_name, s.city,
             CASE 
               WHEN pi.quantity = 0 THEN 'critical'
               WHEN pi.quantity <= pi.low_stock_threshold / 2 THEN 'urgent'
               ELSE 'warning'
             END as urgency
      FROM products p
      JOIN product_inventory pi ON pi.product_id = p.id
      JOIN stores s ON s.id = pi.store_id
      JOIN merchants m ON m.id = p.merchant_id
      WHERE pi.quantity <= pi.low_stock_threshold AND p.is_active = true
      ORDER BY pi.quantity ASC, p.name ASC
      LIMIT 15
    `);
    
    // Recent AI insights/audit activities
    const recentAuditLogs = await query(`
      SELECT al.id, al.action, al.entity_type, al.created_at, al.notes,
             u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);
    
    // System health metrics
    const systemHealth = {
      database: 'healthy',
      api: 'operational',
      lastUpdated: new Date().toISOString(),
      cacheStatus: cachedStats ? 'cached' : 'fresh'
    };
    
    res.json({
      stats,
      recentOrders: recentOrders.rows,
      pendingMerchants: pendingMerchants.rows,
      lowStockAlerts: lowStockAlerts.rows,
      recentAuditLogs: recentAuditLogs.rows,
      systemHealth
    });
  } catch (error: any) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

router.get('/users', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (role && role !== 'all') {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (search) {
      whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM users u WHERE ${whereClause}`,
      params
    );
    
    params.push(parseInt(limit as string), offset);
    
    const result = await query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.is_active, u.email_verified, u.language, u.created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
       FROM users u
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.put('/users/:userId/status', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const oldUser = await query('SELECT is_active FROM users WHERE id = $1', [userId]);
    
    await query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [isActive, userId]
    );
    
    await logAudit(req.user!.userId, isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE', 'users', userId, oldUser.rows[0], { isActive }, req.ip, req.get('user-agent'));
    
    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error: any) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

router.get('/audit-logs', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, entityType, userId, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (action) {
      whereClause += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }
    
    if (entityType) {
      whereClause += ` AND al.entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }
    
    if (userId) {
      whereClause += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM audit_logs al WHERE ${whereClause}`,
      params
    );
    
    params.push(parseInt(limit as string), offset);
    
    const result = await query(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

router.get('/analytics/overview', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string);
    
    const dailyStats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at > CURRENT_DATE - INTERVAL '${daysNum} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    const userGrowth = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE role = 'USER' AND created_at > CURRENT_DATE - INTERVAL '${daysNum} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    const topProducts = await query(`
      SELECT p.id, p.name, m.business_name,
             SUM(oi.quantity) as total_sold,
             SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN merchants m ON m.id = p.merchant_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at > CURRENT_DATE - INTERVAL '${daysNum} days'
      GROUP BY p.id, m.id
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    
    const topMerchants = await query(`
      SELECT m.id, m.business_name, m.rating,
             COUNT(DISTINCT o.id) as order_count,
             COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM merchants m
      LEFT JOIN orders o ON o.merchant_id = m.id AND o.created_at > CURRENT_DATE - INTERVAL '${daysNum} days'
      WHERE m.status = 'VERIFIED'
      GROUP BY m.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
    
    res.json({
      dailyStats: dailyStats.rows,
      userGrowth: userGrowth.rows,
      topProducts: topProducts.rows,
      topMerchants: topMerchants.rows
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

router.post('/exports', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exportType, parameters } = req.body;
    
    if (!exportType) {
      res.status(400).json({ error: 'Export type is required' });
      return;
    }
    
    const fileName = `${exportType}_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`;
    
    const result = await query(
      `INSERT INTO admin_exports (admin_id, export_type, file_name, parameters, status, started_at)
       VALUES ($1, $2, $3, $4, 'PROCESSING', CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user!.userId, exportType, fileName, JSON.stringify(parameters || {})]
    );
    
    await logAudit(req.user!.userId, 'EXPORT_CREATE', 'admin_exports', result.rows[0].id, null, { exportType, parameters }, req.ip, req.get('user-agent'));
    
    res.status(202).json({ 
      export: result.rows[0],
      message: 'Export started. Check status for completion.'
    });
  } catch (error: any) {
    console.error('Create export error:', error);
    res.status(500).json({ error: 'Failed to create export' });
  }
});

router.get('/exports', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT ae.*, u.name as admin_name
       FROM admin_exports ae
       JOIN users u ON u.id = ae.admin_id
       ORDER BY ae.created_at DESC
       LIMIT 50`
    );
    
    res.json({ exports: result.rows });
  } catch (error: any) {
    console.error('Get exports error:', error);
    res.status(500).json({ error: 'Failed to get exports' });
  }
});

// Full inventory overview with filtering
router.get('/inventory', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { stockLevel, merchantId, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 'p.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (stockLevel === 'out') {
      whereClause += ' AND pi.quantity = 0';
    } else if (stockLevel === 'low') {
      whereClause += ' AND pi.quantity > 0 AND pi.quantity <= pi.low_stock_threshold';
    } else if (stockLevel === 'healthy') {
      whereClause += ' AND pi.quantity > pi.low_stock_threshold';
    }
    
    if (merchantId) {
      whereClause += ` AND p.merchant_id = $${paramIndex}`;
      params.push(merchantId);
      paramIndex++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN product_inventory pi ON pi.product_id = p.id
       WHERE ${whereClause}`,
      params
    );
    
    params.push(parseInt(limit as string), offset);
    
    const result = await query(
      `SELECT p.id, p.name, p.image_url, p.price, p.is_active,
              m.business_name, m.id as merchant_id,
              s.name as store_name, s.city,
              COALESCE(pi.quantity, 0) as quantity,
              COALESCE(pi.low_stock_threshold, 10) as low_stock_threshold,
              CASE 
                WHEN pi.quantity IS NULL OR pi.quantity = 0 THEN 'out_of_stock'
                WHEN pi.quantity <= pi.low_stock_threshold THEN 'low_stock'
                ELSE 'in_stock'
              END as stock_status
       FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       LEFT JOIN product_inventory pi ON pi.product_id = p.id
       LEFT JOIN stores s ON s.id = pi.store_id
       WHERE ${whereClause}
       ORDER BY COALESCE(pi.quantity, 0) ASC, p.name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    // Get summary stats
    const summaryResult = await query(`
      SELECT 
        COUNT(DISTINCT p.id) FILTER (WHERE pi.quantity = 0 OR pi.quantity IS NULL) as out_of_stock_count,
        COUNT(DISTINCT p.id) FILTER (WHERE pi.quantity > 0 AND pi.quantity <= pi.low_stock_threshold) as low_stock_count,
        COUNT(DISTINCT p.id) FILTER (WHERE pi.quantity > pi.low_stock_threshold) as healthy_stock_count
      FROM products p
      LEFT JOIN product_inventory pi ON pi.product_id = p.id
      WHERE p.is_active = true
    `);
    
    res.json({
      inventory: result.rows,
      summary: summaryResult.rows[0],
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

// Suspend/unsuspend merchant
router.put('/merchants/:merchantId/suspend', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const { suspended, reason } = req.body;
    
    const status = suspended ? 'SUSPENDED' : 'VERIFIED';
    const oldData = await query('SELECT status FROM merchants WHERE id = $1', [merchantId]);
    
    if (oldData.rows.length === 0) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    
    await query(
      `UPDATE merchants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, merchantId]
    );
    
    await logAudit(
      req.user!.userId,
      suspended ? 'MERCHANT_SUSPEND' : 'MERCHANT_UNSUSPEND',
      'merchants',
      merchantId,
      oldData.rows[0],
      { status, reason },
      req.ip,
      req.get('user-agent')
    );
    
    res.json({ message: `Merchant ${suspended ? 'suspended' : 'reactivated'} successfully` });
  } catch (error: any) {
    console.error('Suspend merchant error:', error);
    res.status(500).json({ error: 'Failed to update merchant status' });
  }
});

// Get user details with full history
router.get('/users/:userId', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const userResult = await query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.is_active, u.email_verified, 
              u.language, u.created_at, u.updated_at,
              up.last_period_date, up.cycle_length, up.period_length, up.city, up.district
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const ordersResult = await query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, m.business_name
       FROM orders o
       JOIN merchants m ON m.id = o.merchant_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    const auditResult = await query(
      `SELECT action, entity_type, created_at, notes
       FROM audit_logs
       WHERE user_id = $1 OR entity_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    
    const statsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM orders WHERE user_id = $1) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = $1 AND status = 'DELIVERED') as total_spent,
        (SELECT COUNT(*) FROM journal_entries WHERE user_id = $1) as journal_entries,
        (SELECT COUNT(*) FROM wishlists WHERE user_id = $1) as wishlist_items`,
      [userId]
    );
    
    res.json({
      user: userResult.rows[0],
      recentOrders: ordersResult.rows,
      auditLog: auditResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error: any) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Update user role
router.put('/users/:userId/role', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['USER', 'MERCHANT', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    
    const oldUser = await query('SELECT role FROM users WHERE id = $1', [userId]);
    
    if (oldUser.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    await query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [role, userId]
    );
    
    await logAudit(req.user!.userId, 'USER_ROLE_CHANGE', 'users', userId, oldUser.rows[0], { role }, req.ip, req.get('user-agent'));
    
    res.json({ message: `User role updated to ${role}` });
  } catch (error: any) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Clear dashboard cache endpoint
router.post('/cache/clear', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    dashboardCache.clear();
    await logAudit(req.user!.userId, 'CACHE_CLEAR', 'system', null, null, { action: 'dashboard_cache_cleared' }, req.ip, req.get('user-agent'));
    res.json({ message: 'Dashboard cache cleared successfully' });
  } catch (error: any) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
