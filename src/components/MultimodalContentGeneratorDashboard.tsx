'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useMultimodalContentGenerator, 
  useContentAnalytics,
  useContentValidation 
} from '@/hooks/useMultimodalContentGenerator'
import { 
  type ContentGenerationRequest,
  type AnyContentFormat,
  type ContentOptimizationConfig
} from '@/lib/multimodal-content-generator'

// Content Generation Tab Component
const ContentGenerationTab: React.FC = () => {
  const {
    generateContentWithProgress,
    generatedContent,
    selectedContent,
    selectContent,
    isGenerating,
    error,
    hasGeneratedContent,
    formatDistribution,
    averageEngagementScore,
    recommendedContent,
    qualityMetrics,
    clearError
  } = useMultimodalContentGenerator()

  const [generationRequest, setGenerationRequest] = useState<ContentGenerationRequest>({
    subject: '',
    topic: '',
    learning_objectives: [''],
    target_audience: {
      age_group: 'adults',
      education_level: 'undergraduate',
      prior_knowledge: 5,
      learning_preferences: []
    },
    content_constraints: {
      max_duration_minutes: 30,
      preferred_formats: ['text'],
      difficulty_range: [3, 7],
      language: 'en'
    },
    context: {
      use_case: 'general_tutoring'
    }
  })

  const [generationProgress, setGenerationProgress] = useState<any>(null)

  const handleGenerateContent = async () => {
    try {
      clearError()
      await generateContentWithProgress(generationRequest, setGenerationProgress)
    } catch (error) {
      console.error('Content generation failed:', error)
    }
  }

  const updateRequest = (updates: Partial<ContentGenerationRequest>) => {
    setGenerationRequest(prev => ({ ...prev, ...updates }))
  }

  const updateTargetAudience = (updates: Partial<ContentGenerationRequest['target_audience']>) => {
    setGenerationRequest(prev => ({
      ...prev,
      target_audience: { ...prev.target_audience, ...updates }
    }))
  }

  const updateConstraints = (updates: Partial<ContentGenerationRequest['content_constraints']>) => {
    setGenerationRequest(prev => ({
      ...prev,
      content_constraints: { ...prev.content_constraints, ...updates }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Content Generation Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Multimodal Content</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={generationRequest.subject}
                onChange={(e) => updateRequest({ subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics, Science, History"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input
                type="text"
                value={generationRequest.topic}
                onChange={(e) => updateRequest({ topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Quadratic Equations, Photosynthesis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Learning Objectives</label>
              <textarea
                value={generationRequest.learning_objectives.join('\n')}
                onChange={(e) => updateRequest({ 
                  learning_objectives: e.target.value.split('\n').filter(obj => obj.trim()) 
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter learning objectives (one per line)"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
              <select
                value={generationRequest.target_audience.age_group}
                onChange={(e) => updateTargetAudience({ 
                  age_group: e.target.value as 'children' | 'teens' | 'adults' | 'seniors' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="children">Children</option>
                <option value="teens">Teens</option>
                <option value="adults">Adults</option>
                <option value="seniors">Seniors</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
              <select
                value={generationRequest.target_audience.education_level}
                onChange={(e) => updateTargetAudience({ 
                  education_level: e.target.value as any 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="elementary">Elementary</option>
                <option value="middle_school">Middle School</option>
                <option value="high_school">High School</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prior Knowledge Level: {generationRequest.target_audience.prior_knowledge}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={generationRequest.target_audience.prior_knowledge}
                onChange={(e) => updateTargetAudience({ 
                  prior_knowledge: parseInt(e.target.value) 
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Constraints */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes): {generationRequest.content_constraints.max_duration_minutes}
              </label>
              <input
                type="range"
                min="5"
                max="120"
                value={generationRequest.content_constraints.max_duration_minutes}
                onChange={(e) => updateConstraints({ 
                  max_duration_minutes: parseInt(e.target.value) 
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Range: {generationRequest.content_constraints.difficulty_range[0]}-{generationRequest.content_constraints.difficulty_range[1]}
              </label>
              <div className="flex space-x-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={generationRequest.content_constraints.difficulty_range[0]}
                  onChange={(e) => updateConstraints({ 
                    difficulty_range: [parseInt(e.target.value), generationRequest.content_constraints.difficulty_range[1]] 
                  })}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={generationRequest.content_constraints.difficulty_range[1]}
                  onChange={(e) => updateConstraints({ 
                    difficulty_range: [generationRequest.content_constraints.difficulty_range[0], parseInt(e.target.value)] 
                  })}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={generationRequest.content_constraints.language}
                onChange={(e) => updateConstraints({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>

          {/* Preferred Formats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Content Formats</label>
            <div className="flex flex-wrap gap-2">
              {['text', 'audio', 'visual', 'interactive', 'multimodal'].map(format => (
                <label key={format} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={generationRequest.content_constraints.preferred_formats.includes(format as any)}
                    onChange={(e) => {
                      const formats = generationRequest.content_constraints.preferred_formats
                      if (e.target.checked) {
                        updateConstraints({ 
                          preferred_formats: [...formats, format as any] 
                        })
                      } else {
                        updateConstraints({ 
                          preferred_formats: formats.filter(f => f !== format) 
                        })
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{format}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerateContent}
            disabled={isGenerating || !generationRequest.subject || !generationRequest.topic}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isGenerating ? 'Generating Content...' : 'Generate Multimodal Content'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Generation Progress */}
      {isGenerating && generationProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h4 className="text-lg font-medium text-blue-900 mb-4">Content Generation Progress</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">{generationProgress.current_activity}</span>
              <span className="text-blue-600 font-medium">{generationProgress.progress_percentage}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress.progress_percentage}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {generationProgress.formats_completed.map((format: string) => (
                <span key={format} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {format} ✓
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Generated Content Results */}
      {hasGeneratedContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Content Options</h3>
            <div className="text-sm text-gray-500">
              {generatedContent.length} formats • Avg. engagement: {(averageEngagementScore * 100).toFixed(1)}%
            </div>
          </div>

          {/* Quality Metrics Summary */}
          {qualityMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {(qualityMetrics.educational_effectiveness * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Educational</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {(qualityMetrics.engagement_potential * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {(qualityMetrics.accessibility_score * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Accessibility</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {(qualityMetrics.technical_feasibility * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Feasibility</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {(qualityMetrics.innovation_factor * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Innovation</div>
              </div>
            </div>
          )}

          {/* Content Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedContent.map((content) => (
              <motion.div
                key={content.id}
                whileHover={{ scale: 1.02 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedContent?.id === content.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${recommendedContent?.id === content.id ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => selectContent(content.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded capitalize font-medium">
                    {content.type}
                  </span>
                  {recommendedContent?.id === content.id && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Engagement:</span>
                    <span className="font-medium">{(content.engagement_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium">{content.difficulty_level}/10</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{content.estimated_duration_minutes}min</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Accessibility Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {content.accessibility_features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {feature.replace('_', ' ')}
                      </span>
                    ))}
                    {content.accessibility_features.length > 3 && (
                      <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{content.accessibility_features.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Selected Content Details */}
          {selectedContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-lg"
            >
              <h4 className="font-medium text-blue-900 mb-3">
                Selected Content: {selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Learning Objectives:</strong>
                  <ul className="mt-1 list-disc list-inside text-blue-700">
                    {selectedContent.learning_objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <strong>Accessibility Features:</strong>
                  <ul className="mt-1 list-disc list-inside text-blue-700">
                    {selectedContent.accessibility_features.map((feature, idx) => (
                      <li key={idx}>{feature.replace('_', ' ')}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Format-specific details would go here */}
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="text-sm text-gray-600">
                  <strong>Format-specific Details:</strong> 
                  {selectedContent.type === 'text' && ' Article-style content with structured sections and examples'}
                  {selectedContent.type === 'audio' && ' Narrated lesson with voice instructions and chapter markers'}
                  {selectedContent.type === 'visual' && ' Infographic with clear visual hierarchy and data visualization'}
                  {selectedContent.type === 'interactive' && ' Simulation with step-by-step user interaction and feedback'}
                  {selectedContent.type === 'multimodal' && ' Combined experience integrating multiple content formats'}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Analytics Tab Component
const AnalyticsTab: React.FC = () => {
  const {
    analytics,
    isLoading,
    loadAnalytics,
    totalFormats,
    mostPopularFormat,
    generationEfficiency,
    overallQualityScore,
    isPerformanceImproving,
    growthRate
  } = useContentAnalytics()

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Content Generated</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_content_generated.toLocaleString()}</p>
            </div>
            <div className={`text-sm px-2 py-1 rounded ${
              isPerformanceImproving ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Generation Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{generationEfficiency.toFixed(1)}</p>
            </div>
            <div className="text-xs text-gray-500">content/min</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Quality Score</p>
              <p className="text-2xl font-bold text-gray-900">{(overallQualityScore * 100).toFixed(0)}%</p>
            </div>
            <div className="text-xs text-gray-500">avg</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Most Popular Format</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{mostPopularFormat}</p>
            </div>
            <div className="text-xs text-gray-500">{totalFormats} total</div>
          </div>
        </div>
      </div>

      {/* Format Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Format Distribution</h3>
        <div className="space-y-3">
          {Object.entries(analytics.content_format_distribution).map(([format, count]) => {
            const percentage = (count / analytics.total_content_generated) * 100
            return (
              <div key={format} className="flex items-center">
                <div className="w-20 text-sm font-medium text-gray-700 capitalize">{format}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">{count} ({percentage.toFixed(1)}%)</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Format Effectiveness */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Format Effectiveness</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(analytics.format_effectiveness).map(([format, metrics]: [string, any]) => (
            <div key={format} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 capitalize mb-3">{format}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Engagement:</span>
                  <span className="font-medium">{(metrics.engagement * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completion:</span>
                  <span className="font-medium">{(metrics.completion * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Learning Gain:</span>
                  <span className="font-medium">{(metrics.learning_gain * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Content Generation Trend */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Content Generation</h4>
            <div className="space-y-2">
              {analytics.performance_trends.map((trend: any, index: number) => (
                <div key={trend.month} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{trend.month}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{trend.content_generated}</span>
                    {index > 0 && (
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        trend.content_generated > analytics.performance_trends[index - 1].content_generated
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {trend.content_generated > analytics.performance_trends[index - 1].content_generated ? '↗' : '↘'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Trend */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Quality Score</h4>
            <div className="space-y-2">
              {analytics.performance_trends.map((trend: any, index: number) => (
                <div key={trend.month} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{trend.month}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{(trend.avg_quality * 100).toFixed(0)}%</span>
                    {index > 0 && (
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        trend.avg_quality > analytics.performance_trends[index - 1].avg_quality
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {trend.avg_quality > analytics.performance_trends[index - 1].avg_quality ? '↗' : '↘'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Insights */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Most Effective Combinations</h4>
            <ul className="space-y-2">
              {analytics.optimization_insights.most_effective_combinations.map((combo: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {combo}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Improvement Opportunities</h4>
            <ul className="space-y-2">
              {analytics.optimization_insights.improvement_opportunities.map((opportunity: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-orange-500 mr-2">→</span>
                  {opportunity}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={loadAnalytics}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Refresh Analytics'}
        </button>
      </div>
    </div>
  )
}

// Validation Tab Component
const ValidationTab: React.FC = () => {
  const { generatedContent } = useMultimodalContentGenerator()
  const {
    validateContent,
    validationResults,
    isValidating,
    totalValidated,
    approvedCount,
    needsRevisionCount,
    rejectedCount,
    averageQualityScore
  } = useContentValidation()

  const [selectedCriteria, setSelectedCriteria] = useState([
    'educational_effectiveness',
    'accessibility_compliance',
    'engagement_potential'
  ])

  const availableCriteria = [
    'educational_effectiveness',
    'accessibility_compliance',
    'engagement_potential',
    'technical_feasibility',
    'content_accuracy'
  ]

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Total Validated</p>
          <p className="text-2xl font-bold text-gray-900">{totalValidated}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Needs Revision</p>
          <p className="text-2xl font-bold text-orange-600">{needsRevisionCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Avg Quality</p>
          <p className="text-2xl font-bold text-blue-600">{(averageQualityScore * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Validation Criteria Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableCriteria.map(criterion => (
            <label key={criterion} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCriteria.includes(criterion)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCriteria(prev => [...prev, criterion])
                  } else {
                    setSelectedCriteria(prev => prev.filter(c => c !== criterion))
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {criterion.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Content Validation List */}
      {generatedContent.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validate Generated Content</h3>
          <div className="space-y-4">
            {generatedContent.map((content) => (
              <div key={content.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded capitalize font-medium">
                        {content.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        Difficulty: {content.difficulty_level}/10 • {content.estimated_duration_minutes}min
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Learning Objectives: {content.learning_objectives.join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Engagement Score: {(content.engagement_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  
                  <button
                    onClick={() => validateContent(content, selectedCriteria)}
                    disabled={isValidating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </button>
                </div>

                {/* Validation Results */}
                {validationResults.get(content.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-3 border border-gray-200 bg-gray-50 rounded"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Validation Results</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        validationResults.get(content.id).compliance_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : validationResults.get(content.id).compliance_status === 'needs_revision'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validationResults.get(content.id).compliance_status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {Object.entries(validationResults.get(content.id).criteria_scores).map(([criterion, score]: [string, any]) => (
                        <div key={criterion} className="flex justify-between">
                          <span className="text-gray-600">
                            {criterion.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                          </span>
                          <span className="font-medium">{(score * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-sm">
                      <strong>Overall Score: </strong>
                      <span className="font-medium">
                        {(validationResults.get(content.id).overall_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Main Dashboard Component
const MultimodalContentGeneratorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generation')

  const tabs = [
    { id: 'generation', label: 'Content Generation', component: ContentGenerationTab },
    { id: 'analytics', label: 'Analytics', component: AnalyticsTab },
    { id: 'validation', label: 'Validation', component: ValidationTab }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ContentGenerationTab

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Multimodal Content Generator</h1>
          <p className="mt-2 text-gray-600">
            Create diverse, engaging learning content across multiple formats with AI-powered generation and optimization.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MultimodalContentGeneratorDashboard