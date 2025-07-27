'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen, MoreHorizontal } from 'lucide-react'
import { useBrowserCapabilities } from '@/lib/browser-capabilities'
import { 
  chunkContentIntoPages, 
  getDeviceType, 
  preprocessFeedItems,
  analyzeChunkingResults 
} from '@/lib/content-chunking'
import { 
  useResponsiveLayout,
  generateResponsiveCSSProperties,
  optimizeLayoutForContent,
  getResponsiveMediaSizes
} from '@/lib/responsive-layout'
import { defaultBookConfigs } from '@/types/book-layout'
import BookPage from './BookPage'
import BookNavigation from './BookNavigation'
import PerformanceMonitor, { usePerformanceOptimization } from './PerformanceMonitor'
import { runPerformanceTest, generateLargeContentSet, logPerformanceResults } from '@/lib/performance-test'
import type { FeedItem } from '@/types'
import type { 
  BookPage as BookPageType, 
  BookLayoutConfig, 
  BookNavigationState,
  DeviceType 
} from '@/types/book-layout'

interface HorizontalBookFeedProps {
  feedItems: FeedItem[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onInteraction?: (contentId: string, action: string, value?: unknown) => void
}

export default function HorizontalBookFeed({
  feedItems,
  isLoading = false,
  hasMore = true,
  onLoadMore,
  onInteraction
}: HorizontalBookFeedProps) {
  const capabilities = useBrowserCapabilities()
  const { characteristics, config: responsiveConfig, cssProperties } = useResponsiveLayout()
  const containerRef = useRef<HTMLDivElement>(null)
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [config, setConfig] = useState<BookLayoutConfig>(defaultBookConfigs.desktop)
  const [isResponsiveMode, setIsResponsiveMode] = useState(true)
  const [isPerformanceTestMode, setIsPerformanceTestMode] = useState(false)
  const { shouldOptimize, optimizations, handlePerformanceChange } = usePerformanceOptimization()
  const [pages, setPages] = useState<BookPageType[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [navigationState, setNavigationState] = useState<BookNavigationState>({
    currentPage: 1,
    totalPages: 0,
    isFirstPage: true,
    isLastPage: false,
    canNavigatePrevious: false,
    canNavigateNext: false,
    progress: 0
  })

  // Detect device type and update configuration with responsive enhancements
  useEffect(() => {
    const handleResize = () => {
      const newDeviceType = getDeviceType()
      setDeviceType(newDeviceType)
      
      if (isResponsiveMode) {
        // Use responsive configuration that adapts to actual device characteristics
        const baseConfig = defaultBookConfigs[newDeviceType]
        const enhancedConfig = {
          ...baseConfig,
          itemsPerPage: responsiveConfig.itemsPerPage,
          enableKeyboardNav: !characteristics.hasTouch || characteristics.isDesktop,
          enableSwipeGestures: characteristics.hasTouch,
          showPageIndicators: responsiveConfig.showPageNumbers,
          preloadPages: optimizations.disablePreload ? 1 : responsiveConfig.preloadPages,
          transition: optimizations.reduceAnimations ? 'none' : baseConfig.transition,
          snapToPages: !optimizations.simplifyLayout && baseConfig.snapToPages
        }
        setConfig(enhancedConfig)
      } else {
        setConfig(defaultBookConfigs[newDeviceType])
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isResponsiveMode, responsiveConfig, characteristics])

  // Process feed items into book pages with responsive optimization
  useEffect(() => {
    if (feedItems.length === 0) {
      setPages([])
      return
    }

    const preprocessedItems = preprocessFeedItems(feedItems)
    
    // Use the current config for chunking
    const optimizedConfig = config
    
    const chunkingResult = chunkContentIntoPages(preprocessedItems, optimizedConfig, deviceType)
    
    // Log chunking analysis in development
    if (process.env.NODE_ENV === 'development') {
      const analysis = analyzeChunkingResults(chunkingResult)
      console.log('Responsive Chunking Analysis:', {
        ...analysis,
        deviceCharacteristics: characteristics,
        responsiveConfig: responsiveConfig
      })
    }

    setPages(chunkingResult.pages)
  }, [feedItems, config, deviceType, isResponsiveMode, characteristics, responsiveConfig])

  // Update navigation state when pages or current index changes
  useEffect(() => {
    const totalPages = pages.length
    const currentPage = currentPageIndex + 1
    
    setNavigationState({
      currentPage,
      totalPages,
      isFirstPage: currentPageIndex === 0,
      isLastPage: currentPageIndex === totalPages - 1,
      canNavigatePrevious: currentPageIndex > 0,
      canNavigateNext: currentPageIndex < totalPages - 1,
      progress: totalPages > 0 ? (currentPage / totalPages) * 100 : 0
    })
  }, [pages, currentPageIndex])

  // Navigation functions
  const navigateToPage = useCallback((pageIndex: number) => {
    if (isTransitioning || pageIndex < 0 || pageIndex >= pages.length) return
    
    setIsTransitioning(true)
    setCurrentPageIndex(pageIndex)
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }, [pages.length, isTransitioning])

  const navigatePrevious = useCallback(() => {
    if (navigationState.canNavigatePrevious) {
      navigateToPage(currentPageIndex - 1)
    }
  }, [currentPageIndex, navigationState.canNavigatePrevious, navigateToPage])

  const navigateNext = useCallback(() => {
    if (navigationState.canNavigateNext) {
      navigateToPage(currentPageIndex + 1)
    } else if (hasMore && onLoadMore && !isPerformanceTestMode) {
      // Load more content when reaching the end (except in test mode)
      onLoadMore()
    }
  }, [currentPageIndex, navigationState.canNavigateNext, navigateToPage, hasMore, onLoadMore, isPerformanceTestMode])

  // Keyboard navigation
  useEffect(() => {
    if (!config.enableKeyboardNav) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent navigation if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault()
          navigatePrevious()
          break
        
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ': // Space bar
          event.preventDefault()
          navigateNext()
          break
        
        case 'Home':
          event.preventDefault()
          navigateToPage(0)
          break
        
        case 'End':
          event.preventDefault()
          navigateToPage(pages.length - 1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [config.enableKeyboardNav, pages.length, navigatePrevious, navigateNext, navigateToPage])

  // Swipe gesture handling (simplified for now)
  useEffect(() => {
    if (!config.enableSwipeGestures || !containerRef.current) return

    let startX = 0
    let startY = 0
    let isDragging = false

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      isDragging = true
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (!isDragging) return
      
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      
      // Check if swipe is primarily horizontal
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        event.preventDefault()
        
        if (deltaX > 0) {
          navigatePrevious()
        } else {
          navigateNext()
        }
      }
      
      isDragging = false
    }

    const container = containerRef.current
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [config.enableSwipeGestures, navigatePrevious, navigateNext])

  // Handle content interactions
  const handlePageInteraction = useCallback((contentId: string, action: string, value?: unknown) => {
    onInteraction?.(contentId, action, value)
  }, [onInteraction])

  if (!capabilities.horizontalScrolling) {
    // Fallback to vertical scrolling will be handled by parent component
    return null
  }

  if (pages.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No content available</h3>
          <p className="text-gray-500">Start your learning journey by exploring different subjects!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Book Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden"
        style={{ 
          scrollSnapType: config.snapToPages ? 'x mandatory' : 'none',
          ...cssProperties
        }}
      >
        {/* Pages Container */}
        <div className="flex h-full">
          <AnimatePresence mode="wait">
            {pages.length > 0 && (
              <motion.div
                key={currentPageIndex}
                initial={optimizations.reduceAnimations ? {} : { x: '100%', opacity: 0 }}
                animate={optimizations.reduceAnimations ? {} : { x: 0, opacity: 1 }}
                exit={optimizations.reduceAnimations ? {} : { x: '-100%', opacity: 0 }}
                transition={optimizations.reduceAnimations ? { duration: 0 } : { 
                  type: optimizations.simplifyLayout ? 'tween' : 'spring',
                  stiffness: optimizations.simplifyLayout ? undefined : 300,
                  damping: optimizations.simplifyLayout ? undefined : 30,
                  duration: optimizations.simplifyLayout ? 0.15 : 0.3
                }}
                className="w-full h-full flex-shrink-0"
                style={{
                  willChange: optimizations.reduceAnimations ? 'auto' : 'transform, opacity'
                }}
              >
                <BookPage
                  page={pages[currentPageIndex]}
                  deviceType={deviceType}
                  onInteraction={handlePageInteraction}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        {pages.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={navigatePrevious}
              disabled={!navigationState.canNavigatePrevious || isTransitioning}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
                navigationState.canNavigatePrevious && !isTransitioning
                  ? 'bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl text-gray-700 hover:text-gray-900'
                  : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={navigateNext}
              disabled={isTransitioning}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
                !isTransitioning
                  ? 'bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl text-gray-700 hover:text-gray-900'
                  : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {navigationState.isLastPage && hasMore ? (
                <MoreHorizontal className="w-6 h-6" />
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}
            </button>
          </>
        )}

        {/* Page Navigation Component */}
        {config.showPageIndicators && pages.length > 1 && (
          <BookNavigation
            navigationState={navigationState}
            onNavigateToPage={navigateToPage}
            isTransitioning={isTransitioning}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
          />
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">Loading more pages...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Performance Monitor (development only) */}
        <PerformanceMonitor
          onPerformanceChange={handlePerformanceChange}
          showDebugInfo={process.env.NODE_ENV === 'development'}
        />
        
        {/* Performance Test Controls (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs space-y-2">
            <div className="font-semibold">Performance Testing</div>
            
            <button
              onClick={async () => {
                console.log('🚀 Running performance test...')
                const result = await runPerformanceTest(50)
                logPerformanceResults(result)
              }}
              className="block w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs transition-colors"
            >
              Test 50 Items
            </button>
            
            <button
              onClick={async () => {
                console.log('🎯 Loading large content set...')
                const largeSet = generateLargeContentSet(100)
                // Note: In real implementation, this would update the feed
                console.log(`Generated ${largeSet.length} test items`)
                setIsPerformanceTestMode(true)
              }}
              className="block w-full bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs transition-colors"
            >
              Load 100 Items
            </button>
            
            <button
              onClick={() => {
                setIsPerformanceTestMode(false)
                console.log('🔄 Performance test mode disabled')
              }}
              className="block w-full bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs transition-colors"
            >
              Reset Test Mode
            </button>
            
            {isPerformanceTestMode && (
              <div className="text-yellow-400 text-[10px]">
                ⚡ Test Mode Active
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}