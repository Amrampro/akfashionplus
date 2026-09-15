import AsyncStorage from "@react-native-async-storage/async-storage";

const keyPrefix = "akfashionplus:";

function storageKey(key: string) {
  return `${keyPrefix}${key}`;
}

export const storage = {
  get: (key: string) => AsyncStorage.getItem(storageKey(key)),
  set: (key: string, value: string) =>
    AsyncStorage.setItem(storageKey(key), value),
  remove: (key: string) => AsyncStorage.removeItem(storageKey(key)),
};
