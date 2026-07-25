/**
 * fashnex-client/src/component/ProtectedRoute.jsx
 * =================================================
 * Wraps a single route element. If the user isn't logged in, it redirects
 * to /login and remembers the page (and query string) they were trying to
 * reach in location.state.from, so Login.jsx can send them right back.
 *
 * Usage in App.jsx:
 *   <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
 */
import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'

function ProtectedRoute({ children }) {
  const { userData, loading } = useContext(UserDataContext)
  const location = useLocation()

  // Still checking the session (e.g. on page refresh) — don't redirect yet,
  // or a logged-in user would get bounced to /login for a split second.
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#fde8f0]">
        <div className="w-10 h-10 rounded-full border-4 border-pink-300 border-t-pink-500 animate-spin" />
      </div>
    )
  }

  if (!userData) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    )
  }

  return children
}

export default ProtectedRoute