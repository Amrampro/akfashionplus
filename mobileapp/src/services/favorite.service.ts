import { del, get, post } from "./api";
import { endpoints } from "./apiEndpoints";

export const getFavorites = <T = unknown>() => get<T>(endpoints.favorites);

export const addFavorite = (id: number) => post(`${endpoints.favorites}/${id}`);

export const removeFavorite = (id: number) => del(`${endpoints.favorites}/${id}`);
