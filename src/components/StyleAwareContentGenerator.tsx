'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserProfile, ContentItem } from '@/types'
import type { LearningStyleProfile } from '@/lib/learning-style-engine'
import { useLearningStyle, useStyleAwareContent } from '@/hooks/useLearningStyle'
import { multiModelAI, type UseCase } from '@/lib/multi-model-ai'

interface StyleAwareContentGeneratorProps {
  userProfile: UserProfile
  topic: string
  baseContent?: ContentItem
  onContentGenerated: (content: ContentItem[]) => void
  className?: string
}

interface GeneratedContent {
  visual: ContentItem | null
  auditory: ContentItem | null
  kinesthetic: ContentItem | null
  reading: ContentItem | null
}

export default function StyleAwareContentGenerator({
  userProfile,
  topic,
  baseContent,
  onContentGenerated,
  className = ''
}: StyleAwareContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({
    visual: null,
    auditory: null,
    kinesthetic: null,
    reading: null
  })
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { profile, detectLearningStyle } = useLearningStyle()

  // Generate multi-modal content based on learning style
  const generateStyleBasedContent = useCallback(async () => {
    if (!userProfile || !topic) return

    setIsGenerating(true)
    setError(null)
    setProgress(0)

    try {
      // Ensure we have a learning style profile
      let styleProfile = profile
      if (!styleProfile) {
        await detectLearningStyle(userProfile.id || 'temp', userProfile)
        styleProfile = profile
      }

      if (!styleProfile) {
        throw new Error('Unable to detect learning style')
      }

      const useCase = determineUseCase(userProfile.subject)
      const contentVariants: GeneratedContent = {
        visual: null,
        auditory: null,
        kinesthetic: null,
        reading: null
      }

      // Generate content for each learning style (prioritize user's preferences)
      const styleOrder = getStylePriorityOrder(styleProfile)
      
      for (let i = 0; i < styleOrder.length; i++) {
        const style = styleOrder[i]
        setProgress((i / styleOrder.length) * 100)
        
        try {
          const content = await generateContentForStyle(
            style,
            useCase,
            userProfile,
            topic,
            baseContent
          )
          contentVariants[style] = content
        } catch (error) {
          console.warn(`Failed to generate ${style} content:`, error)
        }
      }

      setGeneratedContent(contentVariants)
      
      // Create adaptive content selection based on user's learning style
      const adaptiveContent = createAdaptiveContentSelection(contentVariants, styleProfile)
      onContentGenerated(adaptiveContent)
      
      setProgress(100)
    } catch (error) {
      console.error('Content generation failed:', error)
      setError(error instanceof Error ? error.message : 'Content generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [userProfile, topic, baseContent, profile, detectLearningStyle, onContentGenerated])

  // Auto-generate content when inputs change
  useEffect(() => {
    if (userProfile && topic) {
      generateStyleBasedContent()
    }
  }, [generateStyleBasedContent])

  return (
    <motion.div 
      className={`style-aware-generator ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Generation Status */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800 font-medium">
                🧠 Generating personalized content...
              </span>
              <span className="text-blue-600 text-sm">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <p className="text-blue-700 text-sm mt-2">
              Adapting content format to your learning style...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={generateStyleBasedContent}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Content Preview */}
      {!isGenerating && Object.values(generatedContent).some(content => content !== null) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="generated-content-preview"
        >
          <h3 className="text-lg font-semibold mb-4">📚 Personalized Content Generated</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(generatedContent).map(([style, content]) => {
              if (!content) return null
              
              return (
                <ContentStyleCard
                  key={style}
                  style={style as keyof GeneratedContent}
                  content={content}
                  userProfile={userProfile}
                />
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Component for displaying content adapted to specific learning style
function ContentStyleCard({ 
  style, 
  content, 
  userProfile 
}: { 
  style: keyof GeneratedContent
  content: ContentItem
  userProfile: UserProfile 
}) {
  const styleInfo = {
    visual: { icon: '👁️', name: 'Visual', color: 'blue' },
    auditory: { icon: '👂', name: 'Auditory', color: 'green' },
    kinesthetic: { icon: '✋', name: 'Hands-on', color: 'orange' },
    reading: { icon: '📖', name: 'Reading', color: 'purple' }
  }

  const info = styleInfo[style]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 border-${info.color}-200 rounded-lg p-4 bg-${info.color}-50`}
    >
      <div className="flex items-center mb-2">
        <span className="text-xl mr-2">{info.icon}</span>
        <span className={`font-medium text-${info.color}-800`}>{info.name} Version</span>
      </div>
      
      <div className={`text-${info.color}-700 text-sm mb-3`}>
        {content.description}
      </div>
      
      {/* Content type indicator */}
      <div className="flex items-center justify-between">
        <span className={`inline-block px-2 py-1 rounded text-xs bg-${info.color}-200 text-${info.color}-800`}>
          {content.content_type}
        </span>
        <span className={`text-xs text-${info.color}-600`}>
          {getAdaptationDescription(style)}
        </span>
      </div>
    </motion.div>
  )
}

// Helper functions
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

function getStylePriorityOrder(profile: LearningStyleProfile): (keyof GeneratedContent)[] {
  const scores = [
    { style: 'visual' as const, score: profile.visualScore },
    { style: 'auditory' as const, score: profile.auditoryScore },
    { style: 'kinesthetic' as const, score: profile.kinestheticScore },
    { style: 'reading' as const, score: profile.readingScore }
  ]
  
  return scores
    .sort((a, b) => b.score - a.score)
    .map(item => item.style)
}

async function generateContentForStyle(
  style: keyof GeneratedContent,
  useCase: UseCase,
  userProfile: UserProfile,
  topic: string,
  baseContent?: ContentItem
): Promise<ContentItem> {
  const styleInstructions = {
    visual: 'Create content with rich visual descriptions, diagrams, charts, and image suggestions. Focus on spatial relationships and visual metaphors.',
    auditory: 'Create content optimized for listening with clear narration, dialogue, sound effects, and musical elements. Use rhythm and verbal patterns.',
    kinesthetic: 'Create interactive, hands-on content with exercises, experiments, simulations, and movement-based activities. Emphasize learning by doing.',
    reading: 'Create detailed text-based content with comprehensive written explanations, bullet points, structured notes, and reading materials.'
  }

  const context = `
Topic: ${topic}
Learning Style: ${style}
Style Instructions: ${styleInstructions[style]}
${baseContent ? `Base Content: ${baseContent.description}` : ''}

Please create educational content that is specifically optimized for ${style} learners.
`

  const response = await multiModelAI.generateContent({
    useCase,
    userProfile,
    context,
    requestType: 'content',
    priority: 'high',
    fallbackRequired: true
  })

  // Create content item with style-specific metadata
  const contentItem: ContentItem = {
    id: `generated-${style}-${Date.now()}`,
    title: `${topic} (${style.charAt(0).toUpperCase() + style.slice(1)} Style)`,
    description: response.content,
    content_type: getContentTypeForStyle(style),
    difficulty: userProfile.level === 'beginner' ? 3 : userProfile.level === 'intermediate' ? 5 : 7,
    estimated_time: 10,
    subject: userProfile.subject,
    metadata: {
      learningStyle: style,
      aiGenerated: true,
      aiModel: response.model,
      aiProvider: response.provider,
      styleOptimized: true,
      adaptationApplied: `${style}_optimization`,
      ...getStyleSpecificMetadata(style)
    }
  }

  return contentItem
}

function getContentTypeForStyle(style: keyof GeneratedContent): ContentItem['content_type'] {
  const typeMapping = {
    visual: 'ai_lesson' as const,
    auditory: 'ai_lesson' as const,
    kinesthetic: 'interactive' as const,
    reading: 'text' as const
  }
  
  return typeMapping[style]
}

function getStyleSpecificMetadata(style: keyof GeneratedContent) {
  const metadataMapping = {
    visual: {
      hasImages: true,
      visualEnhanced: true,
      diagramsIncluded: true,
      colorCoded: true
    },
    auditory: {
      hasAudio: true,
      audioNarration: true,
      musicalElements: true,
      rhymePatterns: true
    },
    kinesthetic: {
      interactiveElements: true,
      handsonActivities: true,
      movementBased: true,
      experimentalApproach: true
    },
    reading: {
      detailedText: true,
      comprehensiveNotes: true,
      structuredContent: true,
      keywordHighlighting: true
    }
  }
  
  return metadataMapping[style]
}

function createAdaptiveContentSelection(
  contentVariants: GeneratedContent,
  profile: LearningStyleProfile
): ContentItem[] {
  const adaptiveContent: ContentItem[] = []
  
  // Primary style content (highest score)
  const primaryStyle = profile.primaryStyle === 'multimodal' ? 
    Object.entries({
      visual: profile.visualScore,
      auditory: profile.auditoryScore,
      kinesthetic: profile.kinestheticScore,
      reading: profile.readingScore
    }).sort((a, b) => b[1] - a[1])[0][0] as keyof GeneratedContent :
    profile.primaryStyle as keyof GeneratedContent
  
  if (contentVariants[primaryStyle]) {
    adaptiveContent.push(contentVariants[primaryStyle]!)
  }
  
  // Secondary style content if user is multimodal or has strong secondary preferences
  if (profile.secondaryStyle && contentVariants[profile.secondaryStyle as keyof GeneratedContent]) {
    adaptiveContent.push(contentVariants[profile.secondaryStyle as keyof GeneratedContent]!)
  }
  
  // Add additional content based on confidence and variety preferences
  if (profile.preferences.prefersVariety > 0.6) {
    Object.entries(contentVariants).forEach(([style, content]) => {
      if (content && !adaptiveContent.includes(content)) {
        adaptiveContent.push(content)
      }
    })
  }
  
  return adaptiveContent
}

function getAdaptationDescription(style: keyof GeneratedContent): string {
  const descriptions = {
    visual: 'Enhanced with visuals',
    auditory: 'Audio-optimized',
    kinesthetic: 'Interactive approach',
    reading: 'Text-focused format'
  }
  
  return descriptions[style]
}