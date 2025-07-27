// Safety Integrated Wrapper
// Comprehensive safety system integration for all learning components
'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Shield, AlertTriangle, Eye, Flag, Heart, CheckCircle, XCircle } from 'lucide-react'
import type { UserProfile, ContentItem } from '@/types'
import type { SafetyReport, SafetyClassification } from '@/lib/content-safety-engine'
import type { CommunityReport } from '@/lib/community-moderation-engine'
import { useRealTimeMonitoring } from '@/hooks/useRealTimeMonitoring'
import { useCommunityModeration } from '@/hooks/useCommunityModeration'
import SafeContentFilter from './SafeContentFilter'
import CommunityModerationDashboard from './CommunityModerationDashboard'

interface SafetyIntegratedWrapperProps {
  children: React.ReactNode
  userProfile: UserProfile
  contentItems?: ContentItem[]
  enableRealTimeMonitoring?: boolean
  enableCommunityModeration?: boolean
  enableParentalControls?: boolean
  onSafetyEvent?: (event: SafetyEvent) => void
  className?: string
}

interface SafetyEvent {
  type: 'content_filtered' | 'inappropriate_detected' | 'report_submitted' | 'moderation_action'
  contentId?: string
  severity: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  details: any
}

interface SafetyStatus {
  isActive: boolean
  level: 'minimal' | 'standard' | 'strict' | 'maximum'
  filteredContent: number
  flaggedContent: number
  blockedInteractions: number
  lastCheck: Date
}

interface ParentalControl {
  controlId: string
  type: 'content_filter' | 'time_limit' | 'interaction_block' | 'report_requirement'
  enabled: boolean
  severity: 'low' | 'medium' | 'high'
  configuration: {
    ageThreshold?: number
    keywords?: string[]
    timeLimit?: number
    allowedDomains?: string[]
    blockedCategories?: string[]
  }
}

const SafetyIntegratedWrapper: React.FC<SafetyIntegratedWrapperProps> = ({
  children,
  userProfile,
  contentItems = [],
  enableRealTimeMonitoring = true,
  enableCommunityModeration = true,
  enableParentalControls = true,
  onSafetyEvent,
  className = ''
}) => {
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus>({
    isActive: true,
    level: userProfile.age_group === 'child' ? 'maximum' : 
           userProfile.age_group === 'teen' ? 'strict' : 'standard',
    filteredContent: 0,
    flaggedContent: 0,
    blockedInteractions: 0,
    lastCheck: new Date()
  })

  const [activeParentalControls, setActiveParentalControls] = useState<ParentalControl[]>([])
  const [showSafetyDashboard, setShowSafetyDashboard] = useState(false)
  const [pendingSafetyReports, setPendingSafetyReports] = useState<SafetyReport[]>([])
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyEvent[]>([])

  // Real-time monitoring integration
  const monitoring = useRealTimeMonitoring(userProfile.id, userProfile)

  // Community moderation integration
  const moderation = useCommunityModeration(userProfile.id, userProfile)

  const safetyCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize parental controls based on user profile
  useEffect(() => {
    const controls: ParentalControl[] = []

    if (userProfile.age_group === 'child') {
      controls.push(
        {
          controlId: 'child_content_filter',
          type: 'content_filter',
          enabled: true,
          severity: 'high',
          configuration: {
            ageThreshold: 8,
            keywords: ['inappropriate', 'violent', 'adult'],
            blockedCategories: ['mature', 'explicit', 'violent']
          }
        },
        {
          controlId: 'child_interaction_block',
          type: 'interaction_block',
          enabled: true,
          severity: 'high',
          configuration: {
            allowedDomains: ['educational', 'child-safe']
          }
        }
      )
    } else if (userProfile.age_group === 'teen') {
      controls.push(
        {
          controlId: 'teen_content_filter',
          type: 'content_filter',
          enabled: true,
          severity: 'medium',
          configuration: {
            ageThreshold: 13,
            blockedCategories: ['explicit', 'dangerous']
          }
        }
      )
    }

    setActiveParentalControls(controls)
  }, [userProfile.age_group])

  // Content safety monitoring
  const performSafetyCheck = useCallback(async (content: ContentItem[]) => {
    if (!enableRealTimeMonitoring || !monitoring) return

    try {
      let filteredCount = 0
      let flaggedCount = 0

      // Mock safety analysis for now
      for (const item of content) {
        // Simple heuristic-based filtering for demonstration
        const hasInappropriateContent = item.description.toLowerCase().includes('inappropriate') ||
                                       item.title.toLowerCase().includes('unsafe')
        
        if (hasInappropriateContent) {
          filteredCount++
          
          const safetyEvent: SafetyEvent = {
            type: 'content_filtered',
            contentId: item.id,
            severity: 'medium',
            timestamp: new Date(),
            details: {
              reason: 'Content flagged by safety filter',
              confidence: 0.8
            }
          }
          
          setSafetyAlerts(prev => [safetyEvent, ...prev.slice(0, 9)]) // Keep last 10 alerts
          onSafetyEvent?.(safetyEvent)
          flaggedCount++
        }
      }

      setSafetyStatus(prev => ({
        ...prev,
        filteredContent: prev.filteredContent + filteredCount,
        flaggedContent: prev.flaggedContent + flaggedCount,
        lastCheck: new Date()
      }))

    } catch (error) {
      console.error('Safety check failed:', error)
    }
  }, [enableRealTimeMonitoring, monitoring, onSafetyEvent])

  // AI Content Safety Integration
  const checkAIGeneratedContent = useCallback(async (
    content: string,
    contentType: string,
    context: { userProfile: UserProfile, topic?: string }
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/safety/ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          contentType,
          context,
          safetyLevel: safetyStatus.level
        })
      })

      if (!response.ok) {
        throw new Error(`Safety check failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.isSafe) {
        const safetyEvent: SafetyEvent = {
          type: 'inappropriate_detected',
          severity: result.riskLevel || 'medium',
          timestamp: new Date(),
          details: { content, violations: result.violations }
        }

        setSafetyAlerts(prev => [safetyEvent, ...prev.slice(0, 9)])
        onSafetyEvent?.(safetyEvent)
      }

      return result.isSafe
    } catch (error) {
      console.error('AI content safety check failed:', error)
      // Fail closed - if we can't check, assume unsafe for children
      return userProfile.age_group === 'adult'
    }
  }, [safetyStatus.level, userProfile.age_group, onSafetyEvent])

  // Community report integration
  const handleCommunityReport = useCallback(async (
    contentId: string,
    reportType: CommunityReport['reportType'],
    description: string,
    evidence?: any[]
  ) => {
    try {
      const report = await moderation.submitReport(contentId, {
        reportType,
        description,
        evidence: evidence || [],
        tags: ['user_reported'],
        isUrgent: safetyStatus.level === 'maximum'
      })

      if (report) {
        const safetyEvent: SafetyEvent = {
          type: 'report_submitted',
          contentId,
          severity: report.severity,
          timestamp: new Date(),
          details: report
        }

        setSafetyAlerts(prev => [safetyEvent, ...prev.slice(0, 9)])
        onSafetyEvent?.(safetyEvent)
      }

      return report
    } catch (error) {
      console.error('Failed to submit community report:', error)
      return null
    }
  }, [moderation, safetyStatus.level, onSafetyEvent])

  // Block interaction based on parental controls
  const shouldBlockInteraction = useCallback((
    interactionType: string,
    target: string,
    context?: any
  ): boolean => {
    if (!enableParentalControls) return false

    for (const control of activeParentalControls) {
      if (!control.enabled) continue

      switch (control.type) {
        case 'interaction_block':
          if (interactionType === 'external_link') {
            const domain = new URL(target).hostname
            const allowedDomains = control.configuration.allowedDomains || []
            if (allowedDomains.length > 0 && !allowedDomains.some(allowed => domain.includes(allowed))) {
              setSafetyStatus(prev => ({
                ...prev,
                blockedInteractions: prev.blockedInteractions + 1
              }))
              return true
            }
          }
          break

        case 'time_limit':
          // Could implement session time tracking here
          break
      }
    }

    return false
  }, [enableParentalControls, activeParentalControls])

  // Start periodic safety monitoring
  useEffect(() => {
    if (enableRealTimeMonitoring && contentItems.length > 0) {
      performSafetyCheck(contentItems)

      // Set up periodic checks every 30 seconds
      safetyCheckInterval.current = setInterval(() => {
        performSafetyCheck(contentItems)
      }, 30000)

      return () => {
        if (safetyCheckInterval.current) {
          clearInterval(safetyCheckInterval.current)
        }
      }
    }
  }, [enableRealTimeMonitoring, contentItems, performSafetyCheck])

  // Enhanced children prop with safety context
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        safetyContext: {
          checkAIContent: checkAIGeneratedContent,
          submitReport: handleCommunityReport,
          shouldBlock: shouldBlockInteraction,
          safetyLevel: safetyStatus.level,
          isMonitored: enableRealTimeMonitoring
        }
      })
    }
    return child
  })

  return (
    <div className={`safety-integrated-wrapper ${className}`}>
      {/* Safety Status Indicator */}
      {safetyStatus.isActive && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowSafetyDashboard(!showSafetyDashboard)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
              safetyAlerts.length > 0
                ? 'bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200'
                : 'bg-green-100 border border-green-300 text-green-800 hover:bg-green-200'
            }`}
            title={`Safety Level: ${safetyStatus.level} | Filtered: ${safetyStatus.filteredContent} | Alerts: ${safetyAlerts.length}`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              {safetyStatus.level.charAt(0).toUpperCase() + safetyStatus.level.slice(1)}
            </span>
            {safetyAlerts.length > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {safetyAlerts.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Safety Dashboard Overlay */}
      {showSafetyDashboard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Safety Dashboard</h2>
                </div>
                <button
                  onClick={() => setShowSafetyDashboard(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Safety Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Safe Content</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {Math.max(0, contentItems.length - safetyStatus.filteredContent)}
                  </p>
                  <p className="text-sm text-green-600">Items approved</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Filtered</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {safetyStatus.filteredContent}
                  </p>
                  <p className="text-sm text-yellow-600">Items filtered</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Flag className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">Flagged</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {safetyStatus.flaggedContent}
                  </p>
                  <p className="text-sm text-red-600">High risk items</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Blocked</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {safetyStatus.blockedInteractions}
                  </p>
                  <p className="text-sm text-purple-600">Interactions blocked</p>
                </div>
              </div>

              {/* Recent Safety Alerts */}
              {safetyAlerts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Recent Safety Alerts</h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {safetyAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded border ${
                          alert.severity === 'urgent' || alert.severity === 'high'
                            ? 'bg-red-50 border-red-200'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {alert.contentId && (
                          <p className="text-sm text-gray-600 mt-1">
                            Content ID: {alert.contentId}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parental Controls */}
              {enableParentalControls && activeParentalControls.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Active Parental Controls</h3>
                  <div className="space-y-2">
                    {activeParentalControls.map((control) => (
                      <div
                        key={control.controlId}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded"
                      >
                        <div>
                          <span className="font-medium text-blue-800">
                            {control.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${
                            control.severity === 'high' ? 'bg-red-100 text-red-700' :
                            control.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {control.severity}
                          </span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          control.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Moderation Integration */}
              {enableCommunityModeration && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Community Moderation</h3>
                  <CommunityModerationDashboard
                    userId={userProfile.id}
                    userProfile={userProfile}
                    onReportSubmitted={(report) => {
                      const safetyEvent: SafetyEvent = {
                        type: 'report_submitted',
                        contentId: report.contentId,
                        severity: report.severity,
                        timestamp: new Date(),
                        details: report
                      }
                      setSafetyAlerts(prev => [safetyEvent, ...prev.slice(0, 9)])
                      onSafetyEvent?.(safetyEvent)
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content with Safety Integration */}
      <div className="relative">
        {/* Safe Content Filter (for children/teens) */}
        {(userProfile.age_group === 'child' || userProfile.age_group === 'teen') && contentItems.length > 0 && (
          <SafeContentFilter
            userProfile={userProfile}
            content={contentItems}
            onContentFiltered={(filteredContent) => {
              const filteredCount = contentItems.length - filteredContent.length
              if (filteredCount > 0) {
                setSafetyStatus(prev => ({
                  ...prev,
                  filteredContent: prev.filteredContent + filteredCount
                }))
              }
            }}
            onSafetyReport={(report) => {
              const safetyEvent: SafetyEvent = {
                type: 'inappropriate_detected',
                severity: 'medium',
                timestamp: new Date(),
                details: report
              }
              setSafetyAlerts(prev => [safetyEvent, ...prev.slice(0, 9)])
              onSafetyEvent?.(safetyEvent)
            }}
            showFilterStatus={true}
            allowParentalOverride={false}
          />
        )}

        {/* Enhanced children with safety context */}
        {enhancedChildren}
      </div>
    </div>
  )
}

export default SafetyIntegratedWrapper