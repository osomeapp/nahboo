import { NextRequest, NextResponse } from 'next/server'
import { aiTutorClient } from '@/lib/ai-client'
import type { PersonalizedFeedbackRequest } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const body: PersonalizedFeedbackRequest = await request.json()

    // Validate required fields
    if (!body.userProfile || !body.question || !body.userAnswer || !body.correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile, question, userAnswer, correctAnswer' },
        { status: 400 }
      )
    }

    // Generate feedback using AI client
    const feedback = await aiTutorClient.generateFeedback(body)

    // Determine if answer was correct
    const isCorrect = body.userAnswer.toLowerCase().trim() === body.correctAnswer.toLowerCase().trim()

    return NextResponse.json({
      feedback,
      isCorrect,
      tutorPersonality: aiTutorClient.selectTutorPersonality(body.userProfile),
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI feedback generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    )
  }
}