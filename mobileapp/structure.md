mobileapp/
│
├── assets/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppButton.tsx
│   │   │   ├── AppInput.tsx
│   │   │   ├── AppSelect.tsx
│   │   │   ├── AppModal.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ScreenHeader.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   │
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── ProductPrice.tsx
│   │   │   ├── ProductVariantSelector.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   ├── RentalSelector.tsx
│   │   │   └── ProductReviews.tsx
│   │   │
│   │   ├── cart/
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   │
│   │   ├── checkout/
│   │   │   ├── CheckoutSummary.tsx
│   │   │   ├── DeliverySelector.tsx
│   │   │   ├── PickupSelector.tsx
│   │   │   ├── BeneficiaryForm.tsx
│   │   │   ├── GiftCardPayment.tsx
│   │   │   ├── StripePayment.tsx
│   │   │   └── ResellToCompanyOption.tsx
│   │   │
│   │   ├── giftCard/
│   │   │   ├── GiftCardCard.tsx
│   │   │   ├── GiftCardBalance.tsx
│   │   │   ├── GiftCardPurchaseForm.tsx
│   │   │   └── GiftCardTransactions.tsx
│   │   │
│   │   ├── order/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatus.tsx
│   │   │   └── OrderSummary.tsx
│   │   │
│   │   ├── rental/
│   │   │   ├── RentalCard.tsx
│   │   │   ├── RentalStatus.tsx
│   │   │   └── RentalCalendar.tsx
│   │   │
│   │   ├── cashier/
│   │   │   ├── PickupCard.tsx
│   │   │   ├── PayoutCard.tsx
│   │   │   └── CashierStatCard.tsx
│   │   │
│   │   └── admin/
│   │       ├── DashboardCard.tsx
│   │       ├── StatCard.tsx
│   │       └── DataList.tsx
│   │
│   ├── screens/
│   │   ├── public/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ShopScreen.tsx
│   │   │   ├── NewProductsScreen.tsx
│   │   │   ├── SecondHandScreen.tsx
│   │   │   ├── RentalScreen.tsx
│   │   │   ├── ProductDetailsScreen.tsx
│   │   │   ├── GiftCardsScreen.tsx
│   │   │   ├── CartScreen.tsx
│   │   │   ├── CheckoutScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   │
│   │   ├── user/
│   │   │   ├── UserDashboardScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── SecondHandSalesScreen.tsx
│   │   │   ├── SecondHandProposalFormScreen.tsx
│   │   │   ├── SecondHandProposalPhotosScreen.tsx
│   │   │   ├── SecondHandProposalPriceScreen.tsx
│   │   │   ├── SecondHandProposalDetailsScreen.tsx
│   │   │   ├── AddressesScreen.tsx
│   │   │   ├── OrdersScreen.tsx
│   │   │   ├── OrderDetailsScreen.tsx
│   │   │   ├── RentalsScreen.tsx
│   │   │   ├── ResalesScreen.tsx
│   │   │   ├── MyGiftCardsScreen.tsx
│   │   │   ├── GiftCardDetailsScreen.tsx
│   │   │   ├── FavoritesScreen.tsx
│   │   │   └── NotificationsScreen.tsx
│   │   │
│   │   ├── cashier/
│   │   │   ├── CashierDashboardScreen.tsx
│   │   │   ├── PickupsScreen.tsx
│   │   │   ├── PickupDetailsScreen.tsx
│   │   │   ├── ResalePayoutsScreen.tsx
│   │   │   ├── ResalePayoutDetailsScreen.tsx
│   │   │   ├── RentalsScreen.tsx
│   │   │   └── CashierHistoryScreen.tsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboardScreen.tsx
│   │       ├── SecondHandProposalsScreen.tsx
│   │       ├── SecondHandProposalAdminDetailsScreen.tsx
│   │       ├── UsersScreen.tsx
│   │       ├── CashiersScreen.tsx
│   │       ├── BranchesScreen.tsx
│   │       ├── CategoriesScreen.tsx
│   │       ├── ProductsScreen.tsx
│   │       ├── ProductFormScreen.tsx
│   │       ├── OrdersScreen.tsx
│   │       ├── OrderDetailsScreen.tsx
│   │       ├── RentalsScreen.tsx
│   │       ├── ResalesScreen.tsx
│   │       ├── GiftCardTypesScreen.tsx
│   │       ├── GiftCardsScreen.tsx
│   │       ├── GiftCardDetailsScreen.tsx
│   │       ├── ReviewsScreen.tsx
│   │       ├── ExchangeRateScreen.tsx
│   │       ├── SettingsScreen.tsx
│   │       └── AuditLogsScreen.tsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── PublicNavigator.tsx
│   │   ├── UserNavigator.tsx
│   │   ├── CashierNavigator.tsx
│   │   └── AdminNavigator.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── apiEndpoints.ts
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── category.service.ts
│   │   ├── product.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── giftCard.service.ts
│   │   ├── rental.service.ts
│   │   ├── resale.service.ts
│   │   ├── secondHandProposal.service.ts
│   │   ├── branch.service.ts
│   │   ├── review.service.ts
│   │   ├── favorite.service.ts
│   │   ├── notification.service.ts
│   │   ├── setting.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── address.service.ts
│   │   ├── cashier.service.ts
│   │   └── audit.service.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── LanguageContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useLanguage.ts
│   │   └── useCurrency.ts
│   │
│   ├── locales/
│   │   ├── fr.ts
│   │   ├── en.ts
│   │   └── pt.ts
│   │
│   ├── config/
│   │   ├── theme.ts
│   │   ├── app.ts
│   │   └── stripe.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── utils/
│       ├── currency.ts
│       ├── date.ts
│       ├── storage.ts
│       └── helpers.ts
│
├── App.tsx
├── app.json
├── eas.json
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── structure.md
