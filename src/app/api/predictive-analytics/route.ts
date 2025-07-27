import { NextRequest, NextResponse } from 'next/server'
import { 
  predictiveAnalyticsEngine,
  type LearnerRiskProfile,
  type EarlyWarningSignal,
  type InterventionRecommendation
} from '@/lib/predictive-analytics-engine'

export const maxDuration = 45

interface PredictiveAnalyticsRequest {
  action: 'assess_risk' | 'get_risk_profile' | 'get_risk_history' | 'get_warning_signals' | 'get_critical_learners' | 'get_interventions' | 'get_model_performance' | 'update_model'
  
  // For assess_risk
  userId?: string
  sessionId?: string
  learningData?: {
    performance_data: any[]
    engagement_data: any[]
    behavioral_data: any[]
    emotional_data: any[]
    contextual_data: any
  }
  
  // For get_risk_history
  limit?: number
  
  // For update_model
  modelId?: string
  performanceMetrics?: any
}

interface PredictiveAnalyticsResponse {
  success: boolean
  action: string
  
  // Response data
  riskProfile?: LearnerRiskProfile
  riskHistory?: LearnerRiskProfile[]
  warningSignals?: EarlyWarningSignal[]
  criticalLearners?: Array<{ userId: string, riskProfile: LearnerRiskProfile }>
  interventions?: InterventionRecommendation[]
  modelPerformance?: any[]
  analytics?: any
  
  metadata: {
    processingTime: number
    timestamp: string
    dataPoints?: number
    riskLevel?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: PredictiveAnalyticsRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<PredictiveAnalyticsResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'assess_risk':
        response = await handleAssessRisk(body)
        break
        
      case 'get_risk_profile':
        response = await handleGetRiskProfile(body)
        break
        
      case 'get_risk_history':
        response = await handleGetRiskHistory(body)
        break
        
      case 'get_warning_signals':
        response = await handleGetWarningSignals(body)
        break
        
      case 'get_critical_learners':
        response = await handleGetCriticalLearners()
        break
        
      case 'get_interventions':
        response = await handleGetInterventions(body)
        break
        
      case 'get_model_performance':
        response = await handleGetModelPerformance()
        break
        
      case 'update_model':
        response = await handleUpdateModel(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: PredictiveAnalyticsResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        dataPoints: body.learningData ? 
          (body.learningData.performance_data?.length || 0) + 
          (body.learningData.engagement_data?.length || 0) + 
          (body.learningData.behavioral_data?.length || 0) + 
          (body.learningData.emotional_data?.length || 0) : undefined,
        riskLevel: response.riskProfile?.risk_level
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Predictive Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to process predictive analytics request' },
      { status: 500 }
    )
  }
}

// Assess learner risk
async function handleAssessRisk(body: PredictiveAnalyticsRequest): Promise<Partial<PredictiveAnalyticsResponse>> {
  if (!body.userId || !body.sessionId || !body.learningData) {
    throw new Error('Missing required fields: userId, sessionId, learningData')
  }
  
  const riskProfile = await predictiveAnalyticsEngine.assessLearnerRisk(
    body.userId,
    body.sessionId,
    body.learningData
  )
  
  return { 
    riskProfile,
    warningSignals: riskProfile.early_warning_signals,
    interventions: riskProfile.intervention_recommendations
  }
}

// Get current risk profile
async function handleGetRiskProfile(body: PredictiveAnalyticsRequest): Promise<Partial<PredictiveAnalyticsResponse>> {
  if (!body.userId) {
    throw new Error('Missing required field: userId')
  }
  
  const riskProfile = predictiveAnalyticsEngine.getLearnerRiskProfile(body.userId)
  
  if (!riskProfile) {
    throw new Error('No risk profile found for user')
  }
  
  return { riskProfile }
}

// Get risk history
async function handleGetRiskHistory(body: PredictiveAnalyticsRequest): Promise<Partial<PredictiveAnalyticsResponse>> {
  if (!body.userId) {
    throw new Error('Missing required field: userId')
  }
  
  const riskHistory = predictiveAnalyticsEngine.getRiskHistory(body.userId, body.limit || 10)
  
  return { riskHistory }
}

// Get warning signals
async function handleGetWarningSignals(body: PredictiveAnalyticsRequest): Promise<Partial<PredictiveAnalyticsResponse>> {
  if (!body.userId) {
    throw new Error('Missing required field: userId')
  }
  
  const warningSignals = predictiveAnalyticsEngine.getWarningSignals(body.userId)
  
  return { warningSignals }
}

// Get critical learners
async function handleGetCriticalLearners(): Promise<Partial<PredictiveAnalyticsResponse>> {
  const criticalLearners = predictiveAnalyticsEngine.getCriticalRiskLearners()
  
  return { criticalLearners }
}

// Get interventions for a user
async function handleGetInterventions(body: PredictiveAnalyticsRequest): Promise<Partial<PredictiveAnalyticsResponse>> {
  if (!body.userId) {
    throw new Error('Missing required field: userId')
  }
  
  const riskProfile = predictiveAnalyticsEngine.getLearnerRiskProfile(body.userId)
  
  if (!riskProfile) {
    return { interventions: [] }
  }
  
  return { interventions: riskProfile.intervention_recommendations }
}

// Get model performance metrics
async function handleGetModelPerformance(): Promise<Partial<PredictiveAnalyticsResponse>> {
  const modelPerformance = predictiveAnalyticsEngine.getModelPerformance()
  
  return { modelPerformance }
}

// Update model performance
async function handleUpdateModel(body: PredictiveAnalyticsRequest): Promise<Partial<PredictiveAnalyticsResponse>> {
  if (!body.modelId || !body.performanceMetrics) {
    throw new Error('Missing required fields: modelId, performanceMetrics')
  }
  
  const success = await predictiveAnalyticsEngine.updateModelPerformance(
    body.modelId,
    body.performanceMetrics
  )
  
  if (!success) {
    throw new Error('Failed to update model performance')
  }
  
  const modelPerformance = predictiveAnalyticsEngine.getModelPerformance()
  
  return { modelPerformance }
}

export async function GET() {
  return NextResponse.json({
    message: 'Predictive Learning Analytics API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'AI-powered predictive analytics for at-risk learner identification',
        actions: [
          'assess_risk',
          'get_risk_profile',
          'get_risk_history',
          'get_warning_signals',
          'get_critical_learners',
          'get_interventions',
          'get_model_performance',
          'update_model'
        ]
      }
    },
    capabilities: [
      'Early Warning Signal Detection',
      'Risk Score Calculation',
      'Dropout Prediction',
      'Performance Decline Prediction',
      'Engagement Loss Prediction',
      'Intervention Recommendation',
      'Historical Pattern Analysis',
      'Model Performance Tracking',
      'Critical Learner Identification',
      'Multi-Factor Risk Assessment'
    ],
    riskLevels: [
      'low',
      'moderate', 
      'high',
      'critical'
    ],
    riskFactors: [
      'declining_performance',
      'irregular_attendance',
      'low_engagement',
      'emotional_distress',
      'content_difficulty_mismatch',
      'social_isolation',
      'time_management_issues',
      'motivation_loss',
      'technical_difficulties',
      'external_stressors',
      'learning_pace_issues',
      'feedback_response'
    ],
    warningSignals: [
      'performance_drop',
      'engagement_decline',
      'attendance_gap',
      'help_seeking_decrease',
      'negative_sentiment',
      'confusion_indicators',
      'stress_markers',
      'isolation_signs',
      'motivation_decline',
      'pace_mismatch',
      'technical_barriers',
      'emotional_volatility'
    ],
    interventionTypes: [
      'personalized_support',
      'content_adjustment',
      'pace_modification',
      'emotional_support',
      'peer_connection',
      'instructor_outreach',
      'technical_assistance',
      'motivation_boost',
      'learning_strategy_change',
      'goal_adjustment',
      'resource_provision',
      'schedule_flexibility'
    ],
    modelTypes: [
      'dropout_prediction',
      'performance_prediction',
      'engagement_prediction',
      'intervention_effectiveness',
      'risk_scoring',
      'early_warning'
    ],
    features: [
      'Real-time Risk Assessment',
      'Multi-Modal Data Analysis',
      'AI-Powered Pattern Recognition',
      'Personalized Intervention Plans',
      'Historical Trend Analysis',
      'Predictive Outcome Modeling',
      'Success Probability Estimation',
      'Automated Early Warning System',
      'Evidence-Based Recommendations',
      'Continuous Model Improvement'
    ]
  })
}