import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../store/auth'
import { Spinner } from './Feedback'

function FullPageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="h-6 w-6 text-ink-muted" />
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'idle' || status === 'loading') return <FullPageLoader />
  if (status !== 'authenticated') {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    )
  }
  return <>{children}</>
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { user, status } = useAuth()

  if (status === 'idle' || status === 'loading') return <FullPageLoader />
  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />
  }
  if (!user?.is_staff) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}
