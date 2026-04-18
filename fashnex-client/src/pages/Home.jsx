import React, { useState, useEffect } from 'react'
import Background from '../component/Background'
import Hero from '../component/Hero'
import Product from './Product'
import OurPolicy from '../component/OurPolicy'
import NewLetterBox from '../component/NewLetterBox'
import Footer from '../component/Footer'

const heroData = [
  {
    text1: "We Help You Define Modern Style",
    text2: "We will help you curate an elegant and luxurious wardrobe designed by professional stylists.",
  },
  {
    text1: "30% OFF — Limited Time Offer",
    text2: "Style that speaks before you do. Grab your picks before they're gone.",
  },
  {
    text1: "Explore Our Best Collection",
    text2: "Shop Now — curated looks that are fresh, bold, and made for you.",
  },
  {
    text1: "Exclusive Accessories Collection",
    text2: "Designed to complement every mood and moment. Elevate your style.",
  },
  {
    text1: "ft. our everyday oversized shirts 💫 Soft girl energy ✈ Travel fit ✨",
    text2: "PICK YOUR VIBE — Golden hour. Brunch date. All of the above.",
  },
];

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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div
        className="w-full min-h-screen pt-[70px] relative overflow-x-hidden"
        style={{
          background: "linear-gradient(135deg, #fff0f4 0%, #fff5f7 30%, #fdf2ff 65%, #fff0f4 100%)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Global ambient blobs (fixed so they don't shift on scroll) ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-pink-200/35 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-[420px] h-[420px] bg-rose-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] bg-fuchsia-100/25 rounded-full blur-3xl" />
        </div>

        {/* ── Hero section ── */}
        <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-14 px-5 sm:px-10 md:px-14 py-8 md:py-12">
          <Hero
            heroData={heroData[heroCount]}
            heroCount={heroCount}
            setHeroCount={setHeroCount}
            startAnim={startAnim}
          />
          <Background heroCount={heroCount} startAnim={startAnim} />
        </section>

        {/* ── Remaining page sections ── */}
        <div className="relative z-10">
          <Product />
          <OurPolicy />
          <NewLetterBox />
          <Footer />
        </div>
      </div>
    </>
  );
}

export default Home;
