import { Request, Response } from "express";
import { pool } from "../db/postgres";
import { predictCycle } from "../services/cyclePrediction";

export const getPrediction = async (req: Request, res: Response) => {

  try {

    const user = (req as any).user;

    const result = await pool.query(
      `SELECT cycle_length
       FROM cycles
       WHERE user_id=$1
       ORDER BY start_date DESC
       LIMIT 6`,
      [user.id]
    );

    const cycles = result.rows.map(r => r.cycle_length);

    const prediction = predictCycle(cycles);

    const fertileStart = prediction.ovulation_day - 3;
    const fertileEnd = prediction.ovulation_day + 3;

    res.json({
      cycle_length: prediction.cycle_length,
      ovulation_day: prediction.ovulation_day,
      fertile_window: [fertileStart, fertileEnd]
    });

  } catch (err) {

    console.error("PREDICTION ERROR:", err);
    res.status(500).json({ error: "Prediction failed" });

  }

};