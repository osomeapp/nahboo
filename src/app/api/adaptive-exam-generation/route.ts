import { NextRequest, NextResponse } from 'next/server'
import { 
  adaptiveExamGenerationEngine,
  type ExamRequirements,
  type AdaptiveExam,
  type ExamSession,
  type ExamResults,
  type QuestionItem,
  type DifficultyCalibration
} from '@/lib/adaptive-exam-generation-engine'

export const maxDuration = 120

interface AdaptiveExamGenerationApiRequest {
  action: 'generate_exam' | 'generate_exam_with_progress' | 'get_generation_progress' | 'start_session' | 'get_next_question' | 'submit_response' | 'complete_exam' | 'get_exam' | 'get_exam_statistics' | 'get_analytics' | 'calibrate_difficulty' | 'get_calibration_results' | 'get_session_monitoring' | 'get_exam_history'
  
  // For exam generation
  requirements?: ExamRequirements
  
  // For session management
  examId?: string
  sessionId?: string
  learnerId?: string
  initialAbility?: number
  
  // For question and response handling
  questionId?: string
  response?: any
  responseTime?: number
  confidenceLevel?: number
  
  // For calibration
  questions?: QuestionItem[]
  responseData?: Array<{
    question_id: string
    learner_ability: number
    response_correct: boolean
    response_time: number
  }>
  calibrationId?: string
}

interface AdaptiveExamGenerationApiResponse {
  success: boolean
  action: string
  
  // Response data
  exam?: AdaptiveExam
  exams?: AdaptiveExam[]
  session?: ExamSession
  updatedSession?: ExamSession
  question?: QuestionItem
  adaptive_context?: any
  results?: ExamResults
  statistics?: any
  analytics?: any
  calibration?: DifficultyCalibration
  activeSessions?: ExamSession[]
  progress?: any
  
  // Response metadata
  is_correct?: boolean
  points_earned?: number
  feedback?: string
  adaptive_adjustments?: any[]
  session_update?: any
  
  metadata: {
    processingTime: number
    timestamp: string
    examComplexity?: number
    adaptiveEffectiveness?: number
  }
}

// Track active generation processes for progress monitoring
const activeGenerations = new Map<string, {
  progress: any
  startTime: number
  requirements: ExamRequirements
}>()

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: AdaptiveExamGenerationApiRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<AdaptiveExamGenerationApiResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'generate_exam':
        response = await handleGenerateExam(body)
        break
        
      case 'generate_exam_with_progress':
        response = await handleGenerateExamWithProgress(body)
        break
        
      case 'get_generation_progress':
        response = await handleGetGenerationProgress(body)
        break
        
      case 'start_session':
        response = await handleStartSession(body)
        break
        
      case 'get_next_question':
        response = await handleGetNextQuestion(body)
        break
        
      case 'submit_response':
        response = await handleSubmitResponse(body)
        break
        
      case 'complete_exam':
        response = await handleCompleteExam(body)
        break
        
      case 'get_exam':
        response = await handleGetExam(body)
        break
        
      case 'get_exam_statistics':
        response = await handleGetExamStatistics(body)
        break
        
      case 'get_analytics':
        response = await handleGetAnalytics()
        break
        
      case 'calibrate_difficulty':
        response = await handleCalibrateDifficulty(body)
        break
        
      case 'get_calibration_results':
        response = await handleGetCalibrationResults(body)
        break
        
      case 'get_session_monitoring':
        response = await handleGetSessionMonitoring()
        break
        
      case 'get_exam_history':
        response = await handleGetExamHistory()
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: AdaptiveExamGenerationApiResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        examComplexity: response.exam ? calculateExamComplexity(response.exam) : undefined,
        adaptiveEffectiveness: response.session ? calculateAdaptiveEffectiveness(response.session) : undefined
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Adaptive Exam Generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to process adaptive exam generation request' },
      { status: 500 }
    )
  }
}

// Handle exam generation
async function handleGenerateExam(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.requirements) {
    throw new Error('Missing required field: requirements')
  }
  
  const exam = await adaptiveExamGenerationEngine.generateAdaptiveExam(body.requirements)
  
  return { exam }
}

// Handle exam generation with progress tracking
async function handleGenerateExamWithProgress(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.requirements) {
    throw new Error('Missing required field: requirements')
  }
  
  const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Start exam generation asynchronously
  startAsyncExamGeneration(examId, body.requirements)
  
  return { 
    exam: {
      exam_id: examId
    } as any
  }
}

// Start exam generation process asynchronously
async function startAsyncExamGeneration(examId: string, requirements: ExamRequirements) {
  try {
    // Initialize progress tracking
    activeGenerations.set(examId, {
      progress: {
        stage: 'question_generation',
        progress_percentage: 0,
        current_activity: 'Starting exam generation',
        questions_generated: 0,
        total_questions_needed: requirements.constraints.total_questions,
        estimated_completion_time: 60000
      },
      startTime: Date.now(),
      requirements
    })
    
    // Simulate progress updates
    const updateProgress = (stage: string, percentage: number, activity: string, questionsGenerated: number = 0) => {
      const activeProcess = activeGenerations.get(examId)
      if (activeProcess) {
        activeProcess.progress = {
          stage,
          progress_percentage: percentage,
          current_activity: activity,
          questions_generated: questionsGenerated,
          total_questions_needed: requirements.constraints.total_questions,
          estimated_completion_time: Math.max(0, 60000 - (Date.now() - activeProcess.startTime))
        }
      }
    }
    
    // Simulate generation stages
    updateProgress('question_generation', 10, 'Generating question pool', 0)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    updateProgress('question_generation', 40, 'Creating adaptive questions', Math.floor(requirements.constraints.total_questions * 0.4))
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    updateProgress('calibration', 60, 'Calibrating question difficulties', requirements.constraints.total_questions)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    updateProgress('selection', 80, 'Selecting optimal questions', requirements.constraints.total_questions)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    updateProgress('validation', 90, 'Validating exam quality', requirements.constraints.total_questions)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Perform actual exam generation
    const exam = await adaptiveExamGenerationEngine.generateAdaptiveExam({
      ...requirements,
      exam_id: examId
    })
    
    updateProgress('finalization', 100, 'Exam generation complete', requirements.constraints.total_questions)
    
    // Store exam result
    const activeProcess = activeGenerations.get(examId)
    if (activeProcess) {
      (activeProcess as any).exam = exam
    }
    
  } catch (error) {
    console.error('Async exam generation failed:', error)
    
    // Mark as failed
    const activeProcess = activeGenerations.get(examId)
    if (activeProcess) {
      activeProcess.progress = {
        stage: 'finalization',
        progress_percentage: 0,
        current_activity: 'Exam generation failed',
        questions_generated: 0,
        total_questions_needed: requirements.constraints.total_questions,
        estimated_completion_time: 0
      }
    }
  }
}

// Handle progress retrieval
async function handleGetGenerationProgress(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.examId) {
    throw new Error('Missing required field: examId')
  }
  
  const activeProcess = activeGenerations.get(body.examId)
  
  if (!activeProcess) {
    throw new Error('Exam generation process not found')
  }
  
  return { 
    progress: activeProcess.progress,
    exam: (activeProcess as any).exam
  }
}

// Handle session start
async function handleStartSession(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.examId || !body.learnerId) {
    throw new Error('Missing required fields: examId, learnerId')
  }
  
  const session = await adaptiveExamGenerationEngine.startExamSession(
    body.examId,
    body.learnerId,
    body.initialAbility
  )
  
  return { session }
}

// Handle get next question
async function handleGetNextQuestion(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.sessionId) {
    throw new Error('Missing required field: sessionId')
  }
  
  const result = await adaptiveExamGenerationEngine.getNextQuestion(body.sessionId)
  
  const session = adaptiveExamGenerationEngine.getSession(body.sessionId)
  
  return { 
    question: result.question,
    adaptive_context: result.adaptive_context,
    updatedSession: session || undefined
  }
}

// Handle response submission
async function handleSubmitResponse(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.sessionId || !body.questionId || body.response === undefined || !body.responseTime) {
    throw new Error('Missing required fields: sessionId, questionId, response, responseTime')
  }
  
  const result = await adaptiveExamGenerationEngine.submitResponse(
    body.sessionId,
    body.questionId,
    body.response,
    body.responseTime,
    body.confidenceLevel
  )
  
  const session = adaptiveExamGenerationEngine.getSession(body.sessionId)
  
  return { 
    is_correct: result.is_correct,
    points_earned: result.points_earned,
    feedback: result.feedback,
    adaptive_adjustments: result.adaptive_adjustments,
    session_update: result.session_update,
    updatedSession: session || undefined
  }
}

// Handle exam completion
async function handleCompleteExam(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.sessionId) {
    throw new Error('Missing required field: sessionId')
  }
  
  const results = await adaptiveExamGenerationEngine.completeExam(body.sessionId)
  
  const session = adaptiveExamGenerationEngine.getSession(body.sessionId)
  
  return { 
    results,
    updatedSession: session || undefined
  }
}

// Handle get exam
async function handleGetExam(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.examId) {
    throw new Error('Missing required field: examId')
  }
  
  const exam = adaptiveExamGenerationEngine.getExam(body.examId)
  
  if (!exam) {
    // Check if it's an active generation
    const activeProcess = activeGenerations.get(body.examId)
    if (activeProcess && (activeProcess as any).exam) {
      return { exam: (activeProcess as any).exam }
    }
    
    throw new Error('Exam not found')
  }
  
  return { exam }
}

// Handle get exam statistics
async function handleGetExamStatistics(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.examId) {
    throw new Error('Missing required field: examId')
  }
  
  const statistics = adaptiveExamGenerationEngine.getExamStatistics(body.examId)
  
  return { statistics }
}

// Handle get analytics
async function handleGetAnalytics(): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  // In a real implementation, this would aggregate analytics from database
  // For now, return mock analytics data
  
  const analytics = {
    total_exams_generated: 450,
    total_sessions_completed: 1250,
    avg_exam_score: 76.8,
    avg_session_duration: 42.5,
    difficulty_effectiveness: 0.88,
    adaptive_accuracy: 0.84,
    most_common_subjects: [
      'Mathematics',
      'Computer Science',
      'Physics',
      'Chemistry',
      'Biology'
    ],
    performance_trends: [
      { date: '2024-01-01', avg_score: 74.2, completion_rate: 0.89 },
      { date: '2024-01-15', avg_score: 75.1, completion_rate: 0.91 },
      { date: '2024-02-01', avg_score: 76.3, completion_rate: 0.92 },
      { date: '2024-02-15', avg_score: 76.8, completion_rate: 0.94 },
      { date: '2024-03-01', avg_score: 77.2, completion_rate: 0.95 }
    ],
    question_type_effectiveness: {
      multiple_choice: 0.82,
      true_false: 0.78,
      short_answer: 0.85,
      essay: 0.79,
      code: 0.88
    },
    adaptive_features_impact: {
      difficulty_adjustment: 0.15,
      question_type_variation: 0.12,
      time_management: 0.08,
      hint_provision: 0.10
    }
  }
  
  return { analytics }
}

// Handle difficulty calibration
async function handleCalibrateDifficulty(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.questions || !body.responseData) {
    throw new Error('Missing required fields: questions, responseData')
  }
  
  // In a real implementation, this would perform IRT analysis
  // For now, return mock calibration data
  
  const calibrationId = `calibration_${Date.now()}`
  
  const calibration: DifficultyCalibration = {
    calibration_id: calibrationId,
    question_pool: body.questions,
    calibration_results: body.questions.map(question => ({
      question_id: question.question_id,
      statistical_difficulty: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
      irt_parameters: {
        discrimination: Math.random() * 1.5 + 0.5, // 0.5 to 2.0
        difficulty: Math.random() * 4 - 2, // -2 to 2
        guessing: Math.random() * 0.3 + 0.1 // 0.1 to 0.4
      },
      performance_data: {
        total_attempts: Math.floor(Math.random() * 200) + 50,
        correct_responses: Math.floor(Math.random() * 150) + 25,
        avg_response_time: Math.random() * 180 + 60,
        ability_range: [-2, 2] as [number, number]
      },
      quality_metrics: {
        discrimination_index: Math.random() * 0.6 + 0.2,
        point_biserial_correlation: Math.random() * 0.8 + 0.1,
        reliability_contribution: Math.random() * 0.3 + 0.1
      }
    })),
    calibration_metadata: {
      sample_size: body.responseData.length,
      ability_distribution: Array.from({length: 10}, () => Math.random()),
      convergence_achieved: true,
      standard_error: 0.05,
      confidence_level: 0.95
    }
  }
  
  return { calibration }
}

// Handle get calibration results
async function handleGetCalibrationResults(body: AdaptiveExamGenerationApiRequest): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  if (!body.calibrationId) {
    throw new Error('Missing required field: calibrationId')
  }
  
  // In a real implementation, this would retrieve from database
  // For now, return null as we don't have persistence
  
  return { calibration: undefined }
}

// Handle session monitoring
async function handleGetSessionMonitoring(): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  // In a real implementation, this would query active sessions from database
  // For now, return mock monitoring data
  
  const activeSessions: ExamSession[] = []
  
  const analytics = {
    total_active_sessions: activeSessions.length,
    avg_progress: 0.65,
    sessions_requiring_attention: 3,
    performance_distribution: {
      'below_basic': 2,
      'basic': 8,
      'proficient': 15,
      'advanced': 12,
      'expert': 3
    }
  }
  
  return { 
    activeSessions,
    analytics
  }
}

// Handle get exam history
async function handleGetExamHistory(): Promise<Partial<AdaptiveExamGenerationApiResponse>> {
  // In a real implementation, this would query database for user's exams
  // For now, return empty array as we don't have persistence
  
  return { exams: [] }
}

// Utility functions
function calculateExamComplexity(exam: AdaptiveExam): number {
  const avgDifficulty = exam.questions.reduce((sum, q) => sum + q.metadata.difficulty_level, 0) / exam.questions.length
  const questionTypeVariety = new Set(exam.questions.map(q => q.question_type)).size
  const objectivesCovered = exam.requirements.learning_objectives.length
  
  return (avgDifficulty / 10) * 0.5 + (questionTypeVariety / 8) * 0.3 + (objectivesCovered / 10) * 0.2
}

function calculateAdaptiveEffectiveness(session: ExamSession): number {
  const adjustmentCount = session.adaptive_adjustments.length
  const responseCount = session.responses.length
  const consistencyScore = session.current_state.performance_indicators.consistency_score
  
  const adjustmentRatio = responseCount > 0 ? adjustmentCount / responseCount : 0
  const effectivenessScore = consistencyScore * 0.6 + (1 - Math.min(adjustmentRatio, 1)) * 0.4
  
  return Math.max(0, Math.min(1, effectivenessScore))
}

export async function GET() {
  return NextResponse.json({
    message: 'Adaptive Exam Generation API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'AI-powered adaptive exam generation with real-time difficulty calibration',
        actions: [
          'generate_exam',
          'generate_exam_with_progress',
          'get_generation_progress',
          'start_session',
          'get_next_question',
          'submit_response',
          'complete_exam',
          'get_exam',
          'get_exam_statistics',
          'get_analytics',
          'calibrate_difficulty',
          'get_calibration_results',
          'get_session_monitoring',
          'get_exam_history'
        ]
      }
    },
    capabilities: [
      'Adaptive Question Generation',
      'Real-time Difficulty Calibration',
      'IRT-based Statistical Analysis',
      'Dynamic Question Selection',
      'Performance-based Branching',
      'Comprehensive Result Analytics',
      'Multi-objective Assessment',
      'Accessibility Compliance',
      'Session Monitoring',
      'Progress Tracking'
    ],
    questionTypes: [
      'multiple_choice',
      'true_false',
      'short_answer',
      'essay',
      'code',
      'matching',
      'drag_drop',
      'numerical'
    ],
    adaptiveFeatures: [
      'Dynamic Difficulty Adjustment',
      'Question Type Variation',
      'Time-based Adaptations',
      'Confidence-based Termination',
      'Performance Prediction',
      'Hint Provision',
      'Prerequisite Checking',
      'Mastery Assessment'
    ],
    assessmentPurposes: [
      'diagnostic',
      'formative',
      'summative',
      'placement',
      'certification',
      'practice'
    ],
    calibrationMethods: [
      'Item Response Theory (IRT)',
      'Classical Test Theory (CTT)',
      'Rasch Modeling',
      'AI-powered Estimation',
      'Crowdsourced Validation'
    ],
    analyticsMetrics: [
      'exam_complexity',
      'adaptive_effectiveness',
      'difficulty_calibration',
      'learner_engagement',
      'completion_rates',
      'score_distributions',
      'time_efficiency',
      'question_quality'
    ],
    features: [
      'Multi-Model AI Content Generation',
      'Statistical Difficulty Calibration',
      'Real-time Adaptive Algorithms',
      'Comprehensive Quality Validation',
      'Session Progress Monitoring',
      'Performance Analytics Dashboard',
      'Accessibility Accommodations',
      'Multi-language Support',
      'Fraud Detection',
      'Result Certification'
    ]
  })
}