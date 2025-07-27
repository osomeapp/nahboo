// Parental Controls Configuration Panel
// Comprehensive interface for parents to configure content restrictions and monitoring
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Settings, Clock, Mail, AlertTriangle, 
  Plus, Trash2, Edit3, Save, X, Users, Lock,
  Eye, EyeOff, Bell, Calendar, Smartphone
} from 'lucide-react'
import type { 
  ParentalControls, 
  ContentRestriction, 
  TimeControl, 
  ReportingPreference 
} from '@/lib/content-safety-engine'
import { useParentalControls } from '@/hooks/useContentSafety'

interface ParentalControlsPanelProps {
  userId: string
  currentControls?: ParentalControls
  onControlsUpdated: (controls: ParentalControls) => void
  onClose?: () => void
}

type TabType = 'restrictions' | 'time' | 'reporting' | 'supervision'

interface RestrictionFormData {
  restrictionType: ContentRestriction['restrictionType']
  value: string
  isBlocked: boolean
  requiresApproval: boolean
}

interface TimeControlFormData {
  dayOfWeek: string
  startTime: string
  endTime: string
  maxDailyTime: number
  breakInterval: number
  breakDuration: number
}

export const ParentalControlsPanel: React.FC<ParentalControlsPanelProps> = ({
  userId,
  currentControls,
  onControlsUpdated,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('restrictions')
  const [parentEmail, setParentEmail] = useState(currentControls?.parentEmail || '')
  const [supervisionLevel, setSupervisionLevel] = useState(currentControls?.supervisionLevel || 'moderate')
  const [emergencyContacts, setEmergencyContacts] = useState<string[]>(currentControls?.emergencyContacts || [])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    controls,
    addRestriction,
    removeRestriction,
    addTimeControl,
    updateReportingPreference,
    setControls
  } = useParentalControls(userId)

  // Initialize controls
  React.useEffect(() => {
    if (currentControls) {
      setControls(currentControls)
    }
  }, [currentControls, setControls])

  // Form states
  const [restrictionForm, setRestrictionForm] = useState<RestrictionFormData>({
    restrictionType: 'subject',
    value: '',
    isBlocked: true,
    requiresApproval: false
  })

  const [timeControlForm, setTimeControlForm] = useState<TimeControlFormData>({
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '17:00',
    maxDailyTime: 120,
    breakInterval: 30,
    breakDuration: 10
  })

  const [newContact, setNewContact] = useState('')

  // Save parental controls
  const saveControls = useCallback(async () => {
    if (!controls) return

    setIsSaving(true)
    try {
      const updatedControls: ParentalControls = {
        ...controls,
        parentEmail,
        supervisionLevel,
        emergencyContacts
      }

      // Here you would call the API to save controls
      // For now, just call the callback
      onControlsUpdated(updatedControls)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save parental controls:', error)
    } finally {
      setIsSaving(false)
    }
  }, [controls, parentEmail, supervisionLevel, emergencyContacts, onControlsUpdated])

  // Add restriction
  const handleAddRestriction = useCallback(() => {
    if (restrictionForm.value.trim()) {
      const restriction: ContentRestriction = {
        restrictionType: restrictionForm.restrictionType,
        value: restrictionForm.value.trim(),
        isBlocked: restrictionForm.isBlocked,
        requiresApproval: restrictionForm.requiresApproval
      }
      
      addRestriction(restriction)
      setRestrictionForm({
        restrictionType: 'subject',
        value: '',
        isBlocked: true,
        requiresApproval: false
      })
    }
  }, [restrictionForm, addRestriction])

  // Add time control
  const handleAddTimeControl = useCallback(() => {
    const timeControl: TimeControl = {
      dayOfWeek: timeControlForm.dayOfWeek,
      allowedHours: [{
        start: timeControlForm.startTime,
        end: timeControlForm.endTime
      }],
      maxDailyTime: timeControlForm.maxDailyTime,
      breakRequirements: {
        interval: timeControlForm.breakInterval,
        duration: timeControlForm.breakDuration
      }
    }
    
    addTimeControl(timeControl)
    setTimeControlForm({
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '17:00',
      maxDailyTime: 120,
      breakInterval: 30,
      breakDuration: 10
    })
  }, [timeControlForm, addTimeControl])

  // Add emergency contact
  const handleAddContact = useCallback(() => {
    if (newContact.trim() && !emergencyContacts.includes(newContact.trim())) {
      setEmergencyContacts(prev => [...prev, newContact.trim()])
      setNewContact('')
    }
  }, [newContact, emergencyContacts])

  // Remove emergency contact
  const handleRemoveContact = useCallback((contact: string) => {
    setEmergencyContacts(prev => prev.filter(c => c !== contact))
  }, [])

  const tabs = [
    { id: 'restrictions', label: 'Content Restrictions', icon: Shield },
    { id: 'time', label: 'Time Controls', icon: Clock },
    { id: 'reporting', label: 'Notifications', icon: Bell },
    { id: 'supervision', label: 'Supervision', icon: Users }
  ]

  if (!controls) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold">Parental Controls</h2>
        </div>
        <p className="text-gray-600">Loading parental controls...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Parental Controls</h2>
              <p className="text-blue-100">Configure safety settings for your child</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={saveControls}
                  disabled={isSaving}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'restrictions' && (
            <motion.div
              key="restrictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Content Restrictions</h3>
                
                {/* Add Restriction Form */}
                {isEditing && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <select
                        value={restrictionForm.restrictionType}
                        onChange={(e) => setRestrictionForm(prev => ({ ...prev, restrictionType: e.target.value as ContentRestriction['restrictionType'] }))}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="subject">Subject</option>
                        <option value="difficulty">Difficulty Level</option>
                        <option value="content_type">Content Type</option>
                        <option value="interaction">Interaction Type</option>
                        <option value="time_duration">Time Duration</option>
                      </select>
                      
                      <input
                        type="text"
                        value={restrictionForm.value}
                        onChange={(e) => setRestrictionForm(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Enter restriction value"
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="blocked"
                          checked={restrictionForm.isBlocked}
                          onChange={(e) => setRestrictionForm(prev => ({ ...prev, isBlocked: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="blocked" className="text-sm">Block</label>
                        
                        <input
                          type="checkbox"
                          id="approval"
                          checked={restrictionForm.requiresApproval}
                          onChange={(e) => setRestrictionForm(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                          className="rounded ml-4"
                        />
                        <label htmlFor="approval" className="text-sm">Requires Approval</label>
                      </div>
                      
                      <button
                        onClick={handleAddRestriction}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Current Restrictions */}
                <div className="space-y-2">
                  {controls.restrictions.map((restriction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium capitalize">{restriction.restrictionType}:</span>
                        <span className="ml-2">{restriction.value}</span>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${restriction.isBlocked ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {restriction.isBlocked ? 'Blocked' : 'Allowed'}
                          </span>
                          {restriction.requiresApproval && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Requires Approval
                            </span>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeRestriction(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {controls.restrictions.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No content restrictions configured</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'time' && (
            <motion.div
              key="time"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Time Controls</h3>
                
                {/* Add Time Control Form */}
                {isEditing && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select
                        value={timeControlForm.dayOfWeek}
                        onChange={(e) => setTimeControlForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={timeControlForm.startTime}
                          onChange={(e) => setTimeControlForm(prev => ({ ...prev, startTime: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={timeControlForm.endTime}
                          onChange={(e) => setTimeControlForm(prev => ({ ...prev, endTime: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={timeControlForm.maxDailyTime}
                          onChange={(e) => setTimeControlForm(prev => ({ ...prev, maxDailyTime: parseInt(e.target.value) }))}
                          placeholder="Max minutes"
                          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                        />
                        <button
                          onClick={handleAddTimeControl}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Current Time Controls */}
                <div className="space-y-2">
                  {controls.timeControls.map((timeControl, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium capitalize">{timeControl.dayOfWeek}:</span>
                        <span className="ml-2">
                          {timeControl.allowedHours.map(hours => `${hours.start} - ${hours.end}`).join(', ')}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">
                          Max daily time: {timeControl.maxDailyTime} minutes
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {/* Remove time control */}}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {controls.timeControls.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No time controls configured</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'supervision' && (
            <motion.div
              key="supervision"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Supervision Settings</h3>
                
                {/* Parent Email */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Email
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
                    placeholder="parent@example.com"
                  />
                </div>
                
                {/* Supervision Level */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervision Level
                  </label>
                  <select
                    value={supervisionLevel}
                    onChange={(e) => setSupervisionLevel(e.target.value as ParentalControls['supervisionLevel'])}
                    disabled={!isEditing}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
                  >
                    <option value="none">None - Full independence</option>
                    <option value="minimal">Minimal - Basic restrictions</option>
                    <option value="moderate">Moderate - Standard protection</option>
                    <option value="strict">Strict - Maximum protection</option>
                    <option value="supervised">Supervised - Direct oversight</option>
                  </select>
                </div>
                
                {/* Emergency Contacts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contacts
                  </label>
                  
                  {isEditing && (
                    <div className="flex space-x-2 mb-4">
                      <input
                        type="email"
                        value={newContact}
                        onChange={(e) => setNewContact(e.target.value)}
                        placeholder="Add emergency contact email"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <button
                        onClick={handleAddContact}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span>{contact}</span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveContact(contact)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {emergencyContacts.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No emergency contacts configured</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ParentalControlsPanel