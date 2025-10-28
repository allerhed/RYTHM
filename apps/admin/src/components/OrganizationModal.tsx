'use client'
import { useState, useEffect } from 'react'
import { z } from 'zod'

interface Organization {
  tenant_id: string
  name: string
  branding?: Record<string, any>
  created_at: string
  updated_at: string
  user_count?: number
  session_count?: number
  last_activity?: string
}

interface OrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; branding?: Record<string, any> }) => Promise<void>
  organization?: Organization | null
  isLoading?: boolean
}

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name must be less than 255 characters'),
  branding: z.record(z.any()).optional(),
})

type OrganizationFormData = z.infer<typeof organizationSchema>

export function OrganizationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  organization, 
  isLoading = false 
}: OrganizationModalProps) {
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    branding: {},
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [brandingJson, setBrandingJson] = useState('')
  const [jsonError, setJsonError] = useState('')

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        branding: organization.branding || {},
      })
      setBrandingJson(JSON.stringify(organization.branding || {}, null, 2))
    } else {
      setFormData({
        name: '',
        branding: {},
      })
      setBrandingJson('{}')
    }
    setErrors({})
    setJsonError('')
  }, [organization, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    try {
      organizationSchema.parse(formData)
      setErrors({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
        return
      }
    }

    // Validate JSON branding
    let parsedBranding = {}
    if (brandingJson.trim()) {
      try {
        parsedBranding = JSON.parse(brandingJson)
      } catch (error) {
        setJsonError('Invalid JSON format')
        return
      }
    }
    setJsonError('')

    try {
      await onSave({
        name: formData.name,
        branding: parsedBranding,
      })
      onClose()
    } catch (error) {
      console.error('Error saving organization:', error)
    }
  }

  const handleBrandingChange = (value: string) => {
    setBrandingJson(value)
    setJsonError('')
    
    // Try to parse and update formData
    try {
      const parsed = JSON.parse(value)
      setFormData(prev => ({ ...prev, branding: parsed }))
    } catch (error) {
      // Invalid JSON, but don't show error yet
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {organization ? 'Edit Organization' : 'Create Organization'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-200"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`dropdown-fix w-full px-4 py-3 rounded-xl bg-gray-700 border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter organization name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Branding */}
            <div>
              <label htmlFor="branding" className="block text-sm font-medium text-gray-300 mb-2">
                Branding Configuration (JSON)
              </label>
              <textarea
                id="branding"
                value={brandingJson}
                onChange={(e) => handleBrandingChange(e.target.value)}
                rows={8}
                className={`dropdown-fix w-full px-4 py-3 rounded-xl bg-gray-700 border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200 font-mono text-sm ${
                  jsonError ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder='{"primaryColor": "#3B82F6", "logo": "https://..."}'
                disabled={isLoading}
              />
              {jsonError && (
                <p className="mt-2 text-sm text-red-400">{jsonError}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Configure organization branding settings as JSON. Leave empty for default settings.
              </p>
            </div>

            {/* Organization Info (if editing) */}
            {organization && (
              <div className="bg-gray-700/50 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Organization Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white ml-2">
                      {new Date(organization.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Users:</span>
                    <span className="text-white ml-2">{organization.user_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Sessions:</span>
                    <span className="text-white ml-2">{organization.session_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Activity:</span>
                    <span className="text-white ml-2">
                      {organization.last_activity 
                        ? new Date(organization.last_activity).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 hover:text-white transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  organization ? 'Update Organization' : 'Create Organization'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}