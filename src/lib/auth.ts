// Authentication Service with Supabase Auth
// Handles user registration, login, profile creation, and session management

import { supabase, supabaseAdmin, safeQuery, createUserProfile } from './supabase'
import type { UserProfile } from '@/types'

export interface AuthUser {
  id: string
  email: string
  email_confirmed_at?: string
  created_at: string
  updated_at: string
  user_metadata: Record<string, any>
  app_metadata: Record<string, any>
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: AuthUser
}

export interface SignUpData {
  email: string
  password: string
  profile: {
    name: string
    subjects: string[]
    level: string
    ageGroup: string
    useCase: string
    language: string
  }
}

export interface SignInData {
  email: string
  password: string
}

// ==================================================================
// AUTHENTICATION OPERATIONS
// ==================================================================

// Sign up new user with profile data
export async function signUp(data: SignUpData) {
  try {
    const { email, password, profile } = data

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: profile.name,
          onboarding_completed: false
        }
      }
    })

    if (authError) {
      throw new Error(`Sign up failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Create user profile in database
    try {
      await createUserProfile(authData.user.id, email, profile)
    } catch (profileError) {
      // If profile creation fails, we still have the auth user
      console.error('Profile creation failed:', profileError)
      // Don't throw here - user can complete profile later
    }

    return {
      user: authData.user,
      session: authData.session,
      needsEmailConfirmation: !authData.session
    }
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

// Sign in existing user
export async function signIn(data: SignInData) {
  try {
    const { email, password } = data

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      throw new Error(`Sign in failed: ${authError.message}`)
    }

    if (!authData.user || !authData.session) {
      throw new Error('Sign in failed - invalid credentials')
    }

    return {
      user: authData.user,
      session: authData.session
    }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

// Sign out current user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`)
    }

    // Clear any cached data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('learning-platform-user')
      sessionStorage.clear()
    }
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Get user error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// ==================================================================
// PROFILE OPERATIONS
// ==================================================================

// Get user profile with auth check
export async function getUserProfileWithAuth(userId?: string) {
  try {
    // If no userId provided, get current user
    if (!userId) {
      const user = await getCurrentUser()
      if (!user) return null
      userId = user.id
    }

    return safeQuery(async () => {
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

// Update user profile
export async function updateUserProfileWithAuth(
  userId: string,
  updates: Partial<UserProfile>
) {
  try {
    // Verify user can update this profile
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.id !== userId) {
      throw new Error('Unauthorized: Cannot update another user\'s profile')
    }

    return safeQuery(async () => {
      return supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
    })
  } catch (error) {
    console.error('Update profile error:', error)
    throw error
  }
}

// Complete onboarding for authenticated user
export async function completeOnboarding(
  userId: string,
  onboardingData: {
    subjects: string[]
    level: string
    ageGroup: string
    useCase: string
  }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.id !== userId) {
      throw new Error('Unauthorized: Cannot complete onboarding for another user')
    }

    // Update profile with onboarding data
    const updatedProfile = await updateUserProfileWithAuth(userId, {
      subjects: onboardingData.subjects,
      level: onboardingData.level as 'beginner' | 'intermediate' | 'advanced',
      age_group: onboardingData.ageGroup as 'child' | 'teen' | 'adult',
      use_case: onboardingData.useCase as 'tutor' | 'student' | 'college' | 'work' | 'personal' | 'lifelong',
      onboarding_completed: true
    })

    // Update auth user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        subjects: onboardingData.subjects,
        level: onboardingData.level
      }
    })

    if (metadataError) {
      console.error('Failed to update user metadata:', metadataError)
      // Don't throw - profile update succeeded
    }

    return updatedProfile
  } catch (error) {
    console.error('Complete onboarding error:', error)
    throw error
  }
}

// ==================================================================
// PASSWORD & SECURITY OPERATIONS
// ==================================================================

// Send password reset email
export async function sendPasswordReset(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Send password reset error:', error)
    throw error
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(`Password update failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Update password error:', error)
    throw error
  }
}

// Update email
export async function updateEmail(newEmail: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (error) {
      throw new Error(`Email update failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Update email error:', error)
    throw error
  }
}

// ==================================================================
// SESSION MANAGEMENT
// ==================================================================

// Refresh session
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      throw new Error(`Session refresh failed: ${error.message}`)
    }
    
    return data.session
  } catch (error) {
    console.error('Refresh session error:', error)
    throw error
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getCurrentSession()
    return !!session
  } catch {
    return false
  }
}

// ==================================================================
// SOCIAL AUTH (Future expansion)
// ==================================================================

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw new Error(`Google sign in failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Google sign in error:', error)
    throw error
  }
}

// Sign in with GitHub
export async function signInWithGitHub() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw new Error(`GitHub sign in failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('GitHub sign in error:', error)
    throw error
  }
}

// ==================================================================
// AUTH STATE HELPERS
// ==================================================================

// Set up auth state change listener
export function onAuthStateChange(callback: (session: AuthSession | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email)
    callback(session as AuthSession | null)
  })
}

// Get auth error message in user-friendly format
export function getAuthErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  
  const message = error?.message || 'An unknown error occurred'
  
  // Convert common Supabase auth errors to user-friendly messages
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.'
  }
  
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }
  
  if (message.includes('Unable to validate email address')) {
    return 'Please enter a valid email address.'
  }
  
  return message
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}