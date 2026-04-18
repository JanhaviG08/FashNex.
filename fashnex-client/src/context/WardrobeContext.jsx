import React, { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'
import { AuthDataContext } from './authContext'

export const WardrobeContext = createContext()

export function WardrobeProvider({ children }) {
  const { serverUrl }        = useContext(AuthDataContext)
  const [wardrobe, setWardrobe]       = useState([])
  const [outfits, setOutfits]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [error, setError]             = useState(null)

  // ── Fetch all wardrobe items ──────────────────────────────────────────────
  const fetchWardrobe = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(serverUrl + '/api/wardrobe/user', { withCredentials: true })
      setWardrobe(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wardrobe')
    } finally {
      setLoading(false)
    }
  }, [serverUrl])

  // ── Upload a new item ─────────────────────────────────────────────────────
  const uploadItem = async (formData) => {
    setUploadLoading(true)
    setError(null)
    try {
      const res = await axios.post(
        serverUrl + '/api/wardrobe/upload',
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setWardrobe(prev => [res.data.item, ...prev])
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setUploadLoading(false)
    }
  }

  // ── Delete an item ────────────────────────────────────────────────────────
  const deleteItem = async (id) => {
    try {
      await axios.delete(serverUrl + `/api/wardrobe/${id}`, { withCredentials: true })
      setWardrobe(prev => prev.filter(i => i._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed')
    }
  }

  // ── Get AI outfit recommendations ─────────────────────────────────────────
  const getRecommendations = async (season = 'all-season', occasion = 'casual') => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(
        `${serverUrl}/api/wardrobe/recommend?season=${season}&occasion=${occasion}`,
        { withCredentials: true }
      )
      setOutfits(res.data.outfits || [])
      return res.data
    } catch (err) {
      setError(err.response?.data?.message || 'Recommendation failed')
      return { outfits: [], storeSuggestions: [] }
    } finally {
      setLoading(false)
    }
  }

  return (
    <WardrobeContext.Provider value={{
      wardrobe, outfits, loading, uploadLoading, error,
      fetchWardrobe, uploadItem, deleteItem, getRecommendations
    }}>
      {children}
    </WardrobeContext.Provider>
  )
}