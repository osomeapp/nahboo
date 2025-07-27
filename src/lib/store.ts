import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { 
  AppState, 
  OnboardingState
} from '@/types'

const initialOnboardingState: OnboardingState = {
  step: 'language_name',
  language: 'en',
  name: '',
  subject: '',
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // User state
        user: null,
        userProfile: null,
        setUser: (user) => set({ user }, false, 'setUser'),
        setUserProfile: (userProfile) => set({ userProfile }, false, 'setUserProfile'),
        
        // Onboarding state
        onboarding: initialOnboardingState,
        setOnboardingStep: (step) => 
          set((state) => ({
            onboarding: { ...state.onboarding, step }
          }), false, 'setOnboardingStep'),
        setOnboardingData: (data) => 
          set((state) => ({
            onboarding: { ...state.onboarding, ...data }
          }), false, 'setOnboardingData'),
        
        // Feed state
        feedItems: [],
        setFeedItems: (items) => set({ feedItems: items }, false, 'setFeedItems'),
        addFeedItems: (items) => 
          set((state) => ({
            feedItems: [...state.feedItems, ...items]
          }), false, 'addFeedItems'),
        isLoadingFeed: false,
        setIsLoadingFeed: (loading) => set({ isLoadingFeed: loading }, false, 'setIsLoadingFeed'),
        hasMoreFeed: true,
        setHasMoreFeed: (hasMore) => set({ hasMoreFeed: hasMore }, false, 'setHasMoreFeed'),
        
        // UI state
        activeModal: null,
        setActiveModal: (modal) => set({ activeModal: modal }, false, 'setActiveModal'),
        activeQuiz: null,
        setActiveQuiz: (quiz) => set({ activeQuiz: quiz }, false, 'setActiveQuiz'),
        isSidebarOpen: false,
        toggleSidebar: () => 
          set((state) => ({ isSidebarOpen: !state.isSidebarOpen }), false, 'toggleSidebar'),
        
        // Language state
        currentLanguage: 'en',
        availableLanguages: [],
        setCurrentLanguage: (language) => {
          set({ currentLanguage: language }, false, 'setCurrentLanguage')
          // Also update onboarding language if in onboarding flow
          const { onboarding } = get()
          if (onboarding.step !== 'completed') {
            set((state) => ({
              onboarding: { ...state.onboarding, language }
            }), false, 'updateOnboardingLanguage')
          }
        },
        setAvailableLanguages: (languages) => 
          set({ availableLanguages: languages }, false, 'setAvailableLanguages'),
        
        // Loading states
        isLoading: false,
        setIsLoading: (loading) => set({ isLoading: loading }, false, 'setIsLoading'),
        error: null,
        setError: (error) => set({ error }, false, 'setError'),
      }),
      {
        name: 'learning-platform-storage',
        storage: createJSONStorage(() => {
          // Check if we're in the browser
          if (typeof window !== 'undefined') {
            return localStorage
          }
          // Return a no-op storage for server-side rendering
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }),
        partialize: (state) => ({
          // Only persist certain parts of the state
          userProfile: state.userProfile,
          onboarding: state.onboarding,
          currentLanguage: state.currentLanguage,
        }),
      }
    ),
    {
      name: 'learning-platform-store',
    }
  )
)

// Selectors for easier access to specific parts of the store
export const useUser = () => useAppStore((state) => state.user)
export const useUserProfile = () => useAppStore((state) => state.userProfile)
export const useOnboarding = () => useAppStore((state) => state.onboarding)
export const useFeed = () => useAppStore((state) => ({
  items: state.feedItems,
  isLoading: state.isLoadingFeed,
  hasMore: state.hasMoreFeed,
}))
export const useUI = () => useAppStore((state) => ({
  activeModal: state.activeModal,
  activeQuiz: state.activeQuiz,
  isSidebarOpen: state.isSidebarOpen,
}))
export const useLanguage = () => useAppStore((state) => ({
  current: state.currentLanguage,
  available: state.availableLanguages,
}))

// Action hooks for common operations
export const useOnboardingActions = () => useAppStore((state) => ({
  setStep: state.setOnboardingStep,
  setData: state.setOnboardingData,
  setLanguage: state.setCurrentLanguage,
}))

export const useFeedActions = () => useAppStore((state) => ({
  setItems: state.setFeedItems,
  addItems: state.addFeedItems,
  setLoading: state.setIsLoadingFeed,
  setHasMore: state.setHasMoreFeed,
}))

export const useUIActions = () => useAppStore((state) => ({
  setModal: state.setActiveModal,
  setQuiz: state.setActiveQuiz,
  toggleSidebar: state.toggleSidebar,
}))

export const useAppActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  setUserProfile: state.setUserProfile,
  setLoading: state.setIsLoading,
  setError: state.setError,
}))