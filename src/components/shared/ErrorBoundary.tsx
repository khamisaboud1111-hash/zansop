'use client'

import { useEffect, useState, Component, ReactNode } from 'react'

import { ErrorState } from '@/components/shared/ErrorState'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Client-side error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Self-contained fallback: never touch the store/context that may have
      // crashed, otherwise the boundary throws too and the page stays blank.
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-white">
          <div className="w-full max-w-md">
            <ErrorState
              title="Kitu kimekosea"
              description={this.state.error?.message || "Samahani, hitilafu imetokea."}
              retryLabel="Jaribu tena"
              onClick={() => this.setState({ hasError: false, error: null })}
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function withErrorBoundary(children: ReactNode) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

