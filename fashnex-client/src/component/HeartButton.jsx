/**
 * fashnex-client/src/component/HeartButton.jsx
 * ===============================================
 * Reusable heart toggle button.
 * Reads/writes global wishlist state via useWishlist().
 *
 * Props:
 *   productId  string | ObjectId   — required
 *   size       'sm' | 'md' | 'lg'  — default 'md'
 *   className  string              — extra Tailwind classes (optional)
 *   variant    'overlay' | 'inline'
 *              'overlay' → absolute-positioned, white glass pill (for product cards)
 *              'inline'  → plain icon button that sits in a flex row
 *
 * Usage on a card:
 *   <HeartButton productId={product._id} variant="overlay" />
 *
 * Usage on detail page:
 *   <HeartButton productId={productData._id} size="lg" variant="inline" />
 */

import React, { useContext } from 'react'
import { useNavigate }        from 'react-router-dom'
import { UserDataContext }    from '../context/UserContext'
import { useWishlist }        from '../context/WishlistContext'

const SIZES = {
  sm: { icon: 14, btn: 'w-7  h-7'  },
  md: { icon: 16, btn: 'w-9  h-9'  },
  lg: { icon: 20, btn: 'w-11 h-11' },
}

function HeartButton({ productId, size = 'md', className = '', variant = 'overlay' }) {
  const { userData }                 = useContext(UserDataContext)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const navigate                     = useNavigate()

  const saved = isWishlisted(productId)
  const { icon: iconSize, btn: btnSize } = SIZES[size] || SIZES.md

  const handleClick = async (e) => {
    e.stopPropagation()   // don't navigate to product detail when clicking heart on card

    if (!userData) {
      navigate('/login')
      return
    }
    await toggleWishlist(productId)
  }

  const handleToggle = async (productId) => {
       const updated = await fetchWishlistProducts()
       setItems(updated)
  }

  if (variant === 'overlay') {
    return (
      <button
        onClick={handleClick}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        title={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`
          absolute top-3 right-3 z-10
          ${btnSize}
          rounded-full backdrop-blur-md border
          flex items-center justify-center
          shadow-md
          transition-all duration-200
          ${saved
            ? 'bg-pink-500 border-pink-400 text-white scale-110'
            : 'bg-white/70 border-white/60 text-gray-500 hover:text-pink-400 hover:bg-pink-50/80 hover:scale-110'
          }
          ${className}
        `}
      >
        {/* Inline SVG heart — filled when saved */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-200"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    )
  }

  // variant === 'inline'
  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      title={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`
        ${btnSize}
        rounded-full backdrop-blur-md border
        flex items-center justify-center
        shadow-md
        transition-all duration-200
        ${saved
          ? 'bg-pink-500 border-pink-400 text-white'
          : 'bg-white/70 border-white/60 text-gray-500 hover:text-pink-400'
        }
        ${className}
      `}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

export default HeartButton