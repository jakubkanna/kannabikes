const BLOCKED_TAG_NAMES = new Set(["script", "style", "iframe", "object", "embed", "template"]);
const ALLOWED_TAG_NAMES = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "u",
  "ul",
]);
const ALLOWED_ATTRIBUTES: Partial<Record<string, string[]>> = {
  a: ["href", "title"],
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeHref(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (
    trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("#") ||
    trimmedValue.startsWith("?")
  ) {
    return true;
  }

  try {
    const url = new URL(trimmedValue, "https://kannabikes.local");
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeNode(node: Node) {
  if (node.nodeType === Node.COMMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  if (BLOCKED_TAG_NAMES.has(tagName)) {
    element.remove();
    return;
  }

  Array.from(element.childNodes).forEach(sanitizeNode);

  if (!ALLOWED_TAG_NAMES.has(tagName)) {
    const fragment = element.ownerDocument.createDocumentFragment();

    while (element.firstChild) {
      fragment.append(element.firstChild);
    }

    element.replaceWith(fragment);
    return;
  }

  const allowedAttributes = new Set(ALLOWED_ATTRIBUTES[tagName] ?? []);

  Array.from(element.attributes).forEach((attribute) => {
    const attributeName = attribute.name.toLowerCase();

    if (attributeName.startsWith("on") || attributeName === "style") {
      element.removeAttribute(attribute.name);
      return;
    }

    if (!allowedAttributes.has(attributeName)) {
      element.removeAttribute(attribute.name);
      return;
    }

    if (tagName === "a" && attributeName === "href" && !isSafeHref(attribute.value)) {
      element.removeAttribute(attribute.name);
    }
  });

  if (tagName === "a" && element.hasAttribute("href")) {
    element.setAttribute("rel", "nofollow ugc noreferrer");
  }
}

export function sanitizeUserHtml(input: string) {
  if (!input) {
    return "";
  }

  if (typeof DOMParser === "undefined") {
    return escapeHtml(input);
  }

  const document = new DOMParser().parseFromString(input, "text/html");
  Array.from(document.body.childNodes).forEach(sanitizeNode);

  return document.body.innerHTML;
}
