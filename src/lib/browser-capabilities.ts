// Browser Capability Detection for Horizontal Book-Like Scrolling
// Progressive enhancement system that detects browser support for advanced features

export interface BrowserCapabilities {
  horizontalScrolling: boolean
  transform3D: boolean
  flexbox: boolean
  intersectionObserver: boolean
  touchEvents: boolean
  cssSnapScrolling: boolean
  modernFeatures: boolean
  overallScore: number
}

// Test for CSS 3D transforms support
export function testTransform3D(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const testElement = document.createElement('div')
    const transform3DProperties = [
      'transform',
      'WebkitTransform',
      'MozTransform',
      'msTransform',
      'OTransform'
    ]
    
    return transform3DProperties.some(property => {
      if (property in testElement.style) {
        (testElement.style as any)[property] = 'translate3d(1px,1px,1px)'
        return (testElement.style as any)[property] !== ''
      }
      return false
    })
  } catch {
    return false
  }
}

// Test for modern flexbox support
export function testFlexbox(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    return CSS.supports('display', 'flex') || CSS.supports('display', '-webkit-flex')
  } catch {
    // Fallback for browsers without CSS.supports
    const testElement = document.createElement('div')
    testElement.style.display = 'flex'
    return testElement.style.display === 'flex'
  }
}

// Test for IntersectionObserver API
export function testIntersectionObserver(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window
}

// Test for touch event support (mobile/tablet detection)
export function testTouchEvents(): boolean {
  if (typeof window === 'undefined') return false
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         (navigator as any).msMaxTouchPoints > 0
}

// Test for CSS Scroll Snap support
export function testCSSSnapScrolling(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    return CSS.supports('scroll-snap-type', 'x mandatory') || 
           CSS.supports('-webkit-scroll-snap-type', 'mandatory')
  } catch {
    return false
  }
}

// Test for modern JavaScript features required for horizontal scrolling
export function testModernFeatures(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Test for Promise support
    const hasPromises = typeof Promise !== 'undefined'
    
    // Test for modern array methods
    const hasModernArrays = typeof Array.prototype.includes === 'function' && typeof Array.prototype.find === 'function'
    
    // Test for modern object methods
    const hasModernObjects = typeof Object.assign === 'function' && typeof Object.keys === 'function'
    
    // Test for modern DOM methods
    const hasModernDOM = typeof document.querySelector === 'function' && typeof document.querySelectorAll === 'function'
    
    return hasPromises && hasModernArrays && hasModernObjects && hasModernDOM
  } catch {
    return false
  }
}

// Comprehensive browser capability detection
export function detectBrowserCapabilities(): BrowserCapabilities {
  const transform3D = testTransform3D()
  const flexbox = testFlexbox()
  const intersectionObserver = testIntersectionObserver()
  const touchEvents = testTouchEvents()
  const cssSnapScrolling = testCSSSnapScrolling()
  const modernFeatures = testModernFeatures()
  
  // Calculate overall score (0-100)
  let score = 0
  if (transform3D) score += 20
  if (flexbox) score += 20
  if (intersectionObserver) score += 15
  if (touchEvents) score += 10
  if (cssSnapScrolling) score += 15
  if (modernFeatures) score += 20
  
  // Determine if horizontal scrolling is supported
  // Requires: transform3D, flexbox, and intersectionObserver as minimum
  const horizontalScrolling = transform3D && flexbox && intersectionObserver && modernFeatures
  
  return {
    horizontalScrolling,
    transform3D,
    flexbox,
    intersectionObserver,
    touchEvents,
    cssSnapScrolling,
    modernFeatures,
    overallScore: score
  }
}

// Get user agent information for debugging
export function getUserAgentInfo() {
  if (typeof window === 'undefined') return null
  
  const ua = navigator.userAgent
  const info = {
    userAgent: ua,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isTablet: /iPad|Android.*(?!.*Mobile)/i.test(ua),
    isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    browser: 'unknown',
    version: 'unknown'
  }
  
  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    info.browser = 'chrome'
    const match = ua.match(/Chrome\/(\d+)/)
    if (match) info.version = match[1]
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    info.browser = 'safari'
    const match = ua.match(/Version\/(\d+)/)
    if (match) info.version = match[1]
  } else if (ua.includes('Firefox')) {
    info.browser = 'firefox'
    const match = ua.match(/Firefox\/(\d+)/)
    if (match) info.version = match[1]
  } else if (ua.includes('Edg')) {
    info.browser = 'edge'
    const match = ua.match(/Edg\/(\d+)/)
    if (match) info.version = match[1]
  }
  
  return info
}

// Browser compatibility scoring for logging/analytics
export function getBrowserCompatibilityReport(): {
  capabilities: BrowserCapabilities
  userAgent: ReturnType<typeof getUserAgentInfo>
  recommendations: string[]
} {
  const capabilities = detectBrowserCapabilities()
  const userAgent = getUserAgentInfo()
  const recommendations: string[] = []
  
  if (!capabilities.horizontalScrolling) {
    recommendations.push('Browser will use vertical scrolling fallback')
  }
  
  if (!capabilities.transform3D) {
    recommendations.push('3D transforms not supported - animations may be limited')
  }
  
  if (!capabilities.cssSnapScrolling) {
    recommendations.push('CSS scroll snap not supported - using JavaScript fallback')
  }
  
  if (!capabilities.touchEvents && userAgent?.isMobile) {
    recommendations.push('Touch events not detected on mobile device')
  }
  
  if (capabilities.overallScore < 60) {
    recommendations.push('Consider upgrading browser for optimal experience')
  }
  
  return {
    capabilities,
    userAgent,
    recommendations
  }
}

// Cache capabilities to avoid repeated testing
let cachedCapabilities: BrowserCapabilities | null = null

export function getCachedBrowserCapabilities(): BrowserCapabilities {
  if (!cachedCapabilities) {
    cachedCapabilities = detectBrowserCapabilities()
    
    // Log capabilities in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Browser Capabilities:', cachedCapabilities)
    }
  }
  
  return cachedCapabilities
}

// Hook for React components to use browser capabilities
export function useBrowserCapabilities() {
  if (typeof window === 'undefined') {
    // SSR-safe default
    return {
      horizontalScrolling: false,
      transform3D: false,
      flexbox: false,
      intersectionObserver: false,
      touchEvents: false,
      cssSnapScrolling: false,
      modernFeatures: false,
      overallScore: 0
    }
  }
  
  return getCachedBrowserCapabilities()
}