// Drag and Drop Player
// Interactive categorization, sequencing, and matching activities
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MousePointer, Check, X, RotateCcw, Eye, 
  Target, Award, ArrowRight, Shuffle, 
  CheckCircle, AlertCircle, Lightbulb
} from 'lucide-react'
import type { UserProfile } from '@/types'
import type { 
  DragDropActivity, 
  DragItem, 
  DropZone 
} from '@/lib/interactive-content-engine'

interface DragDropPlayerProps {
  activity: DragDropActivity
  userProfile: UserProfile
  onInteraction: (data: any) => void
  onComplete: (submission: any) => void
}

interface DragState {
  draggedItem: DragItem | null
  draggedFrom: string | null
  dropZones: Record<string, string[]> // zone id -> item ids
  attempts: number
  correctPlacements: number
  incorrectAttempts: number
  startTime: Date
  completedZones: string[]
  hints: string[]
}

interface DragItemComponentProps {
  item: DragItem
  isBeingDragged: boolean
  onDragStart: (item: DragItem, source: string) => void
  onDragEnd: () => void
  disabled?: boolean
  source: string
}

interface DropZoneComponentProps {
  zone: DropZone
  items: DragItem[]
  isHovered: boolean
  onDrop: (zoneId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  activity: DragDropActivity
}

export default function DragDropPlayer({
  activity,
  userProfile,
  onInteraction,
  onComplete
}: DragDropPlayerProps) {
  const [state, setState] = useState<DragState>({
    draggedItem: null,
    draggedFrom: null,
    dropZones: {},
    attempts: 0,
    correctPlacements: 0,
    incorrectAttempts: 0,
    startTime: new Date(),
    completedZones: [],
    hints: []
  })

  const [gameState, setGameState] = useState<{
    showFeedback: boolean
    isComplete: boolean
    score: number
    feedback: string
    hoveredZone: string | null
  }>({
    showFeedback: false,
    isComplete: false,
    score: 0,
    feedback: '',
    hoveredZone: null
  })

  const dragItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dropZoneRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Initialize drop zones
  useEffect(() => {
    const initialZones: Record<string, string[]> = {}
    activity.dropZones.forEach(zone => {
      initialZones[zone.id] = []
    })
    setState(prev => ({ ...prev, dropZones: initialZones }))
  }, [activity.dropZones])

  // Check completion status
  useEffect(() => {
    checkCompletion()
  }, [state.dropZones])

  const checkCompletion = () => {
    const totalCorrect = activity.dropZones.reduce((total, zone) => {
      const zoneItems = state.dropZones[zone.id] || []
      const correctInZone = zoneItems.filter(itemId => 
        zone.correctItems.includes(itemId)
      ).length
      return total + correctInZone
    }, 0)

    const totalItems = activity.dragItems.length
    const isComplete = totalCorrect === totalItems && 
                      activity.dropZones.every(zone => {
                        const zoneItems = state.dropZones[zone.id] || []
                        return zone.correctItems.every(correctId => 
                          zoneItems.includes(correctId)
                        )
                      })

    const score = Math.round((totalCorrect / totalItems) * 100)

    setGameState(prev => ({
      ...prev,
      isComplete,
      score
    }))

    if (isComplete && !gameState.isComplete) {
      // Activity completed!
      setTimeout(() => {
        handleActivityComplete()
      }, 1000)
    }
  }

  const handleDragStart = (item: DragItem, source: string) => {
    setState(prev => ({
      ...prev,
      draggedItem: item,
      draggedFrom: source
    }))

    onInteraction({
      type: 'drag_start',
      data: {
        itemId: item.id,
        source,
        timestamp: Date.now()
      }
    })
  }

  const handleDragEnd = () => {
    setState(prev => ({
      ...prev,
      draggedItem: null,
      draggedFrom: null
    }))
  }

  const handleDrop = (zoneId: string) => {
    if (!state.draggedItem) return

    const zone = activity.dropZones.find(z => z.id === zoneId)
    if (!zone) return

    const currentZoneItems = state.dropZones[zoneId] || []
    
    // Check if zone is full
    if (zone.maxItems && currentZoneItems.length >= zone.maxItems) {
      showFeedback('This zone is full!', false)
      return
    }

    // Check if item is already in a zone and remove it
    const newDropZones = { ...state.dropZones }
    Object.keys(newDropZones).forEach(zId => {
      newDropZones[zId] = newDropZones[zId].filter(itemId => itemId !== state.draggedItem!.id)
    })

    // Add item to new zone
    newDropZones[zoneId] = [...newDropZones[zoneId], state.draggedItem.id]

    // Check if placement is correct
    const isCorrect = zone.correctItems.includes(state.draggedItem.id)
    
    setState(prev => ({
      ...prev,
      dropZones: newDropZones,
      attempts: prev.attempts + 1,
      correctPlacements: isCorrect ? prev.correctPlacements + 1 : prev.correctPlacements,
      incorrectAttempts: isCorrect ? prev.incorrectAttempts : prev.incorrectAttempts + 1
    }))

    // Show feedback
    if (activity.feedback.showProgressIndicator) {
      const feedbackMessage = isCorrect 
        ? activity.feedback.onCorrectDrop 
        : activity.feedback.onIncorrectDrop
      showFeedback(feedbackMessage, isCorrect)
    }

    onInteraction({
      type: 'item_dropped',
      data: {
        itemId: state.draggedItem.id,
        zoneId,
        isCorrect,
        attempts: state.attempts + 1
      }
    })

    handleDragEnd()
  }

  const showFeedback = (message: string, isPositive: boolean) => {
    setGameState(prev => ({
      ...prev,
      showFeedback: true,
      feedback: message
    }))

    setTimeout(() => {
      setGameState(prev => ({ ...prev, showFeedback: false }))
    }, 2000)
  }

  const resetActivity = () => {
    const emptyZones: Record<string, string[]> = {}
    activity.dropZones.forEach(zone => {
      emptyZones[zone.id] = []
    })

    setState(prev => ({
      ...prev,
      dropZones: emptyZones,
      attempts: 0,
      correctPlacements: 0,
      incorrectAttempts: 0,
      startTime: new Date(),
      completedZones: [],
      draggedItem: null,
      draggedFrom: null
    }))

    setGameState(prev => ({
      ...prev,
      isComplete: false,
      score: 0,
      showFeedback: false
    }))

    onInteraction({
      type: 'activity_reset',
      data: { timestamp: Date.now() }
    })
  }

  const shuffleItems = () => {
    // Remove all items from zones and shuffle
    const emptyZones: Record<string, string[]> = {}
    activity.dropZones.forEach(zone => {
      emptyZones[zone.id] = []
    })

    setState(prev => ({ ...prev, dropZones: emptyZones }))

    onInteraction({
      type: 'items_shuffled',
      data: { timestamp: Date.now() }
    })
  }

  const getHint = () => {
    // Find an item that's not correctly placed
    const incorrectItems = activity.dragItems.filter(item => {
      const currentZone = Object.keys(state.dropZones).find(zoneId => 
        state.dropZones[zoneId].includes(item.id)
      )
      
      if (!currentZone) return true // Not placed anywhere
      
      const zone = activity.dropZones.find(z => z.id === currentZone)
      return zone ? !zone.correctItems.includes(item.id) : true
    })

    if (incorrectItems.length > 0) {
      const item = incorrectItems[0]
      const correctZone = activity.dropZones.find(zone => 
        zone.correctItems.includes(item.id)
      )
      
      if (correctZone) {
        const hint = `Try placing "${item.content}" in the "${correctZone.label}" category.`
        setState(prev => ({ ...prev, hints: [...prev.hints, hint] }))
        showFeedback(hint, true)
      }
    }

    onInteraction({
      type: 'hint_requested',
      data: { hintsUsed: state.hints.length + 1 }
    })
  }

  const handleActivityComplete = () => {
    const completionTime = Date.now() - state.startTime.getTime()
    const accuracy = state.correctPlacements / (state.correctPlacements + state.incorrectAttempts)

    const submission = {
      activityType: activity.activityType,
      completionTime,
      accuracy,
      attempts: state.attempts,
      score: gameState.score,
      hintsUsed: state.hints.length,
      finalState: state.dropZones
    }

    onComplete(submission)
  }

  const getAvailableItems = (): DragItem[] => {
    const placedItemIds = new Set(
      Object.values(state.dropZones).flat()
    )
    return activity.dragItems.filter(item => !placedItemIds.has(item.id))
  }

  const getItemsInZone = (zoneId: string): DragItem[] => {
    const itemIds = state.dropZones[zoneId] || []
    return itemIds.map(id => activity.dragItems.find(item => item.id === id)).filter(Boolean) as DragItem[]
  }

  return (
    <div className="space-y-6">
      {/* Activity Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <MousePointer className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {activity.activityType.replace('_', ' ')} Activity
            </h3>
            <p className="text-sm text-gray-600">
              Drag items to their correct categories
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Score: {gameState.score}%
          </div>
          <div className="text-sm text-gray-600">
            Attempts: {state.attempts}
          </div>
          <div className="text-sm text-gray-600">
            Accuracy: {state.attempts > 0 ? Math.round((state.correctPlacements / state.attempts) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={resetActivity}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset</span>
          </button>

          <button
            onClick={shuffleItems}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Shuffle className="w-5 h-5" />
            <span>Shuffle</span>
          </button>

          <button
            onClick={getHint}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            <span>Hint ({state.hints.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {getAvailableItems().length} items remaining
          </span>
        </div>
      </div>

      {/* Drag Items Bank */}
      <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <h4 className="font-semibold mb-3">Items to Sort</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 min-h-[100px]">
          {getAvailableItems().map(item => (
            <DragItemComponent
              key={item.id}
              item={item}
              isBeingDragged={state.draggedItem?.id === item.id}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              source="bank"
            />
          ))}
          
          {getAvailableItems().length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              All items have been placed!
            </div>
          )}
        </div>
      </div>

      {/* Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activity.dropZones.map(zone => (
          <DropZoneComponent
            key={zone.id}
            zone={zone}
            items={getItemsInZone(zone.id)}
            isHovered={gameState.hoveredZone === zone.id}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setGameState(prev => ({ ...prev, hoveredZone: zone.id }))
            }}
            onDragLeave={() => {
              setGameState(prev => ({ ...prev, hoveredZone: null }))
            }}
            activity={activity}
          />
        ))}
      </div>

      {/* Progress Indicator */}
      {activity.feedback.showProgressIndicator && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {state.correctPlacements}/{activity.dragItems.length} correct
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-green-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${(state.correctPlacements / activity.dragItems.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Feedback Overlay */}
      <AnimatePresence>
        {gameState.showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
              <div className="flex items-center space-x-2">
                <div className="text-blue-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="font-medium">{gameState.feedback}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Celebration */}
      <AnimatePresence>
        {gameState.isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 text-center"
            >
              <div className="mb-4">
                <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Congratulations!
                </h3>
                <p className="text-gray-600">
                  {activity.feedback.onCompletion}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Final Score</div>
                    <div className="text-2xl font-bold text-green-600">{gameState.score}%</div>
                  </div>
                  <div>
                    <div className="font-medium">Attempts</div>
                    <div className="text-2xl font-bold text-blue-600">{state.attempts}</div>
                  </div>
                  <div>
                    <div className="font-medium">Accuracy</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((state.correctPlacements / state.attempts) * 100)}%
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Hints Used</div>
                    <div className="text-2xl font-bold text-orange-600">{state.hints.length}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleActivityComplete}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
              >
                Complete Activity
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Drag Item Component
function DragItemComponent({ 
  item, 
  isBeingDragged, 
  onDragStart, 
  onDragEnd, 
  disabled = false,
  source 
}: DragItemComponentProps) {
  return (
    <motion.div
      layout
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      whileDrag={{ scale: 1.05, zIndex: 10 }}
      onDragStart={() => onDragStart(item, source)}
      onDragEnd={onDragEnd}
      className={`
        p-3 bg-white border rounded-lg cursor-grab active:cursor-grabbing
        transition-all duration-200 select-none
        ${isBeingDragged 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="text-sm font-medium text-center">
        {item.content}
      </div>
      
      {item.type === 'image' && item.src && (
        <div className="mt-2">
          <img 
            src={item.src} 
            alt={item.content}
            className="w-full h-16 object-cover rounded"
          />
        </div>
      )}
      
      {item.category && (
        <div className="mt-1 text-xs text-gray-500 text-center">
          {item.category}
        </div>
      )}
    </motion.div>
  )
}

// Drop Zone Component
function DropZoneComponent({ 
  zone, 
  items, 
  isHovered, 
  onDrop, 
  onDragOver, 
  onDragLeave,
  activity 
}: DropZoneComponentProps) {
  const isCorrect = zone.correctItems.every(correctId => 
    items.some(item => item.id === correctId)
  ) && items.every(item => zone.correctItems.includes(item.id))

  const isFull = zone.maxItems ? items.length >= zone.maxItems : false

  return (
    <div
      onDrop={(e) => {
        e.preventDefault()
        onDrop(zone.id)
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        p-4 border-2 border-dashed rounded-lg min-h-[200px] transition-all duration-200
        ${isHovered 
          ? 'border-blue-500 bg-blue-50' 
          : isCorrect
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-gray-50'
        }
        ${isFull ? 'border-red-500 bg-red-50' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{zone.label}</h4>
        <div className="flex items-center space-x-2">
          {isCorrect && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {zone.maxItems && (
            <span className={`text-sm px-2 py-1 rounded ${
              isFull ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {items.length}/{zone.maxItems}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 min-h-[120px]">
        {items.map(item => (
          <DragItemComponent
            key={item.id}
            item={item}
            isBeingDragged={false}
            onDragStart={(item, source) => {
              // Handle dragging from zone
            }}
            onDragEnd={() => {}}
            source={zone.id}
          />
        ))}

        {items.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-center">
            <div>
              <MousePointer className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Drop items here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}