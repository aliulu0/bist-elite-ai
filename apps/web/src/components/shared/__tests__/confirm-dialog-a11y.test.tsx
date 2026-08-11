import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../confirm-dialog';

const defaultProps = {
  open: true,
  title: 'Onay',
  message: 'Bu işlemi yapmak istediğinize emin misiniz?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConfirmDialog accessibility', () => {
  it('renders dialog with role="dialog"', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to title', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)).toHaveTextContent('Onay');
  });

  it('Escape key calls onCancel', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('overlay click calls onCancel', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('close button has aria-label', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByLabelText('Kapat')).toBeInTheDocument();
  });

  it('confirm button calls onConfirm', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Onayla'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('cancel button calls onCancel', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('İptal'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('renders custom confirm label', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Sil" />);
    expect(screen.getByText('Sil')).toBeInTheDocument();
  });

  it('renders custom cancel label', () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="Vazgeç" />);
    expect(screen.getByText('Vazgeç')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('danger variant renders destructive button', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    const btn = screen.getByText('Onayla');
    expect(btn.className).toContain('bg-destructive');
  });
});
