import { useState, useCallback } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { LearningStyleType } from '@/lib/learning-style-engine'

interface StyleAwareGenerationState {
  isGenerating: boolean
  generatedContent: ContentItem[]
  adaptationSummary: any
  error: string | null
  progress: number
}

interface StyleAwareGenerationOptions {
  targetStyles?: LearningStyleType[]
  generateAll?: boolean
  contentLength?: 'short' | 'medium' | 'long'
  difficulty?: number
  baseContent?: ContentItem
}

interface UseStyleAwareGenerationReturn extends StyleAwareGenerationState {
  generateContent: (
    topic: string,
    userProfile: UserProfile,
    options?: StyleAwareGenerationOptions
  ) => Promise<void>
  
  generateAdaptedContent: (
    content: ContentItem,
    userProfile: UserProfile,
    targetStyles?: LearningStyleType[]
  ) => Promise<void>
  
  clearGenerated: () => void
  resetState: () => void
  
  // Utility functions
  getContentForStyle: (style: LearningStyleType) => ContentItem | null
  getBestContentForUser: (userProfile: UserProfile) => ContentItem | null
  getAvailableStyles: () => LearningStyleType[]
}

export function useStyleAwareGeneration(): UseStyleAwareGenerationReturn {
  const [state, setState] = useState<StyleAwareGenerationState>({
    isGenerating: false,
    generatedContent: [],
    adaptationSummary: null,
    error: null,
    progress: 0
  })

  // Generate new content optimized for learning styles
  const generateContent = useCallback(async (
    topic: string,
    userProfile: UserProfile,
    options: StyleAwareGenerationOptions = {}
  ) => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null, 
      progress: 0,
      generatedContent: [],
      adaptationSummary: null
    }))

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 500)

      const response = await fetch('/api/learning-style/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id || 'temp',
          userProfile,
          topic,
          targetStyles: options.targetStyles,
          generateAll: options.generateAll,
          contentLength: options.contentLength || 'medium',
          difficulty: options.difficulty,
          baseContent: options.baseContent
        })
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Failed to generate style-aware content')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedContent: data.generatedContent.map((item: any) => item.content),
        adaptationSummary: data.adaptationSummary,
        progress: 100,
        error: null
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        progress: 0
      }))
    }
  }, [])

  // Generate adapted versions of existing content
  const generateAdaptedContent = useCallback(async (
    content: ContentItem,
    userProfile: UserProfile,
    targetStyles?: LearningStyleType[]
  ) => {
    return generateContent(content.title, userProfile, {
      baseContent: content,
      targetStyles,
      contentLength: estimateContentLength(content.description),
      difficulty: content.difficulty
    })
  }, [generateContent])

  // Clear generated content
  const clearGenerated = useCallback(() => {
    setState(prev => ({
      ...prev,
      generatedContent: [],
      adaptationSummary: null,
      error: null,
      progress: 0
    }))
  }, [])

  // Reset entire state
  const resetState = useCallback(() => {
    setState({
      isGenerating: false,
      generatedContent: [],
      adaptationSummary: null,
      error: null,
      progress: 0
    })
  }, [])

  // Get content for specific learning style
  const getContentForStyle = useCallback((style: LearningStyleType): ContentItem | null => {
    return state.generatedContent.find(
      content => content.metadata?.learningStyle === style
    ) || null
  }, [state.generatedContent])

  // Get best content match for user's learning style
  const getBestContentForUser = useCallback((userProfile: UserProfile): ContentItem | null => {
    if (state.generatedContent.length === 0) return null
    
    // If we have adaptation summary, use the optimal sequence
    if (state.adaptationSummary?.optimalSequence?.length > 0) {
      const optimalStyle = state.adaptationSummary.optimalSequence[0]
      const optimalContent = getContentForStyle(optimalStyle)
      if (optimalContent) return optimalContent
    }

    // Fallback to first available content
    return state.generatedContent[0] || null
  }, [state.generatedContent, state.adaptationSummary, getContentForStyle])

  // Get all available learning styles in generated content
  const getAvailableStyles = useCallback((): LearningStyleType[] => {
    const styles = state.generatedContent
      .map(content => content.metadata?.learningStyle)
      .filter((style): style is LearningStyleType => Boolean(style))
    
    return Array.from(new Set(styles))
  }, [state.generatedContent])

  return {
    ...state,
    generateContent,
    generateAdaptedContent,
    clearGenerated,
    resetState,
    getContentForStyle,
    getBestContentForUser,
    getAvailableStyles
  }
}

// Hook for real-time style adaptation of existing content
export function useRealTimeStyleAdaptation() {
  const [adaptationState, setAdaptationState] = useState({
    isAnalyzing: false,
    styleMatch: null,
    adaptationRecommendations: [],
    appliedAdaptations: []
  })

  const analyzeContentStyle = useCallback(async (
    content: ContentItem,
    userProfile: UserProfile
  ) => {
    setAdaptationState(prev => ({ ...prev, isAnalyzing: true }))

    try {
      const response = await fetch('/api/learning-style/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id || 'temp',
          userProfile,
          action: 'analyze_content',
          contentId: content.id,
          content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze content style')
      }

      const data = await response.json()
      
      setAdaptationState(prev => ({
        ...prev,
        isAnalyzing: false,
        styleMatch: data.contentAnalysis.styleMatch,
        adaptationRecommendations: data.contentAnalysis.adaptationRecommendations
      }))

    } catch (error) {
      console.error('Style analysis failed:', error)
      setAdaptationState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }, [])

  const applyAdaptation = useCallback((adaptationType: string) => {
    setAdaptationState(prev => ({
      ...prev,
      appliedAdaptations: [...prev.appliedAdaptations, adaptationType]
    }))
  }, [])

  const resetAdaptations = useCallback(() => {
    setAdaptationState(prev => ({
      ...prev,
      appliedAdaptations: []
    }))
  }, [])

  return {
    ...adaptationState,
    analyzeContentStyle,
    applyAdaptation,
    resetAdaptations,
    needsAdaptation: adaptationState.styleMatch !== null && adaptationState.styleMatch < 0.6
  }
}

// Hook for tracking user preferences and style evolution
export function useStylePreferenceTracking() {
  const [preferences, setPreferences] = useState({
    contentInteractions: [] as any[],
    styleRatings: {} as Record<string, number>,
    adaptationFeedback: [] as any[]
  })

  const trackContentInteraction = useCallback((
    content: ContentItem,
    interactionType: string,
    engagement: number,
    timeSpent: number
  ) => {
    const interaction = {
      contentId: content.id,
      learningStyle: content.metadata?.learningStyle,
      interactionType,
      engagement,
      timeSpent,
      timestamp: new Date().toISOString()
    }

    setPreferences(prev => ({
      ...prev,
      contentInteractions: [...prev.contentInteractions, interaction]
    }))
  }, [])

  const rateStyleAdaptation = useCallback((
    style: LearningStyleType,
    rating: number,
    feedback?: string
  ) => {
    setPreferences(prev => ({
      ...prev,
      styleRatings: {
        ...prev.styleRatings,
        [style]: rating
      },
      adaptationFeedback: feedback ? [
        ...prev.adaptationFeedback,
        { style, rating, feedback, timestamp: new Date().toISOString() }
      ] : prev.adaptationFeedback
    }))
  }, [])

  const getStylePreferenceInsights = useCallback(() => {
    const { contentInteractions, styleRatings } = preferences
    
    // Calculate style effectiveness from interactions
    const styleEffectiveness = contentInteractions.reduce((acc, interaction) => {
      const style = interaction.learningStyle
      if (style) {
        if (!acc[style]) acc[style] = { total: 0, count: 0 }
        acc[style].total += interaction.engagement
        acc[style].count += 1
      }
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    // Convert to average scores
    const averageEffectiveness = Object.entries(styleEffectiveness).reduce((acc, [style, data]) => {
      acc[style] = (data as any).total / (data as any).count
      return acc
    }, {} as Record<string, number>)

    return {
      styleEffectiveness: averageEffectiveness,
      styleRatings,
      mostEffectiveStyle: Object.entries(averageEffectiveness)
        .sort((a, b) => b[1] - a[1])[0]?.[0],
      totalInteractions: contentInteractions.length,
      feedbackCount: Object.keys(styleRatings).length
    }
  }, [preferences])

  return {
    ...preferences,
    trackContentInteraction,
    rateStyleAdaptation,
    getStylePreferenceInsights
  }
}

// Helper function to estimate content length
function estimateContentLength(description: string): 'short' | 'medium' | 'long' {
  const wordCount = description.split(' ').length
  
  if (wordCount < 100) return 'short'
  if (wordCount < 300) return 'medium'
  return 'long'
}