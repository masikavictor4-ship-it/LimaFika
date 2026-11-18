"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <main className="confirmation-page">
      <section className="confirmation-card">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>

        <p className="confirmation-message">
          Thank you for shopping with LimaFika. We have received your order.
        </p>

        {orderNumber && (
          <div className="order-number">
            <span>Order number</span>
            <strong>{orderNumber}</strong>
          </div>
        )}

        <p className="delivery-message">
          We will process your order and prepare it for delivery around Bungoma.
        </p>

        <div className="confirmation-actions">
          <Link href="/products" className="primary-button">
            Continue Shopping
          </Link>

          <Link href="/order" className="secondary-button">
            View My Orders
          </Link>

          <Link href="/" className="home-link">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="confirmation-page">
          <section className="confirmation-card">
            Loading your order confirmation...
          </section>
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
