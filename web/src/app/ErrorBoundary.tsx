import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/molecules/ErrorState'

type Props = { children: ReactNode; resetKey?: string }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha de renderização', error, info.componentStack)
  }
  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  render() {
    if (this.state.error)
      return <ErrorState title="Algo quebrou nesta tela" message={this.state.error.message} onRetry={() => this.setState({ error: null })} />
    return this.props.children
  }
}
