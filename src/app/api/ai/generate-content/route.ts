import { NextRequest, NextResponse } from 'next/server'
import { aiTutorClient } from '@/lib/ai-client'
import type { ContentGenerationRequest } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const body: ContentGenerationRequest = await request.json()

    // Validate required fields
    if (!body.userProfile || !body.topic || !body.contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile, topic, contentType' },
        { status: 400 }
      )
    }

    // Validate content type
    const validContentTypes = ['lesson', 'explanation', 'example', 'exercise']
    if (!validContentTypes.includes(body.contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Generate content using AI client
    const content = await aiTutorClient.generateContent(body)

    return NextResponse.json({
      content,
      tutorPersonality: aiTutorClient.selectTutorPersonality(body.userProfile),
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI content generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}