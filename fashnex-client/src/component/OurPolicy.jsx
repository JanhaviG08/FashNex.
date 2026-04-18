import React from 'react';
import { RiExchangeFundsLine } from "react-icons/ri";
import { TbTruckReturn } from "react-icons/tb";
import { MdOutlineSupportAgent } from "react-icons/md";

const policies = [
  {
    Icon: RiExchangeFundsLine,
    title: "Easy Exchange Policy",
    desc: "Exchange Made Easy — Quick, Simple, and Customer-Friendly. No hassle, no questions asked.",
    badge: "Instant",
    gradient: "from-pink-400 to-rose-400",
    glow: "bg-pink-200/40",
  },
  {
    Icon: TbTruckReturn,
    title: "Easy Return",
    desc: "Shop with Confidence — 7-day Easy Return Guarantee. We make it completely stress-free.",
    badge: "7 Days",
    gradient: "from-rose-400 to-fuchsia-400",
    glow: "bg-rose-200/40",
  },
  {
    Icon: MdOutlineSupportAgent,
    title: "Best Customer Support",
    desc: "Trusted 24/7 Customer Support — Your Satisfaction Is Our Only Priority. We're always here.",
    badge: "24 / 7",
    gradient: "from-fuchsia-400 to-pink-400",
    glow: "bg-fuchsia-200/30",
  },
];

function PolicyCard({ Icon, title, desc, badge, gradient, glow }) {
  return (
    <div className="group relative flex-1 min-w-[260px] max-w-[360px] bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-8 flex flex-col items-center text-center gap-5 hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300 overflow-hidden">

      {/* Hover blob */}
      <div className={`absolute -top-10 -right-10 w-36 h-36 ${glow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      {/* Icon container */}
      <div className="relative">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-pink-200/50 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={38} className="text-white" />
        </div>
        {/* Badge */}
        <span
          className={`absolute -top-2 -right-3 bg-gradient-to-r ${gradient} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {badge}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2 relative z-10">
        <h3
          className="text-gray-800 font-black text-xl leading-snug"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h3>
        <p
          className="text-gray-500 text-sm leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {desc}
        </p>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r ${gradient} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
    </div>
  );
}

function OurPolicy() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <section className="w-full relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 py-20 px-5 sm:px-8">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-fuchsia-100/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center gap-14">

          {/* ── Header ── */}
          <div className="flex flex-col items-center text-center gap-4">
            <span
              className="text-xs font-semibold uppercase tracking-[0.22em] text-pink-400 bg-pink-100 px-4 py-1.5 rounded-full"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Our Promise
            </span>

            <h2
              className="text-4xl sm:text-5xl font-black text-gray-800 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our{" "}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                Policy
              </span>
            </h2>

            <p
              className="text-gray-400 text-sm sm:text-base max-w-md leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Customer-Friendly Policies — committed to your satisfaction, safety, and peace of mind.
            </p>

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mt-1">
              <div className="h-[2px] w-14 bg-gradient-to-r from-transparent to-pink-300 rounded-full" />
              <span className="text-pink-300 text-base">✦</span>
              <div className="h-[2px] w-14 bg-gradient-to-l from-transparent to-pink-300 rounded-full" />
            </div>
          </div>

          {/* ── Cards ── */}
          <div className="flex flex-wrap justify-center gap-6 w-full">
            {policies.map((p, i) => (
              <PolicyCard key={i} {...p} />
            ))}
          </div>

          {/* ── Bottom trust strip ── */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { emoji: "🔒", text: "100% Secure Payments" },
              { emoji: "🚚", text: "Free Delivery on ₹999+" },
              { emoji: "⭐", text: "4.9★ Rated Service" },
              { emoji: "🌸", text: "50K+ Happy Customers" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-sm border border-pink-100 rounded-2xl px-4 py-3 flex items-center gap-2.5 hover:shadow-md hover:shadow-pink-100/50 transition-shadow duration-200"
              >
                <span className="text-xl">{item.emoji}</span>
                <span
                  className="text-gray-600 text-xs font-semibold leading-snug"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}

export default OurPolicy;