'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

interface User {
  id?: string
  first_name?: string
  last_name?: string
  email: string
  role: 'athlete' | 'coach' | 'tenant_admin' | 'org_admin'
  organization_id?: string
  password?: string
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (user: User) => Promise<void>
  user?: User | null
  mode: 'add' | 'edit'
}

export function UserModal({ isOpen, onClose, onSubmit, user, mode }: UserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<User>({
    defaultValues: user || {
      first_name: '',
      last_name: '',
      email: '',
      role: 'athlete',
      password: '',
    },
  })

  useEffect(() => {
    if (user) {
      reset(user)
    } else {
      reset({
        first_name: '',
        last_name: '',
        email: '',
        role: 'athlete',
        password: '',
      })
    }
  }, [user, reset])

  const handleFormSubmit = async (data: User) => {
    if (mode === 'edit' && !data.password) {
      delete data.password
    }
    
    setIsLoading(true)
    try {
      await onSubmit(data)
      onClose()
      toast.success(mode === 'add' ? 'User created successfully!' : 'User updated successfully!')
    } catch (error) {
      toast.error(mode === 'add' ? 'Failed to create user' : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">
            {mode === 'add' ? 'Add New User' : 'Edit User'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('first_name')}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('last_name')}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300">
                  Role
                </label>
                <select
                  id="role"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('role')}
                >
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                  <option value="tenant_admin">Tenant Admin</option>
                  <option value="org_admin">Org Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password {mode === 'edit' && <span className="text-gray-500">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('password', { 
                    required: mode === 'add' ? 'Password is required' : false,
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : mode === 'add' ? 'Create User' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}