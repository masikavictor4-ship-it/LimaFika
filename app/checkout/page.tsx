"use client";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(
  () => import("./DeliveryMap"),
  { ssr: false }
);
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useCart } from "../context/CartContext";
import "./page.css";

type PaymentMethod = "Cash on Delivery" | "M-Pesa";

type CartItem = {
  id?: string | number;
  product_id?: string | number;
  name?: string;
  title?: string;
  price: number;
  quantity?: number;
  qty?: number;
};

function generateOrderNumber() {
  return `LF-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
}

function getItemQuantity(item: CartItem) {
  return Math.max(1, Number(item.quantity ?? item.qty ?? 1));
}

function getItemName(item: CartItem) {
  return item.name ?? item.title ?? "Product";
}

function formatMoney(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const cartContext = useCart() as any;

  const cartItems: CartItem[] =
    cartContext?.cartItems ??
    cartContext?.items ??
    cartContext?.cart ??
    [];

  const clearCart = cartContext?.clearCart;

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Cash on Delivery");

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!mounted) return;

        if (user) {
          setUserId(user.id);

          const metadata = user.user_metadata ?? {};

          setCustomerName(
            metadata.full_name ??
              metadata.name ??
              metadata.customer_name ??
              ""
          );

          setPhone(
            metadata.phone ??
              metadata.phone_number ??
              ""
          );
        }
      } catch (error) {
        console.error("Could not load account:", error);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * getItemQuantity(item),
    0
  );

  // Keep this at zero until you configure your delivery pricing.
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  async function handlePlaceOrder(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (loading) return;

    if (!customerName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }

    if (!deliveryLocation.trim()) {
      setErrorMessage("Please enter your delivery location.");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty. Please add products first.");
      return;
    }

    if (
      cartItems.some(
        (item) =>
          !Number.isFinite(Number(item.price)) ||
          Number(item.price) < 0
      )
    ) {
      setErrorMessage("One or more products have an invalid price.");
      return;
    }

    if (total <= 0) {
      setErrorMessage("Your order total must be greater than zero.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setErrorMessage("Please log in before placing your order.");
        router.push("/login");
        return;
      }

      const orderNumber = generateOrderNumber();

      const orderItems = cartItems.map((item) => ({
        product_id: item.product_id ?? item.id ?? null,
        name: getItemName(item),
        price: Number(item.price),
        quantity: getItemQuantity(item),
        subtotal:
          Number(item.price) * getItemQuantity(item),
      }));

      /*
       * These field names match your actual Supabase schema.
       * Do not add customer_email or customer_phone here.
       */
      const orderPayload = {
        order_number: orderNumber,
        user_id: user.id,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        delivery_location: deliveryLocation.trim(),
        delivery_note: deliveryNote.trim() || null,
        payment_method: paymentMethod,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        total_amount: total,
        status: "Preparing",
        items: orderItems,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id, order_number")
        .single();

      if (orderError) {
        console.error("Order insert failed:", orderError);
        throw new Error(orderError.message);
      }

      // The order is saved. A cart-clearing failure must not undo it.
      try {
        if (typeof clearCart === "function") {
          await clearCart();
        }
      } catch (clearError) {
        console.error("Could not clear cart:", clearError);
      }

      setSuccessMessage(
        `Your order ${order.order_number} has been placed successfully.`
      );

      router.push(
        `/order-confirmation?order=${encodeURIComponent(
          order.order_number
        )}`
      );
    } catch (error: any) {
      console.error("Checkout error:", error);

      setErrorMessage(
        error?.message ??
          "We could not place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <section className="checkout-card">
            <p>Loading checkout...</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <Link href="/" className="checkout-brand">
            LimaFika
          </Link>

          <p>Fresh products, delivered to your door.</p>
          <h1>Checkout</h1>
          <p>Review your order and enter your delivery details.</p>
        </header>

        {!userId && (
          <div className="checkout-alert checkout-error">
            You need to log in before placing an order.{" "}
            <Link href="/login">Go to Login</Link>
          </div>
        )}

        {errorMessage && (
          <div className="checkout-alert checkout-error" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="checkout-alert checkout-success" role="status">
            {successMessage}
          </div>
        )}

        <div className="checkout-layout">
          <section className="checkout-card">
            <h2>Delivery Information</h2>

            <form onSubmit={handlePlaceOrder}>
              <label htmlFor="customer-name">Full Name *</label>
              <input
                id="customer-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                required
              />

              <label htmlFor="customer-phone">Phone Number *</label>
              <input
                id="customer-phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />

              <label htmlFor="delivery-location">
                Delivery Location *
              </label>
              <textarea
                id="delivery-location"
                autoComplete="street-address"
                placeholder="Enter your estate, street, town or landmark"
                value={deliveryLocation}
                onChange={(event) =>
                  setDeliveryLocation(event.target.value)
                }
                rows={3}
                required
              />

              <DeliveryMap
                onLocationSelect={(address, _latitude, _longitude) => {
                  setDeliveryLocation(address);
                }}
              />

              <label htmlFor="delivery-note">
                Delivery Instructions (Optional)
              </label>
              <textarea
                id="delivery-note"
                placeholder="Additional directions for the delivery person"
                value={deliveryNote}
                onChange={(event) =>
                  setDeliveryNote(event.target.value)
                }
                rows={2}
              />

              <h2 className="checkout-section-heading">
                Payment Method
              </h2>

              <label className="checkout-payment-option">
                <input
                  type="radio"
                  name="payment-method"
                  value="Cash on Delivery"
                  checked={paymentMethod === "Cash on Delivery"}
                  onChange={() =>
                    setPaymentMethod("Cash on Delivery")
                  }
                />
                <span>
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives.</small>
                </span>
              </label>

              <label className="checkout-payment-option">
                <input
                  type="radio"
                  name="payment-method"
                  value="M-Pesa"
                  checked={paymentMethod === "M-Pesa"}
                  onChange={() => setPaymentMethod("M-Pesa")}
                />
                <span>
                  <strong>M-Pesa</strong>
                  <small>
                    Select M-Pesa to record your preferred payment
                    method. Payment processing must be configured
                    separately.
                  </small>
                </span>
              </label>

              <button
                type="submit"
                className="checkout-place-order"
                disabled={
                  loading ||
                  !userId ||
                  cartItems.length === 0
                }
              >
                {loading
                  ? "Placing Your Order..."
                  : `Place Order — ${formatMoney(total)}`}
              </button>

              <Link href="/cart" className="checkout-back-link">
                ← Return to Cart
              </Link>
            </form>
          </section>

          <aside className="checkout-card checkout-summary">
            <h2>Order Summary</h2>

            {cartItems.length === 0 ? (
              <div className="checkout-empty">
                <p>Your cart is empty.</p>
                <Link href="/products" className="checkout-shop-link">
                  Browse Products
                </Link>
              </div>
            ) : (
              <>
                <div className="checkout-summary-items">
                  {cartItems.map((item, index) => (
                    <div
                      className="checkout-summary-item"
                      key={`${item.id ?? item.product_id ?? getItemName(item)}-${index}`}
                    >
                      <div>
                        <strong>{getItemName(item)}</strong>
                        <small>
                          Quantity: {getItemQuantity(item)}
                        </small>
                      </div>

                      <span>
                        {formatMoney(
                          Number(item.price) * getItemQuantity(item)
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>

                <div className="checkout-summary-row">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryFee === 0
                      ? "Free"
                      : formatMoney(deliveryFee)}
                  </span>
                </div>

                <div className="checkout-summary-total">
                  <strong>Total</strong>
                  <strong>{formatMoney(total)}</strong>
                </div>
              </>
            )}
          </aside>
        </div>

        <footer className="checkout-footer">
          © {new Date().getFullYear()} LimaFika. Thank you for shopping with us.
        </footer>
      </div>
    </main>
  );
}
