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

- Primary nav has **3--5** destinations; search is easy to find. [Material Design](https://m3.material.io/components/navigation-bar/guidelines?utm_source=chatgpt.com)
- Tap targets: **≥ 44 pt (iOS)** / **48 dp (Android)** / **≥ 24 px** with spacing on the web. [Apple Developer](https://developer.apple.com/design/tips/)[Material Design](https://m3.material.io/foundations/designing/structure?utm_source=chatgpt.com)[W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html?utm_source=chatgpt.com)
- Text contrast: **AA (4.5:1 / 3:1 large)**; focus styles visible. [W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html?utm_source=chatgpt.com)
- **LCP ≤ 2.5 s**, **INP ≤ 200 ms**, **CLS ≤ 0.1** at mobile p75 (field data). [web.dev+2web.dev+2](https://web.dev/articles/lcp)
- Safe‑area respected; no content under notches/home indicator. [Apple Developer+1](https://developer.apple.com/design/human-interface-guidelines/layout?utm_source=chatgpt.com)
- Supports reduced motion & dark mode; no gesture‑only actions. [Apple Developer](https://developer.apple.com/design/human-interface-guidelines/gestures/?utm_source=chatgpt.com)