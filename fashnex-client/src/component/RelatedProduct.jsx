import React, { useContext, useEffect, useState } from 'react';
import { ShopDataContext } from '../context/ShopContext';
import Card from './Card';
import { useNavigate } from 'react-router-dom';

function RelatedProduct({ gender, category, subCategory, currentProductId }) {
  const { products, currency } = useContext(ShopDataContext);
  const [related, setRelated] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (products.length > 0) {
      let copy = products.slice();
      copy = copy.filter(item => gender === item.gender);
      copy = copy.filter(item => category === item.category);
      copy = copy.filter(item => subCategory === item.subCategory);
      copy = copy.filter(item => currentProductId !== item._id);
      setRelated(copy.slice(0, 4));
    }
  }, [products, category, subCategory, currentProductId, gender]);

  if (related.length === 0) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <section className="w-full flex flex-col gap-10">

        {/* ── Section Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="w-5 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-400"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                You Might Also Like
              </span>
            </div>

            {/* Heading */}
            <h2
              className="text-3xl sm:text-4xl font-black text-gray-800 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Related{' '}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                Products
              </span>
            </h2>
          </div>

          {/* View all CTA */}
          <button
            onClick={() => navigate('/collection')}
            className="self-start sm:self-auto flex items-center gap-2 border-2 border-pink-200 text-pink-500 font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-pink-50 hover:border-pink-400 transition-all duration-200 flex-shrink-0"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            View All
            <span>→</span>
          </button>
        </div>

        {/* ── Cards Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {related.map((item, index) => (
            <RelatedCard
              key={index}
              item={item}
              currency={currency}
              onClick={() => navigate(`/productdetail/${item._id}`)}
            />
          ))}
        </div>

      </section>
    </>
  );
}

// ── RelatedCard sub-component ─────────────────────────────────────────────────
function RelatedCard({ item, currency, onClick }) {
  const [hovered, setHovered] = useState(false);
  const discountedPrice = Math.round(item.price * 1.2);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300 flex flex-col"
    >
      {/* Image container */}
      <div className="relative overflow-hidden h-52 sm:h-60 bg-pink-50/40">
        <img
          src={item.image1}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm border border-pink-100 text-pink-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
          {item.category}
        </span>

        {/* Quick view pill — appears on hover */}
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-pink-100 text-pink-500 text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-md transition-all duration-300
          ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Quick View →
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3
          className="text-gray-800 font-bold text-sm sm:text-base leading-snug line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {item.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(i => (
            <svg key={i} className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <svg className="w-3 h-3 fill-amber-300" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-gray-400 text-[10px] ml-0.5">(4.5)</span>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span
            className="font-black text-base bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {currency} {item.price}
          </span>
          <span className="text-gray-400 line-through text-xs">
            {currency} {discountedPrice}
          </span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-pink-400 to-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

export default RelatedProduct;