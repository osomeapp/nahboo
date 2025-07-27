import type { 
  UserProfile, 
  QuizQuestion 
} from '@/types'
import type { 
  ContentGenerationRequest,
  QuizGenerationRequest,
  PersonalizedFeedbackRequest,
  AITutorPersonality
} from './ai-client'

interface AIContentResponse {
  content: string
  tutorPersonality: AITutorPersonality
  generatedAt: string
}

interface AIQuizResponse {
  questions: QuizQuestion[]
  tutorPersonality: AITutorPersonality
  generatedAt: string
  topic: string
  difficulty: string
}

interface AIFeedbackResponse {
  feedback: string
  isCorrect: boolean
  tutorPersonality: AITutorPersonality
  generatedAt: string
}

class AIAPIClient {
  private baseUrl = '/api/ai'

  /**
   * Generate personalized learning content
   */
  async generateContent(request: ContentGenerationRequest): Promise<AIContentResponse> {
    const response = await fetch(`${this.baseUrl}/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate content')
    }

    return response.json()
  }

  /**
   * Generate AI-powered quiz questions
   */
  async generateQuiz(request: QuizGenerationRequest): Promise<AIQuizResponse> {
    const response = await fetch(`${this.baseUrl}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate quiz')
    }

    return response.json()
  }

  /**
   * Generate personalized feedback
   */
  async generateFeedback(request: PersonalizedFeedbackRequest): Promise<AIFeedbackResponse> {
    const response = await fetch(`${this.baseUrl}/generate-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate feedback')
    }

    return response.json()
  }

  /**
   * Generate quick lesson content for a topic
   */
  async generateQuickLesson(
    userProfile: UserProfile, 
    topic: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<AIContentResponse> {
    return this.generateContent({
      userProfile,
      contentType: 'lesson',
      topic,
      difficulty,
      length: 'medium',
      format: 'structured'
    })
  }

  /**
   * Generate explanation for a concept
   */
  async generateExplanation(
    userProfile: UserProfile, 
    topic: string, 
    context?: string
  ): Promise<AIContentResponse> {
    return this.generateContent({
      userProfile,
      contentType: 'explanation',
      topic,
      difficulty: userProfile.level || 'beginner',
      length: 'short',
      format: 'conversational',
      context
    })
  }

  /**
   * Generate practice quiz
   */
  async generatePracticeQuiz(
    userProfile: UserProfile, 
    topic: string,
    questionCount: number = 3
  ): Promise<AIQuizResponse> {
    return this.generateQuiz({
      userProfile,
      topic,
      difficulty: userProfile.level || 'beginner',
      questionCount: Math.min(questionCount, 5), // Limit to 5 questions
      questionTypes: ['multiple_choice', 'true_false']
    })
  }

  /**
   * Generate feedback for quiz answer
   */
  async generateQuizFeedback(
    userProfile: UserProfile,
    question: string,
    userAnswer: string,
    correctAnswer: string,
    topic: string
  ): Promise<AIFeedbackResponse> {
    return this.generateFeedback({
      userProfile,
      question,
      userAnswer,
      correctAnswer,
      topic
    })
  }
}

// Export singleton instance
export const aiAPI = new AIAPIClient()

// Helper functions for common use cases
export const generatePersonalizedContent = async (
  userProfile: UserProfile,
  topic: string
) => {
  try {
    const result = await aiAPI.generateQuickLesson(userProfile, topic)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Failed to generate personalized content:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const generateAdaptiveQuiz = async (
  userProfile: UserProfile,
  topic: string,
  questionCount: number = 3
) => {
  try {
    const result = await aiAPI.generatePracticeQuiz(userProfile, topic, questionCount)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Failed to generate adaptive quiz:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const getPersonalizedFeedback = async (
  userProfile: UserProfile,
  question: string,
  userAnswer: string,
  correctAnswer: string,
  topic: string
) => {
  try {
    const result = await aiAPI.generateQuizFeedback(
      userProfile,
      question,
      userAnswer,
      correctAnswer,
      topic
    )
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Failed to generate personalized feedback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}