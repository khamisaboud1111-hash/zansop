'use client'

import { useEffect, useState, Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    try {
      document.title = 'ERR: ' + (error.name + ': ' + error.message).slice(0, 90)
    } catch {
      // best effort
    }
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global error caught:', error, errorInfo)
    try {
      document.title = 'ERR: ' + (error.name + ': ' + error.message).slice(0, 90)
    } catch {
      // best effort
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Deliberately self-contained: no store, i18n or theme context. The whole
      // point of an error boundary is to survive the failure that triggered it,
      // and this one sits inside the store provider - reaching back into that
      // context made it throw as well, which left the page permanently blank.
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-white">
          <div className="w-full max-w-md text-center">
            <h1 className="text-lg font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function withGlobalErrorBoundary(children: ReactNode) {
  return <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
}

