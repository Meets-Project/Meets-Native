import { describe, expect, it } from 'vitest';
import { hasEnded, nowParts } from '../src/services/clock.js';

describe('Horário do Meets (Brasília) independente do fuso do servidor', () => {
  it('21:30 UTC são 18:30 em Brasília', () => {
    expect(nowParts('America/Sao_Paulo', new Date('2026-10-12T21:30:00Z'))).toEqual({ date: '2026-10-12', time: '18:30' });
  });

  it('o evento só termina no horário de Brasília', () => {
    const now = nowParts('America/Sao_Paulo', new Date('2026-10-12T21:30:00Z'));
    expect(hasEnded('2026-10-12', '19:00', now)).toBe(false);
    expect(hasEnded('2026-10-12', '18:30', now)).toBe(true);
    expect(hasEnded(new Date(2026, 9, 11), '23:00', now)).toBe(true);
    expect(hasEnded(null, '10:00', now)).toBe(false);
  });
});
