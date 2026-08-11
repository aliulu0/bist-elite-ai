import { ScannerSortMode, ScannerCategory, ScannerGroupBy, ScannerResult } from '../scanner.types';

export interface ISorter {
  readonly name: ScannerSortMode;
  sort(results: ScannerResult[]): ScannerResult[];
}

export interface ICategorizer {
  readonly name: string;
  assign(result: ScannerResult): ScannerCategory;
}

export interface IGrouper {
  readonly name: ScannerGroupBy;
  group(results: ScannerResult[]): Map<string, ScannerResult[]>;
}
