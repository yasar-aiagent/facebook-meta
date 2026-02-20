import React, { useState } from 'react'
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider'
import { useAdmin } from '@/hooks/useAdmin'
import LoginForm from '@/components/Auth/LoginForm'
import SignupForm from '@/components/Auth/SignupForm'
import ForgotPassword from '@/components/Auth/ForgotPassword'
import Dashboard from '@/pages/Dashboard'
import AdminDashboard from '@/pages/AdminDashboard'

type AuthView = 'login' | 'signup' | 'forgot-password';

function AppContent() {
  const [authView, setAuthView] = useState<AuthView>('login')
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(true)
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    switch (authView) {
      case 'signup':
        return <SignupForm onSwitchToLogin={() => setAuthView('login')} />
      
      case 'forgot-password':
        return <ForgotPassword onBackToLogin={() => setAuthView('login')} />
      
      case 'login':
      default:
        return (
          <LoginForm 
            onSwitchToSignup={() => setAuthView('signup')}
            onSwitchToForgotPassword={() => setAuthView('forgot-password')}
          />
        )
    }
  }

  // For admins, show toggle between admin and regular dashboard
  if (isAdmin) {
    return showAdminDashboard ? (
      <AdminDashboard onSwitchToUserDashboard={() => setShowAdminDashboard(false)} />
    ) : (
      <Dashboard onSwitchToAdminDashboard={() => setShowAdminDashboard(true)} />
    )
  }

  // Regular users only see regular dashboard
  return <Dashboard />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App