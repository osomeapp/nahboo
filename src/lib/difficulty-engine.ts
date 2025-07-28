import type { UserProfile, ContentItem } from '@/types'

// Core interfaces for difficulty adjustment system
export interface DifficultyProfile {
  userId: string
  subject: string
  currentLevel: number // 1-10 scale
  optimalLevel: number // Target difficulty for flow state
  confidence: number // 0-1, how confident we are in the level
  
  // Performance metrics
  successRate: number // Recent success rate (0-1)
  averageAttempts: number // Average attempts to complete content
  timeToComplete: number // Average time in seconds
  helpRequests: number // Number of help requests per content item
  
  // Learning velocity
  improvementRate: number // Rate of improvement over time
  plateauDetection: boolean // Whether user has hit a learning plateau
  lastAdjustment: Date // When difficulty was last adjusted
  
  // Contextual factors
  sessionQuality: number // Quality of current learning session
  fatigueLevel: number // Estimated fatigue (0-1)
  motivationLevel: number // Estimated motivation (0-1)
  
  // Historical data
  adjustmentHistory: DifficultyAdjustment[]
  performanceHistory: PerformancePoint[]
}

export interface DifficultyAdjustment {
  timestamp: Date
  fromLevel: number
  toLevel: number
  reason: string
  trigger: 'performance' | 'time' | 'plateau' | 'manual' | 'ai_recommendation'
  confidence: number
  successfullyApplied: boolean
}

export interface PerformancePoint {
  timestamp: Date
  contentId: string
  difficultyLevel: number
  success: boolean
  attempts: number
  timeSpent: number // seconds
  score?: number // 0-1 if applicable
  contextFactors: {
    timeOfDay: 'morning' | 'afternoon' | 'evening'
    sessionDuration: number // minutes into session
    deviceType: string
    distractionLevel: number // 0-1 estimated
  }
}

export interface DifficultyRecommendation {
  recommendedLevel: number
  confidence: number
  reasoning: string
  urgency: 'low' | 'medium' | 'high'
  expectedImprovement: number // 0-1 scale
  riskLevel: 'low' | 'medium' | 'high'
  
  // Supporting data
  currentPerformance: number
  targetPerformance: number
  adjustmentMagnitude: number // How big the change is
  
  // Monitoring requirements
  monitoringPeriod: number // Minutes to monitor after adjustment
  successCriteria: string[]
  rollbackThreshold: number // Performance drop that triggers rollback
}

export interface ContentDifficultyMapping {
  contentId: string
  baseDifficulty: number
  adaptiveDifficulty: number
  userSpecificAdjustments: Record<string, number> // userId -> adjustment
  metadata: {
    conceptComplexity: number
    prerequisiteKnowledge: string[]
    cognitiveLoad: number
    estimatedTime: number
  }
}

export class DifficultyAdjustmentEngine {
  private difficultyProfiles: Map<string, DifficultyProfile> = new Map()
  private contentMappings: Map<string, ContentDifficultyMapping> = new Map()
  
  // Main method to analyze and recommend difficulty adjustments
  async analyzeDifficultyNeeds(
    userId: string, 
    recentPerformance: PerformancePoint[],
    currentContext: any
  ): Promise<DifficultyRecommendation> {
    const profile = await this.getUserDifficultyProfile(userId)
    const performanceAnalysis = this.analyzePerformancePattern(recentPerformance)
    const contextualFactors = this.analyzeContextualFactors(currentContext)
    
    // Detect specific issues requiring adjustment
    const flowStateAnalysis = this.analyzeFlowState(profile, performanceAnalysis)
    const plateauDetection = this.detectLearningPlateau(profile, recentPerformance)
    const fatigueAnalysis = this.analyzeFatigue(profile, currentContext)
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      profile,
      performanceAnalysis,
      flowStateAnalysis,
      plateauDetection,
      fatigueAnalysis,
      contextualFactors
    )
    
    return recommendation
  }
  
  // Get or create difficulty profile for user
  async getUserDifficultyProfile(userId: string): Promise<DifficultyProfile> {
    if (this.difficultyProfiles.has(userId)) {
      return this.difficultyProfiles.get(userId)!
    }
    
    // Create new profile with intelligent defaults
    const profile: DifficultyProfile = {
      userId,
      subject: 'general', // Will be updated based on user activity
      currentLevel: 5, // Middle difficulty to start
      optimalLevel: 5,
      confidence: 0.3, // Low confidence initially
      
      successRate: 0.7, // Assumed baseline
      averageAttempts: 1.5,
      timeToComplete: 300, // 5 minutes average
      helpRequests: 0.2,
      
      improvementRate: 0.05, // 5% improvement per session
      plateauDetection: false,
      lastAdjustment: new Date(),
      
      sessionQuality: 0.7,
      fatigueLevel: 0.3,
      motivationLevel: 0.8,
      
      adjustmentHistory: [],
      performanceHistory: []
    }
    
    this.difficultyProfiles.set(userId, profile)
    return profile
  }
  
  // Analyze recent performance patterns
  private analyzePerformancePattern(performance: PerformancePoint[]): any {
    if (performance.length === 0) {
      return {
        successRate: 0.7,
        averageAttempts: 1.5,
        averageTime: 300,
        trend: 'stable',
        consistency: 0.7
      }
    }
    
    const successRate = performance.filter(p => p.success).length / performance.length
    const averageAttempts = performance.reduce((sum, p) => sum + p.attempts, 0) / performance.length
    const averageTime = performance.reduce((sum, p) => sum + p.timeSpent, 0) / performance.length
    
    // Calculate trend (improvement over time)
    const recentPerformance = performance.slice(-5) // Last 5 items
    const earlierPerformance = performance.slice(0, 5) // First 5 items
    
    const recentSuccess = recentPerformance.filter(p => p.success).length / Math.max(recentPerformance.length, 1)
    const earlierSuccess = earlierPerformance.filter(p => p.success).length / Math.max(earlierPerformance.length, 1)
    
    let trend = 'stable'
    if (recentSuccess > earlierSuccess + 0.1) trend = 'improving'
    else if (recentSuccess < earlierSuccess - 0.1) trend = 'declining'
    
    // Calculate consistency (how stable performance is)
    const scores = performance.map(p => p.success ? 1 : 0)
    const variance = this.calculateVariance(scores)
    const consistency = Math.max(0, 1 - variance)
    
    return {
      successRate,
      averageAttempts,
      averageTime,
      trend,
      consistency,
      recentPerformance: recentSuccess,
      earlierPerformance: earlierSuccess
    }
  }
  
  // Analyze flow state indicators
  private analyzeFlowState(profile: DifficultyProfile, performance: any): any {
    // Flow state occurs when difficulty matches skill level
    const skillLevel = this.estimateSkillLevel(profile, performance)
    const difficultyGap = Math.abs(profile.currentLevel - skillLevel)
    
    // Flow indicators
    const timeConsistency = performance.consistency || 0.7
    const successConsistency = performance.successRate > 0.6 && performance.successRate < 0.9
    const engagementLevel = 1 - (profile.helpRequests / 2) // Fewer help requests = more engagement
    
    const flowScore = Math.max(0, 1 - (difficultyGap / 3)) * timeConsistency * (successConsistency ? 1 : 0.5) * engagementLevel
    
    return {
      inFlowState: flowScore > 0.7,
      flowScore,
      difficultyGap,
      skillLevel,
      recommendation: this.getFlowRecommendation(difficultyGap, skillLevel, profile.currentLevel)
    }
  }
  
  // Detect learning plateaus
  private detectLearningPlateau(profile: DifficultyProfile, recentPerformance: PerformancePoint[]): any {
    if (recentPerformance.length < 10) {
      return { plateauDetected: false, confidence: 0 }
    }
    
    // Check for stagnant performance over time
    const performanceWindow = recentPerformance.slice(-10)
    const timeSpan = performanceWindow[performanceWindow.length - 1].timestamp.getTime() - 
                    performanceWindow[0].timestamp.getTime()
    
    // Calculate performance stability (low variance = potential plateau)
    const successRates = performanceWindow.map(p => p.success ? 1 : 0)
    const variance = this.calculateVariance(successRates)
    const timeStability = timeSpan > 30 * 60 * 1000 // At least 30 minutes of data
    
    const plateauScore = timeStability ? (1 - variance) : 0
    const plateauDetected = plateauScore > 0.8 && profile.improvementRate < 0.02
    
    return {
      plateauDetected,
      plateauScore,
      confidence: plateauDetected ? Math.min(plateauScore, 0.9) : 0,
      recommendation: plateauDetected ? 'increase_difficulty' : 'maintain'
    }
  }
  
  // Analyze fatigue and motivation
  private analyzeFatigue(profile: DifficultyProfile, context: any): any {
    const sessionDuration = context.currentSession?.duration || 0
    const timeOfDay = context.environmentalFactors?.timeOfDay || 'afternoon'
    const recentErrors = context.recentErrors || 0
    
    // Fatigue increases with session length and errors
    let fatigueLevel = Math.min(1, (sessionDuration / 3600) * 0.5) // 50% fatigue after 1 hour
    fatigueLevel += Math.min(0.3, recentErrors * 0.1) // Up to 30% from errors
    
    // Adjust for time of day
    if (timeOfDay === 'evening') fatigueLevel += 0.1
    if (timeOfDay === 'morning') fatigueLevel -= 0.1
    
    const motivationLevel = Math.max(0.3, 1 - fatigueLevel)
    
    return {
      fatigueLevel: Math.max(0, Math.min(1, fatigueLevel)),
      motivationLevel,
      recommendation: fatigueLevel > 0.7 ? 'reduce_difficulty' : 'maintain',
      confidence: 0.6
    }
  }
  
  // Analyze contextual factors
  private analyzeContextualFactors(context: any): any {
    return {
      timeOfDay: context.environmentalFactors?.timeOfDay || 'afternoon',
      deviceType: context.environmentalFactors?.deviceType || 'desktop',
      networkQuality: context.environmentalFactors?.networkQuality || 'fast',
      estimatedDistractions: context.environmentalFactors?.estimatedDistractions || 0.3,
      sessionLength: context.currentSession?.duration || 0
    }
  }
  
  // Generate final difficulty recommendation
  private generateRecommendation(
    profile: DifficultyProfile,
    performance: any,
    flowState: any,
    plateau: any,
    fatigue: any,
    context: any
  ): DifficultyRecommendation {
    let recommendedLevel = profile.currentLevel
    let reasoning = 'Maintaining current difficulty'
    let confidence = 0.5
    let urgency: 'low' | 'medium' | 'high' = 'low'
    
    // Primary adjustment logic
    if (fatigue.fatigueLevel > 0.7) {
      // High fatigue - reduce difficulty
      recommendedLevel = Math.max(1, profile.currentLevel - 1)
      reasoning = 'Reducing difficulty due to high fatigue levels'
      confidence = 0.8
      urgency = 'high'
    } else if (plateau.plateauDetected) {
      // Learning plateau - increase difficulty
      recommendedLevel = Math.min(10, profile.currentLevel + 1)
      reasoning = 'Increasing difficulty to overcome learning plateau'
      confidence = plateau.confidence
      urgency = 'medium'
    } else if (!flowState.inFlowState && flowState.difficultyGap > 1) {
      // Not in flow state - adjust toward optimal
      if (flowState.skillLevel > profile.currentLevel) {
        recommendedLevel = Math.min(10, profile.currentLevel + 1)
        reasoning = 'Increasing difficulty to match skill level and restore flow state'
      } else {
        recommendedLevel = Math.max(1, profile.currentLevel - 1)
        reasoning = 'Reducing difficulty to match skill level and restore flow state'
      }
      confidence = Math.min(0.8, flowState.flowScore + 0.3)
      urgency = 'medium'
    } else if (performance.successRate > 0.9 && performance.trend === 'improving') {
      // Very high success rate - challenge the user
      recommendedLevel = Math.min(10, profile.currentLevel + 1)
      reasoning = 'High success rate indicates readiness for increased challenge'
      confidence = 0.7
      urgency = 'low'
    } else if (performance.successRate < 0.5 && performance.trend === 'declining') {
      // Low success rate - reduce difficulty
      recommendedLevel = Math.max(1, profile.currentLevel - 1)
      reasoning = 'Low success rate indicates need for difficulty reduction'
      confidence = 0.8
      urgency = 'medium'
    }
    
    // Calculate risk level
    const adjustmentMagnitude = Math.abs(recommendedLevel - profile.currentLevel)
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    
    if (adjustmentMagnitude >= 2) riskLevel = 'high'
    else if (adjustmentMagnitude === 1 && confidence < 0.6) riskLevel = 'medium'
    
    return {
      recommendedLevel,
      confidence,
      reasoning,
      urgency,
      expectedImprovement: this.calculateExpectedImprovement(profile, recommendedLevel),
      riskLevel,
      
      currentPerformance: performance.successRate,
      targetPerformance: this.calculateTargetPerformance(recommendedLevel),
      adjustmentMagnitude,
      
      monitoringPeriod: this.calculateMonitoringPeriod(urgency, adjustmentMagnitude),
      successCriteria: this.generateSuccessCriteria(recommendedLevel),
      rollbackThreshold: this.calculateRollbackThreshold(riskLevel)
    }
  }
  
  // Apply difficulty adjustment to content
  async applyDifficultyAdjustment(
    userId: string,
    contentId: string,
    adjustment: DifficultyRecommendation
  ): Promise<ContentItem> {
    const profile = await this.getUserDifficultyProfile(userId)
    
    // Record the adjustment
    const adjustmentRecord: DifficultyAdjustment = {
      timestamp: new Date(),
      fromLevel: profile.currentLevel,
      toLevel: adjustment.recommendedLevel,
      reason: adjustment.reasoning,
      trigger: 'performance',
      confidence: adjustment.confidence,
      successfullyApplied: true
    }
    
    profile.adjustmentHistory.push(adjustmentRecord)
    profile.currentLevel = adjustment.recommendedLevel
    profile.lastAdjustment = new Date()
    
    // Get or create content mapping
    const contentMapping = await this.getContentDifficultyMapping(contentId)
    contentMapping.userSpecificAdjustments[userId] = adjustment.recommendedLevel
    
    // Generate adapted content
    const adaptedContent = await this.generateAdaptedContent(contentId, adjustment.recommendedLevel)
    
    return adaptedContent
  }
  
  // Helper methods
  private estimateSkillLevel(profile: DifficultyProfile, performance: any): number {
    // Estimate current skill level based on performance
    const baseSkill = profile.currentLevel
    const performanceAdjustment = (performance.successRate - 0.7) * 3 // Adjust based on success rate
    const trendAdjustment = performance.trend === 'improving' ? 0.5 : performance.trend === 'declining' ? -0.5 : 0
    
    return Math.max(1, Math.min(10, baseSkill + performanceAdjustment + trendAdjustment))
  }
  
  private getFlowRecommendation(difficultyGap: number, skillLevel: number, currentLevel: number): string {
    if (difficultyGap < 0.5) return 'maintain'
    if (skillLevel > currentLevel) return 'increase_difficulty'
    if (skillLevel < currentLevel) return 'decrease_difficulty'
    return 'maintain'
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }
  
  private calculateExpectedImprovement(profile: DifficultyProfile, newLevel: number): number {
    const levelDifference = newLevel - profile.currentLevel
    if (levelDifference === 0) return 0.05 // Small maintenance improvement
    
    // Positive adjustment should improve engagement, negative should reduce frustration
    const baseImprovement = Math.abs(levelDifference) * 0.1
    const confidenceMultiplier = profile.confidence
    
    return Math.min(0.4, baseImprovement * confidenceMultiplier)
  }
  
  private calculateTargetPerformance(difficultyLevel: number): number {
    // Target success rate should be in the 70-80% range for optimal learning
    return Math.max(0.6, Math.min(0.85, 0.9 - (difficultyLevel / 15)))
  }
  
  private calculateMonitoringPeriod(urgency: string, magnitude: number): number {
    const basePeriod = 15 // 15 minutes
    const urgencyMultiplier = urgency === 'high' ? 0.5 : urgency === 'medium' ? 0.75 : 1
    const magnitudeMultiplier = 1 + (magnitude * 0.5)
    
    return Math.round(basePeriod * urgencyMultiplier * magnitudeMultiplier)
  }
  
  private generateSuccessCriteria(level: number): string[] {
    return [
      `Maintain success rate above ${Math.max(0.5, 0.8 - (level / 20))}`,
      'Complete content without excessive help requests',
      'Show engagement through consistent interaction patterns',
      'Avoid signs of frustration or disengagement'
    ]
  }
  
  private calculateRollbackThreshold(riskLevel: string): number {
    switch (riskLevel) {
      case 'high': return 0.2 // 20% performance drop triggers rollback
      case 'medium': return 0.3 // 30% drop
      case 'low': return 0.4 // 40% drop
      default: return 0.3
    }
  }
  
  private async getContentDifficultyMapping(contentId: string): Promise<ContentDifficultyMapping> {
    if (this.contentMappings.has(contentId)) {
      return this.contentMappings.get(contentId)!
    }
    
    // Create new mapping
    const mapping: ContentDifficultyMapping = {
      contentId,
      baseDifficulty: 5, // Default middle difficulty
      adaptiveDifficulty: 5,
      userSpecificAdjustments: {},
      metadata: {
        conceptComplexity: 5,
        prerequisiteKnowledge: [],
        cognitiveLoad: 5,
        estimatedTime: 300
      }
    }
    
    this.contentMappings.set(contentId, mapping)
    return mapping
  }
  
  private async generateAdaptedContent(contentId: string, targetDifficulty: number): Promise<ContentItem> {
    // This would integrate with the content adaptation system
    // For now, return a mock adapted content item
    return {
      id: `${contentId}_adapted_${Date.now()}`,
      title: `Adapted Content (Level ${targetDifficulty})`,
      description: `Content automatically adjusted to difficulty level ${targetDifficulty}`,
      content_type: 'text',
      subject: 'general',
      difficulty: targetDifficulty,
      estimated_time: 15,
      created_at: new Date().toISOString(),
      metadata: {
        adaptedDifficulty: targetDifficulty,
        originalContentId: contentId,
        adaptationTimestamp: new Date().toISOString()
      }
    }
  }
}

// Export singleton instance
export const difficultyEngine = new DifficultyAdjustmentEngine()

// Utility functions for integration
export async function adjustContentDifficulty(
  userId: string,
  contentId: string,
  recentPerformance: PerformancePoint[],
  currentContext: any
): Promise<{ recommendation: DifficultyRecommendation; adaptedContent?: ContentItem }> {
  const recommendation = await difficultyEngine.analyzeDifficultyNeeds(
    userId,
    recentPerformance,
    currentContext
  )
  
  let adaptedContent: ContentItem | undefined
  if (recommendation.urgency !== 'low' && Math.abs(recommendation.adjustmentMagnitude) > 0) {
    adaptedContent = await difficultyEngine.applyDifficultyAdjustment(
      userId,
      contentId,
      recommendation
    )
  }
  
  return { recommendation, adaptedContent }
}

export function generateMockPerformanceData(userId: string, count: number = 10): PerformancePoint[] {
  const mockData: PerformancePoint[] = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000)) // 5 minutes apart
    
    mockData.push({
      timestamp,
      contentId: `content_${i % 5}`,
      difficultyLevel: Math.floor(Math.random() * 7) + 2, // 2-8 difficulty
      success: Math.random() > 0.3, // 70% success rate
      attempts: Math.floor(Math.random() * 3) + 1, // 1-3 attempts
      timeSpent: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      score: Math.random(),
      contextFactors: {
        timeOfDay: timestamp.getHours() < 12 ? 'morning' : timestamp.getHours() < 17 ? 'afternoon' : 'evening',
        sessionDuration: i * 5, // Minutes into session
        deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
        distractionLevel: Math.random() * 0.5 // 0-50% distraction
      }
    })
  }
  
  return mockData.reverse() // Chronological order
}