import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../services/favorite.service";

type FavoriteRow = {
  id?: number;
  product_id?: number;
  product?: {
    id?: number;
  };
};

type FavoritesContextValue = {
  favoriteIds: number[];
  count: number;
  loading: boolean;
  isFavorite: (productId?: number | null) => boolean;
  refreshFavorites: () => Promise<void>;
  toggleFavorite: (productId: number) => Promise<void>;
};

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

function normalizeFavoriteIds(rows: FavoriteRow[]) {
  return Array.from(
    new Set(
      rows
        .map((row) => Number(row.product_id ?? row.product?.id ?? row.id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    setLoading(true);
    try {
      const rows = await getFavorites<FavoriteRow[]>();
      setFavoriteIds(normalizeFavoriteIds(Array.isArray(rows) ? rows : []));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (productId?: number | null) =>
      Boolean(productId && favoriteIds.includes(Number(productId))),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (productId: number) => {
      if (!user) {
        throw new Error("Connectez-vous pour gerer vos favoris.");
      }

      const id = Number(productId);
      if (!Number.isFinite(id) || id <= 0) return;

      const alreadyFavorite = favoriteIds.includes(id);
      const previousIds = favoriteIds;
      setFavoriteIds((current) =>
        alreadyFavorite
          ? current.filter((item) => item !== id)
          : Array.from(new Set([...current, id])),
      );

      try {
        if (alreadyFavorite) {
          await removeFavorite(id);
        } else {
          await addFavorite(id);
        }
      } catch (error) {
        setFavoriteIds(previousIds);
        throw error;
      }
    },
    [favoriteIds, user],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      count: favoriteIds.length,
      loading,
      isFavorite,
      refreshFavorites,
      toggleFavorite,
    }),
    [favoriteIds, isFavorite, loading, refreshFavorites, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
