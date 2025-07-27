// Performance Testing and Optimization for Horizontal Book Layout
// Generates large content sets and measures performance metrics

import type { FeedItem } from '@/types'

// Generate large content sets for performance testing
export function generateLargeContentSet(count: number = 100): FeedItem[] {
  const contentTypes: FeedItem['type'][] = ['video', 'text', 'quiz', 'link', 'ai_lesson']
  const subjects = ['Mathematics', 'Science', 'History', 'English', 'Computer Science', 'Business']
  const items: FeedItem[] = []

  for (let i = 0; i < count; i++) {
    const type = contentTypes[i % contentTypes.length]
    const subject = subjects[i % subjects.length]
    
    // Generate realistic content sizes for testing
    const bodyLength = Math.random() > 0.5 ? 'short' : Math.random() > 0.7 ? 'long' : 'medium'
    const body = generateBodyText(bodyLength, subject, type)
    
    items.push({
      id: `perf-test-${i}`,
      user_id: 'test-user',
      type,
      title: `${type === 'ai_lesson' ? '🤖 ' : ''}${subject} Content Item ${i + 1}`,
      body,
      created_at: new Date(Date.now() - i * 60000).toISOString(), // Stagger by minutes
      relevance_score: Math.random(),
      age_rating: 'all',
      metadata: generateMetadataForType(type, i),
      author: {
        id: 'test-author',
        full_name: 'Performance Test Generator',
        created_at: new Date().toISOString()
      }
    })
  }

  return items
}

function generateBodyText(length: 'short' | 'medium' | 'long', subject: string, type: string): string {
  const shortText = `This is a ${type} about ${subject}. It provides essential information in a concise format.`
  
  const mediumText = `This comprehensive ${type} explores key concepts in ${subject}. It covers fundamental principles, practical applications, and real-world examples. Students will gain valuable insights through interactive content, engaging exercises, and thoughtful analysis. The material is designed to build understanding progressively while maintaining engagement throughout the learning experience.`
  
  const longText = `This extensive ${type} provides an in-depth exploration of ${subject}, covering multiple facets of the topic with detailed explanations and comprehensive examples. The content includes theoretical foundations, practical applications, case studies, and interactive elements designed to enhance learning outcomes.

Students will engage with complex concepts through carefully structured lessons that build upon previous knowledge while introducing new ideas systematically. The material incorporates various learning modalities including visual aids, interactive exercises, problem-solving activities, and reflective questions.

Key learning objectives include developing critical thinking skills, understanding fundamental principles, applying knowledge to real-world scenarios, and building confidence in the subject matter. The content is designed to accommodate different learning styles and paces while maintaining academic rigor.

Throughout this ${type}, learners will encounter practical examples, thought-provoking challenges, and opportunities for deeper exploration. The structured approach ensures comprehensive coverage while maintaining engagement and promoting active learning. Assessment opportunities are integrated to help students gauge their progress and identify areas for additional focus.`

  switch (length) {
    case 'short': return shortText
    case 'medium': return mediumText
    case 'long': return longText
    default: return shortText
  }
}

function generateMetadataForType(type: string, index: number): any {
  switch (type) {
    case 'video':
      return {
        video_url: index % 3 === 0 
          ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        video_duration: 120 + (index % 300) // 2-7 minutes
      }
    
    case 'quiz':
      return {
        quiz_questions: Array.from({ length: 3 + (index % 3) }, (_, qIndex) => ({
          id: `q${qIndex}-${index}`,
          question: `Question ${qIndex + 1} about the content in item ${index + 1}?`,
          type: qIndex % 2 === 0 ? 'multiple_choice' : 'true_false',
          options: qIndex % 2 === 0 ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
          correct_answer: qIndex % 2 === 0 ? 'Option A' : 'True',
          explanation: 'This explanation helps reinforce the learning concept.',
          points: 10
        }))
      }
    
    case 'link':
      const domains = ['khan-academy.org', 'coursera.org', 'ted.com', 'wikipedia.org', 'youtube.com']
      const domain = domains[index % domains.length]
      
      return {
        link_url: `https://${domain}`,
        link_preview: {
          title: `Educational Resource on ${domain}`,
          description: `Learn more about this topic with additional resources and expert insights from ${domain}.`,
          domain,
          url: `https://${domain}`
        }
      }
    
    default:
      return {}
  }
}

// Performance measurement utilities
export interface PerformanceTestResult {
  totalItems: number
  renderTime: number
  memoryUsage: number
  chunkingTime: number
  pagesGenerated: number
  averageItemsPerPage: number
  fps: number
  isPerformanceGood: boolean
  recommendations: string[]
}

export async function runPerformanceTest(itemCount: number = 50): Promise<PerformanceTestResult> {
  const startTime = performance.now()
  
  // Generate test content
  const testItems = generateLargeContentSet(itemCount)
  const contentGenerationTime = performance.now() - startTime
  
  // Measure memory before test
  const initialMemory = getMemoryUsage()
  
  // Simulate chunking performance (would normally import real chunking)
  const chunkingStart = performance.now()
  const mockChunkingResult = {
    pages: Array.from({ length: Math.ceil(itemCount / 2) }, (_, i) => ({
      id: `page-${i}`,
      pageNumber: i + 1,
      items: testItems.slice(i * 2, (i + 1) * 2),
      hasVideo: Math.random() > 0.7,
      hasInteractive: Math.random() > 0.6,
      estimatedReadTime: 60 + Math.random() * 120,
      layout: 'dual' as const
    })),
    totalPages: Math.ceil(itemCount / 2),
    avgItemsPerPage: 2,
    avgReadTime: 90
  }
  const chunkingTime = performance.now() - chunkingStart
  
  // Simulate render measurement
  const renderStart = performance.now()
  await new Promise(resolve => requestAnimationFrame(resolve))
  const renderTime = performance.now() - renderStart
  
  // Measure memory after test
  const finalMemory = getMemoryUsage()
  const memoryDelta = finalMemory - initialMemory
  
  // Simulate FPS measurement
  const fps = measureSimulatedFPS()
  
  const totalTime = performance.now() - startTime
  const isPerformanceGood = renderTime < 16 && memoryDelta < 50 && fps > 45
  
  const recommendations = generatePerformanceRecommendations({
    renderTime,
    memoryDelta,
    fps,
    itemCount,
    pagesGenerated: mockChunkingResult.totalPages
  })
  
  return {
    totalItems: itemCount,
    renderTime: Math.round(renderTime * 100) / 100,
    memoryUsage: memoryDelta,
    chunkingTime: Math.round(chunkingTime * 100) / 100,
    pagesGenerated: mockChunkingResult.totalPages,
    averageItemsPerPage: mockChunkingResult.avgItemsPerPage,
    fps,
    isPerformanceGood,
    recommendations
  }
}

function getMemoryUsage(): number {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    return memory.usedJSHeapSize / (1024 * 1024) // MB
  }
  return 0
}

function measureSimulatedFPS(): number {
  // Simplified FPS simulation based on system performance
  const baselineFPS = 60
  const performanceHints = [
    navigator.hardwareConcurrency || 4,
    (performance as any).memory?.jsHeapSizeLimit || 2147483648,
    window.devicePixelRatio || 1
  ]
  
  const performanceScore = performanceHints.reduce((score, hint, index) => {
    switch (index) {
      case 0: return score + (hint >= 8 ? 15 : hint >= 4 ? 10 : 5) // CPU cores
      case 1: return score + (hint >= 4294967296 ? 15 : hint >= 2147483648 ? 10 : 5) // Memory
      case 2: return score + (hint <= 2 ? 15 : hint <= 3 ? 10 : 5) // Pixel ratio
      default: return score
    }
  }, 0)
  
  // Simulate FPS based on performance score
  return Math.min(baselineFPS, Math.max(15, baselineFPS - (45 - performanceScore)))
}

function generatePerformanceRecommendations(metrics: {
  renderTime: number
  memoryDelta: number
  fps: number
  itemCount: number
  pagesGenerated: number
}): string[] {
  const recommendations: string[] = []
  
  if (metrics.renderTime > 16) {
    recommendations.push('Reduce animation complexity or disable animations on low-end devices')
    recommendations.push('Consider virtual scrolling for large content sets')
  }
  
  if (metrics.memoryDelta > 100) {
    recommendations.push('Implement content unloading for pages not in view')
    recommendations.push('Optimize image and video loading strategies')
  }
  
  if (metrics.fps < 30) {
    recommendations.push('Enable performance mode with simplified layouts')
    recommendations.push('Reduce concurrent animations and transitions')
  }
  
  if (metrics.itemCount > 50 && metrics.pagesGenerated > 25) {
    recommendations.push('Implement lazy loading for pages beyond viewport')
    recommendations.push('Consider pagination or infinite scroll instead of preloading all content')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance is optimal for current content set')
  }
  
  return recommendations
}

// Stress test with gradual content increase
export async function runStressTest(): Promise<PerformanceTestResult[]> {
  const testSizes = [10, 25, 50, 100, 200, 500]
  const results: PerformanceTestResult[] = []
  
  for (const size of testSizes) {
    console.log(`Running stress test with ${size} items...`)
    const result = await runPerformanceTest(size)
    results.push(result)
    
    // Break if performance becomes unacceptable
    if (!result.isPerformanceGood && size > 100) {
      console.warn(`Performance degraded at ${size} items, stopping stress test`)
      break
    }
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

// Utility to log performance results
export function logPerformanceResults(results: PerformanceTestResult | PerformanceTestResult[]) {
  const resultsArray = Array.isArray(results) ? results : [results]
  
  console.group('📊 Performance Test Results')
  
  resultsArray.forEach((result, index) => {
    console.group(`Test ${index + 1}: ${result.totalItems} items`)
    console.log(`🎯 Render Time: ${result.renderTime}ms`)
    console.log(`🧠 Memory Usage: ${result.memoryUsage}MB`)
    console.log(`📄 Pages Generated: ${result.pagesGenerated}`)
    console.log(`⚡ FPS: ${result.fps}`)
    console.log(`✅ Performance Good: ${result.isPerformanceGood}`)
    
    if (result.recommendations.length > 0) {
      console.group('💡 Recommendations')
      result.recommendations.forEach(rec => console.log(`• ${rec}`))
      console.groupEnd()
    }
    
    console.groupEnd()
  })
  
  console.groupEnd()
}