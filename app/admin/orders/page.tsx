"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  delivery_location: string | null;
  delivery_note: string | null;
  payment_method: string | null;
  subtotal: number | null;
  delivery_fee: number | null;
  total: number | null;
  status: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: number | null;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
};


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "orders" | "customers" | "transactions"
  >("orders");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const pendingCount = orders.filter(
    (order) => !order.status || order.status === "Preparing"
  ).length;
  
  const activeCount = orders.filter((order) =>
    ["Ready", "Picked Up", "On the Way"].includes(
      order.status || ""
    )
  ).length;
  
  const deliveredCount = orders.filter(
    (order) => order.status === "Delivered"
  ).length;
  
  const cancelledCount = orders.filter(
    (order) => order.status === "Cancelled"
  ).length;

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError || !admin) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      await loadOrders();
    } catch (error) {
      console.error("Admin check error:", error);
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Orders loading error:", ordersError);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .order("id", { ascending: true });

    if (itemsError) {
      console.error("Order items loading error:", itemsError);
    }

    setOrders((ordersData || []) as Order[]);
    setOrderItems((itemsData || []) as OrderItem[]);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      setUpdating(orderId);

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq("id", orderId);

      if (error) {
        console.error("Status update error:", error);
        alert(`Could not update order: ${error.message}`);
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
        });
      }
    } finally {
      setUpdating(null);
    }
  }

  function getStatusClass(status: string | null) {
    return (
      status
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-") || "pending"
    );
  }

  function getMapUrl(location: string | null) {
    if (!location) return "#";

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function formatMoney(value: number | null | undefined) {
    return `KSh ${Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        order.order_number?.toLowerCase().includes(searchText) ||
        order.customer_name?.toLowerCase().includes(searchText) ||
        order.phone?.toLowerCase().includes(searchText) ||
        order.delivery_location?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const activeCount = orders.filter((order) =>
    ["Confirmed", "Processing", "Out for Delivery"].includes(
      order.status || ""
    )
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const cancelledCount = orders.filter(
    (order) => order.status === "Cancelled"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone: string;
        orders: number;
        total: number;
      }
    >();

    orders.forEach((order) => {
      const key = order.phone || order.customer_name;

      if (!map.has(key)) {
        map.set(key, {
          name: order.customer_name,
          phone: order.phone,
          orders: 0,
          total: 0,
        });
      }

      const customer = map.get(key)!;

      customer.orders += 1;

      if (order.status !== "Cancelled") {
        customer.total += Number(order.total || 0);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.total - a.total
    );
  }, [orders]);

  const selectedItems = selectedOrder
    ? orderItems.filter((item) => item.order_id === selectedOrder.id)
    : [];

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">
          <div className="admin-spinner" />
          <h2>Loading Admin Dashboard...</h2>
          <p>Please wait.</p>
        </div>
      </main>
    );
  }

  if (accessDenied || !isAdmin) {
    return (
      <main className="admin-page">
        <div className="admin-denied">
          <div className="admin-denied-icon">🔒</div>
          <h1>Admin Access Required</h1>
          <p>
            Your account does not have permission to access the
            LimaFika admin dashboard.
          </p>
          <a href="/login" className="admin-login-button">
            Go to Login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-brand">
            <span className="admin-logo">LF</span>
            <div>
              <h1>LimaFika Admin</h1>
              <p>Order Management Dashboard</p>
            </div>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            className="admin-refresh"
            onClick={loadOrders}
          >
            ↻ Refresh
          </button>

          <a href="/products" className="admin-store-link">
            View Store
          </a>
        </div>
      </header>

      <section className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📦</div>
          <div>
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>
        </div>

        <div className="admin-stat-card pending-card">
          <div className="admin-stat-icon">⏳</div>
          <div>
            <span>Pending Orders</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="admin-stat-card active-card">
          <div className="admin-stat-icon">🚚</div>
          <div>
            <span>Active Deliveries</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">✓</div>
          <div>
            <span>Delivered</span>
            <strong>{deliveredCount}</strong>
          </div>
        </div>

        <div className="admin-stat-card revenue-card">
          <div className="admin-stat-icon">💰</div>
          <div>
            <span>Revenue</span>
            <strong>{formatMoney(totalRevenue)}</strong>
          </div>
        </div>
      </section>

      <nav className="admin-tabs">
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders
          <span>{orders.length}</span>
        </button>

        <button
          className={activeTab === "customers" ? "active" : ""}
          onClick={() => setActiveTab("customers")}
        >
          👥 Customers
          <span>{customers.length}</span>
        </button>

        <button
          className={activeTab === "transactions" ? "active" : ""}
          onClick={() => setActiveTab("transactions")}
        >
          💳 Transactions
        </button>
      </nav>

      {activeTab === "orders" && (
        <section className="admin-content">
          <div className="admin-toolbar">
            <div className="admin-search">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search order, customer, phone or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-filter"
            >
              <option value="All">All Statuses</option>

              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="pending-notice">
            <strong>{pendingCount} pending orders</strong>
            {pendingCount > 0
              ? " require admin attention."
              : " — everything is up to date."}
          </div>

          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Manage</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-orders">
                        <div>📦</div>
                        <h3>No orders found</h3>
                        <p>
                          Try changing your search or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <button
                          className="order-number-button"
                          onClick={() => setSelectedOrder(order)}
                        >
                          {order.order_number}
                        </button>
                      </td>

                      <td>
                        <div className="customer-cell">
                          <strong>{order.customer_name}</strong>
                          <span>{order.phone}</span>
                        </div>
                      </td>

                      <td>
                        {order.delivery_location ? (
                          <a
                            className="map-link"
                            href={getMapUrl(
                              order.delivery_location
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            📍 View Map
                          </a>
                        ) : (
                          <span className="muted">No location</span>
                        )}
                      </td>

                      <td>
                        {order.payment_method || "—"}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(order.total)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </td>

                      <td>
                        <span className="date-cell">
                          {formatDate(order.created_at)}
                        </span>
                      </td>

                      <td>
                        <div className="manage-buttons">
                          <button
                            className="view-button"
                            onClick={() =>
                              setSelectedOrder(order)
                            }
                          >
                            View
                          </button>

                          <select
value={order.status || "Preparing"}														                            disabled={updating === order.id}
                            onChange={(e) =>
                              updateOrderStatus(
                                order.id,
                                e.target.value
                              )
                            }
                            className="status-select"
                          >
                            {STATUSES.map((status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "customers" && (
        <section className="admin-content">
          <div className="section-heading">
            <div>
              <h2>Customers</h2>
              <p>Customers who have placed orders.</p>
            </div>
          </div>

          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.phone}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>

                    <td>{customer.phone}</td>

                    <td>
                      <span className="customer-orders-count">
                        {customer.orders}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {formatMoney(customer.total)}
                      </strong>
                    </td>

                    <td>
                      <a
                        href={`tel:${customer.phone}`}
                        className="call-button"
                      >
                        📞 Call
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "transactions" && (
        <section className="admin-content">
          <div className="section-heading">
            <div>
              <h2>Transactions</h2>
              <p>Payment and order transaction overview.</p>
            </div>
          </div>

          <div className="transaction-summary">
            <div>
              <span>Gross Revenue</span>
              <strong>{formatMoney(totalRevenue)}</strong>
            </div>

            <div>
              <span>Delivered Orders</span>
              <strong>{deliveredCount}</strong>
            </div>

            <div>
              <span>Cancelled Orders</span>
              <strong>{cancelledCount}</strong>
            </div>
          </div>

          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Payment Method</th>
                  <th>Subtotal</th>
                  <th>Delivery</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="order-number-button"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.order_number}
                      </button>
                    </td>

                    <td>{order.customer_name}</td>

                    <td>
                      {order.payment_method || "—"}
                    </td>

                    <td>
                      {formatMoney(order.subtotal)}
                    </td>

                    <td>
                      {formatMoney(order.delivery_fee)}
                    </td>

                    <td>
                      <strong>
                        {formatMoney(order.total)}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedOrder && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span className="modal-label">ORDER</span>
                <h2>{selectedOrder.order_number}</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-status-section">
              <span
                className={`status-badge ${getStatusClass(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status || "Pending"}
              </span>

              <select
                value={selectedOrder.status || "Pending"}
                disabled={updating === selectedOrder.id}
                onChange={(e) =>
                  updateOrderStatus(
                    selectedOrder.id,
                    e.target.value
                  )
                }
                className="modal-status-select"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-grid">
              <div className="modal-card">
                <h3>Customer</h3>

                <p>
                  <strong>Name:</strong>{" "}
                  {selectedOrder.customer_name}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  <a href={`tel:${selectedOrder.phone}`}>
                    {selectedOrder.phone}
                  </a>
                </p>

                <a
                  href={`tel:${selectedOrder.phone}`}
                  className="call-button full"
                >
                  📞 Call Customer
                </a>
              </div>

              <div className="modal-card">
                <h3>Delivery</h3>

                <p>
                  <strong>Location:</strong>
                  <br />
                  {selectedOrder.delivery_location ||
                    "No location provided"}
                </p>

                {selectedOrder.delivery_location && (
                  <a
                    href={getMapUrl(
                      selectedOrder.delivery_location
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-button"
                  >
                    📍 Open Location in Google Maps
                  </a>
                )}

                {selectedOrder.delivery_note && (
                  <p className="delivery-note">
                    <strong>Note:</strong>{" "}
                    {selectedOrder.delivery_note}
                  </p>
                )}
              </div>
            </div>

            <div className="modal-card">
              <h3>Order Items</h3>

              {selectedItems.length === 0 ? (
                <p className="muted">
                  No order items found.
                </p>
              ) : (
                <div className="order-items">
                  {selectedItems.map((item) => (
                    <div
                      className="order-item"
                      key={item.id}
                    >
                      <div>
                        <strong>{item.product_name}</strong>
                        <span>
                          {item.quantity} ×{" "}
                          {formatMoney(item.price)}
                        </span>
                      </div>

                      <strong>
                        {formatMoney(item.total)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-totals">
              <div>
                <span>Subtotal</span>
                <strong>
                  {formatMoney(selectedOrder.subtotal)}
                </strong>
              </div>

              <div>
                <span>Delivery Fee</span>
                <strong>
                  {formatMoney(selectedOrder.delivery_fee)}
                </strong>
              </div>

              <div className="grand-total">
                <span>Total</span>
                <strong>
                  {formatMoney(selectedOrder.total)}
                </strong>
              </div>
            </div>

            <div className="modal-footer">
              <span>
                Ordered:{" "}
                {formatDate(selectedOrder.created_at)}
              </span>

              <button
                className="close-modal-button"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
