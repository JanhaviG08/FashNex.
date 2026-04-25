/**
 * fashnex-client/src/context/WishlistContext.jsx
 * ================================================
 * Provides global wishlist state + the useWishlist() hook.
 *
 * What it does:
 *   1. On mount (when user is logged in), fetches just the wishlist ID array
 *      via GET /api/wishlist/ids  — fast, no product data needed yet.
 *   2. isWishlisted(productId)  — O(1) Set lookup
 *   3. toggleWishlist(productId) — POST /api/wishlist/toggle, updates local
 *      Set, fires a toast, returns { wishlisted: bool }
 *   4. fetchWishlistProducts()  — used by Wishlist.jsx page to load full data
 *
 * Usage:
 *   import { useWishlist } from '../context/WishlistContext'
 *   const { isWishlisted, toggleWishlist } = useWishlist()
 */

import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef
} from 'react'
import axios            from 'axios'
import { toast }        from 'react-toastify'
import { AuthDataContext }  from './authContext'
import { UserDataContext }  from './UserContext'

export const WishlistContext = createContext()

export function WishlistProvider({ children }) {
  const { serverUrl }      = useContext(AuthDataContext)
  const { userData }       = useContext(UserDataContext)

  // Set of product-id strings — fast membership checks
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [toggling,    setToggling]    = useState(new Set())   // in-flight requests

  // ── Load IDs whenever the user logs in / changes ──────────────────────────
  const loadIds = useCallback(async () => {
    if (!userData) { setWishlistIds(new Set()); return }
    try {
      const res = await axios.get(`${serverUrl}/api/wishlist/ids`, {
        withCredentials: true,
      })
      setWishlistIds(new Set(res.data.ids))
    } catch {
      // Not fatal — hearts just won't be pre-filled
    }
  }, [serverUrl, userData])

  useEffect(() => { loadIds() }, [loadIds])

  // ── isWishlisted ──────────────────────────────────────────────────────────
  const isWishlisted = useCallback(
    (productId) => wishlistIds.has(String(productId)),
    [wishlistIds]
  )

  // ── toggleWishlist ────────────────────────────────────────────────────────
  const toggleWishlist = useCallback(
    async (productId) => {
      if (!userData) return false
      if (toggling.has(productId)) return   // prevent double-tap

      const wasWishlisted = wishlistIds.has(String(productId))

      // Optimistic update
      setWishlistIds(prev => {
        const next = new Set(prev)
        wasWishlisted ? next.delete(String(productId)) : next.add(String(productId))
        return next
      })
      setToggling(prev => new Set(prev).add(productId))

      try {
        const res = await axios.post(
          `${serverUrl}/api/wishlist/toggle`,
          { productId },
          { withCredentials: true }
        )

        const nowWishlisted = res.data.wishlisted
        // Reconcile with server truth
        setWishlistIds(prev => {
          const next = new Set(prev)
          nowWishlisted
            ? next.add(String(productId))
            : next.delete(String(productId))
          return next
        })

        if (nowWishlisted) {
          toast.success('Added to Wishlist ❤️', { position: 'bottom-right', autoClose: 2000 })
        } else {
          toast.info('Removed from Wishlist 💔', { position: 'bottom-right', autoClose: 2000 })
        }

        return nowWishlisted
      } catch (err) {
        // Roll back optimistic update
        setWishlistIds(prev => {
          const next = new Set(prev)
          wasWishlisted ? next.add(String(productId)) : next.delete(String(productId))
          return next
        })
        toast.error('Could not update wishlist. Try again.', { position: 'bottom-right' })
        return wasWishlisted
      } finally {
        setToggling(prev => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      }
    },
    [userData, serverUrl, wishlistIds, toggling]
  )

  // ── fetchWishlistProducts (for the Wishlist page) ─────────────────────────
  const fetchWishlistProducts = useCallback(async () => {
    if (!userData) return []
    try {
      const res = await axios.get(`${serverUrl}/api/wishlist`, {
        withCredentials: true,
      })
      return res.data.products || []
    } catch {
      return []
    }
  }, [serverUrl, userData])

  const wishlistCount = wishlistIds.size

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount,
        isWishlisted,
        toggleWishlist,
        fetchWishlistProducts,
        reloadWishlist: loadIds,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

// ── useWishlist hook ──────────────────────────────────────────────────────────
export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}