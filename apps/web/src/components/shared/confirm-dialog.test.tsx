import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  it('renders when open', () => {
    render(<ConfirmDialog open={true} title="Onay" message="Emin misiniz?" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Onay')).toBeInTheDocument();
    expect(screen.getByText('Emin misiniz?')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmDialog open={false} title="Onay" message="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onConfirm when confirm clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open={true} title="T" message="M" onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Onayla'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open={true} title="T" message="M" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('İptal'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders custom labels', () => {
    render(<ConfirmDialog open={true} title="T" message="M" confirmLabel="Evet" cancelLabel="Hayır" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Evet')).toBeInTheDocument();
    expect(screen.getByText('Hayır')).toBeInTheDocument();
  });

  it('applies danger variant styling', () => {
    render(<ConfirmDialog open={true} title="T" message="M" variant="danger" onConfirm={() => {}} onCancel={() => {}} />);
    const btn = screen.getByText('Onayla');
    expect(btn).toHaveClass('bg-destructive');
  });

  it('closes on Escape key', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open={true} title="T" message="M" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('closes on overlay click', () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog open={true} title="T" message="M" onConfirm={() => {}} onCancel={onCancel} />);
    const overlay = container.querySelector('[role="dialog"]');
    fireEvent.click(overlay!);
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
