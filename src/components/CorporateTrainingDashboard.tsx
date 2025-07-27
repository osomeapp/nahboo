'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCorporateTraining, useManagerDashboard } from '@/hooks/useCorporateTraining'
import type { EmployeeProfile, TrainingProgram, EmployeeProgress, CompanyAnalytics } from '@/lib/corporate-training-engine'

interface CorporateTrainingDashboardProps {
  companyId: string
  currentUser: {
    employeeId: string
    role: string
    isManager: boolean
    isAdmin: boolean
  }
}

export default function CorporateTrainingDashboard({ companyId, currentUser }: CorporateTrainingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'programs' | 'analytics' | 'compliance'>('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  
  const {
    companyOverview,
    employees,
    programs,
    analytics,
    isLoading,
    error,
    getCompanyOverview,
    generateAnalytics,
    clearError
  } = useCorporateTraining(companyId)

  const managerData = useManagerDashboard(currentUser.employeeId, companyId)

  useEffect(() => {
    // Generate analytics based on selected timeframe
    const endDate = new Date()
    const startDate = new Date()
    
    switch (selectedTimeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }
    
    generateAnalytics({ startDate, endDate })
  }, [selectedTimeframe, generateAnalytics])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'programs', label: 'Programs', icon: '📚' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'compliance', label: 'Compliance', icon: '✅' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading corporate training dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Corporate Training Dashboard</h1>
              <p className="text-sm text-gray-600">Manage employee learning and development</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timeframe Selector */}
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              {/* Refresh Button */}
              <button
                onClick={() => getCompanyOverview()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab 
                companyOverview={companyOverview} 
                managerData={currentUser.isManager ? managerData : undefined}
                currentUser={currentUser}
              />
            )}
            
            {activeTab === 'employees' && (
              <EmployeesTab 
                employees={employees} 
                companyId={companyId}
                currentUser={currentUser}
              />
            )}
            
            {activeTab === 'programs' && (
              <ProgramsTab 
                programs={programs} 
                companyId={companyId}
                currentUser={currentUser}
              />
            )}
            
            {activeTab === 'analytics' && (
              <AnalyticsTab 
                analytics={analytics} 
                timeframe={selectedTimeframe}
              />
            )}
            
            {activeTab === 'compliance' && (
              <ComplianceTab 
                analytics={analytics}
                companyId={companyId}
                currentUser={currentUser}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ 
  companyOverview, 
  managerData, 
  currentUser 
}: { 
  companyOverview: any
  managerData?: any
  currentUser: any 
}) {
  if (!companyOverview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading overview data...</p>
      </div>
    )
  }

  const { quickStats, topDepartments, urgentCompliance, skillGaps } = companyOverview

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Employees"
          value={quickStats.totalEmployees}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={quickStats.activeUsers}
          icon="🟢"
          color="green"
        />
        <StatCard
          title="Completion Rate"
          value={`${quickStats.completionRate}%`}
          icon="✅"
          color="purple"
        />
        <StatCard
          title="Compliance Rate"
          value={`${quickStats.complianceRate}%`}
          icon="🛡️"
          color="orange"
        />
        <StatCard
          title="Certifications"
          value={quickStats.certificationsEarned}
          icon="🏆"
          color="yellow"
        />
      </div>

      {/* Manager Team Overview */}
      {managerData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Team Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{managerData.directReports.length}</div>
              <div className="text-sm text-blue-600">Direct Reports</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((managerData.teamProgress.filter((p: any) => p.status === 'completed').length / Math.max(managerData.teamProgress.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-green-600">Team Completion Rate</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {managerData.teamProgress.reduce((sum: number, p: any) => sum + p.timeSpent, 0)} hrs
              </div>
              <div className="text-sm text-purple-600">Total Time Invested</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Departments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Departments</h3>
        <div className="space-y-4">
          {topDepartments.slice(0, 5).map((dept: any, index: number) => (
            <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                </div>
                <div>
                  <div className="font-medium">{dept.department}</div>
                  <div className="text-sm text-gray-600">{dept.employeeCount} employees</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">{Math.round(dept.completionRate * 100)}%</div>
                <div className="text-xs text-gray-500">completion rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgent Compliance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Urgent Compliance Issues</h3>
          {urgentCompliance.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              <div className="text-4xl mb-2">✅</div>
              <p>All compliance requirements are on track!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentCompliance.slice(0, 5).map((item: any) => (
                <div key={item.requirementName} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <div className="font-medium text-red-900">{item.requirementName}</div>
                    <div className="text-sm text-red-600">
                      {item.overdue > 0 && `${item.overdue} overdue • `}
                      {item.atRiskEmployees > 0 && `${item.atRiskEmployees} at risk`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">{Math.round(item.completionRate * 100)}%</div>
                    <div className="text-xs text-red-500">complete</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Skill Gaps */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skill Gaps</h3>
          <div className="space-y-3">
            {skillGaps.slice(0, 5).map((gap: any) => (
              <div key={gap.skill} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <div className="font-medium">{gap.skill}</div>
                  <div className="text-sm text-gray-600">{gap.affectedEmployees} employees affected</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-yellow-600">{Math.round(gap.gapScore * 100)}%</div>
                  <div className="text-xs text-yellow-500">gap score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string
  value: string | number
  icon: string
  color: string 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  )
}

// Placeholder components for other tabs
function EmployeesTab({ employees, companyId, currentUser }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Management</h3>
      <p className="text-gray-600">Employee management features coming soon...</p>
    </div>
  )
}

function ProgramsTab({ programs, companyId, currentUser }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Programs</h3>
      <p className="text-gray-600">Training program management features coming soon...</p>
    </div>
  )
}

function AnalyticsTab({ analytics, timeframe }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
      <p className="text-gray-600">Advanced analytics features coming soon...</p>
    </div>
  )
}

function ComplianceTab({ analytics, companyId, currentUser }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Tracking</h3>
      <p className="text-gray-600">Compliance tracking features coming soon...</p>
    </div>
  )
}