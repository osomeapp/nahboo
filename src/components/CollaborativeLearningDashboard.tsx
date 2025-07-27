'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Network, 
  Target, 
  Settings, 
  Activity, 
  TrendingUp,
  MessageSquare,
  UserPlus,
  BarChart3,
  Lightbulb,
  Shield,
  Zap,
  Clock,
  Award,
  Eye,
  RefreshCw,
  Download,
  Play,
  Pause,
  Sliders,
  GitBranch,
  Globe,
  HeartHandshake,
  Brain
} from 'lucide-react'
import useCollaborativeLearning, { useCollaborativeLearningConfiguration } from '@/hooks/useCollaborativeLearning'

interface CollaborativeLearningDashboardProps {
  className?: string
}

export default function CollaborativeLearningDashboard({ 
  className = '' 
}: CollaborativeLearningDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orchestration' | 'sessions' | 'insights' | 'configuration'>('orchestration')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    sessions,
    currentSession,
    orchestrationResults,
    collaborationInsights,
    groupDynamicsAnalysis,
    assessmentResults,
    isCreatingSession,
    isOrchestrating,
    isOptimizing,
    isAnalyzing,
    error,
    warnings,
    realTimeMonitoring,
    currentSessionMetrics,
    collaborationMetricsSummary,
    groupDynamicsInsights,
    orchestrationStatus,
    warningIndicators,
    createCollaborativeSession,
    startRealTimeOrchestration,
    stopRealTimeOrchestration,
    orchestrateCollaboration,
    optimizeGroupDynamics,
    analyzeCollaborationEffectiveness,
    facilitatePeerInteractions,
    manageGroupFormation,
    assessCollaborativeLearning,
    generateCollaborationInsights,
    exportCollaborationData,
    clearError,
    clearWarnings
  } = useCollaborativeLearning()

  const {
    configuration,
    isValid: configurationValid,
    validationErrors,
    updateConfiguration,
    resetConfiguration
  } = useCollaborativeLearningConfiguration()

  // Handle auto-orchestration toggle
  const handleAutoOrchestrationToggle = async () => {
    if (!realTimeMonitoring && currentSession) {
      try {
        await startRealTimeOrchestration(
          currentSession.session_id,
          generateMockCurrentState(),
          configuration.orchestration_settings.orchestration_frequency * 1000
        )
      } catch (error) {
        console.error('Failed to start orchestration:', error)
      }
    } else {
      stopRealTimeOrchestration()
    }
  }

  // Create new collaborative session
  const handleCreateSession = async () => {
    try {
      await createCollaborativeSession({
        participants: generateMockParticipants(),
        learning_objectives: [
          'Develop collaborative problem-solving skills',
          'Enhance peer learning capabilities',
          'Build effective communication strategies'
        ],
        session_config: {
          title: 'Advanced Collaborative Learning Session',
          subject_domain: 'collaborative_skills',
          difficulty_level: 6,
          estimated_duration: 90,
          session_type: 'study_group',
          collaboration_mode: configuration.session_settings.default_collaboration_mode,
          session_format: configuration.session_settings.default_session_format
        }
      })
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  // Trigger group dynamics optimization
  const handleOptimizeGroupDynamics = async () => {
    if (!currentSession) return

    try {
      await optimizeGroupDynamics({
        session_id: currentSession.session_id,
        dynamics_data: generateMockDynamicsData(),
        optimization_goals: [
          'improve_collaboration_efficiency',
          'enhance_knowledge_sharing',
          'strengthen_group_cohesion'
        ]
      })
    } catch (error) {
      console.error('Failed to optimize group dynamics:', error)
    }
  }

  // Generate collaboration insights
  const handleGenerateInsights = async () => {
    if (!currentSession) return

    try {
      await generateCollaborationInsights(
        generateMockAnalysisData(),
        'comprehensive',
        'detailed'
      )
    } catch (error) {
      console.error('Failed to generate insights:', error)
    }
  }

  const tabs = [
    { id: 'orchestration', label: 'Real-Time Orchestration', icon: Network },
    { id: 'sessions', label: 'Session Management', icon: Users },
    { id: 'insights', label: 'Collaboration Insights', icon: BarChart3 },
    { id: 'configuration', label: 'Configuration', icon: Settings }
  ]

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Collaborative Learning Orchestration</h2>
              <p className="text-sm text-gray-600">AI-enhanced group learning coordination and optimization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status indicators */}
            {realTimeMonitoring && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">Orchestrating</span>
              </div>
            )}
            
            {currentSession && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {currentSessionMetrics?.participantCount} participants
                </span>
              </div>
            )}
            
            {warningIndicators.hasWarnings && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 rounded-full">
                <Shield className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">{warningIndicators.warningCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'orchestration' && (
            <motion.div
              key="orchestration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Orchestration Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleAutoOrchestrationToggle}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      realTimeMonitoring
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {realTimeMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{realTimeMonitoring ? 'Stop Orchestration' : 'Start Orchestration'}</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (currentSession) {
                        await orchestrateCollaboration({
                          session_id: currentSession.session_id,
                          current_state: generateMockCurrentState(),
                          participant_actions: []
                        })
                      }
                    }}
                    disabled={isOrchestrating || !currentSession}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isOrchestrating ? 'animate-spin' : ''}`} />
                    <span>Manual Orchestration</span>
                  </button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Frequency: {configuration.orchestration_settings.orchestration_frequency}s</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Results: {orchestrationResults.length}</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Collaboration Metrics */}
              {collaborationMetricsSummary && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <CollaborationMetricCard
                    title="Engagement Levels"
                    value={collaborationMetricsSummary.engagementLevels?.high || 0}
                    unit="%"
                    color="green"
                    icon={TrendingUp}
                    subtitle="High engagement"
                  />
                  <CollaborationMetricCard
                    title="Interaction Frequency"
                    value={collaborationMetricsSummary.interactionFrequency}
                    unit=""
                    color="blue"
                    icon={MessageSquare}
                    subtitle="Interactions/min"
                  />
                  <CollaborationMetricCard
                    title="Collaboration Quality"
                    value={collaborationMetricsSummary.collaborationQuality}
                    unit="%"
                    color="purple"
                    icon={Award}
                    subtitle="Overall quality"
                  />
                  <CollaborationMetricCard
                    title="Knowledge Sharing"
                    value={collaborationMetricsSummary.knowledgeSharingRate}
                    unit="%"
                    color="orange"
                    icon={Brain}
                    subtitle="Sharing rate"
                  />
                  <CollaborationMetricCard
                    title="Collective Focus"
                    value={collaborationMetricsSummary.collectiveFocus}
                    unit="%"
                    color="teal"
                    icon={Target}
                    subtitle="Group focus"
                  />
                </div>
              )}

              {/* Current Session Overview */}
              {currentSessionMetrics && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Session</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Session Type</p>
                      <p className="text-lg text-blue-600 capitalize">{currentSessionMetrics.sessionType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Participants</p>
                      <p className="text-lg text-blue-600">{currentSessionMetrics.participantCount}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duration</p>
                      <p className="text-lg text-blue-600">{currentSessionMetrics.estimatedDuration} min</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Mode</p>
                      <p className="text-lg text-blue-600 capitalize">{currentSessionMetrics.collaborationMode}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Difficulty</p>
                      <p className="text-lg text-blue-600">{currentSessionMetrics.difficultyLevel}/10</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Objectives</p>
                      <p className="text-lg text-blue-600">{currentSessionMetrics.learningObjectiveCount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orchestration Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Orchestration Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Orchestration</span>
                      <span className={`text-sm font-medium ${orchestrationStatus.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {orchestrationStatus.isActive ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <span className="text-sm font-medium text-blue-600">
                        {orchestrationStatus.collaborationQuality.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Health Status</span>
                      <span className={`text-sm font-medium ${warningIndicators.collaborationHealthy ? 'text-green-600' : 'text-orange-600'}`}>
                        {warningIndicators.collaborationHealthy ? 'Healthy' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleOptimizeGroupDynamics}
                      disabled={isOptimizing || !currentSession}
                      className="w-full text-left px-3 py-2 text-sm bg-white rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span>Optimize Group Dynamics</span>
                      </div>
                    </button>
                    <button
                      onClick={async () => {
                        if (currentSession) {
                          await facilitatePeerInteractions({
                            session_id: currentSession.session_id,
                            interaction_context: generateMockInteractionContext()
                          })
                        }
                      }}
                      disabled={!currentSession}
                      className="w-full text-left px-3 py-2 text-sm bg-white rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-2">
                        <HeartHandshake className="w-4 h-4 text-purple-500" />
                        <span>Facilitate Peer Interactions</span>
                      </div>
                    </button>
                    <button
                      onClick={async () => {
                        if (currentSession) {
                          await assessCollaborativeLearning(currentSession.session_id)
                        }
                      }}
                      disabled={!currentSession}
                      className="w-full text-left px-3 py-2 text-sm bg-white rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-green-500" />
                        <span>Assess Learning Progress</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Warnings and Alerts */}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Alerts & Recommendations</h3>
                  {warnings.map((warning, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-700">{warning}</span>
                      </div>
                      <button
                        onClick={clearWarnings}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Session Management Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className={`w-4 h-4 ${isCreatingSession ? 'animate-spin' : ''}`} />
                    <span>Create New Session</span>
                  </button>

                  <button
                    onClick={async () => {
                      await manageGroupFormation({
                        participants: generateMockParticipants(),
                        formation_criteria: {
                          diversity_optimization: true,
                          expertise_balance: true,
                          learning_style_mix: true
                        }
                      })
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>Optimize Group Formation</span>
                  </button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Sessions: {sessions.length}</span>
                  </div>
                </div>
              </div>

              {/* Session List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
                {sessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.slice(0, 6).map((session, index) => (
                      <SessionCard
                        key={session.session_id}
                        session={session}
                        isActive={currentSession?.session_id === session.session_id}
                        onSelect={() => {
                          // Handle session selection logic here
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Sessions</h3>
                    <p className="text-gray-500 mb-4">Create a new collaborative learning session to get started</p>
                    <button
                      onClick={handleCreateSession}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Create Your First Session
                    </button>
                  </div>
                )}
              </div>

              {/* Group Dynamics Analysis */}
              {groupDynamicsInsights && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Group Dynamics Insights</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{groupDynamicsInsights.optimizationStrategiesCount}</p>
                      <p className="text-sm text-gray-600">Optimization Strategies</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{groupDynamicsInsights.interventionRecommendationsCount}</p>
                      <p className="text-sm text-gray-600">Interventions Recommended</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{groupDynamicsInsights.groupRestructuring ? 'Yes' : 'No'}</p>
                      <p className="text-sm text-gray-600">Restructuring Needed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">8.5/10</p>
                      <p className="text-sm text-gray-600">Optimization Score</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Insights Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleGenerateInsights}
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
                  >
                    <Lightbulb className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>Generate Insights</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (currentSession) {
                        await analyzeCollaborationEffectiveness(currentSession.session_id)
                      }
                    }}
                    disabled={!currentSession}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analyze Effectiveness</span>
                  </button>

                  <button
                    onClick={() => exportCollaborationData(
                      sessions.map(s => s.session_id),
                      'json'
                    )}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
                </button>
              </div>

              {/* Collaboration Insights */}
              {collaborationInsights && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Collaboration Patterns</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Communication Quality</span>
                        <span className="text-sm font-medium text-green-600">Excellent</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Knowledge Sharing</span>
                        <span className="text-sm font-medium text-green-600">High</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Peer Support</span>
                        <span className="text-sm font-medium text-green-600">Strong</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Insights</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Collective Intelligence</span>
                        <span className="text-sm font-medium text-blue-600">Developing</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Skill Transfer</span>
                        <span className="text-sm font-medium text-blue-600">Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Problem Solving</span>
                        <span className="text-sm font-medium text-blue-600">Collaborative</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assessment Results */}
              {assessmentResults && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-2xl font-bold text-green-600">87%</p>
                      <p className="text-sm text-gray-600">Group Cohesion</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-2xl font-bold text-blue-600">84%</p>
                      <p className="text-sm text-gray-600">Knowledge Construction</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-2xl font-bold text-purple-600">91%</p>
                      <p className="text-sm text-gray-600">Problem Solving</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-2xl font-bold text-orange-600">79%</p>
                      <p className="text-sm text-gray-600">Conflict Resolution</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Analytics */}
              {showAdvanced && collaborationInsights && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded border">
                      <h4 className="font-medium text-gray-800 mb-2">Interaction Dynamics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Message Frequency</span>
                          <span className="text-gray-800">High</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Response Time</span>
                          <span className="text-gray-800">2.3 minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Participation Balance</span>
                          <span className="text-gray-800">85%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded border">
                      <h4 className="font-medium text-gray-800 mb-2">Learning Patterns</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Knowledge Sharing Rate</span>
                          <span className="text-gray-800">78%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Peer Teaching Events</span>
                          <span className="text-gray-800">24</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Collaborative Insights</span>
                          <span className="text-gray-800">12</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'configuration' && (
            <motion.div
              key="configuration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Configuration Form */}
              <div className="space-y-6">
                {/* Session Settings */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Collaboration Mode
                      </label>
                      <select
                        value={configuration.session_settings.default_collaboration_mode}
                        onChange={(e) => updateConfiguration('session_settings', {
                          ...configuration.session_settings,
                          default_collaboration_mode: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="synchronous">Synchronous</option>
                        <option value="asynchronous">Asynchronous</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Participants per Group
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="20"
                        value={configuration.session_settings.max_participants_per_group}
                        onChange={(e) => updateConfiguration('session_settings', {
                          ...configuration.session_settings,
                          max_participants_per_group: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Orchestration Settings */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Orchestration Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orchestration Frequency (seconds)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={configuration.orchestration_settings.orchestration_frequency}
                        onChange={(e) => updateConfiguration('orchestration_settings', {
                          ...configuration.orchestration_settings,
                          orchestration_frequency: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adaptation Sensitivity
                      </label>
                      <select
                        value={configuration.orchestration_settings.adaptation_sensitivity}
                        onChange={(e) => updateConfiguration('orchestration_settings', {
                          ...configuration.orchestration_settings,
                          adaptation_sensitivity: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Configuration Errors:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Configuration Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={resetConfiguration}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reset to Defaults
                  </button>
                  
                  <button
                    disabled={!configurationValid}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper component for collaboration metric cards
interface CollaborationMetricCardProps {
  title: string
  value: number
  unit: string
  color: string
  icon: React.ComponentType<any>
  subtitle?: string
}

function CollaborationMetricCard({ title, value, unit, color, icon: Icon, subtitle }: CollaborationMetricCardProps) {
  return (
    <div className={`p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}{unit}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
    </div>
  )
}

// Helper component for session cards
interface SessionCardProps {
  session: any
  isActive: boolean
  onSelect: () => void
}

function SessionCard({ session, isActive, onSelect }: SessionCardProps) {
  return (
    <div 
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{session.session_metadata.title}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
        }`}>
          {session.participants.length} participants
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{session.session_metadata.subject_domain}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{session.session_metadata.session_type.replace('_', ' ')}</span>
        <span>{session.session_metadata.estimated_duration} min</span>
      </div>
    </div>
  )
}

// Helper functions for generating mock data
function generateMockParticipants() {
  return [
    {
      participant_id: 'user_001',
      name: 'Alice Johnson',
      expertise_areas: ['mathematics', 'problem_solving'],
      learning_goals: ['advanced_calculus', 'mathematical_reasoning']
    },
    {
      participant_id: 'user_002',
      name: 'Bob Chen',
      expertise_areas: ['computer_science', 'algorithms'],
      learning_goals: ['data_structures', 'algorithm_optimization']
    },
    {
      participant_id: 'user_003',
      name: 'Carol Davis',
      expertise_areas: ['physics', 'mathematics'],
      learning_goals: ['quantum_mechanics', 'mathematical_modeling']
    },
    {
      participant_id: 'user_004',
      name: 'David Wilson',
      expertise_areas: ['engineering', 'physics'],
      learning_goals: ['system_design', 'engineering_principles']
    }
  ]
}

function generateMockCurrentState() {
  return {
    active_participants: 4,
    current_activity: 'collaborative_problem_solving',
    engagement_level: 85,
    collaboration_quality: 82,
    time_elapsed: 25, // minutes
    current_objectives: ['solve_complex_problem', 'share_knowledge', 'learn_from_peers']
  }
}

function generateMockDynamicsData() {
  return {
    group_cohesion: 78,
    communication_effectiveness: 85,
    role_distribution_balance: 73,
    conflict_level: 15,
    knowledge_sharing_rate: 82,
    participation_balance: 79
  }
}

function generateMockInteractionContext() {
  return {
    interaction_type: 'knowledge_sharing',
    participants_involved: ['user_001', 'user_002', 'user_003'],
    current_topic: 'collaborative_problem_solving_strategies',
    interaction_quality: 'high',
    support_needed: ['facilitation', 'structure']
  }
}

function generateMockAnalysisData() {
  return {
    session_duration: 45,
    participant_interactions: 127,
    knowledge_sharing_events: 23,
    collaborative_achievements: 8,
    problem_solving_instances: 12,
    peer_support_events: 31
  }
}