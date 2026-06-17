const STORAGE_KEY = "uiVariant";
const LAYOUT_KEY = "builderLayout";
const VALID = new Set(["legacy", "prod"]);
const VALID_LAYOUT = new Set(["horizontal", "sidebar"]);

/** @returns {'legacy' | 'prod'} */
export function resolveUiVariant() {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && VALID.has(stored)) return stored;
    } catch {
      /* ignore */
    }
  }
  const env = import.meta.env.VITE_UI_THEME;
  if (env && VALID.has(env)) return env;
  return "legacy";
}

/** @returns {'horizontal' | 'sidebar'} */
export function resolveBuilderLayout() {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(LAYOUT_KEY);
      if (stored && VALID_LAYOUT.has(stored)) return stored;
    } catch {
      /* ignore */
    }
  }
  return resolveUiVariant() === "prod" ? "sidebar" : "horizontal";
}

export function isProdUi() {
  return resolveUiVariant() === "prod";
}

export function applyUiVariant(variant = resolveUiVariant()) {
  const v = VALID.has(variant) ? variant : "legacy";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-ui", v);
  }
  return v;
}

/** Persist and reload so module-level `ui` facade picks up the new variant. */
export function setUiVariant(variant) {
  const v = VALID.has(variant) ? variant : "legacy";
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
    if (v === "prod") {
      window.localStorage.setItem(LAYOUT_KEY, "sidebar");
    } else {
      window.localStorage.setItem(LAYOUT_KEY, "horizontal");
    }
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export function toggleUiVariant() {
  setUiVariant(resolveUiVariant() === "prod" ? "legacy" : "prod");
}
