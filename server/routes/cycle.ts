import { Router, Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM cycle_history WHERE user_id = $1 ORDER BY start_date DESC`,
      [req.user!.userId]
    );
    res.json({ cycles: result.rows });
  } catch (error: any) {
    console.error('Get cycle history error:', error);
    res.status(500).json({ error: 'Failed to get cycle history' });
  }
});

router.post('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, cycle_length, period_length, notes } = req.body;

    if (!start_date) {
      res.status(400).json({ error: 'start_date is required' });
      return;
    }

    const result = await query(
      `INSERT INTO cycle_history (user_id, start_date, end_date, cycle_length, period_length, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user!.userId, start_date, end_date || null, cycle_length || null, period_length || null, notes || null]
    );

    res.status(201).json({ cycle: result.rows[0] });
  } catch (error: any) {
    console.error('Add cycle history error:', error);
    res.status(500).json({ error: 'Failed to add cycle history' });
  }
});

router.delete('/history/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM cycle_history WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Cycle history entry not found' });
      return;
    }

    res.json({ message: 'Cycle history entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete cycle history error:', error);
    res.status(500).json({ error: 'Failed to delete cycle history entry' });
  }
});

router.get('/predictions', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM cycle_predictions WHERE user_id = $1 ORDER BY predicted_period_start ASC`,
      [req.user!.userId]
    );
    res.json({ predictions: result.rows });
  } catch (error: any) {
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

router.post('/predictions/generate', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cyclesResult = await query(
      `SELECT * FROM cycle_history WHERE user_id = $1 ORDER BY start_date ASC`,
      [req.user!.userId]
    );

    const cycles = cyclesResult.rows;
    const cycleCount = cycles.length;

    if (cycleCount < 2) {
      res.status(400).json({ error: 'Need at least 2 cycles for predictions' });
      return;
    }

    let totalWeight = 0;
    let weightedCycleLength = 0;
    let weightedPeriodLength = 0;
    const cycleLengths: number[] = [];

    for (let i = 0; i < cycles.length; i++) {
      const weight = Math.pow(1.5, i);
      totalWeight += weight;

      const cl = cycles[i].cycle_length || 28;
      const pl = cycles[i].period_length || 5;

      weightedCycleLength += cl * weight;
      weightedPeriodLength += pl * weight;
      cycleLengths.push(cl);
    }

    const avgCycleLength = Math.round(weightedCycleLength / totalWeight);
    const avgPeriodLength = Math.round(weightedPeriodLength / totalWeight);

    const mean = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const variance = cycleLengths.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / cycleLengths.length;
    const stddev = Math.sqrt(variance);

    let consistencyBonus = 0;
    if (stddev < 2) {
      consistencyBonus = 0.15;
    } else if (stddev < 3) {
      consistencyBonus = 0.10;
    } else if (stddev < 5) {
      consistencyBonus = 0.05;
    }

    const confidence = Math.min(0.95, 0.3 + (cycleCount * 0.08) + consistencyBonus);

    const lastCycle = cycles[cycles.length - 1];
    const anchor = new Date(lastCycle.start_date);

    const predictions: any[] = [];

    for (let i = 1; i <= 3; i++) {
      const predictedStart = new Date(anchor);
      predictedStart.setDate(predictedStart.getDate() + avgCycleLength * i);

      const predictedEnd = new Date(predictedStart);
      predictedEnd.setDate(predictedEnd.getDate() + avgPeriodLength);

      const ovulationDate = new Date(predictedStart);
      ovulationDate.setDate(ovulationDate.getDate() + Math.round(avgCycleLength / 2));

      const fertileStart = new Date(ovulationDate);
      fertileStart.setDate(fertileStart.getDate() - 5);

      const fertileEnd = new Date(ovulationDate);
      fertileEnd.setDate(fertileEnd.getDate() + 1);

      predictions.push({
        predicted_period_start: predictedStart.toISOString().split('T')[0],
        predicted_period_end: predictedEnd.toISOString().split('T')[0],
        predicted_ovulation: ovulationDate.toISOString().split('T')[0],
        fertile_window_start: fertileStart.toISOString().split('T')[0],
        fertile_window_end: fertileEnd.toISOString().split('T')[0],
      });
    }

    await query(`DELETE FROM cycle_predictions WHERE user_id = $1`, [req.user!.userId]);

    const insertedPredictions: any[] = [];
    for (const p of predictions) {
      const result = await query(
        `INSERT INTO cycle_predictions (user_id, predicted_period_start, predicted_period_end, predicted_ovulation, fertile_window_start, fertile_window_end, confidence, algorithm_version, based_on_cycles)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [req.user!.userId, p.predicted_period_start, p.predicted_period_end, p.predicted_ovulation, p.fertile_window_start, p.fertile_window_end, confidence, 'v1', cycleCount]
      );
      insertedPredictions.push(result.rows[0]);
    }

    res.json({ predictions: insertedPredictions, confidence, based_on_cycles: cycleCount });
  } catch (error: any) {
    console.error('Generate predictions error:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

router.get('/pregnancy', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM pregnancies WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [req.user!.userId]
    );
    res.json({ pregnancy: result.rows[0] || null });
  } catch (error: any) {
    console.error('Get pregnancy error:', error);
    res.status(500).json({ error: 'Failed to get pregnancy' });
  }
});

router.post('/pregnancy', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { due_date, last_period_date, conception_date, baby_name, notes } = req.body;

    if (!due_date) {
      res.status(400).json({ error: 'due_date is required' });
      return;
    }

    let start_date: string;
    if (last_period_date) {
      start_date = last_period_date;
    } else {
      const dueDate = new Date(due_date);
      dueDate.setDate(dueDate.getDate() - 280);
      start_date = dueDate.toISOString().split('T')[0];
    }

    const existing = await query(
      `SELECT id FROM pregnancies WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [req.user!.userId]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await query(
        `UPDATE pregnancies SET due_date = $1, last_period_date = $2, conception_date = $3, baby_name = $4, notes = $5, start_date = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [due_date, last_period_date || null, conception_date || null, baby_name || null, notes || null, start_date, existing.rows[0].id, req.user!.userId]
      );
    } else {
      result = await query(
        `INSERT INTO pregnancies (user_id, due_date, last_period_date, conception_date, start_date, baby_name, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user!.userId, due_date, last_period_date || null, conception_date || null, start_date, baby_name || null, notes || null]
      );
    }

    res.status(201).json({ pregnancy: result.rows[0] });
  } catch (error: any) {
    console.error('Create/update pregnancy error:', error);
    res.status(500).json({ error: 'Failed to save pregnancy' });
  }
});

router.put('/pregnancy/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { due_date, baby_name, notes, status, end_date } = req.body;

    const result = await query(
      `UPDATE pregnancies SET
        due_date = COALESCE($1, due_date),
        baby_name = COALESCE($2, baby_name),
        notes = COALESCE($3, notes),
        status = COALESCE($4, status),
        end_date = COALESCE($5, end_date),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [due_date || null, baby_name || null, notes || null, status || null, end_date || null, id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Pregnancy not found' });
      return;
    }

    res.json({ pregnancy: result.rows[0] });
  } catch (error: any) {
    console.error('Update pregnancy error:', error);
    res.status(500).json({ error: 'Failed to update pregnancy' });
  }
});

router.delete('/pregnancy/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE pregnancies SET status = 'ended', end_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Pregnancy not found' });
      return;
    }

    res.json({ pregnancy: result.rows[0] });
  } catch (error: any) {
    console.error('End pregnancy error:', error);
    res.status(500).json({ error: 'Failed to end pregnancy' });
  }
});

router.get('/postpartum', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM postpartum_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 30`,
      [req.user!.userId]
    );
    res.json({ logs: result.rows });
  } catch (error: any) {
    console.error('Get postpartum logs error:', error);
    res.status(500).json({ error: 'Failed to get postpartum logs' });
  }
});

router.post('/postpartum', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, bleeding_level, pain_level, mood, energy_level, notes, pregnancy_id } = req.body;

    if (!date) {
      res.status(400).json({ error: 'date is required' });
      return;
    }

    const result = await query(
      `INSERT INTO postpartum_logs (user_id, pregnancy_id, date, bleeding_level, pain_level, mood, energy_level, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, date) DO UPDATE SET
         pregnancy_id = COALESCE($2, postpartum_logs.pregnancy_id),
         bleeding_level = COALESCE($4, postpartum_logs.bleeding_level),
         pain_level = COALESCE($5, postpartum_logs.pain_level),
         mood = COALESCE($6, postpartum_logs.mood),
         energy_level = COALESCE($7, postpartum_logs.energy_level),
         notes = COALESCE($8, postpartum_logs.notes)
       RETURNING *`,
      [req.user!.userId, pregnancy_id || null, date, bleeding_level || null, pain_level || null, mood || null, energy_level || null, notes || null]
    );

    res.status(201).json({ log: result.rows[0] });
  } catch (error: any) {
    console.error('Create postpartum log error:', error);
    res.status(500).json({ error: 'Failed to create postpartum log' });
  }
});

router.get('/breastfeeding', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM breastfeeding_sessions WHERE user_id = $1 ORDER BY start_time DESC LIMIT 50`,
      [req.user!.userId]
    );
    res.json({ sessions: result.rows });
  } catch (error: any) {
    console.error('Get breastfeeding sessions error:', error);
    res.status(500).json({ error: 'Failed to get breastfeeding sessions' });
  }
});

router.post('/breastfeeding', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start_time, end_time, duration_minutes, side, notes } = req.body;

    if (!start_time) {
      res.status(400).json({ error: 'start_time is required' });
      return;
    }

    const result = await query(
      `INSERT INTO breastfeeding_sessions (user_id, start_time, end_time, duration_minutes, side, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user!.userId, start_time, end_time || null, duration_minutes || null, side || null, notes || null]
    );

    res.status(201).json({ session: result.rows[0] });
  } catch (error: any) {
    console.error('Create breastfeeding session error:', error);
    res.status(500).json({ error: 'Failed to create breastfeeding session' });
  }
});

router.delete('/breastfeeding/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM breastfeeding_sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Breastfeeding session not found' });
      return;
    }

    res.json({ message: 'Breastfeeding session deleted successfully' });
  } catch (error: any) {
    console.error('Delete breastfeeding session error:', error);
    res.status(500).json({ error: 'Failed to delete breastfeeding session' });
  }
});

export default router;
