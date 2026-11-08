/* A Mac screen with the notch, and the VisorPro panel that drops out of it.
   new VP.Mac(element, { interactive, look, accent, tab, icons }) */
(function () {
  const VP = window.VP, I = VP.icon;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const mmss = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const t12 = d => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const APP = n => `assets/apps/${n}.png`;

  const TRACKS = [
    { t: 'Low Tide Hours', a: 'Halden', d: 254, art: 'radial-gradient(70% 70% at 30% 28%, #ffd27a, transparent 60%), radial-gradient(80% 80% at 82% 82%, #e2477d, transparent 65%), #3b1f6b' },
    { t: 'Paper Lanterns', a: 'Mira Okoye', d: 213, art: 'radial-gradient(60% 60% at 70% 30%, #7af5ff, transparent 60%), radial-gradient(90% 80% at 20% 90%, #2d5bff, transparent 65%), #0b1d3f' },
    { t: 'Greenhouse', a: 'The Quiet Fields', d: 301, art: 'radial-gradient(70% 60% at 40% 70%, #c6f36b, transparent 60%), radial-gradient(70% 70% at 80% 20%, #0f9b6b, transparent 65%), #10261c' },
  ];
  const STATUS = ['wifi', 'battery', 'search', 'speaker', 'bluetooth', 'cloud', 'shield', 'gauge', 'keyboard', 'brush', 'drive', 'timer', 'mic', 'globe', 'cup', 'eye', 'bolt', 'chip', 'leaf', 'heart', 'tag', 'layers'];
  /* the app's tabs, in its default order, with the colour each tool uses (VisorSettings.swift) */
  const ALL = [['widgets', 'Widgets', 'grid2', '#0a84ff'], ['clipboard', 'Clipboard', 'clipboard', '#ff9f0a'], ['captures', 'Captures', 'captures', '#ff375f'], ['shelf', 'Shelf', 'tray', '#40c8e0'],
    ['shortcuts', 'Shortcuts', 'shortcuts', '#ffd60a'], ['calendar', 'Calendar', 'calendar', '#ff453a'], ['tasks', 'Reminders', 'checklist', '#64d2ff'], ['notes', 'Notes', 'notelines', '#ac8e68'],
    ['player', 'Player', 'player', '#63e6e2'], ['translate', 'Translate', 'charbubble', '#0a84ff'], ['calculator', 'Calculator', 'fx', '#bf5af2'], ['pomodoro', 'Clock', 'clock', '#30d158'], ['menuBar', 'Menu Bar', 'menubar', '#5e5ce6']];
  const DEMO = ['widgets', 'clipboard', 'shortcuts', 'calendar', 'player'];
  const SHORTS = [['termTile', 'Terminal', 0], ['doc', 'Downloads', 0], ['dashedRect', 'Screenshot', 1], ['copy', 'Copy', 1], ['clipboard', 'Paste', 1], ['arrowUpRight', 'Previous App', 1], ['grid4', 'Mission Control', 1],
    ['play', 'Play/Pause', 1], ['speaker', 'Mute', 1], ['calendar', 'Today’s Date', 1], ['lock', 'Lock Screen', 1]];
  const ROW = [['safari', 1], ['messages', 1], ['mail', 1], ['music', 1], ['notes', 0], ['calendar', 0], ['terminal', 1]];

  class Mac {
    constructor(root, o = {}) {
      this.root = root; this.o = o;
      /* c: how this panel is set up (any of it can change later with configure) */
      this.c = Object.assign({ tabs: DEMO, names: false, tall: false, rowTop: false, each: false, rowShortcuts: null, apps: ROW }, o.config || {});
      this.s = { tab: o.tab || 'widgets', look: o.look || 'studio', accent: o.accent || '#ff5ca8', open: false, pinned: false, playing: true, ti: 0, pos: 71, timer: 1500, timerOn: false,
        awake: false, done: {}, clipSeg: 'History', poc: false, sel: -1, from: null };
      const now = new Date(); const meet = new Date(Math.ceil((now.getTime() + 12 * 60e3) / 6e4) * 6e4);
      this.meet = meet; this.meetEnd = new Date(meet.getTime() + 45 * 60e3);
      this.build(); this.setIcons(o.icons || 9); this.configure({});
      if (o.interactive) this.wire();
      setInterval(() => this.tick(), 1000);
      new ResizeObserver(() => this.fit()).observe(root);
    }

    build() {
      this.root.classList.add('mac');
      this.root.innerHTML = `<div class="scr">
        <div class="mb"><div class="l"><span class="apple"></span><b>Finder</b><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span></div><div class="r"></div></div>
        <div class="pn" data-look="${this.s.look}"><div class="bg"></div><div class="glow"></div><div class="edge"></div>
          <div class="in"><div class="hd"><span class="ttl"><button class="back" aria-label="Back to Widgets">${I('chevron').replace('<svg', '<svg style="transform:scaleX(-1)"')}</button><span class="tn"></span></span><span class="msg"></span>
            <span class="tools"><button data-a="search" aria-label="Search">${I('search')}</button><button data-a="pin" aria-label="Pin">${I('pin')}</button><button data-a="look" aria-label="Looks">${I('sliders')}</button><button data-a="gear" aria-label="Settings">${I('gear')}</button></span></div>
          <nav class="rail" aria-label="Tabs"></nav><div class="main"><div class="view"></div><div class="approw"></div>
            <div class="srch"><div class="sfield">${I('search')}<input placeholder="Search or type a sum" aria-label="Search"><button class="x" data-a="sclear" aria-label="Clear">${I('xcircle')}</button><span class="key">esc</span></div><div class="sres"></div>
              <div class="shints"><span><span class="key">↑</span><span class="key">↓</span>Move</span><span><span class="key">↩</span>Open</span><span><span class="key">⌘K</span>Search</span></div></div></div></div></div>
        <div class="notch"><div class="cam"></div><div class="ring"></div><div class="pk"></div></div><div class="hot"></div>
        <svg class="cursor" viewBox="0 0 20 30" aria-hidden="true"><path d="M2 2v21.5l5.3-5.1 3.4 8.1 3.6-1.5-3.4-7.9h7.4z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </div>`;
      const q = s => this.root.querySelector(s);
      this.el = { scr: q('.scr'), pn: q('.pn'), rail: q('.rail'), view: q('.view'), row: q('.approw'), main: q('.main'), tn: q('.tn'), back: q('.back'), msg: q('.msg'), srch: q('.srch'), sin: q('.srch input'), sres: q('.sres'), notch: q('.notch'), hot: q('.hot'), cursor: q('.cursor'), r: q('.mb .r'), pk: q('.pk') };
      this.el.pn.style.setProperty('--acc', this.s.accent);
      if (this.o.shot) {
        /* the app's own picture of the panel, not a drawing of it */
        this.el.pn.className = 'pn shot'; this.el.pn.innerHTML = '';
        this.shotImg(this.o.shot);
      }
      this.el.r.innerHTML = `${STATUS.map((k, i) => `<span class="st" data-i="${i}">${I(k)}</span>`).join('')}<span class="clock"></span>`;
      this.clock();
    }

    /* how much of the screen shows: vx/vw in points, y0 in pixels */
    view(vx = 0, vw = 1512, y0 = 0) { this.v = { vx, vw, y0 }; this.fit() }
    fit() {
      const W = this.root.clientWidth; if (!W) return; const v = this.v || { vx: 0, vw: 1512, y0: 0 };
      const k = W / v.vw; this.k = k;
      this.el.scr.style.transform = `translate(${(-v.vx * k).toFixed(2)}px, ${v.y0.toFixed(2)}px) scale(${k.toFixed(4)})`;
      if (this.o.height) this.root.style.height = (this.o.height * k + v.y0) + 'px';
    }

    /* the menu bar fills up from the right; icons that reach the notch disappear behind it */
    setIcons(n) {
      this.nIcons = n;
      const clockW = 150, step = 28, right = 1512 - 18;
      this.el.r.querySelectorAll('.st').forEach(el => {
        const i = +el.dataset.i; const x = right - clockW - (i + 1) * step;
        el.style.position = 'absolute'; el.style.top = '0'; el.style.right = (clockW + i * step) + 'px';
        const shown = i < n, under = x < 848;
        el.style.opacity = shown && !under ? 1 : 0;
        el.style.transform = shown ? 'none' : 'scale(.2)';
      });
    }
    clock() { const d = new Date(); this.el.r.querySelector('.clock').textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '  ' + t12(d) }
    cursor(x, y, show = true) { const c = this.el.cursor; c.style.setProperty('--cx', x + 'px'); c.style.setProperty('--cy', y + 'px'); c.style.opacity = show ? 1 : 0 }

    /* opening: either animated, or set by hand (0…1) for scroll-driven scenes */
    open(tab) { if (this.o.shot && tab) this.setShot('tab-' + tab, 'f'); if (this.s.open && (!tab || tab === this.s.tab)) return; if (tab) this.s.tab = tab; this.el.notch.classList.remove('peek'); this.el.pn.classList.add('anim', 'open'); this.el.pn.style.removeProperty('--sx'); this.el.pn.style.removeProperty('--sy'); this.el.pn.style.removeProperty('--po'); this.s.open = true; this.render() }
    close() { this.el.pn.classList.add('anim'); this.el.pn.classList.remove('open'); this.s.open = false; if (!this.o.shot) this.closeSearch(); this.s.from = null }
    drop(t) {
      const P = this.el.pn; P.classList.remove('anim');
      const e = t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3) * Math.cos(t * 2.2); // a spring that settles once
      P.style.setProperty('--sx', (0.298 + (1 - 0.298) * e).toFixed(4));
      P.style.setProperty('--sy', (0.126 + (1 - 0.126) * e).toFixed(4));
      P.style.setProperty('--po', clamp(t * 6, 0, 1).toFixed(3));
      P.classList.toggle('open', t > .98); P.style.setProperty('--ci', clamp((t - .55) / .4, 0, 1).toFixed(3));
      const inner = P.querySelector('.in'); if (inner) inner.style.opacity = clamp((t - .55) / .4, 0, 1);
    }
    tabs() { return this.c.tabs.map(id => ALL.find(t => t[0] === id)).filter(Boolean) }
    /* ---------- picture mode ---------- */
    shotImg(name, dir) {
      const img = new Image(); img.className = 'pimg' + (dir ? ' in-' + dir : ''); img.alt = 'VisorPro'; img.decoding = 'async';
      img.src = `assets/shots/${name}.webp`; this.shot = name;
      const place = () => { const w = (img.naturalWidth || 1360) / 2; this.el.pn.style.setProperty('--iw', w + 'px'); this.el.pn.style.left = (756 - w / 2) + 'px' };
      img.complete ? place() : img.addEventListener('load', place, { once: true });
      const old = [...this.el.pn.querySelectorAll('.pimg')];
      this.el.pn.appendChild(img);
      if (old.length) setTimeout(() => old.forEach(o => o.remove()), dir ? 320 : 0);
    }
    setShot(name, dir) { if (name !== this.shot) this.shotImg(name, dir) }
    configure(part) {
      if (this.o.shot) return;
      for (const [k, v] of Object.entries(part)) if (v !== undefined) this.c[k] = v;
      const c = this.c, P = this.el.pn;
      if (!this.tabs().some(t => t[0] === this.s.tab)) this.s.tab = this.tabs()[0][0];
      const ph = c.tall ? 326 : 254, n = this.tabs().length, railH = ph - 32 - 8.5 - 16, gap = n > 8 ? 1 : 5;
      const item = clamp(Math.floor((railH - (n - 1) * gap) / n), 14, 28);
      P.style.setProperty('--ph', ph + 'px'); P.style.setProperty('--rail-w', (c.names ? 135 : 44) + 'px');
      P.style.setProperty('--ti', item + 'px'); P.style.setProperty('--tg', gap + 'px'); P.style.setProperty('--tis', Math.min(13, Math.round(item * .55)) + 'px');
      P.classList.toggle('names', c.names); P.classList.toggle('each', c.each); P.classList.toggle('tall', c.tall);
      this.render();
    }
    setLook(look, accent) { if (look) this.s.look = look; if (accent) this.s.accent = accent; this.el.pn.dataset.look = this.s.look; this.el.pn.style.setProperty('--acc', this.s.accent); this.render() }
    say(text, icon = 'check') { const m = this.el.msg; m.innerHTML = I(icon) + esc(text); m.classList.add('on'); clearTimeout(this.mt); this.mt = setTimeout(() => m.classList.remove('on'), 1800) }
    peek(kind) {
      if (this.s.open) return;
      if (this.o.shot) {
        let pk = this.el.scr.querySelector('.peekimg');
        if (!pk) { pk = new Image(); pk.className = 'peekimg'; pk.alt = 'A peek'; pk.src = 'assets/shots/peek.webp'; this.el.scr.appendChild(pk) }
        pk.classList.add('on'); clearTimeout(this.pt); this.pt = setTimeout(() => pk.classList.remove('on'), 3200); return;
      } const n = this.el.notch, tr = TRACKS[this.s.ti];
      const K = { track: [`<span><span class="a" style="--art:${tr.art}"></span>${esc(tr.t)}</span><span>${esc(tr.a)}</span>`],
        meet: [`<span>${I('calendar')}Design review</span><span>in 5 min</span>`] }[kind];
      this.el.pk.innerHTML = K[0]; n.classList.add('peek'); clearTimeout(this.pt); this.pt = setTimeout(() => n.classList.remove('peek'), 3200);
    }

    /* ---------- drawing ---------- */
    render(dir, keepRail) {
      if (this.o.shot) return;
      const s = this.s;
      const TABS = this.tabs();
      this.el.tn.textContent = TABS.find(t => t[0] === s.tab)[1];
      this.el.back.classList.toggle('on', !!s.from);
      const tr = TRACKS[s.ti];
      if (keepRail) this.el.rail.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === s.tab));
      else this.el.rail.innerHTML = TABS.map(([id, n, ic, tint]) => {
        let inner = I(ic), extra = '';
        if (id === 'calendar') { inner = `<span class="pv-day"><span>${new Date().getDate()}</span></span>`; extra = '<span class="pbdg"></span>' }
        if (id === 'player' && s.playing) { inner = `<span class="pv-art" style="--art:${tr.art}"></span>`; extra = '<span class="bars"><i></i><i></i><i></i></span>' }
        return `<button class="${id === s.tab ? 'on' : ''}" data-tab="${id}" aria-label="${n}" title="${n}" style="--tc:${tint}"><span class="ti">${inner}${extra}</span><span class="tnm">${n}</span></button>`;
      }).join('');
      const c = this.c, top = c.rowTop || s.tab === 'widgets';
      this.el.main.classList.toggle('row-top', top);
      const shorts = c.rowShortcuts ? c.rowShortcuts.map(([ic, n]) => `<span class="rsc">${I(ic)}<span>${esc(n)}</span></span>`).join('') + '<span class="sep"></span>' : '';
      this.el.row.innerHTML = shorts + c.apps.map(([a, run]) => `<button class="app${run ? ' run' : ''}" data-app="${a}" aria-label="${a}"><img src="${APP(a)}" alt=""></button>`).join('') + (top && !c.rowShortcuts ? `<span class="sep"></span><span class="cust">${I('shortcuts')}</span>` : '');
      const cls = dir ? 'in-' + dir : '';
      this.el.view.innerHTML = `<div class="tab ${cls}">${(this['v_' + s.tab] || this.v_empty).call(this)}</div>`;
    }
    v_widgets() {
      const s = this.s, tr = TRACKS[s.ti], f = s.timer / 1500;
      return `<div class="wg">
        <div class="wt np" data-open="player"><div class="art" style="--art:${tr.art}"></div><img class="src" src="${APP('music')}" alt=""><div class="t">${esc(tr.t)}</div><div class="a">${esc(tr.a)}</div><div class="ctl"><button data-a="play" aria-label="Play or pause">${I(s.playing ? 'pause' : 'play')}</button><button data-a="next" aria-label="Next">${I('next')}</button></div></div>
        <div class="wt nx" data-open="calendar"><span class="lbl">Next up</span><div class="row"><span class="bar"></span><div><div class="t">Design review</div><div class="s">${t12(this.meet)} – ${t12(this.meetEnd)}</div></div></div><span class="cam">${I('videoFill')}</span></div>
        <div class="wt ring" data-a="timer"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" fill="none" stroke="#2c2c2e" stroke-width="4.5"/><circle class="arc" cx="30" cy="30" r="25" fill="none" stroke="#ff9f0a" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="157.1" stroke-dashoffset="${(157.1 * f).toFixed(1)}" transform="rotate(-90 30 30)"/><circle cx="30" cy="5" r="2.6" fill="#ff9f0a"/></svg><div class="tm"><span class="tlab tnum">${mmss(s.timer)}</span>${I(s.timerOn ? 'pause' : 'play')}</div></div>
        <div class="wt day" data-open="calendar"><span class="w">${new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span><span class="d">${new Date().getDate()}</span><span class="m">${new Date().toLocaleDateString('en-US', { month: 'long' })}</span></div>
        <div class="wt sc" data-say="Opened Terminal">${I('termTile')}Terminal</div>
        <div class="wt sc" data-say="Opened Downloads">${I('doc')}Downloads</div>
        <div class="wt sc" data-say="Took a screenshot" style="--x:1"><span style="color:var(--acc)">${I('dashedRect')}</span>Screenshot</div>
        <div class="wt awake${s.awake ? ' on' : ''}" data-a="awake"><span class="bub">${I('cup')}</span><span><b>Keep Awake</b><small>${s.awake ? 'For 1 hour' : 'Off'}</small></span></div>
      </div>`;
    }
    v_empty() {
      const t = this.tabs().find(x => x[0] === this.s.tab) || ALL[0];
      return `<div class="empty"><span>${I(t[2])}</span><b>${esc(t[1])}</b><small>Open VisorPro to see this one.</small></div>`;
    }
    v_shortcuts() {
      return `<div class="scg">${SHORTS.map(([ic, n, acc]) => `<button class="sct" data-say="Ran ${esc(n)}" data-ic="bolt"><span class="${acc ? 'acc' : ''}">${I(ic)}</span><span class="nm">${esc(n)}</span></button>`).join('')}</div>`;
    }
    v_clipboard() {
      const s = this.s;
      const H = [['safari', 'developer.apple.com/design/human-interface-guidelines', 'Safari · 1 min'], ['messages', 'Let’s move the launch to Thursday so the deck lands first.', 'Messages · 4 min'],
        ['#ff5ca8', '#FF5CA8', 'Colour Picker · 9 min'], ['img', 'Screenshot 2026-11-04 at 9.32.10', 'Finder · 12 min'], ['mail', 'dana@studio.co', 'Mail · 20 min'], ['terminal', 'brew install --cask visorpro', 'Terminal · 26 min']];
      const S = [['bookmark', 'Home address', '221 Harbour St, Apt 4B'], ['mail', 'Work email', 'me@studio.co'], ['tag', 'IBAN', 'GB33 BUKB 2020 1555 5555 55'], ['send', 'Quick reply', 'Thanks! I’ll get back to you by Friday.']];
      const list = s.clipSeg === 'History'
        ? H.map(([k, v, m], i) => { const ic = k[0] === '#' ? `<span class="ci" style="background:${k}"></span>` : k === 'img' ? `<span class="ci" style="background:radial-gradient(60% 60% at 30% 30%, #ffd27a, transparent 60%), linear-gradient(135deg, #ff7a59, #8f5bff)"></span>` : `<span class="ci"><img src="${APP(k)}" alt=""></span>`; return `<div class="cr${i === s.sel ? ' sel' : ''}" data-copy="${i}">${ic}<span class="ct">${esc(v)}</span><span class="cm">${m}</span></div>` }).join('')
        : S.map(([ic, n, v], i) => `<div class="cr" data-copy="s${i}"><span class="ci">${I(ic)}</span><span class="ct">${n} <span class="gray">· ${esc(v)}</span></span></div>`).join('');
      return `<div class="clip"><div class="top"><div class="segc"><span class="${s.clipSeg === 'Saved' ? 'on' : ''}" data-seg="Saved">${I('bookmark')}Saved</span><span class="${s.clipSeg === 'History' ? 'on' : ''}" data-seg="History">${I('clockArrow')}History</span></div><span class="poc">Paste on Click <span class="sw${s.poc ? ' on' : ''}" data-a="poc"></span></span></div>${list}</div>`;
    }
    v_calendar() {
      const m = Math.max(0, Math.round((this.meet - Date.now()) / 6e4)); const d = new Date();
      const at = (h, mi) => { const x = new Date(); x.setHours(h, mi, 0, 0); return t12(x) };
      return `<div class="cal"><div class="top"><b>${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</b><span class="vs"><span class="seg"><span class="on">${I('notelines')}</span><span>${I('reminders')}</span><span>${I('calendar')}</span><span>${I('grid2')}</span></span>${I('plus')}<span class="more">${I('ellipsis')}</span></span></div>
        <div class="l"><span class="lbl">Next</span><h3>Design review</h3><div class="tm"><i></i>${t12(this.meet)} – ${t12(this.meetEnd)}</div><div class="soonc cd2">in ${m} min</div><div class="loc">${I('user')}Google Meet</div><button class="btn-j" data-say="Joining Google Meet" data-ic="videoFill">${I('videoFill')}Join</button></div>
        <div class="div"></div>
        <div class="r"><span class="lbl">Today</span><div style="height:4px"></div>${[['#0a84ff', t12(this.meet), 'Design review'], ['#ff9f0a', at(13, 0), 'Lunch with Sam'], ['#0a84ff', at(16, 0), 'Sprint planning']].map(([c, t, n]) => `<div class="ev" style="--c:${c}"><i></i><span class="t">${t}</span>${n}</div>`).join('')}
          <span class="lbl" style="display:block;margin-top:6px">Tomorrow</span><div class="ev" style="--c:#34c759"><i></i><span class="t">${at(7, 30)}</span>Gym</div></div></div>`;
    }
    v_player() {
      const s = this.s, tr = TRACKS[s.ti];
      return `<div class="ply${s.playing ? '' : ' paused'}"><div class="art" style="--art:${tr.art}"></div><div class="meta"><div class="src"><img src="${APP('music')}" alt="">Music<span class="viz">${[0, 2, 1, 3].map(k => `<i style="animation-delay:-${k * .2}s"></i>`).join('')}</span></div>
        <h3>${esc(tr.t)}</h3><div class="by">${esc(tr.a)}</div><div class="bar" data-a="seek"><i style="--p:${(s.pos / tr.d * 100).toFixed(1)}%"></i></div><div class="times"><span class="pp">${mmss(s.pos)}</span><span class="pr">−${mmss(tr.d - s.pos)}</span></div>
        <div class="ctl"><button data-a="b15" aria-label="Back 15 seconds">${I('back15')}</button><button data-a="prev" aria-label="Previous">${I('prev')}</button><button class="big" data-a="play" aria-label="Play or pause">${I(s.playing ? 'pause' : 'play')}</button><button data-a="next" aria-label="Next">${I('next')}</button><button data-a="f15" aria-label="Forward 15 seconds">${I('fwd15')}</button></div></div></div>`;
    }

    tick() {
      const s = this.s, tr = TRACKS[s.ti];
      if (s.playing) { s.pos += 1; if (s.pos >= tr.d) { s.pos = 0; s.ti = (s.ti + 1) % TRACKS.length; if (!s.open) this.peek('track'); this.render() } }
      if (s.timerOn) { s.timer = Math.max(0, s.timer - 1); if (!s.timer) { s.timerOn = false; this.say('Focus session done', 'clock') } }
      const v = this.el.view;
      const pp = v.querySelector('.pp'); if (pp) { pp.textContent = mmss(s.pos); v.querySelector('.pr').textContent = '−' + mmss(tr.d - s.pos); v.querySelector('.bar i').style.setProperty('--p', (s.pos / tr.d * 100).toFixed(1) + '%') }
      const tl = v.querySelector('.ring .tlab'); if (tl) { tl.textContent = mmss(s.timer); v.querySelector('.ring .arc').setAttribute('stroke-dashoffset', (157.1 * s.timer / 1500).toFixed(1)) }
      const m = Math.max(0, Math.round((this.meet - Date.now()) / 6e4));
      v.querySelectorAll('.cd, .cd2').forEach(e => { e.textContent = `in ${m} min` });
      if (new Date().getSeconds() === 0) this.clock();
    }

    /* ---------- switching ---------- */
    go(tab, how) {
      const s = this.s; if (tab === s.tab) return;
      const TABS = this.tabs(); if (!TABS.some(t => t[0] === tab)) return;
      const a = TABS.findIndex(t => t[0] === s.tab), b = TABS.findIndex(t => t[0] === tab);
      s.from = how === 'widget' ? 'widgets' : null; s.tab = tab; s.sel = -1;
      this.render(how === 'widget' ? 'z' : b > a ? 'b' : 't', true);
    }
    openSearch(q = '') {
      if (!this.s.open) this.open();
      this.el.srch.classList.add('on'); this.el.sin.value = q; this.sSel = 0; this.searchDraw();
      this.el.sin.focus({ preventScroll: true });
    }
    closeSearch() { this.el.srch.classList.remove('on') }
    searchDraw() {
      const q = this.el.sin.value.trim(); let h = ''; this.sItems = [];
      let ans = null;
      if (/^[\d\s.+\-*/×÷()^%]+$/.test(q) && /\d/.test(q) && /[+\-*/×÷^%]/.test(q)) { try { const v = Function('"use strict";return (' + q.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**') + ')')(); if (isFinite(v)) ans = Math.round(v * 1e8) / 1e8 } catch (e) { /* not yet a sum */ } }
      if (ans !== null) { h += `<div class="lbl">Answer</div><div class="ans" data-si="0"><b>${ans.toLocaleString('en-US')}</b><span>= ${esc(q)}</span><em>${I('returnKey')}Copy</em></div>`; this.sItems.push(['Copied ' + ans, 'check']) }
      const tabs = this.tabs().filter(t => !q || t[1].toLowerCase().includes(q.toLowerCase()));
      if (q) {
        h += `<div class="lbl">Actions</div>`;
        [['Add Reminder', 'checklist', '#0a84ff', 'Added to Reminders'], ['Add Event', 'calendar', '#ff3b30', 'Event added'], ['Ask', 'sparkle', '#bf5af2', 'Answered on this Mac']].forEach(([n, ic, c, done]) => { const i = this.sItems.length; this.sItems.push([done, 'check']); h += `<div class="sr" data-si="${i}" style="--rc:${c}"><span class="ri">${I(ic)}</span>${n}: ${esc(q)}</div>` });
      }
      if (tabs.length) { h += `<div class="lbl">Tabs</div>`; tabs.slice(0, q ? 3 : 4).forEach(([id, n, ic]) => { const i = this.sItems.length; this.sItems.push(['tab', id]); h += `<div class="sr" data-si="${i}"><span class="ri">${I(ic)}</span>${n}</div>` }) }
      this.el.sres.innerHTML = h;
      this.sSel = clamp(this.sSel || 0, 0, this.sItems.length - 1); this.searchMark();
    }
    searchMark() { this.el.sres.querySelectorAll('[data-si]').forEach(e => e.classList.toggle('sel', +e.dataset.si === this.sSel && e.classList.contains('sr'))) }
    searchRun(i) { const it = this.sItems[i]; if (!it) return; this.closeSearch(); if (it[0] === 'tab') this.go(it[1]); else this.say(it[0], it[1]) }

    /* ---------- the visitor's hands ---------- */
    wire() {
      if (this.o.shot) return this.wireShot();
      const { hot, notch, pn, rail, view, sin, sres } = this.el;
      let ot, ct, st;
      const reach = () => { clearTimeout(ct); if (!this.s.open) { clearTimeout(ot); ot = setTimeout(() => { this.open(); this.onOpen && this.onOpen() }, 150) } };
      [hot, notch].forEach(e => { e.addEventListener('mouseenter', reach); e.addEventListener('click', () => { this.s.open ? this.close() : this.open() }) });
      hot.addEventListener('mouseleave', () => clearTimeout(ot));
      pn.addEventListener('mouseenter', () => clearTimeout(ct));
      const keep = el => el && (hot.contains(el) || notch.contains(el) || (this.o.keep && this.o.keep.contains(el)));
      pn.addEventListener('mouseleave', e => { if (this.s.pinned || !this.s.open || keep(e.relatedTarget)) return; ct = setTimeout(() => this.close(), 450) });
      if (this.o.keep) { this.o.keep.addEventListener('mouseenter', () => clearTimeout(ct)); this.o.keep.addEventListener('mouseleave', e => { if (!this.s.pinned && this.s.open && !pn.contains(e.relatedTarget)) ct = setTimeout(() => this.close(), 450) }) }
      this.root.addEventListener('pointerdown', e => { VP.activeMac = this; if (this.s.open && !this.s.pinned && !pn.contains(e.target) && !keep(e.target)) this.close() });
      this.root.addEventListener('mouseenter', () => { VP.activeMac = this });
      rail.addEventListener('mouseover', e => { const b = e.target.closest('[data-tab]'); if (!b) return; clearTimeout(st); st = setTimeout(() => this.go(b.dataset.tab), 60) });
      rail.addEventListener('mousemove', e => { rail.querySelectorAll('button').forEach(b => { const r = b.getBoundingClientRect(); const d = Math.abs(e.clientY - (r.top + r.height / 2)) / (this.k || 1); b.style.transform = `scale(${(1 + .3 * Math.exp(-d * d / 700)).toFixed(3)})` }) });
      rail.addEventListener('mouseleave', () => { clearTimeout(st); rail.querySelectorAll('button').forEach(b => b.style.transform = '') });
      rail.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) this.go(b.dataset.tab) });
      pn.addEventListener('click', e => this.act(e));
      sin.addEventListener('input', () => { this.sSel = 0; this.searchDraw() });
      sres.addEventListener('click', e => { const r = e.target.closest('[data-si]'); if (r) this.searchRun(+r.dataset.si) });
      document.addEventListener('keydown', e => {
        if (VP.activeMac !== this) return;
        const inS = e.target === sin, inField = !inS && e.target.closest && e.target.closest('input,textarea,select');
        if (inField) return;
        if (e.key === 'Escape') { if (this.el.srch.classList.contains('on')) this.closeSearch(); else this.close(); return }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return this.openSearch() }
        if (inS) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); this.sSel = clamp(this.sSel + (e.key === 'ArrowDown' ? 1 : -1), 0, this.sItems.length - 1); this.searchMark() } if (e.key === 'Enter') { e.preventDefault(); this.searchRun(this.sSel) } return }
        if (!this.s.open || e.metaKey || e.ctrlKey || e.altKey) return;
        if (/^[1-9]$/.test(e.key)) { const t = this.tabs()[+e.key - 1]; if (t) this.go(t[0]); return }
        if (e.key.length === 1 && /\S/.test(e.key)) { e.preventDefault(); this.openSearch(e.key) }
      });
    }
    /* picture mode: the tab bar's real positions, measured from the app's pictures (13 tabs, 16 pt apart from y 48) */
    wireShot() {
      const { hot, notch, pn } = this.el; let ot, ct, st;
      const ORDER = ['widgets', 'clipboard', 'captures', 'shelf', 'shortcuts', 'calendar', 'tasks', 'notes', 'player', 'translate', 'calculator', 'pomodoro', 'menuBar'];
      const reach = () => { clearTimeout(ct); if (!this.s.open) { clearTimeout(ot); ot = setTimeout(() => { this.open(); this.onOpen && this.onOpen() }, 150) } };
      const keep = el => el && (hot.contains(el) || notch.contains(el) || (this.o.keep && this.o.keep.contains(el)));
      [hot, notch].forEach(e => { e.addEventListener('mouseenter', reach); e.addEventListener('click', () => { this.s.open ? this.close() : this.open() }) });
      hot.addEventListener('mouseleave', () => clearTimeout(ot));
      pn.addEventListener('mouseenter', () => clearTimeout(ct));
      pn.addEventListener('mouseleave', e => { if (this.s.pinned || !this.s.open || keep(e.relatedTarget)) return; ct = setTimeout(() => this.close(), 450) });
      if (this.o.keep) { this.o.keep.addEventListener('mouseenter', () => clearTimeout(ct)); this.o.keep.addEventListener('mouseleave', e => { if (!this.s.pinned && this.s.open && !pn.contains(e.relatedTarget)) ct = setTimeout(() => this.close(), 450) }) }
      const at = e => { const img = pn.querySelector('.pimg:last-child'); const r = img.getBoundingClientRect(); const w = img.naturalWidth / 2, h = img.naturalHeight / 2; return [(e.clientX - r.left) / r.width * w, (e.clientY - r.top) / r.height * h] };
      pn.addEventListener('mousemove', e => {
        if (!this.s.open || !this.shot.startsWith('tab-') && this.shot !== 'search') return;
        const [x, y] = at(e);
        if (x < 36 || x > 84 || y < 38) return;
        const i = clamp(Math.round((y - 48) / 16), 0, ORDER.length - 1), id = ORDER[i];
        if (('tab-' + id) === this.shot) return;
        clearTimeout(st); st = setTimeout(() => { this.s.tab = id; this.setShot('tab-' + id, 'f'); this.onTab && this.onTab(id) }, 50);
      });
      pn.addEventListener('click', e => { const [x, y] = at(e); if (y < 30 && x > 520 && x < 556) this.setShot(this.shot === 'search' ? 'tab-' + this.s.tab : 'search', 'f') });
      this.root.addEventListener('pointerdown', e => { VP.activeMac = this; if (this.s.open && !this.s.pinned && !pn.contains(e.target) && !keep(e.target)) this.close() });
      this.root.addEventListener('mouseenter', () => { VP.activeMac = this });
      document.addEventListener('keydown', e => {
        if (VP.activeMac !== this || (e.target.closest && e.target.closest('input,textarea,select'))) return;
        if (e.key === 'Escape') { if (this.shot === 'search') this.setShot('tab-' + this.s.tab, 'f'); else this.close(); return }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!this.s.open) this.open(); this.setShot('search', 'f'); return }
        if (this.s.open && /^[1-9]$/.test(e.key) && !e.metaKey) { const id = ORDER[+e.key - 1]; this.s.tab = id; this.setShot('tab-' + id, 'f') }
      });
    }
    act(e) {
      const t = e.target, s = this.s;
      const a = t.closest('[data-a]'), w = t.closest('[data-open]'), say = t.closest('[data-say]'), tick = t.closest('[data-tick]'), cp = t.closest('[data-copy]'), seg = t.closest('[data-seg]'), app = t.closest('[data-app]');
      if (t.closest('.back')) { s.from = null; s.tab = 'widgets'; return this.render('t') }
      if (a) {
        switch (a.dataset.a) {
          case 'search': return this.openSearch();
          case 'sclear': this.el.sin.value = ''; this.searchDraw(); return this.el.sin.focus();
          case 'pin': s.pinned = !s.pinned; a.classList.toggle('on', s.pinned); return this.say(s.pinned ? 'Pinned open' : 'Unpinned', 'pin');
          case 'look': { const L = ['studio', 'tinted', 'liquid', 'fade']; this.setLook(L[(L.indexOf(s.look) + 1) % 4]); this.onLook && this.onLook(s.look); return }
          case 'gear': return this.say('Settings, Pause, Quit', 'gear');
          case 'play': s.playing = !s.playing; return this.render();
          case 'next': s.ti = (s.ti + 1) % TRACKS.length; s.pos = 0; return this.render();
          case 'prev': if (s.pos > 3) s.pos = 0; else s.ti = (s.ti + TRACKS.length - 1) % TRACKS.length; s.pos = 0; return this.render();
          case 'b15': s.pos = Math.max(0, s.pos - 15); return this.tick();
          case 'f15': s.pos = Math.min(TRACKS[s.ti].d - 2, s.pos + 15); return this.tick();
          case 'seek': { const r = a.getBoundingClientRect(); s.pos = Math.round((e.clientX - r.left) / r.width * TRACKS[s.ti].d); return this.tick() }
          case 'timer': s.timerOn = !s.timerOn; return this.render();
          case 'awake': s.awake = !s.awake; return this.render();
          case 'poc': s.poc = !s.poc; return this.render();
        }
      }
      if (say) return this.say(say.dataset.say, say.dataset.ic || 'check');
      if (w) return this.go(w.dataset.open, 'widget');
      if (tick) { s.done[tick.dataset.tick] = !s.done[tick.dataset.tick]; this.render(); return s.done[tick.dataset.tick] && this.say('Completed') }
      if (seg) { s.clipSeg = seg.dataset.seg; return this.render() }
      if (cp) { if (cp.dataset.copy[0] !== 's') s.sel = +cp.dataset.copy; this.render(); return this.say(s.poc ? 'Pasted' : 'Copied') }
      if (app) return this.say('Opened ' + app.dataset.app[0].toUpperCase() + app.dataset.app.slice(1), 'arrowUpRight');
    }
  }
  VP.Mac = Mac;
})();
