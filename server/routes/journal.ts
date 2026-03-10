import { Router, Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest, authMiddleware, logAudit } from '../middleware/auth';
import { encryptField, decryptField } from '../services/encryption';

function decryptEntry(entry: any): any {
  if (!entry) return entry;
  try {
    if (entry.mood) entry.mood = decryptField(entry.mood);
    if (entry.symptoms && typeof entry.symptoms === 'string') {
      const decrypted = decryptField(entry.symptoms);
      try {
        entry.symptoms = JSON.parse(decrypted);
      } catch {
        entry.symptoms = decrypted;
      }
    }
    if (entry.notes) entry.notes = decryptField(entry.notes);
  } catch {
  }
  return entry;
}

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, page = '1', limit = '30' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 'user_id = $1';
    const params: any[] = [req.user!.userId];
    let paramIndex = 2;
    
    if (startDate) {
      whereClause += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM journal_entries WHERE ${whereClause}`,
      params
    );
    
    params.push(parseInt(limit as string), offset);
    
    const result = await query(
      `SELECT * FROM journal_entries
       WHERE ${whereClause}
       ORDER BY date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    const decryptedEntries = result.rows.map((entry: any) => decryptEntry(entry));

    res.json({
      entries: decryptedEntries,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Failed to get journal entries' });
  }
});

router.get('/:date', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    
    const result = await query(
      `SELECT * FROM journal_entries WHERE user_id = $1 AND date = $2`,
      [req.user!.userId, date]
    );
    
    if (result.rows.length === 0) {
      res.json({ entry: null });
      return;
    }
    
    res.json({ entry: decryptEntry(result.rows[0]) });
  } catch (error: any) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ error: 'Failed to get journal entry' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, mood, symptoms, notes, flowIntensity, temperature, weight, sleepHours, exerciseMinutes, waterIntake } = req.body;
    
    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }

    const encryptedMood = mood ? encryptField(mood) : mood;
    const encryptedSymptoms = symptoms ? encryptField(JSON.stringify(symptoms)) : JSON.stringify([]);
    const encryptedNotes = notes ? encryptField(notes) : notes;
    
    const result = await query(
      `INSERT INTO journal_entries (user_id, date, mood, symptoms, notes, flow_intensity, temperature, weight, sleep_hours, exercise_minutes, water_intake)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id, date) DO UPDATE SET
         mood = COALESCE($3, journal_entries.mood),
         symptoms = COALESCE($4, journal_entries.symptoms),
         notes = COALESCE($5, journal_entries.notes),
         flow_intensity = COALESCE($6, journal_entries.flow_intensity),
         temperature = COALESCE($7, journal_entries.temperature),
         weight = COALESCE($8, journal_entries.weight),
         sleep_hours = COALESCE($9, journal_entries.sleep_hours),
         exercise_minutes = COALESCE($10, journal_entries.exercise_minutes),
         water_intake = COALESCE($11, journal_entries.water_intake),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user!.userId, date, encryptedMood, encryptedSymptoms, encryptedNotes, flowIntensity, temperature, weight, sleepHours, exerciseMinutes, waterIntake]
    );
    
    res.status(201).json({ entry: decryptEntry(result.rows[0]) });
  } catch (error: any) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

router.delete('/:date', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    
    await query(
      `DELETE FROM journal_entries WHERE user_id = $1 AND date = $2`,
      [req.user!.userId, date]
    );
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

router.get('/analytics/summary', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { months = '3' } = req.query;
    
    const result = await query(
      `SELECT 
        COUNT(*) as total_entries,
        AVG(CASE WHEN mood = 'great' THEN 5 WHEN mood = 'good' THEN 4 WHEN mood = 'okay' THEN 3 WHEN mood = 'low' THEN 2 WHEN mood = 'bad' THEN 1 END) as avg_mood_score,
        AVG(sleep_hours) as avg_sleep_hours,
        AVG(exercise_minutes) as avg_exercise_minutes,
        AVG(water_intake) as avg_water_intake
       FROM journal_entries
       WHERE user_id = $1 AND date > CURRENT_DATE - INTERVAL '${parseInt(months as string)} months'`,
      [req.user!.userId]
    );
    
    const moodDistribution = await query(
      `SELECT mood, COUNT(*) as count
       FROM journal_entries
       WHERE user_id = $1 AND date > CURRENT_DATE - INTERVAL '${parseInt(months as string)} months' AND mood IS NOT NULL
       GROUP BY mood`,
      [req.user!.userId]
    );
    
    const symptomFrequency = await query(
      `SELECT symptom, COUNT(*) as count
       FROM journal_entries, jsonb_array_elements_text(symptoms) as symptom
       WHERE user_id = $1 AND date > CURRENT_DATE - INTERVAL '${parseInt(months as string)} months'
       GROUP BY symptom
       ORDER BY count DESC
       LIMIT 10`,
      [req.user!.userId]
    );
    
    res.json({
      summary: result.rows[0],
      moodDistribution: moodDistribution.rows,
      symptomFrequency: symptomFrequency.rows
    });
  } catch (error: any) {
    console.error('Get journal analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;
