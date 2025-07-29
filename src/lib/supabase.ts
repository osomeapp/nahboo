// Supabase Client Configuration
// Enterprise-scale setup with connection pooling, caching, and error handling

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// ==================================================================
// CLIENT INSTANCES
// ==================================================================

// Public client for client-side operations (with RLS)
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'learning-platform',
      },
    },
    // Connection pooling for performance
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Service role client for server-side operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient<Database> = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    })
  : supabase // Fallback to regular client in development

// ==================================================================
// TYPE-SAFE DATABASE HELPERS
// ==================================================================

// Helper for type-safe queries with error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Wrapper for safe database operations
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await queryFn()
    
    if (error) {
      throw new DatabaseError(
        error.message || 'Database operation failed',
        error.code,
        error.details
      )
    }
    
    if (data === null) {
      throw new DatabaseError('No data returned from query')
    }
    
    return data
  } catch (err) {
    if (err instanceof DatabaseError) {
      throw err
    }
    throw new DatabaseError(
      err instanceof Error ? err.message : 'Unknown database error'
    )
  }
}

// ==================================================================
// AUTH HELPERS
// ==================================================================

// Get current user with error handling
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new DatabaseError('Failed to get current user', error.name, error.message)
    }
    
    return user
  } catch (err) {
    console.error('Auth error:', err)
    return null
  }
}

// Get user profile with extended data
export async function getUserProfile(userId?: string) {
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
}

// Sign out with cleanup
export async function signOut() {
  try {
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token')
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new DatabaseError('Failed to sign out', error.name, error.message)
    }
    
    // Redirect to home page
    window.location.href = '/'
  } catch (err) {
    console.error('Sign out error:', err)
    throw err
  }
}

// ==================================================================
// CONTENT OPERATIONS
// ==================================================================

// Get personalized content feed
export async function getPersonalizedFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  return safeQuery(async () => {
    return supabase.rpc('get_personalized_recommendations', {
      target_user_id: userId,
      content_limit: limit
    })
  })
}

// Search content with filters
export async function searchContent(
  query: string,
  filters: {
    subject?: string
    difficulty?: string
    contentType?: string
  } = {},
  limit: number = 20
) {
  return safeQuery(async () => {
    return supabase.rpc('search_content', {
      search_query: query,
      subject_filter: filters.subject || null,
      difficulty_filter: filters.difficulty || null,
      content_type_filter: filters.contentType || null,
      result_limit: limit
    })
  })
}

// Get trending content
export async function getTrendingContent(
  subject?: string,
  limit: number = 10
) {
  return safeQuery(async () => {
    return supabase.rpc('get_trending_content', {
      target_subject: subject || null,
      days_back: 7,
      result_limit: limit
    })
  })
}

// Get content by ID with view tracking
export async function getContentById(contentId: string, userId?: string) {
  const content = await safeQuery(async () => {
    return supabase
      .from('content')
      .select(`
        *,
        created_by_profile:profiles!content_created_by_fkey(name, avatar_url)
      `)
      .eq('id', contentId)
      .eq('status', 'published')
      .single()
  })

  // Track view if user is authenticated
  if (userId && content) {
    trackInteraction(userId, contentId, 'view')
  }

  return content
}

// ==================================================================
// INTERACTION TRACKING
// ==================================================================

// Track user interactions
export async function trackInteraction(
  userId: string,
  contentId: string,
  interactionType: 'view' | 'like' | 'share' | 'complete' | 'start' | 'pause' | 'resume',
  data: Record<string, any> = {}
) {
  try {
    const sessionId = generateSessionId()
    
    const { error } = await supabase
      .from('interactions')
      .insert({
        user_id: userId,
        content_id: contentId,
        interaction_type: interactionType,
        session_id: sessionId,
        interaction_data: data,
        time_spent: data.timeSpent || 0,
        progress_percentage: data.progressPercentage || 0
      })

    if (error) {
      console.error('Failed to track interaction:', error)
    }
  } catch (err) {
    console.error('Interaction tracking error:', err)
  }
}

// Generate session ID (stored in sessionStorage)
function generateSessionId(): string {
  let sessionId = sessionStorage.getItem('learning_session_id')
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('learning_session_id', sessionId)
  }
  
  return sessionId
}

// ==================================================================
// PROGRESS TRACKING
// ==================================================================

// Update user progress
export async function updateProgress(
  userId: string,
  contentId: string,
  progressData: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
    progressPercentage?: number
    timeSpent?: number
    quizScore?: number
  }
) {
  return safeQuery(async () => {
    return supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        content_id: contentId,
        status: progressData.status,
        progress_percentage: progressData.progressPercentage,
        time_spent: progressData.timeSpent,
        ...(progressData.quizScore && {
          quiz_scores: { latest: progressData.quizScore },
          best_score: progressData.quizScore
        }),
        last_accessed: new Date().toISOString()
      })
      .select()
      .single()
  })
}

// Get user analytics
export async function getUserAnalytics(userId: string, daysBack: number = 30) {
  return safeQuery(async () => {
    return supabase.rpc('get_user_analytics', {
      target_user_id: userId,
      days_back: daysBack
    })
  })
}

// ==================================================================
// PROFILE MANAGEMENT
// ==================================================================

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string
    subjects?: string[]
    level?: string
    ageGroup?: string
    useCase?: string
    language?: string
    timezone?: string
  }
) {
  return safeQuery(async () => {
    return supabase
      .from('profiles')
      .update({
        name: updates.name,
        subjects: updates.subjects,
        level: updates.level,
        age_group: updates.ageGroup,
        use_case: updates.useCase,
        language: updates.language,
        timezone: updates.timezone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
  })
}

// Create user profile (called after auth)
export async function createUserProfile(
  userId: string,
  email: string,
  profileData: {
    name: string
    subjects: string[]
    level: string
    ageGroup: string
    useCase: string
    language: string
  }
) {
  return safeQuery(async () => {
    return supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        name: profileData.name,
        subjects: profileData.subjects,
        level: profileData.level,
        age_group: profileData.ageGroup,
        use_case: profileData.useCase,
        language: profileData.language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
  })
}

// ==================================================================
// REAL-TIME SUBSCRIPTIONS
// ==================================================================

// Subscribe to user notifications
export function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to progress updates (for collaborative learning)
export function subscribeToProgressUpdates(
  contentId: string,
  callback: (progress: any) => void
) {
  return supabase
    .channel(`progress:${contentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `content_id=eq.${contentId}`
      },
      callback
    )
    .subscribe()
}

// ==================================================================
// BATCH OPERATIONS FOR PERFORMANCE
// ==================================================================

// Batch update multiple progress records
export async function batchUpdateProgress(
  updates: Array<{
    userId: string
    contentId: string
    status?: string
    progressPercentage?: number
    timeSpent?: number
  }>
) {
  const formattedUpdates = updates.map(update => ({
    user_id: update.userId,
    content_id: update.contentId,
    status: update.status,
    progress_percentage: update.progressPercentage,
    time_spent: update.timeSpent
  }))

  return safeQuery(async () => {
    return supabase.rpc('batch_update_progress', {
      updates: formattedUpdates
    })
  })
}

// ==================================================================
// ERROR HANDLING AND MONITORING
// ==================================================================

// Log database errors for monitoring
export function logDatabaseError(error: DatabaseError, context: string) {
  console.error(`Database error in ${context}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString()
  })

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to monitoring service
    // monitoring.captureException(error, { context })
  }
}

// Health check for database connection
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    return !error
  } catch {
    return false
  }
}

export default supabase