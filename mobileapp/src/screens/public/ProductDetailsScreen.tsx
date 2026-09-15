import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { theme } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { get, post } from "../../services/api";
import { absoluteImageUrl } from "../../utils/images";

type ProductSummary = {
  id: number;
  slug: string;
  name: string;
};

type ProductImageRow = {
  id: number;
  image_url?: string | null;
  alt_text?: string | null;
  is_primary?: boolean | number;
};

type ProductVariant = {
  id: number;
  size?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  sku?: string | null;
  stock_quantity?: number | string | null;
};

type ProductReview = {
  rating?: number | string | null;
  title?: string | null;
  comment?: string | null;
  first_name?: string | null;
  created_at?: string | null;
};

type ProductDetails = ProductSummary & {
  description?: string | null;
  category_name?: string | null;
  condition_type?: string | null;
  sale_enabled?: boolean | number;
  rental_enabled?: boolean | number;
  sale_price_eur?: number | string | null;
  sale_price_aoa?: number | string | null;
  rental_price_per_day_eur?: number | string | null;
  rental_deposit_eur?: number | string | null;
  image_url?: string | null;
  average_rating?: number | string | null;
  total_reviews?: number | string | null;
  variants?: ProductVariant[];
  images?: ProductImageRow[];
  reviews?: ProductReview[];
};

type SettingsPayload = {
  settings?: Array<{ setting_key: string; setting_value: string | null }> | Record<string, string | number | null>;
  exchange_rate_eur_to_aoa?: number | string | null;
};

type Props = {
  slug?: string;
  onBack?: () => void;
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function flag(value: boolean | number | null | undefined) {
  return value === true || value === 1;
}

function formatEur(value: number, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function settingValue(settings: SettingsPayload["settings"], key: string) {
  if (!settings) return undefined;
  if (Array.isArray(settings)) {
    return settings.find((item) => item.setting_key === key)?.setting_value || undefined;
  }
  const value = settings[key];
  return value === null || value === undefined ? undefined : String(value);
}

function formatSecondary(value: number, label: string, locale = "fr-FR") {
  return `${Math.round(value).toLocaleString(locale)} ${label}`;
}

function galleryFor(product: ProductDetails) {
  const images = product.images?.filter((image) => image.image_url) || [];
  if (images.length) return images;
  if (product.image_url) {
    return [{ id: product.id, image_url: product.image_url, is_primary: 1 }];
  }
  return [];
}

function ProductVisual({
  product,
  image,
}: {
  product: ProductDetails;
  image?: ProductImageRow;
}) {
  const uri = absoluteImageUrl(image?.image_url || product.image_url);
  if (uri) {
    return <Image source={{ uri }} style={styles.mainImage} />;
  }
  return (
    <View style={styles.mainImagePlaceholder}>
      <Text style={styles.mainImageText}>{product.name}</Text>
    </View>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={styles.star}>
          {star <= rounded ? "★" : "☆"}
        </Text>
      ))}
    </View>
  );
}

export default function ProductDetailsScreen({ slug, onBack }: Props) {
  const { locale, t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const galleryRef = useRef<ScrollView | null>(null);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [settings, setSettings] = useState<SettingsPayload>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [rentalDays, setRentalDays] = useState(2);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [purchaseAdded, setPurchaseAdded] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function resolveSlug() {
      if (slug) return slug;
      const products = await get<ProductSummary[]>("/products?limit=1");
      return products[0]?.slug;
    }

    async function load() {
      setLoading(true);
      setError("");
      try {
        const resolvedSlug = await resolveSlug();
        if (!resolvedSlug) {
          throw new Error(t("productDetails.noActiveProduct"));
        }
        const [settingsResult, productResult] = await Promise.all([
          get<SettingsPayload>("/settings"),
          get<ProductDetails>(`/products/${resolvedSlug}`),
        ]);

        if (!mounted) return;
        setSettings(settingsResult);
        setProduct(productResult);
        setSelectedImageIndex(0);
        setSelectedVariantId(productResult.variants?.[0]?.id || null);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : t("productDetails.loadError"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [slug, t]);

  const currencyLabel =
    settingValue(settings.settings, "secondary_currency_label") ||
    settingValue(settings.settings, "currency_secondary") ||
    settingValue(settings.settings, "aoa_currency_label") ||
    "AOA";

  const gallery = useMemo(() => (product ? galleryFor(product) : []), [product]);
  const selectedImage = gallery[selectedImageIndex];
  const mediaWidth = windowWidth;
  const selectedVariant = product?.variants?.find((variant) => variant.id === selectedVariantId);
  const rating = numeric(product?.average_rating);
  const salePrice = numeric(product?.sale_price_eur);
  const secondaryPrice = numeric(product?.sale_price_aoa);
  const rentalPrice = numeric(product?.rental_price_per_day_eur);
  const deposit = numeric(product?.rental_deposit_eur);
  const rentalTotal = rentalPrice * rentalDays + deposit;

  const addCurrentToCart = (itemType: "purchase" | "rental") => {
    if (!product) return;
    const rentalStart = new Date();
    const rentalEnd = new Date();
    rentalEnd.setDate(rentalStart.getDate() + rentalDays);
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image_url: selectedImage?.image_url || product.image_url || null,
      variant_id: selectedVariant?.id || null,
      sku: selectedVariant?.sku || null,
      size: selectedVariant?.size || null,
      color: selectedVariant?.color_name || null,
      item_type: itemType,
      quantity: 1,
      unit_price_eur: itemType === "rental" ? rentalPrice : salePrice,
      unit_price_secondary: itemType === "rental" ? 0 : secondaryPrice,
      rental_days: itemType === "rental" ? rentalDays : null,
      rental_price_per_day_eur: itemType === "rental" ? rentalPrice : null,
      rental_deposit_eur: itemType === "rental" ? deposit : null,
      rental_start_date: itemType === "rental" ? rentalStart.toISOString().slice(0, 10) : null,
      rental_end_date: itemType === "rental" ? rentalEnd.toISOString().slice(0, 10) : null,
    });
  };

  const handleFavorite = async () => {
    if (!product) return;
    setFavoriteMessage("");
    try {
      await toggleFavorite(product.id);
    } catch (favoriteError) {
      setFavoriteMessage(
        favoriteError instanceof Error
          ? favoriteError.message
          : t("productDetails.favoriteError"),
      );
    }
  };

  const handleGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!mediaWidth) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / mediaWidth);
    setSelectedImageIndex(Math.max(0, Math.min(nextIndex, gallery.length - 1)));
  };

  const selectGalleryImage = (index: number) => {
    setSelectedImageIndex(index);
    galleryRef.current?.scrollTo({ x: index * mediaWidth, animated: true });
  };

  const handlePurchase = () => {
    addCurrentToCart("purchase");
    setPurchaseAdded(true);
    setTimeout(() => setPurchaseAdded(false), 1400);
  };

  const handleRental = () => {
    addCurrentToCart("rental");
    setRentalModalOpen(false);
  };

  const submitReview = async () => {
    if (!product || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewMessage("");
    try {
      await post("/reviews", {
        product_id: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || null,
        comment: reviewComment.trim() || null,
      });
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      setReviewMessage(t("productDetails.reviewSuccess"));
    } catch (submitError) {
      setReviewMessage(
        submitError instanceof Error
          ? submitError.message
          : t("productDetails.reviewError"),
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>{t("productDetails.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>{t("productDetails.unavailable")}</Text>
          <Text style={styles.centerText}>{error || t("productDetails.noProductData")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" backgroundColor={theme.colors.paper} />
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.mediaPanel}>
            {gallery.length ? (
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleGalleryScroll}
                scrollEventThrottle={16}
              >
                {gallery.map((image, index) => (
                  <View key={`${image.id}-${index}`} style={{ width: mediaWidth }}>
                    <ProductVisual product={product} image={image} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ProductVisual product={product} image={selectedImage} />
            )}
            <View style={styles.topButtons}>
              <TouchableOpacity style={styles.roundButton} onPress={onBack}>
                <Text style={styles.roundButtonText}>‹</Text>
              </TouchableOpacity>
              <View style={styles.rightButtons}>
                <TouchableOpacity
                  style={[
                    styles.roundButton,
                    isFavorite(product.id) ? styles.roundButtonActive : null,
                  ]}
                  onPress={handleFavorite}
                >
                  <Text
                    style={[
                      styles.roundButtonText,
                      isFavorite(product.id) ? styles.roundButtonTextActive : null,
                    ]}
                  >
                    {isFavorite(product.id) ? "♥" : "♡"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.roundButton}>
                  <Text style={styles.roundButtonText}>↗</Text>
                </TouchableOpacity>
              </View>
            </View>
            {gallery.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailRow}
              >
                {gallery.map((image, index) => (
                  <TouchableOpacity
                    key={`${image.id}-${index}`}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index ? styles.thumbnailActive : null,
                    ]}
                    onPress={() => selectGalleryImage(index)}
                  >
                    <Image source={{ uri: absoluteImageUrl(image.image_url) }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            {gallery.length > 1 ? (
              <View style={styles.galleryDots}>
                {gallery.map((image, index) => (
                  <View
                    key={`dot-${image.id}-${index}`}
                    style={[
                      styles.galleryDot,
                      selectedImageIndex === index ? styles.galleryDotActive : null,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.category}>{product.category_name || t("productDetails.catalogue")}</Text>
            <Text style={styles.title}>{product.name}</Text>
            <View style={styles.ratingRow}>
              <RatingStars rating={rating} />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} ({numeric(product.total_reviews)})
              </Text>
            </View>
            {product.description ? (
              <Text style={styles.description}>{product.description}</Text>
            ) : null}

            <View style={styles.priceBox}>
              <Text style={styles.price}>{formatEur(salePrice, locale)}</Text>
              <Text style={styles.secondaryPrice}>
                {formatSecondary(secondaryPrice, currencyLabel, locale)}
              </Text>
              {flag(product.rental_enabled) && rentalPrice > 0 ? (
                <Text style={styles.rentalInfo}>
                  {t("productDetails.rentalLine", { amount: formatEur(rentalPrice, locale) })}
                </Text>
              ) : null}
              {deposit > 0 ? (
                <Text style={styles.deposit}>
                  {t("productDetails.depositLine", { amount: formatEur(deposit, locale) })}
                </Text>
              ) : null}
            </View>

            {product.variants?.length ? (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t("productDetails.sizesColors")}</Text>
                <View style={styles.variantGrid}>
                  {product.variants.map((variant) => {
                    const active = selectedVariantId === variant.id;
                    return (
                      <TouchableOpacity
                        key={variant.id}
                        style={[styles.variantCard, active ? styles.variantCardActive : null]}
                        onPress={() => setSelectedVariantId(variant.id)}
                      >
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: variant.color_hex || "#071846" },
                          ]}
                        />
                        <View style={styles.variantTextBlock}>
                          <Text style={styles.variantSize}>{variant.size || "-"}</Text>
                          <Text style={styles.variantColor}>
                            {variant.color_name || t("productDetails.color")}
                          </Text>
                          <Text style={styles.variantStock}>
                            {t("productDetails.stock")} {numeric(variant.stock_quantity)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.block}>
              <Text style={styles.blockTitle}>{t("productDetails.mode")}</Text>
              <View style={styles.modeInfoList}>
                {flag(product.sale_enabled) ? (
                  <View style={styles.modeInfoCard}>
                    <Text style={styles.modeInfoTitle}>{t("productDetails.purchaseAvailable")}</Text>
                    <Text style={styles.modeInfoValue}>{formatEur(salePrice, locale)}</Text>
                  </View>
                ) : null}
                {flag(product.rental_enabled) ? (
                  <View style={styles.modeInfoCard}>
                    <Text style={styles.modeInfoTitle}>{t("productDetails.rentalAvailable")}</Text>
                    <Text style={styles.modeInfoValue}>
                      {t("productDetails.rentalLine", { amount: formatEur(rentalPrice, locale) })}
                    </Text>
                    {deposit > 0 ? (
                      <Text style={styles.modeInfoText}>
                        {t("productDetails.depositLine", { amount: formatEur(deposit, locale) })}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
              {favoriteMessage ? (
                <Text style={styles.favoriteMessage}>{favoriteMessage}</Text>
              ) : null}
            </View>

            <View style={styles.infoList}>
              <Text style={styles.infoItem}>{t("productDetails.pickupInfo")}</Text>
              <Text style={styles.infoItem}>{t("productDetails.priceCurrencyInfo")}</Text>
              <Text style={styles.infoItem}>
                {t("productDetails.selectedVariant", {
                  sku: selectedVariant?.sku || t("productDetails.noVariantSelected"),
                })}
              </Text>
            </View>
          </View>

          <View style={styles.reviewsCard}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>{t("productDetails.reviews")}</Text>
              <Text style={styles.reviewsCount}>
                {t("productDetails.publishedReviews", { count: product.reviews?.length || 0 })}
              </Text>
            </View>
            {user ? (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormTitle}>{t("productDetails.reviewFormTitle")}</Text>
                <View style={styles.ratingPicker}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={[
                        styles.ratingPickButton,
                        star <= reviewRating ? styles.ratingPickButtonActive : null,
                      ]}
                      onPress={() => setReviewRating(star)}
                    >
                      <Text
                        style={[
                          styles.ratingPickText,
                          star <= reviewRating ? styles.ratingPickTextActive : null,
                        ]}
                      >
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={reviewTitle}
                  onChangeText={setReviewTitle}
                  placeholder={t("productDetails.reviewTitlePlaceholder")}
                  placeholderTextColor="#8B8478"
                  style={styles.reviewInput}
                />
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder={t("productDetails.reviewCommentPlaceholder")}
                  placeholderTextColor="#8B8478"
                  multiline
                  style={[styles.reviewInput, styles.reviewTextarea]}
                />
                {reviewMessage ? (
                  <Text style={styles.reviewMessage}>{reviewMessage}</Text>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.reviewSubmitButton,
                    reviewSubmitting ? styles.reviewSubmitButtonDisabled : null,
                  ]}
                  disabled={reviewSubmitting}
                  onPress={submitReview}
                >
                  <Text style={styles.reviewSubmitText}>
                    {reviewSubmitting ? t("productDetails.reviewSubmitting") : t("productDetails.reviewSubmit")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {product.reviews?.length ? (
              product.reviews.map((review, index) => (
                <View key={`${review.created_at}-${index}`} style={styles.reviewItem}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewAuthor}>{review.first_name || t("productDetails.customer")}</Text>
                    <RatingStars rating={numeric(review.rating)} />
                  </View>
                  {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Text style={styles.emptyReviewsText}>
                  {t("productDetails.emptyReviews")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          {flag(product.sale_enabled) ? (
            <TouchableOpacity
              style={[
                styles.buyButton,
                purchaseAdded ? styles.buyButtonAdded : null,
              ]}
              onPress={handlePurchase}
            >
              <Text style={styles.buyButtonText}>
                {purchaseAdded ? `✓ ${t("productDetails.addedToCart")}` : t("productDetails.buy")}
              </Text>
            </TouchableOpacity>
          ) : null}
          {flag(product.rental_enabled) ? (
            <TouchableOpacity style={styles.rentButton} onPress={() => setRentalModalOpen(true)}>
              <Text style={styles.rentButtonText}>{t("productDetails.rent")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Modal transparent visible={rentalModalOpen} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.rentalModal}>
              <Text style={styles.modalEyebrow}>{t("productDetails.rentalModalEyebrow")}</Text>
              <Text style={styles.modalTitle}>{product.name}</Text>
              <Text style={styles.modalText}>
                {t("productDetails.rentalModalText")}
              </Text>
              <View style={styles.rentalDaysBox}>
                <Text style={styles.rentalDaysLabel}>{t("productDetails.rentalDaysLabel")}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => setRentalDays((value) => Math.max(1, value - 1))}
                  >
                    <Text style={styles.stepperText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{rentalDays}</Text>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => setRentalDays((value) => value + 1)}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.rentalTotal}>
                  {t("productDetails.rentalMultiplier", {
                    days: rentalDays,
                    amount: formatEur(rentalPrice, locale),
                  })}
                </Text>
                {deposit > 0 ? (
                  <Text style={styles.rentalTotal}>
                    {t("productDetails.depositLine", { amount: formatEur(deposit, locale) })}
                  </Text>
                ) : null}
                <Text style={styles.rentalModalTotal}>
                  {t("productDetails.rentalTotal", { amount: formatEur(rentalTotal, locale) })}
                </Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setRentalModalOpen(false)}
                >
                  <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmButton} onPress={handleRental}>
                  <Text style={styles.modalConfirmText}>{t("productDetails.addToCart")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.soft,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0,
  },
  content: {
    gap: 14,
    paddingBottom: 96,
  },
  mediaPanel: {
    minHeight: 430,
    backgroundColor: "#E5D9CA",
  },
  mainImage: {
    width: "100%",
    height: 430,
    resizeMode: "cover",
  },
  mainImagePlaceholder: {
    width: "100%",
    height: 430,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D9D9D9",
    padding: 30,
  },
  mainImageText: {
    color: "#969696",
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
  },
  topButtons: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rightButtons: {
    flexDirection: "row",
    gap: 8,
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  roundButtonText: {
    color: "#071846",
    fontSize: 22,
    fontWeight: "900",
  },
  roundButtonActive: {
    backgroundColor: "#071846",
  },
  roundButtonTextActive: {
    color: theme.colors.gold,
  },
  thumbnailRow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    gap: 8,
  },
  thumbnail: {
    width: 62,
    height: 74,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "#EEE",
  },
  thumbnailActive: {
    borderColor: theme.colors.gold,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  galleryDots: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 96,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  galleryDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  galleryDotActive: {
    width: 18,
    backgroundColor: theme.colors.gold,
  },
  detailCard: {
    marginHorizontal: 12,
    marginTop: -6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 16,
    gap: 13,
  },
  category: {
    color: "#B07800",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#071846",
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "900",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: "#FFF8E7",
    padding: 10,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  star: {
    color: "#D9A114",
    fontSize: 15,
    fontWeight: "900",
  },
  ratingText: {
    color: "#071846",
    fontWeight: "900",
  },
  description: {
    color: "#5F564B",
    lineHeight: 21,
  },
  priceBox: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.gold,
    backgroundColor: "#FFF9EA",
    padding: 14,
    gap: 4,
  },
  price: {
    color: "#071846",
    fontSize: 28,
    fontWeight: "900",
  },
  secondaryPrice: {
    color: "#6B665A",
    fontStyle: "italic",
    fontWeight: "700",
  },
  rentalInfo: {
    color: "#4B463B",
    fontWeight: "800",
  },
  deposit: {
    color: "#6B665A",
  },
  block: {
    gap: 10,
  },
  blockTitle: {
    color: "#071846",
    fontSize: 16,
    fontWeight: "900",
  },
  variantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  variantCard: {
    width: "48%",
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    padding: 10,
  },
  variantCardActive: {
    borderColor: "#071846",
    backgroundColor: "#F7FAFF",
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  variantTextBlock: {
    flex: 1,
  },
  variantSize: {
    color: "#071846",
    fontWeight: "900",
  },
  variantColor: {
    color: "#6B665A",
    fontSize: 12,
  },
  variantStock: {
    color: "#007C32",
    fontSize: 11,
    fontWeight: "900",
  },
  modeInfoList: {
    gap: 10,
  },
  modeInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 4,
  },
  modeInfoTitle: {
    color: "#6B665A",
    fontWeight: "900",
  },
  modeInfoValue: {
    color: "#071846",
    fontSize: 16,
    fontWeight: "900",
  },
  modeInfoText: {
    color: "#6B665A",
    fontSize: 12,
    fontWeight: "800",
  },
  favoriteMessage: {
    color: "#9A1B1B",
    fontWeight: "800",
  },
  rentalDaysBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFF8E7",
    padding: 12,
    gap: 10,
  },
  rentalDaysLabel: {
    color: "#071846",
    fontWeight: "900",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  stepperButton: {
    width: 40,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  stepperText: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  stepperValue: {
    minWidth: 42,
    textAlign: "center",
    color: "#071846",
    fontWeight: "900",
  },
  rentalTotal: {
    color: "#071846",
    fontWeight: "900",
  },
  rentalModalTotal: {
    color: "#071846",
    fontSize: 18,
    fontWeight: "900",
  },
  infoList: {
    borderRadius: 14,
    backgroundColor: "#F8F4EA",
    padding: 12,
    gap: 6,
  },
  infoItem: {
    color: "#5F564B",
    lineHeight: 19,
  },
  reviewsCard: {
    marginHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 16,
    gap: 12,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  reviewsTitle: {
    color: "#071846",
    fontSize: 20,
    fontWeight: "900",
  },
  reviewsCount: {
    color: "#6B665A",
    fontWeight: "800",
  },
  reviewForm: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: 12,
    gap: 10,
  },
  reviewFormTitle: {
    color: "#071846",
    fontSize: 16,
    fontWeight: "900",
  },
  ratingPicker: {
    flexDirection: "row",
    gap: 8,
  },
  ratingPickButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
  },
  ratingPickButtonActive: {
    backgroundColor: "#FFF4C7",
    borderColor: theme.colors.gold,
  },
  ratingPickText: {
    color: "#AFA798",
    fontSize: 18,
    fontWeight: "900",
  },
  ratingPickTextActive: {
    color: "#D9A114",
  },
  reviewInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFDF8",
    color: "#071846",
    paddingHorizontal: 12,
    fontWeight: "700",
  },
  reviewTextarea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  reviewMessage: {
    color: "#7A5A00",
    fontWeight: "800",
    lineHeight: 19,
  },
  reviewSubmitButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#071846",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewSubmitButtonDisabled: {
    opacity: 0.6,
  },
  reviewSubmitText: {
    color: "#FFF",
    fontWeight: "900",
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: 12,
    gap: 6,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewAuthor: {
    color: "#071846",
    fontWeight: "900",
  },
  reviewTitle: {
    color: "#071846",
    fontWeight: "900",
  },
  reviewComment: {
    color: "#5F564B",
    lineHeight: 20,
  },
  emptyReviews: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DCCBA9",
    backgroundColor: "#FFFDF8",
    padding: 14,
  },
  emptyReviewsText: {
    color: "#6B665A",
    fontWeight: "800",
  },
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  buyButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#071846",
    paddingVertical: 13,
  },
  buyButtonAdded: {
    backgroundColor: "#087A39",
  },
  buyButtonText: {
    color: "#FFF",
    fontWeight: "900",
  },
  rentButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: theme.colors.gold,
    paddingVertical: 13,
  },
  rentButtonText: {
    color: "#071846",
    fontWeight: "900",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.soft,
    padding: 24,
    gap: 8,
  },
  centerTitle: {
    color: "#071846",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  centerText: {
    color: "#6B665A",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 24, 70, 0.48)",
    padding: 18,
  },
  rentalModal: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 16,
    gap: 12,
  },
  modalEyebrow: {
    color: "#B07800",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  modalTitle: {
    color: "#071846",
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
  },
  modalText: {
    color: "#5F564B",
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF8",
  },
  modalCancelText: {
    color: "#071846",
    fontWeight: "900",
  },
  modalConfirmButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071846",
  },
  modalConfirmText: {
    color: "#FFF",
    fontWeight: "900",
  },
});
