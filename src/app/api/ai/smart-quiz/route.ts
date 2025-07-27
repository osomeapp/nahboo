import { NextRequest, NextResponse } from 'next/server'
import { generateSmartQuiz } from '@/lib/multi-model-ai'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface SmartQuizRequest {
  userProfile: UserProfile
  topic: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  questionCount?: number
  questionTypes?: string[]
  context?: string
}

export async function POST(request: NextRequest) {
  let body: SmartQuizRequest | undefined
  try {
    body = await request.json()

    if (!body.userProfile || !body.topic) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile, topic' },
        { status: 400 }
      )
    }

    // Validate question count
    const questionCount = Math.min(Math.max(body.questionCount || 5, 1), 10)

    // Build comprehensive context for quiz generation
    let context = `Generate a quiz on: ${body.topic}`
    
    if (body.difficulty) {
      context += `\nDifficulty level: ${body.difficulty}`
    }
    
    context += `\nNumber of questions: ${questionCount}`
    
    if (body.questionTypes && body.questionTypes.length > 0) {
      context += `\nQuestion types: ${body.questionTypes.join(', ')}`
    }
    
    if (body.context) {
      context += `\nAdditional context: ${body.context}`
    }

    context += `\n\nPlease format the quiz as JSON with the following structure:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "Question text",
      "type": "multiple_choice" | "true_false" | "short_answer",
      "options": ["option1", "option2", "option3", "option4"], // for multiple choice
      "correct_answer": "correct answer",
      "explanation": "Why this is correct",
      "points": 10,
      "difficulty": "beginner" | "intermediate" | "advanced"
    }
  ],
  "metadata": {
    "topic": "${body.topic}",
    "total_points": 50,
    "estimated_time": 5
  }
}`

    // Generate quiz using multi-model AI
    const response = await generateSmartQuiz(
      body.userProfile.subject,
      body.userProfile,
      context
    )

    // Try to parse the generated content as JSON
    let quizData
    try {
      // Extract JSON from response if it's wrapped in markdown or contains extra text
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : response.content
      quizData = JSON.parse(jsonString)
    } catch (parseError) {
      // If JSON parsing fails, return the raw content with a warning
      console.warn('Failed to parse quiz JSON, returning raw content:', parseError)
      quizData = {
        questions: [],
        raw_content: response.content,
        parsing_error: true
      }
    }

    return NextResponse.json({
      success: true,
      quiz: quizData,
      metadata: {
        model: response.model,
        provider: response.provider,
        confidence: response.confidence,
        responseTime: response.responseTime,
        tokensUsed: response.tokensUsed,
        fallbackUsed: response.fallbackUsed,
        generatedAt: new Date().toISOString(),
        requestedQuestionCount: questionCount,
        topic: body.topic,
        difficulty: body.difficulty || 'beginner'
      }
    })

  } catch (error) {
    console.error('Smart quiz generation error:', error)
    
    // Provide fallback quiz structure on error
    const fallbackQuiz = {
      questions: [
        {
          id: "fallback_1",
          question: `What is a key concept in ${body?.topic || 'this subject'}?`,
          type: "short_answer",
          correct_answer: "This is a fallback question - please try again",
          explanation: "This quiz could not be generated automatically.",
          points: 10,
          difficulty: body?.difficulty || "beginner"
        }
      ],
      metadata: {
        topic: body?.topic || "Unknown",
        total_points: 10,
        estimated_time: 2,
        fallback: true
      }
    }

    return NextResponse.json({
      success: false,
      quiz: fallbackQuiz,
      error: 'Failed to generate smart quiz',
      fallback: true
    }, { status: 200 }) // Return 200 with fallback content
  }
}