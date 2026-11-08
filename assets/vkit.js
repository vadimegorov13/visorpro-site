/* Shared bits for the design variants (v1.html … v10.html): prices, the mark, icons, the FAQ, and the buttons
   that drive the working panel. Each variant only brings its own layout and look. */
(function () {
  const VP = window.VP;
  const P = VP.pricing;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  VP.mark = (size = 18, bg = '#0b0b0c') => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" style="display:block"><defs><linearGradient id="vk${size}" x1="0" x2="1"><stop offset="0" stop-color="#ff4f9a" stop-opacity="0"/><stop offset=".5" stop-color="#ff6a6a"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="${bg}"/><path d="M6 9h20v2.5C26 17 21.5 21 16 21S6 17 6 11.5z" fill="#000" stroke="#333" stroke-width=".6"/><path d="M7.5 17.5c2.3 2.2 5.2 3.3 8.5 3.3s6.2-1.1 8.5-3.3" fill="none" stroke="url(#vk${size})" stroke-width="1.6" stroke-linecap="round"/></svg>`;

  function fill(root = document) {
    $$('[data-mark]', root).forEach((e) => { e.innerHTML = VP.mark(+e.dataset.mark || 18); });
    $$('[data-i]', root).forEach((e) => { e.innerHTML = VP.icon(e.dataset.i); });
    $$('[data-price]', root).forEach((e) => { e.textContent = VP.money(P.early); });
    $$('[data-price-was]', root).forEach((e) => { e.textContent = VP.money(P.regular); });
    $$('[data-trial]', root).forEach((e) => { e.textContent = P.trialDays; });
    $$('[data-macs]', root).forEach((e) => { e.textContent = P.macs; });
    $$('[data-faq]', root).forEach((e) => {
      const n = +e.dataset.faq || 6;
      const pick = ['What if my Mac has no notch?', 'Does anything leave my Mac?', 'Is it a subscription?', 'Will it slow my Mac down?', 'Why does it ask for Accessibility?', 'Why isn’t it on the App Store?', 'Can I try it first?', 'Which Macs does it run on?'].slice(0, n);
      e.innerHTML = VP.faq.filter(([q]) => pick.includes(q)).map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('');
    });
  }

  /* data-open-tab="clipboard", data-open-search, data-look-set="liquid", data-acc-set="#0a84ff" anywhere on the page. */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open-tab]');
    if (t) { VP.demo.setTab(t.dataset.openTab); return; }
    if (e.target.closest('[data-open-search]')) { VP.demo.search(e.target.closest('[data-open-search]').dataset.openSearch || ''); return; }
    const l = e.target.closest('[data-look-set]');
    if (l) { $$('[data-look-set]').forEach((b) => b.classList.toggle('on', b.dataset.lookSet === l.dataset.lookSet)); VP.demo.setLook(l.dataset.lookSet); VP.demo.open(); return; }
    const a = e.target.closest('[data-acc-set]');
    if (a) { $$('[data-acc-set]').forEach((b) => b.classList.toggle('on', b.dataset.accSet === a.dataset.accSet)); VP.demo.setAccent(a.dataset.accSet); document.documentElement.style.setProperty('--vk-acc', a.dataset.accSet); VP.demo.open(); }
  });

  /* Opens the panel once by itself shortly after load, so nobody meets an empty notch. */
  function autoOpen(delay = 700, tab) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => { if (!VP.demo.isOpen()) VP.demo.open(tab); }, reduce ? 0 : delay);
  }

  VP.kit = { fill, autoOpen };
  fill();
})();
