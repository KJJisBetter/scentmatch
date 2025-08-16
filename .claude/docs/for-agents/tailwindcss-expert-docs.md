# TailwindCSS Expert Agent Documentation

## TailwindCSS v3.4 (Stable) Best Practices

### Design System Architecture

**Color Palette Structure**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Semantic colors
        primary: {
          50: '#f8f6fc',
          500: '#9d6bca',
          900: '#2d1b3d',
        },
        // CSS variables for dynamic theming
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      }
    }
  }
}
```

**Typography Scale**
```javascript
fontFamily: {
  sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
  serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
},
fontSize: {
  'xs': ['12px', { lineHeight: '16px' }],
  'sm': ['14px', { lineHeight: '20px' }],
  'base': ['16px', { lineHeight: '24px' }],
  'lg': ['18px', { lineHeight: '28px' }],
  'xl': ['20px', { lineHeight: '28px' }],
  '2xl': ['24px', { lineHeight: '32px' }],
}
```

### Responsive Design Patterns

**Mobile-First Breakpoints**
```javascript
screens: {
  'sm': '640px',   // Tablet
  'md': '768px',   // Small laptop
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

**Responsive Component Example**
```jsx
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
  xl:grid-cols-4
">
  {/* Mobile: 1 column, Desktop: 4 columns */}
</div>
```

### Component Design Patterns

**Card Components**
```jsx
<div className="
  bg-white dark:bg-gray-900
  border border-gray-200 dark:border-gray-800
  rounded-lg
  p-6
  shadow-sm hover:shadow-md
  transition-shadow duration-200
">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
    Card Title
  </h3>
</div>
```

**Button Variants**
```jsx
// Primary button
<button className="
  bg-primary-600 hover:bg-primary-700
  text-white font-medium
  px-4 py-2 rounded-md
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">

// Secondary button  
<button className="
  bg-white hover:bg-gray-50
  text-gray-900 
  border border-gray-300
  px-4 py-2 rounded-md
  transition-colors duration-200
">
```

### Accessibility Patterns

**Focus Management**
```jsx
<button className="
  focus:outline-none
  focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  focus:ring-offset-white dark:focus:ring-offset-gray-900
">
```

**Color Contrast Compliance**
```jsx
// Ensure 4.5:1 contrast ratio minimum
<p className="text-gray-900 dark:text-gray-100"> {/* High contrast */}
<p className="text-gray-600 dark:text-gray-400"> {/* Medium contrast */}
```

**Touch Targets (Mobile)**
```jsx
<button className="
  min-h-[44px] min-w-[44px] // 44px minimum touch target
  p-3 // Ensure adequate padding
">
```

### Performance Optimization

**CSS Purging Configuration**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  // Only includes used classes in production
}
```

**Animation Performance**
```jsx
// Use transform instead of changing layout properties
<div className="
  transform transition-transform duration-200
  hover:scale-105
  will-change-transform
">

// Avoid animating width, height, or margin
// Use transform, opacity, or filter instead
```

### Dark Mode Implementation

**System Preference Detection**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
}
```

**Theme Toggle Pattern**
```jsx
'use client'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

### Component Composition Patterns

**Compound Components**
```jsx
<Card>
  <CardHeader>
    <CardTitle>Fragrance Name</CardTitle>
    <CardDescription>Brand and details</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card body content */}
  </CardContent>
  <CardFooter>
    <Button>Add to Collection</Button>
  </CardFooter>
</Card>
```

### Layout Patterns

**Responsive Grid Systems**
```jsx
// Auto-fit grid (responsive without breakpoints)
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">

// Sidebar + Main content
<div className="grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-6">
  <aside>Sidebar</aside>
  <main>Main content</main>
</div>
```

**Flexbox Patterns**
```jsx
// Center content
<div className="flex items-center justify-center min-h-screen">

// Space between elements
<div className="flex justify-between items-center">

// Responsive flex direction
<div className="flex flex-col lg:flex-row gap-4">
```

### CSS-in-JS Integration

**Custom CSS Variables**
```css
/* globals.css */
:root {
  --radius: 0.5rem;
  --primary: 262 83% 58%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --primary: 262 83% 58%;
  --primary-foreground: 210 40% 8%;
}
```

### Common Pitfalls

**Version Compatibility**
- Use TailwindCSS v3.4.x (stable) not v4.x (experimental)
- Ensure PostCSS configuration uses standard `tailwindcss` plugin
- Avoid @tailwindcss/postcss (v4-specific)

**Build Optimization**
- Include all relevant file paths in content array
- Use appropriate purging configuration
- Monitor bundle size impact