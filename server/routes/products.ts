import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../db/connection';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

router.get('/categories', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, name, name_fr, name_rw, slug, description, icon, parent_id, cycle_phase, display_order
       FROM product_categories
       WHERE is_active = true
       ORDER BY display_order ASC`
    );
    
    res.json({ categories: result.rows });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, cyclePhase, search, merchantId, featured, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 'p.is_active = true AND m.status = $1';
    const params: any[] = ['VERIFIED'];
    let paramIndex = 2;
    
    if (category) {
      whereClause += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (cyclePhase) {
      whereClause += ` AND (p.cycle_phase = $${paramIndex} OR p.cycle_phase IS NULL)`;
      params.push(cyclePhase);
      paramIndex++;
    }
    
    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (merchantId) {
      whereClause += ` AND p.merchant_id = $${paramIndex}`;
      params.push(merchantId);
      paramIndex++;
    }
    
    if (featured === 'true') {
      whereClause += ' AND p.is_featured = true';
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       LEFT JOIN product_categories c ON c.id = p.category_id
       WHERE ${whereClause}`,
      params
    );
    
    params.push(parseInt(limit as string), offset);
    
    const result = await query(
      `SELECT p.id, p.name, p.name_fr, p.name_rw, p.description, p.price, p.compare_at_price,
              p.currency, p.image_url, p.cycle_phase, p.is_featured, p.created_at,
              m.id as merchant_id, m.business_name,
              c.name as category_name, c.slug as category_slug,
              COALESCE(SUM(pi.quantity), 0) as total_stock
       FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       LEFT JOIN product_categories c ON c.id = p.category_id
       LEFT JOIN product_inventory pi ON pi.product_id = p.id
       WHERE ${whereClause}
       GROUP BY p.id, m.id, c.id
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

router.get('/:productId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    
    const result = await query(
      `SELECT p.*, 
              m.id as merchant_id, m.business_name, m.rating as merchant_rating,
              c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       LEFT JOIN product_categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [productId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    const inventoryResult = await query(
      `SELECT pi.*, s.name as store_name, s.city, s.district, s.latitude, s.longitude
       FROM product_inventory pi
       JOIN stores s ON s.id = pi.store_id
       WHERE pi.product_id = $1 AND s.is_active = true`,
      [productId]
    );
    
    const reviewsResult = await query(
      `SELECT r.*, u.name as reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 AND r.is_visible = true
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [productId]
    );
    
    res.json({
      product: result.rows[0],
      inventory: inventoryResult.rows,
      reviews: reviewsResult.rows
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

router.post('/', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantResult = await query(
      'SELECT id, status FROM merchants WHERE user_id = $1',
      [req.user!.userId]
    );
    
    if (merchantResult.rows.length === 0 || merchantResult.rows[0].status !== 'VERIFIED') {
      res.status(403).json({ error: 'Only verified merchants can add products' });
      return;
    }
    
    const merchantId = merchantResult.rows[0].id;
    const { name, nameFr, nameRw, description, descriptionFr, descriptionRw, categoryId, price, compareAtPrice, imageUrl, images, cyclePhase, tags, attributes } = req.body;
    
    if (!name || !price) {
      res.status(400).json({ error: 'Name and price are required' });
      return;
    }
    
    const result = await query(
      `INSERT INTO products (merchant_id, category_id, name, name_fr, name_rw, description, description_fr, description_rw, price, compare_at_price, image_url, images, cycle_phase, tags, attributes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [merchantId, categoryId, name, nameFr, nameRw, description, descriptionFr, descriptionRw, price, compareAtPrice, imageUrl, JSON.stringify(images || []), cyclePhase, JSON.stringify(tags || []), JSON.stringify(attributes || {})]
    );
    
    await logAudit(req.user!.userId, 'PRODUCT_CREATE', 'products', result.rows[0].id, null, result.rows[0], req.ip, req.get('user-agent'));
    
    res.status(201).json({ product: result.rows[0] });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:productId', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    
    const merchantResult = await query(
      'SELECT m.id FROM merchants m JOIN products p ON p.merchant_id = m.id WHERE m.user_id = $1 AND p.id = $2',
      [req.user!.userId, productId]
    );
    
    if (merchantResult.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized to edit this product' });
      return;
    }
    
    const { name, nameFr, nameRw, description, descriptionFr, descriptionRw, categoryId, price, compareAtPrice, imageUrl, images, cyclePhase, isActive, isFeatured, tags, attributes } = req.body;
    
    const oldProduct = await query('SELECT * FROM products WHERE id = $1', [productId]);
    
    const result = await query(
      `UPDATE products SET
        name = COALESCE($1, name),
        name_fr = COALESCE($2, name_fr),
        name_rw = COALESCE($3, name_rw),
        description = COALESCE($4, description),
        description_fr = COALESCE($5, description_fr),
        description_rw = COALESCE($6, description_rw),
        category_id = COALESCE($7, category_id),
        price = COALESCE($8, price),
        compare_at_price = COALESCE($9, compare_at_price),
        image_url = COALESCE($10, image_url),
        images = COALESCE($11, images),
        cycle_phase = COALESCE($12, cycle_phase),
        is_active = COALESCE($13, is_active),
        is_featured = COALESCE($14, is_featured),
        tags = COALESCE($15, tags),
        attributes = COALESCE($16, attributes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING *`,
      [name, nameFr, nameRw, description, descriptionFr, descriptionRw, categoryId, price, compareAtPrice, imageUrl, images ? JSON.stringify(images) : null, cyclePhase, isActive, isFeatured, tags ? JSON.stringify(tags) : null, attributes ? JSON.stringify(attributes) : null, productId]
    );
    
    await logAudit(req.user!.userId, 'PRODUCT_UPDATE', 'products', productId, oldProduct.rows[0], result.rows[0], req.ip, req.get('user-agent'));
    
    res.json({ product: result.rows[0] });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.put('/:productId/inventory', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { storeId, quantity, lowStockThreshold } = req.body;
    
    const merchantResult = await query(
      `SELECT m.id FROM merchants m 
       JOIN products p ON p.merchant_id = m.id
       JOIN stores s ON s.merchant_id = m.id
       WHERE m.user_id = $1 AND p.id = $2 AND s.id = $3`,
      [req.user!.userId, productId, storeId]
    );
    
    if (merchantResult.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized to update inventory' });
      return;
    }
    
    const result = await query(
      `INSERT INTO product_inventory (product_id, store_id, quantity, low_stock_threshold)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, store_id) DO UPDATE SET
         quantity = COALESCE($3, product_inventory.quantity),
         low_stock_threshold = COALESCE($4, product_inventory.low_stock_threshold),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [productId, storeId, quantity, lowStockThreshold]
    );
    
    res.json({ inventory: result.rows[0] });
  } catch (error: any) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

export default router;
