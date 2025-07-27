'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useUserProfile } from '@/lib/store'
import { useIntelligentSequencing, useLearningPathOptimization } from '@/hooks/useIntelligentSequencing'
import type { LearningObjective, KnowledgeGap } from '@/lib/intelligent-sequencing-engine'
import type { ContentItem } from '@/types'

interface IntelligentSequencingPanelProps {
  targetObjectives?: LearningObjective[]
  availableContent?: ContentItem[]
  onPathGenerated?: (path: any) => void
  className?: string
}

export default function IntelligentSequencingPanel({
  targetObjectives = [],
  availableContent = [],
  onPathGenerated,
  className = ''
}: IntelligentSequencingPanelProps) {
  const userProfile = useUserProfile()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [constraints, setConstraints] = useState({
    maxTime: 120, // minutes
    maxDifficulty: 8,
    preferredStyles: [] as string[],
    urgentObjectives: [] as string[]
  })

  const sequencing = useIntelligentSequencing(
    userProfile?.id || 'demo-user',
    userProfile!
  )

  const optimization = useLearningPathOptimization()

  // Generate default objectives if none provided
  const generateDefaultObjectives = useCallback((): LearningObjective[] => {
    if (!userProfile) return []

    const subject = userProfile.subject || 'General'
    return [
      {
        id: `${subject.toLowerCase()}_basics`,
        title: `${subject} Fundamentals`,
        description: `Learn the basic concepts and principles of ${subject}`,
        subject,
        difficulty: 3,
        estimatedTime: 30,
        prerequisites: [],
        skills: [`${subject.toLowerCase()}_fundamentals`, 'critical_thinking'],
        conceptTags: ['basics', 'foundation'],
        masteryThreshold: 0.75
      },
      {
        id: `${subject.toLowerCase()}_intermediate`,
        title: `Intermediate ${subject}`,
        description: `Build on fundamentals with more complex ${subject} concepts`,
        subject,
        difficulty: 5,
        estimatedTime: 45,
        prerequisites: [`${subject.toLowerCase()}_basics`],
        skills: [`${subject.toLowerCase()}_application`, 'problem_solving'],
        conceptTags: ['intermediate', 'application'],
        masteryThreshold: 0.8
      },
      {
        id: `${subject.toLowerCase()}_advanced`,
        title: `Advanced ${subject}`,
        description: `Master advanced techniques and theories in ${subject}`,
        subject,
        difficulty: 7,
        estimatedTime: 60,
        prerequisites: [`${subject.toLowerCase()}_intermediate`],
        skills: [`${subject.toLowerCase()}_mastery`, 'synthesis'],
        conceptTags: ['advanced', 'mastery'],
        masteryThreshold: 0.85
      }
    ]
  }, [userProfile])

  // Handle path generation
  const handleGeneratePath = useCallback(async () => {
    if (!userProfile) return

    try {
      const objectives = targetObjectives.length > 0 ? targetObjectives : generateDefaultObjectives()
      const content = availableContent.length > 0 ? availableContent : []

      const recommendation = await sequencing.generateLearningPath(
        objectives,
        content,
        constraints
      )

      if (onPathGenerated) {
        onPathGenerated(recommendation)
      }
    } catch (error) {
      console.error('Failed to generate learning path:', error)
    }
  }, [userProfile, targetObjectives, availableContent, constraints, sequencing, onPathGenerated, generateDefaultObjectives])

  // Handle knowledge gap analysis
  const handleAnalyzeGaps = useCallback(async () => {
    if (!userProfile) return

    try {
      const objectives = targetObjectives.length > 0 ? targetObjectives : generateDefaultObjectives()
      await sequencing.analyzeKnowledgeGaps(objectives)
    } catch (error) {
      console.error('Failed to analyze knowledge gaps:', error)
    }
  }, [userProfile, targetObjectives, sequencing, generateDefaultObjectives])

  // Auto-generate path when user profile changes
  useEffect(() => {
    if (userProfile && !sequencing.currentPath && !sequencing.isGenerating) {
      handleGeneratePath()
    }
  }, [userProfile, sequencing.currentPath, sequencing.isGenerating, handleGeneratePath])

  if (!userProfile) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">👤</span>
          </div>
          <p>Please complete your profile to access intelligent sequencing</p>
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
              Intelligent Learning Path
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered sequence optimization for {userProfile.subject}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>
        </div>
      </div>

      {/* Current Path Status */}
      {sequencing.currentPath && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Current Learning Path</h4>
            <span className="text-sm text-gray-500">
              {Math.round(sequencing.progress.overallProgress * 100)}% Complete
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${sequencing.progress.overallProgress * 100}%` }}
            />
          </div>

          {/* Path Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Objectives:</span>
              <span className="ml-2 font-medium">
                {sequencing.progress.completedObjectives} / {sequencing.progress.totalObjectives}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Current:</span>
              <span className="ml-2 font-medium">
                {sequencing.currentObjective?.title || 'Starting...'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Estimated Time:</span>
              <span className="ml-2 font-medium">
                {sequencing.currentPath.totalEstimatedTime} min
              </span>
            </div>
            <div>
              <span className="text-gray-600">Difficulty:</span>
              <span className="ml-2 font-medium">
                {Math.round(sequencing.currentPath.difficulty)}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Gaps */}
      {sequencing.hasKnowledgeGaps && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Knowledge Gaps Detected</h4>
          <div className="space-y-2">
            {sequencing.knowledgeGaps.slice(0, 3).map((gap, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      gap.severity === 'critical' ? 'bg-red-500' :
                      gap.severity === 'high' ? 'bg-orange-500' :
                      gap.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-900">{gap.gapType}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{gap.description}</p>
                </div>
                <span className="text-xs text-gray-500">{gap.estimatedTimeToFill} min</span>
              </div>
            ))}
            {sequencing.knowledgeGaps.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{sequencing.knowledgeGaps.length - 3} more gaps detected
              </p>
            )}
          </div>
        </div>
      )}

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Path Constraints</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Time (minutes)
              </label>
              <input
                type="number"
                value={constraints.maxTime}
                onChange={(e) => setConstraints(prev => ({
                  ...prev,
                  maxTime: parseInt(e.target.value) || 120
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="30"
                max="480"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Difficulty (1-10)
              </label>
              <input
                type="number"
                value={constraints.maxDifficulty}
                onChange={(e) => setConstraints(prev => ({
                  ...prev,
                  maxDifficulty: parseInt(e.target.value) || 8
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGeneratePath}
            disabled={sequencing.isGenerating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sequencing.isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sequencing.isGenerating ? 'Generating...' : 'Generate New Path'}
          </button>

          <button
            onClick={handleAnalyzeGaps}
            disabled={sequencing.isGenerating}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Analyze Gaps
          </button>

          {sequencing.currentPath && (
            <button
              onClick={sequencing.clearPath}
              className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Clear Path
            </button>
          )}
        </div>

        {/* Error Display */}
        {sequencing.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{sequencing.error}</p>
          </div>
        )}

        {/* Next Recommendations */}
        {sequencing.recommendations.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">AI Recommendations</h5>
            <div className="space-y-2">
              {sequencing.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-xs text-gray-500">{rec.timeRequired} min</span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1 font-medium">{rec.action}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}