import { Request, Response } from "express";
import { pool } from "../db/postgres";

export const getConversations = async (req: Request, res: Response) => {

  const user = (req as any).user;

  const result = await pool.query(
    `SELECT id, created_at
     FROM conversations
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [user.id]
  );

  res.json(result.rows);
};

export const getMessages = async (req: Request, res: Response) => {

  const { id } = req.params;

  const result = await pool.query(
    `SELECT role, content, created_at
     FROM messages
     WHERE conversation_id=$1
     ORDER BY created_at ASC`,
    [id]
  );

  res.json(result.rows);
};