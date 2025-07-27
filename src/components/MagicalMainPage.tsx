'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Settings, Heart, Share, Play, BookOpen, MessageCircle, Monitor, Target, TrendingUp, Gamepad2, BarChart3 } from 'lucide-react'
import { useUserProfile, useFeed, useFeedActions } from '@/lib/store'
import { useBrowserCapabilities } from '@/lib/browser-capabilities'
import VideoPlayer from './VideoPlayer'
import QuizOverlay from './QuizOverlay'
import LinkModal from './LinkModal'
import AILessonCard from './AILessonCard'
import AIQuizGenerator from './AIQuizGenerator'
import HorizontalBookFeed from './HorizontalBookFeed'
import ContentRecommendationDashboard from './ContentRecommendationDashboard'
import EngagementDashboard from './EngagementDashboard'
import InteractiveContentPlayer from './InteractiveContentPlayer'
import ModelPerformanceDashboard from './ModelPerformanceDashboard'
import { useComprehensiveAnalytics } from '@/hooks/useAnalyticsTracking'
import { useContentRecommendations } from '@/hooks/useContentRecommendations'
import { useRealTimeMonitoring } from '@/hooks/useRealTimeMonitoring'
import SafeContentFilter from './SafeContentFilter'
import SafetyIntegratedWrapper from './SafetyIntegratedWrapper'
import type { FeedItem, Quiz, QuizResults, LinkPreview, ContentItem } from '@/types'

// Mock feed data for testing
const generateMockFeedItems = (count: number, startIndex: number = 0, userProfile?: { subject: string } | null): FeedItem[] => {
  const contentTypes: FeedItem['content_type'][] = ['video', 'text', 'quiz', 'link', 'ai_lesson', 'interactive']
  const mockItems: FeedItem[] = []

  for (let i = 0; i < count; i++) {
    const index = startIndex + i
    const type = contentTypes[index % contentTypes.length]
    
    // Generate subject-specific topics for AI lessons
    const getAILessonTopic = (subject: string, index: number) => {
      const topics = {
        mathematics: ['Algebra Fundamentals', 'Geometry Basics', 'Calculus Introduction', 'Statistics Overview'],
        science: ['Photosynthesis Process', 'Chemical Reactions', 'Physics Laws', 'Ecosystem Balance'],
        history: ['World War Timeline', 'Ancient Civilizations', 'Industrial Revolution', 'Cold War Era'],
        english: ['Grammar Rules', 'Creative Writing', 'Poetry Analysis', 'Reading Comprehension'],
        computer_science: ['Programming Logic', 'Data Structures', 'Algorithms', 'Web Development'],
        business: ['Market Analysis', 'Financial Planning', 'Leadership Skills', 'Strategic Thinking']
      }
      const subjectKey = subject.toLowerCase().replace(/\s+/g, '_')
      const subjectTopics = topics[subjectKey as keyof typeof topics] || topics.science
      return subjectTopics[index % subjectTopics.length]
    }

    const title = type === 'ai_lesson' 
      ? `🤖 ${getAILessonTopic(userProfile?.subject || 'Science', index)}`
      : type === 'interactive'
      ? `🎮 Interactive ${userProfile?.subject || 'Learning'} Challenge`
      : `${type === 'video' ? '📹' : type === 'quiz' ? '🧩' : type === 'link' ? '🔗' : '📖'} Learning Content ${index + 1}`

    const body = type === 'ai_lesson'
      ? `${getAILessonTopic(userProfile?.subject || 'Science', index)}. Ready to explore this topic with personalized AI tutoring? This lesson will be customized specifically for your learning level and style.`
      : type === 'interactive'
      ? `Engage with hands-on ${userProfile?.subject || 'learning'} activities! This interactive experience includes coding exercises, simulations, and practical challenges designed to reinforce your understanding through active participation.`
      : `This is sample learning content item ${index + 1}. It demonstrates the ${type} content type in our magical learning feed. The content flows like paper without boxes or cards, creating a seamless reading experience.`

    mockItems.push({
      id: `item-${index}`,
      user_id: 'user-1',
      content_type: type,
      title,
      description: body,
      created_at: new Date(Date.now() - index * 3600000).toISOString(),
      relevance_score: Math.random(),
      age_rating: 'all',
      metadata: type === 'video' ? {
        video_url: index % 3 === 0 
          ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          : index % 3 === 1
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          : 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        video_duration: 180
      } : type === 'quiz' ? {
        quiz_questions: [
          {
            id: `q1-${index}`,
            question: `What is the main concept being taught in this ${userProfile?.subject || 'subject'} lesson?`,
            type: 'multiple_choice' as const,
            options: [
              'Understanding the fundamentals',
              'Advanced applications',
              'Historical context',
              'Practical examples'
            ],
            correct_answer: 'Understanding the fundamentals',
            explanation: 'Most lessons start with fundamental concepts before moving to advanced topics.',
            points: 10
          },
          {
            id: `q2-${index}`,
            question: 'This statement is correct: Learning requires active participation.',
            type: 'true_false' as const,
            correct_answer: 'True',
            explanation: 'Active participation helps improve retention and understanding.',
            points: 5
          },
          {
            id: `q3-${index}`,
            question: 'Describe one way this lesson relates to real-world applications.',
            type: 'short_answer' as const,
            correct_answer: 'Various applications are possible',
            explanation: 'Real-world connections help make learning more meaningful.',
            points: 15
          }
        ]
      } : type === 'link' ? {
        link_url: index % 4 === 0 
          ? 'https://www.khanacademy.org'
          : index % 4 === 1
          ? 'https://www.coursera.org'
          : index % 4 === 2
          ? 'https://www.ted.com'
          : 'https://en.wikipedia.org',
        link_preview: {
          title: index % 4 === 0 
            ? 'Khan Academy - Free Online Learning'
            : index % 4 === 1
            ? 'Coursera - Online Courses & Degrees'
            : index % 4 === 2
            ? 'TED - Ideas Worth Spreading'
            : 'Wikipedia - The Free Encyclopedia',
          description: index % 4 === 0 
            ? 'Learn for free about math, art, computer programming, economics, physics, chemistry, biology, medicine, finance, history, and more.'
            : index % 4 === 1
            ? 'Build skills with courses, certificates, and degrees online from world-class universities and companies.'
            : index % 4 === 2
            ? 'TED Talks are influential videos from expert speakers on education, business, science, tech and creativity.'
            : 'Wikipedia is a free online encyclopedia, created and edited by volunteers around the world.',
          domain: index % 4 === 0 
            ? 'khanacademy.org'
            : index % 4 === 1
            ? 'coursera.org'
            : index % 4 === 2
            ? 'ted.com'
            : 'wikipedia.org',
          url: index % 4 === 0 
            ? 'https://www.khanacademy.org'
            : index % 4 === 1
            ? 'https://www.coursera.org'
            : index % 4 === 2
            ? 'https://www.ted.com'
            : 'https://en.wikipedia.org'
        }
      } : type === 'interactive' ? {
        interactive_type: ['coding_exercise', 'simulation', 'drag_drop', 'diagram_labeling', 'virtual_lab'][index % 5],
        difficulty: Math.floor(Math.random() * 5) + 1, // 1-5 difficulty
        estimated_time: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
        learning_objectives: [
          `Apply ${userProfile?.subject || 'learning'} concepts`,
          'Practice problem-solving skills',
          'Engage with interactive content'
        ]
      } : {},
      subject: userProfile?.subject || 'General',
      difficulty: Math.floor(Math.random() * 5) + 1,
      estimated_time: Math.floor(Math.random() * 45) + 15,
      author: {
        id: 'author-1',
        full_name: 'AI Learning Assistant',
        created_at: new Date().toISOString()
      }
    })
  }

  return mockItems
}

export default function MagicalMainPage() {
  const userProfile = useUserProfile()
  const { items: feedItems, isLoading, hasMore } = useFeed()
  const { setItems, addItems, setLoading, setHasMore } = useFeedActions()
  const capabilities = useBrowserCapabilities()
  const analytics = useComprehensiveAnalytics()
  
  // Real-time content monitoring
  const monitoring = useRealTimeMonitoring(userProfile?.id || 'guest', userProfile || {
    id: 'guest',
    name: 'Guest User',
    subject: 'General',
    level: 'beginner',
    age_group: 'adult',
    use_case: 'personal',
    language: 'en',
    created_at: new Date().toISOString()
  })
  
  const [useHorizontalLayout, setUseHorizontalLayout] = useState(false)
  const [showLayoutToggle, setShowLayoutToggle] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [showEngagement, setShowEngagement] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [activeLinkData, setActiveLinkData] = useState<{
    url: string
    title: string
    preview?: LinkPreview
  } | null>(null)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)

  // Initialize feed with mock data and layout detection
  useEffect(() => {
    if (!isInitialized && userProfile) {
      setLoading(true)
      
      // Determine initial layout based on browser capabilities
      const shouldUseHorizontal = capabilities.horizontalScrolling
      setUseHorizontalLayout(shouldUseHorizontal)
      setShowLayoutToggle(capabilities.horizontalScrolling) // Only show toggle if horizontal is supported
      
      // Simulate loading delay
      setTimeout(async () => {
        const initialItems = generateMockFeedItems(5, 0, userProfile)
        setItems(initialItems)
        
        // Queue content for real-time monitoring
        if (monitoring && userProfile.age_group !== 'adult') {
          await monitoring.queueContent(initialItems.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            content_type: item.content_type,
            subject: item.subject,
            difficulty: item.difficulty,
            estimated_time: item.estimated_time,
            metadata: item.metadata || {},
            tags: [],
            created_at: item.created_at,
            updatedAt: new Date()
          })))
        }
        
        setLoading(false)
        setIsInitialized(true)
      }, 1000)
    }
  }, [userProfile, isInitialized, setItems, setLoading, capabilities.horizontalScrolling])

  // Load more content
  const loadMoreContent = () => {
    if (isLoading || !hasMore) return
    
    setLoading(true)
    
    // Simulate API call
    setTimeout(async () => {
      const moreItems = generateMockFeedItems(3, feedItems.length, userProfile)
      addItems(moreItems)
      
      // Queue new content for monitoring
      if (monitoring && userProfile && userProfile.age_group !== 'adult') {
        await monitoring.queueContent(moreItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          content_type: item.content_type,
          subject: item.subject,
          difficulty: item.difficulty,
          estimated_time: item.estimated_time,
          metadata: item.metadata || {},
          tags: [],
          created_at: item.created_at,
          updatedAt: new Date()
        })))
      }
      
      setLoading(false)
      
      // Stop loading after 20 items for demo
      if (feedItems.length + moreItems.length >= 20) {
        setHasMore(false)
      }
    }, 800)
  }

  // Handle content interactions
  const handleInteraction = (contentId: string, action: string, value?: unknown) => {
    console.log('Interaction:', { contentId, action, value })
    
    // Find the content item to get its type
    const contentItem = feedItems.find(item => item.id === contentId)
    if (contentItem) {
      analytics.content.trackContentView(contentId, contentItem.content_type, {
        action,
        value,
        timestamp: Date.now()
      })
    }
  }

  // Handle quiz interactions
  const handleQuizStart = (item: FeedItem) => {
    if (item.metadata?.quiz_questions) {
      const quiz: Quiz = {
        id: item.id,
        title: item.title,
        description: `Test your knowledge about: ${item.description.substring(0, 100)}...`,
        questions: item.metadata.quiz_questions,
        time_limit: 300, // 5 minutes
        passing_score: 70,
        age_group: item.age_rating || 'all'
      }
      setActiveQuiz(quiz)
      setIsQuizOpen(true)
    }
  }

  const handleQuizComplete = (results: QuizResults) => {
    console.log('Quiz completed:', results)
    handleInteraction(results.quizId, 'quiz_complete', results)
    // TODO: Save quiz results to database
  }

  const handleQuizClose = () => {
    setIsQuizOpen(false)
    setActiveQuiz(null)
  }

  // Handle link interactions
  const handleLinkOpen = (item: FeedItem) => {
    if (item.metadata?.link_url) {
      const linkData = {
        url: item.metadata.link_url,
        title: item.title,
        preview: item.metadata.link_preview
      }
      setActiveLinkData(linkData)
      setIsLinkModalOpen(true)
    }
  }

  const handleLinkModalClose = () => {
    setIsLinkModalOpen(false)
    setActiveLinkData(null)
  }

  const handleLinkInteraction = (action: string, data?: unknown) => {
    if (activeLinkData) {
      handleInteraction(activeLinkData.url, action, data)
    }
  }

  // Toggle between horizontal and vertical layouts
  const toggleLayout = () => {
    setUseHorizontalLayout(!useHorizontalLayout)
  }

  // Handle content selection from recommendations
  const handleRecommendedContentSelect = (content: ContentItem) => {
    // Convert ContentItem to FeedItem format
    const feedItem: FeedItem = {
      id: content.id,
      content_type: content.content_type,
      title: content.title,
      description: content.description,
      metadata: content.metadata,
      user_id: userProfile?.id || 'guest',
      subject: content.subject,
      difficulty: content.difficulty,
      estimated_time: content.estimated_time,
      relevance_score: Math.random(),
      age_rating: 'all',
      author: {
        id: 'recommendation-engine',
        full_name: 'AI Recommendation Engine',
        created_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    }

    // Add recommended content to the top of the feed
    setItems([feedItem, ...feedItems])
    
    // Close recommendations sidebar if open
    setShowRecommendations(false)

    // Track interaction
    handleInteraction(content.id, 'recommended_content_selected', { 
      recommendationType: 'ai_recommendation',
      contentType: content.content_type 
    })
  }

  // Handle recommendation feedback
  const handleRecommendationFeedback = (contentId: string, feedback: 'positive' | 'negative' | 'neutral') => {
    handleInteraction(contentId, 'recommendation_feedback', { feedback })
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <SafetyIntegratedWrapper
      userProfile={userProfile}
      contentItems={feedItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        content_type: item.content_type,
        subject: userProfile.subject,
        difficulty: Math.floor(Math.random() * 10) + 1,
        estimated_time: item.estimated_time,
        metadata: item.metadata || {},
        created_at: item.created_at
      }))}
      enableRealTimeMonitoring={userProfile.age_group !== 'adult'}
      enableCommunityModeration={true}
      enableParentalControls={userProfile.age_group === 'child' || userProfile.age_group === 'teen'}
      onSafetyEvent={(event) => {
        console.log('Safety event:', event)
        // Track safety events through main analytics
        analytics.track('safety_event', {
          eventType: event.type,
          severity: event.severity,
          contentId: event.contentId,
          details: event.details
        })
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Fixed Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4"
        >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                Welcome back, {userProfile.name}! 👋
              </h1>
              <p className="text-sm text-gray-600">
                Subject: {userProfile.subject} • Level: {userProfile.level}
                {useHorizontalLayout && <span className="ml-2 text-blue-600">📖 Book Mode</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Engagement Dashboard Toggle */}
            <button
              onClick={() => setShowEngagement(!showEngagement)}
              className={`p-2 rounded-lg transition-colors ${
                showEngagement
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={showEngagement ? 'Hide engagement dashboard' : 'Show engagement tracking'}
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            {/* Performance Analytics Toggle Button */}
            <button
              onClick={() => setShowPerformance(!showPerformance)}
              className={`p-2 rounded-lg transition-colors ${
                showPerformance
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={showPerformance ? 'Hide performance analytics' : 'Show AI model performance'}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            {/* Recommendations Toggle Button */}
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className={`p-2 rounded-lg transition-colors ${
                showRecommendations
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={showRecommendations ? 'Hide recommendations' : 'Show AI recommendations'}
            >
              <Target className="w-5 h-5" />
            </button>
            {/* Layout Toggle Button */}
            {showLayoutToggle && (
              <button
                onClick={toggleLayout}
                className={`p-2 rounded-lg transition-colors ${
                  useHorizontalLayout
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={useHorizontalLayout ? 'Switch to vertical scrolling' : 'Switch to book-like pages'}
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Feed */}
      {useHorizontalLayout ? (
        <HorizontalBookFeed
          feedItems={feedItems}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMoreContent}
          onInteraction={handleInteraction}
        />
      ) : (
      <div className="flex max-w-7xl mx-auto px-4 py-6 gap-6">
        {/* Main Feed */}
        <main className={`${showRecommendations || showEngagement || showPerformance ? 'w-2/3' : 'w-full max-w-2xl mx-auto'} transition-all duration-300`}>
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Magical Learning Feed ✨
          </h2>
          <p className="text-gray-600">
            Personalized {userProfile.subject} content flowing like paper
          </p>
        </motion.div>

        {/* Content Safety Filter */}
        {monitoring && userProfile.age_group !== 'adult' && feedItems.length > 0 && (
          <SafeContentFilter
            userProfile={userProfile}
            content={feedItems.map(item => ({
              id: item.id,
              title: item.title,
              description: item.description,
              content_type: item.content_type,
              subject: userProfile.subject,
              difficulty: Math.floor(Math.random() * 10) + 1,
              estimated_time: item.estimated_time,
              metadata: item.metadata || {},
              created_at: item.created_at
            }))}
            onContentFiltered={(filteredContent) => {
              // Filter feed items based on safe content
              const safeContentIds = new Set(filteredContent.map(c => c.id))
              const safeFeedItems = feedItems.filter(item => safeContentIds.has(item.id))
              if (safeFeedItems.length !== feedItems.length) {
                setItems(safeFeedItems)
              }
            }}
            onSafetyReport={(report) => {
              console.log('Safety report submitted:', report)
            }}
            showFilterStatus={true}
            allowParentalOverride={false}
          />
        )}

        {/* Feed Items */}
        <div className="space-y-0">
          {feedItems.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="content-item py-6 border-b border-gray-100 last:border-b-0"
            >
              {/* Content Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {item.content_type === 'video' && <Play className="w-4 h-4 text-red-500" />}
                    {item.content_type === 'quiz' && <MessageCircle className="w-4 h-4 text-green-500" />}
                    {item.content_type === 'ai_lesson' && <BookOpen className="w-4 h-4 text-blue-500" />}
                    {item.content_type === 'link' && <Share className="w-4 h-4 text-purple-500" />}
                    {item.content_type === 'interactive' && <Gamepad2 className="w-4 h-4 text-orange-500" />}
                    {item.content_type === 'text' && <BookOpen className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.author?.full_name || 'Learning Assistant'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.content_type === 'video' ? 'bg-red-100 text-red-700' :
                  item.content_type === 'quiz' ? 'bg-green-100 text-green-700' :
                  item.content_type === 'ai_lesson' ? 'bg-blue-100 text-blue-700' :
                  item.content_type === 'link' ? 'bg-purple-100 text-purple-700' :
                  item.content_type === 'interactive' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.content_type.replace('_', ' ')}
                </span>
              </div>

              {/* Content Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-relaxed">
                {item.title}
              </h3>

              {/* Content Body */}
              <div className="prose max-w-none text-gray-700 leading-relaxed mb-4">
                {item.description.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Special Content Types */}
              {item.content_type === 'video' && item.metadata?.video_url && (
                <div className="mb-4">
                  <VideoPlayer
                    videoId={item.id}
                    videoUrl={item.metadata.video_url}
                    duration={item.metadata.video_duration}
                    title={item.title}
                    autoplay={false}
                    onPlay={() => handleInteraction(item.id, 'play')}
                    onPause={() => handleInteraction(item.id, 'pause')}
                    onProgress={(currentTime, duration) => 
                      handleInteraction(item.id, 'progress', { currentTime, duration })
                    }
                    onComplete={() => handleInteraction(item.id, 'complete')}
                  />
                </div>
              )}

              {item.content_type === 'quiz' && (
                <div className="mb-4 space-y-3">
                  {/* Regular Quiz */}
                  <motion.button
                    onClick={() => handleQuizStart(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-green-800">Interactive Quiz</div>
                          <p className="text-green-700 text-sm">
                            {item.metadata?.quiz_questions?.length || 1} questions • 
                            5 minute time limit • 70% to pass
                          </p>
                        </div>
                      </div>
                      <div className="text-green-600 font-medium">
                        Start Quiz →
                      </div>
                    </div>
                  </motion.button>

                  {/* AI Quiz Generator */}
                  <AIQuizGenerator
                    topic={item.description.split('.')[0]} // Use first sentence as topic
                    userProfile={userProfile}
                    onQuizGenerated={(quiz) => {
                      setActiveQuiz(quiz)
                      setIsQuizOpen(true)
                    }}
                    onInteraction={(action, data) => handleInteraction(item.id, action, data)}
                    safetyContext={(item as any).safetyContext}
                  />
                </div>
              )}

              {item.content_type === 'link' && item.metadata?.link_preview && (
                <div className="mb-4">
                  <motion.button
                    onClick={() => handleLinkOpen(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors text-left"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Share className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.metadata.link_preview.title}
                          </h4>
                          <span className="text-purple-600 text-sm font-medium ml-2">
                            Open →
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {item.metadata.link_preview.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">
                            {item.metadata.link_preview.domain}
                          </p>
                          <span className="text-xs text-purple-500">
                            • Opens in modal overlay
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>
              )}

              {item.content_type === 'ai_lesson' && (
                <AILessonCard
                  topic={item.description.split('.')[0]} // Use first sentence as topic
                  userProfile={userProfile}
                  onInteraction={(action, data) => handleInteraction(item.id, action, data)}
                  safetyContext={(item as any).safetyContext}
                />
              )}

              {item.content_type === 'interactive' && item.metadata && (
                <div className="mb-4">
                  <InteractiveContentPlayer
                    userProfile={userProfile}
                    learningContext={{
                      currentTopic: item.title,
                      difficulty: (item.metadata.difficulty as number) || 3,
                      timeAvailable: (item.metadata.estimated_time as number) || 20,
                      preferredInteractionType: (item.metadata.interactive_type as string),
                      learningObjectives: (item.metadata.learning_objectives as string[]) || []
                    }}
                    onComplete={(result) => {
                      console.log('Interactive content completed:', result)
                      handleInteraction(item.id, 'interactive_complete', result)
                    }}
                    onInteraction={(action, data) => handleInteraction(item.id, action, data)}
                  />
                </div>
              )}

              {/* Interaction Buttons */}
              <div className="flex items-center space-x-6 pt-3 border-t border-gray-50">
                <button
                  onClick={() => handleInteraction(item.id, 'like')}
                  className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">Like</span>
                </button>
                
                <button
                  onClick={() => handleInteraction(item.id, 'share')}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Share className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
                
                <span className="text-sm text-gray-400 ml-auto">
                  Score: {item.relevance_score.toFixed(2)}
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading more magical content...</p>
          </motion.div>
        )}

        {/* Load More Button */}
        {!isLoading && hasMore && feedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <button
              onClick={loadMoreContent}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              Load More Content ✨
            </button>
          </motion.div>
        )}

        {/* End of Content */}
        {!hasMore && feedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="text-gray-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2" />
              <p>You&apos;ve reached the end! 🎉</p>
              <p className="text-sm">More personalized content coming soon...</p>
            </div>
          </motion.div>
        )}
        </main>

        {/* Engagement Dashboard Sidebar */}
        {showEngagement && !showPerformance && (
          <motion.aside
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="w-1/3 min-w-0"
          >
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <EngagementDashboard
                userProfile={userProfile}
                className="h-full"
              />
            </div>
          </motion.aside>
        )}
        {/* Performance Analytics Sidebar */}
        {showPerformance && (
          <motion.aside
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="w-1/3 min-w-0"
          >
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <ModelPerformanceDashboard
                userProfile={userProfile}
                className="h-full"
              />
            </div>
          </motion.aside>
        )}

        {/* Recommendations Sidebar */}
        {showRecommendations && !showEngagement && !showPerformance && (
          <motion.aside
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="w-1/3 min-w-0"
          >
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <ContentRecommendationDashboard
                onContentSelect={handleRecommendedContentSelect}
                onRecommendationFeedback={handleRecommendationFeedback}
                className="h-full"
              />
            </div>
          </motion.aside>
        )}
      </div>
      )}

      {/* Quiz Overlay */}
      {activeQuiz && (
        <QuizOverlay
          quiz={activeQuiz}
          isOpen={isQuizOpen}
          onClose={handleQuizClose}
          onComplete={handleQuizComplete}
          userProfile={userProfile}
        />
      )}

      {/* Link Modal */}
      {activeLinkData && (
        <LinkModal
          isOpen={isLinkModalOpen}
          linkData={activeLinkData}
          onClose={handleLinkModalClose}
          onInteraction={handleLinkInteraction}
        />
      )}
      </div>
    </SafetyIntegratedWrapper>
  )
}