# VisorPro website

One landing page and a **demo** checkout. Plain HTML, CSS and JavaScript: no build step, no dependencies. Not part of the app and not built by `make`.

```sh
python3 -m http.server 8000   # then http://127.0.0.1:8000
```

## The page, top to bottom

1. **The story** (scroll-driven hero): the hole in the menu bar → icons slip behind it → "it does nothing" → a cursor glides to the notch → zoom → the panel drops → "The notch, put to work" with Buy.
2. **Works with** the apps you already use (macOS app icons).
3. **The idea** block, then feature rows (Today, Clipboard, Widgets, Player, Calendar) with the real panel on pastel cards, then small cards (Notes, Reminders, Clock, Translate).
4. **Open it your way:** five ways to open it, each acted out in the preview.
5. **Try it right here:** the interactive panel with Studio, Tinted, Liquid, Notch Fade and accent colours.
6. **13 tabs** gallery, **Looks**, **Compare** (against separate single-purpose apps), **Pricing** (trial and 1/2/5 Macs), **Privacy** bento, closing block, two-column **FAQ**.
7. **Footer:** product, tabs, help, guides and legal columns, newsletter field, placeholder badges, socials, status dot, giant wordmark. Most links are placeholders (`#`).

## Files

| File | Holds |
|---|---|
| `assets/data.js` | Price, trial, price per number of Macs, currencies, the tab list, FAQ |
| `assets/panel.js`, `assets/panel.css` | The Mac screen, notch, cursor, peeks and the panel, drawn at the app's own sizes and copied from the app's self-test pictures (`Scripts/self-test.sh debugLooks`, `debugProductivity`, `debugReview`) |
| `assets/home.js` | The scroll story and every section's behaviour |
| `assets/site.js`, `assets/site.css` | Navigation, footer, page styles |
| `assets/apps/*.png` | macOS app icons rendered from this Mac |
| `checkout.html` | Demo checkout; codes `NOTCH20`, `EARLYBIRD`; test card `4242 4242 4242 4242`. Nothing typed leaves the page |
| `assets/shots/*.webp` | The app's own pictures used in the feature rows and the preview |
| `variants.html`, `v1.html` … `v12.html` (+ `assets/vkit.js`, `demo.js`, `demo.css`) | Design directions for a new landing page, each with a working panel (`VP.demo.mount({ host })`); not linked from the main page |
| `assets/landing.js`, `assets/landing.css` | The dark Nov 7 landing page (menu bar with the notch, working panel); no longer loaded |

## Placeholders to replace before going live

Prices, trial length, Macs per licence, the refund policy in the FAQ, the footer badges, social links, "All systems normal", the newsletter form, `hello@visorpro.app`, and every `#` link. Point Buy at the real payment provider's hosted checkout.
