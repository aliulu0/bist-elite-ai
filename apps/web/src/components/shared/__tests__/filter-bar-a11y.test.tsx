import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, FilterChip } from '../filter-bar';

describe('FilterBar accessibility', () => {
  it('wrapper has role="search"', () => {
    render(<FilterBar searchValue="" onSearchChange={vi.fn()} />);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('search input has aria-label', () => {
    render(<FilterBar searchValue="" onSearchChange={vi.fn()} />);
    expect(screen.getByLabelText('Filtrele...')).toBeInTheDocument();
  });

  it('uses custom placeholder as aria-label', () => {
    render(<FilterBar searchValue="" onSearchChange={vi.fn()} searchPlaceholder="Özel ara" />);
    expect(screen.getByLabelText('Özel ara')).toBeInTheDocument();
  });

  it('search value is controlled', () => {
    render(<FilterBar searchValue="test" onSearchChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('test');
  });

  it('calls onSearchChange on input', () => {
    const onChange = vi.fn();
    render(<FilterBar searchValue="" onSearchChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
    expect(onChange).toHaveBeenCalledWith('new');
  });

  it('children render', () => {
    render(
      <FilterBar searchValue="" onSearchChange={vi.fn()}>
        <span data-testid="child">Child</span>
      </FilterBar>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<FilterBar searchValue="" onSearchChange={vi.fn()} className="custom" />);
    expect(screen.getByRole('search').className).toContain('custom');
  });
});

describe('FilterChip', () => {
  it('renders children', () => {
    render(<FilterChip>Aktif</FilterChip>);
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    render(<FilterChip onClick={onClick}>Tıkla</FilterChip>);
    fireEvent.click(screen.getByText('Tıkla'));
    expect(onClick).toHaveBeenCalled();
  });

  it('active style applied', () => {
    render(<FilterChip active>Aktif</FilterChip>);
    expect(screen.getByText('Aktif').className).toContain('bg-primary');
  });

  it('inactive style applied', () => {
    render(<FilterChip active={false}>Pasif</FilterChip>);
    expect(screen.getByText('Pasif').className).toContain('bg-background');
  });

  it('is a button element', () => {
    render(<FilterChip>Test</FilterChip>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
