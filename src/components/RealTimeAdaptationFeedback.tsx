'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Lightbulb, 
  Heart, 
  Coffee, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react'
import type { VisualFeedback } from '@/lib/real-time-adaptation'

interface FeedbackItem extends VisualFeedback {
  id: string
}

interface RealTimeAdaptationFeedbackProps {
  feedbackItems: FeedbackItem[]
  onDismiss: (feedbackId: string) => void
  className?: string
}

const FeedbackTypeIcons = {
  hint: Lightbulb,
  encouragement: Heart,
  break_suggestion: Coffee,
  difficulty_increase: TrendingUp,
  difficulty_decrease: TrendingDown,
  pacing_adjustment: Clock,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  default: Zap
}

const FeedbackTypeColors = {
  hint: 'bg-blue-500',
  encouragement: 'bg-green-500',
  break_suggestion: 'bg-purple-500',
  difficulty_increase: 'bg-orange-500',
  difficulty_decrease: 'bg-cyan-500',
  pacing_adjustment: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-yellow-500',
  info: 'bg-gray-500',
  default: 'bg-blue-500'
}

export default function RealTimeAdaptationFeedback({
  feedbackItems,
  onDismiss,
  className = ''
}: RealTimeAdaptationFeedbackProps) {
  const [visibleItems, setVisibleItems] = useState<FeedbackItem[]>([])
  
  // Manage visible feedback items with staggered display
  useEffect(() => {
    if (feedbackItems.length > visibleItems.length) {
      const newItems = feedbackItems.slice(visibleItems.length)
      newItems.forEach((item, index) => {
        setTimeout(() => {
          setVisibleItems(prev => [...prev, item])
        }, index * 500) // Stagger by 500ms
      })
    } else if (feedbackItems.length < visibleItems.length) {
      setVisibleItems(feedbackItems)
    }
  }, [feedbackItems, visibleItems.length])
  
  const getFeedbackIcon = (type: string) => {
    return FeedbackTypeIcons[type as keyof typeof FeedbackTypeIcons] || FeedbackTypeIcons.default
  }
  
  const getFeedbackColor = (type: string) => {
    return FeedbackTypeColors[type as keyof typeof FeedbackTypeColors] || FeedbackTypeColors.default
  }
  
  const determineFeedbackType = (feedback: FeedbackItem): string => {
    const content = feedback.content.toLowerCase()
    
    if (content.includes('hint') || content.includes('tip')) return 'hint'
    if (content.includes('great') || content.includes('excellent') || content.includes('good')) return 'encouragement'
    if (content.includes('break') || content.includes('rest')) return 'break_suggestion'
    if (content.includes('challenge') || content.includes('harder')) return 'difficulty_increase'
    if (content.includes('slow') || content.includes('easier')) return 'difficulty_decrease'
    if (content.includes('pace') || content.includes('speed')) return 'pacing_adjustment'
    if (content.includes('success') || content.includes('complete')) return 'success'
    if (content.includes('warning') || content.includes('careful')) return 'warning'
    
    return 'info'
  }
  
  const renderFeedbackByType = (feedback: FeedbackItem) => {
    const feedbackType = determineFeedbackType(feedback)
    const IconComponent = getFeedbackIcon(feedbackType)
    const colorClass = getFeedbackColor(feedbackType)
    
    switch (feedback.type) {
      case 'popup':
        return renderPopupFeedback(feedback, IconComponent, colorClass, feedbackType)
      case 'tooltip':
        return renderTooltipFeedback(feedback, IconComponent, colorClass, feedbackType)
      case 'overlay':
        return renderOverlayFeedback(feedback, IconComponent, colorClass, feedbackType)
      case 'animation':
        return renderAnimationFeedback(feedback, IconComponent, colorClass, feedbackType)
      default:
        return renderDefaultFeedback(feedback, IconComponent, colorClass, feedbackType)
    }
  }
  
  const renderPopupFeedback = (
    feedback: FeedbackItem, 
    IconComponent: any, 
    colorClass: string,
    feedbackType: string
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className={`fixed bottom-6 right-6 max-w-sm ${colorClass} text-white rounded-xl shadow-2xl z-50 overflow-hidden`}
      style={feedback.style}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div 
              className="text-sm font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ __html: feedback.content }}
            />
          </div>
          <button
            onClick={() => onDismiss(feedback.id)}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {feedbackType === 'break_suggestion' && (
          <div className="mt-3 flex space-x-2">
            <button 
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs py-2 px-3 rounded-lg transition-colors"
              onClick={() => onDismiss(feedback.id)}
            >
              Take Break
            </button>
            <button 
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs py-2 px-3 rounded-lg transition-colors"
              onClick={() => onDismiss(feedback.id)}
            >
              Continue
            </button>
          </div>
        )}
        
        {feedback.duration > 0 && (
          <div className="mt-2">
            <div className="h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: feedback.duration / 1000, ease: 'linear' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
  
  const renderTooltipFeedback = (
    feedback: FeedbackItem, 
    IconComponent: any, 
    colorClass: string,
    feedbackType: string
  ) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`fixed ${colorClass} text-white text-sm rounded-lg shadow-lg z-40 max-w-xs`}
      style={{
        left: feedback.position?.x || '50%',
        top: feedback.position?.y || '50%',
        transform: 'translate(-50%, -100%)',
        ...feedback.style
      }}
    >
      <div className="relative p-3">
        <div className="flex items-center space-x-2">
          <IconComponent className="w-4 h-4 flex-shrink-0" />
          <div 
            className="flex-1"
            dangerouslySetInnerHTML={{ __html: feedback.content }}
          />
          <button
            onClick={() => onDismiss(feedback.id)}
            className="flex-shrink-0 text-white hover:text-gray-200"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        
        {/* Tooltip arrow */}
        <div 
          className={`absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 ${colorClass} rotate-45`}
        />
      </div>
    </motion.div>
  )
  
  const renderOverlayFeedback = (
    feedback: FeedbackItem, 
    IconComponent: any, 
    colorClass: string,
    feedbackType: string
  ) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={() => onDismiss(feedback.id)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        style={feedback.style}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${colorClass} text-white rounded-full mb-4`}>
            <IconComponent className="w-8 h-8" />
          </div>
          
          <div 
            className="text-gray-900 text-lg font-medium mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: feedback.content }}
          />
          
          {feedbackType === 'break_suggestion' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Take a moment to recharge your mind. You'll come back stronger!
              </div>
              <div className="flex space-x-3">
                <button 
                  className={`flex-1 ${colorClass} text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity`}
                  onClick={() => onDismiss(feedback.id)}
                >
                  Take 5 Min Break
                </button>
                <button 
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  onClick={() => onDismiss(feedback.id)}
                >
                  Continue Learning
                </button>
              </div>
            </div>
          )}
          
          {feedbackType !== 'break_suggestion' && (
            <button
              onClick={() => onDismiss(feedback.id)}
              className={`${colorClass} text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity`}
            >
              Got it!
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
  
  const renderAnimationFeedback = (
    feedback: FeedbackItem, 
    IconComponent: any, 
    colorClass: string,
    feedbackType: string
  ) => (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        scale: [0, 1.2, 1, 0.8],
        rotate: [0, 10, -10, 0]
      }}
      transition={{ 
        duration: 2,
        times: [0, 0.3, 0.7, 1],
        repeat: feedback.duration > 2000 ? Math.floor(feedback.duration / 2000) : 0
      }}
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${colorClass} text-white rounded-full p-4 z-40`}
      style={feedback.style}
      onAnimationComplete={() => onDismiss(feedback.id)}
    >
      <IconComponent className="w-8 h-8" />
    </motion.div>
  )
  
  const renderDefaultFeedback = (
    feedback: FeedbackItem, 
    IconComponent: any, 
    colorClass: string,
    feedbackType: string
  ) => (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`fixed top-20 right-6 ${colorClass} text-white rounded-lg shadow-lg z-40 max-w-sm`}
      style={feedback.style}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div 
            className="flex-1 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: feedback.content }}
          />
          <button
            onClick={() => onDismiss(feedback.id)}
            className="flex-shrink-0 text-white hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
  
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {visibleItems.map((feedback) => (
          <div key={feedback.id}>
            {renderFeedbackByType(feedback)}
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Specialized feedback components for different scenarios
export function AdaptationStatusIndicator({ 
  isEnabled, 
  adaptationCount, 
  isProcessing 
}: { 
  isEnabled: boolean
  adaptationCount: number
  isProcessing: boolean
}) {
  if (!isEnabled) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 left-6 bg-white bg-opacity-90 backdrop-blur-sm rounded-full shadow-lg z-30"
    >
      <div className="flex items-center space-x-2 px-3 py-2">
        <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-xs font-medium text-gray-700">
          Smart Learning {isProcessing ? 'Adapting...' : 'Active'}
        </span>
        {adaptationCount > 0 && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {adaptationCount}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function EngagementMeter({ 
  level, 
  className = '' 
}: { 
  level: number
  className?: string
}) {
  const getEngagementColor = (level: number) => {
    if (level >= 0.8) return 'bg-green-500'
    if (level >= 0.6) return 'bg-yellow-500'
    if (level >= 0.4) return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  const getEngagementLabel = (level: number) => {
    if (level >= 0.8) return 'Highly Engaged'
    if (level >= 0.6) return 'Good Focus'
    if (level >= 0.4) return 'Moderate Focus'
    return 'Low Engagement'
  }
  
  return (
    <div className={`bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Engagement</span>
            <span className="text-xs text-gray-500">{Math.round(level * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-full rounded-full ${getEngagementColor(level)}`}
              initial={{ width: 0 }}
              animate={{ width: `${level * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getEngagementLabel(level)}
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${getEngagementColor(level)}`} />
      </div>
    </div>
  )
}