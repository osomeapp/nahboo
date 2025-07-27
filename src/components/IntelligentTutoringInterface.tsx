'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Brain, 
  Target, 
  Clock, 
  TrendingUp,
  Star,
  BookOpen,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Loader,
  Settings,
  BarChart3,
  Play,
  Square,
  Award,
  MessageSquare,
  Zap,
  Heart,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Info
} from 'lucide-react'
import { useIntelligentTutoring, useTutorPersonalitySelector, useConversationInsights } from '@/hooks/useIntelligentTutoring'
import { type ConversationMessage, type TutorPersonality } from '@/lib/intelligent-tutoring-system'

interface TutoringInterfaceProps {
  className?: string
  onConversationEnd?: (summary: any) => void
}

export default function IntelligentTutoringInterface({ 
  className = '',
  onConversationEnd 
}: TutoringInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'setup' | 'analytics'>('setup')
  const [messageInput, setMessageInput] = useState('')
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    sessionId,
    conversationHistory,
    currentContext,
    isLoading,
    isTyping,
    error,
    sessionSummary,
    isActive,
    hasMessages,
    startConversation,
    sendMessage,
    endConversation,
    clearConversation,
    clearError,
    clearSummary,
    getConversationAnalytics
  } = useIntelligentTutoring()

  const {
    personalities,
    selectedPersonality,
    setSelectedPersonality,
    getPersonalityRecommendations
  } = useTutorPersonalitySelector()

  const { getMessagePatterns, getLearningProgress } = useConversationInsights(conversationHistory)

  // Setup form state
  const [setupForm, setSetupForm] = useState({
    name: '',
    level: 'high school',
    learningStyle: 'visual',
    interests: [''],
    strugglingAreas: [''],
    strengths: [''],
    subject: '',
    learningObjectives: ['']
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  // Switch to chat tab when conversation starts
  useEffect(() => {
    if (isActive && activeTab === 'setup') {
      setActiveTab('chat')
    }
  }, [isActive, activeTab])

  // Handle conversation end
  useEffect(() => {
    if (sessionSummary && onConversationEnd) {
      onConversationEnd(sessionSummary)
    }
  }, [sessionSummary, onConversationEnd])

  // Handle starting conversation
  const handleStartConversation = async () => {
    try {
      const studentProfile = {
        name: setupForm.name,
        level: setupForm.level,
        learningStyle: setupForm.learningStyle,
        interests: setupForm.interests.filter(i => i.trim()),
        strugglingAreas: setupForm.strugglingAreas.filter(a => a.trim()),
        strengths: setupForm.strengths.filter(s => s.trim())
      }

      await startConversation(
        studentProfile,
        setupForm.subject,
        setupForm.learningObjectives.filter(o => o.trim()),
        selectedPersonality?.id
      )
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || isTyping) return

    const message = messageInput.trim()
    setMessageInput('')

    try {
      await sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle ending conversation
  const handleEndConversation = async () => {
    try {
      await endConversation()
    } catch (error) {
      console.error('Failed to end conversation:', error)
    }
  }

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Update form field
  const updateFormField = (field: string, value: any) => {
    setSetupForm(prev => ({ ...prev, [field]: value }))
  }

  // Add array item
  const addArrayItem = (field: string) => {
    setSetupForm(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], '']
    }))
  }

  // Remove array item
  const removeArrayItem = (field: string, index: number) => {
    setSetupForm(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }))
  }

  // Update array item
  const updateArrayItem = (field: string, index: number, value: string) => {
    setSetupForm(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings, disabled: isActive },
    { id: 'chat', label: 'Tutoring', icon: MessageCircle, disabled: !isActive },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, disabled: !hasMessages }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Tutoring System</h2>
              <p className="text-sm text-gray-500">
                {isActive 
                  ? `Conversation with ${currentContext?.tutorPersonality.name || 'AI Tutor'}`
                  : 'Set up your personalized learning session'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isActive && (
              <button
                onClick={handleEndConversation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>End Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : tab.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'setup' && (
            <SetupTab
              key="setup"
              setupForm={setupForm}
              updateFormField={updateFormField}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              updateArrayItem={updateArrayItem}
              personalities={personalities}
              selectedPersonality={selectedPersonality}
              setSelectedPersonality={setSelectedPersonality}
              getPersonalityRecommendations={getPersonalityRecommendations}
              onStartConversation={handleStartConversation}
              isLoading={isLoading}
            />
          )}
          
          {activeTab === 'chat' && (
            <ChatTab
              key="chat"
              conversationHistory={conversationHistory}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              isTyping={isTyping}
              isActive={isActive}
              currentContext={currentContext}
              messagesEndRef={messagesEndRef}
            />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsTab
              key="analytics"
              conversationHistory={conversationHistory}
              currentContext={currentContext}
              getMessagePatterns={getMessagePatterns}
              getLearningProgress={getLearningProgress}
              getConversationAnalytics={getConversationAnalytics}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Session Summary Modal */}
      <SessionSummaryModal
        isOpen={!!sessionSummary}
        onClose={() => {
          clearSummary()
          clearConversation()
          setActiveTab('setup')
        }}
        summary={sessionSummary}
      />
    </div>
  )
}

// Setup Tab Component
function SetupTab({ 
  setupForm, 
  updateFormField, 
  addArrayItem, 
  removeArrayItem, 
  updateArrayItem,
  personalities,
  selectedPersonality,
  setSelectedPersonality,
  getPersonalityRecommendations,
  onStartConversation,
  isLoading 
}: any) {
  const [showRecommendations, setShowRecommendations] = useState(false)

  const recommendations = setupForm.subject && setupForm.level 
    ? getPersonalityRecommendations(setupForm.subject, { level: setupForm.level, learningStyle: setupForm.learningStyle })
    : []

  const canStart = setupForm.name && setupForm.subject && setupForm.learningObjectives.some((obj: string) => obj.trim())

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Student Profile */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Student Profile</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">Name</label>
            <input
              type="text"
              value={setupForm.name}
              onChange={(e) => updateFormField('name', e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">Level</label>
            <select
              value={setupForm.level}
              onChange={(e) => updateFormField('level', e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="elementary">Elementary</option>
              <option value="middle school">Middle School</option>
              <option value="high school">High School</option>
              <option value="college">College</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">Learning Style</label>
            <select
              value={setupForm.learningStyle}
              onChange={(e) => updateFormField('learningStyle', e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="visual">Visual</option>
              <option value="auditory">Auditory</option>
              <option value="kinesthetic">Kinesthetic</option>
              <option value="analytical">Analytical</option>
            </select>
          </div>
        </div>
        
        {/* Interests */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-blue-700 mb-2">Interests</label>
          {setupForm.interests.map((interest: string, index: number) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={interest}
                onChange={(e) => updateArrayItem('interests', index, e.target.value)}
                placeholder="What interests you?"
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {setupForm.interests.length > 1 && (
                <button
                  onClick={() => removeArrayItem('interests', index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addArrayItem('interests')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Interest
          </button>
        </div>
      </div>

      {/* Learning Session */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Learning Session</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Subject</label>
            <input
              type="text"
              value={setupForm.subject}
              onChange={(e) => updateFormField('subject', e.target.value)}
              placeholder="What subject would you like to learn?"
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Learning Objectives</label>
            {setupForm.learningObjectives.map((objective: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => updateArrayItem('learningObjectives', index, e.target.value)}
                  placeholder="What do you want to learn or achieve?"
                  className="flex-1 px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {setupForm.learningObjectives.length > 1 && (
                  <button
                    onClick={() => removeArrayItem('learningObjectives', index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayItem('learningObjectives')}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              + Add Objective
            </button>
          </div>
        </div>
      </div>

      {/* Tutor Selection */}
      <div className="bg-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-900">Choose Your AI Tutor</h3>
          {recommendations.length > 0 && (
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="text-purple-600 hover:text-purple-800 text-sm flex items-center space-x-1"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Show Recommendations</span>
            </button>
          )}
        </div>
        
        {showRecommendations && recommendations.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">Recommended tutors for {setupForm.subject}:</p>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map(({ personality, score }) => (
                <button
                  key={personality.id}
                  onClick={() => setSelectedPersonality(personality)}
                  className="w-full text-left p-2 bg-white rounded border hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-900">{personality.name}</span>
                    <span className="text-xs text-purple-600">{score}% match</span>
                  </div>
                  <p className="text-sm text-purple-700">{personality.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {personalities.map((personality) => (
            <button
              key={personality.id}
              onClick={() => setSelectedPersonality(personality)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedPersonality?.id === personality.id
                  ? 'border-purple-500 bg-purple-100'
                  : 'border-purple-200 hover:border-purple-300'
              }`}
            >
              <h4 className="font-medium text-purple-900">{personality.name}</h4>
              <p className="text-sm text-purple-700 mt-1">{personality.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {personality.subject_specialties.slice(0, 3).map(specialty => (
                  <span key={specialty} className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs">
                    {specialty}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onStartConversation}
          disabled={!canStart || isLoading}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-lg font-medium"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span>{isLoading ? 'Starting...' : 'Start Tutoring Session'}</span>
        </button>
      </div>
    </motion.div>
  )
}

// Chat Tab Component
function ChatTab({ 
  conversationHistory, 
  messageInput, 
  setMessageInput, 
  onSendMessage, 
  onKeyPress, 
  isTyping, 
  isActive,
  currentContext,
  messagesEndRef 
}: any) {
  if (!isActive) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
        <p className="text-gray-500">Set up and start a tutoring session to begin chatting</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Session Info */}
      {currentContext && (
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900">{currentContext.tutorPersonality.name}</h3>
              <p className="text-sm text-purple-700">{currentContext.subject}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-600">
                Understanding: {Math.round(currentContext.sessionMetrics.understandingLevel * 100)}%
              </div>
              <div className="text-sm text-purple-600">
                Engagement: {Math.round(currentContext.sessionMetrics.engagementLevel * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
        <div className="space-y-4">
          {conversationHistory.map((message: ConversationMessage) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'student' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'tutor' && (
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
              )}
              
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'student'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.metadata.confidence && (
                    <span className="text-xs opacity-70">
                      {Math.round(message.metadata.confidence * 100)}% confident
                    </span>
                  )}
                </div>
              </div>
              
              {message.role === 'student' && (
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="flex items-center space-x-3">
        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
        <button
          onClick={onSendMessage}
          disabled={!messageInput.trim() || isTyping}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

// Analytics Tab Component
function AnalyticsTab({ 
  conversationHistory, 
  currentContext, 
  getMessagePatterns, 
  getLearningProgress,
  getConversationAnalytics 
}: any) {
  const patterns = getMessagePatterns()
  const progress = getLearningProgress()
  const analytics = getConversationAnalytics()

  if (!patterns || !progress || !analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
        <p className="text-gray-500">Start a conversation to see learning analytics</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <p className="font-medium text-blue-900">Messages</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{analytics.totalMessages}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="font-medium text-green-900">Understanding</p>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {Math.round(analytics.understandingLevel * 100)}%
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-purple-600" />
            <p className="font-medium text-purple-900">Engagement</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {Math.round(analytics.engagementLevel * 100)}%
          </p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <p className="font-medium text-orange-900">Duration</p>
          </div>
          <p className="text-2xl font-bold text-orange-900">{analytics.sessionDuration}m</p>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Learning Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-green-700 mb-2">Confidence Trend</p>
            <div className="flex items-center space-x-2">
              <TrendingUp className={`w-5 h-5 ${
                progress.confidenceTrend > 0 ? 'text-green-600' : 
                progress.confidenceTrend < 0 ? 'text-red-600' : 'text-gray-600'
              }`} />
              <span className="text-green-900 font-medium">
                {progress.improvementDirection}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-green-700 mb-2">Current Confidence</p>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${progress.currentConfidence * 100}%` }}
              />
            </div>
            <span className="text-sm text-green-700">
              {Math.round(progress.currentConfidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Message Patterns */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Conversation Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Questions Asked</p>
            <p className="text-2xl font-bold text-blue-900">{patterns.studentQuestions}</p>
            <p className="text-xs text-blue-600">
              {Math.round(patterns.questioningRate * 100)}% of messages
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Quality Responses</p>
            <p className="text-2xl font-bold text-blue-900">{patterns.substantiveResponses}</p>
            <p className="text-xs text-blue-600">
              {Math.round(patterns.responseQuality * 100)}% substantive
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Total Exchanges</p>
            <p className="text-2xl font-bold text-blue-900">{patterns.totalExchanges}</p>
            <p className="text-xs text-blue-600">Back-and-forth</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {analytics.conceptsMastered.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Concepts Mastered</h3>
          <div className="flex flex-wrap gap-2">
            {analytics.conceptsMastered.map((concept: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium flex items-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{concept}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Session Summary Modal Component
function SessionSummaryModal({ isOpen, onClose, summary }: {
  isOpen: boolean
  onClose: () => void
  summary: any
}) {
  if (!isOpen || !summary) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Session Complete!</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        {/* Summary */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Session Summary</h4>
          <p className="text-gray-700">{summary.summary}</p>
        </div>
        
        {/* Achievements */}
        {summary.achievements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span>Achievements</span>
            </h4>
            <ul className="space-y-2">
              {summary.achievements.map((achievement: string, index: number) => (
                <li key={index} className="flex items-center space-x-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Recommendations */}
        {summary.recommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span>Recommendations</span>
            </h4>
            <ul className="space-y-2">
              {summary.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="flex items-center space-x-2 text-gray-700">
                  <Star className="w-4 h-4 text-blue-600" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Session Metrics */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Session Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Messages Exchanged</p>
              <p className="font-semibold text-gray-900">{summary.sessionMetrics.messagesExchanged}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Final Understanding</p>
              <p className="font-semibold text-gray-900">
                {Math.round(summary.sessionMetrics.understandingLevel * 100)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Concepts Mastered</p>
              <p className="font-semibold text-gray-900">{summary.sessionMetrics.conceptsMastered.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Topics Covered</p>
              <p className="font-semibold text-gray-900">{summary.sessionMetrics.topicsCovered.length}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start New Session
          </button>
        </div>
      </motion.div>
    </div>
  )
}