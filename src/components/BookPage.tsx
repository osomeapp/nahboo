'use client'

import { motion } from 'framer-motion'
import { Play, MessageCircle, BookOpen, Share, Heart } from 'lucide-react'
import VideoPlayer from './VideoPlayer'
import AILessonCard from './AILessonCard'
import { useUserProfile } from '@/lib/store'
import type { FeedItem } from '@/types'
import type { BookPage as BookPageType, DeviceType } from '@/types/book-layout'

interface BookPageProps {
  page: BookPageType
  deviceType: DeviceType
  onInteraction?: (contentId: string, action: string, value?: unknown) => void
}

interface ContentItemProps {
  item: FeedItem
  className?: string
  onInteraction?: (contentId: string, action: string, value?: unknown) => void
}

// Individual content item component
function ContentItem({ item, className = '', onInteraction }: ContentItemProps) {
  const userProfile = useUserProfile()

  const handleInteraction = (action: string, value?: unknown) => {
    onInteraction?.(item.id, action, value)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20 ${className}`}
    >
      {/* Content Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {item.content_type === 'video' && <Play className="w-4 h-4 text-red-500" />}
            {item.content_type === 'quiz' && <MessageCircle className="w-4 h-4 text-green-500" />}
            {item.content_type === 'ai_lesson' && <BookOpen className="w-4 h-4 text-blue-500" />}
            {item.content_type === 'link' && <Share className="w-4 h-4 text-purple-500" />}
            {item.content_type === 'text' && <BookOpen className="w-4 h-4 text-gray-500" />}
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {item.author?.full_name || 'Learning Assistant'}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.content_type === 'video' ? 'bg-red-100 text-red-700' :
          item.content_type === 'quiz' ? 'bg-green-100 text-green-700' :
          item.content_type === 'ai_lesson' ? 'bg-blue-100 text-blue-700' :
          item.content_type === 'link' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {item.content_type.replace('_', ' ')}
        </span>
      </div>

      {/* Content Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
        {item.title}
      </h3>

      {/* Content Body */}
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-4 text-sm">
        {item.description.split('\n').map((paragraph, idx) => (
          <p key={idx} className="mb-2 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Special Content Types */}
      {item.content_type === 'video' && item.metadata?.video_url && (
        <div className="mb-4">
          <VideoPlayer
            videoId={item.id}
            videoUrl={item.metadata.video_url}
            duration={item.metadata.video_duration}
            title={item.title}
            autoplay={false}
            onPlay={() => handleInteraction('play')}
            onPause={() => handleInteraction('pause')}
            onProgress={(currentTime, duration) => 
              handleInteraction('progress', { currentTime, duration })
            }
            onComplete={() => handleInteraction('complete')}
          />
        </div>
      )}

      {item.content_type === 'quiz' && (
        <div className="mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
            onClick={() => handleInteraction('quiz_start')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-green-800 text-sm">Interactive Quiz</div>
                  <p className="text-green-700 text-xs">
                    {item.metadata?.quiz_questions?.length || 1} questions • 5 min limit
                  </p>
                </div>
              </div>
              <div className="text-green-600 font-medium text-sm">
                Start →
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {item.content_type === 'link' && item.metadata?.link_preview && (
        <div className="mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors text-left"
            onClick={() => handleInteraction('link_open')}
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Share className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 truncate text-sm">
                    {item.metadata.link_preview.title}
                  </h4>
                  <span className="text-purple-600 text-xs font-medium ml-2">
                    Open →
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                  {item.metadata.link_preview.description}
                </p>
                <p className="text-xs text-gray-500">
                  {item.metadata.link_preview.domain}
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {item.content_type === 'ai_lesson' && userProfile && (
        <AILessonCard
          topic={item.description.split('.')[0]} // Use first sentence as topic
          userProfile={userProfile}
          onInteraction={handleInteraction}
        />
      )}

      {/* Interaction Buttons */}
      <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => handleInteraction('like')}
          className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors text-sm"
        >
          <Heart className="w-4 h-4" />
          <span>Like</span>
        </button>
        
        <button
          onClick={() => handleInteraction('share')}
          className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors text-sm"
        >
          <Share className="w-4 h-4" />
          <span>Share</span>
        </button>
        
        <span className="text-xs text-gray-400 ml-auto">
          Score: {item.relevance_score.toFixed(2)}
        </span>
      </div>
    </motion.article>
  )
}

export default function BookPage({ 
  page, 
  deviceType, 
  onInteraction 
}: BookPageProps) {
  // Enhanced layout configurations using responsive system
  const getLayoutClasses = () => {
    const { items } = page
    // Use default responsive configuration
    const itemsPerPage = deviceType === 'mobile' ? 1 : deviceType === 'tablet' ? 2 : 3
    const contentPadding = deviceType === 'mobile' ? 'p-4' : 'p-6'
    const pageSpacing = deviceType === 'mobile' ? 'space-y-4' : 'space-y-6'
    const isMobile = deviceType === 'mobile'
    const isTablet = deviceType === 'tablet'
    const width = deviceType === 'mobile' ? 375 : deviceType === 'tablet' ? 768 : 1024
    
    // Base responsive styles
    const containerPadding = `p-[${contentPadding}px]`
    const gap = `gap-[${pageSpacing}px]`
    
    // Mobile-first approach
    if (isMobile || itemsPerPage === 1) {
      return {
        container: `${containerPadding} space-y-[${pageSpacing}px]`,
        grid: 'flex flex-col',
        item: 'w-full flex-shrink-0'
      }
    }
    
    // Tablet and small desktop
    if (isTablet || itemsPerPage === 2) {
      return {
        container: containerPadding,
        grid: `grid grid-cols-1 md:grid-cols-2 ${gap}`,
        item: 'w-full'
      }
    }
    
    // Large desktop with 3+ columns
    return {
      container: containerPadding,
      grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(itemsPerPage, 3)} ${gap}`,
      item: 'w-full'
    }
  }
  
  // Responsive font sizing
  const getFontSizes = () => {
    // Use default font scale based on device type
    const fontScale = deviceType === 'mobile' ? 0.9 : deviceType === 'tablet' ? 1.0 : 1.1
    const baseSize = fontScale
    
    return {
      title: `text-[${Math.round(18 * baseSize)}px]`,
      body: `text-[${Math.round(14 * baseSize)}px]`,
      meta: `text-[${Math.round(12 * baseSize)}px]`,
      button: `text-[${Math.round(13 * baseSize)}px]`
    }
  }
  
  // Touch target sizing for interactive elements
  const getTouchTargetSize = () => {
    // Use default touch target size based on device type
    const touchTargetSize = deviceType === 'mobile' ? 44 : 48
    return {
      minWidth: `${touchTargetSize}px`,
      minHeight: `${touchTargetSize}px`
    }
  }

  const layoutClasses = getLayoutClasses()
  const fontSizes = getFontSizes()
  const touchTargetSize = getTouchTargetSize()

  return (
    <div className={`h-full overflow-y-auto ${layoutClasses.container}`}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`${fontSizes.title} font-semibold text-gray-900`}>
                Page {page.pageNumber}
              </h1>
              <p className={`${fontSizes.meta} text-gray-600`}>
                {page.items.length} item{page.items.length !== 1 ? 's' : ''} • 
                ~{Math.round(page.estimatedReadTime / 60)} min read
              </p>
            </div>
          </div>
          
          {/* Page Type Indicators */}
          <div className="flex items-center space-x-2">
            {page.hasVideo && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Video
              </span>
            )}
            {page.hasInteractive && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Interactive
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className={layoutClasses.grid}>
        {page.items.map((item, index) => (
          <ContentItem
            key={item.id}
            item={item}
            className={layoutClasses.item}
            onInteraction={onInteraction}
          />
        ))}
      </div>

      {/* Page Footer (if needed for additional info) */}
      {page.items.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-white/30 backdrop-blur-sm rounded-full px-4 py-2">
            <BookOpen className="w-4 h-4" />
            <span>
              Learning content curated for your interests
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}