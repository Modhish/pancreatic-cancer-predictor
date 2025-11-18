import React, { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
                !
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-800">
                Something went wrong
              </h2>
              <p className="mt-1 text-sm text-red-700">
                Please refresh the page and try again. If the problem persists,
                contact the system administrator.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
