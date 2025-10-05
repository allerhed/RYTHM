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
        return 'bg-blue-500 text-white';
      case 'cardio':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
      <div className="min-h-screen bg-gray-50">
        <Header title="Loading..." showBack onBack={() => router.back()} />
        <div className="pt-16 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Error" showBack onBack={() => router.back()} />
        <div className="pt-16 px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Failed to load personal record</p>
            <p className="text-red-600 text-sm mt-1">
              {error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={pr.exerciseName} showBack onBack={() => router.back()} />

      <div className="pt-16 pb-20">
        {/* Current PR Card */}
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{pr.metricName}</h2>
              <p className="text-sm text-gray-600 mt-1">{pr.exerciseName}</p>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${getCategoryBadgeClass(
                pr.category
              )}`}
            >
              {pr.category}
            </span>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Current Record</p>
            <p className="text-3xl font-bold text-indigo-600">
              {pr.currentValue} {pr.currentUnit}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Achieved on {formatDate(pr.currentDate)}
            </p>
          </div>

          {pr.notes && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Notes</p>
              <p className="text-gray-900">{pr.notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/prs/${prId}/add-record`)}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Record
            </button>
            <button
              onClick={() => router.push(`/prs/${prId}/edit`)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Edit PR
            </button>
          </div>
        </div>

        {/* History Section */}
        <div className="px-4 py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            History ({pr.history.length} records)
          </h3>

          {pr.history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No historical records yet</p>
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
                    className={`bg-white rounded-lg p-4 border ${
                      isCurrent ? 'border-indigo-500 shadow-sm' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-2xl font-bold text-gray-900">
                            {record.value} {record.unit}
                          </p>
                          {isCurrent && (
                            <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(record.achievedDate)}
                        </p>
                        {record.notes && (
                          <p className="text-sm text-gray-700 mt-2">{record.notes}</p>
                        )}
                      </div>

                      {pr.history.length > 1 && (
                        <button
                          onClick={() => handleDeleteRecord(record.historyId)}
                          disabled={deleteRecord.isPending}
                          className="text-red-600 hover:text-red-700 p-2"
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
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {(() => {
                          const prev = pr.history[index + 1];
                          const diff = record.value - prev.value;
                          const isImprovement = diff > 0;

                          return (
                            <p
                              className={`text-xs ${
                                isImprovement ? 'text-green-600' : 'text-red-600'
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
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={handleDeletePR}
            disabled={deletePR.isPending}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {deletePR.isPending ? 'Deleting...' : 'Delete Personal Record'}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            This will delete the PR and all historical records
          </p>
        </div>
      </div>
    </div>
  );
}
