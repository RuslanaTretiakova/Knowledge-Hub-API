import { describe, it, expect } from 'vitest';
import {
  normalizeAnalyzeResponse,
  normalizeTranslateResponse,
} from '../../ai/ai-response-parse';

describe('normalizeAnalyzeResponse', () => {
  it('parses valid JSON', () => {
    const raw = JSON.stringify({
      analysis: 'Looks fine.',
      suggestions: ['Add examples'],
      severity: 'warning',
    });
    const r = normalizeAnalyzeResponse(raw);
    expect(r.analysis).toBe('Looks fine.');
    expect(r.suggestions).toEqual(['Add examples']);
    expect(r.severity).toBe('warning');
  });

  it('accepts fenced JSON', () => {
    const raw =
      '```json\n{"analysis":"x","suggestions":[],"severity":"info"}\n```';
    const r = normalizeAnalyzeResponse(raw);
    expect(r.analysis).toBe('x');
    expect(r.severity).toBe('info');
  });

  it('falls back when JSON invalid', () => {
    const r = normalizeAnalyzeResponse('plain prose only');
    expect(r.analysis).toContain('plain prose');
    expect(r.suggestions).toEqual([]);
    expect(r.severity).toBe('info');
  });

  it('rejects invalid severity', () => {
    const raw = JSON.stringify({
      analysis: 'a',
      suggestions: [],
      severity: 'critical',
    });
    const r = normalizeAnalyzeResponse(raw);
    expect(r.severity).toBe('info');
  });
});

describe('normalizeTranslateResponse', () => {
  it('merges title and body', () => {
    const raw = JSON.stringify({
      translatedTitle: 'T',
      translatedBody: 'B',
      detectedLanguage: 'pl',
    });
    const r = normalizeTranslateResponse(raw, 'x', 'y');
    expect(r.translatedText).toBe('T\n\nB');
    expect(r.detectedLanguage).toBe('pl');
  });

  it('falls back when JSON missing', () => {
    const r = normalizeTranslateResponse('only text', 'src', 'body');
    expect(r.translatedText).toBe('only text');
    expect(r.detectedLanguage).toBe('unknown');
  });
});
