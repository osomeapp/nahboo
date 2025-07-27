'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserProfile, ContentItem } from '@/types'
import { getStyleIcon, getStyleColor } from '@/lib/learning-style-engine'
import type { StyleAwareDifficultyRecommendation } from '@/lib/style-aware-difficulty'

interface StyleAwareDifficultyPanelProps {
  userProfile: UserProfile
  currentContent?: ContentItem
  onDifficultyAdjustment?: (newDifficulty: number, reasoning: string) => void
  onContentOptimization?: (optimizations: string[]) => void
  className?: string
}

interface DifficultyAnalysis {
  recommendation: StyleAwareDifficultyRecommendation
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export default function StyleAwareDifficultyPanel({
  userProfile,
  currentContent,
  onDifficultyAdjustment,
  onContentOptimization,
  className = ''
}: StyleAwareDifficultyPanelProps) {
  const [analysis, setAnalysis] = useState<DifficultyAnalysis>({
    recommendation: null as any,
    isLoading: false,
    error: null,
    lastUpdated: null
  })
  const [showDetails, setShowDetails] = useState(false)
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState(true)

  // Analyze difficulty needs when content or user changes
  const analyzeDifficulty = useCallback(async () => {
    if (!userProfile) return

    setAnalysis(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/adaptive/style-aware-difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id || 'temp',
          userProfile,
          action: 'analyze_difficulty',
          contentToAnalyze: currentContent,
          currentContext: {
            timestamp: new Date().toISOString(),
            sessionDuration: 15, // Mock session duration
            environmentalFactors: {
              timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                        new Date().getHours() < 17 ? 'afternoon' : 'evening',
              deviceType: 'desktop'
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze difficulty')
      }

      const data = await response.json()
      
      setAnalysis({
        recommendation: data.difficultyRecommendation,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      })

      // Auto-apply difficulty adjustment if enabled and urgent
      if (autoAdjustEnabled && data.difficultyRecommendation.urgency === 'high' && onDifficultyAdjustment) {
        onDifficultyAdjustment(
          data.difficultyRecommendation.recommendedLevel,
          data.difficultyRecommendation.reasoning
        )
      }

    } catch (error) {
      setAnalysis(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }))
    }
  }, [userProfile, currentContent, autoAdjustEnabled, onDifficultyAdjustment])

  // Auto-analyze when dependencies change
  useEffect(() => {
    analyzeDifficulty()
  }, [analyzeDifficulty])

  const handleApplyDifficulty = () => {
    if (analysis.recommendation && onDifficultyAdjustment) {
      onDifficultyAdjustment(
        analysis.recommendation.recommendedLevel,
        analysis.recommendation.reasoning
      )
    }
  }

  const handleApplyOptimizations = () => {
    if (analysis.recommendation && onContentOptimization) {
      const optimizations = [
        ...analysis.recommendation.contentAdaptations.formatChanges,
        ...analysis.recommendation.contentAdaptations.styleEnhancements
      ]
      onContentOptimization(optimizations)
    }
  }

  const getDifficultyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEffectivenessColor = (score: number) => {
    if (score > 0.8) return 'text-green-600'
    if (score > 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <motion.div 
      className={`style-aware-difficulty-panel bg-white rounded-lg border shadow-sm ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg mr-2">🎯</span>
            <h3 className="font-semibold text-gray-900">Personalized Learning</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
            
            <button
              onClick={analyzeDifficulty}
              disabled={analysis.isLoading}
              className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {analysis.isLoading ? '🔄' : '🔍'} Analyze
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {analysis.isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-blue-50 border-b"
          >
            <div className="flex items-center text-blue-700">
              <div className="animate-spin mr-2">🔄</div>
              Analyzing your learning style and difficulty preferences...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {analysis.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 bg-red-50 border-b"
          >
            <div className="flex items-center text-red-700">
              <span className="mr-2">⚠️</span>
              {analysis.error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {analysis.recommendation && !analysis.isLoading && (
        <div className="p-4">
          {/* Style Optimization Summary */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Learning Style Match</span>
              <span className={`text-sm font-medium ${getEffectivenessColor(analysis.recommendation.personalizationInsights.combinedEffectivenessScore)}`}>
                {Math.round(analysis.recommendation.personalizationInsights.combinedEffectivenessScore * 100)}%
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <span className="text-lg mr-1">
                  {getStyleIcon(analysis.recommendation.styleOptimizations.primaryStyle.style)}
                </span>
                <span className="text-sm text-gray-600">
                  {analysis.recommendation.styleOptimizations.primaryStyle.style} learner
                </span>
              </div>
              
              <div className={`px-2 py-1 rounded border text-xs ${getDifficultyBadgeColor(analysis.recommendation.urgency)}`}>
                {analysis.recommendation.urgency} priority
              </div>
            </div>
          </div>

          {/* Difficulty Recommendation */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Recommended Difficulty</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Level</span>
                <span className="font-bold text-lg">
                  {analysis.recommendation.recommendedLevel}
                </span>
                <span className="text-sm text-gray-500">/ 10</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {analysis.recommendation.reasoning}
            </p>
            
            {/* Difficulty Action Button */}
            {analysis.recommendation.adjustmentMagnitude > 0 && (
              <button
                onClick={handleApplyDifficulty}
                className={`w-full text-sm py-2 px-3 rounded ${
                  analysis.recommendation.urgency === 'high' 
                    ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                }`}
              >
                Apply Difficulty Adjustment
              </button>
            )}
          </div>

          {/* Content Optimizations */}
          {analysis.recommendation.contentAdaptations.formatChanges.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Content Optimizations</span>
                <span className="text-xs text-gray-500">
                  {analysis.recommendation.contentAdaptations.formatChanges.length} suggestions
                </span>
              </div>
              
              <div className="space-y-1 mb-3">
                {analysis.recommendation.contentAdaptations.formatChanges.slice(0, 2).map((change, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center">
                    <span className="mr-1">•</span>
                    {change}
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleApplyOptimizations}
                className="w-full text-sm py-2 px-3 rounded bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
              >
                Apply Style Optimizations
              </button>
            </div>
          )}

          {/* Auto-Adjust Toggle */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm text-gray-700">Auto-adjust difficulty</span>
            <button
              onClick={() => setAutoAdjustEnabled(!autoAdjustEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoAdjustEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  autoAdjustEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Detailed View */}
      <AnimatePresence>
        {showDetails && analysis.recommendation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t bg-gray-50"
          >
            <div className="p-4 space-y-4">
              {/* Performance Metrics */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Analysis</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Current Success Rate:</span>
                    <span className="ml-1 font-medium">
                      {Math.round(analysis.recommendation.currentPerformance * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Target Success Rate:</span>
                    <span className="ml-1 font-medium">
                      {Math.round(analysis.recommendation.targetPerformance * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence Level:</span>
                    <span className="ml-1 font-medium">
                      {Math.round(analysis.recommendation.confidence * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Risk Level:</span>
                    <span className="ml-1 font-medium">{analysis.recommendation.riskLevel}</span>
                  </div>
                </div>
              </div>

              {/* Style Analysis */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Style Analysis</h4>
                <div className="space-y-2">
                  <StyleAnalysisRow
                    style={analysis.recommendation.styleOptimizations.primaryStyle.style}
                    confidence={analysis.recommendation.styleOptimizations.primaryStyle.confidenceLevel}
                    isPrimary={true}
                  />
                  {analysis.recommendation.styleOptimizations.secondaryStyles.map((style, index) => (
                    <StyleAnalysisRow
                      key={index}
                      style={style.style}
                      confidence={style.confidenceLevel}
                      isPrimary={false}
                    />
                  ))}
                </div>
              </div>

              {/* Monitoring Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Monitoring</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Monitor for {analysis.recommendation.monitoringPeriod} minutes after adjustment</div>
                  <div>Rollback if performance drops by {Math.round(analysis.recommendation.rollbackThreshold * 100)}%</div>
                  {analysis.lastUpdated && (
                    <div>Last updated: {analysis.lastUpdated.toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Component for displaying style analysis rows
function StyleAnalysisRow({ 
  style, 
  confidence, 
  isPrimary 
}: { 
  style: string
  confidence: number
  isPrimary: boolean 
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center">
        <span className="mr-1">{getStyleIcon(style as any)}</span>
        <span className={isPrimary ? 'font-medium' : 'text-gray-600'}>
          {style} {isPrimary && '(primary)'}
        </span>
      </div>
      <div className="flex items-center">
        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
          <div
            className={`h-1.5 rounded-full ${isPrimary ? 'bg-blue-600' : 'bg-gray-400'}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        <span className="text-gray-500">{Math.round(confidence * 100)}%</span>
      </div>
    </div>
  )
}