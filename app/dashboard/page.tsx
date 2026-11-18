
"use client";

import "leaflet/dist/leaflet.css";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./page.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  delivery_address: string | null;
  customer_latitude: number | null;
  customer_longitude: number | null;
  driver_latitude: number | null;
  driver_longitude: number | null;
  estimated_delivery_minutes: number | null;
  created_at: string;
  updated_at: string | null;
};

const DEFAULT_LAT = -1.286389;
const DEFAULT_LNG = 36.817223;

const statuses = [
  "Preparing",
  "Ready",
  "Picked Up",
  "On the Way",
  "Delivered",
];

export default function DashboardPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    try {
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email || "");

      const { data, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          total,
          payment_method,
          delivery_address,
          customer_latitude,
          customer_longitude,
          driver_latitude,
          driver_longitude,
          estimated_delivery_minutes,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) throw orderError;

      setOrder(data as Order | null);
    } catch (err: unknown) {
      console.error("Dashboard error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load your order."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the latest order and refresh periodically as a fallback.
  useEffect(() => {
    let cancelled = false;

    const refreshOrder = async () => {
      if (!cancelled) {
        await loadOrder();
      }
    };

    void refreshOrder();

    const interval = setInterval(() => {
      void refreshOrder();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadOrder]);

  // Subscribe to changes for this customer's orders.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribeToOrderUpdates() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (cancelled || !user) return;

        const newChannel = supabase
          .channel(`customer-order-tracking-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (cancelled) return;

              const updatedOrder = payload.new as Partial<Order>;

              setOrder((currentOrder) => {
                // Do not replace the displayed order with an older order.
                if (
                  !currentOrder ||
                  updatedOrder.id !== currentOrder.id
                ) {
                  return currentOrder;
                }

                return {
                  ...currentOrder,
                  ...updatedOrder,
                };
              });
            }
          );

        if (cancelled) {
          await supabase.removeChannel(newChannel);
          return;
        }

        channel = newChannel;

        // Register every callback before calling subscribe().
        channel.subscribe((status, subscriptionError) => {
          if (cancelled) return;

          if (status === "CHANNEL_ERROR") {
            console.error(
              "Order tracking subscription error:",
              subscriptionError
            );
          }

          if (status === "TIMED_OUT") {
            console.error("Order tracking subscription timed out.");
          }
        });
      } catch (err: unknown) {
        if (!cancelled) {
          console.error(
            "Could not subscribe to order updates:",
            err
          );
        }
      }
    }

    void subscribeToOrderUpdates();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  function getStatusIndex(status: string) {
    const index = statuses.indexOf(status);
    return index === -1 ? 0 : index;
  }

  async function logout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      console.error("Logout error:", logoutError);
      setError("Could not log out. Please try again.");
      return;
    }

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <h2>Loading your orders...</h2>
          <p>Please wait.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <Link href="/" className="dashboard-logo">
          LimaFika
        </Link>

        <div className="dashboard-nav-links">
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart</Link>

          <span className="user-email">{userEmail}</span>

          <button
            type="button"
            onClick={logout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="dashboard-container">
        <div className="dashboard-heading">
          <div>
            <p className="dashboard-label">CUSTOMER DASHBOARD</p>
            <h1>Track Your Order</h1>
            <p>
              Follow your LimaFika order from preparation to delivery.
            </p>
          </div>

          <Link href="/products" className="shop-button">
            Order Again
          </Link>
        </div>

        {error && (
          <div className="dashboard-error">
            <strong>Could not load your order.</strong>
            <p>{error}</p>
            <button type="button" onClick={() => void loadOrder()}>
              Try Again
            </button>
          </div>
        )}

        {!order && !error && (
          <div className="no-order-card">
            <div className="no-order-icon">🛒</div>
            <h2>No orders yet</h2>
            <p>
              You have not placed an order yet. Browse our products
              and place your first LimaFika order.
            </p>

            <Link href="/products" className="shop-button">
              Browse Products
            </Link>
          </div>
        )}

        {order && (
          <>
            <div className="order-top-card">
              <div>
                <span className="small-label">ORDER NUMBER</span>
                <h2>{order.order_number}</h2>
              </div>

              <div className="status-badge">{order.status}</div>
            </div>

            <div className="tracking-layout">
              <section className="tracking-card">
                <div className="card-heading">
                  <div>
                    <span className="small-label">LIVE TRACKING</span>
                    <h2>Delivery Progress</h2>
                  </div>

                  <span className="live-indicator">
                    <span />
                    LIVE
                  </span>
                </div>

                {order.status === "Cancelled" ? (
                  <div className="cancelled-message">
                    This order has been cancelled.
                  </div>
                ) : (
                  <div className="timeline">
                    {statuses.map((status, index) => {
                      const currentIndex = getStatusIndex(order.status);
                      const completed = index <= currentIndex;

                      return (
                        <div
                          className={`timeline-item ${
                            completed ? "completed" : ""
                          } ${
                            index === currentIndex ? "current" : ""
                          }`}
                          key={status}
                        >
                          <div className="timeline-marker">
                            {completed ? "✓" : index + 1}
                          </div>

                          <div className="timeline-content">
                            <strong>{status}</strong>

                            {index === currentIndex && (
                              <span>Current order status</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {order.status !== "Delivered" &&
                  order.status !== "Cancelled" && (
                    <div className="eta-box">
                      <span className="eta-icon">🚚</span>

                      <div>
                        <strong>Estimated delivery</strong>
                        <p>
                          {order.estimated_delivery_minutes != null
                            ? `${order.estimated_delivery_minutes} minutes`
                            : "Being calculated"}
                        </p>
                      </div>
                    </div>
                  )}

                {order.status === "Delivered" && (
                  <div className="delivered-message">
                    ✓ Your order has been delivered.
                  </div>
                )}
              </section>

              <section className="map-card">
                <div className="card-heading">
                  <div>
                    <span className="small-label">DELIVERY MAP</span>
                    <h2>Where Is My Order?</h2>
                  </div>
                </div>

                <div className="map-wrapper">
                  <MapContainer
                    key={`${order.id}-${order.customer_latitude}-${order.customer_longitude}`}
                    center={[
                      order.customer_latitude ?? DEFAULT_LAT,
                      order.customer_longitude ?? DEFAULT_LNG,
                    ]}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {order.customer_latitude != null &&
                      order.customer_longitude != null && (
                        <Marker
                          position={[
                            order.customer_latitude,
                            order.customer_longitude,
                          ]}
                        >
                          <Popup>
                            <strong>Your delivery address</strong>
                            <br />
                            {order.delivery_address || "Customer location"}
                          </Popup>
                        </Marker>
                      )}

                    {order.driver_latitude != null &&
                      order.driver_longitude != null && (
                        <Marker
                          position={[
                            order.driver_latitude,
                            order.driver_longitude,
                          ]}
                        >
                          <Popup>
                            <strong>🚚 Delivery Rider</strong>
                            <br />
                            Your rider is here.
                          </Popup>
                        </Marker>
                      )}

                    {order.customer_latitude != null &&
                      order.customer_longitude != null &&
                      order.driver_latitude != null &&
                      order.driver_longitude != null && (
                        <Polyline
                          positions={[
                            [
                              order.driver_latitude,
                              order.driver_longitude,
                            ],
                            [
                              order.customer_latitude,
                              order.customer_longitude,
                            ],
                          ]}
                        />
                      )}
                  </MapContainer>

                  <div className="map-legend">
                    <div>
                      <span className="legend-dot customer-dot" />
                      Your Location
                    </div>

                    <div>
                      <span className="legend-dot driver-dot" />
                      Rider
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="details-grid">
              <section className="details-card">
                <span className="small-label">ORDER DETAILS</span>
                <h2>Order Information</h2>

                <div className="detail-row">
                  <span>Order Number</span>
                  <strong>{order.order_number}</strong>
                </div>

                <div className="detail-row">
                  <span>Status</span>
                  <strong>{order.status}</strong>
                </div>

                <div className="detail-row">
                  <span>Payment</span>
                  <strong>{order.payment_method}</strong>
                </div>

                <div className="detail-row">
                  <span>Total</span>
                  <strong>
                    KSh {Number(order.total || 0).toLocaleString()}
                  </strong>
                </div>

                <div className="detail-row">
                  <span>Placed</span>
                  <strong>
                    {new Date(order.created_at).toLocaleString()}
                  </strong>
                </div>
              </section>

              <section className="details-card">
                <span className="small-label">DELIVERY</span>
                <h2>Delivery Information</h2>

                <div className="address-box">
                  📍
                  <span>
                    {order.delivery_address ||
                      "Delivery address not provided"}
                  </span>
                </div>

                {order.customer_latitude != null &&
                  order.customer_longitude != null && (
                    <p className="coordinates">Location captured ✓</p>
                  )}

                <div className="help-box">
                  <strong>Need help?</strong>
                  <p>
                    Contact LimaFika support if your order is delayed
                    or the delivery information is incorrect.
                  </p>
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
