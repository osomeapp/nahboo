// Coding Exercise Player
// Interactive coding environment with real-time feedback
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, Check, X, AlertTriangle, Code, Terminal, 
  FileText, Clock, Cpu, Save, Download,
  RefreshCw, Zap, Bug, TestTube
} from 'lucide-react'
import type { UserProfile } from '@/types'
import type { CodingExercise, TestCase } from '@/lib/interactive-content-engine'

interface CodingExercisePlayerProps {
  exercise: CodingExercise
  userProfile: UserProfile
  onInteraction: (data: any) => void
  onComplete: (submission: any) => void
}

interface EditorState {
  code: string
  language: string
  theme: 'light' | 'dark'
  fontSize: number
  showLineNumbers: boolean
  wordWrap: boolean
}

interface ExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
  memoryUsage?: number
  testResults?: TestResult[]
}

interface TestResult {
  testId: string
  passed: boolean
  input: any
  expectedOutput: any
  actualOutput: any
  executionTime: number
  error?: string
}

export default function CodingExercisePlayer({
  exercise,
  userProfile,
  onInteraction,
  onComplete
}: CodingExercisePlayerProps) {
  const [editorState, setEditorState] = useState<EditorState>({
    code: exercise.starterCode,
    language: exercise.language,
    theme: 'light',
    fontSize: 14,
    showLineNumbers: true,
    wordWrap: false
  })

  const [executionState, setExecutionState] = useState<{
    isRunning: boolean
    result: ExecutionResult | null
    lastRun: Date | null
  }>({
    isRunning: false,
    result: null,
    lastRun: null
  })

  const [testState, setTestState] = useState<{
    showTests: boolean
    runningTests: boolean
    testResults: TestResult[]
    passedTests: number
    totalTests: number
  }>({
    showTests: false,
    runningTests: false,
    testResults: [],
    passedTests: 0,
    totalTests: exercise.testCases.length
  })

  const [editorMetrics, setEditorMetrics] = useState<{
    keystrokes: number
    timeSpent: number
    saves: number
    runs: number
    lastActivity: Date
  }>({
    keystrokes: 0,
    timeSpent: 0,
    saves: 0,
    runs: 0,
    lastActivity: new Date()
  })

  const codeEditorRef = useRef<HTMLTextAreaElement>(null)
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Track activity time
  useEffect(() => {
    activityTimerRef.current = setInterval(() => {
      setEditorMetrics(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1000
      }))
    }, 1000)

    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current)
      }
    }
  }, [])

  const handleCodeChange = (newCode: string) => {
    setEditorState(prev => ({ ...prev, code: newCode }))
    setEditorMetrics(prev => ({
      ...prev,
      keystrokes: prev.keystrokes + 1,
      lastActivity: new Date()
    }))

    onInteraction({
      type: 'code_edit',
      data: {
        codeLength: newCode.length,
        timestamp: Date.now()
      }
    })
  }

  const executeCode = async () => {
    setExecutionState(prev => ({ ...prev, isRunning: true }))
    setEditorMetrics(prev => ({ ...prev, runs: prev.runs + 1 }))

    try {
      // Simulate code execution (in real implementation, would send to secure execution service)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const mockResult: ExecutionResult = {
        success: Math.random() > 0.3,
        output: `Output from your ${exercise.language} code:\n${generateMockOutput()}`,
        executionTime: Math.random() * 1000,
        memoryUsage: Math.random() * 50 + 10
      }

      if (!mockResult.success) {
        mockResult.error = generateMockError()
      }

      setExecutionState({
        isRunning: false,
        result: mockResult,
        lastRun: new Date()
      })

      onInteraction({
        type: 'code_execution',
        data: {
          success: mockResult.success,
          executionTime: mockResult.executionTime,
          codeLength: editorState.code.length
        }
      })

    } catch (error) {
      setExecutionState({
        isRunning: false,
        result: {
          success: false,
          error: 'Execution failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        },
        lastRun: new Date()
      })
    }
  }

  const runTests = async () => {
    setTestState(prev => ({ ...prev, runningTests: true }))

    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const testResults: TestResult[] = exercise.testCases.map(testCase => {
        const passed = Math.random() > 0.4
        return {
          testId: testCase.id,
          passed,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: passed ? testCase.expectedOutput : generateMockOutput(),
          executionTime: Math.random() * 100,
          error: passed ? undefined : 'Output does not match expected result'
        }
      })

      const passedTests = testResults.filter(r => r.passed).length

      setTestState({
        showTests: true,
        runningTests: false,
        testResults,
        passedTests,
        totalTests: exercise.testCases.length
      })

      onInteraction({
        type: 'test_execution',
        data: {
          passedTests,
          totalTests: exercise.testCases.length,
          successRate: passedTests / exercise.testCases.length
        }
      })

      // Auto-complete if all tests pass
      if (passedTests === exercise.testCases.length) {
        setTimeout(() => {
          handleComplete()
        }, 1500)
      }

    } catch (error) {
      setTestState(prev => ({ ...prev, runningTests: false }))
    }
  }

  const saveCode = () => {
    setEditorMetrics(prev => ({ ...prev, saves: prev.saves + 1 }))
    
    // In real implementation, would save to backend
    onInteraction({
      type: 'code_save',
      data: {
        codeLength: editorState.code.length,
        timestamp: Date.now()
      }
    })
  }

  const resetCode = () => {
    setEditorState(prev => ({ ...prev, code: exercise.starterCode }))
    setExecutionState(prev => ({ ...prev, result: null }))
    setTestState(prev => ({ 
      ...prev, 
      testResults: [], 
      passedTests: 0,
      showTests: false 
    }))

    onInteraction({
      type: 'code_reset',
      data: { timestamp: Date.now() }
    })
  }

  const handleComplete = () => {
    const submission = {
      code: editorState.code,
      language: exercise.language,
      testResults: testState.testResults,
      metrics: editorMetrics,
      executionResults: executionState.result
    }

    onComplete(submission)
  }

  const downloadCode = () => {
    const blob = new Blob([editorState.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exercise.title.replace(/\s+/g, '_')}.${getFileExtension(exercise.language)}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFileExtension = (language: string): string => {
    const extensions = {
      python: 'py',
      javascript: 'js',
      java: 'java',
      cpp: 'cpp',
      html_css: 'html',
      sql: 'sql',
      scratch: 'sb3'
    }
    return extensions[language as keyof typeof extensions] || 'txt'
  }

  const generateMockOutput = (): string => {
    const outputs = [
      'Hello, World!',
      '42',
      'True',
      '[1, 2, 3, 4, 5]',
      'Process completed successfully',
      'Result: 3.14159',
      'Found 5 matches'
    ]
    return outputs[Math.floor(Math.random() * outputs.length)]
  }

  const generateMockError = (): string => {
    const errors = [
      'SyntaxError: invalid syntax',
      'NameError: name \'variable\' is not defined',
      'TypeError: unsupported operand type(s)',
      'IndentationError: expected an indented block',
      'ValueError: invalid literal for int()',
      'IndexError: list index out of range'
    ]
    return errors[Math.floor(Math.random() * errors.length)]
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-blue-500" />
            <span className="font-medium capitalize">{exercise.language}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Time: {formatTime(editorMetrics.timeSpent)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>Characters: {editorState.code.length}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={saveCode}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={downloadCode}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          
          <button
            onClick={resetCode}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
          <span className="text-sm font-mono">
            {exercise.title.replace(/\s+/g, '_')}.{getFileExtension(exercise.language)}
          </span>
          <div className="flex items-center space-x-2 text-xs">
            <span>Lines: {editorState.code.split('\n').length}</span>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            ref={codeEditorRef}
            value={editorState.code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your code here..."
            spellCheck={false}
            style={{ 
              fontSize: `${editorState.fontSize}px`,
              lineHeight: 1.5,
              tabSize: 2
            }}
          />
          
          {editorState.showLineNumbers && (
            <div className="absolute left-0 top-0 p-4 pointer-events-none">
              <div className="text-gray-400 text-sm font-mono leading-relaxed">
                {editorState.code.split('\n').map((_, index) => (
                  <div key={index} className="text-right w-8">
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={executeCode}
          disabled={executionState.isRunning}
          className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {executionState.isRunning ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span>{executionState.isRunning ? 'Running...' : 'Run Code'}</span>
        </button>

        <button
          onClick={runTests}
          disabled={testState.runningTests}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {testState.runningTests ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <TestTube className="w-5 h-5" />
          )}
          <span>{testState.runningTests ? 'Testing...' : 'Run Tests'}</span>
        </button>

        {testState.passedTests === testState.totalTests && testState.totalTests > 0 && (
          <button
            onClick={handleComplete}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span>Submit Solution</span>
          </button>
        )}
      </div>

      {/* Execution Output */}
      {executionState.result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4" />
              <span className="font-medium">Output</span>
            </div>
            
            {executionState.result.executionTime && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Cpu className="w-4 h-4" />
                  <span>{executionState.result.executionTime.toFixed(0)}ms</span>
                </div>
                {executionState.result.memoryUsage && (
                  <div className="flex items-center space-x-1">
                    <Cpu className="w-4 h-4" />
                    <span>{executionState.result.memoryUsage.toFixed(1)}MB</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4">
            {executionState.result.success ? (
              <div className="font-mono text-sm">
                <div className="flex items-start space-x-2 mb-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-green-700 font-medium">Execution Successful</span>
                </div>
                <pre className="bg-gray-100 p-3 rounded text-gray-800 whitespace-pre-wrap">
                  {executionState.result.output}
                </pre>
              </div>
            ) : (
              <div className="font-mono text-sm">
                <div className="flex items-start space-x-2 mb-2">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700 font-medium">Execution Failed</span>
                </div>
                <pre className="bg-red-50 p-3 rounded text-red-800 whitespace-pre-wrap">
                  {executionState.result.error}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Test Results */}
      {testState.showTests && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TestTube className="w-4 h-4" />
              <span className="font-medium">Test Results</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                testState.passedTests === testState.totalTests
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {testState.passedTests}/{testState.totalTests} Passed
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {testState.testResults.map((result, index) => (
              <div
                key={result.testId}
                className={`p-3 rounded-lg border ${
                  result.passed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {result.passed ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium">
                        Test {index + 1} {exercise.testCases[index]?.description}
                      </div>
                      {!result.passed && result.error && (
                        <div className="text-sm text-red-600 mt-1">{result.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {result.executionTime.toFixed(0)}ms
                  </div>
                </div>
                
                {!exercise.testCases[index]?.isHidden && (
                  <div className="mt-2 text-sm space-y-1">
                    <div><strong>Input:</strong> <code>{JSON.stringify(result.input)}</code></div>
                    <div><strong>Expected:</strong> <code>{JSON.stringify(result.expectedOutput)}</code></div>
                    {!result.passed && (
                      <div><strong>Actual:</strong> <code>{JSON.stringify(result.actualOutput)}</code></div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {testState.passedTests === testState.totalTests && testState.totalTests > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-green-50 border border-green-200 rounded-lg text-center"
        >
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Check className="w-8 h-8 text-green-500" />
            <span className="text-xl font-bold text-green-800">Congratulations!</span>
          </div>
          <p className="text-green-700 mb-4">
            Your solution passed all test cases! You've successfully completed this coding exercise.
          </p>
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            Submit Solution
          </button>
        </motion.div>
      )}
    </div>
  )
}