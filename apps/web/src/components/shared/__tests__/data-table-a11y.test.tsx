import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from '../data-table';

const columns: Column<{ name: string; score: number }>[] = [
  { key: 'name', header: 'İsim', sortable: true },
  { key: 'score', header: 'Puan', sortable: true, align: 'right' },
];

const data = [
  { name: 'GARAN', score: 85 },
  { name: 'THYAO', score: 92 },
  { name: 'ASELS', score: 70 },
];

describe('DataTable accessibility', () => {
  it('table has role="table"', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('headers have role="columnheader"', () => {
    render(<DataTable columns={columns} data={data} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBe(2);
  });

  it('cells have role="cell"', () => {
    render(<DataTable columns={columns} data={data} />);
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(6);
  });

  it('rows have role="row"', () => {
    render(<DataTable columns={columns} data={data} />);
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(4); // 1 header + 3 data rows
  });

  it('sortable column has aria-sort ascending', () => {
    render(<DataTable columns={columns} data={data} />);
    fireEvent.click(screen.getByText('İsim'));
    const nameHeader = screen.getAllByRole('columnheader')[0];
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('clicking again toggles to descending', () => {
    render(<DataTable columns={columns} data={data} />);
    fireEvent.click(screen.getByText('İsim'));
    fireEvent.click(screen.getByText('İsim'));
    const nameHeader = screen.getAllByRole('columnheader')[0];
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('unsorted column has aria-sort none', () => {
    render(<DataTable columns={columns} data={data} />);
    const nameHeader = screen.getAllByRole('columnheader')[0];
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('keyboard Enter triggers sort on column header', () => {
    render(<DataTable columns={columns} data={data} />);
    const nameHeader = screen.getAllByRole('columnheader')[0];
    fireEvent.keyDown(nameHeader, { key: 'Enter' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('keyboard Space triggers sort on column header', () => {
    render(<DataTable columns={columns} data={data} />);
    const nameHeader = screen.getAllByRole('columnheader')[0];
    fireEvent.keyDown(nameHeader, { key: ' ' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('onRowClick row is focusable', () => {
    const onClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onClick} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('tabindex', '0');
  });

  it('Enter key triggers row click', () => {
    const onClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onClick} />);
    const rows = screen.getAllByRole('row');
    fireEvent.keyDown(rows[1], { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('pagination has prev/next buttons with aria-labels', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ name: `S${i}`, score: i }));
    render(<DataTable columns={columns} data={many} pageSize={5} />);
    expect(screen.getByLabelText('Önceki sayfa')).toBeInTheDocument();
    expect(screen.getByLabelText('Sonraki sayfa')).toBeInTheDocument();
  });

  it('empty state renders', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('Veri bulunamadı')).toBeInTheDocument();
  });

  it('custom empty message renders', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Boş" />);
    expect(screen.getByText('Boş')).toBeInTheDocument();
  });

  it('sortable headers are focusable', () => {
    render(<DataTable columns={columns} data={data} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveAttribute('tabindex', '0');
  });
});
