/* The landing page. */
(function () {
  const VP = window.VP, I = VP.icon, $ = s => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t) };
  const lerp = (a, b, t) => a + (b - a) * t;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- the story ---------- */
  const story = $('.story'), lines = [...document.querySelectorAll('.line')], cue = $('#cue');
  const hero = new VP.Mac($('#hero-mac'), { icons: 6, tab: 'widgets' });
  $('#hero-mac').style.pointerEvents = 'none';
  const ring = hero.el.notch.querySelector('.ring');
  const tag = document.createElement('div'); tag.className = 'measure'; tag.style.cssText = 'left:603px;top:40px;width:306px;text-align:center;font-size:14px'; tag.textContent = '← 185 points of nothing →'; hero.el.scr.appendChild(tag);
  if (still) story.style.height = '100vh';
  function layout() {
    const W = innerWidth, H = innerHeight;
    const kEnd = Math.min(760 / 620, (W * 0.94) / 620, (H * 0.36) / 254);
    return { vw0: 1512 / (W < 700 ? 0.97 : 0.86), vwE: W / kEnd, y0: H * (W < 700 ? 0.56 : 0.5), y0E: H - 254 * kEnd - Math.max(20, H * 0.03) };
  }
  let L = layout();
  function frame() {
    const r = story.getBoundingClientRect(), total = story.offsetHeight - innerHeight;
    const p = still ? 1 : clamp(-r.top / Math.max(1, total), 0, 1);
    lines.forEach(el => { const a = +el.dataset.in, b = +el.dataset.out; const o = Math.min(ease((p - a) / .035 + (a === 0 ? 1 : 0)), ease((b - p) / .035)); el.style.opacity = o.toFixed(3); el.style.transform = `translateY(${((1 - o) * 18).toFixed(1)}px)`; el.style.visibility = o < .01 ? 'hidden' : 'visible' });
    cue.style.opacity = p > .02 ? 0 : 1;
    hero.setIcons(Math.round(6 + 16 * ease((p - .13) / .15)));
    ring.style.borderColor = p > .06 && p < .5 ? 'rgba(232,70,127,.85)' : 'transparent';
    tag.style.opacity = p > .29 && p < .45 ? 1 : 0;
    const c = ease((p - .45) / .13), x = lerp(lerp(1210, 1080, c), lerp(1080, 760, c), c), y = lerp(lerp(640, 140, c), lerp(140, 12, c), c);
    hero.cursor(x, y, p > .44 && p < .93);
    const z = ease((p - .58) / .2), vw = lerp(L.vw0, L.vwE, z);
    hero.view(756 - vw / 2, vw, lerp(L.y0, L.y0E, z));
    hero.drop(clamp((p - .63) / .17, 0, 1));
  }
  let raf = 0; const req = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame() }) };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { L = layout(); req() });
  frame();

  /* ---------- works with ---------- */
  $('#apps').innerHTML = [['calendar', 'Calendar'], ['reminders', 'Reminders'], ['music', 'Music'], ['safari', 'Safari'], ['notes', 'Notes'], ['mail', 'Mail'], ['messages', 'Messages'], ['finder', 'Finder'], ['photos', 'Photos']]
    .map(([f, n]) => `<span><img src="assets/apps/${f}.png" alt="">${n}</span>`).join('');

  /* ---------- the idea ---------- */
  $('#mini-rail').innerHTML = [['hand', 'Drop down', 'Point at the notch', 1], ['grid2', 'Widgets', 'Your Control Center'], ['today', 'Today', 'Meetings and what’s due'], ['clipboard', 'Clipboard', 'Everything you copied'], ['player', 'Player', 'What’s playing'], ['shortcuts', '13 tabs', 'Keep what you use', 1]]
    .map(([ic, b, s, a]) => `<div class="mr"><span class="ic${a ? ' acc' : ''}">${I(ic)}</span><b>${b}</b><small>${s}</small></div>`).join('');

  /* ---------- feature pictures: the real panel, on its own ---------- */
  document.querySelectorAll('[data-mac]').forEach(el => {
    const m = new VP.Mac(el, { tab: el.dataset.mac, accent: el.dataset.acc, height: 262 });
    el.classList.add('bare'); m.view(431, 650, 0); m.cursor(0, 0, false); m.el.pn.classList.add('open'); m.el.pn.style.pointerEvents = 'none';
  });

  /* ---------- open it your way ---------- */
  const WAYS = [['hand', 'Point at the notch', 'Move the pointer up to the camera. It drops after a beat, and folds when you leave.'],
    ['arrowUpRight', 'Click the notch', 'For when pointing feels too eager. One click, open; another, closed.'],
    ['keyboard', 'Press a shortcut', 'From any app, on the display you’re using. Pick any keys you like.'],
    ['command', 'A key for one tab', 'Jump straight to Clipboard, Calendar or any tab, without the others.'],
    ['eye', 'Click a peek', 'The notch widens for a moment with news. Click it and it opens right there.']];
  const wl = $('#way-list'), keys = $('#keys');
  wl.innerHTML = WAYS.map(([ic, t, s], i) => `<button class="way${i ? '' : ' on'}" data-w="${i}"><span class="k">${I(ic)}</span><span>${t}<small>${s}</small></span></button>`).join('');
  const wm = new VP.Mac($('#way-mac'), { tab: 'today', height: 300, icons: 8 });
  const wmView = () => innerWidth < 700 ? wm.view(426, 660, 0) : wm.view(336, 840, 0);
  wmView(); addEventListener('resize', wmView); wm.cursor(0, 0, false);
  let run = 0, auto = true, wi = 0;
  const glide = (x0, y0, x1, y1, ms, id) => new Promise(res => { const t0 = performance.now(); const f = t => { if (id !== run) return res(); const k = ease((t - t0) / ms); wm.cursor(lerp(x0, x1, k), lerp(y0, y1, k) - Math.sin(k * Math.PI) * 60); k < 1 ? requestAnimationFrame(f) : res() }; requestAnimationFrame(f) });
  const showKeys = (ks) => { keys.innerHTML = ks.map(k => `<span>${k}</span>`).join(''); keys.classList.add('on') };
  async function play(i) {
    const id = ++run; wi = i; wl.querySelectorAll('.way').forEach((b, k) => b.classList.toggle('on', k === i));
    keys.classList.remove('on'); wm.close(); wm.cursor(0, 0, false); await wait(500); if (id !== run) return;
    if (i === 0) { wm.cursor(1080, 300); await glide(1080, 300, 760, 14, 1100, id); await wait(180); if (id === run) wm.open('today') }
    if (i === 1) { wm.cursor(1080, 300); await glide(1080, 300, 760, 14, 900, id); await wait(250); if (id !== run) return; wm.el.cursor.style.scale = '.8'; await wait(140); wm.el.cursor.style.scale = ''; wm.open('widgets') }
    if (i === 2) { showKeys(['⌃', '⌥', '⌘', 'M']); await wait(900); if (id !== run) return; keys.classList.remove('on'); wm.open('calendar') }
    if (i === 3) { showKeys(['⌃', '⌥', '2']); await wait(900); if (id !== run) return; keys.classList.remove('on'); wm.open('clipboard') }
    if (i === 4) { wm.peek('track'); await wait(1600); if (id !== run) return; wm.cursor(1000, 260); await glide(1000, 260, 830, 16, 700, id); await wait(150); if (id !== run) return; wm.el.notch.classList.remove('peek'); wm.open('player') }
    if (id === run) wm.cursor(0, 0, false);
  }
  wl.addEventListener('click', e => { const b = e.target.closest('.way'); if (!b) return; auto = false; play(+b.dataset.w) });
  let wayStarted = false;
  new IntersectionObserver(es => { if (es[0].isIntersecting && !wayStarted) { wayStarted = true; play(0); setInterval(() => { if (auto && !document.hidden) play((wi + 1) % WAYS.length) }, 4800) } }, { threshold: .4 }).observe($('#way-mac'));

  /* ---------- try it ---------- */
  const demo = new VP.Mac($('#demo-mac'), { interactive: true, height: 340, tab: 'widgets', icons: 8, keep: $('.dock-ctl') });
  const demoView = () => innerWidth < 700 ? demo.view(426, 660, 0) : demo.view(326, 860, 0);
  demoView(); addEventListener('resize', demoView); $('#demo-mac').classList.add('flat'); demo.cursor(0, 0, false);
  const ACC = [['#ff5ca8', 'Pink'], ['#0a84ff', 'Blue'], ['#34c759', 'Green'], ['#ff9f0a', 'Orange'], ['#bf5af2', 'Purple'], ['#8e8e93', 'Graphite']];
  const dots = $('#dots'), pills = $('#looks-pills');
  dots.innerHTML = ACC.map(([c, n], i) => `<button style="--c:${c}" class="${i ? '' : 'on'}" data-c="${c}" aria-label="${n}" title="${n}"></button>`).join('');
  const markLook = l => pills.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
  pills.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; demo.setLook(b.dataset.l); markLook(b.dataset.l); if (!demo.s.open) demo.open() });
  dots.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; demo.setLook(null, b.dataset.c); dots.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); if (!demo.s.open) demo.open() });
  demo.onLook = markLook;
  let shown = false;
  new IntersectionObserver(es => { if (shown || !es[0].isIntersecting) return; shown = true; setTimeout(() => demo.peek('meet'), 300); setTimeout(() => demo.open(), 2200) }, { threshold: .55 }).observe($('#demo-mac'));
  VP.activeMac = demo;

  /* ---------- tabs ---------- */
  $('#gal').innerHTML = VP.inside.map(([ic, n, l]) => `<div class="g"><span class="ic">${I(ic)}</span><span><b>${n}</b><span>${l}</span></span></div>`).join('');

  /* ---------- looks ---------- */
  const LK = [['studio', 'Studio', 'Solid black that joins the notch.', '#ff5ca8', 'widgets'], ['tinted', 'Tinted', 'Every surface in your colour.', '#34c759', 'today'],
    ['liquid', 'Liquid', 'Glass that bends your wallpaper.', '#0a84ff', 'player'], ['fade', 'Notch Fade', 'Black at the top, melting into glass.', '#ff5ca8', 'widgets']];
  const WALL = { tinted: 'radial-gradient(50% 70% at 20% 30%, #d7f5c8 0, transparent 70%), radial-gradient(50% 60% at 80% 70%, #b9e6d3 0, transparent 70%), linear-gradient(#eef5ea, #e3efe6)',
    liquid: 'radial-gradient(45% 60% at 25% 35%, #8fd3ff 0, transparent 70%), radial-gradient(40% 60% at 75% 30%, #b7a6ff 0, transparent 70%), radial-gradient(60% 50% at 50% 95%, #ffb3d1 0, transparent 70%), linear-gradient(#e9eefc, #f2e9f6)',
    fade: 'radial-gradient(50% 60% at 30% 40%, #ffb0cf 0, transparent 70%), radial-gradient(45% 60% at 75% 60%, #ffcfa6 0, transparent 70%), linear-gradient(#fbe9ee, #f6e6dc)' };
  $('#looks-grid').innerHTML = LK.map(([id, n, l]) => `<div class="lc" data-l="${id}"><div class="lm"></div><div class="cap"><b>${n}</b><span>${l}</span></div></div>`).join('');
  document.querySelectorAll('.lc').forEach((card, i) => {
    const [id, , , acc, tab] = LK[i]; const m = new VP.Mac(card.querySelector('.lm'), { look: id, accent: acc, tab, height: 300 });
    card.querySelector('.lm').classList.add('flat'); if (WALL[id]) m.el.scr.style.setProperty('--wall', WALL[id]);
    m.view(406, 700, 0); m.cursor(0, 0, false); m.el.pn.classList.add('open'); m.el.pn.style.pointerEvents = 'none';
    card.addEventListener('click', () => { demo.setLook(id, acc); markLook(id); dots.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.c === acc)); if (!demo.s.open) demo.open(); $('#try').scrollIntoView({ behavior: still ? 'auto' : 'smooth' }) });
  });

  /* ---------- compare ---------- */
  const Y = `<span class="y">${I('check')}</span>`, N = `<span class="n2">${I('x')}</span>`;
  $('#cmp').innerHTML = `<tr><th></th><th class="us">VisorPro</th><th>Separate apps</th></tr>` + [
    ['Lives in the notch, out of your way', Y, N], ['Menu bar icons the notch hides, back in reach', Y, 'Another app'], ['Clipboard history and saved snippets', Y, 'Another app'],
    ['Next meeting with a Join button', Y, 'Another app'], ['Now playing from any app or browser', Y, N], ['Timers, notes, translate, calculator', Y, 'Four more apps'],
    ['One shortcut, one place to look', Y, N], ['What you pay', `<b>${VP.money(VP.pricing.early)} once</b>`, 'One price per app']].map(r => `<tr><td>${r[0]}</td><td class="us">${r[1]}</td><td>${r[2]}</td></tr>`).join('');

  /* ---------- pricing ---------- */
  const setMacs = n => { const [e, r] = VP.pricing.tiers[n]; $('#amt').textContent = VP.money(e); $('#reg').textContent = VP.money(r); $('#mac-li').textContent = `Use it on ${n} Mac${n > 1 ? 's' : ''}`; $('#macs').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.n === n)) };
  $('#macs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMacs(+b.dataset.n) });
  setMacs(1);

  /* ---------- closing, faq ---------- */
  $('#big-mark').innerHTML = VP.mark(84);
  $('#faqs').innerHTML = VP.faq.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('');
})();
