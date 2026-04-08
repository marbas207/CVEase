import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/button'
import { AlertOctagon } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  info: ErrorInfo | null
}

/**
 * Top-level safety net for renderer crashes. Without this, an uncaught error
 * during render leaves the user staring at a blank window with no way out
 * except killing the app — which loses any in-flight modal state.
 *
 * On catch we show the error message + a stack trace summary, plus a
 * "Reload" button that triggers `location.reload()`. The CVE database is
 * unaffected since it lives in the main process; reloading just rebuilds
 * the renderer state from scratch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console — electron-log on the main side picks this up via
    // the renderer log bridge so it lands in the same logfile.
    console.error('Renderer crash:', error, info.componentStack)
    this.setState({ info })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleClear = (): void => {
    this.setState({ error: null, info: null })
  }

  render(): ReactNode {
    const { error, info } = this.state

    if (!error) return this.props.children

    return (
      <div className="h-screen flex items-center justify-center p-8 bg-background">
        <div className="max-w-2xl w-full bg-card border border-destructive/40 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-destructive/10">
            <AlertOctagon className="w-5 h-5 text-destructive shrink-0" />
            <h1 className="text-base font-semibold">Something went wrong</h1>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              The interface hit an unexpected error. Your data is safe — it lives in
              the database, not in this window. Reloading will rebuild the UI from scratch.
            </p>

            <div className="rounded-md bg-muted/50 border border-border p-3">
              <p className="text-xs font-mono font-semibold text-destructive break-words">
                {error.name}: {error.message}
              </p>
              {info?.componentStack && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Component stack
                  </summary>
                  <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {info.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={this.handleClear}>
                Try to recover
              </Button>
              <Button size="sm" onClick={this.handleReload}>
                Reload window
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
