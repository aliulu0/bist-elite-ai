import { SymbolNormalizerService } from './symbol-normalizer.service';
import { SymbolRegistryService } from '../symbol-registry/symbol-registry.service';

describe('SymbolNormalizerService', () => {
  describe('without registry', () => {
    const normalizer = new SymbolNormalizerService();

    it('trims whitespace and uppercases', () => {
      expect(normalizer.normalize('  thyao  ')).toBe('THYAO');
    });

    it('strips yahoo exchange suffix', () => {
      expect(normalizer.normalize('THYAO.IS')).toBe('THYAO');
    });

    it('strips suffix for lowercase input', () => {
      expect(normalizer.normalize('garan.is')).toBe('GARAN');
    });

    it('returns empty string for empty input', () => {
      expect(normalizer.normalize('')).toBe('');
    });
  });

  describe('with registry', () => {
    const normalizer = new SymbolNormalizerService(new SymbolRegistryService());

    it('maps to canonical ticker', () => {
      expect(normalizer.normalize('THYAO')).toBe('THYAO');
    });

    it('normalizes yahoo-style suffix to canonical ticker', () => {
      expect(normalizer.normalize('THYAO.IS')).toBe('THYAO');
    });

    it('keeps unknown symbols uppercase without suffix', () => {
      expect(normalizer.normalize('zzzz.is')).toBe('ZZZZ');
    });
  });
});
