/* The landing page. Every picture of the panel is the app's own (assets/shots, taken by its self-test). */
(function () {
  const VP = window.VP, I = VP.icon, $ = s => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t) };
  const lerp = (a, b, t) => a + (b - a) * t;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const SHOT = n => `assets/shots/${n}.webp`;
  const F = VP.features;
  document.querySelectorAll('[data-features]').forEach(e => { e.textContent = F.total });

  /* ---------- the story ---------- */
  const story = $('.story'), lines = [...document.querySelectorAll('.line')], cue = $('#cue');
  const hero = new VP.Mac($('#hero-mac'), { icons: 6, shot: 'tab-widgets' });
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
  $('#mini-rail').innerHTML = [['hand', 'Drop down', 'Point at the notch', 1], ['grid2', 'Widgets', 'Your Control Center'], ['shortcuts', 'Shortcuts', `${F.actions} actions`], ['calendar', 'Calendar', 'Join the call'], ['clock', 'Clock', 'Focus and timers'], ['layers', `${F.total} features`, 'Keep what you use', 1]]
    .map(([ic, b, s, a]) => `<div class="mr"><span class="ic${a ? ' acc' : ''}">${I(ic)}</span><b>${b}</b><small>${s}</small></div>`).join('');

  /* ---------- open it your way ---------- */
  const WAYS = [['hand', 'Point at the notch', 'Move the pointer up to the camera. It drops after a beat, and folds when you leave.'],
    ['arrowUpRight', 'Click the notch', 'For when pointing feels too eager. One click, open; another, closed.'],
    ['keyboard', 'Press a shortcut', 'From any app, on the display you’re using. Pick any keys you like.'],
    ['command', 'A key for one tab', 'Jump straight to Calendar, Clock or any tab, without the others.'],
    ['eye', 'Click a peek', 'The notch widens for a moment with news. Click it and it opens right there.']];
  const wl = $('#way-list'), keys = $('#keys');
  wl.innerHTML = WAYS.map(([ic, t, s], i) => `<button class="way${i ? '' : ' on'}" data-w="${i}"><span class="k">${I(ic)}</span><span>${t}<small>${s}</small></span></button>`).join('');
  const wm = new VP.Mac($('#way-mac'), { shot: 'tab-widgets', height: 300, icons: 8 });
  $('#way-mac').classList.add('flat');
  const wmView = () => innerWidth < 700 ? wm.view(426, 660, 0) : wm.view(336, 840, 0);
  wmView(); addEventListener('resize', wmView); wm.cursor(0, 0, false);
  let run = 0, auto = true, wi = 0;
  const glide = (x0, y0, x1, y1, ms, id) => new Promise(res => { const t0 = performance.now(); const f = t => { if (id !== run) return res(); const k = ease((t - t0) / ms); wm.cursor(lerp(x0, x1, k), lerp(y0, y1, k) - Math.sin(k * Math.PI) * 60); k < 1 ? requestAnimationFrame(f) : res() }; requestAnimationFrame(f) });
  const showKeys = ks => { keys.innerHTML = ks.map(k => `<span>${k}</span>`).join(''); keys.classList.add('on') };
  async function play(i) {
    const id = ++run; wi = i; wl.querySelectorAll('.way').forEach((b, k) => b.classList.toggle('on', k === i));
    keys.classList.remove('on'); wm.close(); wm.cursor(0, 0, false); await wait(500); if (id !== run) return;
    if (i === 0) { wm.cursor(1080, 300); await glide(1080, 300, 760, 14, 1100, id); await wait(180); if (id === run) wm.open('widgets') }
    if (i === 1) { wm.cursor(1080, 300); await glide(1080, 300, 760, 14, 900, id); await wait(250); if (id !== run) return; wm.el.cursor.style.scale = '.8'; await wait(140); wm.el.cursor.style.scale = ''; wm.open('widgets') }
    if (i === 2) { showKeys(['⌃', '⌥', '⌘', 'M']); await wait(900); if (id !== run) return; keys.classList.remove('on'); wm.open('calendar') }
    if (i === 3) { showKeys(['⌃', '⌥', '2']); await wait(900); if (id !== run) return; keys.classList.remove('on'); wm.open('pomodoro') }
    if (i === 4) { wm.peek('meet'); await wait(1600); if (id !== run) return; wm.cursor(1000, 260); await glide(1000, 260, 830, 16, 700, id); await wait(150); if (id !== run) return; wm.el.scr.querySelector('.peekimg')?.classList.remove('on'); wm.open('calendar') }
    if (id === run) wm.cursor(0, 0, false);
  }
  wl.addEventListener('click', e => { const b = e.target.closest('.way'); if (!b) return; auto = false; play(+b.dataset.w) });
  let wayStarted = false;
  new IntersectionObserver(es => { if (es[0].isIntersecting && !wayStarted) { wayStarted = true; play(0); setInterval(() => { if (auto && !document.hidden) play((wi + 1) % WAYS.length) }, 4800) } }, { threshold: .4 }).observe($('#way-mac'));

  /* ---------- try it: the real panel, every tab ---------- */
  const demo = new VP.Mac($('#demo-mac'), { interactive: true, shot: 'tab-widgets', height: 340, icons: 8, keep: $('.dock-ctl') });
  const demoView = () => innerWidth < 700 ? demo.view(426, 660, 0) : demo.view(326, 860, 0);
  demoView(); addEventListener('resize', demoView); $('#demo-mac').classList.add('flat'); demo.cursor(0, 0, false);
  const pills = $('#looks-pills');
  const PILL = { studio: 'look-studio', tinted: 'look-tinted', fade: 'look-fade', search: 'search', wheel: 'wheel' };
  pills.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; pills.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); if (!demo.s.open) demo.open(); demo.setShot(PILL[b.dataset.l], 'f') });
  demo.onTab = () => pills.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.l === 'studio'));
  let shown = false;
  new IntersectionObserver(es => { if (shown || !es[0].isIntersecting) return; shown = true; setTimeout(() => demo.peek('meet'), 300); setTimeout(() => demo.open(), 2200) }, { threshold: .55 }).observe($('#demo-mac'));
  VP.activeMac = demo;

  /* ---------- every feature, counted ---------- */
  $('#breakdown').innerHTML = `<span><b>${VP.inside.length}</b> tabs</span><i>+</i><span><b>${F.actions}</b> shortcut actions</span><i>+</i><span><b>${F.panel.length}</b> ways to shape the panel</span><i>=</i><span class="tot"><b>${F.total}</b> features</span>`;
  $('#gal').innerHTML = VP.inside.map(([ic, n, l]) => `<div class="g"><span class="ic">${I(ic)}</span><span><b>${n}</b><span>${l}</span></span></div>`).join('');
  const grp = (h, n, items) => `<div class="fgrp"><h4>${h} <em>${n}</em></h4><div class="chips">${items.map(x => `<span>${x}</span>`).join('')}</div></div>`;
  $('#flist').innerHTML = grp('Shortcut actions: system', F.system.length, F.system) + grp('Shortcut actions: window layouts', F.window.length, F.window)
    + grp('Shortcut actions: everything else', F.kinds.length, F.kinds) + grp('The panel', F.panel.length, F.panel);

  /* ---------- make it yours: real pictures of every arrangement, driven by scrolling ---------- */
  const TABS13 = ['widgets', 'clipboard', 'captures', 'shelf', 'shortcuts', 'calendar', 'tasks', 'notes', 'player', 'translate', 'calculator', 'pomodoro', 'menuBar'].map(t => 'tab-' + t);
  const STEPS = [
    ['Studio.', 'Solid black that melts into the notch.', ['look-studio'], 'studio'],
    ['<em>Tinted,</em> every tool its colour.', 'One colour for all of them, or each its own.', ['look-tinted'], 'tinted'],
    ['Notch <em>Fade.</em>', 'Notch black at the top, melting into colour below.', ['look-fade'], 'fade'],
    ['Tab bar on <em>any side.</em>', 'Left, top, right or bottom.', ['tab-widgets', 'rail-top', 'rail-right', 'rail-bottom'], 'studio'],
    ['Names, <em>if you like.</em>', 'Icons only, or icons with names.', ['rail-names'], 'studio'],
    ['Apps <em>wherever</em> you want them.', 'The app row on any side of the panel.', ['approw-top', 'approw-left', 'approw-right', 'approw-bottom'], 'studio'],
    [`${VP.inside.length} tabs, <em>your order.</em>`, 'Keep the ones you use. Hide the rest.', TABS13, 'studio'],
    ['Groups on a <em>half wheel.</em>', 'Point at a group and it fans out.', ['wheel'], 'tinted'],
    ['Search <em>everything.</em>', 'Press ⌘K, or just start typing.', ['search'], 'studio'],
  ];
  const WALL = { studio: 'radial-gradient(50% 60% at 25% 30%, #e9e6f2 0, transparent 70%), radial-gradient(45% 60% at 80% 70%, #f3e4ea 0, transparent 70%), linear-gradient(#f2f0f4, #e9e7ee)',
    tinted: 'radial-gradient(50% 70% at 20% 30%, #d7f5c8 0, transparent 70%), radial-gradient(50% 60% at 80% 70%, #b9e6d3 0, transparent 70%), linear-gradient(#eef5ea, #e3efe6)',
    fade: 'radial-gradient(50% 60% at 30% 40%, #ffb0cf 0, transparent 70%), radial-gradient(45% 60% at 75% 60%, #ffcfa6 0, transparent 70%), linear-gradient(#fbe9ee, #f6e6dc)' };
  const showSec = $('#looks'), titles = $('#show-titles'), count = $('#show-count'), bar = $('#show-bar'), stage = $('#show-stage'), box = $('#show-mac');
  titles.innerHTML = STEPS.map(([t, d], i) => `<div class="st" data-i="${i}"><h2>${t}</h2><p>${d}</p></div>`).join('');
  [...new Set(STEPS.flatMap(s => s[2]))].forEach(n => { const im = new Image(); im.src = SHOT(n) }); // load them all up front
  box.className = 'show-pics';
  let cur = '';
  function showPic(n) {
    if (n === cur) return; cur = n;
    const im = new Image(); im.src = SHOT(n); im.alt = 'VisorPro'; im.className = 'sp';
    box.appendChild(im); requestAnimationFrame(() => im.classList.add('on'));
    const old = [...box.querySelectorAll('.sp')].slice(0, -1); setTimeout(() => old.forEach(o => o.remove()), 320);
  }
  function showFrame() {
    const r = showSec.getBoundingClientRect(), total = showSec.offsetHeight - innerHeight;
    const p = still ? 0 : clamp(-r.top / Math.max(1, total), 0, .9999);
    const f = p * STEPS.length, i = Math.floor(f), k = f - i, [, , pics, wall] = STEPS[i];
    titles.querySelectorAll('.st').forEach((el, n) => el.className = 'st' + (n === i ? ' on' : n < i ? ' past' : ''));
    count.textContent = `${String(i + 1).padStart(2, '0')} / ${STEPS.length}`;
    bar.style.width = (p * 100).toFixed(1) + '%';
    stage.style.setProperty('--wall', WALL[wall]);
    showPic(pics[Math.min(pics.length - 1, Math.floor(k * pics.length))]);
  }
  addEventListener('scroll', () => requestAnimationFrame(showFrame), { passive: true });
  showFrame();

  /* ---------- the maker's setup ---------- */
  $('#mine-mac').innerHTML = `<img class="mine-img" src="${SHOT('mine')}" alt="The maker’s VisorPro: Notch Fade, names, tall, shortcuts and apps on top">`;
  $('#mine-notes').innerHTML = [['palette', 'Look', 'Notch Fade, no glow'], ['layers', 'Colours', 'Each tool its own'], ['notelines', 'Tab bar', 'Left, with names'], ['display', 'Size', 'Regular width, tall'], ['grid4', 'Top row', 'Shortcuts, then apps']]
    .map(([ic, a, b]) => `<div><span class="ic">${I(ic)}</span><b>${a}</b><span>${b}</span></div>`).join('');

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
