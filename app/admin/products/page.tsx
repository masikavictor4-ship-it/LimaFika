"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../../lib/supabase";

type Product = {
  id: number | string;
  name: string;
  price: number;
  category: string | null;
  description: string | null;
  image_url: string | null;
};

type ProductForm = {
  name: string;
  price: string;
  category: string;
  description: string;
  image_url: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  price: "",
  category: "General",
  description: "",
  image_url: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<Product["id"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<Product["id"] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, category, description, image_url")
      .order("id", { ascending: false });

    if (error) {
      setErrorMessage(`Could not load products: ${error.message}`);
      return;
    }

    setProducts((data || []) as Product[]);
    setErrorMessage("");
  }, []);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (active) setAccessDenied(true);
          return;
        }

        const { data: admin, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminError || !admin) {
          if (active) setAccessDenied(true);
          return;
        }

        if (active) {
          setIsAdmin(true);
          await loadProducts();
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        if (active) setAccessDenied(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [loadProducts]);

  function updateField(field: keyof ProductForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      category: product.category || "General",
      description: product.description || "",
      image_url: product.image_url || "",
    });
    setMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    const price = Number(form.price);

    if (!form.name.trim()) {
      setErrorMessage("Enter the product name.");
      return;
    }

    if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
      setErrorMessage("Enter a valid product price.");
      return;
    }

    if (form.image_url.trim()) {
      try {
        const url = new URL(form.image_url.trim());
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setErrorMessage("Enter a valid image URL beginning with https:// or http://.");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      price,
      category: form.category.trim() || "General",
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
    };

    setSaving(true);

    try {
      const result =
        editingId === null
          ? await supabase.from("products").insert(payload)
          : await supabase
              .from("products")
              .update(payload)
              .eq("id", editingId);

      if (result.error) {
        setErrorMessage(`Could not save product: ${result.error.message}`);
        return;
      }

      setMessage(
        editingId === null
          ? "Product added successfully."
          : "Product updated successfully."
      );

      resetForm();
      await loadProducts();
    } catch (error) {
      console.error("Saving product failed:", error);
      setErrorMessage("Something went wrong while saving the product.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(product.id);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {
        setErrorMessage(`Could not delete product: ${error.message}`);
        return;
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      if (editingId === product.id) resetForm();

      setMessage("Product deleted successfully.");
    } catch (error) {
      console.error("Deleting product failed:", error);
      setErrorMessage("Something went wrong while deleting the product.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();

    return (
      !term ||
      product.name.toLowerCase().includes(term) ||
      (product.category || "").toLowerCase().includes(term)
    );
  });

  function money(value: number) {
    return `KSh ${Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (loading) {
    return (
      <main className="state-page">
        <h2>Checking admin access...</h2>
      </main>
    );
  }

  if (accessDenied || !isAdmin) {
    return (
      <main className="state-page">
        <h1>🔒 Admin Access Required</h1>
        <p>Your account does not have permission to manage LimaFika products.</p>
        <a href="/login">Go to Login</a>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          padding: 28px clamp(16px, 4vw, 56px) 60px;
          background: #f5f7f5;
          color: #17231b;
        }

        .topbar {
          max-width: 1200px;
          margin: 0 auto 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        h1 { margin: 0; font-size: 28px; }
        .subtitle { color: #647268; margin: 5px 0 0; }

        .top-links { display: flex; gap: 10px; flex-wrap: wrap; }
        .top-links a, .secondary {
          text-decoration: none;
          border: 1px solid #d7e0d8;
          background: white;
          color: #26392c;
          padding: 10px 15px;
          border-radius: 10px;
          font-weight: 700;
        }

        .content {
          max-width: 1200px;
          margin: auto;
          display: grid;
          grid-template-columns: minmax(280px, 390px) minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .panel {
          background: white;
          border: 1px solid #e4eae5;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 5px 20px #183b2410;
        }

        .panel h2 { margin: 0 0 6px; font-size: 21px; }
        .hint { color: #6b786e; font-size: 14px; line-height: 1.5; }

        label {
          display: block;
          margin: 14px 0 6px;
          font-size: 13px;
          font-weight: 800;
        }

        input, textarea {
          width: 100%;
          border: 1px solid #d8e1d9;
          border-radius: 10px;
          padding: 12px 13px;
          background: white;
          color: #17231b;
          font: inherit;
        }

        textarea { min-height: 92px; resize: vertical; }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        button { cursor: pointer; font: inherit; }

        .save {
          border: 0;
          border-radius: 10px;
          background: #147a43;
          color: white;
          padding: 12px 18px;
          font-weight: 800;
          flex: 1;
        }

        .save:disabled, .danger:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .notice {
          padding: 12px 14px;
          border-radius: 10px;
          margin: 14px 0;
          font-size: 14px;
        }

        .success { background: #e9f8ee; color: #176438; }
        .error { background: #fff0ed; color: #a33324; }

        .list-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .count { color: #66756a; font-size: 13px; }
        .search { max-width: 280px; }

        .product-list { display: grid; gap: 12px; }

        .product {
          border: 1px solid #e6ece7;
          border-radius: 14px;
          padding: 12px;
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }

        .product img, .placeholder {
          width: 76px;
          height: 76px;
          object-fit: cover;
          border-radius: 10px;
          background: #edf3ee;
        }

        .placeholder {
          display: grid;
          place-items: center;
          font-size: 27px;
        }

        .product h3 { margin: 0 0 4px; font-size: 16px; }
        .product p { margin: 3px 0; color: #6b786e; font-size: 13px; }
        .price { color: #147a43 !important; font-weight: 800; }

        .actions { display: flex; flex-direction: column; gap: 7px; }

        .edit, .danger {
          border: 0;
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 13px;
          font-weight: 800;
        }

        .edit { background: #eaf3ed; color: #17633a; }
        .danger { background: #fff0ed; color: #a33324; }

        .empty {
          text-align: center;
          color: #6b786e;
          padding: 38px 12px;
          border: 1px dashed #d5dfd7;
          border-radius: 14px;
        }

        .state-page {
          min-height: 100vh;
          display: grid;
          align-content: center;
          justify-items: center;
          text-align: center;
          padding: 24px;
          background: #f5f7f5;
        }

        @media (max-width: 850px) {
          .content { grid-template-columns: 1fr; }
        }

        @media (max-width: 520px) {
          .product { grid-template-columns: 60px minmax(0, 1fr); }
          .product img, .placeholder { width: 60px; height: 60px; }
          .actions { grid-column: 2; flex-direction: row; }
          .search { max-width: none; }
        }
      `}</style>

      <header className="topbar">
        <div>
          <h1>🛍️ LimaFika Product Management</h1>
          <p className="subtitle">Add, edit and manage products in your store.</p>
        </div>

        <nav className="top-links">
          <a href="/admin/orders">Orders Dashboard</a>
          <a href="/products">View Store</a>
        </nav>
      </header>

      <div className="content">
        <section className="panel">
          <h2>{editingId === null ? "Add a Product" : "Edit Product"}</h2>
          <p className="hint">
            Products saved here will appear in your customer store.
          </p>

          {message && <div className="notice success">{message}</div>}
          {errorMessage && <div className="notice error">{errorMessage}</div>}

          <form onSubmit={saveProduct}>
            <label htmlFor="product-name">Product name *</label>
            <input
              id="product-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Fresh tomatoes"
              required
              maxLength={120}
            />

            <label htmlFor="product-price">Price (KSh) *</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="e.g. 150"
              required
            />

            <label htmlFor="product-category">Category</label>
            <input
              id="product-category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="e.g. Groceries"
            />

            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe this product..."
            />

            <label htmlFor="product-image">Image URL</label>
            <input
              id="product-image"
              type="url"
              value={form.image_url}
              onChange={(e) => updateField("image_url", e.target.value)}
              placeholder="https://example.com/product.jpg"
            />

            <p className="hint">
              Enter a publicly accessible image URL. Direct image uploads are
              not enabled in this version.
            </p>

            <div className="form-actions">
              <button className="save" type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Add Product"
                    : "Save Changes"}
              </button>

              {editingId !== null && (
                <button
                  className="secondary"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="list-head">
            <div>
              <h2>Your Products</h2>
              <div className="count">
                {products.length} product{products.length === 1 ? "" : "s"} in
                your store
              </div>
            </div>

            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty">
              {products.length === 0
                ? "No products yet. Add your first product using the form."
                : "No products match your search."}
            </div>
          ) : (
            <div className="product-list">
              {filteredProducts.map((product) => (
                <article className="product" key={product.id}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="placeholder">🛍️</div>
                  )}

                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category || "General"}</p>
                    <p className="price">{money(product.price)}</p>
                    {product.description && <p>{product.description}</p>}
                  </div>

                  <div className="actions">
                    <button
                      className="edit"
                      type="button"
                      onClick={() => startEditing(product)}
                    >
                      Edit
                    </button>

                    <button
                      className="danger"
                      type="button"
                      disabled={deletingId === product.id}
                      onClick={() => deleteProduct(product)}
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
