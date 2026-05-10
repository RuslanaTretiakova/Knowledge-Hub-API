import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { RagController } from './rag.controller';
import { QdrantService } from './qdrant.service';
import { RagIndexingService } from './rag-indexing.service';
import { RagRetrievalService } from './rag-retrieval.service';

@Module({
  imports: [AiModule],
  controllers: [RagController],
  providers: [QdrantService, RagIndexingService, RagRetrievalService],
})
export class RagModule {}
