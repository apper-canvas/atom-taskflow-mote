import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { ToastContainer } from "react-toastify";

// Application Error Boundary for production chunk loading failures
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is a chunk loading error
    if (error.message?.includes('Loading chunk') || 
        error.message?.includes('dynamically imported module') ||
        error.message?.includes('Failed to fetch')) {
      console.info('Detected chunk loading failure, attempting recovery...');
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: null, 
        retryCount: prevState.retryCount + 1 
      }));
    } else {
      // Force full reload after 3 attempts
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Loading chunk') || 
                          this.state.error?.message?.includes('dynamically imported module') ||
                          this.state.error?.message?.includes('Failed to fetch');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center space-y-6 max-w-lg mx-4 p-8 bg-white rounded-2xl shadow-xl">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              {isChunkError ? (
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isChunkError ? 'Loading Issue Detected' : 'Application Error'}
              </h1>
              <p className="text-gray-600 mb-4">
                {isChunkError 
                  ? 'Some application resources failed to load. This usually happens due to network issues or cached files being outdated.'
                  : 'Something unexpected happened. We\'re sorry for the inconvenience.'
                }
              </p>
              
              {this.state.retryCount > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.state.retryCount < 3 ? (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reload Application
                </button>
              )}
              
              {isChunkError && (
                <button
onClick={() => {
                    // Clear all caches and reload
                    if ('caches' in window && window.caches) {
                      window.caches.keys().then(names => {
                        names.forEach(name => window.caches.delete(name));
                      }).finally(() => window.location.reload());
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear Cache & Reload
                </button>
              )}
</div>
            
            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="text-left bg-gray-50 p-4 rounded-lg mt-4">
                <summary className="cursor-pointer font-medium text-gray-700">Developer Info</summary>
                <p className="mt-2 text-sm text-gray-600 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          fontFamily: "Inter, sans-serif"
        }}
      />
    </AppErrorBoundary>
  )
}

export default App