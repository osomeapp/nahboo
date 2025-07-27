// Learning Path Progress Tracking API
// Tracks and updates user progress through personalized learning paths

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface UpdateProgressRequest {
  path_id: string
  user_id: string
  node_id: string
  progress_type: 'content_completed' | 'objective_mastered' | 'milestone_reached' | 'skill_acquired'
  progress_data: {
    content_item_id?: string
    time_spent?: number
    score_achieved?: number
    completion_percentage?: number
    skills_demonstrated?: string[]
    performance_metrics?: Record<string, number>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateProgressRequest = await request.json()

    // Validate required fields
    if (!body.path_id || !body.user_id || !body.node_id || !body.progress_type) {
      return NextResponse.json(
        { error: 'Missing required fields: path_id, user_id, node_id, and progress_type are required' },
        { status: 400 }
      )
    }

    // Get current learning path
    const { data: pathData, error: pathError } = await supabaseAdmin
      .from('learning_paths')
      .select('*')
      .eq('id', body.path_id)
      .eq('user_id', body.user_id)
      .single()

    if (pathError || !pathData) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      )
    }

    // Update progress in database
    const progressUpdate = {
      path_id: body.path_id,
      user_id: body.user_id,
      node_id: body.node_id,
      progress_type: body.progress_type,
      progress_data: body.progress_data,
      timestamp: new Date().toISOString()
    }

    await supabaseAdmin
      .from('learning_path_progress')
      .insert(progressUpdate)

    // Calculate updated path progress
    const updatedProgress = await calculatePathProgress(body.path_id, body.user_id)

    // Update learning path with new progress
    await supabaseAdmin
      .from('learning_paths')
      .update({
        progress_percentage: updatedProgress.overall_percentage,
        current_node: updatedProgress.current_node,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.path_id)
      .eq('user_id', body.user_id)

    // Check for milestones and achievements
    const achievements = await checkForAchievements(body.path_id, body.user_id, updatedProgress)

    // Determine next recommendations
    const nextRecommendations = await generateNextRecommendations(
      body.path_id,
      body.user_id,
      updatedProgress
    )

    return NextResponse.json({
      success: true,
      progress_update: progressUpdate,
      updated_progress: updatedProgress,
      achievements: achievements,
      next_recommendations: nextRecommendations
    })

  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

// Get detailed progress for a learning path
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pathId = searchParams.get('path_id')
    const userId = searchParams.get('user_id')
    const includeAnalytics = searchParams.get('include_analytics') === 'true'

    if (!pathId || !userId) {
      return NextResponse.json(
        { error: 'path_id and user_id parameters are required' },
        { status: 400 }
      )
    }

    // Get learning path data
    const { data: pathData, error: pathError } = await supabaseAdmin
      .from('learning_paths')
      .select('*')
      .eq('id', pathId)
      .eq('user_id', userId)
      .single()

    if (pathError || !pathData) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      )
    }

    // Get detailed progress data
    const progressData = await getDetailedProgress(pathId, userId)

    // Get progress analytics if requested
    let analytics = null
    if (includeAnalytics) {
      analytics = await getProgressAnalytics(pathId, userId)
    }

    return NextResponse.json({
      success: true,
      learning_path: pathData,
      progress: progressData,
      analytics: analytics
    })

  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    )
  }
}

// Helper functions
async function calculatePathProgress(pathId: string, userId: string) {
  // Get all progress entries for this path
  const { data: progressEntries } = await supabaseAdmin
    .from('learning_path_progress')
    .select('*')
    .eq('path_id', pathId)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  // Get path structure
  const { data: pathData } = await supabaseAdmin
    .from('learning_paths')
    .select('path_data')
    .eq('id', pathId)
    .single()

  if (!pathData || !pathData.path_data.nodes) {
    return {
      overall_percentage: 0,
      current_node: null,
      completed_nodes: [],
      current_objective: null
    }
  }

  const nodes = pathData.path_data.nodes
  const completedNodes = new Set()
  const nodeProgress: Record<string, any> = {}

  // Process progress entries
  progressEntries?.forEach(entry => {
    const nodeId = entry.node_id
    
    if (!nodeProgress[nodeId]) {
      nodeProgress[nodeId] = {
        content_completed: [],
        objectives_mastered: [],
        total_time_spent: 0,
        best_score: 0,
        completion_percentage: 0
      }
    }

    const nodeProng = nodeProgress[nodeId]
    
    switch (entry.progress_type) {
      case 'content_completed':
        if (entry.progress_data.content_item_id) {
          nodeProng.content_completed.push(entry.progress_data.content_item_id)
        }
        break
      case 'objective_mastered':
        nodeProng.objectives_mastered.push(entry.timestamp)
        break
      case 'milestone_reached':
        nodeProng.completion_percentage = Math.max(
          nodeProng.completion_percentage,
          entry.progress_data.completion_percentage || 0
        )
        break
    }

    if (entry.progress_data.time_spent) {
      nodeProng.total_time_spent += entry.progress_data.time_spent
    }

    if (entry.progress_data.score_achieved) {
      nodeProng.best_score = Math.max(nodeProng.best_score, entry.progress_data.score_achieved)
    }
  })

  // Determine completed nodes
  nodes.forEach((node: any) => {
    const progress = nodeProgress[node.id]
    if (progress) {
      // Check completion criteria
      const hasMinScore = progress.best_score >= (node.completion_criteria?.min_score || 70)
      const hasRequiredInteractions = progress.content_completed.length >= (node.completion_criteria?.required_interactions || 1)
      const hasTimeThreshold = progress.total_time_spent >= (node.completion_criteria?.time_spent_threshold || 0)

      if (hasMinScore && hasRequiredInteractions && hasTimeThreshold) {
        completedNodes.add(node.id)
      }
    }
  })

  // Calculate overall progress percentage
  const overallPercentage = Math.round((completedNodes.size / nodes.length) * 100)

  // Find current node (first incomplete node)
  const currentNode = nodes.find((node: any) => !completedNodes.has(node.id))

  return {
    overall_percentage: overallPercentage,
    current_node: currentNode?.id || null,
    completed_nodes: Array.from(completedNodes),
    current_objective: currentNode?.objective.title || null,
    node_progress: nodeProgress
  }
}

async function getDetailedProgress(pathId: string, userId: string) {
  const progressData = await calculatePathProgress(pathId, userId)

  // Get recent activity
  const { data: recentActivity } = await supabaseAdmin
    .from('learning_path_progress')
    .select('*')
    .eq('path_id', pathId)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(10)

  // Calculate learning velocity
  const learningVelocity = await calculateLearningVelocity(pathId, userId)

  // Get upcoming milestones
  const upcomingMilestones = await getUpcomingMilestones(pathId, userId, progressData)

  return {
    ...progressData,
    recent_activity: recentActivity || [],
    learning_velocity: learningVelocity,
    upcoming_milestones: upcomingMilestones,
    estimated_completion_date: calculateEstimatedCompletion(progressData, learningVelocity)
  }
}

async function getProgressAnalytics(pathId: string, userId: string) {
  // Time spent analysis
  const { data: timeData } = await supabaseAdmin
    .from('learning_path_progress')
    .select('progress_data, timestamp')
    .eq('path_id', pathId)
    .eq('user_id', userId)
    .order('timestamp', { ascending: true })

  const dailyTime = calculateDailyTimeSpent(timeData || [])
  const weeklyProgress = calculateWeeklyProgress(timeData || [])

  // Performance trends
  const { data: performanceData } = await supabaseAdmin
    .from('learning_path_progress')
    .select('progress_data')
    .eq('path_id', pathId)
    .eq('user_id', userId)
    .eq('progress_type', 'content_completed')
    .order('timestamp', { ascending: true })

  const performanceTrend = calculatePerformanceTrend(performanceData || [])

  // Engagement metrics
  const engagementMetrics = await calculateEngagementMetrics(pathId, userId)

  return {
    time_analytics: {
      daily_time_spent: dailyTime,
      weekly_progress: weeklyProgress,
      total_study_time: dailyTime.reduce((sum, day) => sum + day.minutes, 0)
    },
    performance_analytics: {
      trend: performanceTrend,
      average_score: performanceTrend.length > 0 
        ? performanceTrend.reduce((sum, p) => sum + p.score, 0) / performanceTrend.length 
        : 0,
      improvement_rate: calculateImprovementRate(performanceTrend)
    },
    engagement_analytics: engagementMetrics
  }
}

async function checkForAchievements(pathId: string, userId: string, progress: any) {
  const achievements = []

  // Check progress milestones
  if (progress.overall_percentage >= 25 && progress.overall_percentage < 50) {
    achievements.push({
      type: 'progress_milestone',
      title: 'Quarter Way There!',
      description: 'You\'ve completed 25% of your learning path',
      points: 250,
      earned_at: new Date().toISOString()
    })
  }

  if (progress.overall_percentage >= 50 && progress.overall_percentage < 75) {
    achievements.push({
      type: 'progress_milestone',
      title: 'Halfway Hero!',
      description: 'You\'ve reached the halfway point of your learning journey',
      points: 500,
      earned_at: new Date().toISOString()
    })
  }

  if (progress.overall_percentage >= 75 && progress.overall_percentage < 100) {
    achievements.push({
      type: 'progress_milestone',
      title: 'Almost There!',
      description: 'You\'re in the final stretch - 75% complete!',
      points: 750,
      earned_at: new Date().toISOString()
    })
  }

  if (progress.overall_percentage === 100) {
    achievements.push({
      type: 'path_completion',
      title: 'Path Master!',
      description: 'You\'ve successfully completed your entire learning path',
      points: 1000,
      earned_at: new Date().toISOString()
    })
  }

  // Check for streaks
  const streak = await calculateLearningStreak(pathId, userId)
  if (streak >= 7) {
    achievements.push({
      type: 'learning_streak',
      title: 'Week Warrior!',
      description: `${streak} days of consistent learning`,
      points: streak * 10,
      earned_at: new Date().toISOString()
    })
  }

  return achievements
}

async function generateNextRecommendations(pathId: string, userId: string, progress: any) {
  const recommendations = []

  // Content recommendations based on current node
  if (progress.current_node) {
    recommendations.push({
      type: 'next_content',
      title: 'Continue Your Journey',
      description: `Ready to tackle ${progress.current_objective}?`,
      action: 'continue_path',
      priority: 'high'
    })
  }

  // Review recommendations for weaker areas
  const strugglingAreas = await identifyStruggleAreas(pathId, userId)
  strugglingAreas.forEach(area => {
    recommendations.push({
      type: 'review_content',
      title: 'Strengthen Your Foundation',
      description: `Review ${area} to improve your understanding`,
      action: 'review_content',
      priority: 'medium'
    })
  })

  // Practice recommendations
  if (progress.overall_percentage > 25) {
    recommendations.push({
      type: 'practice_quiz',
      title: 'Test Your Knowledge',
      description: 'Take a practice quiz to reinforce your learning',
      action: 'generate_quiz',
      priority: 'medium'
    })
  }

  return recommendations.slice(0, 5) // Limit to top 5 recommendations
}

// Utility functions
async function calculateLearningVelocity(pathId: string, userId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentProgress } = await supabaseAdmin
    .from('learning_path_progress')
    .select('progress_data, timestamp')
    .eq('path_id', pathId)
    .eq('user_id', userId)
    .gte('timestamp', sevenDaysAgo.toISOString())

  if (!recentProgress || recentProgress.length === 0) {
    return {
      items_per_day: 0,
      minutes_per_item: 0,
      consistency_score: 0
    }
  }

  const totalItems = recentProgress.length
  const totalTime = recentProgress.reduce((sum, p) => sum + (p.progress_data.time_spent || 0), 0)
  const uniqueDays = new Set(recentProgress.map(p => p.timestamp.split('T')[0])).size

  return {
    items_per_day: uniqueDays > 0 ? Math.round((totalItems / uniqueDays) * 10) / 10 : 0,
    minutes_per_item: totalItems > 0 ? Math.round(totalTime / totalItems) : 0,
    consistency_score: Math.min(100, (uniqueDays / 7) * 100)
  }
}

async function getUpcomingMilestones(pathId: string, userId: string, progress: any) {
  // This would analyze the path structure and current progress to identify upcoming milestones
  const milestones = []

  // Next objective milestone
  if (progress.current_node) {
    milestones.push({
      type: 'objective_completion',
      title: progress.current_objective,
      estimated_time: 120, // minutes
      requirements: ['Complete all content', 'Score 70% or higher', 'Demonstrate understanding']
    })
  }

  // Next progress percentage milestone
  const nextPercentageMilestone = Math.ceil(progress.overall_percentage / 25) * 25
  if (nextPercentageMilestone <= 100 && nextPercentageMilestone > progress.overall_percentage) {
    milestones.push({
      type: 'progress_milestone',
      title: `${nextPercentageMilestone}% Complete`,
      estimated_time: 240, // minutes
      requirements: [`Complete ${nextPercentageMilestone}% of learning path`]
    })
  }

  return milestones
}

function calculateEstimatedCompletion(progress: any, velocity: any) {
  if (velocity.items_per_day === 0 || progress.overall_percentage === 100) {
    return null
  }

  const remainingPercentage = 100 - progress.overall_percentage
  const averageItemsPerPercentage = 1 // Simplified assumption
  const remainingItems = remainingPercentage * averageItemsPerPercentage
  const daysToComplete = Math.ceil(remainingItems / velocity.items_per_day)

  const completionDate = new Date()
  completionDate.setDate(completionDate.getDate() + daysToComplete)

  return completionDate.toISOString()
}

function calculateDailyTimeSpent(timeData: any[]) {
  const dailyTime: Record<string, number> = {}

  timeData.forEach(entry => {
    const date = entry.timestamp.split('T')[0]
    const timeSpent = entry.progress_data?.time_spent || 0
    dailyTime[date] = (dailyTime[date] || 0) + timeSpent
  })

  return Object.entries(dailyTime).map(([date, minutes]) => ({
    date,
    minutes: Math.round(minutes)
  }))
}

function calculateWeeklyProgress(timeData: any[]) {
  // Group by week and calculate progress
  const weeklyData: Record<string, number> = {}

  timeData.forEach(entry => {
    const date = new Date(entry.timestamp)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
    const weekKey = weekStart.toISOString().split('T')[0]
    
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1
  })

  return Object.entries(weeklyData).map(([week, items]) => ({
    week,
    items_completed: items
  }))
}

function calculatePerformanceTrend(performanceData: any[]) {
  return performanceData.map(entry => ({
    timestamp: entry.progress_data?.timestamp || new Date().toISOString(),
    score: entry.progress_data?.score_achieved || 0,
    time_spent: entry.progress_data?.time_spent || 0
  }))
}

async function calculateEngagementMetrics(pathId: string, userId: string) {
  // Get engagement data from analytics
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: engagementData } = await supabaseAdmin
    .from('analytics_events')
    .select('properties, timestamp')
    .eq('user_id', userId)
    .gte('timestamp', sevenDaysAgo.toISOString())

  const totalInteractions = engagementData?.length || 0
  const avgEngagementTime = engagementData?.reduce((sum, e) => {
    return sum + (e.properties?.time_spent || 0)
  }, 0) / Math.max(1, totalInteractions)

  return {
    daily_interactions: Math.round(totalInteractions / 7),
    average_engagement_time: Math.round(avgEngagementTime || 0),
    engagement_consistency: totalInteractions > 0 ? 75 : 0 // Simplified
  }
}

function calculateImprovementRate(performanceTrend: any[]) {
  if (performanceTrend.length < 2) return 0

  const firstScore = performanceTrend[0].score
  const lastScore = performanceTrend[performanceTrend.length - 1].score

  return lastScore - firstScore
}

async function calculateLearningStreak(pathId: string, userId: string) {
  const { data: recentActivity } = await supabaseAdmin
    .from('learning_path_progress')
    .select('timestamp')
    .eq('path_id', pathId)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  if (!recentActivity || recentActivity.length === 0) return 0

  const uniqueDays = [...new Set(recentActivity.map(a => a.timestamp.split('T')[0]))]
  uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const day of uniqueDays) {
    const activityDate = new Date(day)
    activityDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((currentDate.getTime() - activityDate.getTime()) / (24 * 60 * 60 * 1000))

    if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
      streak++
      currentDate = activityDate
    } else {
      break
    }
  }

  return streak
}

async function identifyStruggleAreas(pathId: string, userId: string) {
  const { data: progressData } = await supabaseAdmin
    .from('learning_path_progress')
    .select('node_id, progress_data')
    .eq('path_id', pathId)
    .eq('user_id', userId)

  const nodeScores: Record<string, number[]> = {}

  progressData?.forEach(entry => {
    const score = entry.progress_data?.score_achieved
    if (score !== undefined) {
      if (!nodeScores[entry.node_id]) {
        nodeScores[entry.node_id] = []
      }
      nodeScores[entry.node_id].push(score)
    }
  })

  const strugglingNodes = Object.entries(nodeScores)
    .filter(([nodeId, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      return avgScore < 70
    })
    .map(([nodeId]) => nodeId)

  return strugglingNodes
}