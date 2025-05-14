// src/pages/AuthCallbackHandler.tsx

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AuthCallbackHandler() {
  const { refreshSession, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Attempt to finalize the session and redirect
    refreshSession()
      .then(() => {
        navigate('/dashboard')
      })
      .catch((err) => {
        console.error('Auth callback failed:', err)
        navigate('/auth')
      })
  }, [refreshSession, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <p className="text-lg font-bold">Finalizing authentication...</p>
      {isLoading && <p className="text-sm text-muted">Please wait while we log you in.</p>}
    </div>
  )
}
