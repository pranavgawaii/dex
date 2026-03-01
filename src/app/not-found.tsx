import Link from 'next/link'
import { Terminal, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#080808]">
            <h1 className="text-8xl font-bold font-geist text-gray-200 dark:text-[#1F1F1F]">
                404
            </h1>
            <Terminal className="w-10 h-10 text-blue-600 dark:text-blue-500 mt-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F5F5F5] mt-3">
                Page not found
            </h2>
            <p className="text-sm text-gray-500 dark:text-[#71717A] mt-1">
                This page doesn&apos;t exist in DEX yet.
            </p>
            <Link
                href="/"
                className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 mt-6 inline-flex items-center gap-2"
            >
                <Home className="w-4 h-4" />
                Back to Home
            </Link>
        </div>
    )
}
