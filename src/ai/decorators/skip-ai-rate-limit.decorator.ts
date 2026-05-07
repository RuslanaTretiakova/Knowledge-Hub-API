import { SetMetadata } from '@nestjs/common';

export const SKIP_AI_RATE_LIMIT_KEY = 'skipAiRateLimit';

export const SkipAiRateLimit = () => SetMetadata(SKIP_AI_RATE_LIMIT_KEY, true);
