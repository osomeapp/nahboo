import type { UserProfile, ContentItem } from '@/types'
import type { PerformancePoint } from './difficulty-engine'

// VARK Learning Style Model + Extensions
export type LearningStyleType = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'multimodal'

export interface LearningStyleProfile {
  userId: string
  detectionConfidence: number // 0-1 scale of how confident we are in the detection
  
  // VARK Scores (0-1 scale for each)
  visualScore: number       // Learns through images, diagrams, charts, videos
  auditoryScore: number     // Learns through listening, discussions, explanations
  kinestheticScore: number  // Learns through hands-on activities, movement, practice
  readingScore: number      // Learns through text, written instructions, note-taking
  
  // Primary and secondary styles
  primaryStyle: LearningStyleType
  secondaryStyle?: LearningStyleType
  
  // Learning preferences detected from behavior
  preferences: LearningPreferences
  
  // Detection metadata
  dataPoints: number
  lastUpdated: Date
  detectionMethods: DetectionMethod[]
  
  // Adaptation history
  adaptationHistory: StyleAdaptation[]
  effectiveness: StyleEffectiveness
}

export interface LearningPreferences {
  // Content format preferences
  prefersVisualContent: number      // 0-1 preference for images, videos, diagrams
  prefersAudioContent: number       // 0-1 preference for audio explanations, narration
  prefersInteractiveContent: number // 0-1 preference for hands-on activities
  prefersTextContent: number        // 0-1 preference for reading materials
  
  // Learning environment preferences
  prefersQuietEnvironment: number   // 0-1 preference for minimal audio distractions
  prefersStructuredContent: number  // 0-1 preference for organized, sequential content
  prefersExploratoryLearning: number // 0-1 preference for self-discovery
  
  // Interaction preferences
  prefersRepetition: number         // 0-1 how much repetition helps learning
  prefersVariety: number            // 0-1 preference for diverse content types
  prefersImmediateFeedback: number // 0-1 preference for quick feedback loops
  
  // Cognitive preferences
  prefersDetails: number            // 0-1 preference for detailed vs. overview information
  prefersExamples: number           // 0-1 how much concrete examples help
  prefersAbstractConcepts: number   // 0-1 comfort with theoretical/abstract ideas
  
  // Social learning preferences
  prefersSelfPaced: number          // 0-1 preference for individual vs. guided learning
  prefersCollaborative: number      // 0-1 preference for group learning (future feature)
}

export interface DetectionMethod {
  method: 'behavioral_analysis' | 'content_interaction' | 'performance_patterns' | 'user_assessment' | 'time_analysis'
  confidence: number
  dataPoints: number
  timestamp: Date
  details: Record<string, any>
}

export interface StyleAdaptation {
  timestamp: Date
  fromStyle: LearningStyleType
  toStyle: LearningStyleType
  trigger: string
  confidence: number
  effectiveness?: number // Measured after application
}

export interface StyleEffectiveness {
  visualEffectiveness: number      // How well visual adaptations work for this user
  auditoryEffectiveness: number    // How well auditory adaptations work
  kinestheticEffectiveness: number // How well interactive adaptations work
  readingEffectiveness: number     // How well text-based adaptations work
  
  // Overall metrics
  adaptationSuccessRate: number    // % of adaptations that improved performance
  userSatisfaction: number         // User feedback on style-based adaptations
  learningImprovment: number       // Measured improvement in learning outcomes
}

export interface ContentStyleAnalysis {
  contentId: string
  originalStyle: LearningStyleType[]
  detectedUserStyle: LearningStyleType
  styleMatch: number // 0-1 how well content matches user style
  adaptationRecommendations: StyleAdaptationRecommendation[]
}

export interface StyleAdaptationRecommendation {
  adaptationType: 'add_visuals' | 'add_audio' | 'add_interactivity' | 'add_text' | 'restructure' | 'add_examples'
  confidence: number
  expectedImprovement: number
  implementation: StyleImplementation
}

export interface StyleImplementation {
  changes: ContentStyleChange[]
  priority: 'high' | 'medium' | 'low'
  effort: 'minimal' | 'moderate' | 'significant'
  aiGenerated: boolean // Whether AI can generate the adaptation automatically
}

export interface ContentStyleChange {
  type: 'visual' | 'auditory' | 'kinesthetic' | 'textual'
  action: 'add' | 'enhance' | 'replace' | 'restructure'
  description: string
  aiPrompt?: string // Prompt for AI to generate the change
}

export class LearningStyleDetectionEngine {
  private styleProfiles: Map<string, LearningStyleProfile> = new Map()
  private detectionThresholds = {
    minDataPoints: 10,
    minConfidence: 0.6,
    adaptationConfidence: 0.7
  }
  
  // Main detection method - analyzes user behavior to determine learning style
  async detectLearningStyle(
    userId: string,
    userProfile: UserProfile,
    interactionData: any[],
    performanceData: PerformancePoint[]
  ): Promise<LearningStyleProfile> {
    
    // Get existing profile or create new one
    let profile = this.styleProfiles.get(userId) || this.createInitialProfile(userId, userProfile)
    
    // Run multiple detection methods
    const behavioralAnalysis = this.analyzeBehavioralPatterns(interactionData)
    const contentInteractionAnalysis = this.analyzeContentInteractions(interactionData)
    const performanceAnalysis = this.analyzePerformancePatterns(performanceData)
    const timeAnalysis = this.analyzeTimePatterns(interactionData)
    
    // Combine detection results
    const combinedAnalysis = this.combineAnalysisResults([
      { method: 'behavioral_analysis', ...behavioralAnalysis },
      { method: 'content_interaction', ...contentInteractionAnalysis },
      { method: 'performance_patterns', ...performanceAnalysis },
      { method: 'time_analysis', ...timeAnalysis }
    ])
    
    // Update profile with new analysis
    profile = this.updateStyleProfile(profile, combinedAnalysis, interactionData.length)
    
    // Store updated profile
    this.styleProfiles.set(userId, profile)
    
    return profile
  }
  
  // Analyze behavioral patterns to infer learning style
  private analyzeBehavioralPatterns(interactionData: any[]): any {
    const analysis = {
      visualIndicators: 0,
      auditoryIndicators: 0,
      kinestheticIndicators: 0,
      readingIndicators: 0,
      confidence: 0
    }
    
    if (interactionData.length === 0) return analysis
    
    interactionData.forEach(interaction => {
      // Visual learning indicators
      if (interaction.type === 'video_play' || interaction.type === 'image_view') {
        analysis.visualIndicators += 1
      }
      if (interaction.scrollBehavior?.averageScrollSpeed < 0.5) { // Slow scrolling suggests visual processing
        analysis.visualIndicators += 0.5
      }
      if (interaction.clickPatterns?.some((click: any) => click.elementType === 'img' || click.elementType === 'video')) {
        analysis.visualIndicators += 0.3
      }
      
      // Auditory learning indicators
      if (interaction.type === 'audio_play' || interaction.type === 'video_audio_focus') {
        analysis.auditoryIndicators += 1
      }
      if (interaction.pauseEvents?.some((pause: any) => pause.duration > 10 && pause.duration < 60)) {
        analysis.auditoryIndicators += 0.2 // Thoughtful pauses suggest audio processing
      }
      
      // Kinesthetic learning indicators
      if (interaction.type === 'quiz_attempt' || interaction.type === 'interactive_element') {
        analysis.kinestheticIndicators += 1
      }
      if (interaction.clickPatterns?.length > 10) { // High interaction suggests kinesthetic preference
        analysis.kinestheticIndicators += 0.5
      }
      if (interaction.scrollBehavior?.totalScrolls > 20) { // Active scrolling
        analysis.kinestheticIndicators += 0.3
      }
      
      // Reading/Writing learning indicators
      if (interaction.type === 'text_selection' || interaction.type === 'note_taking') {
        analysis.readingIndicators += 1
      }
      if (interaction.timeSpent > 300 && interaction.scrollBehavior?.scrollCompletionRate > 0.8) {
        analysis.readingIndicators += 0.5 // Thorough text reading
      }
      if (interaction.pauseEvents?.some((pause: any) => pause.duration > 30)) {
        analysis.readingIndicators += 0.2 // Long pauses suggest reading/reflection
      }
    })
    
    // Normalize scores
    const totalIndicators = analysis.visualIndicators + analysis.auditoryIndicators + 
                           analysis.kinestheticIndicators + analysis.readingIndicators
    
    if (totalIndicators > 0) {
      analysis.visualIndicators /= totalIndicators
      analysis.auditoryIndicators /= totalIndicators
      analysis.kinestheticIndicators /= totalIndicators
      analysis.readingIndicators /= totalIndicators
      analysis.confidence = Math.min(0.8, totalIndicators / 10) // Confidence based on data richness
    }
    
    return analysis
  }
  
  // Analyze content interaction patterns
  private analyzeContentInteractions(interactionData: any[]): any {
    const analysis = {
      visualPreference: 0,
      auditoryPreference: 0,
      kinestheticPreference: 0,
      readingPreference: 0,
      confidence: 0
    }
    
    const contentTypePerformance = {
      video: { count: 0, successRate: 0, engagement: 0 },
      audio: { count: 0, successRate: 0, engagement: 0 },
      interactive: { count: 0, successRate: 0, engagement: 0 },
      text: { count: 0, successRate: 0, engagement: 0 }
    }
    
    // Track performance by content type
    interactionData.forEach(interaction => {
      const contentType = this.mapToContentType(interaction.content_type)
      if (contentTypePerformance[contentType]) {
        contentTypePerformance[contentType].count += 1
        contentTypePerformance[contentType].successRate += interaction.success ? 1 : 0
        contentTypePerformance[contentType].engagement += interaction.engagementLevel || 0.5
      }
    })
    
    // Calculate preferences based on success rates and engagement
    Object.entries(contentTypePerformance).forEach(([type, data]) => {
      if (data.count > 0) {
        const successRate = data.successRate / data.count
        const avgEngagement = data.engagement / data.count
        const preference = (successRate + avgEngagement) / 2
        
        switch (type) {
          case 'video':
            analysis.visualPreference = preference
            break
          case 'audio':
            analysis.auditoryPreference = preference
            break
          case 'interactive':
            analysis.kinestheticPreference = preference
            break
          case 'text':
            analysis.readingPreference = preference
            break
        }
      }
    })
    
    // Calculate confidence based on data availability
    const totalInteractions = Object.values(contentTypePerformance).reduce((sum, data) => sum + data.count, 0)
    analysis.confidence = Math.min(0.9, totalInteractions / 20)
    
    return analysis
  }
  
  // Analyze performance patterns across different content types
  private analyzePerformancePatterns(performanceData: PerformancePoint[]): any {
    const analysis = {
      visualPerformance: 0,
      auditoryPerformance: 0,
      kinestheticPerformance: 0,
      readingPerformance: 0,
      confidence: 0
    }
    
    if (performanceData.length === 0) return analysis
    
    const performanceByStyle = {
      visual: { total: 0, count: 0 },
      auditory: { total: 0, count: 0 },
      kinesthetic: { total: 0, count: 0 },
      reading: { total: 0, count: 0 }
    }
    
    performanceData.forEach(point => {
      // Infer content style from context factors and performance
      const inferredStyle = this.inferContentStyle(point)
      const performanceScore = point.success ? 1 : 0
      
      if (performanceByStyle[inferredStyle]) {
        performanceByStyle[inferredStyle].total += performanceScore
        performanceByStyle[inferredStyle].count += 1
      }
    })
    
    // Calculate performance scores
    Object.entries(performanceByStyle).forEach(([style, data]) => {
      if (data.count > 0) {
        const avgPerformance = data.total / data.count
        switch (style) {
          case 'visual':
            analysis.visualPerformance = avgPerformance
            break
          case 'auditory':
            analysis.auditoryPerformance = avgPerformance
            break
          case 'kinesthetic':
            analysis.kinestheticPerformance = avgPerformance
            break
          case 'reading':
            analysis.readingPerformance = avgPerformance
            break
        }
      }
    })
    
    analysis.confidence = Math.min(0.8, performanceData.length / 15)
    return analysis
  }
  
  // Analyze time-based learning patterns
  private analyzeTimePatterns(interactionData: any[]): any {
    const analysis = {
      timePreferences: {},
      consistencyScore: 0,
      confidence: 0
    }
    
    if (interactionData.length === 0) return analysis
    
    // Group interactions by time of day
    const timePatterns = {
      morning: { performance: 0, count: 0 },
      afternoon: { performance: 0, count: 0 },
      evening: { performance: 0, count: 0 }
    }
    
    interactionData.forEach(interaction => {
      const hour = new Date(interaction.timestamp || Date.now()).getHours()
      let timeOfDay = 'afternoon'
      
      if (hour < 12) timeOfDay = 'morning'
      else if (hour >= 18) timeOfDay = 'evening'
      
      const performance = interaction.engagementLevel || 0.5
      timePatterns[timeOfDay].performance += performance
      timePatterns[timeOfDay].count += 1
    })
    
    // Calculate time preferences
    Object.entries(timePatterns).forEach(([time, data]) => {
      if (data.count > 0) {
        analysis.timePreferences[time] = data.performance / data.count
      }
    })
    
    analysis.confidence = Math.min(0.6, interactionData.length / 25)
    return analysis
  }
  
  // Combine multiple analysis results
  private combineAnalysisResults(analyses: any[]): any {
    const combined = {
      visualScore: 0,
      auditoryScore: 0,
      kinestheticScore: 0,
      readingScore: 0,
      confidence: 0,
      detectionMethods: []
    }
    
    let totalWeight = 0
    
    analyses.forEach(analysis => {
      const weight = analysis.confidence || 0.5
      totalWeight += weight
      
      // Weight the scores by confidence
      combined.visualScore += (analysis.visualIndicators || analysis.visualPreference || analysis.visualPerformance || 0) * weight
      combined.auditoryScore += (analysis.auditoryIndicators || analysis.auditoryPreference || analysis.auditoryPerformance || 0) * weight
      combined.kinestheticScore += (analysis.kinestheticIndicators || analysis.kinestheticPreference || analysis.kinestheticPerformance || 0) * weight
      combined.readingScore += (analysis.readingIndicators || analysis.readingPreference || analysis.readingPerformance || 0) * weight
      
      // Track detection methods
      combined.detectionMethods.push({
        method: analysis.method,
        confidence: analysis.confidence,
        dataPoints: analysis.dataPoints || 0,
        timestamp: new Date(),
        details: analysis
      })
    })
    
    // Normalize scores
    if (totalWeight > 0) {
      combined.visualScore /= totalWeight
      combined.auditoryScore /= totalWeight
      combined.kinestheticScore /= totalWeight
      combined.readingScore /= totalWeight
      combined.confidence = totalWeight / analyses.length
    }
    
    return combined
  }
  
  // Update existing style profile with new analysis
  private updateStyleProfile(
    profile: LearningStyleProfile, 
    analysis: any, 
    newDataPoints: number
  ): LearningStyleProfile {
    
    // Weighted update of scores (existing knowledge + new analysis)
    const existingWeight = Math.min(0.7, profile.dataPoints / 50) // Existing data weight
    const newWeight = 1 - existingWeight
    
    profile.visualScore = (profile.visualScore * existingWeight) + (analysis.visualScore * newWeight)
    profile.auditoryScore = (profile.auditoryScore * existingWeight) + (analysis.auditoryScore * newWeight)
    profile.kinestheticScore = (profile.kinestheticScore * existingWeight) + (analysis.kinestheticScore * newWeight)
    profile.readingScore = (profile.readingScore * existingWeight) + (analysis.readingScore * newWeight)
    
    // Update confidence
    profile.detectionConfidence = Math.min(0.95, (profile.detectionConfidence + analysis.confidence) / 2)
    
    // Determine primary and secondary styles
    const scores = {
      visual: profile.visualScore,
      auditory: profile.auditoryScore,
      kinesthetic: profile.kinestheticScore,
      reading: profile.readingScore
    }
    
    const sortedStyles = Object.entries(scores).sort((a, b) => b[1] - a[1])
    profile.primaryStyle = sortedStyles[0][0] as LearningStyleType
    
    // Set secondary style if it's significantly strong
    if (sortedStyles[1][1] > 0.3 && (sortedStyles[0][1] - sortedStyles[1][1]) < 0.3) {
      profile.secondaryStyle = sortedStyles[1][0] as LearningStyleType
    } else if (sortedStyles[0][1] > 0.6) {
      // Check for multimodal learner
      const strongStyles = sortedStyles.filter(([_, score]) => score > 0.4)
      if (strongStyles.length >= 3) {
        profile.primaryStyle = 'multimodal'
      }
    }
    
    // Update metadata
    profile.dataPoints += newDataPoints
    profile.lastUpdated = new Date()
    profile.detectionMethods = analysis.detectionMethods
    
    // Update preferences based on scores
    profile.preferences = this.updateLearningPreferences(profile.preferences, scores)
    
    return profile
  }
  
  // Create initial learning style profile
  private createInitialProfile(userId: string, userProfile: UserProfile): LearningStyleProfile {
    // Initialize with slight biases based on age group and subject
    let initialBias = { visual: 0.25, auditory: 0.25, kinesthetic: 0.25, reading: 0.25 }
    
    // Age-based initial biases
    if (userProfile.age_group === 'child') {
      initialBias = { visual: 0.4, auditory: 0.3, kinesthetic: 0.4, reading: 0.1 }
    } else if (userProfile.age_group === 'teen') {
      initialBias = { visual: 0.35, auditory: 0.25, kinesthetic: 0.35, reading: 0.2 }
    } else if (userProfile.age_group === 'adult') {
      initialBias = { visual: 0.3, auditory: 0.25, kinesthetic: 0.25, reading: 0.35 }
    }
    
    // Subject-based adjustments
    if (userProfile.subject === 'Mathematics') {
      initialBias.visual += 0.1 // Math often benefits from visual representations
      initialBias.kinesthetic += 0.1 // Practice problems
    } else if (userProfile.subject === 'Science') {
      initialBias.visual += 0.15 // Diagrams and experiments
      initialBias.kinesthetic += 0.1 // Lab work
    } else if (userProfile.subject === 'Language Arts') {
      initialBias.reading += 0.2 // Text-heavy subject
      initialBias.auditory += 0.1 // Speaking and listening
    }
    
    return {
      userId,
      detectionConfidence: 0.3, // Low initial confidence
      visualScore: initialBias.visual,
      auditoryScore: initialBias.auditory,
      kinestheticScore: initialBias.kinesthetic,
      readingScore: initialBias.reading,
      primaryStyle: 'multimodal', // Start as multimodal until we have data
      preferences: this.createInitialPreferences(userProfile),
      dataPoints: 0,
      lastUpdated: new Date(),
      detectionMethods: [],
      adaptationHistory: [],
      effectiveness: {
        visualEffectiveness: 0.5,
        auditoryEffectiveness: 0.5,
        kinestheticEffectiveness: 0.5,
        readingEffectiveness: 0.5,
        adaptationSuccessRate: 0.5,
        userSatisfaction: 0.5,
        learningImprovment: 0
      }
    }
  }
  
  // Helper methods
  private mapToContentType(contentType: string): 'video' | 'audio' | 'interactive' | 'text' {
    if (contentType === 'video') return 'video'
    if (contentType === 'quiz' || contentType === 'interactive') return 'interactive'
    if (contentType === 'audio') return 'audio'
    return 'text'
  }
  
  private inferContentStyle(point: PerformancePoint): 'visual' | 'auditory' | 'kinesthetic' | 'reading' {
    // Simple heuristic based on context factors
    if (point.contextFactors.deviceType === 'mobile') return 'kinesthetic'
    if (point.timeSpent > 300) return 'reading' // Long time suggests reading
    if (point.attempts > 2) return 'kinesthetic' // Multiple attempts suggest hands-on
    return 'visual' // Default
  }
  
  private createInitialPreferences(userProfile: UserProfile): LearningPreferences {
    const ageGroup = userProfile.age_group || 'adult'
    
    // Age-appropriate defaults
    const childDefaults = {
      prefersVisualContent: 0.8, prefersAudioContent: 0.6, prefersInteractiveContent: 0.9, prefersTextContent: 0.3,
      prefersQuietEnvironment: 0.4, prefersStructuredContent: 0.7, prefersExploratoryLearning: 0.8,
      prefersRepetition: 0.7, prefersVariety: 0.8, prefersImmediateFeedback: 0.9,
      prefersDetails: 0.4, prefersExamples: 0.9, prefersAbstractConcepts: 0.2,
      prefersSelfPaced: 0.3, prefersCollaborative: 0.7
    }
    
    const adultDefaults = {
      prefersVisualContent: 0.6, prefersAudioContent: 0.5, prefersInteractiveContent: 0.6, prefersTextContent: 0.7,
      prefersQuietEnvironment: 0.7, prefersStructuredContent: 0.8, prefersExploratoryLearning: 0.6,
      prefersRepetition: 0.5, prefersVariety: 0.6, prefersImmediateFeedback: 0.7,
      prefersDetails: 0.7, prefersExamples: 0.8, prefersAbstractConcepts: 0.6,
      prefersSelfPaced: 0.8, prefersCollaborative: 0.4
    }
    
    return ageGroup === 'child' ? childDefaults : adultDefaults
  }
  
  private updateLearningPreferences(
    currentPreferences: LearningPreferences, 
    styleScores: Record<string, number>
  ): LearningPreferences {
    const updated = { ...currentPreferences }
    
    // Update content preferences based on detected styles
    updated.prefersVisualContent = Math.max(updated.prefersVisualContent, styleScores.visual)
    updated.prefersAudioContent = Math.max(updated.prefersAudioContent, styleScores.auditory)
    updated.prefersInteractiveContent = Math.max(updated.prefersInteractiveContent, styleScores.kinesthetic)
    updated.prefersTextContent = Math.max(updated.prefersTextContent, styleScores.reading)
    
    return updated
  }
  
  // Content adaptation methods
  async analyzeContentStyleMatch(
    contentId: string, 
    content: ContentItem, 
    userStyleProfile: LearningStyleProfile
  ): Promise<ContentStyleAnalysis> {
    
    // Determine content's inherent learning styles
    const contentStyles = this.detectContentStyles(content)
    
    // Calculate style match score
    const styleMatch = this.calculateStyleMatch(contentStyles, userStyleProfile)
    
    // Generate adaptation recommendations
    const adaptationRecommendations = await this.generateStyleAdaptations(
      content, 
      userStyleProfile, 
      styleMatch
    )
    
    return {
      contentId,
      originalStyle: contentStyles,
      detectedUserStyle: userStyleProfile.primaryStyle,
      styleMatch,
      adaptationRecommendations
    }
  }
  
  private detectContentStyles(content: ContentItem): LearningStyleType[] {
    const styles: LearningStyleType[] = []
    
    // Analyze content type
    if (content.content_type === 'video') styles.push('visual', 'auditory')
    if (content.content_type === 'quiz' || content.content_type === 'interactive') styles.push('kinesthetic')
    if (content.content_type === 'text') styles.push('reading')
    
    // Analyze metadata for additional style indicators
    if (content.metadata?.hasImages || content.metadata?.hasDiagrams) styles.push('visual')
    if (content.metadata?.hasAudio || content.metadata?.audioNarration) styles.push('auditory')
    if (content.metadata?.interactiveElements) styles.push('kinesthetic')
    
    return Array.from(new Set(styles)) // Remove duplicates
  }
  
  private calculateStyleMatch(
    contentStyles: LearningStyleType[], 
    userProfile: LearningStyleProfile
  ): number {
    if (contentStyles.length === 0) return 0.5 // Neutral match
    
    let totalMatch = 0
    const userScores = {
      visual: userProfile.visualScore,
      auditory: userProfile.auditoryScore,
      kinesthetic: userProfile.kinestheticScore,
      reading: userProfile.readingScore
    }
    
    contentStyles.forEach(style => {
      if (style !== 'multimodal') {
        totalMatch += userScores[style] || 0
      }
    })
    
    return Math.min(1, totalMatch / contentStyles.length)
  }
  
  private async generateStyleAdaptations(
    content: ContentItem,
    userProfile: LearningStyleProfile,
    currentMatch: number
  ): Promise<StyleAdaptationRecommendation[]> {
    
    const recommendations: StyleAdaptationRecommendation[] = []
    
    // Only recommend adaptations if match is poor or user strongly prefers certain styles
    if (currentMatch < 0.6 || Math.max(userProfile.visualScore, userProfile.auditoryScore, userProfile.kinestheticScore, userProfile.readingScore) > 0.7) {
      
      // Visual adaptations
      if (userProfile.visualScore > 0.6 && !content.metadata?.hasImages) {
        recommendations.push({
          adaptationType: 'add_visuals',
          confidence: userProfile.visualScore * userProfile.detectionConfidence,
          expectedImprovement: 0.2,
          implementation: {
            changes: [{
              type: 'visual',
              action: 'add',
              description: 'Add relevant images, diagrams, or visual aids',
              aiPrompt: `Generate visual descriptions and diagram suggestions for: ${content.title}`
            }],
            priority: 'high',
            effort: 'moderate',
            aiGenerated: true
          }
        })
      }
      
      // Auditory adaptations
      if (userProfile.auditoryScore > 0.6 && !content.metadata?.hasAudio) {
        recommendations.push({
          adaptationType: 'add_audio',
          confidence: userProfile.auditoryScore * userProfile.detectionConfidence,
          expectedImprovement: 0.15,
          implementation: {
            changes: [{
              type: 'auditory',
              action: 'add',
              description: 'Add audio narration or explanation',
              aiPrompt: `Create audio script for content: ${content.title}`
            }],
            priority: 'medium',
            effort: 'moderate',
            aiGenerated: true
          }
        })
      }
      
      // Kinesthetic adaptations
      if (userProfile.kinestheticScore > 0.6 && content.content_type !== 'interactive') {
        recommendations.push({
          adaptationType: 'add_interactivity',
          confidence: userProfile.kinestheticScore * userProfile.detectionConfidence,
          expectedImprovement: 0.25,
          implementation: {
            changes: [{
              type: 'kinesthetic',
              action: 'add',
              description: 'Add interactive exercises or hands-on activities',
              aiPrompt: `Design interactive exercises for: ${content.title}`
            }],
            priority: 'high',
            effort: 'significant',
            aiGenerated: true
          }
        })
      }
      
      // Reading/Writing adaptations
      if (userProfile.readingScore > 0.6 && content.content_type === 'video') {
        recommendations.push({
          adaptationType: 'add_text',
          confidence: userProfile.readingScore * userProfile.detectionConfidence,
          expectedImprovement: 0.1,
          implementation: {
            changes: [{
              type: 'textual',
              action: 'add',
              description: 'Add detailed text summary or transcript',
              aiPrompt: `Create comprehensive text summary for: ${content.title}`
            }],
            priority: 'medium',
            effort: 'minimal',
            aiGenerated: true
          }
        })
      }
    }
    
    return recommendations.sort((a, b) => b.expectedImprovement - a.expectedImprovement)
  }
  
  // Get learning style profile for user
  async getLearningStyleProfile(userId: string): Promise<LearningStyleProfile | null> {
    return this.styleProfiles.get(userId) || null
  }
  
  // Update effectiveness based on user feedback
  updateAdaptationEffectiveness(
    userId: string, 
    adaptationType: string, 
    effectiveness: number,
    userFeedback?: any
  ): void {
    const profile = this.styleProfiles.get(userId)
    if (!profile) return
    
    // Update style-specific effectiveness
    switch (adaptationType) {
      case 'add_visuals':
        profile.effectiveness.visualEffectiveness = (profile.effectiveness.visualEffectiveness + effectiveness) / 2
        break
      case 'add_audio':
        profile.effectiveness.auditoryEffectiveness = (profile.effectiveness.auditoryEffectiveness + effectiveness) / 2
        break
      case 'add_interactivity':
        profile.effectiveness.kinestheticEffectiveness = (profile.effectiveness.kinestheticEffectiveness + effectiveness) / 2
        break
      case 'add_text':
        profile.effectiveness.readingEffectiveness = (profile.effectiveness.readingEffectiveness + effectiveness) / 2
        break
    }
    
    // Update overall metrics
    profile.effectiveness.adaptationSuccessRate = effectiveness > 0.6 ? 
      (profile.effectiveness.adaptationSuccessRate + 1) / 2 :
      profile.effectiveness.adaptationSuccessRate * 0.9
    
    if (userFeedback?.satisfaction) {
      profile.effectiveness.userSatisfaction = (profile.effectiveness.userSatisfaction + userFeedback.satisfaction) / 2
    }
    
    this.styleProfiles.set(userId, profile)
  }
}

// Export singleton instance
export const learningStyleEngine = new LearningStyleDetectionEngine()

// Utility functions
export function getStyleDescription(style: LearningStyleType): string {
  const descriptions = {
    visual: 'Learns best through images, diagrams, charts, and visual demonstrations',
    auditory: 'Learns best through listening, discussions, explanations, and audio content',
    kinesthetic: 'Learns best through hands-on activities, practice, and physical interaction',
    reading: 'Learns best through reading, writing, and text-based materials',
    multimodal: 'Learns effectively through multiple learning styles and varied content formats'
  }
  return descriptions[style]
}

export function getStyleIcon(style: LearningStyleType): string {
  const icons = {
    visual: '👁️',
    auditory: '👂',
    kinesthetic: '✋',
    reading: '📖',
    multimodal: '🧠'
  }
  return icons[style]
}

export function getStyleColor(style: LearningStyleType): string {
  const colors = {
    visual: '#3b82f6', // Blue
    auditory: '#10b981', // Green
    kinesthetic: '#f59e0b', // Orange
    reading: '#8b5cf6', // Purple
    multimodal: '#6b7280' // Gray
  }
  return colors[style]
}