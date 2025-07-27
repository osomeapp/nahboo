'use client'

import { useState, useCallback, useEffect } from 'react'
import type { 
  EmployeeProfile, 
  CompanyProfile, 
  TrainingProgram, 
  EmployeeProgress, 
  CompanyAnalytics, 
  LearningRecommendation 
} from '@/lib/corporate-training-engine'

interface CorporateTrainingState {
  employees: EmployeeProfile[]
  programs: TrainingProgram[]
  analytics: CompanyAnalytics | null
  recommendations: LearningRecommendation[]
  companyOverview: any | null
  isLoading: boolean
  error: string | null
}

export function useCorporateTraining(companyId?: string) {
  const [state, setState] = useState<CorporateTrainingState>({
    employees: [],
    programs: [],
    analytics: null,
    recommendations: [],
    companyOverview: null,
    isLoading: false,
    error: null
  })

  // Helper function for API calls
  const apiCall = useCallback(async (body: any) => {
    const response = await fetch('/api/corporate-training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }
    
    return response.json()
  }, [])

  // Employee Management
  const createEmployee = useCallback(async (employeeProfile: EmployeeProfile) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_employee',
        employeeProfile
      })
      
      setState(prev => ({
        ...prev,
        employees: [...prev.employees, result.employee],
        isLoading: false
      }))
      
      return result.employee
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create employee'
      }))
      return null
    }
  }, [apiCall])

  const updateEmployee = useCallback(async (employeeId: string, updates: Partial<EmployeeProfile>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'update_employee',
        employeeId,
        employeeUpdates: updates
      })
      
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => 
          emp.employeeId === employeeId ? result.employee : emp
        ),
        isLoading: false
      }))
      
      return result.employee
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update employee'
      }))
      return null
    }
  }, [apiCall])

  const getEmployee = useCallback(async (employeeId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_employee',
        employeeId
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result.employee
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get employee'
      }))
      return null
    }
  }, [apiCall])

  const getEmployeesByDepartment = useCallback(async (department: string) => {
    if (!companyId) return []
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_employees_by_department',
        companyId,
        department
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result.employees || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get employees'
      }))
      return []
    }
  }, [apiCall, companyId])

  // Training Program Management
  const createProgram = useCallback(async (trainingProgram: TrainingProgram) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_program',
        trainingProgram
      })
      
      setState(prev => ({
        ...prev,
        programs: [...prev.programs, result.program],
        isLoading: false
      }))
      
      return result.program
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create program'
      }))
      return null
    }
  }, [apiCall])

  const updateProgram = useCallback(async (programId: string, updates: Partial<TrainingProgram>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'update_program',
        programId,
        programUpdates: updates
      })
      
      setState(prev => ({
        ...prev,
        programs: prev.programs.map(prog => 
          prog.programId === programId ? result.program : prog
        ),
        isLoading: false
      }))
      
      return result.program
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update program'
      }))
      return null
    }
  }, [apiCall])

  const getPrograms = useCallback(async (filters?: {
    type?: TrainingProgram['type']
    targetRole?: string
    difficultyLevel?: TrainingProgram['difficultyLevel']
    status?: TrainingProgram['status']
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_programs',
        programFilters: filters
      })
      
      setState(prev => ({
        ...prev,
        programs: result.programs || [],
        isLoading: false
      }))
      
      return result.programs || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get programs'
      }))
      return []
    }
  }, [apiCall])

  // Progress Tracking
  const enrollEmployee = useCallback(async (employeeId: string, programId: string, deadline?: Date) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'enroll_employee',
        enrollmentData: {
          employeeId,
          programId,
          deadline: deadline?.toISOString()
        }
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result.progress
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to enroll employee'
      }))
      return null
    }
  }, [apiCall])

  const updateProgress = useCallback(async (
    employeeId: string, 
    programId: string, 
    updates: Partial<EmployeeProgress>
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'update_progress',
        employeeId,
        programId,
        progressUpdates: updates
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result.progress
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update progress'
      }))
      return null
    }
  }, [apiCall])

  const getProgress = useCallback(async (employeeId: string, programId?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_progress',
        employeeId,
        programId
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result.progress
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get progress'
      }))
      return null
    }
  }, [apiCall])

  // Analytics and Recommendations
  const generateAnalytics = useCallback(async (period: { startDate: Date; endDate: Date }) => {
    if (!companyId) return null
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'generate_analytics',
        companyId,
        analyticsPeriod: {
          startDate: period.startDate.toISOString(),
          endDate: period.endDate.toISOString()
        }
      })
      
      setState(prev => ({
        ...prev,
        analytics: result.analytics,
        isLoading: false
      }))
      
      return result.analytics
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate analytics'
      }))
      return null
    }
  }, [apiCall, companyId])

  const getRecommendations = useCallback(async (employeeId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_recommendations',
        employeeId
      })
      
      setState(prev => ({
        ...prev,
        recommendations: result.recommendations || [],
        isLoading: false
      }))
      
      return result.recommendations || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get recommendations'
      }))
      return []
    }
  }, [apiCall])

  const getCompanyOverview = useCallback(async () => {
    if (!companyId) return null
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_company_overview',
        companyId
      })
      
      setState(prev => ({
        ...prev,
        companyOverview: result.overview,
        isLoading: false
      }))
      
      return result.overview
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get company overview'
      }))
      return null
    }
  }, [apiCall, companyId])

  // Load initial data when companyId is provided
  useEffect(() => {
    if (companyId) {
      getCompanyOverview()
      getPrograms()
    }
  }, [companyId, getCompanyOverview, getPrograms])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    employees: state.employees,
    programs: state.programs,
    analytics: state.analytics,
    recommendations: state.recommendations,
    companyOverview: state.companyOverview,
    isLoading: state.isLoading,
    error: state.error,
    
    // Employee Management
    createEmployee,
    updateEmployee,
    getEmployee,
    getEmployeesByDepartment,
    
    // Program Management
    createProgram,
    updateProgram,
    getPrograms,
    
    // Progress Tracking
    enrollEmployee,
    updateProgress,
    getProgress,
    
    // Analytics & Recommendations
    generateAnalytics,
    getRecommendations,
    getCompanyOverview,
    
    // Utilities
    clearError
  }
}

// Hook for employee-specific functionality
export function useEmployeeTraining(employeeId: string) {
  const [progress, setProgress] = useState<EmployeeProgress[]>([])
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getProgress, getRecommendations, updateProgress, enrollEmployee } = useCorporateTraining()

  // Load employee data
  const loadEmployeeData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [progressData, recommendationsData] = await Promise.all([
        getProgress(employeeId),
        getRecommendations(employeeId)
      ])
      
      if (progressData) setProgress(Array.isArray(progressData) ? progressData : [progressData])
      if (recommendationsData) setRecommendations(recommendationsData)
      
      setIsLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load employee data')
      setIsLoading(false)
    }
  }, [employeeId, getProgress, getRecommendations])

  // Update employee progress
  const updateEmployeeProgress = useCallback(async (
    programId: string, 
    updates: Partial<EmployeeProgress>
  ) => {
    const result = await updateProgress(employeeId, programId, updates)
    if (result) {
      setProgress(prev => prev.map(p => 
        p.programId === programId ? result : p
      ))
    }
    return result
  }, [employeeId, updateProgress])

  // Enroll in program
  const enrollInProgram = useCallback(async (programId: string, deadline?: Date) => {
    const result = await enrollEmployee(employeeId, programId, deadline)
    if (result) {
      setProgress(prev => [...prev, result])
    }
    return result
  }, [employeeId, enrollEmployee])

  // Load data on mount
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData()
    }
  }, [employeeId, loadEmployeeData])

  return {
    progress,
    recommendations,
    isLoading,
    error,
    updateProgress: updateEmployeeProgress,
    enrollInProgram,
    refreshData: loadEmployeeData,
    clearError: () => setError(null)
  }
}

// Hook for manager dashboard functionality
export function useManagerDashboard(managerId: string, companyId: string) {
  const [teamData, setTeamData] = useState<{
    directReports: EmployeeProfile[]
    teamProgress: EmployeeProgress[]
    teamAnalytics: any
  }>({
    directReports: [],
    teamProgress: [],
    teamAnalytics: null
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getEmployee, getProgress, generateAnalytics } = useCorporateTraining(companyId)

  const loadTeamData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get manager's profile to find direct reports
      const manager = await getEmployee(managerId)
      if (!manager?.directReports) {
        setIsLoading(false)
        return
      }
      
      // Get direct reports data
      const directReports = await Promise.all(
        manager.directReports.map(id => getEmployee(id))
      ).then(results => results.filter(Boolean) as EmployeeProfile[])
      
      // Get team progress
      const teamProgress = await Promise.all(
        directReports.map(emp => getProgress(emp.employeeId))
      ).then(results => results.flat().filter(Boolean) as EmployeeProgress[])
      
      // Generate team analytics for last 30 days
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      const teamAnalytics = await generateAnalytics({ startDate, endDate })
      
      setTeamData({
        directReports,
        teamProgress,
        teamAnalytics
      })
      
      setIsLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load team data')
      setIsLoading(false)
    }
  }, [managerId, getEmployee, getProgress, generateAnalytics])

  useEffect(() => {
    if (managerId && companyId) {
      loadTeamData()
    }
  }, [managerId, companyId, loadTeamData])

  return {
    ...teamData,
    isLoading,
    error,
    refreshData: loadTeamData,
    clearError: () => setError(null)
  }
}