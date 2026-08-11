import { Injectable } from '@nestjs/common';
import { ScannerResult, ScannerSortMode } from '../scanner.types';

@Injectable()
export class SortEngine {
  sort(results: ScannerResult[], mode: ScannerSortMode): ScannerResult[] {
    const sorted = [...results];
    switch (mode) {
      case 'SCORE_DESC':
        return sorted.sort((a, b) => b.scannerScore - a.scannerScore);
      case 'CONFIDENCE_DESC':
        return sorted.sort((a, b) => b.confidence - a.confidence);
      case 'RISK_ASC':
        return sorted.sort((a, b) => a.risk - b.risk);
      case 'NEWEST':
        return sorted.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
      case 'SECTOR':
        return sorted.sort((a, b) => {
          const sectorA = a.metadata?.supportingMetrics?.find((m) => m.module === 'sectorStrength')?.module ?? '';
          const sectorB = b.metadata?.supportingMetrics?.find((m) => m.module === 'sectorStrength')?.module ?? '';
          return sectorA.localeCompare(sectorB) || b.scannerScore - a.scannerScore;
        });
      case 'ALPHABETICAL':
        return sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
      default:
        return sorted.sort((a, b) => b.scannerScore - a.scannerScore);
    }
  }
}
