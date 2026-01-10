# GRANDTAROT PWA + Mobile Setup

## What's Included

This PWA implementation enables:
- ✅ **Web App Installation** (PWA on Android/Chrome + iOS Safari)
- ✅ **Offline Fallback** (Cached assets + offline page)
- ✅ **Service Worker** (Background sync, caching strategies)
- ✅ **Mobile Wrapper** (Capacitor for iOS/Android)
- ✅ **Install Prompt** (Native + iOS guidance)

---

## Files

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA metadata + icons |
| `public/sw.js` | Service Worker (caching, offline) |
| `components/pwa/InstallBanner.jsx` | Install prompt UI |
| `pages/Offline.jsx` | Offline fallback page |
| `pages/AdminMobileReadiness.jsx` | Mobile readiness checklist |
| `capacitor.config.ts` | Mobile wrapper config |
| `MOBILE_BUILD_GUIDE.md` | Build instructions |

---

## Setup Instructions

### 1. Create Icon Assets

You need icons for the PWA. Create these files in `public/icons/`:

```
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png
icon-384x384.png
icon-512x512.png
icon-192x192-maskable.png (adaptive icon for Android)
icon-512x512-maskable.png (adaptive icon for Android)
screenshot-540x720.png (narrow screenshot)
screenshot-1280x720.png (wide screenshot)
```

**Quick: Use a PWA icon generator:**
- https://www.pwabuilder.com/imageGenerator
- https://favicon.io/favicon-generator/
- https://romannurik.github.io/AndroidAssetStudio/index.html

### 2. Add Meta Tags (in `index.html`)

```html
<head>
  <!-- Existing meta tags -->
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#1e293b" />
  <meta name="description" content="Rencontres basées sur le tarot et l'astrologie" />
  
  <!-- Apple Web App -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="GRANDTAROT" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />
  
  <!-- Other favicons -->
  <link rel="icon" type="image/png" href="/icons/icon-192x192.png" />
</head>
```

### 3. Verify Service Worker

Check that `/public/sw.js` exists (already created).

### 4. Test PWA Locally

```bash
npm run build
npm run preview

# OR use http-server:
# npm install -g http-server
# http-server dist -p 8080

# Open browser:
# http://localhost:8080

# Chrome DevTools:
# - Application → Service Workers → Verify registered
# - Application → Manifest → Verify valid
# - Lighthouse → Run PWA audit
```

### 5. Mobile Wrapper (Capacitor)

```bash
# Initialize
npx cap init --web-dir=dist --npm

# Add platforms
npx cap add ios
npx cap add android

# Sync web assets
npx cap copy

# Open in IDE
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

See `MOBILE_BUILD_GUIDE.md` for full build instructions.

---

## Testing Checklist

### Web (Desktop/Mobile Chrome/Safari)
- [ ] Open on mobile → Install prompt appears
- [ ] Click "Install" → App installs to home screen
- [ ] Open installed app → Runs in fullscreen (no URL bar)
- [ ] Navigate to /offline (simulate offline) → Fallback page shows
- [ ] Chrome DevTools → Service Workers → "activated"
- [ ] Lighthouse score >= 85

### iOS Safari
- [ ] Open on iPhone/iPad
- [ ] Tap Share → "Add to Home Screen"
- [ ] App opens in fullscreen mode
- [ ] Navigate between pages → Works
- [ ] Go offline → Offline fallback works

### Android Chrome
- [ ] Install via "Install app"
- [ ] App opens fullscreen
- [ ] Back button works
- [ ] Navigate via deep link → Works

### iOS/Android App (via Capacitor)
- [ ] Build & run on simulator/device
- [ ] Auth works (login → session)
- [ ] Chat accessible
- [ ] Billing accessible
- [ ] No console errors

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Service Worker not registered** | Check browser console. Verify `/public/sw.js` exists. |
| **Icons missing** | Create icon files in `public/icons/`. Regenerate manifest. |
| **iOS app blank screen** | Check `capacitor.config.ts` webDir = `dist`. Run `npm run build`. |
| **Cookies not persisting (iOS)** | Check `Info.plist` cookie settings. Base44 SDK handles HTTPOnly. |
| **Deep links not working** | Verify Android Manifest + iOS URL schemes in Capacitor config. |
| **Offline page not showing** | Check Service Worker console. Ensure `/offline` route exists. |

---

## Security Notes

✅ **What's Cached:**
- Static assets (CSS/JS/images)
- HTML pages (with network-first fallback)
- User profile data (readonly, expires)

❌ **What's NOT Cached:**
- Auth tokens
- Payment data
- Chat messages
- Admin pages

✅ **Auth Handling:**
- Base44 SDK manages sessions automatically
- Cookies persist across app restarts
- No sensitive data stored locally

---

## Next Steps

1. **Generate Icons** → `public/icons/*`
2. **Test PWA** → Localhost + production
3. **Build Mobile** → Follow `MOBILE_BUILD_GUIDE.md`
4. **Release** → App Store + Google Play

---

**Status:** Ready for Production  
**Last Updated:** 2026-01-10