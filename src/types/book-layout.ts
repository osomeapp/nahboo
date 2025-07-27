// Type definitions for horizontal book-like layout system

import type { FeedItem } from './index'

// Individual page in the book-like layout
export interface BookPage {
  id: string
  pageNumber: number
  items: FeedItem[]                    // 1-3 items per page
  hasVideo: boolean                    // Affects page layout
  hasInteractive: boolean              // Quiz, AI lesson, etc.
  estimatedReadTime: number            // In seconds
  layout: 'single' | 'dual' | 'triple' // Number of items on page
}

// Page transition animations
export type PageTransition = 'slide' | 'fade' | 'flip' | 'none'

// Navigation direction
export type NavigationDirection = 'previous' | 'next'

// Page layout configuration
export interface BookLayoutConfig {
  itemsPerPage: number                 // 1-3 items per page
  transition: PageTransition           // Animation type
  autoAdvanceTime?: number             // Auto-advance in seconds (optional)
  snapToPages: boolean                 // Use CSS scroll snap
  showPageIndicators: boolean          // Show dots/numbers
  enableKeyboardNav: boolean           // Arrow keys, space bar
  enableSwipeGestures: boolean         // Touch/mouse swipe
  preloadPages: number                 // Pages to preload ahead
}

// Default configuration for different device types
export const defaultBookConfigs = {
  desktop: {
    itemsPerPage: 2,
    transition: 'slide' as PageTransition,
    snapToPages: true,
    showPageIndicators: true,
    enableKeyboardNav: true,
    enableSwipeGestures: false,
    preloadPages: 2
  },
  tablet: {
    itemsPerPage: 1,
    transition: 'slide' as PageTransition,
    snapToPages: true,
    showPageIndicators: true,
    enableKeyboardNav: false,
    enableSwipeGestures: true,
    preloadPages: 1
  },
  mobile: {
    itemsPerPage: 1,
    transition: 'slide' as PageTransition,
    snapToPages: true,
    showPageIndicators: false,
    enableKeyboardNav: false,
    enableSwipeGestures: true,
    preloadPages: 1
  }
} as const

// Page content analysis for optimal layout
export interface ContentAnalysis {
  hasLongText: boolean                 // > 200 words
  hasVideo: boolean
  hasInteractive: boolean              // Quiz, AI lesson
  hasLink: boolean
  estimatedReadTime: number            // Seconds
  complexity: 'simple' | 'medium' | 'complex'
}

// Content chunking algorithm result
export interface ChunkingResult {
  pages: BookPage[]
  totalPages: number
  avgItemsPerPage: number
  avgReadTime: number
}

// Page navigation state
export interface BookNavigationState {
  currentPage: number
  totalPages: number
  isFirstPage: boolean
  isLastPage: boolean
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  progress: number                     // 0-100 percentage
}

// Touch/swipe gesture data
export interface SwipeGesture {
  startX: number
  startY: number
  endX: number
  endY: number
  deltaX: number
  deltaY: number
  duration: number                     // milliseconds
  velocity: number                     // pixels per second
  direction: 'left' | 'right' | 'up' | 'down' | 'none'
  isHorizontal: boolean
  threshold: number                    // minimum distance for swipe
}

// Keyboard navigation mapping
export interface KeyboardNavigation {
  previousKeys: string[]               // ['ArrowLeft', 'ArrowUp', 'PageUp']
  nextKeys: string[]                   // ['ArrowRight', 'ArrowDown', 'PageDown', 'Space']
  homeKeys: string[]                   // ['Home']
  endKeys: string[]                    // ['End']
  enabled: boolean
}

// Page preloading strategy
export interface PreloadStrategy {
  enabled: boolean
  pagesAhead: number                   // Pages to preload forward
  pagesBehind: number                  // Pages to keep loaded behind
  unloadThreshold: number              // Unload pages beyond this distance
  prioritizeMedia: boolean             // Preload videos/images first
}

// Performance metrics for optimization
export interface PerformanceMetrics {
  pageLoadTime: number                 // milliseconds
  transitionDuration: number           // milliseconds
  memoryUsage: number                  // MB estimate
  renderTime: number                   // milliseconds
  interactionDelay: number             // milliseconds from input to response
}

// Responsive breakpoints for layout adaptation
export const bookLayoutBreakpoints = {
  mobile: 768,                         // px
  tablet: 1024,                        // px
  desktop: 1200                        // px
} as const

export type DeviceType = keyof typeof bookLayoutBreakpoints

// Content item positioning within a page
export interface ItemPosition {
  itemId: string
  x: number                           // 0-100 percentage
  y: number                           // 0-100 percentage
  width: number                       // 0-100 percentage
  height: number                      // 0-100 percentage
  zIndex: number
}