import React, { useContext, useEffect, useState } from 'react'
import Nav from '../component/Nav'
import Sidebar from '../component/Sidebar'
import { authDataContext } from '../context/AuthContext'
import axios from 'axios'
import { FiTrash2, FiPackage, FiRefreshCw } from 'react-icons/fi'

function Lists() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)
  const { serverUrl }         = useContext(authDataContext)

  const fetchList = async () => {
    setLoading(true)
    try {
      const result = await axios.get(serverUrl + '/api/product/list')
      setList(result.data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const removeList = async (id) => {
    setRemoving(id)
    try {
      const result = await axios.post(`${serverUrl}/api/product/remove/${id}`, {}, { withCredentials: true })
      if (result.data) fetchList()
    } catch (error) {
      console.log(error)
    } finally {
      setRemoving(null)
    }
  }

  useEffect(() => { fetchList() }, [])

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap'); body{font-family:'DM Sans',sans-serif;}`}</style>

      <div className="min-h-screen bg-[#120608] text-white">
        <Nav />
        <Sidebar />

        <main className="ml-16 md:ml-56 pt-16 min-h-screen">
          <div className="max-w-4xl mx-auto px-6 py-10">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">Inventory</span>
                <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  All <span className="text-pink-400 italic">Products</span>
                </h1>
                {!loading && (
                  <p className="text-gray-500 text-sm">{list.length} products listed</p>
                )}
              </div>
              <button
                onClick={fetchList}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                <FiRefreshCw size={13} className={loading ? 'animate-spin text-pink-400' : ''} />
                Refresh
              </button>
            </div>

            {/* Table header */}
            {!loading && list.length > 0 && (
              <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-white/10 mb-2">
                <p className="col-span-1 text-xs uppercase tracking-wider text-gray-600">Image</p>
                <p className="col-span-5 text-xs uppercase tracking-wider text-gray-600">Name</p>
                <p className="col-span-2 text-xs uppercase tracking-wider text-gray-600">Category</p>
                <p className="col-span-2 text-xs uppercase tracking-wider text-gray-600">Price</p>
                <p className="col-span-2 text-xs uppercase tracking-wider text-gray-600 text-right">Action</p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="flex flex-col gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <FiPackage size={28} className="text-gray-600" />
                </div>
                <p className="text-gray-400 font-semibold">No products listed yet.</p>
                <p className="text-gray-600 text-sm">Head to "Add Product" to get started.</p>
              </div>
            )}

            {/* Product rows */}
            {!loading && list.length > 0 && (
              <div className="flex flex-col gap-2">
                {list.map((item, index) => (
                  <div
                    key={index}
                    className="group grid grid-cols-12 gap-4 items-center bg-white/5 hover:bg-white/8 border border-white/10 hover:border-pink-500/20 rounded-2xl px-4 py-3 transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="col-span-1">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        <img src={item.image1} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    {/* Name */}
                    <div className="col-span-5">
                      <p className="text-white text-sm font-semibold line-clamp-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {item.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.subCategory}</p>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <p className="text-white font-black text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                        ₹ {item.price}
                      </p>
                    </div>

                    {/* Delete */}
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => removeList(item._id)}
                        disabled={removing === item._id}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-rose-500/20 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-all duration-200"
                      >
                        {removing === item._id
                          ? <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                          : <FiTrash2 size={15} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  )
}

export default Lists