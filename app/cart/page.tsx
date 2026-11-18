
"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

const money = (amount: number) =>
  `KSh ${Number(amount || 0).toLocaleString("en-KE")}`;

export default function CartPage() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
    cartCount,
  } = useCart();

  return (
    <main className="lf-cart-page">
      <nav className="lf-cart-nav">
        <Link href="/" className="lf-cart-logo">
          Lima<span>Fika</span>
        </Link>

        <div className="lf-cart-nav-links">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/cart" aria-current="page">My Cart ({cartCount})</Link>
        </div>

        <Link href="/products" className="lf-continue">
          ← Continue Shopping
        </Link>
      </nav>

      <section className="lf-cart-main">
        <div className="lf-cart-heading">
          <span className="lf-cart-eyebrow">LIMAFIKA MARKETPLACE</span>
          <h1>Your Shopping Cart</h1>
          <p>Review your selections before completing your order.</p>
        </div>

        {cart.length === 0 ? (
          <div className="lf-empty-cart">
            <div className="lf-empty-icon">🛍️</div>
            <h2>Your cart is waiting for you</h2>
            <p>You haven't added any products yet.</p>
            <Link href="/products" className="lf-checkout-button">
              Explore Products →
            </Link>
          </div>
        ) : (
          <div className="lf-cart-layout">
            <div className="lf-cart-items">
              <div className="lf-items-title">
                <h2>Your Items</h2>
                <span>{cartCount} item(s)</span>
              </div>

              {cart.map((item, index) => (
                <article
                  className="lf-cart-item"
                  key={String(item.id)}
                >
                  <div
                    className="lf-cart-image"
                    style={{
                      background: [
                        "linear-gradient(135deg,#dcfce7,#86efac)",
                        "linear-gradient(135deg,#fef3c7,#fbbf24)",
                        "linear-gradient(135deg,#dbeafe,#93c5fd)",
                        "linear-gradient(135deg,#fce7f3,#f9a8d4)",
                        "linear-gradient(135deg,#f3e8ff,#d8b4fe)",
                      ][index % 5],
                    }}
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span>{item.emoji || "🛍️"}</span>
                    )}
                  </div>

                  <div className="lf-cart-item-info">
                    <span className="lf-cart-category">
                      {item.category || "General"}
                    </span>
                    <h3>{item.name}</h3>
                    <strong>{money(item.price)}</strong>
                    <button
                      type="button"
                      className="lf-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove item
                    </button>
                  </div>

                  <div className="lf-cart-quantity">
                    <span>Quantity</span>
                    <div className="lf-quantity-controls">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => decreaseQuantity(item.id)}
                      >
                        −
                      </button>
                      <strong>{item.quantity}</strong>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => increaseQuantity(item.id)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="lf-cart-line-total">
                    <span>Item total</span>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                </article>
              ))}

              <Link href="/products" className="lf-back-products">
                ← Add more products
              </Link>
            </div>

            <aside className="lf-summary">
              <h2>Order Summary</h2>

              <div className="lf-summary-row">
                <span>Items</span>
                <strong>{cartCount}</strong>
              </div>

              <div className="lf-summary-row">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="lf-summary-row">
                <span>Delivery</span>
                <span className="lf-delivery-note">
                  Calculated at checkout
                </span>
              </div>

              <div className="lf-summary-divider" />

              <div className="lf-summary-total">
                <span>Subtotal due</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <p className="lf-summary-note">
                Your delivery details and available payment options
                are provided at checkout.
              </p>

              <Link href="/checkout" className="lf-checkout-button">
                Proceed to Checkout →
              </Link>

              <div className="lf-secure-note">
                <span>🔒</span>
                <span>Review your order before placing it.</span>
              </div>
            </aside>
          </div>
        )}
      </section>

      <footer className="lf-cart-footer">
        <Link href="/" className="lf-cart-logo">
          Lima<span>Fika</span>
        </Link>
        <p>Thank you for shopping with LimaFika.</p>
      </footer>

      <style jsx>{`
        .lf-cart-page {
          min-height:100vh;background:#fffdfb;color:#292333;
          font-family:Arial,Helvetica,sans-serif;
        }
        .lf-cart-nav {
          min-height:72px;display:flex;align-items:center;justify-content:space-between;
          gap:18px;padding:15px clamp(16px,5vw,75px);background:white;
          border-bottom:1px solid #f0e8ec;flex-wrap:wrap;
        }
        .lf-cart-logo {font-size:25px;font-weight:900;letter-spacing:-1px;color:#292033;text-decoration:none}
        .lf-cart-logo span {color:#ed557c}
        .lf-cart-nav-links {display:flex;gap:22px;align-items:center;flex-wrap:wrap}
        .lf-cart-nav-links a {color:#625667;text-decoration:none;font-size:13px;font-weight:700}
        .lf-cart-nav-links a[aria-current="page"] {color:#e14e76}
        .lf-continue {background:#f8edf1;color:#443447;border-radius:999px;padding:12px 16px;font-size:12px;font-weight:800;text-decoration:none}
        .lf-cart-main {max-width:1250px;width:calc(100% - 36px);margin:0 auto;padding:48px 0 70px}
        .lf-cart-heading {margin-bottom:32px}
        .lf-cart-eyebrow {font-size:10px;font-weight:900;letter-spacing:2px;color:#e14e76}
        .lf-cart-heading h1 {font-size:clamp(32px,4vw,45px);letter-spacing:-1.5px;margin:10px 0}
        .lf-cart-heading p {color:#817584;font-size:14px;line-height:1.7}
        .lf-cart-layout {display:grid;grid-template-columns:minmax(0,1fr) 330px;align-items:start;gap:25px}
        .lf-cart-items,.lf-summary {background:white;border:1px solid #f0e8ec;border-radius:20px;padding:23px}
        .lf-items-title {display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:13px}
        .lf-items-title h2,.lf-summary h2 {font-size:20px;margin:0}
        .lf-items-title span {font-size:12px;color:#817584}
        .lf-cart-item {display:grid;grid-template-columns:95px minmax(0,1fr) auto auto;align-items:center;gap:17px;padding:19px 0;border-bottom:1px solid #f0e8ec}
        .lf-cart-image {height:95px;width:95px;display:grid;place-items:center;border-radius:14px;overflow:hidden}
        .lf-cart-image img {width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply}
        .lf-cart-image span {font-size:38px}
        .lf-cart-item-info {min-width:0}
        .lf-cart-category {font-size:10px;color:#97718c;text-transform:uppercase;letter-spacing:1px;font-weight:800}
        .lf-cart-item-info h3 {font-size:15px;overflow-wrap:anywhere;margin:7px 0}
        .lf-cart-item-info>strong {font-size:13px}
        .lf-remove {display:block;margin-top:9px;border:0;background:transparent;padding:0;color:#d44769;text-decoration:underline;cursor:pointer;font-size:11px;font-weight:700}
        .lf-cart-quantity>span,.lf-cart-line-total>span {display:block;font-size:10px;color:#817584;margin-bottom:8px}
        .lf-quantity-controls {display:flex;align-items:center;gap:12px;border:1px solid #e9e0e7;border-radius:10px;padding:4px}
        .lf-quantity-controls button {height:30px;width:30px;flex-shrink:0;border:0;border-radius:7px;background:#f8edf1;color:#3d2e43;font-size:19px;font-weight:800;cursor:pointer}
        .lf-quantity-controls strong {min-width:15px;text-align:center;font-size:13px}
        .lf-cart-line-total {text-align:right}
        .lf-cart-line-total strong {font-size:13px;white-space:nowrap}
        .lf-back-products {display:inline-block;margin-top:22px;color:#d94d74;text-decoration:none;font-weight:800;font-size:12px}
        .lf-summary {position:sticky;top:20px}
        .lf-summary h2 {margin-bottom:23px}
        .lf-summary-row {display:flex;justify-content:space-between;gap:12px;margin:17px 0;color:#736778;font-size:12px}
        .lf-summary-row strong {color:#302536}
        .lf-delivery-note {text-align:right;max-width:145px;font-size:11px}
        .lf-summary-divider {height:1px;background:#eee5eb;margin:21px 0}
        .lf-summary-total {display:flex;justify-content:space-between;gap:12px;align-items:center;font-weight:800}
        .lf-summary-total strong {font-size:20px}
        .lf-summary-note {font-size:11px;line-height:1.7;color:#817584;margin:18px 0}
        .lf-checkout-button {min-height:48px;width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;padding:13px 15px;border:0;border-radius:11px;background:#292033;color:white;text-decoration:none;font-weight:800;font-size:13px;cursor:pointer}
        .lf-secure-note {display:flex;align-items:center;justify-content:center;gap:8px;margin-top:15px;color:#817584;font-size:10px}
        .lf-empty-cart {padding:65px 20px;text-align:center;background:white;border:1px solid #f0e8ec;border-radius:20px}
        .lf-empty-icon {font-size:58px;margin-bottom:15px}
        .lf-empty-cart h2 {font-size:25px;margin:0 0 10px}
        .lf-empty-cart p {font-size:13px;color:#817584;margin-bottom:25px}
        .lf-empty-cart .lf-checkout-button {display:inline-flex;width:auto;min-width:200px}
        .lf-cart-footer {display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:25px clamp(16px,5vw,75px);background:white;border-top:1px solid #f0e8ec}
        .lf-cart-footer p {color:#817584;font-size:12px}
        @media(max-width:1050px) {
          .lf-cart-layout {grid-template-columns:minmax(0,1fr) 290px;gap:15px}
          .lf-cart-items,.lf-summary {padding:17px}
          .lf-cart-item {grid-template-columns:75px minmax(0,1fr) auto;gap:12px}
          .lf-cart-image {width:75px;height:75px}
          .lf-cart-line-total {grid-column:2 / -1;text-align:left}
          .lf-cart-line-total>span {display:inline;margin-right:8px}
        }
        @media(max-width:720px) {
          .lf-cart-nav {gap:12px}
          .lf-cart-nav-links {order:3;width:100%;justify-content:space-between;gap:8px}
          .lf-cart-nav-links a {font-size:11px}
          .lf-continue {font-size:11px;padding:10px 12px}
          .lf-cart-main {width:calc(100% - 24px);padding-top:32px}
          .lf-cart-layout {grid-template-columns:1fr}
          .lf-summary {position:static}
          .lf-cart-items {padding:14px}
          .lf-cart-item {grid-template-columns:70px minmax(0,1fr);gap:12px;align-items:start}
          .lf-cart-image {width:70px;height:70px;grid-row:span 2}
          .lf-cart-item-info h3 {font-size:14px}
          .lf-cart-quantity {grid-column:2;display:flex;align-items:center;gap:12px}
          .lf-cart-quantity>span {margin:0}
          .lf-cart-line-total {grid-column:2;text-align:left}
          .lf-cart-line-total>span {display:inline;margin-right:8px}
          .lf-items-title h2 {font-size:18px}
        }
      `}</style>
    </main>
  );
}
