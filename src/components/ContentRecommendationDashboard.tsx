'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useUserProfile } from '@/lib/store'
import { useContentRecommendations, useRecommendationAnalytics } from '@/hooks/useContentRecommendations'
import type { ContentRecommendation, RecommendationFactor } from '@/lib/content-recommendation-engine'
import type { ContentItem } from '@/types'

interface ContentRecommendationDashboardProps {
  onContentSelect?: (content: ContentItem) => void
  onRecommendationFeedback?: (contentId: string, feedback: 'positive' | 'negative' | 'neutral') => void
  className?: string
}

export default function ContentRecommendationDashboard({
  onContentSelect,
  onRecommendationFeedback,
  className = ''
}: ContentRecommendationDashboardProps) {
  const userProfile = useUserProfile()
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analytics' | 'filters' | 'explanations'>('recommendations')
  const [selectedRecommendation, setSelectedRecommendation] = useState<ContentRecommendation | null>(null)
  const [showExplanations, setShowExplanations] = useState(true)

  const recommendations = useContentRecommendations(
    userProfile?.id || 'demo-user',
    userProfile!
  )

  const analytics = useRecommendationAnalytics(
    userProfile?.id || 'demo-user',
    userProfile!
  )

  // Auto-load analytics when component mounts
  useEffect(() => {
    if (userProfile && !analytics.hasAnalytics && !analytics.isLoading) {
      analytics.loadAnalytics().catch(console.error)
    }
  }, [userProfile, analytics])

  // Handle content selection
  const handleContentSelect = useCallback((content: ContentItem) => {
    if (onContentSelect) {
      onContentSelect(content)
    }
    
    // Record view interaction
    recommendations.recordInteraction(content.id, 'view', {
      duration: 0,
      engagementScore: 0.3,
      completionRate: 0
    }).catch(console.error)
  }, [onContentSelect, recommendations])

  // Handle recommendation feedback
  const handleFeedback = useCallback(async (contentId: string, feedback: 'positive' | 'negative' | 'neutral') => {
    try {
      const engagementScore = feedback === 'positive' ? 0.9 : feedback === 'negative' ? 0.1 : 0.5
      
      await recommendations.recordInteraction(contentId, feedback === 'positive' ? 'like' : 'view', {
        duration: 5,
        engagementScore,
        completionRate: 0.3,
        qualityRating: feedback === 'positive' ? 5 : feedback === 'negative' ? 1 : 3
      })

      if (onRecommendationFeedback) {
        onRecommendationFeedback(contentId, feedback)
      }

      // Refresh recommendations after feedback
      await recommendations.refreshRecommendations()

    } catch (error) {
      console.error('Failed to record feedback:', error)
    }
  }, [recommendations, onRecommendationFeedback])

  // Handle filter updates
  const handleFilterUpdate = useCallback((newFilters: any) => {
    recommendations.updateFilters(newFilters)
  }, [recommendations])

  // Generate new recommendations
  const handleGenerateRecommendations = useCallback(async () => {
    try {
      await recommendations.generateRecommendations()
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    }
  }, [recommendations])

  if (!userProfile) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎯</span>
          </div>
          <p>Please complete your profile to access personalized content recommendations</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Content Recommendations
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered personalized content suggestions with detailed explanations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {recommendations.hasRecommendations && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600">{recommendations.filteredRecommendations.length} Active</span>
              </div>
            )}
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className="text-sm text-gray-600 hover:text-gray-700 transition-colors"
            >
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mt-4">
          {(['recommendations', 'analytics', 'filters', 'explanations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={recommendations}
            onContentSelect={handleContentSelect}
            onFeedback={handleFeedback}
            onGenerate={handleGenerateRecommendations}
            showExplanations={showExplanations}
            selectedRecommendation={selectedRecommendation}
            onSelectRecommendation={setSelectedRecommendation}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            analytics={analytics}
            recommendations={recommendations}
          />
        )}

        {activeTab === 'filters' && (
          <FiltersTab
            filters={recommendations.filters}
            onUpdateFilters={handleFilterUpdate}
          />
        )}

        {activeTab === 'explanations' && (
          <ExplanationsTab
            recommendations={recommendations}
            selectedRecommendation={selectedRecommendation}
          />
        )}
      </div>
    </div>
  )
}

// Recommendations Tab Component
function RecommendationsTab({ 
  recommendations, 
  onContentSelect, 
  onFeedback, 
  onGenerate, 
  showExplanations,
  selectedRecommendation,
  onSelectRecommendation 
}: any) {
  return (
    <div className="space-y-6">
      {/* Generate Button & Status */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGenerate}
          disabled={recommendations.isGenerating}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            recommendations.isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {recommendations.isGenerating ? 'Generating...' : 'Generate New Recommendations'}
        </button>

        {recommendations.hasBatch && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Quality Score:</span> {Math.round(recommendations.currentBatch.qualityScore * 100)}%
            <span className="ml-4 font-medium">Diversity:</span> {Math.round(recommendations.currentBatch.diversityScore * 100)}%
          </div>
        )}
      </div>

      {/* Recommendations List */}
      {recommendations.hasRecommendations ? (
        <div className="space-y-4">
          {recommendations.filteredRecommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.contentId}
              recommendation={recommendation}
              index={index}
              showExplanations={showExplanations}
              isSelected={selectedRecommendation?.contentId === recommendation.contentId}
              onSelect={onSelectRecommendation}
              onContentSelect={onContentSelect}
              onFeedback={onFeedback}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">No Recommendations Yet</h4>
          <p className="text-gray-600 text-sm mb-4">
            Generate personalized content recommendations to get started
          </p>
          <button
            onClick={onGenerate}
            disabled={recommendations.isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {recommendations.isGenerating ? 'Generating...' : 'Generate Recommendations'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {recommendations.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{recommendations.error}</p>
        </div>
      )}
    </div>
  )
}

// Individual Recommendation Card
function RecommendationCard({ 
  recommendation, 
  index, 
  showExplanations, 
  isSelected, 
  onSelect, 
  onContentSelect, 
  onFeedback 
}: any) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | 'neutral' | null>(null)

  const handleFeedback = useCallback(async (feedbackType: 'positive' | 'negative' | 'neutral') => {
    setFeedback(feedbackType)
    await onFeedback(recommendation.contentId, feedbackType)
  }, [recommendation.contentId, onFeedback])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥'
      case 'quiz': return '❓'
      case 'ai_lesson': return '🤖'
      case 'interactive': return '🎮'
      case 'link': return '🔗'
      default: return '📄'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div 
      className={`p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer ${
        isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={() => onSelect(recommendation)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getTypeIcon(recommendation.content.type)}</span>
          <div>
            <h4 className="font-medium text-gray-900">{recommendation.content.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{recommendation.content.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
            {recommendation.priority}
          </span>
          <span className="text-sm text-gray-500">#{index + 1}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-600">Score:</span>
          <span className="ml-2 font-medium">{Math.round(recommendation.score * 100)}%</span>
        </div>
        <div>
          <span className="text-gray-600">Confidence:</span>
          <span className="ml-2 font-medium">{Math.round(recommendation.confidence * 100)}%</span>
        </div>
        <div>
          <span className="text-gray-600">Engagement:</span>
          <span className="ml-2 font-medium">{Math.round(recommendation.estimatedEngagement * 100)}%</span>
        </div>
        <div>
          <span className="text-gray-600">Impact:</span>
          <span className="ml-2 font-medium">{Math.round(recommendation.learningImpact * 100)}%</span>
        </div>
      </div>

      {/* Reasoning */}
      {showExplanations && (
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <p className="text-sm text-gray-700">{recommendation.reasoning}</p>
          {recommendation.factors.length > 0 && (
            <div className="mt-2 space-y-1">
              {recommendation.factors.slice(0, 2).map((factor, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{factor.description}</span>
                  <span className="font-medium">{Math.round(factor.value * factor.weight * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onContentSelect(recommendation.content)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Start Learning
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleFeedback('positive')
            }}
            className={`p-2 rounded-lg transition-colors ${
              feedback === 'positive' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Good recommendation"
          >
            👍
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleFeedback('negative')
            }}
            className={`p-2 rounded-lg transition-colors ${
              feedback === 'negative' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Poor recommendation"
          >
            👎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleFeedback('neutral')
            }}
            className={`p-2 rounded-lg transition-colors ${
              feedback === 'neutral' ? 'bg-gray-100 text-gray-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Not interested"
          >
            ❓
          </button>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab({ analytics, recommendations }: any) {
  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(recommendations.metrics.averageEngagementScore * 100)}%
          </div>
          <div className="text-sm text-blue-700">Avg Engagement</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(recommendations.metrics.diversityScore * 100)}%
          </div>
          <div className="text-sm text-green-700">Diversity Score</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {recommendations.metrics.totalRecommendations}
          </div>
          <div className="text-sm text-purple-700">Total Recommendations</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(analytics.satisfactionScore * 100)}%
          </div>
          <div className="text-sm text-orange-700">Satisfaction</div>
        </div>
      </div>

      {/* Analytics Details */}
      {analytics.hasAnalytics ? (
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Recommendation Performance</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Engagement Rate:</span>
                <span className="ml-2 font-medium">{Math.round(analytics.engagementRate * 100)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Completion Rate:</span>
                <span className="ml-2 font-medium">{Math.round(analytics.analytics?.completionRate * 100 || 0)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Discovery Rate:</span>
                <span className="ml-2 font-medium">{Math.round(analytics.discoveryRate * 100)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Learning Velocity:</span>
                <span className="ml-2 font-medium">+{Math.round((analytics.analytics?.learningVelocityImprovement || 0) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Improvement Suggestions</h4>
            <div className="space-y-2">
              {(analytics.analytics?.improvementSuggestions || []).map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-600">No analytics data available yet</p>
          <button
            onClick={() => analytics.loadAnalytics()}
            disabled={analytics.isLoading}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {analytics.isLoading ? 'Loading...' : 'Load Analytics'}
          </button>
        </div>
      )}
    </div>
  )
}

// Filters Tab Component
function FiltersTab({ filters, onUpdateFilters }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Types</label>
          <div className="space-y-2">
            {['video', 'quiz', 'ai_lesson', 'interactive', 'link'].map(type => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.contentTypes.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.contentTypes, type]
                      : filters.contentTypes.filter((t: string) => t !== type)
                    onUpdateFilters({ contentTypes: newTypes })
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Range</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Min Difficulty</label>
              <input
                type="range"
                min="1"
                max="10"
                value={filters.difficultyRange.min}
                onChange={(e) => onUpdateFilters({
                  difficultyRange: {
                    ...filters.difficultyRange,
                    min: parseInt(e.target.value)
                  }
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{filters.difficultyRange.min}</span>
            </div>
            <div>
              <label className="text-xs text-gray-600">Max Difficulty</label>
              <input
                type="range"
                min="1"
                max="10"
                value={filters.difficultyRange.max}
                onChange={(e) => onUpdateFilters({
                  difficultyRange: {
                    ...filters.difficultyRange,
                    max: parseInt(e.target.value)
                  }
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{filters.difficultyRange.max}</span>
            </div>
          </div>
        </div>

        {/* Time Available */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Available: {filters.timeAvailable} minutes
          </label>
          <input
            type="range"
            min="5"
            max="120"
            value={filters.timeAvailable}
            onChange={(e) => onUpdateFilters({ timeAvailable: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Diversity Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diversity Level: {Math.round(filters.diversityLevel * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={filters.diversityLevel}
            onChange={(e) => onUpdateFilters({ diversityLevel: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Boolean Filters */}
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.showOnlyNew}
            onChange={(e) => onUpdateFilters({ showOnlyNew: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Show only new content</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.excludeCompleted}
            onChange={(e) => onUpdateFilters({ excludeCompleted: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Exclude completed content</span>
        </label>
      </div>
    </div>
  )
}

// Explanations Tab Component
function ExplanationsTab({ recommendations, selectedRecommendation }: any) {
  return (
    <div className="space-y-6">
      {selectedRecommendation ? (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Why we recommended: {selectedRecommendation.content.title}
          </h4>
          
          <div className="space-y-4">
            {/* Overall Reasoning */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Overall Reasoning</h5>
              <p className="text-sm text-blue-800">{selectedRecommendation.reasoning}</p>
            </div>

            {/* Detailed Factors */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Recommendation Factors</h5>
              <div className="space-y-3">
                {selectedRecommendation.factors.map((factor: any, index: number) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 capitalize">
                        {factor.factorType.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {Math.round(factor.value * factor.weight * 100)}% impact
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{factor.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Weight: {Math.round(factor.weight * 100)}%</span>
                      <span>Confidence: {Math.round(factor.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Algorithm Used */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-1">Algorithm</h5>
              <span className="text-sm text-gray-700 capitalize">
                {selectedRecommendation.recommendationType.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">💭</span>
          </div>
          <p className="text-gray-600">Select a recommendation to see detailed explanations</p>
        </div>
      )}
    </div>
  )
}