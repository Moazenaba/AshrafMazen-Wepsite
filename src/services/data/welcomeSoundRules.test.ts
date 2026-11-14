import { describe, expect, it } from 'vitest';
import { cleanWelcomeSound, parseWelcomeSound, shouldWelcome, validateWelcomeSound, isShortWelcome, MAX_WELCOME_SECONDS, welcomeTooLongMessage } from './welcomeSoundRules';

const on = { enabled: true, url: 'https://cdn.example/welcome.mp3', volume: 30 };

describe('welcome sound rules', () => {
  it('keeps the volume between 5 and 100, 30 by default', () => {
    expect(cleanWelcomeSound({ volume: 300 }).volume).toBe(100);
    expect(cleanWelcomeSound({ volume: 0 }).volume).toBe(5);
    expect(cleanWelcomeSound({}).volume).toBe(30);
  });

  it('reads a broken setting as switched off', () => {
    expect(parseWelcomeSound('{oops').enabled).toBe(false);
    expect(parseWelcomeSound(null).enabled).toBe(false);
    expect(parseWelcomeSound(JSON.stringify(on))).toEqual(on);
  });

  it('needs a file before it can be switched on', () => {
    expect(validateWelcomeSound({ ...on, url: '' })).toBeTruthy();
    expect(validateWelcomeSound({ ...on, url: 'http://x/a.mp3' })).toBeTruthy();
    expect(validateWelcomeSound({ ...on, url: '/api/r2?file=audio/a.mp3' })).toBeNull();
    expect(validateWelcomeSound({ ...on, enabled: false, url: '' })).toBeNull();
  });

  it('plays once per visit, never where the visitor came to play something', () => {
    expect(shouldWelcome(on, false, '/', '/')).toBe(true);
    expect(shouldWelcome(on, true, '/', '/')).toBe(false);
    expect(shouldWelcome({ ...on, enabled: false }, false, '/', '/')).toBe(false);
    expect(shouldWelcome(on, false, '/lesson/1', '/')).toBe(false);
    expect(shouldWelcome(on, false, '/', '/video/abcdefghijk')).toBe(false);
    expect(shouldWelcome(on, false, '/', '/admin')).toBe(false);
    expect(shouldWelcome(on, false, '/', '/videos')).toBe(true);
  });

  it('accepts only a short greeting, never a lesson recording', () => {
    expect(isShortWelcome(8)).toBe(true);
    expect(isShortWelcome(MAX_WELCOME_SECONDS)).toBe(true);
    expect(isShortWelcome(31)).toBe(false);
    expect(isShortWelcome(1380)).toBe(false);
    expect(isShortWelcome(NaN)).toBe(false);
    expect(isShortWelcome(Infinity)).toBe(false);
    expect(welcomeTooLongMessage(1380)).toContain('23 دقيقة');
    expect(welcomeTooLongMessage(45)).toContain('45 ثانية');
  });
});
