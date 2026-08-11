import { useScannerStore, type RangeFilter } from '@/stores/scanner-store';
import { FilterChip, Card } from '@/components/shared';
import { X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const BIST_SECTORS = [
  'Bankacılık', 'Holding', 'Gıda', 'İnşaat', 'Enerji', 'Kimya', 'Otomotiv',
  'Tekstil', 'Turizm', 'İletişim', 'Maden', 'Demir-Çelik', 'Gıda & İçecek',
  'Perakende', 'Sağlık', 'Sigorta', 'Lojistik', 'Mobilite', 'Gayrimenkul',
];

interface RangeInputProps {
  label: string;
  filterKey: string;
  filterField: RangeFilter;
}

function RangeInput({ label, filterKey, filterField }: RangeInputProps) {
  const setRangeFilter = useScannerStore((s) => s.setRangeFilter);
  const hasValue = filterField.min !== undefined || filterField.max !== undefined;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        {hasValue && (
          <button
            onClick={() => {
              setRangeFilter(filterKey as never, 'min', undefined);
              setRangeFilter(filterKey as never, 'max', undefined);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`${label} filtresini temizle`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          placeholder="Min"
          value={filterField.min ?? ''}
          onChange={(e) => setRangeFilter(filterKey as never, 'min', e.target.value ? Number(e.target.value) : undefined)}
          className="w-full rounded border bg-muted/50 px-2 py-1 text-[11px] outline-none focus:border-primary"
          aria-label={`${label} minimum`}
        />
        <span className="text-[10px] text-muted-foreground">-</span>
        <input
          type="number"
          placeholder="Max"
          value={filterField.max ?? ''}
          onChange={(e) => setRangeFilter(filterKey as never, 'max', e.target.value ? Number(e.target.value) : undefined)}
          className="w-full rounded border bg-muted/50 px-2 py-1 text-[11px] outline-none focus:border-primary"
          aria-label={`${label} maksimum`}
        />
      </div>
    </div>
  );
}

function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 py-3 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-xs font-medium text-foreground"
      >
        {title}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

export function ScannerFilters() {
  const filters = useScannerStore((s) => s.filters);
  const setFilter = useScannerStore((s) => s.setFilter);
  const resetFilters = useScannerStore((s) => s.resetFilters);
  const leftPanelOpen = useScannerStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useScannerStore((s) => s.toggleLeftPanel);

  if (!leftPanelOpen) return null;

  return (
    <Card className="h-fit overflow-y-auto" title="Filtreler" action={
      <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground" aria-label="Filtreleri sıfırla">
        <RotateCcw className="h-3 w-3" /> Sıfırla
      </button>
    }>
      <FilterSection title="Sektör">
        <select
          value={filters.sector}
          onChange={(e) => setFilter('sector', e.target.value)}
          className="w-full rounded border bg-muted/50 px-2 py-1.5 text-xs outline-none focus:border-primary"
          aria-label="Sektör filtresi"
        >
          <option value="">Tüm Sektörler</option>
          {BIST_SECTORS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FilterSection>

      <FilterSection title="Durum">
        <div className="flex flex-wrap gap-1">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'TOP_CANDIDATE', label: 'Aday' },
            { key: 'WATCHLIST', label: 'İzleme' },
            { key: 'REJECTED', label: 'Red' },
          ].map((s) => (
            <FilterChip key={s.key} active={filters.status === s.key} onClick={() => setFilter('status', s.key)}>
              {s.label}
            </FilterChip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Skorlar">
        <RangeInput label="Elite Skoru" filterKey="eliteScore" filterField={filters.eliteScore} />
        <RangeInput label="Fırsat" filterKey="opportunityScore" filterField={filters.opportunityScore} />
        <RangeInput label="Finansal" filterKey="financialScore" filterField={filters.financialScore} />
        <RangeInput label="Teknik" filterKey="technicalScore" filterField={filters.technicalScore} />
        <RangeInput label="Akıllı Para" filterKey="smartMoneyScore" filterField={filters.smartMoneyScore} />
      </FilterSection>

      <FilterSection title="Çarpanlar">
        <RangeInput label="PD/DD" filterKey="pdRatio" filterField={filters.pdRatio} />
        <RangeInput label="FD/FAVÖK" filterKey="fdFavok" filterField={filters.fdFavok} />
        <RangeInput label="Piyasa Değeri (M ₺)" filterKey="marketCap" filterField={filters.marketCap} />
      </FilterSection>

      <FilterSection title="Büyüme & Temettü">
        <RangeInput label="Net Kar Artışı %" filterKey="netIncomeGrowth" filterField={filters.netIncomeGrowth} />
        <RangeInput label="Temettü Verimi %" filterKey="dividendYield" filterField={filters.dividendYield} />
      </FilterSection>

      <FilterSection title="Teknik & Likidite">
        <RangeInput label="Hacim" filterKey="volume" filterField={filters.volume} />
        <RangeInput label="Likidite" filterKey="liquidity" filterField={filters.liquidity} />
        <RangeInput label="Beta" filterKey="beta" filterField={filters.beta} />
      </FilterSection>
    </Card>
  );
}
