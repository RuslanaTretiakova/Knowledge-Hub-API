export function buildTranslatePrompt(params: {
  title: string;
  content: string;
  targetLanguage: string;
  sourceLanguage?: string;
}): string {
  const sourceLine = params.sourceLanguage
    ? `Assume the source language is ${params.sourceLanguage}.`
    : 'Detect the source language of the text.';

  return [
    'Translate the following knowledge-base article.',
    `Target language: ${params.targetLanguage}. Translate both title and body.`,
    sourceLine,
    'Preserve technical terms where standard in the target language.',
    '',
    'Respond with a single JSON object only, in this exact shape (no markdown fences):',
    '{"translatedTitle":"...","translatedBody":"...","detectedLanguage":"ISO-639-1 or name"}',
    '',
    'Source title:',
    params.title,
    '',
    'Source body:',
    params.content,
  ].join('\n');
}
