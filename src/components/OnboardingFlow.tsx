'use client'

import { useCallback, useState } from 'react'
import { useOnboarding, useOnboardingActions, useAppActions } from '@/lib/store'
import LanguageNameScreen from './LanguageNameScreen'
import SubjectSelectionScreen from './SubjectSelectionScreen'
import LearningStyleAssessment from './LearningStyleAssessment'
import type { UserProfile } from '@/types'

interface OnboardingFlowProps {
  onComplete: (userProfile: UserProfile) => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const onboarding = useOnboarding()
  const { setStep, setData } = useOnboardingActions()
  const { setUserProfile } = useAppActions()
  const [error, setError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [learningStyleResults, setLearningStyleResults] = useState<any>(null)

  // Handle completion of language/name screen
  const handleLanguageNameComplete = useCallback((data: { name: string; language: string }) => {
    setData({ 
      name: data.name, 
      language: data.language 
    })
    setStep('subject_selection')
  }, [setData, setStep])

  // Handle subject selection completion
  const handleSubjectComplete = useCallback((subject: string) => {
    setData({ subject })
    setStep('learning_style_assessment')
  }, [setData, setStep])

  // Handle learning style assessment completion
  const handleLearningStyleComplete = useCallback((results: any) => {
    setLearningStyleResults(results)
    completeOnboarding(results)
  }, [])

  // Handle learning style assessment skip
  const handleLearningStyleSkip = useCallback(() => {
    completeOnboarding(null)
  }, [])

  // Complete the onboarding process
  const completeOnboarding = useCallback(async (styleResults: any) => {
    setIsCompleting(true)
    
    try {
      const userProfile: UserProfile = {
        id: crypto.randomUUID(), // In production, this would come from authentication
        name: onboarding.name,
        language: onboarding.language,
        subject: onboarding.subject || 'General',
        level: 'beginner', // Default level, could be determined by additional screening
        age_group: 'adult', // Default, could be determined by additional questions
        use_case: 'lifelong', // Default, could be determined by onboarding questions
        created_at: new Date().toISOString(),
        learning_style_profile: styleResults ? {
          primary_style: styleResults.learningStyleResults.primaryStyle.style,
          secondary_style: styleResults.learningStyleResults.secondaryStyle?.style,
          style_scores: styleResults.learningStyleResults.scores,
          confidence: styleResults.learningStyleResults.primaryStyle.confidence,
          is_multimodal: styleResults.learningStyleResults.isMultimodal,
          assessment_completed: true,
          assessment_date: styleResults.assessmentMetadata.completedAt
        } : {
          assessment_completed: false
        }
      }

      // Save learning style results if available
      if (styleResults) {
        try {
          await fetch('/api/learning-style/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userProfile.id,
              userProfile,
              action: 'detect',
              assessmentResults: styleResults.learningStyleResults
            })
          })
        } catch (error) {
          console.warn('Failed to save learning style results:', error)
          // Continue with onboarding even if saving fails
        }
      }

      setUserProfile(userProfile)
      setStep('completed')
      onComplete(userProfile)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding')
      setIsCompleting(false)
    }
  }, [onboarding.name, onboarding.language, onboarding.subject, setUserProfile, setStep, onComplete])

  // Handle back navigation from subject selection
  const handleBackToLanguage = useCallback(() => {
    setStep('language_name')
  }, [setStep])

  // Handle back navigation from learning style assessment
  const handleBackToSubject = useCallback(() => {
    setStep('subject_selection')
  }, [setStep])

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Onboarding Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setStep('language_name')
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Render appropriate screen based on current step
  switch (onboarding.step) {
    case 'language_name':
      return (
        <LanguageNameScreen 
          onComplete={handleLanguageNameComplete}
        />
      )
    
    case 'subject_selection':
      return (
        <SubjectSelectionScreen 
          userName={onboarding.name}
          onComplete={handleSubjectComplete}
          onBack={handleBackToLanguage}
          isLoading={false}
        />
      )
    
    case 'learning_style_assessment':
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
          <div className="w-full max-w-4xl">
            {/* Progress indicator */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
                <div className="w-12 h-0.5 bg-green-500"></div>
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
                <div className="w-12 h-0.5 bg-blue-500"></div>
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
              </div>
              <div className="flex items-center justify-center space-x-16 text-xs text-gray-600">
                <span>Profile</span>
                <span>Subject</span>
                <span>Learning Style</span>
              </div>
            </div>

            <LearningStyleAssessment
              userProfile={{
                id: 'temp',
                name: onboarding.name,
                subject: onboarding.subject || 'General'
              } as UserProfile}
              onAssessmentComplete={handleLearningStyleComplete}
              onSkip={handleLearningStyleSkip}
            />

            {/* Back button */}
            <div className="text-center mt-8">
              <button
                onClick={handleBackToSubject}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← Back to subject selection
              </button>
            </div>
          </div>
        </div>
      )
    
    default:
      // This case should not happen as 'completed' is handled by parent
      return null
  }
}