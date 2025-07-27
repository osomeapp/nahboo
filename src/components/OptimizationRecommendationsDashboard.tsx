'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useOptimizationRecommendations,
  useRecommendationImplementation,
  useOptimizationAnalytics
} from '@/hooks/useOptimizationRecommendations'
import type { OptimizationRecommendation } from '@/lib/optimization-recommendations-engine'

interface OptimizationRecommendationsDashboardProps {
  className?: string
}

export default function OptimizationRecommendationsDashboard({
  className = ''
}: OptimizationRecommendationsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'implementation' | 'analytics' | 'quick-wins'>('recommendations')
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const {
    recommendations,
    implementationHistory,
    isLoading,
    error,
    lastUpdated,
    implementRecommendation,
    rejectRecommendation,
    getCriticalRecommendations,
    getQuickWins,
    getImpactAnalysis,
    clearError
  } = useOptimizationRecommendations()

  const {
    activeImplementations,
    isImplementing,
    startImplementation
  } = useRecommendationImplementation()

  const {
    getOptimizationTrends,
    getRecommendationDistribution,
    getROIAnalysis
  } = useOptimizationAnalytics()

  const criticalRecommendations = getCriticalRecommendations()
  const quickWins = getQuickWins()
  const impactAnalysis = getImpactAnalysis()
  const optimizationTrends = getOptimizationTrends()
  const recommendationDistribution = getRecommendationDistribution()
  const roiAnalysis = getROIAnalysis()

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    if (filterType !== 'all' && rec.type !== filterType) return false
    if (filterPriority !== 'all' && rec.priority !== filterPriority) return false
    return true
  })

  const tabVariants = {
    inactive: { opacity: 0.6, y: 10 },
    active: { opacity: 1, y: 0 }
  }

  return (
    <div className={`optimization-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Optimization Recommendations
            </h2>
            <p className="text-gray-600">
              AI-powered system optimization suggestions and implementation tracking
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-orange-600">{criticalRecommendations.length}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-green-600">{quickWins.length}</div>
              <div className="text-sm text-gray-500">Quick Wins</div>
            </div>
          </div>
        </div>
        
        {lastUpdated && (
          <div className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="error-banner bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <h4 className="text-red-800 font-medium">Optimization Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'recommendations', label: 'All Recommendations', icon: '📋' },
              { id: 'quick-wins', label: 'Quick Wins', icon: '⚡' },
              { id: 'implementation', label: 'Implementation', icon: '⚙️' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        variants={tabVariants}
        initial="inactive"
        animate="active"
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={filteredRecommendations}
            selectedRecommendation={selectedRecommendation}
            setSelectedRecommendation={setSelectedRecommendation}
            filterType={filterType}
            setFilterType={setFilterType}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            implementRecommendation={implementRecommendation}
            rejectRecommendation={rejectRecommendation}
            startImplementation={startImplementation}
            isLoading={isLoading}
            isImplementing={isImplementing}
          />
        )}
        
        {activeTab === 'quick-wins' && (
          <QuickWinsTab
            quickWins={quickWins}
            implementRecommendation={implementRecommendation}
            startImplementation={startImplementation}
            isImplementing={isImplementing}
          />
        )}
        
        {activeTab === 'implementation' && (
          <ImplementationTab
            implementationHistory={implementationHistory}
            activeImplementations={activeImplementations}
            isImplementing={isImplementing}
            impactAnalysis={impactAnalysis}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab
            optimizationTrends={optimizationTrends}
            recommendationDistribution={recommendationDistribution}
            roiAnalysis={roiAnalysis}
            impactAnalysis={impactAnalysis}
          />
        )}
      </motion.div>
    </div>
  )
}

// Recommendations Tab Component
function RecommendationsTab({
  recommendations,
  selectedRecommendation,
  setSelectedRecommendation,
  filterType,
  setFilterType,
  filterPriority,
  setFilterPriority,
  implementRecommendation,
  rejectRecommendation,
  startImplementation,
  isLoading,
  isImplementing
}: {
  recommendations: OptimizationRecommendation[]
  selectedRecommendation: OptimizationRecommendation | null
  setSelectedRecommendation: (rec: OptimizationRecommendation | null) => void
  filterType: string
  setFilterType: (type: string) => void
  filterPriority: string
  setFilterPriority: (priority: string) => void
  implementRecommendation: (id: string, notes?: string) => Promise<boolean>
  rejectRecommendation: (id: string, reason: string) => void
  startImplementation: (rec: OptimizationRecommendation, execute?: boolean) => Promise<boolean>
  isLoading: boolean
  isImplementing: boolean
}) {
  return (
    <div className="recommendations-tab space-y-6">
      {/* Filters */}
      <div className="filters bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="model_switch">Model Switch</option>
              <option value="strategy_change">Strategy Change</option>
              <option value="parameter_tuning">Parameter Tuning</option>
              <option value="scaling">Scaling</option>
              <option value="cost_optimization">Cost Optimization</option>
              <option value="performance_improvement">Performance Improvement</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500 ml-auto">
            {recommendations.length} recommendations
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations List */}
        <div className="recommendations-list space-y-4">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              isSelected={selectedRecommendation?.id === recommendation.id}
              onSelect={() => setSelectedRecommendation(recommendation)}
              onImplement={() => startImplementation(recommendation, false)}
              onReject={(reason) => rejectRecommendation(recommendation.id, reason)}
              isImplementing={isImplementing}
            />
          ))}
          
          {recommendations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations</h3>
              <p>No optimization recommendations match the current filters.</p>
            </div>
          )}
        </div>

        {/* Selected Recommendation Details */}
        <div className="recommendation-details">
          {selectedRecommendation ? (
            <RecommendationDetails
              recommendation={selectedRecommendation}
              onImplement={() => startImplementation(selectedRecommendation, false)}
              onReject={(reason) => rejectRecommendation(selectedRecommendation.id, reason)}
              isImplementing={isImplementing}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Recommendation</h3>
              <p>Click on a recommendation to view detailed information and implementation options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Recommendation Card Component
function RecommendationCard({
  recommendation,
  isSelected,
  onSelect,
  onImplement,
  onReject,
  isImplementing
}: {
  recommendation: OptimizationRecommendation
  isSelected: boolean
  onSelect: () => void
  onImplement: () => void
  onReject: (reason: string) => void
  isImplementing: boolean
}) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const typeIcons = {
    model_switch: '🔄',
    strategy_change: '🎯',
    parameter_tuning: '⚙️',
    scaling: '📈',
    cost_optimization: '💰',
    performance_improvement: '⚡'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className={`recommendation-card bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{typeIcons[recommendation.type]}</span>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{recommendation.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[recommendation.priority]}`}>
                {recommendation.priority}
              </span>
              <span className="text-xs text-gray-500">
                {recommendation.implementation.complexity} complexity
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {recommendation.confidence}% confidence
          </div>
          <div className="text-xs text-gray-500">
            {recommendation.urgency}/100 urgency
          </div>
        </div>
      </div>

      {/* Expected Impact */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Performance:</span>
          <span className="ml-1 font-medium text-green-600">
            +{recommendation.expectedImpact.performanceGain.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Cost:</span>
          <span className={`ml-1 font-medium ${recommendation.expectedImpact.costSaving >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {recommendation.expectedImpact.costSaving >= 0 ? '-' : '+'}
            {Math.abs(recommendation.expectedImpact.costSaving).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Reliability:</span>
          <span className="ml-1 font-medium text-green-600">
            +{recommendation.expectedImpact.reliabilityImprovement.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">UX:</span>
          <span className="ml-1 font-medium text-green-600">
            +{recommendation.expectedImpact.userExperienceGain.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {recommendation.description}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Est. {recommendation.implementation.estimatedTimeToImplement}h to implement
        </span>
        
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowRejectModal(true)
            }}
            className="text-xs px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
          >
            Reject
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onImplement()
            }}
            disabled={isImplementing}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isImplementing ? 'Implementing...' : 'Implement'}
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Recommendation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Why are you rejecting this recommendation?
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Enter rejection reason..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onReject(rejectReason)
                    setShowRejectModal(false)
                    setRejectReason('')
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Recommendation Details Component
function RecommendationDetails({
  recommendation,
  onImplement,
  onReject,
  isImplementing
}: {
  recommendation: OptimizationRecommendation
  onImplement: () => void
  onReject: (reason: string) => void
  isImplementing: boolean
}) {
  return (
    <div className="recommendation-details bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {recommendation.title}
        </h3>
        <p className="text-gray-600">{recommendation.description}</p>
      </div>

      {/* Rationale */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Rationale</h4>
        <p className="text-sm text-gray-600">{recommendation.rationale}</p>
      </div>

      {/* Expected Impact */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Expected Impact</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Performance Gain:</span>
            <span className="text-sm font-medium text-green-600">
              +{recommendation.expectedImpact.performanceGain.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Cost Impact:</span>
            <span className={`text-sm font-medium ${recommendation.expectedImpact.costSaving >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {recommendation.expectedImpact.costSaving >= 0 ? '-' : '+'}
              {Math.abs(recommendation.expectedImpact.costSaving).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Reliability:</span>
            <span className="text-sm font-medium text-green-600">
              +{recommendation.expectedImpact.reliabilityImprovement.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">User Experience:</span>
            <span className="text-sm font-medium text-green-600">
              +{recommendation.expectedImpact.userExperienceGain.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Implementation Details */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Implementation</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Complexity:</span>
            <span className="font-medium">{recommendation.implementation.complexity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Estimated Time:</span>
            <span className="font-medium">{recommendation.implementation.estimatedTimeToImplement} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Confidence:</span>
            <span className="font-medium">{recommendation.confidence}%</span>
          </div>
        </div>

        {/* Risks */}
        {recommendation.implementation.risks.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Risks:</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              {recommendation.implementation.risks.map((risk, index) => (
                <li key={index}>• {risk}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Actions to Execute</h4>
        <div className="space-y-3">
          {recommendation.actions.map((action, index) => (
            <div key={action.actionId} className="border rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <h5 className="text-sm font-medium text-gray-900">
                  {index + 1}. {action.description}
                </h5>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {action.type}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{action.rollbackPlan}</p>
              {action.validationCriteria.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Success Criteria:</p>
                  <ul className="text-xs text-gray-600">
                    {action.validationCriteria.map((criteria, idx) => (
                      <li key={idx}>• {criteria}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onImplement}
          disabled={isImplementing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isImplementing ? 'Implementing...' : 'Implement Recommendation'}
        </button>
        <button
          onClick={() => onReject('Declined from details view')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

// Quick Wins Tab Component
function QuickWinsTab({
  quickWins,
  implementRecommendation,
  startImplementation,
  isImplementing
}: {
  quickWins: OptimizationRecommendation[]
  implementRecommendation: (id: string, notes?: string) => Promise<boolean>
  startImplementation: (rec: OptimizationRecommendation, execute?: boolean) => Promise<boolean>
  isImplementing: boolean
}) {
  return (
    <div className="quick-wins-tab space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-green-800 mb-2">🚀 Quick Wins</h3>
        <p className="text-green-700">
          These recommendations offer high impact with low implementation complexity.
          Perfect for immediate improvements to your system performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickWins.map((recommendation) => (
          <motion.div
            key={recommendation.id}
            whileHover={{ scale: 1.02 }}
            className="quick-win-card bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">⚡</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Quick Win
              </span>
            </div>

            <h4 className="font-medium text-gray-900 mb-2">{recommendation.title}</h4>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {recommendation.description}
            </p>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Impact:</span>
                <span className="font-medium text-green-600">
                  +{Math.max(recommendation.expectedImpact.performanceGain, recommendation.expectedImpact.userExperienceGain).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-medium">{recommendation.implementation.estimatedTimeToImplement}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Confidence:</span>
                <span className="font-medium">{recommendation.confidence}%</span>
              </div>
            </div>

            <button
              onClick={() => startImplementation(recommendation, false)}
              disabled={isImplementing}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isImplementing ? 'Implementing...' : 'Quick Implement'}
            </button>
          </motion.div>
        ))}
      </div>

      {quickWins.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Quick Wins Available</h3>
          <p>No low-complexity, high-impact recommendations are currently available.</p>
        </div>
      )}
    </div>
  )
}

// Implementation Tab Component
function ImplementationTab({
  implementationHistory,
  activeImplementations,
  isImplementing,
  impactAnalysis
}: {
  implementationHistory: any[]
  activeImplementations: Map<string, any>
  isImplementing: boolean
  impactAnalysis: any
}) {
  return (
    <div className="implementation-tab space-y-6">
      {/* Implementation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{impactAnalysis.implementationsCount}</div>
          <div className="text-sm text-gray-500">Total Implementations</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {impactAnalysis.successRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Success Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            +{impactAnalysis.totalActualImpact.performanceGain.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Performance Gain</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {impactAnalysis.totalActualImpact.costSaving.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Cost Savings</div>
        </div>
      </div>

      {/* Active Implementations */}
      {activeImplementations.size > 0 && (
        <div className="active-implementations bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Implementations</h3>
          <div className="space-y-4">
            {Array.from(activeImplementations.values()).map((implementation) => (
              <div key={implementation.recommendationId} className="border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    Implementation #{implementation.recommendationId.slice(-8)}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    implementation.status === 'completed' ? 'bg-green-100 text-green-800' :
                    implementation.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {implementation.status}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${implementation.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {implementation.progress}% complete
                  </div>
                </div>
                <p className="text-sm text-gray-600">{implementation.currentAction}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation History */}
      <div className="implementation-history bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation History</h3>
        <div className="space-y-4">
          {implementationHistory.map((implementation, index) => (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  Implementation #{implementation.recommendationId.slice(-8)}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    implementation.result === 'success' ? 'bg-green-100 text-green-800' :
                    implementation.result === 'failure' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {implementation.result}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(implementation.implementedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Performance:</span>
                  <span className="ml-1 font-medium text-green-600">
                    +{implementation.impact.actualPerformanceGain.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Cost:</span>
                  <span className={`ml-1 font-medium ${implementation.impact.actualCostSaving >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {implementation.impact.actualCostSaving >= 0 ? '-' : '+'}
                    {Math.abs(implementation.impact.actualCostSaving).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Reliability:</span>
                  <span className="ml-1 font-medium text-green-600">
                    +{implementation.impact.actualReliabilityImprovement.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">UX:</span>
                  <span className="ml-1 font-medium text-green-600">
                    +{implementation.impact.actualUserExperienceGain.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {implementation.notes && (
                <p className="text-sm text-gray-600 mt-2">{implementation.notes}</p>
              )}
            </div>
          ))}
          
          {implementationHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Implementation History</h4>
              <p>Implementation history will appear here once you start implementing recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab({
  optimizationTrends,
  recommendationDistribution,
  roiAnalysis,
  impactAnalysis
}: {
  optimizationTrends: any[]
  recommendationDistribution: any
  roiAnalysis: any
  impactAnalysis: any
}) {
  return (
    <div className="analytics-tab space-y-6">
      {/* ROI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {roiAnalysis.roi.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">ROI</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${roiAnalysis.totalActualSavings.toFixed(0)}
          </div>
          <div className="text-sm text-gray-500">Total Savings</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {roiAnalysis.paybackPeriod !== Infinity ? `${roiAnalysis.paybackPeriod.toFixed(1)} months` : '∞'}
          </div>
          <div className="text-sm text-gray-500">Payback Period</div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations by Type</h3>
          <div className="space-y-3">
            {Object.entries(recommendationDistribution.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${((count as number) / Math.max(...Object.values(recommendationDistribution.byType) as number[])) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations by Priority</h3>
          <div className="space-y-3">
            {Object.entries(recommendationDistribution.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{priority}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className={`h-2 rounded-full ${
                        priority === 'critical' ? 'bg-red-600' :
                        priority === 'high' ? 'bg-orange-600' :
                        priority === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}
                      style={{ 
                        width: `${((count as number) / Math.max(...Object.values(recommendationDistribution.byPriority) as number[])) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optimization Trends */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Trends (Last 4 Weeks)</h3>
        <div className="grid grid-cols-4 gap-4">
          {optimizationTrends.map((week, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-blue-600">{week.implementations}</div>
              <div className="text-sm text-gray-500">{week.week}</div>
              <div className="text-xs text-gray-400">
                {week.successRate.toFixed(1)}% success
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cumulative Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              +{impactAnalysis.totalActualImpact.performanceGain.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Performance Gain</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {impactAnalysis.totalActualImpact.costSaving >= 0 ? '-' : '+'}
              {Math.abs(impactAnalysis.totalActualImpact.costSaving).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Cost Impact</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              +{impactAnalysis.totalActualImpact.reliabilityImprovement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Reliability</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              +{impactAnalysis.totalActualImpact.userExperienceGain.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">User Experience</div>
          </div>
        </div>
      </div>
    </div>
  )
}