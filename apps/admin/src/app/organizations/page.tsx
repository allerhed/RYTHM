'use client'
import { AdminLayout } from '@/components/AdminLayout'

interface Organization {
  id: string
  name: string
  plan: string
  users: number
  status: 'active' | 'trial' | 'suspended'
  createdAt: string
  lastActive: string
}

const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'FitPro Studio',
    plan: 'Professional',
    users: 245,
    status: 'active',
    createdAt: '2024-01-15',
    lastActive: '2 hours ago'
  },
  {
    id: '2',
    name: 'CrossFit Downtown',
    plan: 'Enterprise',
    users: 487,
    status: 'active',
    createdAt: '2023-11-22',
    lastActive: '5 minutes ago'
  },
  {
    id: '3',
    name: 'Zen Yoga Studio',
    plan: 'Basic',
    users: 89,
    status: 'trial',
    createdAt: '2024-03-10',
    lastActive: '1 day ago'
  },
  {
    id: '4',
    name: 'Personal Fitness Co',
    plan: 'Professional',
    users: 156,
    status: 'active',
    createdAt: '2024-02-05',
    lastActive: '30 minutes ago'
  },
  {
    id: '5',
    name: 'Ultimate Bootcamp',
    plan: 'Basic',
    users: 67,
    status: 'suspended',
    createdAt: '2023-12-18',
    lastActive: '1 week ago'
  }
]

export default function OrganizationsPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'trial':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'suspended':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'Professional':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Basic':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getOrgIcon = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Organizations
            </h1>
            <p className="mt-2 text-gray-400">
              Manage organizations, plans, and subscription details.
            </p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
            Add Organization
          </button>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockOrganizations.map((org) => (
            <div key={org.id} className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-white">
                      {getOrgIcon(org.name)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {org.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Created {new Date(org.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusBadge(org.status)}`}>
                  {org.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getPlanBadge(org.plan)}`}>
                    {org.plan}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Users</span>
                  <span className="text-white font-semibold">{org.users.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last Active</span>
                  <span className="text-gray-300">{org.lastActive}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex space-x-3">
                  <button className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200 text-sm">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors duration-200 text-sm">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Total Organizations
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {mockOrganizations.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-9 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Active Organizations
                </p>
                <p className="mt-2 text-3xl font-bold text-green-400">
                  {mockOrganizations.filter(org => org.status === 'active').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Trial Organizations
                </p>
                <p className="mt-2 text-3xl font-bold text-yellow-400">
                  {mockOrganizations.filter(org => org.status === 'trial').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Total Users
                </p>
                <p className="mt-2 text-3xl font-bold text-purple-400">
                  {mockOrganizations.reduce((sum, org) => sum + org.users, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}