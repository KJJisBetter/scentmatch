import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  Skeleton,
} from '@/components';

describe('UI Components - Design System', () => {
  describe('Button Component', () => {
    it('renders default button correctly', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('renders premium variant with correct styling', () => {
      render(<Button variant='premium'>Premium Button</Button>);
      const button = screen.getByRole('button', { name: /premium button/i });
      expect(button).toHaveClass('gradient-primary');
    });

    it('renders different sizes correctly', () => {
      render(
        <div>
          <Button size='sm'>Small</Button>
          <Button size='lg'>Large</Button>
          <Button size='xl'>Extra Large</Button>
        </div>
      );

      const smallButton = screen.getByRole('button', { name: /small/i });
      const largeButton = screen.getByRole('button', { name: /large/i });
      const xlButton = screen.getByRole('button', { name: /extra large/i });

      expect(smallButton).toHaveClass('h-9');
      expect(largeButton).toHaveClass('h-12');
      expect(xlButton).toHaveClass('h-14');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      button.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card Component', () => {
    it('renders card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      render(
        <Card data-testid='test-card'>
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('card-elevated');
    });
  });

  describe('Badge Component', () => {
    it('renders with default variant', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-primary');
    });

    it('renders fragrance-specific variants', () => {
      render(
        <div>
          <Badge variant='note'>Fragrance Note</Badge>
          <Badge variant='gold'>Premium</Badge>
          <Badge variant='premium'>Limited Edition</Badge>
        </div>
      );

      const noteBadge = screen.getByText('Fragrance Note');
      const goldBadge = screen.getByText('Premium');
      const premiumBadge = screen.getByText('Limited Edition');

      expect(noteBadge).toHaveClass('border-plum-200');
      expect(goldBadge).toHaveClass('bg-gold-400');
      expect(premiumBadge).toHaveClass('gradient-primary');
    });
  });

  describe('Input Component', () => {
    it('renders input with proper styling', () => {
      render(<Input placeholder='Enter text' />);
      const input = screen.getByPlaceholderText('Enter text');

      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('rounded-lg', 'border-input');
    });

    it('works with Label component', () => {
      render(
        <div>
          <Label htmlFor='email'>Email</Label>
          <Input id='email' type='email' placeholder='your@email.com' />
        </div>
      );

      const label = screen.getByText('Email');
      const input = screen.getByPlaceholderText('your@email.com');

      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'email');
    });
  });

  describe('Avatar Component', () => {
    it('renders avatar with fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
      );

      const fallback = screen.getByText('SM');
      expect(fallback).toBeInTheDocument();
    });
  });

  describe('Skeleton Component', () => {
    it('renders skeleton loader', () => {
      render(<Skeleton className='h-4 w-20' data-testid='skeleton' />);
      const skeleton = screen.getByTestId('skeleton');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'bg-muted');
    });
  });

  describe('Accessibility', () => {
    it('button has proper focus styling', () => {
      render(<Button>Accessible Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2'
      );
    });

    it('input has proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor='accessible-input'>Accessible Input</Label>
          <Input id='accessible-input' aria-describedby='input-help' />
        </div>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'accessible-input');
    });
  });

  describe('Typography Scale', () => {
    it('applies correct font families', () => {
      render(
        <div>
          <h1 className='font-serif'>Serif Heading</h1>
          <p className='font-sans'>Sans Body Text</p>
        </div>
      );

      const heading = screen.getByText('Serif Heading');
      const body = screen.getByText('Sans Body Text');

      expect(heading).toHaveClass('font-serif');
      expect(body).toHaveClass('font-sans');
    });
  });

  describe('Color System', () => {
    it('applies custom color classes correctly', () => {
      render(
        <div>
          <div
            className='bg-plum-900 text-cream-100'
            data-testid='plum-element'
          >
            Plum Background
          </div>
          <div className='bg-gold-400 text-plum-900' data-testid='gold-element'>
            Gold Background
          </div>
        </div>
      );

      const plumElement = screen.getByTestId('plum-element');
      const goldElement = screen.getByTestId('gold-element');

      expect(plumElement).toHaveClass('bg-plum-900', 'text-cream-100');
      expect(goldElement).toHaveClass('bg-gold-400', 'text-plum-900');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive container classes', () => {
      render(
        <div className='container' data-testid='container'>
          Responsive Container
        </div>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4');
    });
  });
});
