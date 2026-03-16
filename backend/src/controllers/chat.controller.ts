import { Request, Response } from "express";
import { pool } from "../db/postgres";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  });

  export const chat = async (req: Request, res: Response) => {
    try {

        const user = (req as any).user;
            const { message, conversation_id } = req.body;

                let conversationId = conversation_id;

                    // créer conversation si elle n'existe pas
                        if (!conversationId) {
                              const conv = await pool.query(
                                      "INSERT INTO conversations (user_id) VALUES ($1) RETURNING id",
                                              [user.id]
                                                    );

                                                          conversationId = conv.rows[0].id;
                                                              }

                                                                  // sauvegarder message utilisateur
                                                                      await pool.query(
                                                                            "INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)",
                                                                                  [conversationId, "user", message]
                                                                                      );

                                                                                          // récupérer les 20 derniers messages
                                                                                              const history = await pool.query(
                                                                                                    `SELECT role, content
                                                                                                           FROM messages
                                                                                                                  WHERE conversation_id=$1
                                                                                                                         ORDER BY created_at DESC
                                                                                                                                LIMIT 20`,
                                                                                                                                      [conversationId]
                                                                                                                                          );

                                                                                                                                              const messages = history.rows;

                                                                                                                                                  // message système
                                                                                                                                                      messages.unshift({
                                                                                                                                                            role: "system",
                                                                                                                                                                  content: `
                                                                                                                                                                  You are Kezi AI, a helpful assistant.
                                                                                                                                                                  Explain things clearly and simply.
                                                                                                                                                                  If the user asks technical questions, give structured answers.
                                                                                                                                                                  `
                                                                                                                                                                      });

                                                                                                                                                                          // appel OpenAI
                                                                                                                                                                              const completion = await openai.chat.completions.create({
                                                                                                                                                                                    model: "gpt-4.1-mini",
                                                                                                                                                                                          messages: messages,
                                                                                                                                                                                              });

                                                                                                                                                                                                  const reply = completion.choices[0].message.content;

                                                                                                                                                                                                      // sauvegarder réponse IA
                                                                                                                                                                                                          await pool.query(
                                                                                                                                                                                                                "INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)",
                                                                                                                                                                                                                      [conversationId, "assistant", reply]
                                                                                                                                                                                                                          );

                                                                                                                                                                                                                              res.json({
                                                                                                                                                                                                                                    conversation_id: conversationId,
                                                                                                                                                                                                                                          reply,
                                                                                                                                                                                                                                              });

                                                                                                                                                                                                                                                } catch (err) {

                                                                                                                                                                                                                                                    console.error("CHAT ERROR:", err);
                                                                                                                                                                                                                                                        res.status(500).json({ error: "Chat failed" });

                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                          };