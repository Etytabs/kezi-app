import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../db/connection';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `JM${year}${month}${day}${random}`;
}

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, storeId, items, paymentMethod, deliveryAddress, deliveryNotes } = req.body;
    
    if (!merchantId || !items || items.length === 0) {
      res.status(400).json({ error: 'Merchant and items are required' });
      return;
    }
    
    const order = await transaction(async (client) => {
      let subtotal = 0;
      const orderItems: any[] = [];
      
      for (const item of items) {
        const productResult = await client.query(
          `SELECT p.id, p.name, p.price, pi.quantity as stock
           FROM products p
           LEFT JOIN product_inventory pi ON pi.product_id = p.id AND pi.store_id = $1
           WHERE p.id = $2 AND p.merchant_id = $3 AND p.is_active = true`,
          [storeId, item.productId, merchantId]
        );
        
        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.productId} not found or unavailable`);
        }
        
        const product = productResult.rows[0];
        
        if (product.stock !== null && product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        
        const itemTotal = parseFloat(product.price) * item.quantity;
        subtotal += itemTotal;
        
        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal,
          notes: item.notes
        });
        
        if (storeId) {
          await client.query(
            `UPDATE product_inventory SET
              quantity = quantity - $1,
              reserved_quantity = reserved_quantity + $1,
              updated_at = CURRENT_TIMESTAMP
             WHERE product_id = $2 AND store_id = $3`,
            [item.quantity, item.productId, storeId]
          );
        }
      }
      
      const deliveryFee = 0;
      const taxAmount = 0;
      const totalAmount = subtotal + deliveryFee + taxAmount;
      
      const orderResult = await client.query(
        `INSERT INTO orders (order_number, user_id, merchant_id, store_id, subtotal, delivery_fee, tax_amount, total_amount, payment_method, delivery_address, delivery_notes, delivery_latitude, delivery_longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          generateOrderNumber(),
          req.user!.userId,
          merchantId,
          storeId,
          subtotal,
          deliveryFee,
          taxAmount,
          totalAmount,
          paymentMethod || 'CASH_ON_DELIVERY',
          JSON.stringify(deliveryAddress || {}),
          deliveryNotes,
          deliveryAddress?.latitude,
          deliveryAddress?.longitude
        ]
      );
      
      const createdOrder = orderResult.rows[0];
      
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [createdOrder.id, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice, item.notes]
        );
      }
      
      return { ...createdOrder, items: orderItems };
    });
    
    await logAudit(req.user!.userId, 'ORDER_CREATE', 'orders', order.id, null, order, req.ip, req.get('user-agent'));
    
    res.status(201).json({ order });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

router.get('/my-orders', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 'o.user_id = $1';
    const params: any[] = [req.user!.userId];
    let paramIndex = 2;
    
    if (status && status !== 'all') {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o WHERE ${whereClause}`,
      params
    );
    
    params.push(parseInt(limit as string), offset);
    
    const result = await query(
      `SELECT o.*, m.business_name, s.name as store_name,
              (SELECT json_agg(json_build_object('id', oi.id, 'productName', oi.product_name, 'quantity', oi.quantity, 'unitPrice', oi.unit_price, 'totalPrice', oi.total_price))
               FROM order_items oi WHERE oi.order_id = o.id) as items
       FROM orders o
       JOIN merchants m ON m.id = o.merchant_id
       LEFT JOIN stores s ON s.id = o.store_id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get my orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

router.get('/merchant-orders', authMiddleware, roleMiddleware('MERCHANT'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantResult = await query(
      'SELECT id FROM merchants WHERE user_id = $1',
      [req.user!.userId]
    );
    
    if (merchantResult.rows.length === 0) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    
    const merchantId = merchantResult.rows[0].id;
    const { status, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 'o.merchant_id = $1';
    const params: any[] = [merchantId];
    let paramIndex = 2;
    
    if (status && status !== 'all') {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o WHERE ${whereClause}`,
      params
    );
    
    params.push(parseInt(limit as string), offset);
    
    const result = await query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone, s.name as store_name,
              (SELECT json_agg(json_build_object('id', oi.id, 'productName', oi.product_name, 'quantity', oi.quantity, 'unitPrice', oi.unit_price, 'totalPrice', oi.total_price))
               FROM order_items oi WHERE oi.order_id = o.id) as items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN stores s ON s.id = o.store_id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get merchant orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

router.put('/:orderId/status', authMiddleware, roleMiddleware('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    
    let authCheck;
    if (req.user!.role === 'MERCHANT') {
      authCheck = await query(
        `SELECT o.id FROM orders o
         JOIN merchants m ON m.id = o.merchant_id
         WHERE o.id = $1 AND m.user_id = $2`,
        [orderId, req.user!.userId]
      );
    } else {
      authCheck = await query('SELECT id FROM orders WHERE id = $1', [orderId]);
    }
    
    if (authCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized to update this order' });
      return;
    }
    
    const oldOrder = await query('SELECT status FROM orders WHERE id = $1', [orderId]);
    
    let updateQuery = `UPDATE orders SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP`;
    const params: any[] = [status, notes];
    
    if (status === 'DELIVERED') {
      updateQuery += `, delivered_at = CURRENT_TIMESTAMP`;
    } else if (status === 'CANCELLED') {
      updateQuery += `, cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = $3`;
      params.push(notes);
    }
    
    updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(orderId);
    
    const result = await query(updateQuery, params);
    
    if (status === 'CANCELLED') {
      const items = await query(
        `SELECT oi.product_id, oi.quantity, o.store_id
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.order_id = $1`,
        [orderId]
      );
      
      for (const item of items.rows) {
        if (item.store_id) {
          await query(
            `UPDATE product_inventory SET
              quantity = quantity + $1,
              reserved_quantity = reserved_quantity - $1,
              updated_at = CURRENT_TIMESTAMP
             WHERE product_id = $2 AND store_id = $3`,
            [item.quantity, item.product_id, item.store_id]
          );
        }
      }
    }
    
    await logAudit(req.user!.userId, 'ORDER_STATUS_UPDATE', 'orders', orderId, oldOrder.rows[0], { status }, req.ip, req.get('user-agent'));
    
    res.json({ order: result.rows[0] });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
