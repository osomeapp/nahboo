'use client'

import { multiModelAI } from './multi-model-ai'

// Core knowledge graph types
export interface ConceptNode {
  id: string
  name: string
  description: string
  category: string
  difficulty: number // 1-10 scale
  prerequisites: string[] // IDs of prerequisite concepts
  skills: string[] // Skills this concept helps develop
  estimatedLearningTime: number // minutes
  importance: number // 1-10 how critical this concept is
  metadata: {
    subject: string
    subfield?: string
    keywords: string[]
    learningObjectives: string[]
    assessmentMethods: string[]
    realWorldApplications: string[]
  }
}

export interface ConceptRelationship {
  id: string
  fromConceptId: string
  toConceptId: string
  type: RelationshipType
  strength: number // 0-1 how strong the relationship is
  description: string
  direction: 'bidirectional' | 'unidirectional'
}

export type RelationshipType = 
  | 'prerequisite' // A requires B first
  | 'builds_on' // A extends/enhances B
  | 'related' // A and B are topically related
  | 'alternative' // A and B are different approaches to same goal
  | 'complementary' // A and B work well together
  | 'contradictory' // A and B present opposing views
  | 'example_of' // A is a specific case of B
  | 'generalizes' // A is a broader concept than B

export interface KnowledgeGraph {
  subject: string
  domain: string
  nodes: ConceptNode[]
  relationships: ConceptRelationship[]
  metadata: {
    totalConcepts: number
    averageDifficulty: number
    estimatedCourseLength: number // total learning time in hours
    lastUpdated: Date
    coverage: string[] // areas covered
    gaps: string[] // identified knowledge gaps
  }
}

export interface LearningPath {
  id: string
  name: string
  description: string
  subject: string
  difficulty: string
  estimatedDuration: number // hours
  concepts: ConceptNode[]
  sequence: string[] // ordered concept IDs
  checkpoints: {
    conceptId: string
    assessmentType: string
    requiredMastery: number // 0-1
  }[]
  adaptationPoints: string[] // concepts where path can branch
}

export interface KnowledgeGap {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedConcepts: string[]
  suggestedSolutions: string[]
  priority: number
}

// AI-powered concept extraction and analysis
export class KnowledgeGraphGenerator {
  private concepts: Map<string, ConceptNode> = new Map()
  private relationships: Map<string, ConceptRelationship> = new Map()
  private graphs: Map<string, KnowledgeGraph> = new Map()

  // Generate comprehensive knowledge graph for a subject
  async generateKnowledgeGraph(
    subject: string,
    scope: 'basic' | 'intermediate' | 'advanced' | 'comprehensive' = 'comprehensive',
    targetAudience: string = 'general'
  ): Promise<KnowledgeGraph> {
    try {
      console.log(`Generating knowledge graph for ${subject} (${scope} level)`)

      // Step 1: Extract core concepts using AI
      const concepts = await this.extractConcepts(subject, scope, targetAudience)
      
      // Step 2: Identify relationships between concepts
      const relationships = await this.identifyRelationships(concepts)
      
      // Step 3: Validate and optimize the graph structure
      const optimizedGraph = await this.optimizeGraph(concepts, relationships)
      
      // Step 4: Generate metadata and analytics
      const metadata = this.generateGraphMetadata(optimizedGraph.concepts, optimizedGraph.relationships)
      
      // Step 5: Identify knowledge gaps and improvement opportunities
      const gaps = await this.identifyKnowledgeGaps(optimizedGraph.concepts, subject)

      const knowledgeGraph: KnowledgeGraph = {
        subject,
        domain: this.inferDomain(subject),
        nodes: optimizedGraph.concepts,
        relationships: optimizedGraph.relationships,
        metadata: {
          ...metadata,
          gaps: gaps.map(gap => gap.description)
        }
      }

      // Cache the generated graph
      this.graphs.set(subject, knowledgeGraph)
      
      return knowledgeGraph
    } catch (error) {
      console.error('Error generating knowledge graph:', error)
      throw new Error(`Failed to generate knowledge graph for ${subject}`)
    }
  }

  // Extract core concepts using AI analysis
  private async extractConcepts(
    subject: string,
    scope: string,
    targetAudience: string
  ): Promise<ConceptNode[]> {
    const prompt = `You are an expert curriculum designer and knowledge architect. 
    
    Generate a comprehensive list of core concepts for learning "${subject}" at ${scope} level for ${targetAudience} audience.
    
    For each concept, provide:
    1. Clear, precise name
    2. Detailed description (2-3 sentences)
    3. Category/subcategory
    4. Difficulty level (1-10 scale)
    5. Prerequisites (other concepts needed first)
    6. Skills developed by mastering this concept
    7. Estimated learning time in minutes
    8. Importance rating (1-10)
    9. Learning objectives
    10. Assessment methods
    11. Real-world applications
    
    Focus on concepts that are:
    - Fundamental to understanding the subject
    - Build logically on each other
    - Have clear learning outcomes
    - Connect to practical applications
    
    Return a JSON array of concept objects.`

    const response = await multiModelAI.generateContent({
      prompt,
      useCase: 'curriculum_design',
      options: {
        temperature: 0.3, // More structured output
        maxTokens: 4000
      }
    })

    try {
      const conceptsData = JSON.parse(response.content)
      const concepts: ConceptNode[] = conceptsData.map((concept: any, index: number) => ({
        id: `${subject.toLowerCase().replace(/\s+/g, '_')}_concept_${index + 1}`,
        name: concept.name,
        description: concept.description,
        category: concept.category || 'general',
        difficulty: Math.max(1, Math.min(10, concept.difficulty || 5)),
        prerequisites: concept.prerequisites || [],
        skills: concept.skills || [],
        estimatedLearningTime: Math.max(15, concept.estimatedLearningTime || 60),
        importance: Math.max(1, Math.min(10, concept.importance || 5)),
        metadata: {
          subject,
          subfield: concept.subfield,
          keywords: concept.keywords || [],
          learningObjectives: concept.learningObjectives || [],
          assessmentMethods: concept.assessmentMethods || ['quiz', 'assignment'],
          realWorldApplications: concept.realWorldApplications || []
        }
      }))

      // Cache concepts
      concepts.forEach(concept => {
        this.concepts.set(concept.id, concept)
      })

      return concepts
    } catch (error) {
      console.error('Error parsing AI response for concepts:', error)
      
      // Fallback to generated concepts if AI parsing fails
      return this.generateFallbackConcepts(subject, scope)
    }
  }

  // Identify relationships between concepts using AI
  private async identifyRelationships(concepts: ConceptNode[]): Promise<ConceptRelationship[]> {
    const conceptList = concepts.map(c => `${c.id}: ${c.name} - ${c.description}`).join('\n')
    
    const prompt = `Analyze the following concepts and identify relationships between them.
    
    CONCEPTS:
    ${conceptList}
    
    For each relationship, determine:
    1. Type: prerequisite, builds_on, related, alternative, complementary, contradictory, example_of, generalizes
    2. Strength (0-1): How strong is this relationship?
    3. Direction: bidirectional or unidirectional
    4. Description: Why these concepts are related
    
    Focus on relationships that:
    - Create logical learning progressions
    - Identify clear dependencies
    - Show conceptual connections
    - Enable effective learning paths
    
    Return a JSON array of relationship objects with fromConceptId, toConceptId, type, strength, direction, and description.`

    const response = await multiModelAI.generateContent({
      prompt,
      useCase: 'analysis',
      options: {
        temperature: 0.2,
        maxTokens: 3000
      }
    })

    try {
      const relationshipsData = JSON.parse(response.content)
      const relationships: ConceptRelationship[] = relationshipsData.map((rel: any, index: number) => ({
        id: `relationship_${index + 1}`,
        fromConceptId: rel.fromConceptId,
        toConceptId: rel.toConceptId,
        type: rel.type as RelationshipType,
        strength: Math.max(0, Math.min(1, rel.strength || 0.5)),
        description: rel.description,
        direction: rel.direction || 'unidirectional'
      }))

      return relationships.filter(rel => 
        concepts.some(c => c.id === rel.fromConceptId) && 
        concepts.some(c => c.id === rel.toConceptId)
      )
    } catch (error) {
      console.error('Error parsing AI response for relationships:', error)
      
      // Fallback to basic prerequisite relationships
      return this.generateFallbackRelationships(concepts)
    }
  }

  // Optimize graph structure for learning effectiveness
  private async optimizeGraph(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[]
  ): Promise<{ concepts: ConceptNode[], relationships: ConceptRelationship[] }> {
    // Remove circular dependencies
    const optimizedRelationships = this.removeCircularDependencies(relationships)
    
    // Validate prerequisite chains
    const validatedConcepts = this.validatePrerequisiteChains(concepts, optimizedRelationships)
    
    // Balance difficulty progression
    const balancedConcepts = this.balanceDifficultyProgression(validatedConcepts, optimizedRelationships)
    
    return {
      concepts: balancedConcepts,
      relationships: optimizedRelationships
    }
  }

  // Remove circular dependencies to ensure valid learning paths
  private removeCircularDependencies(relationships: ConceptRelationship[]): ConceptRelationship[] {
    const validRelationships: ConceptRelationship[] = []
    const graph = new Map<string, string[]>()
    
    // Build adjacency list
    relationships.forEach(rel => {
      if (rel.type === 'prerequisite') {
        if (!graph.has(rel.fromConceptId)) {
          graph.set(rel.fromConceptId, [])
        }
        graph.get(rel.fromConceptId)!.push(rel.toConceptId)
      }
    })
    
    // Check for cycles using DFS
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const hasCycle = (node: string): boolean => {
      visited.add(node)
      recursionStack.add(node)
      
      const neighbors = graph.get(node) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true
        } else if (recursionStack.has(neighbor)) {
          return true
        }
      }
      
      recursionStack.delete(node)
      return false
    }
    
    // Add relationships that don't create cycles
    for (const rel of relationships) {
      if (rel.type === 'prerequisite') {
        // Temporarily add this relationship and check for cycles
        if (!graph.has(rel.fromConceptId)) {
          graph.set(rel.fromConceptId, [])
        }
        graph.get(rel.fromConceptId)!.push(rel.toConceptId)
        
        // Check if this creates a cycle
        visited.clear()
        recursionStack.clear()
        
        let createsCycle = false
        for (const node of graph.keys()) {
          if (!visited.has(node)) {
            if (hasCycle(node)) {
              createsCycle = true
              break
            }
          }
        }
        
        if (createsCycle) {
          // Remove the relationship that creates the cycle
          graph.get(rel.fromConceptId)!.pop()
        } else {
          validRelationships.push(rel)
        }
      } else {
        // Non-prerequisite relationships don't affect cycles
        validRelationships.push(rel)
      }
    }
    
    return validRelationships
  }

  // Validate and fix prerequisite chains
  private validatePrerequisiteChains(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[]
  ): ConceptNode[] {
    const conceptMap = new Map(concepts.map(c => [c.id, c]))
    const prerequisiteMap = new Map<string, string[]>()
    
    // Build prerequisite map from relationships
    relationships
      .filter(rel => rel.type === 'prerequisite')
      .forEach(rel => {
        if (!prerequisiteMap.has(rel.fromConceptId)) {
          prerequisiteMap.set(rel.fromConceptId, [])
        }
        prerequisiteMap.get(rel.fromConceptId)!.push(rel.toConceptId)
      })
    
    // Update concept prerequisites based on validated relationships
    return concepts.map(concept => {
      const validPrerequisites = prerequisiteMap.get(concept.id) || []
      
      return {
        ...concept,
        prerequisites: validPrerequisites
      }
    })
  }

  // Balance difficulty progression for smooth learning
  private balanceDifficultyProgression(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[]
  ): ConceptNode[] {
    const conceptMap = new Map(concepts.map(c => [c.id, c]))
    const adjustedConcepts = [...concepts]
    
    // Ensure prerequisites have lower difficulty than dependent concepts
    relationships
      .filter(rel => rel.type === 'prerequisite')
      .forEach(rel => {
        const fromConcept = conceptMap.get(rel.fromConceptId)
        const toConcept = conceptMap.get(rel.toConceptId)
        
        if (fromConcept && toConcept) {
          // Prerequisite should be easier than dependent concept
          if (toConcept.difficulty >= fromConcept.difficulty) {
            const fromIndex = adjustedConcepts.findIndex(c => c.id === fromConcept.id)
            if (fromIndex !== -1) {
              adjustedConcepts[fromIndex] = {
                ...fromConcept,
                difficulty: Math.max(1, toConcept.difficulty - 1)
              }
            }
          }
        }
      })
    
    return adjustedConcepts
  }

  // Generate comprehensive metadata for the knowledge graph
  private generateGraphMetadata(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[]
  ) {
    const totalConcepts = concepts.length
    const averageDifficulty = concepts.reduce((sum, c) => sum + c.difficulty, 0) / totalConcepts
    const estimatedCourseLength = Math.round(concepts.reduce((sum, c) => sum + c.estimatedLearningTime, 0) / 60) // hours
    
    // Identify coverage areas
    const coverage = [...new Set(concepts.map(c => c.category))]
    
    return {
      totalConcepts,
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      estimatedCourseLength,
      lastUpdated: new Date(),
      coverage
    }
  }

  // Identify knowledge gaps and improvement opportunities
  private async identifyKnowledgeGaps(
    concepts: ConceptNode[],
    subject: string
  ): Promise<KnowledgeGap[]> {
    const conceptNames = concepts.map(c => c.name).join(', ')
    
    const prompt = `Analyze this curriculum for "${subject}" and identify knowledge gaps or missing concepts.
    
    CURRENT CONCEPTS: ${conceptNames}
    
    Identify:
    1. Important concepts that are missing
    2. Areas that need more depth
    3. Practical applications that should be included
    4. Assessment opportunities that are lacking
    5. Skills that aren't adequately covered
    
    For each gap, provide:
    - Description of what's missing
    - Severity level (low/medium/high/critical)
    - Which current concepts would be affected
    - Suggested solutions
    - Priority for addressing (1-10)
    
    Return a JSON array of gap objects.`

    try {
      const response = await multiModelAI.generateContent({
        prompt,
        useCase: 'analysis',
        options: {
          temperature: 0.3,
          maxTokens: 2000
        }
      })

      const gapsData = JSON.parse(response.content)
      return gapsData.map((gap: any, index: number) => ({
        id: `gap_${index + 1}`,
        description: gap.description,
        severity: gap.severity || 'medium',
        affectedConcepts: gap.affectedConcepts || [],
        suggestedSolutions: gap.suggestedSolutions || [],
        priority: gap.priority || 5
      }))
    } catch (error) {
      console.error('Error identifying knowledge gaps:', error)
      return []
    }
  }

  // Generate optimal learning paths through the knowledge graph
  generateLearningPaths(
    graph: KnowledgeGraph,
    targetDifficulty: string = 'intermediate',
    maxDuration: number = 40 // hours
  ): LearningPath[] {
    const difficultyMap = {
      'beginner': [1, 4],
      'intermediate': [3, 7],
      'advanced': [6, 10]
    }
    
    const [minDiff, maxDiff] = difficultyMap[targetDifficulty as keyof typeof difficultyMap] || [1, 10]
    
    // Filter concepts by difficulty
    const relevantConcepts = graph.nodes.filter(concept => 
      concept.difficulty >= minDiff && concept.difficulty <= maxDiff
    )
    
    // Generate multiple learning paths with different emphases
    const paths: LearningPath[] = []
    
    // Path 1: Foundation-first (prerequisites first)
    paths.push(this.generateFoundationFirstPath(relevantConcepts, graph.relationships, maxDuration))
    
    // Path 2: Application-driven (practical concepts first)
    paths.push(this.generateApplicationDrivenPath(relevantConcepts, graph.relationships, maxDuration))
    
    // Path 3: Balanced approach
    paths.push(this.generateBalancedPath(relevantConcepts, graph.relationships, maxDuration))
    
    return paths.filter(path => path.concepts.length > 0)
  }

  // Generate foundation-first learning path
  private generateFoundationFirstPath(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[],
    maxDuration: number
  ): LearningPath {
    const sortedConcepts = this.topologicalSort(concepts, relationships)
    const selectedConcepts = this.selectConceptsWithinDuration(sortedConcepts, maxDuration)
    
    return {
      id: 'foundation_first',
      name: 'Foundation-First Learning Path',
      description: 'Master fundamental concepts before moving to advanced topics',
      subject: concepts[0]?.metadata.subject || 'Unknown',
      difficulty: this.inferPathDifficulty(selectedConcepts),
      estimatedDuration: this.calculatePathDuration(selectedConcepts),
      concepts: selectedConcepts,
      sequence: selectedConcepts.map(c => c.id),
      checkpoints: this.generateCheckpoints(selectedConcepts),
      adaptationPoints: this.identifyAdaptationPoints(selectedConcepts, relationships)
    }
  }

  // Generate application-driven learning path
  private generateApplicationDrivenPath(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[],
    maxDuration: number
  ): LearningPath {
    // Sort by real-world applications and importance
    const sortedConcepts = concepts.sort((a, b) => {
      const aScore = a.metadata.realWorldApplications.length * a.importance
      const bScore = b.metadata.realWorldApplications.length * b.importance
      return bScore - aScore
    })
    
    const selectedConcepts = this.selectConceptsWithinDuration(sortedConcepts, maxDuration)
    
    return {
      id: 'application_driven',
      name: 'Application-Driven Learning Path',
      description: 'Learn through practical applications and real-world examples',
      subject: concepts[0]?.metadata.subject || 'Unknown',
      difficulty: this.inferPathDifficulty(selectedConcepts),
      estimatedDuration: this.calculatePathDuration(selectedConcepts),
      concepts: selectedConcepts,
      sequence: selectedConcepts.map(c => c.id),
      checkpoints: this.generateCheckpoints(selectedConcepts),
      adaptationPoints: this.identifyAdaptationPoints(selectedConcepts, relationships)
    }
  }

  // Generate balanced learning path
  private generateBalancedPath(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[],
    maxDuration: number
  ): LearningPath {
    // Balance between difficulty progression and practical relevance
    const sortedConcepts = concepts.sort((a, b) => {
      const aScore = (a.importance * 0.4) + (a.metadata.realWorldApplications.length * 0.3) + ((10 - a.difficulty) * 0.3)
      const bScore = (b.importance * 0.4) + (b.metadata.realWorldApplications.length * 0.3) + ((10 - b.difficulty) * 0.3)
      return bScore - aScore
    })
    
    const selectedConcepts = this.selectConceptsWithinDuration(sortedConcepts, maxDuration)
    
    return {
      id: 'balanced_approach',
      name: 'Balanced Learning Path',
      description: 'Optimal balance of theory, practice, and difficulty progression',
      subject: concepts[0]?.metadata.subject || 'Unknown',
      difficulty: this.inferPathDifficulty(selectedConcepts),
      estimatedDuration: this.calculatePathDuration(selectedConcepts),
      concepts: selectedConcepts,
      sequence: selectedConcepts.map(c => c.id),
      checkpoints: this.generateCheckpoints(selectedConcepts),
      adaptationPoints: this.identifyAdaptationPoints(selectedConcepts, relationships)
    }
  }

  // Topological sort for prerequisite ordering
  private topologicalSort(concepts: ConceptNode[], relationships: ConceptRelationship[]): ConceptNode[] {
    const conceptMap = new Map(concepts.map(c => [c.id, c]))
    const inDegree = new Map<string, number>()
    const graph = new Map<string, string[]>()
    
    // Initialize
    concepts.forEach(concept => {
      inDegree.set(concept.id, 0)
      graph.set(concept.id, [])
    })
    
    // Build graph and calculate in-degrees
    relationships
      .filter(rel => rel.type === 'prerequisite')
      .forEach(rel => {
        graph.get(rel.toConceptId)?.push(rel.fromConceptId)
        inDegree.set(rel.fromConceptId, (inDegree.get(rel.fromConceptId) || 0) + 1)
      })
    
    // Kahn's algorithm
    const queue: string[] = []
    const result: ConceptNode[] = []
    
    // Find all nodes with no incoming edges
    inDegree.forEach((degree, conceptId) => {
      if (degree === 0) {
        queue.push(conceptId)
      }
    })
    
    while (queue.length > 0) {
      const currentId = queue.shift()!
      const currentConcept = conceptMap.get(currentId)
      
      if (currentConcept) {
        result.push(currentConcept)
        
        // Reduce in-degree for dependent concepts
        const dependents = graph.get(currentId) || []
        dependents.forEach(dependentId => {
          const newDegree = (inDegree.get(dependentId) || 0) - 1
          inDegree.set(dependentId, newDegree)
          
          if (newDegree === 0) {
            queue.push(dependentId)
          }
        })
      }
    }
    
    return result
  }

  // Select concepts that fit within duration limit
  private selectConceptsWithinDuration(concepts: ConceptNode[], maxDurationHours: number): ConceptNode[] {
    const maxMinutes = maxDurationHours * 60
    let totalTime = 0
    const selected: ConceptNode[] = []
    
    for (const concept of concepts) {
      if (totalTime + concept.estimatedLearningTime <= maxMinutes) {
        selected.push(concept)
        totalTime += concept.estimatedLearningTime
      }
    }
    
    return selected
  }

  // Calculate total duration for a path
  private calculatePathDuration(concepts: ConceptNode[]): number {
    const totalMinutes = concepts.reduce((sum, concept) => sum + concept.estimatedLearningTime, 0)
    return Math.round(totalMinutes / 60 * 10) / 10 // hours, rounded to 1 decimal
  }

  // Infer difficulty level for a path
  private inferPathDifficulty(concepts: ConceptNode[]): string {
    if (concepts.length === 0) return 'beginner'
    
    const avgDifficulty = concepts.reduce((sum, c) => sum + c.difficulty, 0) / concepts.length
    
    if (avgDifficulty <= 3) return 'beginner'
    if (avgDifficulty <= 7) return 'intermediate'
    return 'advanced'
  }

  // Generate checkpoints for assessment
  private generateCheckpoints(concepts: ConceptNode[]) {
    return concepts
      .filter((_, index) => index % 3 === 2) // Every 3rd concept
      .map(concept => ({
        conceptId: concept.id,
        assessmentType: concept.metadata.assessmentMethods[0] || 'quiz',
        requiredMastery: 0.7 // 70% mastery required
      }))
  }

  // Identify points where learning paths can adapt
  private identifyAdaptationPoints(
    concepts: ConceptNode[],
    relationships: ConceptRelationship[]
  ): string[] {
    // Concepts with multiple paths forward are good adaptation points
    const conceptsWithChoices = concepts.filter(concept => {
      const nextConcepts = relationships
        .filter(rel => rel.fromConceptId === concept.id && rel.type === 'prerequisite')
        .length
      return nextConcepts > 1
    })
    
    return conceptsWithChoices.map(c => c.id)
  }

  // Utility methods
  private inferDomain(subject: string): string {
    const domainMap: Record<string, string> = {
      'mathematics': 'STEM',
      'physics': 'STEM',
      'chemistry': 'STEM',
      'biology': 'STEM',
      'computer science': 'STEM',
      'programming': 'STEM',
      'history': 'Social Studies',
      'geography': 'Social Studies',
      'literature': 'Humanities',
      'language': 'Humanities',
      'art': 'Arts',
      'music': 'Arts',
      'business': 'Business',
      'economics': 'Business'
    }
    
    const lowerSubject = subject.toLowerCase()
    for (const [key, domain] of Object.entries(domainMap)) {
      if (lowerSubject.includes(key)) {
        return domain
      }
    }
    
    return 'General'
  }

  // Fallback methods for when AI analysis fails
  private generateFallbackConcepts(subject: string, scope: string): ConceptNode[] {
    const basicConcepts = [
      'Introduction and Overview',
      'Basic Terminology',
      'Fundamental Principles',
      'Core Concepts',
      'Practical Applications',
      'Advanced Topics',
      'Integration and Synthesis',
      'Assessment and Review'
    ]
    
    return basicConcepts.map((name, index) => ({
      id: `${subject.toLowerCase().replace(/\s+/g, '_')}_concept_${index + 1}`,
      name,
      description: `${name} for ${subject}`,
      category: 'general',
      difficulty: Math.min(index + 1, 8),
      prerequisites: index > 0 ? [`${subject.toLowerCase().replace(/\s+/g, '_')}_concept_${index}`] : [],
      skills: [`${name.toLowerCase()} skills`],
      estimatedLearningTime: 60,
      importance: Math.max(8 - index, 1),
      metadata: {
        subject,
        keywords: [name.toLowerCase()],
        learningObjectives: [`Understand ${name.toLowerCase()}`],
        assessmentMethods: ['quiz'],
        realWorldApplications: [`Applied ${name.toLowerCase()}`]
      }
    }))
  }

  private generateFallbackRelationships(concepts: ConceptNode[]): ConceptRelationship[] {
    const relationships: ConceptRelationship[] = []
    
    // Create simple prerequisite chain
    for (let i = 0; i < concepts.length - 1; i++) {
      relationships.push({
        id: `relationship_${i + 1}`,
        fromConceptId: concepts[i + 1].id,
        toConceptId: concepts[i].id,
        type: 'prerequisite',
        strength: 0.8,
        description: `${concepts[i + 1].name} builds upon ${concepts[i].name}`,
        direction: 'unidirectional'
      })
    }
    
    return relationships
  }

  // Public API methods
  getKnowledgeGraph(subject: string): KnowledgeGraph | null {
    return this.graphs.get(subject) || null
  }

  getAllKnowledgeGraphs(): KnowledgeGraph[] {
    return Array.from(this.graphs.values())
  }

  // Search concepts across all graphs
  searchConcepts(query: string): ConceptNode[] {
    const results: ConceptNode[] = []
    const queryLower = query.toLowerCase()
    
    this.concepts.forEach(concept => {
      if (
        concept.name.toLowerCase().includes(queryLower) ||
        concept.description.toLowerCase().includes(queryLower) ||
        concept.metadata.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))
      ) {
        results.push(concept)
      }
    })
    
    return results
  }

  // Get concept dependencies
  getConceptDependencies(conceptId: string): ConceptNode[] {
    const dependencies: ConceptNode[] = []
    
    this.relationships.forEach(rel => {
      if (rel.fromConceptId === conceptId && rel.type === 'prerequisite') {
        const dependency = this.concepts.get(rel.toConceptId)
        if (dependency) {
          dependencies.push(dependency)
        }
      }
    })
    
    return dependencies
  }
}

// Create and export singleton instance
export const knowledgeGraphGenerator = new KnowledgeGraphGenerator()