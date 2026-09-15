import fr from "../locales/fr.js";
import en from "../locales/en.js";
import pt from "../locales/pt.js";
const dictionaries = { fr, en, pt };
export function translate(lang = "fr", key, fallback = key) {
  return dictionaries[lang]?.[key] || dictionaries.fr[key] || fallback;
}
export default translate;
