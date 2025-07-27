'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserProfile, ContentItem } from '@/types'
import { useLearningStyle } from '@/hooks/useLearningStyle'
import { getStyleColor, getStyleIcon, getStyleDescription, type LearningStyleType } from '@/lib/learning-style-engine'

interface AdaptiveFeedItemProps {
  content: ContentItem
  userProfile: UserProfile
  onContentAdaptation?: (adaptedContent: ContentItem[]) => void
  className?: string
}

interface AdaptationSuggestion {
  style: string
  confidence: number
  description: string
  icon: string
  color: string
  enabled: boolean
}

export default function AdaptiveFeedItem({
  content,
  userProfile,
  onContentAdaptation,
  className = ''
}: AdaptiveFeedItemProps) {
  const [showAdaptations, setShowAdaptations] = useState(false)
  const [isAdapting, setIsAdapting] = useState(false)
  const [adaptedVersions, setAdaptedVersions] = useState<ContentItem[]>([])
  const [adaptationSuggestions, setAdaptationSuggestions] = useState<AdaptationSuggestion[]>([])
  const [selectedAdaptation, setSelectedAdaptation] = useState<string | null>(null)

  const { profile, analyzeContent, contentAnalysis } = useLearningStyle()

  // Analyze content style match when component mounts
  useEffect(() => {
    if (userProfile && content) {
      analyzeContent(userProfile.id || 'temp', userProfile, content.id, content)
    }
  }, [content, userProfile, analyzeContent])

  // Generate adaptation suggestions when content analysis is available
  useEffect(() => {
    if (contentAnalysis && profile) {
      const suggestions = generateAdaptationSuggestions(contentAnalysis, profile)
      setAdaptationSuggestions(suggestions)
    }
  }, [contentAnalysis, profile])

  const handleAdaptContent = useCallback(async (targetStyle?: string) => {
    if (!userProfile || !content) return

    setIsAdapting(true)
    
    try {
      const response = await fetch('/api/learning-style/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id || 'temp',
          userProfile,
          topic: content.title,
          baseContent: content,
          targetStyles: targetStyle ? [targetStyle] : undefined,
          generateAll: !targetStyle,
          contentLength: 'medium'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate adapted content')
      }

      const data = await response.json()
      const adaptedContent = data.generatedContent.map((item: any) => item.content)
      
      setAdaptedVersions(adaptedContent)
      
      if (onContentAdaptation) {
        onContentAdaptation(adaptedContent)
      }

      // Select the best adaptation for the user
      if (data.adaptationSummary.primaryStyleContent) {
        setSelectedAdaptation(data.adaptationSummary.primaryStyleContent.style)
      }

    } catch (error) {
      console.error('Content adaptation failed:', error)
    } finally {
      setIsAdapting(false)
    }
  }, [content, userProfile, onContentAdaptation])

  const getCurrentContent = useCallback(() => {
    if (selectedAdaptation && adaptedVersions.length > 0) {
      const adaptedVersion = adaptedVersions.find(
        version => version.metadata?.learningStyle === selectedAdaptation
      )
      return adaptedVersion || content
    }
    return content
  }, [content, adaptedVersions, selectedAdaptation])

  const getStyleMatchIndicator = () => {
    if (!contentAnalysis) return null

    const styleMatch = contentAnalysis.styleMatch
    const matchLevel = styleMatch > 0.8 ? 'excellent' : 
                     styleMatch > 0.6 ? 'good' : 
                     styleMatch > 0.4 ? 'fair' : 'poor'
    
    const colors = {
      excellent: 'text-green-600 bg-green-100',
      good: 'text-blue-600 bg-blue-100',
      fair: 'text-yellow-600 bg-yellow-100',
      poor: 'text-red-600 bg-red-100'
    }

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${colors[matchLevel]}`}>
        <span className="mr-1">
          {matchLevel === 'excellent' ? '🎯' : 
           matchLevel === 'good' ? '✅' : 
           matchLevel === 'fair' ? '⚠️' : '❌'}
        </span>
        {Math.round(styleMatch * 100)}% match
      </div>
    )
  }

  const currentContent = getCurrentContent()

  return (
    <motion.div 
      className={`adaptive-feed-item ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Style Match Indicator & Adaptation Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStyleMatchIndicator()}
          
          {profile && (
            <div className="text-xs text-gray-600">
              Your style: {getStyleIcon(profile.primaryStyle)} {profile.primaryStyle}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Show adaptations toggle */}
          {adaptationSuggestions.length > 0 && (
            <button
              onClick={() => setShowAdaptations(!showAdaptations)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              🎨 Adaptations
              <span className="ml-1">
                {showAdaptations ? '▼' : '▶'}
              </span>
            </button>
          )}

          {/* Quick adapt button */}
          {contentAnalysis && contentAnalysis.styleMatch < 0.6 && (
            <button
              onClick={() => handleAdaptContent()}
              disabled={isAdapting}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {isAdapting ? '🔄' : '🎯'} Auto-adapt
            </button>
          )}
        </div>
      </div>

      {/* Adaptation Suggestions Panel */}
      <AnimatePresence>
        {showAdaptations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg p-3 mb-4"
          >
            <h4 className="text-sm font-medium mb-2">🎨 Learning Style Adaptations</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {adaptationSuggestions.map((suggestion) => (
                <AdaptationCard
                  key={suggestion.style}
                  suggestion={suggestion}
                  isSelected={selectedAdaptation === suggestion.style}
                  isAdapting={isAdapting}
                  onSelect={() => {
                    if (adaptedVersions.length === 0) {
                      handleAdaptContent(suggestion.style)
                    } else {
                      setSelectedAdaptation(suggestion.style)
                    }
                  }}
                />
              ))}
            </div>

            {isAdapting && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center text-blue-600 text-sm">
                  <div className="animate-spin mr-2">🔄</div>
                  Generating personalized content...
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="content-item">
        {/* Content Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold">{currentContent.title}</h3>
          
          {currentContent.metadata?.learningStyle && (
            <div className="flex items-center text-xs text-gray-600 ml-2">
              <span className="mr-1">
                {getStyleIcon(currentContent.metadata.learningStyle as LearningStyleType)}
              </span>
              {currentContent.metadata.learningStyle} optimized
            </div>
          )}
        </div>

        {/* Content Description */}
        <div className="text-gray-700 mb-3">
          {currentContent.description}
        </div>

        {/* Style-Specific Enhancements */}
        {currentContent.metadata?.styleOptimized && (
          <StyleEnhancementIndicators metadata={currentContent.metadata} />
        )}

        {/* Content Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
          <div className="flex items-center space-x-4">
            <span>📚 {currentContent.subject}</span>
            <span>⏱️ {currentContent.estimated_time} min</span>
            <span>📊 Level {currentContent.difficulty}/10</span>
          </div>
          
          {currentContent.metadata?.aiGenerated && (
            <div className="flex items-center">
              <span className="mr-1">🤖</span>
              AI-generated
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Component for individual adaptation suggestion cards
function AdaptationCard({ 
  suggestion, 
  isSelected, 
  isAdapting, 
  onSelect 
}: {
  suggestion: AdaptationSuggestion
  isSelected: boolean
  isAdapting: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isAdapting}
      className={`p-2 rounded border text-left transition-all duration-200 ${
        isSelected 
          ? `border-${suggestion.color}-500 bg-${suggestion.color}-50` 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      } ${isAdapting ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center mb-1">
        <span className="text-lg mr-1">{suggestion.icon}</span>
        <span className={`text-xs font-medium ${
          isSelected ? `text-${suggestion.color}-800` : 'text-gray-700'
        }`}>
          {suggestion.style.charAt(0).toUpperCase() + suggestion.style.slice(1)}
        </span>
      </div>
      
      <div className={`text-xs ${
        isSelected ? `text-${suggestion.color}-600` : 'text-gray-600'
      }`}>
        {Math.round(suggestion.confidence * 100)}% match
      </div>
    </button>
  )
}

// Component to show style-specific enhancement indicators
function StyleEnhancementIndicators({ metadata }: { metadata: any }) {
  const enhancements = []

  if (metadata.hasImages || metadata.visualEnhanced) {
    enhancements.push({ icon: '🎨', text: 'Visual aids' })
  }
  if (metadata.hasAudio || metadata.audioNarration) {
    enhancements.push({ icon: '🔊', text: 'Audio content' })
  }
  if (metadata.interactiveElements || metadata.handsonActivities) {
    enhancements.push({ icon: '🤹', text: 'Interactive' })
  }
  if (metadata.detailedText || metadata.comprehensiveNotes) {
    enhancements.push({ icon: '📝', text: 'Detailed notes' })
  }

  if (enhancements.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {enhancements.map((enhancement, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
        >
          <span className="mr-1">{enhancement.icon}</span>
          {enhancement.text}
        </span>
      ))}
    </div>
  )
}

// Helper function to generate adaptation suggestions
function generateAdaptationSuggestions(contentAnalysis: any, profile: any): AdaptationSuggestion[] {
  const styles = ['visual', 'auditory', 'kinesthetic', 'reading']
  const userScores = {
    visual: profile.visualScore,
    auditory: profile.auditoryScore,
    kinesthetic: profile.kinestheticScore,
    reading: profile.readingScore
  }

  return styles.map(style => ({
    style,
    confidence: userScores[style] || 0.5,
    description: getStyleDescription(style as LearningStyleType),
    icon: getStyleIcon(style as LearningStyleType),
    color: getStyleColor(style as LearningStyleType).replace('#', ''),
    enabled: userScores[style] > 0.3 // Only show styles with reasonable preference
  })).filter(suggestion => suggestion.enabled)
}