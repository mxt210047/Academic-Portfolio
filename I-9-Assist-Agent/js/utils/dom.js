export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export const icons = {
  emptyArt: `<svg class="empty-art float" viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M40 110l30-18 28 20 34-28 36 24" stroke="#c7d2fe" stroke-width="3" fill="none"/>
  <path d="M70 70h70v70H70z" fill="#fff" stroke="#111" stroke-width="2"/>
  <circle cx="105" cy="92" r="12" stroke="#111" stroke-width="2"/>
  <path d="M88 118c6-10 28-10 34 0" stroke="#111" stroke-width="2"/>
  <path d="M84 78h42M84 128h30" stroke="#9ca3af" stroke-width="2"/>
  <circle cx="145" cy="118" r="28" stroke="#111" stroke-width="3"/>
  <path d="M165 138l18 18" stroke="#111" stroke-width="4" stroke-linecap="round"/>
  <path d="M48 88c10-18 28-10 22 8-14 4-26 2-22-8z" fill="#4a6dd9"/>
  <path d="M168 54c12-14 26-10 18 10-12 5-24 2-18-10z" fill="#4a6dd9"/>
  <path d="M188 78c8-2 12 8 4 12-6-2-10-8-4-12z" stroke="#111" stroke-width="1.5"/>
</svg>`,
  confirmArt: `<svg class="confirm-art" viewBox="0 0 200 120" fill="none" aria-hidden="true">
  <rect x="20" y="20" width="50" height="70" rx="4" fill="#e8eefc" stroke="#4a6dd9"/>
  <path d="M30 35h30M30 45h22M30 55h26" stroke="#4a6dd9"/>
  <rect x="80" y="18" width="55" height="75" rx="4" fill="#fff" stroke="#111"/>
  <path d="M92 40h30M92 52h24M92 64h28" stroke="#9ca3af"/>
  <circle cx="150" cy="78" r="18" fill="#4a6dd9" opacity=".15"/>
  <path d="M140 85c4-10 20-10 24 0" stroke="#111" stroke-width="2"/>
  <circle cx="152" cy="68" r="7" stroke="#111" stroke-width="2"/>
  <path d="M120 88h40" stroke="#111" stroke-width="2"/>
</svg>`,
  assistArt: `<svg class="float" width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
  <rect x="88" y="28" width="48" height="64" rx="6" fill="#e8eefc" stroke="#4a6dd9"/>
  <path d="M98 42h28M98 54h20M98 66h24" stroke="#4a6dd9"/>
  <circle cx="126" cy="78" r="8" fill="#4a6dd9"/>
  <path d="M123 78l2.2 2.2 4-4" stroke="#fff" stroke-width="1.6"/>
  <path d="M40 86c8-22 36-22 44 0" stroke="#111" stroke-width="2"/>
  <circle cx="62" cy="58" r="12" stroke="#111" stroke-width="2"/>
  <path d="M78 40l34 48" stroke="#4a6dd9" stroke-width="6" stroke-linecap="round"/>
  <path d="M108 84l8 12" stroke="#111" stroke-width="2"/>
</svg>`,
};
