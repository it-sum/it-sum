import { describe, expect, it } from 'vitest';
import { driveFileSchema } from './types';

describe('Drive contract', () => {
  it('accepts a real PDF metadata shape from the IT-SUM export', () => {
    const file = driveFileSchema.parse({
      id: '1aJvn6Yxwu6Lnu_jMaWVLSt5faictgy22',
      name: 'المحاضره السادسه سيبر سيكيورتي.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 481524,
      md5Checksum: null,
      modifiedTime: '2025-12-15T14:59:20.380Z',
      createdTime: null,
      parents: ['1Ppc8uddUAcB747uVBngdNcjwUC4Riitq'],
      webViewLink: null,
      trashed: false,
      driveType: 'my_drive',
    });
    expect(file.mimeType).toBe('application/pdf');
    expect(file.driveType).toBe('my_drive');
  });

  it('rejects malformed Drive IDs instead of creating unreachable resources', () => {
    expect(() => driveFileSchema.parse({
      id: 'bad', name: 'file.pdf', mimeType: 'application/pdf', sizeBytes: 1,
      md5Checksum: null, modifiedTime: null, createdTime: null, parents: [],
      webViewLink: null, trashed: false, driveType: 'my_drive',
    })).toThrow();
  });
});
