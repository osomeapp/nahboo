// Responsive Layout System for Horizontal Book View
// Optimizes layout parameters based on device characteristics

export interface DeviceCharacteristics {
  width: number
  height: number
  devicePixelRatio: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
  hasTouch: boolean
  isLowEnd: boolean // Based on performance heuristics
}

export interface ResponsiveLayoutConfig {
  itemsPerPage: number
  pageSpacing: number // Gap between pages in px
  contentPadding: number // Inner padding in px
  navigationSize: 'small' | 'medium' | 'large'
  showPageNumbers: boolean
  enableAnimations: boolean
  preloadPages: number
  fontScale: number // 0.8-1.2 for accessibility
  touchTargetSize: number // Minimum touch target in px
}

// Breakpoint definitions with enhanced mobile detection
export const responsiveBreakpoints = {
  xs: 320,    // Small phones
  sm: 480,    // Large phones
  md: 768,    // Tablets portrait
  lg: 1024,   // Tablets landscape / small laptops
  xl: 1440,   // Desktop
  xxl: 1920   // Large desktop
} as const

// Device performance tiers for optimization
export const performanceTiers = {
  low: {
    maxAnimationFPS: 30,
    maxPreloadPages: 1,
    reduceMotion: true,
    simplifyTransitions: true
  },
  medium: {
    maxAnimationFPS: 60,
    maxPreloadPages: 2,
    reduceMotion: false,
    simplifyTransitions: false
  },
  high: {
    maxAnimationFPS: 120,
    maxPreloadPages: 3,
    reduceMotion: false,
    simplifyTransitions: false
  }
} as const

// Detect device characteristics
export function detectDeviceCharacteristics(): DeviceCharacteristics {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      width: 1024,
      height: 768,
      devicePixelRatio: 1,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: 'landscape',
      hasTouch: false,
      isLowEnd: false
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const devicePixelRatio = window.devicePixelRatio || 1
  const orientation = width > height ? 'landscape' : 'portrait'
  
  // Enhanced mobile detection
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = width <= responsiveBreakpoints.md || 
                  /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  const isTablet = !isMobile && (
    width <= responsiveBreakpoints.lg ||
    /ipad|android.*(?!.*mobile)/i.test(userAgent)
  )
  
  const isDesktop = !isMobile && !isTablet

  // Touch capability detection
  const hasTouch = 'ontouchstart' in window || 
                  navigator.maxTouchPoints > 0 ||
                  (navigator as any).msMaxTouchPoints > 0

  // Performance heuristics for low-end device detection
  const isLowEnd = (
    // Low resolution screens
    (width * height * devicePixelRatio) < (800 * 600 * 1.5) ||
    // Old mobile devices (rough heuristic)
    (isMobile && devicePixelRatio < 2) ||
    // Memory constraints (if available)
    (navigator as any).deviceMemory < 4 ||
    // Slow connection
    (navigator as any).connection?.effectiveType === 'slow-2g' ||
    (navigator as any).connection?.effectiveType === '2g'
  )

  return {
    width,
    height,
    devicePixelRatio,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    hasTouch,
    isLowEnd
  }
}

// Generate responsive layout configuration
export function generateResponsiveConfig(
  characteristics: DeviceCharacteristics
): ResponsiveLayoutConfig {
  const { width, isMobile, isTablet, isDesktop, isLowEnd, hasTouch, orientation } = characteristics

  // Base configuration
  let config: ResponsiveLayoutConfig = {
    itemsPerPage: 1,
    pageSpacing: 0,
    contentPadding: 16,
    navigationSize: 'medium',
    showPageNumbers: true,
    enableAnimations: !isLowEnd,
    preloadPages: isLowEnd ? 1 : 2,
    fontScale: 1.0,
    touchTargetSize: hasTouch ? 44 : 32
  }

  // Mobile optimizations (xs, sm)
  if (isMobile) {
    config = {
      ...config,
      itemsPerPage: 1, // Always single column on mobile
      pageSpacing: 0,
      contentPadding: width <= responsiveBreakpoints.xs ? 12 : 16,
      navigationSize: 'large', // Bigger targets for touch
      showPageNumbers: false, // Save space
      touchTargetSize: 48, // Extra large for small screens
      fontScale: width <= responsiveBreakpoints.xs ? 0.9 : 1.0
    }

    // Portrait mobile gets extra padding for readability
    if (orientation === 'portrait') {
      config.contentPadding = Math.max(config.contentPadding, 20)
    }
  }

  // Tablet optimizations (md, lg)
  else if (isTablet) {
    config = {
      ...config,
      itemsPerPage: orientation === 'landscape' ? 2 : 1,
      pageSpacing: 24,
      contentPadding: 24,
      navigationSize: 'medium',
      showPageNumbers: true,
      touchTargetSize: 44,
      preloadPages: isLowEnd ? 1 : 2
    }
  }

  // Desktop optimizations (xl, xxl)
  else if (isDesktop) {
    config = {
      ...config,
      itemsPerPage: width >= responsiveBreakpoints.xxl ? 3 : 2,
      pageSpacing: 32,
      contentPadding: width >= responsiveBreakpoints.xl ? 32 : 24,
      navigationSize: 'small', // More compact on desktop
      showPageNumbers: true,
      touchTargetSize: 32, // Smaller for mouse interaction
      preloadPages: isLowEnd ? 2 : 3,
      fontScale: width >= responsiveBreakpoints.xxl ? 1.1 : 1.0
    }
  }

  // Performance-based adjustments
  if (isLowEnd) {
    config.enableAnimations = false
    config.preloadPages = 1
  }

  // Accessibility adjustments
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    config.enableAnimations = false
  }

  // High contrast or larger text preferences
  const prefersLargeText = window.matchMedia('(prefers-reduced-data: reduce)').matches
  if (prefersLargeText) {
    config.fontScale = Math.min(config.fontScale * 1.2, 1.3)
  }

  return config
}

// CSS custom properties for responsive design
export function generateResponsiveCSSProperties(config: ResponsiveLayoutConfig): Record<string, string> {
  return {
    '--book-items-per-page': config.itemsPerPage.toString(),
    '--book-page-spacing': `${config.pageSpacing}px`,
    '--book-content-padding': `${config.contentPadding}px`,
    '--book-font-scale': config.fontScale.toString(),
    '--book-touch-target': `${config.touchTargetSize}px`,
    '--book-animation-duration': config.enableAnimations ? '300ms' : '0ms',
    '--book-navigation-size': {
      small: '32px',
      medium: '40px', 
      large: '48px'
    }[config.navigationSize]
  }
}

// Hook for responsive layout management
export function useResponsiveLayout() {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      characteristics: detectDeviceCharacteristics(),
      config: generateResponsiveConfig(detectDeviceCharacteristics()),
      cssProperties: {}
    }
  }

  const characteristics = detectDeviceCharacteristics()
  const config = generateResponsiveConfig(characteristics)
  const cssProperties = generateResponsiveCSSProperties(config)

  return {
    characteristics,
    config,
    cssProperties
  }
}

// Layout optimization for specific content types
export function optimizeLayoutForContent(
  config: ResponsiveLayoutConfig,
  contentTypes: string[]
): ResponsiveLayoutConfig {
  const hasVideo = contentTypes.includes('video')
  const hasInteractive = contentTypes.some(type => ['quiz', 'ai_lesson'].includes(type))
  const hasOnlyText = contentTypes.every(type => ['text', 'link'].includes(type))

  let optimizedConfig = { ...config }

  // Video content needs more space
  if (hasVideo && config.itemsPerPage > 1) {
    optimizedConfig.itemsPerPage = 1
    optimizedConfig.contentPadding = Math.max(optimizedConfig.contentPadding, 24)
  }

  // Interactive content benefits from single column
  if (hasInteractive && config.itemsPerPage > 2) {
    optimizedConfig.itemsPerPage = Math.min(optimizedConfig.itemsPerPage, 2)
  }

  // Text-only content can be more dense
  if (hasOnlyText && config.itemsPerPage === 1) {
    optimizedConfig.itemsPerPage = Math.min(3, optimizedConfig.itemsPerPage + 1)
    optimizedConfig.contentPadding = Math.max(16, optimizedConfig.contentPadding - 8)
  }

  return optimizedConfig
}

// Responsive image/video sizing
export function getResponsiveMediaSizes(
  characteristics: DeviceCharacteristics,
  config: ResponsiveLayoutConfig
): {
  videoMaxHeight: string
  imageMaxWidth: string
  thumbnailSize: string
} {
  const { width, height, isMobile } = characteristics
  const { itemsPerPage } = config

  // Calculate available space per item
  const availableWidth = width - (config.contentPadding * 2) - (config.pageSpacing * (itemsPerPage - 1))
  const itemWidth = availableWidth / itemsPerPage

  return {
    videoMaxHeight: isMobile 
      ? `${Math.min(height * 0.4, 300)}px`
      : `${Math.min(height * 0.6, 400)}px`,
    imageMaxWidth: `${Math.min(itemWidth * 0.9, 600)}px`,
    thumbnailSize: isMobile ? '60px' : '80px'
  }
}

// Performance monitoring for responsive adjustments
export function monitorLayoutPerformance(): {
  fps: number
  memoryUsage: number
  isPerformancePoor: boolean
} {
  if (typeof window === 'undefined') {
    return { fps: 60, memoryUsage: 0, isPerformancePoor: false }
  }

  // Simplified performance monitoring
  const performance = window.performance
  let fps = 60 // Default assumption
  let memoryUsage = 0
  
  // Memory usage (if available)
  if ('memory' in performance) {
    const memory = (performance as any).memory
    memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
  }

  // Simple FPS detection based on animation frame timing
  let lastFrameTime = performance.now()
  let frameCount = 0
  let totalFrameTime = 0

  const measureFPS = () => {
    const currentTime = performance.now()
    const deltaTime = currentTime - lastFrameTime
    lastFrameTime = currentTime
    
    frameCount++
    totalFrameTime += deltaTime
    
    if (frameCount >= 60) { // Measure over 60 frames
      fps = 1000 / (totalFrameTime / frameCount)
      frameCount = 0
      totalFrameTime = 0
    }
    
    requestAnimationFrame(measureFPS)
  }
  
  requestAnimationFrame(measureFPS)

  const isPerformancePoor = fps < 30 || memoryUsage > 0.8

  return {
    fps,
    memoryUsage,
    isPerformancePoor
  }
}

// CSS Grid and Flexbox fallbacks for older browsers
export function getLayoutCSS(config: ResponsiveLayoutConfig): string {
  const { itemsPerPage, pageSpacing, contentPadding } = config

  return `
    /* Modern Grid Layout */
    @supports (display: grid) {
      .book-page-content {
        display: grid;
        grid-template-columns: repeat(${itemsPerPage}, 1fr);
        gap: ${pageSpacing}px;
        padding: ${contentPadding}px;
      }
    }
    
    /* Flexbox Fallback */
    @supports (display: flex) and (not (display: grid)) {
      .book-page-content {
        display: flex;
        flex-wrap: wrap;
        padding: ${contentPadding}px;
        margin: -${pageSpacing / 2}px;
      }
      
      .book-page-content > * {
        flex: 1 1 ${Math.floor(100 / itemsPerPage)}%;
        margin: ${pageSpacing / 2}px;
        max-width: calc(${Math.floor(100 / itemsPerPage)}% - ${pageSpacing}px);
      }
    }
    
    /* Legacy Float Fallback */
    @supports (not (display: flex)) and (not (display: grid)) {
      .book-page-content {
        padding: ${contentPadding}px;
        overflow: hidden;
      }
      
      .book-page-content > * {
        float: left;
        width: ${Math.floor(100 / itemsPerPage)}%;
        padding-right: ${pageSpacing}px;
        box-sizing: border-box;
      }
      
      .book-page-content > *:last-child {
        padding-right: 0;
      }
    }
  `
}