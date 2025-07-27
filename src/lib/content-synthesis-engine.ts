'use client'

import { multiModelAI } from './multi-model-ai'

// Types for content synthesis system
export interface ContentSource {
  source_id: string
  type: 'textbook' | 'research_paper' | 'wiki' | 'video_transcript' | 'course_material' | 'documentation' | 'blog_post' | 'tutorial' | 'forum_discussion' | 'expert_interview'
  url?: string
  content: string
  metadata: {
    title: string
    author?: string
    publication_date?: string
    credibility_score: number  // 0-1 score
    academic_level: 'elementary' | 'middle_school' | 'high_school' | 'undergraduate' | 'graduate' | 'expert'
    subject_domain: string
    language: string
    word_count: number
    last_updated?: string
  }
  quality_metrics: {
    factual_accuracy: number    // 0-1 score
    source_reliability: number  // 0-1 score
    content_depth: number      // 0-1 score
    clarity_score: number      // 0-1 score
    bias_score: number         // 0-1 score (0 = highly biased, 1 = unbiased)
  }
}

export interface SynthesisRequest {
  topic: string
  learning_objectives: string[]
  target_audience: {
    age_group: 'child' | 'teen' | 'adult'
    academic_level: 'beginner' | 'intermediate' | 'advanced'
    subject_background: string[]
    learning_preferences: string[]
  }
  content_requirements: {
    desired_length: 'brief' | 'moderate' | 'comprehensive' | 'detailed'
    format_preferences: ('text' | 'bullet_points' | 'examples' | 'analogies' | 'case_studies' | 'step_by_step')[]
    include_citations: boolean
    academic_rigor: 'casual' | 'educational' | 'academic' | 'scholarly'
    complexity_level: number  // 1-10 scale
  }
  synthesis_parameters: {
    source_diversity_weight: number      // How much to weight diverse sources
    recency_weight: number              // How much to favor recent content
    authority_weight: number            // How much to weight authoritative sources
    consensus_weight: number            // How much to favor consensus information
    novelty_weight: number              // How much to include cutting-edge information
    max_source_count: number            // Maximum sources to synthesize from
  }
}

export interface SynthesizedContent {
  synthesis_id: string
  topic: string
  content: {
    main_text: string
    key_concepts: Array<{
      concept: string
      definition: string
      importance: number
      examples: string[]
    }>
    summary_points: string[]
    learning_takeaways: string[]
    practical_applications: string[]
    common_misconceptions: Array<{
      misconception: string
      correction: string
      explanation: string
    }>
    related_topics: string[]
    further_reading: Array<{
      title: string
      url?: string
      description: string
      difficulty_level: string
    }>
  }
  source_analysis: {
    sources_used: string[]
    source_distribution: Record<string, number>
    consensus_areas: string[]
    conflicting_information: Array<{
      topic: string
      perspectives: Array<{
        source_id: string
        viewpoint: string
        evidence: string
      }>
      synthesis_approach: string
    }>
    information_gaps: string[]
    reliability_assessment: {
      overall_confidence: number
      evidence_strength: number
      source_quality: number
      factual_consistency: number
    }
  }
  synthesis_metadata: {
    created_at: Date
    processing_time: number
    word_count: number
    reading_time_minutes: number
    complexity_score: number
    originality_score: number
    sources_synthesized: number
    ai_models_used: string[]
    synthesis_approach: string
  }
  quality_metrics: {
    coherence_score: number
    completeness_score: number
    accuracy_confidence: number
    pedagogical_effectiveness: number
    engagement_potential: number
  }
}

export interface ConceptNetwork {
  concept_id: string
  concept_name: string
  definition: string
  connections: Array<{
    connected_concept: string
    relationship_type: 'prerequisite' | 'enables' | 'related_to' | 'contrasts_with' | 'builds_on' | 'applies_to'
    strength: number
    explanation: string
  }>
  learning_pathways: Array<{
    pathway_id: string
    sequence: string[]
    difficulty_progression: number[]
    estimated_learning_time: number
  }>
}

export interface SynthesisProgress {
  stage: 'source_analysis' | 'content_extraction' | 'synthesis' | 'quality_check' | 'finalization'
  progress_percentage: number
  current_activity: string
  sources_processed: number
  total_sources: number
  estimated_completion_time: number
}

// Main Content Synthesis Engine
export class ContentSynthesisEngine {
  private synthesisCache = new Map<string, SynthesizedContent>()
  private sourceCache = new Map<string, ContentSource>()
  private conceptNetworks = new Map<string, ConceptNetwork[]>()
  
  // Synthesize content from multiple sources
  async synthesizeContent(
    sources: ContentSource[],
    request: SynthesisRequest,
    progressCallback?: (progress: SynthesisProgress) => void
  ): Promise<SynthesizedContent> {
    const startTime = Date.now()
    
    // Generate unique synthesis ID
    const synthesisId = `synthesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Stage 1: Source Analysis and Filtering
      progressCallback?.({
        stage: 'source_analysis',
        progress_percentage: 10,
        current_activity: 'Analyzing and filtering sources',
        sources_processed: 0,
        total_sources: sources.length,
        estimated_completion_time: 30000
      })
      
      const filteredSources = await this.analyzeAndFilterSources(sources, request)
      
      // Stage 2: Content Extraction
      progressCallback?.({
        stage: 'content_extraction',
        progress_percentage: 30,
        current_activity: 'Extracting and processing content',
        sources_processed: 0,
        total_sources: filteredSources.length,
        estimated_completion_time: 25000
      })
      
      const extractedContent = await this.extractContentElements(filteredSources, request)
      
      // Stage 3: AI-Powered Synthesis
      progressCallback?.({
        stage: 'synthesis',
        progress_percentage: 60,
        current_activity: 'AI synthesis and content generation',
        sources_processed: filteredSources.length,
        total_sources: filteredSources.length,
        estimated_completion_time: 15000
      })
      
      const synthesizedContent = await this.performAISynthesis(extractedContent, request)
      
      // Stage 4: Quality Check and Validation
      progressCallback?.({
        stage: 'quality_check',
        progress_percentage: 85,
        current_activity: 'Quality validation and fact checking',
        sources_processed: filteredSources.length,
        total_sources: filteredSources.length,
        estimated_completion_time: 8000
      })
      
      const qualityMetrics = await this.validateSynthesisQuality(synthesizedContent, filteredSources)
      
      // Stage 5: Finalization
      progressCallback?.({
        stage: 'finalization',
        progress_percentage: 95,
        current_activity: 'Finalizing synthesis',
        sources_processed: filteredSources.length,
        total_sources: filteredSources.length,
        estimated_completion_time: 2000
      })
      
      const finalContent = await this.finalizeSynthesis(
        synthesisId,
        synthesizedContent,
        filteredSources,
        request,
        qualityMetrics,
        Date.now() - startTime
      )
      
      // Cache the result
      this.synthesisCache.set(synthesisId, finalContent)
      
      progressCallback?.({
        stage: 'finalization',
        progress_percentage: 100,
        current_activity: 'Synthesis complete',
        sources_processed: filteredSources.length,
        total_sources: filteredSources.length,
        estimated_completion_time: 0
      })
      
      return finalContent
      
    } catch (error) {
      console.error('Content synthesis failed:', error)
      throw new Error(`Failed to synthesize content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // Analyze and filter sources based on quality and relevance
  private async analyzeAndFilterSources(
    sources: ContentSource[],
    request: SynthesisRequest
  ): Promise<ContentSource[]> {
    const analysisPrompt = `
      Analyze these sources for a content synthesis request about "${request.topic}".
      
      Learning objectives: ${request.learning_objectives.join(', ')}
      Target audience: ${request.target_audience.academic_level} level, ${request.target_audience.age_group}
      
      For each source, evaluate:
      1. Relevance to the topic (0-1)
      2. Quality and reliability (0-1)
      3. Appropriateness for target audience (0-1)
      4. Uniqueness of information (0-1)
      
      Return a JSON array of source evaluations with scores and filtering recommendations.
    `
    
    try {
      const evaluation = await multiModelAI.generateContent(
        analysisPrompt + '\n\nSources:\n' + sources.map(s => 
          `${s.source_id}: ${s.metadata.title} (${s.type}, ${s.metadata.academic_level})`
        ).join('\n'),
        'content_analysis',
        { temperature: 0.3 }
      )
      
      // Parse AI evaluation and apply filtering logic
      const sourceScores = this.parseSourceEvaluation(evaluation)
      
      // Apply synthesis parameters to filter sources
      const scoredSources = sources.map((source, index) => {
        const scores = sourceScores[index] || { relevance: 0.5, quality: 0.5, appropriateness: 0.5, uniqueness: 0.5 }
        const compositeScore = this.calculateCompositeScore(source, scores, request.synthesis_parameters)
        
        return { source, compositeScore, scores }
      })
      
      // Sort by composite score and take top sources
      const filteredSources = scoredSources
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, request.synthesis_parameters.max_source_count)
        .map(item => item.source)
      
      return filteredSources
      
    } catch (error) {
      console.error('Source analysis failed:', error)
      // Fallback: basic filtering by credibility score
      return sources
        .filter(s => s.metadata.credibility_score > 0.6)
        .slice(0, request.synthesis_parameters.max_source_count)
    }
  }
  
  // Extract key content elements from sources
  private async extractContentElements(
    sources: ContentSource[],
    request: SynthesisRequest
  ): Promise<{
    concepts: Array<{ concept: string, definitions: string[], examples: string[], sources: string[] }>
    facts: Array<{ fact: string, evidence: string[], confidence: number, sources: string[] }>
    procedures: Array<{ procedure: string, steps: string[], applications: string[], sources: string[] }>
    examples: Array<{ example: string, context: string, learning_value: number, sources: string[] }>
    perspectives: Array<{ viewpoint: string, reasoning: string, evidence: string[], sources: string[] }>
  }> {
    const extractionPrompt = `
      Extract key learning elements from these sources for the topic "${request.topic}".
      
      Target: ${request.target_audience.academic_level} level content
      Objectives: ${request.learning_objectives.join(', ')}
      
      Extract and categorize:
      1. Core concepts with clear definitions
      2. Important facts with supporting evidence
      3. Procedures, processes, or methodologies
      4. Illustrative examples and case studies
      5. Different perspectives or approaches
      
      Focus on information that directly serves the learning objectives.
      Return structured JSON with the extracted elements.
    `
    
    try {
      const extractionResult = await multiModelAI.generateContent(
        extractionPrompt + '\n\nSources:\n' + sources.map(s => 
          `Source ${s.source_id}: ${s.content.substring(0, 1000)}...`
        ).join('\n\n'),
        'content_analysis',
        { temperature: 0.2 }
      )
      
      return this.parseContentExtraction(extractionResult, sources)
      
    } catch (error) {
      console.error('Content extraction failed:', error)
      
      // Fallback: basic extraction
      return {
        concepts: [],
        facts: [],
        procedures: [],
        examples: [],
        perspectives: []
      }
    }
  }
  
  // Perform AI-powered content synthesis
  private async performAISynthesis(
    extractedContent: any,
    request: SynthesisRequest
  ): Promise<any> {
    const synthesisPrompt = `
      Synthesize comprehensive learning content about "${request.topic}" using the extracted information.
      
      Learning Objectives:
      ${request.learning_objectives.map(obj => `- ${obj}`).join('\n')}
      
      Target Audience:
      - Academic Level: ${request.target_audience.academic_level}
      - Age Group: ${request.target_audience.age_group}
      - Background: ${request.target_audience.subject_background.join(', ')}
      
      Content Requirements:
      - Length: ${request.content_requirements.desired_length}
      - Format: ${request.content_requirements.format_preferences.join(', ')}
      - Academic Rigor: ${request.content_requirements.academic_rigor}
      - Complexity: ${request.content_requirements.complexity_level}/10
      
      Create a well-structured, coherent synthesis that:
      1. Addresses all learning objectives
      2. Integrates information from multiple sources seamlessly
      3. Presents concepts in logical progression
      4. Includes practical examples and applications
      5. Clarifies any conflicting information
      6. Highlights key takeaways
      7. Suggests related topics for further exploration
      
      Extracted Content:
      Concepts: ${JSON.stringify(extractedContent.concepts)}
      Facts: ${JSON.stringify(extractedContent.facts)}
      Procedures: ${JSON.stringify(extractedContent.procedures)}
      Examples: ${JSON.stringify(extractedContent.examples)}
      Perspectives: ${JSON.stringify(extractedContent.perspectives)}
    `
    
    try {
      const synthesizedContent = await multiModelAI.generateContent(
        synthesisPrompt,
        'content_generation',
        { temperature: 0.4 }
      )
      
      return this.parseSynthesizedContent(synthesizedContent)
      
    } catch (error) {
      console.error('AI synthesis failed:', error)
      throw new Error('Content synthesis failed')
    }
  }
  
  // Validate synthesis quality
  private async validateSynthesisQuality(
    content: any,
    sources: ContentSource[]
  ): Promise<{
    coherence_score: number
    completeness_score: number
    accuracy_confidence: number
    pedagogical_effectiveness: number
    engagement_potential: number
  }> {
    const validationPrompt = `
      Evaluate the quality of this synthesized content across multiple dimensions:
      
      1. Coherence (0-1): How well does the content flow logically?
      2. Completeness (0-1): How thoroughly does it cover the topic?
      3. Accuracy (0-1): How confident are you in the factual accuracy?
      4. Pedagogical Effectiveness (0-1): How well does it serve learning goals?
      5. Engagement (0-1): How engaging and accessible is the content?
      
      Content to evaluate:
      ${JSON.stringify(content).substring(0, 2000)}...
      
      Return scores as JSON object with explanations.
    `
    
    try {
      const validation = await multiModelAI.generateContent(
        validationPrompt,
        'content_analysis',
        { temperature: 0.2 }
      )
      
      return this.parseQualityMetrics(validation)
      
    } catch (error) {
      console.error('Quality validation failed:', error)
      
      // Return default moderate scores
      return {
        coherence_score: 0.7,
        completeness_score: 0.7,
        accuracy_confidence: 0.7,
        pedagogical_effectiveness: 0.7,
        engagement_potential: 0.7
      }
    }
  }
  
  // Finalize synthesis with metadata
  private async finalizeSynthesis(
    synthesisId: string,
    content: any,
    sources: ContentSource[],
    request: SynthesisRequest,
    qualityMetrics: any,
    processingTime: number
  ): Promise<SynthesizedContent> {
    return {
      synthesis_id: synthesisId,
      topic: request.topic,
      content,
      source_analysis: {
        sources_used: sources.map(s => s.source_id),
        source_distribution: this.calculateSourceDistribution(sources),
        consensus_areas: this.identifyConsensusAreas(content, sources),
        conflicting_information: this.identifyConflicts(content, sources),
        information_gaps: this.identifyGaps(content, request.learning_objectives),
        reliability_assessment: {
          overall_confidence: this.calculateOverallConfidence(sources),
          evidence_strength: this.calculateEvidenceStrength(sources),
          source_quality: this.calculateSourceQuality(sources),
          factual_consistency: qualityMetrics.accuracy_confidence
        }
      },
      synthesis_metadata: {
        created_at: new Date(),
        processing_time: processingTime,
        word_count: this.countWords(content.main_text),
        reading_time_minutes: Math.ceil(this.countWords(content.main_text) / 200),
        complexity_score: request.content_requirements.complexity_level / 10,
        originality_score: this.calculateOriginalityScore(content, sources),
        sources_synthesized: sources.length,
        ai_models_used: ['multi-model-ai'],
        synthesis_approach: 'multi-source-ai-synthesis'
      },
      quality_metrics: qualityMetrics
    }
  }
  
  // Generate concept networks from synthesized content
  async generateConceptNetwork(synthesizedContent: SynthesizedContent): Promise<ConceptNetwork[]> {
    const networkPrompt = `
      Create a concept network from this synthesized content about "${synthesizedContent.topic}".
      
      Identify the main concepts and their relationships:
      1. Core concepts with clear definitions
      2. Prerequisite relationships (A must be learned before B)
      3. Enabling relationships (A helps understand B)
      4. Contrasting relationships (A differs from B)
      5. Application relationships (A applies to B)
      
      For each concept, suggest learning pathways with progressive difficulty.
      
      Content: ${JSON.stringify(synthesizedContent.content).substring(0, 1500)}
    `
    
    try {
      const networkData = await multiModelAI.generateContent(
        networkPrompt,
        'knowledge_structuring',
        { temperature: 0.3 }
      )
      
      const conceptNetworks = this.parseConceptNetwork(networkData, synthesizedContent.topic)
      this.conceptNetworks.set(synthesizedContent.synthesis_id, conceptNetworks)
      
      return conceptNetworks
      
    } catch (error) {
      console.error('Concept network generation failed:', error)
      return []
    }
  }
  
  // Incremental content updates
  async updateSynthesis(
    synthesisId: string,
    newSources: ContentSource[],
    updateType: 'expand' | 'refine' | 'update_facts' | 'add_perspectives'
  ): Promise<SynthesizedContent> {
    const existingSynthesis = this.synthesisCache.get(synthesisId)
    if (!existingSynthesis) {
      throw new Error(`Synthesis ${synthesisId} not found`)
    }
    
    const updatePrompt = `
      Update the existing synthesis with new information.
      Update type: ${updateType}
      
      Current synthesis: ${JSON.stringify(existingSynthesis.content).substring(0, 1000)}
      
      New sources: ${newSources.map(s => `${s.metadata.title}: ${s.content.substring(0, 500)}`).join('\n\n')}
      
      ${updateType === 'expand' ? 'Expand the content with additional depth and detail.' :
        updateType === 'refine' ? 'Refine clarity and organization.' :
        updateType === 'update_facts' ? 'Update with new factual information.' :
        'Add new perspectives and viewpoints.'}
    `
    
    try {
      const updatedContent = await multiModelAI.generateContent(
        updatePrompt,
        'content_generation',
        { temperature: 0.3 }
      )
      
      const updatedSynthesis = {
        ...existingSynthesis,
        content: this.parseSynthesizedContent(updatedContent),
        synthesis_metadata: {
          ...existingSynthesis.synthesis_metadata,
          last_updated: new Date(),
          sources_synthesized: existingSynthesis.synthesis_metadata.sources_synthesized + newSources.length
        }
      }
      
      this.synthesisCache.set(synthesisId, updatedSynthesis)
      return updatedSynthesis
      
    } catch (error) {
      console.error('Synthesis update failed:', error)
      throw new Error('Failed to update synthesis')
    }
  }
  
  // Content adaptation for different audiences
  async adaptSynthesisForAudience(
    synthesisId: string,
    newAudience: SynthesisRequest['target_audience']
  ): Promise<SynthesizedContent> {
    const existingSynthesis = this.synthesisCache.get(synthesisId)
    if (!existingSynthesis) {
      throw new Error(`Synthesis ${synthesisId} not found`)
    }
    
    const adaptationPrompt = `
      Adapt this content for a new target audience:
      
      Original content: ${JSON.stringify(existingSynthesis.content)}
      
      New audience:
      - Academic Level: ${newAudience.academic_level}
      - Age Group: ${newAudience.age_group}
      - Background: ${newAudience.subject_background.join(', ')}
      - Learning Preferences: ${newAudience.learning_preferences.join(', ')}
      
      Adapt the language, examples, complexity, and presentation style while maintaining accuracy.
    `
    
    try {
      const adaptedContent = await multiModelAI.generateContent(
        adaptationPrompt,
        'content_adaptation',
        { temperature: 0.4 }
      )
      
      const adaptedSynthesis = {
        ...existingSynthesis,
        synthesis_id: `${synthesisId}_adapted_${Date.now()}`,
        content: this.parseSynthesizedContent(adaptedContent),
        synthesis_metadata: {
          ...existingSynthesis.synthesis_metadata,
          created_at: new Date(),
          adaptation_source: synthesisId
        }
      }
      
      this.synthesisCache.set(adaptedSynthesis.synthesis_id, adaptedSynthesis)
      return adaptedSynthesis
      
    } catch (error) {
      console.error('Content adaptation failed:', error)
      throw new Error('Failed to adapt content')
    }
  }
  
  // Utility methods
  private parseSourceEvaluation(evaluation: string): Array<{
    relevance: number
    quality: number
    appropriateness: number
    uniqueness: number
  }> {
    try {
      const parsed = JSON.parse(evaluation)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  
  private calculateCompositeScore(
    source: ContentSource,
    scores: { relevance: number, quality: number, appropriateness: number, uniqueness: number },
    params: SynthesisRequest['synthesis_parameters']
  ): number {
    const qualityScore = (
      source.quality_metrics.factual_accuracy * 0.3 +
      source.quality_metrics.source_reliability * 0.3 +
      source.quality_metrics.content_depth * 0.2 +
      source.quality_metrics.clarity_score * 0.2
    )
    
    const recencyScore = source.metadata.last_updated 
      ? Math.max(0, 1 - (Date.now() - new Date(source.metadata.last_updated).getTime()) / (365 * 24 * 60 * 60 * 1000))
      : 0.5
    
    return (
      scores.relevance * 0.4 +
      qualityScore * params.authority_weight * 0.3 +
      scores.appropriateness * 0.2 +
      recencyScore * params.recency_weight * 0.1
    )
  }
  
  private parseContentExtraction(extraction: string, sources: ContentSource[]): any {
    try {
      return JSON.parse(extraction)
    } catch {
      return {
        concepts: [],
        facts: [],
        procedures: [],
        examples: [],
        perspectives: []
      }
    }
  }
  
  private parseSynthesizedContent(content: string): any {
    try {
      return JSON.parse(content)
    } catch {
      return {
        main_text: content,
        key_concepts: [],
        summary_points: [],
        learning_takeaways: [],
        practical_applications: [],
        common_misconceptions: [],
        related_topics: [],
        further_reading: []
      }
    }
  }
  
  private parseQualityMetrics(validation: string): any {
    try {
      return JSON.parse(validation)
    } catch {
      return {
        coherence_score: 0.7,
        completeness_score: 0.7,
        accuracy_confidence: 0.7,
        pedagogical_effectiveness: 0.7,
        engagement_potential: 0.7
      }
    }
  }
  
  private parseConceptNetwork(networkData: string, topic: string): ConceptNetwork[] {
    try {
      const parsed = JSON.parse(networkData)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  
  private calculateSourceDistribution(sources: ContentSource[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    sources.forEach(source => {
      distribution[source.type] = (distribution[source.type] || 0) + 1
    })
    return distribution
  }
  
  private identifyConsensusAreas(content: any, sources: ContentSource[]): string[] {
    // Simplified implementation
    return content.key_concepts?.slice(0, 3).map((c: any) => c.concept) || []
  }
  
  private identifyConflicts(content: any, sources: ContentSource[]): any[] {
    // Simplified implementation
    return []
  }
  
  private identifyGaps(content: any, objectives: string[]): string[] {
    // Simplified implementation
    return []
  }
  
  private calculateOverallConfidence(sources: ContentSource[]): number {
    return sources.reduce((sum, s) => sum + s.metadata.credibility_score, 0) / sources.length
  }
  
  private calculateEvidenceStrength(sources: ContentSource[]): number {
    return sources.reduce((sum, s) => sum + s.quality_metrics.factual_accuracy, 0) / sources.length
  }
  
  private calculateSourceQuality(sources: ContentSource[]): number {
    return sources.reduce((sum, s) => sum + s.quality_metrics.source_reliability, 0) / sources.length
  }
  
  private countWords(text: string): number {
    return text.split(/\s+/).length
  }
  
  private calculateOriginalityScore(content: any, sources: ContentSource[]): number {
    // Simplified: higher score for more synthesis and less direct copying
    return 0.8
  }
  
  // Get cached synthesis
  getSynthesis(synthesisId: string): SynthesizedContent | null {
    return this.synthesisCache.get(synthesisId) || null
  }
  
  // Get concept networks for a synthesis
  getConceptNetworks(synthesisId: string): ConceptNetwork[] {
    return this.conceptNetworks.get(synthesisId) || []
  }
  
  // Search synthesized content
  searchSyntheses(query: string): SynthesizedContent[] {
    const results: SynthesizedContent[] = []
    
    for (const synthesis of this.synthesisCache.values()) {
      if (
        synthesis.topic.toLowerCase().includes(query.toLowerCase()) ||
        synthesis.content.main_text.toLowerCase().includes(query.toLowerCase()) ||
        synthesis.content.key_concepts.some((c: any) => 
          c.concept.toLowerCase().includes(query.toLowerCase())
        )
      ) {
        results.push(synthesis)
      }
    }
    
    return results.slice(0, 10) // Limit results
  }
  
  // Get synthesis statistics
  getSynthesisStatistics(): {
    total_syntheses: number
    total_sources_processed: number
    average_quality_score: number
    most_common_topics: string[]
    synthesis_success_rate: number
  } {
    const syntheses = Array.from(this.synthesisCache.values())
    
    return {
      total_syntheses: syntheses.length,
      total_sources_processed: syntheses.reduce((sum, s) => 
        sum + s.synthesis_metadata.sources_synthesized, 0
      ),
      average_quality_score: syntheses.reduce((sum, s) => 
        sum + (
          s.quality_metrics.coherence_score +
          s.quality_metrics.completeness_score +
          s.quality_metrics.accuracy_confidence +
          s.quality_metrics.pedagogical_effectiveness +
          s.quality_metrics.engagement_potential
        ) / 5, 0
      ) / syntheses.length,
      most_common_topics: this.getMostCommonTopics(syntheses),
      synthesis_success_rate: 0.95 // Placeholder
    }
  }
  
  private getMostCommonTopics(syntheses: SynthesizedContent[]): string[] {
    const topicCounts: Record<string, number> = {}
    syntheses.forEach(s => {
      topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1
    })
    
    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic)
  }
}

// Create singleton instance
export const contentSynthesisEngine = new ContentSynthesisEngine()

// Helper functions for content source creation
export function createContentSource(
  sourceId: string,
  content: string,
  metadata: Partial<ContentSource['metadata']>,
  type: ContentSource['type'] = 'textbook'
): ContentSource {
  return {
    source_id: sourceId,
    type,
    content,
    metadata: {
      title: metadata.title || 'Untitled Source',
      credibility_score: metadata.credibility_score || 0.7,
      academic_level: metadata.academic_level || 'undergraduate',
      subject_domain: metadata.subject_domain || 'general',
      language: metadata.language || 'english',
      word_count: content.split(/\s+/).length,
      ...metadata
    },
    quality_metrics: {
      factual_accuracy: 0.8,
      source_reliability: 0.8,
      content_depth: 0.7,
      clarity_score: 0.8,
      bias_score: 0.7
    }
  }
}

export function createSynthesisRequest(
  topic: string,
  objectives: string[],
  audience?: Partial<SynthesisRequest['target_audience']>,
  requirements?: Partial<SynthesisRequest['content_requirements']>
): SynthesisRequest {
  return {
    topic,
    learning_objectives: objectives,
    target_audience: {
      age_group: 'adult',
      academic_level: 'intermediate',
      subject_background: [],
      learning_preferences: [],
      ...audience
    },
    content_requirements: {
      desired_length: 'moderate',
      format_preferences: ['text', 'examples'],
      include_citations: true,
      academic_rigor: 'educational',
      complexity_level: 5,
      ...requirements
    },
    synthesis_parameters: {
      source_diversity_weight: 0.3,
      recency_weight: 0.2,
      authority_weight: 0.4,
      consensus_weight: 0.3,
      novelty_weight: 0.1,
      max_source_count: 10
    }
  }
}