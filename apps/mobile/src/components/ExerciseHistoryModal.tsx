/**
 * ExerciseHistoryModal
 * Purpose: Display historical sets for a given exercise template with semantic, accessible styling.
 * Acceptance Criteria:
 * - Removes all gradient and hard-coded gray backgrounds; uses semantic classes (.bg-dark-elevated*, .text-primary, .btn-secondary).
 * - Shows loading, error, empty, and data states clearly.
 * - No inline arbitrary colors except semantic CSS variables (through classes).
 * - Close action accessible and keyboard focusable.
 * - Stateless UI component; data fetched via tRPC hook.
 * Azure Considerations: Pure UI; no side effects; ready for container usage.
 */
'use client'
import React from 'react'
import { trpc } from '../lib/trpc'

interface ExerciseHistoryModalProps {
  exerciseTemplateId: string
  exerciseName: string
  onClose: () => void
}

export function ExerciseHistoryModal({ exerciseTemplateId, exerciseName, onClose }: ExerciseHistoryModalProps) {
  console.log('ExerciseHistoryModal opened:', { exerciseTemplateId, exerciseName })
  
  const historyQuery = trpc.statistics.getExerciseHistory.useQuery({
    exerciseTemplateId,
    exerciseName // Pass the name to avoid template lookup
  })
  
  console.log('History query state:', { 
    isLoading: historyQuery.isLoading, 
    isError: historyQuery.isError, 
    data: historyQuery.data,
    error: historyQuery.error 
  })

  const getColumnLabel = (type: string | null) => {
    if (!type) return '-'
    
    switch (type) {
      case 'weight_kg':
        return 'KGS'
      case 'distance_m':
        return 'DISTANCE'
      case 'duration_m':
        return 'DURATION'
      case 'calories':
        return 'CALORIES'
      case 'reps':
        return 'REPS'
      default:
        return type.toUpperCase()
    }
  }

  const formatValue = (type: string | null, value: number | null) => {
    if (!type || value === null) return '-'
    
    switch (type) {
      case 'weight_kg':
        return `${value}`
      case 'distance_m':
        return `${(value / 1000).toFixed(2)}`
      case 'duration_m':
        return `${value}`
      case 'calories':
        return `${value}`
      case 'reps':
        return `${value}`
      default:
        return value.toString()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-elevated1 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-border bg-dark-elevated0/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-text-primary">
                Exercise History
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {exerciseName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-orange-accent rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {historyQuery.isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-accent" aria-label="Loading"></div>
            </div>
          )}

          {historyQuery.isError && (
            <div className="text-center py-12">
              <p className="text-red-500">Failed to load exercise history</p>
            </div>
          )}

          {historyQuery.data && historyQuery.data.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-text-secondary">No history found for this exercise</p>
            </div>
          )}

          {historyQuery.data && historyQuery.data.length > 0 && (
            <div className="space-y-6">
              {historyQuery.data.map((session, sessionIndex) => (
                <div 
                  key={session.sessionId}
                  className="border border-dark-border rounded-lg overflow-hidden bg-dark-elevated0"
                >
                  {/* Session Header */}
                  <div className="bg-dark-elevated1/40 px-4 py-3 border-b border-dark-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">
                          {formatDate(session.startedAt)}
                        </p>
                        <p className="text-sm text-text-secondary capitalize">
                          {session.category}
                        </p>
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {session.sets.length} {session.sets.length === 1 ? 'set' : 'sets'}
                      </span>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-elevated1/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Set
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            {getColumnLabel(session.sets[0]?.value_1_type)}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            {getColumnLabel(session.sets[0]?.value_2_type)}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border/40">
                        {session.sets.map((set: any, setIndex: number) => (
                          <tr key={set.set_id} className="hover:bg-dark-elevated1/20">
                            <td className="px-4 py-3 text-sm text-text-primary">
                              {setIndex + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-primary">
                              {formatValue(set.value_1_type, set.value_1_numeric)}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-primary">
                              {formatValue(set.value_2_type, set.value_2_numeric)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border bg-dark-elevated0/60 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 btn-secondary rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
