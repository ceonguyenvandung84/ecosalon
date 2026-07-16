import sanitizeHtml from "sanitize-html";

const defaultOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "span", "div", "br"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height"],
    a: ["href", "target", "rel"],
    "*": ["style", "class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
};

export function sanitize(dirty: string, options?: sanitizeHtml.IOptions): string {
  return sanitizeHtml(dirty, { ...defaultOptions, ...options });
}

export function sanitizePlain(dirty: string): string {
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} });
}