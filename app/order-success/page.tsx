"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderSuccessContent() {
  const searchParams = useSearchParams();

  const orderNumber =
    searchParams.get("order") || "Your order";

  const total =
    Number(searchParams.get("total") || "0");

  return (
    <main className="success-page">
      <style jsx>{`
        .success-page {
          min-height: 100vh;
          background: #f5f7fb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          color: #222;
          box-sizing: border-box;
        }

        .success-card {
          width: 100%;
          max-width: 620px;
          background: white;
          border-radius: 20px;
          padding: 45px 30px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
        }

        .success-icon {
          width: 75px;
          height: 75px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: #111;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 38px;
          font-weight: 900;
        }

        .success-card h1 {
          font-size: 32px;
          margin: 0 0 12px;
        }

        .message {
          color: #666;
          line-height: 1.7;
          margin-bottom: 28px;
        }

        .order-box {
          background: #f5f5f5;
          border-radius: 14px;
          padding: 20px;
          margin: 25px 0;
          text-align: left;
        }

        .order-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 10px 0;
        }

        .order-row strong {
          text-align: right;
        }

        .total {
          border-top: 1px solid #ddd;
          margin-top: 10px;
          padding-top: 15px;
          font-size: 20px;
          font-weight: 900;
        }

        .buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 25px;
        }

        .button {
          display: inline-block;
          padding: 14px 22px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 800;
        }

        .primary {
          background: #111;
          color: white;
        }

        .secondary {
          border: 1px solid #ccc;
          color: #222;
          background: white;
        }

        @media (max-width: 600px) {
          .success-card {
            padding: 35px 20px;
          }

          .success-card h1 {
            font-size: 27px;
          }

          .order-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .order-row strong {
            text-align: left;
          }

          .button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div className="success-card">
        <div className="success-icon">
          ✓
        </div>

        <h1>Order Received!</h1>

        <p className="message">
          Thank you for shopping with LimaFika.
          Your order has been successfully received.
          Our team will process your order and contact
          you using the phone number you provided.
        </p>

        <div className="order-box">
          <div className="order-row">
            <span>Order Number</span>

            <strong>
              {orderNumber}
            </strong>
          </div>

          <div className="order-row total">
            <span>Total</span>

            <strong>
              KSh {total.toFixed(2)}
            </strong>
          </div>
        </div>

        <p>
          Please keep your order number for reference.
        </p>

        <div className="buttons">
          <Link
            href="/products"
            className="button primary"
          >
            Continue Shopping
          </Link>

          <Link
            href="/"
            className="button secondary"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

function LoadingSuccessPage() {
  return (
    <main className="loading-page">
      <style jsx>{`
        .loading-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fb;
          font-family: Arial, sans-serif;
        }

        .loading-box {
          background: white;
          padding: 35px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        .loading-box h2 {
          margin: 0 0 10px;
        }

        .loading-box p {
          color: #666;
          margin: 0;
        }
      `}</style>

      <div className="loading-box">
        <h2>Order Received</h2>
        <p>Loading your order confirmation...</p>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingSuccessPage />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
