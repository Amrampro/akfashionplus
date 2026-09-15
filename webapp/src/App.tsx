import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useLanguage } from "./hooks/useLanguage";
import ContactPage from "./pages/public/ContactPage";
import FaqPage from "./pages/public/FaqPage";
import GiftCardsPage from "./pages/public/GiftCardsPage";
import HomePage from "./pages/public/HomePage";
import ShopPage from "./pages/public/ShopPage";
import ProductDetailsPage from "./pages/public/ProductDetailsPage";
import UserLayout from "./components/layout/UserLayout";
import UserDashboardPage from "./pages/user/UserDashboardPage";
import UserFavoritesPage from "./pages/user/FavoritesPage";
import UserGiftCardsPage from "./pages/user/GiftCardsPage";
import UserNotificationsPage from "./pages/user/NotificationsPage";
import UserOrderDetailsPage from "./pages/user/OrderDetailsPage";
import UserOrdersPage from "./pages/user/OrdersPage";
import UserProfilePage from "./pages/user/ProfilePage";
import UserRentalsPage from "./pages/user/RentalsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminBranchesPage from "./pages/admin/BranchesPage";
import AdminCategoriesPage from "./pages/admin/CategoriesPage";
import AdminGiftCardsPage from "./pages/admin/GiftCardsPage";
import AdminNotificationsPage from "./pages/admin/NotificationsPage";
import AdminOrdersPage from "./pages/admin/OrdersPage";
import AdminPaymentsPage from "./pages/admin/PaymentsPage";
import AdminProfilePage from "./pages/admin/ProfilePage";
import AdminProductsPage from "./pages/admin/ProductsPage";
import AdminRentalsPage from "./pages/admin/RentalsPage";
import AdminResalesPage from "./pages/admin/ResalesPage";
import AdminReviewsPage from "./pages/admin/ReviewsPage";
import AdminSettingsPage from "./pages/admin/SettingsPage";
import AdminImportantLinksPage from "./pages/admin/ImportantLinksPage";
import AdminSecondHandProposalsPage from "./pages/admin/SecondHandProposalsPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import CashierDashboardPage from "./pages/cashier/CashierDashboardPage";
import CashierHistoryPage from "./pages/cashier/CashierHistoryPage";
import CashierNotificationsPage from "./pages/cashier/NotificationsPage";
import CashierPickupDetailsPage from "./pages/cashier/PickupDetailsPage";
import CashierPickupsPage from "./pages/cashier/PickupsPage";
import CashierProfilePage from "./pages/cashier/ProfilePage";
import CashierRentalsPage from "./pages/cashier/RentalsPage";
import CashierResaleDetailsPage from "./pages/cashier/ResalePayoutDetailsPage";
import CashierResalesPage from "./pages/cashier/ResalePayoutsPage";
import CashierSecondHandProposalsPage from "./pages/cashier/SecondHandProposalsPage";
import { appConfig } from "./config/app";
import { translatePublicDom } from "./utils/publicDomTranslations";
import "./App.css";

type Role = "user" | "cashier" | "admin";
type Language = "fr" | "en" | "pt";
type Product = {
  id: number;
  variantId?: number | null;
  slug: string;
  name: string;
  category: string;
  condition: "new" | "second_hand";
  price: number;
  rentPrice?: number;
  rating: number;
  color: string;
  sizes: string[];
  tag: string;
  cartId?: string;
  cartMode?: "purchase" | "rental";
  rentalDays?: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalDeposit?: number;
  rentalPricePerDay?: number;
  unitPrice?: number;
};
type Session = {
  role: Role;
  name: string;
  email: string;
};
type AuthUserPayload = {
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  preferred_language?: string | null;
};
type AuthFormPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};
type CheckoutGiftCard = {
  id: number;
  serial_number: string;
  card_name: string;
  current_balance_eur: number;
  reserved_balance_eur: number;
  available_balance_eur: number;
  status: string;
};
type DeliveryCountry = {
  id: number;
  country_code: string;
  country_name: string;
  delivery_price_eur: number | string;
  status: string;
};

const API_URL = appConfig.apiUrl;

const routes: Record<string, string> = {
  home: "/",
  shop: "/shop",
  new: "/new",
  "second-hand": "/second-hand",
  rental: "/rental",
  "gift-cards": "/gift-cards",
  faq: "/faq",
  contact: "/contact",
  "important-link": "/important-links",
  cart: "/cart",
  checkout: "/checkout",
  "order-success": "/order-success",
  "order-failure": "/order-failure",
  login: "/login",
  register: "/register",
  "user-dashboard": "/account",
  "user-orders": "/account/orders",
  "user-order-details": "/account/orders/details",
  "user-rentals": "/account/rentals",
  "user-gift-cards": "/account/gift-cards",
  "user-favorites": "/account/favorites",
  "user-notifications": "/account/notifications",
  "user-profile": "/account/profile",
  "cashier-dashboard": "/cashier",
  "cashier-pickups": "/cashier/pickups",
  "cashier-pickup-details": "/cashier/pickups/details",
  "cashier-resales": "/cashier/resales",
  "cashier-second-hand-proposals": "/cashier/second-hand-proposals",
  "cashier-resale-details": "/cashier/resales/details",
  "cashier-rentals": "/cashier/rentals",
  "cashier-history": "/cashier/history",
  "cashier-notifications": "/cashier/notifications",
  "cashier-profile": "/cashier/profile",
  "admin-dashboard": "/admin",
  "admin-products": "/admin/products",
  "admin-orders": "/admin/orders",
  "admin-users": "/admin/users",
  "admin-customers": "/admin/customers",
  "admin-categories": "/admin/categories",
  "admin-inventory": "/admin/inventory",
  "admin-rentals": "/admin/rentals",
  "admin-resales": "/admin/resales",
  "admin-second-hand-proposals": "/admin/second-hand-proposals",
  "admin-payments": "/admin/payments",
  "admin-reviews": "/admin/reviews",
  "admin-notifications": "/admin/notifications",
  "admin-important-links": "/admin/important-links",
  "admin-cashiers": "/admin/cashiers",
  "admin-branches": "/admin/branches",
  "admin-gift-cards": "/admin/gift-cards",
  "admin-profile": "/admin/profile",
  "admin-settings": "/admin/settings",
};

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function secondaryMoney(value: number, rate: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value * Number(rate || 0))} ${currency || "AOA"}`;
}

function allocateCheckoutGiftCards(
  cards: CheckoutGiftCard[],
  selectedIds: number[],
  total: number,
) {
  let remaining = Math.max(Number(total || 0), 0);
  const allocations: Array<{ id: number; amount: number }> = [];

  selectedIds.forEach((id) => {
    if (remaining <= 0) return;
    const card = cards.find((item) => item.id === id);
    if (!card) return;
    const available = Math.max(Number(card.available_balance_eur || 0), 0);
    const amount = Math.min(available, remaining);
    if (amount <= 0) return;
    allocations.push({ id, amount });
    remaining = Math.max(remaining - amount, 0);
  });

  return {
    allocations,
    paid: allocations.reduce((sum, item) => sum + item.amount, 0),
    remaining,
  };
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysInputValue(startDate: string, days: number) {
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + Math.max(days, 1));
  return date.toISOString().slice(0, 10);
}

function cartLineId(product: Product, mode: "purchase" | "rental") {
  return `${product.id}-${mode}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialPage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/products/")) {
    return `product-${path.split("/").pop() || ""}`;
  }
  if (path.startsWith("/important-links/")) {
    return `important-link-${path.split("/").pop() || ""}`;
  }

  const route = Object.entries(routes).find(
    ([, routePath]) => routePath === path,
  );
  return route?.[0] || "home";
}

function pageToPath(page: string) {
  if (page.startsWith("product-")) {
    return `/products/${page.replace("product-", "")}`;
  }
  if (page.startsWith("important-link-")) {
    return `/important-links/${page.replace("important-link-", "")}`;
  }
  return routes[page] || "/";
}

function workspaceRoleForPage(page: string): Role | null {
  if (page.startsWith("admin-")) return "admin";
  if (page.startsWith("cashier-")) return "cashier";
  if (page.startsWith("user-")) return "user";
  return null;
}

function dashboardPageForRole(role: Role) {
  if (role === "admin") return "admin-dashboard";
  if (role === "cashier") return "cashier-dashboard";
  return "user-dashboard";
}

function normalizeRole(role: unknown): Role {
  return role === "admin" || role === "cashier" || role === "user"
    ? role
    : "user";
}

function sessionFromUser(user: AuthUserPayload | null | undefined, fallbackEmail = "") {
  const role = normalizeRole(user?.role);
  return {
    role,
    name:
      user?.name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      user?.email ||
      fallbackEmail ||
      "AK Fashion Plus",
    email: user?.email || fallbackEmail,
  } satisfies Session;
}

const postAuthRedirectKey = "ak_post_auth_redirect";

function setPostAuthRedirect(page: string) {
  if (page === "login" || page === "register") return;
  localStorage.setItem(postAuthRedirectKey, page);
}

function consumePostAuthRedirect(role: Role) {
  const target = localStorage.getItem(postAuthRedirectKey);
  localStorage.removeItem(postAuthRedirectKey);

  if (!target || target === "login" || target === "register") return null;
  if (!target.startsWith("product-") && !routes[target]) return null;

  const requiredRole = workspaceRoleForPage(target);
  if (requiredRole && requiredRole !== role) return null;

  return target;
}

function hasStoredAuthToken() {
  return Boolean(localStorage.getItem("ak_auth_token"));
}

function storedSession() {
  try {
    const stored = localStorage.getItem("ak_auth_user");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Session;
    return parsed?.email && parsed?.role ? parsed : null;
  } catch {
    localStorage.removeItem("ak_auth_user");
    localStorage.removeItem("ak_auth_token");
    return null;
  }
}

function storedCart() {
  try {
    const stored = localStorage.getItem("ak_cart");
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Product[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem("ak_cart");
    return [];
  }
}

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [page, setPage] = useState(initialPage);
  const [cart, setCart] = useState<Product[]>(storedCart);
  const [session, setSession] = useState<Session | null>(storedSession);
  const [authChecked, setAuthChecked] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1000);
  const [displayCurrency, setDisplayCurrency] = useState("AOA");
  const [authMessage, setAuthMessage] = useState("");
  const [cartChoiceProduct, setCartChoiceProduct] = useState<Product | null>(
    null,
  );

  useEffect(() => {
    const onPopState = () => setPage(initialPage());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("ak_auth_token");

    async function verifyStoredSession() {
      if (!token) {
        localStorage.removeItem("ak_auth_user");
        if (active) {
          setSession(null);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success === false) {
          throw new Error(payload.message || "Session invalide.");
        }

        const user = payload.data?.user || payload.data;
        const nextSession = sessionFromUser(user);
        localStorage.setItem("ak_auth_user", JSON.stringify(nextSession));
        if (active) {
          setSession(nextSession);
          if (["fr", "en", "pt"].includes(user?.preferred_language)) {
            setLanguage(user.preferred_language as Language);
          }
        }
      } catch {
        localStorage.removeItem("ak_auth_token");
        localStorage.removeItem("ak_auth_user");
        if (active) setSession(null);
      } finally {
        if (active) setAuthChecked(true);
      }
    }

    verifyStoredSession();
    return () => {
      active = false;
    };
  }, [setLanguage]);

  useEffect(() => {
    localStorage.setItem("ak_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let active = true;

    fetch(`${API_URL}/settings`)
      .then((response) => response.json())
      .then((payload) => {
        const rate = Number(payload?.data?.exchange_rate_eur_to_aoa || 0);
        const settings = Array.isArray(payload?.data?.settings)
          ? payload.data.settings
          : [];
        const display = settings.find(
          (item: { setting_key?: string }) =>
            item.setting_key === "display_currency",
        )?.setting_value;
        if (active && rate > 0) setExchangeRate(rate);
        if (active && display) {
          const currency = String(display);
          localStorage.setItem("ak_display_currency", currency);
          setDisplayCurrency(currency);
        }
      })
      .catch(() => {
        if (active) setExchangeRate(1000);
      });

    return () => {
      active = false;
    };
  }, []);

  function go(next: string) {
    const path = pageToPath(next);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function login(credentials: AuthFormPayload) {
    setAuthMessage("");
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Identifiants incorrects.");
    }

    const user = payload.data?.user;
    const role = normalizeRole(user?.role);
    const nextSession = sessionFromUser(user, credentials.email);

    localStorage.setItem("ak_auth_token", payload.data?.token || "");
    localStorage.setItem("ak_auth_user", JSON.stringify(nextSession));
    setSession(nextSession);
    setAuthMessage("Connexion effectuee.");
    if (["fr", "en", "pt"].includes(user?.preferred_language)) {
      setLanguage(user.preferred_language as Language);
    }
    go(consumePostAuthRedirect(role) || dashboardPageForRole(role));
  }

  async function registerAccount(data: AuthFormPayload) {
    setAuthMessage("");
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone || null,
        preferred_language: language,
      }),
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Creation du compte impossible.");
    }
    localStorage.setItem("ak_auth_token", payload.data?.token || "");
    const nextSession = {
      role: "user",
      name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      email: data.email,
    } satisfies Session;
    localStorage.setItem("ak_auth_user", JSON.stringify(nextSession));
    setSession(nextSession);
    setAuthMessage("Compte cree.");
    go(consumePostAuthRedirect("user") || "user-dashboard");
  }

  function logout() {
    localStorage.removeItem("ak_auth_token");
    localStorage.removeItem("ak_auth_user");
    setSession(null);
    setAuthMessage("");
    go("home");
  }

  const commitCart = useCallback((updater: (current: Product[]) => Product[]) => {
    setCart((current) => {
      const next = updater(current);
      localStorage.setItem("ak_cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const addToCart = useCallback(
    (product: Product, requestedMode?: "purchase" | "rental") => {
      const rentalAvailable = Boolean(
        product.rentPrice && product.rentPrice > 0,
      );
      if (requestedMode === "rental" && rentalAvailable) {
        setCartChoiceProduct(product);
        return;
      }

      if (!requestedMode && product.price > 0 && rentalAvailable) {
        setCartChoiceProduct(product);
        return;
      }

      commitCart((current) => [
        ...current,
        {
          ...product,
          cartId: cartLineId(product, "purchase"),
          cartMode: "purchase",
          unitPrice: product.price,
        },
      ]);
    },
    [commitCart],
  );

  const addRentalToCart = useCallback(
    (product: Product, rentalDays: number, rentalStartDate: string) => {
      const days = Math.max(Number(rentalDays || 1), 1);
      const rentalPricePerDay = Number(product.rentPrice || 0);
      const rentalDeposit = Number(product.rentalDeposit || 0);
      const rentalEndDate = addDaysInputValue(rentalStartDate, days);

      commitCart((current) => [
        ...current,
        {
          ...product,
          cartId: cartLineId(product, "rental"),
          cartMode: "rental",
          price: rentalPricePerDay * days + rentalDeposit,
          rentalDays: days,
          rentalStartDate,
          rentalEndDate,
          rentalDeposit,
          rentalPricePerDay,
          unitPrice: rentalPricePerDay,
        },
      ]);
      setCartChoiceProduct(null);
    },
    [commitCart],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem("ak_cart");
  }, []);

  const isWorkspaceArea =
    page.startsWith("user-") ||
    page.startsWith("admin-") ||
    page.startsWith("cashier-");

  useEffect(() => {
    if (isWorkspaceArea) return;
    const applyTranslations = () => {
      translatePublicDom(document.body, language, t);
    };
    const timer = window.setTimeout(applyTranslations, 0);
    const observer = new MutationObserver(() => {
      window.setTimeout(applyTranslations, 0);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [isWorkspaceArea, language, page, t]);

  const shell = isWorkspaceArea ? (
    renderPage()
  ) : (
    <>
      <TopNav
        cartCount={cart.length}
        go={go}
        language={language}
        page={page}
        session={session}
        setLanguage={setLanguage}
      />
      {renderPage()}
      <Footer displayCurrency={displayCurrency} go={go} />
    </>
  );

  return (
    <main>
      {shell}
      {cartChoiceProduct && (
        <CartChoiceModal
          onAddPurchase={() => {
            addToCart(
              { ...cartChoiceProduct, rentPrice: undefined },
              "purchase",
            );
            setCartChoiceProduct(null);
          }}
          onAddRental={(days, startDate) =>
            addRentalToCart(cartChoiceProduct, days, startDate)
          }
          onClose={() => setCartChoiceProduct(null)}
          product={cartChoiceProduct}
        />
      )}
    </main>
  );

  function renderPage() {
    const requiredRole = workspaceRoleForPage(page);
    const isAuthenticated = authChecked && Boolean(session && hasStoredAuthToken());

    if (requiredRole && !authChecked) {
      return (
        <AccessNotice message="Verification de votre session..." title="Acces securise" />
      );
    }

    if (requiredRole && !isAuthenticated) {
      return (
        <AccessRedirect
          go={go}
          message="Connectez-vous pour acceder a cet espace securise."
          target="login"
        />
      );
    }

    if (requiredRole && session && session.role !== requiredRole) {
      const requiredLabel =
        requiredRole === "admin"
          ? "administrateur"
          : requiredRole === "cashier"
            ? "caissier"
            : "client";
      return (
        <AccessRedirect
          go={go}
          message={`Vous n'etes pas connecte en tant que ${requiredLabel}. Vous allez etre redirige vers votre espace.`}
          target={dashboardPageForRole(session.role)}
        />
      );
    }

    if ((page === "login" || page === "register") && isAuthenticated) {
      return (
        <AccessRedirect
          go={go}
          message="Vous etes deja connecte."
          target={dashboardPageForRole(session?.role || "user")}
        />
      );
    }

    if (page.startsWith("product-")) {
      return (
        <ProductDetailsPage
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
          go={go}
          key={page}
          onAddToCart={addToCart}
          slug={page.replace("product-", "")}
        />
      );
    }

    if (
      page === "shop" ||
      page === "new" ||
      page === "second-hand" ||
      page === "rental"
    ) {
      return (
        <ShopPage
          go={go}
          initialMode={page}
          key={page}
          onAddToCart={addToCart}
          exchangeRate={exchangeRate}
        />
      );
    }

    if (page === "cart") {
      return (
        <CartPage
          cart={cart}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
          go={go}
          remove={(cartId) =>
            commitCart((current) =>
              current.filter(
                (item) => (item.cartId || String(item.id)) !== cartId,
              ),
            )
          }
        />
      );
    }

    if (page === "checkout") {
      return (
        <CheckoutPage
          cart={cart}
          clearCart={clearCart}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
          go={go}
          setSession={setSession}
        />
      );
    }

    if (page === "order-success") {
      return <OrderSuccessPage clearCart={clearCart} go={go} />;
    }

    if (page === "order-failure") {
      return <OrderFailurePage go={go} />;
    }

    if (page === "login") {
      return (
        <AuthPage
          authMessage={authMessage}
          go={go}
          login={login}
          mode="login"
          registerAccount={registerAccount}
        />
      );
    }

    if (page === "register") {
      return (
        <AuthPage
          authMessage={authMessage}
          go={go}
          login={login}
          mode="register"
          registerAccount={registerAccount}
        />
      );
    }

    if (page.startsWith("user-")) {
      return (
        <UserOffice
          go={go}
          language={language}
          logout={logout}
          page={page}
          session={session}
          setLanguage={setLanguage}
          setSession={setSession}
        />
      );
    }

    if (page.startsWith("cashier-")) {
      return (
        <CashierOffice
          go={go}
          language={language}
          logout={logout}
          page={page}
          session={session}
          setLanguage={setLanguage}
          setSession={setSession}
        />
      );
    }

    if (page.startsWith("admin-")) {
      if (page === "admin-orders") {
        return (
          <AdminOrdersPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-products") {
        return (
          <AdminProductsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-categories") {
        return (
          <AdminCategoriesPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-rentals") {
        return (
          <AdminRentalsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-resales") {
        return (
          <AdminResalesPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-second-hand-proposals") {
        return (
          <AdminSecondHandProposalsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-gift-cards") {
        return (
          <AdminGiftCardsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-payments") {
        return (
          <AdminPaymentsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-reviews") {
        return (
          <AdminReviewsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-users" || page === "admin-customers") {
        return (
          <AdminUsersPage
            go={go}
            logout={logout}
            page="admin-users"
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-branches") {
        return (
          <AdminBranchesPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-notifications") {
        return (
          <AdminNotificationsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-settings") {
        return (
          <AdminSettingsPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-important-links") {
        return (
          <AdminImportantLinksPage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
          />
        );
      }

      if (page === "admin-profile") {
        return (
          <AdminProfilePage
            go={go}
            logout={logout}
            page={page}
            sessionEmail={session?.email}
            sessionName={session?.name}
            setSession={setSession}
          />
        );
      }

      return (
        <AdminDashboardPage
          go={go}
          logout={logout}
          page={page}
          sessionEmail={session?.email}
          sessionName={session?.name}
        />
      );
    }

    if (page === "gift-cards") {
      return <GiftCardsPage go={go} />;
    }

    if (page === "faq") {
      return <FaqPage go={go} language={language} />;
    }

    if (page === "contact") {
      return <ContactPage go={go} language={language} />;
    }

    if (page.startsWith("important-link-")) {
      return (
        <ImportantLinkViewer
          go={go}
          slug={page.replace("important-link-", "")}
        />
      );
    }

    return (
      <HomePage
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        go={go}
        onAddToCart={addToCart}
      />
    );
  }
}

function AccessRedirect({
  go,
  message,
  target,
}: {
  go: (page: string) => void;
  message: string;
  target: string;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => go(target), 900);
    return () => window.clearTimeout(timer);
  }, [go, target]);

  return <AccessNotice message={message} title="Redirection en cours" />;
}

function AccessNotice({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <section className="auth-redirect-page">
      <article>
        <p className="eyebrow">Acces securise</p>
        <h1>{title}</h1>
        <p>{message}</p>
      </article>
    </section>
  );
}

type ImportantLinkPublic = {
  id: number;
  title: string;
  slug: string;
  pdf_url: string;
};

function ImportantLinkViewer({
  go,
  slug,
}: {
  go: (page: string) => void;
  slug: string;
}) {
  const { language, t } = useLanguage();
  const text = (value: string) => (language === "fr" ? value : t[value] || value);
  const [link, setLink] = useState<ImportantLinkPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${API_URL}/important-links/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success === false) {
          throw new Error(payload.message || "Document introuvable.");
        }
        setLink(payload.data);
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Document introuvable.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  return (
    <section className="important-link-viewer">
      <button className="details-back-button" onClick={() => go("home")} type="button">
        {text("Retour accueil")}
      </button>
      <div className="important-link-frame">
        <p className="eyebrow">{text("Liens importants")}</p>
        <h1>{link?.title || text("Document public")}</h1>
        {loading ? (
          <div className="shop-message">{text("Chargement du document...")}</div>
        ) : error || !link ? (
          <div className="shop-message error">
            {error || text("Document introuvable.")}
          </div>
        ) : (
          <iframe src={link.pdf_url} title={link.title} />
        )}
      </div>
    </section>
  );
}

function TopNav({
  cartCount,
  go,
  language,
  page,
  session,
  setLanguage,
}: {
  cartCount: number;
  go: (page: string) => void;
  language: Language;
  page: string;
  session: Session | null;
  setLanguage: (language: Language) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const topNavCopy = {
    fr: {
      announcement:
        "Livraison disponible - Retrait en guichet en Angola - FR | EN | PT",
      account: "Connexion",
      menu: "Ouvrir le menu",
      links: [
        ["home", "Accueil"],
        ["second-hand", "Seconde main"],
        ["shop", "Boutique"],
        ["gift-cards", "Carte cadeaux"],
        ["faq", "FAQ"],
        ["contact", "Contact"],
      ],
    },
    en: {
      announcement:
        "Delivery available - Counter pickup in Angola - FR | EN | PT",
      account: "Sign in",
      menu: "Open menu",
      links: [
        ["home", "Home"],
        ["second-hand", "Second hand"],
        ["shop", "Shop"],
        ["gift-cards", "Gift cards"],
        ["faq", "FAQ"],
        ["contact", "Contact"],
      ],
    },
    pt: {
      announcement:
        "Entrega disponivel - Levantamento no balcao em Angola - FR | EN | PT",
      account: "Entrar",
      menu: "Abrir menu",
      links: [
        ["home", "Inicio"],
        ["second-hand", "Segunda mao"],
        ["shop", "Loja"],
        ["gift-cards", "Cartoes presente"],
        ["faq", "FAQ"],
        ["contact", "Contacto"],
      ],
    },
  }[language];
  const languages: Array<{ value: Language; label: string }> = [
    { value: "fr", label: "FR - Francais" },
    { value: "en", label: "EN - English" },
    { value: "pt", label: "PT - Portugues" },
  ];

  return (
    <header className="site-header">
      <div className="announcement-bar" aria-label="Annonce AK Fashion Plus">
        <div>
          <span>{topNavCopy.announcement}</span>
          <span>{topNavCopy.announcement}</span>
          <span>{topNavCopy.announcement}</span>
          <span>
            Livraison disponible • Retrait en guichet en Angola • FR | EN | PT
          </span>
          <span>
            Livraison disponible • Retrait en guichet en Angola • FR | EN | PT
          </span>
          <span>
            Livraison disponible • Retrait en guichet en Angola • FR | EN | PT
          </span>
        </div>
      </div>
      <div className="topbar">
        <a
          className="brand"
          href="/"
          onClick={(event) => handleNav(event, "home", go)}
        >
          <img
            alt="AK Fashion Plus"
            className="brand-logo-image navbar-logo"
            src="/logonavbar.svg"
          />
        </a>
        <button
          aria-expanded={menuOpen}
          aria-label={topNavCopy.menu}
          className="mobile-menu-button"
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          aria-label="Navigation principale"
          className={menuOpen ? "open" : ""}
        >
          {topNavCopy.links.map(([id, label]) => (
            <a
              className={page === id ? "active" : ""}
              href={pageToPath(id)}
              key={id}
              onClick={(event) => {
                handleNav(event, id, go);
                setMenuOpen(false);
              }}
            >
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="top-actions">
          <label className="language-switcher">
            <span className="sr-only">Langue</span>
            <span
              aria-hidden="true"
              className={`flag-icon flag-${language} language-current-flag`}
            />
            <select
              aria-label="Langue"
              onChange={(event) => setLanguage(event.target.value as Language)}
              value={language}
            >
            {languages.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
            </select>
          </label>
          <a
            className="cart-link"
            href="/cart"
            onClick={(event) => handleNav(event, "cart", go)}
          >
            <svg aria-hidden="true" className="cart-svg" viewBox="0 0 24 24">
              <path d="M7 8V7a5 5 0 0 1 10 0v1" />
              <path d="M5.5 8h13l1 12h-15l1-12Z" />
            </svg>
            <strong>{cartCount}</strong>
          </a>
          <button
            className="account-button"
            onClick={() => go(session ? `${session.role}-dashboard` : "login")}
            type="button"
          >
            {session ? session.name.split(" ")[0] : topNavCopy.account}
          </button>
        </div>
      </div>
    </header>
  );
}

function handleNav(
  event: MouseEvent<HTMLAnchorElement>,
  page: string,
  go: (page: string) => void,
) {
  event.preventDefault();
  go(page);
}

function CartChoiceModal({
  onAddPurchase,
  onAddRental,
  onClose,
  product,
}: {
  onAddPurchase: () => void;
  onAddRental: (days: number, startDate: string) => void;
  onClose: () => void;
  product: Product;
}) {
  const [mode, setMode] = useState<"purchase" | "rental">("rental");
  const [rentalDays, setRentalDays] = useState(3);
  const [startDate, setStartDate] = useState(todayInputValue());
  const rentalPrice = Number(product.rentPrice || 0);
  const deposit = Number(product.rentalDeposit || 0);
  const rentalTotal = rentalPrice * rentalDays + deposit;

  return (
    <div className="cart-choice-backdrop" role="presentation">
      <section
        aria-label="Choisir achat ou location"
        className="cart-choice-modal"
      >
        <button
          aria-label="Fermer"
          className="cart-choice-close"
          onClick={onClose}
          type="button"
        >
          x
        </button>
        <p className="eyebrow">Ajouter au panier</p>
        <h2>{product.name}</h2>
        <p>
          Cet article est disponible a l'achat et en location. Choisissez le
          mode souhaite avant de l'ajouter au panier.
        </p>

        <div className="cart-choice-tabs">
          <button
            className={mode === "purchase" ? "active" : ""}
            onClick={() => setMode("purchase")}
            type="button"
          >
            Acheter
            <strong>{eur(product.price)}</strong>
          </button>
          <button
            className={mode === "rental" ? "active" : ""}
            onClick={() => setMode("rental")}
            type="button"
          >
            Louer
            <strong>{eur(rentalPrice)} / jour</strong>
          </button>
        </div>

        {mode === "rental" && (
          <div className="rental-config">
            <label>
              Date de debut
              <input
                min={todayInputValue()}
                onChange={(event) => setStartDate(event.target.value)}
                type="date"
                value={startDate}
              />
            </label>
            <label>
              Nombre de jours
              <input
                min="1"
                onChange={(event) =>
                  setRentalDays(Math.max(Number(event.target.value || 1), 1))
                }
                type="number"
                value={rentalDays}
              />
            </label>
            <div className="rental-total-box">
              <span>
                {rentalDays} jour(s) - retour le{" "}
                {addDaysInputValue(startDate, rentalDays)}
              </span>
              <strong>{eur(rentalTotal)}</strong>
              {deposit > 0 && <small>Depot inclus : {eur(deposit)}</small>}
            </div>
          </div>
        )}

        <div className="cart-choice-actions">
          <button className="ghost" onClick={onClose} type="button">
            Annuler
          </button>
          <button
            onClick={() =>
              mode === "purchase"
                ? onAddPurchase()
                : onAddRental(rentalDays, startDate)
            }
            type="button"
          >
            Ajouter {mode === "purchase" ? "a l'achat" : "en location"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CartPage({
  cart,
  displayCurrency,
  exchangeRate,
  go,
  remove,
}: {
  cart: Product[];
  displayCurrency: string;
  exchangeRate: number;
  go: (page: string) => void;
  remove: (cartId: string) => void;
}) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return (
    <section className="checkout-layout">
      <div className="cart-panel">
        <SectionTitle eyebrow="Panier" title="Votre panier" />
        {cart.map((item) => (
          <div
            className="cart-line"
            key={item.cartId || `${item.id}-${item.name}`}
          >
            <ProductVisual tone={item.slug} />
            <div>
              <strong>{item.name}</strong>
              <small>
                {item.cartMode === "rental"
                  ? `Location - ${item.rentalDays || 1} jour(s), ${eur(
                      item.rentalPricePerDay || item.rentPrice || 0,
                    )} / jour`
                  : "Achat"}
              </small>
              {item.cartMode === "rental" && item.rentalStartDate && (
                <small>
                  Du {item.rentalStartDate} au {item.rentalEndDate}
                </small>
              )}
            </div>
            <span>{eur(item.price)}</span>
            <button
              onClick={() => remove(item.cartId || String(item.id))}
              type="button"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>
      <SummaryPanel
        button="Passer a la caisse"
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        onClick={() => go("checkout")}
        total={total}
      />
    </section>
  );
}

function CheckoutPage({
  cart,
  clearCart,
  displayCurrency,
  exchangeRate,
  go,
  setSession,
}: {
  cart: Product[];
  clearCart: () => void;
  displayCurrency: string;
  exchangeRate: number;
  go: (page: string) => void;
  setSession: (session: Session | null) => void;
}) {
  const [beneficiaryName, setBeneficiaryName] = useState("Ana Kiala");
  const [beneficiaryPhone, setBeneficiaryPhone] = useState("+244 912 345 678");
  const [address, setAddress] = useState("Rua Rainha Ginga, No 23");
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "gift_card">(
    "stripe",
  );
  const [deliveryCountries, setDeliveryCountries] = useState<DeliveryCountry[]>(
    [],
  );
  const [shippingCountryCode, setShippingCountryCode] = useState("AO");
  const [resellToCompany, setResellToCompany] = useState(false);
  const [giftCards, setGiftCards] = useState<CheckoutGiftCard[]>([]);
  const [selectedGiftCardIds, setSelectedGiftCardIds] = useState<number[]>([]);
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const resaleTotal = cart
    .filter((item) => item.cartMode !== "rental")
    .reduce((sum, item) => sum + item.price, 0);
  const shipping =
    fulfillmentType === "delivery" && !resellToCompany
      ? Number(
          deliveryCountries.find(
            (country) => country.country_code === shippingCountryCode,
          )?.delivery_price_eur || 0,
        )
      : 0;
  const grandTotal = total + shipping;
  const giftCardSelection = allocateCheckoutGiftCards(
    giftCards,
    selectedGiftCardIds,
    grandTotal,
  );
  const giftCardPaid = giftCardSelection.paid;
  const remainingDue = giftCardSelection.remaining;

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/settings/delivery-countries`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        const countries = Array.isArray(payload?.data) ? payload.data : [];
        setDeliveryCountries(countries);
        if (countries[0]?.country_code) {
          setShippingCountryCode(countries[0].country_code);
        }
      })
      .catch(() => {
        if (active) setDeliveryCountries([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("ak_auth_token");
    if (!token) {
      setGiftCards([]);
      setSelectedGiftCardIds([]);
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoadingGiftCards(true);
      }
    });
    fetch(`${API_URL}/gift-cards?status=active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        if (payload.success === false) {
          throw new Error(payload.message || "Cartes cadeaux indisponibles.");
        }
        setGiftCards(payload.data || []);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Impossible de charger vos cartes cadeaux.",
        );
      })
      .finally(() => {
        if (active) setLoadingGiftCards(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function toggleGiftCard(cardId: number) {
    setSelectedGiftCardIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  }

  async function resolveCartVariant(item: Product) {
    if (item.variantId) return item.variantId;
    const response = await fetch(`${API_URL}/products/${item.slug}?lang=fr`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false || !payload.data) {
      throw new Error(
        `${item.name} n'est plus disponible. Retirez cet article du panier.`,
      );
    }

    const variantId =
      payload.data.default_variant_id ||
      payload.data.variants?.find(
        (variant: { id: number; status?: string }) =>
          variant.status === "active",
      )?.id ||
      null;

    if (!variantId) {
      throw new Error(
        `${item.name} n'a aucune variante active. Retirez cet article du panier.`,
      );
    }

    return variantId;
  }

  async function submitOrder() {
    setError("");
    if (!cart.length) {
      setError("Votre panier est vide.");
      return;
    }

    const token = localStorage.getItem("ak_auth_token");
    if (!token) {
      setPostAuthRedirect("checkout");
      localStorage.setItem(
        "ak_order_failure",
        "Connectez-vous avant de confirmer la commande.",
      );
      go("login");
      return;
    }

    const payableGiftCardIds =
      paymentMethod === "gift_card" ? selectedGiftCardIds : [];
    if (paymentMethod === "gift_card" && !payableGiftCardIds.length) {
      setError("Selectionnez au moins une carte cadeau ou payez par Stripe.");
      return;
    }

    setSubmitting(true);
    try {
      const checkoutItems = await Promise.all(
        cart.map(async (item) => {
          const variantId = await resolveCartVariant(item);
          return {
            id: item.id,
            item_type: item.cartMode === "rental" ? "rental" : "purchase",
            product_id: item.id,
            product_variant_id: variantId,
            variant_id: variantId,
            rental_deposit_eur: item.rentalDeposit || 0,
            rental_days: item.rentalDays || null,
            rental_end_date: item.rentalEndDate || null,
            rental_price_per_day_eur:
              item.rentalPricePerDay || item.rentPrice || null,
            rental_start_date: item.rentalStartDate || null,
            name: item.name,
            price: item.price,
            quantity: 1,
            unit_price_eur: item.unitPrice || item.price,
          };
        }),
      );

      const orderResponse = await fetch(`${API_URL}/orders/direct-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beneficiary_name: beneficiaryName,
          beneficiary_phone: beneficiaryPhone,
          fulfillment_type: fulfillmentType,
          items: checkoutItems,
          payment_method: paymentMethod,
          resell_to_company: resellToCompany,
          gift_card_ids: payableGiftCardIds,
          shipping_address_line_1: address,
          shipping_country_code: shippingCountryCode,
          shipping_name: beneficiaryName,
          shipping_phone: beneficiaryPhone,
        }),
      });
      const orderPayload = await orderResponse.json();
      if (orderResponse.status === 401) {
        localStorage.removeItem("ak_auth_token");
        localStorage.removeItem("ak_auth_user");
        setSession(null);
        setPostAuthRedirect("checkout");
        go("login");
        return;
      }
      if (!orderResponse.ok || orderPayload.success === false) {
        throw new Error(orderPayload.message || "Commande refusee.");
      }

      const order = orderPayload.data;
      const orderRemainingDue = Math.max(
        Number(order.remaining_due_eur ?? order.total_eur ?? grandTotal),
        0,
      );

      if (orderRemainingDue <= 0 || order.payment_status === "paid") {
        localStorage.setItem(
          "ak_order_success",
          JSON.stringify({
            destination: "user-orders",
            destinationLabel: "Voir mes commandes",
            message: "Commande payee avec vos cartes cadeaux.",
            order_number: order.order_number,
            total_eur: order.total_eur || grandTotal,
          }),
        );
        clearCart();
        go("order-success");
        return;
      }

      {
        const paymentResponse = await fetch(
          `${API_URL}/payments/stripe-checkout-session`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount_eur: orderRemainingDue,
              order_id: order.id,
              purpose: "order",
              description: `Commande ${order.order_number}`,
              success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${window.location.origin}/order-failure?session_id={CHECKOUT_SESSION_ID}`,
            }),
          },
        );
        const paymentPayload = await paymentResponse.json();
        if (paymentResponse.status === 401) {
          localStorage.removeItem("ak_auth_token");
          localStorage.removeItem("ak_auth_user");
          setSession(null);
          setPostAuthRedirect("checkout");
          go("login");
          return;
        }
        if (!paymentResponse.ok || paymentPayload.success === false) {
          throw new Error(paymentPayload.message || "Paiement Stripe refuse.");
        }

        if (!paymentPayload.data?.url) {
          throw new Error("Stripe n'a pas retourne de page de paiement.");
        }

        localStorage.setItem(
          "ak_pending_order",
          JSON.stringify({
            message: "Paiement Stripe en attente de confirmation.",
            order_number: order.order_number,
            total_eur: order.total_eur || grandTotal,
          }),
        );
        window.location.assign(paymentPayload.data.url);
        return;
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Impossible de finaliser la commande.";
      localStorage.setItem("ak_order_failure", message);
      setError(message);
      if (!/indisponible|plus disponible|variante active/i.test(message)) {
        go("order-failure");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="checkout-layout">
      <div className="form-panel">
        <SectionTitle eyebrow="Paiement" title="Informations beneficiaire" />
        <div className="form-grid">
          <input
            onChange={(event) => setBeneficiaryName(event.target.value)}
            placeholder="Nom complet"
            value={beneficiaryName}
          />
          <input
            onChange={(event) => setBeneficiaryPhone(event.target.value)}
            placeholder="Telephone"
            value={beneficiaryPhone}
          />
          <input
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Adresse de livraison"
            value={address}
          />
          <select
            value={fulfillmentType}
            onChange={(event) =>
              setFulfillmentType(event.target.value as "delivery" | "pickup")
            }
          >
            <option value="delivery">Livraison a domicile</option>
            <option value="pickup">Retrait boutique</option>
          </select>
          <select
            disabled={fulfillmentType !== "delivery" || resellToCompany}
            onChange={(event) => setShippingCountryCode(event.target.value)}
            value={shippingCountryCode}
          >
            {deliveryCountries.map((country) => (
              <option key={country.id} value={country.country_code}>
                {country.country_name} - {eur(Number(country.delivery_price_eur || 0))}
              </option>
            ))}
            {!deliveryCountries.length ? (
              <option value="AO">Aucun pays de livraison configure</option>
            ) : null}
          </select>
        </div>
        <label className="resale-option">
          <input
            checked={resellToCompany}
            onChange={(event) => setResellToCompany(event.target.checked)}
            type="checkbox"
          />
          <span>
            Revendre a AK Fashion Plus au guichet et recevoir{" "}
            <strong>
              {secondaryMoney(resaleTotal, exchangeRate, displayCurrency)}
            </strong>
            .
          </span>
        </label>
        <div className="payment-choice">
          <button
            className={paymentMethod === "stripe" ? "active" : ""}
            onClick={() => setPaymentMethod("stripe")}
            type="button"
          >
            Carte bancaire / Stripe
          </button>
          <button
            className={paymentMethod === "gift_card" ? "active" : ""}
            onClick={() => setPaymentMethod("gift_card")}
            type="button"
          >
            Carte cadeau AK
          </button>
        </div>
        {paymentMethod === "gift_card" && (
          <section className="gift-card-payment-panel">
            <div>
              <strong>Selectionnez une ou plusieurs cartes cadeaux</strong>
              <small>
                Le solde disponible sera applique dans l'ordre de selection. Le
                reste eventuel sera paye par Stripe.
              </small>
            </div>
            {loadingGiftCards && (
              <p className="user-muted">Chargement de vos cartes cadeaux...</p>
            )}
            {!loadingGiftCards && giftCards.length === 0 && (
              <div className="user-alert">
                Aucune carte cadeau active n'est disponible sur ce compte.
              </div>
            )}
            {!loadingGiftCards && giftCards.length > 0 && (
              <div className="gift-card-payment-list">
                {giftCards.map((card) => {
                  const available = Number(card.available_balance_eur || 0);
                  const selected = selectedGiftCardIds.includes(card.id);
                  const allocation = giftCardSelection.allocations.find(
                    (item) => item.id === card.id,
                  );
                  return (
                    <button
                      className={selected ? "active" : ""}
                      disabled={available <= 0}
                      key={card.id}
                      onClick={() => toggleGiftCard(card.id)}
                      type="button"
                    >
                      <span>
                        <strong>{card.card_name}</strong>
                        <small>{card.serial_number}</small>
                      </span>
                      <span>
                        <strong>{eur(available)}</strong>
                        <small>
                          {allocation
                            ? `Applique: ${eur(allocation.amount)}`
                            : "Solde disponible"}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {giftCardPaid > 0 && (
              <div className="gift-card-payment-totals">
                <span>Cartes appliquees: {eur(giftCardPaid)}</span>
                <strong>Reste a payer: {eur(remainingDue)}</strong>
              </div>
            )}
          </section>
        )}
        {error && <p className="notice error">{error}</p>}
      </div>
      <SummaryPanel
        button={submitting ? "Traitement..." : "Confirmer la commande"}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        onClick={() => void submitOrder()}
        shipping={shipping}
        total={total}
        giftCardPaid={giftCardPaid}
        remainingDue={remainingDue}
      />
    </section>
  );
}

function SummaryPanel({
  button,
  displayCurrency,
  exchangeRate,
  giftCardPaid = 0,
  onClick,
  remainingDue,
  shipping = 0,
  total,
}: {
  button: string;
  displayCurrency: string;
  exchangeRate: number;
  giftCardPaid?: number;
  onClick: () => void;
  remainingDue?: number;
  shipping?: number;
  total: number;
}) {
  const finalTotal = total + shipping;
  const stripeRemaining = Math.max(
    Number(remainingDue ?? finalTotal) || 0,
    0,
  );
  return (
    <aside className="summary-panel">
      <h2>Resume</h2>
      <div>
        <span>Sous-total</span>
        <strong>{eur(total)}</strong>
      </div>
      {shipping > 0 && (
        <div>
          <span>Livraison</span>
          <strong>{eur(shipping)}</strong>
        </div>
      )}
      <div className="total">
        <span>Total</span>
        <strong>{eur(finalTotal)}</strong>
      </div>
      <small>{secondaryMoney(finalTotal, exchangeRate, displayCurrency)}</small>
      {giftCardPaid > 0 && (
        <>
          <div>
            <span>Cartes cadeaux</span>
            <strong className="summary-deduction">-{eur(giftCardPaid)}</strong>
          </div>
          <div className="total">
            <span>Reste Stripe</span>
            <strong>{eur(stripeRemaining)}</strong>
          </div>
        </>
      )}
      <button onClick={onClick} type="button">
        {button}
      </button>
    </aside>
  );
}

function OrderSuccessPage({
  clearCart,
  go,
}: {
  clearCart: () => void;
  go: (page: string) => void;
}) {
  const stripeSessionId = new URLSearchParams(window.location.search).get(
    "session_id",
  );
  const [status, setStatus] = useState<"checking" | "success" | "failure">(
    stripeSessionId ? "checking" : "success",
  );
  const [message, setMessage] = useState("");
  const [data, setData] = useState<{
    destination?: string;
    destinationLabel?: string;
    message?: string;
    order_number?: string;
    total_eur?: number;
  }>(() => {
    try {
      return JSON.parse(localStorage.getItem("ak_order_success") || "{}") as {
        destination?: string;
        destinationLabel?: string;
        message?: string;
        order_number?: string;
        total_eur?: number;
      };
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!stripeSessionId) return;

    async function verifyStripeSession() {
      const token = localStorage.getItem("ak_auth_token");
      if (!token) {
        throw new Error("Connectez-vous pour verifier le paiement Stripe.");
      }

      const response = await fetch(
        `${API_URL}/payments/stripe-checkout-session/${stripeSessionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Verification Stripe impossible.");
      }

      const paid =
        payload.data?.payment_status === "paid" ||
        payload.data?.payment_intent_status === "succeeded";

      if (!paid) {
        throw new Error("Le paiement Stripe n'a pas encore ete confirme.");
      }

      const pending = JSON.parse(
        localStorage.getItem("ak_pending_order") || "{}",
      ) as {
        destination?: string;
        destinationLabel?: string;
        kind?: string;
        order_number?: string;
        total_eur?: number;
      };
      const isGiftCardPurchase =
        payload.data?.purpose === "gift_card_purchase" ||
        pending.kind === "gift_card_purchase";
      const confirmed = {
        destination: isGiftCardPurchase ? "user-gift-cards" : "user-orders",
        destinationLabel: isGiftCardPurchase
          ? "Voir mes cartes"
          : "Voir mes commandes",
        message: isGiftCardPurchase
          ? "Carte cadeau achetee et paiement Stripe confirme."
          : "Commande confirmee et paiement Stripe reussi.",
        order_number: pending.order_number,
        total_eur: pending.total_eur,
      };
      localStorage.setItem("ak_order_success", JSON.stringify(confirmed));
      localStorage.removeItem("ak_pending_order");
      localStorage.removeItem("ak_order_failure");
      clearCart();
      setData(confirmed);
      setStatus("success");
    }

    verifyStripeSession().catch((verificationError: unknown) => {
      const failureMessage =
        verificationError instanceof Error
          ? verificationError.message
          : "La verification du paiement a echoue.";
      localStorage.setItem("ak_order_failure", failureMessage);
      setMessage(failureMessage);
      setStatus("failure");
    });
  }, [clearCart, stripeSessionId]);

  if (status === "checking") {
    return (
      <section className="order-result-page success">
        <article>
          <span>...</span>
          <p className="eyebrow">Verification du paiement</p>
          <h1>Nous confirmons votre paiement Stripe.</h1>
          <p>La commande sera validee des que Stripe confirme le paiement.</p>
        </article>
      </section>
    );
  }

  if (status === "failure") {
    return (
      <section className="order-result-page failure">
        <article>
          <span>!</span>
          <p className="eyebrow">Paiement non confirme</p>
          <h1>La commande n'a pas encore ete payee.</h1>
          <p>{message}</p>
          <div>
            <button onClick={() => go("checkout")} type="button">
              Revenir au paiement
            </button>
            <button className="ghost" onClick={() => go("cart")} type="button">
              Voir mon panier
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="order-result-page success">
      <article>
        <span>✓</span>
        <p className="eyebrow">Commande confirmee</p>
        <h1>Votre commande est bien enregistree.</h1>
        <p>
          {data.message ||
            "La commande a ete traitee avec succes par AK Fashion Plus."}
        </p>
        {data.order_number && <strong>Reference : {data.order_number}</strong>}
        {data.total_eur ? <small>Total : {eur(data.total_eur)}</small> : null}
        <div>
          <button
            onClick={() => go(data.destination || "user-orders")}
            type="button"
          >
            {data.destinationLabel || "Voir mes commandes"}
          </button>
          <button className="ghost" onClick={() => go("shop")} type="button">
            Continuer mes achats
          </button>
        </div>
      </article>
    </section>
  );
}

function OrderFailurePage({ go }: { go: (page: string) => void }) {
  const cancelledStripeSession = new URLSearchParams(
    window.location.search,
  ).get("session_id");
  const message = cancelledStripeSession
    ? "Le paiement Stripe a ete annule ou refuse. Votre panier est conserve."
    : localStorage.getItem("ak_order_failure") ||
      "La commande n'a pas pu etre finalisee.";

  return (
    <section className="order-result-page failure">
      <article>
        <span>!</span>
        <p className="eyebrow">Commande echouee</p>
        <h1>La commande n'a pas abouti.</h1>
        <p>{message}</p>
        <div>
          <button onClick={() => go("checkout")} type="button">
            Revenir au paiement
          </button>
          <button className="ghost" onClick={() => go("cart")} type="button">
            Voir mon panier
          </button>
        </div>
      </article>
    </section>
  );
}

function AuthPage({
  authMessage,
  go,
  login,
  mode,
  registerAccount,
}: {
  authMessage: string;
  go: (page: string) => void;
  login: (credentials: AuthFormPayload) => Promise<void>;
  mode: "login" | "register";
  registerAccount: (data: AuthFormPayload) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalMessage("");

    if (!email.trim() || !password) {
      setLocalMessage("Entrez votre email et votre mot de passe.");
      return;
    }
    if (!isLogin && (!firstName.trim() || !lastName.trim())) {
      setLocalMessage("Entrez votre prenom et votre nom.");
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email: email.trim(), password });
      } else {
        await registerAccount({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
          phone: phone.trim(),
        });
      }
    } catch (error) {
      setLocalMessage(
        error instanceof Error
          ? error.message
          : "Impossible de finaliser cette action.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <div className="auth-logo-mark">AK</div>
        <p className="eyebrow">AK Fashion Plus</p>
        <h1>{isLogin ? "Connexion a votre compte" : "Creer un compte AK"}</h1>
        <p>
          Achetez, louez, revendez et suivez vos commandes depuis un espace
          unique.
        </p>
        <div className="auth-benefits">
          <span>Paiement securise</span>
          <span>Retrait en guichet</span>
          <span>Cartes cadeaux</span>
        </div>
      </div>
      <form className="auth-form auth-card" onSubmit={submitAuth}>
        <div className="auth-form-head">
          <p className="eyebrow">{isLogin ? "Bienvenue" : "Inscription"}</p>
          <h2>{isLogin ? "Accedez a votre espace" : "Ouvrez votre compte"}</h2>
          <span>
            {isLogin
              ? "Utilisez les identifiants de votre compte AK Fashion Plus."
              : "Creez un compte client pour acheter, louer et suivre vos commandes."}
          </span>
        </div>
        {!isLogin && (
          <div className="auth-two-columns">
            <label>
              Prenom
              <input
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Ana"
                value={firstName}
              />
            </label>
            <label>
              Nom
              <input
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Kiala"
                value={lastName}
              />
            </label>
          </div>
        )}
        <label>
          Email
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="exemple@email.com"
            type="email"
            value={email}
          />
        </label>
        <input
          autoComplete={isLogin ? "current-password" : "new-password"}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mot de passe"
          type="password"
          value={password}
        />
        {!isLogin && (
          <label>
            Telephone
            <input
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+244 912 345 678"
              value={phone}
            />
          </label>
        )}
        <button disabled={submitting} type="submit">
          {submitting
            ? "Verification..."
            : isLogin
              ? "Se connecter"
              : "Creer mon compte"}
        </button>
        <div className="auth-secondary-actions">
          <button
            onClick={() => go(isLogin ? "register" : "login")}
            type="button"
          >
            {isLogin ? "Creer un compte" : "J'ai deja un compte"}
          </button>
          {isLogin && <button type="button">Mot de passe oublie ?</button>}
        </div>
        {(localMessage || authMessage) && (
          <p className={localMessage ? "notice error" : "notice"}>
            {localMessage || authMessage}
          </p>
        )}
      </form>
    </section>
  );
}

function UserOffice({
  go,
  language,
  logout,
  page,
  session,
  setLanguage,
  setSession,
}: {
  go: (page: string) => void;
  language: Language;
  logout: () => void;
  page: string;
  session: Session | null;
  setLanguage: (language: Language) => void;
  setSession: (session: Session) => void;
}) {
  let content = <UserDashboardPage go={go} />;

  if (page === "user-orders") {
    content = <UserOrdersPage go={go} />;
  } else if (page === "user-order-details") {
    content = <UserOrderDetailsPage go={go} />;
  } else if (page === "user-rentals") {
    content = <UserRentalsPage go={go} />;
  } else if (page === "user-gift-cards") {
    content = <UserGiftCardsPage go={go} />;
  } else if (page === "user-favorites") {
    content = <UserFavoritesPage go={go} />;
  } else if (page === "user-notifications") {
    content = <UserNotificationsPage />;
  } else if (page === "user-profile") {
    content = <UserProfilePage setSession={setSession} />;
  }

  return (
    <UserLayout
      currentPage={page}
      go={go}
      language={language}
      onLogout={logout}
      session={session}
      setLanguage={setLanguage}
    >
      {content}
    </UserLayout>
  );
}

function CashierOffice({
  go,
  language,
  logout,
  page,
  session,
  setLanguage,
  setSession,
}: {
  go: (page: string) => void;
  language: Language;
  logout: () => void;
  page: string;
  session: Session | null;
  setLanguage: (language: Language) => void;
  setSession: (session: Session) => void;
}) {
  if (page === "cashier-pickups") {
    return (
      <CashierPickupsPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-pickup-details") {
    return (
      <CashierPickupDetailsPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-rentals") {
    return (
      <CashierRentalsPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-resales") {
    return (
      <CashierResalesPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-second-hand-proposals") {
    return (
      <CashierSecondHandProposalsPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-resale-details") {
    return (
      <CashierResaleDetailsPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-history") {
    return (
      <CashierHistoryPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-notifications") {
    return (
      <CashierNotificationsPage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
      />
    );
  }

  if (page === "cashier-profile") {
    return (
      <CashierProfilePage
        go={go}
        language={language}
        logout={logout}
        page={page}
        sessionEmail={session?.email}
        sessionName={session?.name}
        setLanguage={setLanguage}
        setSession={setSession}
      />
    );
  }

  return (
    <CashierDashboardPage
      go={go}
      language={language}
      logout={logout}
      page={page}
      sessionEmail={session?.email}
      sessionName={session?.name}
      setLanguage={setLanguage}
    />
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
    </div>
  );
}

function ProductVisual({ tone }: { tone: string }) {
  return (
    <div className={`visual visual-${Math.abs(hashCode(tone)) % 5}`}>
      <span />
      <i />
    </div>
  );
}

function hashCode(value: string) {
  return value.split("").reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function Footer({
  displayCurrency,
  go,
}: {
  displayCurrency: string;
  go: (page: string) => void;
}) {
  const { language, t } = useLanguage();
  const text = (value: string) => (language === "fr" ? value : t[value] || value);
  const [importantLinks, setImportantLinks] = useState<ImportantLinkPublic[]>(
    [],
  );
  const columns = [
    {
      title: "Shopping",
      links: [
        ["shop", "Boutique"],
        ["rental", "Location"],
        ["second-hand", "Seconde main"],
        ["gift-cards", "Cartes cadeaux"],
      ],
    },
    {
      title: "Espaces",
      links: [
        ["user-dashboard", "Compte client"],
        ["cashier-dashboard", "Guichet"],
        ["admin-dashboard", "Administration"],
        ["login", "Connexion"],
      ],
    },
    {
      title: "Services",
      links: [
        ["cart", "Panier"],
        ["checkout", "Checkout"],
        ["user-orders", "Commandes"],
        ["user-gift-cards", "Mes cartes"],
      ],
    },
  ];

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/important-links`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success !== false) setImportantLinks(payload.data || []);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <footer className="site-footer">
      <section className="footer-brand">
        <a
          className="brand footer-logo"
          href="/"
          onClick={(event) => handleNav(event, "home", go)}
        >
          <img
            alt="AK Fashion Plus"
            className="brand-logo-image footer-logo-image"
            src="/footerlogo.svg"
          />
        </a>
        <p>
          {text(
            "Mode premium pour acheter, louer, revendre et offrir des cartes cadeaux avec une experience professionnelle sur web, mobile et guichet.",
          )}
        </p>
        <div className="footer-badges">
          <span>EUR / {displayCurrency || "AOA"}</span>
          <span>Stripe</span>
          <span>{text("Retrait boutique")}</span>
        </div>
      </section>
      {columns.map((column) => (
        <section className="footer-column" key={column.title}>
          <h2>{text(column.title)}</h2>
          {column.links.map(([id, label]) => (
            <a
              href={pageToPath(id)}
              key={id}
              onClick={(event) => handleNav(event, id, go)}
            >
              {text(label)}
            </a>
          ))}
        </section>
      ))}
      {importantLinks.length > 0 ? (
        <section className="footer-column">
          <h2>{text("Liens importants")}</h2>
          {importantLinks.map((link) => (
            <a
              href={`/important-links/${link.slug}`}
              key={link.id}
              onClick={(event) =>
                handleNav(event, `important-link-${link.slug}`, go)
              }
            >
              {link.title}
            </a>
          ))}
        </section>
      ) : null}
      <section className="footer-bottom">
        <span>AK Fashion Plus</span>
        <span>{text("Votre style, notre engagement.")}</span>
      </section>
    </footer>
  );
}

export default App;
