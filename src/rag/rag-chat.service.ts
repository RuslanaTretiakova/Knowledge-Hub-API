import { Injectable } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import {
  RagRetrievalService,
  type RagSearchHit,
} from './rag-retrieval.service';
import { RagConversationStore } from './rag-conversation.store';

@Injectable()
export class RagChatService {
  private static readonly CONTEXT_CHUNKS = 5;

  constructor(
    private readonly gemini: GeminiService,
    private readonly retrieval: RagRetrievalService,
    private readonly conversations: RagConversationStore,
  ) {}

  async chat(params: { question: string; conversationId?: string }): Promise<{
    answer: string;
    sources: {
      articleId: string;
      articleTitle: string;
      relevantChunk: string;
    }[];
    conversationId: string;
  }> {
    const { conversationId, history } = this.conversations.getOrCreate(
      params.conversationId,
    );

    const hits = await this.retrieval.retrieveForChat({
      question: params.question,
      limit: RagChatService.CONTEXT_CHUNKS,
    });

    const prompt = this.buildPrompt(history, hits, params.question);
    const { text } = await this.gemini.generateText(prompt);

    this.conversations.append(conversationId, 'user', params.question);
    this.conversations.append(conversationId, 'assistant', text);

    const sources = hits.map((h) => ({
      articleId: h.articleId,
      articleTitle: h.articleTitle,
      relevantChunk: h.chunk,
    }));

    return {
      answer: text,
      sources,
      conversationId,
    };
  }

  private buildPrompt(
    history: { role: 'user' | 'assistant'; text: string }[],
    hits: RagSearchHit[],
    question: string,
  ): string {
    const contextBlocks = hits
      .map(
        (h, i) =>
          `[${i + 1}] Title: ${h.articleTitle}\nArticleId: ${h.articleId}\n${h.chunk}`,
      )
      .join('\n\n');

    const historyLines = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    return `You answer questions using only the CONTEXT below. If the answer is not contained in the context, say that you do not have enough information in the knowledge base. Cite chunk numbers in parentheses when you use them.

CONTEXT:
${contextBlocks}

${historyLines ? `PRIOR TURNS:\n${historyLines}\n\n` : ''}QUESTION: ${question}`;
  }
}
