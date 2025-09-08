'use client'
import { useState } from 'react'

export default function TestAuthPage() {
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testRegistration = async () => {
    setLoading(true)
    setResponse('')
    
    const testData = {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      tenantName: 'Test Org'
    }

    try {
      console.log('Testing registration with data:', testData)
      
      const response = await fetch('http://localhost:3001/api/trpc/auth.register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: testData
        }),
      })

      const result = await response.text()
      console.log('Response:', result)
      setResponse(`Status: ${response.status}\nResponse: ${result}`)

    } catch (error: any) {
      console.error('Test error:', error)
      setResponse(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setResponse('')
    
    const testData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    }

    try {
      console.log('Testing login with data:', testData)
      
      const response = await fetch('http://localhost:3001/api/trpc/auth.login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: testData
        }),
      })

      const result = await response.text()
      console.log('Response:', result)
      setResponse(`Status: ${response.status}\nResponse: ${result}`)

    } catch (error: any) {
      console.error('Test error:', error)
      setResponse(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Auth API</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testRegistration}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Registration'}
        </button>
        
        <button 
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>
      
      {response && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Response:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {response}
          </pre>
        </div>
      )}
    </div>
  )
}