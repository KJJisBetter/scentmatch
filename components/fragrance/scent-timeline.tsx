'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { InteractionTracker } from './interaction-tracker';
import { cn } from '@/lib/utils';

interface NoteData {
  note: string;
  category: 'top' | 'middle' | 'base';
  strength: number; // 0-1 scale
}

interface ScentTimelineProps {
  notes: NoteData[];
  intensity: number; // 1-10 scale
  longevity?: number; // hours
  className?: string;
  onNoteHover?: (note: string | null) => void;
  animated?: boolean;
}

/**
 * ScentTimeline Component
 * 
 * Visual SVG-based representation of fragrance progression over time
 * Features:
 * - Animated scent evolution from top → middle → base notes
 * - Interactive hover states with note information
 * - Accessibility-first design with screen reader support
 * - Responsive SVG that scales across device sizes
 * - Performance-optimized animations using CSS transforms
 */
export function ScentTimeline({
  notes,
  intensity,
  longevity,
  className,
  onNoteHover,
  animated = true,
}: ScentTimelineProps) {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0); // 0: initial, 1: top, 2: middle, 3: base
  const svgRef = useRef<SVGSVGElement>(null);
  const [trackInteraction, setTrackInteraction] = useState<{
    type: string;
    context: string;
    metadata?: any;
  } | null>(null);

  // Animation sequence effect
  useEffect(() => {
    if (!animated || notes.length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];

    // Animate through phases: top notes → middle notes → base notes
    timeouts.push(setTimeout(() => setAnimationPhase(1), 500));   // Top notes at 0.5s
    timeouts.push(setTimeout(() => setAnimationPhase(2), 2000));  // Middle notes at 2s
    timeouts.push(setTimeout(() => setAnimationPhase(3), 4000));  // Base notes at 4s

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [animated, notes.length]);

  const handleNoteInteraction = (note: string, action: 'hover' | 'click') => {
    if (action === 'hover') {
      setHoveredNote(note);
      onNoteHover?.(note);
    } else if (action === 'click') {
      // Track note interest
      setTrackInteraction({
        type: 'like',
        context: 'scent_timeline',
        metadata: { note, category: notes.find(n => n.note === note)?.category },
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredNote(null);
    onNoteHover?.(null);
  };

  // Categorize notes for positioning
  const topNotes = notes.filter(n => n.category === 'top');
  const middleNotes = notes.filter(n => n.category === 'middle');
  const baseNotes = notes.filter(n => n.category === 'base');

  // Calculate timeline positions
  const timelineWidth = 320;
  const timelineHeight = 160;
  const centerY = timelineHeight / 2;

  // Timeline curve path (represents scent evolution over time)
  const timelinePath = `M 40,${centerY} Q 160,40 280,${centerY}`;

  // Calculate note positions along timeline
  const getNotePosition = (category: 'top' | 'middle' | 'base', index: number, total: number) => {
    const baseX = category === 'top' ? 60 : category === 'middle' ? 160 : 260;
    const spreadX = category === 'middle' ? 40 : 20;
    const offsetX = total > 1 ? (index - (total - 1) / 2) * (spreadX / total) : 0;
    
    const baseY = category === 'top' ? centerY - 20 : category === 'middle' ? centerY - 40 : centerY - 20;
    const offsetY = total > 1 ? (index % 2) * 15 - 7 : 0;

    return { x: baseX + offsetX, y: baseY + offsetY };
  };

  return (
    <>
      {trackInteraction && (
        <InteractionTracker
          fragranceId=""
          interactionType={trackInteraction.type as any}
          interactionContext={trackInteraction.context}
          metadata={trackInteraction.metadata}
        />
      )}
      
      <div
        className={cn('scent-timeline relative', className)}
        data-testid="scent-timeline"
        data-intensity={intensity}
        data-longevity={longevity}
      >
        {/* Main SVG Timeline */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${timelineWidth} ${timelineHeight + 60}`}
          className="w-full h-auto max-h-48"
          data-testid="timeline-svg"
          role="img"
          aria-label={`Fragrance scent timeline showing evolution from top notes through middle to base notes`}
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(139, 69, 19)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(101, 163, 13)" stopOpacity="0.3" />
            </linearGradient>
            
            <filter id="dropShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Background Timeline Path */}
          <path
            d={timelinePath}
            fill="none"
            stroke="url(#timelineGradient)"
            strokeWidth="3"
            opacity="0.6"
            data-testid="timeline-path"
          />

          {/* Time Phase Indicators */}
          <g className="phase-indicators">
            <text x="60" y={timelineHeight + 25} textAnchor="middle" className="text-xs fill-muted-foreground">
              0-15min
            </text>
            <text x="160" y={timelineHeight + 25} textAnchor="middle" className="text-xs fill-muted-foreground">
              15min-2h
            </text>
            <text x="260" y={timelineHeight + 25} textAnchor="middle" className="text-xs fill-muted-foreground">
              2h+
            </text>
          </g>

          {/* Category Labels */}
          <g className="category-labels">
            <text x="60" y={timelineHeight + 40} textAnchor="middle" className="text-xs font-medium fill-amber-600">
              Top Notes
            </text>
            <text x="160" y={timelineHeight + 40} textAnchor="middle" className="text-xs font-medium fill-rose-600">
              Heart Notes
            </text>
            <text x="260" y={timelineHeight + 40} textAnchor="middle" className="text-xs font-medium fill-green-600">
              Base Notes
            </text>
          </g>

          {/* Note Circles and Labels */}
          {notes.map((noteData, globalIndex) => {
            const categoryNotes = notes.filter(n => n.category === noteData.category);
            const categoryIndex = categoryNotes.findIndex(n => n.note === noteData.note);
            const position = getNotePosition(noteData.category, categoryIndex, categoryNotes.length);
            
            const radius = 4 + (noteData.strength * 8); // 4-12px radius based on strength
            const isHovered = hoveredNote === noteData.note;
            const shouldAnimate = animated && (
              (animationPhase >= 1 && noteData.category === 'top') ||
              (animationPhase >= 2 && noteData.category === 'middle') ||
              (animationPhase >= 3 && noteData.category === 'base')
            );

            const categoryColor = {
              top: 'rgb(251, 191, 36)', // amber
              middle: 'rgb(244, 63, 94)', // rose  
              base: 'rgb(34, 197, 94)', // green
            };

            return (
              <g
                key={`${noteData.note}-${globalIndex}`}
                data-testid={`note-group-${noteData.category}`}
                className="note-group"
              >
                {/* Note Circle */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={radius}
                  fill={categoryColor[noteData.category]}
                  stroke="white"
                  strokeWidth="1"
                  filter="url(#dropShadow)"
                  className={cn(
                    'cursor-pointer transition-all duration-300',
                    isHovered && 'stroke-2',
                    shouldAnimate && 'animate-pulse',
                  )}
                  style={{
                    opacity: shouldAnimate ? 1 : 0.6,
                    transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                    transformOrigin: `${position.x}px ${position.y}px`,
                  }}
                  onMouseEnter={() => handleNoteInteraction(noteData.note, 'hover')}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleNoteInteraction(noteData.note, 'click')}
                  data-testid={`note-circle-${noteData.note.replace(/\s+/g, '-').toLowerCase()}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${noteData.note} note - ${noteData.category} category, strength ${Math.round(noteData.strength * 100)}%`}
                />

                {/* Note Label */}
                <text
                  x={position.x}
                  y={position.y - radius - 8}
                  textAnchor="middle"
                  className={cn(
                    'text-xs font-medium pointer-events-none transition-opacity duration-200',
                    isHovered ? 'fill-foreground opacity-100' : 'fill-muted-foreground opacity-70'
                  )}
                  data-testid={`note-text-${noteData.note.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {noteData.note}
                </text>

                {/* Strength Indicator (when hovered) */}
                {isHovered && (
                  <text
                    x={position.x}
                    y={position.y + radius + 15}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {Math.round(noteData.strength * 100)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Intensity Indicator */}
          <g data-testid="intensity-indicator" className="intensity-indicator">
            <circle
              cx={280}
              cy={centerY}
              r={Math.max(10, intensity * 2)}
              fill="none"
              stroke="rgb(168, 85, 247)"
              strokeWidth="2"
              strokeDasharray="4,2"
              opacity="0.7"
              className={animated ? 'animate-pulse' : ''}
            />
            <text
              x={280}
              y={centerY + 5}
              textAnchor="middle"
              className="text-xs font-bold fill-purple-600"
            >
              {intensity}
            </text>
          </g>

          {/* Longevity Bar */}
          {longevity && (
            <g data-testid="longevity-indicator" className="longevity-indicator">
              <rect
                x="40"
                y={timelineHeight - 15}
                width={(longevity / 24) * 240} // Scale to 24 hours max
                height="6"
                fill="rgb(59, 130, 246)"
                opacity="0.6"
                rx="3"
                className={animated ? 'animate-pulse' : ''}
              />
              <text
                x="40"
                y={timelineHeight + 5}
                className="text-xs fill-blue-600 font-medium"
              >
                {longevity}h duration
              </text>
            </g>
          )}
        </svg>

        {/* Interactive Note Information Panel */}
        {hoveredNote && (
          <div
            className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-10 max-w-64"
            data-testid="note-info-panel"
          >
            <h4 className="font-medium text-foreground mb-1">{hoveredNote}</h4>
            <p className="text-xs text-muted-foreground">
              {getFragranceNoteDescription(hoveredNote)}
            </p>
            
            {/* Note Category Badge */}
            <Badge 
              variant="note" 
              className="mt-2 text-xs"
            >
              {notes.find(n => n.note === hoveredNote)?.category} note
            </Badge>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Top Notes (immediate)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <span>Heart Notes (15min-2h)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span>Base Notes (2h+)</span>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Get descriptive information about fragrance notes
 * In a real implementation, this would come from a database of note descriptions
 */
function getFragranceNoteDescription(note: string): string {
  const descriptions: Record<string, string> = {
    'bergamot': 'Bright, citrusy, and uplifting with a fresh Earl Grey tea-like quality',
    'rose': 'Classic floral heart note, romantic and timeless with velvety petals',
    'sandalwood': 'Creamy, warm wood base note that adds depth and sensuality',
    'vanilla': 'Sweet, creamy, and comforting base note that adds warmth',
    'jasmine': 'Intoxicating white floral, rich and narcotic in quality',
    'patchouli': 'Earthy, rich base note with hippie-chic associations',
    'amber': 'Warm, resinous base note that adds golden richness',
    'musk': 'Clean, skin-like base note that adds intimate warmth',
    'cedar': 'Dry, woody base note that adds structure and masculinity',
    'lavender': 'Calming, herbaceous note with spa-like associations',
    'lemon': 'Bright, zesty citrus top note that energizes',
    'geranium': 'Green, slightly rosy note with minty undertones',
    // Add more as needed
  };

  return descriptions[note.toLowerCase()] || 
    'A distinctive fragrance note that contributes to this scent\'s unique character.';
}

// Skeleton loader for Suspense boundaries
export function ScentTimelineSkeleton() {
  return (
    <div className="space-y-4">
      <div className="w-full h-40 bg-muted animate-pulse rounded-lg" />
      <div className="flex justify-center space-x-4">
        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}