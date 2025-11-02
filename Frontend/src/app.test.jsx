import { describe, it, expect } from 'vitest';
import { createTranslator } from './i18n';

describe('i18n translator', () => {
  it('falls back to English for RU', () => {
    const tRu = createTranslator('ru');
    const tEn = createTranslator('en');
    expect(tRu('nav_home')).toBe(tEn('nav_home'));
  });
});

