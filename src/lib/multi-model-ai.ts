// Multi-Model AI System
// Intelligently routes between OpenAI and Claude based on use case and learning context

import OpenAI from 'openai'
import type { 
  UserProfile, 
  ContentItem, 
  QuizQuestion,
  AIGenerationRequest,
  AIGenerationResponse
} from '@/types'

// AI Model Configuration
export interface AIModelConfig {
  provider: 'openai' | 'claude'
  model: string
  maxTokens: number
  temperature: number
  specialties: string[]
  strengths: string[]
  optimalUseCases: UseCase[]
}

export type UseCase = 
  | 'mathematics'
  | 'science'
  | 'programming'
  | 'creative_writing'
  | 'essay_analysis'
  | 'language_learning'
  | 'history'
  | 'philosophy'
  | 'business'
  | 'general_tutoring'
  | 'quiz_generation'
  | 'personalized_feedback'
  | 'content_explanation'
  | 'study_planning'

export interface AIRequest {
  useCase: UseCase
  userProfile: UserProfile
  context: string
  requestType: 'content' | 'quiz' | 'feedback' | 'explanation' | 'planning'
  priority: 'high' | 'medium' | 'low'
  maxTokens?: number
  temperature?: number
  fallbackRequired?: boolean
}

export interface AIResponse {
  content: string
  model: string
  provider: 'openai' | 'claude'
  confidence: number
  tokensUsed: number
  responseTime: number
  fallbackUsed: boolean
  metadata: {
    useCase: UseCase
    requestType: string
    timestamp: string
  }
}

// Model configurations optimized for specific use cases
const AI_MODELS: Record<string, AIModelConfig> = {
  'openai-gpt4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
    specialties: ['mathematics', 'science', 'programming', 'quiz_generation'],
    strengths: ['structured_responses', 'mathematical_reasoning', 'code_generation', 'factual_accuracy'],
    optimalUseCases: ['mathematics', 'science', 'programming', 'quiz_generation', 'general_tutoring']
  },
  'claude-sonnet': {
    provider: 'claude',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 2000,
    temperature: 0.7,
    specialties: ['creative_writing', 'essay_analysis', 'language_learning', 'philosophy', 'history'],
    strengths: ['creative_content', 'nuanced_analysis', 'conversational_tone', 'cultural_sensitivity'],
    optimalUseCases: ['creative_writing', 'essay_analysis', 'language_learning', 'history', 'philosophy', 'personalized_feedback']
  },
  'claude-haiku': {
    provider: 'claude',
    model: 'claude-3-haiku-20240307',
    maxTokens: 1000,
    temperature: 0.5,
    specialties: ['quick_responses', 'content_explanation', 'study_planning'],
    strengths: ['fast_responses', 'concise_answers', 'cost_effective'],
    optimalUseCases: ['content_explanation', 'study_planning', 'general_tutoring']
  }
}

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Claude client (using Anthropic SDK)
const anthropic = (() => {
  try {
    // Dynamic import to handle optional dependency
    const Anthropic = require('@anthropic-ai/sdk')
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    })
  } catch (error) {
    console.warn('Anthropic SDK not available, Claude features will use fallback')
    return null
  }
})()

class MultiModelAI {
  private modelSelectionCache = new Map<string, string>()
  private performanceMetrics = new Map<string, number[]>()

  /**
   * Intelligently select the optimal AI model based on use case and context
   */
  selectOptimalModel(request: AIRequest): string {
    const cacheKey = `${request.useCase}-${request.requestType}-${request.userProfile.subject}`
    
    // Check cache for previous optimal selections
    if (this.modelSelectionCache.has(cacheKey)) {
      return this.modelSelectionCache.get(cacheKey)!
    }

    let bestModel = 'openai-gpt4o-mini' // Default fallback
    let bestScore = 0

    // Score each model based on use case compatibility
    for (const [modelKey, config] of Object.entries(AI_MODELS)) {
      let score = 0

      // Primary use case match (40% weight)
      if (config.optimalUseCases.includes(request.useCase)) {
        score += 40
      }

      // Subject-specific optimization (30% weight)
      const subjectCompatibility = this.getSubjectCompatibility(request.userProfile.subject, config)
      score += subjectCompatibility * 30

      // Request type compatibility (20% weight)
      const requestTypeCompatibility = this.getRequestTypeCompatibility(request.requestType, config)
      score += requestTypeCompatibility * 20

      // Performance history (10% weight)
      const performanceScore = this.getPerformanceScore(modelKey)
      score += performanceScore * 10

      // Check availability
      if (config.provider === 'claude' && !anthropic) {
        score = 0 // Claude not available
      }

      if (score > bestScore) {
        bestScore = score
        bestModel = modelKey
      }
    }

    // Cache the selection
    this.modelSelectionCache.set(cacheKey, bestModel)
    
    return bestModel
  }

  /**
   * Generate content using the optimal AI model
   */
  async generateContent(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    const selectedModel = this.selectOptimalModel(request)
    const modelConfig = AI_MODELS[selectedModel]

    try {
      let response: AIResponse

      if (modelConfig.provider === 'openai') {
        response = await this.generateWithOpenAI(request, modelConfig)
      } else if (modelConfig.provider === 'claude' && anthropic) {
        response = await this.generateWithClaude(request, modelConfig)
      } else {
        // Fallback to OpenAI if Claude is not available
        response = await this.generateWithOpenAI(request, AI_MODELS['openai-gpt4o-mini'])
        response.fallbackUsed = true
      }

      response.responseTime = Date.now() - startTime

      // Record performance metrics
      this.recordPerformance(selectedModel, response.responseTime, response.confidence)

      return response

    } catch (error) {
      console.error(`AI generation failed with ${selectedModel}:`, error)

      // Attempt fallback
      if (request.fallbackRequired !== false) {
        return this.generateWithFallback(request, startTime)
      }

      throw error
    }
  }

  /**
   * Generate content using OpenAI
   */
  private async generateWithOpenAI(request: AIRequest, config: AIModelConfig): Promise<AIResponse> {
    const prompt = this.buildPrompt(request)
    
    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature || config.temperature,
    })

    const content = completion.choices[0]?.message?.content || ''
    const tokensUsed = completion.usage?.total_tokens || 0

    return {
      content,
      model: config.model,
      provider: 'openai',
      confidence: this.calculateConfidence(content, request),
      tokensUsed,
      responseTime: 0, // Will be set by caller
      fallbackUsed: false,
      metadata: {
        useCase: request.useCase,
        requestType: request.requestType,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Generate content using Claude
   */
  private async generateWithClaude(request: AIRequest, config: AIModelConfig): Promise<AIResponse> {
    if (!anthropic) {
      throw new Error('Claude client not available')
    }

    const prompt = this.buildPrompt(request)
    
    const completion = await anthropic.messages.create({
      model: config.model,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature || config.temperature,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = completion.content[0]?.text || ''
    const tokensUsed = completion.usage?.input_tokens + completion.usage?.output_tokens || 0

    return {
      content,
      model: config.model,
      provider: 'claude',
      confidence: this.calculateConfidence(content, request),
      tokensUsed,
      responseTime: 0, // Will be set by caller
      fallbackUsed: false,
      metadata: {
        useCase: request.useCase,
        requestType: request.requestType,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Fallback generation when primary model fails
   */
  private async generateWithFallback(request: AIRequest, startTime: number): Promise<AIResponse> {
    console.log('Attempting fallback generation...')
    
    // Try OpenAI as fallback
    try {
      const response = await this.generateWithOpenAI(request, AI_MODELS['openai-gpt4o-mini'])
      response.fallbackUsed = true
      response.responseTime = Date.now() - startTime
      return response
    } catch (error) {
      // Final fallback with static content
      return {
        content: this.getStaticFallback(request),
        model: 'static-fallback',
        provider: 'openai',
        confidence: 0.3,
        tokensUsed: 0,
        responseTime: Date.now() - startTime,
        fallbackUsed: true,
        metadata: {
          useCase: request.useCase,
          requestType: request.requestType,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Build optimized prompt based on request and model
   */
  private buildPrompt(request: AIRequest): string {
    const { userProfile, context, useCase, requestType } = request

    // Base prompt structure
    let prompt = `You are an expert AI tutor specializing in ${useCase}.`
    
    // Add user context
    prompt += `\n\nStudent Profile:
- Name: ${userProfile.name}
- Subject: ${userProfile.subject}
- Level: ${userProfile.level || 'beginner'}
- Age Group: ${userProfile.age_group || 'adult'}
- Use Case: ${userProfile.use_case || 'lifelong'}`

    // Add request-specific instructions
    switch (requestType) {
      case 'content':
        prompt += `\n\nTask: Create educational content that is engaging, clear, and appropriate for the student's level.`
        break
      case 'quiz':
        prompt += `\n\nTask: Generate quiz questions that test understanding and provide learning opportunities.`
        break
      case 'feedback':
        prompt += `\n\nTask: Provide constructive, encouraging feedback that helps the student improve.`
        break
      case 'explanation':
        prompt += `\n\nTask: Explain the concept in a clear, understandable way with examples.`
        break
      case 'planning':
        prompt += `\n\nTask: Create a structured learning plan that is achievable and motivating.`
        break
    }

    prompt += `\n\nContext: ${context}`
    
    // Add use case specific guidelines
    prompt += this.getUseCaseGuidelines(useCase)

    return prompt
  }

  /**
   * Get subject compatibility score for a model
   */
  private getSubjectCompatibility(subject: string, config: AIModelConfig): number {
    const subjectLower = subject.toLowerCase()
    
    // Direct specialty match
    if (config.specialties.some(spec => subjectLower.includes(spec))) {
      return 1.0
    }

    // Partial matches
    const mathSubjects = ['mathematics', 'math', 'algebra', 'calculus', 'geometry', 'statistics']
    const scienceSubjects = ['science', 'physics', 'chemistry', 'biology']
    const languageSubjects = ['english', 'writing', 'literature', 'language']
    const techSubjects = ['programming', 'computer', 'technology', 'coding']

    if (config.specialties.includes('mathematics') && 
        mathSubjects.some(s => subjectLower.includes(s))) {
      return 0.9
    }

    if (config.specialties.includes('science') && 
        scienceSubjects.some(s => subjectLower.includes(s))) {
      return 0.9
    }

    if (config.specialties.includes('creative_writing') && 
        languageSubjects.some(s => subjectLower.includes(s))) {
      return 0.9
    }

    if (config.specialties.includes('programming') && 
        techSubjects.some(s => subjectLower.includes(s))) {
      return 0.9
    }

    return 0.5 // Neutral compatibility
  }

  /**
   * Get request type compatibility score
   */
  private getRequestTypeCompatibility(requestType: string, config: AIModelConfig): number {
    // OpenAI excels at structured content and quizzes
    if (config.provider === 'openai' && ['quiz', 'content'].includes(requestType)) {
      return 1.0
    }

    // Claude excels at feedback and explanations
    if (config.provider === 'claude' && ['feedback', 'explanation'].includes(requestType)) {
      return 1.0
    }

    return 0.7 // Default compatibility
  }

  /**
   * Get performance score based on historical data
   */
  private getPerformanceScore(modelKey: string): number {
    const metrics = this.performanceMetrics.get(modelKey)
    if (!metrics || metrics.length === 0) {
      return 0.5 // Neutral score for new models
    }

    // Calculate average performance (response time + confidence)
    const avgResponseTime = metrics.reduce((sum, metric) => sum + metric, 0) / metrics.length
    return Math.max(0, Math.min(1, 1 - (avgResponseTime / 10000))) // Normalize response time
  }

  /**
   * Record performance metrics for model selection optimization
   */
  private recordPerformance(modelKey: string, responseTime: number, confidence: number) {
    if (!this.performanceMetrics.has(modelKey)) {
      this.performanceMetrics.set(modelKey, [])
    }

    const metrics = this.performanceMetrics.get(modelKey)!
    // Weighted score: faster response + higher confidence = better performance
    const performanceScore = (confidence * 0.7) + ((10000 - Math.min(responseTime, 10000)) / 10000 * 0.3)
    
    metrics.push(performanceScore)
    
    // Keep only recent 20 metrics
    if (metrics.length > 20) {
      metrics.shift()
    }
  }

  /**
   * Calculate confidence score based on response quality
   */
  private calculateConfidence(content: string, request: AIRequest): number {
    let confidence = 0.5 // Base confidence

    // Length appropriateness
    if (content.length > 100 && content.length < 2000) {
      confidence += 0.2
    }

    // Structure indicators
    if (content.includes('\n') || content.includes('•') || content.includes('1.')) {
      confidence += 0.15
    }

    // Content quality indicators
    if (request.requestType === 'quiz' && content.includes('?')) {
      confidence += 0.15
    }

    if (request.requestType === 'explanation' && 
        (content.includes('example') || content.includes('for instance'))) {
      confidence += 0.1
    }

    return Math.min(1.0, confidence)
  }

  /**
   * Get use case specific guidelines
   */
  private getUseCaseGuidelines(useCase: UseCase): string {
    const guidelines: Record<UseCase, string> = {
      mathematics: '\n\nGuidelines: Use step-by-step explanations, include examples, check your work.',
      science: '\n\nGuidelines: Use clear explanations, relate to real-world applications, include diagrams when helpful.',
      programming: '\n\nGuidelines: Provide working code examples, explain logic, include comments.',
      creative_writing: '\n\nGuidelines: Encourage creativity, provide constructive feedback, suggest improvements.',
      essay_analysis: '\n\nGuidelines: Analyze structure, argument strength, and writing style with specific examples.',
      language_learning: '\n\nGuidelines: Use simple language, provide cultural context, include pronunciation tips.',
      history: '\n\nGuidelines: Provide context, explain cause and effect, use chronological organization.',
      philosophy: '\n\nGuidelines: Encourage critical thinking, present multiple perspectives, use clear arguments.',
      business: '\n\nGuidelines: Focus on practical applications, use real examples, emphasize strategic thinking.',
      general_tutoring: '\n\nGuidelines: Adapt to student needs, be encouraging, provide clear explanations.',
      quiz_generation: '\n\nGuidelines: Create varied question types, appropriate difficulty, include explanations.',
      personalized_feedback: '\n\nGuidelines: Be constructive, specific, and encouraging. Focus on improvement.',
      content_explanation: '\n\nGuidelines: Break down complex concepts, use analogies, provide examples.',
      study_planning: '\n\nGuidelines: Create realistic timelines, break down goals, include milestones.'
    }

    return guidelines[useCase] || guidelines.general_tutoring
  }

  /**
   * Get static fallback content when all AI models fail
   */
  private getStaticFallback(request: AIRequest): string {
    const fallbacks: Record<UseCase, string> = {
      mathematics: 'Mathematics is a logical system of problem-solving. Let\'s work through this step by step.',
      science: 'Science helps us understand the natural world through observation and experimentation.',
      programming: 'Programming is about solving problems with code. Let\'s break this down into smaller parts.',
      creative_writing: 'Creative writing is about expressing ideas and emotions through words. Let your creativity flow!',
      essay_analysis: 'When analyzing essays, consider the main argument, supporting evidence, and writing style.',
      language_learning: 'Language learning takes practice and patience. Focus on understanding and communication.',
      history: 'History helps us understand how past events shape our present and future.',
      philosophy: 'Philosophy encourages us to think deeply about fundamental questions and examine our beliefs.',
      business: 'Business success comes from understanding markets, customers, and strategic decision-making.',
      general_tutoring: 'Learning is a journey of discovery. Take it one step at a time and stay curious!',
      quiz_generation: 'Here\'s a practice question to test your understanding of the material.',
      personalized_feedback: 'You\'re making good progress! Keep practicing and you\'ll continue to improve.',
      content_explanation: 'Let me explain this concept in a clear and understandable way.',
      study_planning: 'Effective studying requires organization, consistency, and clear goals.'
    }

    return fallbacks[request.useCase] || fallbacks.general_tutoring
  }

  /**
   * Get model performance analytics
   */
  getAnalytics() {
    const analytics = {
      modelUsage: Array.from(this.modelSelectionCache.values()).reduce((acc, model) => {
        acc[model] = (acc[model] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      averagePerformance: Object.fromEntries(
        Array.from(this.performanceMetrics.entries()).map(([model, metrics]) => [
          model,
          metrics.length > 0 ? metrics.reduce((sum, m) => sum + m, 0) / metrics.length : 0
        ])
      ),
      cacheSize: this.modelSelectionCache.size
    }

    return analytics
  }
}

// Export singleton instance
export const multiModelAI = new MultiModelAI()

// Helper functions for easier integration
export async function generateAIContent(
  useCase: UseCase,
  userProfile: UserProfile,
  context: string,
  requestType: 'content' | 'quiz' | 'feedback' | 'explanation' | 'planning' = 'content'
): Promise<AIResponse> {
  return multiModelAI.generateContent({
    useCase,
    userProfile,
    context,
    requestType,
    priority: 'medium',
    fallbackRequired: true
  })
}

export async function generateSmartQuiz(
  subject: string,
  userProfile: UserProfile,
  context: string
): Promise<AIResponse> {
  const useCase = subject.toLowerCase().includes('math') ? 'mathematics' :
                 subject.toLowerCase().includes('science') ? 'science' :
                 subject.toLowerCase().includes('program') ? 'programming' :
                 'general_tutoring'

  return multiModelAI.generateContent({
    useCase,
    userProfile,
    context,
    requestType: 'quiz',
    priority: 'high',
    fallbackRequired: true
  })
}

export async function generatePersonalizedFeedback(
  userProfile: UserProfile,
  context: string,
  subject: string
): Promise<AIResponse> {
  const useCase = subject.toLowerCase().includes('writing') ? 'creative_writing' :
                 subject.toLowerCase().includes('essay') ? 'essay_analysis' :
                 'personalized_feedback'

  return multiModelAI.generateContent({
    useCase,
    userProfile,
    context,
    requestType: 'feedback',
    priority: 'high',
    fallbackRequired: true
  })
}