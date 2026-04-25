/**
 * fashnex-client/src/component/Card.jsx — UPDATED
 * ==================================================
 * Changes vs original:
 *   1. Added HeartButton overlay (top-right) — wired to real wishlist
 *   2. Card outer div is now `relative` (needed for absolute HeartButton)
 *   3. Everything else (layout, image, name, price) is unchanged
 */

import React, { useContext } from 'react'
import { ShopDataContext } from '../context/ShopContext'
import { useNavigate }     from 'react-router-dom'
import HeartButton         from './HeartButton'   // ← NEW

function Card({ name, image, id, price }) {
  const { currency } = useContext(ShopDataContext)
  const navigate = useNavigate()

  return (
    <div
      className="relative w-[300px] max-w-[90%] h-[450px] bg-[#ffffff0a] backdrop-blur-lg rounded-lg hover:scale-[102%] flex items-start justify-start flex-col p-[10px] cursor-pointer border-[1px] border-[#80808049] transition-transform duration-200"
      onClick={() => navigate(`/productdetail/${id}`)}
    >
      {/* ❤️ Wishlist heart */}
      <HeartButton productId={id} size="sm" variant="overlay" />

      <img src={image} alt={name} className="w-[100%] h-[80%] rounded-sm object-cover" />
      <div className="text-black text-[18px] py-[10px] line-clamp-2">{name}</div>
      <div className="text-[14px] text-[#ff3f6c]">{currency} {price}</div>
    </div>
  )
}

export default Card