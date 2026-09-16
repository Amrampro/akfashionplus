import type { Language } from "../types";

type TextMap = Record<string, string>;

const textOriginals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();

function shouldSkipElement(element: Element) {
  return Boolean(element.closest("[data-no-translate], [data-dynamic-text]"));
}

function isDynamicText(value: string) {
  return /^\d+$/.test(value.trim());
}

function translateValue(value: string, language: Language, dictionary: TextMap) {
  if (language === "fr") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  const normalized = trimmed.replace(/\s+/g, " ");
  const translated = dictionary[trimmed] || dictionary[normalized];
  if (!translated) return value;
  return value.replace(trimmed, translated);
}

export function translatePublicDom(
  root: ParentNode,
  language: Language,
  dictionary: TextMap,
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (isDynamicText(node.textContent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  textNodes.forEach((node) => {
    const original = textOriginals.get(node) || node.textContent || "";
    textOriginals.set(node, original);
    node.textContent = translateValue(original, language, dictionary);
  });

  root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach(
    (element) => {
      if (shouldSkipElement(element)) return;
      const originals = attrOriginals.get(element) || {};
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        const current = element.getAttribute(attribute);
        if (!current) return;
        const original = originals[attribute] || current;
        originals[attribute] = original;
        element.setAttribute(
          attribute,
          translateValue(original, language, dictionary),
        );
      });
      attrOriginals.set(element, originals);
    },
  );
}
