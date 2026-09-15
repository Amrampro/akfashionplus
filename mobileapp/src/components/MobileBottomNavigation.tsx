import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../config/theme";
import { useLanguage } from "../hooks/useLanguage";

export type MobileTab = "home" | "products" | "sell" | "cart" | "favorites" | "account";

type Props = {
  activeTab: MobileTab;
  cartCount?: number;
  favoritesCount?: number;
  onChange: (tab: MobileTab) => void;
};

const tabs: Array<{ id: MobileTab; labelKey: string }> = [
  { id: "home", labelKey: "tabs.home" },
  { id: "products", labelKey: "tabs.products" },
  { id: "sell", labelKey: "tabs.sell" },
  { id: "cart", labelKey: "tabs.cart" },
  { id: "favorites", labelKey: "tabs.favorites" },
  { id: "account", labelKey: "tabs.account" },
];

function TabIcon({ tab, active }: { tab: MobileTab; active: boolean }) {
  const tint = active ? theme.colors.gold : "#071846";

  if (tab === "home") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.homeRoof, { borderBottomColor: tint }]} />
        <View style={[styles.homeBase, { borderColor: tint }]} />
      </View>
    );
  }

  if (tab === "products") {
    return (
      <View style={styles.gridIcon}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.gridSquare, { backgroundColor: tint }]} />
        ))}
      </View>
    );
  }

  if (tab === "cart") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.cartBox, { borderColor: tint }]} />
        <View style={styles.cartWheels}>
          <View style={[styles.cartWheel, { backgroundColor: tint }]} />
          <View style={[styles.cartWheel, { backgroundColor: tint }]} />
        </View>
      </View>
    );
  }

  if (tab === "sell") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.sellBag, { borderColor: tint }]} />
        <View style={[styles.sellHandle, { borderColor: tint }]} />
      </View>
    );
  }

  if (tab === "favorites") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.heartLeft, { backgroundColor: tint }]} />
        <View style={[styles.heartRight, { backgroundColor: tint }]} />
        <View style={[styles.heartTip, { backgroundColor: tint }]} />
      </View>
    );
  }

  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.userHead, { borderColor: tint }]} />
      <View style={[styles.userBody, { borderColor: tint }]} />
    </View>
  );
}

export default function MobileBottomNavigation({
  activeTab,
  cartCount = 0,
  favoritesCount = 0,
  onChange,
}: Props) {
  const { t } = useLanguage();

  return (
    <View style={styles.bottomBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badgeCount =
          tab.id === "cart"
            ? cartCount
            : tab.id === "favorites"
              ? favoritesCount
              : undefined;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={styles.bottomItem}
            activeOpacity={0.82}
          >
            <View style={[styles.bottomIcon, isActive ? styles.bottomIconActive : null]}>
              <TabIcon tab={tab.id} active={isActive} />
              {badgeCount !== undefined ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? "99+" : String(badgeCount)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.bottomLabel, isActive ? styles.bottomLabelActive : null]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: "#FFF",
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  bottomItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  bottomIcon: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4EDDF",
  },
  bottomIconActive: {
    backgroundColor: "#071846",
  },
  bottomLabel: {
    color: "#625B50",
    fontSize: 11,
    fontWeight: "900",
  },
  bottomLabelActive: {
    color: "#071846",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#D51F2A",
    borderWidth: 2,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  iconCanvas: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  homeBase: {
    width: 14,
    height: 12,
    borderWidth: 3,
    borderTopWidth: 0,
  },
  gridIcon: {
    width: 22,
    height: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  gridSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  sellBag: {
    position: "absolute",
    bottom: 2,
    width: 17,
    height: 15,
    borderWidth: 3,
    borderRadius: 3,
  },
  sellHandle: {
    position: "absolute",
    top: 2,
    width: 10,
    height: 9,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cartBox: {
    width: 18,
    height: 12,
    borderWidth: 3,
    borderRadius: 3,
    transform: [{ rotate: "-6deg" }],
  },
  cartWheels: {
    width: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cartWheel: {
    width: 4,
    height: 4,
    borderRadius: 999,
  },
  heartLeft: {
    position: "absolute",
    top: 4,
    left: 5,
    width: 11,
    height: 15,
    borderRadius: 8,
    transform: [{ rotate: "-42deg" }],
  },
  heartRight: {
    position: "absolute",
    top: 4,
    right: 5,
    width: 11,
    height: 15,
    borderRadius: 8,
    transform: [{ rotate: "42deg" }],
  },
  heartTip: {
    position: "absolute",
    top: 10,
    width: 12,
    height: 12,
    transform: [{ rotate: "45deg" }],
  },
  userHead: {
    width: 10,
    height: 10,
    borderWidth: 3,
    borderRadius: 999,
  },
  userBody: {
    width: 18,
    height: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginTop: 2,
  },
});
