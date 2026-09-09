import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const CustomStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes pop {
      0% { transform: scale(1); }
      35% { transform: scale(1.35); }
      60% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes modalIn {
      0% { opacity: 0; transform: scale(0.92) translateY(12px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes modalOut {
      0% { opacity: 1; transform: scale(1) translateY(0); }
      100% { opacity: 0; transform: scale(0.94) translateY(8px); }
    }
    @keyframes backdropIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(16px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
      50% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
    }
    @keyframes blobFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(20px, -20px) scale(1.08); }
    }
    .animate-shimmer {
      background-image: linear-gradient(
        90deg,
        rgba(255,255,255,0.03) 0px,
        rgba(255,255,255,0.09) 40px,
        rgba(255,255,255,0.03) 80px
      );
      background-size: 800px 100%;
      animation: shimmer 1.6s infinite linear;
    }
    .animate-pop { animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .animate-modal-in { animation: modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-modal-out { animation: modalOut 0.2s ease-in forwards; }
    .animate-backdrop-in { animation: backdropIn 0.25s ease-out forwards; }
    .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out both; }
    .animate-pulse-glow { animation: pulseGlow 2.4s infinite; }
    .animate-blob-float { animation: blobFloat 8s ease-in-out infinite; }
    .animate-blob-float-slow { animation: blobFloat 11s ease-in-out infinite; }
  `}</style>
);

const SkeletonCard = () => (
  <div className="relative bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col">
    <div className="relative aspect-[2/3] w-full bg-slate-800/60 overflow-hidden animate-shimmer" />
    <div className="p-4 flex flex-col gap-3">
      <div className="h-4 w-4/5 rounded bg-slate-800/60 overflow-hidden animate-shimmer" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-12 rounded bg-slate-800/60 overflow-hidden animate-shimmer" />
        <div className="h-3 w-8 rounded bg-slate-800/60 overflow-hidden animate-shimmer" />
      </div>
    </div>
  </div>
);

const ModalSkeleton = () => (
  <div className="flex flex-col md:flex-row gap-6 p-6">
    <div className="w-full md:w-64 aspect-[2/3] rounded-xl bg-slate-800/60 overflow-hidden animate-shimmer shrink-0" />
    <div className="flex-1 flex flex-col gap-4">
      <div className="h-7 w-2/3 rounded bg-slate-800/60 overflow-hidden animate-shimmer" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-slate-800/60 overflow-hidden animate-shimmer"
          />
        ))}
      </div>
      <div className="h-3 w-full rounded bg-slate-800/60 overflow-hidden animate-shimmer" />
      <div className="h-3 w-full rounded bg-slate-800/60 overflow-hidden animate-shimmer" />
      <div className="h-3 w-3/4 rounded bg-slate-800/60 overflow-hidden animate-shimmer" />
      <div className="h-3 w-1/2 rounded bg-slate-800/60 overflow-hidden animate-shimmer mt-2" />
      <div className="h-11 w-40 rounded-xl bg-slate-800/60 overflow-hidden animate-shimmer mt-2" />
    </div>
  </div>
);

const PosterPlaceholder = ({ title }) => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 text-slate-500 p-4 text-center">
    <svg
      className="w-12 h-12 opacity-40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M4 6h16M4 6a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2M4 6l4-4h8l4 4M9 12l6 3-6 3v-6z"
      />
    </svg>
    <span className="text-xs font-medium leading-snug line-clamp-2">
      {title || "Poster mavjud emas"}
    </span>
  </div>
);

const Movie = () => {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("action");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);

  const [likedMovies, setLikedMovies] = useState(() => {
    const saved = localStorage.getItem("likedMovies");
    return saved ? JSON.parse(saved) : [];
  });

  const [likedDetails, setLikedDetails] = useState({});
  const [likedLoading, setLikedLoading] = useState(false);

  const [poppingId, setPoppingId] = useState(null);

  // Modal ichidagi bo'limlar: ma'lumot / aktyorlar / taassurotlar
  const [modalTab, setModalTab] = useState("info");

  // AI Kino Yordamchisi (floating chat)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      text: "Salom! 👋 Menga kino nomi, janr yoki aktyor ismini yozing — men OMDb bo'yicha qidirib, sizga mos kinolarni tavsiya qilaman.",
      recs: [],
    },
  ]);

  const debounceRef = useRef(null);

  const fetchMovies = useCallback(async (query) => {
    const searchTerm = (query ?? "").trim();
    if (!searchTerm) {
      setMovies([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `https://www.omdbapi.com/?s=${searchTerm}&apikey=876bc027`,
      );
      setMovies(res.data.Search || []);
    } catch (error) {
      console.error("Xatolik yuz berdi:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies("action");
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMovies(search);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchMovies]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchMovies(search);
  };

  const clearSearch = () => {
    setSearch("");
    setMovies([]);
  };

  const openModal = async (imdbID) => {
    setModalClosing(false);
    setModalLoading(true);
    setModalTab("info");
    setSelectedMovie({ imdbID });
    try {
      const res = await axios.get(
        `https://www.omdbapi.com/?i=${imdbID}&apikey=876bc027`,
      );
      setSelectedMovie(res.data);
    } catch (error) {
      console.error("Modal ma'lumotini olishda xatolik:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setSelectedMovie(null);
      setModalClosing(false);
    }, 200);
  };

  useEffect(() => {
    if (!selectedMovie && !aiOpen) return;
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (selectedMovie) closeModal();
      else if (aiOpen) setAiOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMovie, aiOpen]);

  const handleAiSend = async (e) => {
    e.preventDefault();
    const question = aiInput.trim();
    if (!question || aiLoading) return;

    setAiMessages((prev) => [
      ...prev,
      { role: "user", text: question, recs: [] },
    ]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await axios.get(
        `https://www.omdbapi.com/?s=${encodeURIComponent(question)}&apikey=876bc027`,
      );
      const results = (res.data.Search || [])
        .filter((m) => m.Type === "movie" || m.Type === "series")
        .slice(0, 4);

      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            results.length > 0
              ? `"${question}" bo'yicha sizga mana bularni tavsiya qilaman:`
              : `Kechirasiz, "${question}" bo'yicha hech narsa topilmadi. Boshqacha so'z bilan urinib ko'ring.`,
          recs: results,
        },
      ]);
    } catch (error) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Kechirasiz, hozircha tavsiya topa olmadim. Birozdan so'ng qayta urinib ko'ring.",
          recs: [],
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiRecClick = (imdbID) => {
    setAiOpen(false);
    openModal(imdbID);
  };

  const toggleLike = (imdbID) => {
    setPoppingId(imdbID);
    setTimeout(() => setPoppingId(null), 450);

    setLikedMovies((prev) => {
      const updated = prev.includes(imdbID)
        ? prev.filter((id) => id !== imdbID)
        : [...prev, imdbID];
      localStorage.setItem("likedMovies", JSON.stringify(updated));
      return updated;
    });
  };

  const isLiked = (imdbID) => likedMovies.includes(imdbID);

  useEffect(() => {
    if (activeTab !== "liked") return;
    const missing = likedMovies.filter((id) => !likedDetails[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    setLikedLoading(true);
    Promise.all(
      missing.map((id) =>
        axios
          .get(`https://www.omdbapi.com/?i=${id}&apikey=876bc027`)
          .then((res) => res.data)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setLikedDetails((prev) => {
        const next = { ...prev };
        results.forEach((movie) => {
          if (movie && movie.imdbID) next[movie.imdbID] = movie;
        });
        return next;
      });
      setLikedLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, likedMovies, likedDetails]);

  const displayedMovies =
    activeTab === "liked"
      ? likedMovies.map((id) => likedDetails[id]).filter(Boolean)
      : movies;

  const isDisplayLoading = activeTab === "liked" ? likedLoading : loading;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-red-500 selection:text-white">
      <CustomStyles />

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none animate-blob-float" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-blob-float-slow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 relative z-10">
        <header className="flex flex-col items-center text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>🎬 Cinema Experience</span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Kinolarni Qidirish
          </h1>

          <p className="text-slate-400 max-w-lg text-sm sm:text-base mb-8 px-2">
            Sevimli kinolaringiz, seriallaringiz va ularning ma'lumotlarini
            osongina toping.
          </p>

          <form
            onSubmit={handleSearch}
            className="w-full max-w-2xl relative group"
          >
            <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-1.5 sm:p-2 shadow-2xl transition-all duration-300 group-hover:border-slate-700 focus-within:border-red-500/50 focus-within:ring-4 focus-within:ring-red-500/10">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 ml-2 sm:ml-3 mr-2 shrink-0 group-focus-within:text-red-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kino nomini kiriting..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none pr-2"
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Tozalash"
                  className="mr-1 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-red-600/30 active:scale-95 transition-all duration-200 shrink-0 text-sm sm:text-base"
              >
                Qidirish
              </button>
            </div>
          </form>

          <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
            {[
              { id: "all", label: "Barchasi", icon: "🎞️" },
              { id: "liked", label: "Yoqtirilganlar", icon: "❤️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === "liked" && likedMovies.length > 0 && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === "liked"
                        ? "bg-white/20 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {likedMovies.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {isDisplayLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!isDisplayLoading && displayedMovies.length === 0 && (
          <div className="text-center py-16 sm:py-20 bg-slate-900/30 rounded-3xl border border-slate-800/50 px-4">
            <p className="text-4xl mb-3">
              {activeTab === "liked" ? "💔" : "🔍"}
            </p>
            <p className="text-slate-400 text-base sm:text-lg">
              {activeTab === "liked"
                ? "Hozircha yoqtirilgan kinolar yo'q."
                : "Hech qanday kino topilmadi. Boshqa nom bilan qidirib ko'ring."}
            </p>
          </div>
        )}

        {!isDisplayLoading && displayedMovies.length > 0 && (
          <div
            key={activeTab}
            className="animate-fade-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
          >
            {displayedMovies.map((item, index) => (
              <div
                key={item.imdbID}
                role="button"
                tabIndex={0}
                aria-label={`${item.Title} haqida to'liq ma'lumotni ko'rish`}
                onClick={() => openModal(item.imdbID)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openModal(item.imdbID);
                  }
                }}
                style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
                className="animate-fade-in-up group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/10 flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                  {item.Poster && item.Poster !== "N/A" ? (
                    <img
                      src={item.Poster}
                      alt={item.Title}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <PosterPlaceholder title={item.Title} />
                  )}

                  {item.Type && (
                    <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-slate-200 text-[10px] px-2.5 py-1 rounded-md font-semibold capitalize border border-white/10">
                      {item.Type}
                    </span>
                  )}

                  <span className="absolute top-3 right-11 bg-black/50 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.35)]">
                    HD
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(item.imdbID);
                    }}
                    className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:scale-110 transition-transform ${
                      poppingId === item.imdbID ? "animate-pop" : ""
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        isLiked(item.imdbID) ? "" : "grayscale opacity-80"
                      }`}
                    >
                      {isLiked(item.imdbID) ? "❤️" : "🤍"}
                    </span>
                  </button>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-xs text-white/90 line-clamp-2 leading-snug">
                        {item.Title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between gap-2">
                  <h3
                    className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-red-400 transition-colors line-clamp-1"
                    title={item.Title}
                  >
                    {item.Title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      📅 {item.Year}
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-semibold text-[11px] drop-shadow-[0_0_6px_rgba(252,211,77,0.35)]">
                      ⭐
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMovie && (
        <div
          onClick={closeModal}
          className={`fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 ${
            modalClosing
              ? "opacity-0 transition-opacity duration-200"
              : "animate-backdrop-in"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl ${
              modalClosing ? "animate-modal-out" : "animate-modal-in"
            }`}
          >
            <button
              onClick={closeModal}
              aria-label="Yopish"
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-white z-10 transition-colors"
            >
              ✕
            </button>

            {modalLoading || !selectedMovie.Title ? (
              <ModalSkeleton />
            ) : (
              <div className="flex flex-col md:flex-row gap-6 p-5 sm:p-6">
                <div className="w-full md:w-64 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-slate-800">
                  {selectedMovie.Poster && selectedMovie.Poster !== "N/A" ? (
                    <img
                      src={selectedMovie.Poster}
                      alt={selectedMovie.Title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PosterPlaceholder title={selectedMovie.Title} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 leading-snug">
                    {selectedMovie.Title}{" "}
                    <span className="text-slate-400 font-normal">
                      ({selectedMovie.Year})
                    </span>
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
                    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-400/20 bg-amber-400/5 px-2 py-3 text-center shadow-[0_0_16px_-4px_rgba(252,211,77,0.35)]">
                      <span className="text-lg">⭐</span>
                      <span className="text-xs font-semibold text-amber-300">
                        {selectedMovie.imdbRating || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500">Rating</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/40 px-2 py-3 text-center">
                      <span className="text-lg">⏱️</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {selectedMovie.Runtime || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Runtime
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/40 px-2 py-3 text-center">
                      <span className="text-lg">🎭</span>
                      <span
                        className="text-xs font-semibold text-slate-200 line-clamp-1"
                        title={selectedMovie.Genre}
                      >
                        {selectedMovie.Genre || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500">Genre</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/40 px-2 py-3 text-center">
                      <span className="text-lg">📅</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {selectedMovie.Released || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Released
                      </span>
                    </div>
                  </div>

                  {/* Treylerni YouTube'da ko'rish */}
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      `${selectedMovie.Title} ${selectedMovie.Year} trailer`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/30 transition-all active:scale-95"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    YouTube'da ko'rish
                  </a>

                  {/* Bo'lim tablari */}
                  <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-slate-800/50 border border-slate-700/60 w-fit">
                    {[
                      { id: "info", label: "Taassurot" },
                      { id: "cast", label: "Aktyorlar" },
                      { id: "ratings", label: "Baholar" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setModalTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          modalTab === tab.id
                            ? "bg-red-600 text-white shadow"
                            : "text-slate-400 hover:text-white hover:bg-slate-700/60"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Taassurot: syujet haqida qisqacha fikr */}
                  <div key={modalTab} className="animate-fade-in">
                    {modalTab === "info" && (
                      <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        {selectedMovie.Plot}
                      </p>
                    )}

                    {/* Aktyorlar va jamoa haqida ma'lumot */}
                    {modalTab === "cast" && (
                      <div className="mb-6 space-y-3">
                        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                            Rejissyor
                          </p>
                          <p className="text-sm text-slate-200">
                            {selectedMovie.Director || "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                            Aktyorlar
                          </p>
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {selectedMovie.Actors || "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                            Ssenariy muallifi
                          </p>
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {selectedMovie.Writer || "—"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tashqi manbalar baholari */}
                    {modalTab === "ratings" && (
                      <div className="mb-6 space-y-2">
                        {(selectedMovie.Ratings || []).length > 0 ? (
                          selectedMovie.Ratings.map((r, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5"
                            >
                              <span className="text-sm text-slate-300">
                                {r.Source}
                              </span>
                              <span className="text-sm font-semibold text-amber-300">
                                {r.Value}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">
                            Baholar mavjud emas.
                          </p>
                        )}
                        {selectedMovie.Awards &&
                          selectedMovie.Awards !== "N/A" && (
                            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2.5">
                              <p className="text-[11px] uppercase tracking-wide text-amber-400/80 mb-1">
                                Mukofotlar
                              </p>
                              <p className="text-sm text-slate-200">
                                {selectedMovie.Awards}
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleLike(selectedMovie.imdbID)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 ${
                      poppingId === selectedMovie.imdbID ? "animate-pop" : ""
                    } ${
                      isLiked(selectedMovie.imdbID)
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    }`}
                  >
                    <span>{isLiked(selectedMovie.imdbID) ? "❤️" : "🤍"}</span>
                    {isLiked(selectedMovie.imdbID)
                      ? "Yoqtirilgan"
                      : "Yoqtirish"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== AI KINO YORDAMCHISI (floating) ===== */}
      <button
        onClick={() => setAiOpen((v) => !v)}
        aria-label="AI kino yordamchisini ochish"
        className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-2xl shadow-2xl shadow-red-600/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
          aiOpen ? "" : "animate-pulse-glow"
        }`}
      >
        {aiOpen ? "✕" : "🤖"}
      </button>

      {aiOpen && (
        <div className="fixed bottom-24 right-5 z-40 w-[90vw] max-w-sm h-[70vh] max-h-[560px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-in">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
            <span className="text-lg">🤖</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                AI Kino Yordamchisi
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Kayfiyatingizga mos kino topaman
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-red-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700"
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.recs && msg.recs.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {msg.recs.map((rec) => (
                        <button
                          key={rec.imdbID}
                          onClick={() => handleAiRecClick(rec.imdbID)}
                          className="text-left rounded-lg overflow-hidden border border-slate-700 bg-slate-900/60 hover:border-red-500/50 transition-colors"
                        >
                          <div className="aspect-[2/3] w-full bg-slate-800">
                            {rec.Poster && rec.Poster !== "N/A" ? (
                              <img
                                src={rec.Poster}
                                alt={rec.Title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <PosterPlaceholder title={rec.Title} />
                            )}
                          </div>
                          <p className="px-1.5 py-1 text-[11px] font-medium text-slate-200 line-clamp-1">
                            {rec.Title}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleAiSend}
            className="flex items-center gap-2 p-3 border-t border-slate-800 bg-slate-900/80"
          >
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Masalan: Batman, komediya..."
              className="flex-1 bg-slate-800 text-white placeholder-slate-500 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-slate-700"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiInput.trim()}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white transition-colors"
              aria-label="Yuborish"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14M13 6l6 6-6 6"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Movie;
