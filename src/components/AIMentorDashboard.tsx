'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useAIMentorSystem, 
  useCrisisMonitoring, 
  useMentorPerformance 
} from '@/hooks/useAIMentorSystem'
import {
  type LearnerMentorProfile,
  type MentorProfile,
  type MentorSpecialty,
  type SessionType,
  type MentorshipSession
} from '@/lib/ai-mentor-system'

const AIMentorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mentorship' | 'analytics' | 'crisis'>('mentorship')
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null)
  const [sessionProgress, setSessionProgress] = useState<any>(null)
  
  const {
    currentMentorProfile,
    learnerProfile,
    activeSessions,
    careerGuidance,
    lifeGuidance,
    systemAnalytics,
    mentorRecommendations,
    isCreatingMentor,
    isGeneratingGuidance,
    isConductingSession,
    error,
    createMentorProfile,
    generateCareerGuidance,
    generateLifeGuidance,
    conductSessionWithProgress,
    getMentorRecommendations,
    clearError,
    hasMentorProfile,
    hasCareerGuidance,
    hasLifeGuidance,
    mentorEffectiveness,
    recentSessionMetrics,
    guidanceQuality
  } = useAIMentorSystem()

  const {
    crisisAlerts,
    isMonitoring,
    startCrisisMonitoring,
    respondToCrisis,
    dismissAlert,
    activeCrises,
    criticalCrises,
    averageResponseTime,
    resolutionRate
  } = useCrisisMonitoring()

  const {
    performanceData,
    isLoading: isLoadingPerformance,
    overallEffectiveness,
    sessionSuccessRate,
    learnerSatisfaction,
    crisisResponseRate
  } = useMentorPerformance(currentMentorProfile?.mentor_id)

  // Mock learner profile for demonstration
  const mockLearnerProfile: LearnerMentorProfile = {
    learner_id: 'learner_demo_001',
    age_group: 'young_adult',
    career_stage: 'early_career',
    primary_goals: ['career_exploration', 'skill_development', 'work_life_balance'],
    interests: ['technology', 'education', 'personal_growth'],
    personality_traits: {
      openness: 8,
      conscientiousness: 7,
      extraversion: 6,
      agreeableness: 8,
      neuroticism: 4,
      growth_mindset: 9,
      resilience: 7,
      self_awareness: 6
    },
    communication_preferences: {
      preferred_tone: 'friendly',
      interaction_style: 'structured',
      feedback_frequency: 'moderate',
      challenge_comfort: 'medium'
    },
    cultural_background: {
      primary_culture: 'North American',
      cultural_values: ['individual_achievement', 'work_life_balance', 'continuous_learning'],
      communication_norms: ['direct_communication', 'time_consciousness'],
      family_structure_influence: 'supportive_family',
      work_culture_preference: 'collaborative_environment'
    },
    learning_style: {
      primary_style: 'visual',
      processing_speed: 7,
      attention_span: 45,
      collaboration_preference: 'mixed'
    },
    life_context: {
      current_life_stage: 'early_professional',
      family_situation: 'single',
      geographic_location: 'Urban North America',
      economic_status: 'middle_class',
      health_considerations: [],
      time_availability: {
        hours_per_week: 10,
        preferred_times: ['evening', 'weekend'],
        flexibility: 'medium'
      }
    },
    mentor_preferences: {
      preferred_mentor_age_range: [30, 50],
      preferred_mentor_gender: 'no_preference',
      preferred_mentor_background: ['technology', 'education'],
      communication_style_preference: {
        formality_level: 'professional',
        response_length: 'detailed',
        questioning_style: 'exploratory',
        feedback_approach: 'constructive',
        motivation_technique: 'encouraging'
      },
      session_frequency_preference: 'biweekly'
    }
  }

  // Auto-start crisis monitoring
  useEffect(() => {
    const cleanup = startCrisisMonitoring()
    return cleanup
  }, [startCrisisMonitoring])

  // Auto-load mentor recommendations
  useEffect(() => {
    getMentorRecommendations(mockLearnerProfile)
  }, [getMentorRecommendations])

  const handleCreateMentor = async (specialty: MentorSpecialty) => {
    try {
      await createMentorProfile(specialty, mockLearnerProfile)
    } catch (error) {
      console.error('Error creating mentor:', error)
    }
  }

  const handleGenerateGuidance = async (type: 'career' | 'life') => {
    if (!currentMentorProfile) return
    
    try {
      if (type === 'career') {
        await generateCareerGuidance(mockLearnerProfile, currentMentorProfile)
      } else {
        await generateLifeGuidance(mockLearnerProfile, currentMentorProfile)
      }
    } catch (error) {
      console.error('Error generating guidance:', error)
    }
  }

  const handleConductSession = async (sessionType: SessionType, goal: string) => {
    if (!currentMentorProfile) return
    
    try {
      await conductSessionWithProgress(
        mockLearnerProfile,
        currentMentorProfile,
        sessionType,
        goal,
        (progress) => setSessionProgress(progress)
      )
    } catch (error) {
      console.error('Error conducting session:', error)
    }
  }

  const tabs = [
    { id: 'mentorship', label: 'AI Mentorship', icon: '🤖' },
    { id: 'analytics', label: 'Performance Analytics', icon: '📊' },
    { id: 'crisis', label: 'Crisis Monitoring', icon: '🚨' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Mentor System Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive career and life guidance with AI-powered mentoring and crisis support
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
            >
              <div className="flex justify-between items-center">
                <span>⚠️ {error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'crisis' && activeCrises > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeCrises}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'mentorship' && (
            <motion.div
              key="mentorship"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <MentorshipTab
                currentMentorProfile={currentMentorProfile}
                learnerProfile={mockLearnerProfile}
                activeSessions={activeSessions}
                careerGuidance={careerGuidance}
                lifeGuidance={lifeGuidance}
                mentorRecommendations={mentorRecommendations}
                isCreatingMentor={isCreatingMentor}
                isGeneratingGuidance={isGeneratingGuidance}
                isConductingSession={isConductingSession}
                sessionProgress={sessionProgress}
                hasMentorProfile={hasMentorProfile}
                hasCareerGuidance={hasCareerGuidance}
                hasLifeGuidance={hasLifeGuidance}
                mentorEffectiveness={mentorEffectiveness}
                recentSessionMetrics={recentSessionMetrics}
                guidanceQuality={guidanceQuality}
                onCreateMentor={handleCreateMentor}
                onGenerateGuidance={handleGenerateGuidance}
                onConductSession={handleConductSession}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <AnalyticsTab
                systemAnalytics={systemAnalytics}
                performanceData={performanceData}
                isLoadingPerformance={isLoadingPerformance}
                overallEffectiveness={overallEffectiveness}
                sessionSuccessRate={sessionSuccessRate}
                learnerSatisfaction={learnerSatisfaction}
                crisisResponseRate={crisisResponseRate}
                mentorEffectiveness={mentorEffectiveness}
                recentSessionMetrics={recentSessionMetrics}
              />
            </motion.div>
          )}

          {activeTab === 'crisis' && (
            <motion.div
              key="crisis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <CrisisTab
                crisisAlerts={crisisAlerts}
                isMonitoring={isMonitoring}
                activeCrises={activeCrises}
                criticalCrises={criticalCrises}
                averageResponseTime={averageResponseTime}
                resolutionRate={resolutionRate}
                onRespondToCrisis={respondToCrisis}
                onDismissAlert={dismissAlert}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Mentorship Tab Component
const MentorshipTab: React.FC<{
  currentMentorProfile: MentorProfile | null
  learnerProfile: LearnerMentorProfile
  activeSessions: MentorshipSession[]
  careerGuidance: any
  lifeGuidance: any
  mentorRecommendations: any[]
  isCreatingMentor: boolean
  isGeneratingGuidance: boolean
  isConductingSession: boolean
  sessionProgress: any
  hasMentorProfile: boolean
  hasCareerGuidance: boolean
  hasLifeGuidance: boolean
  mentorEffectiveness: any
  recentSessionMetrics: any
  guidanceQuality: any
  onCreateMentor: (specialty: MentorSpecialty) => void
  onGenerateGuidance: (type: 'career' | 'life') => void
  onConductSession: (sessionType: SessionType, goal: string) => void
}> = ({
  currentMentorProfile,
  learnerProfile,
  activeSessions,
  careerGuidance,
  lifeGuidance,
  mentorRecommendations,
  isCreatingMentor,
  isGeneratingGuidance,
  isConductingSession,
  sessionProgress,
  hasMentorProfile,
  hasCareerGuidance,
  hasLifeGuidance,
  mentorEffectiveness,
  recentSessionMetrics,
  guidanceQuality,
  onCreateMentor,
  onGenerateGuidance,
  onConductSession
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<MentorSpecialty>('career_counseling')
  const [sessionType, setSessionType] = useState<SessionType>('career_planning')
  const [sessionGoal, setSessionGoal] = useState('')

  const specialties: { value: MentorSpecialty; label: string; description: string }[] = [
    { value: 'career_counseling', label: 'Career Counseling', description: 'Professional development and career transitions' },
    { value: 'life_coaching', label: 'Life Coaching', description: 'Personal growth and life balance' },
    { value: 'academic_guidance', label: 'Academic Guidance', description: 'Educational planning and study strategies' },
    { value: 'entrepreneurship', label: 'Entrepreneurship', description: 'Business development and startup guidance' },
    { value: 'leadership_development', label: 'Leadership Development', description: 'Management and leadership skills' }
  ]

  const sessionTypes: { value: SessionType; label: string }[] = [
    { value: 'career_planning', label: 'Career Planning' },
    { value: 'goal_setting', label: 'Goal Setting' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'skill_assessment', label: 'Skill Assessment' },
    { value: 'progress_review', label: 'Progress Review' }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Mentor Creation & Selection */}
      <div className="space-y-6">
        {/* Mentor Creation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create AI Mentor
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mentor Specialty
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value as MentorSpecialty)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {specialties.map((specialty) => (
                  <option key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {specialties.find(s => s.value === selectedSpecialty)?.description}
              </p>
            </div>

            <button
              onClick={() => onCreateMentor(selectedSpecialty)}
              disabled={isCreatingMentor}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isCreatingMentor ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Mentor...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Create AI Mentor</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Mentor Profile */}
        {currentMentorProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Current Mentor
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">
                    {currentMentorProfile.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{currentMentorProfile.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {currentMentorProfile.specialty.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Experience:</span>
                  <span className="ml-2 font-medium">
                    {currentMentorProfile.experience_level.years_of_experience} years
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Rating:</span>
                  <span className="ml-2 font-medium">
                    {currentMentorProfile.experience_level.client_satisfaction_rating.toFixed(1)}/5.0
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 text-sm">Expertise:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentMentorProfile.expertise_areas.slice(0, 3).map((area, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mentor Recommendations */}
        {mentorRecommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended Mentors
            </h3>
            
            <div className="space-y-3">
              {mentorRecommendations.slice(0, 3).map((mentor, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{mentor.name}</h4>
                    <span className="text-sm text-green-600 font-medium">
                      {Math.round(mentor.match_score * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 capitalize mb-2">
                    {mentor.specialty.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mentor.match_reasons[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Middle Column - Guidance Generation */}
      <div className="space-y-6">
        {/* Guidance Generation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Guidance Generation
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={() => onGenerateGuidance('career')}
              disabled={!hasMentorProfile || isGeneratingGuidance}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGeneratingGuidance ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>💼</span>
                  <span>Generate Career Guidance</span>
                </>
              )}
            </button>

            <button
              onClick={() => onGenerateGuidance('life')}
              disabled={!hasMentorProfile || isGeneratingGuidance}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGeneratingGuidance ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>🌱</span>
                  <span>Generate Life Guidance</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Mentorship Session
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {sessionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Goal
              </label>
              <textarea
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                placeholder="Describe what you want to achieve in this session..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <button
              onClick={() => onConductSession(sessionType, sessionGoal)}
              disabled={!hasMentorProfile || !sessionGoal.trim() || isConductingSession}
              className="w-full bg-orange-600 text-white px-4 py-3 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConductingSession ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Conducting Session...</span>
                </>
              ) : (
                <>
                  <span>💬</span>
                  <span>Start Session</span>
                </>
              )}
            </button>
          </div>

          {/* Session Progress */}
          {sessionProgress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-orange-50 rounded-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-orange-800">
                  Session Progress: {sessionProgress.stage.replace('_', ' ')}
                </span>
                <span className="text-sm text-orange-600">
                  {sessionProgress.progress_percentage}%
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2 mb-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${sessionProgress.progress_percentage}%` }}
                />
              </div>
              <p className="text-xs text-orange-700">
                {sessionProgress.current_activity}
              </p>
              {sessionProgress.estimated_completion_time > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Est. completion: {Math.round(sessionProgress.estimated_completion_time / 1000)}s
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Guidance Quality Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Guidance Quality
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(guidanceQuality.careerGuidanceConfidence * 100)}%
              </div>
              <div className="text-xs text-gray-500">Career Confidence</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {guidanceQuality.careerRecommendationCount}
              </div>
              <div className="text-xs text-gray-500">Recommendations</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(guidanceQuality.lifeGuidanceCompleteness * 100)}%
              </div>
              <div className="text-xs text-gray-500">Life Guidance</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {guidanceQuality.progressTrackingDepth}
              </div>
              <div className="text-xs text-gray-500">Progress Tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Results & Analysis */}
      <div className="space-y-6">
        {/* Career Guidance Results */}
        {hasCareerGuidance && careerGuidance && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Career Guidance Analysis
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Recommended Career Paths</h4>
                <div className="space-y-2">
                  {careerGuidance.personalized_recommendations?.slice(0, 2).map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-medium text-blue-800 text-sm">{rec.career_path}</h5>
                        <span className="text-blue-600 text-xs font-medium">
                          {rec.match_percentage}% match
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">{rec.reasoning[0]}</p>
                      <p className="text-xs text-blue-600 mt-1">Timeline: {rec.timeline}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Key Strengths</h4>
                <div className="flex flex-wrap gap-1">
                  {careerGuidance.career_assessment?.strengths?.slice(0, 3).map((strength: any, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                    >
                      {strength.area} ({strength.score}/10)
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Development Areas</h4>
                <div className="space-y-1">
                  {careerGuidance.skill_gap_analysis?.skill_gaps?.slice(0, 2).map((gap: any, index: number) => (
                    <div key={index} className="text-xs text-gray-600">
                      • {gap.skill_name}: Gap of {gap.gap_size} levels
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Life Guidance Results */}
        {hasLifeGuidance && lifeGuidance && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Life Guidance Analysis
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Life Balance</h4>
                <div className="space-y-2">
                  {Object.entries(lifeGuidance.life_balance_assessment?.dimension_scores || {}).slice(0, 4).map(([dimension, score]: any) => (
                    <div key={dimension} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{dimension.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(score * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Wellness Recommendations</h4>
                <div className="space-y-2">
                  {lifeGuidance.wellness_recommendations?.slice(0, 2).map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800 text-sm">{rec.category}</h5>
                      <p className="text-xs text-green-700">{rec.recommendation}</p>
                      <span className="text-xs text-green-600 capitalize">Priority: {rec.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Sessions */}
        {activeSessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Sessions
            </h3>
            
            <div className="space-y-3">
              {activeSessions.slice(0, 3).map((session, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 text-sm capitalize">
                      {session.session_type.replace('_', ' ')}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(session.session_metadata.session_start).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{session.session_goal}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-600">
                      Quality: {session.session_metadata.session_quality_rating}/10
                    </span>
                    <span className="text-xs text-blue-600">
                      {session.action_items.length} action items
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Session Metrics Summary */}
            {recentSessionMetrics && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {recentSessionMetrics.averageQuality.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Quality</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {recentSessionMetrics.averageEngagement.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Engagement</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Analytics Tab Component
const AnalyticsTab: React.FC<{
  systemAnalytics: any
  performanceData: any
  isLoadingPerformance: boolean
  overallEffectiveness: number
  sessionSuccessRate: number
  learnerSatisfaction: number
  crisisResponseRate: number
  mentorEffectiveness: any
  recentSessionMetrics: any
}> = ({
  systemAnalytics,
  performanceData,
  isLoadingPerformance,
  overallEffectiveness,
  sessionSuccessRate,
  learnerSatisfaction,
  crisisResponseRate,
  mentorEffectiveness,
  recentSessionMetrics
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* System Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Overview
        </h3>
        
        {systemAnalytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {systemAnalytics.total_mentorship_sessions?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Total Sessions</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemAnalytics.active_mentors || '0'}
                </div>
                <div className="text-xs text-gray-500">Active Mentors</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {systemAnalytics.active_learners?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Active Learners</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {systemAnalytics.average_session_rating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-xs text-gray-500">Avg Rating</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium">
                  {Math.round((systemAnalytics.completion_rate || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(systemAnalytics.completion_rate || 0) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Learner Satisfaction</span>
                <span className="text-sm font-medium">
                  {Math.round((systemAnalytics.learner_satisfaction || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(systemAnalytics.learner_satisfaction || 0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
            Loading system analytics...
          </div>
        )}
      </div>

      {/* Mentor Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mentor Performance
        </h3>
        
        {isLoadingPerformance ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
            Loading performance data...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {overallEffectiveness.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Effectiveness</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(sessionSuccessRate * 100)}%
                </div>
                <div className="text-xs text-gray-500">Success Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(learnerSatisfaction * 100)}%
                </div>
                <div className="text-xs text-gray-500">Satisfaction</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(crisisResponseRate * 100)}%
                </div>
                <div className="text-xs text-gray-500">Crisis Response</div>
              </div>
            </div>

            {performanceData?.specialization_effectiveness && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Specialization Effectiveness</h4>
                <div className="space-y-2">
                  {Object.entries(performanceData.specialization_effectiveness).map(([specialty, effectiveness]: any) => (
                    <div key={specialty} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {specialty.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(effectiveness * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Engagement Metrics
        </h3>
        
        {systemAnalytics?.engagement_metrics ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Avg Sessions per Learner</span>
                <span className="text-sm font-medium">
                  {systemAnalytics.engagement_metrics.average_sessions_per_learner?.toFixed(1)}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Session Retention Rate</span>
                <span className="text-sm font-medium">
                  {Math.round((systemAnalytics.engagement_metrics.session_retention_rate || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(systemAnalytics.engagement_metrics.session_retention_rate || 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Avg Completion Time</span>
                <span className="text-sm font-medium">
                  {systemAnalytics.engagement_metrics.goal_completion_time_avg_days} days
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium">
                  {systemAnalytics.engagement_metrics.mentor_response_time_avg_hours?.toFixed(1)} hours
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No engagement data available
          </div>
        )}
      </div>

      {/* Specialty Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mentor Specialties
        </h3>
        
        {systemAnalytics?.mentor_specialties_distribution ? (
          <div className="space-y-3">
            {Object.entries(systemAnalytics.mentor_specialties_distribution).map(([specialty, percentage]: any) => (
              <div key={specialty}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 capitalize">
                    {specialty.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(percentage * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No specialty distribution data available
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Achievements
        </h3>
        
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800">Career Transitions</div>
            <div className="text-2xl font-bold text-green-600">
              {systemAnalytics?.successful_career_transitions || 0}
            </div>
            <div className="text-xs text-green-600">Successful transitions</div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Skill Development</div>
            <div className="text-2xl font-bold text-blue-600">
              {systemAnalytics?.skill_development_completions || 0}
            </div>
            <div className="text-xs text-blue-600">Completed programs</div>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-sm font-medium text-red-800">Crisis Interventions</div>
            <div className="text-2xl font-bold text-red-600">
              {systemAnalytics?.crisis_support_interventions || 0}
            </div>
            <div className="text-xs text-red-600">Successful interventions</div>
          </div>
        </div>
      </div>

      {/* Session Quality Trends */}
      {recentSessionMetrics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Session Quality Trends
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {recentSessionMetrics.averageQuality.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Avg Quality</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {recentSessionMetrics.averageEngagement.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Avg Engagement</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Total Duration</span>
                <span className="text-sm font-medium">
                  {Math.round(recentSessionMetrics.totalDuration / 60)} hours
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Action Items Created</span>
                <span className="text-sm font-medium">
                  {recentSessionMetrics.actionItemsCreated}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Crisis Tab Component
const CrisisTab: React.FC<{
  crisisAlerts: any[]
  isMonitoring: boolean
  activeCrises: number
  criticalCrises: number
  averageResponseTime: number
  resolutionRate: number
  onRespondToCrisis: (alertId: string, mentorId: string) => void
  onDismissAlert: (alertId: string) => void
}> = ({
  crisisAlerts,
  isMonitoring,
  activeCrises,
  criticalCrises,
  averageResponseTime,
  resolutionRate,
  onRespondToCrisis,
  onDismissAlert
}) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100'
      case 'responding': return 'text-orange-600 bg-orange-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Crisis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{activeCrises}</div>
          <div className="text-sm text-gray-500">Active Crises</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{criticalCrises}</div>
          <div className="text-sm text-gray-500">Critical Level</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {averageResponseTime.toFixed(1)}m
          </div>
          <div className="text-sm text-gray-500">Avg Response</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {Math.round(resolutionRate * 100)}%
          </div>
          <div className="text-sm text-gray-500">Resolution Rate</div>
        </div>
      </div>

      {/* Monitoring Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Crisis Monitoring System
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm">
          Continuous monitoring system for early detection of crisis situations. 
          The system analyzes user behavior patterns, communication sentiment, and engagement metrics 
          to identify learners who may need immediate support.
        </p>
      </div>

      {/* Crisis Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Crisis Alerts
        </h3>
        
        {crisisAlerts.length > 0 ? (
          <div className="space-y-4">
            {crisisAlerts.slice(0, 10).map((alert) => (
              <motion.div
                key={alert.alert_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-sm">
                          {alert.learner_id.slice(-3).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(alert.urgency_level)}`}>
                          {alert.urgency_level.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mt-1">
                        Learner {alert.learner_id}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(alert.detected_time).toLocaleString()}
                    </div>
                    {alert.response_time && (
                      <div className="text-xs text-green-600 mt-1">
                        Resolved in {alert.response_time}m
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {alert.description}
                </p>
                
                {alert.assigned_mentor && (
                  <div className="text-xs text-blue-600 mb-3">
                    Assigned to: {alert.assigned_mentor}
                  </div>
                )}
                
                {alert.status === 'active' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onRespondToCrisis(alert.alert_id, 'mentor_emergency_001')}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Respond
                    </button>
                    <button
                      onClick={() => onDismissAlert(alert.alert_id)}
                      className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">🛡️</div>
            <p>No crisis alerts detected</p>
            <p className="text-sm mt-1">The system is monitoring for potential issues</p>
          </div>
        )}
      </div>

      {/* Crisis Response Team */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Crisis Response Team
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-semibold">DR</span>
            </div>
            <h4 className="font-medium text-gray-900">Dr. Rodriguez</h4>
            <p className="text-sm text-gray-600">Crisis Specialist</p>
            <div className="text-xs text-green-600 mt-1">Available</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-semibold">MJ</span>
            </div>
            <h4 className="font-medium text-gray-900">Maria Johnson</h4>
            <p className="text-sm text-gray-600">Mental Health Counselor</p>
            <div className="text-xs text-blue-600 mt-1">Available</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 font-semibold">TC</span>
            </div>
            <h4 className="font-medium text-gray-900">Tom Chen</h4>
            <p className="text-sm text-gray-600">Emergency Coordinator</p>
            <div className="text-xs text-orange-600 mt-1">On Call</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIMentorDashboard