'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bot, 
  Loader, 
  RefreshCw, 
  BookOpen, 
  Lightbulb,
  AlertCircle,
  User,
  Shield
} from 'lucide-react'
import type { UserProfile } from '@/types'

interface AILessonCardProps {
  topic: string
  userProfile: UserProfile
  onInteraction?: (action: string, data?: unknown) => void
  safetyContext?: {
    checkAIContent: (content: string, contentType: string, context: any) => Promise<boolean>
    safetyLevel: 'minimal' | 'standard' | 'strict' | 'maximum'
    isMonitored: boolean
  }
}

interface AIResponse {
  content: string
  model: string
  provider: string
  confidence: number
  responseTime: number
  tokensUsed: number
  fallbackUsed: boolean
}

export default function AILessonCard({ topic, userProfile, onInteraction, safetyContext }: AILessonCardProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiMetadata, setAiMetadata] = useState<AIResponse | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleGenerateContent = async () => {
    setIsLoading(true)
    setError(null)
    onInteraction?.('ai_lesson_generate_start', { topic })

    try {
      const response = await fetch('/api/ai/smart-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile,
          topic,
          contentType: 'content',
          difficulty: userProfile.level || 'beginner',
          length: 'medium'
        }),
      })

      const result = await response.json()
      
      if (result.success && result.content) {
        let finalContent = result.content
        
        // Safety check for AI-generated content
        if (safetyContext?.checkAIContent) {
          const isSafe = await safetyContext.checkAIContent(
            finalContent,
            'ai_lesson',
            { userProfile, topic }
          )
          
          if (!isSafe) {
            setError('Content filtered for safety. Please try a different topic.')
            onInteraction?.('ai_content_filtered', { 
              topic, 
              originalContent: finalContent,
              safetyLevel: safetyContext.safetyLevel
            })
            return
          }
        }
        
        setContent(finalContent)
        setAiMetadata(result.metadata)
        setHasGenerated(true)
        onInteraction?.('ai_lesson_generate_success', { 
          topic, 
          model: result.metadata.model,
          provider: result.metadata.provider,
          useCase: result.metadata.useCase,
          safetyChecked: !!safetyContext?.checkAIContent
        })
      } else {
        throw new Error(result.error || 'Failed to generate content')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      onInteraction?.('ai_lesson_generate_error', { topic, error: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setContent(null)
    setError(null)
    setHasGenerated(false)
    handleGenerateContent()
  }

  return (
    <div className="mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-blue-900">
                {aiMetadata ? `${aiMetadata.provider === 'openai' ? 'GPT' : 'Claude'} AI Tutor` : 'AI-Powered Lesson'}
              </div>
              <div className="text-sm text-blue-700 flex items-center space-x-2">
                <span>Personalized for {userProfile.name}</span>
                {aiMetadata && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {aiMetadata.provider === 'openai' ? 'OpenAI' : 'Claude'}
                  </span>
                )}
                {safetyContext?.isMonitored && (
                  <span className="flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    <span>Safe</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          {hasGenerated && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              title="Generate new content"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* AI Model Information */}
        {aiMetadata && (
          <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Generated by {aiMetadata.provider === 'openai' ? 'OpenAI GPT-4o-mini' : `Claude ${aiMetadata.model.includes('sonnet') ? 'Sonnet' : 'Haiku'}`}
                </div>
                <div className="text-xs text-blue-700">
                  Optimized for your learning profile and {topic}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {Math.round(aiMetadata.confidence * 100)}% confidence
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {aiMetadata.responseTime}ms
                  </span>
                  {aiMetadata.fallbackUsed && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Fallback used
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-[120px]">
          {!hasGenerated && !isLoading && !error && (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Ready to learn about {topic}?
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                I&apos;ll create a personalized lesson just for you based on your learning profile.
              </p>
              <motion.button
                onClick={handleGenerateContent}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Generate My Lesson ✨
              </motion.button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-blue-700">
                Generating personalized content using AI...
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Selecting optimal AI model for your learning profile
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-red-700 text-sm mb-4">
                {error === 'AI service not configured' 
                  ? 'AI tutoring is currently unavailable. Please check back later.'
                  : error
                }
              </p>
              <button
                onClick={handleGenerateContent}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {content && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white bg-opacity-80 rounded-lg p-4"
            >
              <div className="prose max-w-none text-gray-800">
                {content.split('\n').map((paragraph, index) => {
                  if (paragraph.trim() === '') return null
                  
                  // Handle headers (lines starting with ##)
                  if (paragraph.startsWith('##')) {
                    return (
                      <h3 key={index} className="text-lg font-semibold text-blue-900 mt-4 mb-2">
                        {paragraph.replace('##', '').trim()}
                      </h3>
                    )
                  }
                  
                  // Handle bullet points
                  if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
                    return (
                      <div key={index} className="flex items-start space-x-2 mb-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="flex-1">{paragraph.replace(/^[•-]\s*/, '')}</span>
                      </div>
                    )
                  }
                  
                  // Regular paragraphs
                  return (
                    <p key={index} className="mb-3 leading-relaxed">
                      {paragraph}
                    </p>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Footer */}
        {hasGenerated && content && (
          <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-blue-700">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span>AI-Generated</span>
              </div>
              {aiMetadata && (
                <div className="flex items-center space-x-1">
                  <Bot className="w-4 h-4" />
                  <span>by {aiMetadata.provider === 'openai' ? 'OpenAI' : 'Claude'}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-blue-600">
              Adapted for your {userProfile.level || 'beginner'} level
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}