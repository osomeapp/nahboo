'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useUserProfile } from '@/lib/store'
import { useKnowledgeGapAnalysis } from '@/hooks/useIntelligentSequencing'
import type { LearningObjective, KnowledgeGap } from '@/lib/intelligent-sequencing-engine'

interface KnowledgeGapAnalysisProps {
  targetObjectives?: LearningObjective[]
  onGapSelected?: (gap: KnowledgeGap) => void
  onRecommendationSelect?: (recommendation: string) => void
  className?: string
}

export default function KnowledgeGapAnalysis({
  targetObjectives = [],
  onGapSelected,
  onRecommendationSelect,
  className = ''
}: KnowledgeGapAnalysisProps) {
  const userProfile = useUserProfile()
  const [selectedGap, setSelectedGap] = useState<KnowledgeGap | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  
  const gapAnalysis = useKnowledgeGapAnalysis()

  // Generate default objectives if none provided
  const generateDefaultObjectives = useCallback((): LearningObjective[] => {
    if (!userProfile) return []

    const subject = userProfile.subject || 'General'
    return [
      {
        id: `${subject.toLowerCase()}_assessment`,
        title: `${subject} Assessment`,
        description: `Evaluate current knowledge level in ${subject}`,
        subject,
        difficulty: 5,
        estimatedTime: 20,
        prerequisites: [],
        skills: [`${subject.toLowerCase()}_knowledge`, 'self_assessment'],
        conceptTags: ['assessment', 'evaluation'],
        masteryThreshold: 0.7
      }
    ]
  }, [userProfile])

  // Auto-analyze gaps when component mounts
  useEffect(() => {
    if (userProfile && gapAnalysis.gaps.length === 0 && !gapAnalysis.isAnalyzing) {
      const objectives = targetObjectives.length > 0 ? targetObjectives : generateDefaultObjectives()
      gapAnalysis.analyzeGaps(userProfile.id || 'demo-user', userProfile, objectives)
    }
  }, [userProfile, targetObjectives, gapAnalysis, generateDefaultObjectives])

  // Handle gap selection
  const handleGapSelect = useCallback((gap: KnowledgeGap) => {
    setSelectedGap(gap)
    if (onGapSelected) {
      onGapSelected(gap)
    }
  }, [onGapSelected])

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  // Get gap type icon
  const getGapTypeIcon = (gapType: string) => {
    switch (gapType) {
      case 'prerequisite':
        return '🔗'
      case 'skill':
        return '🛠️'
      case 'concept':
        return '💡'
      case 'difficulty':
        return '📈'
      default:
        return '❓'
    }
  }

  if (!userProfile) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔍</span>
          </div>
          <p>Please complete your profile to access gap analysis</p>
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
              Knowledge Gap Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered assessment of learning gaps and prerequisites
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {viewMode === 'overview' ? 'Detailed View' : 'Overview'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {gapAnalysis.isAnalyzing && (
        <div className="p-6 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Analyzing knowledge gaps...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {gapAnalysis.error && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 font-medium">Analysis Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{gapAnalysis.error}</p>
          </div>
        </div>
      )}

      {/* Gap Overview */}
      {!gapAnalysis.isAnalyzing && !gapAnalysis.error && gapAnalysis.gaps.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{gapAnalysis.totalGaps}</div>
                <div className="text-sm text-gray-600">Total Gaps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {gapAnalysis.getGapsBySeverity('critical').length}
                </div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {gapAnalysis.getGapsBySeverity('high').length}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(gapAnalysis.getTotalTimeToFillGaps())}
                </div>
                <div className="text-sm text-gray-600">Est. Minutes</div>
              </div>
            </div>

            {/* Critical Gaps Alert */}
            {gapAnalysis.hasCriticalGaps && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">🚨</span>
                  <span className="text-red-700 font-medium">Critical gaps detected</span>
                </div>
                <p className="text-red-600 text-sm mt-1">
                  Address these gaps before proceeding with advanced topics
                </p>
              </div>
            )}
          </div>

          {/* Gap List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Identified Gaps</h4>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Sort by:</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="severity">Severity</option>
                  <option value="time">Time to Fill</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {gapAnalysis.gaps.map((gap, index) => (
                <div
                  key={index}
                  className={`border rounded-lg cursor-pointer transition-all ${
                    selectedGap === gap ? 'ring-2 ring-blue-500' : ''
                  } ${getSeverityColor(gap.severity)}`}
                  onClick={() => handleGapSelect(gap)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getGapTypeIcon(gap.gapType)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium capitalize">{gap.gapType} Gap</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              gap.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              gap.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              gap.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {gap.severity}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{gap.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{gap.estimatedTimeToFill} min</div>
                        <div className="text-xs text-gray-600">
                          {Math.round(gap.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedGap === gap && viewMode === 'detailed' && (
                      <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-medium text-sm mb-2">Recommended Content</h6>
                            {gap.recommendedContent.length > 0 ? (
                              <ul className="text-sm space-y-1">
                                {gap.recommendedContent.map((content, contentIndex) => (
                                  <li key={contentIndex} className="flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                                    <span>{content}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-600">No specific content recommended</p>
                            )}
                          </div>
                          <div>
                            <h6 className="font-medium text-sm mb-2">Actions</h6>
                            <div className="space-y-2">
                              <button className="w-full px-3 py-2 bg-white bg-opacity-50 border border-current border-opacity-30 rounded text-sm hover:bg-opacity-75 transition-colors">
                                Find Learning Materials
                              </button>
                              <button className="w-full px-3 py-2 bg-white bg-opacity-50 border border-current border-opacity-30 rounded text-sm hover:bg-opacity-75 transition-colors">
                                Schedule Practice
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisite Analysis */}
          {gapAnalysis.prerequisiteAnalysis && (
            <div className="p-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Prerequisite Analysis</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Prerequisites:</span>
                    <span className="ml-2 font-medium">
                      {gapAnalysis.prerequisiteAnalysis.totalPrerequisites || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Missing:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {gapAnalysis.prerequisiteAnalysis.missingPrerequisites?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="ml-2 font-medium">
                      {gapAnalysis.prerequisiteAnalysis.estimatedCompletionTime || 0} min
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Critical Path:</span>
                    <span className="ml-2 font-medium">
                      {gapAnalysis.prerequisiteAnalysis.criticalPath?.length || 0} items
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {gapAnalysis.recommendations.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">AI Recommendations</h4>
              <div className="space-y-2">
                {gapAnalysis.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => onRecommendationSelect?.(recommendation)}
                  >
                    <p className="text-sm text-blue-900">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* No Gaps State */}
      {!gapAnalysis.isAnalyzing && !gapAnalysis.error && gapAnalysis.gaps.length === 0 && (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">No Knowledge Gaps Detected</h4>
          <p className="text-gray-600 text-sm">
            Great! You appear to have the necessary foundation for your learning objectives.
          </p>
        </div>
      )}
    </div>
  )
}