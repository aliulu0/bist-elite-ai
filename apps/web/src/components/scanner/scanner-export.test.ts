import { exportCsv } from './scanner-export';
import type { ScannerRow } from './scanner-table';

const mockData: ScannerRow[] = [
  { symbol: 'GARAN', name: 'Garanti', sector: 'Bankacılık', eliteScore: 85, opportunityScore: 78, financialScore: 72, technicalScore: 80, smartMoneyScore: 70, totalScore: 78, status: 'TOP_CANDIDATE' },
];

describe('exportCsv', () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let anchorEl: HTMLAnchorElement;
  const origURL = globalThis.URL;

  beforeAll(() => {
    clickSpy = vi.fn();
    anchorEl = document.createElement('a');
    anchorEl.click = clickSpy;
    vi.spyOn(document, 'createElement').mockReturnValue(anchorEl as unknown as HTMLElement);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('URL', origURL);
  });

  beforeEach(() => {
    clickSpy.mockClear();
  });

  it('calls click on anchor element', () => {
    exportCsv(mockData);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('creates blob URL', () => {
    exportCsv(mockData);
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it('revokes blob URL', () => {
    exportCsv(mockData);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles empty data', () => {
    exportCsv([]);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('sets download attribute', () => {
    exportCsv(mockData, 'test.csv');
    expect(anchorEl.download).toBe('test.csv');
  });

  it('sets href to blob url', () => {
    exportCsv(mockData);
    expect(anchorEl.href).toBe('blob:mock');
  });

  it('handles values with quotes in name', () => {
    const data: ScannerRow[] = [
      { ...mockData[0], name: 'Test "Quote"' },
    ];
    exportCsv(data);
    expect(clickSpy).toHaveBeenCalled();
  });
});
