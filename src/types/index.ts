// Core types for the Learning Platform

export interface User {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface UserProfile {
  id: string
  name: string
  email?: string
  language: string
  subject: string
  subjects?: string[]
  level?: 'beginner' | 'intermediate' | 'advanced'
  age_group?: 'child' | 'teen' | 'adult'
  use_case?: 'tutor' | 'student' | 'college' | 'work' | 'personal' | 'lifelong'
  created_at: string
  updated_at?: string
  onboarding_completed?: boolean
  learning_style_profile?: {
    primary_style?: string
    secondary_style?: string
    style_scores?: Record<string, number>
    confidence?: string
    is_multimodal?: boolean
    assessment_completed: boolean
    assessment_date?: string
  }
}

export interface ContentItem {
  id: string
  user_id?: string
  content_type: 'video' | 'quiz' | 'link' | 'ai_lesson' | 'interactive' | 'text'
  title: string
  description: string
  subject: string
  difficulty: number
  estimated_time: number
  metadata?: {
    video_url?: string
    video_duration?: number
    quiz_questions?: QuizQuestion[]
    link_url?: string
    link_preview?: LinkPreview
    ai_model?: string
    difficulty_level?: number
    learningStyle?: string
    hasImages?: boolean
    hasAudio?: boolean
    interactiveElements?: boolean
    detailedText?: boolean
    [key: string]: unknown
  }
  created_at: string
  relevance_score?: number
  author?: User
  age_rating?: 'child' | 'teen' | 'adult' | 'all'
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'drag_drop'
  options?: string[]
  correct_answer: string
  explanation?: string
  points: number
}

export interface Quiz {
  id: string
  title: string
  description?: string
  questions: QuizQuestion[]
  time_limit?: number
  passing_score?: number
  age_group: 'child' | 'teen' | 'adult' | 'all'
}

export interface QuizResults {
  quizId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  answers: Array<{
    questionId: string
    userAnswer: string
    isCorrect: boolean
    points: number
  }>
}

export interface LinkPreview {
  title: string
  description: string
  image_url?: string
  domain: string
  url: string
}

export interface UserInteraction {
  id: string
  user_id: string
  content_id: string
  action: 'view' | 'like' | 'share' | 'video_progress' | 'video_complete' | 'quiz_attempt' | 'quiz_complete'
  value?: number
  metadata?: Record<string, unknown>
  created_at: string
}

export interface FeedItem extends ContentItem {
  interactions?: UserInteraction[]
  user_interaction?: UserInteraction
}

// Language and Translation types
export interface Language {
  code: string
  name: string
  native_name: string
  is_rtl?: boolean
  country_codes?: string[]
}

export interface TranslationKey {
  key: string
  english_text: string
  context?: string
  category: 'onboarding' | 'navigation' | 'content' | 'ui'
}

export interface Translation {
  id: string
  key: string
  language_code: string
  translated_text: string
  is_verified: boolean
  quality_score: number
}

// Onboarding types
export interface OnboardingState {
  step: 'language_name' | 'subject_selection' | 'learning_style_assessment' | 'completed'
  language: string
  name: string
  subject: string
  custom_subject?: string
  detected_location?: {
    country: string
    language: string
  }
}

// Subject types
export interface Subject {
  id: string
  name_key: string
  category: 'popular' | 'academic' | 'professional' | 'hobby'
  keywords: string[]
  age_groups: string[]
  popularity_score: number
}

// API Response types
export interface LocationData {
  country: string
  country_code: string
  language: string
  timezone?: string
}

export interface GeolocationResponse {
  country_code: string
  country_name: string
  city?: string
  timezone?: string
  latitude?: number
  longitude?: number
}

// Modal and UI types
export interface ModalContent {
  id: string
  type: 'link' | 'quiz' | 'video' | 'content'
  title: string
  url?: string
  content?: unknown
}

export interface QuizResult {
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number
  answers: Record<string, unknown>
  completed_at: string
}

// AI Content Generation types
export interface AIGenerationRequest {
  prompt: string
  type: 'lesson' | 'quiz' | 'explanation' | 'summary'
  subject: string
  age_group: 'child' | 'teen' | 'adult'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  language: string
  context?: string
}

export interface AIGenerationResponse {
  content: string
  type: string
  metadata: {
    model: string
    tokens_used: number
    generation_time: number
    confidence_score?: number
  }
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: unknown
}

// Store types for Zustand
export interface AppState {
  // User state
  user: User | null
  userProfile: UserProfile | null
  setUser: (user: User | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  
  // Onboarding state
  onboarding: OnboardingState
  setOnboardingStep: (step: OnboardingState['step']) => void
  setOnboardingData: (data: Partial<OnboardingState>) => void
  
  // Feed state
  feedItems: FeedItem[]
  setFeedItems: (items: FeedItem[]) => void
  addFeedItems: (items: FeedItem[]) => void
  isLoadingFeed: boolean
  setIsLoadingFeed: (loading: boolean) => void
  hasMoreFeed: boolean
  setHasMoreFeed: (hasMore: boolean) => void
  
  // UI state
  activeModal: ModalContent | null
  setActiveModal: (modal: ModalContent | null) => void
  activeQuiz: Quiz | null
  setActiveQuiz: (quiz: Quiz | null) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  
  // Language state
  currentLanguage: string
  availableLanguages: Language[]
  setCurrentLanguage: (language: string) => void
  setAvailableLanguages: (languages: Language[]) => void
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: AppError | null
  setError: (error: AppError | null) => void
}