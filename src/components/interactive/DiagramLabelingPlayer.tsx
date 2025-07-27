// Diagram Labeling Player
// Interactive diagram labeling for anatomy, geography, chemistry, etc.
'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Layers, Target, Check, X, RotateCcw, Lightbulb } from 'lucide-react'
import type { UserProfile } from '@/types'
import type { DiagramLabeling } from '@/lib/interactive-content-engine'

interface DiagramLabelingPlayerProps {
  diagram: DiagramLabeling
  userProfile: UserProfile
  onInteraction: (data: any) => void
  onComplete: (submission: any) => void
}

export default function DiagramLabelingPlayer({
  diagram,
  userProfile,
  onInteraction,
  onComplete
}: DiagramLabelingPlayerProps) {
  const [state, setState] = useState({
    placedLabels: {} as Record<string, string>, // point id -> label id
    attempts: 0,
    correctPlacements: 0,
    isComplete: false
  })

  const handleLabelPlacement = (pointId: string, labelId: string) => {
    const isCorrect = diagram.labelPoints.find(p => p.id === pointId)?.correctLabel === labelId
    
    setState(prev => ({
      ...prev,
      placedLabels: { ...prev.placedLabels, [pointId]: labelId },
      attempts: prev.attempts + 1,
      correctPlacements: isCorrect ? prev.correctPlacements + 1 : prev.correctPlacements
    }))

    onInteraction({
      type: 'label_placed',
      data: { pointId, labelId, isCorrect }
    })

    // Check completion
    if (Object.keys(state.placedLabels).length + 1 === diagram.labelPoints.length) {
      setTimeout(() => {
        onComplete({
          placedLabels: { ...state.placedLabels, [pointId]: labelId },
          accuracy: state.correctPlacements / diagram.labelPoints.length
        })
      }, 1000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Layers className="w-8 h-8 text-indigo-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Diagram Labeling</h3>
            <p className="text-sm text-gray-600">Label the parts of the diagram</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Progress: {Object.keys(state.placedLabels).length}/{diagram.labelPoints.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagram */}
        <div className="lg:col-span-2">
          <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
            {diagram.diagramUrl ? (
              <img 
                src={diagram.diagramUrl} 
                alt="Diagram to label"
                className="w-full h-auto"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Layers className="w-16 h-16 mx-auto mb-4" />
                  <p>Diagram placeholder</p>
                  <p className="text-sm">({diagram.diagramType} diagram)</p>
                </div>
              </div>
            )}

            {/* Label points */}
            {diagram.labelPoints.map(point => (
              <div
                key={point.id}
                className="absolute w-4 h-4 bg-red-500 rounded-full cursor-pointer transform -translate-x-2 -translate-y-2"
                style={{ 
                  left: `${point.x}%`, 
                  top: `${point.y}%` 
                }}
                onClick={() => {
                  // Handle point click - in real implementation would show label options
                }}
              >
                {state.placedLabels[point.id] && (
                  <div className="absolute top-6 left-0 bg-white p-2 rounded shadow text-xs whitespace-nowrap">
                    {diagram.labelBank.find(l => l.id === state.placedLabels[point.id])?.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Label Bank */}
        <div className="space-y-4">
          <h4 className="font-semibold">Available Labels</h4>
          <div className="space-y-2">
            {diagram.labelBank.map(label => (
              <div
                key={label.id}
                className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => {
                  // Handle label selection
                }}
              >
                {label.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => onComplete(state)}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          Complete Labeling
        </button>
      </div>
    </div>
  )
}