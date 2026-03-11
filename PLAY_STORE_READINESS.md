# Play Store Readiness Checklist (Android)

**App:** MRE Site Tracker
**Package ID:** `com.mre.sitetracker`
**Assessed:** 2026-03-10
**Last Updated:** 2026-03-11
**Current State:** Release AAB built and signed — ready for Play Console upload

---

## Status Summary

| Category | Status | Notes |
|----------|--------|-------|
| App name | ✅ Done | `MRE Site Tracker` in `strings.xml` |
| Package ID | ✅ Done | `com.mre.sitetracker` in `build.gradle` |
| Release keystore | ✅ Done | `android/app/release.keystore` generated |
| Release signing config | ✅ Done | `build.gradle` + `gradle.properties` configured |
| Storage permissions scoped | ✅ Done | `maxSdkVersion` added to legacy permissions |
| Version numbers aligned | ✅ Done | `versionName "1.0.0"`, `package.json "1.0.0"` |
| Signed release AAB built | ✅ Done | 57 MB at `android/app/build/outputs/bundle/release/app-release.aab` |
| Android SDK config | ✅ Ready | targetSdk 36, minSdk 24 |
| Code quality (TS) | ✅ Ready | 0 TypeScript errors globally |
| UI/UX uniformity | ✅ Ready | All 4 sprints complete and merged |
| Privacy policy | ❌ Missing | **Required by Play Store before public release** |
| App icon / branding | ⚠️ Default RN icon | Recommended before launch |
| Play Store listing | ⚠️ Not prepared | Console content needed before submission |

---

## ✅ Completed — What Was Done (2026-03-11)

### 1. App Name
**File:** `android/app/src/main/res/values/strings.xml`
```xml
<string name="app_name">MRE Site Tracker</string>
```

---

### 2. Package ID
**File:** `android/app/build.gradle`
```groovy
namespace "com.mre.sitetracker"
defaultConfig {
    applicationId "com.mre.sitetracker"
    ...
}
```
> **Permanent** — cannot be changed after first Play Store upload.

Also updated Kotlin source files to the new package:
- Moved from `java/com/site_progress_tracker/` → `java/com/mre/sitetracker/`
- Updated `package com.site_progress_tracker` → `package com.mre.sitetracker` in both `MainActivity.kt` and `MainApplication.kt`

---

### 3. Release Keystore
**Generated with:**
```bash
keytool -genkey -v \
  -keystore android/app/release.keystore \
  -alias mre-site-tracker \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=MRE Infrastructure, OU=Mobile, O=MRE, L=Delhi, ST=Delhi, C=IN"
```

**Password:** Stored in `android/gradle.properties` (not committed to git — `.gitignore` excludes `*.keystore`)

> **Critical:** Back up `android/app/release.keystore` to a secure location (offline + password manager). Losing it means you can never update the app on Play Store.

---

### 4. Release Signing Config
**File:** `android/app/build.gradle`
```groovy
signingConfigs {
    debug { ... }
    if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig project.hasProperty('MYAPP_RELEASE_STORE_FILE')
            ? signingConfigs.release
            : signingConfigs.debug
        ...
    }
}
```

**File:** `android/gradle.properties` (local only — DO NOT commit after filling passwords)
```
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=mre-site-tracker
MYAPP_RELEASE_STORE_PASSWORD=<password>
MYAPP_RELEASE_KEY_PASSWORD=<password>
```

---

### 5. Storage Permissions Scoped
**File:** `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

---

### 6. Version Numbers
**File:** `android/app/build.gradle`
```groovy
versionCode 1
versionName "1.0.0"
```

**File:** `package.json`
```json
"version": "1.0.0"
```

> Increment `versionCode` by 1 for every Play Store upload (1, 2, 3...). `versionName` is user-visible.

---

### 7. Signed Release AAB Built
```bash
cd android && ./gradlew bundleRelease
```
**Output:** `android/app/build/outputs/bundle/release/app-release.aab` (57 MB)
**Build time:** ~26 minutes (first build — subsequent builds are faster due to cache)

---

## ❌ Remaining Before Public Release

### Privacy Policy (Required)
Play Store requires a privacy policy because the app collects: login credentials, project/site data, photos, and user roles.

**Steps:**
1. Write a policy covering: what data is collected, how stored, who can access it, contact email
2. Host it — GitHub Pages, company website, or Google Sites (free)
3. Add the URL in Play Console → App content → Privacy policy
4. Optionally link from inside the app (Settings / About screen)

---

## ⚠️ Recommended Before Launch

### App Icon — Branding
Current icon is the default React Native launcher icon. Replace before public launch.

**Required assets:**

| Asset | Size | Location |
|-------|------|----------|
| Launcher icon | 48×48 | `mipmap-mdpi/ic_launcher.png` |
| Launcher icon | 72×72 | `mipmap-hdpi/ic_launcher.png` |
| Launcher icon | 96×96 | `mipmap-xhdpi/ic_launcher.png` |
| Launcher icon | 144×144 | `mipmap-xxhdpi/ic_launcher.png` |
| Launcher icon | 192×192 | `mipmap-xxxhdpi/ic_launcher.png` |
| Round icon | Same 5 sizes | `ic_launcher_round.png` in each folder |
| Play Store hi-res icon | 512×512 PNG | Uploaded in Play Console |
| Feature graphic | 1024×500 PNG/JPG | Uploaded in Play Console |

**Tool:** Android Asset Studio (browser-based, free) — upload one 1024×1024 source PNG and it generates all sizes.

---

## 📋 Play Store Console — Content Required

All done in Play Console (not code):

| Item | Requirement |
|------|-------------|
| App title | Max 30 chars — `MRE Site Tracker` |
| Short description | Max 80 chars — shown in search results |
| Full description | Max 4000 chars |
| Phone screenshots | Min 2, recommended 4–6 (PNG/JPG, 16:9 or 9:16) |
| Feature graphic | 1024×500 PNG/JPG |
| App category | Business or Productivity |
| Content rating | Complete questionnaire in Play Console |
| Target audience | 18+ (work/enterprise app) |
| Data safety form | Declare: login data, project/site data, photos, no third-party sharing |
| Privacy policy URL | Mandatory |
| Developer contact email | Shown publicly on listing |

---

## 📦 Rebuilding Release AAB (future updates)

```bash
# 1. Increment versionCode in android/app/build.gradle before each upload
# 2. Build
cd android && ./gradlew bundleRelease

# Output:
# android/app/build/outputs/bundle/release/app-release.aab

# 3. Upload to Play Console → Internal Testing track first
# 4. Test on real device before promoting to production
```

---

## Key Reminders

- **Package ID is permanent** — `com.mre.sitetracker` is set and locked from first upload
- **Back up the release keystore** — `android/app/release.keystore` must be stored securely offline; losing it = cannot update the app ever
- **`gradle.properties` contains passwords** — never commit after filling in real values
- **Increment `versionCode`** — must increase by at least 1 for every Play Store upload
- **Internal Testing first** — upload to internal track, test on real device, then promote to production
