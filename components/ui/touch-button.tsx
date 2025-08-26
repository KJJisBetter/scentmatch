/**
 * Touch-Optimized Button Component - Task 2.3
 * 
 * A button component specifically designed for mobile touch interactions:
 * - Guaranteed 44px minimum touch target
 * - Touch feedback animations
 * - Haptic feedback support
 * - One-handed use optimization
 * - System gesture conflict prevention
 * - WCAG 2.1 AA compliance
 */
'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useTouchOptimization } from '@/hooks/use-touch-optimization'

const touchButtonVariants = cva(
  // Base classes with touch optimization
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target touch-feedback',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/20',
        link: 'text-primary underline-offset-4 hover:underline active:text-primary/80',
      },
      size: {
        default: 'h-11 px-4 py-2', // 44px minimum height
        sm: 'h-11 rounded-md px-3 text-xs', // Still 44px for touch
        lg: 'h-12 rounded-md px-8', // 48px for larger screens
        xl: 'h-14 rounded-md px-10 text-base', // 56px for primary actions
        icon: 'h-11 w-11', // Square 44px touch target
      },
      touchSize: {
        auto: '', // Use size variant
        mobile: 'min-h-[44px] min-w-[44px]', // Force minimum touch target
        tablet: 'min-h-[48px] min-w-[48px]', // Larger for tablets
        desktop: '', // No minimum override for desktop
      },
      feedback: {
        subtle: 'hover:bg-accent/10 active:bg-accent/20',
        medium: 'hover:scale-[1.02] active:scale-[0.98]',
        strong: 'hover:scale-[1.05] active:scale-[0.95] hover:shadow-lg',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      touchSize: 'auto',
      feedback: 'medium',
    },
  }
)

export interface TouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchButtonVariants> {
  asChild?: boolean
  hapticFeedback?: 'light' | 'medium' | 'heavy'
  preventSystemGestures?: boolean
  optimizeForOneHand?: boolean
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    touchSize,
    feedback,
    hapticFeedback = 'light',
    preventSystemGestures = false,
    optimizeForOneHand = true,
    asChild = false, 
    onClick,
    ...props 
  }, ref) => {
    const { 
      createTouchHandler, 
      getTouchClasses,
      touchMetrics,
      shouldOptimizeForTouch 
    } = useTouchOptimization({
      enableHaptics: !!hapticFeedback,
      preventSystemGestures,
      optimizeForOneHand
    })

    // Determine appropriate touch size based on device
    const effectiveTouchSize = React.useMemo(() => {
      if (touchSize !== 'auto') return touchSize
      
      if (touchMetrics.isMobile && touchMetrics.isLargeScreen) return 'tablet'
      if (touchMetrics.isMobile) return 'mobile'
      return 'desktop'
    }, [touchSize, touchMetrics])

    // Enhanced click handler with touch optimization
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (shouldOptimizeForTouch) {
        const touchHandler = createTouchHandler(
          () => onClick?.(event),
          {
            hapticFeedback,
            preventDefault: false, // Don't prevent default for buttons
            stopPropagation: false
          }
        )
        touchHandler(event)
      } else {
        onClick?.(event)
      }
    }, [onClick, createTouchHandler, hapticFeedback, shouldOptimizeForTouch])

    const Comp = asChild ? Slot : 'button'
    
    // Build optimized class names
    const buttonClasses = cn(
      touchButtonVariants({ 
        variant, 
        size, 
        touchSize: effectiveTouchSize,
        feedback: shouldOptimizeForTouch ? feedback : undefined,
        className 
      }),
      getTouchClasses(),
      {
        // Add thumb-friendly positioning for one-handed use
        'self-start': optimizeForOneHand && touchMetrics.isOneHandedMode && touchMetrics.preferredThumbZone === 'left',
        'self-end': optimizeForOneHand && touchMetrics.isOneHandedMode && touchMetrics.preferredThumbZone === 'right',
      }
    )

    return (
      <Comp
        className={buttonClasses}
        ref={ref}
        onClick={handleClick}
        // Accessibility enhancements for touch
        role="button"
        tabIndex={props.disabled ? -1 : 0}
        aria-pressed={variant === 'default' ? 'false' : undefined}
        {...props}
      />
    )
  }
)

TouchButton.displayName = 'TouchButton'

// Pre-configured variants for common use cases
export const PrimaryTouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  (props, ref) => (
    <TouchButton
      ref={ref}
      variant="default"
      size="lg"
      hapticFeedback="medium"
      feedback="strong"
      {...props}
    />
  )
)
PrimaryTouchButton.displayName = 'PrimaryTouchButton'

export const QuizOptionButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  (props, ref) => (
    <TouchButton
      ref={ref}
      variant="outline"
      size="xl"
      hapticFeedback="light"
      feedback="medium"
      className="w-full p-4 text-left justify-start"
      {...props}
    />
  )
)
QuizOptionButton.displayName = 'QuizOptionButton'

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  (props, ref) => (
    <TouchButton
      ref={ref}
      variant="default"
      size="icon"
      touchSize="tablet"
      hapticFeedback="medium"
      feedback="strong"
      className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
      {...props}
    />
  )
)
FloatingActionButton.displayName = 'FloatingActionButton'

export { TouchButton, touchButtonVariants }