export type Dish = {
  id: string;
  name: string;
  desc: string;
  price: number;
  category: string;
  img: string;
  spicy?: boolean;
  popular?: boolean;
  rating?: number;
  tags: string[];
};

export const CATEGORIES = [
  "All", "Korean", "Japanese", "Chinese", "Noodles", "Starters", "Desserts", "Drinks",
];

const N1 = "/dishes/noodles-1.jpg";
const N2 = "/dishes/noodles-2.jpg";
const CH = "/dishes/chicken.jpg";
const TD = "/dishes/tteokbokki.jpg";
const DUO = "/dishes/duo.jpg";
const TABLE = "/dishes/table.jpg";
const KIM = "/dishes/kimchi.jpg";
const RAMEN = "/dishes/ramen.jpg";
const SUSHI = "/dishes/sushi.jpg";
const DESSERT = "/dishes/dessert.jpg";
const TEA = "/dishes/tea.jpg";
const BBQ = "/dishes/korean-bbq.jpg";

export const DISHES: Dish[] = [
  { id: "bulgogi", name: "Bulgogi Beef", desc: "Tender marinated beef, flame-kissed with rich Korean-inspired flavors.", price: 320, category: "Korean", img: BBQ, popular: true, rating: 4.9, tags: ["Beef", "Chef's Pick", "Grill"] },
  { id: "spicy-noodles", name: "Spicy Beef Noodles", desc: "Rich noodles with tender beef and a fiery signature sauce.", price: 320, category: "Noodles", img: N1, spicy: true, popular: true, rating: 4.8, tags: ["Spicy", "Noodles", "Beef", "Popular"] },
  { id: "kimchi", name: "Kimchi Jjigae", desc: "Warm, spicy Korean stew with bold, comforting flavors.", price: 280, category: "Korean", img: KIM, spicy: true, rating: 4.7, tags: ["Spicy", "Korean Stew", "Beef"] },
  { id: "korean-chicken", name: "Korean Fried Chicken", desc: "Crispy chicken glazed with a sweet & spicy gochujang lacquer.", price: 360, category: "Korean", img: CH, spicy: true, popular: true, rating: 4.8, tags: ["Spicy", "Chicken", "Crispy"] },
  { id: "dumplings", name: "Golden Dumplings", desc: "Pan-seared dumplings with our signature dipping sauce.", price: 220, category: "Starters", img: TABLE, popular: true, rating: 4.6, tags: ["Starter", "Sharing", "Light"] },
  { id: "japchae", name: "Japchae Glass Noodles", desc: "Stir-fried sweet potato noodles, vegetables & toasted sesame.", price: 290, category: "Noodles", img: N2, rating: 4.7, tags: ["Noodles", "Sesame", "Light"] },
  { id: "tteokbokki", name: "Tteokbokki", desc: "Chewy rice cakes simmered in a fiery gochujang sauce.", price: 210, category: "Korean", img: TD, spicy: true, rating: 4.5, tags: ["Spicy", "Street Food", "Rice Cakes"] },
  { id: "ramen", name: "Gogi Signature Ramen", desc: "Deep tonkotsu broth, chashu pork, ajitama egg & nori.", price: 340, category: "Japanese", img: RAMEN, popular: true, rating: 4.9, tags: ["Noodles", "Pork", "Comfort"] },
  { id: "sushi", name: "Dragon Roll", desc: "Eel, avocado & cucumber topped with torched salmon.", price: 380, category: "Japanese", img: SUSHI, rating: 4.8, tags: ["Seafood", "Premium", "Light"] },
  { id: "mango-bingsu", name: "Mango Bingsu", desc: "Shaved milk ice, fresh mango & condensed cream.", price: 190, category: "Desserts", img: DESSERT, rating: 4.7, tags: ["Dessert", "Cold", "Light"] },
  { id: "iced-tea", name: "Peach Iced Tea", desc: "House-brewed iced tea, lightly sweet & refreshing.", price: 90, category: "Drinks", img: TEA, rating: 4.4, tags: ["Cold", "Refreshing", "Light"] },
  { id: "duo-platter", name: "Gogi Duo Platter", desc: "A tasting board of our signatures — perfect for two.", price: 520, category: "Starters", img: DUO, popular: true, rating: 4.9, tags: ["Sharing", "Premium", "Chef's Pick"] },
];

export const CRAVINGS = [
  { icon: "🔥", label: "Something Spicy", query: "I want something spicy" },
  { icon: "🍜", label: "Noodles", query: "I love noodles" },
  { icon: "🥩", label: "Beef", query: "I want beef" },
  { icon: "🍗", label: "Chicken", query: "I want chicken" },
  { icon: "🥗", label: "Something Light", query: "something light" },
  { icon: "💰", label: "Under 400 EGP", query: "under 400 EGP" },
];

export type Rec = { dish: Dish; reasons: string[]; why: string; match: number };

// Rule-based "Gogi AI" recommendation engine (demo)
export function gogiRecommend(query: string): Rec[] {
  const q = query.toLowerCase();
  const scored = DISHES.filter((d) => d.category !== "Drinks").map((d) => {
    let score = d.popular ? 2 : 0;
    const reasons: string[] = [];
    if (/spic/.test(q) && d.spicy) { score += 4; reasons.push("🌶️ Matches your spice craving"); }
    if (/noodle/.test(q) && d.tags.includes("Noodles")) { score += 4; reasons.push("🍜 A noodle dish, as you wished"); }
    if (/beef/.test(q) && d.tags.includes("Beef")) { score += 4; reasons.push("🥩 Made with tender beef"); }
    if (/chicken/.test(q) && d.tags.includes("Chicken")) { score += 4; reasons.push("🍗 Crispy chicken, your pick"); }
    if (/light/.test(q) && d.tags.includes("Light")) { score += 3; reasons.push("🥗 A lighter, balanced choice"); }
    if (/for 2|two|share/.test(q) && d.tags.includes("Sharing")) { score += 3; reasons.push("👥 Great for sharing"); }
    const m = q.match(/under\s*(\d+)/);
    const budget = m ? parseInt(m[1]) : null;
    if (budget && d.price <= budget) { score += 3; reasons.push(`💰 Fits your ${budget} EGP budget`); }
    if (d.popular) { score += 1; reasons.push("⭐ A guest favorite"); }
    if (d.rating && d.rating >= 4.8) reasons.push(`🏆 Rated ${d.rating}/5 by guests`);
    return { dish: d, score, reasons, why: "" };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  return top.map((t, i) => ({
    ...t,
    match: Math.max(62, Math.min(98, 74 + t.score * 2 - i * 4)),
    why:
      i === 0
        ? `Gogi AI picked this because it matches what you're craving right now, it's ${t.dish.price <= 350 ? "kind to your budget" : "worth the indulgence"}, and it pairs beautifully with our house sides for a complete meal.`
        : "A flavorful alternative our guests love — slightly different mood, same Gogi soul.",
  }));
}

export function surpriseDish(): Dish {
  const pool = DISHES.filter((d) => d.category !== "Drinks");
  return pool[Math.floor(Math.random() * pool.length)];
}

// Smart combo suggestion: main + starter + drink, discounted
export function smartComboFor(dish: Dish) {
  const starter =
    DISHES.find((d) => d.id === "dumplings" && d.id !== dish.id) ||
    DISHES.find((d) => d.category === "Starters" && d.id !== dish.id)!;
  const drink = DISHES.find((d) => d.category === "Drinks")!;
  const total = dish.price + starter.price + drink.price;
  const comboPrice = Math.round(total * 0.85);
  return {
    items: [dish, starter, drink],
    total,
    comboPrice,
    save: total - comboPrice,
  };
}