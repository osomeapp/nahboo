import { NextRequest, NextResponse } from 'next/server'
import { 
  learningStyleEngine, 
  type LearningStyleProfile,
  type LearningStyleType 
} from '@/lib/learning-style-engine'
import { multiModelAI, type UseCase } from '@/lib/multi-model-ai'
import type { UserProfile, ContentItem } from '@/types'

export const maxDuration = 30

interface ContentGenerationRequest {
  userId: string
  userProfile: UserProfile
  topic: string
  targetStyles?: LearningStyleType[]
  baseContent?: ContentItem
  generateAll?: boolean // Generate content for all learning styles
  contentLength?: 'short' | 'medium' | 'long'
  difficulty?: number
}

interface StyleContent {
  style: LearningStyleType
  content: ContentItem
  adaptationConfidence: number
  generationMetrics: {
    responseTime: number
    aiModel: string
    aiProvider: string
    tokensUsed: number
  }
}

interface ContentGenerationResponse {
  success: boolean
  action: 'generate_multi_modal_content'
  generatedContent: StyleContent[]
  userLearningStyle: LearningStyleProfile | null
  adaptationSummary: {
    primaryStyleContent: StyleContent | null
    secondaryStyleContent: StyleContent | null
    totalVariants: number
    optimalSequence: LearningStyleType[]
  }
  metadata: {
    topic: string
    userId: string
    generationTime: number
    stylesGenerated: LearningStyleType[]
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ContentGenerationRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.topic) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, topic' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Get or detect user's learning style
    let userStyleProfile = await learningStyleEngine.getLearningStyleProfile(body.userId)
    
    if (!userStyleProfile) {
      // Create basic learning style profile for new users
      userStyleProfile = await learningStyleEngine.detectLearningStyle(
        body.userId,
        body.userProfile,
        generateMockInteractionData(body.userId),
        generateMockPerformanceData(body.userId)
      )
    }

    // Determine which styles to generate content for
    const stylesToGenerate = determineTargetStyles(
      body.targetStyles,
      userStyleProfile,
      body.generateAll || false
    )

    // Generate content for each target style
    const generatedContent: StyleContent[] = []
    const useCase = determineUseCase(body.userProfile.subject)

    for (const style of stylesToGenerate) {
      try {
        const styleContent = await generateContentForStyle(
          style,
          useCase,
          body.userProfile,
          body.topic,
          body.baseContent,
          body.contentLength || 'medium',
          body.difficulty
        )

        generatedContent.push(styleContent)
      } catch (error) {
        console.warn(`Failed to generate content for ${style} style:`, error)
        
        // Add fallback content
        generatedContent.push({
          style,
          content: createFallbackContent(style, body.topic, body.userProfile),
          adaptationConfidence: 0.3,
          generationMetrics: {
            responseTime: 0,
            aiModel: 'fallback',
            aiProvider: 'openai',
            tokensUsed: 0
          }
        })
      }
    }

    // Create adaptation summary
    const adaptationSummary = createAdaptationSummary(generatedContent, userStyleProfile)

    const generationTime = Date.now() - startTime

    const response: ContentGenerationResponse = {
      success: true,
      action: 'generate_multi_modal_content',
      generatedContent,
      userLearningStyle: userStyleProfile,
      adaptationSummary,
      metadata: {
        topic: body.topic,
        userId: body.userId,
        generationTime,
        stylesGenerated: stylesToGenerate,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Multi-modal content generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate multi-modal content' },
      { status: 500 }
    )
  }
}

// Helper functions
function determineTargetStyles(
  targetStyles: LearningStyleType[] | undefined,
  userProfile: LearningStyleProfile,
  generateAll: boolean
): LearningStyleType[] {
  if (targetStyles && targetStyles.length > 0) {
    return targetStyles.filter(style => style !== 'multimodal')
  }

  if (generateAll) {
    return ['visual', 'auditory', 'kinesthetic', 'reading']
  }

  // Generate for primary style and potentially secondary style
  const styles: LearningStyleType[] = []
  
  if (userProfile.primaryStyle !== 'multimodal') {
    styles.push(userProfile.primaryStyle)
  } else {
    // For multimodal learners, pick top 2 styles
    const scores = [
      { style: 'visual' as const, score: userProfile.visualScore },
      { style: 'auditory' as const, score: userProfile.auditoryScore },
      { style: 'kinesthetic' as const, score: userProfile.kinestheticScore },
      { style: 'reading' as const, score: userProfile.readingScore }
    ].sort((a, b) => b.score - a.score)
    
    styles.push(scores[0].style, scores[1].style)
  }

  // Add secondary style if it's strong enough
  if (userProfile.secondaryStyle && 
      userProfile.secondaryStyle !== 'multimodal' &&
      !styles.includes(userProfile.secondaryStyle)) {
    styles.push(userProfile.secondaryStyle)
  }

  return styles
}

function determineUseCase(subject: string): UseCase {
  const subjectLower = subject.toLowerCase()
  
  if (subjectLower.includes('math')) return 'mathematics'
  if (subjectLower.includes('science') || subjectLower.includes('physics') || 
      subjectLower.includes('chemistry') || subjectLower.includes('biology')) return 'science'
  if (subjectLower.includes('program') || subjectLower.includes('code')) return 'programming'
  if (subjectLower.includes('writing') || subjectLower.includes('english')) return 'creative_writing'
  if (subjectLower.includes('history')) return 'history'
  if (subjectLower.includes('business')) return 'business'
  if (subjectLower.includes('language')) return 'language_learning'
  
  return 'general_tutoring'
}

async function generateContentForStyle(
  style: LearningStyleType,
  useCase: UseCase,
  userProfile: UserProfile,
  topic: string,
  baseContent?: ContentItem,
  contentLength: 'short' | 'medium' | 'long' = 'medium',
  difficulty?: number
): Promise<StyleContent> {
  const startTime = Date.now()

  const styleInstructions = getStyleInstructions(style, contentLength)
  const context = buildStyleContext(style, topic, styleInstructions, baseContent)

  // Determine optimal token count based on content length
  const maxTokens = {
    short: 800,
    medium: 1500,
    long: 2500
  }[contentLength]

  const aiResponse = await multiModelAI.generateContent({
    useCase,
    userProfile,
    context,
    requestType: 'content',
    priority: 'high',
    maxTokens,
    temperature: 0.7,
    fallbackRequired: true
  })

  const adaptedContent: ContentItem = {
    id: `generated-${style}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `${topic} (${getStyleDisplayName(style)} Approach)`,
    description: aiResponse.content,
    content_type: getOptimalContentType(style),
    difficulty: difficulty || calculateOptimalDifficulty(userProfile.level || 'beginner'),
    estimated_time: calculateEstimatedTime(contentLength, style),
    subject: userProfile.subject,
    metadata: {
      learningStyle: style,
      aiGenerated: true,
      aiModel: aiResponse.model,
      aiProvider: aiResponse.provider,
      styleOptimized: true,
      contentLength,
      adaptationApplied: `${style}_optimization`,
      generatedAt: new Date().toISOString(),
      ...getStyleSpecificMetadata(style)
    },
    created_at: new Date().toISOString()
  }

  return {
    style,
    content: adaptedContent,
    adaptationConfidence: aiResponse.confidence,
    generationMetrics: {
      responseTime: Date.now() - startTime,
      aiModel: aiResponse.model,
      aiProvider: aiResponse.provider,
      tokensUsed: aiResponse.tokensUsed
    }
  }
}

function getStyleInstructions(style: LearningStyleType, contentLength: string): string {
  const lengthModifier = {
    short: 'concise and focused',
    medium: 'comprehensive but accessible',
    long: 'detailed and thorough'
  }[contentLength]

  const instructions = {
    visual: `Create ${lengthModifier} content optimized for visual learners. Include:
- Rich visual descriptions and spatial relationships
- References to diagrams, charts, and images
- Color-coded information and visual metaphors
- Step-by-step visual process descriptions
- Suggestions for mind maps and visual organization`,

    auditory: `Create ${lengthModifier} content optimized for auditory learners. Include:
- Clear verbal explanations and dialogue
- Rhythm and sound patterns in text
- References to audio elements and discussions
- Verbal mnemonics and sound associations
- Instructions for reading aloud and listening exercises`,

    kinesthetic: `Create ${lengthModifier} content optimized for kinesthetic learners. Include:
- Hands-on activities and experiments
- Interactive exercises and simulations
- Movement-based learning suggestions
- Practice problems and real-world applications
- Physical manipulation and experiential learning`,

    reading: `Create ${lengthModifier} content optimized for reading/writing learners. Include:
- Detailed written explanations and structured text
- Bullet points and organized information
- Written exercises and note-taking suggestions
- Text-based summaries and key points
- Reading materials and written reflection prompts`,

    multimodal: `Create ${lengthModifier} content that incorporates multiple learning styles with:
- Visual, auditory, kinesthetic, and reading elements
- Varied presentation formats and approaches
- Multiple ways to engage with the material
- Flexible learning pathways and options`
  }

  return instructions[style] || instructions.multimodal
}

function buildStyleContext(
  style: LearningStyleType,
  topic: string,
  styleInstructions: string,
  baseContent?: ContentItem
): string {
  let context = `Topic: ${topic}\n\nLearning Style: ${getStyleDisplayName(style)}\n\n${styleInstructions}`

  if (baseContent) {
    context += `\n\nBase Content to Adapt:\n${baseContent.description}`
    context += `\n\nPlease adapt the above content specifically for ${style} learners while maintaining the core educational value.`
  } else {
    context += `\n\nPlease create new educational content about "${topic}" specifically designed for ${style} learners.`
  }

  return context
}

function getStyleDisplayName(style: LearningStyleType): string {
  const names = {
    visual: 'Visual',
    auditory: 'Auditory',
    kinesthetic: 'Kinesthetic',
    reading: 'Reading/Writing',
    multimodal: 'Multimodal'
  }
  return names[style]
}

function getOptimalContentType(style: LearningStyleType): ContentItem['content_type'] {
  const typeMapping = {
    visual: 'ai_lesson' as const,
    auditory: 'ai_lesson' as const,
    kinesthetic: 'interactive' as const,
    reading: 'text' as const,
    multimodal: 'ai_lesson' as const
  }
  
  return typeMapping[style]
}

function calculateOptimalDifficulty(level: string): number {
  const difficultyMapping = {
    beginner: 3,
    intermediate: 5,
    advanced: 7,
    expert: 8
  }
  
  return difficultyMapping[level as keyof typeof difficultyMapping] || 5
}

function calculateEstimatedTime(contentLength: string, style: LearningStyleType): number {
  const baseTime = {
    short: 5,
    medium: 10,
    long: 20
  }[contentLength]

  // Some learning styles typically take longer
  const styleMultiplier = {
    visual: 1.0,
    auditory: 1.2,
    kinesthetic: 1.5,
    reading: 0.8,
    multimodal: 1.3
  }[style]

  return Math.round(baseTime * styleMultiplier)
}

function getStyleSpecificMetadata(style: LearningStyleType) {
  const metadataMapping = {
    visual: {
      hasImages: true,
      visualEnhanced: true,
      diagramsIncluded: true,
      colorCoded: true,
      spatialContent: true
    },
    auditory: {
      hasAudio: true,
      audioNarration: true,
      musicalElements: true,
      rhymePatterns: true,
      verbalContent: true
    },
    kinesthetic: {
      interactiveElements: true,
      handsonActivities: true,
      movementBased: true,
      experimentalApproach: true,
      practicalApplication: true
    },
    reading: {
      detailedText: true,
      comprehensiveNotes: true,
      structuredContent: true,
      keywordHighlighting: true,
      textFocused: true
    },
    multimodal: {
      multipleFormats: true,
      variedApproaches: true,
      flexibleContent: true,
      comprehensiveStyle: true
    }
  }
  
  return metadataMapping[style] || {}
}

function createAdaptationSummary(
  generatedContent: StyleContent[],
  userProfile: LearningStyleProfile
) {
  const primaryStyle = userProfile.primaryStyle !== 'multimodal' ? 
    userProfile.primaryStyle : 
    Object.entries({
      visual: userProfile.visualScore,
      auditory: userProfile.auditoryScore,
      kinesthetic: userProfile.kinestheticScore,
      reading: userProfile.readingScore
    }).sort((a, b) => b[1] - a[1])[0][0] as LearningStyleType

  const primaryStyleContent = generatedContent.find(content => content.style === primaryStyle) || null
  
  const secondaryStyleContent = userProfile.secondaryStyle && userProfile.secondaryStyle !== 'multimodal' ?
    generatedContent.find(content => content.style === userProfile.secondaryStyle) || null :
    null

  // Create optimal sequence based on user preferences and content quality
  const optimalSequence = generatedContent
    .sort((a, b) => {
      // Sort by adaptation confidence and user style preference
      const aScore = a.adaptationConfidence * getUserStyleScore(a.style, userProfile)
      const bScore = b.adaptationConfidence * getUserStyleScore(b.style, userProfile)
      return bScore - aScore
    })
    .map(content => content.style)

  return {
    primaryStyleContent,
    secondaryStyleContent,
    totalVariants: generatedContent.length,
    optimalSequence
  }
}

function getUserStyleScore(style: LearningStyleType, profile: LearningStyleProfile): number {
  const scores = {
    visual: profile.visualScore,
    auditory: profile.auditoryScore,
    kinesthetic: profile.kinestheticScore,
    reading: profile.readingScore,
    multimodal: Math.max(profile.visualScore, profile.auditoryScore, profile.kinestheticScore, profile.readingScore)
  }
  
  return scores[style] || 0.5
}

function createFallbackContent(
  style: LearningStyleType,
  topic: string,
  userProfile: UserProfile
): ContentItem {
  const fallbackDescriptions = {
    visual: `📊 Visual Learning: ${topic}\n\nThis content is designed for visual learners with diagrams, charts, and visual aids to help you understand ${topic} through seeing and spatial relationships.`,
    auditory: `🎧 Auditory Learning: ${topic}\n\nThis content is designed for auditory learners with audio explanations, discussions, and verbal instructions to help you understand ${topic} through listening.`,
    kinesthetic: `🤲 Hands-on Learning: ${topic}\n\nThis content is designed for kinesthetic learners with interactive exercises, experiments, and hands-on activities to help you understand ${topic} through doing.`,
    reading: `📚 Reading & Writing: ${topic}\n\nThis content is designed for reading/writing learners with detailed text, structured notes, and written exercises to help you understand ${topic} through reading and writing.`,
    multimodal: `🧠 Multimodal Learning: ${topic}\n\nThis content combines visual, auditory, kinesthetic, and reading approaches to help you understand ${topic} through multiple learning styles.`
  }

  return {
    id: `fallback-${style}-${Date.now()}`,
    title: `${topic} (${getStyleDisplayName(style)} Fallback)`,
    description: fallbackDescriptions[style],
    content_type: getOptimalContentType(style),
    difficulty: calculateOptimalDifficulty(userProfile.level || 'beginner'),
    estimated_time: 5,
    subject: userProfile.subject,
    metadata: {
      learningStyle: style,
      aiGenerated: false,
      isFallback: true,
      styleOptimized: true,
      generatedAt: new Date().toISOString()
    },
    created_at: new Date().toISOString()
  }
}

// Mock data generators for testing
function generateMockInteractionData(userId: string): any[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `interaction_${i}`,
    userId,
    type: ['video_play', 'quiz_attempt', 'text_selection', 'image_view'][Math.floor(Math.random() * 4)],
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    content_type: ['video', 'quiz', 'text', 'interactive'][Math.floor(Math.random() * 4)],
    timeSpent: Math.floor(Math.random() * 600) + 30,
    success: Math.random() > 0.3,
    engagementLevel: Math.random(),
    scrollBehavior: {
      totalScrolls: Math.floor(Math.random() * 50),
      averageScrollSpeed: Math.random() * 2,
      scrollCompletionRate: Math.random()
    },
    clickPatterns: [],
    pauseEvents: []
  }))
}

function generateMockPerformanceData(userId: string): any[] {
  return Array.from({ length: 15 }, (_, i) => ({
    timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
    contentId: `content_${i % 8}`,
    difficultyLevel: Math.floor(Math.random() * 7) + 2,
    success: Math.random() > 0.25,
    attempts: Math.floor(Math.random() * 4) + 1,
    timeSpent: Math.floor(Math.random() * 400) + 60,
    score: Math.random(),
    contextFactors: {
      timeOfDay: 'afternoon',
      sessionDuration: Math.floor(Math.random() * 120) + 10,
      deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
      distractionLevel: Math.random() * 0.6
    }
  }))
}