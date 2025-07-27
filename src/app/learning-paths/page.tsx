// Learning Paths Page
// Main page for viewing recommendations and managing learning paths

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Target } from 'lucide-react'
import LearningPathRecommendations from '@/components/LearningPathRecommendations'
import LearningPathDashboard from '@/components/LearningPathDashboard'
import { useUserProfile } from '@/lib/store'

export default function LearningPathsPage() {
  const userProfile = useUserProfile()
  const [activeView, setActiveView] = useState<'dashboard' | 'recommendations'>('dashboard')

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">Please complete your onboarding to access personalized learning paths.</p>
        </div>
      </div>
    )
  }

  if (activeView === 'recommendations') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Learning Path Recommendations
                </h1>
                <p className="text-lg text-gray-600">
                  Discover personalized learning paths designed for your goals
                </p>
              </div>
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Target className="w-4 h-4 mr-2" />
                View Dashboard
              </button>
            </div>
          </div>

          {/* Recommendations */}
          <LearningPathRecommendations
            userId={userProfile.id}
            onPathSelect={(pathId) => {
              console.log('Path selected:', pathId)
              setActiveView('dashboard')
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Navigation */}
      <div className="fixed top-4 right-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveView('recommendations')}
          className="flex items-center px-4 py-2 bg-white shadow-lg rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Get Recommendations
        </motion.button>
      </div>

      {/* Dashboard */}
      <LearningPathDashboard userId={userProfile.id} />
    </div>
  )
}