'use client'

import { useState, useCallback, useEffect } from 'react'
import type { 
  CommunityMember,
  LearningCommunity,
  HobbyContent,
  CommunityPost,
  Comment,
  LearningChallenge,
  UserProgress
} from '@/lib/community-learning-engine'

interface CommunityLearningState {
  currentMember: CommunityMember | null
  communities: LearningCommunity[]
  featuredCommunities: LearningCommunity[]
  content: HobbyContent[]
  trendingContent: HobbyContent[]
  posts: CommunityPost[]
  comments: Comment[]
  challenges: LearningChallenge[]
  activeChallenges: LearningChallenge[]
  memberProgress: UserProgress[]
  recommendations: any | null
  analytics: any | null
  isLoading: boolean
  error: string | null
}

export function useCommunityLearning(memberId?: string) {
  const [state, setState] = useState<CommunityLearningState>({
    currentMember: null,
    communities: [],
    featuredCommunities: [],
    content: [],
    trendingContent: [],
    posts: [],
    comments: [],
    challenges: [],
    activeChallenges: [],
    memberProgress: [],
    recommendations: null,
    analytics: null,
    isLoading: false,
    error: null
  })

  // Helper function for API calls
  const apiCall = useCallback(async (body: any) => {
    const response = await fetch('/api/community-learning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }
    
    return response.json()
  }, [])

  // Member Management
  const createMember = useCallback(async (member: CommunityMember) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_member',
        member
      })
      
      setState(prev => ({
        ...prev,
        currentMember: result.member,
        isLoading: false
      }))
      
      return result.member
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create member'
      }))
      return null
    }
  }, [apiCall])

  const updateMember = useCallback(async (memberId: string, updates: Partial<CommunityMember>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'update_member',
        memberId,
        memberUpdates: updates
      })
      
      setState(prev => ({
        ...prev,
        currentMember: prev.currentMember?.memberId === memberId ? result.member : prev.currentMember,
        isLoading: false
      }))
      
      return result.member
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update member'
      }))
      return null
    }
  }, [apiCall])

  const followMember = useCallback(async (targetMemberId: string) => {
    if (!memberId) return false
    
    try {
      const result = await apiCall({
        action: 'follow_member',
        memberId,
        targetMemberId
      })
      
      return result.success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to follow member'
      }))
      return false
    }
  }, [apiCall, memberId])

  // Community Management
  const createCommunity = useCallback(async (community: LearningCommunity) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_community',
        community
      })
      
      setState(prev => ({
        ...prev,
        communities: [...prev.communities, result.community],
        isLoading: false
      }))
      
      return result.community
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create community'
      }))
      return null
    }
  }, [apiCall])

  const searchCommunities = useCallback(async (
    query: string, 
    filters?: {
      category?: LearningCommunity['category']
      difficulty?: string
      tags?: string[]
    }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'search_communities',
        searchQuery: query,
        searchFilters: filters
      })
      
      setState(prev => ({
        ...prev,
        communities: result.communities || [],
        isLoading: false
      }))
      
      return result.communities || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search communities'
      }))
      return []
    }
  }, [apiCall])

  const joinCommunity = useCallback(async (communityId: string) => {
    if (!memberId) return false
    
    try {
      const result = await apiCall({
        action: 'join_community',
        memberId,
        communityId
      })
      
      return result.success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join community'
      }))
      return false
    }
  }, [apiCall, memberId])

  const getFeaturedCommunities = useCallback(async () => {
    try {
      const result = await apiCall({
        action: 'get_featured_communities'
      })
      
      setState(prev => ({
        ...prev,
        featuredCommunities: result.communities || []
      }))
      
      return result.communities || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get featured communities'
      }))
      return []
    }
  }, [apiCall])

  // Content Management
  const createContent = useCallback(async (content: HobbyContent) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_content',
        content
      })
      
      setState(prev => ({
        ...prev,
        content: [...prev.content, result.content],
        isLoading: false
      }))
      
      return result.content
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create content'
      }))
      return null
    }
  }, [apiCall])

  const getContentByCommunity = useCallback(async (
    communityId: string,
    filters?: {
      type?: HobbyContent['type']
      difficulty?: string
      tags?: string[]
    }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_content_by_community',
        communityId,
        contentFilters: filters
      })
      
      setState(prev => ({
        ...prev,
        content: result.contentList || [],
        isLoading: false
      }))
      
      return result.contentList || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get community content'
      }))
      return []
    }
  }, [apiCall])

  const likeContent = useCallback(async (contentId: string) => {
    if (!memberId) return false
    
    try {
      const result = await apiCall({
        action: 'like_content',
        memberId,
        contentId
      })
      
      // Update local state to reflect the like
      setState(prev => ({
        ...prev,
        content: prev.content.map(c => 
          c.contentId === contentId 
            ? { ...c, engagement: { ...c.engagement, likes: c.engagement.likes + 1 } }
            : c
        ),
        trendingContent: prev.trendingContent.map(c => 
          c.contentId === contentId 
            ? { ...c, engagement: { ...c.engagement, likes: c.engagement.likes + 1 } }
            : c
        )
      }))
      
      return result.success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to like content'
      }))
      return false
    }
  }, [apiCall, memberId])

  const bookmarkContent = useCallback(async (contentId: string) => {
    if (!memberId) return false
    
    try {
      const result = await apiCall({
        action: 'bookmark_content',
        memberId,
        contentId
      })
      
      return result.success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to bookmark content'
      }))
      return false
    }
  }, [apiCall, memberId])

  const getTrendingContent = useCallback(async (limit: number = 10) => {
    try {
      const result = await apiCall({
        action: 'get_trending_content',
        limit
      })
      
      setState(prev => ({
        ...prev,
        trendingContent: result.contentList || []
      }))
      
      return result.contentList || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get trending content'
      }))
      return []
    }
  }, [apiCall])

  const searchContent = useCallback(async (
    query: string,
    filters?: {
      type?: HobbyContent['type']
      difficulty?: string
      category?: string
      tags?: string[]
    }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'search_content',
        searchQuery: query,
        contentFilters: filters
      })
      
      setState(prev => ({
        ...prev,
        content: result.contentList || [],
        isLoading: false
      }))
      
      return result.contentList || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search content'
      }))
      return []
    }
  }, [apiCall])

  // Posts and Discussions
  const createPost = useCallback(async (post: CommunityPost) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_post',
        post
      })
      
      setState(prev => ({
        ...prev,
        posts: [result.post, ...prev.posts],
        isLoading: false
      }))
      
      return result.post
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create post'
      }))
      return null
    }
  }, [apiCall])

  const getPostsByCommunity = useCallback(async (communityId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_posts_by_community',
        communityId
      })
      
      setState(prev => ({
        ...prev,
        posts: result.posts || [],
        isLoading: false
      }))
      
      return result.posts || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get community posts'
      }))
      return []
    }
  }, [apiCall])

  const upvotePost = useCallback(async (postId: string) => {
    if (!memberId) return false
    
    try {
      const result = await apiCall({
        action: 'upvote_post',
        memberId,
        postId
      })
      
      // Update local state to reflect the upvote
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(p => 
          p.postId === postId 
            ? { ...p, engagement: { ...p.engagement, upvotes: p.engagement.upvotes + 1 } }
            : p
        )
      }))
      
      return result.success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to upvote post'
      }))
      return false
    }
  }, [apiCall, memberId])

  // Comments
  const createComment = useCallback(async (comment: Comment) => {
    try {
      const result = await apiCall({
        action: 'create_comment',
        comment
      })
      
      setState(prev => ({
        ...prev,
        comments: [...prev.comments, result.comment]
      }))
      
      return result.comment
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create comment'
      }))
      return null
    }
  }, [apiCall])

  const getCommentsByPost = useCallback(async (postId: string) => {
    try {
      const result = await apiCall({
        action: 'get_comments_by_post',
        postId
      })
      
      return result.comments || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get post comments'
      }))
      return []
    }
  }, [apiCall])

  const getCommentsByContent = useCallback(async (contentId: string) => {
    try {
      const result = await apiCall({
        action: 'get_comments_by_content',
        contentId
      })
      
      return result.comments || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get content comments'
      }))
      return []
    }
  }, [apiCall])

  // Challenges
  const createChallenge = useCallback(async (challenge: LearningChallenge) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'create_challenge',
        challenge
      })
      
      setState(prev => ({
        ...prev,
        challenges: [...prev.challenges, result.challenge],
        isLoading: false
      }))
      
      return result.challenge
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create challenge'
      }))
      return null
    }
  }, [apiCall])

  const getActiveChallenges = useCallback(async () => {
    try {
      const result = await apiCall({
        action: 'get_active_challenges'
      })
      
      setState(prev => ({
        ...prev,
        activeChallenges: result.challenges || []
      }))
      
      return result.challenges || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get active challenges'
      }))
      return []
    }
  }, [apiCall])

  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!memberId) return false
    
    try {
      const result = await apiCall({
        action: 'join_challenge',
        memberId,
        challengeId
      })
      
      return result.success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join challenge'
      }))
      return false
    }
  }, [apiCall, memberId])

  // Progress Tracking
  const updateProgress = useCallback(async (
    identifier: { challengeId?: string; contentId?: string },
    updates: Partial<UserProgress['progress']>
  ) => {
    if (!memberId) return null
    
    try {
      const result = await apiCall({
        action: 'update_progress',
        memberId,
        progressIdentifier: identifier,
        progressUpdates: updates
      })
      
      // Update local progress state
      setState(prev => ({
        ...prev,
        memberProgress: prev.memberProgress.map(p => {
          const matches = (identifier.challengeId && p.challengeId === identifier.challengeId) ||
                         (identifier.contentId && p.contentId === identifier.contentId)
          return matches ? result.progress : p
        })
      }))
      
      return result.progress
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update progress'
      }))
      return null
    }
  }, [apiCall, memberId])

  const getMemberProgress = useCallback(async () => {
    if (!memberId) return []
    
    try {
      const result = await apiCall({
        action: 'get_member_progress',
        memberId
      })
      
      setState(prev => ({
        ...prev,
        memberProgress: Array.isArray(result.progress) ? result.progress : [result.progress]
      }))
      
      return Array.isArray(result.progress) ? result.progress : [result.progress]
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get member progress'
      }))
      return []
    }
  }, [apiCall, memberId])

  // Recommendations
  const getPersonalizedRecommendations = useCallback(async () => {
    if (!memberId) return null
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'get_personalized_recommendations',
        memberId
      })
      
      setState(prev => ({
        ...prev,
        recommendations: result.recommendations,
        isLoading: false
      }))
      
      return result.recommendations
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get recommendations'
      }))
      return null
    }
  }, [apiCall, memberId])

  // Analytics
  const generateCommunityAnalytics = useCallback(async (
    communityId: string,
    period: { startDate: Date; endDate: Date }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await apiCall({
        action: 'generate_community_analytics',
        communityId,
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

  // Load initial data when memberId is provided
  useEffect(() => {
    if (memberId) {
      // Load member profile
      apiCall({ action: 'get_member', memberId })
        .then(result => setState(prev => ({ ...prev, currentMember: result.member })))
        .catch(() => {})
      
      // Load member progress
      getMemberProgress()
      
      // Load personalized recommendations
      getPersonalizedRecommendations()
    }
    
    // Load featured communities and trending content
    getFeaturedCommunities()
    getTrendingContent()
    getActiveChallenges()
  }, [memberId])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    currentMember: state.currentMember,
    communities: state.communities,
    featuredCommunities: state.featuredCommunities,
    content: state.content,
    trendingContent: state.trendingContent,
    posts: state.posts,
    comments: state.comments,
    challenges: state.challenges,
    activeChallenges: state.activeChallenges,
    memberProgress: state.memberProgress,
    recommendations: state.recommendations,
    analytics: state.analytics,
    isLoading: state.isLoading,
    error: state.error,
    
    // Member Management
    createMember,
    updateMember,
    followMember,
    
    // Community Management
    createCommunity,
    searchCommunities,
    joinCommunity,
    getFeaturedCommunities,
    
    // Content Management
    createContent,
    getContentByCommunity,
    likeContent,
    bookmarkContent,
    getTrendingContent,
    searchContent,
    
    // Posts and Discussions
    createPost,
    getPostsByCommunity,
    upvotePost,
    
    // Comments
    createComment,
    getCommentsByPost,
    getCommentsByContent,
    
    // Challenges
    createChallenge,
    getActiveChallenges,
    joinChallenge,
    
    // Progress Tracking
    updateProgress,
    getMemberProgress,
    
    // Recommendations and Analytics
    getPersonalizedRecommendations,
    generateCommunityAnalytics,
    
    // Utilities
    clearError
  }
}

// Hook for community-specific functionality
export function useCommunityPage(communityId: string, memberId?: string) {
  const [communityData, setCommunityData] = useState<{
    community: LearningCommunity | null
    content: HobbyContent[]
    posts: CommunityPost[]
    challenges: LearningChallenge[]
    analytics: any
  }>({
    community: null,
    content: [],
    posts: [],
    challenges: [],
    analytics: null
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    apiCall,
    getContentByCommunity,
    getPostsByCommunity,
    generateCommunityAnalytics
  } = useCommunityLearning(memberId) as any

  const loadCommunityData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get community details
      const communityResult = await apiCall({
        action: 'get_community',
        communityId
      })
      
      // Get community challenges
      const challengesResult = await apiCall({
        action: 'get_challenges_by_community',
        communityId
      })
      
      // Load content and posts
      const [content, posts] = await Promise.all([
        getContentByCommunity(communityId),
        getPostsByCommunity(communityId)
      ])
      
      // Generate analytics for the last 30 days
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      const analytics = await generateCommunityAnalytics(communityId, { startDate, endDate })
      
      setCommunityData({
        community: communityResult.community,
        content,
        posts,
        challenges: challengesResult.challenges || [],
        analytics
      })
      
      setIsLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load community data')
      setIsLoading(false)
    }
  }, [communityId, apiCall, getContentByCommunity, getPostsByCommunity, generateCommunityAnalytics])

  useEffect(() => {
    if (communityId) {
      loadCommunityData()
    }
  }, [communityId, loadCommunityData])

  return {
    ...communityData,
    isLoading,
    error,
    refreshData: loadCommunityData,
    clearError: () => setError(null)
  }
}