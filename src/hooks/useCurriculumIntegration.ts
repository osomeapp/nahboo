'use client'

import { useState, useCallback, useEffect } from 'react'
import type { 
  AcademicInstitution,
  Instructor,
  Student,
  Course,
  Assignment,
  StudentSubmission,
  ClassroomAnalytics,
  InstitutionDashboard
} from '@/lib/curriculum-integration-engine'

interface CurriculumIntegrationState {
  institution: AcademicInstitution | null
  instructors: Instructor[]
  students: Student[]
  courses: Course[]
  assignments: Assignment[]
  submissions: StudentSubmission[]
  analytics: ClassroomAnalytics | null
  dashboard: InstitutionDashboard | null
  isLoading: boolean
  error: string | null
}

export function useCurriculumIntegration(institutionId?: string) {
  const [state, setState] = useState<CurriculumIntegrationState>({
    institution: null,
    instructors: [],
    students: [],
    courses: [],
    assignments: [],
    submissions: [],
    analytics: null,
    dashboard: null,
    isLoading: false,
    error: null
  })

  // Helper function for API calls
  const apiCall = useCallback(async (body: any) => {
    const response = await fetch('/api/curriculum-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }
    
    return response.json()
  }, [])

  // Institution Management
  const createInstitution = useCallback(async (institution: AcademicInstitution) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_institution',
        institution
      })
      
      setState(prev => ({
        ...prev,
        institution: result.institution,
        isLoading: false
      }))
      
      return result.institution
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create institution'
      }))
      return null
    }
  }, [apiCall])

  const updateInstitution = useCallback(async (institutionId: string, updates: Partial<AcademicInstitution>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'update_institution',
        institutionId,
        institutionUpdates: updates
      })
      
      setState(prev => ({
        ...prev,
        institution: result.institution,
        isLoading: false
      }))
      
      return result.institution
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update institution'
      }))
      return null
    }
  }, [apiCall])

  const getInstitution = useCallback(async (institutionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_institution',
        institutionId
      })
      
      setState(prev => ({
        ...prev,
        institution: result.institution,
        isLoading: false
      }))
      
      return result.institution
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get institution'
      }))
      return null
    }
  }, [apiCall])

  // Instructor Management
  const createInstructor = useCallback(async (instructor: Instructor) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_instructor',
        instructor
      })
      
      setState(prev => ({
        ...prev,
        instructors: [...prev.instructors, result.instructor],
        isLoading: false
      }))
      
      return result.instructor
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create instructor'
      }))
      return null
    }
  }, [apiCall])

  const getInstructorsByInstitution = useCallback(async (institutionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_instructors_by_institution',
        institutionId
      })
      
      setState(prev => ({
        ...prev,
        instructors: result.instructors || [],
        isLoading: false
      }))
      
      return result.instructors || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get instructors'
      }))
      return []
    }
  }, [apiCall])

  // Student Management
  const createStudent = useCallback(async (student: Student) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_student',
        student
      })
      
      setState(prev => ({
        ...prev,
        students: [...prev.students, result.student],
        isLoading: false
      }))
      
      return result.student
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create student'
      }))
      return null
    }
  }, [apiCall])

  const getStudentsByInstitution = useCallback(async (institutionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_students_by_institution',
        institutionId
      })
      
      setState(prev => ({
        ...prev,
        students: result.students || [],
        isLoading: false
      }))
      
      return result.students || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get students'
      }))
      return []
    }
  }, [apiCall])

  // Course Management
  const createCourse = useCallback(async (course: Course) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_course',
        course
      })
      
      setState(prev => ({
        ...prev,
        courses: [...prev.courses, result.course],
        isLoading: false
      }))
      
      return result.course
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create course'
      }))
      return null
    }
  }, [apiCall])

  const getCoursesByInstitution = useCallback(async (institutionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_courses_by_institution',
        institutionId
      })
      
      setState(prev => ({
        ...prev,
        courses: result.courses || [],
        isLoading: false
      }))
      
      return result.courses || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get courses'
      }))
      return []
    }
  }, [apiCall])

  // Assignment Management
  const createAssignment = useCallback(async (assignment: Assignment) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_assignment',
        assignment
      })
      
      setState(prev => ({
        ...prev,
        assignments: [...prev.assignments, result.assignment],
        isLoading: false
      }))
      
      return result.assignment
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create assignment'
      }))
      return null
    }
  }, [apiCall])

  const getAssignmentsByCourse = useCallback(async (courseId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_assignments_by_course',
        courseId
      })
      
      setState(prev => ({
        ...prev,
        assignments: result.assignments || [],
        isLoading: false
      }))
      
      return result.assignments || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get assignments'
      }))
      return []
    }
  }, [apiCall])

  // Submission and Grading
  const submitAssignment = useCallback(async (submission: StudentSubmission) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'submit_assignment',
        submission
      })
      
      setState(prev => ({
        ...prev,
        submissions: [...prev.submissions, result.submission],
        isLoading: false
      }))
      
      return result.submission
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to submit assignment'
      }))
      return null
    }
  }, [apiCall])

  const gradeSubmission = useCallback(async (
    submissionId: string, 
    gradeData: {
      score: number
      feedback?: string
      rubricScores?: { criteria: string; score: number; feedback?: string }[]
      gradedBy: string
    }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'grade_submission',
        submissionId,
        gradeData
      })
      
      setState(prev => ({
        ...prev,
        submissions: prev.submissions.map(s => 
          s.submissionId === submissionId ? result.submission : s
        ),
        isLoading: false
      }))
      
      return result.submission
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to grade submission'
      }))
      return null
    }
  }, [apiCall])

  // Analytics and Reporting
  const generateClassroomAnalytics = useCallback(async (
    courseId: string, 
    period: { startDate: Date; endDate: Date }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'generate_classroom_analytics',
        courseId,
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
  }, [apiCall])

  const generateInstitutionDashboard = useCallback(async (
    period: { startDate: Date; endDate: Date }
  ) => {
    if (!institutionId) return null
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'generate_institution_dashboard',
        institutionId,
        analyticsPeriod: {
          startDate: period.startDate.toISOString(),
          endDate: period.endDate.toISOString()
        }
      })
      
      setState(prev => ({
        ...prev,
        dashboard: result.dashboard,
        isLoading: false
      }))
      
      return result.dashboard
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate dashboard'
      }))
      return null
    }
  }, [apiCall, institutionId])

  const generateTranscript = useCallback(async (studentId: string) => {
    if (!institutionId) return null
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'generate_transcript',
        studentId,
        institutionId
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result.transcript
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate transcript'
      }))
      return null
    }
  }, [apiCall, institutionId])

  const syncGradesWithLMS = useCallback(async (
    courseId: string,
    lmsType: 'canvas' | 'blackboard' | 'moodle' | 'google_classroom'
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'sync_grades_with_lms',
        courseId,
        lmsType
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result.syncResult
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sync grades with LMS'
      }))
      return false
    }
  }, [apiCall])

  // Load initial data when institutionId is provided
  useEffect(() => {
    if (institutionId) {
      getInstitution(institutionId)
      getInstructorsByInstitution(institutionId)
      getStudentsByInstitution(institutionId)
      getCoursesByInstitution(institutionId)
      
      // Generate dashboard for current month
      const endDate = new Date()
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      generateInstitutionDashboard({ startDate, endDate })
    }
  }, [institutionId])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    institution: state.institution,
    instructors: state.instructors,
    students: state.students,
    courses: state.courses,
    assignments: state.assignments,
    submissions: state.submissions,
    analytics: state.analytics,
    dashboard: state.dashboard,
    isLoading: state.isLoading,
    error: state.error,
    
    // Institution Management
    createInstitution,
    updateInstitution,
    getInstitution,
    
    // Instructor Management
    createInstructor,
    getInstructorsByInstitution,
    
    // Student Management
    createStudent,
    getStudentsByInstitution,
    
    // Course Management
    createCourse,
    getCoursesByInstitution,
    
    // Assignment Management
    createAssignment,
    getAssignmentsByCourse,
    
    // Submission and Grading
    submitAssignment,
    gradeSubmission,
    
    // Analytics and Reporting
    generateClassroomAnalytics,
    generateInstitutionDashboard,
    generateTranscript,
    syncGradesWithLMS,
    
    // Utilities
    clearError
  }
}

// Hook for instructor-specific functionality
export function useInstructorDashboard(instructorId: string, institutionId: string) {
  const [instructorData, setInstructorData] = useState<{
    instructor: Instructor | null
    courses: Course[]
    assignments: Assignment[]
    submissions: StudentSubmission[]
    analytics: ClassroomAnalytics | null
  }>({
    instructor: null,
    courses: [],
    assignments: [],
    submissions: [],
    analytics: null
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { apiCall } = useCurriculumIntegration(institutionId) as any

  const loadInstructorData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get instructor details
      const instructorResult = await apiCall({
        action: 'get_instructor',
        instructorId
      })
      
      // Get instructor's courses
      const coursesResult = await apiCall({
        action: 'get_courses_by_instructor',
        instructorId
      })
      
      // Get assignments for instructor's courses
      const courses = coursesResult.courses || []
      const assignments: Assignment[] = []
      
      for (const course of courses) {
        const assignmentsResult = await apiCall({
          action: 'get_assignments_by_course',
          courseId: course.courseId
        })
        assignments.push(...(assignmentsResult.assignments || []))
      }
      
      setInstructorData({
        instructor: instructorResult.instructor,
        courses,
        assignments,
        submissions: [], // Would load submissions if needed
        analytics: null
      })
      
      setIsLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load instructor data')
      setIsLoading(false)
    }
  }, [instructorId, apiCall])

  useEffect(() => {
    if (instructorId && institutionId) {
      loadInstructorData()
    }
  }, [instructorId, institutionId, loadInstructorData])

  return {
    ...instructorData,
    isLoading,
    error,
    refreshData: loadInstructorData,
    clearError: () => setError(null)
  }
}

// Hook for student-specific functionality
export function useStudentPortal(studentId: string, institutionId: string) {
  const [studentData, setStudentData] = useState<{
    student: Student | null
    courses: Course[]
    assignments: Assignment[]
    submissions: StudentSubmission[]
    transcript: any
  }>({
    student: null,
    courses: [],
    assignments: [],
    submissions: [],
    transcript: null
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { apiCall } = useCurriculumIntegration(institutionId) as any

  const loadStudentData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get student details
      const studentResult = await apiCall({
        action: 'get_student',
        studentId
      })
      
      // Get student submissions
      const submissionsResult = await apiCall({
        action: 'get_submissions_by_student',
        studentId
      })
      
      // Generate transcript
      const transcriptResult = await apiCall({
        action: 'generate_transcript',
        studentId,
        institutionId
      })
      
      setStudentData({
        student: studentResult.student,
        courses: transcriptResult.transcript?.courses?.map((c: any) => c.course) || [],
        assignments: [], // Would load assignments if needed
        submissions: submissionsResult.submissions || [],
        transcript: transcriptResult.transcript
      })
      
      setIsLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load student data')
      setIsLoading(false)
    }
  }, [studentId, institutionId, apiCall])

  const submitAssignment = useCallback(async (submission: StudentSubmission) => {
    try {
      const result = await apiCall({
        action: 'submit_assignment',
        submission
      })
      
      setStudentData(prev => ({
        ...prev,
        submissions: [...prev.submissions, result.submission]
      }))
      
      return result.submission
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit assignment')
      return null
    }
  }, [apiCall])

  useEffect(() => {
    if (studentId && institutionId) {
      loadStudentData()
    }
  }, [studentId, institutionId, loadStudentData])

  return {
    ...studentData,
    isLoading,
    error,
    submitAssignment,
    refreshData: loadStudentData,
    clearError: () => setError(null)
  }
}