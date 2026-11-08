/* The landing page around the working panel: prices from data.js, the use cards, the FAQ, and the buttons
   that open the panel from the notch at the top of the page. */
(function () {
  const VP = window.VP;
  const P = VP.pricing;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const mark = (size = 18) => `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lm${size}" x1="0" x2="1"><stop offset="0" stop-color="#ff4f9a" stop-opacity="0"/><stop offset=".5" stop-color="#ff6a6a"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#0b0b0c"/><path d="M6 9h20v2.5C26 17 21.5 21 16 21S6 17 6 11.5z" fill="#000" stroke="#333" stroke-width=".6"/><path d="M7.5 17.5c2.3 2.2 5.2 3.3 8.5 3.3s6.2-1.1 8.5-3.3" fill="none" stroke="url(#lm${size})" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  $$('[data-mark]').forEach((e) => { e.innerHTML = mark(); });
  $$('[data-i]').forEach((e) => { e.innerHTML = VP.icon(e.dataset.i); });
  $$('[data-price]').forEach((e) => { e.textContent = VP.money(P.early); });
  $$('[data-price-was]').forEach((e) => { e.textContent = VP.money(P.regular); });
  $$('[data-trial]').forEach((e) => { e.textContent = P.trialDays; });
  $$('[data-macs]').forEach((e) => { e.textContent = P.macs; });

  const tick = () => {
    const d = new Date();
    $('#mb-clock').textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '  ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  tick(); setInterval(tick, 15000);

  /* What people actually use it for: each card opens that tab in the real panel. */
  const CARDS = [
    ['clipboard', 'clipboard', '#ff9f0a', 'Paste what you copied an hour ago.', 'Every copy kept on your Mac: text, links, colours, pictures, files. Passwords skipped.'],
    ['menubar', 'menubar', '#5e5ce6', 'Get back the icons the notch hides.', 'A full menu bar puts icons behind the camera. They’re all here, one click from their menus.'],
    ['calendar', 'calendar', '#ff453a', 'Join the next call in one click.', 'What’s next with a countdown and its Join button, or the day, week and month.'],
    ['tasks', 'checklist', '#64d2ff', 'Tick off today without opening Reminders.', 'Your lists, synced with your iPhone. Type “call mum tomorrow” and it has a date.'],
    ['player', 'player', '#63e6e2', 'Pause the music from any app.', 'Music, Spotify, YouTube in the browser: whatever is playing, with a scrubber.'],
    ['clock', 'clock', '#30d158', 'Focus for 25 minutes.', 'Pomodoro, named timers, a stopwatch and alarms. Type “10m tea” in search and it starts.'],
  ];
  $('#cards').innerHTML = CARDS.map(([tab, icon, c, h, p]) => `
    <button class="card" data-open-tab="${tab}" style="--c:${c}">
      <span class="ci">${VP.icon(icon)}</span><b>${h}</b><span class="cp">${p}</span><span class="go">Show me ${VP.icon('arrowUpRight')}</span>
    </button>`).join('');

  /* The few questions that decide a purchase. */
  const pick = ['What if my Mac has no notch?', 'Does anything leave my Mac?', 'Is it a subscription?', 'Will it slow my Mac down?', 'Why does it ask for Accessibility?', 'Why isn’t it on the App Store?'];
  $('#faqs').innerHTML = VP.faq.filter(([q]) => pick.includes(q)).map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('');

  /* The panel */
  VP.demo.mount();
  const point = $('#point');
  const showPoint = () => point.classList.toggle('on', !VP.demo.isOpen() && window.scrollY < 200);
  window.addEventListener('vp:open', showPoint);
  window.addEventListener('vp:close', showPoint);
  window.addEventListener('scroll', () => {
    showPoint();
    // Scrolled away from the hero, the panel the page opened by itself folds back; one the visitor opened stays.
    if (autoOpened && window.scrollY > 260) { autoOpened = false; VP.demo.close(); }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open-tab]');
    if (t) { autoOpened = false; VP.demo.setTab(t.dataset.openTab); return; }
    if (e.target.closest('[data-open-search]')) { autoOpened = false; VP.demo.search(''); return; }
    const l = e.target.closest('[data-look-set]');
    if (l) { $$('[data-look-set]').forEach((b) => b.classList.toggle('on', b === l)); VP.demo.setLook(l.dataset.lookSet); VP.demo.open(); autoOpened = false; return; }
    const a = e.target.closest('[data-acc-set]');
    if (a) { $$('[data-acc-set]').forEach((b) => b.classList.toggle('on', b === a)); VP.demo.setAccent(a.dataset.accSet); document.documentElement.style.setProperty('--brand', a.dataset.accSet); VP.demo.open(); autoOpened = false; }
  });

  // The page opens it once by itself, so the first thing anyone sees is the panel, not an empty notch.
  let autoOpened = false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => { if (window.scrollY < 200 && !VP.demo.isOpen()) { VP.demo.open(); autoOpened = true; } showPoint(); }, reduce ? 0 : 700);
})();
