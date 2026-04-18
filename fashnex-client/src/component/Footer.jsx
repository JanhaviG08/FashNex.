import React from 'react';
import Logo from '../assets/logo1.png';

const footerLinks = {
  Company: ["Home", "About Us", "Collections", "Delivery", "Privacy Policy"],
  Support: ["FAQ", "Track Order", "Returns", "Size Guide", "Gift Cards"],
};

const socialLinks = [
  { label: "Instagram", icon: "📸", href: "#" },
  { label: "Pinterest", icon: "📌", href: "#" },
  { label: "Twitter",   icon: "𝕏",  href: "#" },
  { label: "YouTube",   icon: "▶",  href: "#" },
];

function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <footer className="relative bg-gradient-to-br from-[#1a0a10] via-[#2a0f1a] to-[#1a0a10] overflow-hidden">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
          {/* Subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(#ff3f6c 1px, transparent 1px), linear-gradient(90deg, #ff3f6c 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        {/* ── Top divider line ── */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-14 pb-8">

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/10">

            {/* ── Brand column ── */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              {/* Logo + name */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-900/30 overflow-hidden">
                  <img src={Logo} alt="FashNex Logo" className="w-9 h-9 object-contain" />
                </div>
                <span
                  className="text-2xl font-black text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Fash<span className="text-pink-400">Nex</span>
                </span>
              </div>

              <p
                className="text-gray-400 text-sm leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Your all-in-one fashion destination — curated styles, unbeatable deals, and fast delivery backed by expert stylists.
              </p>

              {/* Social icons */}
              <div className="flex gap-2 mt-1">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    title={s.label}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-gray-400 hover:bg-pink-500/20 hover:border-pink-500/30 hover:text-pink-400 transition-all duration-200"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* ── Link columns ── */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                  <h4
                    className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {section}
                  </h4>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-400 text-sm hover:text-pink-300 hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5 group"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <span className="w-0 group-hover:w-3 h-[1px] bg-pink-400 transition-all duration-200 rounded-full" />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* ── Contact column ── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                <h4
                  className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Get in Touch
                </h4>
              </div>
              <ul className="flex flex-col gap-3">
                {[
                  { icon: "📞", text: "+91-8034627054" },
                  { icon: "📞", text: "+1-123-456-7890" },
                  { icon: "✉️", text: "contact@fashnex.com" },
                  { icon: "✉️", text: "admin@fashnex.com" },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 group cursor-pointer"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-gray-400 text-sm group-hover:text-pink-300 transition-colors duration-200">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Newsletter mini-pill */}
              <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                <p
                  className="text-white text-xs font-semibold"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Get style drops first 💌
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:from-pink-500 hover:to-rose-600 active:scale-95 transition-all">
                    →
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ── Bottom bar ── */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <p
              className="text-gray-600 text-xs text-center sm:text-left"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              © {new Date().getFullYear()}{" "}
              <span className="text-pink-500 font-semibold">FashNex</span>. All rights reserved.
            </p>

            <div className="flex items-center gap-1.5">
              {["Visa", "Mastercard", "UPI", "PayPal"].map((pay) => (
                <span
                  key={pay}
                  className="bg-white/5 border border-white/10 text-gray-500 text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {pay}
                </span>
              ))}
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}

export default Footer;
