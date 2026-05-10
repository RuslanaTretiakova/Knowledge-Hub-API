import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { loadRagSettings } from './rag-settings';

export type RagChatMessage = { role: 'user' | 'assistant'; text: string };

@Injectable()
export class RagConversationStore {
  private readonly sessions = new Map<string, { messages: RagChatMessage[] }>();
  private readonly maxMessages: number;

  constructor() {
    this.maxMessages = loadRagSettings().conversationMaxMessages;
  }

  getOrCreate(conversationId: string | undefined): {
    conversationId: string;
    history: RagChatMessage[];
  } {
    const id = conversationId?.trim() || uuidv4();
    let row = this.sessions.get(id);
    if (!row) {
      row = { messages: [] };
      this.sessions.set(id, row);
    }
    return { conversationId: id, history: [...row.messages] };
  }

  append(conversationId: string, role: 'user' | 'assistant', text: string) {
    let row = this.sessions.get(conversationId);
    if (!row) {
      row = { messages: [] };
      this.sessions.set(conversationId, row);
    }
    row.messages.push({ role, text });
    if (row.messages.length > this.maxMessages) {
      row.messages = row.messages.slice(-this.maxMessages);
    }
  }

  getHistory(conversationId: string): RagChatMessage[] | undefined {
    const row = this.sessions.get(conversationId);
    if (!row) return undefined;
    return [...row.messages];
  }
}
