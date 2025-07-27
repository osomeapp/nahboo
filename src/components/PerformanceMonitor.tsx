'use client'

import { useEffect, useState } from 'react'
import { monitorLayoutPerformance } from '@/lib/responsive-layout'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  isPerformancePoor: boolean
  renderTime: number
  pageLoadTime: number
}

interface PerformanceMonitorProps {
  onPerformanceChange?: (metrics: PerformanceMetrics) => void
  showDebugInfo?: boolean
  className?: string
}

export default function PerformanceMonitor({
  onPerformanceChange,
  showDebugInfo = false,
  className = ''
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    isPerformancePoor: false,
    renderTime: 0,
    pageLoadTime: 0
  })

  const [isMonitoring, setIsMonitoring] = useState(true)

  useEffect(() => {
    let animationId: number
    let frameCount = 0
    let lastTime = performance.now()
    let fpsHistory: number[] = []
    
    const measurePerformance = () => {
      if (!isMonitoring) return

      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Calculate FPS
      frameCount++
      if (frameCount >= 60) {
        const fps = 1000 / (deltaTime)
        fpsHistory.push(fps)
        
        // Keep only last 10 measurements
        if (fpsHistory.length > 10) {
          fpsHistory.shift()
        }
        
        const avgFPS = fpsHistory.reduce((sum, f) => sum + f, 0) / fpsHistory.length
        
        // Get memory usage if available
        let memoryUsage = 0
        if ('memory' in performance) {
          const memory = (performance as any).memory
          memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        }
        
        // Measure render time
        const renderStart = performance.now()
        requestAnimationFrame(() => {
          const renderTime = performance.now() - renderStart
          
          const newMetrics: PerformanceMetrics = {
            fps: Math.round(avgFPS),
            memoryUsage: Math.round(memoryUsage * 100) / 100,
            isPerformancePoor: avgFPS < 30 || memoryUsage > 0.8,
            renderTime: Math.round(renderTime * 100) / 100,
            pageLoadTime: Math.round(currentTime)
          }
          
          setMetrics(newMetrics)
          onPerformanceChange?.(newMetrics)
        })
        
        frameCount = 0
      }
      
      animationId = requestAnimationFrame(measurePerformance)
    }

    if (typeof window !== 'undefined' && isMonitoring) {
      animationId = requestAnimationFrame(measurePerformance)
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isMonitoring, onPerformanceChange])

  // Auto-disable monitoring in production after 30 seconds
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const timer = setTimeout(() => {
        setIsMonitoring(false)
      }, 30000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  if (!showDebugInfo || process.env.NODE_ENV === 'production') {
    return null
  }

  const getPerformanceColor = () => {
    if (metrics.fps >= 50) return 'text-green-600'
    if (metrics.fps >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMemoryColor = () => {
    if (metrics.memoryUsage <= 0.5) return 'text-green-600'
    if (metrics.memoryUsage <= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span>Performance Monitor</span>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="text-gray-400 hover:text-white ml-2"
          >
            {isMonitoring ? '⏸️' : '▶️'}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span>FPS:</span>
          <span className={getPerformanceColor()}>
            {metrics.fps}
          </span>
        </div>
        
        {metrics.memoryUsage > 0 && (
          <div className="flex items-center justify-between">
            <span>Memory:</span>
            <span className={getMemoryColor()}>
              {(metrics.memoryUsage * 100).toFixed(1)}%
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span>Render:</span>
          <span className="text-blue-400">
            {metrics.renderTime}ms
          </span>
        </div>
        
        {metrics.isPerformancePoor && (
          <div className="text-red-400 border-t border-gray-600 pt-1 mt-1">
            ⚠️ Poor Performance
          </div>
        )}
        
        <div className="text-gray-400 text-[10px] border-t border-gray-600 pt-1 mt-1">
          Debug mode - hidden in production
        </div>
      </div>
    </div>
  )
}

// Hook for performance-based optimizations
export function usePerformanceOptimization() {
  const [shouldOptimize, setShouldOptimize] = useState(false)
  const [optimizations, setOptimizations] = useState({
    reduceAnimations: false,
    lowerQuality: false,
    disablePreload: false,
    simplifyLayout: false
  })

  const handlePerformanceChange = (metrics: PerformanceMetrics) => {
    const needsOptimization = metrics.isPerformancePoor
    setShouldOptimize(needsOptimization)
    
    if (needsOptimization) {
      setOptimizations({
        reduceAnimations: metrics.fps < 20,
        lowerQuality: metrics.memoryUsage > 0.9,
        disablePreload: metrics.memoryUsage > 0.7,
        simplifyLayout: metrics.fps < 15
      })
    } else {
      setOptimizations({
        reduceAnimations: false,
        lowerQuality: false,
        disablePreload: false,
        simplifyLayout: false
      })
    }
  }

  return {
    shouldOptimize,
    optimizations,
    handlePerformanceChange
  }
}