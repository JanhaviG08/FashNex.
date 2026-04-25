import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, Leaf, Users, Star,
  Shirt, Palette, Globe,
} from 'lucide-react';
import Background from '../component/Background';
import Hero from '../component/Hero';
import Product from './Product';
import OurPolicy from '../component/OurPolicy';
import NewLetterBox from '../component/NewLetterBox';
import Footer from '../component/Footer';

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const heroData = [
  {
    text1: 'We Help You Define Modern Style',
    text2: 'We will help you curate an elegant and luxurious wardrobe designed by professional stylists.',
  },
  {
    text1: '30% OFF — Limited Time Offer',
    text2: "Style that speaks before you do. Grab your picks before they're gone.",
  },
  {
    text1: 'Explore Our Best Collection',
    text2: 'Shop Now — curated looks that are fresh, bold, and made for you.',
  },
  {
    text1: 'Exclusive Accessories Collection',
    text2: 'Designed to complement every mood and moment. Elevate your style.',
  },
  {
    text1: 'ft. our everyday oversized shirts 💫 Soft girl energy ✈ Travel fit ✨',
    text2: 'PICK YOUR VIBE — Golden hour. Brunch date. All of the above.',
  },
];

const FEATURES = [
  {
    icon: <Sparkles size={22} />,
    title: 'AI Style Recommendations',
    desc: 'Personalised outfit ideas based on your taste, body type, and occasions.',
    color: '#f9a8d4',
    bg: '#fdf2f8',
  },
  {
    icon: <Shirt size={22} />,
    title: 'Virtual Try-On',
    desc: 'See clothes on a model before you buy — powered by AI.',
    color: '#c4b5fd',
    bg: '#f5f3ff',
  },
  {
    icon: <Palette size={22} />,
    title: 'Smart Wardrobe',
    desc: 'Upload your clothes, get AI mix-and-match combos every day.',
    color: '#86efac',
    bg: '#f0fdf4',
  },
  {
    icon: <Leaf size={22} />,
    title: 'Eco Tracking',
    desc: 'Carbon footprint per garment and a personal sustainability score.',
    color: '#fed7aa',
    bg: '#fff7ed',
  },
  {
    icon: <Globe size={22} />,
    title: 'Cultural Attire',
    desc: 'Festival and regional outfit suggestions — from Navratri to Eid.',
    color: '#fbcfe8',
    bg: '#fdf2f8',
  },
  {
    icon: <Users size={22} />,
    title: 'Style Challenges',
    desc: 'Join community styling contests and win exciting prizes.',
    color: '#bfdbfe',
    bg: '#eff6ff',
  },
];

const TRENDING_CARDS = [
  {
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop',
    title: 'Y2K Revival',
    desc: 'Low-rise jeans, butterfly clips, and bold metallics are back in full swing.',
    tag: 'TikTok',
    tagClass: 'bg-pink-100 text-pink-600',
  },
  {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop',
    title: 'Quiet Luxury',
    desc: 'Minimal, neutral tones and elevated basics for every occasion.',
    tag: 'Instagram',
    tagClass: 'bg-purple-100 text-purple-600',
  },
  {
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&auto=format&fit=crop',
    title: 'Boho Monsoon',
    desc: 'Earthy block prints and flowy silhouettes perfect for the rainy season.',
    tag: 'Pinterest',
    tagClass: 'bg-rose-100 text-rose-600',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    text: 'FashNex helped me stop rewearing the same three outfits! The wardrobe AI is genius.',
    rating: 5,
    avatar: 'P',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    name: 'Ananya Reddy',
    location: 'Hyderabad',
    text: 'Virtual try-on is a game-changer — no more size regrets online shopping!',
    rating: 5,
    avatar: 'A',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    name: 'Meera Krishnan',
    location: 'Chennai',
    text: 'Love the festival recommendations — found the perfect Onam saree set through FashNex!',
    rating: 5,
    avatar: 'M',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    name: 'Shreya Patel',
    location: 'Surat',
    text: "Eco points are such a fun way to shop responsibly. I'm addicted!",
    rating: 5,
    avatar: 'S',
    gradient: 'from-amber-400 to-orange-500',
  },
];

/* ─────────────────────────────────────────────
   Animation helper
───────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.52, ease: [0.4, 0, 0.2, 1] },
});

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
function Home() {
  const [heroCount, setHeroCount] = useState(0);
  const [startAnim, setStartAnim] = useState(false);

  useEffect(() => {
    setStartAnim(true);
    const interval = setInterval(() => {
      setHeroCount(prev => (prev === 4 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes eco-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.5; }
          50%       { transform: scale(1.06); opacity: 0.85; }
        }
        .eco-ring-1 { animation: eco-pulse 3s ease-in-out 0.0s infinite; }
        .eco-ring-2 { animation: eco-pulse 3s ease-in-out 0.5s infinite; }
        .eco-ring-3 { animation: eco-pulse 3s ease-in-out 1.0s infinite; }
      `}</style>

      <div
        className="w-full min-h-screen pt-[70px] relative overflow-x-hidden"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: 'linear-gradient(135deg, #fff0f4 0%, #fff5f7 30%, #fdf2ff 65%, #fff0f4 100%)',
        }}
      >
        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-pink-200/35 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-[420px] h-[420px] bg-rose-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] bg-fuchsia-100/25 rounded-full blur-3xl" />
        </div>

        {/* ════════════════════════════════════════
            1. HERO
        ════════════════════════════════════════ */}
        <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-14 px-5 sm:px-10 md:px-14 py-8 md:py-12">
          <Hero
            heroData={heroData[heroCount]}
            heroCount={heroCount}
            setHeroCount={setHeroCount}
            startAnim={startAnim}
          />
          <Background heroCount={heroCount} startAnim={startAnim} />
        </section>

        {/* ════════════════════════════════════════
            2. FASHION INTELLIGENCE
        ════════════════════════════════════════ */}
        <section className="relative z-10 py-20 px-5 sm:px-10 md:px-14">
          <motion.div className="text-center mb-14" {...fadeUp()}>
            <p className="text-xs font-semibold tracking-widest uppercase text-pink-400 mb-3">
              Why FashNex
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Fashion Intelligence,
              <br />
              <span className="text-pink-400">Redefined</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              Everything you need to dress smarter, more sustainably, and more you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-white/80 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
                style={{ background: f.bg }}
                {...fadeUp(i * 0.07)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: f.color + '33', color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-800 text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            3. PRODUCT — Latest Collections / Best Sellers
        ════════════════════════════════════════ */}
        <div className="relative z-10">
          <Product />
        </div>

        {/* ════════════════════════════════════════
            4. TRY BEFORE YOU BUY
        ════════════════════════════════════════ */}
        <section className="relative z-10 overflow-hidden py-20 px-5 sm:px-10 md:px-14 bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500">
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <motion.div className="flex flex-col gap-6" {...fadeUp()}>
              <p className="text-sm font-semibold tracking-widest uppercase text-white/75">
                Powered by AI
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Try Before You Buy 👗
              </h2>
              <p className="text-white/85 text-lg leading-relaxed max-w-md">
                Upload your photo and see how any outfit looks on you — powered by the IDM-VTON AI
                model. No more size surprises.
              </p>
              <Link
                to="/try-on"
                className="inline-flex items-center gap-2 self-start bg-white text-rose-500 font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Sparkles size={18} />
                Launch Virtual Try-On
              </Link>
            </motion.div>

            {/* Right — overlapping floating images */}
            <motion.div
              className="hidden lg:flex relative h-80 items-end justify-center"
              {...fadeUp(0.2)}
            >
              {[
                {
                  src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop',
                  left: 20, bottom: 0, rotate: '-6deg', zIndex: 3, delay: 0,
                },
                {
                  src: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&auto=format&fit=crop',
                  left: 165, bottom: 30, rotate: '0deg', zIndex: 4, delay: 0.45,
                },
                {
                  src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop',
                  left: 300, bottom: 0, rotate: '6deg', zIndex: 3, delay: 0.9,
                },
              ].map((img, i) => (
                <motion.img
                  key={i}
                  src={img.src}
                  alt="fashion try-on"
                  className="absolute w-36 h-60 object-cover rounded-2xl border-4 border-white/60 shadow-2xl"
                  style={{
                    left: img.left,
                    bottom: img.bottom,
                    rotate: img.rotate,
                    zIndex: img.zIndex,
                  }}
                  animate={{ y: [0, -10 + i * 3, 0] }}
                  transition={{
                    duration: 2.8 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: img.delay,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            5. FASHION THAT CARES — ECO
        ════════════════════════════════════════ */}
        <section className="relative z-10 py-20 px-5 sm:px-10 md:px-14 bg-pink-50/80">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left */}
            <motion.div {...fadeUp()}>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                <Leaf size={28} />
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Fashion that Cares
                <br />
                <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                  for the Planet
                </span>
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                Every product has a carbon score. Track your wardrobe impact, earn eco points, and
                shop smarter.
              </p>

              <div className="flex gap-10 mb-10">
                {[
                  ['2.1kg', 'Avg CO₂ saved/order'],
                  ['🌿', 'Eco-friendly picks'],
                  ['50+', 'Sustainable brands'],
                ].map(([val, lbl], i) => (
                  <div key={i}>
                    <span
                      className="block text-3xl font-bold text-gray-800"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {val}
                    </span>
                    <span className="text-xs text-gray-400 mt-1 block">{lbl}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/sustainability"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold px-8 py-4 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <Leaf size={18} />
                View Eco Dashboard
              </Link>
            </motion.div>

            {/* Right — animated rings */}
            <motion.div
              className="hidden lg:flex items-center justify-center"
              {...fadeUp(0.2)}
            >
              <div className="relative w-72 h-72 flex items-center justify-center">
                <div className="eco-ring-1 absolute w-72 h-72 rounded-full border-2 border-green-300 opacity-30" />
                <div className="eco-ring-2 absolute w-52 h-52 rounded-full border-2 border-green-300 opacity-50" />
                <div className="eco-ring-3 absolute w-36 h-36 rounded-full border-2 border-green-300 opacity-70" />
                <div className="relative z-10 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-md">
                  <Leaf size={32} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            6. TRENDING
        ════════════════════════════════════════ */}
        <section className="relative z-10 py-20 px-5 sm:px-10 md:px-14 bg-white/70">
          <motion.div className="text-center mb-14" {...fadeUp()}>
            <p className="text-xs font-semibold tracking-widest uppercase text-pink-400 mb-3">
              What's Hot
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Trending{' '}
              <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                Right Now
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 max-w-6xl mx-auto">
            {TRENDING_CARDS.map((card, i) => (
              <motion.div
                key={i}
                className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                {...fadeUp(i * 0.1)}
              >
                <div className="relative overflow-hidden h-64">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span
                    className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${card.tagClass}`}
                  >
                    {card.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3
                    className="font-bold text-gray-800 text-lg mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            7. TESTIMONIALS
        ════════════════════════════════════════ */}
        <section className="relative z-10 py-20 px-5 sm:px-10 md:px-14 bg-pink-50/80">
          <motion.div className="text-center mb-14" {...fadeUp()}>
            <p className="text-xs font-semibold tracking-widest uppercase text-pink-400 mb-3">
              Community Love
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-800"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              What Our Stylists{' '}
              <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                Say
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                {...fadeUp(i * 0.08)}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            8. OUR POLICY  (existing)
            9. NEWSLETTER  (existing)
           10. FOOTER      (existing)
        ════════════════════════════════════════ */}
        <div className="relative z-10">
          <OurPolicy />
          <NewLetterBox />
          <Footer />
        </div>
      </div>
    </>
  );
}

export default Home;