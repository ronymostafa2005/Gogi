"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  CATEGORIES,
  CRAVINGS,
  DISHES,
  gogiRecommend,
  smartComboFor,
  surpriseDish,
  type Dish,
  type Rec,
} from "./data";

type CartLine = { dish: Dish; qty: number };
type Screen = "menu" | "ai" | "surprise" | "order" | "reserve";

const fmt = (n: number) => `${n.toLocaleString("en-EG")} EGP`;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Dish | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [recs, setRecs] = useState<Rec[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [surprised, setSurprised] = useState<Dish | null>(null);
  const [combo, setCombo] = useState<ReturnType<typeof smartComboFor> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reserved, setReserved] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const addToCart = useCallback(
    (dish: Dish, qty = 1) => {
      setCart((c) => {
        const found = c.find((l) => l.dish.id === dish.id);
        if (found)
          return c.map((l) => (l.dish.id === dish.id ? { ...l, qty: l.qty + qty } : l));
        return [...c, { dish, qty }];
      });
      showToast(`${dish.name} added to your order ✦`);
    },
    [showToast]
  );

  const go = useCallback((s: Screen) => {
    setScreen(s);
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const askAI = useCallback((query: string) => {
    setAiQuery(query);
    setScreen("ai");
    setAiThinking(true);
    setRecs([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      setRecs(gogiRecommend(query));
      setAiThinking(false);
    }, 1400);
  }, []);

  const doSurprise = useCallback(() => {
    setScreen("surprise");
    setSurprised(null);
    setCombo(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      const d = surpriseDish();
      setSurprised(d);
      setCombo(smartComboFor(d));
    }, 1100);
  }, []);

  const openDetail = useCallback((dish: Dish) => {
    setDetail(dish);
    setCombo(smartComboFor(dish));
  }, []);

  const cartCount = cart.reduce((a, l) => a + l.qty, 0);
  const cartTotal = cart.reduce((a, l) => a + l.qty * l.dish.price, 0);
  const filtered = category === "All" ? DISHES : DISHES.filter((d) => d.category === category);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [screen]);

  return (
    <div className="min-h-screen pb-24">
      <TopBar cartCount={cartCount} onCart={() => setCartOpen(true)} onReserve={() => go("reserve")} />
      <FloatingAI onAsk={() => go("ai")} onSurprise={doSurprise} />

      {screen === "menu" && (
        <main className="screen-enter">
          <Hero onAsk={() => go("ai")} onSurprise={doSurprise} onMenu={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })} />
          <MenuSection category={category} setCategory={setCategory} dishes={filtered} onDetail={openDetail} onAdd={addToCart} onCraving={askAI} />
          <WhyGogi onReserve={() => go("reserve")} />
        </main>
      )}

      {screen === "ai" && (
        <main className="screen-enter">
          <AIAssistantScreen key={aiQuery} query={aiQuery} thinking={aiThinking} recs={recs} onAsk={askAI} onDetail={openDetail} onAdd={addToCart} />
        </main>
      )}

      {screen === "surprise" && (
        <main className="screen-enter">
          <SurpriseScreen dish={surprised} combo={combo} onAdd={addToCart} onRetry={doSurprise} />
        </main>
      )}

      {screen === "reserve" && (
        <main className="screen-enter">
          <ReservationScreen done={reserved} onDone={() => setReserved(true)} onBack={() => go("menu")} />
        </main>
      )}

      {screen === "order" && (
        <main className="screen-enter">
          <OrderScreen
            cart={cart}
            total={cartTotal}
            onBack={() => go("menu")}
            onPlaced={() => { setCart([]); showToast("Order placed — the kitchen is on it! 🔥"); go("menu"); }}
          />
        </main>
      )}

      <BottomBar
        cartCount={cartCount}
        total={cartTotal}
        onOrder={() => go("order")}
        visible={cartCount > 0 && screen !== "order" && !cartOpen && !detail}
      />

      {detail && (
        <DishDetail dish={detail} combo={combo} onClose={() => setDetail(null)} onAdd={addToCart} />
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          total={cartTotal}
          onClose={() => setCartOpen(false)}
          onQty={(id, d) =>
            setCart((c) =>
              c.map((l) => (l.dish.id === id ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0)
            )
          }
          onCheckout={() => go("order")}
        />
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-[80] -translate-x-1/2 anim-scale-in">
          <div className="glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-cream shadow-2xl">
            <span className="text-gold">✦</span> {toast}
          </div>
        </div>
      )}
    </div>
  );
}


/* ================= Top bar ================= */
function TopBar({ cartCount, onCart, onReserve }: { cartCount: number; onCart: () => void; onReserve: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="glass mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:mt-4 md:rounded-2xl md:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-[#e5b263] to-[#c98a2e] font-serif text-lg font-semibold text-[#241a0d] shadow-lg">고</span>
          <span className="text-lg font-semibold tracking-[0.18em] text-cream">GOGI</span>
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-sand sm:block">Maadi · Cairo</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-sand md:flex">
          <a href="#menu" className="transition hover:text-gold">Menu</a>
          <button onClick={onReserve} className="transition hover:text-gold">Reserve</button>
          <span className="flex items-center gap-1.5 text-xs text-gold"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Open till 1 AM</span>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onReserve} className="btn-ghost hidden rounded-full px-4 py-2 text-xs font-medium md:block">Book a table</button>
          <button onClick={onCart} className="relative grid h-10 w-10 place-items-center rounded-full btn-ghost" aria-label="Cart">
            <span className="text-base">🛍</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ================= Hero ================= */
function Hero({ onAsk, onSurprise, onMenu }: { onAsk: () => void; onSurprise: () => void; onMenu: () => void }) {
  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden md:min-h-[100svh]">
      <Image src="/dishes/hero.jpg" alt="Gogi signature dishes" fill priority className="object-cover [object-position:50%_35%] md:[object-position:50%_50%]" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/75 to-[#0e0c0a]/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e0c0a]/80 via-transparent to-transparent" />
      <div className="absolute right-6 top-28 hidden select-none lg:block">
        <span className="vertical-kr font-serif text-sm text-gold/60">고기의 맛을 느껴보세요</span>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-14 md:pt-24">
        <div className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> Smart digital menu · AI powered
        </div>
        <h1 className="anim-fade-up d1 mt-6 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Taste Korea,<br />the <span className="text-gold-gradient font-serif italic">Gogi</span> way.
        </h1>
        <p className="anim-fade-up d2 mt-5 max-w-md text-base leading-relaxed text-sand sm:text-lg">
          An Asian dining experience in Maadi — now with a personal AI food assistant that knows exactly what you&apos;re craving.
        </p>
        <div className="anim-fade-up d3 mt-8 flex flex-wrap items-center gap-3">
          <button onClick={onAsk} className="btn-primary rounded-full px-7 py-3.5 text-sm font-semibold">✦ Ask Gogi AI what to eat</button>
          <button onClick={onSurprise} className="btn-ghost rounded-full px-7 py-3.5 text-sm font-semibold">🎲 Surprise me</button>
          <button onClick={onMenu} className="px-3 py-3.5 text-sm font-medium text-sand underline decoration-gold/40 underline-offset-8 transition hover:text-gold">Browse menu</button>
        </div>
        <div className="anim-fade-up d4 mt-7 flex flex-wrap gap-x-10 gap-y-4 text-sm text-sand md:mt-12">
          {[["4.9★", "Guest rating"], ["25+", "Signature dishes"], ["15 min", "Avg. serve time"]].map(([v, l]) => (
            <div key={l}>
              <div className="text-xl font-semibold text-cream">{v}</div>
              <div className="text-xs uppercase tracking-widest text-sand/70">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
        <div className="anim-floaty text-2xl text-sand/60">↓</div>
      </div>
    </section>
  );
}

/* ================= AI assistant + recommendations ================= */
function AIAssistantScreen({
  query, thinking, recs, onAsk, onDetail, onAdd,
}: {
  query: string;
  thinking: boolean;
  recs: Rec[];
  onAsk: (q: string) => void;
  onDetail: (d: Dish) => void;
  onAdd: (d: Dish) => void;
}) {
  const [local, setLocal] = useState(query);
  return (
    <section className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:pt-36">
      <div className="text-center anim-fade-up">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-b from-[#e5b263] to-[#c98a2e] text-2xl text-[#241a0d] shadow-2xl anim-pulse-glow">✦</div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Gogi <span className="text-gold-gradient font-serif italic">AI</span></h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-sand">Tell me what you feel like eating — I&apos;ll match it to our kitchen, your budget, and your taste.</p>
      </div>

      <form
        className="glass anim-fade-up d1 mt-8 flex items-center gap-2 rounded-2xl p-2"
        onSubmit={(e) => { e.preventDefault(); if (local.trim()) onAsk(local.trim()); }}
      >
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="e.g. I want something spicy under 400 EGP"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-cream outline-none placeholder:text-sand/50"
        />
        <button type="submit" className="btn-primary shrink-0 rounded-xl px-5 py-3 text-sm font-semibold">Ask ✦</button>
      </form>

      <div className="anim-fade-up d2 mt-4 flex flex-wrap gap-2">
        {CRAVINGS.map((c) => (
          <button key={c.label} onClick={() => onAsk(c.query)} className="glass rounded-full px-3.5 py-2 text-xs text-sand transition hover:border-gold/40 hover:text-gold">
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {thinking && (
        <div className="mt-12 flex flex-col items-center gap-4 anim-fade-in">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="text-sm text-sand anim-floaty">Gogi AI is reading the kitchen…</p>
        </div>
      )}

      {recs.length > 0 && (
        <div className="mt-12">
          <div className="anim-fade-up glass flex items-start gap-3 rounded-2xl p-4 text-sm leading-relaxed text-sand">
            <span className="mt-0.5 text-lg text-gold">✦</span>
            <p>Based on <span className="text-cream">&ldquo;{query}&rdquo;</span>, here are your matches. Top pick below is the closest fit to your craving, budget &amp; taste profile.</p>
          </div>
          {recs.map((r, i) => (
            <article key={r.dish.id} className={`card-lift glass mt-5 overflow-hidden rounded-3xl anim-fade-up d${i + 1}`}>
              <div className="relative h-56">
                <Image src={r.dish.img} alt={r.dish.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 768px" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/30 to-transparent" />
                <div className="absolute right-4 top-4">
                  <div className="glass grid h-16 w-16 place-items-center rounded-full text-center">
                    <div>
                      <div className="text-lg font-bold text-gold">{r.match}%</div>
                      <div className="text-[8px] uppercase tracking-widest text-sand">match</div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="meter h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
                    <span style={{ width: `${r.match}%` }} />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold">{r.dish.name}</h3>
                  <span className="font-semibold text-gold">{fmt(r.dish.price)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.reasons.map((rs) => (
                    <span key={rs} className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold">{rs}</span>
                  ))}
                </div>
                {i === 0 && (
                  <p className="mt-4 border-l-2 border-gold/50 pl-3 text-sm italic leading-relaxed text-sand">{r.why}</p>
                )}
                <div className="mt-5 flex gap-3">
                  <button onClick={() => onAdd(r.dish)} className="btn-primary flex-1 rounded-full py-3 text-sm font-semibold">Add to order</button>
                  <button onClick={() => onDetail(r.dish)} className="btn-ghost flex-1 rounded-full py-3 text-sm font-semibold">Why this dish?</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
/* ================= Menu section ================= */
function MenuSection({
  category, setCategory, dishes, onDetail, onAdd, onCraving,
}: {
  category: string;
  setCategory: (c: string) => void;
  dishes: Dish[];
  onDetail: (d: Dish) => void;
  onAdd: (d: Dish) => void;
  onCraving: (q: string) => void;
}) {
  return (
    <section id="menu" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="reveal">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">The Menu</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Crafted for every craving</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-sand">Tell us your mood — Gogi AI turns a craving into the perfect order.</p>
      </div>

      <div className="reveal mt-7 flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
        {CRAVINGS.map((c) => (
          <button key={c.label} onClick={() => onCraving(c.query)} className="glass group flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm text-sand transition hover:border-gold/40 hover:text-gold">
            <span className="transition-transform group-hover:scale-125">{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      <div className="reveal mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${category === c ? "btn-primary" : "btn-ghost"}`}>
            {c}
          </button>
        ))}
      </div>

      <div key={category} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((d, i) => (
          <article key={d.id} className="card-lift anim-fade-up glass group cursor-pointer overflow-hidden rounded-3xl" style={{ animationDelay: `${i * 70}ms` }} onClick={() => onDetail(d)}>
            <div className="relative h-52 overflow-hidden">
              <Image src={d.img} alt={d.name} fill className="object-cover transition duration-700 group-hover:scale-110" sizes="(max-width:640px) 100vw, 33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a]/70 via-transparent to-transparent" />
              <div className="absolute left-3 top-3 flex gap-2">
                {d.popular && <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#241a0d]">Popular</span>}
                {d.spicy && <span className="rounded-full bg-ember/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">🌶 Spicy</span>}
              </div>
              {d.rating && <span className="glass absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-gold">★ {d.rating}</span>}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold leading-snug">{d.name}</h3>
                <span className="shrink-0 font-semibold text-gold">{fmt(d.price)}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-sand">{d.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {d.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full border border-cream/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-sand/80">{t}</span>
                  ))}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onAdd(d); }} className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold transition hover:bg-gold hover:text-[#241a0d]" aria-label={`Add ${d.name}`}>
                  +
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ================= Surprise me ================= */
function SurpriseScreen({
  dish, combo, onAdd, onRetry,
}: {
  dish: Dish | null;
  combo: ReturnType<typeof smartComboFor> | null;
  onAdd: (d: Dish) => void;
  onRetry: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl px-5 pb-24 pt-28 md:pt-36">
      <div className="text-center">
        <h1 className="anim-fade-up text-3xl font-semibold tracking-tight sm:text-4xl">Feeling <span className="text-gold-gradient font-serif italic">lucky?</span></h1>
        <p className="anim-fade-up d1 mt-3 text-sm text-sand">Let the kitchen choose for you — one tap, zero decisions.</p>
      </div>

      {!dish && (
        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="anim-floaty text-7xl">🎲</div>
          <p className="text-sm text-sand anim-floaty">Rolling through our signature menu…</p>
        </div>
      )}

      {dish && (
        <article className="card-lift glass anim-scale-in mt-10 overflow-hidden rounded-3xl">
          <div className="relative h-64">
            <Image src={dish.img} alt={dish.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 672px" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/25 to-transparent" />
            <span className="glass absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold">✦ Gogi AI chose for you</span>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-semibold">{dish.name}</h2>
              <span className="font-semibold text-gold">{fmt(dish.price)}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-sand">{dish.desc}</p>

            {combo && (
              <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Smart Combo · save {fmt(combo.save)}</p>
                <ul className="mt-3 space-y-2">
                  {combo.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between text-sm">
                      <span className="text-cream">{it.name}</span>
                      <span className="text-sand">{fmt(it.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-gold/20 pt-3">
                  <span className="text-xs text-sand line-through">{fmt(combo.total)}</span>
                  <span className="text-lg font-bold text-gold">{fmt(combo.comboPrice)}</span>
                </div>
                <button onClick={() => combo.items.forEach((it) => onAdd(it))} className="btn-primary mt-4 w-full rounded-full py-3 text-sm font-semibold">
                  Add combo · save {fmt(combo.save)}
                </button>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button onClick={() => onAdd(dish)} className="btn-primary flex-1 rounded-full py-3 text-sm font-semibold">Just this dish</button>
              <button onClick={onRetry} className="btn-ghost flex-1 rounded-full py-3 text-sm font-semibold">🎲 Roll again</button>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}

/* ================= Dish detail sheet (Why this dish + combo) ================= */
function DishDetail({
  dish, combo, onClose, onAdd,
}: {
  dish: Dish;
  combo: ReturnType<typeof smartComboFor> | null;
  onClose: () => void;
  onAdd: (d: Dish) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <div className="glass anim-scale-in relative max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl">
        <div className="relative h-64">
          <Image src={dish.img} alt={dish.name} fill className="object-cover" sizes="512px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17130f] via-transparent to-black/30" />
          <button onClick={onClose} className="glass absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-cream transition hover:text-gold" aria-label="Close">✕</button>
          <div className="absolute bottom-4 left-5 flex gap-2">
            {dish.tags.map((t) => (
              <span key={t} className="glass rounded-full px-3 py-1 text-[10px] uppercase tracking-wider text-sand">{t}</span>
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-semibold">{dish.name}</h2>
            <span className="text-xl font-semibold text-gold">{fmt(dish.price)}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-sand">
            {dish.rating && <span className="text-gold">★ {dish.rating} guest rating</span>}
            <span>·</span>
            <span>{dish.category}</span>
            {dish.spicy && <><span>·</span><span className="text-ember">🌶 Spicy</span></>}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-sand">{dish.desc}</p>

          <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold"><span>✦</span> Why Gogi AI suggests this</p>
            <ul className="mt-3 space-y-2 text-sm text-sand">
              <li className="flex gap-2"><span className="text-gold">•</span> {dish.popular ? "One of our most-ordered dishes this month — guests keep coming back for it." : "A hidden gem on our menu, hand-picked by our chef."}</li>
              <li className="flex gap-2"><span className="text-gold">•</span> {dish.spicy ? "Bold gochujang heat, balanced with a touch of sweetness." : "Balanced, comforting flavors that suit any mood."}</li>
              <li className="flex gap-2"><span className="text-gold">•</span> {dish.price <= 300 ? "Great value — pairs well within a 400 EGP budget." : "A premium plate worth the moment — ideal for sharing."}</li>
              <li className="flex gap-2"><span className="text-gold">•</span> Matches typical cravings for {dish.tags.join(", ").toLowerCase()} dishes.</li>
            </ul>
          </div>

          {combo && (
            <div className="mt-4 rounded-2xl border border-cream/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sand">Smart Combo — save {fmt(combo.save)}</p>
              <div className="mt-3 flex items-center gap-3">
                {combo.items.map((it) => (
                  <div key={it.id} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <Image src={it.img} alt={it.name} fill className="object-cover" sizes="56px" />
                  </div>
                ))}
                <div className="min-w-0 text-sm">
                  <div className="text-sand line-through">{fmt(combo.total)}</div>
                  <div className="font-bold text-gold">{fmt(combo.comboPrice)}</div>
                </div>
              </div>
              <button onClick={() => { combo.items.forEach((it) => onAdd(it)); onClose(); }} className="btn-primary mt-4 w-full rounded-full py-3 text-sm font-semibold">
                Add combo to order
              </button>
            </div>
          )}

          <button onClick={() => { onAdd(dish); onClose(); }} className="btn-primary mt-5 w-full rounded-full py-4 text-sm font-bold">
            Add {dish.name} · {fmt(dish.price)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Cart drawer ================= */
function CartDrawer({
  cart, total, onClose, onQty, onCheckout,
}: {
  cart: CartLine[];
  total: number;
  onClose: () => void;
  onQty: (id: string, delta: number) => void;
  onCheckout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <aside className="glass anim-scale-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-cream/10 p-5">
          <h2 className="text-lg font-semibold">Your Order</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full btn-ghost" aria-label="Close">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <p className="mt-16 text-center text-sm text-sand">Your order is empty — let Gogi AI inspire you ✦</p>
          ) : (
            <ul className="space-y-4">
              {cart.map((l) => (
                <li key={l.dish.id} className="glass flex items-center gap-4 rounded-2xl p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={l.dish.img} alt={l.dish.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.dish.name}</div>
                    <div className="text-xs text-gold">{fmt(l.dish.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onQty(l.dish.id, -1)} className="grid h-8 w-8 place-items-center rounded-full btn-ghost text-sm">−</button>
                    <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                    <button onClick={() => onQty(l.dish.id, 1)} className="grid h-8 w-8 place-items-center rounded-full btn-ghost text-sm">+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-cream/10 p-5">
          <div className="flex items-center justify-between text-sm text-sand">
            <span>Total</span>
            <span className="text-xl font-bold text-gold">{fmt(total)}</span>
          </div>
          <button onClick={onCheckout} disabled={cart.length === 0} className="btn-primary mt-4 w-full rounded-full py-4 text-sm font-bold disabled:opacity-40">
            Review order →
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ================= Bottom order bar ================= */
function BottomBar({ cartCount, total, onOrder, visible }: { cartCount: number; total: number; onOrder: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] anim-fade-up">
      <div className="glass mx-auto mb-4 flex max-w-md items-center justify-between rounded-2xl p-3 pl-5 shadow-2xl md:max-w-lg">
        <div>
          <div className="text-xs text-sand">{cartCount} item{cartCount > 1 ? "s" : ""}</div>
          <div className="font-bold text-gold">{fmt(total)}</div>
        </div>
        <button onClick={onOrder} className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">View order →</button>
      </div>
    </div>
  );
}

/* ================= Order summary ================= */
function OrderScreen({
  cart, total, onBack, onPlaced,
}: {
  cart: CartLine[];
  total: number;
  onBack: () => void;
  onPlaced: () => void;
}) {
  const [placed, setPlaced] = useState(false);
  const service = Math.round(total * 0.12);
  const vat = Math.round(total * 0.14);
  const grand = total + service + vat;

  if (placed) {
    return (
      <section className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="anim-scale-in grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-[#e5b263] to-[#c98a2e] text-3xl text-[#241a0d] shadow-2xl anim-pulse-glow">✓</div>
        <h1 className="anim-fade-up d1 mt-6 text-3xl font-semibold">Order confirmed</h1>
        <p className="anim-fade-up d2 mt-3 text-sm leading-relaxed text-sand">The kitchen received your order. Estimated ready time: <span className="text-gold">18–25 min</span>. Shokran! 🙏</p>
        <button onClick={onBack} className="btn-ghost anim-fade-up d3 mt-8 rounded-full px-8 py-3 text-sm font-semibold">Back to menu</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-5 pb-24 pt-28 md:pt-36">
      <button onClick={onBack} className="text-sm text-sand transition hover:text-gold">← Back to menu</button>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Order summary</h1>

      {cart.length === 0 ? (
        <div className="glass mt-8 rounded-3xl p-10 text-center">
          <p className="text-sm text-sand">Your order is empty.</p>
          <button onClick={onBack} className="btn-primary mt-5 rounded-full px-6 py-3 text-sm font-semibold">Browse the menu</button>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-3">
            {cart.map((l) => (
              <li key={l.dish.id} className="glass flex items-center gap-4 rounded-2xl p-3.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <Image src={l.dish.img} alt={l.dish.name} fill className="object-cover" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{l.dish.name}</div>
                  <div className="text-xs text-sand">× {l.qty}</div>
                </div>
                <span className="text-sm font-semibold text-gold">{fmt(l.dish.price * l.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="glass mt-6 space-y-2.5 rounded-3xl p-5 text-sm">
            <div className="flex justify-between text-sand"><span>Subtotal</span><span>{fmt(total)}</span></div>
            <div className="flex justify-between text-sand"><span>Service (12%)</span><span>{fmt(service)}</span></div>
            <div className="flex justify-between text-sand"><span>VAT (14%)</span><span>{fmt(vat)}</span></div>
            <div className="flex justify-between border-t border-cream/10 pt-3 text-base font-bold"><span>Total</span><span className="text-gold">{fmt(grand)}</span></div>
          </div>

          <div className="glass mt-4 flex items-start gap-3 rounded-2xl p-4 text-xs leading-relaxed text-sand">
            <span className="text-gold">✦</span>
            <p><span className="font-medium text-cream">Gogi AI tip:</span> add a Peach Iced Tea — guests who order spicy dishes love it, and it keeps your combo savings intact.</p>
          </div>

          <button onClick={() => { setPlaced(true); onPlaced(); }} className="btn-primary mt-6 w-full rounded-full py-4 text-sm font-bold">
            Place order · {fmt(grand)}
          </button>
        </>
      )}
    </section>
  );
}

/* ================= Why Gogi ================= */
function WhyGogi({ onReserve }: { onReserve: () => void }) {
  const points = [
    { icon: "✦", title: "Gogi AI knows you", text: "Craving chips, smart matches and a surprise roll — the menu that thinks with you." },
    { icon: "🔥", title: "Live Korean kitchen", text: "Grill-to-table in minutes. Every dish fired fresh, never pre-plated." },
    { icon: "🏆", title: "Maadi's Asian favorite", text: "4.9★ from 2,300+ guests — the neighborhood's go-to for Asian nights." },
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-72 md:h-96">
        <Image src="/dishes/interior.jpg" alt="Gogi interior" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e0c0a] via-[#0e0c0a]/55 to-[#0e0c0a]" />
      </div>
      <div className="mx-auto -mt-24 max-w-6xl px-5 pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {points.map((p, i) => (
            <div key={p.title} className={`card-lift glass reveal rounded-3xl p-6 anim-fade-up d${i + 1}`}>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-lg text-gold">{p.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sand">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="reveal mt-14 overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-[#241a0d] to-[#17130f] p-8 text-center md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Hungry? Your table is <span className="text-gold-gradient font-serif italic">waiting.</span></h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-sand">Reserve in seconds — Gogi AI will have your favorites ready before you sit down.</p>
          <button onClick={onReserve} className="btn-primary mt-6 rounded-full px-8 py-3.5 text-sm font-semibold">Reserve a table</button>
        </div>
      </div>
    </section>
  );
}


/* ================= Reservation ================= */
function ReservationScreen({ done, onDone, onBack }: { done: boolean; onDone: () => void; onBack: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "19:30", guests: "2" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (done) {
    return (
      <section className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="anim-scale-in grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-[#e5b263] to-[#c98a2e] text-3xl text-[#241a0d] shadow-2xl anim-pulse-glow">✓</div>
        <h1 className="anim-fade-up d1 mt-6 text-3xl font-semibold">Table reserved</h1>
        <p className="anim-fade-up d2 mt-3 text-sm leading-relaxed text-sand">
          See you {form.date || "soon"} at {form.time}, {form.guests} guests. A confirmation SMS is on its way, {form.name.split(" ")[0] || "friend"} ✦
        </p>
        <a href="#menu" onClick={(e) => { e.preventDefault(); onBack(); }} className="btn-ghost anim-fade-up d3 mt-8 rounded-full px-8 py-3 text-sm font-semibold">Back to menu</a>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-5 pb-24 pt-28 md:pt-36">
      <div className="text-center anim-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Reserve your <span className="text-gold-gradient font-serif italic">table</span></h1>
        <p className="mt-3 text-sm text-sand">Gogi Restaurant · Maadi, Cairo · open daily 12 PM – 1 AM</p>
      </div>

      <form
        className="glass anim-fade-up d2 mt-8 space-y-4 rounded-3xl p-6"
        onSubmit={(e) => { e.preventDefault(); onDone(); }}
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Name</label>
          <input required value={form.name} onChange={set("name")} placeholder="Your name" className="w-full rounded-xl border border-cream/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Phone</label>
          <input required value={form.phone} onChange={set("phone")} placeholder="01x xxxx xxxx" className="w-full rounded-xl border border-cream/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Date</label>
            <input required type="date" value={form.date} onChange={set("date")} className="w-full rounded-xl border border-cream/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Time</label>
            <input type="time" value={form.time} onChange={set("time")} className="w-full rounded-xl border border-cream/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Guests</label>
          <div className="flex gap-2">
            {["1", "2", "3", "4", "5", "6+"].map((g) => (
              <button type="button" key={g} onClick={() => setForm((f) => ({ ...f, guests: g }))}
                className={`h-11 flex-1 rounded-xl text-sm font-medium transition ${form.guests === g ? "btn-primary" : "btn-ghost"}`}>{g}</button>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-2xl border border-gold/25 bg-gold/5 p-3.5 text-xs leading-relaxed text-sand">
          <span className="text-gold">✦</span>
          <p><span className="font-medium text-cream">Gogi AI:</span> evenings 8–10 PM are busiest — book {form.time >= "19:00" && form.time <= "22:00" ? "now to lock a window table" : "any time for a relaxed seat"}.</p>
        </div>
        <button type="submit" className="btn-primary w-full rounded-full py-4 text-sm font-bold">Confirm reservation</button>
      </form>
    </section>
  );
}

/* ================= Floating AI button ================= */
function FloatingAI({ onAsk, onSurprise }: { onAsk: () => void; onSurprise: () => void }) {
  return (
    <div className="fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-3 md:bottom-8">
      <button onClick={onSurprise} className="glass group flex items-center gap-2 rounded-full py-2.5 pl-3 pr-4 text-xs font-medium text-sand transition hover:text-gold" aria-label="Surprise me">
        <span className="text-base transition-transform group-hover:rotate-12">🎲</span> Surprise me
      </button>
      <button onClick={onAsk} className="anim-pulse-glow flex items-center gap-2 rounded-full bg-gradient-to-b from-[#e5b263] to-[#c98a2e] py-3 pl-4 pr-5 text-sm font-semibold text-[#241a0d] shadow-xl transition hover:scale-105" aria-label="Ask Gogi AI">
        <span className="text-lg">✦</span> Ask Gogi AI
      </button>
    </div>
  );
}




