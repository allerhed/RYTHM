/**
 * PullToRefresh Component
 * 
 * A reusable pull-to-refresh component for mobile pages that provides
 * native-like pull-to-refresh functionality with visual feedback.
 * 
 * Usage:
 * ```tsx
 * <PullToRefresh onRefresh={async () => { await refetchData() }}>
 *   <YourPageContent />
 * </PullToRefresh>
 * ```
 * 
 * Features:
 * - Touch-based pull detection with visual feedback
 * - Spinner animation during refresh
 * - Configurable trigger threshold (default 80px)
 * - Smooth animations and transitions
 */

'use client'
import React, { useState, useRef, useCallback, ReactNode } from 'react'

interface PullToRefreshProps {
  /** Content to render inside the pull-to-refresh container */
  children: ReactNode
  /** Async callback function triggered when user pulls to refresh */
  onRefresh: () => Promise<void>
  /** Distance in pixels user must pull down to trigger refresh (default: 80) */
  threshold?: number
  /** Custom spinner color (default: '#3B82F6' - blue-600) */
  spinnerColor?: string
  /** Whether the component is disabled (default: false) */
  disabled?: boolean
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80,
  spinnerColor = '#3B82F6',
  disabled = false
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReleased, setIsReleased] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    // Only start pull if at the top of the page
    const container = containerRef.current
    if (container && container.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY.current)
    
    // Apply resistance as user pulls further
    const resistance = 0.5
    const adjustedDistance = Math.min(distance * resistance, threshold * 1.5)
    
    setPullDistance(adjustedDistance)
  }, [disabled, isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled || isRefreshing) return
    
    isPulling.current = false
    
    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsReleased(true)
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Pull to refresh error:', error)
      } finally {
        setIsRefreshing(false)
        setIsReleased(false)
        setPullDistance(0)
      }
    } else {
      // Reset without refresh
      setPullDistance(0)
    }
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh])

  const spinnerOpacity = Math.min(pullDistance / threshold, 1)
  const spinnerRotation = (pullDistance / threshold) * 360

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto h-full touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-300 ease-out"
        style={{
          height: isRefreshing || isReleased ? `${threshold}px` : `${pullDistance}px`,
          opacity: spinnerOpacity,
        }}
      >
        {(pullDistance > 0 || isRefreshing) && (
          <div className="flex flex-col items-center gap-2">
            {/* Spinner */}
            <div
              className="w-8 h-8 border-3 border-t-transparent rounded-full transition-transform duration-200"
              style={{
                borderColor: `${spinnerColor} transparent transparent transparent`,
                transform: isRefreshing 
                  ? 'rotate(0deg)' 
                  : `rotate(${spinnerRotation}deg)`,
                animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
            
            {/* Text feedback */}
            <span className="text-xs font-medium text-text-secondary">
              {isRefreshing 
                ? 'Refreshing...' 
                : pullDistance >= threshold 
                  ? 'Release to refresh' 
                  : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>

      {/* Page content */}
      {children}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
