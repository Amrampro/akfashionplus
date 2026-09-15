api/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.js
│   │   └── stripe.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── address.controller.js
│   │   ├── category.controller.js
│   │   ├── product.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── giftCard.controller.js
│   │   ├── rental.controller.js
│   │   ├── resale.controller.js
│   │   ├── branch.controller.js
│   │   ├── review.controller.js
│   │   ├── secondHandProposal.controller.js
│   │   ├── favorite.controller.js
│   │   ├── notification.controller.js
│   │   ├── setting.controller.js
│   │   ├── dashboard.controller.js
│   │   └── stripeWebhook.controller.js
│   │   ├── cashier.controller.js
│   │   └── audit.controller.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── category.model.js
│   │   ├── product.model.js
│   │   ├── cart.model.js
│   │   ├── order.model.js
│   │   ├── payment.model.js
│   │   ├── giftCard.model.js
│   │   ├── rental.model.js
│   │   ├── resale.model.js
│   │   ├── branch.model.js
│   │   ├── review.model.js
│   │   ├── secondHandProposal.model.js
│   │   ├── favorite.model.js
│   │   ├── notification.model.js
│   │   ├── setting.model.js
│   │   └── dashboard.model.js
│   │   ├── address.model.js
│   │   └── audit.model.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── address.routes.js
│   │   ├── category.routes.js
│   │   ├── product.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── giftCard.routes.js
│   │   ├── rental.routes.js
│   │   ├── resale.routes.js
│   │   ├── branch.routes.js
│   │   ├── review.routes.js
│   │   ├── secondHandProposal.routes.js
│   │   ├── favorite.routes.js
│   │   ├── notification.routes.js
│   │   ├── setting.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── stripeWebhook.routes.js
│   │   ├── audit.routes.js
│   │   └── index.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── language.middleware.js
│   │   ├── upload.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── locales/
│   │   ├── fr.js
│   │   ├── en.js
│   │   └── pt.js
│   │
│   ├── services/
│   │   ├── stripe.service.js
│   │   ├── giftCard.service.js
│   │   ├── inventory.service.js
│   │   ├── notification.service.js
│   │   ├── audit.service.js
│   │   └── email.service.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── reference.js
│   │   ├── currency.js
│   │   ├── bankData.js
│   │   ├── translate.js
│   │   └── apiResponse.js
│   │
│   ├── app.js
│   └── server.js
│
├── scripts/
│   └── createAdmin.js
│
├── migrations/
│   ├── 20260828_delivery_countries.sql
│   ├── 20260829_referrals.sql
│   └── 20260831_second_hand_proposals.sql
│
├── uploads/
│   ├── products/
│   ├── avatars/
│   ├── second-hand-proposals/
│   └── reviews/
│
├── database.sql
├── .env
├── .env.example
├── .gitignore
├── package.json
└── structure.md
