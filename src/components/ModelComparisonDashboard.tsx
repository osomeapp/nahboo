// Model Comparison Dashboard
// A/B testing and optimization interface for AI model performance
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, TrendingUp, TrendingDown, Play, Pause, 
  Plus, Eye, Settings, Award, AlertTriangle, CheckCircle,
  XCircle, Clock, Users, Target, Zap, Download, Filter,
  ArrowRight, ArrowUp, ArrowDown, Minus, Star, Brain
} from 'lucide-react'
import type { UserProfile } from '@/types'
import { 
  useModelComparison,
  useABTesting,
  useOptimizationRecommendations,
  useBenchmarking
} from '@/hooks/useModelComparison'
import type { ModelTest, TestResults, OptimizationRecommendation } from '@/lib/model-comparison-engine'

interface ModelComparisonDashboardProps {
  userProfile?: UserProfile
  className?: string
}

export default function ModelComparisonDashboard({
  userProfile,
  className = ''
}: ModelComparisonDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tests' | 'recommendations' | 'benchmarks'>('tests')
  const [showCreateTest, setShowCreateTest] = useState(false)
  
  const {
    tests,
    activeTests,
    completedTests,
    isLoading,
    error,
    createTest,
    startTest,
    analyzeTest,
    clearError
  } = useModelComparison()

  const {
    testSummary,
    createQuickABTest
  } = useABTesting()

  const {
    allRecommendations,
    actionableRecommendations,
    totalPotentialImpact
  } = useOptimizationRecommendations()

  const {
    benchmarks,
    runBenchmark,
    compareModels
  } = useBenchmarking()

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Model Comparison & Optimization</h2>
              <p className="text-green-100">A/B testing and performance optimization for AI models</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Summary Stats */}
            <div className="text-center">
              <div className="text-2xl font-bold">{testSummary.running}</div>
              <div className="text-xs text-green-200">Active Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{actionableRecommendations.length}</div>
              <div className="text-xs text-green-200">Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(totalPotentialImpact * 100).toFixed(0)}%</div>
              <div className="text-xs text-green-200">Potential Impact</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center space-x-1 bg-white/10 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tests'
                ? 'bg-white text-green-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            A/B Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-white text-green-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Recommendations ({allRecommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'benchmarks'
                ? 'bg-white text-green-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Benchmarks ({benchmarks.length})
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
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'tests' && (
          <TestsTab
            tests={tests}
            activeTests={activeTests}
            completedTests={completedTests}
            isLoading={isLoading}
            onCreateTest={() => setShowCreateTest(true)}
            onStartTest={startTest}
            onAnalyzeTest={analyzeTest}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={allRecommendations}
            actionableRecommendations={actionableRecommendations}
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarksTab
            benchmarks={benchmarks}
            onRunBenchmark={runBenchmark}
            onCompareModels={compareModels}
          />
        )}
      </div>

      {/* Create Test Modal */}
      <AnimatePresence>
        {showCreateTest && (
          <CreateTestModal
            onClose={() => setShowCreateTest(false)}
            onCreateTest={createQuickABTest}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Tests Tab Component
interface TestsTabProps {
  tests: ModelTest[]
  activeTests: ModelTest[]
  completedTests: ModelTest[]
  isLoading: boolean
  onCreateTest: () => void
  onStartTest: (testId: string) => void
  onAnalyzeTest: (testId: string) => void
}

function TestsTab({ 
  tests, 
  activeTests, 
  completedTests, 
  isLoading, 
  onCreateTest, 
  onStartTest, 
  onAnalyzeTest 
}: TestsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">A/B Tests</h3>
        <button
          onClick={onCreateTest}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Test</span>
        </button>
      </div>

      {/* Active Tests */}
      {activeTests.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Play className="w-4 h-4 mr-2 text-green-500" />
            Active Tests ({activeTests.length})
          </h4>
          <div className="space-y-3">
            {activeTests.map(test => (
              <TestCard
                key={test.testId}
                test={test}
                onAnalyze={() => onAnalyzeTest(test.testId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
            Completed Tests ({completedTests.length})
          </h4>
          <div className="space-y-3">
            {completedTests.slice(0, 5).map(test => (
              <TestCard
                key={test.testId}
                test={test}
                showResults={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft Tests */}
      {tests.filter(t => t.status === 'draft').length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-gray-500" />
            Draft Tests
          </h4>
          <div className="space-y-3">
            {tests.filter(t => t.status === 'draft').map(test => (
              <TestCard
                key={test.testId}
                test={test}
                onStart={() => onStartTest(test.testId)}
              />
            ))}
          </div>
        </div>
      )}

      {tests.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tests Yet</h3>
          <p className="text-gray-500 mb-4">Create your first A/B test to compare model performance</p>
          <button
            onClick={onCreateTest}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Create Your First Test
          </button>
        </div>
      )}
    </div>
  )
}

// Test Card Component
interface TestCardProps {
  test: ModelTest
  showResults?: boolean
  onStart?: () => void
  onAnalyze?: () => void
}

function TestCard({ test, showResults = false, onStart, onAnalyze }: TestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return Play
      case 'completed': return CheckCircle
      case 'paused': return Pause
      case 'draft': return Settings
      default: return Clock
    }
  }

  const StatusIcon = getStatusIcon(test.status)

  return (
    <motion.div
      layout
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-gray-900">{test.name}</h4>
            <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(test.status)}`}>
              <StatusIcon className="w-3 h-3 inline mr-1" />
              {test.status}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{test.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{test.modelA} vs {test.modelB}</span>
            <span>•</span>
            <span>{test.useCase}</span>
            <span>•</span>
            <span>{(test.trafficSplit * 100).toFixed(0)}% split</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onStart && (
            <button
              onClick={onStart}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm transition-colors"
            >
              Start
            </button>
          )}
          {onAnalyze && (
            <button
              onClick={onAnalyze}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors"
            >
              Analyze
            </button>
          )}
        </div>
      </div>

      {/* Test Results */}
      {showResults && test.results && (
        <div className="border-t pt-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Sample Size:</span>
              <div className="font-medium">
                {test.results.sampleSizeA + test.results.sampleSizeB}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Confidence:</span>
              <div className="font-medium">{(test.results.confidence * 100).toFixed(0)}%</div>
            </div>
            <div>
              <span className="text-gray-600">Winner:</span>
              <div className="font-medium">
                {test.results.status === 'model_b_wins' ? test.modelB :
                 test.results.status === 'model_a_wins' ? test.modelA : 'No clear winner'}
              </div>
            </div>
          </div>
          
          {test.results.primaryMetricResults && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium mb-1">{test.primaryMetric.name}</div>
              <div className="flex items-center space-x-4 text-sm">
                <span>{test.modelA}: {test.results.primaryMetricResults.valueA.toFixed(2)}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span>{test.modelB}: {test.results.primaryMetricResults.valueB.toFixed(2)}</span>
                <span className={`flex items-center ${
                  test.results.primaryMetricResults.effect === 'positive' ? 'text-green-600' :
                  test.results.primaryMetricResults.effect === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {test.results.primaryMetricResults.effect === 'positive' ? <ArrowUp className="w-3 h-3" /> :
                   test.results.primaryMetricResults.effect === 'negative' ? <ArrowDown className="w-3 h-3" /> :
                   <Minus className="w-3 h-3" />}
                  {Math.abs(test.results.primaryMetricResults.percentChange).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Recommendations Tab Component
interface RecommendationsTabProps {
  recommendations: OptimizationRecommendation[]
  actionableRecommendations: OptimizationRecommendation[]
}

function RecommendationsTab({ recommendations, actionableRecommendations }: RecommendationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
        <div className="text-sm text-gray-500">
          {actionableRecommendations.length} actionable recommendations
        </div>
      </div>

      {/* Actionable Recommendations */}
      {actionableRecommendations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-500" />
            Quick Wins ({actionableRecommendations.length})
          </h4>
          <div className="space-y-3">
            {actionableRecommendations.map(rec => (
              <RecommendationCard key={rec.recommendationId} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* All Recommendations */}
      <div>
        <h4 className="font-semibold mb-3">All Recommendations</h4>
        <div className="space-y-3">
          {recommendations.map(rec => (
            <RecommendationCard key={rec.recommendationId} recommendation={rec} />
          ))}
        </div>
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recommendations</h3>
          <p className="text-gray-500">Complete some A/B tests to get optimization recommendations</p>
        </div>
      )}
    </div>
  )
}

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: OptimizationRecommendation
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800'
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800'
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800'
      default: return 'border-blue-500 bg-blue-50 text-blue-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'model_replacement': return Brain
      case 'traffic_allocation': return Target
      case 'cost_optimization': return TrendingDown
      case 'quality_improvement': return Star
      default: return Settings
    }
  }

  const TypeIcon = getTypeIcon(recommendation.type)

  return (
    <motion.div
      layout
      className={`border rounded-lg p-4 ${getPriorityColor(recommendation.priority)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <TypeIcon className="w-5 h-5 mt-0.5" />
          <div>
            <h4 className="font-semibold">{recommendation.title}</h4>
            <p className="text-sm opacity-90 mt-1">{recommendation.description}</p>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${
          recommendation.priority === 'critical' ? 'bg-red-100' :
          recommendation.priority === 'high' ? 'bg-orange-100' :
          recommendation.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
        }`}>
          {recommendation.priority}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="opacity-75">Expected Impact:</span>
          <div className="font-medium">
            {recommendation.expectedImpact.length > 0 && 
              `+${(recommendation.expectedImpact[0].improvement * 100).toFixed(1)}%`
            }
          </div>
        </div>
        <div>
          <span className="opacity-75">Effort:</span>
          <div className="font-medium capitalize">{recommendation.implementationEffort}</div>
        </div>
        <div>
          <span className="opacity-75">Time:</span>
          <div className="font-medium">{recommendation.estimatedTime}h</div>
        </div>
        <div>
          <span className="opacity-75">Evidence:</span>
          <div className="font-medium capitalize">{recommendation.evidenceSource.replace('_', ' ')}</div>
        </div>
      </div>
    </motion.div>
  )
}

// Benchmarks Tab Component
interface BenchmarksTabProps {
  benchmarks: any[]
  onRunBenchmark: (modelId: string, useCase: string) => void
  onCompareModels: (modelA: string, modelB: string, useCase: string) => any
}

function BenchmarksTab({ benchmarks, onRunBenchmark, onCompareModels }: BenchmarksTabProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedUseCase, setSelectedUseCase] = useState<string>('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Benchmarks</h3>
        <button
          onClick={() => onRunBenchmark('gpt-4o-mini', 'general')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Run Benchmark
        </button>
      </div>

      {benchmarks.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Benchmarks</h3>
          <p className="text-gray-500">Run benchmarks to compare model performance</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benchmarks.map(benchmark => (
            <div key={benchmark.benchmarkId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{benchmark.name}</h4>
                <div className="text-2xl font-bold text-green-600">
                  {(benchmark.overallScore * 100).toFixed(0)}
                </div>
              </div>
              <div className="space-y-2">
                {benchmark.metrics.map((metric: any) => (
                  <div key={metric.metricId} className="flex justify-between text-sm">
                    <span className="capitalize">{metric.metricId.replace('_', ' ')}</span>
                    <span className="font-medium">{(metric.score * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Create Test Modal Component
interface CreateTestModalProps {
  onClose: () => void
  onCreateTest: (name: string, modelA: string, modelB: string, useCase: string) => void
}

function CreateTestModal({ onClose, onCreateTest }: CreateTestModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    modelA: 'gpt-4o-mini',
    modelB: 'claude-3-haiku',
    useCase: 'general'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateTest(formData.name, formData.modelA, formData.modelB, formData.useCase)
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
        <h3 className="text-lg font-semibold mb-4">Create A/B Test</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter test name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model A
              </label>
              <select
                value={formData.modelA}
                onChange={(e) => setFormData(prev => ({ ...prev, modelA: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model B
              </label>
              <select
                value={formData.modelB}
                onChange={(e) => setFormData(prev => ({ ...prev, modelB: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Create Test
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}