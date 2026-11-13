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
    ['grid2', 'Widgets', 'Your own Control Center: now playing, next up, weather, your Mac’s load, Claude Code.'],
    ['bell', 'Notifications', 'Every app’s notifications, in the island and in one list. Read on your Mac, sent nowhere.'],
    ['clipboard', 'Clipboard', 'Everything you copied, and the things you paste every day.'],
    ['captures', 'Captures', 'Fresh screenshots and recordings, ready to drag out.'],
    ['tray', 'Shelf', 'Park files for later. Drag one to the notch, drag it out anywhere.'],
    ['shortcuts', 'Shortcuts', 'Apps, keys, scripts and window layouts, one click away.'],
    ['calendar', 'Calendar', 'Up next, the day, the week, the month. Join the call.'],
    ['checklist', 'Reminders', 'Your lists, synced with your iPhone. Tick them off.'],
    ['notelines', 'Notes', 'Rich text or Markdown, checklists and drawings. To and from Apple Notes.'],
    ['notelines', 'Teleprompter', 'Your script under the camera, following your voice. Record takes too.'],
    ['player', 'Player', 'Whatever’s playing, in any app or browser.'],
    ['charbubble', 'Translate', 'On-device translation as you type.'],
    ['fx', 'Calculator', 'Type a sum, get the answer. Units and currencies too.'],
    ['clock', 'Clock', 'Focus sessions, timers, a stopwatch, alarms.'],
    ['menubar', 'Menu Bar', 'The icons the notch hides, back within reach.'],
  ];

  VP.faq = [
    ['What if my Mac has no notch?', 'VisorPro drops from the top centre of the screen instead. It works on every display you have.'],
    ['Does anything leave my Mac?', 'No. Your clipboard, notes, files and everything else stay on your Mac. There’s no account and nothing to sign up for. The only download is the day’s exchange rates, when you convert a currency.'],
    ['How do I open it?', 'Point at the notch, click it, press a shortcut, or drag a file up to it. You can also open it by scrolling at the top of the screen, holding a key there, or with a mouse button.'],
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

  /* Every feature, counted exactly: tabs, every shortcut action (PanelTab, SystemAction, WindowAction and the other
     ShortcutAction kinds in the app's code), and the built panel features in PRODUCT.md's registry. */
  VP.features = {
    system: ["Play/Pause", "Next Track", "Previous Track", "Volume Up", "Volume Down", "Mute", "Mission Control", "App Windows", "Show Desktop", "Previous App", "Desktop Left", "Desktop Right", "Lock Screen", "Sleep Display", "Screen Saver", "Dark Mode", "Empty Trash", "Screenshot", "Capture Screen", "Screenshot Tools", "Capture a Window", "Pick a Colour", "Start Pomodoro", "Start the Stopwatch", "Join the Next Meeting", "Mute the Microphone", "Terminal Here", "Copy Finder’s Path", "Show Hidden Files", "Copy", "Paste", "Cut", "Undo", "Redo", "Select All", "Today’s Date", "Current Time", "Date and Time"],
    window: ["Left Half", "Right Half", "Top Half", "Bottom Half", "Top Left", "Top Right", "Bottom Left", "Bottom Right", "Left Third", "Centre Third", "Right Third", "Left Two Thirds", "Right Two Thirds", "Fill", "Almost Fill", "Centre", "Next Display", "Restore"],
    kinds: ["Open an app", "Open files and folders", "Open a website", "Press a key combination", "Type text", "Run an Apple Shortcut", "Run a shell script", "Several actions in a row", "Wait", "Start a timer or alarm", "A group on a half wheel"],
    panel: ["Opens by pointing at the notch", "Opens with a click", "Opens with a shortcut", "Opens by scrolling at the top edge", "Opens by holding a key at the top edge", "Opens with a mouse button", "Closes when you leave", "Esc closes from any app", "Pin it open", "Every display, notch or not", "Tab bar on any side", "Tab names", "Switch tabs by sliding", "Tabs grow like the Dock", "Previews in the tab bar", "Badges", "App row", "Suggested apps", "Shortcut row", "Rows on any side", "Wide and tall sizes", "Four looks", "Any accent colour", "Each tool its own colour", "Peeks", "Search with ⌘K", "Sums and currencies", "Ask AI", "Send To", "Focus on a reminder", "A key for every tab", "Paste stack", "Saved-item variables", "Copy Cleaned Up", "Per-app shortcuts", "Groups on a half wheel", "Drag a window to the notch to snap it", "Colour picker", "Dictation into any app", "Dictation waveform under the notch", "Say a sum, a question or a reminder", "Dictations kept", "Voice notes", "Rich notes", "Markdown notes with a preview", "Checklists", "Drawings in notes", "Notes window with folders", "Apple Notes import and export", "Collect copies into a note", "Meeting notes from events", "Notes to PDF, Word and Markdown", "Teleprompter that follows your voice", "Teleprompter play mode", "Record takes with subtitles", "Scripts from notes", "Scripts as files in a folder", "Pause", "Stay-away apps", "Hidden from screen sharing", "Full-screen switch", "Haptic tap", "Reduce Motion and Contrast", "Light and Dark", "Weather widget", "Stats widget", "Claude Code widget", "Live activities beside the camera", "Calls with a mute button", "Camera and microphone in use", "Volume pop-up", "Brightness pop-up", "Caps Lock pop-up", "Focus pop-up", "Battery warnings at your level", "Plugged in and unplugged", "AirPods connecting, with battery", "Drives with Eject", "Other apps' notifications", "Unread count by the notch", "visorpro://notify for scripts", "Claude Code hooks", "Floating island shape", "Black menu bar", "Keep Awake for a while"],
  };
  VP.features.actions = VP.features.system.length + VP.features.window.length + VP.features.kinds.length;
  VP.features.total = VP.inside.length + VP.features.actions + VP.features.panel.length;
  /* price by number of Macs (placeholders) */
  VP.pricing.tiers = { 1: [9.99, 19.99], 2: [14.99, 29.99], 5: [24.99, 49.99] };
})();
