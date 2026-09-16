import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import MobileBottomNavigation, {
  MobileTab,
} from "./src/components/MobileBottomNavigation";
import { appConfig } from "./src/config/app";
import { AuthProvider } from "./src/contexts/AuthContext";
import { CartProvider } from "./src/contexts/CartContext";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";
import {
  LanguageProvider,
  normalizeLanguage,
} from "./src/contexts/LanguageContext";
import { useAuth } from "./src/hooks/useAuth";
import { useCart } from "./src/hooks/useCart";
import { useFavorites } from "./src/hooks/useFavorites";
import { useLanguage } from "./src/hooks/useLanguage";
import CategoryScreen from "./src/screens/public/CategoryScreen";
import CartScreen from "./src/screens/public/CartScreen";
import CheckoutScreen from "./src/screens/public/CheckoutScreen";
import PublicGiftCardsScreen from "./src/screens/public/GiftCardsScreen";
import HomeScreen from "./src/screens/public/HomeScreen";
import LoginScreen from "./src/screens/public/LoginScreen";
import OrderSuccessScreen from "./src/screens/public/OrderSuccessScreen";
import PaymentFailScreen from "./src/screens/public/PaymentFailScreen";
import ProductDetailsScreen from "./src/screens/public/ProductDetailsScreen";
import RegisterScreen from "./src/screens/public/RegisterScreen";
import ShopScreen, { type ShopInitialFilters } from "./src/screens/public/ShopScreen";
import SecondHandProposalAdminDetailsScreen from "./src/screens/admin/SecondHandProposalAdminDetailsScreen";
import SecondHandProposalsScreen from "./src/screens/admin/SecondHandProposalsScreen";
import FavoritesScreen from "./src/screens/user/FavoritesScreen";
import MyGiftCardsScreen from "./src/screens/user/MyGiftCardsScreen";
import NotificationsScreen from "./src/screens/user/NotificationsScreen";
import OrderDetailsScreen from "./src/screens/user/OrderDetailsScreen";
import OrdersScreen from "./src/screens/user/OrdersScreen";
import ProfileScreen from "./src/screens/user/ProfileScreen";
import SecondHandProposalDetailsScreen from "./src/screens/user/SecondHandProposalDetailsScreen";
import SecondHandProposalFormScreen from "./src/screens/user/SecondHandProposalFormScreen";
import SecondHandProposalPhotosScreen, {
  type ProposalPhoto,
} from "./src/screens/user/SecondHandProposalPhotosScreen";
import SecondHandProposalPriceScreen from "./src/screens/user/SecondHandProposalPriceScreen";
import SecondHandSalesScreen from "./src/screens/user/SecondHandSalesScreen";
import UserDashboardScreen from "./src/screens/user/UserDashboardScreen";
import type { SecondHandProposalForm } from "./src/types";
import { storage } from "./src/utils/storage";

type Screen =
  | { name: "home" }
  | { name: "shop"; filters?: ShopInitialFilters }
  | { name: "categories" }
  | { name: "product"; slug: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "success"; orderNumber?: string; total?: number }
  | { name: "paymentFail"; orderNumber?: string; message?: string }
  | { name: "account" }
  | { name: "orders" }
  | { name: "orderDetails"; id: number }
  | { name: "profile" }
  | { name: "notifications" }
  | { name: "favorites" }
  | { name: "giftCards" }
  | { name: "publicGiftCards" }
  | { name: "secondHandSales" }
  | { name: "secondHandProposalForm" }
  | { name: "secondHandProposalPhotos"; form: SecondHandProposalForm }
  | { name: "secondHandProposalPrice"; form: SecondHandProposalForm; photos: ProposalPhoto[] }
  | { name: "secondHandProposalDetails"; id: number }
  | { name: "adminSecondHandProposals" }
  | { name: "adminSecondHandProposalDetails"; id: number }
  | { name: "login" }
  | { name: "register" };

function UserLanguageSync() {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    let mounted = true;
    storage
      .get("language")
      .then((savedLanguage) => {
        if (!mounted) return;
        setLanguage(
          savedLanguage
            ? normalizeLanguage(savedLanguage)
            : normalizeLanguage(user?.preferred_language),
        );
      })
      .catch(() => {
        if (mounted) setLanguage(normalizeLanguage(user?.preferred_language));
      });

    return () => {
      mounted = false;
    };
  }, [setLanguage, user?.preferred_language]);

  return null;
}

function AppShell() {
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [afterLoginScreen, setAfterLoginScreen] = useState<Screen | null>(null);
  const [pendingGiftCardTypeId, setPendingGiftCardTypeId] = useState<number | null>(null);

  const activeTab: MobileTab =
    screen.name === "home"
      ? "home"
      : screen.name === "cart" ||
          screen.name === "checkout" ||
          screen.name === "success" ||
          screen.name === "paymentFail"
        ? "cart"
      : screen.name === "favorites"
        ? "favorites"
      : screen.name === "secondHandSales" ||
          screen.name === "secondHandProposalForm" ||
          screen.name === "secondHandProposalPhotos" ||
          screen.name === "secondHandProposalPrice" ||
          screen.name === "secondHandProposalDetails"
        ? "sell"
        : screen.name === "account" ||
            screen.name === "orders" ||
            screen.name === "orderDetails" ||
            screen.name === "profile" ||
            screen.name === "notifications" ||
            screen.name === "giftCards" ||
            screen.name === "adminSecondHandProposals" ||
            screen.name === "adminSecondHandProposalDetails" ||
            screen.name === "login" ||
            screen.name === "register"
          ? "account"
          : "products";

  const handleTabChange = (tab: MobileTab) => {
    if (tab === "home") {
      setScreen({ name: "home" });
      return;
    }

    if (tab === "products") {
      setScreen({ name: "shop" });
      return;
    }

    if (tab === "sell") {
      if (!user) {
        setAfterLoginScreen({ name: "secondHandSales" });
        setScreen({ name: "login" });
        return;
      }
      setScreen({ name: "secondHandSales" });
      return;
    }

    if (tab === "cart") {
      setScreen({ name: "cart" });
      return;
    }

    if (tab === "favorites") {
      setScreen({ name: "favorites" });
      return;
    }

    if (tab === "account") {
      setScreen({ name: "account" });
      return;
    }
  };

  const renderScreen = () => {
    if (screen.name === "cart") {
      return (
        <CartScreen
          onBack={() => setScreen({ name: "home" })}
          onCheckout={() => setScreen({ name: "checkout" })}
        />
      );
    }

    if (screen.name === "checkout") {
      return (
        <CheckoutScreen
          onBack={() => setScreen({ name: "cart" })}
          onSuccess={(order) =>
            setScreen({
              name: "success",
              orderNumber: order.order_number,
              total: order.total_eur,
            })
          }
          onFailure={(failure) =>
            setScreen({
              name: "paymentFail",
              orderNumber: failure.order_number,
              message: failure.message,
            })
          }
        />
      );
    }

    if (screen.name === "paymentFail") {
      return (
        <PaymentFailScreen
          orderNumber={screen.orderNumber}
          message={screen.message}
          onRetry={() => setScreen({ name: "checkout" })}
          onCart={() => setScreen({ name: "cart" })}
        />
      );
    }

    if (screen.name === "success") {
      return (
        <OrderSuccessScreen
          orderNumber={screen.orderNumber}
          total={screen.total}
          onContinue={() => setScreen({ name: "shop" })}
          onHome={() => setScreen({ name: "home" })}
        />
      );
    }

    if (screen.name === "shop") {
      return (
        <ShopScreen
          initialFilters={screen.filters}
          onOpenProduct={(slug) => setScreen({ name: "product", slug })}
        />
      );
    }

    if (screen.name === "categories") {
      return (
        <CategoryScreen
          onBack={() => setScreen({ name: "home" })}
          onOpenCategory={(slug) =>
            setScreen({ name: "shop", filters: { categorySlug: slug } })
          }
        />
      );
    }

    if (screen.name === "product") {
      return (
        <ProductDetailsScreen
          slug={screen.slug}
          onBack={() => setScreen({ name: "shop" })}
        />
      );
    }

    if (screen.name === "account") {
      return (
        <UserDashboardScreen
          onLogin={() => setScreen({ name: "login" })}
          onLogout={() => setScreen({ name: "home" })}
          onOpenShop={() => setScreen({ name: "shop" })}
          onOpenOrders={() => setScreen({ name: "orders" })}
          onOpenOrderDetails={(id) => setScreen({ name: "orderDetails", id })}
          onOpenProfile={() => setScreen({ name: "profile" })}
          onOpenGiftCards={() => setScreen({ name: "giftCards" })}
          onOpenFavorites={() => setScreen({ name: "favorites" })}
          onOpenNotifications={() => setScreen({ name: "notifications" })}
          onOpenAdminSecondHandProposals={() => setScreen({ name: "adminSecondHandProposals" })}
        />
      );
    }

    if (screen.name === "secondHandSales") {
      return (
        <SecondHandSalesScreen
          onLogin={() => {
            setAfterLoginScreen({ name: "secondHandSales" });
            setScreen({ name: "login" });
          }}
          onNew={() => setScreen({ name: "secondHandProposalForm" })}
          onOpen={(id) => setScreen({ name: "secondHandProposalDetails", id })}
        />
      );
    }

    if (screen.name === "secondHandProposalForm") {
      return (
        <SecondHandProposalFormScreen
          onBack={() => setScreen({ name: "secondHandSales" })}
          onContinue={(form) => setScreen({ name: "secondHandProposalPhotos", form })}
        />
      );
    }

    if (screen.name === "secondHandProposalPhotos") {
      return (
        <SecondHandProposalPhotosScreen
          form={screen.form}
          onBack={() => setScreen({ name: "secondHandProposalForm" })}
          onContinue={(photos) => setScreen({ name: "secondHandProposalPrice", form: screen.form, photos })}
        />
      );
    }

    if (screen.name === "secondHandProposalPrice") {
      return (
        <SecondHandProposalPriceScreen
          form={screen.form}
          photos={screen.photos}
          onBack={() => setScreen({ name: "secondHandProposalPhotos", form: screen.form })}
          onDone={(id) => setScreen({ name: "secondHandProposalDetails", id })}
        />
      );
    }

    if (screen.name === "secondHandProposalDetails") {
      return (
        <SecondHandProposalDetailsScreen
          id={screen.id}
          onBack={() => setScreen({ name: "secondHandSales" })}
        />
      );
    }

    if (screen.name === "adminSecondHandProposals") {
      return (
        <SecondHandProposalsScreen
          onBack={() => setScreen({ name: "account" })}
          onOpen={(id) => setScreen({ name: "adminSecondHandProposalDetails", id })}
        />
      );
    }

    if (screen.name === "adminSecondHandProposalDetails") {
      return (
        <SecondHandProposalAdminDetailsScreen
          id={screen.id}
          onBack={() => setScreen({ name: "adminSecondHandProposals" })}
        />
      );
    }

    if (screen.name === "favorites") {
      return (
        <FavoritesScreen
          onBack={() => setScreen({ name: "account" })}
          onLogin={() => setScreen({ name: "login" })}
          onOpenProduct={(slug) => setScreen({ name: "product", slug })}
        />
      );
    }

    if (screen.name === "notifications") {
      return (
        <NotificationsScreen
          onBack={() => setScreen({ name: "account" })}
          onLogin={() => setScreen({ name: "login" })}
        />
      );
    }

    if (screen.name === "orders") {
      return (
        <OrdersScreen
          onBack={() => setScreen({ name: "account" })}
          onLogin={() => setScreen({ name: "login" })}
          onOpenOrder={(id) => setScreen({ name: "orderDetails", id })}
        />
      );
    }

    if (screen.name === "orderDetails") {
      return (
        <OrderDetailsScreen
          orderId={screen.id}
          onBack={() => setScreen({ name: "orders" })}
        />
      );
    }

    if (screen.name === "profile") {
      return (
        <ProfileScreen
          onBack={() => setScreen({ name: "account" })}
          onLogin={() => setScreen({ name: "login" })}
        />
      );
    }

    if (screen.name === "giftCards") {
      return (
        <MyGiftCardsScreen
          onBack={() => setScreen({ name: "account" })}
          onLogin={() => setScreen({ name: "login" })}
          onBuyGiftCard={() => setScreen({ name: "publicGiftCards" })}
          onOpenOrderDetails={(id) => setScreen({ name: "orderDetails", id })}
        />
      );
    }

    if (screen.name === "publicGiftCards") {
      return (
        <PublicGiftCardsScreen
          pendingGiftCardTypeId={pendingGiftCardTypeId}
          onRequireLogin={(giftCardTypeId) => {
            setPendingGiftCardTypeId(giftCardTypeId);
            setAfterLoginScreen({ name: "publicGiftCards" });
            setScreen({ name: "login" });
          }}
          onOpenMyGiftCards={() => {
            setPendingGiftCardTypeId(null);
            setScreen({ name: "giftCards" });
          }}
        />
      );
    }

    if (screen.name === "login") {
      return (
        <LoginScreen
          onSuccess={() => {
            const target = afterLoginScreen || { name: "account" };
            setAfterLoginScreen(null);
            setScreen(target);
          }}
          onRegister={() => setScreen({ name: "register" })}
        />
      );
    }

    if (screen.name === "register") {
      return (
        <RegisterScreen
          onSuccess={() => {
            const target = afterLoginScreen || { name: "account" };
            setAfterLoginScreen(null);
            setScreen(target);
          }}
          onLogin={() => setScreen({ name: "login" })}
        />
      );
    }

    return (
      <HomeScreen
        onOpenCart={() => setScreen({ name: "cart" })}
        onOpenNotifications={() => setScreen({ name: "notifications" })}
        onOpenProfile={() => setScreen({ name: "profile" })}
        onOpenProduct={(slug) => setScreen({ name: "product", slug })}
        onOpenShop={(filters) => setScreen({ name: "shop", filters })}
        onOpenCategories={() => setScreen({ name: "categories" })}
        onOpenGiftCards={() => setScreen({ name: "publicGiftCards" })}
      />
    );
  };

  return (
    <View style={styles.appShell}>
      <View style={styles.screenSlot}>{renderScreen()}</View>
      <MobileBottomNavigation
        activeTab={activeTab}
        cartCount={cartCount}
        favoritesCount={favoritesCount}
        onChange={handleTabChange}
      />
    </View>
  );
}

export default function App() {
  return (
    <StripeProvider
      publishableKey={appConfig.stripePublishableKey}
      merchantIdentifier="merchant.com.akfashionplus.mobile"
      urlScheme="akfashionplus"
    >
      <LanguageProvider>
        <AuthProvider>
          <UserLanguageSync />
          <CartProvider>
            <FavoritesProvider>
              <AppShell />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: "#FFFDF8",
  },
  screenSlot: {
    flex: 1,
  },
});
