import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../db/connection';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

/* =========================
   INVITE MERCHANT
========================= */

router.post('/invite', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    const { email, businessName, businessType } = req.body;

    if (!email || !businessName) {
      res.status(400).json({ error: 'Email and business name are required' });
      return;
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const tempPassword = uuidv4().substring(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const magicToken = uuidv4();
    const magicExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await transaction(async (client) => {

      const userResult = await client.query(
        `INSERT INTO users (email, name, password_hash, role, magic_link_token, magic_link_expires)
         VALUES ($1,$2,$3,'MERCHANT',$4,$5)
         RETURNING id,email,name`,
        [email.toLowerCase(), businessName, passwordHash, magicToken, magicExpires]
      );

      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO user_profiles (user_id) VALUES ($1)`,
        [user.id]
      );

      await client.query(
        `INSERT INTO merchants (user_id,business_name,business_type,status)
         VALUES ($1,$2,$3,'PENDING')`,
        [user.id, businessName, businessType || 'RETAIL']
      );

      await logAudit(
        req.user!.userId,
        'MERCHANT_INVITE',
        'merchants',
        user.id,
        null,
        { email, businessName },
        req.ip || undefined,
        req.get('user-agent') || undefined
      );

    });

    res.status(201).json({
      message: 'Merchant invitation sent',
      tempCredentials: {
        email: email.toLowerCase(),
        tempPassword
      },
      magicLink: `/auth/magic?token=${magicToken}`
    });

  } catch (error: any) {

    console.error('Merchant invite error:', error);

    res.status(500).json({
      error: 'Failed to invite merchant'
    });

  }
});


/* =========================
   PENDING MERCHANTS
========================= */

router.get('/pending', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {

  try {

    const result = await query(
      `SELECT m.id,m.business_name,m.business_type,m.status,m.created_at,
              u.id as user_id,u.email,u.name,
              (SELECT COUNT(*) FROM merchant_documents WHERE merchant_id = m.id) as document_count
       FROM merchants m
       JOIN users u ON u.id = m.user_id
       WHERE m.status='PENDING'
       ORDER BY m.created_at ASC`
    );

    res.json({ merchants: result.rows });

  } catch (error: any) {

    console.error('Get pending merchants error:', error);

    res.status(500).json({
      error: 'Failed to get pending merchants'
    });

  }

});


/* =========================
   VERIFY MERCHANT
========================= */

router.put('/:merchantId/verify', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {

  try {

    const { merchantId } = req.params;
    const { approved, rejectionReason } = req.body;

    const status = approved ? 'VERIFIED' : 'REJECTED';

    const oldData = await query(
      'SELECT status FROM merchants WHERE id = $1',
      [merchantId]
    );

    await query(
      `UPDATE merchants SET
       status=$1,
       verified_at=CASE WHEN $1='VERIFIED' THEN CURRENT_TIMESTAMP ELSE NULL END,
       verified_by=$2,
       rejection_reason=$3,
       updated_at=CURRENT_TIMESTAMP
       WHERE id=$4`,
      [status, req.user!.userId, approved ? null : rejectionReason, merchantId]
    );

    await logAudit(
      req.user!.userId,
      approved ? 'MERCHANT_VERIFY' : 'MERCHANT_REJECT',
      'merchants',
      merchantId,
      oldData.rows[0],
      { status, rejectionReason },
      req.ip || undefined,
      req.get('user-agent') || undefined
    );

    res.json({
      message: `Merchant ${approved ? 'verified' : 'rejected'} successfully`
    });

  } catch (error: any) {

    console.error('Verify merchant error:', error);

    res.status(500).json({
      error: 'Failed to verify merchant'
    });

  }

});


/* =========================
   MERCHANT DASHBOARD
========================= */

router.get('/dashboard', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {

  try {

    const merchantResult = await query(
      `SELECT m.id,m.business_name,m.status,m.rating,m.total_reviews,m.created_at
       FROM merchants m
       WHERE m.user_id=$1`,
      [req.user!.userId]
    );

    if (merchantResult.rows.length === 0) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }

    const merchant = merchantResult.rows[0];

    const statsResult = await query(
      `SELECT
      (SELECT COUNT(*) FROM products WHERE merchant_id=$1 AND is_active=true) as active_products,
      (SELECT COUNT(*) FROM orders WHERE merchant_id=$1 AND status='PENDING') as pending_orders,
      (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE merchant_id=$1 AND status='DELIVERED' AND created_at > CURRENT_DATE - INTERVAL '30 days') as monthly_revenue,
      (SELECT COUNT(*) FROM stores WHERE merchant_id=$1 AND is_active=true) as active_stores`,
      [merchant.id]
    );

    res.json({
      merchant,
      stats: statsResult.rows[0]
    });

  } catch (error: any) {

    console.error('Get merchant dashboard error:', error);

    res.status(500).json({
      error: 'Failed to get dashboard data'
    });

  }

});


/* =========================
   ALL MERCHANTS
========================= */

router.get('/all', authMiddleware, roleMiddleware('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {

  try {

    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');

    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      whereClause += ` AND m.status=$${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (m.business_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM merchants m JOIN users u ON u.id=m.user_id WHERE ${whereClause}`,
      params
    );

    params.push(limit, offset);

    const result = await query(
      `SELECT m.id,m.business_name,m.business_type,m.status,m.rating,m.total_reviews,m.created_at,
              u.id as user_id,u.email,u.name,u.phone,
              (SELECT COUNT(*) FROM products WHERE merchant_id=m.id) as product_count,
              (SELECT COUNT(*) FROM stores WHERE merchant_id=m.id) as store_count
       FROM merchants m
       JOIN users u ON u.id=m.user_id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      merchants: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    });

  } catch (error: any) {

    console.error('Get all merchants error:', error);

    res.status(500).json({
      error: 'Failed to get merchants'
    });

  }

});

export default router;