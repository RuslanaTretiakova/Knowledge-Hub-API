export type ChatTurn = { role: 'user' | 'model'; text: string };

export function buildGenericPrompt(
  userPrompt: string,
  history?: ChatTurn[],
): string {
  if (!history?.length) {
    return userPrompt;
  }

  const lines = [
    'Answer using only the prior turns as context. If the context is not enough, say so.',
    '',
  ];
  for (const turn of history) {
    const label = turn.role === 'user' ? 'User' : 'Model';
    lines.push(`${label}: ${turn.text}`, '');
  }
  lines.push(`User: ${userPrompt}`);
  return lines.join('\n');
}
