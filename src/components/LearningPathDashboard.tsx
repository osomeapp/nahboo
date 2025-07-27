// Learning Path Dashboard Component
// Comprehensive dashboard for tracking active learning paths and progress

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  Circle,
  Play,
  Pause,
  MoreVertical,
  Calendar,
  Award,
  Zap,
  BarChart3,
  Brain,
  Star,
  ChevronRight,
  Settings,
  RefreshCw
} from 'lucide-react'
import { useUserProfile } from '@/lib/store'

interface LearningPath {
  id: string
  title: string
  subject: string
  status: 'active' | 'completed' | 'paused'
  progress_percentage: number
  estimated_completion_time: number
  time_remaining: number
  current_objective: string
  total_objectives: number
  completed_objectives: number
  created_at: string
  updated_at: string
  next_milestone: {
    title: string
    estimated_time: number
    difficulty: string
  }
  recent_activity: ActivityItem[]
  learning_velocity: {
    items_per_day: number
    minutes_per_item: number
    consistency_score: number
  }
  upcoming_milestones: Milestone[]
}

interface ActivityItem {
  id: string
  type: 'content_completed' | 'objective_mastered' | 'milestone_reached'
  title: string
  timestamp: string
  score?: number
  time_spent?: number
}

interface Milestone {
  type: 'objective_completion' | 'progress_milestone'
  title: string
  estimated_time: number
  requirements: string[]
}

interface DashboardProps {
  userId?: string
  showRecommendations?: boolean
}

export default function LearningPathDashboard({ userId, showRecommendations = true }: DashboardProps) {
  const userProfile = useUserProfile()
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active')

  useEffect(() => {
    if (userProfile?.id) {
      loadLearningPaths()
    }
  }, [userProfile?.id, activeTab])

  const loadLearningPaths = async () => {
    setLoading(true)
    setError(null)

    try {
      const statusFilter = activeTab === 'all' ? '' : `&status=${activeTab}`
      const response = await fetch(`/api/learning-paths/generate?user_id=${userProfile?.id}${statusFilter}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning paths')
      }

      const result = await response.json()
      setLearningPaths(result.learning_paths || [])
    } catch (error) {
      console.error('Failed to load learning paths:', error)
      setError('Failed to load learning paths')
    } finally {
      setLoading(false)
    }
  }

  const handlePathAction = async (pathId: string, action: 'pause' | 'resume' | 'restart') => {
    try {
      // This would call an API to update path status
      const updatedPaths = learningPaths.map(path => 
        path.id === pathId 
          ? { ...path, status: action === 'pause' ? 'paused' as const : 'active' as const }
          : path
      )
      setLearningPaths(updatedPaths)
    } catch (error) {
      console.error('Failed to update path:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'objective_mastered': return <Target className="w-4 h-4 text-blue-500" />
      case 'milestone_reached': return <Award className="w-4 h-4 text-purple-500" />
      default: return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="ml-4 text-lg text-gray-600">Loading your learning paths...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Learning Path Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Track your personalized learning journey and progress
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active Paths</p>
                <p className="text-2xl font-bold text-gray-900">
                  {learningPaths.filter(p => p.status === 'active').length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {learningPaths.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {learningPaths.length > 0 
                    ? Math.round(learningPaths.reduce((sum, p) => sum + p.progress_percentage, 0) / learningPaths.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(learningPaths.reduce((sum, p) => sum + (p.estimated_completion_time - p.time_remaining), 0))}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'active', label: 'Active Paths', count: learningPaths.filter(p => p.status === 'active').length },
            { id: 'completed', label: 'Completed', count: learningPaths.filter(p => p.status === 'completed').length },
            { id: 'all', label: 'All Paths', count: learningPaths.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Learning Paths List */}
        {learningPaths.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Learning Paths Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first personalized learning path to get started
            </p>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Browse Recommendations
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {learningPaths.map((path, index) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Path Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {path.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(path.status)}`}>
                            {path.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{path.subject}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Started {formatDate(path.created_at)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTime(path.time_remaining)} remaining
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Menu */}
                    <div className="flex items-center space-x-2">
                      {path.status === 'active' && (
                        <button
                          onClick={() => handlePathAction(path.id, 'pause')}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {path.status === 'paused' && (
                        <button
                          onClick={() => handlePathAction(path.id, 'resume')}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-medium text-gray-900">{path.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${path.progress_percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{path.completed_objectives}/{path.total_objectives} objectives completed</span>
                      <span>{formatTime(path.estimated_completion_time - path.time_remaining)} studied</span>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Current Objective */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Current Objective
                      </h4>
                      <p className="text-sm text-blue-900">{path.current_objective}</p>
                    </div>

                    {/* Next Milestone */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        Next Milestone
                      </h4>
                      <p className="text-sm text-purple-900">{path.next_milestone.title}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        ~{formatTime(path.next_milestone.estimated_time)}
                      </p>
                    </div>

                    {/* Learning Velocity */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        Learning Velocity
                      </h4>
                      <p className="text-sm text-green-900">
                        {path.learning_velocity.items_per_day} items/day
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {path.learning_velocity.consistency_score}% consistency
                      </p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {path.recent_activity && path.recent_activity.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Recent Activity
                      </h4>
                      <div className="space-y-2">
                        {path.recent_activity.slice(0, 3).map((activity, idx) => (
                          <div key={idx} className="flex items-center space-x-3 text-sm">
                            {getActivityIcon(activity.type)}
                            <span className="flex-1 text-gray-700">{activity.title}</span>
                            <span className="text-gray-500">{formatDate(activity.timestamp)}</span>
                            {activity.score && (
                              <span className="text-green-600 font-medium">{activity.score}%</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Milestones */}
                  {path.upcoming_milestones && path.upcoming_milestones.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Upcoming Milestones
                      </h4>
                      <div className="space-y-2">
                        {path.upcoming_milestones.slice(0, 2).map((milestone, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                              <p className="text-xs text-gray-600">
                                {milestone.requirements.slice(0, 2).join(', ')}
                                {milestone.requirements.length > 2 && ` +${milestone.requirements.length - 2} more`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatTime(milestone.estimated_time)}
                              </p>
                              <p className="text-xs text-gray-500">estimated</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {path.status === 'active' && (
                        <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          <Play className="w-4 h-4 mr-2" />
                          Continue Learning
                        </button>
                      )}
                      <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </button>
                    </div>
                    
                    <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                      <Settings className="w-4 h-4 mr-1" />
                      Customize Path
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}