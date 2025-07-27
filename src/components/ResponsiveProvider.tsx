'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  detectDeviceCharacteristics, 
  generateResponsiveConfig,
  generateResponsiveCSSProperties 
} from '@/lib/responsive-layout'
import type { DeviceCharacteristics, ResponsiveLayoutConfig } from '@/lib/responsive-layout'

interface ResponsiveContextType {
  characteristics: DeviceCharacteristics
  config: ResponsiveLayoutConfig
  cssProperties: Record<string, string>
  isLoading: boolean
}

const ResponsiveContext = createContext<ResponsiveContextType>({
  characteristics: {
    width: 1024,
    height: 768,
    devicePixelRatio: 1,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    hasTouch: false,
    isLowEnd: false
  },
  config: {
    itemsPerPage: 2,
    pageSpacing: 24,
    contentPadding: 24,
    navigationSize: 'medium',
    showPageNumbers: true,
    enableAnimations: true,
    preloadPages: 2,
    fontScale: 1.0,
    touchTargetSize: 44
  },
  cssProperties: {},
  isLoading: true
})

interface ResponsiveProviderProps {
  children: ReactNode
}

export function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  const [characteristics, setCharacteristics] = useState<DeviceCharacteristics | null>(null)
  const [config, setConfig] = useState<ResponsiveLayoutConfig | null>(null)
  const [cssProperties, setCssProperties] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Initial detection
  useEffect(() => {
    const detectAndUpdate = () => {
      const newCharacteristics = detectDeviceCharacteristics()
      const newConfig = generateResponsiveConfig(newCharacteristics)
      const newCssProperties = generateResponsiveCSSProperties(newConfig)

      setCharacteristics(newCharacteristics)
      setConfig(newConfig)
      setCssProperties(newCssProperties)
      setIsLoading(false)

      // Apply CSS properties to document root
      const root = document.documentElement
      Object.entries(newCssProperties).forEach(([property, value]) => {
        root.style.setProperty(property, value)
      })
    }

    // Initial detection
    detectAndUpdate()

    // Listen for viewport changes
    const handleResize = () => {
      detectAndUpdate()
    }

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(detectAndUpdate, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    // Listen for dark mode changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleDarkModeChange = () => {
      detectAndUpdate()
    }
    darkModeQuery.addEventListener('change', handleDarkModeChange)

    // Listen for reduced motion preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleReducedMotionChange = () => {
      detectAndUpdate()
    }
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      darkModeQuery.removeEventListener('change', handleDarkModeChange)
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
    }
  }, [])

  // Provide fallback values during SSR or loading
  const contextValue: ResponsiveContextType = {
    characteristics: characteristics || {
      width: 1024,
      height: 768,
      devicePixelRatio: 1,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: 'landscape',
      hasTouch: false,
      isLowEnd: false
    },
    config: config || {
      itemsPerPage: 2,
      pageSpacing: 24,
      contentPadding: 24,
      navigationSize: 'medium',
      showPageNumbers: true,
      enableAnimations: true,
      preloadPages: 2,
      fontScale: 1.0,
      touchTargetSize: 44
    },
    cssProperties,
    isLoading
  }

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  )
}

export function useResponsiveContext() {
  const context = useContext(ResponsiveContext)
  if (!context) {
    throw new Error('useResponsiveContext must be used within a ResponsiveProvider')
  }
  return context
}

// Hook for components that need to adapt to device characteristics
export function useDeviceAdaptation() {
  const { characteristics, config } = useResponsiveContext()
  
  return {
    // Device type booleans
    isMobile: characteristics.isMobile,
    isTablet: characteristics.isTablet,
    isDesktop: characteristics.isDesktop,
    hasTouch: characteristics.hasTouch,
    isLowEnd: characteristics.isLowEnd,
    
    // Layout configuration
    itemsPerPage: config.itemsPerPage,
    shouldUseAnimations: config.enableAnimations,
    touchTargetSize: config.touchTargetSize,
    fontScale: config.fontScale,
    
    // Utility functions
    getOptimalImageSize: (baseSize: number) => Math.round(baseSize * config.fontScale),
    getOptimalSpacing: (baseSpacing: number) => Math.round(baseSpacing * (characteristics.isMobile ? 0.8 : 1)),
    shouldPreload: (priority: 'high' | 'medium' | 'low') => {
      if (characteristics.isLowEnd) return priority === 'high'
      return config.preloadPages > (priority === 'high' ? 0 : priority === 'medium' ? 1 : 2)
    }
  }
}