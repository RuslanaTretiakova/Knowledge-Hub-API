export type SummarizeLength = 'short' | 'medium' | 'detailed';

export function buildSummarizePrompt(params: {
  title: string;
  content: string;
  maxLength: SummarizeLength;
}): string {
  const lengthHint =
    params.maxLength === 'short'
      ? 'about 2–3 sentences'
      : params.maxLength === 'medium'
        ? 'one moderate paragraph (roughly 5–8 sentences)'
        : 'several paragraphs covering main ideas and implications';

  return [
    'Summarize the article below for readers who need the gist quickly.',
    `Length: ${lengthHint}. Use clear, neutral language.`,
    'Output only the summary text. Do not add a title line or bullets unless the source is list-heavy.',
    '',
    `Title: ${params.title}`,
    '',
    'Article body:',
    params.content,
  ].join('\n');
}
