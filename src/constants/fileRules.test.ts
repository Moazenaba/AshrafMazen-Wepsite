import { describe, expect, it } from 'vitest';
import { acceptOf, checkFile, describeRule } from './fileRules';

describe('checkFile', () => {
  it('accepts a valid file', () => {
    expect(checkFile('audio', 'lesson.mp3', 1000)).toBeNull();
  });

  it('refuses a wrong extension and names it', () => {
    expect(checkFile('pdf', 'book.exe', 10)).toContain('.exe');
  });

  it('refuses a file without an extension', () => {
    expect(checkFile('cover', 'picture', 10)).toContain('بدون امتداد');
  });

  it('refuses an oversize file and names the limit', () => {
    expect(checkFile('logo', 'a.png', 3 * 1024 * 1024)).toContain('2');
  });

  it('treats the extension case-insensitively', () => {
    expect(checkFile('cover', 'A.JPG', 10)).toBeNull();
  });

  it('refuses an unknown kind', () => {
    expect(checkFile('nope' as never, 'a.mp3', 1)).not.toBeNull();
  });
});

describe('acceptOf and describeRule', () => {
  it('lists all six audio extensions', () => {
    expect(acceptOf('audio').split(',')).toEqual(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.opus']);
  });

  it('describes the logo rule without SVG', () => {
    expect(describeRule('logo')).toContain('2');
    expect(describeRule('logo')).not.toContain('svg');
  });
});
