// Analytics Dashboard Component
// Comprehensive dashboard for viewing user engagement, content performance, and platform metrics

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalytics } from '@/lib/analytics'

interface DashboardProps {
  userId?: string
  timeRange?: '7d' | '30d' | '90d'
  viewType?: 'user' | 'content' | 'platform'
}

interface UserEngagementData {
  user_id: string
  time_range: string
  session_count: number
  total_time_spent: number
  average_session_duration: number
  content_interactions: number
  quiz_completions: number
  ai_lesson_requests: number
  learning_streak: number
  engagement_score: number
  engagement_level: string
  learning_velocity: number
  subject_performance: Record<string, any>
  daily_activity: Record<string, number>
  content_preferences: Record<string, number>
  insights: string[]
}

interface ContentAnalytics {
  summary: {
    total_content_items: number
    total_views: number
    average_completion_rate: number
    average_engagement_rate: number
    top_performing_content: any[]
    content_type_performance: Record<string, any>
  }
  content_analytics: any[]
}

interface PlatformMetrics {
  time_range: string
  overview: {
    daily_active_users: number
    weekly_active_users: number
    monthly_active_users: number
    new_user_signups: number
    total_sessions: number
    total_events: number
    platform_health_score: number
  }
  user_metrics: any
  session_metrics: any
  content_metrics: any
  feature_usage: any
  insights: string[]
}

export default function AnalyticsDashboard({ 
  userId, 
  timeRange = '30d', 
  viewType = 'user' 
}: DashboardProps) {
  const [userData, setUserData] = useState<UserEngagementData | null>(null)
  const [contentData, setContentData] = useState<ContentAnalytics | null>(null)
  const [platformData, setPlatformData] = useState<PlatformMetrics | null>(null)
  const [learningInsights, setLearningInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(viewType)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  const analytics = useAnalytics()

  useEffect(() => {
    loadAnalyticsData()
  }, [activeTab, selectedTimeRange, userId])

  const loadAnalyticsData = async () => {
    setLoading(true)
    
    try {
      if (activeTab === 'user' && userId) {
        const [userResponse, insightsResponse] = await Promise.all([
          fetch(`/api/analytics/user-engagement?user_id=${userId}&range=${selectedTimeRange}`),
          fetch(`/api/analytics/insights?user_id=${userId}`)
        ])
        
        if (userResponse.ok) setUserData(await userResponse.json())
        if (insightsResponse.ok) setLearningInsights(await insightsResponse.json())
        
      } else if (activeTab === 'content') {
        const response = await fetch(`/api/analytics/content?range=${selectedTimeRange}`)
        if (response.ok) setContentData(await response.json())
        
      } else if (activeTab === 'platform') {
        const response = await fetch(`/api/analytics/platform?range=${selectedTimeRange}`)
        if (response.ok) setPlatformData(await response.json())
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const getEngagementColor = (level: string): string => {
    switch (level) {
      case 'very_high': return 'text-green-600 bg-green-100'
      case 'high': return 'text-blue-600 bg-blue-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="ml-4 text-lg text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Learning Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive insights into learning progress and platform performance
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'user', label: 'User Analytics', icon: '👤' },
            { id: 'content', label: 'Content Performance', icon: '📊' },
            { id: 'platform', label: 'Platform Metrics', icon: '🏗️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'content' | 'user' | 'platform')}
              className={`flex items-center px-6 py-3 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-end mb-6">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <AnimatePresence mode="wait">
          {/* User Analytics View */}
          {activeTab === 'user' && userData && (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Engagement Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Learning Streak"
                  value={`${userData.learning_streak} days`}
                  icon="🔥"
                  trend={userData.learning_streak > 3 ? 'up' : userData.learning_streak === 0 ? 'down' : 'neutral'}
                />
                <MetricCard
                  title="Engagement Score"
                  value={`${userData.engagement_score}/100`}
                  icon="⭐"
                  badge={userData.engagement_level}
                  badgeColor={getEngagementColor(userData.engagement_level)}
                />
                <MetricCard
                  title="Study Time"
                  value={formatDuration(userData.total_time_spent)}
                  icon="⏱️"
                  subtitle={`${userData.session_count} sessions`}
                />
                <MetricCard
                  title="Learning Velocity"
                  value={`${userData.learning_velocity} items/session`}
                  icon="🚀"
                  trend={userData.learning_velocity > 3 ? 'up' : userData.learning_velocity < 2 ? 'down' : 'neutral'}
                />
              </div>

              {/* Activity Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">Daily Activity</h3>
                  <ActivityChart data={userData.daily_activity} />
                </div>

                {/* Content Preferences */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">Content Preferences</h3>
                  <ContentPreferencesChart data={userData.content_preferences} />
                </div>
              </div>

              {/* Subject Performance */}
              {Object.keys(userData.subject_performance).length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">Subject Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(userData.subject_performance).map(([subject, perf]: [string, any]) => (
                      <div key={subject} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 capitalize">{subject}</h4>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Average Score:</span>
                            <span className="font-medium">{perf.averageScore}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Attempts:</span>
                            <span>{perf.attempts}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Improvement:</span>
                            <span className={perf.improvement > 0 ? 'text-green-600' : perf.improvement < 0 ? 'text-red-600' : 'text-gray-600'}>
                              {perf.improvement > 0 ? '+' : ''}{perf.improvement}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Insights */}
              {learningInsights && (
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">Personalized Insights</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-700 mb-3">Strengths</h4>
                      <ul className="space-y-2">
                        {learningInsights.strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-sm text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700 mb-3">Improvement Areas</h4>
                      <ul className="space-y-2">
                        {learningInsights.improvement_areas.map((area: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">→</span>
                            <span className="text-sm text-gray-700">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {learningInsights.ai_insights && learningInsights.ai_insights.length > 0 && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-700 mb-3">AI-Powered Insights</h4>
                      <ul className="space-y-2">
                        {learningInsights.ai_insights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-purple-700">
                            • {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* User Insights */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Key Insights</h3>
                <div className="space-y-3">
                  {userData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 mr-3">💡</span>
                      <span className="text-sm text-gray-700">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Analytics View */}
          {activeTab === 'content' && contentData && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Content Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Content"
                  value={contentData.summary.total_content_items.toString()}
                  icon="📚"
                />
                <MetricCard
                  title="Total Views"
                  value={contentData.summary.total_views.toLocaleString()}
                  icon="👁️"
                />
                <MetricCard
                  title="Completion Rate"
                  value={`${Math.round(contentData.summary.average_completion_rate)}%`}
                  icon="✅"
                  trend={contentData.summary.average_completion_rate > 70 ? 'up' : contentData.summary.average_completion_rate < 50 ? 'down' : 'neutral'}
                />
                <MetricCard
                  title="Engagement Rate"
                  value={`${Math.round(contentData.summary.average_engagement_rate)}%`}
                  icon="❤️"
                  trend={contentData.summary.average_engagement_rate > 60 ? 'up' : contentData.summary.average_engagement_rate < 30 ? 'down' : 'neutral'}
                />
              </div>

              {/* Content Type Performance */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Content Type Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(contentData.summary.content_type_performance).map(([type, perf]: [string, any]) => (
                    <div key={type} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 capitalize">{type}</h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Items:</span>
                          <span>{perf.count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Views:</span>
                          <span>{perf.averageViews}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completion:</span>
                          <span>{perf.averageCompletionRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Engagement:</span>
                          <span>{perf.averageEngagementRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Content */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Top Performing Content</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Content ID</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Views</th>
                        <th className="text-left py-3 px-4">Completion Rate</th>
                        <th className="text-left py-3 px-4">Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentData.summary.top_performing_content.slice(0, 10).map((content, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-mono text-sm">{content.content_id.slice(0, 8)}...</td>
                          <td className="py-3 px-4 capitalize">{content.content_type}</td>
                          <td className="py-3 px-4">{content.metrics.view_count}</td>
                          <td className="py-3 px-4">{content.metrics.completion_rate}%</td>
                          <td className="py-3 px-4">{content.metrics.engagement_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Platform Analytics View */}
          {activeTab === 'platform' && platformData && (
            <motion.div
              key="platform"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Platform Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Daily Active Users"
                  value={platformData.overview.daily_active_users.toString()}
                  icon="👥"
                />
                <MetricCard
                  title="New Signups"
                  value={platformData.overview.new_user_signups.toString()}
                  icon="📈"
                />
                <MetricCard
                  title="Total Sessions"
                  value={platformData.overview.total_sessions.toLocaleString()}
                  icon="🔄"
                />
                <MetricCard
                  title="Health Score"
                  value={`${platformData.overview.platform_health_score}/100`}
                  icon="💚"
                  trend={platformData.overview.platform_health_score > 80 ? 'up' : platformData.overview.platform_health_score < 60 ? 'down' : 'neutral'}
                />
              </div>

              {/* User Retention */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">User Retention</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {platformData.user_metrics?.retention_rates?.day_1 || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Day 1</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {platformData.user_metrics?.retention_rates?.day_7 || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Day 7</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {platformData.user_metrics?.retention_rates?.day_30 || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Day 30</div>
                  </div>
                </div>
              </div>

              {/* Feature Usage */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Feature Usage</h3>
                <div className="space-y-4">
                  {Object.entries(platformData.feature_usage).map(([feature, usage]: [string, any]) => (
                    <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium capitalize">{feature.replace('_', ' ')}</span>
                        <div className="text-sm text-gray-600">
                          {usage.unique_users} users ({usage.percentage_of_users}%)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{usage.usage_count}</div>
                        <div className="text-sm text-gray-600">uses</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Insights */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Platform Insights</h3>
                <div className="space-y-3">
                  {platformData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 mr-3">📊</span>
                      <span className="text-sm text-gray-700">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  trend, 
  badge, 
  badgeColor 
}: {
  title: string
  value: string
  icon: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  badge?: string
  badgeColor?: string
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '→'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      {subtitle && (
        <div className="text-xs text-gray-500">{subtitle}</div>
      )}
      {trend && (
        <div className={`text-xs ${trendColors[trend]} flex items-center mt-1`}>
          <span className="mr-1">{trendIcons[trend]}</span>
          {trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable'}
        </div>
      )}
    </motion.div>
  )
}

// Activity Chart Component
function ActivityChart({ data }: { data: Record<string, number> }) {
  const maxValue = Math.max(...Object.values(data))
  const dates = Object.keys(data).sort()

  return (
    <div className="space-y-2">
      {dates.slice(-14).map((date) => {
        const value = data[date] || 0
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
        
        return (
          <div key={date} className="flex items-center space-x-3">
            <div className="w-16 text-xs text-gray-600 truncate">
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: dates.indexOf(date) * 0.1 }}
                className="bg-blue-500 h-2 rounded-full"
              />
            </div>
            <div className="w-8 text-xs text-gray-600 text-right">{value}</div>
          </div>
        )
      })}
    </div>
  )
}

// Content Preferences Chart Component
function ContentPreferencesChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0)
  const sortedData = Object.entries(data).sort(([,a], [,b]) => b - a)

  return (
    <div className="space-y-3">
      {sortedData.map(([type, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0
        
        return (
          <div key={type} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-700 capitalize truncate">{type}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
                className="bg-purple-500 h-3 rounded-full"
              />
            </div>
            <div className="w-12 text-sm text-gray-600 text-right">
              {Math.round(percentage)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}