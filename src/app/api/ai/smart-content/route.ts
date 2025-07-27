import { NextRequest, NextResponse } from 'next/server'
import { generateAIContent } from '@/lib/multi-model-ai'
import type { UseCase } from '@/lib/multi-model-ai'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface SmartContentRequest {
  userProfile: UserProfile
  topic: string
  contentType?: 'content' | 'explanation' | 'planning'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  length?: 'short' | 'medium' | 'long'
}

export async function POST(request: NextRequest) {
  try {
    const body: SmartContentRequest = await request.json()

    if (!body.userProfile || !body.topic) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile, topic' },
        { status: 400 }
      )
    }

    // Determine use case based on subject and topic
    const useCase = determineUseCase(body.userProfile.subject, body.topic)
    
    // Build context with additional parameters
    let context = `Topic: ${body.topic}`
    
    if (body.difficulty) {
      context += `\nDifficulty: ${body.difficulty}`
    }
    
    if (body.length) {
      context += `\nLength: ${body.length}`
    }

    // Generate content using multi-model AI
    const response = await generateAIContent(
      useCase,
      body.userProfile,
      context,
      body.contentType || 'content'
    )

    return NextResponse.json({
      success: true,
      content: response.content,
      metadata: {
        useCase,
        model: response.model,
        provider: response.provider,
        confidence: response.confidence,
        responseTime: response.responseTime,
        tokensUsed: response.tokensUsed,
        fallbackUsed: response.fallbackUsed,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Smart content generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart content' },
      { status: 500 }
    )
  }
}

function determineUseCase(subject: string, topic: string): UseCase {
  const subjectLower = subject.toLowerCase()
  const topicLower = topic.toLowerCase()

  // Mathematical subjects
  if (subjectLower.includes('math') || subjectLower.includes('algebra') || 
      subjectLower.includes('calculus') || subjectLower.includes('geometry') ||
      topicLower.includes('equation') || topicLower.includes('formula')) {
    return 'mathematics'
  }

  // Science subjects
  if (subjectLower.includes('science') || subjectLower.includes('physics') ||
      subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
    return 'science'
  }

  // Programming and technology
  if (subjectLower.includes('programming') || subjectLower.includes('coding') ||
      subjectLower.includes('computer') || subjectLower.includes('software') ||
      topicLower.includes('code') || topicLower.includes('algorithm')) {
    return 'programming'
  }

  // Writing and language
  if (subjectLower.includes('writing') || subjectLower.includes('english') ||
      subjectLower.includes('literature') || topicLower.includes('essay') ||
      topicLower.includes('story') || topicLower.includes('creative')) {
    return 'creative_writing'
  }

  // Language learning
  if (subjectLower.includes('language') || subjectLower.includes('spanish') ||
      subjectLower.includes('french') || subjectLower.includes('german') ||
      subjectLower.includes('chinese') || subjectLower.includes('japanese')) {
    return 'language_learning'
  }

  // History
  if (subjectLower.includes('history') || topicLower.includes('historical') ||
      topicLower.includes('ancient') || topicLower.includes('war')) {
    return 'history'
  }

  // Philosophy
  if (subjectLower.includes('philosophy') || topicLower.includes('ethical') ||
      topicLower.includes('moral') || topicLower.includes('philosophical')) {
    return 'philosophy'
  }

  // Business
  if (subjectLower.includes('business') || subjectLower.includes('marketing') ||
      subjectLower.includes('finance') || subjectLower.includes('management')) {
    return 'business'
  }

  // Default to general tutoring
  return 'general_tutoring'
}