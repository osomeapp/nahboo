import { NextRequest, NextResponse } from 'next/server'
import { 
  communityLearningEngine,
  type CommunityMember,
  type LearningCommunity,
  type HobbyContent,
  type CommunityPost,
  type Comment,
  type LearningChallenge,
  type UserProgress
} from '@/lib/community-learning-engine'

export const maxDuration = 30

interface CommunityLearningRequest {
  action: 'create_member' | 'update_member' | 'get_member' | 'follow_member' |
          'create_community' | 'update_community' | 'get_community' | 'search_communities' | 'join_community' |
          'create_content' | 'update_content' | 'get_content' | 'get_content_by_community' | 'like_content' | 'bookmark_content' |
          'create_post' | 'update_post' | 'get_posts_by_community' | 'upvote_post' |
          'create_comment' | 'get_comments_by_post' | 'get_comments_by_content' |
          'create_challenge' | 'get_active_challenges' | 'get_challenges_by_community' | 'join_challenge' |
          'update_progress' | 'get_member_progress' |
          'get_personalized_recommendations' | 'generate_community_analytics' |
          'get_trending_content' | 'get_featured_communities' | 'search_content'
  
  // Member actions
  member?: CommunityMember
  memberId?: string
  memberUpdates?: Partial<CommunityMember>
  targetMemberId?: string
  
  // Community actions
  community?: LearningCommunity
  communityId?: string
  communityUpdates?: Partial<LearningCommunity>
  searchQuery?: string
  searchFilters?: {
    category?: LearningCommunity['category']
    difficulty?: string
    tags?: string[]
  }
  
  // Content actions
  content?: HobbyContent
  contentId?: string
  contentUpdates?: Partial<HobbyContent>
  contentFilters?: {
    type?: HobbyContent['type']
    difficulty?: string
    tags?: string[]
  }
  
  // Post actions
  post?: CommunityPost
  postId?: string
  postUpdates?: Partial<CommunityPost>
  
  // Comment actions
  comment?: Comment
  commentId?: string
  
  // Challenge actions
  challenge?: LearningChallenge
  challengeId?: string
  
  // Progress actions
  progressIdentifier?: { challengeId?: string; contentId?: string }
  progressUpdates?: Partial<UserProgress['progress']>
  
  // Analytics actions
  analyticsPeriod?: {
    startDate: string
    endDate: string
  }
  
  // Search and discovery
  limit?: number
}

interface CommunityLearningResponse {
  success: boolean
  action: string
  
  // Response data
  member?: CommunityMember
  community?: LearningCommunity
  communities?: LearningCommunity[]
  content?: HobbyContent
  contentList?: HobbyContent[]
  post?: CommunityPost
  posts?: CommunityPost[]
  comment?: Comment
  comments?: Comment[]
  challenge?: LearningChallenge
  challenges?: LearningChallenge[]
  progress?: UserProgress | UserProgress[]
  recommendations?: any
  analytics?: any
  
  metadata: {
    processingTime: number
    timestamp: string
    totalResults?: number
    page?: number
    hasMore?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: CommunityLearningRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<CommunityLearningResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      // Member Management
      case 'create_member':
        response = await handleCreateMember(body)
        break
        
      case 'update_member':
        response = await handleUpdateMember(body)
        break
        
      case 'get_member':
        response = await handleGetMember(body)
        break
        
      case 'follow_member':
        response = await handleFollowMember(body)
        break
        
      // Community Management
      case 'create_community':
        response = await handleCreateCommunity(body)
        break
        
      case 'update_community':
        response = await handleUpdateCommunity(body)
        break
        
      case 'get_community':
        response = await handleGetCommunity(body)
        break
        
      case 'search_communities':
        response = await handleSearchCommunities(body)
        break
        
      case 'join_community':
        response = await handleJoinCommunity(body)
        break
        
      // Content Management
      case 'create_content':
        response = await handleCreateContent(body)
        break
        
      case 'update_content':
        response = await handleUpdateContent(body)
        break
        
      case 'get_content':
        response = await handleGetContent(body)
        break
        
      case 'get_content_by_community':
        response = await handleGetContentByCommunity(body)
        break
        
      case 'like_content':
        response = await handleLikeContent(body)
        break
        
      case 'bookmark_content':
        response = await handleBookmarkContent(body)
        break
        
      // Post Management
      case 'create_post':
        response = await handleCreatePost(body)
        break
        
      case 'update_post':
        response = await handleUpdatePost(body)
        break
        
      case 'get_posts_by_community':
        response = await handleGetPostsByCommunity(body)
        break
        
      case 'upvote_post':
        response = await handleUpvotePost(body)
        break
        
      // Comment Management
      case 'create_comment':
        response = await handleCreateComment(body)
        break
        
      case 'get_comments_by_post':
        response = await handleGetCommentsByPost(body)
        break
        
      case 'get_comments_by_content':
        response = await handleGetCommentsByContent(body)
        break
        
      // Challenge Management
      case 'create_challenge':
        response = await handleCreateChallenge(body)
        break
        
      case 'get_active_challenges':
        response = await handleGetActiveChallenges(body)
        break
        
      case 'get_challenges_by_community':
        response = await handleGetChallengesByCommunity(body)
        break
        
      case 'join_challenge':
        response = await handleJoinChallenge(body)
        break
        
      // Progress Tracking
      case 'update_progress':
        response = await handleUpdateProgress(body)
        break
        
      case 'get_member_progress':
        response = await handleGetMemberProgress(body)
        break
        
      // Recommendations and Analytics
      case 'get_personalized_recommendations':
        response = await handleGetPersonalizedRecommendations(body)
        break
        
      case 'generate_community_analytics':
        response = await handleGenerateCommunityAnalytics(body)
        break
        
      // Discovery and Search
      case 'get_trending_content':
        response = await handleGetTrendingContent(body)
        break
        
      case 'get_featured_communities':
        response = await handleGetFeaturedCommunities(body)
        break
        
      case 'search_content':
        response = await handleSearchContent(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: CommunityLearningResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        ...response.metadata
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Community Learning API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process community learning request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Member Management Handlers
async function handleCreateMember(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.member) {
    throw new Error('Missing member data')
  }

  const member = await communityLearningEngine.createMember(body.member)
  return { member }
}

async function handleUpdateMember(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.memberUpdates) {
    throw new Error('Missing memberId or updates')
  }

  const member = await communityLearningEngine.updateMember(body.memberId, body.memberUpdates)
  
  if (!member) {
    throw new Error('Member not found')
  }
  
  return { member }
}

async function handleGetMember(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId) {
    throw new Error('Missing memberId')
  }

  const member = communityLearningEngine.getMember(body.memberId)
  
  if (!member) {
    throw new Error('Member not found')
  }
  
  return { member }
}

async function handleFollowMember(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.targetMemberId) {
    throw new Error('Missing memberId or targetMemberId')
  }

  const success = await communityLearningEngine.followMember(body.memberId, body.targetMemberId)
  
  return { success }
}

// Community Management Handlers
async function handleCreateCommunity(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.community) {
    throw new Error('Missing community data')
  }

  const community = await communityLearningEngine.createCommunity(body.community)
  return { community }
}

async function handleUpdateCommunity(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.communityId || !body.communityUpdates) {
    throw new Error('Missing communityId or updates')
  }

  const community = await communityLearningEngine.updateCommunity(body.communityId, body.communityUpdates)
  
  if (!community) {
    throw new Error('Community not found')
  }
  
  return { community }
}

async function handleGetCommunity(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.communityId) {
    throw new Error('Missing communityId')
  }

  const community = communityLearningEngine.getCommunity(body.communityId)
  
  if (!community) {
    throw new Error('Community not found')
  }
  
  return { community }
}

async function handleSearchCommunities(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.searchQuery) {
    throw new Error('Missing search query')
  }

  const communities = communityLearningEngine.searchCommunities(body.searchQuery, body.searchFilters)
  
  return { 
    communities,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: communities.length
    }
  }
}

async function handleJoinCommunity(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.communityId) {
    throw new Error('Missing memberId or communityId')
  }

  const success = await communityLearningEngine.joinCommunity(body.memberId, body.communityId)
  
  return { success }
}

// Content Management Handlers
async function handleCreateContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.content) {
    throw new Error('Missing content data')
  }

  const content = await communityLearningEngine.createContent(body.content)
  return { content }
}

async function handleUpdateContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.contentId || !body.contentUpdates) {
    throw new Error('Missing contentId or updates')
  }

  const content = await communityLearningEngine.updateContent(body.contentId, body.contentUpdates)
  
  if (!content) {
    throw new Error('Content not found')
  }
  
  return { content }
}

async function handleGetContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.contentId) {
    throw new Error('Missing contentId')
  }

  const content = communityLearningEngine.getContent(body.contentId)
  
  if (!content) {
    throw new Error('Content not found')
  }
  
  return { content }
}

async function handleGetContentByCommunity(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.communityId) {
    throw new Error('Missing communityId')
  }

  const contentList = communityLearningEngine.getContentByCommunity(body.communityId, body.contentFilters)
  
  return { 
    contentList,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: contentList.length
    }
  }
}

async function handleLikeContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.contentId) {
    throw new Error('Missing memberId or contentId')
  }

  const success = await communityLearningEngine.likeContent(body.memberId, body.contentId)
  
  return { success }
}

async function handleBookmarkContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.contentId) {
    throw new Error('Missing memberId or contentId')
  }

  const success = await communityLearningEngine.bookmarkContent(body.memberId, body.contentId)
  
  return { success }
}

// Post Management Handlers
async function handleCreatePost(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.post) {
    throw new Error('Missing post data')
  }

  const post = await communityLearningEngine.createPost(body.post)
  return { post }
}

async function handleUpdatePost(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.postId || !body.postUpdates) {
    throw new Error('Missing postId or updates')
  }

  const post = await communityLearningEngine.updatePost(body.postId, body.postUpdates)
  
  if (!post) {
    throw new Error('Post not found')
  }
  
  return { post }
}

async function handleGetPostsByCommunity(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.communityId) {
    throw new Error('Missing communityId')
  }

  const posts = communityLearningEngine.getPostsByCommunity(body.communityId)
  
  return { 
    posts,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: posts.length
    }
  }
}

async function handleUpvotePost(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.postId) {
    throw new Error('Missing memberId or postId')
  }

  const success = await communityLearningEngine.upvotePost(body.memberId, body.postId)
  
  return { success }
}

// Comment Management Handlers
async function handleCreateComment(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.comment) {
    throw new Error('Missing comment data')
  }

  const comment = await communityLearningEngine.createComment(body.comment)
  return { comment }
}

async function handleGetCommentsByPost(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.postId) {
    throw new Error('Missing postId')
  }

  const comments = communityLearningEngine.getCommentsByPost(body.postId)
  
  return { 
    comments,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: comments.length
    }
  }
}

async function handleGetCommentsByContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.contentId) {
    throw new Error('Missing contentId')
  }

  const comments = communityLearningEngine.getCommentsByContent(body.contentId)
  
  return { 
    comments,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: comments.length
    }
  }
}

// Challenge Management Handlers
async function handleCreateChallenge(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.challenge) {
    throw new Error('Missing challenge data')
  }

  const challenge = await communityLearningEngine.createChallenge(body.challenge)
  return { challenge }
}

async function handleGetActiveChallenges(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  const challenges = communityLearningEngine.getActiveChallenges()
  
  return { 
    challenges,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: challenges.length
    }
  }
}

async function handleGetChallengesByCommunity(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.communityId) {
    throw new Error('Missing communityId')
  }

  const challenges = communityLearningEngine.getChallengesByCommunity(body.communityId)
  
  return { 
    challenges,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: challenges.length
    }
  }
}

async function handleJoinChallenge(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.challengeId) {
    throw new Error('Missing memberId or challengeId')
  }

  const success = await communityLearningEngine.joinChallenge(body.memberId, body.challengeId)
  
  return { success }
}

// Progress Tracking Handlers
async function handleUpdateProgress(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId || !body.progressIdentifier || !body.progressUpdates) {
    throw new Error('Missing memberId, progressIdentifier, or progressUpdates')
  }

  const progress = await communityLearningEngine.updateProgress(
    body.memberId, 
    body.progressIdentifier, 
    body.progressUpdates
  )
  
  if (!progress) {
    throw new Error('Progress record not found')
  }
  
  return { progress }
}

async function handleGetMemberProgress(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId) {
    throw new Error('Missing memberId')
  }

  const progress = communityLearningEngine.getMemberProgress(body.memberId)
  
  return { 
    progress,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: Array.isArray(progress) ? progress.length : 1
    }
  }
}

// Recommendations and Analytics Handlers
async function handleGetPersonalizedRecommendations(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.memberId) {
    throw new Error('Missing memberId')
  }

  const recommendations = await communityLearningEngine.getPersonalizedRecommendations(body.memberId)
  
  return { recommendations }
}

async function handleGenerateCommunityAnalytics(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.communityId || !body.analyticsPeriod) {
    throw new Error('Missing communityId or analytics period')
  }

  const period = {
    startDate: new Date(body.analyticsPeriod.startDate),
    endDate: new Date(body.analyticsPeriod.endDate)
  }
  
  const analytics = await communityLearningEngine.generateCommunityAnalytics(body.communityId, period)
  return { analytics }
}

// Discovery and Search Handlers
async function handleGetTrendingContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  const limit = body.limit || 10
  const contentList = communityLearningEngine.getTrendingContent(limit)
  
  return { 
    contentList,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: contentList.length
    }
  }
}

async function handleGetFeaturedCommunities(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  const communities = communityLearningEngine.getFeaturedCommunities()
  
  return { 
    communities,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: communities.length
    }
  }
}

async function handleSearchContent(body: CommunityLearningRequest): Promise<Partial<CommunityLearningResponse>> {
  if (!body.searchQuery) {
    throw new Error('Missing search query')
  }

  const contentList = communityLearningEngine.searchContent(body.searchQuery, body.contentFilters)
  
  return { 
    contentList,
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      totalResults: contentList.length
    }
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Community Learning API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Community-driven learning platform with hobby-based content',
        actions: [
          // Member Management
          'create_member',
          'update_member',
          'get_member',
          'follow_member',
          
          // Community Management
          'create_community',
          'update_community',
          'get_community',
          'search_communities',
          'join_community',
          
          // Content Management
          'create_content',
          'update_content',
          'get_content',
          'get_content_by_community',
          'like_content',
          'bookmark_content',
          
          // Posts and Discussions
          'create_post',
          'update_post',
          'get_posts_by_community',
          'upvote_post',
          
          // Comments
          'create_comment',
          'get_comments_by_post',
          'get_comments_by_content',
          
          // Challenges
          'create_challenge',
          'get_active_challenges',
          'get_challenges_by_community',
          'join_challenge',
          
          // Progress Tracking
          'update_progress',
          'get_member_progress',
          
          // Recommendations and Analytics
          'get_personalized_recommendations',
          'generate_community_analytics',
          
          // Discovery and Search
          'get_trending_content',
          'get_featured_communities',
          'search_content'
        ]
      }
    },
    capabilities: [
      'Community Creation & Management',
      'Hobby-Based Content Creation',
      'Social Learning Features',
      'Member Reputation System',
      'Learning Challenges',
      'Progress Tracking',
      'Personalized Recommendations',
      'Community Analytics',
      'Content Discovery',
      'Social Interactions'
    ],
    communityCategories: [
      'hobby',
      'professional',
      'academic',
      'lifestyle',
      'creative',
      'technical'
    ],
    contentTypes: [
      'tutorial',
      'project',
      'tip',
      'review',
      'showcase',
      'discussion',
      'challenge'
    ],
    features: [
      'Gamified learning with points and badges',
      'Community-driven content creation',
      'Peer-to-peer learning and mentorship',
      'Project showcases and portfolios',
      'Learning challenges and competitions',
      'Social features (following, comments, upvotes)',
      'Personalized content recommendations',
      'Community analytics and insights',
      'Multi-skill hobby communities',
      'Progress tracking and achievements'
    ]
  })
}