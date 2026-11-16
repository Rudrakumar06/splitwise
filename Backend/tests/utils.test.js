const { csvCell, csvRow, sniffImageType } = require('../utils/api');

describe('csvCell()', () => {
  it('wraps plain values in quotes', () => {
    expect(csvCell('hello')).toBe('"hello"');
  });

  it('escapes embedded quotes by doubling them (RFC 4180)', () => {
    expect(csvCell('Bob said "hi"')).toBe('"Bob said ""hi"""');
  });

  it('keeps commas inside a single field', () => {
    expect(csvCell('Dinner, John')).toBe('"Dinner, John"');
  });

  it('neutralizes CSV formula injection by prefixing with a quote', () => {
    expect(csvCell('=cmd|calc')).toBe('"\'=cmd|calc"');
    expect(csvCell('+1+2')).toBe('"\'+1+2"');
    expect(csvCell('-1+2')).toBe('"\'-1+2"');
    expect(csvCell('@import')).toBe('"\'@import"');
  });

  it('handles null and undefined as empty fields', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });
});

describe('csvRow()', () => {
  it('joins cells with commas and adds a newline', () => {
    expect(csvRow(['a', 'b', 'c'])).toBe('"a","b","c"\n');
  });
});

describe('sniffImageType()', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const gif = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  const webp = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50,
  ]);

  it('detects PNG, JPEG, GIF, and WebP', () => {
    expect(sniffImageType(png)).toBe('image/png');
    expect(sniffImageType(jpg)).toBe('image/jpeg');
    expect(sniffImageType(gif)).toBe('image/gif');
    expect(sniffImageType(webp)).toBe('image/webp');
  });

  it('rejects non-image buffers', () => {
    expect(sniffImageType(Buffer.from([0x00, 0x00, 0x00, 0x00]))).toBeNull();
    expect(sniffImageType(Buffer.from('hello world'))).toBeNull();
  });

  it('rejects short buffers', () => {
    expect(sniffImageType(Buffer.from([0x89]))).toBeNull();
  });
});