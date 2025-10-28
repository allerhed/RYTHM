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

const SortIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
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

type SortField = 'name' | 'exercise_type' | 'exercise_category' | 'created_at';
type SortDirection = 'asc' | 'desc';

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
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortExercises = (exercises: ExerciseTemplate[]) => {
    return [...exercises].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle different data types
      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const loadExerciseTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.admin.getExerciseTemplates({
        page: currentPage,
        limit: 12,
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        type: typeFilter || undefined,
      });

      const sortedExercises = sortExercises(response.exerciseTemplates);
      setExerciseTemplates(sortedExercises);
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
  }, [currentPage, searchTerm, categoryFilter, typeFilter, sortField, sortDirection]);

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
            <h1 className="text-3xl font-bold text-white">
              Exercise Template Management
            </h1>
            <p className="mt-2 text-gray-400">
              Manage exercise templates across all organizations.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg flex items-center gap-2"
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
            gradient="from-orange-500 to-orange-600"
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
            gradient="from-orange-500 to-orange-600"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Search:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearchTerm(e.target.value);
                }}
                placeholder="Search exercises..."
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setCategoryFilter(e.target.value);
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Categories</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="sports">Sports</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setTypeFilter(e.target.value);
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                <option value="STRENGTH">Strength</option>
                <option value="CARDIO">Cardio</option>
              </select>
            </div>
            
            {(searchTerm || categoryFilter || typeFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setTypeFilter('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-dark-elevated0 transition-colors text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Sorting Controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-300">Sort by:</span>
            {[{field: 'name' as SortField, label: 'Name'}, {field: 'exercise_type' as SortField, label: 'Type'}, {field: 'exercise_category' as SortField, label: 'Category'}, {field: 'created_at' as SortField, label: 'Date'}].map(({field, label}) => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                  sortField === field 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label}
                {sortField === field && (
                  <span className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                    ↑
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-400">Loading exercise templates...</span>
          </div>
        ) : exerciseTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No exercise templates found</div>
            <div className="text-gray-500">Create your first exercise template to get started</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exerciseTemplates.map((exerciseTemplate) => (
              <div key={exerciseTemplate.template_id} className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg text-white">
                      {exerciseTemplate.exercise_type === 'STRENGTH' ? (
                        <DumbbellIcon className="w-6 h-6" />
                      ) : (
                        <ActivityIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {exerciseTemplate.name}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">
                        {exerciseTemplate.exercise_category}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${
                    exerciseTemplate.exercise_type === 'STRENGTH' 
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                      : 'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>
                    {exerciseTemplate.exercise_type}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Equipment</span>
                    <span className="text-white text-sm">{exerciseTemplate.equipment || 'None'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Value Types</span>
                    <div className="flex space-x-1">
                      {exerciseTemplate.default_value_1_type && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {exerciseTemplate.default_value_1_type.replace('_', ' ')}
                        </span>
                      )}
                      {exerciseTemplate.default_value_2_type && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {exerciseTemplate.default_value_2_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 text-sm">Muscle Groups</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exerciseTemplate.muscle_groups.slice(0, 3).map((group, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded"
                        >
                          {group}
                        </span>
                      ))}
                      {exerciseTemplate.muscle_groups.length > 3 && (
                        <span className="inline-flex px-2 py-1 text-xs bg-dark-elevated0/20 text-gray-400 border border-gray-500/30 rounded">
                          +{exerciseTemplate.muscle_groups.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {exerciseTemplate.description && (
                    <div>
                      <span className="text-gray-400 text-sm">Description</span>
                      <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                        {exerciseTemplate.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">{new Date(exerciseTemplate.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEdit(exerciseTemplate)}
                      className="flex-1 px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exerciseTemplate.template_id)}
                      className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {currentPage} of {totalPages} • {totalCount} total
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
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