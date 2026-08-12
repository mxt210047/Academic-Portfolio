import { el } from "../utils/dom.js";
import { getState } from "../state/store.js";

export function renderToasts(host) {
  const { toasts } = getState();
  host.replaceChildren(
    ...toasts.map((t) => el(`<div class="toast ${t.type}" role="status">${escapeHtml(t.message)}</div>`))
  );
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
