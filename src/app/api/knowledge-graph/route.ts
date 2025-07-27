import { NextRequest, NextResponse } from 'next/server'
import { 
  knowledgeGraphGenerator,
  type KnowledgeGraph,
  type LearningPath,
  type ConceptNode
} from '@/lib/knowledge-graph-generator'

export const maxDuration = 60 // Knowledge graph generation can take longer

interface KnowledgeGraphRequest {
  action: 'generate' | 'get' | 'get_all' | 'search_concepts' | 'get_learning_paths' | 'get_dependencies' | 'analyze_gaps'
  
  // For generate action
  subject?: string
  scope?: 'basic' | 'intermediate' | 'advanced' | 'comprehensive'
  targetAudience?: string
  
  // For get_learning_paths
  targetDifficulty?: string
  maxDuration?: number
  
  // For search_concepts and get_dependencies
  query?: string
  conceptId?: string
}

interface KnowledgeGraphResponse {
  success: boolean
  action: string
  
  // Response data
  knowledgeGraph?: KnowledgeGraph
  knowledgeGraphs?: KnowledgeGraph[]
  learningPaths?: LearningPath[]
  concepts?: ConceptNode[]
  dependencies?: ConceptNode[]
  analysis?: any
  
  metadata: {
    processingTime: number
    timestamp: string
    conceptCount?: number
    pathCount?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: KnowledgeGraphRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<KnowledgeGraphResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'generate':
        response = await handleGenerateKnowledgeGraph(body)
        break
        
      case 'get':
        response = await handleGetKnowledgeGraph(body)
        break
        
      case 'get_all':
        response = await handleGetAllKnowledgeGraphs()
        break
        
      case 'search_concepts':
        response = await handleSearchConcepts(body)
        break
        
      case 'get_learning_paths':
        response = await handleGetLearningPaths(body)
        break
        
      case 'get_dependencies':
        response = await handleGetDependencies(body)
        break
        
      case 'analyze_gaps':
        response = await handleAnalyzeGaps(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: KnowledgeGraphResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        conceptCount: Array.isArray(response.concepts) ? response.concepts.length : 
                     response.knowledgeGraph?.nodes.length,
        pathCount: Array.isArray(response.learningPaths) ? response.learningPaths.length : undefined
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Knowledge Graph API error:', error)
    return NextResponse.json(
      { error: 'Failed to process knowledge graph request' },
      { status: 500 }
    )
  }
}

// Generate new knowledge graph
async function handleGenerateKnowledgeGraph(body: KnowledgeGraphRequest): Promise<Partial<KnowledgeGraphResponse>> {
  if (!body.subject) {
    throw new Error('Missing required field: subject')
  }
  
  const knowledgeGraph = await knowledgeGraphGenerator.generateKnowledgeGraph(
    body.subject,
    body.scope || 'comprehensive',
    body.targetAudience || 'general'
  )
  
  return { knowledgeGraph }
}

// Get existing knowledge graph
async function handleGetKnowledgeGraph(body: KnowledgeGraphRequest): Promise<Partial<KnowledgeGraphResponse>> {
  if (!body.subject) {
    throw new Error('Missing required field: subject')
  }
  
  const knowledgeGraph = knowledgeGraphGenerator.getKnowledgeGraph(body.subject)
  
  if (!knowledgeGraph) {
    throw new Error(`Knowledge graph not found for subject: ${body.subject}`)
  }
  
  return { knowledgeGraph }
}

// Get all knowledge graphs
async function handleGetAllKnowledgeGraphs(): Promise<Partial<KnowledgeGraphResponse>> {
  const knowledgeGraphs = knowledgeGraphGenerator.getAllKnowledgeGraphs()
  
  return { knowledgeGraphs }
}

// Search concepts across all graphs
async function handleSearchConcepts(body: KnowledgeGraphRequest): Promise<Partial<KnowledgeGraphResponse>> {
  if (!body.query) {
    throw new Error('Missing required field: query')
  }
  
  const concepts = knowledgeGraphGenerator.searchConcepts(body.query)
  
  return { concepts }
}

// Get learning paths for a subject
async function handleGetLearningPaths(body: KnowledgeGraphRequest): Promise<Partial<KnowledgeGraphResponse>> {
  if (!body.subject) {
    throw new Error('Missing required field: subject')
  }
  
  const knowledgeGraph = knowledgeGraphGenerator.getKnowledgeGraph(body.subject)
  
  if (!knowledgeGraph) {
    throw new Error(`Knowledge graph not found for subject: ${body.subject}`)
  }
  
  const learningPaths = knowledgeGraphGenerator.generateLearningPaths(
    knowledgeGraph,
    body.targetDifficulty || 'intermediate',
    body.maxDuration || 40
  )
  
  return { learningPaths }
}

// Get concept dependencies
async function handleGetDependencies(body: KnowledgeGraphRequest): Promise<Partial<KnowledgeGraphResponse>> {
  if (!body.conceptId) {
    throw new Error('Missing required field: conceptId')
  }
  
  const dependencies = knowledgeGraphGenerator.getConceptDependencies(body.conceptId)
  
  return { dependencies }
}

// Analyze knowledge gaps
async function handleAnalyzeGaps(body: KnowledgeGraphRequest): Promise<Partial<KnowledgeGraphResponse>> {
  if (!body.subject) {
    throw new Error('Missing required field: subject')
  }
  
  const knowledgeGraph = knowledgeGraphGenerator.getKnowledgeGraph(body.subject)
  
  if (!knowledgeGraph) {
    throw new Error(`Knowledge graph not found for subject: ${body.subject}`)
  }
  
  // Analyze the knowledge graph for gaps and improvement opportunities
  const analysis = {
    gaps: knowledgeGraph.metadata.gaps,
    coverage: knowledgeGraph.metadata.coverage,
    suggestions: generateImprovementSuggestions(knowledgeGraph),
    metrics: {
      conceptDensity: knowledgeGraph.nodes.length / knowledgeGraph.metadata.estimatedCourseLength,
      avgDifficulty: knowledgeGraph.metadata.averageDifficulty,
      prerequisiteChains: analyzePrerequisiteChains(knowledgeGraph),
      topicalBalance: analyzeTopicalBalance(knowledgeGraph)
    }
  }
  
  return { analysis }
}

// Generate improvement suggestions for a knowledge graph
function generateImprovementSuggestions(graph: KnowledgeGraph): string[] {
  const suggestions: string[] = []
  
  // Check for difficulty progression issues
  if (graph.metadata.averageDifficulty < 3) {
    suggestions.push('Consider adding more advanced concepts to challenge learners')
  } else if (graph.metadata.averageDifficulty > 7) {
    suggestions.push('Consider adding more foundational concepts for better accessibility')
  }
  
  // Check for course length
  if (graph.metadata.estimatedCourseLength < 10) {
    suggestions.push('Course might be too short - consider expanding with practical applications')
  } else if (graph.metadata.estimatedCourseLength > 100) {
    suggestions.push('Course might be too long - consider breaking into modules or removing less critical concepts')
  }
  
  // Check for concept density
  const conceptDensity = graph.nodes.length / graph.metadata.estimatedCourseLength
  if (conceptDensity < 0.5) {
    suggestions.push('Low concept density - consider adding more concepts or reducing course length')
  } else if (conceptDensity > 2) {
    suggestions.push('High concept density - learners might feel overwhelmed, consider spacing out concepts')
  }
  
  // Check for knowledge gaps
  if (graph.metadata.gaps.length > 0) {
    suggestions.push(`Address identified knowledge gaps: ${graph.metadata.gaps.slice(0, 3).join(', ')}`)
  }
  
  return suggestions
}

// Analyze prerequisite chains in the knowledge graph
function analyzePrerequisiteChains(graph: KnowledgeGraph): {
  maxChainLength: number
  avgChainLength: number
  isolatedConcepts: number
} {
  const conceptMap = new Map(graph.nodes.map(node => [node.id, node]))
  const chainLengths: number[] = []
  let isolatedConcepts = 0
  
  // Calculate chain length for each concept
  graph.nodes.forEach(node => {
    const chainLength = calculateChainLength(node.id, graph.relationships, new Set())
    chainLengths.push(chainLength)
    
    if (chainLength === 0) {
      isolatedConcepts++
    }
  })
  
  return {
    maxChainLength: Math.max(...chainLengths, 0),
    avgChainLength: chainLengths.length > 0 ? chainLengths.reduce((a, b) => a + b, 0) / chainLengths.length : 0,
    isolatedConcepts
  }
}

// Calculate the length of prerequisite chain for a concept
function calculateChainLength(
  conceptId: string, 
  relationships: any[], 
  visited: Set<string>
): number {
  if (visited.has(conceptId)) return 0 // Avoid cycles
  
  visited.add(conceptId)
  
  const prerequisites = relationships
    .filter(rel => rel.fromConceptId === conceptId && rel.type === 'prerequisite')
    .map(rel => rel.toConceptId)
  
  if (prerequisites.length === 0) return 0
  
  const maxPrereqChain = Math.max(
    ...prerequisites.map(prereqId => calculateChainLength(prereqId, relationships, new Set(visited)))
  )
  
  return 1 + maxPrereqChain
}

// Analyze topical balance in the knowledge graph
function analyzeTopicalBalance(graph: KnowledgeGraph): {
  categoryDistribution: Record<string, number>
  mostCommonCategory: string
  leastCommonCategory: string
  balanceScore: number // 0-1, where 1 is perfectly balanced
} {
  const categoryDistribution: Record<string, number> = {}
  
  graph.nodes.forEach(node => {
    categoryDistribution[node.category] = (categoryDistribution[node.category] || 0) + 1
  })
  
  const categories = Object.keys(categoryDistribution)
  const counts = Object.values(categoryDistribution)
  
  const mostCommonCategory = categories[counts.indexOf(Math.max(...counts))]
  const leastCommonCategory = categories[counts.indexOf(Math.min(...counts))]
  
  // Calculate balance score (lower standard deviation = better balance)
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length
  const variance = counts.reduce((acc, count) => acc + Math.pow(count - mean, 2), 0) / counts.length
  const stdDev = Math.sqrt(variance)
  const balanceScore = Math.max(0, 1 - (stdDev / mean)) // Normalize to 0-1
  
  return {
    categoryDistribution,
    mostCommonCategory,
    leastCommonCategory,
    balanceScore
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Knowledge Graph Generator API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Knowledge graph generation and analysis',
        actions: [
          'generate',
          'get',
          'get_all',
          'search_concepts',
          'get_learning_paths',
          'get_dependencies',
          'analyze_gaps'
        ]
      }
    },
    capabilities: [
      'AI-Powered Concept Extraction',
      'Relationship Identification',
      'Learning Path Generation',
      'Knowledge Gap Analysis',
      'Prerequisite Chain Validation',
      'Difficulty Progression Optimization',
      'Multi-Path Learning Routes',
      'Topical Balance Analysis'
    ],
    supportedScopes: [
      'basic',
      'intermediate', 
      'advanced',
      'comprehensive'
    ],
    pathTypes: [
      'foundation_first',
      'application_driven',
      'balanced_approach'
    ],
    relationshipTypes: [
      'prerequisite',
      'builds_on',
      'related',
      'alternative',
      'complementary',
      'contradictory',
      'example_of',
      'generalizes'
    ]
  })
}