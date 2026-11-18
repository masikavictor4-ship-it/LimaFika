"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <nav className="navbar">
        <div className="nav-left">
          <Link href="/" className="logo">
            LimaFika
          </Link>
        </div>

        <div className="nav-right">
          <Link href="/products" className="nav-link">
            Products
          </Link>

          <Link href="/cart" className="nav-link">
            Cart
          </Link>

          <Link href="/login" className="login-button">
            Login
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to LimaFika</h1>

          <p>
            Discover our products, add your favorites to your cart,
            and place your order easily.
          </p>

          <div className="hero-buttons">
            <Link href="/products" className="primary-button">
              Shop Now
            </Link>

            <Link href="/login" className="secondary-button">
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
