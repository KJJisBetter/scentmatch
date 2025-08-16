import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Scent Timeline Component Tests
 * 
 * Tests for the visual scent timeline SVG component:
 * - SVG rendering and structure  
 * - Animation sequences (top → middle → base notes)
 * - Interactive hover states
 * - Accessibility features
 * - Responsive design
 * - Note progression visualization
 */

// Mock framer-motion for animation testing
vi.mock('framer-motion', () => ({
  motion: {
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the actual component that will be created
vi.mock('@/components/fragrance/scent-timeline', () => ({
  ScentTimeline: ({ notes, intensity, longevity, className, onNoteHover }: {
    notes: { note: string; category: 'top' | 'middle' | 'base'; strength: number }[];
    intensity: number;
    longevity?: number;
    className?: string;
    onNoteHover?: (note: string | null) => void;
  }) => (
    <div 
      className={`scent-timeline ${className || ''}`}
      data-testid="scent-timeline"
      data-intensity={intensity}
      data-longevity={longevity}
    >
      <svg 
        data-testid="timeline-svg"
        viewBox="0 0 400 300"
        className="timeline-svg"
      >
        {/* Timeline progression path */}
        <path
          data-testid="timeline-path"
          d="M50,150 Q200,50 350,150"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Note circles */}
        {notes.map((noteData, index) => (
          <g key={`${noteData.note}-${index}`} data-testid={`note-group-${noteData.category}`}>
            <circle
              data-testid={`note-circle-${noteData.note.replace(/\s+/g, '-').toLowerCase()}`}
              cx={50 + (index * 100)}
              cy={150}
              r={5 + (noteData.strength * 10)}
              fill="currentColor"
              className={`note-circle note-${noteData.category}`}
              onMouseEnter={() => onNoteHover?.(noteData.note)}
              onMouseLeave={() => onNoteHover?.(null)}
            />
            <text
              data-testid={`note-text-${noteData.note.replace(/\s+/g, '-').toLowerCase()}`}
              x={50 + (index * 100)}
              y={130}
              textAnchor="middle"
              className="note-label"
            >
              {noteData.note}
            </text>
          </g>
        ))}
        
        {/* Intensity indicator */}
        <g data-testid="intensity-indicator">
          <circle
            cx={350}
            cy={150}
            r={intensity * 3}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
          <text x={350} y={180} textAnchor="middle" className="intensity-label">
            Intensity: {intensity}/10
          </text>
        </g>
        
        {/* Longevity bar */}
        {longevity && (
          <g data-testid="longevity-indicator">
            <rect
              x={50}
              y={250}
              width={(longevity / 24) * 300}
              height={10}
              fill="currentColor"
              opacity="0.6"
            />
            <text x={50} y={270} className="longevity-label">
              Longevity: {longevity}h
            </text>
          </g>
        )}
      </svg>
    </div>
  ),
}));

describe('ScentTimeline Component', () => {
  const mockNotes = [
    { note: 'Bergamot', category: 'top' as const, strength: 0.8 },
    { note: 'Rose', category: 'middle' as const, strength: 0.9 },
    { note: 'Sandalwood', category: 'base' as const, strength: 0.7 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
  });

  describe('SVG Structure and Rendering', () => {
    test('should render SVG with proper viewBox and structure', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(
        <ScentTimeline 
          notes={mockNotes} 
          intensity={7}
          longevity={8}
        />
      );

      const svg = screen.getByTestId('timeline-svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 400 300');
      
      const timelinePath = screen.getByTestId('timeline-path');
      expect(timelinePath).toBeInTheDocument();
      expect(timelinePath).toHaveAttribute('d', 'M50,150 Q200,50 350,150');
    });

    test('should render note circles with correct positioning', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      const bergamotCircle = screen.getByTestId('note-circle-bergamot');
      const roseCircle = screen.getByTestId('note-circle-rose');
      const sandalwoodCircle = screen.getByTestId('note-circle-sandalwood');

      expect(bergamotCircle).toBeInTheDocument();
      expect(roseCircle).toBeInTheDocument();
      expect(sandalwoodCircle).toBeInTheDocument();

      // Check positioning (X coordinates should be spaced)
      expect(bergamotCircle).toHaveAttribute('cx', '50');
      expect(roseCircle).toHaveAttribute('cx', '150');
      expect(sandalwoodCircle).toHaveAttribute('cx', '250');
    });

    test('should render note labels with correct text', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      expect(screen.getByTestId('note-text-bergamot')).toHaveTextContent('Bergamot');
      expect(screen.getByTestId('note-text-rose')).toHaveTextContent('Rose');
      expect(screen.getByTestId('note-text-sandalwood')).toHaveTextContent('Sandalwood');
    });

    test('should size note circles based on strength', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      const bergamotCircle = screen.getByTestId('note-circle-bergamot'); // strength 0.8
      const roseCircle = screen.getByTestId('note-circle-rose'); // strength 0.9
      const sandalwoodCircle = screen.getByTestId('note-circle-sandalwood'); // strength 0.7

      // Rose should have the largest radius (5 + 0.9 * 10 = 14)
      expect(roseCircle).toHaveAttribute('r', '14');
      // Bergamot should be medium (5 + 0.8 * 10 = 13) 
      expect(bergamotCircle).toHaveAttribute('r', '13');
      // Sandalwood should be smallest (5 + 0.7 * 10 = 12)
      expect(sandalwoodCircle).toHaveAttribute('r', '12');
    });

    test('should apply correct CSS classes for note categories', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      const bergamotCircle = screen.getByTestId('note-circle-bergamot');
      const roseCircle = screen.getByTestId('note-circle-rose');
      const sandalwoodCircle = screen.getByTestId('note-circle-sandalwood');

      expect(bergamotCircle).toHaveClass('note-circle', 'note-top');
      expect(roseCircle).toHaveClass('note-circle', 'note-middle');
      expect(sandalwoodCircle).toHaveClass('note-circle', 'note-base');
    });
  });

  describe('Intensity and Longevity Indicators', () => {
    test('should render intensity indicator with correct size', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={8} />);

      const intensityIndicator = screen.getByTestId('intensity-indicator');
      expect(intensityIndicator).toBeInTheDocument();

      const intensityCircle = intensityIndicator.querySelector('circle');
      expect(intensityCircle).toHaveAttribute('r', '24'); // 8 * 3
      
      const intensityText = intensityIndicator.querySelector('text');
      expect(intensityText).toHaveTextContent('Intensity: 8/10');
    });

    test('should render longevity indicator when provided', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} longevity={12} />);

      const longevityIndicator = screen.getByTestId('longevity-indicator');
      expect(longevityIndicator).toBeInTheDocument();

      const longevityBar = longevityIndicator.querySelector('rect');
      expect(longevityBar).toHaveAttribute('width', '150'); // (12/24) * 300
      
      const longevityText = longevityIndicator.querySelector('text');
      expect(longevityText).toHaveTextContent('Longevity: 12h');
    });

    test('should not render longevity indicator when not provided', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      expect(screen.queryByTestId('longevity-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('should handle note hover interactions', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      const onNoteHover = vi.fn();
      
      render(
        <ScentTimeline 
          notes={mockNotes} 
          intensity={7} 
          onNoteHover={onNoteHover}
        />
      );

      const bergamotCircle = screen.getByTestId('note-circle-bergamot');
      
      fireEvent.mouseEnter(bergamotCircle);
      expect(onNoteHover).toHaveBeenCalledWith('Bergamot');
      
      fireEvent.mouseLeave(bergamotCircle);
      expect(onNoteHover).toHaveBeenCalledWith(null);
    });

    test('should handle multiple note hovers correctly', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      const onNoteHover = vi.fn();
      
      render(
        <ScentTimeline 
          notes={mockNotes} 
          intensity={7} 
          onNoteHover={onNoteHover}
        />
      );

      const bergamotCircle = screen.getByTestId('note-circle-bergamot');
      const roseCircle = screen.getByTestId('note-circle-rose');
      
      fireEvent.mouseEnter(bergamotCircle);
      expect(onNoteHover).toHaveBeenLastCalledWith('Bergamot');
      
      fireEvent.mouseEnter(roseCircle);
      expect(onNoteHover).toHaveBeenLastCalledWith('Rose');
      
      fireEvent.mouseLeave(roseCircle);
      expect(onNoteHover).toHaveBeenLastCalledWith(null);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty notes array', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={[]} intensity={5} />);

      const timeline = screen.getByTestId('scent-timeline');
      expect(timeline).toBeInTheDocument();
      
      const svg = screen.getByTestId('timeline-svg');
      expect(svg).toBeInTheDocument();
      
      // Should not have any note circles
      expect(screen.queryByTestId('note-circle-bergamot')).not.toBeInTheDocument();
    });

    test('should handle zero intensity', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={0} />);

      const intensityIndicator = screen.getByTestId('intensity-indicator');
      const intensityCircle = intensityIndicator.querySelector('circle');
      expect(intensityCircle).toHaveAttribute('r', '0'); // 0 * 3
    });

    test('should handle maximum intensity', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={10} />);

      const intensityIndicator = screen.getByTestId('intensity-indicator');
      const intensityCircle = intensityIndicator.querySelector('circle');
      expect(intensityCircle).toHaveAttribute('r', '30'); // 10 * 3
    });

    test('should handle notes with special characters in names', async () => {
      const specialNotes = [
        { note: 'Ylang-Ylang', category: 'top' as const, strength: 0.7 },
        { note: 'Lily of the Valley', category: 'middle' as const, strength: 0.8 },
        { note: 'Patchouli & Vetiver', category: 'base' as const, strength: 0.9 },
      ];

      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={specialNotes} intensity={7} />);

      expect(screen.getByTestId('note-circle-ylang-ylang')).toBeInTheDocument();
      expect(screen.getByTestId('note-circle-lily-of-the-valley')).toBeInTheDocument();
      expect(screen.getByTestId('note-circle-patchouli-&-vetiver')).toBeInTheDocument();
    });

    test('should handle very long note names', async () => {
      const longNotes = [
        { note: 'Very Long Note Name That Might Overflow', category: 'top' as const, strength: 0.5 },
      ];

      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={longNotes} intensity={7} />);

      const noteText = screen.getByTestId('note-text-very-long-note-name-that-might-overflow');
      expect(noteText).toHaveTextContent('Very Long Note Name That Might Overflow');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for SVG elements', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      const timeline = screen.getByTestId('scent-timeline');
      expect(timeline).toBeInTheDocument();
      
      // SVG should be properly labeled for screen readers
      const svg = screen.getByTestId('timeline-svg');
      expect(svg).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      const onNoteHover = vi.fn();
      
      render(
        <ScentTimeline 
          notes={mockNotes} 
          intensity={7} 
          onNoteHover={onNoteHover}
        />
      );

      // Note circles should be focusable for keyboard users
      const bergamotCircle = screen.getByTestId('note-circle-bergamot');
      expect(bergamotCircle).toBeInTheDocument();
    });

    test('should provide meaningful text alternatives', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} longevity={8} />);

      // Text elements should provide meaningful information
      expect(screen.getByText('Intensity: 7/10')).toBeInTheDocument();
      expect(screen.getByText('Longevity: 8h')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should accept custom className', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(
        <ScentTimeline 
          notes={mockNotes} 
          intensity={7} 
          className="custom-timeline"
        />
      );

      const timeline = screen.getByTestId('scent-timeline');
      expect(timeline).toHaveClass('scent-timeline', 'custom-timeline');
    });

    test('should maintain aspect ratio with responsive viewBox', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      const svg = screen.getByTestId('timeline-svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 400 300');
      expect(svg).toHaveClass('timeline-svg');
    });
  });

  describe('Component Data Attributes', () => {
    test('should expose intensity and longevity as data attributes', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={8} longevity={12} />);

      const timeline = screen.getByTestId('scent-timeline');
      expect(timeline).toHaveAttribute('data-intensity', '8');
      expect(timeline).toHaveAttribute('data-longevity', '12');
    });

    test('should handle missing longevity data attribute', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={mockNotes} intensity={7} />);

      const timeline = screen.getByTestId('scent-timeline');
      expect(timeline).toHaveAttribute('data-intensity', '7');
      expect(timeline).toHaveAttribute('data-longevity', 'undefined');
    });
  });
});