import { el } from "../utils/dom.js";
import { currentUser } from "../state/store.js";

export function renderHeader(target) {
  const node = el(`
  <header class="app-header">
    <div class="brand-product">I-9 Audit <span class="agent">Agent</span></div>
    <div class="onblick" aria-label="OnBlick">
      <div class="onblick-mark" aria-hidden="true"><span></span><span></span></div>
      <span>OnBlick</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" type="button" title="Help" aria-label="Help">?</button>
      <button class="icon-btn" type="button" title="Notifications" aria-label="Notifications">🔔</button>
      <div class="avatar" title="${currentUser.name}">${currentUser.initials}</div>
    </div>
  </header>`);
  target.replaceChildren(node);
}
