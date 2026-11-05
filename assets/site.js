/* Shared by every page: the mark, the navigation, the footer, light/dark. */
(function () {
  const VP = window.VP; const I = VP.icon;
  const store = { get(k) { try { return localStorage.getItem(k) } catch (e) { return null } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) { /* private window */ } } };
  VP.store = store;

  /* The mark: a visor's curve catching one line of light. */
  VP.mark = (size = 24) => `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="vpl${size}" x1="0" x2="1"><stop offset="0" stop-color="#ff4f9a" stop-opacity="0"/><stop offset=".5" stop-color="#ff6a6a"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#0b0b0c"/><path d="M6 9h20v2.5C26 17 21.5 21 16 21S6 17 6 11.5z" fill="#000" stroke="#222" stroke-width=".6"/><path d="M7.5 17.5c2.3 2.2 5.2 3.3 8.5 3.3s6.2-1.1 8.5-3.3" fill="none" stroke="url(#vpl${size})" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  VP.wordmark = (size) => `${VP.mark(size)}<span>Visor<b>Pro</b></span>`;

  function theme(t) {
    t = t || 'light';
    if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    store.set('vp-theme', t);
    document.querySelectorAll('.theme-sw button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  }
  VP.theme = theme;
  theme(store.get('vp-theme') || 'light');

  const home = document.body.dataset.page === 'home' ? '' : 'index.html';
  const nav = `<header class="nav"><a class="brand" href="${home || '#top'}" aria-label="VisorPro">${VP.wordmark()}</a>
    <nav class="links" aria-label="Main"><a href="${home}#features">Features</a><a href="${home}#ways">How it opens</a><a href="${home}#tabs">Tabs</a><a href="${home}#pricing">Pricing</a><a href="${home}#faq">FAQ</a></nav>
    <a class="buy" href="checkout.html">Buy · ${VP.money(VP.pricing.early)}</a></header>`;

  const col = (h, items) => `<div><h5>${h}</h5><ul>${items.map(([t, u]) => `<li><a href="${u || '#'}">${t}</a></li>`).join('')}</ul></div>`;
  const footer = `<footer class="foot"><div class="wrap">
    <div class="fgrid">
      <div><a class="brand" href="${home || '#top'}">${VP.wordmark()}</a>
        <p>The notch, put to work. Everything you reach for, one point away.</p>
        <div class="badges"><span class="bdg"><small>Featured on</small>Your badge</span><span class="bdg lt"><small>App of the day</small>Placeholder</span><span class="bdg"><small>Made for</small>macOS 13+</span></div>
        <form class="news" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed';"><input type="email" placeholder="you@email.com" aria-label="Email for updates"><button>Get updates</button></form>
      </div>
      ${col('Product', [['Features', `${home}#features`], ['How it opens', `${home}#ways`], ['Try it', `${home}#try`], ['Looks', `${home}#looks`], ['Pricing', `${home}#pricing`], ['Download'], ['Changelog']])}
      ${col('Tabs', [['Widgets'], ['Clipboard'], ['Calendar'], ['Player'], ['Menu Bar'], [`All 13 →`, `${home}#tabs`]])}
      ${col('Help', [['FAQ', `${home}#faq`], ['Keyboard shortcuts'], ['Permissions'], ['Restore a licence'], ['Contact'], ['Press kit']])}
      ${col('Guides', [['Compare', `${home}#compare`], ['See hidden menu bar icons'], ['Clipboard history on Mac'], ['Make the notch useful'], ['Snap windows on Mac']])}
      ${col('Legal', [['Privacy'], ['Terms'], ['Refunds'], ['Licence'], ['Cookies (there are none)']])}
    </div>
    <div class="fbase"><span>© ${new Date().getFullYear()} VisorPro · Made by Vadim Egorov · Part of the Mac Utilities Suite</span>
      <span class="status"><i></i>All systems normal</span>
      <span class="soc"><a href="#">X</a><a href="#">Bluesky</a><a href="#">GitHub</a><a href="#">YouTube</a><a href="mailto:hello@visorpro.app">Email</a></span>
      <span>Not affiliated with Apple Inc.</span></div>
    <div class="giant" aria-hidden="true">VisorPro</div>
  </div></footer>`;
  const h = document.getElementById('site-header'); if (h) h.outerHTML = nav;
  const f = document.getElementById('site-footer'); if (f) f.outerHTML = footer;

  document.querySelectorAll('[data-price]').forEach(e => { e.textContent = VP.money(VP.pricing[e.dataset.price]) });
  document.querySelectorAll('[data-trial]').forEach(e => { e.textContent = VP.pricing.trialDays });
  document.querySelectorAll('[data-icon]').forEach(e => { e.insertAdjacentHTML('afterbegin', I(e.dataset.icon)) });
})();
