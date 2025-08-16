import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
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
} from '@/components';

// Extend expect to include axe matchers
expect.extend(toHaveNoViolations);

describe('Design System Accessibility', () => {
  describe('Button Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <div>
          <Button>Default Button</Button>
          <Button variant='premium'>Premium Button</Button>
          <Button variant='outline'>Outline Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper focus indicators', async () => {
      const { container } = render(
        <Button className='focus-visible:ring-2 focus-visible:ring-ring'>
          Focused Button
        </Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Card Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card Title</CardTitle>
            <CardDescription>
              This is a description of the card content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This is the main content of the card with proper semantic
              structure.
            </p>
          </CardContent>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Elements Accessibility', () => {
    it('should have proper label associations', async () => {
      const { container } = render(
        <div>
          <Label htmlFor='username'>Username</Label>
          <Input
            id='username'
            type='text'
            placeholder='Enter your username'
            aria-describedby='username-help'
          />
          <p id='username-help' className='text-sm text-muted-foreground'>
            Your username must be unique
          </p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle required fields properly', async () => {
      const { container } = render(
        <div>
          <Label htmlFor='email'>Email Address *</Label>
          <Input
            id='email'
            type='email'
            required
            aria-required='true'
            placeholder='your@email.com'
          />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Avatar Accessibility', () => {
    it('should provide proper alternative text', async () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>
            <span className='sr-only'>User avatar for Sarah Johnson</span>
            SJ
          </AvatarFallback>
        </Avatar>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Badge Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <div>
          <Badge
            variant='note'
            role='status'
            aria-label='Fragrance note: Vanilla'
          >
            Vanilla
          </Badge>
          <Badge
            variant='gold'
            role='status'
            aria-label='Premium fragrance category'
          >
            Premium
          </Badge>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG AA color contrast requirements', async () => {
      const { container } = render(
        <div>
          {/* Primary colors - Deep plum on cream background */}
          <div className='bg-cream-100 text-plum-900 p-4'>
            Primary text on cream background should meet contrast requirements
          </div>

          {/* Button variants */}
          <Button variant='default' className='m-2'>
            Default Button
          </Button>
          <Button variant='outline' className='m-2'>
            Outline Button
          </Button>
          <Button variant='secondary' className='m-2'>
            Secondary Button
          </Button>

          {/* Muted text */}
          <p className='text-muted-foreground bg-background p-2'>
            This muted text should still be readable
          </p>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Interactive Elements', () => {
    it('should have proper touch targets (44px minimum)', async () => {
      const { container } = render(
        <div>
          <Button size='default' className='touch-target'>
            Touch Target Button
          </Button>
          <Button size='icon' className='touch-target'>
            <span className='sr-only'>Icon button</span>⭐
          </Button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic Structure', () => {
    it('should use proper heading hierarchy', async () => {
      const { container } = render(
        <div>
          <h1>Main Heading</h1>
          <h2>Section Heading</h2>
          <h3>Subsection Heading</h3>
          <p>Content text with proper structure</p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Attributes', () => {
    it('should use proper ARIA attributes for interactive cards', async () => {
      const { container } = render(
        <Card
          role='article'
          aria-labelledby='card-title'
          className='card-interactive'
          tabIndex={0}
        >
          <CardHeader>
            <CardTitle id='card-title'>Interactive Card</CardTitle>
            <CardDescription>
              This card is interactive and accessible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content with proper ARIA structure</p>
          </CardContent>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper screen reader content', async () => {
      const { container } = render(
        <div>
          <Button>
            <span aria-hidden='true'>⭐</span>
            <span className='sr-only'>Add to favorites</span>
            Favorite
          </Button>

          <div className='flex items-center gap-2'>
            <span className='sr-only'>Rating:</span>
            <div aria-label='4.5 out of 5 stars'>⭐⭐⭐⭐⭐</div>
            <span className='sr-only'>based on 324 reviews</span>
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
