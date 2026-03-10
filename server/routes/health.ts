import { Router, Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/records', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, from, to, limit = '100', offset = '0' } = req.query;

    let whereClause = 'user_id = $1';
    const params: any[] = [req.user!.userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND record_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (from) {
      whereClause += ` AND recorded_at >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }

    if (to) {
      whereClause += ` AND recorded_at <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM health_records WHERE ${whereClause}`,
      params
    );

    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(
      `SELECT * FROM health_records
       WHERE ${whereClause}
       ORDER BY recorded_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    console.error('Get health records error:', error);
    res.status(500).json({ error: 'Failed to get health records' });
  }
});

router.post('/records', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'Records array is required' });
      return;
    }

    const createdRecords: any[] = [];

    for (const record of records) {
      const { record_type, value, unit, source, recorded_at, metadata } = record;

      if (!record_type || value === undefined || !unit || !recorded_at) {
        res.status(400).json({ error: 'Each record requires record_type, value, unit, and recorded_at' });
        return;
      }

      const result = await query(
        `INSERT INTO health_records (user_id, record_type, value, unit, source, recorded_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user!.userId, record_type, value, unit, source || 'manual', recorded_at, metadata ? JSON.stringify(metadata) : null]
      );

      createdRecords.push(result.rows[0]);
    }

    res.status(201).json({ records: createdRecords });
  } catch (error: any) {
    console.error('Create health records error:', error);
    res.status(500).json({ error: 'Failed to create health records' });
  }
});

router.delete('/records/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM health_records WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('Delete health record error:', error);
    res.status(500).json({ error: 'Failed to delete health record' });
  }
});

router.get('/summary', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { from = sevenDaysAgo.toISOString(), to = now.toISOString() } = req.query;

    const aggregates = await query(
      `SELECT
        record_type,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as count
       FROM health_records
       WHERE user_id = $1 AND recorded_at >= $2 AND recorded_at <= $3
       GROUP BY record_type`,
      [req.user!.userId, from, to]
    );

    const stepsResult = await query(
      `SELECT COALESCE(SUM(value), 0) as total_steps
       FROM health_records
       WHERE user_id = $1 AND record_type = 'steps' AND recorded_at >= $2 AND recorded_at <= $3`,
      [req.user!.userId, from, to]
    );

    const sleepResult = await query(
      `SELECT COALESCE(AVG(value), 0) as avg_sleep_hours
       FROM health_records
       WHERE user_id = $1 AND record_type = 'sleep' AND recorded_at >= $2 AND recorded_at <= $3`,
      [req.user!.userId, from, to]
    );

    const heartRateResult = await query(
      `SELECT COALESCE(AVG(value), 0) as avg_heart_rate
       FROM health_records
       WHERE user_id = $1 AND record_type = 'heart_rate' AND recorded_at >= $2 AND recorded_at <= $3`,
      [req.user!.userId, from, to]
    );

    res.json({
      aggregates: aggregates.rows,
      total_steps: parseFloat(stepsResult.rows[0].total_steps),
      avg_sleep_hours: parseFloat(sleepResult.rows[0].avg_sleep_hours),
      avg_heart_rate: parseFloat(heartRateResult.rows[0].avg_heart_rate),
      from,
      to
    });
  } catch (error: any) {
    console.error('Get health summary error:', error);
    res.status(500).json({ error: 'Failed to get health summary' });
  }
});

router.get('/connections', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, user_id, provider, is_connected, last_sync_at, sync_settings, token_expires_at, created_at, updated_at
       FROM health_connections
       WHERE user_id = $1`,
      [req.user!.userId]
    );

    res.json({ connections: result.rows });
  } catch (error: any) {
    console.error('Get health connections error:', error);
    res.status(500).json({ error: 'Failed to get health connections' });
  }
});

router.post('/connections', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { provider, is_connected, sync_settings } = req.body;

    if (!provider) {
      res.status(400).json({ error: 'Provider is required' });
      return;
    }

    const result = await query(
      `INSERT INTO health_connections (user_id, provider, is_connected, sync_settings)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         is_connected = COALESCE($3, health_connections.is_connected),
         sync_settings = COALESCE($4, health_connections.sync_settings),
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, provider, is_connected, last_sync_at, sync_settings, token_expires_at, created_at, updated_at`,
      [req.user!.userId, provider, is_connected ?? false, sync_settings ? JSON.stringify(sync_settings) : null]
    );

    res.status(201).json({ connection: result.rows[0] });
  } catch (error: any) {
    console.error('Create/update health connection error:', error);
    res.status(500).json({ error: 'Failed to save health connection' });
  }
});

router.delete('/connections/:provider', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;

    const result = await query(
      `DELETE FROM health_connections WHERE user_id = $1 AND provider = $2 RETURNING id`,
      [req.user!.userId, provider]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    res.json({ message: 'Connection removed successfully' });
  } catch (error: any) {
    console.error('Delete health connection error:', error);
    res.status(500).json({ error: 'Failed to delete health connection' });
  }
});

export default router;
