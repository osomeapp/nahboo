'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  getCurrentSession, 
  getCurrentUser, 
  getUserProfileWithAuth, 
  onAuthStateChange,
  signOut
} from '@/lib/auth'
import type { AuthUser, AuthSession } from '@/lib/auth'
import type { UserProfile } from '@/types'

interface AuthContextType {
  // Auth state
  user: AuthUser | null
  session: AuthSession | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Auth actions
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  
  // Profile state
  needsOnboarding: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        // Get current session
        const currentSession = await getCurrentSession()
        
        if (!mounted) return
        
        if (currentSession) {
          setSession(currentSession as AuthSession)
          setUser(currentSession.user as AuthUser)
          
          // Get user profile
          try {
            const userProfile = await getUserProfileWithAuth(currentSession.user.id)
            if (mounted && userProfile) {
              setProfile(userProfile)
            }
          } catch (profileError) {
            console.error('Failed to load user profile:', profileError)
            // Don't break auth flow if profile loading fails
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()
    
    return () => {
      mounted = false
    }
  }, [])

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (newSession) => {
      console.log('Auth state changed:', !!newSession)
      
      setSession(newSession)
      setUser(newSession?.user || null)
      
      if (newSession?.user) {
        // Load user profile when user signs in
        try {
          const userProfile = await getUserProfileWithAuth(newSession.user.id)
          setProfile(userProfile)
        } catch (error) {
          console.error('Failed to load profile after auth change:', error)
          setProfile(null)
        }
      } else {
        // Clear profile when user signs out
        setProfile(null)
      }
      
      // Auth loading is complete once we get the first state change
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      // State will be updated by the auth state change listener
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Refresh user profile
  const refreshProfile = async () => {
    if (!user) return
    
    try {
      const userProfile = await getUserProfileWithAuth(user.id)
      setProfile(userProfile)
    } catch (error) {
      console.error('Failed to refresh profile:', error)
      throw error
    }
  }

  // Computed values
  const isAuthenticated = !!user && !!session
  const needsOnboarding = isAuthenticated && (!profile || !profile.onboarding_completed)

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    signOut: handleSignOut,
    refreshProfile,
    needsOnboarding
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for components that require authentication
export function useRequireAuth() {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to sign in or show auth modal
      console.log('Authentication required')
    }
  }, [auth.isLoading, auth.isAuthenticated])
  
  return auth
}

// Hook for getting current user profile
export function useUserProfile() {
  const { profile } = useAuth()
  return profile
}

// Hook for auth state with loading
export function useAuthState() {
  const { user, session, isLoading, isAuthenticated } = useAuth()
  
  return {
    user,
    session, 
    isLoading,
    isAuthenticated,
    isSignedIn: isAuthenticated,
    isSignedOut: !isLoading && !isAuthenticated
  }
}

// Component wrapper that requires authentication
export function RequireAuth({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to continue.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Loading component for auth states
export function AuthLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  )
}