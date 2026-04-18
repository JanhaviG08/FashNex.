import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthDataContext } from './authContext'
import { UserDataContext } from './UserContext'
import axios from 'axios'
import { toast } from 'react-toastify'   // ← was missing, caused crashes

export const ShopDataContext = createContext()

function ShopContext({ children }) {
  const [products, setProducts]   = useState([])
  const [search, setSearch]       = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [cartItem, setCartItem]   = useState({})
  const [loading, setLoading]     = useState(false)

  const { serverUrl } = useContext(AuthDataContext)
  const { userData }  = useContext(UserDataContext)

  const currency    = '₹'
  const delivery_fee = 40          // ← was "delivery_fee" in CartTotal (fixed below too)

  // ── Products ──────────────────────────────────────────────────────────────
  const getProducts = async () => {
    try {
      const result = await axios.get(serverUrl + '/api/product/list')
      setProducts(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  // ── Add to cart ───────────────────────────────────────────────────────────
  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error('Please select a size first')
      return
    }
    const cartData = structuredClone(cartItem)
    if (cartData[itemId]) {
      cartData[itemId][size] = (cartData[itemId][size] || 0) + 1
    } else {
      cartData[itemId] = { [size]: 1 }
    }
    setCartItem(cartData)

    if (userData) {
      try {
        await axios.post(serverUrl + '/api/cart/add', { itemId, size }, { withCredentials: true })
      } catch (error) {
        console.log(error)
        toast.error(error.message)
      }
    }
  }

  // ── Update quantity ───────────────────────────────────────────────────────
  const updateQuantity = async (itemId, size, quantity) => {
    const cartData = structuredClone(cartItem)
    if (!cartData[itemId]) return
    cartData[itemId][size] = quantity
    // Remove key entirely if quantity is 0
    if (quantity === 0) delete cartData[itemId][size]
    setCartItem(cartData)

    if (userData) {
      try {
        await axios.post(
          serverUrl + '/api/cart/update',
          { itemId, size, quantity },
          { withCredentials: true }
        )
      } catch (error) {
        console.log(error)
        toast.error(error.message)
      }
    }
  }

  // ── Get user cart ─────────────────────────────────────────────────────────
  const getUserCart = async () => {
    if (!userData) return          // ← don't call if not logged in (was crashing)
    try {
      const result = await axios.post(
        serverUrl + '/api/cart/get',
        {},
        { withCredentials: true }
      )
      if (result.data) setCartItem(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  // ── Cart count ────────────────────────────────────────────────────────────
  const getCartCount = () => {
    let total = 0
    for (const itemId in cartItem) {
      for (const size in cartItem[itemId]) {
        if (cartItem[itemId][size] > 0) total += cartItem[itemId][size]
      }
    }
    return total
  }

  // ── Cart amount ───────────────────────────────────────────────────────────
  // BUG FIX: was using undefined `size` variable inside loop + missing return
  const getCartAmount = () => {
    let total = 0
    for (const itemId in cartItem) {
      const itemInfo = products.find(p => p._id === itemId)
      if (!itemInfo) continue
      for (const size in cartItem[itemId]) {
        const qty = cartItem[itemId][size]
        if (qty > 0) total += itemInfo.price * qty
      }
    }
    return total                   // ← was missing return!
  }

  useEffect(() => { getProducts() }, [])
  useEffect(() => { getUserCart() }, [userData])   // ← depend on userData so it refetches after login

  const value = {
    products, currency, delivery_fee, getProducts,
    search, setSearch, showSearch, setShowSearch,
    cartItem, setCartItem,
    addToCart, updateQuantity,
    getCartCount, getCartAmount,
    loading, setLoading,
  }

  return (
    <ShopDataContext.Provider value={value}>
      {children}
    </ShopDataContext.Provider>
  )
}

export default ShopContext