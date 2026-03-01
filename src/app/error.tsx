'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#080808]">
            <AlertTriangle className="w-12 h-12 text-red-400 dark:text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F5F5F5] mt-4">
                Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-[#71717A] mt-2 max-w-sm text-center">
                {error.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-3 mt-6">
                <button
                    onClick={() => reset()}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                    Try Again
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="border border-gray-300 dark:border-[#1F1F1F] text-gray-700 dark:text-[#F5F5F5] px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#161616]"
                >
                    Go Home
                </button>
            </div>
        </div>
    )
}
