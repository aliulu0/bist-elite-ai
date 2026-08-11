import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, FilterChip } from './filter-bar';

describe('FilterBar', () => {
  it('renders search input', () => {
    render(<FilterBar searchValue="" onSearchChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<FilterBar searchValue="hello" onSearchChange={() => {}} />);
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('calls onSearchChange on input', () => {
    const onChange = vi.fn();
    render(<FilterBar searchValue="" onSearchChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('renders custom placeholder', () => {
    render(<FilterBar searchValue="" onSearchChange={() => {}} searchPlaceholder="Filtrele..." />);
    expect(screen.getByPlaceholderText('Filtrele...')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<FilterBar searchValue="" onSearchChange={() => {}}><button>Extra</button></FilterBar>);
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<FilterBar searchValue="" onSearchChange={() => {}} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('FilterChip', () => {
  it('renders children', () => {
    render(<FilterChip>Active</FilterChip>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    render(<FilterChip onClick={onClick}>Click me</FilterChip>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies active class when active', () => {
    const { container } = render(<FilterChip active>Test</FilterChip>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('applies inactive class when not active', () => {
    const { container } = render(<FilterChip active={false}>Test</FilterChip>);
    expect(container.firstChild).toHaveClass('bg-background');
  });
});
