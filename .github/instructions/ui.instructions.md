description: RYTHM UI guidelines with safe-area compliance (updated 2025-10-30)
name: ui-guidelines
applyTo: **/*
---
SafeAreaUpdate: training edit header and navigation flyout now use safe-area-top and pt-[env(safe-area-inset-top)] to avoid notch/status bar overlap. Commit: fix(ui): apply safe-area notch compliance to headers & flyout. FollowUps: add shared safe-area utility, bottom inset handling, visual regression tests, focus trap & ESC.
NotchBackground: Device notch/status bar region must always render as solid black (inherit from bg-dark-primary or explicit #000) with no gradients or overlays; do not place interactive elements or non-black backgrounds beneath env(safe-area-inset-top).
NotchOverlayImplementation: Added fixed overlay div in layout.tsx (height env(safe-area-inset-top), bg-black, pointer-events-none) to guarantee black notch across all pages.
DateDurationFieldStandardization: Replaced two-column grid with constrained flex layout (max-width 160px date, 140px duration) on new and edit workout pages to prevent overly wide inputs and improve visual balance.
BottomSheetModalRestore: Reverted template selection modal (training/new) from centered modal back to bottom-anchored sheet layout with semantic colors. Container changed from items-center justify-center to items-end; modal now full-width with rounded-t-2xl top corners and max-h-[85vh] from bottom. Updated header styling (text-lg, improved spacing), moved search input to dedicated row below header, increased button padding (py-3) and font weights. All semantic tokens retained (bg-dark-elevated1/2, orange-primary, border-dark-border, text-text-*). Better mobile UX with thumb-friendly bottom positioning.
CompactHeaderRefactor: Removed global sticky RYTHM header from layout.tsx; implemented per-page compact headers with inline hamburger menus. All main pages (Dashboard, Analytics, Templates, Settings, History, Calendar, PRs, Profile, Training New/Edit) now use consistent compact header pattern: pt-[env(safe-area-inset-top)] px-4 py-2 with text-base page title and inline HamburgerMenu button (reduced from w-6 to w-5 icon). Hamburger button simplified to plain rounded hover style without background/border. Maximizes vertical space on mobile devices; users scroll to top to access navigation. Maintains safe-area compliance for notch devices.
# RYTHM UI Generation Guidelines

> **Critical:** All UI code MUST follow the semantic theme system. Gradient utilities are deprecated and will fail ESLint validation.

## 0) RYTHM Semantic Theme (Required Foundation)

### Design System Principles
- **Single source of truth:** CSS variables defined in `globals.css` (both admin & mobile)
- **No raw hex colors:** Use semantic variables and helper classes exclusively
- **Elevation-based surfaces:** Dark backgrounds differentiate via elevation scale, not gradients
- **Accessible contrast:** Follow text tier hierarchy (primary/secondary/tertiary)
- **Burnt orange accents:** Highlight actions and interactive elements

### Core Surface Classes (Required)
ExampleSurfaces:
// Background Surfaces (Elevation Scale)
bg-dark-primary      // Page background
bg-dark-elevated1    // Primary cards, panels, modals
bg-dark-elevated2    // Nested surfaces, headers within modals
bg-dark-elevated0    // Form inputs, subtle containers

// Category Colors (Training Types - Use These Consistently)
CARDIO_ORANGE          // Cardio (Burnt Orange - matches brand primary)
STRENGTH_GREY          // Strength (Neutral grey token, updated 2025-10-28)
HYBRID_SMOKE           // Hybrid (Smoke light grey token)

// Text Hierarchy (Always Use These)
text-text-primary    // Headings, primary content
text-text-secondary  // Supporting labels, descriptions
text-text-tertiary   // Subtle metadata, placeholders

// Borders & Dividers
border-dark-border   // Standard borders for cards/inputs
EndExampleSurfaces:

### Component Helper Classes (Required)
DeprecatedExamples:
// Buttons (DO NOT compose manually)
<button className="btn-primary">Save</button>     // Burnt orange, primary action
<button className="btn-secondary">Cancel</button> // Neutral surface action

// Category Badges/Indicators (Use semantic classes)
<span className="badge-cardio">Cardio</span>
<span className="badge-strength">Strength</span>
<span className="badge-hybrid">Hybrid</span>

// Badges/Tags
<span className="badge-primary">strength</span>   // Highlighted category
<span className="badge-secondary">draft</span>    // Subdued status

// Icon Containers
<div className="icon-accent">{icon}</div>         // Circular with accent ring

// Accent Elements
<div className="accent-bar" />                    // Thin orange separator/emphasis
EndDeprecatedExamples:

### Migration Patterns (Required)

**❌ DEPRECATED (Will Fail ESLint):**
CorrectUsageExamples:
// DO NOT USE gradients
// Gradient example (removed) -> Use elevation classes instead: bg-dark-primary / bg-dark-elevated*

// DO NOT USE raw Tailwind grays
className="bg-gray-800 text-gray-400 hover:bg-gray-700"

// DO NOT USE random colors for categories
className="bg-purple-500"  // Wrong for strength
className="bg-teal-300"    // Wrong for cardio
className="bg-orange-500"  // Wrong for hybrid
EndCorrectUsageExamples:

**✅ CORRECT (Use Semantic Classes):**
Cards & Panels: bg-dark-elevated1 + border-dark-border + rounded-lg + p-4; text uses text-text-primary / text-text-secondary.
Category Indicators: small rounded elements with badge-cardio / badge-strength / badge-hybrid.
Modals: backdrop (black/70) + centered panel (bg-dark-elevated1 border border-dark-border shadow-xl p-6).
  Modal heading: text-text-primary mb-4; primary action: btn-primary w-full.

// Form Inputs (Updated 2025-10-29: Standardized across all pages)
Form Inputs: base classes w-full px-3 py-2 border-dark-border bg-dark-input text-text-primary placeholder:text-text-tertiary focus:border-orange-primary focus:ring-orange-primary.

// Interactive Lists
Interactive List Item: w-full p-3 hover:bg-dark-elevated1 transition-colors; child spans use text-text-primary and text-text-tertiary.
```

### Anti-Patterns (FORBIDDEN)
- ❌ `bg-gradient-to-*` anywhere in components
- ❌ Raw hex colors: avoid inline hex; rely on semantic tokens & utility classes
- ❌ Random Tailwind grays: `bg-gray-800`, `text-gray-400`
- ❌ Inline styles for standard palette usage
- ❌ Missing focus states on interactive elements
- ❌ Composing buttons manually instead of using `.btn-primary`/`.btn-secondary`

### Enforcement
- **ESLint rule active:** Gradient utilities cause build failures
- **Pre-merge checklist:**
  - [ ] No gradient utilities in modified files
  - [ ] No raw hex colors outside token definitions
  - [ ] Semantic text classes used (text-text-*)
  - [ ] Buttons use helper classes (btn-primary/btn-secondary)
  - [ ] Focus styles present on interactive elements
  - [ ] Dark surfaces use elevation scale
  - [ ] Input fields use semantic tokens (bg-dark-card, border-dark-border, focus:border-orange-primary)

### Recent Migrations
- **2025-10-29:** Training Load perceived exertion slider updated to orange theme
  - Updated training/edit and training/new pages
  - Progress bar: legacy lime green token → orange primary token (CARDIO_ORANGE)
  - Slider thumb border: lime green → orange primary with 3px border
  - Created new `.slider-orange` CSS class with proper vertical centering
  - Fixed thumb positioning: changed `top: -8px` → `top: 50%; transform: translateY(-50%)` for perfect centering
  - Consistent orange color across all training load UI elements
  - **Rationale:** Lime green inconsistent with orange primary theme; vertical centering improves visual alignment
- **2025-10-29:** Personal Records (PRs) page semantic theme update
  - Replaced all blue buttons → `btn-primary` (orange)
  - Updated category badges: `bg-blue-100/bg-orange-100` → `badge-strength/badge-cardio/badge-hybrid`
  - Loading spinner: `border-blue-600` → `border-orange-primary`
  - Error states: `bg-red-50 dark:bg-red-900/20 text-red-*` → `bg-error-soft text-error`
  - Text colors: `text-gray-500/700 dark:text-gray-300/400` → `text-text-primary/secondary`
  - Filter tabs: `border-blue-500` → `border-orange-primary`
  - All interactive elements now use semantic orange primary accent
  - **Rationale:** Complete semantic theme compliance for consistency across entire mobile app
- **2025-10-29:** Training Score widget card backgrounds updated
  - Changed 4 stat cards from blue-grey (`bg-gray-50 dark:bg-gray-700`) → contrasting dark grey (`bg-dark-elevated`)
  - Added borders (`border border-dark-border`) for better visual separation
  - Cards affected: Selected Week load, Previous Week load, Weekly KG, Weekly KM
  - Location: TrainingScoreWidget component used on dashboard
  - **Rationale:** Blue-grey backgrounds inconsistent with semantic theme; dark grey provides better contrast while maintaining visual hierarchy
- **2025-10-29:** Comprehensive input field and text color standardization
  - Updated CSS variables in `globals.css`:
    - Adjusted `--dark-input` to medium grey token for better balance
    - Adjusted `--text-primary` to smoke grey token for reduced eye strain
  - Replaced all remaining `bg-dark-card` → `bg-dark-input` across entire mobile app
  - Files updated: training/new, training/edit, templates, prs/new, settings, auth/register
  - Result: Consistent medium grey input backgrounds with softer smoke grey text throughout
  - **Rationale:** Previous light grey token was too light; medium grey token improves contrast while maintaining accessibility
- **2025-10-29:** Custom exercise modal and link standardization
  - Updated "Custom Exercise" link from teal (`text-teal-500`) → orange (`text-orange-primary`)
  - Applied to training/new and training/edit pages for consistency
  - Updated CustomExerciseModal component:
    - Background: removed gradient → `bg-dark-elevated1` with `border border-dark-border`
    - Primary button: `bg-blue-600` → `bg-orange-primary` with `hover:bg-orange-hover`
    - All form inputs: updated to use `bg-dark-input`, `border-dark-border`, `text-text-primary`
    - All labels: `text-gray-700 dark:text-gray-300` → `text-text-primary`
    - Error messages: `text-red-500` → `text-error`
    - Checkbox borders: `border-gray-300` → `border-dark-border`
    - Loading text: `text-gray-500 dark:text-gray-400` → `text-text-secondary`
    - Cancel button: updated to semantic text colors
- **2025-10-29:** Analytics page card background standardization
  - Updated Training Load, Activity Time, and Training by Category cards
  - Changed from `bg-gray-800` (blue-grey) → `bg-dark-elevated1` with `border border-dark-border`
  - Updated titles from `text-white` → `text-gray-900 dark:text-white` for consistency
  - All analytics cards now match Total Distance card styling
- **2025-10-29:** Navigation menu orange accent consistency
  - Updated HamburgerMenu component to use orange for all interactive elements
  - Changed dividers from `border-dark-border` → `border-orange-primary/30` (header, user profile, footer)
  - Changed close button X icon from grey → `text-orange-primary`
  - Changed hamburger menu icon from grey → `text-orange-primary`
  - Changed all navigation item icons from grey → `text-orange-primary` (no longer grey by default, orange on hover)
  - Maintains sign-out as error color for distinction
- **2025-10-29:** Standardized all input/select/textarea fields across mobile app
  - Replaced `bg-white dark:bg-gray-700` → `bg-dark-card`
  - Replaced `border-gray-300 dark:border-gray-600` → `border-dark-border`
  - Replaced `focus:border-blue-500` → `focus:border-orange-primary`
  - Replaced `placeholder-gray-*` → `placeholder:text-text-tertiary`
  - Updated 9 files: templates, training/new, training/edit, training/view, prs/new, settings, auth/register, dashboard
- **2025-10-28:** Updated strength category to neutral grey token for improved contrast differentiation

### Reference Documentation
- Full guide: `docs/SEMANTIC_THEME.md`
- Contributing standards: `CONTRIBUTING.md`

---

### 1) Navigation that's obvious, not mysterious

- **Top‑level structure:** Keep primary navigation to **3--5 destinations**; if you have more, demote extras into search, a drawer, or contextual links. Bottom nav/tab bars excel on phones for reach and predictability. [Material Design](https://m3.material.io/components/navigation-bar/guidelines?utm_source=chatgpt.com)
- **Wayfinding:** Persistent page titles, a consistent "Back" affordance, and a global search entry point.
- **Progressive disclosure:** Shallow hierarchies beat labyrinths; hide advanced controls behind details/secondary actions.
- **Don't rely on gestures alone:** Swipes and long‑presses should be optional sugar with a visible alternative. Apple's guidance: don't overload familiar gestures. [Apple Developer](https://developer.apple.com/design/human-interface-guidelines/gestures/?utm_source=chatgpt.com)

### 2) Touch targets & spacing

- **Minimum target sizes:**

    - iOS guidance: **≥ 44 × 44 pt** hit targets. [Apple Developer](https://developer.apple.com/design/tips/)

    - Material/Android: **≥ 48 × 48 dp**. [Material Design](https://m3.material.io/foundations/designing/structure?utm_source=chatgpt.com)

    - Web accessibility (WCAG 2.2): **≥ 24 × 24 CSS px** (or provide spacing/equivalents). [W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html?utm_source=chatgpt.com)
- **Finger‑friendly spacing:** Keep adjacent targets separated; don't cram action clusters.

### 3) Readability & visual hierarchy

- **Type:** Start near 16 px for body, scale up for density; avoid more than two typefaces.
- **Contrast:** Meet **WCAG AA** -- **4.5:1** for body text, **3:1** for large text. [W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html?utm_source=chatgpt.com)
- **Scanning:** Use cards/lists with clear titles, supportive meta, and generous white space.

### 4) Performance that feels instantaneous

- **Design to Core Web Vitals targets (mobile, p75):**

    - **LCP ≤ 2.5 s** (main content paints quickly). [web.dev](https://web.dev/articles/lcp)

    - **INP ≤ 200 ms** (consistent interaction responsiveness). [web.dev](https://web.dev/articles/inp)

    - **CLS ≤ 0.1** (no janky layout shifts). [web.dev](https://web.dev/articles/cls)
- **Tactics:** Lazy‑load below‑the‑fold media, reserve space for images/ads to prevent shifts, minimize JS on critical paths, stream fonts with fallbacks.

### 5) Accessibility as a first‑class citizen

- **Keyboard/focus:** Visible focus states; don't trap focus in overlays.
- **Screen readers:** Semantic HTML, labelled controls, alt text that's meaningful.
- **Motion sensitivity:** Honour `prefers-reduced-motion`; provide non‑animated feedback.
- **Color alone is insufficient:** Pair icons/labels/patterns with color cues.

### 6) Safe‑area, orientation & device fit

- **Respect notches/home indicators:** Layout within **safe areas**, adapting when bars appear or rotate; on the web, use CSS env insets for padding on anchored elements. Apple's HIG covers safe‑area behaviour. [Apple Developer+1](https://developer.apple.com/design/human-interface-guidelines/layout?utm_source=chatgpt.com)
- **Thumb reach:** Keep primary actions near the bottom on tall phones; avoid top‑corner essentials.

### 7) Forms that don't make users sigh

- **Minimise friction:** Fewer fields, top‑aligned labels, instant validation, and human copy.
- **Mobile inputs:** `type="tel"`, `email`, `number`, `date`; add `inputmode` and `autocomplete` hints.
- **Error recovery:** Clear, localised messages with fix‑it guidance.

### 8) Feedback, states & micro‑interactions

- **Every action acknowledges:** Press/hover states, spinners with optimistic UI where safe, and toasts for transient success.
- **Three essential states:** Empty (helpful onboarding), Loading (skeletons/placeholders), and Error (retry/offline options).

### 9) Theming, dark mode & brand

- **System aware:** Honour `prefers-color-scheme`; provide a toggle if appropriate.
- **Consistent tokens:** Elevation, radius, and spacing tokens keep the UI cohesive.

### 10) Resilience & privacy

- **Network adversity:** Cache critical shell, queue writes, and degrade gracefully offline.
- **Privacy‑by‑design:** Ask only for necessary permissions; explain why at point of need.
* * *

## Recent Migrations & Fixes

### 2025-10-29: iOS Header Safe Area Fix
**Issue:** Menu icon unreachable on iOS devices with notch/Dynamic Island; visible gap between screen top and header background

**Root Cause:** 
- Header used `safe-area-top` CSS class which applies padding-top
- Padding pushes content down but doesn't extend background behind status bar
- Creates visual gap and makes menu icon hard to reach on iOS devices

**Solution:**
- Replaced `safe-area-top` class with `pt-[env(safe-area-inset-top)]` directly on header elements
- This extends background color all the way to screen edge (behind notch/Dynamic Island)
- Content properly respects safe area insets and remains clickable
- Follows iOS best practice: background extends to edge, content positioned safely

**iOS Best Practice:**
- Use `padding-top: env(safe-area-inset-top)` on element with background color
- This creates seamless appearance on devices with notches
- Content starts below safe area automatically
- Menu icons and interactive elements remain fully accessible

**Technical Details:**
```tsx
// Before (creates gap):
<header className="bg-dark-secondary border-b border-dark-border safe-area-top">

// After (extends background):
<header className="bg-dark-secondary border-b border-dark-border pt-[env(safe-area-inset-top)]">
```

**Files Changed:**
- `apps/mobile/src/components/Navigation.tsx` - Shared Header component
- `apps/mobile/src/app/dashboard/page.tsx` - Dashboard custom header

**Note:** Auth pages (login, register, forgot-password, reset-password) and landing page still use `safe-area-top` class without backgrounds - these don't need the fix as they have no header background to extend.

---

### 2025-10-29: Workout Update Duplicate Save Guard
### 2025-10-30: Hamburger Menu Attached to Header
### 2025-10-30: Workout Template Selection Modal Redesign
**Issue:** Legacy template selector modal used mixed raw Tailwind colors, inconsistent spacing, and lacked semantic elevation surfaces. Accessibility (focus states, backdrop clarity) and sticky header/footer structure were missing.

**Root Cause:** Original implementation pre-dated design system consolidation; carried forward ad-hoc palette and layout primitives. Search input was separated from context, badges used raw palette tokens, and scrolling container caused header/footer jump.

**Solution:** Rebuilt modal with design system primitives:
* Semantic surfaces: `bg-dark-elevated1` body, `bg-dark-elevated2` header/footer.
* Sticky header (search + close) and sticky footer actions for consistent UX during long scroll.
* Badges mapped to scope with semantic color usage (`org` → orange, `personal` → neutral, `system` → indigo variant).
* Unified spacing (`px-5 py-4`), consistent rounded corners (`rounded-xl`).
* Backdrop upgraded to `bg-black/70 backdrop-blur-sm`.
* Search input integrated into header; compact responsive width.
* Reduced-motion friendly (no aggressive transitions aside subtle color changes).

**Technical Snippet:**
```tsx
<div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-dark-elevated1 border border-dark-border rounded-xl shadow-2xl">
  <div className="flex items-center gap-4 px-5 py-4 border-b border-dark-border bg-dark-elevated2 sticky top-0">
    <h3 className="text-base font-semibold text-text-primary tracking-tight">Select Template</h3>
    <input className="px-3 py-2 w-40 sm:w-56 rounded-md bg-dark-input border border-dark-border focus:ring-2 focus:ring-orange-primary" />
    <button className="p-2 rounded-md hover:bg-dark-elevated1 focus:ring-2 focus:ring-orange-primary" aria-label="Close template selection">…</button>
  </div>
  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">/* templates */</div>
  <div className="border-t border-dark-border p-4 flex gap-3 bg-dark-elevated2 sticky bottom-0">/* actions */</div>
</div>
```

**Files Changed:**
- `apps/mobile/src/app/training/new/page.tsx` – Refactored `TemplateSelectionModal` implementation.

**Follow-ups (Optional):**
- Add keyboard navigation (ArrowUp/ArrowDown to traverse templates, Enter to confirm).
- Implement focus trap + initial focus on search input.
- ESC key listener to close modal.
- Add virtualization for large template counts (if > 200) to improve scroll performance.
- Analytics event on template selection (template_id, scope, exercise_count).

---
**Issue:** Floating hamburger button overlapped or became unreachable near the iOS notch and occasionally conflicted with page stacking contexts.

**Root Cause:** Button used `position: fixed` with `top/right` offsets (`z-[60]`). Layout changes and safe-area insets caused inconsistent tap targets; modals and sticky headers competed in higher z-index layers.

**Solution:** Removed floating positioning. Embedded `HamburgerMenu` inside a global sticky `<header>` (`layout.tsx`). Converted button to inline element with `ml-auto`. Overlay retained (`z-[70]`) for menu panel. Eliminates overlap and ensures consistent accessibility.

**Technical Details:**
```tsx
// layout.tsx header
<header className="sticky top-0 z-50 flex items-center gap-4 px-4 py-3 bg-dark-elevated2 border-b border-dark-border safe-area-top">
  <h1 className="text-lg font-semibold text-text-primary tracking-tight">RYTHM</h1>
  <HamburgerMenu />
</header>

// HamburgerMenu.tsx button (inline)
<button
  onClick={() => setIsOpen(true)}
  className="ml-auto p-2 rounded-lg bg-dark-elevated1 border border-dark-border hover:border-orange-primary/40 focus:outline-none focus:ring-2 focus:ring-orange-primary transition-colors"
  aria-label="Open navigation menu"
>
  <Bars3Icon className="w-6 h-6 text-orange-primary" />
</button>
```

**Files Changed:**
- `apps/mobile/src/components/HamburgerMenu.tsx` – Removed fixed positioning; inline button styling.
- `apps/mobile/src/app/layout.tsx` – Added sticky header wrapper and embedded menu.

**Follow-ups (Optional):**
- Consider moving header into a shared `Header` component for reuse.
- Add focus trap to navigation panel for accessibility.
- Add ESC key listener to close menu.
- Provide reduced-motion variant (skip backdrop blur).

---
**Issue:** Users could occasionally trigger two rapid PUT requests when tapping "Update Workout" twice before the disabled state applied, leading to duplicate processing.

**Root Cause:** `handleUpdateWorkout` set `saving` after initial checks but lacked an early-return guard. A very fast second tap (within the same event loop tick) could fire before React re-rendered to disable the button.

**Solution:** Added an early `if (saving) return;` guard at the start of `handleUpdateWorkout` (mirrors create workflow). Ensures idempotent client behavior and prevents duplicate PUT submissions.

**Technical Details:**
```tsx
const handleUpdateWorkout = async () => {
  if (!user || !token) return
  if (saving) return // NEW: prevents double submit race
  setSaving(true)
  try { /* ... */ } finally { setSaving(false) }
}
```

**Files Changed:**
- `apps/mobile/src/app/training/edit/[id]/page.tsx` – Added early guard.

**Follow-ups (Optional):**
- Consider server-side idempotency keys (e.g., `X-Request-Id`) for absolute protection.
- Add a regression test simulating rapid double clicks to assert single network call.

---

### 2025-10-29: Exercise Lookup Determinism Fix
**Issue:** Workouts saved with identical exercises from templates would show duplicate exercise entries (e.g., "Bench Press" appearing twice in the same workout) despite client payload containing no duplicates.

**Root Cause:** The API's exercise lookup query was non-deterministic:
```sql
SELECT exercise_id FROM exercises WHERE name = $1 LIMIT 1
```
Without `ORDER BY`, PostgreSQL could return different `exercise_id` values for the same exercise name on consecutive queries. Since the `exercises` table has a UNIQUE constraint on `name`, multiple calls during a single workout save would randomly retrieve different IDs for the same exercise, creating apparent duplicates in the `sets` table.

**Solution:** Made the query deterministic by adding `ORDER BY created_at ASC`:
```sql
SELECT exercise_id FROM exercises WHERE name = $1 ORDER BY created_at ASC LIMIT 1
```
Now the query consistently returns the oldest exercise with that name, ensuring the same exercise_id is used across all sets in a workout.

**Technical Details:**
- The `exercises` table is global (no tenant isolation) with a UNIQUE index on `name`
- Each exercise name should have exactly one entry in the exercises table
- Non-deterministic LIMIT queries can return different rows on each execution
- Ordering by `created_at ASC` ensures consistent results (oldest exercise wins)

**Files Changed:**
- `apps/api/src/routes/sessions-rest.ts` – Added `ORDER BY created_at ASC` to exercise lookup query (line ~458)

**Related Issues Fixed:**
- Template_id vs exercise_id confusion: Removed incorrect assignment of `templateEx.exercise_id` in client code (templates have template_id, not exercise_id)
- Foreign key constraint violations: Prevented by ensuring exercise_id is only sent for exercises loaded from existing sessions

**Prevention Guidelines:**
- Always use `ORDER BY` with `LIMIT` queries to ensure deterministic results
- When querying shared/global tables, consider adding explicit ordering by primary key or timestamp
- Test exercise lookup consistency across multiple workout saves with the same exercise names

---

### 2025-10-29: PRs Pages UI Consistency Update
**Issue:** PRs pages had inconsistent button styles and colors not matching design system

**Changes:**
- **PRs List Page (`/prs`):** Updated pagination buttons to use semantic `btn-secondary` class instead of raw Tailwind utilities
- **New PR Page (`/prs/new`):**
  - All input fields now use `bg-dark-elevated0` (form inputs surface) instead of `bg-dark-input`
  - Exercise picker and search dropdown use semantic text classes (`text-text-secondary`, `text-text-tertiary`)
  - Category buttons: Strength uses neutral grey (design token for Strength), unselected state uses `btn-secondary`
  - Submit button uses semantic `btn-primary btn-wide` classes
  - Help text uses `text-text-tertiary` instead of raw gray utilities
  - All hover states use semantic `hover:bg-dark-elevated1` instead of raw colors

**Design System Compliance:**
- ✅ No raw hex colors outside category indicators
- ✅ Semantic button classes (`btn-primary`, `btn-secondary`)
- ✅ Semantic surface elevation (`bg-dark-elevated0/1`)
- ✅ Semantic text hierarchy (`text-text-primary/secondary/tertiary`)
- ✅ Strength category uses neutral grey token, Cardio uses burnt orange token

**Files Changed:**
- `apps/mobile/src/app/prs/page.tsx` - Button styling consistency
- `apps/mobile/src/app/prs/new/page.tsx` - Complete design system migration

---

### 2025-10-29: Exercise History Modal Fix (Training Edit Page)
**Issue:** Exercise history modal (clock icon) not working in `/training/edit/<id>` - `template_id` was `undefined`

**Root Cause:** Backend REST API (`/api/sessions/:id`) didn't return `template_id` when fetching workout sessions

**Solution:**
- **Backend:** Updated `sessions-rest.ts` GET `/:id` endpoint to include `LEFT JOIN exercise_templates` matching by exercise name
- **Frontend:** Updated edit page to use `template_id` from API response (with fallback to local matching)
- **Frontend:** Improved useEffect dependency array to include `exercises.length` to avoid stale closures

**Files Changed:**
- `apps/api/src/routes/sessions-rest.ts` - Added `template_id` to exercises query via LEFT JOIN
- `apps/mobile/src/app/training/edit/[id]/page.tsx` - Updated to use API-provided template_id with fallback

**Testing:** Verify exercise history modal opens when clicking clock icon on exercise cards in edit page

---

## Quick implementation checklist (copy for your PR template)

### RYTHM Theme Compliance (Required First)
- ✅ No gradient utilities (`bg-gradient-to-*`) in any modified files
- ✅ No raw hex colors outside CSS variable definitions
- ✅ Semantic text classes used: `text-text-primary/secondary/tertiary`
- ✅ Buttons use helper classes: `btn-primary` or `btn-secondary`
- ✅ Surfaces use elevation scale: `bg-dark-elevated0/1/2`
- ✅ Focus states present on all interactive elements
- ✅ ESLint passes without theme-related errors
- ✅ Borders use `border-dark-border` not raw grays

### Universal Mobile/Web Standards
- Primary nav has **3--5** destinations; search is easy to find. [Material Design](https://m3.material.io/components/navigation-bar/guidelines?utm_source=chatgpt.com)
- Tap targets: **≥ 44 pt (iOS)** / **48 dp (Android)** / **≥ 24 px** with spacing on the web. [Apple Developer](https://developer.apple.com/design/tips/)[Material Design](https://m3.material.io/foundations/designing/structure?utm_source=chatgpt.com)[W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html?utm_source=chatgpt.com)
- Text contrast: **AA (4.5:1 / 3:1 large)**; focus styles visible. [W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html?utm_source=chatgpt.com)
- **LCP ≤ 2.5 s**, **INP ≤ 200 ms**, **CLS ≤ 0.1** at mobile p75 (field data). [web.dev+2web.dev+2](https://web.dev/articles/lcp)
- Safe‑area respected; no content under notches/home indicator. [Apple Developer+1](https://developer.apple.com/design/human-interface-guidelines/layout?utm_source=chatgpt.com)
- Supports reduced motion & dark mode; no gesture‑only actions. [Apple Developer](https://developer.apple.com/design/human-interface-guidelines/gestures/?utm_source=chatgpt.com)