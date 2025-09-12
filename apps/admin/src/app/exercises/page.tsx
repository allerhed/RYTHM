'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { StatsCard } from '@/components/StatsCard';
import { ExerciseModal } from '../../components/ExerciseModal';
import { apiClient, type ExerciseTemplate, type ExerciseTemplateStats } from '@/lib/api';

// Simple SVG Icons
const PencilIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const DumbbellIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h2v8H4V8zm0-3h2v2H4V5zm0 14h2v2H4v-2zm16-11h-2v8h2V8zm0-3h-2v2h2V5zm0 14h-2v2h2v-2zM8 7h8v10H8V7z" />
  </svg>
);

const TargetIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const ActivityIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const TrendingUpIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export default function ExercisesPage() {
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [stats, setStats] = useState<ExerciseTemplateStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExerciseTemplate, setEditingExerciseTemplate] = useState<ExerciseTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadExerciseTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.admin.getExerciseTemplates({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        type: typeFilter || undefined,
      });

      setExerciseTemplates(response.exerciseTemplates);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading exercise templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.admin.getExerciseTemplateStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading exercise template stats:', error);
    }
  };

  useEffect(() => {
    loadExerciseTemplates();
  }, [currentPage, searchTerm, categoryFilter, typeFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleEdit = (exerciseTemplate: ExerciseTemplate) => {
    setEditingExerciseTemplate(exerciseTemplate);
    setIsModalOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this exercise template?')) return;

    try {
      await apiClient.admin.deleteExerciseTemplate({ template_id: templateId });
      await loadExerciseTemplates();
      await loadStats();
    } catch (error) {
      console.error('Error deleting exercise template:', error);
      alert('Failed to delete exercise template');
    }
  };

  const handleSave = async () => {
    setIsModalOpen(false);
    setEditingExerciseTemplate(null);
    await loadExerciseTemplates();
    await loadStats();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExerciseTemplate(null);
  };

  const strengthCount = stats?.exerciseTemplatesByType.find(t => t.exercise_type === 'STRENGTH')?.count || '0';
  const cardioCount = stats?.exerciseTemplatesByType.find(t => t.exercise_type === 'CARDIO')?.count || '0';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercise Template Management</h1>
            <p className="text-gray-600">Manage exercise templates across all tenants</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Exercise Template
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Templates"
            value={stats?.totalExerciseTemplates || 0}
            icon={<DumbbellIcon />}
            gradient="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Strength Templates"
            value={strengthCount}
            icon={<TargetIcon />}
            gradient="from-green-500 to-green-600"
          />
          <StatsCard
            title="Cardio Templates"
            value={cardioCount}
            icon={<ActivityIcon />}
            gradient="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Recent (7d)"
            value={stats?.recentExerciseTemplates || 0}
            icon={<TrendingUpIcon />}
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercise templates..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="dropdown-fix w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="mobility">Mobility</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="dropdown-fix w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="STRENGTH">Strength</option>
                <option value="CARDIO">Cardio</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setTypeFilter('');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Exercise Templates Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Exercise Templates ({totalCount})
            </h3>
          </div>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading exercise templates...</p>
            </div>
          ) : exerciseTemplates.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No exercise templates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercise Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Muscle Groups
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exerciseTemplates.map((exerciseTemplate) => (
                    <tr key={exerciseTemplate.template_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{exerciseTemplate.name}</div>
                          <div className="text-sm text-gray-500">{exerciseTemplate.exercise_category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          exerciseTemplate.exercise_type === 'STRENGTH' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {exerciseTemplate.exercise_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {exerciseTemplate.muscle_groups.slice(0, 3).map((group, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {group}
                            </span>
                          ))}
                          {exerciseTemplate.muscle_groups.length > 3 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              +{exerciseTemplate.muscle_groups.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exerciseTemplate.equipment || 'None'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {exerciseTemplate.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(exerciseTemplate.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(exerciseTemplate)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exerciseTemplate.template_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} exercise templates
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Template Modal */}
      {isModalOpen && (
        <ExerciseModal
          exerciseTemplate={editingExerciseTemplate}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}
    </AdminLayout>
  );
}