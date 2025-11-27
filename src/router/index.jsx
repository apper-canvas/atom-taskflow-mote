import { createBrowserRouter, useLocation } from "react-router-dom";
import React, { Suspense, useState } from "react";
import { projectService } from "@/services/api/projectService";
import { taskService } from "@/services/api/taskService";
import Layout from "@/components/organisms/Layout";
import ProjectSettings from "@/components/pages/ProjectSettings";
import ProjectTimeline from "@/components/pages/ProjectTimeline";
import Dashboard from "@/components/pages/Dashboard";
import NotificationPreferences from "@/components/pages/NotificationPreferences";
import NotFound from "@/components/pages/NotFound";
import ProjectDetail from "@/components/pages/ProjectDetail";
import Templates from "@/components/pages/Templates";
import NotificationCenter from "@/components/pages/NotificationCenter";
import ProjectList from "@/components/pages/ProjectList";
import ProjectCreateModal from "@/components/molecules/ProjectCreateModal";
import TaskEditModal from "@/components/molecules/TaskEditModal";
import toast from "@/utils/toast";

// Lazy load create pages
const TaskCreate = React.lazy(() => import('@/components/pages/TaskCreate'))
const ProjectCreate = React.lazy(() => import('@/components/pages/ProjectCreate'))

// Suspense wrapper component
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <div className="text-lg font-medium text-gray-700">Loading...</div>
      </div>
    </div>
  }>
    {children}
  </Suspense>
);

// Error Boundary Class Component
class RouterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Router Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center space-y-6 max-w-lg mx-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
              <p className="text-gray-600 mb-4">
                Something went wrong while loading the application. This could be due to network issues or missing resources.
              </p>
              {this.state.error?.message && (
                <details className="text-left bg-gray-50 p-4 rounded-lg mb-4">
                  <summary className="cursor-pointer font-medium text-gray-700">Error Details</summary>
                  <p className="mt-2 text-sm text-gray-600 font-mono">{this.state.error.message}</p>
                </details>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const mainRoutes = [
  {
    path: "",
    element: <SuspenseWrapper><Dashboard /></SuspenseWrapper>,
    index: true
  },
  {
    path: "projects",
    element: <SuspenseWrapper><ProjectList /></SuspenseWrapper>
  },
  {
    path: "projects/create",
    element: <SuspenseWrapper><ProjectCreate /></SuspenseWrapper>
  },
  {
    path: "projects/:id",
    element: <SuspenseWrapper><ProjectDetail /></SuspenseWrapper>
  },
  {
    path: "projects/:id/settings",
    element: <SuspenseWrapper><ProjectSettings /></SuspenseWrapper>
  },
  {
    path: "projects/:id/timeline",
    element: <SuspenseWrapper><ProjectTimeline /></SuspenseWrapper>
  },
  {
    path: "tasks/create",
    element: <SuspenseWrapper><TaskCreate /></SuspenseWrapper>
  },
  {
    path: "notifications",
    element: <SuspenseWrapper><NotificationCenter /></SuspenseWrapper>
  },
  {
    path: "notifications/preferences",
    element: <SuspenseWrapper><NotificationPreferences /></SuspenseWrapper>
  },
  {
    path: "templates",
    element: <SuspenseWrapper><Templates /></SuspenseWrapper>
  },
  {
    path: "*",
    element: <SuspenseWrapper><NotFound /></SuspenseWrapper>
  }
];

const routes = [
  {
    path: "/",
    element: <SuspenseWrapper><Layout /></SuspenseWrapper>,
    children: mainRoutes,
    errorElement: (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center space-y-4 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Route Error</h2>
          <p className="text-gray-600">Unable to load the requested page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }
]

export const router = createBrowserRouter(routes);

// Enhanced router with error boundary wrapper
export const createRouterWithErrorBoundary = () => (
  <RouterErrorBoundary>
    {/* Router will be provided by App component */}
  </RouterErrorBoundary>
);