// src/pages/AuthCallbackHandler.tsx

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { callUpsertUser } from '@/utils/auth/callUpsertUser'

export default function AuthCallbackHandler() {
  const { refreshSession, refreshProfile, profile, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    refreshSession()
      .then(async () => {
        if (!profile) {
          console.warn('[AuthCallbackHandler] No profile found, attempting upsert...')
          await callUpsertUser()
          await refreshProfile()
        }

        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        })

        const isNewUser =
          !profile || !profile.username || !profile.first_login_completed

        navigate(isNewUser ? '/welcome' : '/dashboard')
      })
      .catch((err) => {
        console.error('Auth callback failed:', err)

        let message = 'There was an issue signing you in. Please try again.'

        if (err) {
          if (typeof err === 'string') {
            message = err
          } else if (typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
            message = err.message
          }
        }

        toast({
          title: 'Login failed',
          description: message,
          variant: 'destructive',
        })

        navigate('/auth')
      })
  }, [refreshSession, refreshProfile, navigate, profile])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <p className="text-lg font-bold">Finalizing authentication...</p>
      {isLoading && <p className="text-sm text-muted">Please wait while we log you in.</p>}
    </div>
  )
}
