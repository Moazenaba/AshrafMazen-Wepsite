import { describe, expect, it } from 'vitest';
import { namedTitle } from './pageMeta';

describe('namedTitle', () => {
  it("adds the site's name to a title that has not got it", () => {
    expect(namedTitle('شرح الواسطية')).toBe('شرح الواسطية - الشيخ أشرف مازن');
  });
  it("leaves a title that already names the sheikh", () => {
    expect(namedTitle('خطبة الجمعة # الشيخ أشرف مازن')).toBe('خطبة الجمعة # الشيخ أشرف مازن');
  });
});
