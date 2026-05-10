export interface RagSettings {
  chunkSize: number;
  chunkOverlap: number;
  vectorDbUrl: string;
  vectorCollection: string;
  vectorDbProvider: string;
  conversationMaxMessages: number;
}

export function loadRagSettings(): RagSettings {
  const chunkSize = Math.max(
    1,
    parseInt(process.env.RAG_CHUNK_SIZE ?? '800', 10),
  );
  const chunkOverlap = Math.max(
    0,
    parseInt(process.env.RAG_CHUNK_OVERLAP ?? '200', 10),
  );
  if (chunkOverlap >= chunkSize) {
    throw new Error(
      'RAG_CHUNK_OVERLAP must be less than RAG_CHUNK_SIZE',
    );
  }

  return {
    chunkSize,
    chunkOverlap,
    vectorDbUrl: process.env.RAG_VECTOR_DB_URL ?? 'http://localhost:6333',
    vectorCollection:
      process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles',
    vectorDbProvider: process.env.RAG_VECTOR_DB_PROVIDER ?? 'qdrant',
    conversationMaxMessages: Math.max(
      1,
      parseInt(process.env.RAG_CONVERSATION_MAX_MESSAGES ?? '20', 10),
    ),
  };
}
