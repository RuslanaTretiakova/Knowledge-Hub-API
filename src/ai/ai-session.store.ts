import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { ChatTurn } from './prompts';

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_STORED_TURNS = 20;

@Injectable()
export class AiSessionStore {
  private readonly sessions = new Map<
    string,
    { turns: ChatTurn[]; expiresAt: number }
  >();

  private bump(row: { turns: ChatTurn[]; expiresAt: number }): void {
    row.expiresAt = Date.now() + SESSION_TTL_MS;
  }

  resolveSession(sessionId: string | undefined): {
    sessionId: string;
    history: ChatTurn[];
  } {
    if (sessionId) {
      const row = this.sessions.get(sessionId);
      if (row && Date.now() <= row.expiresAt) {
        this.bump(row);
        return { sessionId, history: [...row.turns] };
      }
      this.sessions.delete(sessionId);
    }
    return { sessionId: uuidv4(), history: [] };
  }

  appendTurns(sessionId: string, userText: string, modelText: string): void {
    let row = this.sessions.get(sessionId);
    if (!row || Date.now() > row.expiresAt) {
      row = { turns: [], expiresAt: Date.now() + SESSION_TTL_MS };
    }
    row.turns.push({ role: 'user', text: userText });
    row.turns.push({ role: 'model', text: modelText });
    if (row.turns.length > MAX_STORED_TURNS) {
      row.turns = row.turns.slice(-MAX_STORED_TURNS);
    }
    this.bump(row);
    this.sessions.set(sessionId, row);
  }
}
