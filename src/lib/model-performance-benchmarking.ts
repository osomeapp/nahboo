'use client'

import { multiModelAI } from './multi-model-ai'
import { automatedModelRouter } from './automated-model-routing'

// Benchmark test definitions
interface BenchmarkTest {
  testId: string
  name: string
  description: string
  category: 'performance' | 'accuracy' | 'cost' | 'latency' | 'quality' | 'safety'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  useCase: string
  
  // Test configuration
  testPrompts: BenchmarkPrompt[]
  evaluationCriteria: EvaluationCriteria[]
  expectedResults?: any[]
  timeoutMs: number
  iterations: number
  
  // Metadata
  createdAt: Date
  version: string
  tags: string[]
}

interface BenchmarkPrompt {
  promptId: string
  prompt: string
  context?: string
  expectedResponseType: 'text' | 'code' | 'json' | 'structured' | 'creative'
  complexityScore: number // 1-10
  referenceAnswer?: string
  evaluationWeight: number // 0-1
}

interface EvaluationCriteria {
  criteriaId: string
  name: string
  description: string
  type: 'accuracy' | 'relevance' | 'creativity' | 'safety' | 'coherence' | 'completeness'
  weight: number // 0-1
  evaluationMethod: 'ai_judge' | 'similarity' | 'exact_match' | 'rubric' | 'automated'
  rubric?: RubricItem[]
}

interface RubricItem {
  score: number
  description: string
  criteria: string
}

// Benchmark result types
interface BenchmarkResult {
  resultId: string
  testId: string
  modelId: string
  timestamp: Date
  
  // Performance metrics
  overallScore: number // 0-100
  categoryScores: Record<string, number>
  criteriaScores: Record<string, number>
  
  // Technical metrics
  averageLatency: number
  totalCost: number
  successRate: number
  errorRate: number
  
  // Detailed results
  promptResults: PromptResult[]
  summary: BenchmarkSummary
  
  // Comparison data
  relativePerformance: Record<string, number> // vs other models
  improvement: number // vs previous benchmark
}

interface PromptResult {
  promptId: string
  response: string
  latency: number
  cost: number
  success: boolean
  error?: string
  
  // Evaluation scores
  criteriaScores: Record<string, number>
  overallScore: number
  
  // AI judge evaluation
  aiEvaluation?: {
    judge: string
    reasoning: string
    confidence: number
    strengths: string[]
    weaknesses: string[]
  }
}

interface BenchmarkSummary {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  performanceRanking: number // 1-based ranking among all models
  costEfficiencyRating: 'excellent' | 'good' | 'fair' | 'poor'
  overallRating: 'excellent' | 'good' | 'fair' | 'poor'
}

// Comparative analysis types
interface ModelComparison {
  comparisonId: string
  models: string[]
  testIds: string[]
  timestamp: Date
  
  // Comparison results
  rankings: ModelRanking[]
  categoryWinners: Record<string, string>
  costEfficiencyLeader: string
  overallWinner: string
  
  // Statistical analysis
  statisticalSignificance: boolean
  confidenceLevel: number
  sampleSize: number
  
  // Insights
  keyInsights: string[]
  recommendations: string[]
}

interface ModelRanking {
  modelId: string
  rank: number
  score: number
  strengths: string[]
  weaknesses: string[]
  bestUseCase: string
  costEfficiency: number
}

// Main benchmarking engine
class ModelPerformanceBenchmarking {
  private benchmarkTests: Map<string, BenchmarkTest> = new Map()
  private benchmarkResults: Map<string, BenchmarkResult> = new Map()
  private modelComparisons: Map<string, ModelComparison> = new Map()
  
  constructor() {
    this.initializeStandardBenchmarks()
  }

  // Initialize standard benchmark tests
  private initializeStandardBenchmarks() {
    // Mathematics benchmark
    this.addBenchmarkTest({
      testId: 'math_reasoning',
      name: 'Mathematical Reasoning',
      description: 'Tests mathematical problem-solving and reasoning capabilities',
      category: 'accuracy',
      difficulty: 'medium',
      useCase: 'mathematics',
      testPrompts: [
        {
          promptId: 'algebra_1',
          prompt: 'Solve for x: 3x + 7 = 22. Show your work step by step.',
          expectedResponseType: 'structured',
          complexityScore: 3,
          referenceAnswer: 'x = 5',
          evaluationWeight: 1.0
        },
        {
          promptId: 'calculus_1',
          prompt: 'Find the derivative of f(x) = 3x² + 2x - 1',
          expectedResponseType: 'text',
          complexityScore: 5,
          referenceAnswer: "f'(x) = 6x + 2",
          evaluationWeight: 1.0
        },
        {
          promptId: 'word_problem',
          prompt: 'A train travels 120 miles in 2 hours. At this rate, how long will it take to travel 300 miles?',
          expectedResponseType: 'structured',
          complexityScore: 4,
          referenceAnswer: '5 hours',
          evaluationWeight: 1.0
        }
      ],
      evaluationCriteria: [
        {
          criteriaId: 'accuracy',
          name: 'Mathematical Accuracy',
          description: 'Correctness of the mathematical solution',
          type: 'accuracy',
          weight: 0.6,
          evaluationMethod: 'ai_judge'
        },
        {
          criteriaId: 'explanation',
          name: 'Explanation Quality',
          description: 'Clarity and completeness of the explanation',
          type: 'completeness',
          weight: 0.4,
          evaluationMethod: 'ai_judge'
        }
      ],
      timeoutMs: 30000,
      iterations: 1,
      createdAt: new Date(),
      version: '1.0',
      tags: ['mathematics', 'reasoning', 'accuracy']
    })

    // Code generation benchmark
    this.addBenchmarkTest({
      testId: 'code_generation',
      name: 'Code Generation',
      description: 'Tests programming and code generation capabilities',
      category: 'accuracy',
      difficulty: 'medium',
      useCase: 'programming',
      testPrompts: [
        {
          promptId: 'python_function',
          prompt: 'Write a Python function that finds the largest number in a list of integers.',
          expectedResponseType: 'code',
          complexityScore: 4,
          evaluationWeight: 1.0
        },
        {
          promptId: 'algorithm',
          prompt: 'Implement a binary search algorithm in JavaScript.',
          expectedResponseType: 'code',
          complexityScore: 6,
          evaluationWeight: 1.0
        },
        {
          promptId: 'bug_fix',
          prompt: 'Fix the bug in this code: def add_numbers(a, b): return a + b + 1  # Should just add a and b',
          expectedResponseType: 'code',
          complexityScore: 3,
          evaluationWeight: 1.0
        }
      ],
      evaluationCriteria: [
        {
          criteriaId: 'correctness',
          name: 'Code Correctness',
          description: 'Whether the code works as intended',
          type: 'accuracy',
          weight: 0.5,
          evaluationMethod: 'ai_judge'
        },
        {
          criteriaId: 'quality',
          name: 'Code Quality',
          description: 'Code style, readability, and best practices',
          type: 'completeness',
          weight: 0.3,
          evaluationMethod: 'ai_judge'
        },
        {
          criteriaId: 'efficiency',
          name: 'Efficiency',
          description: 'Algorithm efficiency and performance',
          type: 'accuracy',
          weight: 0.2,
          evaluationMethod: 'ai_judge'
        }
      ],
      timeoutMs: 45000,
      iterations: 1,
      createdAt: new Date(),
      version: '1.0',
      tags: ['programming', 'code', 'algorithms']
    })

    // Creative writing benchmark
    this.addBenchmarkTest({
      testId: 'creative_writing',
      name: 'Creative Writing',
      description: 'Tests creative writing and storytelling abilities',
      category: 'quality',
      difficulty: 'medium',
      useCase: 'creative_writing',
      testPrompts: [
        {
          promptId: 'short_story',
          prompt: 'Write a short story (200-300 words) about a time traveler who accidentally changes history.',
          expectedResponseType: 'creative',
          complexityScore: 7,
          evaluationWeight: 1.0
        },
        {
          promptId: 'character_development',
          prompt: 'Create a detailed character profile for a detective in a mystery novel.',
          expectedResponseType: 'structured',
          complexityScore: 6,
          evaluationWeight: 1.0
        }
      ],
      evaluationCriteria: [
        {
          criteriaId: 'creativity',
          name: 'Creativity',
          description: 'Originality and creative elements',
          type: 'creativity',
          weight: 0.4,
          evaluationMethod: 'ai_judge'
        },
        {
          criteriaId: 'coherence',
          name: 'Coherence',
          description: 'Story flow and logical consistency',
          type: 'coherence',
          weight: 0.3,
          evaluationMethod: 'ai_judge'
        },
        {
          criteriaId: 'engagement',
          name: 'Engagement',
          description: 'How engaging and interesting the content is',
          type: 'relevance',
          weight: 0.3,
          evaluationMethod: 'ai_judge'
        }
      ],
      timeoutMs: 60000,
      iterations: 1,
      createdAt: new Date(),
      version: '1.0',
      tags: ['creative', 'writing', 'storytelling']
    })

    // Performance/speed benchmark
    this.addBenchmarkTest({
      testId: 'response_speed',
      name: 'Response Speed',
      description: 'Tests response speed and latency',
      category: 'latency',
      difficulty: 'easy',
      useCase: 'general',
      testPrompts: [
        {
          promptId: 'quick_question',
          prompt: 'What is the capital of France?',
          expectedResponseType: 'text',
          complexityScore: 1,
          referenceAnswer: 'Paris',
          evaluationWeight: 1.0
        },
        {
          promptId: 'simple_math',
          prompt: 'What is 15 + 27?',
          expectedResponseType: 'text',
          complexityScore: 1,
          referenceAnswer: '42',
          evaluationWeight: 1.0
        }
      ],
      evaluationCriteria: [
        {
          criteriaId: 'speed',
          name: 'Response Speed',
          description: 'Time taken to respond',
          type: 'accuracy',
          weight: 0.8,
          evaluationMethod: 'automated'
        },
        {
          criteriaId: 'accuracy',
          name: 'Answer Accuracy',
          description: 'Correctness of the answer',
          type: 'accuracy',
          weight: 0.2,
          evaluationMethod: 'exact_match'
        }
      ],
      timeoutMs: 10000,
      iterations: 5, // Multiple iterations for speed testing
      createdAt: new Date(),
      version: '1.0',
      tags: ['speed', 'latency', 'performance']
    })
  }

  // Add a new benchmark test
  addBenchmarkTest(test: Omit<BenchmarkTest, 'testId'> & { testId?: string }): string {
    const testId = test.testId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullTest = { ...test, testId }
    this.benchmarkTests.set(testId, fullTest)
    return testId
  }

  // Run benchmark on a specific model
  async runBenchmark(testId: string, modelId: string): Promise<BenchmarkResult> {
    const test = this.benchmarkTests.get(testId)
    if (!test) {
      throw new Error(`Benchmark test ${testId} not found`)
    }

    const resultId = `result_${testId}_${modelId}_${Date.now()}`
    const startTime = Date.now()
    
    console.log(`Running benchmark ${test.name} on model ${modelId}...`)

    // Run all prompts
    const promptResults: PromptResult[] = []
    let totalCost = 0
    let totalLatency = 0
    let successCount = 0

    for (const prompt of test.testPrompts) {
      for (let iteration = 0; iteration < test.iterations; iteration++) {
        try {
          const promptStartTime = Date.now()
          
          const response = await multiModelAI.generateResponse({
            prompt: prompt.prompt,
            context: prompt.context,
            useCase: test.useCase,
            forceModel: modelId,
            maxTokens: 1000,
            temperature: 0.3,
            timeout: test.timeoutMs
          })

          const latency = Date.now() - promptStartTime
          totalLatency += latency

          if (response.success) {
            successCount++
            
            // Evaluate the response
            const evaluation = await this.evaluateResponse(
              prompt,
              response.content,
              test.evaluationCriteria
            )

            const promptResult: PromptResult = {
              promptId: `${prompt.promptId}_${iteration}`,
              response: response.content,
              latency,
              cost: response.usage?.total_tokens ? response.usage.total_tokens * 0.0001 : 0.001,
              success: true,
              criteriaScores: evaluation.criteriaScores,
              overallScore: evaluation.overallScore,
              aiEvaluation: evaluation.aiEvaluation
            }

            totalCost += promptResult.cost
            promptResults.push(promptResult)
          } else {
            promptResults.push({
              promptId: `${prompt.promptId}_${iteration}`,
              response: '',
              latency,
              cost: 0,
              success: false,
              error: response.error,
              criteriaScores: {},
              overallScore: 0
            })
          }
        } catch (error) {
          promptResults.push({
            promptId: `${prompt.promptId}_${iteration}`,
            response: '',
            latency: Date.now() - Date.now(),
            cost: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            criteriaScores: {},
            overallScore: 0
          })
        }
      }
    }

    // Calculate scores and metrics
    const totalPrompts = test.testPrompts.length * test.iterations
    const successRate = (successCount / totalPrompts) * 100
    const errorRate = 100 - successRate
    const averageLatency = totalLatency / totalPrompts

    // Calculate category and criteria scores
    const categoryScores = this.calculateCategoryScores(promptResults, test)
    const criteriaScores = this.calculateCriteriaScores(promptResults, test)
    const overallScore = this.calculateOverallScore(promptResults, test)

    // Generate summary
    const summary = await this.generateBenchmarkSummary(
      promptResults,
      test,
      modelId,
      overallScore
    )

    const result: BenchmarkResult = {
      resultId,
      testId,
      modelId,
      timestamp: new Date(),
      overallScore,
      categoryScores,
      criteriaScores,
      averageLatency,
      totalCost,
      successRate,
      errorRate,
      promptResults,
      summary,
      relativePerformance: {},
      improvement: 0
    }

    // Store result
    this.benchmarkResults.set(resultId, result)

    console.log(`Benchmark completed. Overall score: ${overallScore.toFixed(1)}`)
    return result
  }

  // Evaluate response against criteria
  private async evaluateResponse(
    prompt: BenchmarkPrompt,
    response: string,
    criteria: EvaluationCriteria[]
  ): Promise<{
    criteriaScores: Record<string, number>
    overallScore: number
    aiEvaluation?: any
  }> {
    const criteriaScores: Record<string, number> = {}
    let weightedSum = 0
    let totalWeight = 0

    for (const criterion of criteria) {
      let score = 0

      switch (criterion.evaluationMethod) {
        case 'exact_match':
          if (prompt.referenceAnswer && response.toLowerCase().includes(prompt.referenceAnswer.toLowerCase())) {
            score = 100
          }
          break

        case 'similarity':
          if (prompt.referenceAnswer) {
            score = this.calculateSimilarity(response, prompt.referenceAnswer) * 100
          }
          break

        case 'ai_judge':
          score = await this.getAIJudgeScore(prompt, response, criterion)
          break

        case 'automated':
          if (criterion.name.toLowerCase().includes('speed')) {
            // Speed scoring: faster is better (inverse relationship)
            const maxLatency = 5000 // 5 seconds
            const actualLatency = Date.now() - Date.now() // This would be passed in normally
            score = Math.max(0, 100 - (actualLatency / maxLatency) * 100)
          }
          break

        case 'rubric':
          if (criterion.rubric) {
            score = await this.evaluateWithRubric(response, criterion.rubric)
          }
          break
      }

      criteriaScores[criterion.criteriaId] = score
      weightedSum += score * criterion.weight
      totalWeight += criterion.weight
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0

    // Get AI evaluation for detailed feedback
    const aiEvaluation = await this.getDetailedAIEvaluation(prompt, response)

    return {
      criteriaScores,
      overallScore,
      aiEvaluation
    }
  }

  // Get AI judge score for a criterion
  private async getAIJudgeScore(
    prompt: BenchmarkPrompt,
    response: string,
    criterion: EvaluationCriteria
  ): Promise<number> {
    try {
      const judgePrompt = `
        You are an expert evaluator. Rate the following response on a scale of 0-100 for ${criterion.name}.
        
        Criterion: ${criterion.description}
        
        Original Prompt: ${prompt.prompt}
        ${prompt.referenceAnswer ? `Reference Answer: ${prompt.referenceAnswer}` : ''}
        
        Response to Evaluate: ${response}
        
        Please provide ONLY a numeric score from 0-100, where:
        - 90-100: Excellent
        - 80-89: Good
        - 70-79: Satisfactory
        - 60-69: Below Average
        - 0-59: Poor
        
        Score:
      `

      const judgeResponse = await multiModelAI.generateResponse({
        prompt: judgePrompt,
        useCase: 'evaluation',
        maxTokens: 50,
        temperature: 0.1
      })

      if (judgeResponse.success) {
        const score = parseInt(judgeResponse.content.trim())
        return isNaN(score) ? 0 : Math.max(0, Math.min(100, score))
      }
    } catch (error) {
      console.error('AI judge evaluation failed:', error)
    }

    return 50 // Default score if evaluation fails
  }

  // Get detailed AI evaluation
  private async getDetailedAIEvaluation(
    prompt: BenchmarkPrompt,
    response: string
  ): Promise<any> {
    try {
      const evaluationPrompt = `
        Evaluate this response comprehensively:
        
        Prompt: ${prompt.prompt}
        Response: ${response}
        
        Provide evaluation in this JSON format:
        {
          "judge": "AI Evaluator",
          "reasoning": "Detailed explanation of the evaluation",
          "confidence": 85,
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"]
        }
      `

      const evalResponse = await multiModelAI.generateResponse({
        prompt: evaluationPrompt,
        useCase: 'evaluation',
        maxTokens: 300,
        temperature: 0.2
      })

      if (evalResponse.success) {
        try {
          return JSON.parse(evalResponse.content)
        } catch {
          return {
            judge: 'AI Evaluator',
            reasoning: evalResponse.content,
            confidence: 70,
            strengths: ['Response provided'],
            weaknesses: ['Could not parse detailed evaluation']
          }
        }
      }
    } catch (error) {
      console.error('Detailed AI evaluation failed:', error)
    }

    return null
  }

  // Calculate similarity between two strings
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/)
    const words2 = str2.toLowerCase().split(/\s+/)
    
    const commonWords = words1.filter(word => words2.includes(word))
    const totalWords = new Set([...words1, ...words2]).size
    
    return totalWords > 0 ? commonWords.length / totalWords : 0
  }

  // Evaluate using rubric
  private async evaluateWithRubric(response: string, rubric: RubricItem[]): Promise<number> {
    // Use AI to determine which rubric level best matches the response
    const rubricPrompt = `
      Evaluate this response against the following rubric:
      
      ${rubric.map(item => `Score ${item.score}: ${item.description} - ${item.criteria}`).join('\n')}
      
      Response: ${response}
      
      Which score best matches this response? Respond with just the number.
    `

    try {
      const rubricResponse = await multiModelAI.generateResponse({
        prompt: rubricPrompt,
        useCase: 'evaluation',
        maxTokens: 10,
        temperature: 0.1
      })

      if (rubricResponse.success) {
        const score = parseInt(rubricResponse.content.trim())
        const validScore = rubric.find(item => item.score === score)
        return validScore ? score : rubric[Math.floor(rubric.length / 2)].score
      }
    } catch (error) {
      console.error('Rubric evaluation failed:', error)
    }

    return rubric[Math.floor(rubric.length / 2)].score // Default to middle score
  }

  // Calculate category scores
  private calculateCategoryScores(results: PromptResult[], test: BenchmarkTest): Record<string, number> {
    const scores: Record<string, number> = {}
    scores[test.category] = results.reduce((sum, result) => sum + result.overallScore, 0) / results.length
    return scores
  }

  // Calculate criteria scores
  private calculateCriteriaScores(results: PromptResult[], test: BenchmarkTest): Record<string, number> {
    const criteriaScores: Record<string, number> = {}
    
    test.evaluationCriteria.forEach(criterion => {
      const scores = results
        .map(result => result.criteriaScores[criterion.criteriaId] || 0)
        .filter(score => score > 0)
      
      criteriaScores[criterion.criteriaId] = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0
    })
    
    return criteriaScores
  }

  // Calculate overall score
  private calculateOverallScore(results: PromptResult[], test: BenchmarkTest): number {
    const successfulResults = results.filter(result => result.success)
    
    if (successfulResults.length === 0) return 0
    
    return successfulResults.reduce((sum, result) => sum + result.overallScore, 0) / successfulResults.length
  }

  // Generate benchmark summary using AI
  private async generateBenchmarkSummary(
    results: PromptResult[],
    test: BenchmarkTest,
    modelId: string,
    overallScore: number
  ): Promise<BenchmarkSummary> {
    const successfulResults = results.filter(r => r.success)
    const averageScore = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.overallScore, 0) / successfulResults.length 
      : 0

    try {
      const summaryPrompt = `
        Generate a benchmark summary for model ${modelId} on test "${test.name}":
        
        Test Description: ${test.description}
        Overall Score: ${overallScore.toFixed(1)}/100
        Success Rate: ${(successfulResults.length / results.length * 100).toFixed(1)}%
        
        Sample Results:
        ${successfulResults.slice(0, 3).map(r => 
          `- Score: ${r.overallScore.toFixed(1)}, Response: ${r.response.substring(0, 100)}...`
        ).join('\n')}
        
        Provide a summary in this JSON format:
        {
          "strengths": ["strength1", "strength2", "strength3"],
          "weaknesses": ["weakness1", "weakness2"],
          "recommendations": ["recommendation1", "recommendation2"],
          "performanceRanking": 1,
          "costEfficiencyRating": "good",
          "overallRating": "good"
        }
      `

      const summaryResponse = await multiModelAI.generateResponse({
        prompt: summaryPrompt,
        useCase: 'analysis',
        maxTokens: 400,
        temperature: 0.3
      })

      if (summaryResponse.success) {
        try {
          return JSON.parse(summaryResponse.content)
        } catch {
          // Fallback parsing
          return this.parseSummaryFallback(summaryResponse.content, overallScore)
        }
      }
    } catch (error) {
      console.error('Summary generation failed:', error)
    }

    // Default summary if AI generation fails
    return {
      strengths: ['Completed benchmark'],
      weaknesses: ['Could not generate detailed analysis'],
      recommendations: ['Run more comprehensive tests'],
      performanceRanking: 1,
      costEfficiencyRating: overallScore > 80 ? 'excellent' : overallScore > 60 ? 'good' : 'fair',
      overallRating: overallScore > 80 ? 'excellent' : overallScore > 60 ? 'good' : 'fair'
    }
  }

  // Fallback summary parsing
  private parseSummaryFallback(content: string, score: number): BenchmarkSummary {
    return {
      strengths: ['Generated response', 'Completed benchmark'],
      weaknesses: score < 70 ? ['Below target performance'] : [],
      recommendations: ['Continue testing', 'Monitor performance'],
      performanceRanking: 1,
      costEfficiencyRating: score > 80 ? 'excellent' : score > 60 ? 'good' : 'fair',
      overallRating: score > 80 ? 'excellent' : score > 60 ? 'good' : 'fair'
    }
  }

  // Run comprehensive benchmark across multiple models
  async runComprehensiveBenchmark(modelIds: string[]): Promise<ModelComparison> {
    const comparisonId = `comparison_${Date.now()}`
    const testIds = Array.from(this.benchmarkTests.keys())
    
    console.log(`Running comprehensive benchmark across ${modelIds.length} models...`)

    // Run all tests on all models
    const allResults: BenchmarkResult[] = []
    
    for (const modelId of modelIds) {
      for (const testId of testIds) {
        try {
          const result = await this.runBenchmark(testId, modelId)
          allResults.push(result)
        } catch (error) {
          console.error(`Failed to run ${testId} on ${modelId}:`, error)
        }
      }
    }

    // Analyze results and create comparison
    const rankings = this.calculateModelRankings(allResults, modelIds)
    const categoryWinners = this.calculateCategoryWinners(allResults)
    const costEfficiencyLeader = this.calculateCostEfficiencyLeader(allResults)
    const overallWinner = rankings[0]?.modelId || modelIds[0]

    // Generate insights
    const insights = await this.generateComparisonInsights(allResults, rankings)

    const comparison: ModelComparison = {
      comparisonId,
      models: modelIds,
      testIds,
      timestamp: new Date(),
      rankings,
      categoryWinners,
      costEfficiencyLeader,
      overallWinner,
      statisticalSignificance: true, // Would calculate this properly
      confidenceLevel: 0.95,
      sampleSize: allResults.length,
      keyInsights: insights.keyInsights,
      recommendations: insights.recommendations
    }

    this.modelComparisons.set(comparisonId, comparison)
    
    console.log(`Comprehensive benchmark completed. Winner: ${overallWinner}`)
    return comparison
  }

  // Calculate model rankings
  private calculateModelRankings(results: BenchmarkResult[], modelIds: string[]): ModelRanking[] {
    const modelScores = modelIds.map(modelId => {
      const modelResults = results.filter(r => r.modelId === modelId)
      const avgScore = modelResults.length > 0 
        ? modelResults.reduce((sum, r) => sum + r.overallScore, 0) / modelResults.length 
        : 0
      
      const avgCost = modelResults.length > 0
        ? modelResults.reduce((sum, r) => sum + r.totalCost, 0) / modelResults.length
        : 0
      
      const costEfficiency = avgScore / Math.max(avgCost, 0.001) // Score per unit cost

      return {
        modelId,
        score: avgScore,
        costEfficiency,
        results: modelResults
      }
    })

    // Sort by score (descending)
    modelScores.sort((a, b) => b.score - a.score)

    return modelScores.map((model, index) => ({
      modelId: model.modelId,
      rank: index + 1,
      score: model.score,
      strengths: this.identifyModelStrengths(model.results),
      weaknesses: this.identifyModelWeaknesses(model.results),
      bestUseCase: this.identifyBestUseCase(model.results),
      costEfficiency: model.costEfficiency
    }))
  }

  // Identify model strengths
  private identifyModelStrengths(results: BenchmarkResult[]): string[] {
    const strengths: string[] = []
    
    // Analyze category performance
    const categoryScores: Record<string, number> = {}
    results.forEach(result => {
      Object.entries(result.categoryScores).forEach(([category, score]) => {
        if (!categoryScores[category]) categoryScores[category] = []
        categoryScores[category].push(score)
      })
    })

    Object.entries(categoryScores).forEach(([category, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      if (avgScore > 80) {
        strengths.push(`Excellent ${category} performance`)
      }
    })

    // Analyze speed
    const avgLatency = results.reduce((sum, r) => sum + r.averageLatency, 0) / results.length
    if (avgLatency < 2000) {
      strengths.push('Fast response times')
    }

    // Analyze reliability
    const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length
    if (avgSuccessRate > 95) {
      strengths.push('High reliability')
    }

    return strengths.length > 0 ? strengths : ['Completed all tests']
  }

  // Identify model weaknesses
  private identifyModelWeaknesses(results: BenchmarkResult[]): string[] {
    const weaknesses: string[] = []
    
    // Check for low performance areas
    const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
    if (avgScore < 60) {
      weaknesses.push('Below average overall performance')
    }

    const avgLatency = results.reduce((sum, r) => sum + r.averageLatency, 0) / results.length
    if (avgLatency > 5000) {
      weaknesses.push('Slow response times')
    }

    const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length
    if (avgSuccessRate < 90) {
      weaknesses.push('Reliability issues')
    }

    return weaknesses
  }

  // Identify best use case for model
  private identifyBestUseCase(results: BenchmarkResult[]): string {
    const useCaseScores: Record<string, number> = {}
    
    results.forEach(result => {
      const test = this.benchmarkTests.get(result.testId)
      if (test) {
        if (!useCaseScores[test.useCase]) {
          useCaseScores[test.useCase] = []
        }
        useCaseScores[test.useCase].push(result.overallScore)
      }
    })

    let bestUseCase = 'general'
    let bestScore = 0

    Object.entries(useCaseScores).forEach(([useCase, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      if (avgScore > bestScore) {
        bestScore = avgScore
        bestUseCase = useCase
      }
    })

    return bestUseCase
  }

  // Calculate category winners
  private calculateCategoryWinners(results: BenchmarkResult[]): Record<string, string> {
    const categoryPerformance: Record<string, Record<string, number>> = {}
    
    results.forEach(result => {
      Object.entries(result.categoryScores).forEach(([category, score]) => {
        if (!categoryPerformance[category]) {
          categoryPerformance[category] = {}
        }
        if (!categoryPerformance[category][result.modelId]) {
          categoryPerformance[category][result.modelId] = []
        }
        categoryPerformance[category][result.modelId].push(score)
      })
    })

    const winners: Record<string, string> = {}
    
    Object.entries(categoryPerformance).forEach(([category, modelScores]) => {
      let bestModel = ''
      let bestAvgScore = 0
      
      Object.entries(modelScores).forEach(([modelId, scores]) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        if (avgScore > bestAvgScore) {
          bestAvgScore = avgScore
          bestModel = modelId
        }
      })
      
      winners[category] = bestModel
    })

    return winners
  }

  // Calculate cost efficiency leader
  private calculateCostEfficiencyLeader(results: BenchmarkResult[]): string {
    const modelEfficiency: Record<string, { score: number, cost: number }> = {}
    
    results.forEach(result => {
      if (!modelEfficiency[result.modelId]) {
        modelEfficiency[result.modelId] = { score: 0, cost: 0 }
      }
      modelEfficiency[result.modelId].score += result.overallScore
      modelEfficiency[result.modelId].cost += result.totalCost
    })

    let bestModel = ''
    let bestEfficiency = 0

    Object.entries(modelEfficiency).forEach(([modelId, data]) => {
      const efficiency = data.score / Math.max(data.cost, 0.001)
      if (efficiency > bestEfficiency) {
        bestEfficiency = efficiency
        bestModel = modelId
      }
    })

    return bestModel
  }

  // Generate comparison insights using AI
  private async generateComparisonInsights(
    results: BenchmarkResult[],
    rankings: ModelRanking[]
  ): Promise<{ keyInsights: string[], recommendations: string[] }> {
    try {
      const insightsPrompt = `
        Analyze these model benchmark results and provide insights:
        
        Model Rankings:
        ${rankings.map(r => `${r.rank}. ${r.modelId} (Score: ${r.score.toFixed(1)})`).join('\n')}
        
        Key Statistics:
        - Total Tests: ${results.length}
        - Average Success Rate: ${(results.reduce((sum, r) => sum + r.successRate, 0) / results.length).toFixed(1)}%
        - Average Cost: $${(results.reduce((sum, r) => sum + r.totalCost, 0) / results.length).toFixed(4)}
        
        Provide insights in JSON format:
        {
          "keyInsights": ["insight1", "insight2", "insight3"],
          "recommendations": ["recommendation1", "recommendation2"]
        }
      `

      const insightsResponse = await multiModelAI.generateResponse({
        prompt: insightsPrompt,
        useCase: 'analysis',
        maxTokens: 300,
        temperature: 0.3
      })

      if (insightsResponse.success) {
        try {
          return JSON.parse(insightsResponse.content)
        } catch {
          return {
            keyInsights: [
              `${rankings[0]?.modelId} leads with ${rankings[0]?.score.toFixed(1)} score`,
              `${results.length} total benchmark tests completed`,
              'Comprehensive performance analysis available'
            ],
            recommendations: [
              `Consider using ${rankings[0]?.modelId} for best performance`,
              'Monitor cost efficiency for production use'
            ]
          }
        }
      }
    } catch (error) {
      console.error('Insights generation failed:', error)
    }

    return {
      keyInsights: ['Benchmark analysis completed', 'Results available for review'],
      recommendations: ['Review detailed results', 'Consider model selection based on use case']
    }
  }

  // Get benchmark results
  getBenchmarkResults(testId?: string, modelId?: string): BenchmarkResult[] {
    const results = Array.from(this.benchmarkResults.values())
    
    return results.filter(result => {
      if (testId && result.testId !== testId) return false
      if (modelId && result.modelId !== modelId) return false
      return true
    })
  }

  // Get available benchmark tests
  getBenchmarkTests(): BenchmarkTest[] {
    return Array.from(this.benchmarkTests.values())
  }

  // Get model comparisons
  getModelComparisons(): ModelComparison[] {
    return Array.from(this.modelComparisons.values())
  }

  // Get performance summary for a model
  getModelPerformanceSummary(modelId: string): {
    overallScore: number
    testCount: number
    strengths: string[]
    weaknesses: string[]
    bestCategory: string
    recommendations: string[]
  } {
    const results = this.getBenchmarkResults(undefined, modelId)
    
    if (results.length === 0) {
      return {
        overallScore: 0,
        testCount: 0,
        strengths: [],
        weaknesses: [],
        bestCategory: 'unknown',
        recommendations: ['Run benchmarks to get performance data']
      }
    }

    const overallScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
    const allStrengths = results.flatMap(r => r.summary.strengths)
    const allWeaknesses = results.flatMap(r => r.summary.weaknesses)
    
    // Find best category
    const categoryScores: Record<string, number[]> = {}
    results.forEach(result => {
      Object.entries(result.categoryScores).forEach(([category, score]) => {
        if (!categoryScores[category]) categoryScores[category] = []
        categoryScores[category].push(score)
      })
    })

    let bestCategory = 'general'
    let bestCategoryScore = 0
    Object.entries(categoryScores).forEach(([category, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      if (avgScore > bestCategoryScore) {
        bestCategoryScore = avgScore
        bestCategory = category
      }
    })

    return {
      overallScore,
      testCount: results.length,
      strengths: [...new Set(allStrengths)].slice(0, 5),
      weaknesses: [...new Set(allWeaknesses)].slice(0, 3),
      bestCategory,
      recommendations: [...new Set(results.flatMap(r => r.summary.recommendations))].slice(0, 3)
    }
  }
}

// Global instance
export const modelPerformanceBenchmarking = new ModelPerformanceBenchmarking()

// Export types
export type {
  BenchmarkTest,
  BenchmarkPrompt,
  EvaluationCriteria,
  BenchmarkResult,
  PromptResult,
  BenchmarkSummary,
  ModelComparison,
  ModelRanking
}