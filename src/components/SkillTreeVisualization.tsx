'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserProfile } from '@/lib/store'
import { useMasteryProgression } from '@/hooks/useMasteryProgression'
import type { SkillNode, SkillTree, ProgressionRecommendation } from '@/lib/mastery-progression-engine'
import { Lock, Unlock, CheckCircle, Target, Clock, Trophy, ArrowRight, Info, Zap } from 'lucide-react'

interface SkillTreeVisualizationProps {
  subject: string
  onSkillSelect?: (skill: SkillNode) => void
  onAssessmentStart?: (skillId: string) => void
  className?: string
}

export default function SkillTreeVisualization({
  subject,
  onSkillSelect,
  onAssessmentStart,
  className = ''
}: SkillTreeVisualizationProps) {
  const userProfile = useUserProfile()
  const masteryProgression = useMasteryProgression(
    userProfile?.id || 'demo-user',
    userProfile!
  )

  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null)
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'progress'>('tree')
  const [showConnections, setShowConnections] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)

  // Get skill tree for the subject
  const skillTree = masteryProgression.filteredSkillTrees.find(tree => 
    tree.subjectArea === subject
  )

  // Load skill tree on mount
  useEffect(() => {
    if (userProfile && subject && !skillTree) {
      masteryProgression.getSkillTree(subject).catch(console.error)
    }
  }, [userProfile, subject, skillTree, masteryProgression])

  // Handle skill selection
  const handleSkillSelect = useCallback((skill: SkillNode) => {
    setSelectedSkill(skill)
    if (onSkillSelect) {
      onSkillSelect(skill)
    }
  }, [onSkillSelect])

  // Handle assessment start
  const handleAssessmentStart = useCallback((skillId: string) => {
    if (onAssessmentStart) {
      onAssessmentStart(skillId)
    }
  }, [onAssessmentStart])

  // Get skill status color
  const getSkillStatusColor = useCallback((skill: SkillNode) => {
    if (skill.isCompleted) return 'bg-green-500'
    if (!skill.isUnlocked) return 'bg-gray-300'
    if (skill.currentMastery >= 0.8) return 'bg-blue-500'
    if (skill.currentMastery >= 0.5) return 'bg-yellow-500'
    return 'bg-orange-500'
  }, [])

  // Get skill status icon
  const getSkillStatusIcon = useCallback((skill: SkillNode) => {
    if (skill.isCompleted) return <CheckCircle className="w-4 h-4 text-white" />
    if (!skill.isUnlocked) return <Lock className="w-4 h-4 text-gray-600" />
    if (skill.currentMastery >= 0.8) return <Target className="w-4 h-4 text-white" />
    return <Unlock className="w-4 h-4 text-white" />
  }, [])

  // Calculate skill connections for visualization
  const getSkillConnections = useCallback((skills: SkillNode[]) => {
    const connections: Array<{ from: SkillNode; to: SkillNode }> = []
    
    skills.forEach(skill => {
      skill.prerequisites.forEach(prereqId => {
        const prereqSkill = skills.find(s => s.skillId === prereqId)
        if (prereqSkill) {
          connections.push({ from: prereqSkill, to: skill })
        }
      })
    })
    
    return connections
  }, [])

  // Render skill tree connections
  const renderConnections = useCallback((skills: SkillNode[]) => {
    if (!showConnections) return null
    
    const connections = getSkillConnections(skills)
    
    return (
      <g className="connections">
        {connections.map((connection, index) => {
          const fromX = connection.from.position.x + 60 // Half of skill node width
          const fromY = connection.from.position.y + 30 // Half of skill node height
          const toX = connection.to.position.x + 60
          const toY = connection.to.position.y + 30
          
          const isActive = connection.from.isCompleted && connection.to.isUnlocked
          
          return (
            <motion.line
              key={`connection-${index}`}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke={isActive ? '#3B82F6' : '#D1D5DB'}
              strokeWidth={isActive ? 3 : 2}
              strokeDasharray={isActive ? '0' : '5,5'}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          )
        })}
      </g>
    )
  }, [showConnections, getSkillConnections])

  if (!userProfile) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <p>Please complete your profile to view skill trees</p>
        </div>
      </div>
    )
  }

  if (!skillTree) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {subject} skill tree...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {subject} Skill Tree
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {skillTree.completedSkills} of {skillTree.totalSkills} skills mastered
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 p-1">
              {(['tree', 'list', 'progress'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Connections Toggle */}
            {viewMode === 'tree' && (
              <button
                onClick={() => setShowConnections(!showConnections)}
                className={`p-2 rounded-lg transition-colors ${
                  showConnections
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={showConnections ? 'Hide connections' : 'Show connections'}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round((skillTree.completedSkills / skillTree.totalSkills) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(skillTree.completedSkills / skillTree.totalSkills) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'tree' && (
          <TreeView
            skillTree={skillTree}
            selectedSkill={selectedSkill}
            hoveredSkill={hoveredSkill}
            onSkillSelect={handleSkillSelect}
            onSkillHover={setHoveredSkill}
            onAssessmentStart={handleAssessmentStart}
            getSkillStatusColor={getSkillStatusColor}
            getSkillStatusIcon={getSkillStatusIcon}
            renderConnections={renderConnections}
            svgRef={svgRef}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            skillTree={skillTree}
            selectedSkill={selectedSkill}
            onSkillSelect={handleSkillSelect}
            onAssessmentStart={handleAssessmentStart}
            getSkillStatusColor={getSkillStatusColor}
            getSkillStatusIcon={getSkillStatusIcon}
          />
        )}

        {viewMode === 'progress' && (
          <ProgressView
            skillTree={skillTree}
            selectedSkill={selectedSkill}
            onSkillSelect={handleSkillSelect}
            masteryProgression={masteryProgression}
          />
        )}
      </div>

      {/* Skill Detail Panel */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillDetailPanel
            skill={selectedSkill}
            onClose={() => setSelectedSkill(null)}
            onAssessmentStart={handleAssessmentStart}
            masteryProgression={masteryProgression}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Tree View Component
function TreeView({ 
  skillTree, 
  selectedSkill, 
  hoveredSkill, 
  onSkillSelect, 
  onSkillHover, 
  onAssessmentStart,
  getSkillStatusColor,
  getSkillStatusIcon,
  renderConnections,
  svgRef 
}: any) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewBox, setViewBox] = useState('0 0 800 600')

  // Calculate optimal viewBox based on skill positions
  useEffect(() => {
    if (skillTree.skillNodes.length > 0) {
      const positions = skillTree.skillNodes.map(skill => skill.position)
      const minX = Math.min(...positions.map(p => p.x)) - 50
      const minY = Math.min(...positions.map(p => p.y)) - 50
      const maxX = Math.max(...positions.map(p => p.x)) + 150
      const maxY = Math.max(...positions.map(p => p.y)) + 100
      
      setViewBox(`${minX} ${minY} ${maxX - minX} ${maxY - minY}`)
    }
  }, [skillTree.skillNodes])

  return (
    <div ref={containerRef} className="relative w-full h-96 overflow-hidden rounded-lg border border-gray-200">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full"
        style={{ background: 'linear-gradient(45deg, #f8fafc 25%, transparent 25%, transparent 75%, #f8fafc 75%), linear-gradient(45deg, #f8fafc 25%, transparent 25%, transparent 75%, #f8fafc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}
      >
        {/* Render connections */}
        {renderConnections(skillTree.skillNodes)}
        
        {/* Render skill nodes */}
        {skillTree.skillNodes.map((skill, index) => (
          <SkillNodeComponent
            key={skill.skillId}
            skill={skill}
            isSelected={selectedSkill?.skillId === skill.skillId}
            isHovered={hoveredSkill === skill.skillId}
            onSelect={onSkillSelect}
            onHover={onSkillHover}
            onAssessmentStart={onAssessmentStart}
            getStatusColor={getSkillStatusColor}
            getStatusIcon={getSkillStatusIcon}
            animationDelay={index * 0.1}
          />
        ))}
      </svg>
    </div>
  )
}

// Skill Node Component
function SkillNodeComponent({ 
  skill, 
  isSelected, 
  isHovered, 
  onSelect, 
  onHover, 
  onAssessmentStart,
  getStatusColor,
  getStatusIcon,
  animationDelay 
}: any) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      style={{ cursor: 'pointer' }}
    >
      {/* Skill Circle */}
      <motion.circle
        cx={skill.position.x + 60}
        cy={skill.position.y + 30}
        r={isSelected ? 35 : isHovered ? 32 : 30}
        className={`${getStatusColor(skill)} transition-all duration-200`}
        onClick={() => onSelect(skill)}
        onMouseEnter={() => onHover(skill.skillId)}
        onMouseLeave={() => onHover(null)}
        style={{ filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none' }}
      />
      
      {/* Skill Icon */}
      <foreignObject
        x={skill.position.x + 45}
        y={skill.position.y + 15}
        width={30}
        height={30}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center justify-center w-full h-full">
          {getStatusIcon(skill)}
        </div>
      </foreignObject>
      
      {/* Mastery Progress Ring */}
      <motion.circle
        cx={skill.position.x + 60}
        cy={skill.position.y + 30}
        r={35}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={3}
        strokeDasharray={`${skill.currentMastery * 220} 220`}
        strokeLinecap="round"
        transform={`rotate(-90 ${skill.position.x + 60} ${skill.position.y + 30})`}
        initial={{ strokeDasharray: '0 220' }}
        animate={{ strokeDasharray: `${skill.currentMastery * 220} 220` }}
        transition={{ duration: 1, delay: animationDelay }}
      />
      
      {/* Skill Name */}
      <text
        x={skill.position.x + 60}
        y={skill.position.y + 85}
        textAnchor="middle"
        className="text-xs font-medium fill-gray-700"
        style={{ pointerEvents: 'none' }}
      >
        {skill.name.length > 15 ? `${skill.name.substring(0, 15)}...` : skill.name}
      </text>
      
      {/* Mastery Percentage */}
      <text
        x={skill.position.x + 60}
        y={skill.position.y + 98}
        textAnchor="middle"
        className="text-xs fill-gray-500"
        style={{ pointerEvents: 'none' }}
      >
        {Math.round(skill.currentMastery * 100)}%
      </text>
    </motion.g>
  )
}

// List View Component
function ListView({ 
  skillTree, 
  selectedSkill, 
  onSkillSelect, 
  onAssessmentStart,
  getSkillStatusColor,
  getSkillStatusIcon 
}: any) {
  const categorizedSkills = skillTree.skillNodes.reduce((acc: any, skill: SkillNode) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(categorizedSkills).map(([category, skills]: [string, any]) => (
        <div key={category}>
          <h4 className="font-medium text-gray-900 mb-3 capitalize">
            {category} Skills ({skills.length})
          </h4>
          <div className="space-y-2">
            {skills.map((skill: SkillNode) => (
              <motion.div
                key={skill.skillId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedSkill?.skillId === skill.skillId
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onSkillSelect(skill)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSkillStatusColor(skill)}`}>
                      {getSkillStatusIcon(skill)}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{skill.name}</h5>
                      <p className="text-sm text-gray-600">{skill.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {Math.round(skill.currentMastery * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Difficulty: {skill.difficulty}/10
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.currentMastery * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Progress View Component
function ProgressView({ skillTree, selectedSkill, onSkillSelect, masteryProgression }: any) {
  const sortedSkills = [...skillTree.skillNodes].sort((a, b) => b.currentMastery - a.currentMastery)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{skillTree.completedSkills}</div>
          <div className="text-sm text-green-700">Completed</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{skillTree.unlockedSkills}</div>
          <div className="text-sm text-blue-700">Unlocked</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {skillTree.totalSkills - skillTree.unlockedSkills}
          </div>
          <div className="text-sm text-orange-700">Locked</div>
        </div>
      </div>

      {/* Progress List */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Mastery Progress</h4>
        <div className="space-y-3">
          {sortedSkills.map((skill: SkillNode) => (
            <div
              key={skill.skillId}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onSkillSelect(skill)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{skill.name}</span>
                <span className="text-sm text-gray-600">{Math.round(skill.currentMastery * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    skill.currentMastery >= 0.8 ? 'bg-green-500' :
                    skill.currentMastery >= 0.5 ? 'bg-blue-500' :
                    skill.currentMastery >= 0.3 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.currentMastery * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Skill Detail Panel Component
function SkillDetailPanel({ skill, onClose, onAssessmentStart, masteryProgression }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                skill.isCompleted ? 'bg-green-500' :
                !skill.isUnlocked ? 'bg-gray-300' :
                skill.currentMastery >= 0.8 ? 'bg-blue-500' :
                skill.currentMastery >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}>
                {skill.isCompleted ? <CheckCircle className="w-5 h-5 text-white" /> :
                 !skill.isUnlocked ? <Lock className="w-5 h-5 text-gray-600" /> :
                 <Target className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                <p className="text-sm text-gray-600">{skill.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Mastery</div>
                <div className="font-medium">{Math.round(skill.currentMastery * 100)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Difficulty</div>
                <div className="font-medium">{skill.difficulty}/10</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time to Master</div>
                <div className="font-medium">{skill.estimatedTimeToMaster}h</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Category</div>
                <div className="font-medium capitalize">{skill.category}</div>
              </div>
            </div>

            {/* Prerequisites */}
            {skill.prerequisites.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Prerequisites</div>
                <div className="flex flex-wrap gap-2">
                  {skill.prerequisites.map((prereqId: string) => (
                    <span
                      key={prereqId}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {prereqId.split('_').pop()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              {skill.isUnlocked && !skill.isCompleted && (
                <button
                  onClick={() => onAssessmentStart(skill.skillId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Assessment
                </button>
              )}
              {skill.currentMastery >= 0.8 && !skill.isCompleted && (
                <button
                  onClick={() => onAssessmentStart(skill.skillId)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Trophy className="w-4 h-4 inline mr-2" />
                  Complete Mastery
                </button>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </motion.div>
  )
}