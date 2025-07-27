'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useNeuralKnowledgeCompression, { 
  useCompressionConfiguration,
  useKnowledgeGraphVisualization 
} from '@/hooks/useNeuralKnowledgeCompression'
import type { CompressedKnowledge } from '@/lib/neural-knowledge-compression'

interface NeuralKnowledgeCompressionDashboardProps {
  userId: string
  onCompressionComplete?: (compression: CompressedKnowledge) => void
  onExportReady?: (exportData: any) => void
}

export default function NeuralKnowledgeCompressionDashboard({
  userId,
  onCompressionComplete,
  onExportReady
}: NeuralKnowledgeCompressionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'compression' | 'analysis' | 'optimization' | 'export'>('compression')
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<any>(null)

  const {
    compressedKnowledgeItems,
    currentCompression,
    compressionAnalytics,
    qualityAssessment,
    learningPathways,
    isCompressing,
    isAnalyzing,
    isOptimizing,
    isExporting,
    error,
    warnings,
    compressKnowledgeWithProgress,
    adaptCompressedKnowledge,
    optimizeForLearningGoals,
    analyzeKnowledgeGraph,
    getCompressionAnalytics,
    assessCompressionQuality,
    exportCompressedKnowledge,
    clearError,
    clearWarnings,
    hasCompressions,
    hasCurrentCompression,
    currentCompressionMetrics,
    analyticsInsights,
    qualityInsights,
    progressInsights
  } = useNeuralKnowledgeCompression()

  const {
    configuration,
    isValid: isConfigValid,
    validationErrors,
    updateConfiguration,
    validateConfiguration
  } = useCompressionConfiguration()

  const {
    graphData,
    visualizationSettings,
    isLoading: isLoadingGraph,
    loadGraphVisualization,
    updateVisualizationSettings
  } = useKnowledgeGraphVisualization()

  const tabs = [
    { id: 'compression', label: 'Compress Knowledge', icon: '🧠' },
    { id: 'analysis', label: 'Analysis', icon: '📊' },
    { id: 'optimization', label: 'Optimization', icon: '⚡' },
    { id: 'export', label: 'Export', icon: '📤' }
  ]

  // Load analytics when compression is available
  useEffect(() => {
    if (currentCompression) {
      getCompressionAnalytics(currentCompression.compression_id)
      assessCompressionQuality(currentCompression.compression_id)
      loadGraphVisualization(currentCompression.compression_id)
    }
  }, [currentCompression, getCompressionAnalytics, assessCompressionQuality, loadGraphVisualization])

  const handleCompress = async (contentData: any) => {
    try {
      setShowProgressModal(true)
      
      const compressionParams = {
        source_content: {
          content_type: contentData.content_type || 'text',
          content_data: contentData.content,
          subject_domain: contentData.subject_domain || 'general',
          complexity_level: contentData.complexity_level || 5,
          learning_objectives: contentData.learning_objectives || []
        },
        compression_settings: configuration.compression_settings,
        learner_customization: configuration.learner_preferences
      }
      
      const result = await compressKnowledgeWithProgress(compressionParams, (progress) => {
        setCompressionProgress(progress)
      })
      
      setShowProgressModal(false)
      onCompressionComplete?.(result)
    } catch (error) {
      setShowProgressModal(false)
      console.error('Error compressing knowledge:', error)
    }
  }

  const handleOptimize = async (optimizationGoals: string[]) => {
    if (!currentCompression) return
    
    try {
      const optimizationParams = {
        compression_id: currentCompression.compression_id,
        learning_goals: optimizationGoals,
        performance_targets: {
          retention_rate: 85,
          learning_speed: 120,
          cognitive_load: 6
        },
        optimization_focus: ['retention', 'efficiency', 'comprehension']
      }
      
      await optimizeForLearningGoals(optimizationParams)
    } catch (error) {
      console.error('Error optimizing compression:', error)
    }
  }

  const handleExport = async (exportFormat: string, exportOptions: any) => {
    if (!currentCompression) return
    
    try {
      const exportResult = await exportCompressedKnowledge(
        currentCompression.compression_id,
        exportFormat,
        exportOptions
      )
      onExportReady?.(exportResult)
    } catch (error) {
      console.error('Error exporting compression:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Neural Knowledge Compression
          </h1>
          <p className="text-gray-600">
            Compress complex knowledge into optimized learning structures
          </p>
        </div>

        {/* Error and Warning Display */}
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

          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-2">⚠️</span>
                  <span className="text-yellow-700 font-medium">Warnings ({warnings.length})</span>
                </div>
                <button
                  onClick={clearWarnings}
                  className="text-yellow-500 hover:text-yellow-700"
                >
                  ✕
                </button>
              </div>
              <ul className="mt-2 text-sm text-yellow-700">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration Validation */}
        {!isConfigValid && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-orange-500 mr-2">⚙️</span>
              <span className="text-orange-700 font-medium">Configuration Issues</span>
            </div>
            <ul className="text-sm text-orange-700">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-md'
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
            {activeTab === 'compression' && (
              <CompressionTab
                configuration={configuration}
                isConfigValid={isConfigValid}
                isCompressing={isCompressing}
                currentCompressionMetrics={currentCompressionMetrics}
                progressInsights={progressInsights}
                onCompress={handleCompress}
                onUpdateConfiguration={updateConfiguration}
                onValidateConfiguration={validateConfiguration}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisTab
                currentCompression={currentCompression}
                compressionAnalytics={compressionAnalytics}
                qualityAssessment={qualityAssessment}
                graphData={graphData}
                visualizationSettings={visualizationSettings}
                analyticsInsights={analyticsInsights}
                qualityInsights={qualityInsights}
                isAnalyzing={isAnalyzing}
                isLoadingGraph={isLoadingGraph}
                onAnalyzeGraph={analyzeKnowledgeGraph}
                onUpdateVisualization={updateVisualizationSettings}
              />
            )}

            {activeTab === 'optimization' && (
              <OptimizationTab
                currentCompression={currentCompression}
                learningPathways={learningPathways}
                isOptimizing={isOptimizing}
                onOptimize={handleOptimize}
                onAdapt={adaptCompressedKnowledge}
              />
            )}

            {activeTab === 'export' && (
              <ExportTab
                currentCompression={currentCompression}
                isExporting={isExporting}
                onExport={handleExport}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress Modal */}
        <AnimatePresence>
          {showProgressModal && (
            <CompressionProgressModal
              progress={compressionProgress}
              onClose={() => setShowProgressModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Compression Tab Component
function CompressionTab({
  configuration,
  isConfigValid,
  isCompressing,
  currentCompressionMetrics,
  progressInsights,
  onCompress,
  onUpdateConfiguration,
  onValidateConfiguration
}: any) {
  const [sourceContent, setSourceContent] = useState({
    content_type: 'text',
    content: '',
    subject_domain: 'general',
    complexity_level: 5,
    learning_objectives: ['']
  })

  const handleCompress = () => {
    if (!sourceContent.content.trim()) {
      alert('Please provide content to compress')
      return
    }
    
    if (!isConfigValid) {
      alert('Please fix configuration issues before compressing')
      return
    }
    
    onCompress(sourceContent)
  }

  return (
    <div className="space-y-6">
      {/* Current Compression Metrics */}
      {currentCompressionMetrics && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Compression Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(currentCompressionMetrics.compressionRatio * 100)}%
              </div>
              <div className="text-sm text-gray-600">Compression Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentCompressionMetrics.qualityScore}
              </div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentCompressionMetrics.nodeCount}
              </div>
              <div className="text-sm text-gray-600">Concepts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(currentCompressionMetrics.learningEfficiencyGain)}%
              </div>
              <div className="text-sm text-gray-600">Efficiency Gain</div>
            </div>
          </div>
        </div>
      )}

      {/* Source Content Input */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Source Content
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={sourceContent.content_type}
                onChange={(e) => setSourceContent(prev => ({ ...prev, content_type: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="text">Text Content</option>
                <option value="document">Document</option>
                <option value="video_transcript">Video Transcript</option>
                <option value="course_material">Course Material</option>
                <option value="research_paper">Research Paper</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Domain
              </label>
              <input
                type="text"
                value={sourceContent.subject_domain}
                onChange={(e) => setSourceContent(prev => ({ ...prev, subject_domain: e.target.value }))}
                placeholder="e.g., computer science, mathematics, biology"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexity Level (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={sourceContent.complexity_level}
                onChange={(e) => setSourceContent(prev => ({ ...prev, complexity_level: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">{sourceContent.complexity_level}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content to Compress
            </label>
            <textarea
              value={sourceContent.content}
              onChange={(e) => setSourceContent(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Paste your content here to compress into optimized learning structures..."
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Objectives
            </label>
            {sourceContent.learning_objectives.map((objective, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => {
                    const newObjectives = [...sourceContent.learning_objectives]
                    newObjectives[index] = e.target.value
                    setSourceContent(prev => ({ ...prev, learning_objectives: newObjectives }))
                  }}
                  placeholder="Enter learning objective"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {sourceContent.learning_objectives.length > 1 && (
                  <button
                    onClick={() => {
                      const newObjectives = sourceContent.learning_objectives.filter((_, i) => i !== index)
                      setSourceContent(prev => ({ ...prev, learning_objectives: newObjectives }))
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setSourceContent(prev => ({ 
                ...prev, 
                learning_objectives: [...prev.learning_objectives, ''] 
              }))}
              className="mt-2 px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
            >
              + Add Objective
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCompress}
            disabled={isCompressing || !isConfigValid}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isCompressing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Compressing...</span>
              </>
            ) : (
              <>
                <span>🧠</span>
                <span>Compress Knowledge</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compression Configuration */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Compression Configuration
        </h3>
        
        <CompressionConfigurationPanel
          configuration={configuration}
          onUpdateConfiguration={onUpdateConfiguration}
          onValidateConfiguration={onValidateConfiguration}
        />
      </div>

      {/* Progress Insights */}
      {progressInsights && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compression Progress
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Current Stage:</span>
              <span className="font-medium capitalize">{progressInsights.currentStage.replace('_', ' ')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressInsights.progressPercentage}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Concepts:</span>
                <span className="ml-1 font-medium">{progressInsights.conceptsProcessed}</span>
              </div>
              <div>
                <span className="text-gray-600">Relationships:</span>
                <span className="ml-1 font-medium">{progressInsights.relationshipsIdentified}</span>
              </div>
              <div>
                <span className="text-gray-600">Quality:</span>
                <span className="ml-1 font-medium">{Math.round(progressInsights.qualityScore)}/100</span>
              </div>
              <div>
                <span className="text-gray-600">ETA:</span>
                <span className="ml-1 font-medium">{progressInsights.estimatedTimeRemaining}s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Analysis Tab Component
function AnalysisTab({
  currentCompression,
  compressionAnalytics,
  qualityAssessment,
  graphData,
  visualizationSettings,
  analyticsInsights,
  qualityInsights,
  isAnalyzing,
  isLoadingGraph,
  onAnalyzeGraph,
  onUpdateVisualization
}: any) {
  if (!currentCompression) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Compression to Analyze
        </h3>
        <p className="text-gray-600">
          Compress some knowledge first to see detailed analysis
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analyticsInsights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {analyticsInsights.totalLearners}
            </div>
            <div className="text-sm text-gray-600">Total Learners</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {analyticsInsights.completionRate}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {analyticsInsights.learningAcceleration}%
            </div>
            <div className="text-sm text-gray-600">Learning Acceleration</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {analyticsInsights.learnerSatisfaction.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Satisfaction Score</div>
          </div>
        </div>
      )}

      {/* Quality Assessment */}
      {qualityInsights && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quality Assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Quality Dimensions</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Information Fidelity:</span>
                  <span className="font-medium">{qualityInsights.informationFidelity}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Learning Optimization:</span>
                  <span className="font-medium">{qualityInsights.learningOptimization}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Compression Efficiency:</span>
                  <span className="font-medium">{qualityInsights.compressionEfficiency}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Relationship Quality:</span>
                  <span className="font-medium">{qualityInsights.relationshipQuality}/100</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Overall Quality</h4>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {qualityInsights.overallQuality}
                </div>
                <div className="text-sm text-gray-600">Quality Score</div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${qualityInsights.overallQuality}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Graph Visualization */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Knowledge Graph Visualization
          </h3>
          <button
            onClick={() => onAnalyzeGraph(currentCompression.compression_id, 'visualization')}
            disabled={isLoadingGraph}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
          >
            {isLoadingGraph ? 'Loading...' : 'Refresh Analysis'}
          </button>
        </div>
        
        {graphData ? (
          <GraphVisualizationPanel
            graphData={graphData}
            visualizationSettings={visualizationSettings}
            onUpdateSettings={onUpdateVisualization}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>Loading knowledge graph visualization...</p>
          </div>
        )}
      </div>

      {/* Detailed Analytics */}
      {compressionAnalytics && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Analytics
          </h3>
          <AnalyticsDetailPanel analytics={compressionAnalytics} />
        </div>
      )}
    </div>
  )
}

// Optimization Tab Component
function OptimizationTab({
  currentCompression,
  learningPathways,
  isOptimizing,
  onOptimize,
  onAdapt
}: any) {
  const [optimizationGoals, setOptimizationGoals] = useState<string[]>(['retention', 'efficiency'])

  if (!currentCompression) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">⚡</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Compression to Optimize
        </h3>
        <p className="text-gray-600">
          Compress some knowledge first to access optimization features
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Learning Pathways */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Learning Pathways
        </h3>
        
        {learningPathways.length > 0 ? (
          <div className="space-y-4">
            {learningPathways.map((pathway: any, index: number) => (
              <PathwayCard key={index} pathway={pathway} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🛤️</div>
            <p>No learning pathways generated yet</p>
          </div>
        )}
      </div>

      {/* Optimization Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Optimization Controls
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization Goals
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['retention', 'efficiency', 'comprehension', 'engagement'].map(goal => (
                <label key={goal} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizationGoals.includes(goal)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setOptimizationGoals(prev => [...prev, goal])
                      } else {
                        setOptimizationGoals(prev => prev.filter(g => g !== goal))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{goal}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => onOptimize(optimizationGoals)}
              disabled={isOptimizing || optimizationGoals.length === 0}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors duration-200"
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Compression'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export Tab Component
function ExportTab({ currentCompression, isExporting, onExport }: any) {
  const [exportFormat, setExportFormat] = useState('json')
  const [exportOptions, setExportOptions] = useState({
    include_analytics: true,
    include_pathways: true,
    include_graph: true,
    compressed_format: false
  })

  if (!currentCompression) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">📤</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Compression to Export
        </h3>
        <p className="text-gray-600">
          Compress some knowledge first to access export features
        </p>
      </div>
    )
  }

  const handleExport = () => {
    onExport(exportFormat, exportOptions)
  }

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Export Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="json">JSON Format</option>
              <option value="scorm">SCORM Package</option>
              <option value="pdf">PDF Document</option>
              <option value="xml">XML Format</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Options
            </label>
            <div className="space-y-2">
              {Object.entries(exportOptions).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Export Compression</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export Preview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Export Preview
        </h3>
        <ExportPreviewPanel
          compression={currentCompression}
          format={exportFormat}
          options={exportOptions}
        />
      </div>
    </div>
  )
}

// Supporting Components
function CompressionConfigurationPanel({ configuration, onUpdateConfiguration }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Compression Ratio
          </label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.1"
            value={configuration.compression_settings.target_compression_ratio}
            onChange={(e) => onUpdateConfiguration('compression_settings', {
              target_compression_ratio: parseFloat(e.target.value)
            })}
            className="w-full"
          />
          <div className="text-center text-sm text-gray-600">
            {Math.round(configuration.compression_settings.target_compression_ratio * 100)}%
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Cognitive Load
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={configuration.compression_settings.max_cognitive_load}
            onChange={(e) => onUpdateConfiguration('compression_settings', {
              max_cognitive_load: parseInt(e.target.value)
            })}
            className="w-full"
          />
          <div className="text-center text-sm text-gray-600">
            {configuration.compression_settings.max_cognitive_load}/10
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optimization Focus
          </label>
          <select
            value={configuration.compression_settings.optimization_focus}
            onChange={(e) => onUpdateConfiguration('compression_settings', {
              optimization_focus: e.target.value
            })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="retention">Retention</option>
            <option value="understanding">Understanding</option>
            <option value="application">Application</option>
            <option value="speed">Speed</option>
            <option value="comprehensive">Comprehensive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concept Granularity
          </label>
          <select
            value={configuration.compression_settings.concept_granularity}
            onChange={(e) => onUpdateConfiguration('compression_settings', {
              concept_granularity: e.target.value
            })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="fine">Fine</option>
            <option value="medium">Medium</option>
            <option value="coarse">Coarse</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship Depth
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={configuration.compression_settings.relationship_depth}
            onChange={(e) => onUpdateConfiguration('compression_settings', {
              relationship_depth: parseInt(e.target.value)
            })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}

function GraphVisualizationPanel({ graphData, visualizationSettings, onUpdateSettings }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {graphData.nodes?.length || 0} nodes, {graphData.edges?.length || 0} edges
        </div>
        <div className="flex space-x-2">
          <select
            value={visualizationSettings.layout}
            onChange={(e) => onUpdateSettings({ layout: e.target.value })}
            className="p-2 border border-gray-300 rounded text-sm"
          >
            <option value="force">Force Layout</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="circular">Circular</option>
          </select>
          <select
            value={visualizationSettings.colorScheme}
            onChange={(e) => onUpdateSettings({ colorScheme: e.target.value })}
            className="p-2 border border-gray-300 rounded text-sm"
          >
            <option value="difficulty">Difficulty</option>
            <option value="cluster">Cluster</option>
            <option value="importance">Importance</option>
          </select>
        </div>
      </div>
      
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🕸️</div>
          <p>Knowledge Graph Visualization</p>
          <p className="text-sm">(Interactive visualization would be rendered here)</p>
        </div>
      </div>
    </div>
  )
}

function AnalyticsDetailPanel({ analytics }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Learners:</span>
            <span className="font-medium">{analytics.usage_statistics?.total_learners || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Learners:</span>
            <span className="font-medium">{analytics.usage_statistics?.active_learners || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Session:</span>
            <span className="font-medium">{analytics.usage_statistics?.average_session_duration || 0}min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Hours:</span>
            <span className="font-medium">{analytics.usage_statistics?.total_learning_hours || 0}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Learning Acceleration:</span>
            <span className="font-medium">{analytics.performance_metrics?.learning_acceleration || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Retention Improvement:</span>
            <span className="font-medium">{analytics.performance_metrics?.retention_improvement || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cognitive Load Reduction:</span>
            <span className="font-medium">{analytics.performance_metrics?.cognitive_load_reduction || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Learner Satisfaction:</span>
            <span className="font-medium">{analytics.performance_metrics?.learner_satisfaction || 0}/5</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PathwayCard({ pathway }: any) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{pathway.pathway_name}</h4>
        <span className="text-sm text-gray-600">{pathway.estimated_completion_time}min</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Target: {pathway.target_learner_profile} • Success Rate: {pathway.success_probability}%
      </p>
      <div className="flex flex-wrap gap-2">
        {pathway.concept_sequence?.slice(0, 4).map((concept: string, index: number) => (
          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {concept}
          </span>
        ))}
        {pathway.concept_sequence?.length > 4 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            +{pathway.concept_sequence.length - 4} more
          </span>
        )}
      </div>
    </div>
  )
}

function ExportPreviewPanel({ compression, format, options }: any) {
  const getPreviewContent = () => {
    switch (format) {
      case 'json':
        return JSON.stringify({
          compression_id: compression.compression_id,
          knowledge_graph: options.include_graph ? compression.knowledge_graph : null,
          learning_pathways: options.include_pathways ? compression.learning_pathways : null,
          analytics: options.include_analytics ? compression.compression_analytics : null
        }, null, 2)
      
      case 'scorm':
        return 'SCORM package structure:\n- manifest.xml\n- content/\n- assessment/\n- resources/'
      
      case 'pdf':
        return 'PDF document will include:\n- Knowledge graph visualization\n- Learning pathways\n- Concept summaries\n- Assessment materials'
      
      default:
        return 'Export preview not available for this format'
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Preview of {format.toUpperCase()} export
      </div>
      <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
        {getPreviewContent()}
      </pre>
    </div>
  )
}

// Progress Modal Component
function CompressionProgressModal({ progress, onClose }: any) {
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
            Compressing Knowledge
          </h3>
          
          {progress && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress_percentage}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600">
                {progress.current_activity}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-purple-600">
                    {progress.concepts_processed}
                  </div>
                  <div className="text-gray-600">Concepts Processed</div>
                </div>
                <div>
                  <div className="font-medium text-blue-600">
                    {progress.relationships_identified}
                  </div>
                  <div className="text-gray-600">Relationships Found</div>
                </div>
              </div>
              
              {progress.compression_quality > 0 && (
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className="font-medium">{Math.round(progress.compression_quality)}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.compression_quality}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Estimated time remaining: {Math.floor(progress.estimated_completion_time / 1000)}s
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}