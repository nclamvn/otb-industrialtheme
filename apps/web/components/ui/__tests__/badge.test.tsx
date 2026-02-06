import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('renders badge with text', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<Badge data-testid="badge">Label</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge.tagName).toBe('DIV');
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
    });

    it('renders with default variant when no variant specified', () => {
      render(<Badge>No Variant</Badge>);
      const badge = screen.getByText('No Variant');
      expect(badge).toHaveClass('bg-primary');
    });

    it('renders secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
    });

    it('renders destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-destructive-foreground');
    });

    it('renders outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-foreground');
      expect(badge).not.toHaveClass('bg-primary');
    });
  });

  describe('styling', () => {
    it('applies base styles', () => {
      render(<Badge>Base</Badge>);
      const badge = screen.getByText('Base');

      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-md');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-semibold');
    });

    it('accepts custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class');
    });

    it('merges custom className with variant styles', () => {
      render(<Badge className="ml-2" variant="secondary">Merged</Badge>);
      const badge = screen.getByText('Merged');
      expect(badge).toHaveClass('ml-2');
      expect(badge).toHaveClass('bg-secondary');
    });
  });

  describe('focus styles', () => {
    it('has focus ring styles', () => {
      render(<Badge>Focus</Badge>);
      const badge = screen.getByText('Focus');
      expect(badge).toHaveClass('focus:ring-2');
      expect(badge).toHaveClass('focus:ring-ring');
      expect(badge).toHaveClass('focus:ring-offset-2');
    });

    it('has focus outline none', () => {
      render(<Badge>Focus</Badge>);
      const badge = screen.getByText('Focus');
      expect(badge).toHaveClass('focus:outline-none');
    });
  });

  describe('hover styles', () => {
    it('has hover effect for default variant', () => {
      render(<Badge variant="default">Hover</Badge>);
      const badge = screen.getByText('Hover');
      expect(badge).toHaveClass('hover:bg-primary/80');
    });

    it('has hover effect for secondary variant', () => {
      render(<Badge variant="secondary">Hover</Badge>);
      const badge = screen.getByText('Hover');
      expect(badge).toHaveClass('hover:bg-secondary/80');
    });

    it('has hover effect for destructive variant', () => {
      render(<Badge variant="destructive">Hover</Badge>);
      const badge = screen.getByText('Hover');
      expect(badge).toHaveClass('hover:bg-destructive/80');
    });
  });

  describe('HTML attributes', () => {
    it('forwards HTML attributes', () => {
      render(<Badge data-testid="test-badge" id="badge-1">Attrs</Badge>);
      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('id', 'badge-1');
    });

    it('accepts aria attributes', () => {
      render(<Badge aria-label="Status badge">Status</Badge>);
      const badge = screen.getByLabelText('Status badge');
      expect(badge).toBeInTheDocument();
    });

    it('accepts role attribute', () => {
      render(<Badge role="status">Alert</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('accepts title attribute', () => {
      render(<Badge title="Click for details">Info</Badge>);
      const badge = screen.getByTitle('Click for details');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('with children', () => {
    it('renders with multiple children', () => {
      render(
        <Badge>
          <span data-testid="icon">*</span>
          <span>Label</span>
        </Badge>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('renders with numbers', () => {
      render(<Badge>99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders with icon elements', () => {
      render(
        <Badge>
          <svg data-testid="svg-icon" />
          New
        </Badge>
      );

      expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  describe('use cases', () => {
    it('works as status indicator', () => {
      render(<Badge variant="default">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('works as count indicator', () => {
      render(<Badge variant="secondary">5</Badge>);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('works as label for categories', () => {
      render(<Badge variant="outline">Category</Badge>);
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('works as error indicator', () => {
      render(<Badge variant="destructive">Error</Badge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('transition', () => {
    it('has transition-colors class', () => {
      render(<Badge>Transition</Badge>);
      const badge = screen.getByText('Transition');
      expect(badge).toHaveClass('transition-colors');
    });
  });
});
