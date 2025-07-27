// AI Model Effectiveness Measurement Dashboard
// Advanced analytics for measuring AI model performance and learning outcomes
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, TrendingUp, TrendingDown, Users, Clock, Target,
  Award, AlertCircle, CheckCircle, Activity, BarChart3,
  BookOpen, MessageSquare, Zap, ThumbsUp, ThumbsDown,
  Calendar, Filter, Download, RefreshCw, Eye, Star
} from 'lucide-react'
import type { UserProfile } from '@/types'

interface ModelEffectivenessProps {
  userProfile?: UserProfile
  className?: string
}

interface EffectivenessMetrics {
  modelId: string
  learningOutcome: {
    avgComprehensionScore: number
    knowledgeRetention: number
    conceptMastery: number
    skillProgress: number
  }
  userEngagement: {
    sessionDuration: number
    contentCompletion: number
    returnRate: number
    satisfactionScore: number
  }
  adaptationSuccess: {
    difficultyOptimization: number
    personalizationAccuracy: number
    learningPathEffectiveness: number
    contentRelevance: number
  }
  timeToMastery: number
  errorReduction: number
  motivationImpact: number
  overallEffectiveness: number
}

interface ComparisonData {
  modelA: string
  modelB: string
  useCase: string
  winRate: number
  significanceLevel: number
  improvements: string[]
  recommendation: string
}

interface EffectivenessState {
  timeWindow: '1h' | '24h' | '7d' | '30d'
  selectedModel: string | null
  selectedUseCase: string | null
  filterBy: 'all' | 'high_performers' | 'needs_improvement' | 'new_models'
  showComparisons: boolean
  autoRefresh: boolean
}

export default function ModelEffectivenessDashboard({
  userProfile,
  className = ''
}: ModelEffectivenessProps) {
  const [state, setState] = useState<EffectivenessState>({
    timeWindow: '24h',
    selectedModel: null,
    selectedUseCase: null,
    filterBy: 'all',
    showComparisons: false,
    autoRefresh: true
  })

  const [effectiveness, setEffectiveness] = useState<EffectivenessMetrics[]>([])
  const [comparisons, setComparisons] = useState<ComparisonData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Mock effectiveness data for demo
  useEffect(() => {
    loadEffectivenessData()
  }, [state.timeWindow, state.filterBy])

  // Auto-refresh functionality
  useEffect(() => {
    if (state.autoRefresh) {
      const interval = setInterval(loadEffectivenessData, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [state.autoRefresh])

  const loadEffectivenessData = async () => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const mockData: EffectivenessMetrics[] = [
        {
          modelId: 'gpt-4o-mini',
          learningOutcome: {
            avgComprehensionScore: 0.86,
            knowledgeRetention: 0.78,
            conceptMastery: 0.82,
            skillProgress: 0.75
          },
          userEngagement: {
            sessionDuration: 18.5,
            contentCompletion: 0.89,
            returnRate: 0.73,
            satisfactionScore: 0.85
          },
          adaptationSuccess: {
            difficultyOptimization: 0.81,
            personalizationAccuracy: 0.87,
            learningPathEffectiveness: 0.79,
            contentRelevance: 0.84
          },
          timeToMastery: 12.3,
          errorReduction: 0.34,
          motivationImpact: 0.77,
          overallEffectiveness: 0.82
        },
        {
          modelId: 'claude-3-haiku',
          learningOutcome: {
            avgComprehensionScore: 0.91,
            knowledgeRetention: 0.84,
            conceptMastery: 0.88,
            skillProgress: 0.81
          },
          userEngagement: {
            sessionDuration: 22.1,
            contentCompletion: 0.92,
            returnRate: 0.79,
            satisfactionScore: 0.91
          },
          adaptationSuccess: {
            difficultyOptimization: 0.89,
            personalizationAccuracy: 0.93,
            learningPathEffectiveness: 0.86,
            contentRelevance: 0.90
          },
          timeToMastery: 10.7,
          errorReduction: 0.41,
          motivationImpact: 0.85,
          overallEffectiveness: 0.89
        },
        {
          modelId: 'claude-3-sonnet',
          learningOutcome: {
            avgComprehensionScore: 0.94,
            knowledgeRetention: 0.89,
            conceptMastery: 0.92,
            skillProgress: 0.87
          },
          userEngagement: {
            sessionDuration: 25.8,
            contentCompletion: 0.95,
            returnRate: 0.84,
            satisfactionScore: 0.94
          },
          adaptationSuccess: {
            difficultyOptimization: 0.93,
            personalizationAccuracy: 0.96,
            learningPathEffectiveness: 0.91,
            contentRelevance: 0.94
          },
          timeToMastery: 8.9,
          errorReduction: 0.47,
          motivationImpact: 0.91,
          overallEffectiveness: 0.93
        }
      ]

      setEffectiveness(mockData)
      setLastUpdated(new Date())
      setIsLoading(false)
    }, 800)
  }

  const getEffectivenessColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.8) return 'text-blue-600'
    if (score >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEffectivenessIcon = (score: number) => {
    if (score >= 0.9) return CheckCircle
    if (score >= 0.7) return Activity
    return AlertCircle
  }

  const formatMetric = (value: number, type: 'percentage' | 'duration' | 'days' | 'score') => {
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`
      case 'duration':
        return `${value.toFixed(1)} min`
      case 'days':
        return `${value.toFixed(1)} days`
      case 'score':
        return value.toFixed(3)
      default:
        return value.toString()
    }
  }

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      timeWindow: state.timeWindow,
      effectiveness,
      comparisons,
      summary: {
        avgOverallEffectiveness: effectiveness.reduce((sum, e) => sum + e.overallEffectiveness, 0) / effectiveness.length,
        topPerformingModel: effectiveness.sort((a, b) => b.overallEffectiveness - a.overallEffectiveness)[0]?.modelId,
        totalModelsTracked: effectiveness.length
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `model_effectiveness_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Model Effectiveness</h2>
              <p className="text-purple-100">Learning outcome measurement and optimization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Overall Effectiveness Score */}
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Overall Effectiveness</div>
              <div className="text-2xl font-bold">
                {effectiveness.length > 0 
                  ? formatMetric(effectiveness.reduce((sum, e) => sum + e.overallEffectiveness, 0) / effectiveness.length, 'percentage')
                  : '0%'
                }
              </div>
            </div>
            
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
              className={`p-2 rounded-lg transition-colors ${
                state.autoRefresh 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${state.autoRefresh ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {(['1h', '24h', '7d', '30d'] as const).map((window) => (
              <button
                key={window}
                onClick={() => setState(prev => ({ ...prev, timeWindow: window }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  state.timeWindow === window
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {window}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={state.filterBy}
              onChange={(e) => setState(prev => ({ ...prev, filterBy: e.target.value as any }))}
              className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
            >
              <option value="all">All Models</option>
              <option value="high_performers">High Performers</option>
              <option value="needs_improvement">Needs Improvement</option>
              <option value="new_models">New Models</option>
            </select>
            
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading effectiveness data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Model Effectiveness Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Model Effectiveness Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {effectiveness.map((metrics) => (
                  <ModelEffectivenessCard
                    key={metrics.modelId}
                    metrics={metrics}
                    isSelected={state.selectedModel === metrics.modelId}
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      selectedModel: prev.selectedModel === metrics.modelId ? null : metrics.modelId 
                    }))}
                  />
                ))}
              </div>
            </div>

            {/* Detailed Metrics */}
            {state.selectedModel && (() => {
              const selectedMetrics = effectiveness.find(m => m.modelId === state.selectedModel)
              return selectedMetrics ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">
                    Detailed Analysis: {selectedMetrics.modelId}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Learning Outcomes */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                        Learning Outcomes
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Comprehension:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.learningOutcome.avgComprehensionScore, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retention:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.learningOutcome.knowledgeRetention, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mastery:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.learningOutcome.conceptMastery, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progress:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.learningOutcome.skillProgress, 'percentage')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User Engagement */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-green-500" />
                        User Engagement
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Session Duration:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.userEngagement.sessionDuration, 'duration')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completion:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.userEngagement.contentCompletion, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Return Rate:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.userEngagement.returnRate, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Satisfaction:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.userEngagement.satisfactionScore, 'percentage')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Adaptation Success */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2 text-purple-500" />
                        Adaptation Success
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Difficulty Opt:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.adaptationSuccess.difficultyOptimization, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Personalization:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.adaptationSuccess.personalizationAccuracy, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Path Effectiveness:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.adaptationSuccess.learningPathEffectiveness, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Relevance:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.adaptationSuccess.contentRelevance, 'percentage')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Key Performance Indicators */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                        Key Metrics
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Time to Mastery:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.timeToMastery, 'days')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Reduction:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.errorReduction, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Motivation Impact:</span>
                          <span className="font-medium">
                            {formatMetric(selectedMetrics.motivationImpact, 'percentage')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overall Score:</span>
                          <span className={`font-bold ${getEffectivenessColor(selectedMetrics.overallEffectiveness)}`}>
                            {formatMetric(selectedMetrics.overallEffectiveness, 'percentage')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-4">
            <span>
              {effectiveness.length} models tracked
            </span>
            <span>•</span>
            <span>
              Avg effectiveness: {effectiveness.length > 0 
                ? formatMetric(effectiveness.reduce((sum, e) => sum + e.overallEffectiveness, 0) / effectiveness.length, 'percentage')
                : '0%'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Model Effectiveness Card Component
interface ModelEffectivenessCardProps {
  metrics: EffectivenessMetrics
  isSelected: boolean
  onClick: () => void
}

function ModelEffectivenessCard({ metrics, isSelected, onClick }: ModelEffectivenessCardProps) {
  const EffectivenessIcon = (() => {
    if (metrics.overallEffectiveness >= 0.9) return CheckCircle
    if (metrics.overallEffectiveness >= 0.7) return Activity
    return AlertCircle
  })()

  const effectivenessColor = (() => {
    if (metrics.overallEffectiveness >= 0.9) return 'text-green-600'
    if (metrics.overallEffectiveness >= 0.8) return 'text-blue-600'
    if (metrics.overallEffectiveness >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  })()

  const borderColor = (() => {
    if (metrics.overallEffectiveness >= 0.9) return 'border-green-200'
    if (metrics.overallEffectiveness >= 0.8) return 'border-blue-200'
    if (metrics.overallEffectiveness >= 0.7) return 'border-yellow-200'
    return 'border-red-200'
  })()

  const bgColor = (() => {
    if (metrics.overallEffectiveness >= 0.9) return 'bg-green-50'
    if (metrics.overallEffectiveness >= 0.8) return 'bg-blue-50'
    if (metrics.overallEffectiveness >= 0.7) return 'bg-yellow-50'
    return 'bg-red-50'
  })()

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? `${borderColor} ${bgColor}` 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-900">{metrics.modelId}</h4>
        <EffectivenessIcon className={`w-6 h-6 ${effectivenessColor}`} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Effectiveness</span>
          <span className={`text-lg font-bold ${effectivenessColor}`}>
            {(metrics.overallEffectiveness * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Time to Mastery</span>
          <span className="text-sm font-medium">{metrics.timeToMastery.toFixed(1)} days</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">User Satisfaction</span>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-sm font-medium">
              {(metrics.userEngagement.satisfactionScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Knowledge Retention</span>
          <span className="text-sm font-medium">
            {(metrics.learningOutcome.knowledgeRetention * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}