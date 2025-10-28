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
    (ex) => ex.template_id === templateId
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
    const exercise = exercises?.find((ex) => ex.template_id === exerciseId);
    if (exercise?.exercise_category === 'strength') {
      setCategory('strength');
    } else if (exercise?.exercise_category === 'cardio') {
      setCategory('cardio');
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      <Header
        title="Add Personal Record"
        showBack
        onBack={() => router.back()}
      />

      <div className="pt-16 pb-20">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {/* Exercise Selection */}
          <div className="bg-dark-card shadow-sm rounded-lg mb-4 p-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Exercise *
            </label>
            {!showExercisePicker ? (
              <button
                type="button"
                onClick={() => setShowExercisePicker(true)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {selectedExercise ? (
                  <span className="text-text-primary font-medium">{selectedExercise.name}</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Select an exercise</span>
                )}
              </button>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-primary placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="max-h-60 overflow-y-auto">
                  {exercisesLoading ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading exercises...
                    </div>
                  ) : filteredExercises && filteredExercises.length > 0 ? (
                    filteredExercises.map((ex) => (
                      <button
                        key={ex.template_id}
                        type="button"
                        onClick={() => handleExerciseSelect(ex.template_id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-text-primary">{ex.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {ex.exercise_category}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No exercises found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metric Name */}
          <div className="bg-dark-card shadow-sm rounded-lg mb-4 p-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Metric Name *
            </label>
            <input
              type="text"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder="e.g., 1RM, 3RM, 5k time"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-primary placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Example: "1RM" for one-rep max, "5k time" for 5k personal best
            </p>
          </div>

          {/* Category */}
          <div className="bg-dark-card shadow-sm rounded-lg mb-4 p-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Category *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCategory('strength')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  category === 'strength'
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-elevated text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    : 'bg-dark-elevated text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Cardio
              </button>
            </div>
          </div>

          {/* Value */}
          <div className="bg-dark-card shadow-sm rounded-lg mb-4 p-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
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
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-primary placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={valueUnit}
                onChange={(e) => setValueUnit(e.target.value)}
                placeholder="kg"
                className="w-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-primary placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Enter the numeric value and unit (e.g., 150 kg, 20:30 min)
            </p>
          </div>

          {/* Date Achieved */}
          <div className="bg-dark-card shadow-sm rounded-lg mb-4 p-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Date Achieved *
            </label>
            <input
              type="date"
              value={achievedDate}
              onChange={(e) => setAchievedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div className="bg-dark-card shadow-sm rounded-lg mb-4 p-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this PR..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-primary placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="bg-dark-card shadow-sm rounded-lg p-6">
            <button
              type="submit"
              disabled={createPR.isPending}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                createPR.isPending
                  ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
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
