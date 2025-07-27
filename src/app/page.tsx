'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useUserProfile } from '@/lib/store'
import OnboardingFlow from '@/components/OnboardingFlow'
import MagicalMainPage from '@/components/MagicalMainPage'
import AuthModal from '@/components/AuthModal'
import ClientWrapper from '@/components/ClientWrapper'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function Home() {
  const { isAuthenticated, isLoading, needsOnboarding, user } = useAuth()
  const userProfile = useUserProfile()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Handle authentication success
  const handleAuthSuccess = (authUser: any) => {
    setShowAuthModal(false)
    // If user needs onboarding, show it
    if (needsOnboarding) {
      setShowOnboarding(true)
    }
  }

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  // Show auth modal for unauthenticated users
  const handleShowAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <ErrorBoundary>
        <ClientWrapper>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your learning experience...</p>
            </div>
          </div>
        </ClientWrapper>
      </ErrorBoundary>
    )
  }

  // Show welcome screen for unauthenticated users
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <ClientWrapper>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Welcome Hero Section */}
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="max-w-2xl mx-auto text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to Your
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      Magical Learning Journey
                    </span>
                  </h1>
                  <p className="text-lg text-gray-600 mb-8">
                    Discover personalized learning experiences with AI-powered tutoring, 
                    interactive content, and progress tracking designed just for you.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => handleShowAuth('signup')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                  </button>
                  <button
                    onClick={() => handleShowAuth('signin')}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Sign In
                  </button>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                  ✨ AI-powered tutoring • 📱 Works on all devices • 🎯 Personalized content
                </div>
              </div>
            </div>

            {/* Auth Modal */}
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onAuthSuccess={handleAuthSuccess}
              initialMode={authMode}
            />
          </div>
        </ClientWrapper>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <ClientWrapper>
        {/* Show onboarding if user needs it */}
        {(showOnboarding || needsOnboarding) ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        ) : (
          <MagicalMainPage />
        )}
      </ClientWrapper>
    </ErrorBoundary>
  )
}
