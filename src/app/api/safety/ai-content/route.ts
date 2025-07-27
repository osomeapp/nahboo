import { NextRequest, NextResponse } from 'next/server'
import { contentSafetyEngine } from '@/lib/content-safety-engine'
import { multiModelAI } from '@/lib/multi-model-ai'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface AISafetyRequest {
  content: string
  contentType: string
  context: {
    userProfile: UserProfile
    topic?: string
    generatedBy?: string
  }
  safetyLevel: 'minimal' | 'standard' | 'strict' | 'maximum'
}

interface AISafetyResponse {
  isSafe: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'urgent'
  violations: string[]
  recommendations: string[]
  filteredContent?: string
  confidence: number
  processingTime: number
  safetyAnalysis: {
    inappropriateContent: boolean
    ageInappropriate: boolean
    misinformation: boolean
    harmfulContent: boolean
    bias: boolean
    toxicity: number
    readabilityScore?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: AISafetyRequest = await request.json()

    if (!body.content || !body.contentType || !body.context?.userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: content, contentType, or userProfile' },
        { status: 400 }
      )
    }

    const { content, contentType, context, safetyLevel } = body
    const userProfile = context.userProfile

    // Multi-layered safety analysis
    const safetyResults = await Promise.all([
      // Layer 1: Content Safety Engine Analysis
      contentSafetyEngine.analyzeContent({
        id: `temp_${Date.now()}`,
        title: context.topic || 'AI Generated Content',
        description: content,
        type: contentType as any,
        subject: userProfile.subject,
        difficulty: 1,
        estimatedTime: undefined,
        metadata: { aiGenerated: true },
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }),

      // Layer 2: AI-Powered Safety Analysis
      analyzeContentWithAI(content, contentType, userProfile, safetyLevel),

      // Layer 3: Age-Specific Content Analysis
      analyzeAgeAppropriateness(content, userProfile.age_group, safetyLevel)
    ])

    const [engineResult, aiAnalysis, ageAnalysis] = safetyResults

    // Combine analysis results
    const combinedAnalysis = combineAnalysisResults(engineResult, aiAnalysis, ageAnalysis)

    // Determine if content is safe based on safety level and user profile
    const isSafe = determineSafety(combinedAnalysis, safetyLevel, userProfile)

    // Generate filtered content if needed
    let filteredContent = content
    if (!isSafe && combinedAnalysis.violations.length > 0) {
      filteredContent = await generateSafeAlternative(content, contentType, userProfile, combinedAnalysis.violations)
    }

    const processingTime = Date.now() - startTime

    const response: AISafetyResponse = {
      isSafe,
      riskLevel: combinedAnalysis.riskLevel,
      violations: combinedAnalysis.violations,
      recommendations: combinedAnalysis.recommendations,
      filteredContent: filteredContent !== content ? filteredContent : undefined,
      confidence: combinedAnalysis.confidence,
      processingTime,
      safetyAnalysis: {
        inappropriateContent: combinedAnalysis.inappropriateContent,
        ageInappropriate: combinedAnalysis.ageInappropriate,
        misinformation: combinedAnalysis.misinformation,
        harmfulContent: combinedAnalysis.harmfulContent,
        bias: combinedAnalysis.bias,
        toxicity: combinedAnalysis.toxicity,
        readabilityScore: combinedAnalysis.readabilityScore
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('AI content safety check failed:', error)
    
    // Fail closed - if we can't analyze, assume unsafe for children
    const failClosed = {
      isSafe: false,
      riskLevel: 'high' as const,
      violations: ['analysis_failed'],
      recommendations: ['Manual review required'],
      confidence: 0,
      processingTime: Date.now(),
      safetyAnalysis: {
        inappropriateContent: true,
        ageInappropriate: true,
        misinformation: false,
        harmfulContent: true,
        bias: false,
        toxicity: 0.8
      }
    }

    return NextResponse.json(failClosed, { status: 200 }) // Return 200 to allow graceful handling
  }
}

async function analyzeContentWithAI(
  content: string,
  contentType: string,
  userProfile: UserProfile,
  safetyLevel: string
): Promise<any> {
  try {
    const prompt = `
    Analyze this ${contentType} content for safety and appropriateness:

    Content: "${content}"

    User Profile:
    - Age Group: ${userProfile.age_group}
    - Subject: ${userProfile.subject}
    - Level: ${userProfile.level}

    Safety Level: ${safetyLevel}

    Evaluate for:
    1. Age appropriateness (especially for children/teens)
    2. Educational value and accuracy
    3. Inappropriate content (violence, explicit material, etc.)
    4. Misinformation or factual errors
    5. Bias or discriminatory content
    6. Emotional harm potential
    7. Reading level appropriateness

    Return JSON with:
    - riskLevel: "low" | "medium" | "high" | "urgent"
    - violations: array of specific issues found
    - toxicity: number 0-1 (0 = completely safe, 1 = very toxic)
    - recommendations: array of suggestions for improvement
    - inappropriateContent: boolean
    - ageInappropriate: boolean
    - misinformation: boolean
    - harmfulContent: boolean
    - bias: boolean
    - readabilityScore: number 1-10 (1 = very difficult, 10 = very easy)
    - confidence: number 0-1 for analysis confidence
    `

    const response = await multiModelAI.generateContent(prompt, 'safety_analysis', {
      response_format: 'json',
      max_tokens: 500
    })

    return JSON.parse(response.content)
  } catch (error) {
    console.error('AI safety analysis failed:', error)
    return {
      riskLevel: 'medium',
      violations: ['ai_analysis_failed'],
      toxicity: 0.5,
      recommendations: ['Manual review required'],
      inappropriateContent: false,
      ageInappropriate: false,
      misinformation: false,
      harmfulContent: false,
      bias: false,
      readabilityScore: 5,
      confidence: 0.1
    }
  }
}

async function analyzeAgeAppropriateness(
  content: string,
  ageGroup: UserProfile['age_group'],
  safetyLevel: string
): Promise<any> {
  const ageThresholds = {
    child: { maxToxicity: 0.1, minReadability: 7, strictKeywords: true },
    teen: { maxToxicity: 0.3, minReadability: 5, strictKeywords: false },
    adult: { maxToxicity: 0.8, minReadability: 1, strictKeywords: false }
  }

  const threshold = ageThresholds[ageGroup]
  
  // Simple keyword analysis for age-inappropriate content
  const inappropriateKeywords = {
    child: ['violence', 'death', 'war', 'scary', 'frightening', 'dangerous', 'weapon'],
    teen: ['explicit', 'graphic', 'adult content', 'mature'],
    adult: []
  }

  const keywords = inappropriateKeywords[ageGroup]
  const foundKeywords = keywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  )

  const violations = []
  if (foundKeywords.length > 0) {
    violations.push(`age_inappropriate_keywords: ${foundKeywords.join(', ')}`)
  }

  // Simple readability analysis (word complexity and sentence length)
  const words = content.split(/\s+/)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim())
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1)
  const complexWords = words.filter(word => word.length > 10).length
  const readabilityScore = Math.max(1, 10 - (avgWordsPerSentence / 5) - (complexWords / words.length * 10))

  if (readabilityScore < threshold.minReadability) {
    violations.push(`readability_too_complex: score ${readabilityScore.toFixed(1)}, required ${threshold.minReadability}`)
  }

  return {
    riskLevel: violations.length > 2 ? 'high' : violations.length > 0 ? 'medium' : 'low',
    violations,
    ageInappropriate: foundKeywords.length > 0,
    readabilityScore,
    confidence: 0.8
  }
}

function combineAnalysisResults(engineResult: any, aiAnalysis: any, ageAnalysis: any): any {
  const allViolations = [
    ...(engineResult.violations || []),
    ...(aiAnalysis.violations || []),
    ...(ageAnalysis.violations || [])
  ]

  const allRecommendations = [
    ...(engineResult.recommendations || []),
    ...(aiAnalysis.recommendations || [])
  ]

  // Determine highest risk level
  const riskLevels = ['low', 'medium', 'high', 'urgent']
  const riskValues = [engineResult.riskLevel, aiAnalysis.riskLevel, ageAnalysis.riskLevel]
    .map(level => riskLevels.indexOf(level))
  const maxRiskIndex = Math.max(...riskValues)
  const riskLevel = riskLevels[maxRiskIndex] || 'medium'

  return {
    riskLevel,
    violations: [...new Set(allViolations)], // Remove duplicates
    recommendations: [...new Set(allRecommendations)],
    inappropriateContent: engineResult.inappropriateContent || aiAnalysis.inappropriateContent,
    ageInappropriate: ageAnalysis.ageInappropriate || aiAnalysis.ageInappropriate,
    misinformation: aiAnalysis.misinformation || false,
    harmfulContent: engineResult.harmfulContent || aiAnalysis.harmfulContent,
    bias: aiAnalysis.bias || false,
    toxicity: Math.max(engineResult.toxicity || 0, aiAnalysis.toxicity || 0),
    readabilityScore: ageAnalysis.readabilityScore || aiAnalysis.readabilityScore || 5,
    confidence: Math.min(
      engineResult.confidence || 0.5,
      aiAnalysis.confidence || 0.5,
      ageAnalysis.confidence || 0.5
    )
  }
}

function determineSafety(
  analysis: any,
  safetyLevel: string,
  userProfile: UserProfile
): boolean {
  // Safety thresholds based on safety level and age group
  const safetyThresholds = {
    maximum: { maxToxicity: 0.05, maxViolations: 0, allowedRisks: [] },
    strict: { maxToxicity: 0.15, maxViolations: 1, allowedRisks: ['low'] },
    standard: { maxToxicity: 0.4, maxViolations: 2, allowedRisks: ['low', 'medium'] },
    minimal: { maxToxicity: 0.7, maxViolations: 5, allowedRisks: ['low', 'medium', 'high'] }
  }

  const threshold = safetyThresholds[safetyLevel as keyof typeof safetyThresholds] || safetyThresholds.standard

  // Additional restrictions for children
  if (userProfile.age_group === 'child') {
    threshold.maxToxicity = Math.min(threshold.maxToxicity, 0.1)
    threshold.maxViolations = Math.min(threshold.maxViolations, 1)
  }

  // Check if content passes safety thresholds
  const passesToxicity = analysis.toxicity <= threshold.maxToxicity
  const passesViolations = analysis.violations.length <= threshold.maxViolations
  const passesRiskLevel = threshold.allowedRisks.includes(analysis.riskLevel)
  const passesAgeCheck = !analysis.ageInappropriate || userProfile.age_group === 'adult'

  return passesToxicity && passesViolations && passesRiskLevel && passesAgeCheck
}

async function generateSafeAlternative(
  content: string,
  contentType: string,
  userProfile: UserProfile,
  violations: string[]
): Promise<string> {
  try {
    const prompt = `
    The following ${contentType} content has safety violations: ${violations.join(', ')}

    Original content: "${content}"

    User profile: Age ${userProfile.age_group}, Subject: ${userProfile.subject}, Level: ${userProfile.level}

    Generate a safer alternative that:
    1. Maintains the educational value
    2. Removes all inappropriate content
    3. Is age-appropriate for ${userProfile.age_group}
    4. Matches the user's learning level
    5. Stays relevant to the subject: ${userProfile.subject}

    Return only the improved content, nothing else.
    `

    const response = await multiModelAI.generateContent(prompt, 'content_generation', {
      max_tokens: 300
    })

    return response.content.trim()
  } catch (error) {
    console.error('Failed to generate safe alternative:', error)
    return `[Content has been filtered for safety. Original content contained: ${violations.join(', ')}]`
  }
}