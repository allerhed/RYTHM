'use client';

/**
 * Edit PR Metadata Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '../../../../lib/trpc';
import { Header } from '../../../../components/Navigation';

export default function EditPRPage() {
  const router = useRouter();
  const params = useParams();
  const prId = params.id as string;

  const [metricName, setMetricName] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch PR details
  const { data: pr, isLoading } = trpc.personalRecords.getById.useQuery({ prId });

  // Update PR mutation
  const updatePR = trpc.personalRecords.update.useMutation({
    onSuccess: () => {
      router.push(`/prs/${prId}`);
    },
  });

  // Initialize form with PR data
  useEffect(() => {
    if (pr) {
      setMetricName(pr.metricName);
      setNotes(pr.notes || '');
    }
  }, [pr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!metricName.trim()) {
      alert('Please enter a metric name');
      return;
    }

    updatePR.mutate({
      prId,
      metricName: metricName.trim(),
      notes: notes.trim() || undefined,
    });
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

  if (!pr) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Error" showBack onBack={() => router.back()} />
        <div className="pt-16 px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">PR not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Edit PR"
        showBack
        onBack={() => router.back()}
      />

      <div className="pt-16 pb-20">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <p className="text-sm text-gray-600">Editing</p>
          <p className="font-semibold text-gray-900">{pr.exerciseName}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white">
          {/* Metric Name */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metric Name *
            </label>
            <input
              type="text"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder="e.g., 1RM, 3RM, 5k time"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Notes */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this PR..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Info Message */}
          <div className="px-4 py-4 bg-blue-50 border-b border-gray-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To change values or dates, add a new record from the PR detail page.
            </p>
          </div>

          {/* Submit Button */}
          <div className="px-4 py-4">
            <button
              type="submit"
              disabled={updatePR.isPending}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                updatePR.isPending
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {updatePR.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
