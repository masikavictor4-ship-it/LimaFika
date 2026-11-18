
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useCart, type Product } from "../context/CartContext";

type DatabaseProduct = {
  id: string | number;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  price: number | string;
  category?: string | null;
  image_url?: string | null;
  image?: string | null;
  [key: string]: unknown;
};

const colors = [
  "linear-gradient(135deg,#dcfce7,#86efac)",
  "linear-gradient(135deg,#fef3c7,#fbbf24)",
  "linear-gradient(135deg,#dbeafe,#93c5fd)",
  "linear-gradient(135deg,#ffedd5,#fdba74)",
  "linear-gradient(135deg,#f3e8ff,#d8b4fe)",
  "linear-gradient(135deg,#fce7f3,#f9a8d4)",
];

function normalizeProduct(row: DatabaseProduct): Product | null {
  if (
    (typeof row.id !== "number" && typeof row.id !== "string") ||
    String(row.id).trim() === ""
  ) {
    return null;
  }

  const name = String(row.name || row.title || "").trim();
  const price = Number(row.price);

  if (
    !name ||
    row.price === null ||
    row.price === undefined ||
    String(row.price).trim() === "" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return null;
  }

  return {
    id: row.id,
    name,
    price,
    category:
      typeof row.category === "string" && row.category.trim()
        ? row.category.trim()
        : "General",
    description:
      typeof row.description === "string" ? row.description : "",
    image_url:
      typeof row.image_url === "string" && row.image_url.trim()
        ? row.image_url.trim()
        : typeof row.image === "string" && row.image.trim()
          ? row.image.trim()
          : null,
    emoji: "🛍️",
  };
}

export default function ProductsPage() {
  const { addToCart, cartCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [addedId, setAddedId] = useState<string | number | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (queryError) throw queryError;

      const normalized = ((data || []) as DatabaseProduct[])
        .map(normalizeProduct)
        .filter((product): product is Product => product !== null);

      setProducts(normalized);

      if ((data || []).length > 0 && normalized.length === 0) {
        setError(
          "Products were returned, but none had a usable name, ID, and price. Check your products table columns."
        );
      }
    } catch (err) {
      console.error("LimaFika products loading error:", err);

      setProducts([]);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load products. Check your Supabase connection and table permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();

    let active = true;

    async function loadUser() {
      const { data, error: authError } = await supabase.auth.getUser();

      if (!active) return;

      if (authError) {
        console.warn("Could not check current user:", authError.message);
        setUser(null);
        return;
      }

      setUser(data.user ? { id: data.user.id } : null);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ? { id: session.user.id } : null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProducts]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) throw logoutError;

      setUser(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("LimaFika logout error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Could not log out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(products.map((product) => product.category || "General"))
      ),
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(term) ||
        (product.description || "").toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  function handleAdd(product: Product) {
    addToCart(product);
    setAddedId(product.id);

    window.setTimeout(() => {
      setAddedId((current) =>
        current === product.id ? null : current
      );
    }, 1600);
  }

  function ProductArtwork({
    product,
    index,
  }: {
    product: Product;
    index: number;
  }) {
    return (
      <div
        className="lf-artwork"
        style={{ background: colors[index % colors.length] }}
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.nextElementSibling?.classList.add(
                "lf-fallback-visible"
              );
            }}
          />
        ) : null}
        <span
          className={`lf-fallback ${
            product.image_url ? "" : "lf-fallback-visible"
          }`}
          aria-hidden="true"
        >
          {product.emoji || "🛍️"}
        </span>
      </div>
    );
  }

  return (
    <main className="lf-products-page">
      <nav className="lf-nav">
        <Link href="/" className="lf-logo">
          Lima<span>Fika</span>
        </Link>

        <div className="lf-nav-links">
          <Link href="/">Home</Link>
          <Link href="/products" className="lf-current">Products</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/#how-it-works">How It Works</Link>
        </div>

        <div className="lf-nav-actions">
          {user ? (
            <button
              type="button"
              className="lf-login-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          ) : (
            <Link href="/login" className="lf-login-btn">Login</Link>
          )}

          <Link href="/cart" className="lf-cart-btn">
            🛒 Cart <span>{cartCount}</span>
          </Link>
        </div>
      </nav>

      <section className="lf-hero">
        <div className="lf-hero-copy">
          <span className="lf-eyebrow">🛍 WELCOME TO LIMAFIKA</span>
          <h1>Discover something <span>great today.</span></h1>
          <p>
            Shop quality products from local sellers, support your
            community, and discover something special.
          </p>
          <a href="#collection" className="lf-primary-btn">
            Explore products <span>→</span>
          </a>
          <div className="lf-benefits">
            <span>🚚 Local shopping</span>
            <span>🛍 Easy ordering</span>
            <span>🤝 Shop local</span>
          </div>
        </div>

        <div className="lf-hero-art" aria-hidden="true">
          <div className="lf-hero-circle lf-circle-one" />
          <div className="lf-hero-circle lf-circle-two" />
          <div className="lf-floating-card lf-floating-one">✦</div>
          <div className="lf-floating-card lf-floating-two">L</div>
          <div className="lf-floating-caption">YOUR NEXT FAVOURITE</div>
        </div>
      </section>

      <section className="lf-featured">
        <div className="lf-heading">
          <div>
            <span className="lf-eyebrow">HANDPICKED FOR YOU</span>
            <h2>Shop something you love</h2>
          </div>
          <span className="lf-hint">Swipe to explore →</span>
        </div>

        {loading ? (
          <div className="lf-message">Loading featured products…</div>
        ) : error ? (
          <div className="lf-error">
            <h3>Products could not be loaded</h3>
            <p>{error}</p>
            <button type="button" onClick={() => void loadProducts()}>
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="lf-message">
            No products are available yet. Add products to your Supabase
            products table and refresh this page.
          </div>
        ) : (
          <div className="lf-slider">
            {products.map((product, index) => (
              <article
                className="lf-slide"
                key={String(product.id)}
                style={{ background: colors[index % colors.length] }}
              >
                <ProductArtwork product={product} index={index} />
                <div className="lf-slide-info">
                  <span className="lf-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p className="lf-slide-description">
                    {product.description || "Discover this LimaFika favourite."}
                  </p>
                  <div className="lf-product-bottom">
                    <strong>
                      KSh {product.price.toLocaleString("en-KE")}
                    </strong>
                    <button type="button" onClick={() => handleAdd(product)}>
                      {addedId === product.id ? "✓ Added" : "+ Add"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="lf-collection" id="collection">
        <div className="lf-heading">
          <div>
            <span className="lf-eyebrow">THE MARKETPLACE</span>
            <h2>Explore our products</h2>
            <p>Find something you will love.</p>
          </div>
          <span className="lf-count">
            {loading ? "Loading…" : `${filteredProducts.length} products`}
          </span>
        </div>

        <label className="lf-search">
          <span>⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, descriptions or categories…"
          />
        </label>

        {!loading && !error && products.length > 0 && (
          <div className="lf-categories">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={selectedCategory === item ? "lf-selected" : ""}
                onClick={() => setSelectedCategory(item)}
                aria-pressed={selectedCategory === item}
              >
                {item === "All" ? "✨ All products" : item}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="lf-message">Getting your products ready…</div>
        ) : error ? (
          <div className="lf-error">
            <h3>Unable to display products</h3>
            <p>{error}</p>
            <button type="button" onClick={() => void loadProducts()}>
              Retry loading
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="lf-message">
            <h3>No products found</h3>
            <p>Try another search or category.</p>
            <button
              type="button"
              className="lf-reset-btn"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
            >
              Show all products
            </button>
          </div>
        ) : (
          <div className="lf-grid">
            {filteredProducts.map((product) => {
              const index = products.findIndex(
                (item) => String(item.id) === String(product.id)
              );

              return (
                <article
                  className="lf-card"
                  key={String(product.id)}
                >
                  <ProductArtwork product={product} index={index} />
                  <div className="lf-card-info">
                    <span className="lf-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <p>
                      {product.description || "Available from LimaFika."}
                    </p>
                    <div className="lf-product-bottom">
                      <strong>
                        KSh {product.price.toLocaleString("en-KE")}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                      >
                        {addedId === product.id ? "✓ Added" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="lf-footer">
        <Link href="/" className="lf-logo">Lima<span>Fika</span></Link>
        <p>Discover your next favourite.</p>
        <Link href="/cart">View cart ({cartCount}) →</Link>
      </footer>

      {addedId !== null && (
        <div className="lf-toast" role="status">
          ✓ Added to your cart
          <Link href="/cart">View cart →</Link>
        </div>
      )}

      <style jsx>{`
        .lf-products-page {
          min-height: 100vh;
          color: #292333;
          background: #fffdfb;
          font-family: Arial, Helvetica, sans-serif;
        }
        .lf-nav {
          display:flex;align-items:center;justify-content:space-between;
          gap:20px;padding:17px clamp(16px,5vw,75px);background:#fff;
          border-bottom:1px solid #f0e8ec;flex-wrap:wrap;
        }
        .lf-logo {font-size:25px;font-weight:900;letter-spacing:-1px;color:#292033;text-decoration:none}
        .lf-logo span {color:#ed557c}
        .lf-nav-links,.lf-nav-actions {display:flex;align-items:center;gap:20px}
        .lf-nav-links a {font-size:13px;font-weight:700;color:#5d5363;text-decoration:none}
        .lf-nav-links .lf-current {color:#e64d77}
        .lf-login-btn,.lf-cart-btn {
          border:0;border-radius:999px;padding:11px 16px;background:#f8edf1;
          color:#302536;font-weight:800;text-decoration:none;font-size:12px;cursor:pointer;
        }
        .lf-cart-btn {background:#292033;color:white}
        .lf-cart-btn span {display:inline-grid;place-items:center;margin-left:5px;
          min-width:21px;height:21px;border-radius:50%;background:#ed557c;color:white}
        .lf-hero {
          max-width:1320px;margin:26px auto 0;width:calc(100% - 36px);
          border-radius:27px;overflow:hidden;display:grid;grid-template-columns:1.1fr .9fr;
          background:linear-gradient(120deg,#fff0f3,#f1eaff 62%,#e6f8ff);
        }
        .lf-hero-copy {padding:clamp(28px,5.5vw,70px);align-self:center;z-index:1}
        .lf-eyebrow {display:block;color:#e14e76;font-size:10px;letter-spacing:2px;font-weight:900;margin-bottom:12px}
        .lf-hero h1 {font-size:clamp(35px,5vw,61px);letter-spacing:-2px;line-height:1.05;margin:0 0 18px}
        .lf-hero h1 span {color:#e6537b}
        .lf-hero-copy>p {max-width:490px;color:#6e6474;font-size:14px;line-height:1.8;margin-bottom:25px}
        .lf-primary-btn {display:inline-flex;gap:20px;padding:14px 21px;border-radius:999px;background:#292033;color:#fff;text-decoration:none;font-weight:800;font-size:13px}
        .lf-benefits {display:flex;gap:17px;flex-wrap:wrap;margin-top:27px;color:#6e6474;font-size:11px;font-weight:700}
        .lf-hero-art {position:relative;min-height:310px;overflow:hidden}
        .lf-hero-circle {position:absolute;border-radius:50%}
        .lf-circle-one {width:240px;height:240px;right:12%;top:12%;background:#ffb9cd;box-shadow:0 20px 60px #d57b9b30}
        .lf-circle-two {width:145px;height:145px;right:43%;bottom:6%;background:#aee8d4}
        .lf-floating-card {position:absolute;display:grid;place-items:center;border-radius:22px;box-shadow:0 18px 35px #47324a20;font-weight:900}
        .lf-floating-one {width:110px;height:125px;right:43%;top:22%;background:white;color:#ed557c;font-size:65px;transform:rotate(-12deg)}
        .lf-floating-two {width:112px;height:140px;right:11%;bottom:8%;background:#7965bd;color:white;font-size:72px;transform:rotate(11deg)}
        .lf-floating-caption {position:absolute;right:6%;top:8%;font-size:9px;font-weight:900;letter-spacing:2px;color:#74607d}
        .lf-featured,.lf-collection {max-width:1320px;margin:0 auto;padding:62px 18px 0}
        .lf-heading {display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:23px}
        .lf-heading h2 {font-size:clamp(25px,3vw,35px);letter-spacing:-1px;margin:0 0 7px}
        .lf-heading p {margin:0;color:#817584;font-size:13px}
        .lf-hint,.lf-count {font-size:12px;color:#817584;padding-bottom:5px}
        .lf-slider {display:grid;grid-auto-flow:column;grid-auto-columns:minmax(250px,30%);gap:18px;overflow-x:auto;padding:3px 2px 18px;scroll-snap-type:x mandatory}
        .lf-slide {border-radius:22px;overflow:hidden;scroll-snap-align:start}
        .lf-artwork {position:relative;height:190px;display:grid;place-items:center;padding:20px;overflow:hidden}
        .lf-artwork img {max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;mix-blend-mode:multiply}
        .lf-fallback {display:none;font-size:70px;filter:drop-shadow(0 12px 10px #0001)}
        .lf-fallback-visible {display:block}
        .lf-slide-info,.lf-card-info {padding:17px;background:#ffffffd9}
        .lf-category {font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#8d6681}
        .lf-slide-info h3,.lf-card-info h3 {font-size:17px;margin:8px 0;overflow-wrap:anywhere}
        .lf-slide-description {font-size:12px;line-height:1.5;color:#817584;min-height:18px}
        .lf-product-bottom {display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px}
        .lf-product-bottom strong {font-size:15px;white-space:nowrap}
        .lf-product-bottom button,.lf-error button,.lf-reset-btn {
          border:0;border-radius:999px;background:#292033;color:white;padding:11px 15px;
          font-size:12px;font-weight:800;cursor:pointer;min-height:40px
        }
        .lf-collection {padding-bottom:65px}
        .lf-search {display:flex;align-items:center;gap:12px;max-width:560px;margin:0 0 19px;border:1px solid #e9e0e7;border-radius:13px;background:white;padding:0 15px;min-height:49px}
        .lf-search span {font-size:23px;color:#8a788e}
        .lf-search input {width:100%;border:0;outline:none;background:transparent;color:#292033;font-size:13px;min-width:0}
        .lf-categories {display:flex;gap:9px;flex-wrap:wrap;margin-bottom:25px}
        .lf-categories button {border:1px solid #e9e0e7;border-radius:999px;background:white;color:#625667;padding:10px 15px;font-size:12px;font-weight:800;cursor:pointer}
        .lf-categories button.lf-selected {background:#292033;border-color:#292033;color:white}
        .lf-grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:19px}
        .lf-card {overflow:hidden;border:1px solid #f0e8ec;border-radius:19px;background:white;transition:transform .2s,box-shadow .2s}
        .lf-card:hover {transform:translateY(-4px);box-shadow:0 14px 30px #30203312}
        .lf-card .lf-artwork {height:200px}
        .lf-card-info {background:white}
        .lf-card-info h3 {font-size:15px}
        .lf-card-info>p {font-size:12px;color:#817584;line-height:1.55;min-height:37px;overflow-wrap:anywhere}
        .lf-message,.lf-error {padding:23px;border-radius:16px;background:#f7f0f5;color:#615567;line-height:1.7;overflow-wrap:anywhere}
        .lf-error {background:#fff0f0;border:1px solid #ffd3d3}
        .lf-error h3 {margin-top:0;color:#7d2439}
        .lf-error p {white-space:pre-wrap}
        .lf-footer {border-top:1px solid #f0e8ec;padding:28px clamp(16px,5vw,75px);display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;background:white}
        .lf-footer p {font-size:12px;color:#817584}
        .lf-footer>a:last-child {font-size:12px;color:#e14e76;font-weight:800;text-decoration:none}
        .lf-toast {position:fixed;z-index:100;right:18px;bottom:18px;display:flex;gap:15px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 36px);background:#292033;color:white;border-radius:13px;padding:15px 18px;box-shadow:0 12px 35px #0002;font-size:13px;font-weight:800}
        .lf-toast a {color:#ffc3d3}
        @media(max-width:1000px) {
          .lf-grid {grid-template-columns:repeat(3,minmax(0,1fr))}
          .lf-slider {grid-auto-columns:minmax(245px,42%)}
          .lf-nav-links {gap:12px}
        }
        @media(max-width:700px) {
          .lf-nav {gap:12px}
          .lf-nav-links {order:3;width:100%;justify-content:space-between;gap:8px}
          .lf-nav-links a {font-size:11px}
          .lf-nav-actions {gap:7px}
          .lf-hero {grid-template-columns:1fr;width:calc(100% - 24px);margin-top:12px}
          .lf-hero-copy {padding:30px 22px 10px}
          .lf-hero h1 {letter-spacing:-1px}
          .lf-hero-art {min-height:215px}
          .lf-circle-one {width:165px;height:165px}
          .lf-circle-two {width:105px;height:105px}
          .lf-floating-one {width:77px;height:92px;font-size:46px}
          .lf-floating-two {width:83px;height:103px;font-size:52px}
          .lf-benefits {gap:11px}
          .lf-featured,.lf-collection {padding:43px 12px 0}
          .lf-slider {grid-auto-columns:minmax(235px,82%)}
          .lf-grid {grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
          .lf-card .lf-artwork {height:145px;padding:12px}
          .lf-card-info {padding:12px}
          .lf-card-info h3 {font-size:13px}
          .lf-card-info>p {font-size:11px}
          .lf-product-bottom {align-items:stretch;flex-direction:column}
          .lf-product-bottom button {width:100%}
          .lf-product-bottom strong {font-size:13px}
          .lf-heading {align-items:start}
          .lf-hint {display:none}
        }
      `}</style>
    </main>
  );
}
