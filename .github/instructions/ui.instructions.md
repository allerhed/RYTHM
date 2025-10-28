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
```tsx
// Background Surfaces (Elevation Scale)
bg-dark-primary      // Page background
bg-dark-elevated1    // Primary cards, panels, modals
bg-dark-elevated2    // Nested surfaces, headers within modals
bg-dark-elevated0    // Form inputs, subtle containers

// Text Hierarchy (Always Use These)
text-text-primary    // Headings, primary content
text-text-secondary  // Supporting labels, descriptions
text-text-tertiary   // Subtle metadata, placeholders

// Borders & Dividers
border-dark-border   // Standard borders for cards/inputs
```

### Component Helper Classes (Required)
```tsx
// Buttons (DO NOT compose manually)
<button className="btn-primary">Save</button>     // Burnt orange, primary action
<button className="btn-secondary">Cancel</button> // Neutral surface action

// Badges/Tags
<span className="badge-primary">strength</span>   // Highlighted category
<span className="badge-secondary">draft</span>    // Subdued status

// Icon Containers
<div className="icon-accent">{icon}</div>         // Circular with accent ring

// Accent Elements
<div className="accent-bar" />                    // Thin orange separator/emphasis
```

### Migration Patterns (Required)

**❌ DEPRECATED (Will Fail ESLint):**
```tsx
// DO NOT USE gradients
className="bg-gradient-to-b from-[#1a1a1a] to-[#232323]"

// DO NOT USE raw Tailwind grays
className="bg-gray-800 text-gray-400 hover:bg-gray-700"
```

**✅ CORRECT (Use Semantic Classes):**
```tsx
// Cards & Panels
<div className="bg-dark-elevated1 border border-dark-border rounded-lg p-4">
  <h3 className="text-text-primary">Title</h3>
  <p className="text-text-secondary">Supporting text</p>
</div>

// Modals
<div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
  <div className="bg-dark-elevated1 border border-dark-border rounded-lg shadow-xl p-6">
    <h2 className="text-text-primary mb-4">Modal Title</h2>
    <button className="btn-primary w-full">Confirm</button>
  </div>
</div>

// Form Inputs
<input 
  className="w-full px-3 py-2 border border-dark-border bg-dark-elevated0 
             text-text-primary focus:ring-2 focus:ring-orange-accent"
/>

// Interactive Lists
<button className="w-full p-3 hover:bg-dark-elevated1 transition-colors">
  <span className="text-text-primary">Item Title</span>
  <span className="text-text-tertiary">Metadata</span>
</button>
```

### Anti-Patterns (FORBIDDEN)
- ❌ `bg-gradient-to-*` anywhere in components
- ❌ Raw hex colors: `from-[#hex]` or `text-[#hex]`
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