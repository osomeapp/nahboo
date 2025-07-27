// Interactive Content Player
// Universal component for all interactive content types
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Pause, RotateCcw, Lightbulb, Target, Clock, 
  CheckCircle, AlertCircle, Code, Beaker, Layers,
  MousePointer, MonitorPlay, Book, Timer, Award,
  TrendingUp, BarChart3
} from 'lucide-react'
import type { UserProfile } from '@/types'
import {
  interactiveContentEngine,
  type InteractiveContent,
  type InteractionResult,
  type AssessmentResult,
  type Hint
} from '@/lib/interactive-content-engine'

// Import specialized content components
import CodingExercisePlayer from './interactive/CodingExercisePlayer'
import SimulationPlayer from './interactive/SimulationPlayer'
import DiagramLabelingPlayer from './interactive/DiagramLabelingPlayer'
import DragDropPlayer from './interactive/DragDropPlayer'
import VirtualLabPlayer from './interactive/VirtualLabPlayer'

interface InteractiveContentPlayerProps {
  userProfile: UserProfile
  learningContext: {
    currentTopic: string
    difficulty: number
    timeAvailable: number
    preferredInteractionType?: string
    learningObjectives: string[]
  }
  onComplete?: (result: AssessmentResult) => void
  onInteraction?: (action: string, data: any) => void
  className?: string
}

interface PlayerState {
  content: InteractiveContent | null
  isLoading: boolean
  error: string | null
  sessionStartTime: Date
  sessionDuration: number
  isPlaying: boolean
  isPaused: boolean
  progress: number
  hintsUsed: number
  attempts: number
  currentHint: Hint | null
}

export default function InteractiveContentPlayer({
  userProfile,
  learningContext,
  onComplete,
  onInteraction,
  className = ''
}: InteractiveContentPlayerProps) {
  const [state, setState] = useState<PlayerState>({
    content: null,
    isLoading: true,
    error: null,
    sessionStartTime: new Date(),
    sessionDuration: 0,
    isPlaying: false,
    isPaused: false,
    progress: 0,
    hintsUsed: 0,
    attempts: 0,
    currentHint: null
  })

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize content generation
  useEffect(() => {
    generateContent()
  }, [userProfile, learningContext])

  // Session timer
  useEffect(() => {
    if (state.isPlaying && !state.isPaused) {
      sessionTimerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          sessionDuration: Date.now() - prev.sessionStartTime.getTime()
        }))
      }, 1000)
    } else if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
      sessionTimerRef.current = null
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [state.isPlaying, state.isPaused])

  const generateContent = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const content = await interactiveContentEngine.generateInteractiveContent(
        userProfile,
        learningContext
      )
      
      setState(prev => ({
        ...prev,
        content,
        isLoading: false,
        sessionStartTime: new Date()
      }))
      
      onInteraction?.('content_generated', { 
        contentType: content.type,
        difficulty: content.difficulty 
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate content',
        isLoading: false
      }))
    }
  }

  const handleStart = () => {
    setState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      sessionStartTime: new Date()
    }))
    onInteraction?.('session_start', { contentId: state.content?.id })
  }

  const handlePause = () => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }))
    onInteraction?.('session_pause', { 
      duration: state.sessionDuration,
      progress: state.progress 
    })
  }

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      progress: 0,
      sessionDuration: 0,
      attempts: prev.attempts + 1,
      sessionStartTime: new Date()
    }))
    onInteraction?.('session_reset', { attempt: state.attempts + 1 })
  }

  const handleInteraction = async (interactionData: any) => {
    if (!state.content) return

    try {
      const result = await interactiveContentEngine.processInteraction(
        state.content.id,
        userProfile.id,
        {
          type: interactionData.type,
          data: interactionData.data,
          timestamp: Date.now(),
          sessionTime: state.sessionDuration
        }
      )

      // Update progress based on result
      setState(prev => ({
        ...prev,
        progress: Math.min(100, prev.progress + (result.isCorrect ? 20 : 5))
      }))

      // Handle adaptive response
      if (result.adaptiveResponse) {
        handleAdaptiveResponse(result.adaptiveResponse)
      }

      onInteraction?.('user_interaction', {
        ...interactionData,
        result: result.isCorrect,
        score: result.score
      })
    } catch (error) {
      console.error('Failed to process interaction:', error)
    }
  }

  const handleAdaptiveResponse = (response: any) => {
    if (response.type === 'hint') {
      setState(prev => ({ ...prev, currentHint: response }))
    } else if (response.type === 'break_suggestion') {
      // Show break suggestion UI
      onInteraction?.('break_suggested', response.data)
    }
  }

  const handleHintRequest = async () => {
    if (!state.content) return

    try {
      const hint = await interactiveContentEngine.getAdaptiveHint(
        state.content.id,
        userProfile.id,
        { progress: state.progress, duration: state.sessionDuration }
      )

      if (hint) {
        setState(prev => ({
          ...prev,
          currentHint: hint,
          hintsUsed: prev.hintsUsed + 1
        }))
        onInteraction?.('hint_requested', { hintId: hint.id })
      }
    } catch (error) {
      console.error('Failed to get hint:', error)
    }
  }

  const handleCompletion = async (submission: any) => {
    if (!state.content) return

    try {
      const assessment = await interactiveContentEngine.assessCompletion(
        state.content.id,
        userProfile.id,
        submission
      )

      setState(prev => ({ ...prev, isPlaying: false, progress: 100 }))
      onComplete?.(assessment)
      onInteraction?.('content_completed', {
        score: assessment.score,
        passed: assessment.passed,
        duration: state.sessionDuration,
        hintsUsed: state.hintsUsed,
        attempts: state.attempts + 1
      })
    } catch (error) {
      console.error('Failed to assess completion:', error)
    }
  }

  const dismissHint = () => {
    setState(prev => ({ ...prev, currentHint: null }))
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const getContentIcon = (type: InteractiveContent['type']) => {
    const icons = {
      coding_exercise: Code,
      simulation: MonitorPlay,
      diagram_labeling: Layers,
      drag_drop: MousePointer,
      virtual_lab: Beaker,
      interactive_story: Book
    }
    return icons[type] || Code
  }

  if (state.isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generating Interactive Content
          </h3>
          <p className="text-gray-600">
            Creating personalized {learningContext.currentTopic} activity...
          </p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Content Generation Failed
          </h3>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <button
            onClick={generateContent}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!state.content) return null

  const ContentIcon = getContentIcon(state.content.type)

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ContentIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{state.content.title}</h2>
              <p className="text-blue-100">{state.content.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Difficulty indicator */}
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span className="font-medium">
                Level {state.content.difficulty}/10
              </span>
            </div>
            
            {/* Time estimate */}
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                ~{state.content.estimatedTime} min
              </span>
            </div>
          </div>
        </div>

        {/* Progress and controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!state.isPlaying ? (
              <button
                onClick={handleStart}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>Start Activity</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {state.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  <span>{state.isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset</span>
                </button>
                
                <button
                  onClick={handleHintRequest}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Lightbulb className="w-5 h-5" />
                  <span>Hint ({state.hintsUsed})</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-6">
            {/* Session time */}
            <div className="flex items-center space-x-2">
              <Timer className="w-5 h-5" />
              <span className="font-medium">
                {formatDuration(state.sessionDuration)}
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">{state.progress}%</span>
            </div>

            {/* Attempts */}
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Attempt {state.attempts + 1}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {state.isPlaying && !state.isPaused && (
          <div className="p-6">
            {/* Learning objectives */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Learning Objectives</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                {state.content.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <p className="text-gray-700">{state.content.instructions}</p>
            </div>

            {/* Interactive Content Component */}
            <div className="min-h-[400px]">
              {state.content.type === 'coding_exercise' && (
                <CodingExercisePlayer
                  exercise={state.content as any}
                  userProfile={userProfile}
                  onInteraction={handleInteraction}
                  onComplete={handleCompletion}
                />
              )}
              
              {state.content.type === 'simulation' && (
                <SimulationPlayer
                  simulation={state.content as any}
                  userProfile={userProfile}
                  onInteraction={handleInteraction}
                  onComplete={handleCompletion}
                />
              )}
              
              {state.content.type === 'diagram_labeling' && (
                <DiagramLabelingPlayer
                  diagram={state.content as any}
                  userProfile={userProfile}
                  onInteraction={handleInteraction}
                  onComplete={handleCompletion}
                />
              )}
              
              {state.content.type === 'drag_drop' && (
                <DragDropPlayer
                  activity={state.content as any}
                  userProfile={userProfile}
                  onInteraction={handleInteraction}
                  onComplete={handleCompletion}
                />
              )}
              
              {state.content.type === 'virtual_lab' && (
                <VirtualLabPlayer
                  lab={state.content as any}
                  userProfile={userProfile}
                  onInteraction={handleInteraction}
                  onComplete={handleCompletion}
                />
              )}
            </div>
          </div>
        )}

        {!state.isPlaying && (
          <div className="p-6 text-center">
            <ContentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Begin?
            </h3>
            <p className="text-gray-600 mb-6">
              Click "Start Activity" to begin your interactive learning experience.
            </p>
          </div>
        )}

        {state.isPaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <Pause className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Activity Paused
              </h3>
              <p className="text-gray-600 mb-4">
                Click "Resume" to continue your learning session.
              </p>
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Resume Activity
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint Overlay */}
      <AnimatePresence>
        {state.currentHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4"
            >
              <div className="flex items-start space-x-3 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Helpful Hint</h3>
                  <p className="text-gray-700">{state.currentHint.content}</p>
                  
                  {state.currentHint.codeSnippet && (
                    <pre className="mt-3 p-3 bg-gray-100 rounded text-sm">
                      <code>{state.currentHint.codeSnippet}</code>
                    </pre>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={dismissHint}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={dismissHint}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}