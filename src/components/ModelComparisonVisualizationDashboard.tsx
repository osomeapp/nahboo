'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  modelPerformanceBenchmarking,
  type BenchmarkResult,
  type ModelComparison,
  type BenchmarkTest
} from '@/lib/model-performance-benchmarking'
import { useModelComparison } from '@/hooks/useModelComparison'

interface ModelComparisonVisualizationDashboardProps {
  className?: string
}

export default function ModelComparisonVisualizationDashboard({
  className = ''
}: ModelComparisonVisualizationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'benchmarks' | 'comparisons' | 'detailed'>('overview')
  const [selectedModels, setSelectedModels] = useState<string[]>(['openai-gpt-4o-mini', 'claude-3-haiku'])
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false)
  
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])
  const [modelComparisons, setModelComparisons] = useState<ModelComparison[]>([])
  const [availableTests, setAvailableTests] = useState<BenchmarkTest[]>([])

  const { tests, createTest, analyzeTest } = useModelComparison()

  // Load data on mount
  useEffect(() => {
    loadBenchmarkData()
  }, [])

  const loadBenchmarkData = () => {
    const results = modelPerformanceBenchmarking.getBenchmarkResults()
    const comparisons = modelPerformanceBenchmarking.getModelComparisons()
    const tests = modelPerformanceBenchmarking.getBenchmarkTests()
    
    setBenchmarkResults(results)
    setModelComparisons(comparisons)
    setAvailableTests(tests)
  }

  // Run benchmark on selected models
  const runBenchmark = async (testId: string, modelIds: string[]) => {
    setIsRunningBenchmark(true)
    try {
      for (const modelId of modelIds) {
        await modelPerformanceBenchmarking.runBenchmark(testId, modelId)
      }
      loadBenchmarkData()
    } catch (error) {
      console.error('Benchmark failed:', error)
    }
    setIsRunningBenchmark(false)
  }

  // Run comprehensive comparison
  const runComprehensiveComparison = async () => {
    setIsRunningBenchmark(true)
    try {
      await modelPerformanceBenchmarking.runComprehensiveBenchmark(selectedModels)
      loadBenchmarkData()
    } catch (error) {
      console.error('Comprehensive comparison failed:', error)
    }
    setIsRunningBenchmark(false)
  }

  const tabVariants = {
    inactive: { opacity: 0.6, y: 10 },
    active: { opacity: 1, y: 0 }
  }

  return (
    <div className={`model-comparison-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Model Performance Comparison
            </h2>
            <p className="text-gray-600">
              Comprehensive AI model benchmarking and performance visualization
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-blue-600">{benchmarkResults.length}</div>
              <div className="text-sm text-gray-500">Total Results</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-green-600">{availableTests.length}</div>
              <div className="text-sm text-gray-500">Benchmark Tests</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-purple-600">{modelComparisons.length}</div>
              <div className="text-sm text-gray-500">Comparisons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="model-selection bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Model Selection</h3>
        <div className="flex flex-wrap gap-3">
          {['openai-gpt-4o-mini', 'claude-3-haiku', 'claude-3-sonnet'].map((modelId) => (
            <label key={modelId} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedModels.includes(modelId)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedModels([...selectedModels, modelId])
                  } else {
                    setSelectedModels(selectedModels.filter(id => id !== modelId))
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">{modelId}</span>
            </label>
          ))}
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button
            onClick={runComprehensiveComparison}
            disabled={isRunningBenchmark || selectedModels.length < 2}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunningBenchmark ? 'Running...' : 'Run Comprehensive Comparison'}
          </button>
          
          {selectedModels.length > 0 && (
            <span className="text-sm text-gray-500 py-2">
              {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'benchmarks', label: 'Benchmark Results', icon: '🎯' },
              { id: 'comparisons', label: 'Model Comparisons', icon: '⚖️' },
              { id: 'detailed', label: 'Detailed Analysis', icon: '🔍' }
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
        {activeTab === 'overview' && (
          <OverviewTab
            benchmarkResults={benchmarkResults}
            modelComparisons={modelComparisons}
            selectedModels={selectedModels}
          />
        )}
        
        {activeTab === 'benchmarks' && (
          <BenchmarksTab
            availableTests={availableTests}
            benchmarkResults={benchmarkResults}
            selectedModels={selectedModels}
            runBenchmark={runBenchmark}
            isRunningBenchmark={isRunningBenchmark}
          />
        )}
        
        {activeTab === 'comparisons' && (
          <ComparisonsTab
            modelComparisons={modelComparisons}
            benchmarkResults={benchmarkResults}
          />
        )}
        
        {activeTab === 'detailed' && (
          <DetailedAnalysisTab
            benchmarkResults={benchmarkResults}
            availableTests={availableTests}
            selectedTest={selectedTest}
            setSelectedTest={setSelectedTest}
          />
        )}
      </motion.div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({
  benchmarkResults,
  modelComparisons,
  selectedModels
}: {
  benchmarkResults: BenchmarkResult[]
  modelComparisons: ModelComparison[]
  selectedModels: string[]
}) {
  // Calculate overview statistics
  const modelStats = selectedModels.map(modelId => {
    const modelResults = benchmarkResults.filter(r => r.modelId === modelId)
    const avgScore = modelResults.length > 0 
      ? modelResults.reduce((sum, r) => sum + r.overallScore, 0) / modelResults.length 
      : 0
    const avgLatency = modelResults.length > 0
      ? modelResults.reduce((sum, r) => sum + r.averageLatency, 0) / modelResults.length
      : 0
    const avgCost = modelResults.length > 0
      ? modelResults.reduce((sum, r) => sum + r.totalCost, 0) / modelResults.length
      : 0

    return {
      modelId,
      avgScore,
      avgLatency,
      avgCost,
      testCount: modelResults.length,
      successRate: modelResults.length > 0
        ? modelResults.reduce((sum, r) => sum + r.successRate, 0) / modelResults.length
        : 0
    }
  })

  const latestComparison = modelComparisons[modelComparisons.length - 1]

  return (
    <div className="overview-tab space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelStats.map((stats) => (
          <motion.div
            key={stats.modelId}
            whileHover={{ scale: 1.02 }}
            className="model-summary-card bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">{stats.modelId}</h3>
              <div className={`w-3 h-3 rounded-full ${
                stats.avgScore > 80 ? 'bg-green-500' :
                stats.avgScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>

            {/* Performance Score */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Performance Score</span>
                <span className="font-medium">{stats.avgScore.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats.avgScore}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Latency</span>
                <span className="font-medium">{stats.avgLatency.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Cost</span>
                <span className="font-medium">${stats.avgCost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Success Rate</span>
                <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tests</span>
                <span className="font-medium">{stats.testCount}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Comparison Chart */}
      <div className="performance-chart bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Score Comparison */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Overall Score</h4>
            <div className="space-y-3">
              {modelStats.map((stats) => (
                <div key={stats.modelId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stats.modelId}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${stats.avgScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{stats.avgScore.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latency Comparison */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Average Latency</h4>
            <div className="space-y-3">
              {modelStats.map((stats) => {
                const maxLatency = Math.max(...modelStats.map(s => s.avgLatency))
                const latencyPercent = maxLatency > 0 ? (stats.avgLatency / maxLatency) * 100 : 0
                
                return (
                  <div key={stats.modelId} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{stats.modelId}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${latencyPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{stats.avgLatency.toFixed(0)}ms</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost Comparison */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Average Cost</h4>
            <div className="space-y-3">
              {modelStats.map((stats) => {
                const maxCost = Math.max(...modelStats.map(s => s.avgCost))
                const costPercent = maxCost > 0 ? (stats.avgCost / maxCost) * 100 : 0
                
                return (
                  <div key={stats.modelId} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{stats.modelId}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${costPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">${stats.avgCost.toFixed(4)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Comparison Results */}
      {latestComparison && (
        <div className="latest-comparison bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Comparison Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Rankings */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Model Rankings</h4>
              <div className="space-y-3">
                {latestComparison.rankings.slice(0, 5).map((ranking) => (
                  <div key={ranking.modelId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mr-3">
                        {ranking.rank}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{ranking.modelId}</span>
                    </div>
                    <span className="text-sm text-gray-500">{ranking.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Winners */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Category Winners</h4>
              <div className="space-y-2">
                {Object.entries(latestComparison.categoryWinners).map(([category, winner]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{category}</span>
                    <span className="font-medium text-gray-900">{winner}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cost Efficiency</span>
                  <span className="font-medium text-gray-900">{latestComparison.costEfficiencyLeader}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          {latestComparison.keyInsights.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-3">Key Insights</h4>
              <ul className="space-y-1">
                {latestComparison.keyInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-600">• {insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Benchmarks Tab Component
function BenchmarksTab({
  availableTests,
  benchmarkResults,
  selectedModels,
  runBenchmark,
  isRunningBenchmark
}: {
  availableTests: BenchmarkTest[]
  benchmarkResults: BenchmarkResult[]
  selectedModels: string[]
  runBenchmark: (testId: string, modelIds: string[]) => Promise<void>
  isRunningBenchmark: boolean
}) {
  return (
    <div className="benchmarks-tab space-y-6">
      {/* Available Tests */}
      <div className="available-tests bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Benchmark Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableTests.map((test) => (
            <div key={test.testId} className="test-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{test.name}</h4>
                <span className={`px-2 py-1 text-xs rounded ${
                  test.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  test.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {test.difficulty}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{test.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {test.testPrompts.length} prompts • {test.category}
                </div>
                <button
                  onClick={() => runBenchmark(test.testId, selectedModels)}
                  disabled={isRunningBenchmark || selectedModels.length === 0}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isRunningBenchmark ? 'Running...' : 'Run Test'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Results */}
      <div className="recent-results bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Benchmark Results</h3>
        {benchmarkResults.length > 0 ? (
          <div className="space-y-4">
            {benchmarkResults.slice(-10).reverse().map((result) => (
              <div key={result.resultId} className="result-item border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{result.modelId}</span>
                    <span className="text-sm text-gray-500">
                      {availableTests.find(t => t.testId === result.testId)?.name || result.testId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-medium ${
                      result.overallScore > 80 ? 'text-green-600' :
                      result.overallScore > 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.overallScore.toFixed(1)}
                    </span>
                    <span className="text-gray-500">{result.averageLatency.toFixed(0)}ms</span>
                    <span className="text-gray-500">${result.totalCost.toFixed(4)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                  <div>Success: {result.successRate.toFixed(1)}%</div>
                  <div>Prompts: {result.promptResults.length}</div>
                  <div>{new Date(result.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Benchmark Results</h4>
            <p>Run some benchmark tests to see results here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Comparisons Tab Component
function ComparisonsTab({
  modelComparisons,
  benchmarkResults
}: {
  modelComparisons: ModelComparison[]
  benchmarkResults: BenchmarkResult[]
}) {
  return (
    <div className="comparisons-tab space-y-6">
      {modelComparisons.length > 0 ? (
        modelComparisons.map((comparison) => (
          <div key={comparison.comparisonId} className="comparison-card bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Model Comparison ({comparison.models.length} models)
              </h3>
              <span className="text-sm text-gray-500">
                {new Date(comparison.timestamp).toLocaleDateString()}
              </span>
            </div>

            {/* Winner Announcement */}
            <div className="winner-announcement bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-green-600 text-2xl mr-3">🏆</span>
                <div>
                  <h4 className="font-medium text-green-800">Overall Winner</h4>
                  <p className="text-green-700">{comparison.overallWinner}</p>
                </div>
              </div>
            </div>

            {/* Rankings Table */}
            <div className="rankings-table mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Model Rankings</h4>
              <div className="overflow-hidden border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Best Use Case</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparison.rankings.map((ranking) => (
                      <tr key={ranking.modelId}>
                        <td className="px-4 py-2 text-sm text-gray-900">{ranking.rank}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{ranking.modelId}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{ranking.score.toFixed(1)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{ranking.bestUseCase}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{ranking.costEfficiency.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Winners */}
            <div className="category-winners mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Category Winners</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(comparison.categoryWinners).map(([category, winner]) => (
                  <div key={category} className="category-winner bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-xs text-blue-600 uppercase font-medium">{category}</div>
                    <div className="text-sm font-medium text-blue-800">{winner}</div>
                  </div>
                ))}
                <div className="category-winner bg-green-50 border border-green-200 rounded p-3">
                  <div className="text-xs text-green-600 uppercase font-medium">Cost Efficiency</div>
                  <div className="text-sm font-medium text-green-800">{comparison.costEfficiencyLeader}</div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            {comparison.keyInsights.length > 0 && (
              <div className="key-insights mb-4">
                <h4 className="font-medium text-gray-700 mb-3">Key Insights</h4>
                <ul className="space-y-2">
                  {comparison.keyInsights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {comparison.recommendations.length > 0 && (
              <div className="recommendations">
                <h4 className="font-medium text-gray-700 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {comparison.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">→</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">⚖️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Model Comparisons</h3>
          <p>Run a comprehensive comparison to see detailed analysis here.</p>
        </div>
      )}
    </div>
  )
}

// Detailed Analysis Tab Component
function DetailedAnalysisTab({
  benchmarkResults,
  availableTests,
  selectedTest,
  setSelectedTest
}: {
  benchmarkResults: BenchmarkResult[]
  availableTests: BenchmarkTest[]
  selectedTest: string | null
  setSelectedTest: (testId: string | null) => void
}) {
  const testResults = selectedTest 
    ? benchmarkResults.filter(r => r.testId === selectedTest)
    : []

  const selectedTestInfo = availableTests.find(t => t.testId === selectedTest)

  return (
    <div className="detailed-analysis-tab space-y-6">
      {/* Test Selection */}
      <div className="test-selection bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Test for Detailed Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTests.map((test) => (
            <button
              key={test.testId}
              onClick={() => setSelectedTest(test.testId)}
              className={`test-selector text-left p-4 rounded-lg border transition-all ${
                selectedTest === test.testId 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium text-gray-900 mb-1">{test.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{test.category}</span>
                <span>{test.difficulty}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Results */}
      {selectedTest && testResults.length > 0 && (
        <div className="detailed-results bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Detailed Results: {selectedTestInfo?.name}
          </h3>

          {/* Test Overview */}
          <div className="test-overview mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium">{selectedTestInfo?.category}</span>
              </div>
              <div>
                <span className="text-gray-500">Difficulty:</span>
                <span className="ml-2 font-medium">{selectedTestInfo?.difficulty}</span>
              </div>
              <div>
                <span className="text-gray-500">Prompts:</span>
                <span className="ml-2 font-medium">{selectedTestInfo?.testPrompts.length}</span>
              </div>
            </div>
          </div>

          {/* Results by Model */}
          <div className="results-by-model space-y-6">
            {testResults.map((result) => (
              <div key={result.resultId} className="model-result border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{result.modelId}</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      result.overallScore > 80 ? 'bg-green-100 text-green-800' :
                      result.overallScore > 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.overallScore.toFixed(1)}
                    </span>
                    <span className="text-gray-500">{result.averageLatency.toFixed(0)}ms</span>
                    <span className="text-gray-500">${result.totalCost.toFixed(4)}</span>
                  </div>
                </div>

                {/* Performance Breakdown */}
                <div className="performance-breakdown mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Performance Breakdown</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Success Rate</div>
                      <div className="font-medium">{result.successRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Error Rate</div>
                      <div className="font-medium">{result.errorRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg Latency</div>
                      <div className="font-medium">{result.averageLatency.toFixed(0)}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Cost</div>
                      <div className="font-medium">${result.totalCost.toFixed(4)}</div>
                    </div>
                  </div>
                </div>

                {/* Criteria Scores */}
                <div className="criteria-scores mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Evaluation Criteria</h5>
                  <div className="space-y-2">
                    {Object.entries(result.criteriaScores).map(([criteriaId, score]) => (
                      <div key={criteriaId} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{criteriaId}</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="summary">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Summary</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Strengths:</div>
                      <ul className="text-gray-700">
                        {result.summary.strengths.map((strength, index) => (
                          <li key={index}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Weaknesses:</div>
                      <ul className="text-gray-700">
                        {result.summary.weaknesses.map((weakness, index) => (
                          <li key={index}>• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {result.summary.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-gray-500 mb-1">Recommendations:</div>
                      <ul className="text-gray-700">
                        {result.summary.recommendations.map((recommendation, index) => (
                          <li key={index}>• {recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTest && testResults.length === 0 && (
        <div className="no-results bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results for This Test</h3>
          <p className="text-gray-600">Run the benchmark to see detailed analysis here.</p>
        </div>
      )}
    </div>
  )
}