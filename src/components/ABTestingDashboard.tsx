// A/B Testing Dashboard
// Comprehensive interface for creating, managing, and analyzing A/B tests
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Beaker, TrendingUp, Target, Users, Clock, Zap,
  Plus, Play, Pause, BarChart3, PieChart, Settings,
  AlertTriangle, CheckCircle, Eye, Filter, Download,
  ArrowUp, ArrowDown, Activity, Award, Brain, 
  RefreshCw, Calendar, Percent, Flag
} from 'lucide-react'
import type { UserProfile } from '@/types'
import { 
  useABTesting,
  useTestAnalytics,
  useQuickABTest,
  useMultiArmedBandit
} from '@/hooks/useABTesting'
import type { ABTest, ABTestResults, TestVariant } from '@/lib/ab-testing-framework'

interface ABTestingDashboardProps {
  userProfile?: UserProfile
  className?: string
}

export default function ABTestingDashboard({
  userProfile,
  className = ''
}: ABTestingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'analytics' | 'create'>('overview')
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const {
    tests,
    activeTests,
    completedTests,
    isLoading,
    error,
    startTest,
    analyzeTest,
    clearError
  } = useABTesting()

  const {
    getTestOverview,
    getTestMetrics,
    getSignificanceTrends,
    getRecommendationsSummary,
    calculateBusinessImpact
  } = useTestAnalytics()

  const { createAndStartTest } = useQuickABTest()
  const { getBanditPerformance } = useMultiArmedBandit()

  const overview = getTestOverview()
  const recommendationsSummary = getRecommendationsSummary()

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Beaker className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">A/B Testing Framework</h2>
              <p className="text-purple-100">Advanced experimentation platform for AI model optimization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Summary Stats */}
            <div className="text-center">
              <div className="text-2xl font-bold">{overview.runningTests}</div>
              <div className="text-xs text-purple-200">Active Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overview.successfulTests}</div>
              <div className="text-xs text-purple-200">Successful Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(overview.successRate * 100).toFixed(0)}%</div>
              <div className="text-xs text-purple-200">Success Rate</div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Test</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center space-x-1 bg-white/10 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-purple-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tests'
                ? 'bg-white text-purple-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-purple-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-purple-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Create Test
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-500 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-800">{error}</span>
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

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            overview={overview}
            recommendationsSummary={recommendationsSummary}
            activeTests={activeTests}
            completedTests={completedTests}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'tests' && (
          <TestsTab
            tests={tests}
            activeTests={activeTests}
            completedTests={completedTests}
            selectedTest={selectedTest}
            onSelectTest={setSelectedTest}
            onStartTest={startTest}
            onAnalyzeTest={analyzeTest}
            getTestMetrics={getTestMetrics}
            getSignificanceTrends={getSignificanceTrends}
            getBanditPerformance={getBanditPerformance}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            tests={tests}
            getTestMetrics={getTestMetrics}
            calculateBusinessImpact={calculateBusinessImpact}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'create' && (
          <CreateTestTab
            onCreateTest={createAndStartTest}
            userProfile={userProfile}
          />
        )}
      </div>

      {/* Create Test Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <QuickTestModal
            onClose={() => setShowCreateModal(false)}
            onCreateTest={createAndStartTest}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Overview Tab Component
interface OverviewTabProps {
  overview: any
  recommendationsSummary: any
  activeTests: ABTest[]
  completedTests: ABTest[]
  isLoading: boolean
}

function OverviewTab({ 
  overview, 
  recommendationsSummary, 
  activeTests, 
  completedTests,
  isLoading 
}: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tests"
          value={overview.totalTests}
          icon={Beaker}
          color="blue"
        />
        <MetricCard
          title="Running Tests"
          value={overview.runningTests}
          icon={Activity}
          color="green"
        />
        <MetricCard
          title="Success Rate"
          value={`${(overview.successRate * 100).toFixed(0)}%`}
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="High Priority Actions"
          value={recommendationsSummary.highPriorityCount}
          icon={Flag}
          color="red"
        />
      </div>

      {/* Test Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-purple-500" />
            Test Status Distribution
          </h3>
          <div className="space-y-3">
            <StatusBar
              label="Completed"
              count={overview.completedTestsCount}
              total={overview.totalTests}
              color="green"
            />
            <StatusBar
              label="Running"
              count={overview.runningTests}
              total={overview.totalTests}
              color="blue"
            />
            <StatusBar
              label="Successful"
              count={overview.successfulTests}
              total={overview.completedTestsCount || 1}
              color="purple"
            />
            <StatusBar
              label="Inconclusive"
              count={overview.inconclusiveTests}
              total={overview.completedTestsCount || 1}
              color="yellow"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            Recommendations Summary
          </h3>
          <div className="space-y-3">
            {Object.entries(recommendationsSummary.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="capitalize text-gray-600">{type.replace('_', ' ')}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Active Tests */}
      {activeTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Currently Running Tests</h3>
          <div className="space-y-3">
            {activeTests.slice(0, 5).map(test => (
              <ActiveTestCard key={test.testId} test={test} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Tests */}
      {completedTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recently Completed Tests</h3>
          <div className="space-y-3">
            {completedTests.slice(0, 3).map(test => (
              <CompletedTestCard key={test.testId} test={test} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Tests Tab Component
interface TestsTabProps {
  tests: ABTest[]
  activeTests: ABTest[]
  completedTests: ABTest[]
  selectedTest: string | null
  onSelectTest: (testId: string | null) => void
  onStartTest: (testId: string) => void
  onAnalyzeTest: (testId: string) => void
  getTestMetrics: (testId: string) => any
  getSignificanceTrends: (testId: string) => any
  getBanditPerformance: (testId: string) => any
  isLoading: boolean
}

function TestsTab({ 
  tests, 
  activeTests, 
  completedTests, 
  selectedTest, 
  onSelectTest, 
  onStartTest, 
  onAnalyzeTest,
  getTestMetrics,
  getSignificanceTrends,
  getBanditPerformance,
  isLoading 
}: TestsTabProps) {
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'draft'>('all')
  
  const filteredTests = tests.filter(test => {
    if (filter === 'all') return true
    return test.status === filter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Tests ({tests.length})</option>
            <option value="running">Running ({activeTests.length})</option>
            <option value="completed">Completed ({completedTests.length})</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-500">
          {filteredTests.length} tests
        </div>
      </div>

      {/* Tests List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTests.map(test => (
          <TestCard
            key={test.testId}
            test={test}
            isSelected={selectedTest === test.testId}
            onClick={() => onSelectTest(
              selectedTest === test.testId ? null : test.testId
            )}
            onStartTest={() => onStartTest(test.testId)}
            onAnalyzeTest={() => onAnalyzeTest(test.testId)}
            metrics={getTestMetrics(test.testId)}
            trends={getSignificanceTrends(test.testId)}
            banditPerformance={getBanditPerformance(test.testId)}
          />
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <Beaker className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tests Found</h3>
          <p className="text-gray-500">No tests match the current filter</p>
        </div>
      )}
    </div>
  )
}

// Analytics Tab Component
interface AnalyticsTabProps {
  tests: ABTest[]
  getTestMetrics: (testId: string) => any
  calculateBusinessImpact: (testId: string) => any
  isLoading: boolean
}

function AnalyticsTab({ 
  tests, 
  getTestMetrics, 
  calculateBusinessImpact,
  isLoading 
}: AnalyticsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Test Analytics & Insights</h3>
      
      {/* Test Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.filter(test => test.results).map(test => {
          const metrics = getTestMetrics(test.testId)
          const impact = calculateBusinessImpact(test.testId)
          
          return (
            <TestAnalyticsCard
              key={test.testId}
              test={test}
              metrics={metrics}
              impact={impact}
            />
          )
        })}
      </div>
      
      {tests.filter(test => test.results).length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analytics Data</h3>
          <p className="text-gray-500">Complete some tests to see analytics</p>
        </div>
      )}
    </div>
  )
}

// Create Test Tab Component
interface CreateTestTabProps {
  onCreateTest: (config: any) => Promise<any>
  userProfile?: UserProfile
}

function CreateTestTab({ onCreateTest, userProfile }: CreateTestTabProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    controlModelId: 'gpt-4o-mini',
    treatmentModelId: 'claude-3-sonnet',
    useCase: 'general',
    duration: 14,
    minimumSampleSize: 1000
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      await onCreateTest(formData)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        controlModelId: 'gpt-4o-mini',
        treatmentModelId: 'claude-3-sonnet',
        useCase: 'general',
        duration: 14,
        minimumSampleSize: 1000
      })
    } catch (error) {
      console.error('Failed to create test:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-6">Create New A/B Test</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Basic Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., GPT vs Claude for Mathematics"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Describe the purpose and hypothesis of this test"
              required
            />
          </div>
        </div>

        {/* Model Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Model Configuration</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Control Model
              </label>
              <select
                value={formData.controlModelId}
                onChange={(e) => setFormData(prev => ({ ...prev, controlModelId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Model
              </label>
              <select
                value={formData.treatmentModelId}
                onChange={(e) => setFormData(prev => ({ ...prev, treatmentModelId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Use Case
            </label>
            <select
              value={formData.useCase}
              onChange={(e) => setFormData(prev => ({ ...prev, useCase: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="general">General</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="programming">Programming</option>
              <option value="creative_writing">Creative Writing</option>
              <option value="language_learning">Language Learning</option>
            </select>
          </div>
        </div>

        {/* Test Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Test Parameters</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (days)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                max="90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Sample Size
              </label>
              <input
                type="number"
                value={formData.minimumSampleSize}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumSampleSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="100"
                step="100"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCreating}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Beaker className="w-4 h-4" />
                <span>Create & Start Test</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Helper Components
function MetricCard({ title, value, icon: Icon, color }: {
  title: string
  value: string | number
  icon: any
  color: string
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-75" />
      </div>
    </div>
  )
}

function StatusBar({ label, count, total, color }: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{count}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function ActiveTestCard({ test }: { test: ABTest }) {
  const totalExposures = test.variants.reduce((sum, v) => sum + v.exposures, 0)
  const progress = test.minimumSampleSize > 0 ? 
    Math.min(100, (totalExposures / test.minimumSampleSize) * 100) : 0

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{test.name}</h4>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600">Running</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{test.description}</p>
      
      <div className="flex items-center justify-between text-sm">
        <span>Progress: {totalExposures}/{test.minimumSampleSize}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div
          className="h-2 rounded-full bg-green-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function CompletedTestCard({ test }: { test: ABTest }) {
  const winner = test.results?.winningVariant
  const confidence = test.results?.confidence || 0

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{test.name}</h4>
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-blue-600">Completed</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span>Winner: {winner || 'Inconclusive'}</span>
        <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

function TestCard({ test, isSelected, onClick, onStartTest, onAnalyzeTest, metrics, trends, banditPerformance }: {
  test: ABTest
  isSelected: boolean
  onClick: () => void
  onStartTest: () => void
  onAnalyzeTest: () => void
  metrics: any
  trends: any
  banditPerformance: any
}) {
  const getStatusIcon = () => {
    switch (test.status) {
      case 'running': return <Activity className="w-4 h-4 text-green-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />
      case 'draft': return <Settings className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (test.status) {
      case 'running': return 'bg-green-100 text-green-700 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <motion.div
      layout
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold">{test.name}</h4>
            <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor()}`}>
              {getStatusIcon()}
              {test.status}
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {test.testType.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{test.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{test.variants.length} variants</span>
            <span>•</span>
            <span>{test.category}</span>
            {metrics && (
              <>
                <span>•</span>
                <span>{metrics.totalExposures} exposures</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {test.status === 'draft' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartTest()
              }}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm transition-colors"
            >
              Start
            </button>
          )}
          {test.status === 'running' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAnalyzeTest()
              }}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors"
            >
              Analyze
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t pt-3 mt-3"
        >
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Exposures:</span>
                <div className="font-medium">{metrics.totalExposures}</div>
              </div>
              <div>
                <span className="text-gray-600">Conversions:</span>
                <div className="font-medium">{metrics.totalConversions}</div>
              </div>
              <div>
                <span className="text-gray-600">Conversion Rate:</span>
                <div className="font-medium">{(metrics.overallConversionRate * 100).toFixed(2)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <div className="font-medium">{Math.floor(metrics.duration / (1000 * 60 * 60 * 24))}d</div>
              </div>
            </div>
          )}

          {trends && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium mb-2">Statistical Significance</div>
              <div className="flex items-center justify-between text-sm">
                <span>P-value: {trends.currentPValue.toFixed(4)}</span>
                <span>Confidence: {(trends.currentConfidence * 100).toFixed(0)}%</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  trends.isSignificant ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {trends.isSignificant ? 'Significant' : 'Not Significant'}
                </span>
              </div>
            </div>
          )}

          {banditPerformance && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <div className="text-sm font-medium mb-2">Bandit Performance</div>
              <div className="space-y-1">
                {banditPerformance.variants.map((variant: any) => (
                  <div key={variant.variantId} className="flex justify-between text-sm">
                    <span>{variant.name}</span>
                    <span className={variant.isWinning ? 'font-bold text-blue-600' : ''}>
                      {(variant.conversionRate * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

function TestAnalyticsCard({ test, metrics, impact }: {
  test: ABTest
  metrics: any
  impact: any
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h4 className="font-semibold mb-4">{test.name}</h4>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Exposures:</span>
            <div className="font-medium">{metrics?.totalExposures || 0}</div>
          </div>
          <div>
            <span className="text-gray-600">Conversion Rate:</span>
            <div className="font-medium">{((metrics?.overallConversionRate || 0) * 100).toFixed(2)}%</div>
          </div>
        </div>

        {impact && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Business Impact</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Relative Improvement:</span>
                <span className="font-medium">{impact.relativeImprovement.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-medium">{(impact.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickTestModal({ onClose, onCreateTest }: {
  onClose: () => void
  onCreateTest: (config: any) => Promise<any>
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    controlModelId: 'gpt-4o-mini',
    treatmentModelId: 'claude-3-sonnet',
    useCase: 'general'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreateTest(formData)
    onClose()
  }

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
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Quick A/B Test</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter test name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
              placeholder="Brief description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Control Model
              </label>
              <select
                value={formData.controlModelId}
                onChange={(e) => setFormData(prev => ({ ...prev, controlModelId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Model
              </label>
              <select
                value={formData.treatmentModelId}
                onChange={(e) => setFormData(prev => ({ ...prev, treatmentModelId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Use Case
            </label>
            <select
              value={formData.useCase}
              onChange={(e) => setFormData(prev => ({ ...prev, useCase: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="general">General</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="programming">Programming</option>
              <option value="creative_writing">Creative Writing</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Create & Start Test
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}