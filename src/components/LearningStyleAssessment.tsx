'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserProfile } from '@/types'
import { useLearningStyleAssessment } from '@/hooks/useLearningStyle'
import { getStyleIcon, getStyleColor, getStyleDescription, type LearningStyleType } from '@/lib/learning-style-engine'

interface LearningStyleAssessmentProps {
  userProfile: UserProfile
  onAssessmentComplete: (results: any) => void
  onSkip?: () => void
  className?: string
}

export default function LearningStyleAssessment({
  userProfile,
  onAssessmentComplete,
  onSkip,
  className = ''
}: LearningStyleAssessmentProps) {
  const [showIntro, setShowIntro] = useState(true)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  
  const {
    currentQuestion,
    totalQuestions,
    currentQuestionData,
    answers,
    isComplete,
    results,
    progress,
    answerQuestion,
    nextQuestion,
    resetAssessment,
    canProceed
  } = useLearningStyleAssessment()

  const handleAnswerSelection = useCallback((optionIndex: number) => {
    const questionId = currentQuestionData.id
    const selectedOption = currentQuestionData.options[optionIndex]
    
    // Record the selection
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption.text
    }))
    
    // Create style preferences object for the assessment hook
    const stylePreferences = {
      [selectedOption.style]: selectedOption.value
    }
    
    answerQuestion(questionId, stylePreferences)
    
    // Auto-advance after a short delay for better UX
    setTimeout(() => {
      nextQuestion()
    }, 600)
  }, [currentQuestionData, answerQuestion, nextQuestion])

  const handleComplete = useCallback(() => {
    if (results) {
      onAssessmentComplete({
        learningStyleResults: results,
        assessmentAnswers: selectedAnswers,
        assessmentMetadata: {
          completedAt: new Date().toISOString(),
          questionsAnswered: results.questionsAnswered,
          confidence: results.primaryStyle.confidence,
          isMultimodal: results.isMultimodal
        }
      })
    }
  }, [results, selectedAnswers, onAssessmentComplete])

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip()
    }
  }, [onSkip])

  const handleRestart = useCallback(() => {
    resetAssessment()
    setSelectedAnswers({})
    setShowIntro(true)
  }, [resetAssessment])

  // Introduction screen
  if (showIntro) {
    return (
      <motion.div 
        className={`learning-style-assessment ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <span className="text-6xl mb-4 block">🧠</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Discover Your Learning Style
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Help us personalize your learning experience! This quick 8-question assessment 
              will identify how you learn best, so we can adapt content to match your preferences.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-4">What you'll discover:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">👁️</div>
                <div className="font-medium text-blue-800">Visual</div>
                <div className="text-blue-600">Charts & diagrams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">👂</div>
                <div className="font-medium text-blue-800">Auditory</div>
                <div className="text-blue-600">Audio & discussion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">✋</div>
                <div className="font-medium text-blue-800">Kinesthetic</div>
                <div className="text-blue-600">Hands-on learning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📖</div>
                <div className="font-medium text-blue-800">Reading</div>
                <div className="text-blue-600">Text & notes</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowIntro(false)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Assessment (2 minutes)
            </button>
            {onSkip && (
              <button
                onClick={handleSkip}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Your responses help us create a better learning experience for you
          </p>
        </div>
      </motion.div>
    )
  }

  // Assessment complete - show results
  if (isComplete && results) {
    return (
      <motion.div 
        className={`learning-style-assessment ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <span className="text-6xl mb-4 block">🎉</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Learning Style Discovered!
            </h2>
          </div>

          {/* Primary Learning Style */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <span className="text-4xl mr-3">
                {getStyleIcon(results.primaryStyle.style)}
              </span>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900 capitalize">
                  {results.primaryStyle.style} Learner
                </h3>
                <p className="text-sm text-gray-600">
                  {results.primaryStyle.confidence === 'high' ? 'Strong preference' :
                   results.primaryStyle.confidence === 'medium' ? 'Moderate preference' : 
                   'Developing preference'}
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {getStyleDescription(results.primaryStyle.style)}
            </p>
            
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Style Strength</div>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${results.primaryStyle.score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(results.primaryStyle.score * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Style (if applicable) */}
          {results.secondaryStyle && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-800 mb-2">Secondary Style</h4>
              <div className="flex items-center">
                <span className="text-2xl mr-2">
                  {getStyleIcon(results.secondaryStyle.style)}
                </span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-700 capitalize">
                    {results.secondaryStyle.style}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(results.secondaryStyle.score * 100)}% preference
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multimodal Indicator */}
          {results.isMultimodal && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl mr-2">🌈</span>
                <span className="font-medium text-purple-800">Multimodal Learner</span>
              </div>
              <p className="text-sm text-purple-700">
                You benefit from multiple learning approaches! We'll provide varied content formats.
              </p>
            </div>
          )}

          {/* All Style Scores */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Your Learning Style Profile</h4>
            <div className="space-y-3">
              {Object.entries(results.scores).map(([style, score]) => (
                <LearningStyleBar
                  key={style}
                  style={style}
                  score={score as number}
                  isPrimary={style === results.primaryStyle.style}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continue with These Results
            </button>
            <button
              onClick={handleRestart}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retake Assessment
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Don't worry - you can always retake this assessment later in your settings
          </p>
        </div>
      </motion.div>
    )
  }

  // Assessment questions
  return (
    <motion.div 
      className={`learning-style-assessment ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress * 100)}% complete
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              {currentQuestionData.question}
            </h3>
            
            <div className="grid gap-3">
              {currentQuestionData.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestionData.id] === option.text
                
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelection(index)}
                    className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {getStyleIcon(option.style as LearningStyleType)}
                      </span>
                      <span className="font-medium">{option.text}</span>
                      {isSelected && (
                        <span className="ml-auto text-blue-600">✓</span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Skip Option */}
        {onSkip && (
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip learning style assessment →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Component for displaying learning style bars in results
function LearningStyleBar({ 
  style, 
  score, 
  isPrimary 
}: { 
  style: string
  score: number
  isPrimary: boolean 
}) {
  return (
    <div className="flex items-center">
      <div className="flex items-center w-20">
        <span className="text-lg mr-2">{getStyleIcon(style as any)}</span>
        <span className={`text-sm capitalize ${isPrimary ? 'font-semibold' : 'text-gray-600'}`}>
          {style}
        </span>
      </div>
      
      <div className="flex-1 mx-3">
        <div className="bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${isPrimary ? 'bg-blue-600' : 'bg-gray-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </div>
      </div>
      
      <span className={`text-sm w-12 text-right ${isPrimary ? 'font-semibold' : 'text-gray-500'}`}>
        {Math.round(score * 100)}%
      </span>
    </div>
  )
}