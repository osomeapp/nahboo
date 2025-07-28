// Content Chunking Algorithm for Horizontal Book Layout
// Transforms vertical feed items into optimized book pages

import type { FeedItem } from '@/types'
import type { 
  BookPage, 
  ContentAnalysis, 
  ChunkingResult, 
  BookLayoutConfig,
  DeviceType
} from '@/types/book-layout'

// Analyze content item complexity and reading time
export function analyzeContent(item: FeedItem): ContentAnalysis {
  const bodyWordCount = (item.description || '').split(/\s+/).length
  const titleWordCount = item.title.split(/\s+/).length
  const totalWords = bodyWordCount + titleWordCount
  
  // Estimate reading time (average 200 words per minute)
  const baseReadTime = Math.max(30, (totalWords / 200) * 60) // minimum 30 seconds
  
  // Additional time for different content types
  let estimatedReadTime = baseReadTime
  
  switch (item.content_type) {
    case 'video':
      // Use actual video duration if available
      estimatedReadTime = item.metadata?.video_duration || 180 // 3 minutes default
      break
    case 'quiz':
      // Estimate based on number of questions
      const questionCount = item.metadata?.quiz_questions?.length || 3
      estimatedReadTime = questionCount * 45 // 45 seconds per question
      break
    case 'ai_lesson':
      // AI lessons tend to be interactive and longer
      estimatedReadTime = baseReadTime * 1.5
      break
    case 'link':
      // Links are quick to preview but may lead to external content
      estimatedReadTime = Math.min(baseReadTime, 60) // max 1 minute
      break
    default:
      estimatedReadTime = baseReadTime
  }
  
  return {
    hasLongText: totalWords > 200,
    hasVideo: item.content_type === 'video',
    hasInteractive: ['quiz', 'ai_lesson'].includes(item.content_type),
    hasLink: item.content_type === 'link',
    estimatedReadTime: Math.round(estimatedReadTime),
    complexity: totalWords > 400 ? 'complex' : 
                totalWords > 150 ? 'medium' : 'simple'
  }
}

// Determine optimal number of items for a page based on content
export function calculateItemsPerPage(
  items: FeedItem[],
  config: BookLayoutConfig,
  deviceType: DeviceType
): number {
  if (items.length === 0) return 1
  
  // Mobile always gets 1 item per page
  if (deviceType === 'mobile') return 1
  
  // Analyze all items on potential page
  const analyses = items.map(analyzeContent)
  
  // Check for content that requires full page
  const hasVideo = analyses.some(a => a.hasVideo)
  const hasComplex = analyses.some(a => a.complexity === 'complex')
  const totalReadTime = analyses.reduce((sum, a) => sum + a.estimatedReadTime, 0)
  
  // Full page scenarios
  if (hasVideo || hasComplex || totalReadTime > 300) { // 5 minutes
    return 1
  }
  
  // Tablet can handle 2 simple items
  if (deviceType === 'tablet') {
    const allSimple = analyses.every(a => a.complexity === 'simple')
    return allSimple && items.length >= 2 ? 2 : 1
  }
  
  // Desktop can handle more complex layouts
  if (deviceType === 'desktop') {
    const allSimple = analyses.every(a => a.complexity === 'simple')
    const mostlySimple = analyses.filter(a => a.complexity === 'simple').length >= 2
    
    if (allSimple && items.length >= 3) return 3
    if (mostlySimple && items.length >= 2) return 2
    return 1
  }
  
  return config.itemsPerPage
}

// Create a single book page from content items
export function createBookPage(
  items: FeedItem[],
  pageNumber: number,
  pageId?: string
): BookPage {
  if (items.length === 0) {
    throw new Error('Cannot create page with no items')
  }
  
  const analyses = items.map(analyzeContent)
  const totalReadTime = analyses.reduce((sum, a) => sum + a.estimatedReadTime, 0)
  
  return {
    id: pageId || `page-${pageNumber}`,
    pageNumber,
    items,
    hasVideo: analyses.some(a => a.hasVideo),
    hasInteractive: analyses.some(a => a.hasInteractive),
    estimatedReadTime: totalReadTime,
    layout: items.length === 1 ? 'single' : 
            items.length === 2 ? 'dual' : 'triple'
  }
}

// Main content chunking algorithm
export function chunkContentIntoPages(
  feedItems: FeedItem[],
  config: BookLayoutConfig,
  deviceType: DeviceType = 'desktop'
): ChunkingResult {
  if (feedItems.length === 0) {
    return {
      pages: [],
      totalPages: 0,
      avgItemsPerPage: 0,
      avgReadTime: 0
    }
  }
  
  const pages: BookPage[] = []
  let currentIndex = 0
  let pageNumber = 1
  
  while (currentIndex < feedItems.length) {
    // Look ahead to determine optimal grouping
    const remainingItems = feedItems.slice(currentIndex)
    const maxItemsForPage = Math.min(3, remainingItems.length)
    
    // Test different grouping sizes to find optimal
    let bestGroupSize = 1
    let bestScore = 0
    
    for (let groupSize = 1; groupSize <= maxItemsForPage; groupSize++) {
      const testItems = remainingItems.slice(0, groupSize)
      const optimalSize = calculateItemsPerPage(testItems, config, deviceType)
      
      // Score based on how well the group fits the optimal size
      const score = groupSize === optimalSize ? 10 : 
                   groupSize < optimalSize ? 5 : 
                   1 // Penalize oversized groups
      
      if (score > bestScore) {
        bestScore = score
        bestGroupSize = groupSize
      }
    }
    
    // Create page with optimal group size
    const pageItems = feedItems.slice(currentIndex, currentIndex + bestGroupSize)
    const page = createBookPage(pageItems, pageNumber, `page-${pageNumber}`)
    pages.push(page)
    
    currentIndex += bestGroupSize
    pageNumber++
  }
  
  // Calculate metrics
  const totalItems = feedItems.length
  const totalPages = pages.length
  const avgItemsPerPage = totalPages > 0 ? totalItems / totalPages : 0
  const totalReadTime = pages.reduce((sum, page) => sum + page.estimatedReadTime, 0)
  const avgReadTime = totalPages > 0 ? totalReadTime / totalPages : 0
  
  return {
    pages,
    totalPages,
    avgItemsPerPage: Math.round(avgItemsPerPage * 100) / 100,
    avgReadTime: Math.round(avgReadTime)
  }
}

// Optimize page layout for better reading experience
export function optimizePageLayout(pages: BookPage[]): BookPage[] {
  if (pages.length <= 1) return pages
  
  const optimizedPages: BookPage[] = []
  
  for (let i = 0; i < pages.length; i++) {
    const currentPage = pages[i]
    const nextPage = pages[i + 1]
    
    // Check if we can balance content between adjacent pages
    if (nextPage && shouldRebalancePages(currentPage, nextPage)) {
      const rebalanced = rebalancePages(currentPage, nextPage)
      optimizedPages.push(rebalanced.first)
      
      // Skip the next page since we've merged it
      if (i + 1 < pages.length - 1) {
        optimizedPages.push(rebalanced.second)
        i++ // Skip next iteration
      }
    } else {
      optimizedPages.push(currentPage)
    }
  }
  
  // Renumber pages after optimization
  return optimizedPages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    id: `page-${index + 1}`
  }))
}

// Check if two adjacent pages should be rebalanced
function shouldRebalancePages(page1: BookPage, page2: BookPage): boolean {
  // Don't rebalance if either page has video content
  if (page1.hasVideo || page2.hasVideo) return false
  
  // Don't rebalance if either page has interactive content
  if (page1.hasInteractive || page2.hasInteractive) return false
  
  // Rebalance if one page is significantly lighter than the other
  const timeDifference = Math.abs(page1.estimatedReadTime - page2.estimatedReadTime)
  const avgTime = (page1.estimatedReadTime + page2.estimatedReadTime) / 2
  
  return timeDifference > avgTime * 0.5 // 50% difference threshold
}

// Rebalance content between two pages
function rebalancePages(page1: BookPage, page2: BookPage): {
  first: BookPage
  second: BookPage
} {
  const allItems = [...page1.items, ...page2.items]
  const totalItems = allItems.length
  
  // Simple rebalancing: try to make pages more equal
  const midPoint = Math.ceil(totalItems / 2)
  
  const firstPageItems = allItems.slice(0, midPoint)
  const secondPageItems = allItems.slice(midPoint)
  
  return {
    first: createBookPage(firstPageItems, page1.pageNumber),
    second: createBookPage(secondPageItems, page2.pageNumber)
  }
}

// Get device type based on window width
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width <= 768) return 'mobile'
  if (width <= 1024) return 'tablet'
  return 'desktop'
}

// Preprocess feed items for optimal chunking
export function preprocessFeedItems(items: FeedItem[]): FeedItem[] {
  // Sort by relevance score and creation date
  return items.sort((a, b) => {
    // Primary sort: relevance score (descending)
    if (a.relevance_score !== b.relevance_score) {
      return b.relevance_score - a.relevance_score
    }
    
    // Secondary sort: creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

// Debug utility to analyze chunking results
export function analyzeChunkingResults(result: ChunkingResult): {
  efficiency: number
  balance: number
  recommendations: string[]
} {
  const { pages } = result
  const recommendations: string[] = []
  
  // Calculate efficiency (how well we use available space)
  const totalCapacity = pages.length * 3 // max 3 items per page
  const totalItems = pages.reduce((sum, page) => sum + page.items.length, 0)
  const efficiency = totalItems / totalCapacity
  
  // Calculate balance (how evenly distributed the content is)
  const readTimes = pages.map(page => page.estimatedReadTime)
  const avgReadTime = readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length
  const variance = readTimes.reduce((sum, time) => sum + Math.pow(time - avgReadTime, 2), 0) / readTimes.length
  const standardDeviation = Math.sqrt(variance)
  const balance = 1 - (standardDeviation / avgReadTime) // 0 = unbalanced, 1 = perfectly balanced
  
  // Generate recommendations
  if (efficiency < 0.6) {
    recommendations.push('Consider increasing items per page for better space utilization')
  }
  
  if (balance < 0.7) {
    recommendations.push('Content distribution is uneven - consider rebalancing pages')
  }
  
  const videoPages = pages.filter(page => page.hasVideo).length
  if (videoPages > pages.length * 0.3) {
    recommendations.push('High video content ratio - ensure good performance')
  }
  
  const longPages = pages.filter(page => page.estimatedReadTime > 300).length
  if (longPages > 0) {
    recommendations.push(`${longPages} pages may be too long for optimal engagement`)
  }
  
  return {
    efficiency: Math.round(efficiency * 100) / 100,
    balance: Math.round(balance * 100) / 100,
    recommendations
  }
}