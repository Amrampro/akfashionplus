webapp/
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   ├── UserLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   └── CashierLayout.tsx
│   │   │
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── ProductPrice.tsx
│   │   │   ├── ProductVariantSelector.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   ├── RentalSelector.tsx
│   │   │   └── ProductReviews.tsx
│   │   │
│   │   ├── cart/
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── CartDrawer.tsx
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
│   │   ├── admin/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── DashboardCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── DataTable.tsx
│   │   │
│   │   └── cashier/
│   │       ├── CashierSidebar.tsx
│   │       ├── PickupCard.tsx
│   │       └── PayoutCard.tsx
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ShopPage.tsx
│   │   │   ├── NewProductsPage.tsx
│   │   │   ├── SecondHandPage.tsx
│   │   │   ├── RentalPage.tsx
│   │   │   ├── ProductDetailsPage.tsx
│   │   │   ├── GiftCardsPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   │
│   │   ├── user/
│   │   │   ├── UserDashboardPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── AddressesPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── OrderDetailsPage.tsx
│   │   │   ├── RentalsPage.tsx
│   │   │   ├── ResalesPage.tsx
│   │   │   ├── MyGiftCardsPage.tsx
│   │   │   ├── GiftCardDetailsPage.tsx
│   │   │   ├── FavoritesPage.tsx
│   │   │   └── NotificationsPage.tsx
│   │   │
│   │   ├── cashier/
│   │   │   ├── CashierDashboardPage.tsx
│   │   │   ├── PickupsPage.tsx
│   │   │   ├── PickupDetailsPage.tsx
│   │   │   ├── ResalePayoutsPage.tsx
│   │   │   ├── ResalePayoutDetailsPage.tsx
│   │   │   ├── SecondHandProposalsPage.tsx
│   │   │   ├── RentalsPage.tsx
│   │   │   └── CashierHistoryPage.tsx
│   │   │
│   │   ├── shared/
│   │   │   └── SecondHandProposalsWorkspace.tsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboardPage.tsx
│   │       ├── UsersPage.tsx
│   │       ├── CashiersPage.tsx
│   │       ├── BranchesPage.tsx
│   │       ├── CategoriesPage.tsx
│   │       ├── ProductsPage.tsx
│   │       ├── ProductFormPage.tsx
│   │       ├── OrdersPage.tsx
│   │       ├── OrderDetailsPage.tsx
│   │       ├── RentalsPage.tsx
│   │       ├── ResalesPage.tsx
│   │       ├── SecondHandProposalsPage.tsx
│   │       ├── GiftCardTypesPage.tsx
│   │       ├── GiftCardsPage.tsx
│   │       ├── GiftCardDetailsPage.tsx
│   │       ├── ReviewsPage.tsx
│   │       ├── ExchangeRatePage.tsx
│   │       ├── SettingsPage.tsx
│   │       └── AuditLogsPage.tsx
│   │
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleRoute.tsx
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
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   ├── storage.ts
│   │   └── helpers.ts
│   │
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── structure.md
