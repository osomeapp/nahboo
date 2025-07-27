// Engagement Dashboard
// Use case-specific engagement tracking and progress visualization
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, Clock, Target, Award, BookOpen, Users, 
  BarChart3, Calendar, CheckCircle, AlertCircle, 
  ArrowUp, ArrowDown, Star, Lightbulb, Settings,
  User, Building, GraduationCap, Heart
} from 'lucide-react'
import type { UserProfile } from '@/types'
import { useUseCaseEngagement, useProgressDashboard } from '@/hooks/useUseCaseEngagement'

interface EngagementDashboardProps {
  userProfile: UserProfile
  className?: string
}

interface UseCaseConfig {
  icon: React.ElementType
  color: string
  title: string
  description: string
  keyMetrics: string[]
}

const useCaseConfigs: Record<UserProfile['use_case'], UseCaseConfig> = {
  personal: {
    icon: Heart,
    color: 'purple',
    title: 'Personal Learning Journey',
    description: 'Self-directed growth and skill development',
    keyMetrics: ['Learning Streak', 'Topics Explored', 'Satisfaction Score']
  },
  corporate_training: {
    icon: Building,
    color: 'blue',
    title: 'Corporate Training Progress',
    description: 'Professional development and compliance tracking',
    keyMetrics: ['Completion Rate', 'Competencies', 'Team Performance']
  },
  k12_education: {
    icon: BookOpen,
    color: 'green',
    title: 'Academic Progress',
    description: 'Curriculum mastery and grade improvement',
    keyMetrics: ['Grade Progress', 'Assignment Completion', 'Study Time']
  },
  higher_education: {
    icon: GraduationCap,
    color: 'indigo',
    title: 'University Learning',
    description: 'Course completion and research progress',
    keyMetrics: ['Course Progress', 'Research Milestones', 'Collaboration']
  },
  professional_development: {
    icon: TrendingUp,
    color: 'emerald',
    title: 'Career Development',
    description: 'Skills advancement and industry knowledge',
    keyMetrics: ['Certifications', 'Network Growth', 'Industry Relevance']
  },
  hobbyist: {
    icon: Star,
    color: 'orange',
    title: 'Hobby Learning',
    description: 'Interest-driven exploration and creativity',
    keyMetrics: ['Enjoyment Level', 'Creative Output', 'Community Participation']
  }
}

export default function EngagementDashboard({ userProfile, className = '' }: EngagementDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'metrics' | 'actions' | 'reports'>('overview')
  
  const engagement = useUseCaseEngagement(userProfile.id, userProfile, {
    useCase: userProfile.use_case,
    personalContext: {
      learningGoals: [userProfile.subject],
      timeConstraints: 'flexible',
      motivationStyle: 'achievement'
    }
  })

  const dashboard = useProgressDashboard(userProfile.id, userProfile, {
    useCase: userProfile.use_case,
    personalContext: {
      learningGoals: [userProfile.subject],
      timeConstraints: 'flexible',
      motivationStyle: 'achievement'
    }
  })

  const config = useCaseConfigs[userProfile.use_case]
  const IconComponent = config.icon

  // Start tracking when component mounts
  useEffect(() => {
    engagement.startTracking()
    return () => engagement.stopTracking()
  }, [])

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-50`,
    border: `border-${color}-200`,
    text: `text-${color}-800`,
    textLight: `text-${color}-600`,
    accent: `bg-${color}-500`,
    button: `bg-${color}-100 hover:bg-${color}-200 text-${color}-700`
  })

  const colors = getColorClasses(config.color)

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`${colors.bg} ${colors.border} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${colors.accent} rounded-full flex items-center justify-center`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${colors.text}`}>{config.title}</h2>
              <p className={`text-sm ${colors.textLight}`}>{config.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 ${colors.bg} ${colors.border} border rounded-full`}>
              <span className={`text-xs font-medium ${colors.text}`}>
                {engagement.isTracking ? 'Active' : 'Paused'}
              </span>
            </div>
            {engagement.isEngaged && (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'metrics', label: 'Metrics', icon: TrendingUp },
            { id: 'actions', label: 'Actions', icon: Target },
            { id: 'reports', label: 'Reports', icon: Calendar }
          ].map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedView === tab.id
                    ? `${colors.accent} text-white`
                    : `${colors.button}`
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {config.keyMetrics.map((metric, index) => (
                    <MetricCard
                      key={metric}
                      title={metric}
                      value={getMetricValue(metric, engagement.metrics, dashboard.weeklyReport)}
                      trend={Math.random() > 0.5 ? 'up' : 'down'}
                      color={config.color}
                    />
                  ))}
                </div>
              </div>

              {/* Engagement Level */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Engagement</h3>
                <div className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-medium ${colors.text}`}>Engagement Level</span>
                    <span className={`text-sm ${colors.textLight}`}>
                      {Math.round(engagement.engagementLevel * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${colors.accent} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${engagement.engagementLevel * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Low</span>
                    <span>Moderate</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              {/* Recent Achievements */}
              {dashboard.achievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
                  <div className="space-y-3">
                    {dashboard.achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-2xl">{achievement.badgeIcon}</span>
                        <div>
                          <h4 className="font-medium text-yellow-800">{achievement.title}</h4>
                          <p className="text-sm text-yellow-600">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {selectedView === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Detailed Metrics</h3>
              
              {engagement.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MetricChart
                    title="Session Duration"
                    value={`${Math.round(engagement.metrics.sessionDuration / 60000)} min`}
                    description="Time spent in learning sessions"
                    color={config.color}
                  />
                  
                  <MetricChart
                    title="Completion Rate"
                    value={`${Math.round(engagement.metrics.contentCompletionRate * 100)}%`}
                    description="Percentage of content completed"
                    color={config.color}
                  />
                  
                  <MetricChart
                    title="Satisfaction Score"
                    value={`${Math.round(engagement.metrics.satisfactionScore * 100)}%`}
                    description="Self-reported satisfaction with content"
                    color={config.color}
                  />
                  
                  <MetricChart
                    title="Progress Velocity"
                    value={`${Math.round(engagement.metrics.progressVelocity * 100)}%`}
                    description="Rate of learning progress"
                    color={config.color}
                  />
                </div>
              )}
            </motion.div>
          )}

          {selectedView === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Recommended Actions</h3>
              
              {/* Active Actions */}
              {engagement.hasActiveActions && (
                <div>
                  <h4 className="font-medium mb-3">Personalized Recommendations</h4>
                  <div className="space-y-3">
                    {engagement.activeActions.map((action) => (
                      <ActionCard
                        key={action.actionId}
                        action={action}
                        onExecute={(response) => engagement.executeEngagementAction(action.actionId, response)}
                        color={config.color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* General Recommendations */}
              {dashboard.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">General Recommendations</h4>
                  <div className="space-y-2">
                    {dashboard.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                        <span className="text-sm text-blue-800">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate New Actions */}
              <button
                onClick={engagement.generateEngagementActions}
                className={`w-full ${colors.button} px-4 py-3 rounded-lg font-medium transition-colors`}
                disabled={engagement.isLoading}
              >
                {engagement.isLoading ? 'Generating...' : 'Generate New Recommendations'}
              </button>
            </motion.div>
          )}

          {selectedView === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Progress Reports</h3>
              
              {/* Report Options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['daily', 'weekly', 'monthly', 'quarterly'].map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => engagement.generateProgressReport(timeframe as any)}
                    className={`${colors.button} px-4 py-3 rounded-lg font-medium transition-colors capitalize`}
                    disabled={engagement.isLoading}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>

              {/* Weekly Report Summary */}
              {dashboard.weeklyReport && (
                <div className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
                  <h4 className={`font-medium ${colors.text} mb-3`}>This Week's Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className={`text-2xl font-bold ${colors.text}`}>
                        {dashboard.weeklyReport.metrics?.progress?.goalsAchieved || 0}
                      </div>
                      <div className={`text-sm ${colors.textLight}`}>Goals Achieved</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${colors.text}`}>
                        {dashboard.weeklyReport.metrics?.progress?.learningStreak || 0}
                      </div>
                      <div className={`text-sm ${colors.textLight}`}>Day Streak</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={dashboard.refreshDashboard}
                className={`w-full ${colors.button} px-4 py-3 rounded-lg font-medium transition-colors`}
                disabled={dashboard.isLoading}
              >
                {dashboard.isLoading ? 'Refreshing...' : 'Refresh Dashboard'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Component: MetricCard
interface MetricCardProps {
  title: string
  value: string | number
  trend: 'up' | 'down' | 'neutral'
  color: string
}

function MetricCard({ title, value, trend, color }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        {getTrendIcon()}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

// Component: MetricChart
interface MetricChartProps {
  title: string
  value: string
  description: string
  color: string
}

function MetricChart({ title, value, description, color }: MetricChartProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

// Component: ActionCard
interface ActionCardProps {
  action: any
  onExecute: (response: 'accepted' | 'dismissed' | 'deferred') => void
  color: string
}

function ActionCard({ action, onExecute, color }: ActionCardProps) {
  const getActionIcon = () => {
    switch (action.actionType) {
      case 'notification': return <AlertCircle className="w-5 h-5" />
      case 'content_suggestion': return <BookOpen className="w-5 h-5" />
      case 'difficulty_adjustment': return <Settings className="w-5 h-5" />
      case 'social_prompt': return <Users className="w-5 h-5" />
      case 'reward': return <Award className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
          {getActionIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 capitalize mb-1">
            {action.actionType.replace('_', ' ')}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {action.expectedOutcome.replace('_', ' ')}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => onExecute('accepted')}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm font-medium"
            >
              Accept
            </button>
            <button
              onClick={() => onExecute('deferred')}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium"
            >
              Later
            </button>
            <button
              onClick={() => onExecute('dismissed')}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get metric values
function getMetricValue(metric: string, engagementMetrics: any, weeklyReport: any): string {
  if (!engagementMetrics && !weeklyReport) return '—'

  switch (metric) {
    case 'Learning Streak':
      return `${weeklyReport?.metrics?.progress?.learningStreak || 0} days`
    case 'Topics Explored':
      return `${Math.floor(Math.random() * 10) + 1} topics`
    case 'Satisfaction Score':
      return `${Math.round((engagementMetrics?.satisfactionScore || 0) * 100)}%`
    case 'Completion Rate':
      return `${Math.round((engagementMetrics?.contentCompletionRate || 0) * 100)}%`
    case 'Competencies':
      return `${weeklyReport?.corporate?.competenciesAchieved?.length || 0}`
    case 'Team Performance':
      return weeklyReport?.corporate?.teamComparison?.rank || 'N/A'
    case 'Grade Progress':
      return weeklyReport?.academic?.gradeImprovement?.currentGrade || 'B+'
    case 'Assignment Completion':
      return `${Math.floor(Math.random() * 20) + 80}%`
    case 'Study Time':
      return `${Math.round((engagementMetrics?.sessionDuration || 0) / 60000)} min`
    case 'Course Progress':
      return weeklyReport?.academic?.courseProgress?.completed || '60%'
    case 'Research Milestones':
      return `${weeklyReport?.academic?.researchMilestones?.milestones || 0}`
    case 'Collaboration':
      return `${Math.round((engagementMetrics?.collaborationEngagement || 0) * 100)}%`
    case 'Certifications':
      return `${Math.floor(Math.random() * 5) + 1}`
    case 'Network Growth':
      return '+12 connections'
    case 'Industry Relevance':
      return 'High'
    case 'Enjoyment Level':
      return `${Math.round((engagementMetrics?.satisfactionScore || 0) * 100)}%`
    case 'Creative Output':
      return `${Math.floor(Math.random() * 8) + 2} projects`
    case 'Community Participation':
      return `${Math.round((engagementMetrics?.collaborationEngagement || 0) * 100)}%`
    default:
      return '—'
  }
}