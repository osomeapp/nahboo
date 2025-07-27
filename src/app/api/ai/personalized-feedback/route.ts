import { NextRequest, NextResponse } from 'next/server'
import { generatePersonalizedFeedback } from '@/lib/multi-model-ai'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface PersonalizedFeedbackRequest {
  userProfile: UserProfile
  content: string
  feedbackType: 'quiz_results' | 'essay_review' | 'progress_assessment' | 'general_feedback'
  context?: string
  performanceData?: {
    score?: number
    timeSpent?: number
    attempts?: number
    correctAnswers?: number
    totalQuestions?: number
  }
}

export async function POST(request: NextRequest) {
  let body: PersonalizedFeedbackRequest | undefined
  try {
    body = await request.json()

    if (!body.userProfile || !body.content || !body.feedbackType) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile, content, feedbackType' },
        { status: 400 }
      )
    }

    // Validate feedback type
    const validFeedbackTypes = ['quiz_results', 'essay_review', 'progress_assessment', 'general_feedback']
    if (!validFeedbackTypes.includes(body.feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type', validTypes: validFeedbackTypes },
        { status: 400 }
      )
    }

    // Build comprehensive context for personalized feedback
    let context = `Provide personalized feedback for the following content:\n\n${body.content}`
    
    // Add feedback type specific instructions
    switch (body.feedbackType) {
      case 'quiz_results':
        context += `\n\nThis is feedback for quiz results. Focus on:`
        context += `\n- What the student did well`
        context += `\n- Areas for improvement`
        context += `\n- Specific study recommendations`
        context += `\n- Encouragement for continued learning`
        
        if (body.performanceData) {
          const { score, timeSpent, attempts, correctAnswers, totalQuestions } = body.performanceData
          context += `\n\nPerformance Data:`
          if (score !== undefined) context += `\n- Score: ${score}%`
          if (timeSpent) context += `\n- Time spent: ${timeSpent} seconds`
          if (attempts) context += `\n- Number of attempts: ${attempts}`
          if (correctAnswers && totalQuestions) {
            context += `\n- Correct answers: ${correctAnswers}/${totalQuestions}`
          }
        }
        break
        
      case 'essay_review':
        context += `\n\nThis is feedback for an essay or written work. Focus on:`
        context += `\n- Content quality and argument strength`
        context += `\n- Writing style and clarity`
        context += `\n- Structure and organization`
        context += `\n- Grammar and language use`
        context += `\n- Specific suggestions for improvement`
        break
        
      case 'progress_assessment':
        context += `\n\nThis is a progress assessment. Focus on:`
        context += `\n- Overall learning progress`
        context += `\n- Strengths and improvements made`
        context += `\n- Areas that need more attention`
        context += `\n- Next steps in the learning journey`
        break
        
      case 'general_feedback':
        context += `\n\nProvide general constructive feedback that is:`
        context += `\n- Encouraging and positive`
        context += `\n- Specific and actionable`
        context += `\n- Tailored to the student's level and goals`
        break
    }

    if (body.context) {
      context += `\n\nAdditional context: ${body.context}`
    }

    // Determine subject for appropriate use case
    const subject = body.userProfile.subject.toLowerCase()

    // Generate personalized feedback using multi-model AI
    const response = await generatePersonalizedFeedback(
      body.userProfile,
      context,
      subject
    )

    return NextResponse.json({
      success: true,
      feedback: response.content,
      metadata: {
        feedbackType: body.feedbackType,
        model: response.model,
        provider: response.provider,
        confidence: response.confidence,
        responseTime: response.responseTime,
        tokensUsed: response.tokensUsed,
        fallbackUsed: response.fallbackUsed,
        generatedAt: new Date().toISOString(),
        userLevel: body.userProfile.level,
        subject: body.userProfile.subject
      }
    })

  } catch (error) {
    console.error('Personalized feedback generation error:', error)
    
    // Provide fallback feedback on error
    const fallbackFeedback = generateFallbackFeedback(body?.feedbackType, body?.userProfile?.name)

    return NextResponse.json({
      success: false,
      feedback: fallbackFeedback,
      error: 'Failed to generate personalized feedback',
      fallback: true,
      metadata: {
        generatedAt: new Date().toISOString(),
        fallback: true
      }
    }, { status: 200 }) // Return 200 with fallback content
  }
}

function generateFallbackFeedback(feedbackType?: string, userName?: string): string {
  const name = userName || 'Student'
  
  switch (feedbackType) {
    case 'quiz_results':
      return `Great effort on the quiz, ${name}! Every attempt is a learning opportunity. Review the questions you found challenging and don't hesitate to revisit the material. Keep practicing and you'll continue to improve!`
      
    case 'essay_review':
      return `Thank you for your submission, ${name}. Your effort in expressing your thoughts is commendable. Consider reviewing your work for clarity and structure. Remember, good writing comes through practice and revision.`
      
    case 'progress_assessment':
      return `${name}, you're making progress in your learning journey! Stay consistent with your studies and don't be afraid to challenge yourself with new concepts. Every step forward counts.`
      
    case 'general_feedback':
    default:
      return `Keep up the good work, ${name}! Learning is a continuous process, and your dedication is the key to success. Stay curious and don't hesitate to ask questions when you need help.`
  }
}