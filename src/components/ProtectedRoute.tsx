import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/components/Login'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Poppins'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <>{children}</>
}

export default ProtectedRoute
