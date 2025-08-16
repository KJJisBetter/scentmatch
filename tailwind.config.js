const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // ScentMatch fragrance-focused color palette
        plum: {
          50: '#f8f6fc',
          100: '#f0ebf8',
          200: '#e4d9f2',
          300: '#d0bce8',
          400: '#b794db',
          500: '#9d6bca',
          600: '#864db5',
          700: '#73409d',
          800: '#5f3782',
          900: '#2d1b3d', // Primary deep plum
          950: '#1a0f25',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f5f1e8', // Warm cream base
          200: '#ede5d4',
          300: '#e0d4bb',
          400: '#d1bfa0',
          500: '#c2a885',
          600: '#b59171',
          700: '#a07a5e',
          800: '#86654e',
          900: '#6f5341',
          950: '#3a2c22',
        },
        gold: {
          50: '#fdf9f0',
          100: '#f9f0dd',
          200: '#f2deb4',
          300: '#e8c67d',
          400: '#d4a574', // Warm gold accent
          500: '#c28e4d',
          600: '#b37a42',
          700: '#956037',
          800: '#794d31',
          900: '#63402b',
          950: '#362116',
        },
        // Shadcn/ui semantic colors (mapped to our palette)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
      },
    },
  },
  plugins: [
    // Add typography plugin for better text styling (optional)
    // require('@tailwindcss/typography'),
  ],
};
export default config;
