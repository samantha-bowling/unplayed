// src/pages/AuthCallbackHandler.tsx

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/use-toast'

export default function AuthCallbackHandler() {
  const { refreshSession, profile, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    refreshSession()
      .then(() => {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        })

        // Check if this is a first-time user with no profile completed
        const isNewUser = !profile || !profile.username || !profile.first_login_completed
        navigate(isNewUser ? '/welcome' : '/dashboard')
      })
      .catch((err) => {
        console.error('Auth callback failed:', err)
        toast({
          title: 'Login failed',
          description: 'There was an issue signing you in. Please try again.',
          variant: 'destructive',
        })
        navigate('/auth')
      })
  }, [refreshSession, navigate, profile])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <p className="text-lg font-bold">Finalizing authentication...</p>
      {isLoading && <p className="text-sm text-muted">Please wait while we log you in.</p>}
    </div>
  )
}
