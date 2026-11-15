import { describe, expect, it } from 'vitest';
import { addressOf, createLimiter } from './_rateLimit';

describe('createLimiter', () => {
  it('allows max calls then refuses', () => {
    const allowed = createLimiter(2, 1000, () => 0);
    expect([allowed('a'), allowed('a'), allowed('a')]).toEqual([true, true, false]);
  });

  it('allows again after the window', () => {
    let t = 0;
    const allowed = createLimiter(1, 1000, () => t);
    expect(allowed('a')).toBe(true);
    expect(allowed('a')).toBe(false);
    t = 1001;
    expect(allowed('a')).toBe(true);
  });

  it('does not share a count between addresses', () => {
    const allowed = createLimiter(1, 1000, () => 0);
    expect(allowed('a')).toBe(true);
    expect(allowed('b')).toBe(true);
  });

  it('clears the map above 5000 keys, so an old address is allowed again', () => {
    const allowed = createLimiter(1, 1_000_000, () => 0);
    expect(allowed('first')).toBe(true);
    expect(allowed('first')).toBe(false);
    for (let i = 0; i < 5001; i++) allowed(`k${i}`);
    expect(allowed('first')).toBe(true);
  });
});

describe('addressOf', () => {
  it('takes the first forwarded address, else the socket, else unknown', () => {
    expect(addressOf({ headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })).toBe('1.2.3.4');
    expect(addressOf({ headers: {}, socket: { remoteAddress: '9.9.9.9' } })).toBe('9.9.9.9');
    expect(addressOf({})).toBe('unknown');
  });
});
