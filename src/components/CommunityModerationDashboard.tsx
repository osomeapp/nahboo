// Community Moderation Dashboard
// Comprehensive interface for community reporting and moderation
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, AlertTriangle, Users, MessageSquare, TrendingUp,
  Flag, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle,
  Eye, Filter, Search, BarChart3, PieChart, Calendar,
  MessageCircle, FileText, Image, Link, Play
} from 'lucide-react'
import type { UserProfile } from '@/types'
import type { CommunityReport, CommunityVote, ModerationQueue } from '@/lib/community-moderation-engine'
import { useCommunityModeration, useReportSubmission } from '@/hooks/useCommunityModeration'

interface CommunityModerationDashboardProps {
  userId: string
  userProfile: UserProfile
  onReportSubmitted?: (report: CommunityReport) => void
  showSubmissionForm?: boolean
}

type DashboardView = 'overview' | 'reports' | 'community' | 'moderation' | 'analytics'

interface ReportCardProps {
  report: CommunityReport
  onVote: (voteType: CommunityVote['voteType'], confidence: number, reasoning?: string) => Promise<void>
  onReview?: (decision: string, reasoning: string) => Promise<void>
  canVote: boolean
  canModerate: boolean
  userVote?: CommunityVote
  compact?: boolean
}

const ReportCard: React.FC<ReportCardProps> = ({ 
  report, onVote, onReview, canVote, canModerate, userVote, compact = false 
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [voting, setVoting] = useState(false)
  const [voteReasoning, setVoteReasoning] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewData, setReviewData] = useState({ decision: '', reasoning: '' })

  const getSeverityColor = (severity: CommunityReport['severity']) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: CommunityReport['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'reviewing': return <Eye className="w-4 h-4 text-blue-500" />
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'dismissed': return <XCircle className="w-4 h-4 text-gray-500" />
      case 'escalated': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Flag className="w-4 h-4 text-gray-500" />
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'screenshot': return <Image className="w-4 h-4" />
      case 'text_quote': return <FileText className="w-4 h-4" />
      case 'url': return <Link className="w-4 h-4" />
      case 'video_timestamp': return <Play className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const handleVote = async (voteType: CommunityVote['voteType'], confidence: number) => {
    setVoting(true)
    try {
      await onVote(voteType, confidence, voteReasoning)
      setVoteReasoning('')
    } finally {
      setVoting(false)
    }
  }

  const handleReview = async () => {
    if (!reviewData.decision || !reviewData.reasoning) return
    
    setReviewing(true)
    try {
      await onReview?.(reviewData.decision, reviewData.reasoning)
      setReviewData({ decision: '', reasoning: '' })
    } finally {
      setReviewing(false)
    }
  }

  const supportVotes = report.communityVotes.filter(v => v.voteType === 'support').length
  const disputeVotes = report.communityVotes.filter(v => v.voteType === 'dispute').length
  const consensusScore = report.communityVotes.length > 0 ? 
    supportVotes / report.communityVotes.length : 0

  if (compact) {
    return (
      <div className={`p-4 rounded-lg border ${getSeverityColor(report.severity)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(report.status)}
            <div>
              <span className="font-medium text-sm">{report.reportType.replace('_', ' ')}</span>
              <div className="text-xs text-gray-500">
                {new Date(report.timestamp).toLocaleDateString()} • {report.communityVotes.length} votes
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(report.severity)}`}>
              {report.severity}
            </span>
            <span className="text-xs text-gray-500">Priority: {report.priority}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${getSeverityColor(report.severity)} overflow-hidden`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              {getStatusIcon(report.status)}
              <h3 className="font-semibold capitalize">{report.reportType.replace('_', ' ')}</h3>
              <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(report.severity)}`}>
                {report.severity}
              </span>
            </div>
            
            <p className="text-gray-700 mb-3">{report.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Reported: {new Date(report.timestamp).toLocaleString()}</span>
              <span>Priority: {report.priority}/10</span>
              <span>Category: {report.category}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>

        {/* Community Voting */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Community Consensus</span>
            <span className="text-sm text-gray-500">
              {report.communityVotes.length} votes • {Math.round(consensusScore * 100)}% support
            </span>
          </div>
          
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${consensusScore * 100}%` }}
              />
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex items-center space-x-1">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <span>{supportVotes}</span>
              </span>
              <span className="flex items-center space-x-1">
                <ThumbsDown className="w-4 h-4 text-red-500" />
                <span>{disputeVotes}</span>
              </span>
            </div>
          </div>

          {/* Voting Controls */}
          {canVote && !userVote && (
            <div className="border-t pt-3">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => handleVote('support', 0.8)}
                  disabled={voting}
                  className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Support</span>
                </button>
                <button
                  onClick={() => handleVote('dispute', 0.8)}
                  disabled={voting}
                  className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Dispute</span>
                </button>
                <button
                  onClick={() => handleVote('neutral', 0.5)}
                  disabled={voting}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm disabled:opacity-50"
                >
                  <span>Neutral</span>
                </button>
              </div>
              <textarea
                value={voteReasoning}
                onChange={(e) => setVoteReasoning(e.target.value)}
                placeholder="Optional: Explain your vote (helps build trust in the community)"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                rows={2}
              />
            </div>
          )}

          {userVote && (
            <div className="border-t pt-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Your vote:</span>
                <span className={`px-2 py-1 rounded ${
                  userVote.voteType === 'support' ? 'bg-green-100 text-green-700' :
                  userVote.voteType === 'dispute' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {userVote.voteType}
                </span>
                <span className="text-gray-500">
                  {Math.round(userVote.confidence * 100)}% confidence
                </span>
              </div>
              {userVote.reasoning && (
                <p className="text-sm text-gray-600 mt-1 italic">"{userVote.reasoning}"</p>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t pt-4"
            >
              {/* Evidence */}
              {report.evidence.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Evidence:</h4>
                  <div className="space-y-2">
                    {report.evidence.map((evidence, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border">
                        <div className="flex items-center space-x-2 mb-1">
                          {getEvidenceIcon(evidence.evidenceType)}
                          <span className="text-sm font-medium capitalize">
                            {evidence.evidenceType.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            evidence.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                            evidence.verificationStatus === 'disputed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {evidence.verificationStatus}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{evidence.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {report.tags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderator Actions */}
              {report.moderatorActions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Moderator Actions:</h4>
                  <div className="space-y-2">
                    {report.moderatorActions.map((action, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{action.decision}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(action.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{action.reasoning}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          Review time: {action.reviewTime} minutes • Type: {action.moderatorType}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderator Review (if user can moderate) */}
              {canModerate && report.status === 'pending' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">Moderator Review:</h4>
                  <div className="space-y-3">
                    <select
                      value={reviewData.decision}
                      onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select decision...</option>
                      <option value="approve">Approve content</option>
                      <option value="remove">Remove content</option>
                      <option value="modify">Modify content</option>
                      <option value="warn_user">Warn user</option>
                      <option value="suspend_user">Suspend user</option>
                      <option value="no_action">No action needed</option>
                    </select>
                    
                    <textarea
                      value={reviewData.reasoning}
                      onChange={(e) => setReviewData(prev => ({ ...prev, reasoning: e.target.value }))}
                      placeholder="Explain your decision and reasoning..."
                      className="w-full p-3 border border-gray-300 rounded"
                      rows={3}
                    />
                    
                    <button
                      onClick={handleReview}
                      disabled={reviewing || !reviewData.decision || !reviewData.reasoning}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      {reviewing ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export const CommunityModerationDashboard: React.FC<CommunityModerationDashboardProps> = ({
  userId,
  userProfile,
  onReportSubmitted,
  showSubmissionForm = false
}) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [showReportForm, setShowReportForm] = useState(showSubmissionForm)

  const moderation = useCommunityModeration(userId, userProfile)
  const reportForm = useReportSubmission()

  const handleVote = useCallback(async (
    reportId: string,
    voteType: CommunityVote['voteType'],
    confidence: number,
    reasoning?: string
  ) => {
    await moderation.submitVote(reportId, voteType, confidence, reasoning)
  }, [moderation])

  const handleModeratorReview = useCallback(async (
    reportId: string,
    decision: string,
    reasoning: string
  ) => {
    await moderation.submitModeratorReview(reportId, decision as any, reasoning, 10, [])
  }, [moderation])

  const handleSubmitReport = useCallback(async (contentId: string) => {
    if (!reportForm.isFormValid) return

    const report = await moderation.submitReport(contentId, reportForm.formData)
    if (report) {
      onReportSubmitted?.(report)
      reportForm.resetForm()
      setShowReportForm(false)
    }
  }, [moderation, reportForm, onReportSubmitted])

  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: Flag, badge: moderation.filteredReports.length },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield, badge: moderation.canModerate ? moderation.hasPendingReports ? '!' : undefined : undefined },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Community Moderation</h2>
              <p className="text-purple-100">
                Collaborative content safety and quality assurance
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowReportForm(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded flex items-center space-x-2"
            >
              <Flag className="w-4 h-4" />
              <span>Report Content</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{moderation.userStats.reportsSubmitted}</div>
            <div className="text-sm text-purple-100">Reports Submitted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{moderation.userStats.votesSubmitted}</div>
            <div className="text-sm text-purple-100">Community Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{moderation.userStats.reportsResolved}</div>
            <div className="text-sm text-purple-100">Reports Resolved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {moderation.metrics?.communityParticipation.consensusRate ? 
                Math.round(moderation.metrics.communityParticipation.consensusRate * 100) : 0}%
            </div>
            <div className="text-sm text-purple-100">Consensus Rate</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {viewTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as DashboardView)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors relative ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Community Overview</h3>
              
              {/* Recent Reports */}
              <div>
                <h4 className="font-medium mb-3">Recent Reports</h4>
                <div className="space-y-3">
                  {moderation.filteredReports.slice(0, 3).map(report => (
                    <ReportCard
                      key={report.reportId}
                      report={report}
                      onVote={(voteType, confidence, reasoning) => 
                        handleVote(report.reportId, voteType, confidence, reasoning)
                      }
                      canVote={moderation.canVoteOnReport(report.reportId)}
                      canModerate={moderation.canModerate}
                      userVote={moderation.getMyVoteOnReport(report.reportId) || undefined}
                      compact
                    />
                  ))}
                </div>
              </div>

              {/* Community Health */}
              {moderation.metrics && (
                <div>
                  <h4 className="font-medium mb-3">Community Health</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Content Quality</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {Math.round((1 - moderation.metrics.contentHealth.violationRate) * 100)}%
                      </p>
                      <p className="text-sm text-green-600">Safe content rate</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Community Participation</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {moderation.metrics.communityParticipation.activeReporters}
                      </p>
                      <p className="text-sm text-blue-600">Active reporters</p>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Response Time</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 mt-2">
                        {Math.round(moderation.metrics.averageResolutionTime)}h
                      </p>
                      <p className="text-sm text-purple-600">Average resolution</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Community Reports</h3>
                <div className="flex items-center space-x-3">
                  <select
                    value={moderation.filters.timeRange}
                    onChange={(e) => moderation.updateFilters({ timeRange: e.target.value as any })}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="last_day">Last Day</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="all_time">All Time</option>
                  </select>
                  
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={moderation.filters.myReportsOnly}
                      onChange={(e) => moderation.updateFilters({ myReportsOnly: e.target.checked })}
                      className="rounded"
                    />
                    <span>My reports only</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                {moderation.filteredReports.map(report => (
                  <ReportCard
                    key={report.reportId}
                    report={report}
                    onVote={(voteType, confidence, reasoning) => 
                      handleVote(report.reportId, voteType, confidence, reasoning)
                    }
                    onReview={(decision, reasoning) =>
                      handleModeratorReview(report.reportId, decision, reasoning)
                    }
                    canVote={moderation.canVoteOnReport(report.reportId)}
                    canModerate={moderation.canModerate}
                    userVote={moderation.getMyVoteOnReport(report.reportId) || undefined}
                  />
                ))}
                
                {moderation.filteredReports.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Flag className="w-12 h-12 mx-auto mb-2" />
                    <p>No reports found matching your filters</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Report Submission Modal */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Report Content</h3>
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type
                    </label>
                    <select
                      value={reportForm.formData.reportType}
                      onChange={(e) => reportForm.updateFormData({ reportType: e.target.value as any })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="inappropriate_content">Inappropriate Content</option>
                      <option value="misinformation">Misinformation</option>
                      <option value="harassment">Harassment</option>
                      <option value="spam">Spam</option>
                      <option value="privacy_violation">Privacy Violation</option>
                      <option value="copyright">Copyright Violation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={reportForm.formData.description}
                      onChange={(e) => reportForm.updateFormData({ description: e.target.value })}
                      placeholder="Please describe the issue in detail..."
                      className="w-full p-3 border border-gray-300 rounded"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="urgent"
                      checked={reportForm.formData.isUrgent}
                      onChange={(e) => reportForm.updateFormData({ isUrgent: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="urgent" className="text-sm font-medium text-gray-700">
                      This is urgent and requires immediate attention
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowReportForm(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitReport('example_content_id')}
                      disabled={!reportForm.isFormValid || moderation.isSubmittingReport}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
                    >
                      {moderation.isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CommunityModerationDashboard