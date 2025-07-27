// Virtual Lab Player
// Interactive virtual laboratory for science experiments
'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Beaker, AlertTriangle, Play, CheckCircle, FileText } from 'lucide-react'
import type { UserProfile } from '@/types'
import type { VirtualLab } from '@/lib/interactive-content-engine'

interface VirtualLabPlayerProps {
  lab: VirtualLab
  userProfile: UserProfile
  onInteraction: (data: any) => void
  onComplete: (submission: any) => void
}

export default function VirtualLabPlayer({
  lab,
  userProfile,
  onInteraction,
  onComplete
}: VirtualLabPlayerProps) {
  const [state, setState] = useState({
    currentStep: 0,
    completedSteps: [] as number[],
    selectedEquipment: [] as string[],
    measurements: {} as Record<string, number>,
    observations: [] as string[]
  })

  const handleStepComplete = (stepIndex: number) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, stepIndex],
      currentStep: stepIndex + 1
    }))

    onInteraction({
      type: 'step_completed',
      data: { stepIndex }
    })

    if (stepIndex + 1 >= lab.procedures.length) {
      setTimeout(() => {
        onComplete({
          completedSteps: [...state.completedSteps, stepIndex],
          measurements: state.measurements,
          observations: state.observations
        })
      }, 1000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Beaker className="w-8 h-8 text-cyan-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Virtual Laboratory</h3>
            <p className="text-sm text-gray-600 capitalize">{lab.labType} experiment</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Step {state.currentStep + 1} of {lab.procedures.length}
        </div>
      </div>

      {/* Safety Guidelines */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-2">Safety Guidelines</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              {lab.safetyGuidelines.map((guideline, index) => (
                <li key={index}>• {guideline}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment & Materials */}
        <div className="space-y-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold mb-3">Equipment</h4>
            <div className="space-y-2">
              {lab.equipment.map(equipment => (
                <div
                  key={equipment.id}
                  className="p-2 border border-gray-200 rounded text-sm"
                >
                  {equipment.name}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold mb-3">Materials</h4>
            <div className="space-y-2">
              {lab.materials.map(material => (
                <div
                  key={material.id}
                  className="p-2 border border-gray-200 rounded text-sm"
                >
                  {material.name} ({material.quantity} {material.unit})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Procedure */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold mb-4">Procedure</h4>
            <div className="space-y-3">
              {lab.procedures.map((procedure, index) => (
                <div
                  key={procedure.id}
                  className={`p-3 border rounded-lg ${
                    state.completedSteps.includes(index)
                      ? 'border-green-200 bg-green-50'
                      : index === state.currentStep
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">Step {procedure.step}</span>
                        {state.completedSteps.includes(index) && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{procedure.instruction}</p>
                      
                      {procedure.tips.length > 0 && (
                        <div className="text-xs text-blue-600 mb-1">
                          💡 {procedure.tips[0]}
                        </div>
                      )}
                    </div>
                    
                    {index === state.currentStep && (
                      <button
                        onClick={() => handleStepComplete(index)}
                        className="ml-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Virtual Lab Interface */}
          <div className="p-6 bg-gray-100 border border-gray-200 rounded-lg">
            <div className="text-center">
              <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-700 mb-2">Virtual Lab Interface</h4>
              <p className="text-sm text-gray-600">
                Interactive lab simulation would appear here
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => onComplete(state)}
          disabled={state.completedSteps.length < lab.procedures.length}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          Complete Experiment
        </button>
      </div>
    </div>
  )
}