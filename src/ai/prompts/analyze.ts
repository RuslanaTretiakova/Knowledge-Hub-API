export type AnalyzeTask = 'review' | 'bugs' | 'optimize' | 'explain';

const taskHints: Record<AnalyzeTask, string> = {
  review:
    'General editorial review: clarity, structure, missing context, tone.',
  bugs: 'Focus on factual inconsistencies, contradictions, ambiguous statements, and risky claims.',
  optimize:
    'Suggest concrete improvements for readability, scannability, and information hierarchy.',
  explain:
    'Explain the article to a competent reader who is new to the topic; note prerequisites.',
};

export function buildAnalyzePrompt(params: {
  title: string;
  content: string;
  task: AnalyzeTask;
}): string {
  return [
    'Review the internal documentation below.',
    `Focus: ${taskHints[params.task]}`,
    '',
    'Respond with a single JSON object only (no markdown fences). Fields:',
    '- "analysis": string (main narrative)',
    '- "suggestions": string[] (short bullets)',
    '- "severity": one of "info", "warning", "error" (use "error" only for likely factual/legal/safety issues)',
    '',
    `Title: ${params.title}`,
    '',
    'Article body:',
    params.content,
  ].join('\n');
}
