import React, { useState } from 'react';

function NewLetterBox() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const perks = [
    { emoji: '🎁', label: 'Welcome Discount' },
    { emoji: '⚡', label: 'Early Access' },
    { emoji: '🛍️', label: 'Exclusive Deals' },
    { emoji: '🚫', label: 'No Spam' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <section className="w-full relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 py-16 px-5 sm:px-8">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-rose-200/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-100/20 rounded-full blur-3xl" />
        </div>

        {/* ── Card ── */}
        <div className="relative z-10 max-w-4xl mx-auto bg-white/60 backdrop-blur-xl border border-pink-100/80 rounded-[32px] shadow-2xl shadow-pink-100/50 px-8 sm:px-14 py-14 flex flex-col items-center text-center gap-7">

          {/* Inner blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-pink-100/50 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-rose-100/40 rounded-full blur-2xl" />
          </div>

          <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center text-3xl shadow-md shadow-pink-100">
            💌
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Subscribe now and get{' '}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
                20% OFF
              </span>
            </h2>
            <p
              className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Subscribe now and enjoy exclusive savings, special deals, and early access to new collections — straight to your inbox.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap justify-center gap-2.5">
            {perks.map((p) => (
              <span
                key={p.label}
                className="flex items-center gap-1.5 bg-white/80 border border-pink-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <span>{p.emoji}</span>
                {p.label}
              </span>
            ))}
          </div>

          <div className="relative z-10 w-full max-w-xl">
            {subscribed ? (
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl px-6 py-5 flex items-center justify-center gap-3">
                <span className="text-2xl">🎉</span>
                <p
                  className="text-pink-600 font-semibold text-sm"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  You're in! Check your inbox for your 20% OFF code.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  required
                  className="flex-1 bg-white/90 border border-pink-100 rounded-2xl px-5 py-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-inner transition"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-8 py-4 rounded-2xl text-sm hover:from-pink-500 hover:to-rose-600 hover:scale-105 active:scale-100 transition-all duration-200 shadow-lg shadow-pink-200 whitespace-nowrap flex items-center gap-2 justify-center"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Subscribe ✨
                </button>
              </form>
            )}

            <p
              className="text-gray-400 text-xs mt-3 text-center"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              No spam, ever. Unsubscribe at any time. 🌸
            </p>
          </div>

        </div>
      </section>
    </>
  );
}

export default NewLetterBox;