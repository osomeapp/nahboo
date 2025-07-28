'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useAutomatedCurriculumGenerator, 
  useCurriculumTemplates, 
  useCurriculumValidation 
} from '@/hooks/useAutomatedCurriculumGenerator'
import {
  type CurriculumGenerationRequest,
  type LearningObjective,
  type TargetAudience,
  type BloomsTaxonomyLevel
} from '@/lib/automated-curriculum-generator'

const AutomatedCurriculumGeneratorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'templates' | 'validation' | 'analytics'>('generator')
  const [generationProgress, setGenerationProgress] = useState<any>(null)
  
  const {
    currentCurriculum,
    learningObjectives,
    validationResults,
    qualityAnalysis,
    systemAnalytics,
    isGenerating,
    isValidating,
    isExporting,
    isAnalyzing,
    error,
    warnings,
    recommendations,
    generateCurriculumWithProgress,
    createLearningObjectives,
    validateCurriculum,
    analyzeCurriculumQuality,
    exportCurriculum,
    clearError,
    hasCurrentCurriculum,
    hasLearningObjectives,
    currentCurriculumMetrics,
    validationInsights,
    qualityInsights,
    systemHealth
  } = useAutomatedCurriculumGenerator()

  const {
    templates,
    selectedTemplate,
    isLoading: isLoadingTemplates,
    selectTemplate,
    filterByCategory,
    categories
  } = useCurriculumTemplates()

  const {
    validationHistory,
    isProcessingQueue,
    queueValidation,
    averageValidityScore,
    recentValidations
  } = useCurriculumValidation()

  // Mock generation request for demonstration
  const [generationRequest, setGenerationRequest] = useState<CurriculumGenerationRequest>({
    learning_objectives: [],
    target_audience: {
      age_range: [16, 18],
      education_level: 'high_school',
      prior_knowledge_level: 'intermediate',
      learning_context: 'formal_education',
      special_needs: [],
      cultural_considerations: ['diverse_backgrounds'],
      technology_access: 'high',
      time_availability: 'full_time'
    },
    constraints: {
      max_duration_weeks: 16,
      budget_level: 'medium',
      class_size: 25,
      available_resources: ['textbooks', 'computers', 'lab_equipment']
    },
    pedagogical_preferences: {
      teaching_methods: ['interactive', 'collaborative'],
      learning_theories: ['constructivism', 'social_learning'],
      engagement_strategies: ['group_work', 'hands_on_activities'],
      technology_integration_preference: 'moderate'
    },
    assessment_requirements: {
      frequency: 'weekly_formative_biweekly_summative',
      types: ['formative', 'summative', 'peer_assessment'],
      weight_distribution: { 'formative': 0.3, 'summative': 0.7 }
    },
    customization_parameters: {
      flexibility_level: 'high',
      adaptation_options: ['difficulty', 'pacing', 'content_format', 'assessment_type'],
      personalization_features: ['adaptive_content', 'learning_style_matching']
    },
    quality_standards: {
      minimum_score: 8.0,
      required_certifications: ['wcag_aa', 'accessibility_compliant'],
      compliance_requirements: ['evidence_based', 'best_practices']
    }
  })

  const handleGenerateCurriculum = async () => {
    if (learningObjectives.length === 0) {
      // Create sample objectives first
      await handleCreateObjectives()
    }

    const request = {
      ...generationRequest,
      learning_objectives: learningObjectives
    }

    try {
      await generateCurriculumWithProgress(request, (progress) => {
        setGenerationProgress(progress)
      })
    } catch (error) {
      console.error('Error generating curriculum:', error)
    }
  }

  const handleCreateObjectives = async () => {
    try {
      const objectives = await createLearningObjectives({
        subject_area: 'Computer Science',
        target_audience: generationRequest.target_audience,
        learning_goals: [
          'Programming Fundamentals',
          'Data Structures',
          'Algorithm Design',
          'Software Engineering Principles',
          'Problem Solving Techniques',
          'Code Quality and Documentation'
        ],
        curriculum_scope: 'Comprehensive introduction to computer science concepts and programming practices'
      })
      
      return objectives
    } catch (error) {
      console.error('Error creating learning objectives:', error)
    }
  }

  const handleValidateCurriculum = async () => {
    if (!currentCurriculum) return
    
    try {
      await validateCurriculum(currentCurriculum, [
        'objective_alignment',
        'assessment_validity',
        'content_accuracy',
        'pedagogical_soundness',
        'accessibility_compliance'
      ])
    } catch (error) {
      console.error('Error validating curriculum:', error)
    }
  }

  const handleAnalyzeQuality = async () => {
    if (!currentCurriculum) return
    
    try {
      await analyzeCurriculumQuality(currentCurriculum, 8.0)
    } catch (error) {
      console.error('Error analyzing curriculum quality:', error)
    }
  }

  const handleExportCurriculum = async (format: 'pdf' | 'word' | 'json' | 'scorm' | 'canvas' | 'moodle') => {
    if (!currentCurriculum) return
    
    try {
      await exportCurriculum(currentCurriculum.curriculum_id, format)
    } catch (error) {
      console.error('Error exporting curriculum:', error)
    }
  }

  const tabs = [
    { id: 'generator', label: 'Curriculum Generator', icon: '🎯' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'validation', label: 'Validation & Quality', icon: '✅' },
    { id: 'analytics', label: 'System Analytics', icon: '📊' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Automated Curriculum Generator
          </h1>
          <p className="text-gray-600">
            AI-powered curriculum creation from learning objectives with comprehensive validation and quality assurance
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
            >
              <div className="flex justify-between items-center">
                <span>⚠️ {error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warnings and Recommendations */}
        <AnimatePresence>
          {(warnings.length > 0 || recommendations.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 space-y-3"
            >
              {warnings.length > 0 && (
                <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
                  <h4 className="font-medium mb-2">⚠️ Warnings:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {recommendations.length > 0 && (
                <div className="p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg">
                  <h4 className="font-medium mb-2">💡 Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'generator' && (
            <motion.div
              key="generator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <GeneratorTab
                hasLearningObjectives={hasLearningObjectives}
                hasCurrentCurriculum={hasCurrentCurriculum}
                isGenerating={isGenerating}
                isValidating={isValidating}
                isAnalyzing={isAnalyzing}
                isExporting={isExporting}
                generationProgress={generationProgress}
                currentCurriculum={currentCurriculum}
                currentCurriculumMetrics={currentCurriculumMetrics}
                validationInsights={validationInsights}
                qualityInsights={qualityInsights}
                onCreateObjectives={handleCreateObjectives}
                onGenerateCurriculum={handleGenerateCurriculum}
                onValidateCurriculum={handleValidateCurriculum}
                onAnalyzeQuality={handleAnalyzeQuality}
                onExportCurriculum={handleExportCurriculum}
              />
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <TemplatesTab
                templates={templates}
                selectedTemplate={selectedTemplate}
                isLoadingTemplates={isLoadingTemplates}
                categories={categories}
                onSelectTemplate={selectTemplate}
                onFilterByCategory={filterByCategory}
              />
            </motion.div>
          )}

          {activeTab === 'validation' && (
            <motion.div
              key="validation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <ValidationTab
                validationResults={validationResults}
                qualityAnalysis={qualityAnalysis}
                validationHistory={validationHistory}
                isProcessingQueue={isProcessingQueue}
                averageValidityScore={averageValidityScore}
                recentValidations={recentValidations}
                validationInsights={validationInsights}
                qualityInsights={qualityInsights}
                onQueueValidation={queueValidation}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <AnalyticsTab
                systemAnalytics={systemAnalytics}
                systemHealth={systemHealth}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Generator Tab Component
const GeneratorTab: React.FC<{
  hasLearningObjectives: boolean
  hasCurrentCurriculum: boolean
  isGenerating: boolean
  isValidating: boolean
  isAnalyzing: boolean
  isExporting: boolean
  generationProgress: any
  currentCurriculum: any
  currentCurriculumMetrics: any
  validationInsights: any
  qualityInsights: any
  onCreateObjectives: () => Promise<any>
  onGenerateCurriculum: () => Promise<void>
  onValidateCurriculum: () => Promise<void>
  onAnalyzeQuality: () => Promise<void>
  onExportCurriculum: (format: string) => Promise<void>
}> = ({
  hasLearningObjectives,
  hasCurrentCurriculum,
  isGenerating,
  isValidating,
  isAnalyzing,
  isExporting,
  generationProgress,
  currentCurriculum,
  currentCurriculumMetrics,
  validationInsights,
  qualityInsights,
  onCreateObjectives,
  onGenerateCurriculum,
  onValidateCurriculum,
  onAnalyzeQuality,
  onExportCurriculum
}) => {
  const [selectedExportFormat, setSelectedExportFormat] = useState<string>('pdf')

  const exportFormats = [
    { value: 'pdf', label: 'PDF Document', description: 'Printable curriculum document' },
    { value: 'word', label: 'Microsoft Word', description: 'Editable document format' },
    { value: 'json', label: 'JSON Data', description: 'Machine-readable format' },
    { value: 'scorm', label: 'SCORM Package', description: 'LMS-compatible format' },
    { value: 'canvas', label: 'Canvas Import', description: 'Direct Canvas LMS import' },
    { value: 'moodle', label: 'Moodle Backup', description: 'Moodle course format' }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Generation Controls */}
      <div className="space-y-6">
        {/* Learning Objectives Creation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Learning Objectives
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Status: {hasLearningObjectives ? 'Ready' : 'Not Created'}
              </span>
              <div className={`w-3 h-3 rounded-full ${hasLearningObjectives ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            
            <button
              onClick={onCreateObjectives}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>🎯</span>
              <span>Create Learning Objectives</span>
            </button>
            
            <p className="text-xs text-gray-500">
              Generate learning objectives for Computer Science curriculum targeting high school students
            </p>
          </div>
        </div>

        {/* Curriculum Generation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Curriculum Generation
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={onGenerateCurriculum}
              disabled={!hasLearningObjectives || isGenerating}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Generate Curriculum</span>
                </>
              )}
            </button>
            
            {generationProgress && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-800">
                    {generationProgress.stage.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-green-600">
                    {generationProgress.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${generationProgress.progress_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-green-700">
                  {generationProgress.current_activity}
                </p>
                {generationProgress.estimated_completion_time > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Est. completion: {Math.round(generationProgress.estimated_completion_time / 1000)}s
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Quality Assurance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quality Assurance
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={onValidateCurriculum}
              disabled={!hasCurrentCurriculum || isValidating}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>Validate Curriculum</span>
                </>
              )}
            </button>

            <button
              onClick={onAnalyzeQuality}
              disabled={!hasCurrentCurriculum || isAnalyzing}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>📊</span>
                  <span>Analyze Quality</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Export Curriculum
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {exportFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {exportFormats.find(f => f.value === selectedExportFormat)?.description}
              </p>
            </div>

            <button
              onClick={() => onExportCurriculum(selectedExportFormat)}
              disabled={!hasCurrentCurriculum || isExporting}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Export Curriculum</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Middle Column - Curriculum Overview */}
      <div className="space-y-6">
        {/* Current Curriculum Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Curriculum
          </h3>
          
          {hasCurrentCurriculum && currentCurriculumMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentCurriculumMetrics.qualityScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Quality Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentCurriculumMetrics.moduleCount}
                  </div>
                  <div className="text-xs text-gray-500">Modules</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentCurriculumMetrics.lessonCount}
                  </div>
                  <div className="text-xs text-gray-500">Lessons</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentCurriculumMetrics.durationWeeks}
                  </div>
                  <div className="text-xs text-gray-500">Weeks</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assessments</span>
                  <span className="text-sm font-medium">{currentCurriculumMetrics.assessmentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Adaptive Elements</span>
                  <span className="text-sm font-medium">{currentCurriculumMetrics.adaptiveElementCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Complexity</span>
                  <span className={`text-sm font-medium ${
                    currentCurriculumMetrics.complexityLevel === 'High' ? 'text-red-600' :
                    currentCurriculumMetrics.complexityLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {currentCurriculumMetrics.complexityLevel}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📚</div>
              <p>No curriculum generated yet</p>
              <p className="text-sm mt-1">Create learning objectives and generate a curriculum to see details</p>
            </div>
          )}
        </div>

        {/* Curriculum Structure Preview */}
        {hasCurrentCurriculum && currentCurriculum && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Curriculum Structure
            </h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Title</h4>
                <p className="text-sm text-gray-600">{currentCurriculum.blueprint?.title}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{currentCurriculum.blueprint?.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Subject Area</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {currentCurriculum.blueprint?.subject_area}
                </span>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Target Audience</h4>
                <div className="text-sm text-gray-600">
                  <p>Level: {currentCurriculum.blueprint?.target_audience?.education_level?.replace('_', ' ')}</p>
                  <p>Age: {currentCurriculum.blueprint?.target_audience?.age_range?.join('-')} years</p>
                  <p>Context: {currentCurriculum.blueprint?.target_audience?.learning_context?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Column - Validation & Quality Results */}
      <div className="space-y-6">
        {/* Validation Results */}
        {validationInsights && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Validation Results
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Validity</span>
                <div className={`flex items-center space-x-2 ${
                  validationInsights.overallValidity ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="text-sm font-medium">
                    {validationInsights.overallValidity ? 'Valid' : 'Issues Found'}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    validationInsights.overallValidity ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Validity Score</span>
                  <span className="text-sm font-medium">{validationInsights.validityScore.toFixed(1)}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${validationInsights.validityScore * 10}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-red-600">{validationInsights.issueCount}</div>
                  <div className="text-xs text-gray-500">Issues</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{validationInsights.suggestionCount}</div>
                  <div className="text-xs text-gray-500">Suggestions</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Compliance Status</h4>
                <div className="space-y-1">
                  {Object.entries(validationInsights.complianceStatus).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        value ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quality Analysis */}
        {qualityInsights && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quality Analysis
            </h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  qualityInsights.overallScore >= 8 ? 'text-green-600' :
                  qualityInsights.overallScore >= 6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityInsights.overallScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Overall Quality Score</div>
                <div className={`text-xs mt-1 ${
                  qualityInsights.meetsThreshold ? 'text-green-600' : 'text-red-600'
                }`}>
                  {qualityInsights.meetsThreshold ? 'Meets Threshold' : 'Below Threshold'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{qualityInsights.strengthCount}</div>
                  <div className="text-xs text-gray-500">Strengths</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{qualityInsights.improvementAreaCount}</div>
                  <div className="text-xs text-gray-500">Improvements</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Risk Level</h4>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    qualityInsights.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                    qualityInsights.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {qualityInsights.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Top Quality Dimension</h4>
                <p className="text-sm text-gray-600 capitalize">
                  {qualityInsights.topDimension.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generation Progress History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            {hasCurrentCurriculum && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Curriculum Generated</p>
                  <p className="text-xs text-green-600">Successfully created comprehensive curriculum</p>
                </div>
              </div>
            )}
            
            {validationInsights && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Validation Complete</p>
                  <p className="text-xs text-purple-600">
                    Score: {validationInsights.validityScore.toFixed(1)}/10
                  </p>
                </div>
              </div>
            )}
            
            {qualityInsights && (
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-orange-800">Quality Analysis</p>
                  <p className="text-xs text-orange-600">
                    Score: {qualityInsights.overallScore.toFixed(1)}/10
                  </p>
                </div>
              </div>
            )}
            
            {!hasCurrentCurriculum && !validationInsights && !qualityInsights && (
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Templates Tab Component
const TemplatesTab: React.FC<{
  templates: any[]
  selectedTemplate: any
  isLoadingTemplates: boolean
  categories: string[]
  onSelectTemplate: (template: any) => void
  onFilterByCategory: (category: string) => void
}> = ({
  templates,
  selectedTemplate,
  isLoadingTemplates,
  categories,
  onSelectTemplate,
  onFilterByCategory
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('')

  const handleCategoryFilter = (category: string) => {
    setFilterCategory(category)
    onFilterByCategory(category)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filter and Categories */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Template Categories
          </h3>
          
          <div className="space-y-2">
            <button
              onClick={() => handleCategoryFilter('')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                filterCategory === '' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Templates ({templates.length})
            </button>
            
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filterCategory === category ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category} ({templates.filter(t => t.category === category).length})
              </button>
            ))}
          </div>
        </div>

        {/* Selected Template Details */}
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Template Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.duration_weeks} weeks</span>
                </div>
                <div>
                  <span className="text-gray-500">Objectives:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.objective_count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Complexity:</span>
                  <span className="ml-2 font-medium capitalize">{selectedTemplate.complexity_level}</span>
                </div>
                <div>
                  <span className="text-gray-500">Rating:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.rating}/5.0</span>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Features</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.features?.map((feature: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {feature.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                Use This Template
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Template Grid */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Templates
            </h3>
            <span className="text-sm text-gray-500">
              {templates.length} templates
            </span>
          </div>
          
          {isLoadingTemplates ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <motion.div
                  key={template.template_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.template_id === template.template_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {template.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <div>Duration: {template.duration_weeks} weeks</div>
                    <div>Objectives: {template.objective_count}</div>
                    <div>Complexity: {template.complexity_level}</div>
                    <div>Used: {template.usage_count} times</div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium">{template.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Updated: {new Date(template.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Validation Tab Component
const ValidationTab: React.FC<{
  validationResults: any
  qualityAnalysis: any
  validationHistory: any[]
  isProcessingQueue: boolean
  averageValidityScore: number
  recentValidations: any[]
  validationInsights: any
  qualityInsights: any
  onQueueValidation: (request: any) => void
}> = ({
  validationResults,
  qualityAnalysis,
  validationHistory,
  isProcessingQueue,
  averageValidityScore,
  recentValidations,
  validationInsights,
  qualityInsights,
  onQueueValidation
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Validation Status */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Validation Status
          </h3>
          
          {validationInsights ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  validationInsights.overallValidity ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationInsights.validityScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Validity Score</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-red-600">{validationInsights.issueCount}</div>
                  <div className="text-xs text-gray-500">Issues Found</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{validationInsights.suggestionCount}</div>
                  <div className="text-xs text-gray-500">Suggestions</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">🔍</div>
              <p>No validation results yet</p>
              <p className="text-sm mt-1">Generate a curriculum to begin validation</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quality Analysis
          </h3>
          
          {qualityInsights ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  qualityInsights.overallScore >= 8 ? 'text-green-600' :
                  qualityInsights.overallScore >= 6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityInsights.overallScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Quality Score</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{qualityInsights.strengthCount}</div>
                  <div className="text-xs text-gray-500">Strengths</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{qualityInsights.improvementAreaCount}</div>
                  <div className="text-xs text-gray-500">Areas to Improve</div>
                </div>
              </div>
              
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  qualityInsights.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                  qualityInsights.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {qualityInsights.riskLevel.toUpperCase()} RISK
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📊</div>
              <p>No quality analysis yet</p>
              <p className="text-sm mt-1">Analyze curriculum quality to see results</p>
            </div>
          )}
        </div>
      </div>

      {/* Validation History and Analytics */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Validation Analytics
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validationHistory.length}</div>
                <div className="text-xs text-gray-500">Total Validations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {averageValidityScore.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Avg Validity Score</div>
              </div>
            </div>
            
            {isProcessingQueue && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-800">Processing validation queue...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Validations
          </h3>
          
          <div className="space-y-3">
            {recentValidations.length > 0 ? (
              recentValidations.map((validation, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      validation.overall_validity ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                      Score: {validation.validity_score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {validation.identified_issues?.length || 0} issues found
                  </p>
                  <p className="text-xs text-gray-500">
                    {validation.improvement_suggestions?.length || 0} suggestions provided
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">No validation history available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Component
const AnalyticsTab: React.FC<{
  systemAnalytics: any
  systemHealth: any
}> = ({
  systemAnalytics,
  systemHealth
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* System Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Overview
        </h3>
        
        {systemAnalytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {systemAnalytics.total_curricula_generated}
                </div>
                <div className="text-xs text-gray-500">Total Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {(systemAnalytics.success_rate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Success Rate</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Generation Time</span>
                <span className="text-sm font-medium">{systemAnalytics.average_generation_time} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">User Satisfaction</span>
                <span className="text-sm font-medium">
                  {systemAnalytics.user_satisfaction?.overall_rating}/5.0
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">Loading analytics...</div>
        )}
      </div>

      {/* Quality Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quality Metrics
        </h3>
        
        {systemAnalytics?.quality_scores ? (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Overall Quality</span>
                <span className="text-sm font-medium">
                  {systemAnalytics.quality_scores.average_overall_quality.toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${systemAnalytics.quality_scores.average_overall_quality * 10}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Alignment Score</span>
                <span className="text-sm font-medium">
                  {systemAnalytics.quality_scores.average_alignment_score.toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${systemAnalytics.quality_scores.average_alignment_score * 10}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Engagement</span>
                <span className="text-sm font-medium">
                  {systemAnalytics.quality_scores.average_engagement_score.toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${systemAnalytics.quality_scores.average_engagement_score * 10}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No quality data available</div>
        )}
      </div>

      {/* Popular Subjects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Popular Subjects
        </h3>
        
        {systemAnalytics?.popular_subjects ? (
          <div className="space-y-3">
            {Object.entries(systemAnalytics.popular_subjects).map(([subject, percentage]: [string, any]) => (
              <div key={subject}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{subject}</span>
                  <span className="text-sm font-medium">{(percentage * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${percentage * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No subject data available</div>
        )}
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Health
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {(systemHealth.generationSuccessRate * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Success Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {systemHealth.averageQuality.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Avg Quality</div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">System Load</span>
                <span className="text-sm font-medium">
                  {(systemHealth.systemLoad * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    systemHealth.systemLoad < 0.7 ? 'bg-green-600' :
                    systemHealth.systemLoad < 0.9 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${systemHealth.systemLoad * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Trends */}
      {systemAnalytics?.generation_trends && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Generation Trends
          </h3>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{systemAnalytics.generation_trends.monthly_growth}%
              </div>
              <div className="text-xs text-gray-500">Monthly Growth</div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Popular Durations</h4>
              <div className="flex space-x-2">
                {systemAnalytics.generation_trends.popular_durations.map((duration: number, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {duration} weeks
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Complexity Distribution</h4>
              {Object.entries(systemAnalytics.generation_trends.complexity_distribution).map(([level, percentage]: [string, any]) => (
                <div key={level} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 capitalize">{level}</span>
                  <span className="font-medium">{(percentage * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Innovation Metrics */}
      {systemAnalytics?.innovation_metrics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Innovation Metrics
          </h3>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemAnalytics.innovation_metrics.novel_pedagogical_approaches}
              </div>
              <div className="text-xs text-gray-500">Novel Approaches</div>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Adaptive Elements Usage</span>
                  <span className="text-sm font-medium">
                    {(systemAnalytics.innovation_metrics.adaptive_elements_usage * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${systemAnalytics.innovation_metrics.adaptive_elements_usage * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Technology Integration</span>
                  <span className="text-sm font-medium">
                    {(systemAnalytics.innovation_metrics.technology_integration_advancement * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${systemAnalytics.innovation_metrics.technology_integration_advancement * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutomatedCurriculumGeneratorDashboard