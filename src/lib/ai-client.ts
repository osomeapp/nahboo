import OpenAI from 'openai'
import type { 
  UserProfile, 
  ContentItem, 
  QuizQuestion,
  Subject
} from '@/types'

// AI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: false // Server-side only for security
})

export interface AITutorPersonality {
  id: string
  name: string
  description: string
  ageGroups: string[]
  subjects: string[]
  tone: 'friendly' | 'professional' | 'encouraging' | 'playful' | 'serious'
  expertise: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  specialties: string[]
}

export interface ContentGenerationRequest {
  userProfile: UserProfile
  contentType: 'lesson' | 'explanation' | 'example' | 'exercise'
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  length: 'short' | 'medium' | 'long'
  format: 'text' | 'structured' | 'conversational'
  context?: string
}

export interface QuizGenerationRequest {
  userProfile: UserProfile
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  questionCount: number
  questionTypes: ('multiple_choice' | 'true_false' | 'short_answer')[]
  context?: string
}

export interface PersonalizedFeedbackRequest {
  userProfile: UserProfile
  userAnswer: string
  correctAnswer: string
  question: string
  topic: string
}

// AI Tutor Personalities Database
export const AI_TUTORS: Record<string, AITutorPersonality> = {
  friendly_teacher: {
    id: 'friendly_teacher',
    name: 'Ms. Sara',
    description: 'A warm, encouraging teacher who makes learning fun and accessible',
    ageGroups: ['child', 'teen'],
    subjects: ['math', 'science', 'reading', 'writing'],
    tone: 'friendly',
    expertise: 'intermediate',
    specialties: ['breaking down complex concepts', 'encouraging struggling learners']
  },
  
  professional_expert: {
    id: 'professional_expert',
    name: 'Dr. Chen',
    description: 'A knowledgeable expert providing comprehensive, detailed instruction',
    ageGroups: ['adult'],
    subjects: ['computer science', 'engineering', 'mathematics', 'physics'],
    tone: 'professional',
    expertise: 'expert',
    specialties: ['advanced concepts', 'technical accuracy', 'industry applications']
  },
  
  playful_guide: {
    id: 'playful_guide',
    name: 'Professor Spark',
    description: 'An enthusiastic guide who uses games, stories, and fun examples',
    ageGroups: ['child'],
    subjects: ['science', 'math', 'history', 'geography'],
    tone: 'playful',
    expertise: 'beginner',
    specialties: ['gamification', 'storytelling', 'visual learning']
  },
  
  encouraging_mentor: {
    id: 'encouraging_mentor',
    name: 'Coach Alex',
    description: 'A supportive mentor focused on building confidence and motivation',
    ageGroups: ['teen', 'adult'],
    subjects: ['personal development', 'study skills', 'career guidance'],
    tone: 'encouraging',
    expertise: 'intermediate',
    specialties: ['motivation', 'goal setting', 'overcoming challenges']
  },
  
  business_advisor: {
    id: 'business_advisor',
    name: 'Executive Morgan',
    description: 'A seasoned professional teaching practical business and career skills',
    ageGroups: ['adult'],
    subjects: ['business', 'marketing', 'leadership', 'finance'],
    tone: 'professional',
    expertise: 'expert',
    specialties: ['real-world applications', 'case studies', 'strategic thinking']
  }
}

export class AITutorClient {
  private openai: OpenAI
  private defaultModel: string = 'gpt-4o-mini'

  constructor() {
    this.openai = openai
  }

  /**
   * Select the best AI tutor personality for a user profile
   */
  selectTutorPersonality(userProfile: UserProfile): AITutorPersonality {
    const tutors = Object.values(AI_TUTORS)
    
    // Filter by age group
    const ageCompatibleTutors = tutors.filter(tutor => 
      tutor.ageGroups.includes(userProfile.age_group || 'adult')
    )
    
    // Filter by subject if possible
    const subjectCompatibleTutors = ageCompatibleTutors.filter(tutor =>
      tutor.subjects.some(subject => 
        subject.toLowerCase().includes(userProfile.subject.toLowerCase()) ||
        userProfile.subject.toLowerCase().includes(subject.toLowerCase())
      )
    )
    
    // Use subject-compatible tutor if available, otherwise age-compatible
    const selectedTutors = subjectCompatibleTutors.length > 0 
      ? subjectCompatibleTutors 
      : ageCompatibleTutors
    
    // Default to friendly_teacher if no matches
    return selectedTutors[0] || AI_TUTORS.friendly_teacher
  }

  /**
   * Generate personalized learning content
   */
  async generateContent(request: ContentGenerationRequest): Promise<string> {
    const tutor = this.selectTutorPersonality(request.userProfile)
    
    const systemPrompt = this.buildSystemPrompt(tutor, request.userProfile)
    const userPrompt = this.buildContentPrompt(request)

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.getMaxTokensForLength(request.length),
        temperature: 0.7,
      })

      return completion.choices[0]?.message?.content || 'Unable to generate content at this time.'
    } catch (error) {
      console.error('AI content generation error:', error)
      return this.getFallbackContent(request)
    }
  }

  /**
   * Generate quiz questions based on user profile and topic
   */
  async generateQuizQuestions(request: QuizGenerationRequest): Promise<QuizQuestion[]> {
    const tutor = this.selectTutorPersonality(request.userProfile)
    
    const systemPrompt = this.buildSystemPrompt(tutor, request.userProfile)
    const userPrompt = this.buildQuizPrompt(request)

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.6,
      })

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('No content generated')

      return this.parseQuizQuestions(content, request)
    } catch (error) {
      console.error('AI quiz generation error:', error)
      return this.getFallbackQuizQuestions(request)
    }
  }

  /**
   * Generate personalized feedback for user answers
   */
  async generateFeedback(request: PersonalizedFeedbackRequest): Promise<string> {
    const tutor = this.selectTutorPersonality(request.userProfile)
    
    const systemPrompt = this.buildSystemPrompt(tutor, request.userProfile)
    const userPrompt = this.buildFeedbackPrompt(request)

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8,
      })

      return completion.choices[0]?.message?.content || 'Great effort! Keep practicing.'
    } catch (error) {
      console.error('AI feedback generation error:', error)
      return this.getFallbackFeedback(request)
    }
  }

  /**
   * Build system prompt based on tutor personality and user profile
   */
  private buildSystemPrompt(tutor: AITutorPersonality, userProfile: UserProfile): string {
    return `You are ${tutor.name}, ${tutor.description}.

Your characteristics:
- Tone: ${tutor.tone}
- Expertise: ${tutor.expertise}
- Specialties: ${tutor.specialties.join(', ')}

Student Profile:
- Name: ${userProfile.name}
- Subject: ${userProfile.subject}
- Level: ${userProfile.level || 'beginner'}
- Age Group: ${userProfile.age_group || 'adult'}
- Use Case: ${userProfile.use_case || 'general learning'}

Guidelines:
1. Adapt your language and examples to the student's age group and level
2. Stay focused on the subject matter
3. Provide clear, engaging explanations
4. Use encouraging language
5. Include relevant examples and analogies
6. Ensure content is appropriate for the age group
7. Be concise but thorough`
  }

  /**
   * Build content generation prompt
   */
  private buildContentPrompt(request: ContentGenerationRequest): string {
    return `Generate ${request.contentType} content about "${request.topic}" for a ${request.difficulty} level learner.

Requirements:
- Length: ${request.length}
- Format: ${request.format}
${request.context ? `- Context: ${request.context}` : ''}

The content should be engaging, educational, and appropriate for the student's profile.`
  }

  /**
   * Build quiz generation prompt
   */
  private buildQuizPrompt(request: QuizGenerationRequest): string {
    return `Generate ${request.questionCount} quiz questions about "${request.topic}" for a ${request.difficulty} level learner.

Requirements:
- Question types: ${request.questionTypes.join(', ')}
- Each question should have: question text, correct answer, explanation
- For multiple choice: include 4 options with one correct answer
- Assign points: 5 for true/false, 10 for multiple choice, 15 for short answer
${request.context ? `- Context: ${request.context}` : ''}

Format as JSON array with this structure:
[
  {
    "id": "q1",
    "question": "Question text",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Explanation text",
    "points": 10
  }
]`
  }

  /**
   * Build feedback generation prompt
   */
  private buildFeedbackPrompt(request: PersonalizedFeedbackRequest): string {
    const isCorrect = request.userAnswer.toLowerCase().trim() === request.correctAnswer.toLowerCase().trim()
    
    return `Provide personalized feedback for this quiz answer:

Question: "${request.question}"
Student's Answer: "${request.userAnswer}"
Correct Answer: "${request.correctAnswer}"
Topic: ${request.topic}

The answer is ${isCorrect ? 'correct' : 'incorrect'}. 

Provide encouraging, constructive feedback that:
${isCorrect 
  ? '- Congratulates the student\n- Reinforces the concept\n- Encourages continued learning' 
  : '- Gently corrects the mistake\n- Explains the correct concept\n- Provides encouragement to keep trying'
}

Keep it positive and educational (2-3 sentences).`
  }

  /**
   * Parse quiz questions from AI response
   */
  private parseQuizQuestions(content: string, request: QuizGenerationRequest): QuizQuestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      
      const questions = JSON.parse(jsonMatch[0])
      return questions.map((q: unknown, index: number) => ({
        id: `ai-q${index + 1}`,
        question: (q as { question: string }).question,
        type: (q as { type: string }).type,
        options: (q as { options?: string[] }).options,
        correct_answer: (q as { correct_answer: string }).correct_answer,
        explanation: (q as { explanation: string }).explanation,
        points: (q as { points: number }).points || 10
      }))
    } catch (error) {
      console.error('Failed to parse AI quiz questions:', error)
      return this.getFallbackQuizQuestions(request)
    }
  }

  /**
   * Get max tokens based on content length
   */
  private getMaxTokensForLength(length: string): number {
    switch (length) {
      case 'short': return 300
      case 'medium': return 600
      case 'long': return 1200
      default: return 600
    }
  }

  /**
   * Fallback content when AI fails
   */
  private getFallbackContent(request: ContentGenerationRequest): string {
    return `Welcome to learning about ${request.topic}! 

This is an important concept in ${request.userProfile.subject}. Let's explore the fundamentals and build your understanding step by step.

Key points to remember:
• Understanding the basics is crucial for building advanced knowledge
• Practice helps reinforce what you've learned
• Don't hesitate to ask questions if something isn't clear

Keep learning and stay curious about ${request.topic}!`
  }

  /**
   * Fallback quiz questions when AI fails
   */
  private getFallbackQuizQuestions(request: QuizGenerationRequest): QuizQuestion[] {
    return [
      {
        id: 'fallback-q1',
        question: `What is the main concept being studied in ${request.topic}?`,
        type: 'multiple_choice',
        options: [
          'Understanding the fundamentals',
          'Advanced applications only',
          'Historical context only',
          'Memorizing definitions'
        ],
        correct_answer: 'Understanding the fundamentals',
        explanation: 'Learning fundamentals provides the foundation for deeper understanding.',
        points: 10
      }
    ]
  }

  /**
   * Fallback feedback when AI fails
   */
  private getFallbackFeedback(request: PersonalizedFeedbackRequest): string {
    const isCorrect = request.userAnswer.toLowerCase().trim() === request.correctAnswer.toLowerCase().trim()
    
    if (isCorrect) {
      return `Excellent work, ${request.userProfile.name}! You've got it right. Keep up the great learning!`
    } else {
      return `Good try, ${request.userProfile.name}! The correct answer is "${request.correctAnswer}". Keep practicing and you'll master this concept!`
    }
  }
}

// Export singleton instance
export const aiTutorClient = new AITutorClient()