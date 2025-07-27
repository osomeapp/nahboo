'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bot, 
  Loader, 
  RefreshCw, 
  MessageCircle, 
  Lightbulb,
  AlertCircle,
  User,
  Zap,
  Shield
} from 'lucide-react'
import type { UserProfile, Quiz } from '@/types'

interface AIQuizGeneratorProps {
  topic: string
  userProfile: UserProfile
  onQuizGenerated: (quiz: Quiz) => void
  onInteraction?: (action: string, data?: unknown) => void
  safetyContext?: {
    checkAIContent: (content: string, contentType: string, context: any) => Promise<boolean>
    safetyLevel: 'minimal' | 'standard' | 'strict' | 'maximum'
    isMonitored: boolean
  }
}

interface AIQuizMetadata {
  model: string
  provider: string
  confidence: number
  responseTime: number
  tokensUsed: number
  fallbackUsed: boolean
  useCase: string
}

export default function AIQuizGenerator({ 
  topic, 
  userProfile, 
  onQuizGenerated, 
  onInteraction,
  safetyContext 
}: AIQuizGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiMetadata, setAiMetadata] = useState<AIQuizMetadata | null>(null)
  const [questionCount, setQuestionCount] = useState(3)
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleGenerateQuiz = async () => {
    setIsGenerating(true)
    setError(null)
    onInteraction?.('ai_quiz_generate_start', { topic, questionCount })

    try {
      const response = await fetch('/api/ai/smart-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile,
          topic,
          difficulty: userProfile.level || 'beginner',
          questionCount,
          questionTypes: ['multiple_choice', 'true_false'],
          context: `Create a quiz for ${userProfile.name} who is studying ${userProfile.subject} at ${userProfile.level || 'beginner'} level.`
        }),
      })

      const result = await response.json()
      
      if (result.success && result.quiz && result.quiz.questions) {
        // Safety check for quiz content
        if (safetyContext?.checkAIContent) {
          const quizContent = result.quiz.questions.map((q: any) => 
            `${q.question} ${q.explanation || ''} ${(q.options || []).join(' ')}`
          ).join(' ')
          
          const isSafe = await safetyContext.checkAIContent(
            quizContent,
            'quiz',
            { userProfile, topic }
          )
          
          if (!isSafe) {
            setError('Quiz content filtered for safety. Please try a different topic.')
            onInteraction?.('ai_quiz_content_filtered', { 
              topic, 
              questionCount,
              safetyLevel: safetyContext.safetyLevel
            })
            return
          }
        }
        
        const aiQuiz: Quiz = {
          id: `ai-quiz-${Date.now()}`,
          title: `🤖 AI Quiz: ${topic}`,
          description: `Test your knowledge about ${topic} with questions personalized for your ${userProfile.level || 'beginner'} level.`,
          questions: result.quiz.questions.map((q: any, index: number) => ({
            id: q.id || `q-${index + 1}`,
            question: q.question,
            type: q.type || 'multiple_choice',
            options: q.options || [],
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            points: q.points || 10,
            difficulty: q.difficulty || userProfile.level || 'beginner'
          })),
          time_limit: questionCount * 90, // 90 seconds per question
          passing_score: 70,
          age_group: userProfile.age_group || 'all'
        }
        
        setAiMetadata(result.metadata)
        setHasGenerated(true)
        onQuizGenerated(aiQuiz)
        onInteraction?.('ai_quiz_generate_success', { 
          topic, 
          questionCount,
          model: result.metadata.model,
          provider: result.metadata.provider,
          safetyChecked: !!safetyContext?.checkAIContent
        })
      } else if (result.fallback) {
        // Handle fallback quiz
        const fallbackQuiz: Quiz = {
          id: `fallback-quiz-${Date.now()}`,
          title: `📝 Quiz: ${topic}`,
          description: `A practice quiz about ${topic}.`,
          questions: result.quiz.questions.map((q: any, index: number) => ({
            id: q.id || `q-${index + 1}`,
            question: q.question,
            type: q.type || 'short_answer',
            options: q.options || [],
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            points: q.points || 10,
            difficulty: q.difficulty || 'beginner'
          })),
          time_limit: questionCount * 90,
          passing_score: 70,
          age_group: userProfile.age_group || 'all'
        }
        
        setHasGenerated(true)
        onQuizGenerated(fallbackQuiz)
        setError('Quiz generated with fallback content')
      } else {
        throw new Error(result.error || 'Failed to generate quiz')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      onInteraction?.('ai_quiz_generate_error', { topic, error: errorMessage })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefresh = () => {
    setError(null)
    setHasGenerated(false)
    handleGenerateQuiz()
  }

  return (
    <div className="mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-green-900">
                {aiMetadata ? `${aiMetadata.provider === 'openai' ? 'GPT' : 'Claude'} Quiz Generator` : 'AI-Powered Quiz Generator'}
              </div>
              <div className="text-sm text-green-700 flex items-center space-x-2">
                <span>Adaptive assessment for {userProfile.name}</span>
                {aiMetadata && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {aiMetadata.provider === 'openai' ? 'OpenAI' : 'Claude'}
                  </span>
                )}
                {safetyContext?.isMonitored && (
                  <span className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    <span>Safe</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          {hasGenerated && (
            <button
              onClick={handleRefresh}
              disabled={isGenerating}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
              title="Generate new quiz"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* AI Model Information */}
        {aiMetadata && (
          <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-900 mb-1">
                  Quiz generated by {aiMetadata.provider === 'openai' ? 'OpenAI GPT-4o-mini' : `Claude ${aiMetadata.model.includes('sonnet') ? 'Sonnet' : 'Haiku'}`}
                </div>
                <div className="text-xs text-green-700 mb-2">
                  Intelligently selected based on your {aiMetadata.useCase} learning context
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {Math.round(aiMetadata.confidence * 100)}% confidence
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {aiMetadata.responseTime}ms
                  </span>
                  {aiMetadata.fallbackUsed && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Fallback used
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-[120px]">
          {!hasGenerated && !isGenerating && !error && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Ready for a quiz on {topic}?
              </h3>
              <p className="text-green-700 text-sm mb-4">
                I&apos;ll create personalized questions that match your {userProfile.level || 'beginner'} level and learning style.
              </p>
              
              {/* Question Count Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Number of questions:
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[3, 4, 5].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        questionCount === count
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleGenerateQuiz}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Generate My Quiz ⚡</span>
                </div>
              </motion.button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-green-700">
                Generating personalized questions using AI...
              </p>
              <p className="text-sm text-green-600 mt-2">
                Creating {questionCount} questions tailored for your {userProfile.level || 'beginner'} level
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Quiz generation failed
              </h3>
              <p className="text-red-700 text-sm mb-4">
                {error === 'AI service not configured' 
                  ? 'AI quiz generation is currently unavailable. Please check back later.'
                  : error
                }
              </p>
              <button
                onClick={handleGenerateQuiz}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {hasGenerated && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white bg-opacity-80 rounded-lg p-4 text-center"
            >
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Lightbulb className="w-6 h-6 text-green-500" />
                <span className="text-lg font-semibold text-green-900">
                  Your Quiz is Ready!
                </span>
              </div>
              <p className="text-green-700 mb-4">
                I&apos;ve created {questionCount} personalized questions about {topic} for your {userProfile.level || 'beginner'} level.
              </p>
              <div className="bg-green-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-green-800">
                  <div className="flex items-center justify-center space-x-4">
                    <span>📝 {questionCount} Questions</span>
                    <span>⏱️ {questionCount * 90}s Timer</span>
                    <span>🎯 70% to Pass</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-green-600">
                The quiz will open in a new overlay. Good luck! 🍀
              </p>
            </motion.div>
          )}
        </div>

        {/* Action Footer */}
        {hasGenerated && (
          <div className="mt-4 pt-3 border-t border-green-200 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-green-700">
              <div className="flex items-center space-x-1">
                <Bot className="w-4 h-4" />
                <span>AI-Generated</span>
              </div>
              {aiMetadata && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>by {aiMetadata.provider === 'openai' ? 'OpenAI' : 'Claude'}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-green-600">
              Personalized for {userProfile.level || 'beginner'} level
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}