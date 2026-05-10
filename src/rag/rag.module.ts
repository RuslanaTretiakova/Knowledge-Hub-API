import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { RagController } from './rag.controller';
import { QdrantService } from './qdrant.service';
import { RagIndexingService } from './rag-indexing.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { RagChatService } from './rag-chat.service';
import { RagConversationStore } from './rag-conversation.store';

@Module({
  imports: [AiModule],
  controllers: [RagController],
  providers: [
    QdrantService,
    RagIndexingService,
    RagRetrievalService,
    RagChatService,
    RagConversationStore,
  ],
})
export class RagModule {}
