'use client'

import React, { useState, useCallback } from 'react'
import type { LearningPath, LearningSequence, LearningObjective } from '@/lib/intelligent-sequencing-engine'

interface LearningPathViewerProps {
  learningPath: LearningPath
  currentSequence?: number
  onSequenceSelect?: (sequence: LearningSequence) => void
  onObjectiveComplete?: (objectiveId: string) => void
  className?: string
}

export default function LearningPathViewer({
  learningPath,
  currentSequence = 1,
  onSequenceSelect,
  onObjectiveComplete,
  className = ''
}: LearningPathViewerProps) {
  const [expandedSequence, setExpandedSequence] = useState<string | null>(null)
  const [completedObjectives, setCompletedObjectives] = useState<Set<string>>(new Set())

  // Handle objective completion
  const handleObjectiveComplete = useCallback((objectiveId: string) => {
    setCompletedObjectives(prev => new Set([...prev, objectiveId]))
    if (onObjectiveComplete) {
      onObjectiveComplete(objectiveId)
    }
  }, [onObjectiveComplete])

  // Calculate overall progress
  const overallProgress = (completedObjectives.size / learningPath.objectives.length) * 100

  // Get sequence status
  const getSequenceStatus = useCallback((sequence: LearningSequence) => {
    const isCompleted = completedObjectives.has(sequence.learningObjective.id)
    const isCurrent = sequence.stepNumber === currentSequence
    const isPending = sequence.stepNumber > currentSequence

    if (isCompleted) return 'completed'
    if (isCurrent) return 'current'
    if (isPending) return 'pending'
    return 'available'
  }, [completedObjectives, currentSequence])

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'current':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'pending':
        return 'bg-gray-100 border-gray-300 text-gray-600'
      default:
        return 'bg-white border-gray-300 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'current':
        return '▶'
      case 'pending':
        return '○'
      default:
        return '•'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {learningPath.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {learningPath.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(overallProgress)}%
            </div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Path Metadata */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">{learningPath.objectives.length}</div>
            <div className="text-gray-600">Objectives</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{learningPath.totalEstimatedTime} min</div>
            <div className="text-gray-600">Total Time</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{Math.round(learningPath.difficulty)}/10</div>
            <div className="text-gray-600">Difficulty</div>
          </div>
        </div>
      </div>

      {/* Learning Sequences */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Learning Sequence</h4>
        <div className="space-y-3">
          {learningPath.sequences.map((sequence, index) => {
            const status = getSequenceStatus(sequence)
            const isExpanded = expandedSequence === sequence.id
            
            return (
              <div key={sequence.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Sequence Header */}
                <div 
                  className={`p-4 cursor-pointer transition-colors ${getStatusStyling(status)}`}
                  onClick={() => setExpandedSequence(isExpanded ? null : sequence.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-current">
                        <span className="text-sm font-medium">
                          {getStatusIcon(status)}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium">
                          Step {sequence.stepNumber}: {sequence.learningObjective.title}
                        </h5>
                        <p className="text-sm opacity-75 mt-1">
                          {sequence.learningObjective.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>{sequence.estimatedTime} min</span>
                      <span>Level {sequence.difficultyLevel}</span>
                      <svg 
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Sequence Details */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Objective Details */}
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2">Learning Objective</h6>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Skills:</span>
                            <span className="ml-2">
                              {sequence.learningObjective.skills.join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Prerequisites:</span>
                            <span className="ml-2">
                              {sequence.prerequisites.length > 0 
                                ? sequence.prerequisites.map(p => p.objectiveId).join(', ')
                                : 'None'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Mastery Threshold:</span>
                            <span className="ml-2">
                              {Math.round(sequence.learningObjective.masteryThreshold * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content Items */}
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2">Content ({sequence.contentItems.length})</h6>
                        {sequence.contentItems.length > 0 ? (
                          <div className="space-y-1">
                            {sequence.contentItems.slice(0, 3).map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center space-x-2 text-sm">
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                  item.content_type === 'video' ? 'bg-red-500' :
                                  item.content_type === 'quiz' ? 'bg-green-500' :
                                  item.content_type === 'ai_lesson' ? 'bg-blue-500' :
                                  'bg-purple-500'
                                }`} />
                                <span className="text-gray-900">{item.title}</span>
                              </div>
                            ))}
                            {sequence.contentItems.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{sequence.contentItems.length - 3} more items
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No content items available</p>
                        )}
                      </div>
                    </div>

                    {/* Completion Criteria */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h6 className="font-medium text-gray-900 mb-2">Completion Criteria</h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Min Success Rate:</span>
                          <span className="ml-2 font-medium">
                            {Math.round(sequence.completionCriteria.minSuccessRate * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Max Attempts:</span>
                          <span className="ml-2 font-medium">
                            {sequence.completionCriteria.maxAttempts}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time Limit:</span>
                          <span className="ml-2 font-medium">
                            {sequence.completionCriteria.timeLimit ? `${sequence.completionCriteria.timeLimit} min` : 'None'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        {status === 'current' && (
                          <button
                            onClick={() => onSequenceSelect?.(sequence)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Start Learning
                          </button>
                        )}
                        {status === 'completed' && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                            Completed ✓
                          </span>
                        )}
                      </div>
                      
                      {status === 'current' && !completedObjectives.has(sequence.learningObjective.id) && (
                        <button
                          onClick={() => handleObjectiveComplete(sequence.learningObjective.id)}
                          className="px-3 py-1 border border-green-600 text-green-600 rounded text-sm hover:bg-green-50 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Adaptation Points */}
        {learningPath.adaptationPoints.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Adaptation Points</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {learningPath.adaptationPoints.map((point, index) => (
                <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-900">
                      Sequence {point.sequenceId}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>Triggers: {point.triggerConditions.map(t => t.type).join(', ')}</div>
                    <div>Monitoring: {point.monitoringDuration} min</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}