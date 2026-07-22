import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from '../pipes/file-validation.pipe';

class MockLogger {
  log() {}
  debug() {}
  warn() {}
  error() {}
  trace() {}
  fatal() {}
  logRequest() {}
  logResponse() {}
  logEvent() {}
  getConfig() {
    return { level: 'info', maskSensitiveFields: [] };
  }
}

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;

  beforeEach(() => {
    pipe = new FileValidationPipe(new MockLogger() as any);
  });

  it('passes through undefined', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('validates a single valid file', () => {
    const file = {
      fieldname: 'file',
      originalname: 'data.json',
      encoding: '7bit',
      mimetype: 'application/json',
      size: 1024,
    };
    expect(pipe.transform(file as any)).toEqual(file);
  });

  it('validates multiple valid files', () => {
    const files = [
      {
        fieldname: 'files',
        originalname: 'data1.json',
        encoding: '7bit',
        mimetype: 'application/json',
        size: 1024,
      },
      {
        fieldname: 'files',
        originalname: 'data2.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: 2048,
      },
    ];
    expect(pipe.transform(files as any)).toEqual(files);
  });

  it('rejects invalid mime type', () => {
    const file = {
      fieldname: 'file',
      originalname: 'malware.exe',
      encoding: 'binary',
      mimetype: 'application/x-executable',
      size: 1024,
    };
    expect(() => pipe.transform(file as any)).toThrow(BadRequestException);
  });

  it('rejects oversized file', () => {
    const file = {
      fieldname: 'file',
      originalname: 'large.json',
      encoding: '7bit',
      mimetype: 'application/json',
      size: 100 * 1024 * 1024,
    };
    expect(() => pipe.transform(file as any)).toThrow(BadRequestException);
  });

  it('rejects path traversal in filename', () => {
    const file = {
      fieldname: 'file',
      originalname: '../../../etc/passwd',
      encoding: '7bit',
      mimetype: 'application/json',
      size: 1024,
    };
    expect(() => pipe.transform(file as any)).toThrow(BadRequestException);
  });

  it('rejects null byte in filename', () => {
    const file = {
      fieldname: 'file',
      originalname: 'file.json\x00.exe',
      encoding: '7bit',
      mimetype: 'application/json',
      size: 1024,
    };
    expect(() => pipe.transform(file as any)).toThrow(BadRequestException);
  });

  it('rejects too many files', () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      fieldname: 'files',
      originalname: `file${i}.json`,
      encoding: '7bit',
      mimetype: 'application/json',
      size: 1024,
    }));
    expect(() => pipe.transform(files as any)).toThrow(BadRequestException);
  });

  it('allows valid image types', () => {
    const file = {
      fieldname: 'file',
      originalname: 'chart.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 2048,
    };
    expect(pipe.transform(file as any)).toEqual(file);
  });

  it('allows PDF files', () => {
    const file = {
      fieldname: 'file',
      originalname: 'report.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 4096,
    };
    expect(pipe.transform(file as any)).toEqual(file);
  });
});
