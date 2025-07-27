'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useUserProfile } from '@/lib/store'
import { useAdaptivePath, useAdaptivePreferences, useAdaptationMonitoring } from '@/hooks/useAdaptivePath'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'
import type { PathConstraints, LearningPreferences } from '@/lib/adaptive-path-generator'
import type { ContentItem } from '@/types'

interface AdaptivePathDashboardProps {
  learningGoals?: LearningObjective[]
  availableContent?: ContentItem[]
  onPathGenerated?: (recommendation: any) => void
  className?: string
}

export default function AdaptivePathDashboard({
  learningGoals = [],
  availableContent = [],
  onPathGenerated,
  className = ''
}: AdaptivePathDashboardProps) {
  const userProfile = useUserProfile()
  const [activeTab, setActiveTab] = useState<'overview' | 'preferences' | 'adaptations' | 'alternatives'>('overview')
  const [showConstraints, setShowConstraints] = useState(false)
  const [constraints, setConstraints] = useState<Partial<PathConstraints>>({
    maxDailyTime: 120,
    maxSessionTime: 60,
    difficultyLimits: { min: 1, max: 8 }
  })

  const adaptivePath = useAdaptivePath(
    userProfile?.id || 'demo-user',
    userProfile!
  )

  const preferences = useAdaptivePreferences(userProfile?.id || 'demo-user')
  const monitoring = useAdaptationMonitoring(userProfile?.id || 'demo-user')

  // Auto-generate path when goals are provided
  useEffect(() => {
    if (learningGoals.length > 0 && userProfile && !adaptivePath.currentRecommendation && !adaptivePath.isGenerating) {
      adaptivePath.generateAdaptivePath(learningGoals, availableContent, constraints)
        .then(recommendation => {
          if (onPathGenerated) {
            onPathGenerated(recommendation)
          }
        })
        .catch(console.error)
    }
  }, [learningGoals, userProfile, availableContent, constraints, adaptivePath, onPathGenerated])

  // Handle path generation
  const handleGeneratePath = useCallback(async () => {
    if (!userProfile) return

    try {
      const goals = learningGoals.length > 0 ? learningGoals : generateDefaultGoals()
      const recommendation = await adaptivePath.generateAdaptivePath(goals, availableContent, constraints)
      
      if (onPathGenerated) {
        onPathGenerated(recommendation)
      }
    } catch (error) {
      console.error('Failed to generate adaptive path:', error)
    }
  }, [userProfile, learningGoals, availableContent, constraints, adaptivePath, onPathGenerated])

  // Generate default goals if none provided
  const generateDefaultGoals = useCallback((): LearningObjective[] => {
    if (!userProfile) return []

    const subject = userProfile.subject || 'General'
    return [
      {
        id: `${subject.toLowerCase()}_adaptive_goal`,
        title: `Adaptive ${subject} Learning`,
        description: `Personalized learning path for ${subject} with real-time adaptations`,
        subject,
        difficulty: userProfile.level === 'beginner' ? 4 : userProfile.level === 'intermediate' ? 6 : 8,
        estimatedTime: 90,
        prerequisites: [],
        skills: [`${subject.toLowerCase()}_adaptive`, 'self_directed_learning'],
        conceptTags: ['adaptive', 'personalized'],
        masteryThreshold: 0.8
      }
    ]
  }, [userProfile])

  // Handle preference updates
  const handlePreferenceUpdate = useCallback(async (key: keyof LearningPreferences, value: any) => {
    try {
      await preferences.updatePreference(key, value)
      if (preferences.preferences) {
        await adaptivePath.updatePreferences({ [key]: value })
      }
    } catch (error) {
      console.error('Failed to update preference:', error)
    }
  }, [preferences, adaptivePath])

  if (!userProfile) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎯</span>
          </div>
          <p>Please complete your profile to access adaptive learning paths</p>
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
              Adaptive Learning Path
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered personalized learning with real-time adaptations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {adaptivePath.isPathActive && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Active</span>
              </div>
            )}
            <button
              onClick={() => setShowConstraints(!showConstraints)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showConstraints ? 'Hide' : 'Show'} Constraints
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mt-4">
          {(['overview', 'preferences', 'adaptations', 'alternatives'] as const).map((tab) => (
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

      {/* Constraints Panel */}
      {showConstraints && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Learning Constraints</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Daily Time (minutes)
              </label>
              <input
                type="number"
                value={constraints.maxDailyTime || 120}
                onChange={(e) => setConstraints(prev => ({
                  ...prev,
                  maxDailyTime: parseInt(e.target.value) || 120
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="30"
                max="480"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Session Time (minutes)
              </label>
              <input
                type="number"
                value={constraints.maxSessionTime || 60}
                onChange={(e) => setConstraints(prev => ({
                  ...prev,
                  maxSessionTime: parseInt(e.target.value) || 60
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="15"
                max="180"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={constraints.difficultyLimits?.min || 1}
                  onChange={(e) => setConstraints(prev => ({
                    ...prev,
                    difficultyLimits: {
                      ...prev.difficultyLimits!,
                      min: parseInt(e.target.value) || 1
                    }
                  }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="1"
                  max="10"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={constraints.difficultyLimits?.max || 8}
                  onChange={(e) => setConstraints(prev => ({
                    ...prev,
                    difficultyLimits: {
                      ...prev.difficultyLimits!,
                      max: parseInt(e.target.value) || 8
                    }
                  }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="1"
                  max="10"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            adaptivePath={adaptivePath}
            onGeneratePath={handleGeneratePath}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesTab
            preferences={preferences.preferences}
            onPreferenceUpdate={handlePreferenceUpdate}
            isLoading={preferences.isLoading}
          />
        )}

        {activeTab === 'adaptations' && (
          <AdaptationsTab
            adaptivePath={adaptivePath}
            monitoring={monitoring}
          />
        )}

        {activeTab === 'alternatives' && (
          <AlternativesTab
            adaptivePath={adaptivePath}
            onSelectAlternative={(path) => console.log('Selected alternative:', path)}
          />
        )}
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ adaptivePath, onGeneratePath }: any) {
  return (
    <div className="space-y-6">
      {/* Current Path Status */}
      {adaptivePath.currentRecommendation ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Active Learning Path</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Confidence:</span>
              <span className="ml-2 font-medium">
                {Math.round(adaptivePath.currentRecommendation.confidenceScore * 100)}%
              </span>
            </div>
            <div>
              <span className="text-blue-700">Completion:</span>
              <span className="ml-2 font-medium">
                {Math.round(adaptivePath.currentRecommendation.expectedOutcomes.completionProbability * 100)}%
              </span>
            </div>
            <div>
              <span className="text-blue-700">Adaptations:</span>
              <span className="ml-2 font-medium">
                {adaptivePath.adaptationTriggers.length} active
              </span>
            </div>
            <div>
              <span className="text-blue-700">Optimizations:</span>
              <span className="ml-2 font-medium">
                {adaptivePath.realTimeOptimizations.length} running
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">No Active Learning Path</h4>
          <p className="text-gray-600 text-sm mb-4">
            Generate a personalized adaptive learning path to get started
          </p>
          <button
            onClick={onGeneratePath}
            disabled={adaptivePath.isGenerating}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              adaptivePath.isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {adaptivePath.isGenerating ? 'Generating...' : 'Generate Adaptive Path'}
          </button>
        </div>
      )}

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(adaptivePath.metrics.adaptationEffectiveness * 100)}%
          </div>
          <div className="text-sm text-green-700">Adaptation Effectiveness</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {adaptivePath.metrics.totalAdaptations}
          </div>
          <div className="text-sm text-blue-700">Total Adaptations</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(adaptivePath.metrics.pathOptimizationScore * 100)}%
          </div>
          <div className="text-sm text-purple-700">Path Optimization</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {adaptivePath.metrics.engagementTrend === 'improving' ? '📈' : 
             adaptivePath.metrics.engagementTrend === 'declining' ? '📉' : '📊'}
          </div>
          <div className="text-sm text-orange-700">Engagement Trend</div>
        </div>
      </div>

      {/* Recommendations */}
      {adaptivePath.hasRecommendations && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">AI Recommendations</h4>
          <div className="space-y-2">
            {adaptivePath.getHighPriorityRecommendations().slice(0, 3).map((rec, index) => (
              <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority}
                  </span>
                  <span className="text-xs text-gray-500">{rec.estimatedImpact * 100}% impact</span>
                </div>
                <p className="text-sm text-gray-900 mt-1 font-medium">{rec.title}</p>
                <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {adaptivePath.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{adaptivePath.error}</p>
        </div>
      )}
    </div>
  )
}

// Preferences Tab Component
function PreferencesTab({ preferences, onPreferenceUpdate, isLoading }: any) {
  if (!preferences) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">⚙️</span>
        </div>
        <p className="text-gray-600">Loading preferences...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Learning Pace</label>
          <select
            value={preferences.learningPace}
            onChange={(e) => onPreferenceUpdate('learningPace', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="slow">Slow</option>
            <option value="moderate">Moderate</option>
            <option value="fast">Fast</option>
            <option value="adaptive">Adaptive</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Length (minutes)</label>
          <input
            type="number"
            value={preferences.sessionLength}
            onChange={(e) => onPreferenceUpdate('sessionLength', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min="15"
            max="120"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Progression</label>
          <select
            value={preferences.difficultyProgression}
            onChange={(e) => onPreferenceUpdate('difficultyProgression', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="gradual">Gradual</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adaptation Sensitivity</label>
          <select
            value={preferences.adaptationSensitivity}
            onChange={(e) => onPreferenceUpdate('adaptationSensitivity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Frequency</label>
          <select
            value={preferences.feedbackFrequency}
            onChange={(e) => onPreferenceUpdate('feedbackFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="minimal">Minimal</option>
            <option value="moderate">Moderate</option>
            <option value="frequent">Frequent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Motivation Style</label>
          <select
            value={preferences.motivationStyle}
            onChange={(e) => onPreferenceUpdate('motivationStyle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="achievement">Achievement</option>
            <option value="progress">Progress</option>
            <option value="social">Social</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Content Types</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {['video', 'text', 'interactive', 'quiz', 'ai_lesson'].map(type => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.preferredContentTypes.includes(type)}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...preferences.preferredContentTypes, type]
                    : preferences.preferredContentTypes.filter(t => t !== type)
                  onPreferenceUpdate('preferredContentTypes', newTypes)
                }}
                className="rounded"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// Adaptations Tab Component
function AdaptationsTab({ adaptivePath, monitoring }: any) {
  return (
    <div className="space-y-6">
      {/* Active Adaptations */}
      {adaptivePath.hasActiveAdaptations && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recent Adaptations</h4>
          <div className="space-y-3">
            {adaptivePath.getRecentAdaptations(5).map((adaptation, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{adaptation.adaptationType}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(adaptation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Trigger: {adaptation.trigger}</p>
                {adaptation.effectiveness !== null && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Effectiveness:</span>
                      <span className={`font-medium ${
                        adaptation.effectiveness > 0.7 ? 'text-green-600' :
                        adaptation.effectiveness > 0.4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round(adaptation.effectiveness * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adaptation Triggers */}
      {adaptivePath.adaptationTriggers.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Active Triggers</h4>
          <div className="space-y-2">
            {adaptivePath.getActiveTriggers().map((trigger, index) => (
              <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-orange-900">{trigger.triggerId}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trigger.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    trigger.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {trigger.priority}
                  </span>
                </div>
                <p className="text-sm text-orange-700 mt-1">{trigger.condition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitoring Metrics */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Adaptation Effectiveness</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-green-600">
              {Math.round(monitoring.effectivenessMetrics.averageEffectiveness * 100)}%
            </div>
            <div className="text-sm text-green-700">Average Effectiveness</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-blue-600 capitalize">
              {monitoring.effectivenessMetrics.bestAdaptationType || 'N/A'}
            </div>
            <div className="text-sm text-blue-700">Best Adaptation Type</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-purple-600 capitalize">
              {monitoring.effectivenessMetrics.improvementTrend}
            </div>
            <div className="text-sm text-purple-700">Improvement Trend</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Alternatives Tab Component
function AlternativesTab({ adaptivePath, onSelectAlternative }: any) {
  return (
    <div className="space-y-6">
      {adaptivePath.hasAlternatives ? (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Alternative Learning Paths</h4>
          <div className="space-y-4">
            {adaptivePath.alternativePaths.map((path, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{path.title}</h5>
                  <span className="text-sm text-gray-500">{path.estimatedTime} min</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{path.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="ml-2 font-medium">{path.difficultyLevel}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Adaptations:</span>
                    <span className="ml-2 font-medium">{path.adaptationPoints}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Suitability:</span>
                    <span className="ml-2 font-medium">{Math.round(path.suitabilityScore * 100)}%</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectAlternative(path)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Select This Path
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔀</span>
          </div>
          <p className="text-gray-600">No alternative paths available</p>
          <p className="text-sm text-gray-500 mt-1">Generate a learning path first to see alternatives</p>
        </div>
      )}
    </div>
  )
}