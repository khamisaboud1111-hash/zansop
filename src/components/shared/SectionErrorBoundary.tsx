'use client'

import { Component, ReactNode } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'
import { t, type Language } from '@/i18n/translations'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string
  lang?: Language
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`SectionErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const lang = this.props.lang || 'sw'
      return (
        <div className="section">
          <div className="page-container">
            <ErrorState
              title={t('somethingWentWrong', lang)}
              description={this.state.error?.message || t('errorOccurred', lang)}
              retryLabel={t('tryAgain', lang)}
              onClick={() => this.setState({ hasError: false, error: null })}
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function withSectionErrorBoundary(children: ReactNode, name?: string, lang?: Language) {
  return <SectionErrorBoundary name={name} lang={lang}>{children}</SectionErrorBoundary>
}

