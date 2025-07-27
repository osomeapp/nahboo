import { NextRequest, NextResponse } from 'next/server'
import { aiTutorClient } from '@/lib/ai-client'
import type { QuizGenerationRequest } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const body: QuizGenerationRequest = await request.json()

    // Validate required fields
    if (!body.userProfile || !body.topic || !body.questionCount) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile, topic, questionCount' },
        { status: 400 }
      )
    }

    // Validate question count
    if (body.questionCount < 1 || body.questionCount > 10) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Validate question types
    const validQuestionTypes = ['multiple_choice', 'true_false', 'short_answer']
    const invalidTypes = body.questionTypes.filter(type => !validQuestionTypes.includes(type))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid question types: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate quiz using AI client
    const questions = await aiTutorClient.generateQuizQuestions(body)

    return NextResponse.json({
      questions,
      tutorPersonality: aiTutorClient.selectTutorPersonality(body.userProfile),
      generatedAt: new Date().toISOString(),
      topic: body.topic,
      difficulty: body.difficulty
    })
  } catch (error) {
    console.error('AI quiz generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}