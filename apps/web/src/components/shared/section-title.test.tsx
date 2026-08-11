import { render, screen } from '@testing-library/react';
import { SectionTitle } from './section-title';

describe('SectionTitle', () => {
  it('renders title', () => {
    render(<SectionTitle title="Section" />);
    expect(screen.getByText('Section')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<SectionTitle title="T" description="Desc" />);
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('renders action', () => {
    render(<SectionTitle title="T" action={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SectionTitle title="T" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
