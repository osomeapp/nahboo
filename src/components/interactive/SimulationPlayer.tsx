// Simulation Player
// Interactive physics, chemistry, and business simulations
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, Pause, RotateCcw, Settings, BarChart3, 
  Sliders, Eye, Download, Share, Zap, Target,
  TrendingUp, Activity, Gauge, Timer, Save,
  MonitorPlay, Beaker, Calculator, Globe
} from 'lucide-react'
import type { UserProfile } from '@/types'
import type { 
  Simulation, 
  SimulationParameter, 
  SimulationScenario,
  VisualizationConfig
} from '@/lib/interactive-content-engine'

interface SimulationPlayerProps {
  simulation: Simulation
  userProfile: UserProfile
  onInteraction: (data: any) => void
  onComplete: (submission: any) => void
}

interface SimulationState {
  isRunning: boolean
  isPaused: boolean
  currentTime: number
  timeScale: number
  parameters: Record<string, any>
  selectedScenario: string | null
  data: SimulationDataPoint[]
  insights: string[]
  achievements: string[]
}

interface SimulationDataPoint {
  time: number
  values: Record<string, number>
  events: string[]
}

interface ParameterControlProps {
  parameter: SimulationParameter
  value: any
  onChange: (value: any) => void
  disabled?: boolean
}

export default function SimulationPlayer({
  simulation,
  userProfile,
  onInteraction,
  onComplete
}: SimulationPlayerProps) {
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    timeScale: 1,
    parameters: {},
    selectedScenario: null,
    data: [],
    insights: [],
    achievements: []
  })

  const [viewConfig, setViewConfig] = useState({
    activeVisualization: 0,
    showGrid: true,
    showLabels: true,
    autoScale: true,
    theme: 'light'
  })

  const simulationCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize simulation parameters with defaults
  useEffect(() => {
    const initialParameters: Record<string, any> = {}
    simulation.parameters.forEach(param => {
      initialParameters[param.id] = param.defaultValue
    })
    setState(prev => ({ ...prev, parameters: initialParameters }))
  }, [simulation.parameters])

  // Simulation loop
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      simulationTimerRef.current = setInterval(() => {
        updateSimulation()
      }, 100 / state.timeScale) // Adjust interval based on time scale

      return () => {
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current)
        }
      }
    }
  }, [state.isRunning, state.isPaused, state.timeScale, state.parameters])

  const updateSimulation = () => {
    setState(prev => {
      const newTime = prev.currentTime + 0.1 * prev.timeScale
      const newDataPoint = calculateSimulationStep(newTime, prev.parameters)
      
      return {
        ...prev,
        currentTime: newTime,
        data: [...prev.data.slice(-999), newDataPoint] // Keep last 1000 points
      }
    })
  }

  const calculateSimulationStep = (time: number, parameters: Record<string, any>): SimulationDataPoint => {
    // Mock simulation calculations based on type
    const values: Record<string, number> = {}
    const events: string[] = []

    switch (simulation.simulationType) {
      case 'physics':
        values.position = Math.sin(time * (parameters.frequency || 1)) * (parameters.amplitude || 1)
        values.velocity = Math.cos(time * (parameters.frequency || 1)) * (parameters.amplitude || 1) * (parameters.frequency || 1)
        values.acceleration = -Math.sin(time * (parameters.frequency || 1)) * (parameters.amplitude || 1) * Math.pow(parameters.frequency || 1, 2)
        break

      case 'chemistry':
        const reactionRate = parameters.temperature ? Math.exp(-1000 / (8.314 * parameters.temperature)) : 0.1
        values.concentration_A = Math.max(0, (parameters.initial_concentration || 1) * Math.exp(-reactionRate * time))
        values.concentration_B = (parameters.initial_concentration || 1) - values.concentration_A
        values.temperature = parameters.temperature || 298
        values.pressure = parameters.pressure || 1
        break

      case 'biology':
        const growthRate = parameters.growth_rate || 0.1
        const carryingCapacity = parameters.carrying_capacity || 1000
        values.population = carryingCapacity / (1 + Math.exp(-growthRate * (time - 10)))
        values.resources = Math.max(0, (parameters.initial_resources || 1000) - values.population * 0.1)
        break

      case 'economics':
        values.supply = Math.max(0, (parameters.base_supply || 100) + (parameters.price || 10) * (parameters.supply_elasticity || 1))
        values.demand = Math.max(0, (parameters.base_demand || 100) - (parameters.price || 10) * (parameters.demand_elasticity || 1))
        values.price = parameters.price || 10
        values.equilibrium = Math.abs(values.supply - values.demand) < 5
        break

      case 'business':
        values.revenue = time * (parameters.monthly_revenue || 1000) + Math.sin(time) * (parameters.seasonality || 100)
        values.costs = time * (parameters.monthly_costs || 800) + (parameters.fixed_costs || 2000)
        values.profit = values.revenue - values.costs
        values.growth_rate = values.profit > 0 ? Math.min(0.1, values.profit / 10000) : 0
        break

      default:
        values.value = Math.sin(time) + Math.random() * 0.1
    }

    return { time, values, events }
  }

  const startSimulation = () => {
    setState(prev => ({ 
      ...prev, 
      isRunning: true, 
      isPaused: false,
      currentTime: 0,
      data: []
    }))
    
    onInteraction({
      type: 'simulation_start',
      data: {
        simulationType: simulation.simulationType,
        parameters: state.parameters,
        scenario: state.selectedScenario
      }
    })
  }

  const pauseSimulation = () => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }))
    
    onInteraction({
      type: state.isPaused ? 'simulation_resume' : 'simulation_pause',
      data: {
        currentTime: state.currentTime,
        dataPoints: state.data.length
      }
    })
  }

  const resetSimulation = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      data: [],
      insights: [],
      achievements: []
    }))

    onInteraction({
      type: 'simulation_reset',
      data: { timestamp: Date.now() }
    })
  }

  const handleParameterChange = (parameterId: string, value: any) => {
    setState(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [parameterId]: value
      }
    }))

    onInteraction({
      type: 'parameter_change',
      data: {
        parameterId,
        value,
        timestamp: Date.now()
      }
    })
  }

  const loadScenario = (scenarioId: string) => {
    const scenario = simulation.scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    setState(prev => ({
      ...prev,
      selectedScenario: scenarioId,
      parameters: { ...prev.parameters, ...scenario.preset },
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      data: []
    }))

    onInteraction({
      type: 'scenario_loaded',
      data: {
        scenarioId,
        difficulty: scenario.difficulty
      }
    })
  }

  const exportData = () => {
    const csvData = generateCSVData()
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${simulation.title.replace(/\s+/g, '_')}_data.csv`
    a.click()
    URL.revokeObjectURL(url)

    onInteraction({
      type: 'data_export',
      data: { dataPoints: state.data.length }
    })
  }

  const generateCSVData = (): string => {
    if (state.data.length === 0) return ''

    const headers = ['time', ...Object.keys(state.data[0].values)]
    const rows = state.data.map(point => [
      point.time.toFixed(3),
      ...Object.values(point.values).map(v => typeof v === 'number' ? v.toFixed(3) : v)
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const analyzeResults = () => {
    if (state.data.length < 10) return

    const insights = generateInsights()
    const achievements = checkAchievements()

    setState(prev => ({
      ...prev,
      insights,
      achievements
    }))

    onInteraction({
      type: 'analysis_generated',
      data: {
        insights: insights.length,
        achievements: achievements.length
      }
    })
  }

  const generateInsights = (): string[] => {
    const insights: string[] = []
    const latestData = state.data[state.data.length - 1]
    
    if (!latestData) return insights

    // Generate type-specific insights
    switch (simulation.simulationType) {
      case 'physics':
        if (latestData.values.velocity > 0) {
          insights.push('The object is moving in the positive direction')
        }
        if (Math.abs(latestData.values.acceleration) > 1) {
          insights.push('High acceleration detected - check your force parameters')
        }
        break

      case 'chemistry':
        const reactionProgress = 1 - (latestData.values.concentration_A / (state.parameters.initial_concentration || 1))
        if (reactionProgress > 0.9) {
          insights.push('The reaction is nearly complete (>90% conversion)')
        }
        break

      case 'economics':
        if (Math.abs(latestData.values.supply - latestData.values.demand) < 5) {
          insights.push('Market is approaching equilibrium')
        }
        break
    }

    return insights
  }

  const checkAchievements = (): string[] => {
    const achievements: string[] = []

    if (state.data.length > 100) {
      achievements.push('Long Runner: Simulated for 100+ time steps')
    }

    if (state.currentTime > 50) {
      achievements.push('Time Traveler: Reached 50+ time units')
    }

    const parameterChanges = state.data.length > 50 ? 'Parameter Explorer: Modified multiple parameters' : ''
    if (parameterChanges) achievements.push(parameterChanges)

    return achievements
  }

  const handleComplete = () => {
    const submission = {
      simulationType: simulation.simulationType,
      finalState: state,
      parameters: state.parameters,
      data: state.data,
      insights: state.insights,
      achievements: state.achievements,
      totalTime: state.currentTime,
      scenario: state.selectedScenario
    }

    onComplete(submission)
  }

  const getSimulationIcon = () => {
    const icons = {
      physics: Zap,
      chemistry: Beaker,
      biology: Activity,
      economics: TrendingUp,
      business: BarChart3,
      engineering: Settings,
      environmental: Globe
    }
    return icons[simulation.simulationType] || MonitorPlay
  }

  const SimulationIcon = getSimulationIcon()

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <SimulationIcon className="w-8 h-8 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {simulation.simulationType} Simulation
            </h3>
            <p className="text-sm text-gray-600">
              Interactive {simulation.simulationType} modeling environment
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Time: {state.currentTime.toFixed(1)}s
          </div>
          <div className="text-sm text-gray-600">
            Points: {state.data.length}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Controls */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <button
              onClick={state.isRunning ? pauseSimulation : startSimulation}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                state.isRunning
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {state.isRunning ? (
                state.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span>
                {state.isRunning 
                  ? (state.isPaused ? 'Resume' : 'Pause')
                  : 'Start'
                }
              </span>
            </button>

            <button
              onClick={resetSimulation}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Speed:</label>
              <select
                value={state.timeScale}
                onChange={(e) => setState(prev => ({ ...prev, timeScale: Number(e.target.value) }))}
                className="px-3 py-1 border border-gray-300 rounded"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
              </select>
            </div>

            <button
              onClick={exportData}
              disabled={state.data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>

          {/* Scenarios */}
          {simulation.scenarios.length > 0 && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-semibold mb-3">Scenarios</h4>
              <div className="grid grid-cols-2 gap-2">
                {simulation.scenarios.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => loadScenario(scenario.id)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      state.selectedScenario === scenario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-sm text-gray-600">{scenario.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Difficulty: {scenario.difficulty}/10
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visualization Canvas */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Visualization</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewConfig(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                  className={`p-2 rounded ${viewConfig.showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewConfig(prev => ({ ...prev, showLabels: !prev.showLabels }))}
                  className={`p-2 rounded ${viewConfig.showLabels ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <canvas
                ref={simulationCanvasRef}
                width={600}
                height={400}
                className="w-full border border-gray-200 rounded bg-gray-50"
              />
              
              {/* Simple data visualization overlay */}
              {state.data.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 p-4 rounded-lg shadow">
                    <SimulationVisualization 
                      data={state.data}
                      simulationType={simulation.simulationType}
                      parameters={state.parameters}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parameters Panel */}
        <div className="space-y-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold mb-4 flex items-center space-x-2">
              <Sliders className="w-5 h-5" />
              <span>Parameters</span>
            </h4>
            
            <div className="space-y-4">
              {simulation.parameters.map(parameter => (
                <ParameterControl
                  key={parameter.id}
                  parameter={parameter}
                  value={state.parameters[parameter.id]}
                  onChange={(value) => handleParameterChange(parameter.id, value)}
                  disabled={state.isRunning && !state.isPaused}
                />
              ))}
            </div>
          </div>

          {/* Real-time Data */}
          {state.data.length > 0 && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-semibold mb-3">Current Values</h4>
              <div className="space-y-2">
                {Object.entries(state.data[state.data.length - 1].values).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-sm font-mono">
                      {typeof value === 'number' ? value.toFixed(3) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {state.insights.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-900">Insights</h4>
              <div className="space-y-2">
                {state.insights.map((insight, index) => (
                  <div key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                    <Target className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {state.achievements.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-3 text-yellow-900">Achievements</h4>
              <div className="space-y-2">
                {state.achievements.map((achievement, index) => (
                  <div key={index} className="text-sm text-yellow-800 flex items-start space-x-2">
                    <Target className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis and Completion */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={analyzeResults}
            disabled={state.data.length < 10}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analyze Results</span>
          </button>

          <div className="text-sm text-gray-600">
            {state.data.length < 10 
              ? `Need ${10 - state.data.length} more data points for analysis`
              : 'Ready for analysis'
            }
          </div>
        </div>

        {state.data.length >= 20 && (
          <button
            onClick={handleComplete}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Target className="w-5 h-5" />
            <span>Complete Simulation</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Parameter Control Component
function ParameterControl({ parameter, value, onChange, disabled = false }: ParameterControlProps) {
  const renderControl = () => {
    switch (parameter.type) {
      case 'slider':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{parameter.min}</span>
              <span className="font-mono">{value}</span>
              <span>{parameter.max}</span>
            </div>
            <input
              type="range"
              min={parameter.min}
              max={parameter.max}
              step={parameter.step || 0.1}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full"
            />
          </div>
        )

      case 'input':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {parameter.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'toggle':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="rounded"
            />
            <span className="text-sm">{value ? 'Enabled' : 'Disabled'}</span>
          </label>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium capitalize">
          {parameter.name.replace(/_/g, ' ')}
        </label>
        {parameter.unit && (
          <span className="text-xs text-gray-500">{parameter.unit}</span>
        )}
      </div>
      {renderControl()}
      {parameter.description && (
        <p className="text-xs text-gray-600">{parameter.description}</p>
      )}
    </div>
  )
}

// Simple visualization component
function SimulationVisualization({ 
  data, 
  simulationType, 
  parameters 
}: { 
  data: SimulationDataPoint[]
  simulationType: string
  parameters: Record<string, any>
}) {
  if (data.length === 0) return null

  const latest = data[data.length - 1]
  
  return (
    <div className="text-center">
      <div className="text-lg font-semibold mb-2">Real-time Data</div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {Object.entries(latest.values).slice(0, 4).map(([key, value]) => (
          <div key={key}>
            <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>
            <div className="text-xl font-mono">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}