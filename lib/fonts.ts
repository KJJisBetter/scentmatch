import { Inter, Playfair_Display } from 'next/font/google';

/**
 * Inter font configuration
 * Modern, clean sans-serif font for body text and UI elements
 */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  weight: ['300', '400', '500', '600', '700'],
});

/**
 * Playfair Display font configuration
 * Elegant serif font for headings and premium branding
 */
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700', '800', '900'],
});

/**
 * Combined font class names for applying to HTML elements
 */
export const fontVariables = `${inter.variable} ${playfairDisplay.variable}`;
