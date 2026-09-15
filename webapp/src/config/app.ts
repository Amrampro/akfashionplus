const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    "VITE_API_URL est obligatoire. Ajoutez cette variable dans webapp/.env.",
  );
}

export const appConfig = {
  name: "AK Fashion Plus",
  apiUrl,
};
