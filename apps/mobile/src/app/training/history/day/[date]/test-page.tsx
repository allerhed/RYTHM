'use client'
import React from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function TestDayView() {
  const router = useRouter()
  const params = useParams()
  const dateParam = params.date as string

  console.log('TestDayView rendering with dateParam:', dateParam)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Day View Test
          </h1>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Date Parameter: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{dateParam}</span>
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            This is a test page to verify navigation is working.
          </p>
          <p className="text-green-600 font-semibold">
            ✅ Success! Day view page is loading correctly.
          </p>
        </div>
      </div>
    </div>
  )
}