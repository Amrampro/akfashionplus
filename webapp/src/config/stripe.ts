const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "VITE_STRIPE_PUBLISHABLE_KEY est obligatoire. Ajoutez cette variable dans webapp/.env.",
  );
}

export const stripeConfig = {
  publishableKey,
};
