'use client'

export interface CommunityMember {
  memberId: string
  profile: {
    username: string
    displayName: string
    avatar?: string
    bio?: string
    location?: string
    dateJoined: Date
    lastActive: Date
  }
  interests: {
    hobbies: string[]
    skills: string[]
    learningGoals: string[]
    expertiseAreas: string[]
  }
  reputation: {
    points: number
    level: 'newcomer' | 'contributor' | 'expert' | 'mentor' | 'legend'
    badges: string[]
    contributionStreak: number
  }
  preferences: {
    visibility: 'public' | 'friends' | 'private'
    notifications: {
      newContent: boolean
      communityUpdates: boolean
      directMessages: boolean
      groupActivities: boolean
    }
    language: string
    timezone: string
  }
  connections: {
    following: string[]
    followers: string[]
    friends: string[]
    blockedUsers: string[]
  }
}

export interface LearningCommunity {
  communityId: string
  name: string
  description: string
  category: 'hobby' | 'professional' | 'academic' | 'lifestyle' | 'creative' | 'technical'
  visibility: 'public' | 'private' | 'invite_only'
  metadata: {
    createdBy: string
    createdAt: Date
    memberCount: number
    contentCount: number
    tags: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
    ageGroup: 'kids' | 'teens' | 'adults' | 'seniors' | 'all_ages'
  }
  settings: {
    allowDiscussions: boolean
    requireApproval: boolean
    moderationLevel: 'light' | 'moderate' | 'strict'
    contentGuidelines: string
    communityRules: string[]
  }
  moderators: string[]
  featured: boolean
}

export interface HobbyContent {
  contentId: string
  communityId: string
  createdBy: string
  title: string
  description: string
  type: 'tutorial' | 'project' | 'tip' | 'review' | 'showcase' | 'discussion' | 'challenge'
  content: {
    body?: string
    media?: {
      type: 'image' | 'video' | 'audio' | 'document'
      url: string
      caption?: string
      duration?: number // for video/audio
    }[]
    attachments?: {
      filename: string
      url: string
      type: string
    }[]
    steps?: {
      stepNumber: number
      title: string
      description: string
      media?: {
        type: 'image' | 'video'
        url: string
        caption?: string
      }[]
      estimatedTime?: number
      materials?: string[]
    }[]
  }
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    estimatedTime: number // in minutes
    materials?: string[]
    tools?: string[]
    skillsRequired?: string[]
    skillsLearned?: string[]
    tags: string[]
  }
  engagement: {
    views: number
    likes: number
    bookmarks: number
    shares: number
    completions: number
    rating: number
    reviewCount: number
  }
  status: 'draft' | 'published' | 'archived' | 'flagged'
  publishedAt?: Date
  lastUpdated: Date
}

export interface CommunityPost {
  postId: string
  communityId: string
  authorId: string
  title?: string
  content: string
  type: 'discussion' | 'question' | 'share' | 'announcement' | 'poll'
  metadata: {
    createdAt: Date
    lastUpdated: Date
    tags: string[]
    isPinned: boolean
    isLocked: boolean
  }
  media?: {
    type: 'image' | 'video' | 'link'
    url: string
    caption?: string
  }[]
  poll?: {
    question: string
    options: {
      text: string
      votes: number
    }[]
    allowMultiple: boolean
    expiresAt?: Date
  }
  engagement: {
    upvotes: number
    downvotes: number
    comments: number
    views: number
    shares: number
  }
  moderation: {
    isApproved: boolean
    flagCount: number
    reportReasons: string[]
    moderatorNotes?: string
  }
}

export interface Comment {
  commentId: string
  parentId?: string // for nested comments
  postId?: string
  contentId?: string
  authorId: string
  content: string
  metadata: {
    createdAt: Date
    lastUpdated: Date
    isEdited: boolean
  }
  engagement: {
    upvotes: number
    downvotes: number
    replies: number
  }
  moderation: {
    isApproved: boolean
    flagCount: number
    isHidden: boolean
  }
}

export interface LearningChallenge {
  challengeId: string
  communityId?: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'special_event'
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  requirements: {
    skillLevel?: string
    materials?: string[]
    timeCommitment: number // in minutes
    prerequisites?: string[]
  }
  timeline: {
    startDate: Date
    endDate: Date
    milestones?: {
      date: Date
      description: string
      reward?: string
    }[]
  }
  rewards: {
    points: number
    badges: string[]
    certificates?: string[]
    communityRecognition: boolean
  }
  participation: {
    participantCount: number
    completionRate: number
    averageRating: number
  }
  createdBy: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
}

export interface UserProgress {
  memberId: string
  communityId?: string
  challengeId?: string
  contentId?: string
  progress: {
    startedAt: Date
    lastAccessedAt: Date
    completionDate?: Date
    progressPercentage: number
    timeSpent: number // in minutes
    stepsCompleted?: number
    totalSteps?: number
  }
  achievements: {
    skillsLearned: string[]
    milestonesReached: string[]
    badgesEarned: string[]
    certificatesAwarded: string[]
  }
  social: {
    shared: boolean
    reviewGiven: boolean
    helpedOthers: number
    mentoringSessions: number
  }
  feedback: {
    rating?: number
    review?: string
    suggestions?: string[]
    wouldRecommend: boolean
  }
}

export interface CommunityAnalytics {
  communityId: string
  period: {
    startDate: Date
    endDate: Date
  }
  membershipMetrics: {
    totalMembers: number
    newMembers: number
    activeMembers: number
    retentionRate: number
    churningMembers: number
  }
  contentMetrics: {
    totalContent: number
    newContent: number
    averageRating: number
    completionRate: number
    engagementRate: number
  }
  activityMetrics: {
    postsCreated: number
    commentsPosted: number
    projectsShared: number
    challengesCompleted: number
    helpRequestsFulfilled: number
  }
  learningMetrics: {
    skillsDeveloped: {
      skill: string
      learnersCount: number
      avgTimeToMaster: number
    }[]
    popularTopics: {
      topic: string
      contentCount: number
      engagement: number
    }[]
    mentorshipPairs: number
    knowledgeSharing: number
  }
  trendingContent: {
    contentId: string
    title: string
    type: string
    engagement: number
    growthRate: number
  }[]
}

class CommunityLearningEngine {
  private members: Map<string, CommunityMember> = new Map()
  private communities: Map<string, LearningCommunity> = new Map()
  private content: Map<string, HobbyContent> = new Map()
  private posts: Map<string, CommunityPost> = new Map()
  private comments: Map<string, Comment> = new Map()
  private challenges: Map<string, LearningChallenge> = new Map()
  private progress: Map<string, UserProgress[]> = new Map()
  private analytics: Map<string, CommunityAnalytics> = new Map()

  // Member Management
  async createMember(member: CommunityMember): Promise<CommunityMember> {
    // Generate initial reputation and assign newcomer level
    member.reputation = {
      points: 0,
      level: 'newcomer',
      badges: ['New Member'],
      contributionStreak: 0
    }
    
    // Set default preferences
    member.preferences = {
      ...member.preferences,
      notifications: {
        newContent: true,
        communityUpdates: true,
        directMessages: true,
        groupActivities: true,
        ...member.preferences.notifications
      }
    }
    
    this.members.set(member.memberId, member)
    return member
  }

  async updateMember(memberId: string, updates: Partial<CommunityMember>): Promise<CommunityMember | null> {
    const member = this.members.get(memberId)
    if (!member) return null
    
    const updatedMember = { ...member, ...updates }
    this.members.set(memberId, updatedMember)
    
    return updatedMember
  }

  getMember(memberId: string): CommunityMember | null {
    return this.members.get(memberId) || null
  }

  async followMember(followerId: string, targetId: string): Promise<boolean> {
    const follower = this.members.get(followerId)
    const target = this.members.get(targetId)
    
    if (!follower || !target || followerId === targetId) return false
    
    // Add to following list
    if (!follower.connections.following.includes(targetId)) {
      follower.connections.following.push(targetId)
    }
    
    // Add to followers list
    if (!target.connections.followers.includes(followerId)) {
      target.connections.followers.push(followerId)
    }
    
    this.members.set(followerId, follower)
    this.members.set(targetId, target)
    
    return true
  }

  // Community Management
  async createCommunity(community: LearningCommunity): Promise<LearningCommunity> {
    // Initialize metadata
    community.metadata = {
      ...community.metadata,
      createdAt: new Date(),
      memberCount: 1, // Creator is first member
      contentCount: 0
    }
    
    // Add creator as moderator
    if (!community.moderators.includes(community.metadata.createdBy)) {
      community.moderators.push(community.metadata.createdBy)
    }
    
    this.communities.set(community.communityId, community)
    
    // Auto-join creator to community
    await this.joinCommunity(community.metadata.createdBy, community.communityId)
    
    return community
  }

  async updateCommunity(communityId: string, updates: Partial<LearningCommunity>): Promise<LearningCommunity | null> {
    const community = this.communities.get(communityId)
    if (!community) return null
    
    const updatedCommunity = { ...community, ...updates }
    this.communities.set(communityId, updatedCommunity)
    
    return updatedCommunity
  }

  getCommunity(communityId: string): LearningCommunity | null {
    return this.communities.get(communityId) || null
  }

  getCommunitiesByCategory(category: LearningCommunity['category']): LearningCommunity[] {
    return Array.from(this.communities.values())
      .filter(community => community.category === category)
      .sort((a, b) => b.metadata.memberCount - a.metadata.memberCount)
  }

  searchCommunities(query: string, filters?: {
    category?: LearningCommunity['category']
    difficulty?: string
    tags?: string[]
  }): LearningCommunity[] {
    const searchTerm = query.toLowerCase()
    
    return Array.from(this.communities.values())
      .filter(community => {
        // Text search
        const matchesQuery = community.name.toLowerCase().includes(searchTerm) ||
                           community.description.toLowerCase().includes(searchTerm) ||
                           community.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        
        if (!matchesQuery) return false
        
        // Apply filters
        if (filters?.category && community.category !== filters.category) return false
        if (filters?.difficulty && community.metadata.difficulty !== filters.difficulty) return false
        if (filters?.tags && !filters.tags.some(tag => community.metadata.tags.includes(tag))) return false
        
        return true
      })
      .sort((a, b) => b.metadata.memberCount - a.metadata.memberCount)
  }

  async joinCommunity(memberId: string, communityId: string): Promise<boolean> {
    const member = this.members.get(memberId)
    const community = this.communities.get(communityId)
    
    if (!member || !community) return false
    
    // Check if already a member (this would be tracked in a separate membership table in real implementation)
    // For now, just increment member count
    community.metadata.memberCount++
    this.communities.set(communityId, community)
    
    return true
  }

  // Content Management
  async createContent(content: HobbyContent): Promise<HobbyContent> {
    // Initialize engagement metrics
    content.engagement = {
      views: 0,
      likes: 0,
      bookmarks: 0,
      shares: 0,
      completions: 0,
      rating: 0,
      reviewCount: 0
    }
    
    content.lastUpdated = new Date()
    
    if (content.status === 'published' && !content.publishedAt) {
      content.publishedAt = new Date()
    }
    
    this.content.set(content.contentId, content)
    
    // Update community content count
    const community = this.communities.get(content.communityId)
    if (community) {
      community.metadata.contentCount++
      this.communities.set(content.communityId, community)
    }
    
    // Award points to creator
    await this.awardPoints(content.createdBy, 10, 'content_creation')
    
    return content
  }

  async updateContent(contentId: string, updates: Partial<HobbyContent>): Promise<HobbyContent | null> {
    const content = this.content.get(contentId)
    if (!content) return null
    
    const updatedContent = { ...content, ...updates, lastUpdated: new Date() }
    
    if (updates.status === 'published' && !content.publishedAt) {
      updatedContent.publishedAt = new Date()
    }
    
    this.content.set(contentId, updatedContent)
    return updatedContent
  }

  getContent(contentId: string): HobbyContent | null {
    return this.content.get(contentId) || null
  }

  getContentByCommunity(communityId: string, filters?: {
    type?: HobbyContent['type']
    difficulty?: string
    tags?: string[]
  }): HobbyContent[] {
    let communityContent = Array.from(this.content.values())
      .filter(content => content.communityId === communityId && content.status === 'published')
    
    if (filters?.type) {
      communityContent = communityContent.filter(content => content.type === filters.type)
    }
    
    if (filters?.difficulty) {
      communityContent = communityContent.filter(content => content.metadata.difficulty === filters.difficulty)
    }
    
    if (filters?.tags) {
      communityContent = communityContent.filter(content => 
        filters.tags!.some(tag => content.metadata.tags.includes(tag))
      )
    }
    
    return communityContent.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0))
  }

  async likeContent(memberId: string, contentId: string): Promise<boolean> {
    const content = this.content.get(contentId)
    if (!content) return false
    
    content.engagement.likes++
    this.content.set(contentId, content)
    
    // Award points to content creator
    await this.awardPoints(content.createdBy, 1, 'content_liked')
    
    return true
  }

  async bookmarkContent(memberId: string, contentId: string): Promise<boolean> {
    const content = this.content.get(contentId)
    if (!content) return false
    
    content.engagement.bookmarks++
    this.content.set(contentId, content)
    
    return true
  }

  // Community Posts and Discussions
  async createPost(post: CommunityPost): Promise<CommunityPost> {
    post.metadata = {
      ...post.metadata,
      createdAt: new Date(),
      lastUpdated: new Date()
    }
    
    post.engagement = {
      upvotes: 0,
      downvotes: 0,
      comments: 0,
      views: 0,
      shares: 0
    }
    
    post.moderation = {
      isApproved: true, // Auto-approve for now
      flagCount: 0,
      reportReasons: []
    }
    
    this.posts.set(post.postId, post)
    
    // Award points to author
    await this.awardPoints(post.authorId, 5, 'post_creation')
    
    return post
  }

  async updatePost(postId: string, updates: Partial<CommunityPost>): Promise<CommunityPost | null> {
    const post = this.posts.get(postId)
    if (!post) return null
    
    const updatedPost = { 
      ...post, 
      ...updates,
      metadata: {
        ...post.metadata,
        ...updates.metadata,
        lastUpdated: new Date()
      }
    }
    
    this.posts.set(postId, updatedPost)
    return updatedPost
  }

  getPostsByCommunity(communityId: string): CommunityPost[] {
    return Array.from(this.posts.values())
      .filter(post => post.communityId === communityId && post.moderation.isApproved)
      .sort((a, b) => {
        // Pinned posts first, then by creation date
        if (a.metadata.isPinned && !b.metadata.isPinned) return -1
        if (!a.metadata.isPinned && b.metadata.isPinned) return 1
        return b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
      })
  }

  async upvotePost(memberId: string, postId: string): Promise<boolean> {
    const post = this.posts.get(postId)
    if (!post) return false
    
    post.engagement.upvotes++
    this.posts.set(postId, post)
    
    // Award points to post author
    await this.awardPoints(post.authorId, 2, 'post_upvoted')
    
    return true
  }

  // Comments
  async createComment(comment: Comment): Promise<Comment> {
    comment.metadata = {
      createdAt: new Date(),
      lastUpdated: new Date(),
      isEdited: false
    }
    
    comment.engagement = {
      upvotes: 0,
      downvotes: 0,
      replies: 0
    }
    
    comment.moderation = {
      isApproved: true,
      flagCount: 0,
      isHidden: false
    }
    
    this.comments.set(comment.commentId, comment)
    
    // Update parent post comment count
    if (comment.postId) {
      const post = this.posts.get(comment.postId)
      if (post) {
        post.engagement.comments++
        this.posts.set(comment.postId, post)
      }
    }
    
    // Award points to commenter
    await this.awardPoints(comment.authorId, 2, 'comment_creation')
    
    return comment
  }

  getCommentsByPost(postId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId && comment.moderation.isApproved)
      .sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime())
  }

  getCommentsByContent(contentId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter(comment => comment.contentId === contentId && comment.moderation.isApproved)
      .sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime())
  }

  // Learning Challenges
  async createChallenge(challenge: LearningChallenge): Promise<LearningChallenge> {
    challenge.participation = {
      participantCount: 0,
      completionRate: 0,
      averageRating: 0
    }
    
    this.challenges.set(challenge.challengeId, challenge)
    return challenge
  }

  getActiveChallenges(): LearningChallenge[] {
    const now = new Date()
    return Array.from(this.challenges.values())
      .filter(challenge => 
        challenge.status === 'active' && 
        challenge.timeline.startDate <= now && 
        challenge.timeline.endDate >= now
      )
      .sort((a, b) => a.timeline.endDate.getTime() - b.timeline.endDate.getTime())
  }

  getChallengesByCommunity(communityId: string): LearningChallenge[] {
    return Array.from(this.challenges.values())
      .filter(challenge => challenge.communityId === communityId)
      .sort((a, b) => b.timeline.startDate.getTime() - a.timeline.startDate.getTime())
  }

  async joinChallenge(memberId: string, challengeId: string): Promise<boolean> {
    const challenge = this.challenges.get(challengeId)
    if (!challenge || challenge.status !== 'active') return false
    
    const progress: UserProgress = {
      memberId,
      challengeId,
      progress: {
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        progressPercentage: 0,
        timeSpent: 0
      },
      achievements: {
        skillsLearned: [],
        milestonesReached: [],
        badgesEarned: [],
        certificatesAwarded: []
      },
      social: {
        shared: false,
        reviewGiven: false,
        helpedOthers: 0,
        mentoringSessions: 0
      },
      feedback: {
        wouldRecommend: true
      }
    }
    
    const memberProgress = this.progress.get(memberId) || []
    memberProgress.push(progress)
    this.progress.set(memberId, memberProgress)
    
    challenge.participation.participantCount++
    this.challenges.set(challengeId, challenge)
    
    return true
  }

  // Progress Tracking
  async updateProgress(
    memberId: string, 
    identifier: { challengeId?: string; contentId?: string },
    updates: Partial<UserProgress['progress']>
  ): Promise<UserProgress | null> {
    const memberProgress = this.progress.get(memberId) || []
    
    const progressIndex = memberProgress.findIndex(p => 
      (identifier.challengeId && p.challengeId === identifier.challengeId) ||
      (identifier.contentId && p.contentId === identifier.contentId)
    )
    
    if (progressIndex === -1) return null
    
    const progress = memberProgress[progressIndex]
    progress.progress = { ...progress.progress, ...updates, lastAccessedAt: new Date() }
    
    // Check for completion
    if (progress.progress.progressPercentage === 100 && !progress.progress.completionDate) {
      progress.progress.completionDate = new Date()
      
      // Award completion points and badges
      if (identifier.challengeId) {
        await this.awardPoints(memberId, 50, 'challenge_completed')
        progress.achievements.badgesEarned.push('Challenge Completed')
      } else if (identifier.contentId) {
        await this.awardPoints(memberId, 20, 'content_completed')
        
        // Update content completion count
        const content = this.content.get(identifier.contentId!)
        if (content) {
          content.engagement.completions++
          this.content.set(identifier.contentId!, content)
        }
      }
    }
    
    memberProgress[progressIndex] = progress
    this.progress.set(memberId, memberProgress)
    
    return progress
  }

  getMemberProgress(memberId: string): UserProgress[] {
    return this.progress.get(memberId) || []
  }

  // Reputation and Gamification
  async awardPoints(memberId: string, points: number, reason: string): Promise<boolean> {
    const member = this.members.get(memberId)
    if (!member) return false
    
    member.reputation.points += points
    
    // Update contribution streak
    const today = new Date().toDateString()
    const lastActive = member.profile.lastActive.toDateString()
    
    if (today === lastActive) {
      // Same day, maintain streak
    } else if (new Date(today).getTime() - new Date(lastActive).getTime() === 24 * 60 * 60 * 1000) {
      // Next day, increment streak
      member.reputation.contributionStreak++
    } else {
      // Reset streak
      member.reputation.contributionStreak = 1
    }
    
    member.profile.lastActive = new Date()
    
    // Update level based on points
    member.reputation.level = this.calculateLevel(member.reputation.points)
    
    // Award streak badges
    if (member.reputation.contributionStreak >= 7 && !member.reputation.badges.includes('Week Warrior')) {
      member.reputation.badges.push('Week Warrior')
    }
    if (member.reputation.contributionStreak >= 30 && !member.reputation.badges.includes('Monthly Master')) {
      member.reputation.badges.push('Monthly Master')
    }
    
    this.members.set(memberId, member)
    return true
  }

  private calculateLevel(points: number): CommunityMember['reputation']['level'] {
    if (points >= 10000) return 'legend'
    if (points >= 5000) return 'mentor'
    if (points >= 1000) return 'expert'
    if (points >= 100) return 'contributor'
    return 'newcomer'
  }

  // Recommendations
  async getPersonalizedRecommendations(memberId: string): Promise<{
    communities: LearningCommunity[]
    content: HobbyContent[]
    challenges: LearningChallenge[]
    members: CommunityMember[]
  }> {
    const member = this.members.get(memberId)
    if (!member) {
      return { communities: [], content: [], challenges: [], members: [] }
    }
    
    const interests = [...member.interests.hobbies, ...member.interests.skills, ...member.interests.learningGoals]
    
    // Recommend communities based on interests
    const recommendedCommunities = Array.from(this.communities.values())
      .filter(community => 
        community.metadata.tags.some(tag => interests.includes(tag)) ||
        interests.some(interest => 
          community.name.toLowerCase().includes(interest.toLowerCase()) ||
          community.description.toLowerCase().includes(interest.toLowerCase())
        )
      )
      .slice(0, 5)
    
    // Recommend content based on interests and skill level
    const recommendedContent = Array.from(this.content.values())
      .filter(content => 
        content.status === 'published' &&
        (content.metadata.tags.some(tag => interests.includes(tag)) ||
         interests.some(interest => content.title.toLowerCase().includes(interest.toLowerCase())))
      )
      .sort((a, b) => b.engagement.rating - a.engagement.rating)
      .slice(0, 10)
    
    // Recommend active challenges
    const recommendedChallenges = this.getActiveChallenges()
      .filter(challenge => 
        interests.some(interest => 
          challenge.title.toLowerCase().includes(interest.toLowerCase()) ||
          challenge.category.toLowerCase().includes(interest.toLowerCase())
        )
      )
      .slice(0, 3)
    
    // Recommend members to follow (similar interests, higher reputation)
    const recommendedMembers = Array.from(this.members.values())
      .filter(otherMember => 
        otherMember.memberId !== memberId &&
        !member.connections.following.includes(otherMember.memberId) &&
        otherMember.interests.hobbies.some(hobby => member.interests.hobbies.includes(hobby))
      )
      .sort((a, b) => b.reputation.points - a.reputation.points)
      .slice(0, 5)
    
    return {
      communities: recommendedCommunities,
      content: recommendedContent,
      challenges: recommendedChallenges,
      members: recommendedMembers
    }
  }

  // Analytics
  async generateCommunityAnalytics(communityId: string, period: { startDate: Date; endDate: Date }): Promise<CommunityAnalytics> {
    const community = this.communities.get(communityId)
    if (!community) {
      throw new Error('Community not found')
    }
    
    const communityContent = this.getContentByCommunity(communityId)
    const communityPosts = this.getPostsByCommunity(communityId)
    
    // Filter by period
    const periodContent = communityContent.filter(content => 
      content.publishedAt && content.publishedAt >= period.startDate && content.publishedAt <= period.endDate
    )
    
    const periodPosts = communityPosts.filter(post => 
      post.metadata.createdAt >= period.startDate && post.metadata.createdAt <= period.endDate
    )
    
    // Calculate metrics
    const membershipMetrics = {
      totalMembers: community.metadata.memberCount,
      newMembers: Math.floor(community.metadata.memberCount * 0.1), // Simplified
      activeMembers: Math.floor(community.metadata.memberCount * 0.7),
      retentionRate: 0.85,
      churningMembers: Math.floor(community.metadata.memberCount * 0.05)
    }
    
    const contentMetrics = {
      totalContent: communityContent.length,
      newContent: periodContent.length,
      averageRating: communityContent.reduce((sum, c) => sum + c.engagement.rating, 0) / Math.max(communityContent.length, 1),
      completionRate: communityContent.reduce((sum, c) => sum + (c.engagement.completions / Math.max(c.engagement.views, 1)), 0) / Math.max(communityContent.length, 1),
      engagementRate: communityContent.reduce((sum, c) => sum + (c.engagement.likes / Math.max(c.engagement.views, 1)), 0) / Math.max(communityContent.length, 1)
    }
    
    const activityMetrics = {
      postsCreated: periodPosts.length,
      commentsPosted: periodPosts.reduce((sum, p) => sum + p.engagement.comments, 0),
      projectsShared: periodContent.filter(c => c.type === 'showcase').length,
      challengesCompleted: 5, // Simplified
      helpRequestsFulfilled: 12 // Simplified
    }
    
    // Generate skill and topic analysis
    const allTags = communityContent.flatMap(c => c.metadata.tags)
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const popularTopics = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, contentCount]) => ({
        topic,
        contentCount,
        engagement: Math.random() * 100 // Simplified
      }))
    
    const learningMetrics = {
      skillsDeveloped: popularTopics.slice(0, 5).map(topic => ({
        skill: topic.topic,
        learnersCount: Math.floor(Math.random() * 50) + 10,
        avgTimeToMaster: Math.floor(Math.random() * 30) + 10 // days
      })),
      popularTopics,
      mentorshipPairs: Math.floor(community.metadata.memberCount * 0.1),
      knowledgeSharing: communityPosts.filter(p => p.type === 'share').length
    }
    
    const trendingContent = communityContent
      .sort((a, b) => (b.engagement.views + b.engagement.likes) - (a.engagement.views + a.engagement.likes))
      .slice(0, 5)
      .map(content => ({
        contentId: content.contentId,
        title: content.title,
        type: content.type,
        engagement: content.engagement.views + content.engagement.likes,
        growthRate: Math.random() * 100 // Simplified
      }))
    
    const analytics: CommunityAnalytics = {
      communityId,
      period,
      membershipMetrics,
      contentMetrics,
      activityMetrics,
      learningMetrics,
      trendingContent
    }
    
    this.analytics.set(communityId, analytics)
    return analytics
  }

  // Discovery and Search
  getTrendingContent(limit: number = 10): HobbyContent[] {
    return Array.from(this.content.values())
      .filter(content => content.status === 'published')
      .sort((a, b) => {
        const aScore = a.engagement.views + a.engagement.likes * 2 + a.engagement.completions * 3
        const bScore = b.engagement.views + b.engagement.likes * 2 + b.engagement.completions * 3
        return bScore - aScore
      })
      .slice(0, limit)
  }

  getFeaturedCommunities(): LearningCommunity[] {
    return Array.from(this.communities.values())
      .filter(community => community.featured || community.metadata.memberCount >= 100)
      .sort((a, b) => b.metadata.memberCount - a.metadata.memberCount)
      .slice(0, 6)
  }

  searchContent(query: string, filters?: {
    type?: HobbyContent['type']
    difficulty?: string
    category?: string
    tags?: string[]
  }): HobbyContent[] {
    const searchTerm = query.toLowerCase()
    
    return Array.from(this.content.values())
      .filter(content => {
        if (content.status !== 'published') return false
        
        // Text search
        const matchesQuery = content.title.toLowerCase().includes(searchTerm) ||
                           content.description.toLowerCase().includes(searchTerm) ||
                           content.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        
        if (!matchesQuery) return false
        
        // Apply filters
        if (filters?.type && content.type !== filters.type) return false
        if (filters?.difficulty && content.metadata.difficulty !== filters.difficulty) return false
        if (filters?.tags && !filters.tags.some(tag => content.metadata.tags.includes(tag))) return false
        
        return true
      })
      .sort((a, b) => b.engagement.rating - a.engagement.rating)
  }
}

export const communityLearningEngine = new CommunityLearningEngine()