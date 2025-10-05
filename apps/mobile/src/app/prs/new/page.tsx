'use client';

/**
 * Add New Personal Record Page
 * 
 * Features:
 * - Select exercise from library
 * - Input metric name (e.g., "1RM", "3RM", "5k time")
 * - Select category (strength/cardio)
 * - Input value and unit
 * - Select date achieved
 * - Optional notes
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '../../../lib/trpc';
import { Header } from '../../../components/Navigation';

export default function NewPRPage() {
  const router = useRouter();
  const [templateId, setExerciseTemplateId] = useState('');
  const [metricName, setMetricName] = useState('');
  const [category, setCategory] = useState<'strength' | 'cardio'>('strength');
  const [valueNumeric, setValueNumeric] = useState('');
  const [valueUnit, setValueUnit] = useState('');
  const [achievedDate, setAchievedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Fetch exercise templates
  const { data: exercises, isLoading: exercisesLoading } =
    trpc.exerciseTemplates.list.useQuery({});

  // Create PR mutation
  const createPR = trpc.personalRecords.create.useMutation({
    onSuccess: (data) => {
      router.push(`/prs/${data.prId}`);
    },
    onError: (error) => {
      alert(`Error creating PR: ${error.message}`);
    },
  });

  const selectedExercise = exercises?.find(
    (ex) => ex.templateId === templateId
  );

  const filteredExercises = exercises?.filter((ex) =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateId) {
      alert('Please select an exercise');
      return;
    }

    if (!metricName.trim()) {
      alert('Please enter a metric name');
      return;
    }

    if (!valueNumeric || parseFloat(valueNumeric) <= 0) {
      alert('Please enter a valid value');
      return;
    }

    if (!valueUnit.trim()) {
      alert('Please enter a unit');
      return;
    }

    createPR.mutate({
      templateId,
      metricName: metricName.trim(),
      category,
      valueNumeric: parseFloat(valueNumeric),
      valueUnit: valueUnit.trim(),
      achievedDate: new Date(achievedDate),
      notes: notes.trim() || undefined,
    });
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setExerciseTemplateId(exerciseId);
    setShowExercisePicker(false);
    setExerciseSearch('');

    // Auto-set category based on exercise
    const exercise = exercises?.find((ex) => ex.templateId === exerciseId);
    if (exercise?.exerciseCategory === 'strength') {
      setCategory('strength');
    } else if (exercise?.exerciseCategory === 'cardio') {
      setCategory('cardio');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Add Personal Record"
        showBack
        onBack={() => router.back()}
      />

      <div className="pt-16 pb-20">
        <form onSubmit={handleSubmit} className="bg-white">
          {/* Exercise Selection */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise *
            </label>
            {!showExercisePicker ? (
              <button
                type="button"
                onClick={() => setShowExercisePicker(true)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-left hover:bg-gray-100 transition-colors"
              >
                {selectedExercise ? (
                  <span className="text-gray-900">{selectedExercise.name}</span>
                ) : (
                  <span className="text-gray-500">Select an exercise</span>
                )}
              </button>
            ) : (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full px-4 py-3 border-b border-gray-200"
                  autoFocus
                />
                <div className="max-h-60 overflow-y-auto">
                  {exercisesLoading ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      Loading exercises...
                    </div>
                  ) : filteredExercises && filteredExercises.length > 0 ? (
                    filteredExercises.map((ex) => (
                      <button
                        key={ex.templateId}
                        type="button"
                        onClick={() => handleExerciseSelect(ex.templateId)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{ex.name}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {ex.exerciseCategory}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No exercises found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
            <p className="text-xs text-gray-500 mt-1">
              Example: "1RM" for one-rep max, "5k time" for 5k personal best
            </p>
          </div>

          {/* Category */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCategory('strength')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  category === 'strength'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Strength
              </button>
              <button
                type="button"
                onClick={() => setCategory('cardio')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  category === 'cardio'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cardio
              </button>
            </div>
          </div>

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
                placeholder="kg"
                className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the numeric value and unit (e.g., 150 kg, 20:30 min)
            </p>
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
              placeholder="Add any notes about this PR..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="px-4 py-4">
            <button
              type="submit"
              disabled={createPR.isPending}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                createPR.isPending
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {createPR.isPending ? 'Creating...' : 'Create Personal Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
