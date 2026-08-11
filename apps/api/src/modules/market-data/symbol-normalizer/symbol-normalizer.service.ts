import { Injectable, Optional } from '@nestjs/common';
import { SymbolRegistryService } from '../symbol-registry/symbol-registry.service';

@Injectable()
export class SymbolNormalizerService {
  constructor(@Optional() private readonly symbolRegistry?: SymbolRegistryService) {}

  normalize(ticker: string): string {
    if (!ticker) return ticker;

    let cleaned = ticker.trim().toUpperCase();

    const dotIndex = cleaned.indexOf('.');
    if (dotIndex > 0) {
      cleaned = cleaned.slice(0, dotIndex);
    }

    if (!cleaned) return ticker.trim().toUpperCase();

    if (this.symbolRegistry) {
      const entry = this.symbolRegistry.getSymbol(cleaned);
      if (entry) return entry.canonicalTicker ?? cleaned;
      const canonical = this.symbolRegistry.getCanonicalTicker('yahoo', cleaned);
      if (canonical) return canonical;
    }

    return cleaned;
  }

  isCanonical(ticker: string): boolean {
    return this.normalize(ticker) === ticker.trim().toUpperCase();
  }
}
