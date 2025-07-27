import { NextRequest, NextResponse } from 'next/server'
import { 
  corporateTrainingEngine,
  type EmployeeProfile,
  type CompanyProfile,
  type TrainingProgram,
  type EmployeeProgress,
  type LearningRecommendation
} from '@/lib/corporate-training-engine'

export const maxDuration = 30

interface CorporateTrainingRequest {
  action: 'create_employee' | 'update_employee' | 'get_employee' | 'get_employees_by_department' | 
          'create_program' | 'update_program' | 'get_program' | 'get_programs' |
          'enroll_employee' | 'update_progress' | 'get_progress' |
          'generate_analytics' | 'get_recommendations' | 'get_company_overview'
  
  // Employee actions
  employeeProfile?: EmployeeProfile
  employeeId?: string
  employeeUpdates?: Partial<EmployeeProfile>
  companyId?: string
  department?: string
  managerId?: string
  
  // Program actions
  trainingProgram?: TrainingProgram
  programId?: string
  programUpdates?: Partial<TrainingProgram>
  programFilters?: {
    type?: TrainingProgram['type']
    targetRole?: string
    difficultyLevel?: TrainingProgram['difficultyLevel']
    status?: TrainingProgram['status']
  }
  
  // Progress actions
  enrollmentData?: {
    employeeId: string
    programId: string
    deadline?: string
  }
  progressUpdates?: Partial<EmployeeProgress>
  
  // Analytics actions
  analyticsPeriod?: {
    startDate: string
    endDate: string
  }
}

interface CorporateTrainingResponse {
  success: boolean
  action: string
  
  // Response data
  employee?: EmployeeProfile
  employees?: EmployeeProfile[]
  program?: TrainingProgram
  programs?: TrainingProgram[]
  progress?: EmployeeProgress | EmployeeProgress[]
  analytics?: any
  recommendations?: LearningRecommendation[]
  overview?: any
  
  metadata: {
    processingTime: number
    timestamp: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: CorporateTrainingRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<CorporateTrainingResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'create_employee':
        response = await handleCreateEmployee(body)
        break
        
      case 'update_employee':
        response = await handleUpdateEmployee(body)
        break
        
      case 'get_employee':
        response = await handleGetEmployee(body)
        break
        
      case 'get_employees_by_department':
        response = await handleGetEmployeesByDepartment(body)
        break
        
      case 'create_program':
        response = await handleCreateProgram(body)
        break
        
      case 'update_program':
        response = await handleUpdateProgram(body)
        break
        
      case 'get_program':
        response = await handleGetProgram(body)
        break
        
      case 'get_programs':
        response = await handleGetPrograms(body)
        break
        
      case 'enroll_employee':
        response = await handleEnrollEmployee(body)
        break
        
      case 'update_progress':
        response = await handleUpdateProgress(body)
        break
        
      case 'get_progress':
        response = await handleGetProgress(body)
        break
        
      case 'generate_analytics':
        response = await handleGenerateAnalytics(body)
        break
        
      case 'get_recommendations':
        response = await handleGetRecommendations(body)
        break
        
      case 'get_company_overview':
        response = await handleGetCompanyOverview(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: CorporateTrainingResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Corporate Training API error:', error)
    return NextResponse.json(
      { error: 'Failed to process corporate training request' },
      { status: 500 }
    )
  }
}

// Employee Management Handlers
async function handleCreateEmployee(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.employeeProfile) {
    throw new Error('Missing employee profile')
  }

  const employee = await corporateTrainingEngine.createEmployeeProfile(body.employeeProfile)
  return { employee }
}

async function handleUpdateEmployee(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.employeeId || !body.employeeUpdates) {
    throw new Error('Missing employeeId or updates')
  }

  const employee = await corporateTrainingEngine.updateEmployeeProfile(body.employeeId, body.employeeUpdates)
  
  if (!employee) {
    throw new Error('Employee not found')
  }
  
  return { employee }
}

async function handleGetEmployee(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.employeeId) {
    throw new Error('Missing employeeId')
  }

  const employee = corporateTrainingEngine.getEmployeeProfile(body.employeeId)
  
  if (!employee) {
    throw new Error('Employee not found')
  }
  
  return { employee }
}

async function handleGetEmployeesByDepartment(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.companyId || !body.department) {
    throw new Error('Missing companyId or department')
  }

  const employees = corporateTrainingEngine.getEmployeesByDepartment(body.companyId, body.department)
  return { employees }
}

// Training Program Handlers
async function handleCreateProgram(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.trainingProgram) {
    throw new Error('Missing training program')
  }

  const program = await corporateTrainingEngine.createTrainingProgram(body.trainingProgram)
  return { program }
}

async function handleUpdateProgram(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.programId || !body.programUpdates) {
    throw new Error('Missing programId or updates')
  }

  const program = await corporateTrainingEngine.updateTrainingProgram(body.programId, body.programUpdates)
  
  if (!program) {
    throw new Error('Program not found')
  }
  
  return { program }
}

async function handleGetProgram(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.programId) {
    throw new Error('Missing programId')
  }

  const program = corporateTrainingEngine.getTrainingProgram(body.programId)
  
  if (!program) {
    throw new Error('Program not found')
  }
  
  return { program }
}

async function handleGetPrograms(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  const programs = corporateTrainingEngine.getTrainingPrograms(body.programFilters)
  return { programs }
}

// Progress Tracking Handlers
async function handleEnrollEmployee(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.enrollmentData) {
    throw new Error('Missing enrollment data')
  }

  const { employeeId, programId, deadline } = body.enrollmentData
  const deadlineDate = deadline ? new Date(deadline) : undefined
  
  const progress = await corporateTrainingEngine.enrollEmployee(employeeId, programId, deadlineDate)
  return { progress }
}

async function handleUpdateProgress(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.employeeId || !body.programId || !body.progressUpdates) {
    throw new Error('Missing employeeId, programId, or progress updates')
  }

  const progress = await corporateTrainingEngine.updateProgress(
    body.employeeId, 
    body.programId, 
    body.progressUpdates
  )
  
  if (!progress) {
    throw new Error('Progress record not found')
  }
  
  return { progress }
}

async function handleGetProgress(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.employeeId) {
    throw new Error('Missing employeeId')
  }

  const progress = corporateTrainingEngine.getEmployeeProgress(body.employeeId, body.programId)
  return { progress }
}

// Analytics Handlers
async function handleGenerateAnalytics(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.companyId || !body.analyticsPeriod) {
    throw new Error('Missing companyId or analytics period')
  }

  const period = {
    startDate: new Date(body.analyticsPeriod.startDate),
    endDate: new Date(body.analyticsPeriod.endDate)
  }
  
  const analytics = await corporateTrainingEngine.generateCompanyAnalytics(body.companyId, period)
  return { analytics }
}

async function handleGetRecommendations(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.employeeId) {
    throw new Error('Missing employeeId')
  }

  const recommendations = await corporateTrainingEngine.generateLearningRecommendations(body.employeeId)
  return { recommendations }
}

async function handleGetCompanyOverview(body: CorporateTrainingRequest): Promise<Partial<CorporateTrainingResponse>> {
  if (!body.companyId) {
    throw new Error('Missing companyId')
  }

  // Generate a comprehensive company overview
  const currentMonth = new Date()
  const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
  const period = { startDate: lastMonth, endDate: currentMonth }
  
  const analytics = await corporateTrainingEngine.generateCompanyAnalytics(body.companyId, period)
  
  const overview = {
    analytics,
    quickStats: {
      totalEmployees: analytics.overallMetrics.totalEmployees,
      activeUsers: analytics.overallMetrics.activeUsers,
      completionRate: Math.round(analytics.overallMetrics.completionRate * 100),
      complianceRate: Math.round(analytics.overallMetrics.complianceRate * 100),
      certificationsEarned: analytics.overallMetrics.certificationsEarned
    },
    topDepartments: analytics.departmentBreakdown
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5),
    urgentCompliance: analytics.complianceTracking
      .filter(c => c.completionRate < 0.8 || c.overdue > 0)
      .sort((a, b) => a.completionRate - b.completionRate),
    skillGaps: analytics.skillGaps
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, 10)
  }
  
  return { overview }
}

export async function GET() {
  return NextResponse.json({
    message: 'Corporate Training API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Corporate training management and analytics',
        actions: [
          'create_employee',
          'update_employee', 
          'get_employee',
          'get_employees_by_department',
          'create_program',
          'update_program',
          'get_program',
          'get_programs',
          'enroll_employee',
          'update_progress',
          'get_progress',
          'generate_analytics',
          'get_recommendations',
          'get_company_overview'
        ]
      }
    },
    capabilities: [
      'Employee Profile Management',
      'Training Program Administration',
      'Progress Tracking & Analytics',
      'Compliance Monitoring',
      'Skill Gap Analysis',
      'Learning Recommendations',
      'Department Analytics',
      'Engagement Metrics'
    ],
    programTypes: [
      'onboarding',
      'compliance',
      'skill_development',
      'leadership',
      'technical',
      'soft_skills'
    ],
    analyticsFeatures: [
      'Company-wide metrics',
      'Department breakdown',
      'Skill gap analysis',
      'Compliance tracking',
      'Engagement analytics',
      'Learning recommendations'
    ]
  })
}