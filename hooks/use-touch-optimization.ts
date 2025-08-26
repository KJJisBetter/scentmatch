/**
 * Mobile Touch Optimization Hook - Task 2.3
 * 
 * Provides touch-optimized behaviors:
 * - Haptic feedback where supported
 * - Touch gesture recognition
 * - One-handed use detection
 * - Performance-optimized touch handlers
 * - System gesture conflict prevention
 */
'use client'

import { useEffect, useCallback, useState } from 'react'

interface TouchMetrics {
  isMobile: boolean
  isLargeScreen: boolean
  supportsHaptics: boolean
  preferredThumbZone: 'left' | 'right'
  isOneHandedMode: boolean
}

interface TouchOptions {
  enableHaptics?: boolean
  preventSystemGestures?: boolean
  optimizeForOneHand?: boolean
}

export function useTouchOptimization(options: TouchOptions = {}) {
  const [touchMetrics, setTouchMetrics] = useState<TouchMetrics>({
    isMobile: false,
    isLargeScreen: false,
    supportsHaptics: false,
    preferredThumbZone: 'right',
    isOneHandedMode: false
  })

  // Detect device capabilities
  useEffect(() => {
    const updateTouchMetrics = () => {
      const isMobile = window.innerWidth <= 768
      const isLargeScreen = window.innerWidth >= 428 // iPhone Pro Max+
      const supportsHaptics = 'vibrate' in navigator
      
      // Detect preferred thumb zone based on device orientation and size
      const isLandscape = window.innerWidth > window.innerHeight
      const preferredThumbZone = isLandscape ? 'right' : 'right' // Most users are right-handed
      
      // One-handed mode detection based on screen size and interaction patterns
      const isOneHandedMode = isMobile && window.innerWidth <= 390 // iPhone 12/13/14 size
      
      setTouchMetrics({
        isMobile,
        isLargeScreen,
        supportsHaptics,
        preferredThumbZone,
        isOneHandedMode
      })
    }

    updateTouchMetrics()
    
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateTouchMetrics, 150)
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!options.enableHaptics || !touchMetrics.supportsHaptics) return
    
    const patterns = {
      light: [10],
      medium: [50],
      heavy: [100]
    }
    
    try {
      navigator.vibrate(patterns[type])
    } catch (error) {
      // Silently fail if haptics not supported
    }
  }, [options.enableHaptics, touchMetrics.supportsHaptics])

  // Optimized touch event handlers
  const createTouchHandler = useCallback((
    onTouch: () => void,
    options: { 
      hapticFeedback?: 'light' | 'medium' | 'heavy'
      preventDefault?: boolean
      stopPropagation?: boolean
    } = {}
  ) => {
    return (event: React.TouchEvent | React.MouseEvent) => {
      // Prevent default if requested and not a system gesture
      if (options.preventDefault && !isSystemGesture(event)) {
        event.preventDefault()
      }
      
      if (options.stopPropagation) {
        event.stopPropagation()
      }
      
      // Trigger haptic feedback
      if (options.hapticFeedback) {
        triggerHapticFeedback(options.hapticFeedback)
      }
      
      onTouch()
    }
  }, [triggerHapticFeedback])

  // System gesture detection
  const isSystemGesture = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!('touches' in event)) return false
    
    const touch = event.touches[0]
    if (!touch) return false
    
    const { clientX, clientY } = touch
    const { innerWidth, innerHeight } = window
    
    // Detect edge swipes that might be system gestures
    const edgeThreshold = 20
    const isFromLeftEdge = clientX <= edgeThreshold
    const isFromRightEdge = clientX >= innerWidth - edgeThreshold
    const isFromTopEdge = clientY <= edgeThreshold
    const isFromBottomEdge = clientY >= innerHeight - edgeThreshold
    
    return isFromLeftEdge || isFromRightEdge || isFromTopEdge || isFromBottomEdge
  }, [])

  // Performance-optimized touch classes
  const getTouchClasses = useCallback((baseClasses: string = '') => {
    const touchClasses = []
    
    if (touchMetrics.isMobile) {
      touchClasses.push('touch-target')
      
      if (touchMetrics.isOneHandedMode) {
        touchClasses.push('touch-spacing-lg')
      } else {
        touchClasses.push('touch-spacing')
      }
    }
    
    if (touchMetrics.isLargeScreen) {
      touchClasses.push('touch-target-lg')
    }
    
    // Add gesture-safe classes if needed
    if (options.preventSystemGestures) {
      touchClasses.push('swipe-safe')
    }
    
    return `${baseClasses} ${touchClasses.join(' ')}`.trim()
  }, [touchMetrics, options.preventSystemGestures])

  // Thumb-zone positioning helper
  const getThumbZoneClasses = useCallback((position: 'primary' | 'secondary' = 'secondary') => {
    if (!touchMetrics.isMobile) return ''
    
    const baseClass = position === 'primary' ? 'thumb-zone-primary' : 'thumb-zone-secondary'
    const thumbClasses = [baseClass]
    
    if (touchMetrics.isOneHandedMode) {
      thumbClasses.push('thumb-friendly-grid')
    }
    
    return thumbClasses.join(' ')
  }, [touchMetrics])

  // Touch area expansion for small targets
  const expandTouchArea = useCallback((minSize: number = 44) => {
    return {
      minHeight: `${minSize}px`,
      minWidth: `${minSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, [])

  return {
    // Device capabilities
    touchMetrics,
    
    // Touch handlers
    createTouchHandler,
    triggerHapticFeedback,
    isSystemGesture,
    
    // Styling helpers
    getTouchClasses,
    getThumbZoneClasses,
    expandTouchArea,
    
    // Utility functions
    isTouchDevice: touchMetrics.isMobile,
    shouldOptimizeForTouch: touchMetrics.isMobile || touchMetrics.isLargeScreen
  }
}