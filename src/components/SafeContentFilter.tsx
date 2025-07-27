// Safe Content Filter Component
// Provides age-appropriate content filtering with real-time safety checks
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserProfile, ContentItem } from '@/types'
import type { 
  SafetyClassification, 
  ParentalControls, 
  SafetyReport 
} from '@/lib/content-safety-engine'
import { Shield, AlertTriangle, CheckCircle, Settings, Eye, EyeOff, Lock } from 'lucide-react'

interface SafeContentFilterProps {
  userProfile: UserProfile
  content: ContentItem[]
  parentalControls?: ParentalControls
  onContentFiltered: (filteredContent: ContentItem[]) => void
  onSafetyReport?: (report: SafetyReport) => void
  showFilterStatus?: boolean
  allowParentalOverride?: boolean
}

interface FilterState {
  isFilteringActive: boolean
  filteredContent: ContentItem[]
  blockedContent: ContentItem[]
  safetyClassifications: Map<string, SafetyClassification>
  isAnalyzing: boolean
  filterStats: {
    totalContent: number
    safeContent: number
    cautionContent: number
    blockedContent: number
    appropriateForAge: number
  }
}

interface SafetyIndicatorProps {
  safetyLevel: SafetyClassification['safetyLevel']
  ageRating: string
  userAge: string
  confidence: number
  compact?: boolean
}

const SafetyIndicator: React.FC<SafetyIndicatorProps> = ({
  safetyLevel,
  ageRating,
  userAge,
  confidence,
  compact = false
}) => {
  const getIndicatorColor = () => {
    switch (safetyLevel) {
      case 'safe': return 'text-green-500'
      case 'caution': return 'text-yellow-500'
      case 'restricted': return 'text-orange-500'
      case 'blocked': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getIndicatorIcon = () => {
    switch (safetyLevel) {
      case 'safe': return <CheckCircle className="w-4 h-4" />
      case 'caution': return <AlertTriangle className="w-4 h-4" />
      case 'restricted': return <Eye className="w-4 h-4" />
      case 'blocked': return <EyeOff className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-1 ${getIndicatorColor()}`}>
        {getIndicatorIcon()}
        <span className="text-xs">{ageRating}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 p-2 rounded-lg border ${getIndicatorColor()}`}>
      {getIndicatorIcon()}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium capitalize">{safetyLevel}</span>
          <span className="text-sm">Age: {ageRating}</span>
        </div>
        <div className="text-xs opacity-75">
          User: {userAge} | Confidence: {Math.round(confidence * 100)}%
        </div>
      </div>
    </div>
  )
}

export const SafeContentFilter: React.FC<SafeContentFilterProps> = ({
  userProfile,
  content,
  parentalControls,
  onContentFiltered,
  onSafetyReport,
  showFilterStatus = true,
  allowParentalOverride = false
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    isFilteringActive: true,
    filteredContent: [],
    blockedContent: [],
    safetyClassifications: new Map(),
    isAnalyzing: false,
    filterStats: {
      totalContent: 0,
      safeContent: 0,
      cautionContent: 0,
      blockedContent: 0,
      appropriateForAge: 0
    }
  })

  const [showBlockedContent, setShowBlockedContent] = useState(false)
  const [parentalOverrideRequest, setParentalOverrideRequest] = useState<string | null>(null)

  // Analyze content safety
  const analyzeContentSafety = useCallback(async (contentItems: ContentItem[]) => {
    setFilterState(prev => ({ ...prev, isAnalyzing: true }))

    try {
      const safetyPromises = contentItems.map(async (item) => {
        const response = await fetch('/api/content-safety', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze_content',
            content: item,
            userProfile,
            parentalControls
          })
        })

        if (!response.ok) {
          console.warn(`Failed to analyze content ${item.id}`)
          return {
            contentId: item.id,
            classification: {
              safetyLevel: 'caution' as const,
              ageRating: '12+' as const,
              confidenceScore: 0.5,
              contentCategories: [],
              riskFactors: [],
              educationalValue: 0.5,
              parentalGuidance: true
            }
          }
        }

        const data = await response.json()
        return {
          contentId: item.id,
          classification: data.classification
        }
      })

      const safetyResults = await Promise.all(safetyPromises)
      const classificationsMap = new Map(
        safetyResults.map(result => [result.contentId, result.classification])
      )

      setFilterState(prev => ({
        ...prev,
        safetyClassifications: classificationsMap,
        isAnalyzing: false
      }))

      return classificationsMap

    } catch (error) {
      console.error('Failed to analyze content safety:', error)
      setFilterState(prev => ({ ...prev, isAnalyzing: false }))
      return new Map()
    }
  }, [userProfile, parentalControls])

  // Filter content based on safety analysis
  const filterContent = useCallback((
    contentItems: ContentItem[], 
    classifications: Map<string, SafetyClassification>
  ) => {
    const filtered: ContentItem[] = []
    const blocked: ContentItem[] = []

    let safeCount = 0
    let cautionCount = 0
    let blockedCount = 0
    let ageAppropriateCount = 0

    contentItems.forEach(item => {
      const classification = classifications.get(item.id)
      if (!classification) {
        // Default to caution if no classification
        filtered.push(item)
        cautionCount++
        return
      }

      const userAge = calculateAge(userProfile.age_group)
      const contentMinAge = parseAgeRating(classification.ageRating)
      const isAgeAppropriate = userAge >= contentMinAge

      if (isAgeAppropriate) {
        ageAppropriateCount++
      }

      switch (classification.safetyLevel) {
        case 'safe':
          filtered.push(item)
          safeCount++
          break
        case 'caution':
          if (isAgeAppropriate || !filterState.isFilteringActive) {
            filtered.push(item)
          } else {
            blocked.push(item)
            blockedCount++
          }
          cautionCount++
          break
        case 'restricted':
          if (allowParentalOverride && parentalControls?.supervisionLevel === 'minimal') {
            filtered.push(item)
          } else {
            blocked.push(item)
            blockedCount++
          }
          break
        case 'blocked':
          blocked.push(item)
          blockedCount++
          break
        default:
          filtered.push(item)
          cautionCount++
      }
    })

    const newFilterState = {
      ...filterState,
      filteredContent: filtered,
      blockedContent: blocked,
      filterStats: {
        totalContent: contentItems.length,
        safeContent: safeCount,
        cautionContent: cautionCount,
        blockedContent: blockedCount,
        appropriateForAge: ageAppropriateCount
      }
    }

    setFilterState(newFilterState)
    onContentFiltered(filtered)

    return { filtered, blocked }
  }, [filterState.isFilteringActive, allowParentalOverride, parentalControls, userProfile.age_group, onContentFiltered])

  // Submit safety report
  const submitSafetyReport = useCallback(async (
    contentId: string,
    reportType: SafetyReport['reportType'],
    description: string
  ) => {
    try {
      const response = await fetch('/api/content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_report',
          contentId,
          reporterId: userProfile.id,
          reportData: {
            reportType,
            description,
            severity: 'medium' as const
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        onSafetyReport?.(data.report)
      }
    } catch (error) {
      console.error('Failed to submit safety report:', error)
    }
  }, [userProfile.id, onSafetyReport])

  // Request parental override
  const requestParentalOverride = useCallback(async (contentId: string) => {
    if (!parentalControls) return

    setParentalOverrideRequest(contentId)
    
    // Here you would typically send an email or notification to the parent
    // For now, we'll just simulate the request
    console.log(`Parental override requested for content ${contentId}`)
    
    // Auto-clear after 5 seconds for demo
    setTimeout(() => {
      setParentalOverrideRequest(null)
    }, 5000)
  }, [parentalControls])

  // Toggle filtering
  const toggleFiltering = useCallback(() => {
    setFilterState(prev => {
      const newIsActive = !prev.isFilteringActive
      
      if (newIsActive) {
        // Re-filter content
        filterContent(content, prev.safetyClassifications)
      } else {
        // Show all content
        onContentFiltered(content)
      }

      return {
        ...prev,
        isFilteringActive: newIsActive
      }
    })
  }, [content, filterContent, onContentFiltered])

  // Initialize content analysis
  useEffect(() => {
    if (content.length > 0) {
      analyzeContentSafety(content).then(classifications => {
        filterContent(content, classifications)
      })
    }
  }, [content, analyzeContentSafety, filterContent])

  // Helper functions
  const calculateAge = (ageGroup: string): number => {
    const ageMap: Record<string, number> = {
      'child': 8,
      'teen': 15,
      'adult': 25
    }
    return ageMap[ageGroup] || 18
  }

  const parseAgeRating = (rating: string): number => {
    const match = rating.match(/(\d+)\+/)
    return match ? parseInt(match[1]) : 0
  }

  if (!showFilterStatus && filterState.filteredContent.length === 0 && !filterState.isAnalyzing) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Filter Status Header */}
      {showFilterStatus && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className={`w-5 h-5 ${filterState.isFilteringActive ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-medium">Content Safety Filter</h3>
                <p className="text-sm text-gray-600">
                  {filterState.isFilteringActive ? 'Active' : 'Disabled'} - Age group: {userProfile.age_group}
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleFiltering}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterState.isFilteringActive 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterState.isFilteringActive ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Filter Statistics */}
          {filterState.filterStats.totalContent > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {filterState.filterStats.safeContent}
                </div>
                <div className="text-xs text-gray-600">Safe</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {filterState.filterStats.cautionContent}
                </div>
                <div className="text-xs text-gray-600">Caution</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {filterState.filterStats.blockedContent}
                </div>
                <div className="text-xs text-gray-600">Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {filterState.filterStats.appropriateForAge}
                </div>
                <div className="text-xs text-gray-600">Age-appropriate</div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Analyzing Indicator */}
      <AnimatePresence>
        {filterState.isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-blue-700">Analyzing content safety...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocked Content Section */}
      {filterState.blockedContent.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-700">
                {filterState.blockedContent.length} items blocked
              </span>
            </div>
            
            <button
              onClick={() => setShowBlockedContent(!showBlockedContent)}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              {showBlockedContent ? 'Hide' : 'Show'} blocked content
            </button>
          </div>

          <AnimatePresence>
            {showBlockedContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2"
              >
                {filterState.blockedContent.map(item => {
                  const classification = filterState.safetyClassifications.get(item.id)
                  return (
                    <div key={item.id} className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          {classification && (
                            <SafetyIndicator
                              safetyLevel={classification.safetyLevel}
                              ageRating={classification.ageRating}
                              userAge={userProfile.age_group}
                              confidence={classification.confidenceScore}
                              compact
                            />
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {allowParentalOverride && (
                            <button
                              onClick={() => requestParentalOverride(item.id)}
                              disabled={parentalOverrideRequest === item.id}
                              className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
                            >
                              {parentalOverrideRequest === item.id ? 'Requested' : 'Request Access'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => submitSafetyReport(item.id, 'inappropriate_content', 'Content appears inappropriate')}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Parental Override Request Status */}
      <AnimatePresence>
        {parentalOverrideRequest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-medium text-yellow-800">Parental Override Requested</div>
                <div className="text-sm text-yellow-700">
                  A notification has been sent to your parent/guardian for approval.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SafeContentFilter