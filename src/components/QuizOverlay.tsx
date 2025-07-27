'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  CheckCircle, 
  Clock, 
  Award, 
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Bot,
  Loader,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import type { Quiz, QuizResults, UserProfile } from '@/types'
import { useQuizTracking } from '@/hooks/useAnalyticsTracking'
import { useDifficultyAdjustment, usePerformanceTracking } from '@/hooks/useDifficultyAdjustment'

interface QuizOverlayProps {
  quiz: Quiz
  isOpen: boolean
  onClose: () => void
  onComplete: (results: QuizResults) => void
  userProfile?: UserProfile
}

export default function QuizOverlay({ quiz, isOpen, onClose, onComplete, userProfile }: QuizOverlayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(quiz.time_limit || 0)
  const [startTime, setStartTime] = useState<number>(0)
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)
  const [attemptCount, setAttemptCount] = useState(1)
  
  // Analytics tracking
  const { startQuiz, completeQuiz, abandonQuiz } = useQuizTracking()
  
  // Difficulty adjustment integration
  const { 
    recommendation, 
    adaptedContent, 
    isAnalyzing,
    analyzeDifficulty,
    applyDifficultyAdjustment 
  } = useDifficultyAdjustment()
  
  const { recordPerformance, getRecentPerformance, getPerformanceMetrics } = usePerformanceTracking(
    userProfile?.id || 'anonymous'
  )

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const totalQuestions = quiz.questions.length
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1
  const hasAnsweredCurrent = userAnswers[currentQuestion?.id] !== undefined

  // Initialize timer when quiz opens
  useEffect(() => {
    if (isOpen && !showResults) {
      setStartTime(Date.now())
      startQuiz(quiz.id)
      if (quiz.time_limit) {
        setTimeRemaining(quiz.time_limit)
      }
    }
  }, [isOpen, quiz.time_limit, showResults, startQuiz, quiz.id])

  // Timer countdown
  useEffect(() => {
    if (!isOpen || showResults || !quiz.time_limit) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, showResults, quiz.time_limit])

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmitQuiz()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    const results: QuizResults = {
      quizId: quiz.id,
      score: 0,
      totalQuestions,
      correctAnswers: 0,
      timeSpent,
      answers: []
    }

    let totalPoints = 0
    let earnedPoints = 0

    quiz.questions.forEach((question) => {
      const userAnswer = userAnswers[question.id] || ''
      const isCorrect = userAnswer.toLowerCase() === question.correct_answer.toLowerCase()
      
      totalPoints += question.points
      if (isCorrect) {
        earnedPoints += question.points
        results.correctAnswers++
      }

      results.answers.push({
        questionId: question.id,
        userAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0
      })
    })

    results.score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    
    // Track quiz completion
    completeQuiz(quiz.id, totalQuestions, results.correctAnswers, userAnswers)
    
    // Record performance for difficulty adjustment
    if (userProfile) {
      // Default difficulty level based on quiz complexity
      const difficultyLevel = quiz.questions.length <= 3 ? 3 : 
                             quiz.questions.length <= 6 ? 5 : 7
      const elapsedTime = Date.now() - startTime
      
      recordPerformance(
        quiz.id,
        difficultyLevel,
        results.score >= 70, // Consider 70%+ as success
        attemptCount,
        elapsedTime / 1000, // Convert to seconds
        results.score / 100 // Convert to 0-1 scale
      )
      
      // Analyze if difficulty adjustment is needed
      setTimeout(() => {
        analyzeDifficulty(
          userProfile.id, 
          userProfile, 
          getRecentPerformance(),
          {
            currentSession: {
              duration: elapsedTime / 1000 / 60, // Convert to minutes
              quizzesAttempted: 1,
              helpRequested: 0,
              focusLevel: results.score >= 80 ? 0.8 : 0.6
            },
            environmentalFactors: {
              timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                        new Date().getHours() < 17 ? 'afternoon' : 'evening',
              deviceType: /Mobile|Android|iP(hone|od|ad)/.test(navigator.userAgent) ? 'mobile' : 'desktop'
            }
          }
        )
      }, 1000)
    }
    
    setQuizResults(results)
    setShowResults(true)
    onComplete(results)
    
    // Generate AI feedback if user profile is available
    if (userProfile && results.score < 100) {
      generateAIFeedback(results)
    }
  }

  const handleClose = () => {
    if (!showResults) {
      // Track quiz abandonment if not completed
      const questionsCompleted = Object.keys(userAnswers).length
      abandonQuiz(quiz.id, questionsCompleted, totalQuestions)
    }
    onClose()
  }

  // Generate AI feedback for incorrect answers
  const generateAIFeedback = async (results: QuizResults) => {
    if (!userProfile) return
    
    setIsGeneratingFeedback(true)
    
    // Find the first incorrect answer to provide feedback on
    const incorrectAnswer = results.answers.find(answer => !answer.isCorrect)
    if (!incorrectAnswer) {
      setIsGeneratingFeedback(false)
      return
    }
    
    const question = quiz.questions.find(q => q.id === incorrectAnswer.questionId)
    if (!question) {
      setIsGeneratingFeedback(false)
      return
    }
    
    try {
      const response = await fetch('/api/ai/personalized-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile,
          content: `Question: ${question.question}\nUser's answer: ${incorrectAnswer.userAnswer}\nCorrect answer: ${question.correct_answer}`,
          feedbackType: 'quiz_results',
          context: `This is feedback for a quiz question about ${quiz.title.replace('🤖 AI-Generated Quiz: ', '').replace('🤖 AI Quiz: ', '').replace('📝 Quiz: ', '')}`,
          performanceData: {
            score: results.score,
            attempts: 1,
            correctAnswers: results.correctAnswers,
            totalQuestions: results.totalQuestions
          }
        }),
      })

      const feedbackResult = await response.json()
      
      if (feedbackResult.success && feedbackResult.feedback) {
        setAiFeedback(feedbackResult.feedback)
      }
    } catch (error) {
      console.error('Failed to generate AI feedback:', error)
    } finally {
      setIsGeneratingFeedback(false)
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setShowResults(false)
    setTimeRemaining(quiz.time_limit || 0)
    setStartTime(Date.now())
    setQuizResults(null)
    setAiFeedback(null)
    setIsGeneratingFeedback(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🏆'
    if (score >= 70) return '👍'
    return '📚'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{quiz.title}</h2>
                {quiz.description && (
                  <p className="text-blue-100 mt-1">{quiz.description}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress and Timer */}
            {!showResults && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <div className="w-32 h-2 bg-white bg-opacity-20 rounded-full">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
                
                {quiz.time_limit && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className={timeRemaining <= 60 ? 'text-red-200' : ''}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {!showResults ? (
              /* Quiz Question */
              <motion.div
                key={currentQuestionIndex}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 leading-relaxed">
                    {currentQuestion.question}
                  </h3>
                  
                  {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'drag_drop') && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const isSelected = userAnswers[currentQuestion.id] === option
                        return (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAnswerSelect(option)}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'true_false' && (
                    <div className="space-y-3">
                      {['True', 'False'].map((option) => {
                        const isSelected = userAnswers[currentQuestion.id] === option
                        return (
                          <motion.button
                            key={option}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAnswerSelect(option)}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{option}</span>
                              {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'short_answer' && (
                    <textarea
                      value={userAnswers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none h-32"
                    />
                  )}
                </div>
              </motion.div>
            ) : (
              /* Quiz Results */
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-6"
              >
                <div className="space-y-4">
                  <div className="text-6xl">{getScoreEmoji(quizResults?.score || 0)}</div>
                  <h3 className="text-3xl font-bold text-gray-900">Quiz Complete!</h3>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(quizResults?.score || 0)}`}>
                          {quizResults?.score}%
                        </div>
                        <div className="text-sm text-gray-600">Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {quizResults?.correctAnswers}/{quizResults?.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-600">Correct</div>
                      </div>
                    </div>
                    
                    {/* Difficulty Recommendation */}
                    {recommendation && userProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="border-t pt-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Smart Difficulty Adjustment</span>
                          {isAnalyzing && <Loader className="w-4 h-4 animate-spin text-blue-500" />}
                        </div>
                        
                        {recommendation.adjustmentMagnitude > 0 && (
                          <div className={`p-3 rounded-lg ${
                            recommendation.recommendedLevel > (quiz.questions.length <= 3 ? 3 : quiz.questions.length <= 6 ? 5 : 7)
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-blue-50 border border-blue-200'
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              {recommendation.recommendedLevel > (quiz.questions.length <= 3 ? 3 : quiz.questions.length <= 6 ? 5 : 7) ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-blue-600" />
                              )}
                              <span className="text-sm font-medium">
                                {recommendation.recommendedLevel > (quiz.questions.length <= 3 ? 3 : quiz.questions.length <= 6 ? 5 : 7)
                                  ? 'Ready for More Challenge'
                                  : 'Adjusting for Better Learning'
                                }
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{recommendation.reasoning}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Confidence: {Math.round(recommendation.confidence * 100)}%
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                recommendation.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                recommendation.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {recommendation.urgency} priority
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {recommendation.adjustmentMagnitude === 0 && (
                          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-700">Perfect Difficulty Level</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">You're in the optimal learning zone!</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                    
                  <div className="flex justify-center space-x-8 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Time: {formatTime(quizResults?.timeSpent || 0)}</span>
                    </div>
                    {quiz.passing_score && (
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>
                          {(quizResults?.score || 0) >= quiz.passing_score ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Performance Message */}
                  <div className="text-gray-600">
                    {(quizResults?.score || 0) >= 90 && "Outstanding work! You've mastered this topic! 🌟"}
                    {(quizResults?.score || 0) >= 70 && (quizResults?.score || 0) < 90 && "Great job! You're on the right track! 👏"}
                    {(quizResults?.score || 0) < 70 && "Keep practicing! Review the material and try again. 📖"}
                  </div>

                  {/* AI Personalized Feedback */}
                  {userProfile && (quizResults?.score || 0) < 100 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-blue-900 mb-2">
                            Personalized AI Feedback for {userProfile.name}
                          </div>
                          {isGeneratingFeedback ? (
                            <div className="flex items-center space-x-2 text-blue-700">
                              <Loader className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Generating personalized feedback...</span>
                            </div>
                          ) : aiFeedback ? (
                            <div className="text-sm text-blue-800 leading-relaxed">
                              {aiFeedback}
                            </div>
                          ) : (
                            <div className="text-sm text-blue-700">
                              Great effort! Keep practicing to improve your understanding.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          {!showResults && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-sm text-gray-500">
                {Object.keys(userAnswers).length} of {totalQuestions} answered
              </span>

              <button
                onClick={handleNextQuestion}
                disabled={!hasAnsweredCurrent}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>{isLastQuestion ? 'Submit Quiz' : 'Next'}</span>
                {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {showResults && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleRestart}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>

              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Continue Learning
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}