import { type Request, type Response } from 'express';

import { type ChatMessage, runAgentTurn } from '../services/agent/agent-service';

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === 'user' || candidate.role === 'model') && typeof candidate.text === 'string'
  );
}

/**
 * Handles a single assistant turn. The client sends the full display history so
 * the server stays stateless across requests.
 */
export async function handleAgentChat(req: Request, res: Response): Promise<void> {
  const { messages } = req.body as { messages?: unknown };

  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    res.status(400).json({ error: 'Body must be { messages: { role, text }[] }' });
    return;
  }

  if (messages.length === 0) {
    res.status(400).json({ error: 'messages must not be empty' });
    return;
  }

  try {
    const turn = await runAgentTurn(messages, req.userId!);
    res.json(turn);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
    res.status(status).json({ error: message });
  }
}
