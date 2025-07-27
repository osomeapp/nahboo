import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { LearningStyleProfile, ContentStyleAnalysis } from '@/lib/learning-style-engine'
import type { PerformancePoint } from '@/lib/difficulty-engine'

interface LearningStyleState {
  profile: LearningStyleProfile | null
  isDetecting: boolean
  isAnalyzing: boolean
  isLoading: boolean
  error: string | null
  
  // Detection results
  insights: any
  recommendations: any
  confidenceMetrics: any
  styleDescription: any
  
  // Content analysis
  contentAnalysis: ContentStyleAnalysis | null
  adaptationPriority: any
  effectivenessEstimate: any
  implementationPlan: any
}

interface LearningStyleActions {
  detectLearningStyle: (
    userId: string,
    userProfile: UserProfile,
    interactionData?: any[],
    performanceData?: PerformancePoint[]
  ) => Promise<void>
  
  analyzeContent: (
    userId: string,
    userProfile: UserProfile,
    contentId: string,
    content: ContentItem
  ) => Promise<void>
  
  getProfile: (userId: string, userProfile: UserProfile) => Promise<void>
  
  updateEffectiveness: (
    userId: string,
    userProfile: UserProfile,
    adaptationType: string,
    effectiveness: number,
    userFeedback?: any
  ) => Promise<void>
  
  resetState: () => void
}

export function useLearningStyle(): LearningStyleState & LearningStyleActions {
  const [state, setState] = useState<LearningStyleState>({
    profile: null,
    isDetecting: false,
    isAnalyzing: false,
    isLoading: false,
    error: null,
    insights: null,
    recommendations: null,
    confidenceMetrics: null,
    styleDescription: null,
    contentAnalysis: null,
    adaptationPriority: null,
    effectivenessEstimate: null,
    implementationPlan: null
  })
  
  // Detect learning style
  const detectLearningStyle = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    interactionData?: any[],
    performanceData?: PerformancePoint[]
  ) => {
    setState(prev => ({ ...prev, isDetecting: true, error: null }))
    
    try {
      const response = await fetch('/api/learning-style/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'detect',
          interactionData,
          performanceData
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to detect learning style')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        profile: data.styleProfile,
        insights: data.insights,
        recommendations: data.recommendations,
        confidenceMetrics: data.confidenceMetrics,
        styleDescription: data.styleDescription,
        isDetecting: false,
        error: null
      }))
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: error instanceof Error ? error.message : 'Detection failed'
      }))
    }
  }, [])
  
  // Analyze content style match
  const analyzeContent = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    contentId: string,
    content: ContentItem
  ) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))
    
    try {
      const response = await fetch('/api/learning-style/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'analyze_content',
          contentId,
          content
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze content')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        contentAnalysis: data.contentAnalysis,
        adaptationPriority: data.adaptationPriority,
        effectivenessEstimate: data.effectivenessEstimate,
        implementationPlan: data.implementationPlan,
        isAnalyzing: false,
        error: null
      }))
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Content analysis failed'
      }))
    }
  }, [])
  
  // Get existing learning style profile
  const getProfile = useCallback(async (userId: string, userProfile: UserProfile) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/learning-style/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_profile'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get profile')
      }
      
      const data = await response.json()
      
      if (data.profileExists) {
        setState(prev => ({
          ...prev,
          profile: data.styleProfile,
          insights: data.currentInsights,
          styleDescription: data.styleDescription,
          isLoading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          profile: null,
          isLoading: false,
          error: null
        }))
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile'
      }))
    }
  }, [])
  
  // Update adaptation effectiveness
  const updateEffectiveness = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    adaptationType: string,
    effectiveness: number,
    userFeedback?: any
  ) => {
    try {
      const response = await fetch('/api/learning-style/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'update_effectiveness',
          adaptationType,
          effectiveness,
          userFeedback
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update effectiveness')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        profile: data.updatedProfile,
        insights: data.updatedInsights,
        error: null
      }))
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update effectiveness'
      }))
    }
  }, [])
  
  // Reset state
  const resetState = useCallback(() => {
    setState({
      profile: null,
      isDetecting: false,
      isAnalyzing: false,
      isLoading: false,
      error: null,
      insights: null,
      recommendations: null,
      confidenceMetrics: null,
      styleDescription: null,
      contentAnalysis: null,
      adaptationPriority: null,
      effectivenessEstimate: null,
      implementationPlan: null
    })
  }, [])
  
  return {
    ...state,
    detectLearningStyle,
    analyzeContent,
    getProfile,
    updateEffectiveness,
    resetState
  }
}

// Hook for style-aware content optimization
export function useStyleAwareContent(
  content: ContentItem,
  userId: string,
  userProfile: UserProfile
) {
  const [optimizedContent, setOptimizedContent] = useState<ContentItem>(content)
  const [styleAnalysis, setStyleAnalysis] = useState<any>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  
  const { analyzeContent, contentAnalysis, adaptationPriority } = useLearningStyle()
  
  // Auto-analyze content when it changes
  useEffect(() => {
    if (content && userId && userProfile) {
      analyzeContent(userId, userProfile, content.id, content)
    }
  }, [content.id, userId, analyzeContent, userProfile])
  
  // Generate style-optimized content
  const optimizeForStyle = useCallback(async () => {
    if (!contentAnalysis || !adaptationPriority) return
    
    setIsOptimizing(true)
    
    try {
      // Apply high-priority adaptations
      const highPriorityAdaptations = adaptationPriority.recommendations
        .filter(rec => rec.priority === 'high')
        .slice(0, 2) // Apply top 2 adaptations
      
      let optimized = { ...content }
      
      for (const adaptation of highPriorityAdaptations) {
        optimized = await applyStyleAdaptation(optimized, adaptation)
      }
      
      setOptimizedContent(optimized)
      setStyleAnalysis({
        originalMatch: contentAnalysis.styleMatch,
        optimizedMatch: contentAnalysis.styleMatch + 
          highPriorityAdaptations.reduce((sum, rec) => sum + rec.expectedImprovement, 0),
        appliedAdaptations: highPriorityAdaptations,
        userStyle: contentAnalysis.detectedUserStyle
      })
      
    } catch (error) {
      console.error('Failed to optimize content for style:', error)
    } finally {
      setIsOptimizing(false)
    }
  }, [contentAnalysis, adaptationPriority, content])
  
  // Auto-optimize if style match is poor
  useEffect(() => {
    if (contentAnalysis && contentAnalysis.styleMatch < 0.6) {
      optimizeForStyle()
    }
  }, [contentAnalysis, optimizeForStyle])
  
  return {
    originalContent: content,
    optimizedContent,
    styleAnalysis,
    isOptimizing,
    optimizeForStyle,
    needsOptimization: contentAnalysis?.styleMatch < 0.6
  }
}

// Hook for learning style assessment during onboarding
export function useLearningStyleAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [results, setResults] = useState<any>(null)
  
  // Quick 8-question VARK-style assessment
  const assessmentQuestions = [
    {
      id: 'q1',
      question: 'When learning something new, I prefer to:',
      options: [
        { text: 'See diagrams and pictures', style: 'visual', value: 1 },
        { text: 'Listen to explanations', style: 'auditory', value: 1 },
        { text: 'Try it hands-on', style: 'kinesthetic', value: 1 },
        { text: 'Read detailed instructions', style: 'reading', value: 1 }
      ]
    },
    {
      id: 'q2',
      question: 'I remember information best when:',
      options: [
        { text: 'I can visualize it in my mind', style: 'visual', value: 1 },
        { text: 'I hear it repeatedly', style: 'auditory', value: 1 },
        { text: 'I practice using it', style: 'kinesthetic', value: 1 },
        { text: 'I write it down', style: 'reading', value: 1 }
      ]
    },
    {
      id: 'q3',
      question: 'When following directions, I prefer:',
      options: [
        { text: 'Maps and visual guides', style: 'visual', value: 1 },
        { text: 'Spoken instructions', style: 'auditory', value: 1 },
        { text: 'Following someone there first', style: 'kinesthetic', value: 1 },
        { text: 'Written step-by-step directions', style: 'reading', value: 1 }
      ]
    },
    {
      id: 'q4',
      question: 'I concentrate best when:',
      options: [
        { text: 'The area is visually organized', style: 'visual', value: 1 },
        { text: 'It\'s quiet with no distractions', style: 'auditory', value: 1 },
        { text: 'I can move around or fidget', style: 'kinesthetic', value: 1 },
        { text: 'I have notes and materials to reference', style: 'reading', value: 1 }
      ]
    },
    {
      id: 'q5',
      question: 'When studying, I like to:',
      options: [
        { text: 'Use highlighters and color-coding', style: 'visual', value: 1 },
        { text: 'Read aloud or listen to recordings', style: 'auditory', value: 1 },
        { text: 'Take frequent breaks and move around', style: 'kinesthetic', value: 1 },
        { text: 'Make detailed written notes', style: 'reading', value: 1 }
      ]
    },
    {
      id: 'q6',
      question: 'I understand concepts better with:',
      options: [
        { text: 'Charts, graphs, and diagrams', style: 'visual', value: 1 },
        { text: 'Discussions and explanations', style: 'auditory', value: 1 },
        { text: 'Real-world examples and practice', style: 'kinesthetic', value: 1 },
        { text: 'Detailed written descriptions', style: 'reading', value: 1 }
      ]
    },
    {
      id: 'q7',
      question: 'When solving problems, I:',
      options: [
        { text: 'Visualize the solution', style: 'visual', value: 1 },
        { text: 'Talk through it out loud', style: 'auditory', value: 1 },
        { text: 'Try different approaches', style: 'kinesthetic', value: 1 },
        { text: 'Write down the steps', style: 'reading', value: 1 }
      ]
    },
    {
      id: 'q8',
      question: 'I prefer learning environments that are:',
      options: [
        { text: 'Visually appealing and well-lit', style: 'visual', value: 1 },
        { text: 'Quiet with good acoustics', style: 'auditory', value: 1 },
        { text: 'Interactive and hands-on', style: 'kinesthetic', value: 1 },
        { text: 'Text-rich with reading materials', style: 'reading', value: 1 }
      ]
    }
  ]
  
  const answerQuestion = useCallback((questionId: string, stylePreferences: Record<string, number>) => {
    setAnswers(prev => ({ ...prev, [questionId]: 1 }))
    
    // Update style scores
    Object.entries(stylePreferences).forEach(([style, value]) => {
      setAnswers(prev => ({
        ...prev,
        [`${style}_total`]: (prev[`${style}_total`] || 0) + value
      }))
    })
  }, [])
  
  const nextQuestion = useCallback(() => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      completeAssessment()
    }
  }, [currentQuestion])
  
  const completeAssessment = useCallback(() => {
    const styleScores = {
      visual: answers.visual_total || 0,
      auditory: answers.auditory_total || 0,
      kinesthetic: answers.kinesthetic_total || 0,
      reading: answers.reading_total || 0
    }
    
    const totalScore = Object.values(styleScores).reduce((sum, score) => sum + score, 0)
    const normalizedScores = totalScore > 0 ? 
      Object.fromEntries(Object.entries(styleScores).map(([style, score]) => [style, score / totalScore])) :
      styleScores
    
    const sortedStyles = Object.entries(normalizedScores).sort((a, b) => b[1] - a[1])
    const primaryStyle = sortedStyles[0]
    const secondaryStyle = sortedStyles[1]
    
    const assessmentResults = {
      scores: normalizedScores,
      primaryStyle: {
        style: primaryStyle[0],
        score: primaryStyle[1],
        confidence: primaryStyle[1] > 0.4 ? 'high' : primaryStyle[1] > 0.3 ? 'medium' : 'low'
      },
      secondaryStyle: secondaryStyle[1] > 0.25 ? {
        style: secondaryStyle[0],
        score: secondaryStyle[1]
      } : null,
      isMultimodal: sortedStyles.filter(([_, score]) => score > 0.2).length >= 3,
      questionsAnswered: Object.keys(answers).filter(key => !key.includes('_total')).length
    }
    
    setResults(assessmentResults)
    setIsComplete(true)
  }, [answers])
  
  const resetAssessment = useCallback(() => {
    setCurrentQuestion(0)
    setAnswers({})
    setIsComplete(false)
    setResults(null)
  }, [])
  
  return {
    currentQuestion,
    totalQuestions: assessmentQuestions.length,
    currentQuestionData: assessmentQuestions[currentQuestion],
    answers,
    isComplete,
    results,
    progress: (currentQuestion + 1) / assessmentQuestions.length,
    answerQuestion,
    nextQuestion,
    resetAssessment,
    canProceed: answers[assessmentQuestions[currentQuestion]?.id] !== undefined
  }
}

// Helper function to apply style adaptations to content
async function applyStyleAdaptation(content: ContentItem, adaptation: any): Promise<ContentItem> {
  const adapted = { ...content }
  
  switch (adaptation.adaptationType) {
    case 'add_visuals':
      adapted.metadata = {
        ...adapted.metadata,
        hasImages: true,
        visualEnhanced: true,
        adaptationApplied: 'visual_enhancement'
      }
      adapted.description += '\n\n📊 Visual aids and diagrams included to enhance understanding.'
      break
      
    case 'add_audio':
      adapted.metadata = {
        ...adapted.metadata,
        hasAudio: true,
        audioNarration: true,
        adaptationApplied: 'audio_enhancement'
      }
      adapted.description += '\n\n🔊 Audio explanations available for better comprehension.'
      break
      
    case 'add_interactivity':
      adapted.metadata = {
        ...adapted.metadata,
        interactiveElements: true,
        handsonActivities: true,
        adaptationApplied: 'interactive_enhancement'
      }
      adapted.description += '\n\n🎮 Interactive exercises and hands-on activities included.'
      break
      
    case 'add_text':
      adapted.metadata = {
        ...adapted.metadata,
        detailedText: true,
        comprehensiveNotes: true,
        adaptationApplied: 'text_enhancement'
      }
      adapted.description += '\n\n📝 Detailed written summaries and comprehensive notes provided.'
      break
      
    default:
      // Generic adaptation
      adapted.metadata = {
        ...adapted.metadata,
        styleAdapted: true,
        adaptationApplied: adaptation.adaptationType
      }
  }
  
  // Add adaptation metadata
  adapted.metadata = {
    ...adapted.metadata,
    styleAdaptation: {
      type: adaptation.adaptationType,
      appliedAt: new Date().toISOString(),
      expectedImprovement: adaptation.expectedImprovement,
      confidence: adaptation.confidence
    }
  }
  
  return adapted
}