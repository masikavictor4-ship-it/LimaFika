
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Product = {
  id: number | string;
  name: string;
  category: string;
  price: number;
  emoji?: string;
  image_url?: string | null;
  description?: string | null;
};

export type CartItem = Product & {
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  increaseQuantity: (id: number | string) => void;
  decreaseQuantity: (id: number | string) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
};

const STORAGE_KEY = "limafika-cart";

const CartContext = createContext<CartContextType | null>(null);

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    (typeof item.id === "number" || typeof item.id === "string") &&
    String(item.id).length > 0 &&
    typeof item.name === "string" &&
    Number.isFinite(Number(item.price)) &&
    Number(item.price) >= 0 &&
    Number.isInteger(Number(item.quantity)) &&
    Number(item.quantity) > 0
  );
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);

      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          setCart(
            parsed
              .filter(isValidCartItem)
              .map((item) => ({
                ...item,
                price: Number(item.price),
                quantity: Number(item.quantity),
                category: item.category || "General",
                emoji: item.emoji || "🛍️",
                image_url: item.image_url || null,
              }))
          );
        }
      }
    } catch (error) {
      console.error("Could not restore LimaFika cart:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save LimaFika cart:", error);
    }
  }, [cart, loaded]);

  const addToCart = useCallback((product: Product) => {
    const price = Number(product.price);

    if (
      (typeof product.id !== "string" &&
        typeof product.id !== "number") ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      console.error("Invalid product cannot be added to cart:", product);
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => String(item.id) === String(product.id)
      );

      if (existing) {
        return currentCart.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          price,
          category: product.category || "General",
          emoji: product.emoji || "🛍️",
          image_url: product.image_url || null,
          quantity: 1,
        },
      ];
    });
  }, []);

  const increaseQuantity = useCallback((id: number | string) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        String(item.id) === String(id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((id: number | string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          String(item.id) === String(id)
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: number | string) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => String(item.id) !== String(id)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Could not clear saved cart:", error);
    }
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + Number(item.price) * item.quantity,
        0
      ),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      subtotal,
    }),
    [
      cart,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      subtotal,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider. Check app/layout.tsx."
    );
  }

  return context;
}
