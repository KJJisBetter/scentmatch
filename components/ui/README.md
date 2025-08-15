# ScentMatch UI Design System

A premium fragrance discovery platform design system built with TailwindCSS 4.0+ and Shadcn/ui components.

## Design Philosophy

Our design system embodies the sophisticated, premium aesthetic of fragrance discovery with:

- **Deep Plum Primary** (#2d1b3d) - Sophisticated, premium feeling
- **Warm Cream Base** (#f5f1e8) - Soft, approachable background
- **Warm Gold Accent** (#d4a574) - Luxurious highlights and calls-to-action

## Typography

- **Primary Font**: Inter (sans-serif) - Clean, modern, excellent readability
- **Display Font**: Playfair Display (serif) - Elegant, premium for headings
- **8px Base Spacing System** - Consistent rhythm throughout the interface

## Components

### Core UI Components

#### Button

Premium button component with multiple variants:

- `default` - Primary deep plum background
- `premium` - Gradient background with enhanced shadows
- `outline` - Outlined with hover effects
- `secondary` - Cream background with plum text
- `ghost` - Transparent with hover states
- `accent` - Gold accent for special actions

```tsx
<Button variant='premium' size='xl'>
  <Sparkles className='w-5 h-5 mr-2' />
  Start Your Journey
</Button>
```

#### Card

Elevated cards with premium styling:

- `card-elevated` - Standard elevated card
- `card-interactive` - Hover effects and cursor pointer

```tsx
<Card className='card-interactive'>
  <CardHeader>
    <CardTitle>Fragrance Title</CardTitle>
    <CardDescription>Woody, spicy, luxurious</CardDescription>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
</Card>
```

#### Badge

Fragrance-specific badge variants:

- `note` - For fragrance notes (light plum)
- `gold` - Premium category indicator
- `premium` - Limited edition gradient
- `accent` - Special highlights

```tsx
<Badge variant="note">Vanilla</Badge>
<Badge variant="gold">Premium</Badge>
```

#### Input & Label

Form elements with premium styling and accessibility:

```tsx
<div className='space-y-2'>
  <Label htmlFor='email'>Email Address</Label>
  <Input id='email' type='email' placeholder='your@email.com' />
</div>
```

## Accessibility Features

### WCAG 2.2 AA Compliance

- ✅ Color contrast ratios meet AA standards
- ✅ Touch targets minimum 44px
- ✅ Proper focus indicators
- ✅ Screen reader support
- ✅ Keyboard navigation

### Focus Management

- Enhanced focus rings using `ring-ring` color
- Visible focus indicators on all interactive elements
- Logical tab order throughout interfaces

### Screen Reader Support

- Semantic HTML structure
- Proper ARIA attributes
- Screen reader only content with `.sr-only` utility
- Descriptive labels and alternative text

## Custom Utilities

### Gradients

```css
.gradient-primary /* Deep plum to lighter plum */
.gradient-accent  /* Gold gradient */
.text-gradient-primary /* Text gradient - primary colors */
.text-gradient-accent  /* Text gradient - gold accent */
```

### Shadows

```css
.shadow-soft   /* Subtle shadow */
.shadow-medium /* Standard elevated shadow */
.shadow-strong /* Strong emphasis shadow */
```

### Containers

```css
.container       /* Standard max-width container */
.container-narrow /* Narrower content container */
.container-wide  /* Full-width container */
```

### Premium Effects

```css
.glass       /* Glass morphism effect */
.glass-dark  /* Dark theme glass effect */
.touch-target /* Ensures 44px touch target */
```

## Dark Mode Support

The design system includes comprehensive dark mode support:

- Automatic system preference detection
- Manual theme switching capability
- Consistent color mappings across themes
- Enhanced shadows for dark backgrounds

```tsx
import { ThemeProvider, useTheme } from '@/components/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme='system' enableSystem>
      <YourApp />
    </ThemeProvider>
  );
}
```

## Animation & Micro-interactions

### Built-in Animations

- `animate-scale-in` - Scale in effect
- `animate-slide-up` - Slide up from bottom
- Smooth transitions on all interactive elements
- Hover effects with scale and shadow changes

### Button Interactions

- Active scale down (98% scale on press)
- Smooth color transitions
- Enhanced shadows on hover

## Usage Guidelines

### Color Usage

- Use **Deep Plum** for primary actions and emphasis
- Use **Warm Cream** for backgrounds and soft elements
- Use **Warm Gold** sparingly for premium features and CTAs
- Maintain contrast ratios for accessibility

### Typography Scale

- Use **Playfair Display** for main headings and branding
- Use **Inter** for body text, UI elements, and content
- Follow the semantic heading hierarchy (h1-h6)

### Spacing System

- Base unit: 8px (0.5rem)
- Use consistent spacing multiples (8px, 16px, 24px, 32px, etc.)
- Apply spacing classes: `space-y-4`, `gap-6`, `p-8`

## Testing

### Unit Tests

```bash
npm run test:unit -- tests/ui/design-system.test.tsx
```

### Accessibility Tests

```bash
npm run test:a11y -- tests/accessibility/design-system-a11y.test.tsx
```

### Visual Regression

Visit `/design-system` in development to see the complete component showcase.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Font optimization with `next/font`
- CSS-in-JS with zero runtime overhead
- Tree-shaking for unused components
- Optimized animations with `transform` and `opacity`

## Contributing

When adding new components:

1. Follow the established design tokens
2. Include accessibility features
3. Add comprehensive tests
4. Document usage patterns
5. Update the component showcase
