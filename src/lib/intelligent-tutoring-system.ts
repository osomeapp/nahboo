'use client'

import { multiModelAI } from './multi-model-ai'

// Core conversation and tutoring types
export interface ConversationMessage {
  id: string
  role: 'tutor' | 'student'
  content: string
  timestamp: Date
  metadata: {
    subject?: string
    topic?: string
    difficulty?: number
    learningObjective?: string
    messageType: MessageType
    confidence: number
    requires_followup?: boolean
    assessment_opportunity?: boolean
  }
}

export type MessageType = 
  | 'question' // Student asking a question
  | 'explanation' // Tutor explaining a concept
  | 'assessment' // Testing understanding
  | 'encouragement' // Motivational support
  | 'clarification' // Asking for clarification
  | 'example' // Providing examples
  | 'analogy' // Using analogies to explain
  | 'summary' // Summarizing discussion
  | 'guidance' // Providing learning direction
  | 'feedback' // Assessment feedback

export interface TutorPersonality {
  id: string
  name: string
  description: string
  characteristics: {
    formality: 'formal' | 'casual' | 'friendly'
    encouragement_style: 'gentle' | 'enthusiastic' | 'matter_of_fact'
    explanation_approach: 'step_by_step' | 'big_picture' | 'example_driven'
    questioning_style: 'socratic' | 'direct' | 'guided_discovery'
    patience_level: 'high' | 'medium' | 'adaptive'
  }
  subject_specialties: string[]
  age_groups: string[]
  teaching_methods: string[]
}

export interface ConversationContext {
  sessionId: string
  subject: string
  currentTopic?: string
  learningObjectives: string[]
  studentProfile: {
    name: string
    level: string
    learningStyle: string
    interests: string[]
    strugglingAreas: string[]
    strengths: string[]
  }
  conversationHistory: ConversationMessage[]
  tutorPersonality: TutorPersonality
  sessionMetrics: {
    duration: number // minutes
    messagesExchanged: number
    topicsCovered: string[]
    understandingLevel: number // 0-1
    engagementLevel: number // 0-1
    conceptsMastered: string[]
    areasNeedingWork: string[]
  }
}

export interface TutoringStrategy {
  id: string
  name: string
  description: string
  applicableScenarios: string[]
  implementation: {
    initialApproach: string
    questioningTechnique: string
    errorHandling: string
    assessmentMethod: string
    adaptationTriggers: string[]
  }
}

export interface LearningAssessment {
  conceptUnderstood: boolean
  confidence: number
  misconceptions: string[]
  suggestedNextSteps: string[]
  difficulty_adjustment: number // -2 to +2
  requires_practice: boolean
  ready_for_next_topic: boolean
}

// Predefined tutor personalities
export const TUTOR_PERSONALITIES: TutorPersonality[] = [
  {
    id: 'socratic_mentor',
    name: 'Dr. Sophia (Socratic Mentor)',
    description: 'Guides learning through thoughtful questions and discovery',
    characteristics: {
      formality: 'formal',
      encouragement_style: 'gentle',
      explanation_approach: 'step_by_step',
      questioning_style: 'socratic',
      patience_level: 'high'
    },
    subject_specialties: ['philosophy', 'critical thinking', 'mathematics', 'science'],
    age_groups: ['high school', 'college', 'adult'],
    teaching_methods: ['inquiry-based', 'problem-solving', 'reflection']
  },
  {
    id: 'enthusiastic_coach',
    name: 'Alex (Enthusiastic Coach)',
    description: 'Energetic and motivating, makes learning fun and engaging',
    characteristics: {
      formality: 'friendly',
      encouragement_style: 'enthusiastic',
      explanation_approach: 'example_driven',
      questioning_style: 'guided_discovery',
      patience_level: 'high'
    },
    subject_specialties: ['sports', 'fitness', 'personal development', 'business'],
    age_groups: ['middle school', 'high school', 'young adult'],
    teaching_methods: ['experiential', 'gamification', 'goal-setting']
  },
  {
    id: 'patient_teacher',
    name: 'Ms. Chen (Patient Teacher)',
    description: 'Calm, methodical, and infinitely patient with learners',
    characteristics: {
      formality: 'casual',
      encouragement_style: 'gentle',
      explanation_approach: 'step_by_step',
      questioning_style: 'direct',
      patience_level: 'high'
    },
    subject_specialties: ['elementary math', 'reading', 'language learning', 'basic skills'],
    age_groups: ['elementary', 'middle school', 'remedial'],
    teaching_methods: ['scaffolding', 'repetition', 'positive reinforcement']
  },
  {
    id: 'tech_expert',
    name: 'Dev (Tech Expert)',
    description: 'Technical expert who explains complex concepts clearly',
    characteristics: {
      formality: 'casual',
      encouragement_style: 'matter_of_fact',
      explanation_approach: 'big_picture',
      questioning_style: 'direct',
      patience_level: 'adaptive'
    },
    subject_specialties: ['programming', 'computer science', 'technology', 'engineering'],
    age_groups: ['high school', 'college', 'professional'],
    teaching_methods: ['hands-on', 'project-based', 'debugging']
  },
  {
    id: 'creative_mentor',
    name: 'Luna (Creative Mentor)',
    description: 'Imaginative tutor who uses creativity and storytelling',
    characteristics: {
      formality: 'friendly',
      encouragement_style: 'enthusiastic',
      explanation_approach: 'example_driven',
      questioning_style: 'guided_discovery',
      patience_level: 'high'
    },
    subject_specialties: ['art', 'creative writing', 'literature', 'design'],
    age_groups: ['elementary', 'middle school', 'high school'],
    teaching_methods: ['storytelling', 'visualization', 'creative expression']
  }
]

// Tutoring strategies
export const TUTORING_STRATEGIES: TutoringStrategy[] = [
  {
    id: 'scaffolding',
    name: 'Scaffolding',
    description: 'Provide temporary support that is gradually removed as understanding increases',
    applicableScenarios: ['struggling student', 'complex concept', 'building on basics'],
    implementation: {
      initialApproach: 'Break complex problems into smaller, manageable steps',
      questioningTechnique: 'Guide through each step with leading questions',
      errorHandling: 'Identify the specific step where confusion occurs',
      assessmentMethod: 'Check understanding at each step before proceeding',
      adaptationTriggers: ['student confidence increases', 'consistent correct responses']
    }
  },
  {
    id: 'socratic_method',
    name: 'Socratic Method',
    description: 'Use questions to guide students to discover knowledge themselves',
    applicableScenarios: ['critical thinking', 'problem solving', 'concept development'],
    implementation: {
      initialApproach: 'Ask open-ended questions that probe understanding',
      questioningTechnique: 'Follow up with deeper questions based on responses',
      errorHandling: 'Use incorrect answers as springboards for learning',
      assessmentMethod: 'Evaluate the quality of reasoning in responses',
      adaptationTriggers: ['student demonstrates independent thinking', 'reaches insights']
    }
  },
  {
    id: 'analogical_reasoning',
    name: 'Analogical Reasoning',
    description: 'Use familiar concepts to explain unfamiliar ones through analogies',
    applicableScenarios: ['abstract concepts', 'difficult topics', 'initial introduction'],
    implementation: {
      initialApproach: 'Find relatable analogies from student\'s experience',
      questioningTechnique: 'Ask students to extend or apply the analogy',
      errorHandling: 'Refine analogies when they break down or confuse',
      assessmentMethod: 'Test if student can create their own analogies',
      adaptationTriggers: ['analogy becomes limiting', 'ready for technical terms']
    }
  },
  {
    id: 'worked_examples',
    name: 'Worked Examples',
    description: 'Demonstrate problem-solving through detailed examples',
    applicableScenarios: ['procedural learning', 'skill building', 'pattern recognition'],
    implementation: {
      initialApproach: 'Show complete solution with explanation at each step',
      questioningTechnique: 'Ask student to predict next steps or explain reasoning',
      errorHandling: 'Highlight common mistakes and how to avoid them',
      assessmentMethod: 'Have student solve similar problems independently',
      adaptationTriggers: ['student can follow reasoning', 'requests independent practice']
    }
  }
]

// Main intelligent tutoring system
export class IntelligentTutoringSystem {
  private conversations: Map<string, ConversationContext> = new Map()
  private tutorPersonalities: Map<string, TutorPersonality> = new Map()
  private strategies: Map<string, TutoringStrategy> = new Map()

  constructor() {
    // Initialize predefined personalities and strategies
    TUTOR_PERSONALITIES.forEach(personality => {
      this.tutorPersonalities.set(personality.id, personality)
    })
    
    TUTORING_STRATEGIES.forEach(strategy => {
      this.strategies.set(strategy.id, strategy)
    })
  }

  // Start a new tutoring conversation
  async startConversation(
    studentProfile: ConversationContext['studentProfile'],
    subject: string,
    learningObjectives: string[],
    tutorPersonalityId?: string
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Select appropriate tutor personality
    const tutorPersonality = tutorPersonalityId 
      ? this.tutorPersonalities.get(tutorPersonalityId)
      : this.selectOptimalTutor(subject, studentProfile)

    if (!tutorPersonality) {
      throw new Error('No suitable tutor personality found')
    }

    // Initialize conversation context
    const context: ConversationContext = {
      sessionId,
      subject,
      learningObjectives,
      studentProfile,
      conversationHistory: [],
      tutorPersonality,
      sessionMetrics: {
        duration: 0,
        messagesExchanged: 0,
        topicsCovered: [],
        understandingLevel: 0.5, // Start at neutral
        engagementLevel: 0.5,
        conceptsMastered: [],
        areasNeedingWork: []
      }
    }

    this.conversations.set(sessionId, context)

    // Generate opening message
    const openingMessage = await this.generateOpeningMessage(context)
    
    return sessionId
  }

  // Continue conversation with student input
  async continueConversation(
    sessionId: string,
    studentMessage: string
  ): Promise<ConversationMessage> {
    const context = this.conversations.get(sessionId)
    if (!context) {
      throw new Error('Conversation session not found')
    }

    // Add student message to history
    const studentMsg: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'student',
      content: studentMessage,
      timestamp: new Date(),
      metadata: {
        subject: context.subject,
        topic: context.currentTopic,
        messageType: this.classifyStudentMessage(studentMessage),
        confidence: 0.8, // Will be improved with better analysis
        requires_followup: false
      }
    }

    context.conversationHistory.push(studentMsg)

    // Analyze student understanding and engagement
    const assessment = await this.assessStudentUnderstanding(context, studentMessage)
    
    // Update session metrics
    this.updateSessionMetrics(context, assessment)

    // Select appropriate tutoring strategy
    const strategy = this.selectTutoringStrategy(context, assessment)

    // Generate tutor response
    const tutorResponse = await this.generateTutorResponse(context, strategy, assessment)

    // Add tutor response to history
    context.conversationHistory.push(tutorResponse)
    context.sessionMetrics.messagesExchanged += 2

    // Update conversation context
    this.conversations.set(sessionId, context)

    return tutorResponse
  }

  // Generate opening message for conversation
  private async generateOpeningMessage(context: ConversationContext): Promise<ConversationMessage> {
    const personality = context.tutorPersonality
    const student = context.studentProfile

    const prompt = `You are ${personality.name}, a ${personality.description}.

Your personality traits:
- Formality: ${personality.characteristics.formality}
- Encouragement style: ${personality.characteristics.encouragement_style}
- Explanation approach: ${personality.characteristics.explanation_approach}
- Questioning style: ${personality.characteristics.questioning_style}
- Patience level: ${personality.characteristics.patience_level}

You're starting a tutoring session with ${student.name} on ${context.subject}.

Student profile:
- Level: ${student.level}
- Learning style: ${student.learningStyle}
- Interests: ${student.interests.join(', ')}
- Struggling areas: ${student.strugglingAreas.join(', ')}
- Strengths: ${student.strengths.join(', ')}

Learning objectives for this session:
${context.learningObjectives.map(obj => `- ${obj}`).join('\n')}

Generate a warm, welcoming opening message that:
1. Introduces yourself in character
2. Acknowledges the student's profile
3. Sets expectations for the session
4. Asks an engaging opening question related to the subject

Keep it conversational and match your personality traits. The message should be 2-3 sentences.`

    const response = await multiModelAI.generateContent({
      useCase: 'general_tutoring',
      userProfile: { subject: 'tutoring', level: 'expert', age_group: 'adult', use_case: 'personal' } as any,
      context: prompt,
      requestType: 'content',
      priority: 'medium',
      temperature: 0.7,
      maxTokens: 200
    })

    const openingMessage: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'tutor',
      content: response.content,
      timestamp: new Date(),
      metadata: {
        subject: context.subject,
        messageType: 'guidance',
        confidence: 0.9,
        requires_followup: true
      }
    }

    context.conversationHistory.push(openingMessage)
    return openingMessage
  }

  // Classify the type of student message
  private classifyStudentMessage(message: string): MessageType {
    const lowerMessage = message.toLowerCase()
    
    // Simple classification - can be enhanced with ML
    if (lowerMessage.includes('?') || lowerMessage.startsWith('what') || lowerMessage.startsWith('how') || lowerMessage.startsWith('why')) {
      return 'question'
    }
    
    if (lowerMessage.includes('yes') || lowerMessage.includes('no') || lowerMessage.includes('i think') || lowerMessage.includes('maybe')) {
      return 'assessment'
    }
    
    if (lowerMessage.includes('confused') || lowerMessage.includes("don't understand") || lowerMessage.includes('unclear')) {
      return 'clarification'
    }
    
    return 'question' // Default assumption
  }

  // Assess student understanding from their message
  private async assessStudentUnderstanding(
    context: ConversationContext,
    studentMessage: string
  ): Promise<LearningAssessment> {
    const recentHistory = context.conversationHistory.slice(-6) // Last 3 exchanges
    const conversationSummary = recentHistory.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n')

    const prompt = `Analyze this student's understanding based on their latest message in a tutoring conversation about ${context.subject}.

Recent conversation:
${conversationSummary}

Latest student message: "${studentMessage}"

Student profile:
- Level: ${context.studentProfile.level}
- Learning style: ${context.studentProfile.learningStyle}
- Known strengths: ${context.studentProfile.strengths.join(', ')}
- Struggling areas: ${context.studentProfile.strugglingAreas.join(', ')}

Provide a JSON assessment with:
{
  "conceptUnderstood": boolean,
  "confidence": number (0-1),
  "misconceptions": string[],
  "suggestedNextSteps": string[],
  "difficulty_adjustment": number (-2 to +2),
  "requires_practice": boolean,
  "ready_for_next_topic": boolean
}

Base your assessment on:
1. Accuracy of student responses
2. Use of appropriate terminology
3. Ability to apply concepts
4. Questions asked (show understanding gaps or curiosity)
5. Confidence expressed in responses`

    try {
      const response = await multiModelAI.generateContent({
        useCase: 'content_explanation',
        userProfile: { subject: 'analysis', level: 'expert', age_group: 'adult', use_case: 'personal' } as any,
        context: prompt,
        requestType: 'explanation',
        priority: 'medium',
        temperature: 0.3,
        maxTokens: 400
      })

      const assessment = JSON.parse(response.content)
      
      // Validate and provide defaults
      return {
        conceptUnderstood: assessment.conceptUnderstood ?? false,
        confidence: Math.max(0, Math.min(1, assessment.confidence ?? 0.5)),
        misconceptions: assessment.misconceptions ?? [],
        suggestedNextSteps: assessment.suggestedNextSteps ?? [],
        difficulty_adjustment: Math.max(-2, Math.min(2, assessment.difficulty_adjustment ?? 0)),
        requires_practice: assessment.requires_practice ?? false,
        ready_for_next_topic: assessment.ready_for_next_topic ?? false
      }
    } catch (error) {
      console.error('Error parsing assessment:', error)
      
      // Fallback assessment
      return {
        conceptUnderstood: false,
        confidence: 0.5,
        misconceptions: [],
        suggestedNextSteps: ['Continue with current approach'],
        difficulty_adjustment: 0,
        requires_practice: false,
        ready_for_next_topic: false
      }
    }
  }

  // Update session metrics based on assessment
  private updateSessionMetrics(context: ConversationContext, assessment: LearningAssessment): void {
    const metrics = context.sessionMetrics
    
    // Update understanding level (exponential moving average)
    metrics.understandingLevel = metrics.understandingLevel * 0.7 + assessment.confidence * 0.3
    
    // Update engagement level based on message quality and frequency
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1]
    const messageQuality = lastMessage.content.length > 20 ? 0.8 : 0.4 // Simple heuristic
    metrics.engagementLevel = metrics.engagementLevel * 0.8 + messageQuality * 0.2
    
    // Add to concepts mastered if understanding is high
    if (assessment.conceptUnderstood && assessment.confidence > 0.7 && context.currentTopic) {
      if (!metrics.conceptsMastered.includes(context.currentTopic)) {
        metrics.conceptsMastered.push(context.currentTopic)
      }
    }
    
    // Track areas needing work
    if (!assessment.conceptUnderstood && context.currentTopic) {
      if (!metrics.areasNeedingWork.includes(context.currentTopic)) {
        metrics.areasNeedingWork.push(context.currentTopic)
      }
    }
  }

  // Select appropriate tutoring strategy
  private selectTutoringStrategy(
    context: ConversationContext,
    assessment: LearningAssessment
  ): TutoringStrategy {
    // Strategy selection logic based on assessment and context
    if (!assessment.conceptUnderstood && assessment.confidence < 0.4) {
      // Student is struggling - use scaffolding
      return this.strategies.get('scaffolding')!
    }
    
    if (assessment.conceptUnderstood && assessment.confidence > 0.7) {
      // Student understands - use socratic method to deepen understanding
      return this.strategies.get('socratic_method')!
    }
    
    if (assessment.misconceptions.length > 0) {
      // Has misconceptions - use worked examples
      return this.strategies.get('worked_examples')!
    }
    
    // Default to analogical reasoning for initial explanations
    return this.strategies.get('analogical_reasoning')!
  }

  // Generate tutor response using selected strategy
  private async generateTutorResponse(
    context: ConversationContext,
    strategy: TutoringStrategy,
    assessment: LearningAssessment
  ): Promise<ConversationMessage> {
    const personality = context.tutorPersonality
    const student = context.studentProfile
    const lastStudentMessage = context.conversationHistory[context.conversationHistory.length - 1]

    let messageType: MessageType = 'explanation'
    if (assessment.requires_practice) messageType = 'assessment'
    if (assessment.confidence < 0.4) messageType = 'encouragement'

    const prompt = `You are ${personality.name}, continuing a tutoring conversation about ${context.subject}.

Your personality:
- ${personality.description}
- Formality: ${personality.characteristics.formality}
- Encouragement style: ${personality.characteristics.encouragement_style}
- Explanation approach: ${personality.characteristics.explanation_approach}

Current tutoring strategy: ${strategy.name}
Strategy description: ${strategy.description}
Implementation approach: ${strategy.implementation.initialApproach}

Student's last message: "${lastStudentMessage.content}"

Assessment of student understanding:
- Concept understood: ${assessment.conceptUnderstood}
- Confidence level: ${assessment.confidence}
- Misconceptions: ${assessment.misconceptions.join(', ') || 'None identified'}
- Ready for next topic: ${assessment.ready_for_next_topic}

Response requirements:
1. Address the student's message directly
2. Apply the ${strategy.name} strategy
3. Match your personality traits
4. ${messageType === 'encouragement' ? 'Provide encouragement and motivation' : ''}
5. ${messageType === 'assessment' ? 'Include a question to test understanding' : ''}
6. Keep response to 2-4 sentences
7. Be helpful and educational

Generate an appropriate response:`

    const response = await multiModelAI.generateContent({
      useCase: 'general_tutoring',
      userProfile: { subject: 'tutoring', level: 'expert', age_group: 'adult', use_case: 'personal' } as any,
      context: prompt,
      requestType: 'content',
      priority: 'medium',
      temperature: 0.7,
      maxTokens: 300
    })

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'tutor',
      content: response.content,
      timestamp: new Date(),
      metadata: {
        subject: context.subject,
        topic: context.currentTopic,
        messageType,
        confidence: 0.8,
        requires_followup: messageType === 'assessment',
        assessment_opportunity: messageType === 'assessment'
      }
    }
  }

  // Select optimal tutor based on subject and student profile
  private selectOptimalTutor(
    subject: string,
    studentProfile: ConversationContext['studentProfile']
  ): TutorPersonality {
    const candidates = Array.from(this.tutorPersonalities.values())
    
    // Score each tutor based on subject specialties and student profile
    const scoredTutors = candidates.map(tutor => {
      let score = 0
      
      // Subject specialty match
      if (tutor.subject_specialties.some(specialty => 
        subject.toLowerCase().includes(specialty.toLowerCase()) ||
        specialty.toLowerCase().includes(subject.toLowerCase())
      )) {
        score += 10
      }
      
      // Age group match
      if (tutor.age_groups.includes(studentProfile.level)) {
        score += 5
      }
      
      // Learning style compatibility (simplified)
      if (studentProfile.learningStyle === 'visual' && tutor.characteristics.explanation_approach === 'example_driven') {
        score += 3
      }
      if (studentProfile.learningStyle === 'analytical' && tutor.characteristics.questioning_style === 'socratic') {
        score += 3
      }
      
      return { tutor, score }
    })
    
    // Return highest scoring tutor
    scoredTutors.sort((a, b) => b.score - a.score)
    return scoredTutors[0].tutor
  }

  // Get conversation context
  getConversationContext(sessionId: string): ConversationContext | null {
    return this.conversations.get(sessionId) || null
  }

  // Get conversation history
  getConversationHistory(sessionId: string): ConversationMessage[] {
    const context = this.conversations.get(sessionId)
    return context ? context.conversationHistory : []
  }

  // Get session metrics
  getSessionMetrics(sessionId: string) {
    const context = this.conversations.get(sessionId)
    return context ? context.sessionMetrics : null
  }

  // End conversation and provide summary
  async endConversation(sessionId: string): Promise<{
    summary: string
    achievements: string[]
    recommendations: string[]
    sessionMetrics: ConversationContext['sessionMetrics']
  }> {
    const context = this.conversations.get(sessionId)
    if (!context) {
      throw new Error('Conversation session not found')
    }

    const summary = await this.generateSessionSummary(context)
    const achievements = this.generateAchievements(context)
    const recommendations = await this.generateRecommendations(context)

    // Clean up conversation
    this.conversations.delete(sessionId)

    return {
      summary,
      achievements,
      recommendations,
      sessionMetrics: context.sessionMetrics
    }
  }

  // Generate session summary
  private async generateSessionSummary(context: ConversationContext): Promise<string> {
    const messageCount = context.conversationHistory.length
    const topics = context.sessionMetrics.topicsCovered.join(', ')
    
    const prompt = `Generate a brief summary of this tutoring session:

Subject: ${context.subject}
Messages exchanged: ${messageCount}
Topics covered: ${topics || 'General discussion'}
Understanding level: ${(context.sessionMetrics.understandingLevel * 100).toFixed(0)}%
Engagement level: ${(context.sessionMetrics.engagementLevel * 100).toFixed(0)}%
Concepts mastered: ${context.sessionMetrics.conceptsMastered.join(', ') || 'None yet'}

Provide a 2-3 sentence summary of what was accomplished in this session.`

    const response = await multiModelAI.generateContent({
      useCase: 'general_tutoring',
      userProfile: { subject: 'tutoring', level: 'expert', age_group: 'adult', use_case: 'personal' } as any,
      context: prompt,
      requestType: 'content',
      priority: 'medium',
      temperature: 0.5,
      maxTokens: 150
    })

    return response.content
  }

  // Generate achievements for the session
  private generateAchievements(context: ConversationContext): string[] {
    const achievements: string[] = []
    
    if (context.sessionMetrics.conceptsMastered.length > 0) {
      achievements.push(`Mastered ${context.sessionMetrics.conceptsMastered.length} new concept(s)`)
    }
    
    if (context.sessionMetrics.understandingLevel > 0.7) {
      achievements.push('Demonstrated strong understanding of the topic')
    }
    
    if (context.sessionMetrics.engagementLevel > 0.7) {
      achievements.push('Maintained high engagement throughout the session')
    }
    
    if (context.sessionMetrics.messagesExchanged >= 10) {
      achievements.push('Participated actively in the learning conversation')
    }
    
    if (achievements.length === 0) {
      achievements.push('Participated in learning session')
    }
    
    return achievements
  }

  // Generate recommendations for future learning
  private async generateRecommendations(context: ConversationContext): Promise<string[]> {
    const areas = context.sessionMetrics.areasNeedingWork
    const mastered = context.sessionMetrics.conceptsMastered
    
    if (areas.length === 0 && mastered.length === 0) {
      return ['Continue exploring the subject to build understanding']
    }
    
    const recommendations: string[] = []
    
    if (areas.length > 0) {
      recommendations.push(`Review and practice: ${areas.join(', ')}`)
    }
    
    if (mastered.length > 0) {
      recommendations.push(`Build on your understanding of: ${mastered.join(', ')}`)
    }
    
    recommendations.push('Schedule regular practice sessions to reinforce learning')
    
    return recommendations
  }

  // Get available tutor personalities
  getTutorPersonalities(): TutorPersonality[] {
    return Array.from(this.tutorPersonalities.values())
  }

  // Get available tutoring strategies
  getTutoringStrategies(): TutoringStrategy[] {
    return Array.from(this.strategies.values())
  }
}

// Create and export singleton instance
export const intelligentTutoringSystem = new IntelligentTutoringSystem()