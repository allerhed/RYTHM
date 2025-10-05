'use client';

/**
 * Add Record to Existing PR Page
 */

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '../../../../lib/trpc';
import { Header } from '../../../../components/Navigation';

export default function AddRecordPage() {
  const router = useRouter();
  const params = useParams();
  const prId = params.id as string;

  const [valueNumeric, setValueNumeric] = useState('');
  const [valueUnit, setValueUnit] = useState('');
  const [achievedDate, setAchievedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Fetch PR details for context
  const { data: pr } = trpc.personalRecords.getById.useQuery({ prId });

  // Add record mutation
  const addRecord = trpc.personalRecords.addRecord.useMutation({
    onSuccess: () => {
      router.push(`/prs/${prId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!valueNumeric || parseFloat(valueNumeric) <= 0) {
      alert('Please enter a valid value');
      return;
    }

    if (!valueUnit.trim()) {
      alert('Please enter a unit');
      return;
    }

    addRecord.mutate({
      prId,
      valueNumeric: parseFloat(valueNumeric),
      valueUnit: valueUnit.trim(),
      achievedDate: new Date(achievedDate),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Add Record"
        showBack
        onBack={() => router.back()}
      />

      <div className="pt-16 pb-20">
        {pr && (
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <p className="text-sm text-gray-600">Adding record to</p>
            <p className="font-semibold text-gray-900">{pr.exerciseName}</p>
            <p className="text-sm text-gray-600">{pr.metricName}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white">
          {/* Value */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value *
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={valueNumeric}
                onChange={(e) => setValueNumeric(e.target.value)}
                placeholder="150"
                step="0.01"
                min="0"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="text"
                value={valueUnit}
                onChange={(e) => setValueUnit(e.target.value)}
                placeholder={pr?.currentUnit || 'kg'}
                className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={20}
              />
            </div>
          </div>

          {/* Date Achieved */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Achieved *
            </label>
            <input
              type="date"
              value={achievedDate}
              onChange={(e) => setAchievedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              placeholder="Add any notes about this record..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="px-4 py-4">
            <button
              type="submit"
              disabled={addRecord.isPending}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                addRecord.isPending
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {addRecord.isPending ? 'Adding...' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
