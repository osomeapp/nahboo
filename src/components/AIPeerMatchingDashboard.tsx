'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAIPeerMatching, { usePeerProfileManagement, useSessionManagement } from '@/hooks/useAIPeerMatching'
import type {
  PeerMatchingRequest,
  PeerMatch,
  CollaborativeSession
} from '@/lib/ai-peer-matching-system'

interface AIPeerMatchingDashboardProps {
  userId: string
  onSessionCreated?: (session: CollaborativeSession) => void
  onMatchingComplete?: (matches: PeerMatch[]) => void
}

export default function AIPeerMatchingDashboard({
  userId,
  onSessionCreated,
  onMatchingComplete
}: AIPeerMatchingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'matching' | 'profile' | 'sessions' | 'analytics'>('matching')
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [matchingProgress, setMatchingProgress] = useState<any>(null)

  const {
    availableMatches,
    currentSession,
    collaborationHistory,
    matchingAnalytics,
    sessionMonitoring,
    peerRecommendations,
    isSearchingMatches,
    isCreatingSession,
    isMonitoringSession,
    error,
    searchPeerMatchesWithProgress,
    createCollaborativeSession,
    endCollaborativeSession,
    getMatchingAnalytics,
    reportSessionIssue,
    provideSessionFeedback,
    clearError,
    hasMatches,
    hasActiveSession,
    matchingInsights,
    analyticsInsights,
    monitoringInsights
  } = useAIPeerMatching()

  const {
    profile,
    isDirty,
    updateProfile,
    saveProfile
  } = usePeerProfileManagement()

  const {
    sessions,
    activeSession,
    createSession,
    endSession
  } = useSessionManagement()

  const tabs = [
    { id: 'matching', label: 'Find Peers', icon: '🤝' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'sessions', label: 'Sessions', icon: '💬' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ]

  // Load analytics on mount
  useEffect(() => {
    getMatchingAnalytics()
  }, [getMatchingAnalytics])

  const handleSearchPeers = async (request: PeerMatchingRequest) => {
    try {
      setShowProgressModal(true)
      
      const matches = await searchPeerMatchesWithProgress(request, (progress) => {
        setMatchingProgress(progress)
      })
      
      setShowProgressModal(false)
      onMatchingComplete?.(matches)
    } catch (error) {
      setShowProgressModal(false)
      console.error('Error searching peers:', error)
    }
  }

  const handleCreateSession = async (match: PeerMatch) => {
    try {
      const session = await createCollaborativeSession({
        match_id: match.match_id,
        session_preferences: {
          activity_type: 'study_session',
          duration_minutes: 60,
          subject_focus: ['general'],
          learning_objectives: ['collaboration', 'knowledge_sharing'],
          session_format: 'structured'
        },
        participant_preferences: {
          communication_style: 'mixed',
          feedback_frequency: 'periodic',
          break_preferences: 'scheduled'
        }
      })
      
      onSessionCreated?.(session)
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI-Powered Peer Matching
          </h1>
          <p className="text-gray-600">
            Find compatible learning partners and collaborate effectively
          </p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'matching' && (
              <PeerMatchingTab
                availableMatches={availableMatches}
                isSearchingMatches={isSearchingMatches}
                hasMatches={hasMatches}
                matchingInsights={matchingInsights}
                onSearchPeers={handleSearchPeers}
                onCreateSession={handleCreateSession}
                isCreatingSession={isCreatingSession}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileManagementTab
                profile={profile}
                isDirty={isDirty}
                peerRecommendations={peerRecommendations}
                onUpdateProfile={updateProfile}
                onSaveProfile={saveProfile}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionManagementTab
                currentSession={currentSession}
                sessions={sessions}
                collaborationHistory={collaborationHistory}
                sessionMonitoring={sessionMonitoring}
                hasActiveSession={hasActiveSession}
                isMonitoringSession={isMonitoringSession}
                monitoringInsights={monitoringInsights}
                onEndSession={endCollaborativeSession}
                onReportIssue={reportSessionIssue}
                onProvideFeedback={provideSessionFeedback}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab
                matchingAnalytics={matchingAnalytics}
                analyticsInsights={analyticsInsights}
                collaborationHistory={collaborationHistory}
                onRefreshAnalytics={() => getMatchingAnalytics()}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress Modal */}
        <AnimatePresence>
          {showProgressModal && (
            <ProgressModal
              progress={matchingProgress}
              onClose={() => setShowProgressModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Peer Matching Tab Component
function PeerMatchingTab({
  availableMatches,
  isSearchingMatches,
  hasMatches,
  matchingInsights,
  onSearchPeers,
  onCreateSession,
  isCreatingSession
}: any) {
  const [searchCriteria, setSearchCriteria] = useState({
    activity_type: 'study_session',
    subject_focus: [''],
    desired_group_size: 2,
    session_duration_minutes: 60,
    difficulty_level: 5,
    urgency_level: 'medium'
  })

  const handleSearch = () => {
    const request: PeerMatchingRequest = {
      learner_id: 'current_user',
      matching_context: {
        activity_type: searchCriteria.activity_type as any,
        subject_focus: searchCriteria.subject_focus.filter(s => s.length > 0),
        desired_group_size: searchCriteria.desired_group_size,
        session_duration_minutes: searchCriteria.session_duration_minutes,
        difficulty_level: searchCriteria.difficulty_level,
        specific_skills_needed: [],
        learning_objectives: []
      },
      preferences: {
        prioritize_compatibility: true,
        allow_skill_mismatch: false,
        require_similar_goals: true,
        prefer_new_partners: false,
        urgency_level: searchCriteria.urgency_level as any
      },
      constraints: {
        timezone_requirements: [],
        language_requirements: ['en'],
        availability_window: {
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        excluded_user_ids: []
      }
    }
    
    onSearchPeers(request)
  }

  return (
    <div className="space-y-6">
      {/* Search Criteria */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Find Learning Partners
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type
            </label>
            <select
              value={searchCriteria.activity_type}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, activity_type: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="study_session">Study Session</option>
              <option value="project_collaboration">Project Collaboration</option>
              <option value="peer_teaching">Peer Teaching</option>
              <option value="discussion_group">Discussion Group</option>
              <option value="skill_practice">Skill Practice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Size
            </label>
            <select
              value={searchCriteria.desired_group_size}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, desired_group_size: parseInt(e.target.value) }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2}>Pair (2 people)</option>
              <option value={3}>Small Group (3 people)</option>
              <option value={4}>Medium Group (4 people)</option>
              <option value={5}>Large Group (5+ people)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration
            </label>
            <select
              value={searchCriteria.session_duration_minutes}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, session_duration_minutes: parseInt(e.target.value) }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={isSearchingMatches}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isSearchingMatches ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Find Peers</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Matching Insights */}
      {matchingInsights && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Matching Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(matchingInsights.bestMatchScore)}%
              </div>
              <div className="text-sm text-gray-600">Best Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(matchingInsights.averageCompatibility)}%
              </div>
              <div className="text-sm text-gray-600">Avg Compatibility</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {availableMatches.length}
              </div>
              <div className="text-sm text-gray-600">Available Matches</div>
            </div>
          </div>
        </div>
      )}

      {/* Available Matches */}
      {hasMatches && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compatible Learning Partners
          </h3>
          <div className="space-y-4">
            {availableMatches.map((match: PeerMatch) => (
              <MatchCard
                key={match.match_id}
                match={match}
                onCreateSession={onCreateSession}
                isCreatingSession={isCreatingSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Matches Message */}
      {!hasMatches && !isSearchingMatches && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready to Find Learning Partners?
          </h3>
          <p className="text-gray-600 mb-6">
            Use the search form above to find compatible peers for collaborative learning
          </p>
        </div>
      )}
    </div>
  )
}

// Match Card Component
function MatchCard({ match, onCreateSession, isCreatingSession }: any) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {match.matched_peers[0]?.user_id.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Learning Partner Match
              </h4>
              <p className="text-sm text-gray-600">
                {match.matching_confidence}% compatibility
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {match.matched_peers.map((peer: any) => (
              <span
                key={peer.user_id}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {peer.role_in_group}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            {expanded ? '▼' : '▶'}
          </button>
          <button
            onClick={() => onCreateSession(match)}
            disabled={isCreatingSession}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isCreatingSession ? 'Creating...' : 'Start Session'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Compatibility Analysis</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Learning Style:</span>
                    <span>{Math.round(match.compatibility_analysis?.dimension_scores?.learning_style_compatibility || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Goals Alignment:</span>
                    <span>{Math.round(match.compatibility_analysis?.dimension_scores?.goal_alignment || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Communication:</span>
                    <span>{Math.round(match.compatibility_analysis?.dimension_scores?.communication_style_match || 0)}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Success Prediction</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Learning Outcome:</span>
                    <span>{Math.round(match.success_prediction?.learning_outcome_prediction || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Satisfaction:</span>
                    <span>{Math.round(match.success_prediction?.satisfaction_prediction || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion:</span>
                    <span>{Math.round(match.success_prediction?.completion_probability || 0)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">Match Reasoning</h5>
              <p className="text-sm text-gray-600">{match.match_reasoning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Profile Management Tab Component
function ProfileManagementTab({
  profile,
  isDirty,
  peerRecommendations,
  onUpdateProfile,
  onSaveProfile
}: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Peer Matching Profile
          </h2>
          {isDirty && (
            <button
              onClick={onSaveProfile}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Save Changes
            </button>
          )}
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold mb-2">Profile Management</h3>
          <p>Customize your peer matching preferences and collaboration settings</p>
        </div>
      </div>

      {peerRecommendations && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personalized Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Compatibility Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {peerRecommendations.compatibility_recommendations?.slice(0, 3).map((rec: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Activity Suggestions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {peerRecommendations.activity_recommendations?.slice(0, 3).map((rec: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Session Management Tab Component
function SessionManagementTab({
  currentSession,
  sessions,
  collaborationHistory,
  sessionMonitoring,
  hasActiveSession,
  isMonitoringSession,
  monitoringInsights,
  onEndSession,
  onReportIssue,
  onProvideFeedback
}: any) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Active Session */}
      {hasActiveSession && currentSession && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Active Session
            </h2>
            <div className="flex items-center space-x-2">
              {isMonitoringSession && (
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Monitoring</span>
                </div>
              )}
              <button
                onClick={() => onEndSession(currentSession.session_id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                End Session
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentSession.participants.length}
              </div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor((Date.now() - new Date(currentSession.session_metadata.start_time).getTime()) / (1000 * 60))}m
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {monitoringInsights?.sessionHealth || 'Good'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>

          {sessionMonitoring && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Real-time Insights</h4>
              <div className="text-sm text-gray-600">
                Status: {sessionMonitoring.status} • Issues: {monitoringInsights?.issueCount || 0} • 
                Adaptations: {monitoringInsights?.adaptationCount || 0}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Session History
        </h3>
        
        {collaborationHistory.length > 0 ? (
          <div className="space-y-3">
            {collaborationHistory.slice(0, 5).map((session: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {session.activity_type.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {session.date} • {session.duration_minutes}min • {session.partners.length} partners
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600">
                    ⭐ {session.satisfaction_rating}/10
                  </div>
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                  >
                    Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No sessions yet. Start your first collaborative session!</p>
          </div>
        )}
      </div>

      {/* No Active Session */}
      {!hasActiveSession && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Active Session
          </h3>
          <p className="text-gray-600 mb-6">
            Find peers and start a collaborative learning session
          </p>
        </div>
      )}
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab({
  matchingAnalytics,
  analyticsInsights,
  collaborationHistory,
  onRefreshAnalytics
}: any) {
  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analyticsInsights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {Math.round(analyticsInsights.successRate * 100)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {analyticsInsights.networkSize}
            </div>
            <div className="text-sm text-gray-600">Network Size</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {Math.round(analyticsInsights.learningProgress)}%
            </div>
            <div className="text-sm text-gray-600">Learning Progress</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {analyticsInsights.collaborationTrend === 'positive' ? '📈' : '📊'}
            </div>
            <div className="text-sm text-gray-600">Trend</div>
          </div>
        </div>
      )}

      {/* Detailed Analytics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Collaboration Analytics
          </h2>
          <button
            onClick={onRefreshAnalytics}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Refresh
          </button>
        </div>
        
        {matchingAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Matching Success:</span>
                  <span className="font-medium">{Math.round(matchingAnalytics.matching_success_rate * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collaboration Effectiveness:</span>
                  <span className="font-medium">{matchingAnalytics.collaboration_effectiveness}/10</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Improvement Areas</h3>
              <ul className="space-y-1">
                {matchingAnalytics.improvement_areas?.slice(0, 3).map((area: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>Loading analytics data...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Progress Modal Component
function ProgressModal({ progress, onClose }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Finding Peer Matches
          </h3>
          
          {progress && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress_percentage}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600">
                {progress.current_activity}
              </p>
              
              {progress.candidates_found > 0 && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-600">
                      {progress.candidates_found}
                    </div>
                    <div className="text-gray-600">Candidates Found</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">
                      {Math.floor(progress.estimated_completion_time / 1000)}s
                    </div>
                    <div className="text-gray-600">Time Remaining</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}