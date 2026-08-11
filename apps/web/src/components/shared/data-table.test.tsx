import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from './data-table';

interface TestRow extends Record<string, unknown> {
  name: string;
  value: number;
}

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'value', header: 'Value', sortable: true, align: 'right' },
];

const data: TestRow[] = [
  { name: 'Alice', value: 30 },
  { name: 'Bob', value: 20 },
  { name: 'Charlie', value: 40 },
];

describe('DataTable', () => {
  it('renders data', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('shows empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No data" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('paginates data', () => {
    const bigData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({ name: `Item ${i}`, value: i }));
    render(<DataTable columns={columns} data={bigData} pageSize={10} />);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 15')).not.toBeInTheDocument();
  });

  it('navigates pages', () => {
    const bigData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({ name: `Item ${i}`, value: i }));
    render(<DataTable columns={columns} data={bigData} pageSize={10} />);
    fireEvent.click(screen.getByLabelText('Sonraki sayfa'));
    expect(screen.getByText('Item 10')).toBeInTheDocument();
    expect(screen.queryByText('Item 0')).not.toBeInTheDocument();
  });

  it('sorts by column on header click', () => {
    render(<DataTable columns={columns} data={data} />);
    fireEvent.click(screen.getByText('Value'));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bob');
    expect(rows[2]).toHaveTextContent('Alice');
    expect(rows[3]).toHaveTextContent('Charlie');
  });

  it('reverses sort on second click', () => {
    render(<DataTable columns={columns} data={data} />);
    fireEvent.click(screen.getByText('Name'));
    fireEvent.click(screen.getByText('Name'));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Charlie');
  });

  it('calls onRowClick', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('uses custom render function', () => {
    const customCols: Column<TestRow>[] = [
      { key: 'name', header: 'Name', render: (r) => <strong>{String(r.name)}</strong> },
      { key: 'value', header: 'Value' },
    ];
    render(<DataTable columns={customCols} data={data} />);
    const strong = screen.getByText('Alice');
    expect(strong.tagName).toBe('STRONG');
  });

  it('applies custom className', () => {
    const { container } = render(<DataTable columns={columns} data={data} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('hides pagination for single page', () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    expect(screen.queryByLabelText('Sonraki sayfa')).not.toBeInTheDocument();
  });

  it('displays correct page info', () => {
    const bigData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({ name: `Item ${i}`, value: i }));
    render(<DataTable columns={columns} data={bigData} pageSize={10} />);
    expect(screen.getByText('1-10 / 25')).toBeInTheDocument();
  });
});
