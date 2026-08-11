import { Injectable } from '@nestjs/common';
import { ScannerInstrument, ScannerFilterOptions } from './elite-scanner.types';

export interface AppliedScannerFilter extends ScannerFilterOptions {
  instrumentCount: number;
}

@Injectable()
export class ScannerFilter {
  apply(instruments: ScannerInstrument[], filter?: Partial<ScannerFilterOptions>): {
    filtered: ScannerInstrument[];
    applied: AppliedScannerFilter;
  } {
    const sector = filter?.sector ?? null;
    const assetType = filter?.assetType ?? null;
    const activeOnly = filter?.activeOnly ?? true;
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : undefined;

    let result = instruments;
    if (activeOnly) {
      result = result.filter((i) => i.market !== 'inactive');
    }
    if (sector) {
      result = result.filter((i) => i.sector === sector);
    }
    if (assetType) {
      result = result.filter((i) => i.assetType === assetType);
    }
    const total = result.length;
    if (limit && total > limit) {
      result = result.slice(0, limit);
    }

    return {
      filtered: result,
      applied: { sector, assetType, activeOnly, limit: limit ?? total, instrumentCount: total },
    };
  }
}