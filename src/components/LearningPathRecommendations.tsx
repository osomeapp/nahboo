// Learning Path Recommendations Component
// Displays personalized learning path recommendations based on user analytics

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  Brain, 
  Sparkles,
  ChevronRight,
  Star,
  Users,
  Zap,
  Award,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { useUserProfile } from '@/lib/store'

interface LearningPathRecommendation {
  id: string
  title: string
  description: string
  subject: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_completion_time: number // minutes
  goals: string[]
  preview_objectives: string[]
  confidence_score: number
  personalization_factors: string[]
  estimated_outcomes: {
    skill_improvement: number
    knowledge_gain: number
    career_relevance: number
  }
  path_type: 'foundation' | 'specialization' | 'advanced' | 'remedial' | 'exploration'
}

interface RecommendationProps {
  userId?: string
  maxRecommendations?: number
  filterBySubject?: string
  onPathSelect?: (pathId: string) => void
}

export default function LearningPathRecommendations({ 
  userId, 
  maxRecommendations = 5,
  filterBySubject,
  onPathSelect 
}: RecommendationProps) {
  const userProfile = useUserProfile()
  const [recommendations, setRecommendations] = useState<LearningPathRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [generatingPath, setGeneratingPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userProfile?.id) {
      loadRecommendations()
    }
  }, [userProfile?.id, filterBySubject])

  const loadRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch user learning profile and analytics
      const analyticsResponse = await fetch(`/api/analytics/insights?user_id=${userProfile?.id}`)
      const analyticsData = await analyticsResponse.json()

      // Generate recommendations based on analytics
      const mockRecommendations = await generateMockRecommendations(analyticsData, userProfile)
      
      setRecommendations(mockRecommendations.slice(0, maxRecommendations))
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      setError('Failed to load learning path recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePath = async (recommendation: LearningPathRecommendation) => {
    if (!userProfile?.id) return

    setGeneratingPath(recommendation.id)

    try {
      const response = await fetch('/api/learning-paths/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userProfile.id,
          subject: recommendation.subject,
          goals: recommendation.goals,
          timeframe: Math.ceil(recommendation.estimated_completion_time / (60 * 24)), // Convert to days
          current_level: recommendation.difficulty_level
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create learning path')
      }

      const result = await response.json()
      
      if (onPathSelect) {
        onPathSelect(result.learning_path.id)
      }

      // Show success feedback
      setSelectedPath(recommendation.id)
      setTimeout(() => setSelectedPath(null), 3000)

    } catch (error) {
      console.error('Failed to create learning path:', error)
      setError('Failed to create learning path. Please try again.')
    } finally {
      setGeneratingPath(null)
    }
  }

  const getPathTypeIcon = (type: string) => {
    switch (type) {
      case 'foundation': return <BookOpen className="w-5 h-5" />
      case 'specialization': return <Target className="w-5 h-5" />
      case 'advanced': return <Brain className="w-5 h-5" />
      case 'remedial': return <RefreshCw className="w-5 h-5" />
      case 'exploration': return <Sparkles className="w-5 h-5" />
      default: return <BookOpen className="w-5 h-5" />
    }
  }

  const getPathTypeColor = (type: string) => {
    switch (type) {
      case 'foundation': return 'text-blue-600 bg-blue-100'
      case 'specialization': return 'text-purple-600 bg-purple-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      case 'remedial': return 'text-orange-600 bg-orange-100'
      case 'exploration': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-gray-600">Analyzing your learning patterns...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRecommendations}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Personalized Learning Paths
            </h2>
            <p className="text-blue-100">
              AI-curated paths designed specifically for your learning style and goals
            </p>
          </div>
          <Sparkles className="w-12 h-12 text-yellow-300" />
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <AnimatePresence>
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all duration-300 ${
                selectedPath === recommendation.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-transparent hover:border-blue-200 hover:shadow-xl'
              }`}
            >
              {/* Path Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getPathTypeColor(recommendation.path_type)}`}>
                    {getPathTypeIcon(recommendation.path_type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {recommendation.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {recommendation.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty_level)}`}>
                        {recommendation.difficulty_level}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                        {recommendation.subject}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-indigo-600 bg-indigo-100">
                        {formatTime(recommendation.estimated_completion_time)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="text-right">
                  <div className="flex items-center text-yellow-600 mb-1">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">
                      {Math.round(recommendation.confidence_score * 100)}% match
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    AI confidence
                  </div>
                </div>
              </div>

              {/* Learning Goals */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Learning Goals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.goals.slice(0, 3).map((goal, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {goal}
                    </span>
                  ))}
                  {recommendation.goals.length > 3 && (
                    <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm">
                      +{recommendation.goals.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Objectives */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  What You'll Learn
                </h4>
                <ul className="space-y-1">
                  {recommendation.preview_objectives.slice(0, 3).map((objective, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <ChevronRight className="w-3 h-3 mr-2 text-gray-400" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estimated Outcomes */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Expected Outcomes
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      +{recommendation.estimated_outcomes.skill_improvement}%
                    </div>
                    <div className="text-xs text-gray-500">Skill Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      +{recommendation.estimated_outcomes.knowledge_gain}%
                    </div>
                    <div className="text-xs text-gray-500">Knowledge</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {recommendation.estimated_outcomes.career_relevance}%
                    </div>
                    <div className="text-xs text-gray-500">Career Relevant</div>
                  </div>
                </div>
              </div>

              {/* Personalization Factors */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-1" />
                  Personalized For You
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.personalization_factors.map((factor, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                      {factor.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Based on your learning analytics</span>
                </div>
                
                {selectedPath === recommendation.id ? (
                  <div className="flex items-center text-green-600">
                    <Award className="w-5 h-5 mr-2" />
                    <span className="font-medium">Path Created!</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCreatePath(recommendation)}
                    disabled={generatingPath === recommendation.id}
                    className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                      generatingPath === recommendation.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                    }`}
                  >
                    {generatingPath === recommendation.id ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start This Path
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Recommendations Message */}
      {recommendations.length === 0 && !loading && (
        <div className="bg-white rounded-xl p-8 text-center shadow-lg">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Recommendations Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Complete some content and quizzes to get personalized learning path recommendations
          </p>
          <button
            onClick={loadRecommendations}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh Recommendations
          </button>
        </div>
      )}
    </div>
  )
}

// Mock recommendation generation (replace with real API call)
async function generateMockRecommendations(
  analyticsData: any, 
  userProfile: any
): Promise<LearningPathRecommendation[]> {
  const subject = userProfile?.subject || 'mathematics'
  
  const recommendations: LearningPathRecommendation[] = [
    {
      id: 'path_foundation_math',
      title: 'Mathematical Foundations Mastery',
      description: 'Build a solid foundation in core mathematical concepts with personalized pacing and AI-powered assistance.',
      subject: subject,
      difficulty_level: 'beginner',
      estimated_completion_time: 1200, // 20 hours
      goals: ['Master basic algebra', 'Understand geometric principles', 'Apply problem-solving strategies'],
      preview_objectives: [
        'Linear equations and inequalities',
        'Basic geometric shapes and properties',
        'Introduction to functions and graphs'
      ],
      confidence_score: 0.92,
      personalization_factors: ['learning_pace', 'content_preferences', 'performance_history'],
      estimated_outcomes: {
        skill_improvement: 45,
        knowledge_gain: 60,
        career_relevance: 75
      },
      path_type: 'foundation'
    },
    {
      id: 'path_advanced_calc',
      title: 'Advanced Calculus Deep Dive',
      description: 'Advanced calculus concepts with real-world applications, designed for high-performing learners.',
      subject: subject,
      difficulty_level: 'advanced',
      estimated_completion_time: 1800, // 30 hours
      goals: ['Master multivariable calculus', 'Apply differential equations', 'Solve optimization problems'],
      preview_objectives: [
        'Partial derivatives and multiple integrals',
        'Vector calculus and field theory',
        'Applications in physics and engineering'
      ],
      confidence_score: 0.78,
      personalization_factors: ['high_performance', 'challenge_preference', 'STEM_focus'],
      estimated_outcomes: {
        skill_improvement: 65,
        knowledge_gain: 80,
        career_relevance: 90
      },
      path_type: 'advanced'
    },
    {
      id: 'path_practical_stats',
      title: 'Practical Statistics for Data Analysis',
      description: 'Learn statistical concepts through hands-on data analysis projects and real-world examples.',
      subject: subject,
      difficulty_level: 'intermediate',
      estimated_completion_time: 960, // 16 hours
      goals: ['Understand statistical inference', 'Master data visualization', 'Apply statistical tests'],
      preview_objectives: [
        'Hypothesis testing and confidence intervals',
        'Regression analysis and correlation',
        'Data visualization with statistical software'
      ],
      confidence_score: 0.85,
      personalization_factors: ['practical_application', 'visual_learning', 'career_goals'],
      estimated_outcomes: {
        skill_improvement: 55,
        knowledge_gain: 70,
        career_relevance: 95
      },
      path_type: 'specialization'
    }
  ]

  return recommendations
}