/**
 * Add.jsx — FIXED
 * ================
 *
 * Changes:
 * 1. Added Season selector (summer / winter / rainy / all-season)
 *    so admins can tag products for the AI recommendation engine.
 *
 * 2. Season is sent with the product form data.
 *
 * 3. Auto-tags are generated in the productController (not here),
 *    but the season field here drives those tags.
 *
 * UI: one extra dropdown added inside the Classification card.
 * All other UI unchanged.
 */

import React, { useContext, useState } from 'react'
import Nav from '../component/Nav'
import Sidebar from '../component/Sidebar'
import { authDataContext } from '../context/AuthContext'
import axios from 'axios'
import { FiUploadCloud, FiCheck } from 'react-icons/fi'
import { toast } from 'react-toastify'
import Loading from '../component/Loading'

const sizeList = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size']

const subCategoryMap = {
  Clothing:    ['TopWear', 'BottomWear', 'Dresses', 'WinterWear'],
  Footwear:    ['Shoes', 'Heels', 'Flats'],
  Accessories: ['Watches', 'Bags', 'Jewelry'],
}

// NEW — season options shown to the admin
const SEASONS = [
  { value: 'all-season', label: 'All Season' },
  { value: 'summer',     label: 'Summer'     },
  { value: 'winter',     label: 'Winter'     },
  { value: 'rainy',      label: 'Rainy'      },
]

function ImageUpload({ id, image, setter, required }) {
  return (
    <label htmlFor={id}
      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 cursor-pointer hover:border-pink-500/60 transition-all duration-200 flex items-center justify-center group bg-white/5"
    >
      {image ? (
        <img src={URL.createObjectURL(image)} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-pink-400 transition-colors">
          <FiUploadCloud size={20} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Upload</span>
        </div>
      )}
      {image && (
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <FiUploadCloud size={18} className="text-white" />
        </div>
      )}
      <input type="file" id={id} hidden onChange={e => setter(e.target.files[0])} required={required} />
    </label>
  )
}

function FormLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 mb-2"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </p>
  )
}

function FormInput({ ...props }) {
  return (
    <input
      {...props}
      className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/40 transition-all"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    />
  )
}

function FormSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-11 w-full bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all cursor-pointer"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {children}
    </select>
  )
}

function Add() {
  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)
  const [name, setName]             = useState("")
  const [description, setDescription] = useState("")
  const [gender, setGender]         = useState("Men")
  const [category, setCategory]     = useState("Clothing")
  const [subCategory, setSubCategory] = useState("TopWear")
  const [price, setPrice]           = useState("")
  const [bestseller, setBestseller] = useState(false)
  const [sizes, setSizes]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)

  // NEW — season field
  const [season, setSeason] = useState("all-season")

  const { serverUrl } = useContext(authDataContext)

  const toggleSize = (s) =>
    setSizes(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("gender", gender)
      formData.append("category", category)
      formData.append("subCategory", subCategory)
      formData.append("bestseller", bestseller)
      formData.append("sizes", JSON.stringify(sizes))
      formData.append("season", season)          // NEW — send season to backend

      if (image1) formData.append("image1", image1)
      if (image2) formData.append("image2", image2)
      if (image3) formData.append("image3", image3)
      if (image4) formData.append("image4", image4)

      const result = await axios.post(serverUrl + "/api/product/addproduct", formData, { withCredentials: true })
      toast.success("Product added successfully")

      if (result.data) {
        setSuccess(true)
        setName(""); setDescription(""); setPrice("")
        setImage1(null); setImage2(null); setImage3(null); setImage4(null)
        setBestseller(false); setSizes([])
        setGender("Men"); setCategory("Clothing"); setSubCategory("TopWear")
        setSeason("all-season")   // NEW — reset season
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.log(error)
      toast.error("Add Product Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap'); body{font-family:'DM Sans',sans-serif;}`}</style>

      <div className="min-h-screen bg-[#120608] text-white">
        <Nav />
        <Sidebar />

        <main className="ml-16 md:ml-56 pt-16 min-h-screen">
          <div className="max-w-3xl mx-auto px-6 py-10">

            <div className="flex flex-col gap-1 mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">Products</span>
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Add New <span className="text-pink-400 italic">Product</span>
              </h1>
            </div>

            {success && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-3.5 mb-6">
                <FiCheck size={16} className="text-green-400" />
                <p className="text-green-400 text-sm font-semibold">Product added successfully!</p>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="flex flex-col gap-8">

              {/* Image upload */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <FormLabel>Product Images</FormLabel>
                <div className="flex gap-4 flex-wrap mt-2">
                  <ImageUpload id="image1" image={image1} setter={setImage1} required />
                  <ImageUpload id="image2" image={image2} setter={setImage2} />
                  <ImageUpload id="image3" image={image3} setter={setImage3} />
                  <ImageUpload id="image4" image={image4} setter={setImage4} />
                </div>
                <p className="text-gray-600 text-xs mt-3">First image required. Min 800×800px recommended.</p>
              </div>

              {/* Name + Description */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
                <div>
                  <FormLabel>Product Name</FormLabel>
                  <FormInput type="text" placeholder="e.g. Women's Blue Striped Shirt" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <FormLabel>Description</FormLabel>
                  <textarea
                    placeholder="Describe the product..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all resize-none"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
              </div>

              {/* Classification — now includes Season */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <FormLabel>Classification</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-gray-500 text-xs mb-1.5">Gender</p>
                    <FormSelect value={gender} onChange={e => setGender(e.target.value)}>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                    </FormSelect>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1.5">Category</p>
                    <FormSelect value={category} onChange={e => {
                      setCategory(e.target.value)
                      setSubCategory(subCategoryMap[e.target.value][0])
                    }}>
                      <option value="Clothing">Clothing</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Accessories">Accessories</option>
                    </FormSelect>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1.5">Sub-Category</p>
                    <FormSelect value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                      {(subCategoryMap[category] || []).map(sc => (
                        <option key={sc} value={sc}>{sc}</option>
                      ))}
                    </FormSelect>
                  </div>
                  {/* NEW — Season selector */}
                  <div>
                    <p className="text-gray-500 text-xs mb-1.5">Season</p>
                    <FormSelect value={season} onChange={e => setSeason(e.target.value)}>
                      {SEASONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </FormSelect>
                  </div>
                </div>
                <p className="text-gray-600 text-[11px] mt-3">
                  💡 Season helps the AI recommend this product for the right weather.
                </p>
              </div>

              {/* Price + Sizes */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
                <div>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormInput type="number" placeholder="e.g. 1499" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <div>
                  <FormLabel>Available Sizes</FormLabel>
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    {sizeList.map(s => (
                      <button
                        key={s} type="button" onClick={() => toggleSize(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200
                          ${sizes.includes(s)
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-transparent text-white shadow-md shadow-pink-900/40 scale-105'
                            : 'border-white/10 text-gray-400 hover:border-pink-500/40 hover:text-white bg-white/5'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bestseller */}
              <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-3xl px-6 py-4 hover:border-pink-500/30 transition-all">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
                  ${bestseller ? 'bg-gradient-to-br from-pink-500 to-rose-500 border-transparent' : 'border-white/20'}`}>
                  {bestseller && <FiCheck size={12} className="text-white" />}
                </div>
                <input type="checkbox" hidden onChange={() => setBestseller(p => !p)} />
                <div>
                  <p className="text-white text-sm font-semibold">Mark as Bestseller</p>
                  <p className="text-gray-500 text-xs">Displays a ⭐ badge on the product card</p>
                </div>
              </label>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200
                  ${loading
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xl shadow-pink-900/30 hover:from-pink-400 hover:to-rose-400 hover:scale-[1.02] active:scale-100'
                  }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {loading ? <Loading /> : '+ Add Product'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  )
}

export default Add