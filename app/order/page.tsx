"use client";

import { useState } from "react";
import Link from "next/link";

export default function OrderPage() {
  const [product, setProduct] = useState("Marijuana Rolls");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const prices: { [key: string]: number } = {
    "Marijuana Rolls": 500,
    "Marijuana Bags": 1000,
  };

  const total = prices[product] * quantity;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    alert(
      `Order received!\n\nProduct: ${product}\nQuantity: ${quantity}\nTotal: KSh ${total}\nName: ${name}\nPhone: ${phone}\nLocation: ${location}`
    );
  }

  return (
    <main className="order-page">
      <nav className="navbar">
        <div className="logo">LimaFika</div>

        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/order">Order</Link>
        </div>
      </nav>

      <section className="order-container">
        <div className="order-header">
          <h1>Place Your Order</h1>
          <p>Order from LimaFika and we'll arrange delivery.</p>
        </div>

        <form onSubmit={handleSubmit} className="order-form">

          <label htmlFor="product">Select Product</label>

          <select
            id="product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          >
            <option value="Marijuana Rolls">Marijuana Rolls</option>
            <option value="Marijuana Bags">Marijuana Bags</option>
          </select>

          <label htmlFor="quantity">Quantity</label>

          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <div className="price-box">
            <span>Total</span>
            <strong>KSh {total.toLocaleString()}</strong>
          </div>

          <label htmlFor="name">Full Name</label>

          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="phone">Phone Number</label>

          <input
            id="phone"
            type="tel"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <label htmlFor="location">Delivery Location</label>

          <input
            id="location"
            type="text"
            placeholder="Enter your delivery location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <label htmlFor="notes">Additional Information</label>

          <textarea
            id="notes"
            placeholder="Any additional information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />

          <button type="submit">
            Submit Order
          </button>

        </form>
      </section>
    </main>
  );
}
