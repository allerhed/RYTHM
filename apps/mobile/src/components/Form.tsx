import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).slice(2)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined

    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId} 
          className="block text-sm font-semibold text-text-primary"
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`input w-full bg-dark-card border-dark-border text-text-primary placeholder-text-tertiary ${error ? 'border-red-500 focus:border-red-500' : 'focus:border-orange-primary'} ${className}`}
          aria-invalid={!!error}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ')}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-text-secondary">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'btn focus-visible'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    outline: 'btn-outline'
  }
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[2.25rem]',
    md: 'px-6 py-3 text-base min-h-[2.75rem]',
    lg: 'px-8 py-4 text-lg min-h-[3.25rem]'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="spinner w-4 h-4 mr-2" aria-hidden="true" />
      )}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>
      {loading && <span className="sr-only">Loading...</span>}
    </button>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    const selectId = props.id || `select-${Math.random().toString(36).slice(2)}`
    const errorId = error ? `${selectId}-error` : undefined

    return (
      <div className="space-y-2">
        <label 
          htmlFor={selectId} 
          className="block text-sm font-semibold text-text-primary"
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`input w-full bg-dark-card border-dark-border text-text-primary ${error ? 'border-red-500 focus:border-red-500' : 'focus:border-orange-primary'} ${className}`}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-dark-card text-text-primary">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'