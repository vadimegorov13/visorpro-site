/* What the site says about VisorPro. Kept short on purpose: what it is, not how it's made. */
(function () {
  const VP = window.VP = window.VP || {};

  /* Price is not decided yet (PRODUCT.md, "Pricing"). Change it here and every page follows. */
  VP.pricing = {
    early: 9.99, regular: 19.99, trialDays: 14, macs: 2,
    currencies: {
      USD: { sym: '$', rate: 1, flag: '🇺🇸', name: 'US dollar' },
      EUR: { sym: '€', rate: 0.93, flag: '🇪🇺', name: 'Euro' },
      GBP: { sym: '£', rate: 0.79, flag: '🇬🇧', name: 'Pound sterling' },
      CAD: { sym: 'CA$', rate: 1.37, flag: '🇨🇦', name: 'Canadian dollar' },
      AUD: { sym: 'A$', rate: 1.52, flag: '🇦🇺', name: 'Australian dollar' },
      JPY: { sym: '¥', rate: 152, flag: '🇯🇵', name: 'Japanese yen', whole: true },
    },
  };
  VP.money = (usd, cur = 'USD') => {
    const c = VP.pricing.currencies[cur]; const v = usd * c.rate;
    return c.sym + (c.whole ? Math.round(v).toLocaleString('en-US') : (Math.round(v * 100) / 100).toFixed(2));
  };

  /* The tabs, in the app's order, one line each. */
  VP.inside = [
    ['grid2', 'Widgets', 'Your own Control Center: now playing, next up, a timer, toggles.'],
    ['today', 'Today', 'The next meeting with Join, and what’s due.'],
    ['clipboard', 'Clipboard', 'Everything you copied, and the things you paste every day.'],
    ['captures', 'Captures', 'Fresh screenshots and recordings, ready to drag out.'],
    ['shortcuts', 'Shortcuts', 'Apps, keys, scripts and window layouts, one click away.'],
    ['calendar', 'Calendar', 'Up next, the day, the week, the month. Join the call.'],
    ['checklist', 'Reminders', 'Your lists, synced with your iPhone. Tick them off.'],
    ['notelines', 'Notes', 'Quick notes, voice notes, and dictation into any app.'],
    ['player', 'Player', 'Whatever’s playing, in any app or browser.'],
    ['charbubble', 'Translate', 'On-device translation as you type.'],
    ['fx', 'Calculator', 'Type a sum, get the answer. Units too.'],
    ['clock', 'Clock', 'Focus sessions, timers, a stopwatch, alarms.'],
    ['menubar', 'Menu Bar', 'The icons the notch hides, back within reach.'],
  ];

  VP.faq = [
    ['What if my Mac has no notch?', 'VisorPro drops from the top centre of the screen instead. It works on every display you have.'],
    ['Does anything leave my Mac?', 'No. Your clipboard, notes and everything else stay on your Mac. There’s no account and nothing to sign up for.'],
    ['Will it slow my Mac down?', 'No. While it’s folded away it sits idle and uses no CPU, so it won’t touch your battery.'],
    ['Is it a subscription?', 'No. You pay once and every version 1 update is free.'],
    ['Which Macs does it run on?', 'macOS 13 Ventura or later, on Apple silicon and Intel.'],
    ['Can I try it first?', `Yes, for ${VP.pricing.trialDays} days with everything on. No card needed.`],
    ['Why does it ask for Accessibility?', 'To open the menus of icons hidden behind the notch and to paste into the app you were in. Every permission is optional and asked for only when a tab needs it.'],
    ['Does it work in full-screen apps?', 'Only if you want it to. By default it stays out of full-screen apps, so it never gets in the way of a game or a film.'],
    ['Can I change the shortcut?', 'Yes. Pick any key for the panel, and give any tab a key of its own.'],
    ['Why isn’t it on the App Store?', 'Some of what it does, like reaching the icons behind the notch, isn’t allowed there. You buy it here and get updates from us directly.'],
    ['Can I get a refund?', 'Yes, within 14 days of buying, no questions asked. Write to us from the email you bought with.'],
  ];
  /* price by number of Macs (placeholders) */
  VP.pricing.tiers = { 1: [9.99, 19.99], 2: [14.99, 29.99], 5: [24.99, 49.99] };
})();
