'use client'

import { motion } from 'framer-motion'
import type { BookNavigationState } from '@/types/book-layout'

interface BookNavigationProps {
  navigationState: BookNavigationState
  onNavigateToPage: (pageIndex: number) => void
  isTransitioning: boolean
  className?: string
  maxVisibleDots?: number
}

export default function BookNavigation({
  navigationState,
  onNavigateToPage,
  isTransitioning,
  className = '',
  maxVisibleDots = 7
}: BookNavigationProps) {
  const { currentPage, totalPages, progress } = navigationState

  // Calculate which page dots to show
  const getVisiblePages = () => {
    if (totalPages <= maxVisibleDots) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const currentIndex = currentPage - 1
    const halfVisible = Math.floor(maxVisibleDots / 2)
    
    let start = Math.max(0, currentIndex - halfVisible)
    let end = Math.min(totalPages - 1, currentIndex + halfVisible)
    
    // Adjust if we're near the beginning or end
    if (end - start + 1 < maxVisibleDots) {
      if (start === 0) {
        end = Math.min(totalPages - 1, start + maxVisibleDots - 1)
      } else {
        start = Math.max(0, end - maxVisibleDots + 1)
      }
    }
    
    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i + 1)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()
  const showEllipsisStart = visiblePages[0] > 1
  const showEllipsisEnd = visiblePages[visiblePages.length - 1] < totalPages

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Background */}
      <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/20">
        <div className="flex items-center space-x-1">
          {/* First page (if not visible) */}
          {showEllipsisStart && (
            <>
              <button
                onClick={() => onNavigateToPage(0)}
                disabled={isTransitioning}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-600 disabled:opacity-50"
              >
                1
              </button>
              <span className="text-gray-400 text-xs">…</span>
            </>
          )}

          {/* Visible page dots */}
          {visiblePages.map((pageNum) => {
            const pageIndex = pageNum - 1
            const isActive = pageNum === currentPage
            
            return (
              <motion.button
                key={pageNum}
                onClick={() => onNavigateToPage(pageIndex)}
                disabled={isTransitioning}
                className={`relative w-6 h-6 rounded-full transition-all disabled:opacity-50 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                } text-xs font-medium`}
                whileHover={!isActive ? { scale: 1.1 } : {}}
                whileTap={{ scale: 0.95 }}
              >
                {pageNum}
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activePageIndicator"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Page number */}
                <span className="relative z-10">{pageNum}</span>
              </motion.button>
            )
          })}

          {/* Last page (if not visible) */}
          {showEllipsisEnd && (
            <>
              <span className="text-gray-400 text-xs">…</span>
              <button
                onClick={() => onNavigateToPage(totalPages - 1)}
                disabled={isTransitioning}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-600 disabled:opacity-50"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>
        
        {/* Page Counter */}
        <div className="mt-1 text-center">
          <span className="text-xs text-gray-500">
            {currentPage} of {totalPages}
          </span>
        </div>
      </div>
    </div>
  )
}