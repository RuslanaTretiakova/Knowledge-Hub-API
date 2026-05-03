function tryParseJsonObject(raw: string): Record<string, unknown> | null {
  const t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const inner = fence ? fence[1].trim() : t;
  try {
    const v = JSON.parse(inner);
    return v && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

const severities = new Set(['info', 'warning', 'error']);

export function normalizeAnalyzeResponse(modelText: string): {
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
} {
  const parsed = tryParseJsonObject(modelText);
  if (!parsed) {
    const text = modelText.trim();
    return {
      analysis: text.length ? text : 'No analysis returned.',
      suggestions: [],
      severity: 'info',
    };
  }

  const analysisRaw = parsed.analysis;
  const analysis =
    typeof analysisRaw === 'string' && analysisRaw.trim().length
      ? analysisRaw
      : 'No analysis returned.';

  let suggestions: string[] = [];
  if (Array.isArray(parsed.suggestions)) {
    suggestions = parsed.suggestions
      .map((s) => (typeof s === 'string' ? s : String(s)))
      .filter((s) => s.length > 0);
  }

  let severity: 'info' | 'warning' | 'error' = 'info';
  const s = parsed.severity;
  if (typeof s === 'string' && severities.has(s)) {
    severity = s as 'info' | 'warning' | 'error';
  }

  return { analysis, suggestions, severity };
}

export function normalizeTranslateResponse(
  modelText: string,
  sourceTitle: string,
  sourceContent: string,
): { translatedText: string; detectedLanguage: string } {
  const parsed = tryParseJsonObject(modelText);
  if (!parsed) {
    const text = modelText.trim();
    return {
      translatedText: text.length ? text : `${sourceTitle}\n\n${sourceContent}`,
      detectedLanguage: 'unknown',
    };
  }

  const title =
    typeof parsed.translatedTitle === 'string' ? parsed.translatedTitle : '';
  const body =
    typeof parsed.translatedBody === 'string' ? parsed.translatedBody : '';
  const detectedLanguage =
    typeof parsed.detectedLanguage === 'string' && parsed.detectedLanguage
      ? parsed.detectedLanguage
      : 'unknown';

  const translatedText = [title, body].filter((x) => x.length > 0).join('\n\n');
  if (!translatedText) {
    return {
      translatedText: modelText.trim().length
        ? modelText.trim()
        : `${sourceTitle}\n\n${sourceContent}`,
      detectedLanguage,
    };
  }
  return { translatedText, detectedLanguage };
}
