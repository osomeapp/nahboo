'use client'

export interface EmployeeProfile {
  employeeId: string
  name: string
  email: string
  department: string
  role: string
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'manager' | 'director'
  startDate: Date
  manager?: string
  directReports?: string[]
  skills: string[]
  certifications: string[]
  learningGoals: string[]
  companyId: string
  timezone: string
  preferredLanguage: string
}

export interface CompanyProfile {
  companyId: string
  name: string
  industry: string
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  learningBudget: number
  complianceRequirements: string[]
  learningPriorities: string[]
  customBranding?: {
    logo: string
    primaryColor: string
    secondaryColor: string
    fontFamily?: string
  }
}

export interface TrainingProgram {
  programId: string
  title: string
  description: string
  type: 'onboarding' | 'compliance' | 'skill_development' | 'leadership' | 'technical' | 'soft_skills'
  targetRoles: string[]
  requiredFor?: string[] // departments or roles that must complete
  estimatedDuration: number // in minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  learningObjectives: string[]
  assessmentRequired: boolean
  certificationAwarded?: string
  deadlines?: {
    enrollmentDeadline?: Date
    completionDeadline?: Date
  }
  prerequisitePrograms?: string[]
  status: 'draft' | 'active' | 'archived'
  createdBy: string
  createdAt: Date
  lastUpdated: Date
}

export interface EmployeeProgress {
  employeeId: string
  programId: string
  enrollmentDate: Date
  startDate?: Date
  completionDate?: Date
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'failed'
  progressPercentage: number
  timeSpent: number // in minutes
  lastAccessed?: Date
  assessmentScores: {
    assessmentId: string
    score: number
    maxScore: number
    attempts: number
    completedAt: Date
  }[]
  certificationsEarned: string[]
  nextDeadline?: Date
  completionPath: {
    moduleId: string
    completedAt: Date
    score?: number
  }[]
}

export interface CompanyAnalytics {
  companyId: string
  period: {
    startDate: Date
    endDate: Date
  }
  overallMetrics: {
    totalEmployees: number
    activeUsers: number
    completionRate: number
    averageTimeSpent: number
    certificationsEarned: number
    complianceRate: number
  }
  departmentBreakdown: {
    department: string
    employeeCount: number
    completionRate: number
    averageScore: number
    timeSpent: number
    topPrograms: string[]
  }[]
  skillGaps: {
    skill: string
    gapScore: number
    affectedEmployees: number
    recommendedPrograms: string[]
  }[]
  engagementMetrics: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    averageSessionDuration: number
    returnRate: number
    completionVelocity: number
  }
  complianceTracking: {
    requirementName: string
    dueDate: Date
    completionRate: number
    atRiskEmployees: number
    overdue: number
  }[]
}

export interface LearningRecommendation {
  recommendationId: string
  employeeId: string
  type: 'skill_gap' | 'career_advancement' | 'compliance' | 'team_development'
  priority: 'high' | 'medium' | 'low'
  recommendedPrograms: string[]
  reasoning: string
  confidence: number
  estimatedImpact: number
  timeInvestment: number
  deadline?: Date
  managerApprovalRequired: boolean
}

class CorporateTrainingEngine {
  private employeeProfiles: Map<string, EmployeeProfile> = new Map()
  private companyProfiles: Map<string, CompanyProfile> = new Map()
  private trainingPrograms: Map<string, TrainingProgram> = new Map()
  private employeeProgress: Map<string, EmployeeProgress[]> = new Map()
  private analytics: Map<string, CompanyAnalytics> = new Map()

  // Employee Management
  async createEmployeeProfile(profile: EmployeeProfile): Promise<EmployeeProfile> {
    this.employeeProfiles.set(profile.employeeId, profile)
    
    // Initialize progress tracking
    if (!this.employeeProgress.has(profile.employeeId)) {
      this.employeeProgress.set(profile.employeeId, [])
    }
    
    // Auto-enroll in mandatory programs based on role/department
    await this.autoEnrollMandatoryPrograms(profile)
    
    return profile
  }

  async updateEmployeeProfile(employeeId: string, updates: Partial<EmployeeProfile>): Promise<EmployeeProfile | null> {
    const profile = this.employeeProfiles.get(employeeId)
    if (!profile) return null
    
    const updatedProfile = { ...profile, ...updates }
    this.employeeProfiles.set(employeeId, updatedProfile)
    
    // Re-check mandatory programs if role/department changed
    if (updates.role || updates.department) {
      await this.autoEnrollMandatoryPrograms(updatedProfile)
    }
    
    return updatedProfile
  }

  getEmployeeProfile(employeeId: string): EmployeeProfile | null {
    return this.employeeProfiles.get(employeeId) || null
  }

  getEmployeesByDepartment(companyId: string, department: string): EmployeeProfile[] {
    return Array.from(this.employeeProfiles.values())
      .filter(emp => emp.companyId === companyId && emp.department === department)
  }

  getEmployeesByManager(managerId: string): EmployeeProfile[] {
    return Array.from(this.employeeProfiles.values())
      .filter(emp => emp.manager === managerId)
  }

  // Training Program Management
  async createTrainingProgram(program: TrainingProgram): Promise<TrainingProgram> {
    this.trainingPrograms.set(program.programId, program)
    
    // Auto-enroll eligible employees if required
    if (program.requiredFor && program.requiredFor.length > 0) {
      await this.enrollEligibleEmployees(program)
    }
    
    return program
  }

  async updateTrainingProgram(programId: string, updates: Partial<TrainingProgram>): Promise<TrainingProgram | null> {
    const program = this.trainingPrograms.get(programId)
    if (!program) return null
    
    const updatedProgram = { ...program, ...updates, lastUpdated: new Date() }
    this.trainingPrograms.set(programId, updatedProgram)
    
    return updatedProgram
  }

  getTrainingProgram(programId: string): TrainingProgram | null {
    return this.trainingPrograms.get(programId) || null
  }

  getTrainingPrograms(filters?: {
    type?: TrainingProgram['type']
    targetRole?: string
    difficultyLevel?: TrainingProgram['difficultyLevel']
    status?: TrainingProgram['status']
  }): TrainingProgram[] {
    let programs = Array.from(this.trainingPrograms.values())
    
    if (filters?.type) {
      programs = programs.filter(p => p.type === filters.type)
    }
    if (filters?.targetRole) {
      programs = programs.filter(p => p.targetRoles.includes(filters.targetRole))
    }
    if (filters?.difficultyLevel) {
      programs = programs.filter(p => p.difficultyLevel === filters.difficultyLevel)
    }
    if (filters?.status) {
      programs = programs.filter(p => p.status === filters.status)
    }
    
    return programs
  }

  // Enrollment and Progress Tracking
  async enrollEmployee(employeeId: string, programId: string, deadline?: Date): Promise<EmployeeProgress> {
    const employee = this.employeeProfiles.get(employeeId)
    const program = this.trainingPrograms.get(programId)
    
    if (!employee || !program) {
      throw new Error('Employee or program not found')
    }
    
    const progress: EmployeeProgress = {
      employeeId,
      programId,
      enrollmentDate: new Date(),
      status: 'not_started',
      progressPercentage: 0,
      timeSpent: 0,
      assessmentScores: [],
      certificationsEarned: [],
      nextDeadline: deadline || program.deadlines?.completionDeadline,
      completionPath: []
    }
    
    const employeeProgressList = this.employeeProgress.get(employeeId) || []
    employeeProgressList.push(progress)
    this.employeeProgress.set(employeeId, employeeProgressList)
    
    return progress
  }

  async updateProgress(
    employeeId: string, 
    programId: string, 
    updates: Partial<EmployeeProgress>
  ): Promise<EmployeeProgress | null> {
    const progressList = this.employeeProgress.get(employeeId) || []
    const progressIndex = progressList.findIndex(p => p.programId === programId)
    
    if (progressIndex === -1) return null
    
    const updatedProgress = { ...progressList[progressIndex], ...updates }
    
    // Auto-update status based on progress
    if (updatedProgress.progressPercentage === 100 && !updatedProgress.completionDate) {
      updatedProgress.completionDate = new Date()
      updatedProgress.status = 'completed'
    } else if (updatedProgress.progressPercentage > 0 && !updatedProgress.startDate) {
      updatedProgress.startDate = new Date()
      updatedProgress.status = 'in_progress'
    }
    
    // Check for overdue status
    if (updatedProgress.nextDeadline && new Date() > updatedProgress.nextDeadline && updatedProgress.status !== 'completed') {
      updatedProgress.status = 'overdue'
    }
    
    progressList[progressIndex] = updatedProgress
    this.employeeProgress.set(employeeId, progressList)
    
    return updatedProgress
  }

  getEmployeeProgress(employeeId: string, programId?: string): EmployeeProgress[] {
    const progressList = this.employeeProgress.get(employeeId) || []
    
    if (programId) {
      return progressList.filter(p => p.programId === programId)
    }
    
    return progressList
  }

  // Analytics and Reporting
  async generateCompanyAnalytics(companyId: string, period: { startDate: Date; endDate: Date }): Promise<CompanyAnalytics> {
    const employees = Array.from(this.employeeProfiles.values())
      .filter(emp => emp.companyId === companyId)
    
    const allProgress = employees.flatMap(emp => 
      this.employeeProgress.get(emp.employeeId) || []
    )
    
    const periodProgress = allProgress.filter(p => 
      p.enrollmentDate >= period.startDate && p.enrollmentDate <= period.endDate
    )
    
    // Calculate overall metrics
    const overallMetrics = {
      totalEmployees: employees.length,
      activeUsers: new Set(periodProgress.filter(p => p.lastAccessed && p.lastAccessed >= period.startDate).map(p => p.employeeId)).size,
      completionRate: periodProgress.filter(p => p.status === 'completed').length / Math.max(periodProgress.length, 1),
      averageTimeSpent: periodProgress.reduce((sum, p) => sum + p.timeSpent, 0) / Math.max(periodProgress.length, 1),
      certificationsEarned: periodProgress.reduce((sum, p) => sum + p.certificationsEarned.length, 0),
      complianceRate: this.calculateComplianceRate(companyId, employees)
    }
    
    // Department breakdown
    const departments = [...new Set(employees.map(emp => emp.department))]
    const departmentBreakdown = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept)
      const deptProgress = deptEmployees.flatMap(emp => this.employeeProgress.get(emp.employeeId) || [])
      
      return {
        department: dept,
        employeeCount: deptEmployees.length,
        completionRate: deptProgress.filter(p => p.status === 'completed').length / Math.max(deptProgress.length, 1),
        averageScore: this.calculateAverageScore(deptProgress),
        timeSpent: deptProgress.reduce((sum, p) => sum + p.timeSpent, 0),
        topPrograms: this.getTopPrograms(deptProgress, 5)
      }
    })
    
    // Skill gap analysis
    const skillGaps = await this.analyzeSkillGaps(companyId)
    
    // Engagement metrics
    const engagementMetrics = this.calculateEngagementMetrics(periodProgress, period)
    
    // Compliance tracking
    const complianceTracking = await this.getComplianceTracking(companyId)
    
    const analytics: CompanyAnalytics = {
      companyId,
      period,
      overallMetrics,
      departmentBreakdown,
      skillGaps,
      engagementMetrics,
      complianceTracking
    }
    
    this.analytics.set(companyId, analytics)
    return analytics
  }

  // Recommendation System
  async generateLearningRecommendations(employeeId: string): Promise<LearningRecommendation[]> {
    const employee = this.employeeProfiles.get(employeeId)
    if (!employee) return []
    
    const progress = this.employeeProgress.get(employeeId) || []
    const recommendations: LearningRecommendation[] = []
    
    // Skill gap recommendations
    const skillGapRecs = await this.generateSkillGapRecommendations(employee, progress)
    recommendations.push(...skillGapRecs)
    
    // Career advancement recommendations
    const careerRecs = await this.generateCareerRecommendations(employee, progress)
    recommendations.push(...careerRecs)
    
    // Compliance recommendations
    const complianceRecs = await this.generateComplianceRecommendations(employee, progress)
    recommendations.push(...complianceRecs)
    
    // Team development recommendations
    const teamRecs = await this.generateTeamRecommendations(employee, progress)
    recommendations.push(...teamRecs)
    
    return recommendations.sort((a, b) => b.priority.localeCompare(a.priority) || b.confidence - a.confidence)
  }

  // Private helper methods
  private async autoEnrollMandatoryPrograms(employee: EmployeeProfile): Promise<void> {
    const mandatoryPrograms = Array.from(this.trainingPrograms.values())
      .filter(program => 
        program.status === 'active' && 
        program.requiredFor && 
        (program.requiredFor.includes(employee.role) || program.requiredFor.includes(employee.department))
      )
    
    for (const program of mandatoryPrograms) {
      const existingProgress = this.getEmployeeProgress(employee.employeeId, program.programId)
      if (existingProgress.length === 0) {
        await this.enrollEmployee(employee.employeeId, program.programId, program.deadlines?.completionDeadline)
      }
    }
  }

  private async enrollEligibleEmployees(program: TrainingProgram): Promise<void> {
    if (!program.requiredFor) return
    
    const eligibleEmployees = Array.from(this.employeeProfiles.values())
      .filter(emp => 
        program.requiredFor!.includes(emp.role) || 
        program.requiredFor!.includes(emp.department)
      )
    
    for (const employee of eligibleEmployees) {
      const existingProgress = this.getEmployeeProgress(employee.employeeId, program.programId)
      if (existingProgress.length === 0) {
        await this.enrollEmployee(employee.employeeId, program.programId, program.deadlines?.completionDeadline)
      }
    }
  }

  private calculateComplianceRate(companyId: string, employees: EmployeeProfile[]): number {
    const compliancePrograms = Array.from(this.trainingPrograms.values())
      .filter(p => p.type === 'compliance' && p.status === 'active')
    
    if (compliancePrograms.length === 0) return 1
    
    let totalRequired = 0
    let totalCompleted = 0
    
    for (const program of compliancePrograms) {
      const requiredEmployees = employees.filter(emp => 
        program.requiredFor && 
        (program.requiredFor.includes(emp.role) || program.requiredFor.includes(emp.department))
      )
      
      totalRequired += requiredEmployees.length
      
      for (const employee of requiredEmployees) {
        const progress = this.getEmployeeProgress(employee.employeeId, program.programId)
        if (progress.length > 0 && progress[0].status === 'completed') {
          totalCompleted++
        }
      }
    }
    
    return totalRequired > 0 ? totalCompleted / totalRequired : 1
  }

  private calculateAverageScore(progressList: EmployeeProgress[]): number {
    const scores = progressList.flatMap(p => 
      p.assessmentScores.map(a => a.score / a.maxScore)
    )
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
  }

  private getTopPrograms(progressList: EmployeeProgress[], limit: number): string[] {
    const programCounts = new Map<string, number>()
    
    progressList.forEach(p => {
      programCounts.set(p.programId, (programCounts.get(p.programId) || 0) + 1)
    })
    
    return Array.from(programCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([programId]) => programId)
  }

  private async analyzeSkillGaps(companyId: string): Promise<CompanyAnalytics['skillGaps']> {
    // Simplified skill gap analysis
    const employees = Array.from(this.employeeProfiles.values())
      .filter(emp => emp.companyId === companyId)
    
    const allSkills = new Set<string>()
    employees.forEach(emp => emp.skills.forEach(skill => allSkills.add(skill)))
    
    return Array.from(allSkills).map(skill => {
      const employeesWithSkill = employees.filter(emp => emp.skills.includes(skill))
      const gapScore = 1 - (employeesWithSkill.length / employees.length)
      
      return {
        skill,
        gapScore,
        affectedEmployees: employees.length - employeesWithSkill.length,
        recommendedPrograms: this.getRecommendedProgramsForSkill(skill)
      }
    }).filter(gap => gap.gapScore > 0.3) // Only show significant gaps
  }

  private calculateEngagementMetrics(progressList: EmployeeProgress[], period: { startDate: Date; endDate: Date }): CompanyAnalytics['engagementMetrics'] {
    const activeUsers = new Set(progressList.filter(p => p.lastAccessed && p.lastAccessed >= period.startDate).map(p => p.employeeId))
    
    return {
      dailyActiveUsers: Math.floor(activeUsers.size * 0.3), // Simplified calculation
      weeklyActiveUsers: Math.floor(activeUsers.size * 0.7),
      averageSessionDuration: progressList.reduce((sum, p) => sum + p.timeSpent, 0) / Math.max(progressList.length, 1) / 60, // Convert to hours
      returnRate: 0.75, // Simplified calculation
      completionVelocity: progressList.filter(p => p.status === 'completed').length / Math.max(progressList.length, 1)
    }
  }

  private async getComplianceTracking(companyId: string): Promise<CompanyAnalytics['complianceTracking']> {
    const compliancePrograms = Array.from(this.trainingPrograms.values())
      .filter(p => p.type === 'compliance' && p.status === 'active')
    
    return compliancePrograms.map(program => {
      const employees = Array.from(this.employeeProfiles.values())
        .filter(emp => emp.companyId === companyId)
      
      const requiredEmployees = employees.filter(emp => 
        program.requiredFor && 
        (program.requiredFor.includes(emp.role) || program.requiredFor.includes(emp.department))
      )
      
      const completed = requiredEmployees.filter(emp => {
        const progress = this.getEmployeeProgress(emp.employeeId, program.programId)
        return progress.length > 0 && progress[0].status === 'completed'
      })
      
      const overdue = requiredEmployees.filter(emp => {
        const progress = this.getEmployeeProgress(emp.employeeId, program.programId)
        return progress.length > 0 && progress[0].status === 'overdue'
      })
      
      return {
        requirementName: program.title,
        dueDate: program.deadlines?.completionDeadline || new Date(),
        completionRate: completed.length / Math.max(requiredEmployees.length, 1),
        atRiskEmployees: requiredEmployees.length - completed.length - overdue.length,
        overdue: overdue.length
      }
    })
  }

  private getRecommendedProgramsForSkill(skill: string): string[] {
    return Array.from(this.trainingPrograms.values())
      .filter(program => 
        program.status === 'active' && 
        program.learningObjectives.some(obj => obj.toLowerCase().includes(skill.toLowerCase()))
      )
      .map(program => program.programId)
      .slice(0, 3)
  }

  private async generateSkillGapRecommendations(employee: EmployeeProfile, progress: EmployeeProgress[]): Promise<LearningRecommendation[]> {
    const company = this.companyProfiles.get(employee.companyId)
    if (!company) return []
    
    const skillGaps = await this.analyzeSkillGaps(employee.companyId)
    const relevantGaps = skillGaps.filter(gap => !employee.skills.includes(gap.skill))
    
    return relevantGaps.slice(0, 3).map(gap => ({
      recommendationId: `skill_${employee.employeeId}_${gap.skill}`,
      employeeId: employee.employeeId,
      type: 'skill_gap' as const,
      priority: gap.gapScore > 0.7 ? 'high' as const : 'medium' as const,
      recommendedPrograms: gap.recommendedPrograms,
      reasoning: `Developing ${gap.skill} skills would benefit both personal growth and organizational needs.`,
      confidence: gap.gapScore,
      estimatedImpact: gap.gapScore * 100,
      timeInvestment: 40, // hours
      managerApprovalRequired: false
    }))
  }

  private async generateCareerRecommendations(employee: EmployeeProfile, progress: EmployeeProgress[]): Promise<LearningRecommendation[]> {
    const leadershipPrograms = Array.from(this.trainingPrograms.values())
      .filter(p => p.type === 'leadership' && p.status === 'active')
    
    if (employee.level === 'senior' || employee.level === 'lead') {
      return [{
        recommendationId: `career_${employee.employeeId}_leadership`,
        employeeId: employee.employeeId,
        type: 'career_advancement' as const,
        priority: 'medium' as const,
        recommendedPrograms: leadershipPrograms.slice(0, 2).map(p => p.programId),
        reasoning: 'Based on your seniority level, leadership development would prepare you for management roles.',
        confidence: 0.8,
        estimatedImpact: 85,
        timeInvestment: 60,
        managerApprovalRequired: true
      }]
    }
    
    return []
  }

  private async generateComplianceRecommendations(employee: EmployeeProfile, progress: EmployeeProgress[]): Promise<LearningRecommendation[]> {
    const compliancePrograms = Array.from(this.trainingPrograms.values())
      .filter(p => 
        p.type === 'compliance' && 
        p.status === 'active' && 
        p.requiredFor && 
        (p.requiredFor.includes(employee.role) || p.requiredFor.includes(employee.department))
      )
    
    const incompleteCompliance = compliancePrograms.filter(program => {
      const prog = progress.find(p => p.programId === program.programId)
      return !prog || prog.status !== 'completed'
    })
    
    return incompleteCompliance.map(program => ({
      recommendationId: `compliance_${employee.employeeId}_${program.programId}`,
      employeeId: employee.employeeId,
      type: 'compliance' as const,
      priority: 'high' as const,
      recommendedPrograms: [program.programId],
      reasoning: `This compliance training is required for your role in ${employee.department}.`,
      confidence: 1.0,
      estimatedImpact: 100,
      timeInvestment: program.estimatedDuration / 60,
      deadline: program.deadlines?.completionDeadline,
      managerApprovalRequired: false
    }))
  }

  private async generateTeamRecommendations(employee: EmployeeProfile, progress: EmployeeProgress[]): Promise<LearningRecommendation[]> {
    if (!employee.directReports || employee.directReports.length === 0) return []
    
    const teamPrograms = Array.from(this.trainingPrograms.values())
      .filter(p => p.type === 'soft_skills' && p.status === 'active')
    
    return [{
      recommendationId: `team_${employee.employeeId}_collaboration`,
      employeeId: employee.employeeId,
      type: 'team_development' as const,
      priority: 'medium' as const,
      recommendedPrograms: teamPrograms.slice(0, 2).map(p => p.programId),
      reasoning: 'As a team leader, developing soft skills will improve team collaboration and productivity.',
      confidence: 0.75,
      estimatedImpact: 70,
      timeInvestment: 30,
      managerApprovalRequired: false
    }]
  }
}

export const corporateTrainingEngine = new CorporateTrainingEngine()