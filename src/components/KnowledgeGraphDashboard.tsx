'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Network, 
  Target, 
  Clock, 
  BookOpen, 
  TrendingUp,
  Search,
  Filter,
  Download,
  Lightbulb,
  GitBranch,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Star,
  ArrowRight,
  ArrowLeft,
  Plus,
  Loader
} from 'lucide-react'
import { useKnowledgeGraph, useConceptExploration } from '@/hooks/useKnowledgeGraph'
import { type KnowledgeGraph, type ConceptNode, type LearningPath } from '@/lib/knowledge-graph-generator'

interface KnowledgeGraphDashboardProps {
  initialSubject?: string
  className?: string
}

export default function KnowledgeGraphDashboard({ 
  initialSubject,
  className = '' 
}: KnowledgeGraphDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'concepts' | 'paths' | 'analysis'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('intermediate')
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const {
    graphs,
    currentGraph,
    learningPaths,
    searchResults,
    isLoading,
    isGenerating,
    error,
    generateKnowledgeGraph,
    loadKnowledgeGraph,
    searchConcepts,
    generateLearningPaths,
    analyzeKnowledgeGraph,
    setCurrentGraph,
    clearSearchResults,
    clearError,
    getGraphStatistics,
    getPathRecommendations
  } = useKnowledgeGraph()

  const {
    currentConcept,
    prerequisites,
    navigateToConcept,
    goBack,
    canGoBack
  } = useConceptExploration()

  // Load initial subject if provided
  useEffect(() => {
    if (initialSubject) {
      loadKnowledgeGraph(initialSubject)
    }
  }, [initialSubject, loadKnowledgeGraph])

  // Get graph statistics
  const statistics = useMemo(() => getGraphStatistics(), [getGraphStatistics])

  // Filter concepts based on search and category
  const filteredConcepts = useMemo(() => {
    if (!currentGraph) return []
    
    let concepts = currentGraph.nodes
    
    if (searchQuery) {
      concepts = concepts.filter(concept =>
        concept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.metadata.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
    
    if (filterCategory !== 'all') {
      concepts = concepts.filter(concept => concept.category === filterCategory)
    }
    
    return concepts
  }, [currentGraph, searchQuery, filterCategory])

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchConcepts(searchQuery)
    } else {
      clearSearchResults()
    }
  }

  // Handle generating new graph
  const handleGenerateGraph = async (subject: string, scope: string, audience: string) => {
    try {
      await generateKnowledgeGraph(subject, scope as any, audience)
      setShowGenerateModal(false)
      // Generate learning paths for the new graph
      await generateLearningPaths(subject, selectedDifficulty, 40)
    } catch (error) {
      console.error('Error generating graph:', error)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'concepts', label: 'Concepts', icon: Brain },
    { id: 'paths', label: 'Learning Paths', icon: GitBranch },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Network className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Knowledge Graph Dashboard</h2>
              <p className="text-sm text-gray-500">
                {currentGraph ? `${currentGraph.subject} • ${currentGraph.nodes.length} concepts` : 'AI-powered subject domain mapping'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Graph</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
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

      {/* Loading State */}
      {(isLoading || isGenerating) && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">
              {isGenerating ? 'Generating knowledge graph...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && !isGenerating && (
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab
                key="overview"
                currentGraph={currentGraph}
                statistics={statistics}
                learningPaths={learningPaths}
              />
            )}
            
            {activeTab === 'concepts' && (
              <ConceptsTab
                key="concepts"
                concepts={filteredConcepts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                onSearch={handleSearch}
                onConceptClick={navigateToConcept}
                currentConcept={currentConcept}
                prerequisites={prerequisites}
                canGoBack={canGoBack}
                onGoBack={goBack}
                categories={currentGraph?.metadata.coverage || []}
              />
            )}
            
            {activeTab === 'paths' && (
              <LearningPathsTab
                key="paths"
                learningPaths={learningPaths}
                currentGraph={currentGraph}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                onGeneratePaths={generateLearningPaths}
              />
            )}
            
            {activeTab === 'analysis' && (
              <AnalysisTab
                key="analysis"
                currentGraph={currentGraph}
                onAnalyze={analyzeKnowledgeGraph}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Generate Graph Modal */}
      <GenerateGraphModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateGraph}
        isGenerating={isGenerating}
      />
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ currentGraph, statistics, learningPaths }: {
  currentGraph: KnowledgeGraph | null
  statistics: any
  learningPaths: LearningPath[]
}) {
  if (!currentGraph || !statistics) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Network className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Graph Selected</h3>
        <p className="text-gray-500">Generate or load a knowledge graph to see insights</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-700">Total Concepts</p>
              <p className="text-2xl font-bold text-blue-900">{statistics.totalConcepts}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Duration</p>
              <p className="text-2xl font-bold text-green-900">{statistics.estimatedDuration}h</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-700">Avg Difficulty</p>
              <p className="text-2xl font-bold text-purple-900">{statistics.averageDifficulty}/10</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-700">Learning Paths</p>
              <p className="text-2xl font-bold text-orange-900">{learningPaths.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty Distribution</h3>
        <div className="space-y-3">
          {Object.entries(statistics.difficultyDistribution).map(([level, count]) => (
            <div key={level} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">{level}</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      level === 'easy' ? 'bg-green-500' :
                      level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(count / statistics.totalConcepts) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Important Concepts</h3>
          <div className="space-y-3">
            {statistics.mostImportantConcepts.slice(0, 5).map((concept: ConceptNode) => (
              <div key={concept.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{concept.name}</p>
                  <p className="text-xs text-gray-500">{concept.category}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{concept.importance}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complex Prerequisites</h3>
          <div className="space-y-3">
            {statistics.conceptsWithPrerequisites.slice(0, 5).map((concept: ConceptNode) => (
              <div key={concept.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{concept.name}</p>
                  <p className="text-xs text-gray-500">{concept.category}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <ArrowLeft className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">{concept.prerequisites.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Concepts Tab Component
function ConceptsTab({ 
  concepts, 
  searchQuery, 
  setSearchQuery, 
  filterCategory, 
  setFilterCategory,
  onSearch,
  onConceptClick,
  currentConcept,
  prerequisites,
  canGoBack,
  onGoBack,
  categories 
}: {
  concepts: ConceptNode[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterCategory: string
  setFilterCategory: (category: string) => void
  onSearch: () => void
  onConceptClick: (concept: ConceptNode) => void
  currentConcept: ConceptNode | null
  prerequisites: ConceptNode[]
  canGoBack: boolean
  onGoBack: () => void
  categories: string[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <button
          onClick={onSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>

      {/* Concept Explorer */}
      {currentConcept && (
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Concept Explorer</h3>
            {canGoBack && (
              <button
                onClick={onGoBack}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{currentConcept.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentConcept.difficulty <= 3 ? 'bg-green-100 text-green-800' :
                      currentConcept.difficulty <= 7 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Level {currentConcept.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {currentConcept.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{currentConcept.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{currentConcept.estimatedLearningTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{currentConcept.importance}/10</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Prerequisites</h5>
              <div className="space-y-2">
                {prerequisites.length > 0 ? (
                  prerequisites.map(prereq => (
                    <button
                      key={prereq.id}
                      onClick={() => onConceptClick(prereq)}
                      className="w-full text-left p-2 bg-white rounded border hover:border-blue-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{prereq.name}</p>
                      <p className="text-xs text-gray-500">{prereq.category}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No prerequisites</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {concepts.map((concept) => (
          <motion.div
            key={concept.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => onConceptClick(concept)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{concept.name}</h4>
              <div className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${
                  concept.difficulty <= 3 ? 'bg-green-500' :
                  concept.difficulty <= 7 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">{concept.difficulty}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{concept.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{concept.category}</span>
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{concept.estimatedLearningTime}m</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {concepts.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Concepts Found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </motion.div>
  )
}

// Learning Paths Tab Component
function LearningPathsTab({ 
  learningPaths, 
  currentGraph, 
  selectedDifficulty, 
  setSelectedDifficulty,
  onGeneratePaths 
}: {
  learningPaths: LearningPath[]
  currentGraph: KnowledgeGraph | null
  selectedDifficulty: string
  setSelectedDifficulty: (difficulty: string) => void
  onGeneratePaths: (subject: string, difficulty: string, duration: number) => void
}) {
  const [maxDuration, setMaxDuration] = useState(40)

  const handleGeneratePaths = () => {
    if (currentGraph) {
      onGeneratePaths(currentGraph.subject, selectedDifficulty, maxDuration)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Difficulty
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Duration (hours)
          </label>
          <input
            type="number"
            value={maxDuration}
            onChange={(e) => setMaxDuration(Number(e.target.value))}
            min="1"
            max="200"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={handleGeneratePaths}
          disabled={!currentGraph}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <GitBranch className="w-4 h-4" />
          <span>Generate Paths</span>
        </button>
      </div>

      {/* Learning Paths */}
      {learningPaths.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {learningPaths.map((path) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{path.name}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  path.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                  path.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {path.difficulty}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{path.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <BookOpen className="w-4 h-4" />
                    <span>{path.concepts.length} concepts</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{path.estimatedDuration}h</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Key Concepts:</p>
                  <div className="flex flex-wrap gap-1">
                    {path.concepts.slice(0, 3).map(concept => (
                      <span
                        key={concept.id}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {concept.name}
                      </span>
                    ))}
                    {path.concepts.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{path.concepts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <button className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                    Start Learning Path
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Paths Generated</h3>
          <p className="text-gray-500">Generate learning paths to see personalized learning routes</p>
        </div>
      )}
    </motion.div>
  )
}

// Analysis Tab Component
function AnalysisTab({ currentGraph, onAnalyze }: {
  currentGraph: KnowledgeGraph | null
  onAnalyze: (subject: string) => Promise<any>
}) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!currentGraph) return
    
    setIsAnalyzing(true)
    try {
      const result = await onAnalyze(currentGraph.subject)
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
    }
    setIsAnalyzing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {currentGraph ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Knowledge Graph Analysis</h3>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Graph'}</span>
            </button>
          </div>

          {analysis && (
            <div className="space-y-6">
              {/* Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <p className="font-medium text-blue-900">Concept Density</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {analysis.metrics.conceptDensity.toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-700">concepts/hour</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="font-medium text-green-900">Balance Score</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {(analysis.metrics.topicalBalance.balanceScore * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-green-700">topic balance</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <GitBranch className="w-5 h-5 text-yellow-600" />
                    <p className="font-medium text-yellow-900">Max Chain</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {analysis.metrics.prerequisiteChains.maxChainLength}
                  </p>
                  <p className="text-sm text-yellow-700">prerequisites</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="font-medium text-red-900">Isolated</p>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {analysis.metrics.prerequisiteChains.isolatedConcepts}
                  </p>
                  <p className="text-sm text-red-700">concepts</p>
                </div>
              </div>

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900">Improvement Suggestions</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <ArrowRight className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Gaps */}
              {analysis.gaps.length > 0 && (
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Identified Knowledge Gaps</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.gaps.map((gap: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-red-800">{gap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage Areas */}
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Coverage Areas</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.coverage.map((area: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Graph Selected</h3>
          <p className="text-gray-500">Select a knowledge graph to analyze its structure and identify improvements</p>
        </div>
      )}
    </motion.div>
  )
}

// Generate Graph Modal Component
function GenerateGraphModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  isGenerating 
}: {
  isOpen: boolean
  onClose: () => void
  onGenerate: (subject: string, scope: string, audience: string) => void
  isGenerating: boolean
}) {
  const [subject, setSubject] = useState('')
  const [scope, setScope] = useState('comprehensive')
  const [audience, setAudience] = useState('general')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (subject.trim()) {
      onGenerate(subject.trim(), scope, audience)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Knowledge Graph</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Mathematics, Physics, Programming..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., high school students, professionals..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !subject.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              {isGenerating ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}