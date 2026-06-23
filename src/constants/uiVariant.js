/** Prod-only UI — legacy variant removed. */

export function resolveUiVariant() {
  return "prod";
}

export function resolveBuilderLayout() {
  return "sidebar";
}

export function isProdUi() {
  return true;
}

export function applyUiVariant() {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-ui", "prod");
  }
  return "prod";
}
