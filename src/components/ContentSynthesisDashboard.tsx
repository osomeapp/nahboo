'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useContentSynthesis, 
  useSynthesisAnalytics,
  useSourceManagement 
} from '@/hooks/useContentSynthesis'
import { 
  type ContentSource,
  type SynthesisRequest,
  createContentSource,
  createSynthesisRequest
} from '@/lib/content-synthesis-engine'

// Main Content Synthesis Dashboard
export function ContentSynthesisDashboard() {
  const [activeTab, setActiveTab] = useState<'synthesize' | 'history' | 'sources' | 'analytics'>('synthesize')
  
  const tabs = [
    { id: 'synthesize', label: 'New Synthesis', icon: '🧠' },
    { id: 'history', label: 'History', icon: '📚' },
    { id: 'sources', label: 'Sources', icon: '📖' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Content Synthesis Engine
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          AI-powered content synthesis from multiple sources with intelligent integration and quality validation
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'synthesize' && <SynthesisCreator />}
          {activeTab === 'history' && <SynthesisHistory />}
          {activeTab === 'sources' && <SourceManager />}
          {activeTab === 'analytics' && <SynthesisAnalytics />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Synthesis Creation Interface
function SynthesisCreator() {
  const { 
    synthesizeWithProgress, 
    currentSynthesis, 
    synthesisProgress, 
    isSynthesizing, 
    error,
    clearError,
    generateConceptNetworks,
    conceptNetworks 
  } = useContentSynthesis()
  
  const [selectedSources, setSelectedSources] = useState<ContentSource[]>([])
  const [synthesisRequest, setSynthesisRequest] = useState<SynthesisRequest>(() =>
    createSynthesisRequest(
      'Machine Learning Fundamentals',
      ['Understand basic ML concepts', 'Learn algorithm types', 'Apply ML to real problems']
    )
  )
  const [showSourceSelector, setShowSourceSelector] = useState(false)
  const [showConceptNetworks, setShowConceptNetworks] = useState(false)

  const handleSynthesize = useCallback(async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one source')
      return
    }

    try {
      clearError()
      await synthesizeWithProgress(selectedSources, synthesisRequest)
    } catch (error) {
      console.error('Synthesis failed:', error)
    }
  }, [selectedSources, synthesisRequest, synthesizeWithProgress, clearError])

  const handleGenerateConceptNetworks = useCallback(async () => {
    if (!currentSynthesis) return
    
    try {
      await generateConceptNetworks(currentSynthesis.synthesis_id)
      setShowConceptNetworks(true)
    } catch (error) {
      console.error('Failed to generate concept networks:', error)
    }
  }, [currentSynthesis, generateConceptNetworks])

  return (
    <div className="space-y-6">
      {/* Synthesis Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Synthesis Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topic and Objectives */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                type="text"
                value={synthesisRequest.topic}
                onChange={(e) => setSynthesisRequest(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter synthesis topic"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objectives
              </label>
              <textarea
                value={synthesisRequest.learning_objectives.join('\n')}
                onChange={(e) => setSynthesisRequest(prev => ({ 
                  ...prev, 
                  learning_objectives: e.target.value.split('\n').filter(obj => obj.trim())
                }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter learning objectives (one per line)"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Level
              </label>
              <select
                value={synthesisRequest.target_audience.academic_level}
                onChange={(e) => setSynthesisRequest(prev => ({
                  ...prev,
                  target_audience: { ...prev.target_audience, academic_level: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Group
              </label>
              <select
                value={synthesisRequest.target_audience.age_group}
                onChange={(e) => setSynthesisRequest(prev => ({
                  ...prev,
                  target_audience: { ...prev.target_audience, age_group: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="child">Child</option>
                <option value="teen">Teen</option>
                <option value="adult">Adult</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Length
              </label>
              <select
                value={synthesisRequest.content_requirements.desired_length}
                onChange={(e) => setSynthesisRequest(prev => ({
                  ...prev,
                  content_requirements: { ...prev.content_requirements, desired_length: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="brief">Brief</option>
                <option value="moderate">Moderate</option>
                <option value="comprehensive">Comprehensive</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Source Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Selected Sources ({selectedSources.length})</h2>
          <button
            onClick={() => setShowSourceSelector(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Sources
          </button>
        </div>
        
        {selectedSources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sources selected. Click "Add Sources" to select content sources for synthesis.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedSources.map((source, index) => (
              <div key={source.source_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{source.metadata.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {source.type} • {source.metadata.academic_level} • Credibility: {(source.metadata.credibility_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {source.content.substring(0, 150)}...
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSources(prev => prev.filter((_, i) => i !== index))}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Synthesis Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleSynthesize}
          disabled={isSynthesizing || selectedSources.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSynthesizing ? 'Synthesizing...' : 'Start Synthesis'}
        </button>
        
        {currentSynthesis && (
          <button
            onClick={handleGenerateConceptNetworks}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Generate Concept Networks
          </button>
        )}
      </div>

      {/* Progress Display */}
      {synthesisProgress && (
        <SynthesisProgressDisplay progress={synthesisProgress} />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 font-medium">Synthesis Error</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Synthesis Results */}
      {currentSynthesis && (
        <SynthesisResultsDisplay 
          synthesis={currentSynthesis}
          conceptNetworks={conceptNetworks}
          showConceptNetworks={showConceptNetworks}
        />
      )}

      {/* Source Selector Modal */}
      {showSourceSelector && (
        <SourceSelectorModal
          onClose={() => setShowSourceSelector(false)}
          onSourcesSelected={(sources) => {
            setSelectedSources(prev => [...prev, ...sources])
            setShowSourceSelector(false)
          }}
          excludeSourceIds={selectedSources.map(s => s.source_id)}
        />
      )}
    </div>
  )
}

// Progress Display Component
function SynthesisProgressDisplay({ progress }: { progress: any }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">Synthesis Progress</h3>
        <span className="text-blue-700 font-medium">{progress.progress_percentage}%</span>
      </div>
      
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress_percentage}%` }}
          />
        </div>
        
        {/* Current Activity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">
            <span className="font-medium">Stage:</span> {progress.stage.replace('_', ' ')}
          </span>
          <span className="text-blue-600">
            Sources: {progress.sources_processed}/{progress.total_sources}
          </span>
        </div>
        
        <p className="text-blue-800">{progress.current_activity}</p>
        
        {progress.estimated_completion_time > 0 && (
          <p className="text-sm text-blue-600">
            Estimated completion: {Math.ceil(progress.estimated_completion_time / 1000)}s
          </p>
        )}
      </div>
    </div>
  )
}

// Synthesis Results Display Component
function SynthesisResultsDisplay({ 
  synthesis, 
  conceptNetworks, 
  showConceptNetworks 
}: { 
  synthesis: any
  conceptNetworks: any[]
  showConceptNetworks: boolean
}) {
  const [activeSection, setActiveSection] = useState<'content' | 'analysis' | 'networks'>('content')

  const qualityScore = (
    synthesis.quality_metrics.coherence_score +
    synthesis.quality_metrics.completeness_score +
    synthesis.quality_metrics.accuracy_confidence +
    synthesis.quality_metrics.pedagogical_effectiveness +
    synthesis.quality_metrics.engagement_potential
  ) / 5

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Synthesis Results</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Quality Score: <span className="font-medium text-green-600">{(qualityScore * 100).toFixed(0)}%</span>
          </div>
          <div className="text-sm text-gray-600">
            {synthesis.synthesis_metadata.word_count} words • {synthesis.synthesis_metadata.reading_time_minutes} min read
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'content', label: 'Content', icon: '📝' },
          { id: 'analysis', label: 'Analysis', icon: '🔍' },
          ...(showConceptNetworks ? [{ id: 'networks', label: 'Concept Networks', icon: '🕸️' }] : [])
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeSection === section.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{section.icon}</span>
            <span className="font-medium">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'content' && (
            <SynthesizedContentDisplay content={synthesis.content} />
          )}
          {activeSection === 'analysis' && (
            <SynthesisAnalysisDisplay synthesis={synthesis} />
          )}
          {activeSection === 'networks' && conceptNetworks && (
            <ConceptNetworkDisplay networks={conceptNetworks} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Content display component
function SynthesizedContentDisplay({ content }: { content: any }) {
  return (
    <div className="space-y-6">
      {/* Main Text */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Synthesized Content</h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content.main_text}
          </p>
        </div>
      </div>

      {/* Key Concepts */}
      {content.key_concepts && content.key_concepts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Key Concepts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.key_concepts.map((concept: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{concept.concept}</h4>
                <p className="text-sm text-gray-600 mb-2">{concept.definition}</p>
                {concept.examples && concept.examples.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Examples:</span>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      {concept.examples.map((example: string, i: number) => (
                        <li key={i}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Points */}
      {content.summary_points && content.summary_points.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Key Takeaways</h3>
          <ul className="space-y-2">
            {content.summary_points.map((point: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Analysis display component
function SynthesisAnalysisDisplay({ synthesis }: { synthesis: any }) {
  return (
    <div className="space-y-6">
      {/* Quality Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quality Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(synthesis.quality_metrics).map(([metric, score]: [string, any]) => (
            <div key={metric} className="text-center">
              <div className={`text-2xl font-bold ${
                score > 0.8 ? 'text-green-600' : score > 0.6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(score * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {metric.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Analysis */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Source Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Sources Used</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {synthesis.source_analysis.sources_used.map((sourceId: string, index: number) => (
                <li key={index}>• {sourceId}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Reliability Assessment</h4>
            <div className="space-y-2">
              {Object.entries(synthesis.source_analysis.reliability_assessment).map(([metric, score]: [string, any]) => (
                <div key={metric} className="flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">{metric.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{(score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Concept network display component
function ConceptNetworkDisplay({ networks }: { networks: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Concept Networks</h3>
      
      {networks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No concept networks generated yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {networks.map((network, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{network.concept_name}</h4>
              <p className="text-sm text-gray-600 mb-3">{network.definition}</p>
              
              {network.connections && network.connections.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Related Concepts:</span>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    {network.connections.slice(0, 3).map((connection: any, i: number) => (
                      <li key={i}>
                        • {connection.connected_concept} ({connection.relationship_type})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Synthesis History Component
function SynthesisHistory() {
  const { synthesisHistory, isLoading, getSynthesis } = useContentSynthesis()
  const [selectedSynthesis, setSelectedSynthesis] = useState<any>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Synthesis History</h2>
        <div className="text-sm text-gray-600">
          {synthesisHistory.length} syntheses
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : synthesisHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No synthesis history found. Create your first synthesis to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {synthesisHistory.map((synthesis) => (
            <div
              key={synthesis.synthesis_id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedSynthesis(synthesis)}
            >
              <h3 className="font-medium text-gray-900 mb-2">{synthesis.topic}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {synthesis.content.main_text?.substring(0, 150)}...
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(synthesis.synthesis_metadata.created_at).toLocaleDateString()}</span>
                <span>{synthesis.synthesis_metadata.word_count} words</span>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-green-600">
                  Quality: {((
                    synthesis.quality_metrics.coherence_score +
                    synthesis.quality_metrics.completeness_score +
                    synthesis.quality_metrics.accuracy_confidence +
                    synthesis.quality_metrics.pedagogical_effectiveness +
                    synthesis.quality_metrics.engagement_potential
                  ) / 5 * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-blue-600">
                  {synthesis.synthesis_metadata.sources_synthesized} sources
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Synthesis Modal */}
      {selectedSynthesis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSynthesis(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <SynthesisResultsDisplay
              synthesis={selectedSynthesis}
              conceptNetworks={[]}
              showConceptNetworks={false}
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSynthesis(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// Source Manager Component
function SourceManager() {
  const { sources, isLoading, addSource, removeSource, error } = useSourceManagement()
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Source Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Source
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading sources...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source) => (
            <div key={source.source_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{source.metadata.title}</h3>
                <button
                  onClick={() => removeSource(source.source_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {source.type} • {source.metadata.academic_level}
              </p>
              
              <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                {source.content.substring(0, 150)}...
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">
                  Credibility: {(source.metadata.credibility_score * 100).toFixed(0)}%
                </span>
                <span className="text-blue-600">
                  {source.metadata.word_count} words
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onAdd={(source) => {
            addSource(source)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

// Analytics Component
function SynthesisAnalytics() {
  const { analytics, isLoading } = useSynthesisAnalytics()

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Synthesis Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{analytics.total_syntheses}</div>
          <div className="text-sm text-blue-700 mt-1">Total Syntheses</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{analytics.total_sources_processed}</div>
          <div className="text-sm text-green-700 mt-1">Sources Processed</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {(analytics.average_quality_score * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-purple-700 mt-1">Avg Quality Score</div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {(analytics.synthesis_success_rate * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-orange-700 mt-1">Success Rate</div>
        </div>
      </div>
      
      {analytics.most_common_topics.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Most Common Topics</h3>
          <div className="space-y-2">
            {analytics.most_common_topics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{topic}</span>
                <span className="text-sm text-gray-500">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components
function SourceSelectorModal({ 
  onClose, 
  onSourcesSelected, 
  excludeSourceIds 
}: { 
  onClose: () => void
  onSourcesSelected: (sources: ContentSource[]) => void
  excludeSourceIds: string[]
}) {
  const [selectedSources, setSelectedSources] = useState<ContentSource[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mockSources] = useState<ContentSource[]>(() => {
    // Generate mock sources for demonstration
    return [
      createContentSource(
        'ml_textbook_1',
        'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without explicit programming...',
        {
          title: 'Introduction to Machine Learning',
          author: 'Dr. AI Expert',
          credibility_score: 0.9,
          academic_level: 'undergraduate',
          subject_domain: 'computer_science'
        },
        'textbook'
      ),
      createContentSource(
        'ml_research_1',
        'Recent advances in deep learning have revolutionized the field of machine learning, with neural networks achieving unprecedented performance...',
        {
          title: 'Deep Learning Advances 2023',
          author: 'Prof. Neural Networks',
          credibility_score: 0.95,
          academic_level: 'graduate',
          subject_domain: 'computer_science'
        },
        'research_paper'
      )
    ]
  })

  const filteredSources = mockSources.filter(source => 
    !excludeSourceIds.includes(source.source_id) &&
    (searchQuery === '' || 
     source.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     source.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Select Sources</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {filteredSources.map((source) => (
              <div
                key={source.source_id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSources.includes(source)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedSources(prev =>
                    prev.includes(source)
                      ? prev.filter(s => s !== source)
                      : [...prev, source]
                  )
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{source.metadata.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {source.type} • {source.metadata.academic_level} • Credibility: {(source.metadata.credibility_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {source.content.substring(0, 200)}...
                    </p>
                  </div>
                  {selectedSources.includes(source) && (
                    <div className="ml-2 text-blue-500">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedSources.length} sources selected
          </div>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onSourcesSelected(selectedSources)}
              disabled={selectedSources.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddSourceModal({ 
  onClose, 
  onAdd 
}: { 
  onClose: () => void
  onAdd: (source: ContentSource) => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'textbook' as ContentSource['type'],
    author: '',
    academic_level: 'undergraduate' as any,
    subject_domain: '',
    credibility_score: 0.8
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const source = createContentSource(
      `user_source_${Date.now()}`,
      formData.content,
      {
        title: formData.title,
        author: formData.author,
        credibility_score: formData.credibility_score,
        academic_level: formData.academic_level,
        subject_domain: formData.subject_domain
      },
      formData.type
    )
    
    onAdd(source)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add New Source</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContentSource['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="textbook">Textbook</option>
                <option value="research_paper">Research Paper</option>
                <option value="wiki">Wiki</option>
                <option value="blog_post">Blog Post</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
              <select
                value={formData.academic_level}
                onChange={(e) => setFormData(prev => ({ ...prev, academic_level: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="elementary">Elementary</option>
                <option value="middle_school">Middle School</option>
                <option value="high_school">High School</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContentSynthesisDashboard