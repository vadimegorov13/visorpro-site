/* The working panel: it drops from the page's notch, and every tab does what the app's does, with made-up
   data that never leaves the page. Point at the notch (or click it), slide along the tab bar, type to search. */
(function () {
  const VP = window.VP;
  const ic = (n) => VP.icon(n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
  const clock = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  /* The tabs in the app's default order, with the app's own tab colours. */
  const TABS = [
    ['widgets', 'Widgets', 'widgets', '#0a84ff'], ['clipboard', 'Clipboard', 'clipboard', '#ff9f0a'],
    ['captures', 'Captures', 'captures', '#ff375f'], ['shelf', 'Shelf', 'tray', '#40c8e0'],
    ['shortcuts', 'Shortcuts', 'shortcuts', '#ffd60a'], ['calendar', 'Calendar', 'calendar', '#ff453a'],
    ['tasks', 'Reminders', 'checklist', '#64d2ff'], ['notes', 'Notes', 'notes', '#ac8e68'],
    ['player', 'Player', 'player', '#63e6e2'], ['translate', 'Translate', 'translate', '#0a84ff'],
    ['calculator', 'Calculator', 'fx', '#bf5af2'], ['clock', 'Clock', 'clock', '#30d158'],
    ['menubar', 'Menu Bar', 'menubar', '#5e5ce6'],
  ];
  const tabIndex = (id) => TABS.findIndex((t) => t[0] === id);

  /* ---------- made-up data ---------- */
  const now = () => new Date();
  const start = Date.now();
  const at = (min) => new Date(start + min * 60000);
  const TRACKS = [
    { t: 'Golden Hour Drive', a: 'Lumen Fields', al: 'Weekend Signals', len: 214, c: ['#ff9a5b', '#ff4f9a', '#7b5cff'], app: 'music' },
    { t: 'Night Swim', a: 'Coastal Static', al: 'Low Tide', len: 187, c: ['#00d2ff', '#3a7bd5', '#1b2a6b'], app: 'music' },
    { t: 'Paper Planes in June', a: 'Maya Ito', al: 'Small Rooms', len: 241, c: ['#ffd36e', '#ff7eb3', '#6a4cff'], app: 'safari' },
  ];
  const S = {
    open: false, tab: 'widgets', ret: null, pinned: false, look: 'studio', acc: '#ff4f9a', search: null,
    playing: true, track: 0, pos: 64,
    pomo: { phase: 'Focus', len: 1500, left: 1500, run: false, done: 2 },
    timers: [], sw: { run: false, t: 0, laps: [] }, alarm: true,
    keepAwake: false, dark: true, wifi: true, bt: true,
    clipSection: 'history', clipSel: 0,
    clips: [
      { k: 'link', text: 'https://visorpro.app/try', from: 'Safari', app: 'safari', ago: '1 min ago' },
      { k: 'text', text: 'Meet at the side entrance, 7 pm. Bring the keys!', from: 'Messages', app: 'messages', ago: '6 min ago' },
      { k: 'color', text: '#FF4F9A', from: 'Pick a Colour', ago: '12 min ago' },
      { k: 'email', text: 'dana@northlight.studio', from: 'Mail', app: 'mail', ago: '25 min ago' },
      { k: 'image', text: 'Screenshot 2:31 PM', from: 'Screenshot', ago: '38 min ago' },
      { k: 'phone', text: '+1 (415) 555-0132', from: 'Notes', app: 'notes', ago: '1 hr ago' },
      { k: 'text', text: 'ssh deploy@10.0.4.12 -p 2222', from: 'Terminal', app: 'terminal', ago: '2 hr ago' },
    ],
    saved: [
      ['house', 'Home address', '18 Alder Lane, Portland, OR 97214'], ['mail', 'Work email', 'sam@northlight.studio'],
      ['video', 'My meeting link', 'https://meet.example.com/sam-rivera'], ['text', 'Sign-off', 'Thanks! Talk soon, Sam'],
    ],
    tasks: [
      { id: 1, t: 'Send the invoice', when: 'Yesterday', late: true, list: 'Work' },
      { id: 2, t: 'Reply to Dana', note: 'About the venue', when: 'Today', list: 'Work' },
      { id: 3, t: 'Book flights', when: 'Today, 5:30 PM', pri: '!!! ', list: 'Personal' },
      { id: 4, t: 'Pick up the dry cleaning', when: 'Today', list: 'Personal' },
    ],
    notes: [
      { id: 1, body: 'Launch checklist\n– Record the hero video\n– Write the FAQ\n– Price: one-time', m: 'Today, 2:10 PM' },
      { id: 2, body: 'Groceries\nOat milk, coffee beans, lemons', m: 'Yesterday' },
      { id: 3, body: 'Ideas for the offsite\nBoat trip? Cooking class?', m: 'Monday' },
    ],
    noteSel: 1,
    shelf: [{ n: 'Brief v3.pdf', x: 'PDF', c: '#ff453a' }, { n: 'Mock-up.png', x: 'PNG', c: '#30d158' }, { n: 'Assets.zip', x: 'ZIP', c: '#8e8e93' }],
    shelfSel: null, capSel: 0,
    calc: { input: '', tape: [{ e: '1240 * 0.21', r: '260.4' }, { e: '5 km to mi', r: '3.11 mi' }] },
    tr: { input: 'Good morning', to: 'es' },
    clockPart: 'pomodoro',
  };
  const EVENTS = [
    { t: 'Design review', s: at(12), e: at(57), c: '#0a84ff', where: 'Google Meet' },
    { t: 'Lunch with Sam', s: at(100), e: at(160), c: '#ff9f0a' },
    { t: 'Sprint planning', s: at(230), e: at(290), c: '#0a84ff' },
  ];

  /* ---------- the DOM ---------- */
  let root, shape, body, railEl, toastEl, titleEl, tipEl, view;
  let hoverT, leaveT, toastT, entered = false;

  let host = null, opt = {}, ro = null;
  function mount() {
    root = document.createElement('div');
    root.className = 'vp' + (host ? ' inline' : '');
    root.setAttribute('aria-label', 'VisorPro demo panel');
    root.innerHTML = `
      <div class="vp-shape">
        <div class="vp-in"><div class="vp-clip">
          <div class="vp-top"><div class="vp-title"></div><div class="vp-toast" role="status"></div>
            <div class="vp-tools"><button data-t="search" aria-label="Search">${ic('search')}</button><button data-t="pin" aria-label="Pin">${ic('pin')}</button><button data-t="gear" aria-label="Settings">${ic('gear')}</button></div></div>
          <div class="vp-rail" role="tablist"></div><div class="vp-tip"></div>
          <div class="vp-body"></div>
          <div class="vp-apps"></div>
        </div></div>
        <i class="cam"></i>
      </div>`;
    (host || document.body).appendChild(root);
    shape = root.querySelector('.vp-shape');
    body = root.querySelector('.vp-body');
    railEl = root.querySelector('.vp-rail');
    toastEl = root.querySelector('.vp-toast');
    titleEl = root.querySelector('.vp-title');
    tipEl = root.querySelector('.vp-tip');

    railEl.innerHTML = TABS.map(([id, name, icon]) => `<button class="vp-tab" role="tab" data-tab="${id}" aria-label="${name}">${ic(icon)}</button>`).join('');
    root.querySelector('.vp-apps').innerHTML = ['safari', 'mail', 'messages', 'music', 'calendar', 'notes', 'finder']
      .map((a) => `<button class="vp-app" data-app="${a}" aria-label="${a}"><img src="${opt.base || ''}assets/apps/${a}.png" alt=""></button>`).join('');

    // Open by pointing (after the app's 0.15 s), close a moment after the pointer leaves.
    shape.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      clearTimeout(leaveT); entered = true;
      if (!S.open) hoverT = setTimeout(() => open(), 150);
    });
    shape.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      clearTimeout(hoverT);
      if (S.open && !S.pinned) leaveT = setTimeout(() => { if (!typing()) close(); }, 400);
    });
    shape.addEventListener('click', (e) => { if (!S.open) { e.stopPropagation(); open(); } });
    document.addEventListener('pointerdown', (e) => { if (S.open && !S.pinned && !root.contains(e.target) && !e.target.closest('[data-open-tab],[data-open-search],[data-look-set],[data-acc-set],[data-vp-keep]')) close(); });

    // The tab bar switches as the pointer slides along it, as the app's does.
    railEl.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.vp-tab'); if (!b) return;
      showTip(b);
      if (e.pointerType !== 'touch') setTab(b.dataset.tab, { fromRail: true });
    });
    railEl.addEventListener('pointerleave', () => tipEl.classList.remove('on'));
    railEl.addEventListener('click', (e) => { const b = e.target.closest('.vp-tab'); if (b) setTab(b.dataset.tab); });
    root.querySelector('.vp-tools').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.t === 'search') beginSearch('');
      if (b.dataset.t === 'pin') { S.pinned = !S.pinned; b.classList.toggle('on', S.pinned); say(S.pinned ? 'Pinned open' : 'Unpinned'); }
      if (b.dataset.t === 'gear') say('Settings opens in its own window');
    });
    root.querySelector('.vp-apps').addEventListener('click', (e) => {
      const b = e.target.closest('.vp-app'); if (b) say(`Opens ${b.dataset.app[0].toUpperCase() + b.dataset.app.slice(1)}`);
    });
    titleEl.addEventListener('click', (e) => { if (e.target.closest('.vp-back') && S.ret) { const r = S.ret; S.ret = null; setTab(r); } });

    document.addEventListener('keydown', onKey);
    setInterval(tick, 1000);
    applyLook();
    renderRail();
    renderView();
  }

  const typing = () => { const a = document.activeElement; return a && root.contains(a) && /INPUT|TEXTAREA/.test(a.tagName) && a.value; };

  function open(tab) {
    if (tab) setTab(tab);
    if (S.open) return;
    S.open = true; root.classList.add('open');
    renderView(true);
    window.dispatchEvent(new CustomEvent('vp:open'));
  }
  function close() {
    if (!S.open) return;
    S.open = false; S.search = null; S.ret = null;
    root.classList.remove('open');
    if (root.contains(document.activeElement)) document.activeElement.blur();
    window.dispatchEvent(new CustomEvent('vp:close'));
  }

  function showTip(b) {
    const r = b.getBoundingClientRect(), p = root.getBoundingClientRect(), sc = p.width / 620;
    tipEl.textContent = TABS[tabIndex(b.dataset.tab)][1];
    tipEl.style.top = ((r.top - p.top) / sc - 1) + 'px';
    tipEl.classList.add('on');
  }

  function setTab(id, o = {}) {
    if (!o.keepReturn && S.tab !== id) S.ret = o.ret || null;
    if (S.tab === id && !S.search) return;
    const dir = tabIndex(id) >= tabIndex(S.tab) ? 1 : -1;
    S.tab = id; S.search = null;
    renderRail(); renderView(false, dir);
    window.dispatchEvent(new CustomEvent('vp:tab', { detail: { tab: id } }));
  }

  function say(text) {
    window.dispatchEvent(new CustomEvent('vp:say', { detail: { text } }));
    toastEl.innerHTML = `${ic('check')}<span>${esc(text)}</span>`;
    toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 1800);
  }

  function copy(text, label) {
    try { navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {}); } catch (e) { /* the page may not be allowed */ }
    say(label || 'Copied');
  }

  function renderRail() {
    const [, name, , tint] = TABS[tabIndex(S.tab)];
    root.style.setProperty('--tabc', tint);
    railEl.querySelectorAll('.vp-tab').forEach((b) => {
      const id = b.dataset.tab;
      b.classList.toggle('on', id === S.tab && !S.search);
      b.setAttribute('aria-selected', id === S.tab);
      b.querySelector('.badge, .dot, .day')?.remove();
      if (id === 'tasks') { const n = S.tasks.length; if (n) b.insertAdjacentHTML('beforeend', `<span class="badge">${n}</span>`); }
      if (id === 'calendar') b.innerHTML = `<span class="day">${now().getDate()}</span>`;
      if (id === 'player' && S.playing) b.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
      if (id === 'clock' && (S.pomo.run || S.timers.some((t) => t.run))) b.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
    });
    titleEl.innerHTML = (S.ret ? `<button class="vp-back" aria-label="Back">‹</button>` : '') + esc(S.search ? 'Search' : name);
  }

  /* ---------- the views ---------- */
  function renderView(first, dir = 1) {
    view = document.createElement('div');
    view.className = 'vp-view' + (first ? '' : ' enter') + (dir < 0 ? ' up' : '');
    view.innerHTML = S.search ? viewSearch() : (VIEWS[S.tab] || (() => ''))();
    body.replaceChildren(view);
    (AFTER[S.search ? 'search' : S.tab] || (() => {}))(view);
    titleEl.innerHTML = (S.ret ? `<button class="vp-back" aria-label="Back">‹</button>` : '') + esc(S.search ? 'Search' : TABS[tabIndex(S.tab)][1]);
  }
  const rerender = () => renderView(true);

  const art = (tr, size) => `<div class="art" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${tr.c[0]},${tr.c[1]} 55%,${tr.c[2]})"><i style="width:${size * .5}px;height:${size * .5}px;left:${size * .38}px;top:${size * .42}px;background:${tr.c[2]};opacity:.55"></i></div>`;
  const ring = (frac, size, stroke, color, label, sub) => {
    const r = size / 2 - stroke / 2 - 1, c = 2 * Math.PI * r;
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}"/></svg>${sub ? `<span class="p">${sub}</span>` : ''}<b>${label}</b></div>`;
  };
  const nextEvent = () => EVENTS.find((e) => e.e > now()) || EVENTS[0];
  const countdown = (e) => { const m = Math.round((e.s - now()) / 60000); return m > 0 ? `in ${m} min` : 'now'; };

  const VIEWS = {
    widgets() {
      const tr = TRACKS[S.track], ev = nextEvent(), d = now();
      return `<div class="w-grid">
        <div class="w w-np" data-go="player"><div class="head">${art(tr, 58)}<div style="min-width:0"><div class="cap">Now Playing</div><div class="t">${esc(tr.t)}</div><div class="a">${esc(tr.a)}</div></div></div>
          <div><div class="bar"><i data-np-bar style="width:${(S.pos / tr.len) * 100}%"></i></div><div class="times"><span data-np-pos>${mmss(S.pos)}</span><span>-${mmss(tr.len - S.pos)}</span></div></div>
          <div class="ctrls"><button data-np="prev" aria-label="Previous">${ic('prev')}</button><button class="big" data-np="play" aria-label="Play or pause">${ic(S.playing ? 'pause' : 'play')}</button><button data-np="next" aria-label="Next">${ic('next')}</button></div><span class="exp">${ic('arrowUpRight')}</span></div>
        <div class="w w-next click" data-go="calendar"><div class="cap">Next Up</div><div class="ev"><i></i><div><b>${esc(ev.t)}</b><span class="nsub" data-cd>${clock(ev.s)} · ${countdown(ev)}</span></div></div><button class="join" data-join>${ic('videoFill')}</button></div>
        <div class="w w-focus click" data-pomo-toggle>${ring(S.pomo.left / S.pomo.len, 58, 4, '#ff9f0a', mmss(S.pomo.left), S.pomo.run ? '❚❚' : '▶')}</div>
        <div class="w w-date click" data-go="calendar"><div class="d">${d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div><div class="n">${d.getDate()}</div><div class="m">${d.toLocaleDateString('en-US', { month: 'long' })}</div></div>
        <div class="w w-sc" data-run="Terminal"><img src="assets/apps/terminal.png" alt=""><span>Terminal</span></div>
        <div class="w w-sc" data-run="Downloads"><span class="ic">${ic('folder')}</span><span>Downloads</span></div>
        <div class="w w-sc" data-run="Screenshot"><span class="ic">${ic('dashedRect')}</span><span>Screenshot</span></div>
        <div class="w w-sw ${S.keepAwake ? 'on' : ''}" data-awake style="--c:#a2845e"><span class="b">${ic('cup')}</span><div><b>Keep Awake</b><span>${S.keepAwake ? 'On' : 'Off'}</span></div></div>
        <div class="w w-due click" data-go="tasks"><div class="cap">Due Today</div>${S.tasks.slice(0, 2).map((t) => `<div class="mini"><span class="ck"></span>${esc(t.t)}</div>`).join('') || '<div class="mini dim">Nothing due. Nice.</div>'}</div>
        <div class="w w-clip click" data-go="clipboard"><div class="cap">Copied</div>${S.clips.slice(0, 2).map((c) => `<div class="mini">${clipThumb(c, 16)}<span style="overflow:hidden;text-overflow:ellipsis">${esc(c.text)}</span></div>`).join('')}</div>
        <div class="w w-cap click" data-go="captures"><div class="shot" style="position:relative">${shotArt(0)}</div></div>
        <div class="w w-sw ${S.dark ? 'on' : ''}" data-dark style="--c:#5e5ce6"><span class="b">${ic(S.dark ? 'moon' : 'sun')}</span><div><b>${S.dark ? 'Dark' : 'Light'}</b><span>Appearance</span></div></div>
      </div>`;
    },

    clipboard() {
      const head = `<div class="cb-head"><div class="seg"><button data-sec="saved" class="${S.clipSection === 'saved' ? 'on' : ''}">${ic('bookmark')}Saved</button><button data-sec="history" class="${S.clipSection === 'history' ? 'on' : ''}">${ic('clockArrow')}History</button></div><span style="flex:1"></span><span class="dim" style="font-size:11px">Click to copy · it really copies</span></div>`;
      if (S.clipSection === 'saved') {
        return head + `<div class="cb-saved">${S.saved.map(([i, t, d], n) => `<div class="row" data-saved="${n}"><span class="badge-sq" style="background:color-mix(in srgb,var(--acc) 22%,transparent);color:var(--acc)">${ic(i === 'house' ? 'tag' : i)}</span><div style="min-width:0"><b>${esc(t)}</b><small>${esc(d)}</small></div></div>`).join('')}</div>`;
      }
      const c = S.clips[S.clipSel] || S.clips[0];
      return head + `<div class="cb-cols"><div class="cb-list scroll"><div class="cap" style="padding:0 6px 3px">Today</div>${S.clips.map((x, n) => `<div class="row ${n === S.clipSel ? 'sel' : ''}" data-clip="${n}">${clipThumb(x, 22)}<span>${esc(x.text)}</span></div>`).join('')}</div><div class="cb-div"></div>
        <div class="cb-detail"><div class="prev">${clipPreview(c)}</div><div class="cb-facts">
          <div><span>Type</span><span>${{ link: 'Link', text: 'Text', color: 'Colour', email: 'Email address', image: 'Picture', phone: 'Phone number' }[c.k]}</span></div>
          <div><span>Copied from</span><span style="display:flex;gap:5px;align-items:center">${c.app ? `<img src="assets/apps/${c.app}.png" width="14" height="14" alt="">` : ''}${esc(c.from)}</span></div>
          <div><span>When</span><span>${c.ago}</span></div><div><span>Size</span><span>${c.k === 'image' ? '1440 × 900' : c.text.length + ' characters'}</span></div></div></div></div>`;
    },

    captures() {
      return `<div class="cb-head"><span class="cap">3 Captures</span><span style="flex:1"></span><span class="dim" style="font-size:11px">Drag one into any app</span></div>
        <div class="cap-row">${[[180, 112, .78], [92, 112, .45], [150, 112, .2]].map(([w, h, left], n) =>
          `<div class="capt ${S.capSel === n ? 'sel' : ''}" data-cap="${n}" draggable="true"><div class="shot" style="width:${w}px;height:${h}px">${shotArt(n)}<svg class="tl" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="rgba(0,0,0,.55)" stroke="rgba(255,255,255,.25)" stroke-width="1.4"/><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--acc)" stroke-width="1.4" stroke-dasharray="40.8" stroke-dashoffset="${40.8 * (1 - left)}" transform="rotate(-90 8 8)"/></svg></div><div style="margin-top:4px">${['Screenshot 2:31 PM', 'Recording 2:12 PM', 'Screenshot 1:58 PM'][n]}</div></div>`).join('')}</div>
        <div class="dim" style="position:absolute;bottom:4px;left:0;font-size:11px">The ring is the time it has left · Space for Quick Look · ⌘C copies</div>`;
    },

    shelf() {
      return `<div class="cb-head"><span class="cap">${S.shelf.length} files</span><span style="flex:1"></span><span class="dim" style="font-size:11px">Drop a file from your Mac here. It stays in this page.</span></div>
        <div class="shelf-grid">${S.shelf.map((f, n) => `<div class="file ${S.shelfSel === n ? 'sel' : ''}" data-file="${n}"><div class="fi" data-x="${esc(f.x)}" style="--fc:${f.c}"><b></b></div><span>${esc(f.n)}</span></div>`).join('')}</div>
        <div class="drop">${ic('tray')}&nbsp;Keep on the Shelf</div>`;
    },

    shortcuts() {
      const items = [['img:terminal', 'Terminal'], ['folder', 'Downloads'], ['dashedRect', 'Screenshot'], ['copy', 'Copy'], ['clipboard', 'Paste'], ['window', 'Left Half'], ['grid4', 'Mission Control'],
        ['play', 'Play/Pause'], ['speaker', 'Mute'], ['calendar', 'Today’s Date'], ['lock', 'Lock Screen'], ['moon', 'Dark Mode'], ['eyedrop', 'Pick a Colour'], ['img:safari', 'Docs site'],
        ['next', 'Next Track'], ['display', 'Show Desktop'], ['focus', 'Start Pomodoro'], ['trash', 'Empty Trash'], ['terminal', 'Terminal Here'], ['window', 'Right Half'], ['img:notes', 'New Note']];
      return `<div class="sc-grid">${items.map(([i, t]) => `<button class="sct" data-run="${esc(t)}">${i.startsWith('img:') ? `<img src="assets/apps/${i.slice(4)}.png" alt="">` : `<span class="ic">${ic(i)}</span>`}<span>${esc(t)}</span></button>`).join('')}</div>`;
    },

    calendar() {
      const ev = nextEvent();
      return `<div class="cal"><div><div class="muted" style="font-size:12.5px;font-weight:600">${now().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div class="cap" style="margin-top:12px">Next</div><h4>${esc(ev.t)}</h4><div class="time"><i></i>${clock(ev.s)} – ${clock(ev.e)}</div><div class="cd" data-cd2>${countdown(ev)}</div>
          <div class="muted" style="font-size:12px;margin-top:6px;display:flex;gap:6px;align-items:center">${ic('video')} ${esc(ev.where || 'Studio')}</div>
          <button class="btn" style="margin-top:14px" data-join>${ic('videoFill')} Join</button></div>
        <div class="cb-div"></div><div class="scroll" style="padding-top:2px"><div class="cap">Today</div>
          ${EVENTS.map((e) => `<div class="ev"><i style="background:${e.c}"></i><span>${clock(e.s)}</span>${esc(e.t)}</div>`).join('')}
          <div class="cap" style="margin-top:8px">Tomorrow</div>
          <div class="ev"><i style="background:#30d158"></i><span>8:00 AM</span>Gym</div><div class="ev"><i style="background:#0a84ff"></i><span>11:30 AM</span>Release 2.0</div>
          <button class="btn" style="margin-top:8px" data-newev>${ic('plus')} New event</button></div></div>`;
    },

    tasks() {
      return `<div class="rem"><div><div class="smart">
          <button class="on"><span class="si" style="background:#0a84ff;color:#fff">${ic('calendar')}</span><b>${S.tasks.length}</b><span>Today</span></button>
          <button><span class="si" style="background:#ff453a">${ic('calendar')}</span><b>4</b><span>Scheduled</span></button>
          <button><span class="si" style="background:#636366">${ic('tray')}</span><b>${S.tasks.length + 3}</b><span>All</span></button>
          <button><span class="si" style="background:#ff9f0a">${ic('tag')}</span><b>0</b><span>Flagged</span></button></div>
          <div class="cap" style="margin:10px 0 3px 2px">My Lists</div><div class="lists"><div class="row"><span class="c" style="background:#0a84ff">${ic('checklist')}</span>Work<span class="dim" style="margin-left:auto">${S.tasks.filter((t) => t.list === 'Work').length}</span></div><div class="row"><span class="c" style="background:#ff9f0a">${ic('checklist')}</span>Personal<span class="dim" style="margin-left:auto">${S.tasks.filter((t) => t.list === 'Personal').length}</span></div></div></div>
        <div class="cb-div"></div><div><div class="rl-head"><h4>Today</h4><b>${S.tasks.length}</b></div><div class="dim" style="font-size:11.5px;margin-bottom:4px">Click a circle to tick it off · type below to add one</div>
          <div class="scroll" style="max-height:180px">${S.tasks.map((t) => `<div class="task" data-task="${t.id}"><button class="ck" aria-label="Done"></button><div><div class="tt">${t.pri ? `<span style="color:#ff9f0a">${t.pri}</span>` : ''}${esc(t.t)}</div>${t.note ? `<small>${esc(t.note)}</small>` : ''}<small><span class="${t.late ? 'late' : ''}">${esc(t.when)}</span>  <span class="ls">${esc(t.list)}</span></small></div></div>`).join('')}
          <label class="newrem"><span class="pl">+</span><input data-newrem placeholder="New Reminder (try “call mum tomorrow”)" aria-label="New reminder"></label></div></div></div>`;
    },

    notes() {
      const sel = S.notes.find((n) => n.id === S.noteSel) || S.notes[0];
      return `<div class="notes"><div><div class="cb-head" style="margin-bottom:4px"><span class="cap">Notes</span><span style="flex:1"></span><button class="btn" style="height:20px;padding:0 7px" data-newnote aria-label="New note">${ic('plus')}</button></div>
          ${S.notes.map((n) => `<div class="note ${n.id === sel.id ? 'sel' : ''}" data-note="${n.id}"><b>${esc(n.body.split('\n')[0] || 'New Note')}</b><small>${esc(n.m)}  ${esc(n.body.split('\n').slice(1).join(' '))}</small></div>`).join('')}</div>
        <div class="cb-div"></div><div><div class="dim" style="font-size:11px;margin-bottom:6px">Edited ${esc(sel.m)} · saved as you type</div><textarea data-notebody aria-label="Note">${esc(sel.body)}</textarea></div></div>`;
    },

    player() {
      const tr = TRACKS[S.track];
      return `<div class="pl">${art(tr, 168)}<div><div class="src"><img src="assets/apps/${tr.app}.png" alt="">${tr.app === 'safari' ? 'YouTube Music in Safari' : 'Music'}</div>
        <div class="t">${esc(tr.t)}</div><div class="a">${esc(tr.a)} — ${esc(tr.al)}</div>
        <div class="scrub" data-scrub><i data-np-bar style="width:${(S.pos / tr.len) * 100}%"></i><em data-knob style="left:${(S.pos / tr.len) * 100}%"></em></div>
        <div class="times"><span data-np-pos>${mmss(S.pos)}</span><span>-${mmss(tr.len - S.pos)}</span></div>
        <div class="ctrls"><button data-np="back" aria-label="Back 15 seconds">${ic('back15')}</button><button data-np="prev" aria-label="Previous">${ic('prev')}</button><button class="big" data-np="play" aria-label="Play or pause">${ic(S.playing ? 'pause' : 'play')}</button><button data-np="next" aria-label="Next">${ic('next')}</button><button data-np="fwd" aria-label="Forward 15 seconds">${ic('fwd15')}</button></div></div></div>`;
    },

    translate() {
      const langs = { es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese' };
      return `<div class="tr"><div class="pane"><div class="lang">English</div><textarea data-trin aria-label="Text to translate">${esc(S.tr.input)}</textarea>
          <div class="chips">${Object.keys(PHRASES).map((p) => `<button data-phrase="${esc(p)}">${esc(p)}</button>`).join('')}</div></div>
        <button class="swap" aria-label="Change language" data-trnext>${ic('swap')}</button>
        <div class="pane"><div class="lang" data-trnext style="display:flex;align-items:center;gap:4px">${langs[S.tr.to]} <span style="font-size:9px">${ic('down')}</span></div><div class="out" data-trout></div><div class="dim" style="font-size:10.5px">Apple’s translation, on this Mac</div></div></div>`;
    },

    calculator() {
      return `<div class="calc"><div><div class="in"><input data-calcin value="${esc(S.calc.input)}" placeholder="2^10 or 5 km to mi" aria-label="Calculation" autocomplete="off" spellcheck="false"></div>
          <div class="ans" data-calcans></div><div class="cap" style="margin-top:4px">Tape</div><div class="tape scroll" style="max-height:110px" data-tape></div></div>
        <div class="keys">${['C', '(', ')', '%', '⌫', '7', '8', '9', '÷', '√', '4', '5', '6', '×', '^', '1', '2', '3', '−', 'π', '0', '.', 'ans', '+', '='].map((k) => `<button data-key="${k}" class="${'÷×−+%^√π'.includes(k) ? 'op' : ''}${k === '=' ? ' eq' : ''}">${k}</button>`).join('')}</div></div>`;
    },

    clock() {
      const parts = [['pomodoro', 'Pomodoro', 'focus'], ['timers', 'Timers', 'timer'], ['stopwatch', 'Stopwatch', 'stopwatch'], ['alarms', 'Alarms', 'alarm']];
      const seg = `<div class="seg ck-parts">${parts.map(([id, t, i]) => `<button data-part="${id}" class="${S.clockPart === id ? 'on' : ''}">${ic(i)}${t}</button>`).join('')}</div>`;
      if (S.clockPart === 'timers') {
        return seg + `<div class="chiprow">${[1, 3, 5, 10, 15, 25, 45].map((m) => `<button data-timer="${m}">${m}m</button>`).join('')}<button data-timer="60">1h</button></div>
          <div class="timers" data-timers>${timersHTML()}</div>`;
      }
      if (S.clockPart === 'stopwatch') {
        return seg + `<div style="display:flex;gap:24px"><div><div class="sw-big" data-sw>${swText()}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="btn ${S.sw.run ? '' : 'acc'}" data-swgo>${S.sw.run ? 'Stop' : 'Start'}</button><button class="btn" data-swlap>${S.sw.run ? 'Lap' : 'Reset'}</button></div></div>
          <div style="flex:1;font-size:12px" data-laps>${lapsHTML()}</div></div>`;
      }
      if (S.clockPart === 'alarms') {
        return seg + `<div class="row" style="background:rgba(255,255,255,.05);padding:10px 12px;opacity:${S.alarm ? 1 : .5}"><div style="flex:1"><div style="font-size:22px;font-weight:600">7:30 AM</div><div class="dim" style="font-size:11px">Wake up · weekdays</div></div><button class="btn ${S.alarm ? 'acc' : ''}" data-alarm>${S.alarm ? 'On' : 'Off'}</button></div>
          <div class="dim" style="font-size:11.5px;margin-top:10px">Alarms are handed to macOS, so they ring even when VisorPro isn’t running.</div>`;
      }
      const p = S.pomo;
      return seg + `<div class="pomo"><div data-pomoring>${ring(p.left / p.len, 132, 7, '#ff9f0a', mmss(p.left), p.phase.toUpperCase())}</div><div>
        <div class="go"><button class="btn big ${p.run ? 'run' : ''}" data-pomo>${ic(p.run ? 'pause' : 'play')} ${p.run ? 'Pause' : 'Start Focus'}</button><button class="btn" data-pomoplus aria-label="One more minute">${ic('plus')}</button><button class="btn" data-pomoskip aria-label="Skip">${ic('next')}</button></div>
        <div class="muted" style="font-size:11.5px;margin-top:8px">Next: Short Break · 5 min · starts by itself</div>
        <div class="pomo-card"><b>${p.done}</b> of 8 today<div class="weeks">${[4, 6, 3, 7, 5, 2].map((h) => `<i style="height:${h * 3}px"></i>`).join('')}<i class="t" style="height:${Math.max(3, p.done * 3)}px"></i></div></div></div></div>`;
    },

    menubar() {
      const hidden = ['bolt', 'eye', 'cup', 'globe', 'mic', 'timer', 'drive', 'brush', 'keyboard', 'gauge', 'shield', 'cloud'];
      const cards = [['battery', 'Battery', '84% · 6 hr left', null, '#30d158'], ['wifi', 'Wi‑Fi', S.wifi ? 'Home' : 'Off', 'wifi', '#0a84ff'], ['bluetooth', 'Bluetooth', S.bt ? 'AirPods Pro' : 'Off', 'bt', '#0a84ff'],
        ['speaker', 'Sound', '60% · MacBook Pro', null, '#ff375f'], ['cup', 'Keep Awake', S.keepAwake ? 'On' : 'Off', 'awake', '#a2845e'], [S.dark ? 'moon' : 'sun', 'Appearance', S.dark ? 'Dark' : 'Light', 'dark', '#5e5ce6']];
      const on = { wifi: S.wifi, bt: S.bt, awake: S.keepAwake, dark: S.dark };
      return `<div class="cap">Hidden behind the notch · ${hidden.length} icons</div><div class="mb-strip">${hidden.map((h) => `<button data-mbicon="${h}" aria-label="Menu bar icon">${ic(h)}</button>`).join('')}</div>
        <div class="cap" style="margin-bottom:6px">Status</div><div class="status">${cards.map(([i, t, d, k, c]) => `<button class="${k === null || on[k] ? 'on' : ''}" ${k ? `data-st="${k}"` : ''} style="--c:${c}"><span class="c">${ic(i)}</span><span><b>${t}</b><span>${d}</span></span></button>`).join('')}</div>`;
    },
  };

  const clipThumb = (c, s) => {
    if (c.k === 'color') return `<span class="thumb" style="width:${s}px;height:${s}px;background:${c.text}"></span>`;
    if (c.k === 'image') return `<span class="thumb shot" style="width:${s}px;height:${s}px;position:relative">${shotArt(0, true)}</span>`;
    const i = { link: 'globe', text: 'text', email: 'mail', phone: 'phone' }[c.k];
    return `<span class="thumb" style="width:${s}px;height:${s}px">${ic(i)}</span>`;
  };
  const clipPreview = (c) => {
    if (c.k === 'color') return `<div style="display:flex;gap:10px;align-items:center"><span style="width:44px;height:44px;border-radius:9px;background:${c.text}"></span><div><b>${c.text}</b><div class="muted" style="font-size:11px">rgb(255, 79, 154)</div></div></div>`;
    if (c.k === 'image') return `<div class="shot" style="position:relative;height:84px;border-radius:6px">${shotArt(0)}</div>`;
    return esc(c.text);
  };
  function shotArt(n, tiny) {
    const bg = [['#1d2a4a', '#5b3c8c'], ['#13312b', '#1f6b5c'], ['#3b2416', '#8c4a2b']][n % 3];
    return `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${bg[0]},${bg[1]})"></div>${tiny ? '' : `<div class="win" style="left:14%;top:18%;width:52%;height:58%"></div><div class="win" style="left:48%;top:38%;width:40%;height:46%;background:#2c2c32"></div>`}`;
  }
  const timersHTML = () => S.timers.length ? S.timers.map((t, n) => `<div class="row"><div><div style="font-size:12.5px">${esc(t.name)}</div><div class="dim" style="font-size:10.5px">${t.left > 0 ? `Ends ${clock(new Date(Date.now() + t.left * 1000))}` : 'Done'}</div></div><b>${mmss(t.left)}</b><button class="btn" data-tdel="${n}">${ic('x')}</button></div>`).join('')
    : '<div class="dim" style="font-size:12px;padding-top:4px">Pick a length above. In the app you can also type “4m tea” in search.</div>';
  const swText = () => { const t = S.sw.t; return `${Math.floor(t / 60)}:${pad(Math.floor(t % 60))}.${pad(Math.floor((t * 100) % 100))}`; };
  const lapsHTML = () => S.sw.laps.map((l, n) => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 0"><span class="muted">Lap ${S.sw.laps.length - n}</span><span>${l}</span></div>`).join('') || '<div class="dim">Laps show here.</div>';

  /* ---------- behaviour per view ---------- */
  const PHRASES = {
    'Good morning': { es: 'Buenos días', fr: 'Bonjour', de: 'Guten Morgen', ja: 'おはようございます' },
    'Thank you so much': { es: 'Muchas gracias', fr: 'Merci beaucoup', de: 'Vielen Dank', ja: '本当にありがとうございます' },
    'Where is the station?': { es: '¿Dónde está la estación?', fr: 'Où est la gare ?', de: 'Wo ist der Bahnhof?', ja: '駅はどこですか？' },
    'See you tomorrow': { es: 'Hasta mañana', fr: 'À demain', de: 'Bis morgen', ja: 'また明日' },
  };

  const AFTER = {
    widgets(v) {
      v.addEventListener('click', (e) => {
        if (e.target.closest('[data-np]')) return player(e.target.closest('[data-np]').dataset.np);
        if (e.target.closest('[data-join]')) return say('Joins Design review in Google Meet');
        if (e.target.closest('[data-pomo-toggle]')) { togglePomo(); return rerender(); }
        if (e.target.closest('[data-awake]')) { S.keepAwake = !S.keepAwake; say(S.keepAwake ? 'Your Mac stays awake' : 'Keep Awake off'); return rerender(); }
        if (e.target.closest('[data-dark]')) { S.dark = !S.dark; say(S.dark ? 'Dark Mode' : 'Light Mode'); return rerender(); }
        const run = e.target.closest('[data-run]'); if (run) return say(`Ran ${run.dataset.run}`);
        const go = e.target.closest('[data-go]'); if (go) setTab(go.dataset.go, { ret: 'widgets' });
      });
    },
    clipboard(v) {
      v.addEventListener('click', (e) => {
        const sec = e.target.closest('[data-sec]'); if (sec) { S.clipSection = sec.dataset.sec; return rerender(); }
        const r = e.target.closest('[data-clip]'); if (r) { S.clipSel = +r.dataset.clip; const c = S.clips[S.clipSel]; copy(c.text, `Copied ${c.k === 'image' ? 'the picture' : '“' + c.text.slice(0, 22) + (c.text.length > 22 ? '…' : '') + '”'}`); return rerender(); }
        const sv = e.target.closest('[data-saved]'); if (sv) { const s = S.saved[+sv.dataset.saved]; copy(s[2], `Copied ${s[1]}`); }
      });
      v.addEventListener('pointerover', (e) => {
        const r = e.target.closest('[data-clip]'); if (!r || +r.dataset.clip === S.clipSel) return;
        S.clipSel = +r.dataset.clip; const keep = v.querySelector('.cb-list').scrollTop; rerender(); body.querySelector('.cb-list').scrollTop = keep;
      });
    },
    captures(v) {
      v.addEventListener('click', (e) => { const c = e.target.closest('[data-cap]'); if (c) { S.capSel = +c.dataset.cap; rerender(); } });
      v.addEventListener('dblclick', () => say('Opens in Preview'));
      v.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', 'Screenshot 2:31 PM.png'); });
    },
    shelf(v) {
      const zone = v.querySelector('.drop');
      v.addEventListener('click', (e) => { const f = e.target.closest('[data-file]'); if (f) { S.shelfSel = +f.dataset.file; rerender(); } });
      v.addEventListener('dblclick', (e) => { const f = e.target.closest('[data-file]'); if (f) say(`Opens ${S.shelf[+f.dataset.file].n}`); });
      shelfDrop(zone);
    },
    shortcuts(v) {
      v.addEventListener('click', (e) => {
        const r = e.target.closest('[data-run]'); if (!r) return;
        const n = r.dataset.run;
        if (n === 'Today’s Date') return copy(now().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 'Typed today’s date');
        if (n === 'Dark Mode') { S.dark = !S.dark; return say(S.dark ? 'Dark Mode on' : 'Light Mode on'); }
        if (n === 'Play/Pause') return player('play');
        say(`Ran ${n}`);
      });
    },
    calendar(v) {
      v.addEventListener('click', (e) => {
        if (e.target.closest('[data-join]')) say('Joins Design review in Google Meet');
        if (e.target.closest('[data-newev]')) beginSearch('Lunch with Sam tomorrow at 1pm');
      });
    },
    tasks(v) {
      v.addEventListener('click', (e) => {
        const ck = e.target.closest('.ck'); if (!ck) return;
        const row = ck.closest('[data-task]'); const id = +row.dataset.task;
        row.classList.add('done', 'going');
        say('Ticked off');
        setTimeout(() => { S.tasks = S.tasks.filter((t) => t.id !== id); renderRail(); if (S.tab === 'tasks') rerender(); }, 850);
      });
      const input = v.querySelector('[data-newrem]');
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || !input.value.trim()) return;
        const { title, when } = parseWhen(input.value.trim());
        S.tasks.push({ id: Date.now(), t: title, when, list: 'Personal' });
        say('Added to Reminders'); renderRail(); rerender();
        body.querySelector('[data-newrem]').focus();
      });
    },
    notes(v) {
      v.addEventListener('click', (e) => {
        const n = e.target.closest('[data-note]'); if (n) { S.noteSel = +n.dataset.note; return rerender(); }
        if (e.target.closest('[data-newnote]')) { const id = Date.now(); S.notes.unshift({ id, body: '', m: 'Just now' }); S.noteSel = id; rerender(); body.querySelector('[data-notebody]').focus(); }
      });
      const ta = v.querySelector('[data-notebody]');
      ta.addEventListener('input', () => {
        const n = S.notes.find((x) => x.id === S.noteSel) || S.notes[0];
        n.body = ta.value; n.m = 'Just now';
        const row = v.querySelector(`[data-note="${n.id}"]`);
        if (row) row.innerHTML = `<b>${esc(n.body.split('\n')[0] || 'New Note')}</b><small>${esc(n.m)}  ${esc(n.body.split('\n').slice(1).join(' '))}</small>`;
      });
    },
    player(v) {
      v.addEventListener('click', (e) => { const b = e.target.closest('[data-np]'); if (b) player(b.dataset.np); });
      const sc = v.querySelector('[data-scrub]');
      const seek = (e) => { const r = sc.getBoundingClientRect(); S.pos = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * TRACKS[S.track].len; tick(true); };
      sc.addEventListener('pointerdown', (e) => { sc.setPointerCapture(e.pointerId); seek(e); sc.onpointermove = seek; });
      sc.addEventListener('pointerup', () => { sc.onpointermove = null; });
    },
    translate(v) {
      const ta = v.querySelector('[data-trin]'), out = v.querySelector('[data-trout]');
      const show = () => {
        const hit = Object.keys(PHRASES).find((p) => p.toLowerCase() === ta.value.trim().toLowerCase().replace(/[.!]$/, ''));
        out.className = 'out' + (hit ? '' : ' wait');
        out.textContent = hit ? PHRASES[hit][S.tr.to] : ta.value.trim() ? 'The app translates anything you type, on your Mac. Here, try one of the phrases below.' : '';
      };
      ta.addEventListener('input', () => { S.tr.input = ta.value; show(); });
      v.addEventListener('click', (e) => {
        const p = e.target.closest('[data-phrase]'); if (p) { ta.value = S.tr.input = p.dataset.phrase; show(); }
        if (e.target.closest('[data-trnext]')) { const order = ['es', 'fr', 'de', 'ja']; S.tr.to = order[(order.indexOf(S.tr.to) + 1) % order.length]; rerender(); }
      });
      show();
    },
    calculator(v) {
      const input = v.querySelector('[data-calcin]'), ans = v.querySelector('[data-calcans]'), tape = v.querySelector('[data-tape]');
      const drawTape = () => { tape.innerHTML = S.calc.tape.slice().reverse().map((t) => `<div class="row" data-use="${esc(t.r)}"><span class="muted">${esc(t.e)}</span><b>${esc(t.r)}</b></div>`).join(''); };
      const show = () => {
        S.calc.input = input.value;
        if (!input.value.trim()) { ans.className = 'ans err'; ans.textContent = 'Return keeps the answer on the tape.'; return; }
        const r = calc(input.value);
        ans.className = 'ans' + (r == null ? ' err' : '');
        ans.innerHTML = r == null ? 'Keep typing…' : `= ${esc(r)}`;
      };
      const commit = () => { const r = calc(input.value); if (r == null) return; S.calc.tape.push({ e: input.value, r }); input.value = ''; show(); drawTape(); };
      input.addEventListener('input', show);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); });
      v.addEventListener('click', (e) => {
        const u = e.target.closest('[data-use]'); if (u) { input.value += u.dataset.use.replace(/[^\d.]/g, ''); show(); }
        const k = e.target.closest('[data-key]'); if (!k) return;
        const key = k.dataset.key;
        if (key === 'C') input.value = '';
        else if (key === '⌫') input.value = input.value.slice(0, -1);
        else if (key === '=') return commit();
        else if (key === 'ans') input.value += (S.calc.tape.at(-1)?.r || '').replace(/[^\d.\-]/g, '');
        else input.value += { '÷': '/', '×': '*', '−': '-', '√': 'sqrt(', 'π': 'pi' }[key] || key;
        show();
      });
      show(); drawTape();
    },
    clock(v) {
      v.addEventListener('click', (e) => {
        const p = e.target.closest('[data-part]'); if (p) { S.clockPart = p.dataset.part; return rerender(); }
        if (e.target.closest('[data-pomo]')) { togglePomo(); return rerender(); }
        if (e.target.closest('[data-pomoplus]')) { S.pomo.left += 60; S.pomo.len = Math.max(S.pomo.len, S.pomo.left); return rerender(); }
        if (e.target.closest('[data-pomoskip]')) { finishPomo(); return rerender(); }
        const t = e.target.closest('[data-timer]'); if (t) { const m = +t.dataset.timer; S.timers.unshift({ name: m >= 60 ? '1 hour' : `${m} minutes`, left: m * 60, run: true }); renderRail(); return rerender(); }
        const d = e.target.closest('[data-tdel]'); if (d) { S.timers.splice(+d.dataset.tdel, 1); renderRail(); return rerender(); }
        if (e.target.closest('[data-swgo]')) { S.sw.run = !S.sw.run; S.sw.t0 = performance.now() - S.sw.t * 1000; swLoop(); return rerender(); }
        if (e.target.closest('[data-swlap]')) { if (S.sw.run) S.sw.laps.unshift(swText()); else { S.sw.t = 0; S.sw.laps = []; } return rerender(); }
        if (e.target.closest('[data-alarm]')) { S.alarm = !S.alarm; return rerender(); }
      });
    },
    menubar(v) {
      v.addEventListener('click', (e) => {
        if (e.target.closest('[data-mbicon]')) return say('Opens that icon’s menu, right there');
        const s = e.target.closest('[data-st]'); if (!s) return;
        const k = s.dataset.st;
        if (k === 'wifi') S.wifi = !S.wifi; if (k === 'bt') S.bt = !S.bt; if (k === 'awake') S.keepAwake = !S.keepAwake; if (k === 'dark') S.dark = !S.dark;
        rerender();
      });
    },
    search(v) {
      const input = v.querySelector('[data-q]');
      input.addEventListener('input', () => { S.search.q = input.value; S.search.sel = 0; drawResults(v); });
      v.addEventListener('click', (e) => {
        const h = e.target.closest('[data-hint]'); if (h) { input.value = S.search.q = h.dataset.hint; drawResults(v); input.focus(); }
        const r = e.target.closest('[data-res]'); if (r) runResult(+r.dataset.res);
      });
      drawResults(v);
      // At once: anything typed right after ⌘K belongs in the field.
      input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    },
  };

  function shelfDrop(zone) {
    // A file from the visitor's own Mac: its name and kind are shown, nothing is read or sent.
    const area = body;
    area.ondragover = (e) => { if (S.tab !== 'shelf') return; e.preventDefault(); zone && zone.classList.add('on'); };
    area.ondragleave = (e) => { if (!area.contains(e.relatedTarget)) zone && zone.classList.remove('on'); };
    area.ondrop = (e) => {
      if (S.tab !== 'shelf') return;
      e.preventDefault(); zone && zone.classList.remove('on');
      const files = [...(e.dataTransfer.files || [])];
      if (!files.length) { const t = e.dataTransfer.getData('text/plain'); if (t) files.push({ name: t }); }
      files.forEach((f) => { const x = (f.name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase(); S.shelf.unshift({ n: f.name, x, c: { PDF: '#ff453a', PNG: '#30d158', JPG: '#30d158', JPEG: '#30d158', ZIP: '#8e8e93', MOV: '#bf5af2', MP4: '#bf5af2' }[x] || '#0a84ff' }); });
      if (files.length) { S.shelfSel = 0; say(files.length === 1 ? `Added ${files[0].name}` : `Added ${files.length} files`); rerender(); }
    };
  }

  /* ---------- search (⌘K, the magnifier, or typing in the panel) ---------- */
  function beginSearch(q) { open(); S.search = { q, sel: 0 }; renderRail(); renderView(true); window.dispatchEvent(new CustomEvent('vp:search')); }
  function viewSearch() {
    return `<div class="srch-field">${ic('search')}<input data-q value="${esc(S.search.q)}" placeholder="Search VisorPro, or type a sum" aria-label="Search" autocomplete="off" spellcheck="false"><span class="kc">esc</span></div><div class="srch-res scroll" data-res-list></div>`;
  }
  function results(q) {
    const out = []; const t = q.trim(); if (!t) return out;
    const r = calc(t); if (r != null && /[\d)]/.test(t) && /[-+*/^%x]|to|in|sqrt|sin|cos|pi/.test(t)) out.push({ kind: 'Answer', title: r, sub: `= ${t}`, run: () => copy(r.replace(/[^\d.\-]/g, ''), `Copied ${r}`) });
    const m = t.match(/^(\d+)\s*(m|min|h)\s*(.*)$/i);
    if (m) out.push({ kind: 'Clock', icon: 'timer', title: `Start a ${m[1]}${m[2][0].toLowerCase()} timer${m[3] ? ' for ' + m[3] : ''}`, run: () => { S.timers.unshift({ name: m[3] || `${m[1]} ${m[2][0] === 'h' ? 'hours' : 'minutes'}`, left: +m[1] * (m[2][0].toLowerCase() === 'h' ? 3600 : 60), run: true }); S.clockPart = 'timers'; setTab('clock'); say('Timer started'); } });
    const lc = t.toLowerCase();
    TABS.filter(([, n]) => n.toLowerCase().startsWith(lc)).forEach(([id, n, i]) => out.push({ kind: 'Tabs', icon: i, title: n, run: () => setTab(id) }));
    S.clips.filter((c) => c.text.toLowerCase().includes(lc)).slice(0, 3).forEach((c) => out.push({ kind: 'Clipboard', icon: 'clipboard', title: c.text, run: () => copy(c.text) }));
    S.tasks.filter((x) => x.t.toLowerCase().includes(lc)).forEach((x) => out.push({ kind: 'Reminders', icon: 'checklist', title: x.t, run: () => setTab('tasks') }));
    EVENTS.filter((x) => x.t.toLowerCase().includes(lc)).forEach((x) => out.push({ kind: 'Calendar', icon: 'calendar', title: x.t, sub: clock(x.s), run: () => setTab('calendar') }));
    S.notes.filter((x) => x.body.toLowerCase().includes(lc)).slice(0, 2).forEach((x) => out.push({ kind: 'Notes', icon: 'notes', title: x.body.split('\n')[0], run: () => { S.noteSel = x.id; setTab('notes'); } }));
    if (!r) {
      out.push({ kind: 'Actions', icon: 'checklist', title: `Add Reminder: ${parseWhen(t).title}`, run: () => { const p = parseWhen(t); S.tasks.push({ id: Date.now(), t: p.title, when: p.when, list: 'Personal' }); renderRail(); setTab('tasks'); say('Added to Reminders'); } });
      out.push({ kind: 'Actions', icon: 'notes', title: `New Note: ${t}`, run: () => { const id = Date.now(); S.notes.unshift({ id, body: t, m: 'Just now' }); S.noteSel = id; setTab('notes'); } });
    }
    return out;
  }
  function drawResults(v) {
    const list = v.querySelector('[data-res-list]'); const rs = results(S.search.q); S.search.rs = rs;
    if (!rs.length) {
      list.innerHTML = `<div class="muted" style="font-size:12.5px;padding:6px 4px">Find anything VisorPro holds, or work something out. Try:</div><div class="srch-hint">${['2+3*4', '20 usd to eur', '10m tea', 'dana', 'Calculator', 'call mum tomorrow'].map((h) => `<button data-hint="${h}">${h}</button>`).join('')}</div>`;
      return;
    }
    let last = '';
    list.innerHTML = rs.map((r, n) => {
      const head = r.kind !== last ? `<span class="cap">${r.kind}</span>` : ''; last = r.kind;
      if (r.kind === 'Answer') return head + `<div class="ansr ${n === S.search.sel ? 'sel' : ''}" data-res="${n}"><b>${esc(r.title)}</b>${esc(r.sub)}<span style="margin-left:auto;font-size:11px">↩ Copy</span></div>`;
      return head + `<div class="row ${n === S.search.sel ? 'sel' : ''}" data-res="${n}"><span class="badge-sq" style="background:rgba(255,255,255,.08)">${ic(r.icon)}</span>${esc(r.title)}${r.sub ? `<span class="dim" style="margin-left:auto">${esc(r.sub)}</span>` : ''}</div>`;
    }).join('');
  }
  function runResult(n) { const r = S.search && S.search.rs && S.search.rs[n]; if (!r) return; S.search = null; renderRail(); renderView(true); r.run(); }

  function onKey(e) {
    if (!S.open) {
      // ⌃⌥⌘M opens it, as in the app.
      if (e.key.toLowerCase() === 'm' && e.ctrlKey && e.altKey && e.metaKey) { e.preventDefault(); open(); }
      return;
    }
    // Typing in one of the page's own fields stays there.
    if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName) && !root.contains(document.activeElement)) return;
    const inField = /INPUT|TEXTAREA/.test(document.activeElement?.tagName) && root.contains(document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (S.search) { S.search = null; renderRail(); renderView(true); } else if (inField) document.activeElement.blur(); else close();
      return;
    }
    if (S.search) {
      const q = view && view.querySelector('[data-q]');
      if (q && document.activeElement !== q && e.key.length === 1 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); q.focus(); q.value += e.key; q.dispatchEvent(new Event('input')); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = (S.search.rs || []).length; if (n) { S.search.sel = (S.search.sel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; drawResults(view); } }
      if (e.key === 'Enter') { e.preventDefault(); runResult(S.search.sel); }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); beginSearch(''); return; }
    if (e.metaKey && /^[0-9]$/.test(e.key)) { const i = e.key === '0' ? 9 : +e.key - 1; if (TABS[i]) { e.preventDefault(); setTab(TABS[i][0]); } return; }
    if (S.tab === 'clock' && S.clockPart === 'pomodoro' && e.key === ' ' && !inField) { e.preventDefault(); togglePomo(); rerender(); return; }
    // Typing anywhere that isn't a field starts a search with it, as in the app.
    if (!inField && !e.metaKey && !e.ctrlKey && !e.altKey && /^[\p{L}\p{N}]$/u.test(e.key) && root.matches(':hover')) { e.preventDefault(); beginSearch(e.key); }
  }

  /* ---------- live things: music, Pomodoro, timers, countdowns ---------- */
  function player(cmd) {
    const tr = () => TRACKS[S.track];
    if (cmd === 'play') S.playing = !S.playing;
    if (cmd === 'next') { S.track = (S.track + 1) % TRACKS.length; S.pos = 0; S.playing = true; }
    if (cmd === 'prev') { if (S.pos > 3) S.pos = 0; else S.track = (S.track + TRACKS.length - 1) % TRACKS.length; S.pos = 0; }
    if (cmd === 'back') S.pos = Math.max(0, S.pos - 15);
    if (cmd === 'fwd') S.pos = Math.min(tr().len - 1, S.pos + 15);
    renderRail(); rerender();
  }
  function togglePomo() { S.pomo.run = !S.pomo.run; say(S.pomo.run ? 'Focus started' : 'Paused'); renderRail(); }
  function finishPomo() {
    const p = S.pomo;
    if (p.phase === 'Focus') { p.done++; p.phase = 'Short Break'; p.len = p.left = 300; } else { p.phase = 'Focus'; p.len = p.left = 1500; }
    p.run = false; say(p.phase === 'Focus' ? 'Break’s over' : 'Focus done · take a break');
  }
  function swLoop() {
    if (!S.sw.run) return;
    S.sw.t = (performance.now() - S.sw.t0) / 1000;
    const el = body.querySelector('[data-sw]'); if (el) el.textContent = swText();
    requestAnimationFrame(swLoop);
  }
  function tick(quiet) {
    const tr = TRACKS[S.track];
    if (!quiet) {
      if (S.playing) { S.pos += 1; if (S.pos >= tr.len) { S.track = (S.track + 1) % TRACKS.length; S.pos = 0; if (S.open && (S.tab === 'player' || S.tab === 'widgets') && !S.search) rerender(); } }
      if (S.pomo.run) { S.pomo.left -= 1; if (S.pomo.left <= 0) { finishPomo(); if (S.open) rerender(); } }
      S.timers.forEach((t) => { if (t.run && t.left > 0) { t.left -= 1; if (t.left === 0) { t.run = false; say(`${t.name} · done`); renderRail(); } } });
    }
    if (!S.open || S.search || !view) return;
    const len = TRACKS[S.track].len;
    view.querySelectorAll('[data-np-bar]').forEach((b) => { b.style.width = (S.pos / len) * 100 + '%'; });
    view.querySelectorAll('[data-knob]').forEach((b) => { b.style.left = (S.pos / len) * 100 + '%'; });
    view.querySelectorAll('[data-np-pos]').forEach((b) => { b.textContent = mmss(S.pos); b.nextElementSibling.textContent = '-' + mmss(len - S.pos); });
    const ev = nextEvent();
    view.querySelectorAll('[data-cd]').forEach((b) => { b.textContent = `${clock(ev.s)} · ${countdown(ev)}`; });
    view.querySelectorAll('[data-cd2]').forEach((b) => { b.textContent = countdown(ev); });
    const pr = view.querySelector('[data-pomoring]'); if (pr) pr.innerHTML = ring(S.pomo.left / S.pomo.len, 132, 7, '#ff9f0a', mmss(S.pomo.left), S.pomo.phase.toUpperCase());
    const wf = view.querySelector('[data-pomo-toggle]'); if (wf) wf.innerHTML = ring(S.pomo.left / S.pomo.len, 58, 4, '#ff9f0a', mmss(S.pomo.left), S.pomo.run ? '❚❚' : '▶');
    const tm = view.querySelector('[data-timers]'); if (tm) tm.innerHTML = timersHTML();
  }

  /* ---------- a small, safe calculator: numbers, + − × ÷ ^ %, brackets, a few functions, units, money ---------- */
  const UNITS = { km: ['len', 1000], m: ['len', 1], cm: ['len', .01], mm: ['len', .001], mi: ['len', 1609.344], ft: ['len', .3048], in: ['len', .0254], yd: ['len', .9144],
    kg: ['mass', 1], g: ['mass', .001], lb: ['mass', .45359237], oz: ['mass', .028349523], l: ['vol', 1], ml: ['vol', .001], gal: ['vol', 3.785411784] };
  function calc(src) {
    const s = src.trim().toLowerCase().replace(/,/g, '');
    const conv = s.match(/^(.+?)\s*([a-z$€£¥]+)\s+(?:to|in)\s+([a-z$€£¥]+)$/);
    if (conv) {
      const v = evalExpr(conv[1]); if (v == null) return null;
      const cur = (c) => ({ $: 'USD', usd: 'USD', dollars: 'USD', '€': 'EUR', eur: 'EUR', euros: 'EUR', '£': 'GBP', gbp: 'GBP', pounds: 'GBP', '¥': 'JPY', jpy: 'JPY', yen: 'JPY', cad: 'CAD', aud: 'AUD' }[c]);
      const a = cur(conv[2]), b = cur(conv[3]), C = VP.pricing && VP.pricing.currencies;
      if (a && b && C && C[a] && C[b]) return `${fmt(v / C[a].rate * C[b].rate, 2)} ${b}`;
      if (conv[2] === 'c' && conv[3] === 'f') return `${fmt(v * 9 / 5 + 32)} °F`;
      if (conv[2] === 'f' && conv[3] === 'c') return `${fmt((v - 32) * 5 / 9)} °C`;
      const u = UNITS[conv[2]], w = UNITS[conv[3]];
      if (u && w && u[0] === w[0]) return `${fmt(Math.round(v * u[1] / w[1] * 1e4) / 1e4)} ${conv[3]}`;
      return null;
    }
    const v = evalExpr(s); return v == null ? null : fmt(v);
  }
  const fmt = (v, d) => { if (!isFinite(v)) return '∞'; if (d != null) return v.toFixed(d); const r = Math.round(v * 1e10) / 1e10; return Math.abs(r) >= 1e12 ? r.toExponential(6) : String(r); };
  function evalExpr(s) {
    const t = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, '');
    if (!t || !/^[0-9.+\-*/^%()a-z]+$/.test(t)) return null;
    let i = 0;
    const peek = () => t[i];
    function num() { const m = t.slice(i).match(/^(\d+\.?\d*|\.\d+)/); if (!m) return null; i += m[0].length; return parseFloat(m[0]); }
    function atom() {
      if (peek() === '(') { i++; const v = add(); if (peek() === ')') i++; return v; }
      if (peek() === '-') { i++; const v = pow(); return v == null ? null : -v; }
      const name = t.slice(i).match(/^[a-z]+/);
      if (name) {
        i += name[0].length; const f = name[0];
        if (f === 'pi') return Math.PI; if (f === 'e') return Math.E;
        const fn = { sqrt: Math.sqrt, sin: (x) => Math.sin(x * Math.PI / 180), cos: (x) => Math.cos(x * Math.PI / 180), tan: (x) => Math.tan(x * Math.PI / 180), ln: Math.log, log: Math.log10, abs: Math.abs }[f];
        if (!fn) return null; const v = atom(); return v == null ? null : fn(v);
      }
      return num();
    }
    function post() { let v = atom(); while (v != null && peek() === '%') { i++; v = v / 100; } return v; }
    function pow() { const b = post(); if (b != null && peek() === '^') { i++; const e = pow(); return e == null ? null : Math.pow(b, e); } return b; }
    function mul() { let v = pow(); while (v != null && (peek() === '*' || peek() === '/' || (peek() === '(') || /[a-z]/.test(peek() || ''))) { const op = peek(); if (op === '*' || op === '/') i++; const r = pow(); if (r == null) return null; v = op === '/' ? v / r : v * r; } return v; }
    function add() { let v = mul(); while (v != null && (peek() === '+' || peek() === '-')) { const op = t[i++]; const r = mul(); if (r == null) return null; v = op === '+' ? v + r : v - r; } return v; }
    try { const v = add(); return i === t.length && v != null && !isNaN(v) ? v : null; } catch (e) { return null; }
  }
  function parseWhen(text) {
    const m = text.match(/\b(today|tomorrow|tonight|on (?:mon|tues|wednes|thurs|fri|satur|sun)day)\b(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i);
    if (!m) return { title: text, when: 'Today' };
    const title = text.replace(m[0], '').replace(/\s{2,}/g, ' ').trim();
    const day = m[1][0].toUpperCase() + m[1].slice(1).replace(/^On /i, '');
    return { title: title[0] ? title[0].toUpperCase() + title.slice(1) : text, when: m[2] ? `${day}, ${m[2].toUpperCase()}` : day };
  }

  /* ---------- looks ---------- */
  function applyLook() {
    root.dataset.look = S.look;
    root.style.setProperty('--acc', S.acc);
    root.style.setProperty('--acc-soft', S.acc + '38');
  }

  function scale() {
    if (host) {
      // Inside a frame on the page (a drawn Mac's screen): fit its width, never larger than opt.max.
      const s = Math.max(opt.min || 0, Math.min(opt.max || 1, (host.clientWidth * (opt.fit || 1) - (opt.margin ?? 24)) / 620));
      root.style.setProperty('--s', s.toFixed(3));
      host.style.setProperty('--panel-h', (330 * s).toFixed(0) + 'px');
      host.style.setProperty('--vs', s.toFixed(3));
      return;
    }
    const w = window.innerWidth, h = window.innerHeight;
    const s = w < 700 ? (w - 16) / 620 : Math.max(.8, Math.min(1.25, (h - 330) / 330, (w - 80) / 620));
    root.style.setProperty('--s', s.toFixed(3));
    document.documentElement.style.setProperty('--s', s.toFixed(3));
    document.documentElement.style.setProperty('--panel-h', (330 * s).toFixed(0) + 'px');
  }

  VP.demo = {
    // mount() drops it from the page's top edge; mount({ host }) puts it at the top of that element instead.
    mount(o = {}) { opt = o; host = o.host || null; if (o.look) S.look = o.look; if (o.accent) S.acc = o.accent; if (o.tab) S.tab = o.tab; mount(); scale(); window.addEventListener('resize', scale); if (host && window.ResizeObserver) { ro = new ResizeObserver(scale); ro.observe(host); } },
    // Moves the panel, as it is, into another frame on the page (one notch, several drawn screens).
    moveTo(el, o = {}) { if (!el || el === host) return; opt = { ...opt, ...o }; host = el; root.classList.add('inline'); el.appendChild(root); scale(); if (ro) { ro.disconnect(); ro.observe(el); } },
    host: () => host,
    open, close,
    pin(on) { S.pinned = !!on; root.querySelector('[data-t="pin"]').classList.toggle('on', S.pinned); },
    tab: () => S.tab,
    calc: (t) => calc(t),
    // Runs the first thing search would offer for this text, as Return does, and says what it was.
    run(q) { const rs = results(q); if (!rs[0]) return null; open(); S.search = null; renderRail(); renderView(true); rs[0].run(); return { kind: rs[0].kind, title: rs[0].title }; }, setTab: (t) => { open(); setTab(t); },
    isOpen: () => S.open,
    setLook(l) { S.look = l; applyLook(); },
    setAccent(c) { S.acc = c; applyLook(); },
    search: beginSearch,
  };
})();
