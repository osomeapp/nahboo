'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  ExternalLink,
  Globe,
  Lock,
  Loader,
  AlertTriangle
} from 'lucide-react'
import type { LinkPreview } from '@/types'

interface LinkModalProps {
  isOpen: boolean
  linkData: {
    url: string
    title: string
    preview?: LinkPreview
  }
  onClose: () => void
  onInteraction?: (action: string, data?: unknown) => void
}

export default function LinkModal({ isOpen, linkData, onClose, onInteraction }: LinkModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(linkData.url)
  const [isSecure, setIsSecure] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const startTimeRef = useRef<number>(0)

  // Reset state when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setHasError(false)
      setCanGoBack(false)
      setCanGoForward(false)
      setCurrentUrl(linkData.url)
      setIsSecure(linkData.url.startsWith('https://'))
      startTimeRef.current = Date.now()
      onInteraction?.('link_open', { url: linkData.url })
    }
  }, [isOpen, linkData.url, onInteraction])

  // Handle iframe loading
  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
    const endTime = Date.now()
    const timeSpent = endTime - startTimeRef.current
    setLoadTime(timeSpent)
    onInteraction?.('link_load_success', { 
      url: currentUrl, 
      loadTime: timeSpent 
    })
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
    onInteraction?.('link_load_error', { url: currentUrl })
  }

  // Navigation functions
  const handleBack = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.back()
      setCanGoBack(false) // Will be updated by iframe navigation
      onInteraction?.('link_navigate_back')
    }
  }

  const handleForward = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.forward()
      setCanGoForward(false) // Will be updated by iframe navigation
      onInteraction?.('link_navigate_forward')
    }
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      setHasError(false)
      startTimeRef.current = Date.now()
      iframeRef.current.src = iframeRef.current.src
      onInteraction?.('link_refresh', { url: currentUrl })
    }
  }

  const handleOpenInNewTab = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer')
    onInteraction?.('link_open_external', { url: currentUrl })
  }

  const handleClose = () => {
    onInteraction?.('link_close', { 
      url: currentUrl, 
      timeSpent: Date.now() - startTimeRef.current 
    })
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Monitor iframe navigation (limited by same-origin policy)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const checkNavigation = () => {
      try {
        // This will only work for same-origin iframes
        const iframeHistory = iframe.contentWindow?.history
        if (iframeHistory) {
          setCanGoBack(iframeHistory.length > 1)
        }
      } catch (error) {
        // Cross-origin restriction - expected for most external links
        console.debug('Cannot access iframe history due to cross-origin policy')
      }
    }

    iframe.addEventListener('load', checkNavigation)
    return () => iframe.removeEventListener('load', checkNavigation)
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Navigation Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleBack}
                  disabled={!canGoBack}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleForward}
                  disabled={!canGoForward}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
                  title="Go forward"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Refresh"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* URL Bar */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0">
                <div className="flex items-center space-x-2 mr-3" title={isSecure ? "Secure connection" : "Insecure connection"}>
                  {isSecure ? (
                    <Lock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Globe className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <span className="text-sm text-gray-700 truncate flex-1" title={currentUrl}>
                  {currentUrl}
                </span>
                {isLoading && (
                  <Loader className="w-4 h-4 text-blue-500 animate-spin ml-2" />
                )}
              </div>

              {/* External Link Button */}
              <button
                onClick={handleOpenInNewTab}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ml-3"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Preview (shown while loading) */}
          {linkData.preview && (isLoading || hasError) && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-8 h-8 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {linkData.preview.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {linkData.preview.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {linkData.preview.domain}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 relative bg-white">
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading external content...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {linkData.preview?.domain || 'External website'}
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Unable to load content
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This website cannot be displayed in an embedded frame. This is often due to security policies set by the website.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={handleOpenInNewTab}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Open in New Tab
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Iframe */}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-none"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              loading="lazy"
              title={linkData.title}
            />
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                {linkData.title}
              </span>
              {loadTime > 0 && (
                <span className="text-gray-500">
                  Loaded in {(loadTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Press ESC to close</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}