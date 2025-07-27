'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useUserProfile } from '@/lib/store'
import { useProgressAnalytics, useRetentionAnalytics, useLearningVelocity } from '@/hooks/useProgressAnalytics'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'
import type { AnalyticsFilters } from '@/hooks/useProgressAnalytics'

interface ProgressAnalyticsDashboardProps {
  objectives?: LearningObjective[]
  onObjectiveSelect?: (objectiveId: string) => void
  className?: string
}

export default function ProgressAnalyticsDashboard({
  objectives = [],
  onObjectiveSelect,
  className = ''
}: ProgressAnalyticsDashboardProps) {
  const userProfile = useUserProfile()
  const [activeTab, setActiveTab] = useState<'overview' | 'objectives' | 'competencies' | 'analytics'>('overview')
  const [selectedMetric, setSelectedMetric] = useState<'mastery' | 'retention' | 'velocity' | 'competency'>('mastery')

  const analytics = useProgressAnalytics(
    userProfile?.id || 'demo-user',
    userProfile!
  )

  const retention = useRetentionAnalytics(userProfile?.id || 'demo-user')
  const velocity = useLearningVelocity(userProfile?.id || 'demo-user')

  // Auto-initialize tracking for provided objectives
  useEffect(() => {
    if (objectives.length > 0 && userProfile) {
      objectives.forEach(objective => {
        if (!analytics.getObjectiveById(objective.id)) {
          analytics.initializeObjectiveTracking(objective).catch(console.error)
        }
      })
    }
  }, [objectives, userProfile, analytics])

  // Auto-refresh insights
  useEffect(() => {
    if (userProfile && !analytics.insights && !analytics.isLoading) {
      analytics.getProgressInsights().catch(console.error)
    }
  }, [userProfile, analytics])

  const handleFilterUpdate = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    analytics.updateFilters(newFilters)
  }, [analytics])

  if (!userProfile) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <p>Please complete your profile to access progress analytics</p>
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
              Progress Analytics
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive learning progress tracking and insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {analytics.hasObjectives && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-600">
                  {analytics.objectives.length} Objectives Tracked
                </span>
              </div>
            )}
            <button
              onClick={() => analytics.refreshProgressData()}
              disabled={analytics.isLoading}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {analytics.isLoading ? '🔄' : '↻'} Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mt-4">
          {(['overview', 'objectives', 'competencies', 'analytics'] as const).map((tab) => (
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

      {/* Filters Bar */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={analytics.filters.timeframe}
              onChange={(e) => handleFilterUpdate({ timeframe: e.target.value as any })}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            
            <select
              value={analytics.filters.completionStatus}
              onChange={(e) => handleFilterUpdate({ completionStatus: e.target.value as any })}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Objectives</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {analytics.filteredObjectives.length} of {analytics.objectives.length} objectives
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab analytics={analytics} />
        )}

        {activeTab === 'objectives' && (
          <ObjectivesTab 
            analytics={analytics} 
            onObjectiveSelect={onObjectiveSelect}
          />
        )}

        {activeTab === 'competencies' && (
          <CompetenciesTab analytics={analytics} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab 
            analytics={analytics}
            retention={retention}
            velocity={velocity}
            selectedMetric={selectedMetric}
            onMetricSelect={setSelectedMetric}
          />
        )}
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ analytics }: any) {
  const insights = analytics.insights

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.objectives.length}
          </div>
          <div className="text-sm text-blue-700">Total Objectives</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.completedObjectives.length}
          </div>
          <div className="text-sm text-green-700">Completed</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(analytics.getAverageMasteryLevel() * 100)}%
          </div>
          <div className="text-sm text-orange-700">Avg Mastery</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(analytics.getCompletionRate() * 100)}%
          </div>
          <div className="text-sm text-purple-700">Completion Rate</div>
        </div>
      </div>

      {/* Progress Insights */}
      {insights && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Learning Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Achievement Metrics</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Learning Time:</span>
                  <span className="font-medium">{insights.totalLearningTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Learning Velocity:</span>
                  <span className="font-medium">{insights.learningVelocity.toFixed(1)} obj/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills Developed:</span>
                  <span className="font-medium">{insights.skillsDeveloped}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Concepts Learned:</span>
                  <span className="font-medium">{insights.conceptsLearned}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Quality Metrics</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Retention Score:</span>
                  <span className="font-medium">{Math.round(insights.retentionScore * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Application Score:</span>
                  <span className="font-medium">{Math.round(insights.applicationScore * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer Score:</span>
                  <span className="font-medium">{Math.round(insights.transferScore * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mastery Improvement:</span>
                  <span className="font-medium">+{Math.round(insights.masteryImprovement * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Behavioral Insights */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Learning Patterns</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Most Productive Time:</span>
                <span className="ml-2 font-medium">{insights.mostProductiveTime}</span>
              </div>
              <div>
                <span className="text-gray-600">Preferred Session Length:</span>
                <span className="ml-2 font-medium">{insights.preferredLearningDuration} min</span>
              </div>
              <div>
                <span className="text-gray-600">Strongest Subjects:</span>
                <span className="ml-2 font-medium">{insights.strongestSubjects.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-600">Growth Areas:</span>
                <span className="ml-2 font-medium">{insights.challengingAreas.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {insights.suggestedActions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Recommended Actions</h5>
              <div className="space-y-2">
                {insights.suggestedActions.slice(0, 3).map((action, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!analytics.hasObjectives && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">No Learning Objectives</h4>
          <p className="text-gray-600 text-sm">
            Start tracking your learning progress by adding objectives
          </p>
        </div>
      )}
    </div>
  )
}

// Objectives Tab Component
function ObjectivesTab({ analytics, onObjectiveSelect }: any) {
  return (
    <div className="space-y-4">
      {analytics.filteredObjectives.length > 0 ? (
        analytics.filteredObjectives.map((objective, index) => (
          <div key={objective.objectiveId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  objective.isCompleted ? 'bg-green-500' :
                  objective.isActive ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <h4 className="font-medium text-gray-900">
                  Objective {index + 1}
                </h4>
                <span className="text-sm text-gray-500">
                  {objective.objectiveId}
                </span>
              </div>
              {onObjectiveSelect && (
                <button
                  onClick={() => onObjectiveSelect(objective.objectiveId)}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View Details →
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Mastery Progress</span>
                <span className="font-medium">
                  {Math.round(objective.currentMasteryLevel * 100)}% / {Math.round(objective.targetMasteryLevel * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    objective.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(objective.currentMasteryLevel / objective.targetMasteryLevel) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Time Spent:</span>
                <span className="ml-2 font-medium">{objective.timeSpent} min</span>
              </div>
              <div>
                <span className="text-gray-600">Attempts:</span>
                <span className="ml-2 font-medium">{objective.attemptCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Success Rate:</span>
                <span className="ml-2 font-medium">
                  {Math.round((objective.successfulAttempts / Math.max(objective.attemptCount, 1)) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Activity:</span>
                <span className="ml-2 font-medium">
                  {objective.lastActivity.toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Skills Progress */}
            {Object.keys(objective.skillProgression).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Skills Progress</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(objective.skillProgression).slice(0, 4).map(([skill, progress]) => (
                    <div key={skill} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{skill.replace('_', ' ')}</span>
                      <span className="font-medium">{Math.round((progress as any).currentLevel * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="mt-4 flex justify-between items-center">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                objective.isCompleted ? 'bg-green-100 text-green-800' :
                objective.isActive ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {objective.isCompleted ? 'Completed' : objective.isActive ? 'In Progress' : 'Inactive'}
              </span>
              
              {objective.checkpoints.length > 0 && (
                <span className="text-xs text-gray-500">
                  {objective.checkpoints.length} checkpoints
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-gray-600">No objectives match current filters</p>
        </div>
      )}
    </div>
  )
}

// Competencies Tab Component
function CompetenciesTab({ analytics }: any) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!analytics.competencyMap) {
      analytics.getCompetencyMap().catch(console.error)
    }
  }, [analytics])

  if (!analytics.competencyMap) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">⚙️</span>
        </div>
        <p className="text-gray-600">Loading competency map...</p>
      </div>
    )
  }

  const competencyMap = analytics.competencyMap

  return (
    <div className="space-y-6">
      {/* Overall Competency */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-blue-900">Overall Competency</h4>
          <span className="text-2xl font-bold text-blue-600">
            {Math.round(competencyMap.overallCompetency * 100)}%
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${competencyMap.overallCompetency * 100}%` }}
          />
        </div>
      </div>

      {/* Competencies List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Competencies</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        <div className="space-y-3">
          {competencyMap.competencies.map((competency, index) => (
            <div key={competency.competencyId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{competency.name}</h5>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    competency.certificationLevel === 'expert' ? 'bg-purple-100 text-purple-800' :
                    competency.certificationLevel === 'advanced' ? 'bg-blue-100 text-blue-800' :
                    competency.certificationLevel === 'proficient' ? 'bg-green-100 text-green-800' :
                    competency.certificationLevel === 'developing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {competency.certificationLevel}
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(competency.mastery * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${competency.mastery * 100}%` }}
                />
              </div>

              {showDetails && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{competency.description}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="font-medium">Level:</span> {competency.level}/5
                    </div>
                    <div>
                      <span className="font-medium">Evidence:</span> {competency.evidenceCount} points
                    </div>
                    <div>
                      <span className="font-medium">Objectives:</span> {competency.relatedObjectives.length}
                    </div>
                    <div>
                      <span className="font-medium">Last Shown:</span> {competency.lastDemonstrated.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Paths */}
      {competencyMap.progressPaths.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Learning Paths</h4>
          <div className="space-y-3">
            {competencyMap.progressPaths.map((path, index) => (
              <div key={path.pathId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{path.name}</h5>
                  <span className="text-sm text-gray-500">
                    Position {path.currentPosition}/{path.competencies.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{path.description}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(path.currentPosition / path.competencies.length) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Est. Completion: {path.estimatedCompletion.toLocaleDateString()}</span>
                  <span>{path.milestones.length} milestones</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab({ analytics, retention, velocity, selectedMetric, onMetricSelect }: any) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyzeMetric = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      await analytics.getAnalytics(selectedMetric)
      
      if (selectedMetric === 'retention') {
        await retention.analyzeRetention()
      } else if (selectedMetric === 'velocity') {
        await velocity.analyzeVelocity()
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedMetric, analytics, retention, velocity])

  return (
    <div className="space-y-6">
      {/* Metric Selection */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {(['mastery', 'retention', 'velocity', 'competency'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => onMetricSelect(metric)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedMetric === metric
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleAnalyzeMetric}
          disabled={isAnalyzing}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isAnalyzing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Metric Content */}
      {selectedMetric === 'mastery' && (
        <MasteryAnalytics analytics={analytics} />
      )}

      {selectedMetric === 'retention' && (
        <RetentionAnalytics retention={retention} />
      )}

      {selectedMetric === 'velocity' && (
        <VelocityAnalytics velocity={velocity} />
      )}

      {selectedMetric === 'competency' && (
        <CompetencyAnalytics analytics={analytics} />
      )}
    </div>
  )
}

// Individual Analytics Components
function MasteryAnalytics({ analytics }: any) {
  const objectives = analytics.objectives

  if (objectives.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No mastery data available</p>
      </div>
    )
  }

  const masteryDistribution = {
    novice: objectives.filter(obj => obj.currentMasteryLevel < 0.3).length,
    developing: objectives.filter(obj => obj.currentMasteryLevel >= 0.3 && obj.currentMasteryLevel < 0.6).length,
    proficient: objectives.filter(obj => obj.currentMasteryLevel >= 0.6 && obj.currentMasteryLevel < 0.8).length,
    advanced: objectives.filter(obj => obj.currentMasteryLevel >= 0.8).length
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Mastery Distribution</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{masteryDistribution.novice}</div>
            <div className="text-sm text-red-700">Novice (&lt;30%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{masteryDistribution.developing}</div>
            <div className="text-sm text-yellow-700">Developing (30-60%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{masteryDistribution.proficient}</div>
            <div className="text-sm text-green-700">Proficient (60-80%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{masteryDistribution.advanced}</div>
            <div className="text-sm text-blue-700">Advanced (&gt;80%)</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-4">Objective Progress</h4>
        <div className="space-y-3">
          {objectives.slice(0, 5).map((obj, index) => (
            <div key={obj.objectiveId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium">Objective {index + 1}</span>
              <div className="flex items-center space-x-3">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${obj.currentMasteryLevel * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12">
                  {Math.round(obj.currentMasteryLevel * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RetentionAnalytics({ retention }: any) {
  const trends = retention.getRetentionTrends()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{trends.improving}</div>
          <div className="text-sm text-green-700">Improving</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{trends.stable}</div>
          <div className="text-sm text-blue-700">Stable</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{trends.declining}</div>
          <div className="text-sm text-red-700">Declining</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Retention Performance</h4>
        {retention.retentionData.length > 0 ? (
          <div className="space-y-3">
            {retention.retentionData.map((data, index) => (
              <div key={data.objectiveId} className="flex items-center justify-between p-3 border border-gray-200 rounded bg-white">
                <span className="text-sm font-medium">Objective {index + 1}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <div>
                    <span className="text-gray-600">Short-term:</span>
                    <span className="ml-1 font-medium">{Math.round(data.shortTermRetention * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Long-term:</span>
                    <span className="ml-1 font-medium">{Math.round(data.longTermRetention * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center">No retention data available</p>
        )}
      </div>
    </div>
  )
}

function VelocityAnalytics({ velocity }: any) {
  const trends = velocity.getVelocityTrends()
  const averageVelocity = velocity.getAverageVelocity()

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {averageVelocity.toFixed(1)}
        </div>
        <div className="text-sm text-blue-700">Average Learning Velocity (obj/hr)</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{trends.accelerating || 0}</div>
          <div className="text-sm text-green-700">Accelerating</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{trends.stable || 0}</div>
          <div className="text-sm text-blue-700">Stable</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{trends.decelerating || 0}</div>
          <div className="text-sm text-red-700">Decelerating</div>
        </div>
      </div>

      {velocity.velocityData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Velocity Factors</h4>
          <div className="space-y-3">
            {velocity.velocityData[0].factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded bg-white">
                <div>
                  <span className="text-sm font-medium">{factor.factor}</span>
                  <p className="text-xs text-gray-600">{factor.description}</p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    factor.impact > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(factor.confidence * 100)}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CompetencyAnalytics({ analytics }: any) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600">Competency analytics available in Competencies tab</p>
    </div>
  )
}