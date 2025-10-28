'use client';

/**
 * Personal Record Detail Page
 * 
 * Features:
 * - Display PR details (exercise, metric, current value)
 * - Show historical progression
 * - Add new record
 * - Edit PR metadata
 * - Delete individual records
 * - Delete entire PR
 */

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '../../../lib/trpc';
import { Header } from '../../../components/Navigation';

export default function PRDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prId = params.id as string;

  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showEditPR, setShowEditPR] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch PR details
  const { data: pr, isLoading, error, refetch } = trpc.personalRecords.getById.useQuery({
    prId,
  });

  // Mutations
  const deletePR = trpc.personalRecords.delete.useMutation({
    onSuccess: () => {
      router.push('/prs');
    },
    onError: (error) => {
      alert(`Error deleting PR: ${error.message}`);
    },
  });

  const deleteRecord = trpc.personalRecords.deleteRecord.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting record: ${error.message}`);
    },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'strength':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cardio':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleDeletePR = () => {
    if (confirm('Are you sure you want to delete this personal record and all its history?')) {
      deletePR.mutate({ prId });
    }
  };

  const handleDeleteRecord = (historyId: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      deleteRecord.mutate({ historyId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <Header title="Loading..." showBack onBack={() => router.back()} />
        <div className="pt-16 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <Header title="Error" showBack onBack={() => router.back()} />
        <div className="pt-16 px-4 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 font-medium">Failed to load personal record</p>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              {error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <Header title={pr.exerciseName} showBack onBack={() => router.back()} />

      <div className="pt-16 pb-20 max-w-2xl mx-auto">
        {/* Current PR Card */}
        <div className="bg-dark-card shadow-sm border border-dark-border rounded-lg mx-4 mb-4 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{pr.metricName}</h2>
              <p className="text-sm text-text-secondary mt-1">{pr.exerciseName}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadgeClass(
                pr.category
              )}`}
            >
              {pr.category}
            </span>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-text-secondary mb-1">Current Record</p>
            <p className="text-4xl font-bold text-orange-primary">
              {pr.currentValue} {pr.currentUnit}
            </p>
            <p className="text-sm text-text-secondary mt-2">
              Achieved on {formatDate(pr.currentDate)}
            </p>
          </div>

          {pr.notes && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-xs font-medium text-text-secondary mb-1">Notes</p>
              <p className="text-sm text-text-primary">{pr.notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/prs/${prId}/add-record`)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Add Record
            </button>
            <button
              onClick={() => router.push(`/prs/${prId}/edit`)}
              className="flex-1 bg-dark-elevated text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Edit PR
            </button>
          </div>
        </div>

        {/* History Section */}
        <div className="mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary">
              History
            </h3>
            <span className="text-sm text-text-secondary">
              {pr.history.length} {pr.history.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {pr.history.length === 0 ? (
            <div className="bg-dark-card shadow-sm border border-dark-border rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No historical records yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Add records to track your progress over time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pr.history.map((record, index) => {
                const isCurrent =
                  record.value === pr.currentValue &&
                  new Date(record.achievedDate).getTime() ===
                    new Date(pr.currentDate).getTime();

                return (
                  <div
                    key={record.historyId}
                    className={`bg-dark-card rounded-lg p-4 border shadow-sm transition-all ${
                      isCurrent 
                        ? 'border-blue-500 dark:border-blue-400' 
                        : 'border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-2xl font-bold text-text-primary">
                            {record.value} {record.unit}
                          </p>
                          {isCurrent && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">
                          {formatDate(record.achievedDate)}
                        </p>
                        {record.notes && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            {record.notes}
                          </p>
                        )}
                      </div>

                      {pr.history.length > 1 && (
                        <button
                          onClick={() => handleDeleteRecord(record.historyId)}
                          disabled={deleteRecord.isPending}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 transition-colors"
                          title="Delete record"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Show progression from previous */}
                    {index < pr.history.length - 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {(() => {
                          const prev = pr.history[index + 1];
                          const diff = record.value - prev.value;
                          const isImprovement = diff > 0;

                          return (
                            <p
                              className={`text-xs font-medium ${
                                isImprovement 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {isImprovement ? '↑' : '↓'} {Math.abs(diff).toFixed(2)}{' '}
                              {record.unit} from previous
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete PR Button */}
        <div className="mx-4 mt-6">
          <button
            onClick={handleDeletePR}
            disabled={deletePR.isPending}
            className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-3 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 border border-red-200 dark:border-red-800"
          >
            {deletePR.isPending ? 'Deleting...' : 'Delete Personal Record'}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            This will delete the PR and all historical records
          </p>
        </div>
      </div>
    </div>
  );
}
