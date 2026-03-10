import { Router, Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

router.get('/nearby', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, radius = '10', category, search, page = '1', limit = '20' } = req.query;
    
    if (!latitude || !longitude) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }
    
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string);
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 's.is_active = true AND m.status = $1';
    const params: any[] = ['VERIFIED'];
    let paramIndex = 2;
    
    if (search) {
      whereClause += ` AND (s.name ILIKE $${paramIndex} OR m.business_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    params.push(lat, lng, radiusKm);
    
    const result = await query(
      `SELECT s.id, s.name, s.description, s.phone, s.latitude, s.longitude,
              s.address_line1, s.city, s.district, s.sector, s.delivery_radius_km,
              m.id as merchant_id, m.business_name, m.business_type, m.rating,
              (6371 * acos(cos(radians($${paramIndex})) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(s.latitude)))) AS distance_km,
              (SELECT COUNT(*) FROM products p WHERE p.merchant_id = m.id AND p.is_active = true) as product_count
       FROM stores s
       JOIN merchants m ON m.id = s.merchant_id
       WHERE ${whereClause}
         AND (6371 * acos(cos(radians($${paramIndex})) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(s.latitude)))) <= $${paramIndex + 2}
       ORDER BY distance_km ASC
       LIMIT $${paramIndex + 3} OFFSET $${paramIndex + 4}`,
      [...params, parseInt(limit as string), offset]
    );
    
    res.json({
      stores: result.rows,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get nearby stores error:', error);
    res.status(500).json({ error: 'Failed to get stores' });
  }
});

router.get('/:storeId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;
    
    const result = await query(
      `SELECT s.*, m.id as merchant_id, m.business_name, m.business_type, m.rating, m.total_reviews
       FROM stores s
       JOIN merchants m ON m.id = s.merchant_id
       WHERE s.id = $1`,
      [storeId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    
    const productsResult = await query(
      `SELECT p.id, p.name, p.price, p.image_url, p.cycle_phase,
              COALESCE(pi.quantity, 0) as stock
       FROM products p
       LEFT JOIN product_inventory pi ON pi.product_id = p.id AND pi.store_id = $1
       WHERE p.merchant_id = $2 AND p.is_active = true
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT 50`,
      [storeId, result.rows[0].merchant_id]
    );
    
    res.json({
      store: result.rows[0],
      products: productsResult.rows
    });
  } catch (error: any) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to get store' });
  }
});

router.get('/merchant/my-stores', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantResult = await query(
      'SELECT id FROM merchants WHERE user_id = $1',
      [req.user!.userId]
    );
    
    if (merchantResult.rows.length === 0) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    
    const result = await query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM product_inventory pi WHERE pi.store_id = s.id) as products_count,
              (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id AND o.status = 'PENDING') as pending_orders
       FROM stores s
       WHERE s.merchant_id = $1
       ORDER BY s.created_at DESC`,
      [merchantResult.rows[0].id]
    );
    
    res.json({ stores: result.rows });
  } catch (error: any) {
    console.error('Get my stores error:', error);
    res.status(500).json({ error: 'Failed to get stores' });
  }
});

router.post('/', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantResult = await query(
      'SELECT id, status FROM merchants WHERE user_id = $1',
      [req.user!.userId]
    );
    
    if (merchantResult.rows.length === 0 || merchantResult.rows[0].status !== 'VERIFIED') {
      res.status(403).json({ error: 'Only verified merchants can add stores' });
      return;
    }
    
    const { name, description, phone, email, latitude, longitude, addressLine1, addressLine2, city, district, sector, cell, village, deliveryRadiusKm, openingHours } = req.body;
    
    if (!name || !latitude || !longitude) {
      res.status(400).json({ error: 'Name and location are required' });
      return;
    }
    
    const result = await query(
      `INSERT INTO stores (merchant_id, name, description, phone, email, latitude, longitude, address_line1, address_line2, city, district, sector, cell, village, delivery_radius_km, opening_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [merchantResult.rows[0].id, name, description, phone, email, latitude, longitude, addressLine1, addressLine2, city || 'Kigali', district, sector, cell, village, deliveryRadiusKm || 5, JSON.stringify(openingHours || {})]
    );
    
    await logAudit(req.user!.userId, 'STORE_CREATE', 'stores', result.rows[0].id, null, result.rows[0], req.ip, req.get('user-agent'));
    
    res.status(201).json({ store: result.rows[0] });
  } catch (error: any) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

router.put('/:storeId', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;
    
    const authCheck = await query(
      `SELECT s.id FROM stores s
       JOIN merchants m ON m.id = s.merchant_id
       WHERE s.id = $1 AND m.user_id = $2`,
      [storeId, req.user!.userId]
    );
    
    if (authCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized to edit this store' });
      return;
    }
    
    const { name, description, phone, email, latitude, longitude, addressLine1, addressLine2, city, district, sector, cell, village, deliveryRadiusKm, openingHours, isActive } = req.body;
    
    const oldStore = await query('SELECT * FROM stores WHERE id = $1', [storeId]);
    
    const result = await query(
      `UPDATE stores SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        latitude = COALESCE($5, latitude),
        longitude = COALESCE($6, longitude),
        address_line1 = COALESCE($7, address_line1),
        address_line2 = COALESCE($8, address_line2),
        city = COALESCE($9, city),
        district = COALESCE($10, district),
        sector = COALESCE($11, sector),
        cell = COALESCE($12, cell),
        village = COALESCE($13, village),
        delivery_radius_km = COALESCE($14, delivery_radius_km),
        opening_hours = COALESCE($15, opening_hours),
        is_active = COALESCE($16, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING *`,
      [name, description, phone, email, latitude, longitude, addressLine1, addressLine2, city, district, sector, cell, village, deliveryRadiusKm, openingHours ? JSON.stringify(openingHours) : null, isActive, storeId]
    );
    
    await logAudit(req.user!.userId, 'STORE_UPDATE', 'stores', storeId, oldStore.rows[0], result.rows[0], req.ip, req.get('user-agent'));
    
    res.json({ store: result.rows[0] });
  } catch (error: any) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

export default router;
