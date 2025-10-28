# RYTHM Semantic Theme Guide

> Purpose: Central reference for the unified cinematic dark + burnt orange palette applied across Admin & Mobile apps. Provides variables, helper classes, usage patterns, and anti‑patterns.

## 1. Design Principles
- Single source of truth via CSS variables in global styles.
- No raw hex colors in components (except extremely rare visualization edge cases).
- Prefer semantic helpers (`.bg-dark-elevated1`, `.btn-primary`) over ad‑hoc utility chains.
- Dark surfaces use elevation scale; highlight actions use burnt orange spectrum.
- Accessible contrast: text-primary on dark surfaces; secondary/tertiary only for supporting metadata.

## 2. Core CSS Variables (excerpt)
Defined in `globals.css` (admin & mobile):
```
--orange-primary
--orange-hover
--orange-active
--orange-accent
--dark-primary
--dark-secondary
--dark-card
--dark-elevated0
--dark-elevated1
--dark-border
--text-primary
--text-secondary
--text-tertiary
```

## 3. Helper Classes
| Class | Purpose |
|-------|---------|
| `.bg-dark-elevated0` | Base elevated panel / modal header overlay |
| `.bg-dark-elevated1` | Primary card, panel, modal surface |
| `.btn-primary` | Prominent action (save/create). Burnt orange background, hover/active states |
| `.btn-secondary` | Neutral surface action contrasting with primary |
| `.icon-accent` | Circular icon container with subtle accent ring/hover |
| `.badge-primary` | Highlighted tag/badge for category/status |
| `.badge-secondary` | Subdued tag for metadata |
| `.accent-bar` | Thin accent separator / metric emphasis |

### Button Anatomy
Primary buttons should NOT compose gradients. Example:
```
<button class="btn-primary">Save</button>
<button class="btn-secondary">Cancel</button>
```

## 4. Migration Patterns
### Replace Gradients
Old:
```
<div class="bg-gradient-to-b from-[#1a1a1a] to-[#232323] ..."></div>
```
New:
```
<div class="bg-dark-elevated1 border border-dark-border ..."></div>
```

### Replace Gray Hover Panels
Old:
```
<button class="hover:bg-gray-700 ..."></button>
```
New:
```
<button class="hover:bg-dark-elevated1 ..."></button>
```

### Modal Backdrop
Use `bg-black/70` and semantic inner surfaces.

### Icon Circles
Old:
```
<div class="w-10 h-10 bg-orange-primary/10 rounded-full ..."></div>
```
New (accent ring optional):
```
<div class="icon-accent">...</div>
```

## 5. Text Tiers
| Tier | Usage | Class |
|------|-------|-------|
| Primary | Headings, core values | `text-text-primary` |
| Secondary | Support info, labels | `text-text-secondary` |
| Tertiary | Subtle metadata, placeholders | `text-text-tertiary` |

Avoid using raw `text-gray-*` utilities; map to semantic.

## 6. Form Inputs
Use a neutral dark background (e.g., `bg-dark-elevated0`) + border:
```
<input class="w-full px-3 py-2 border border-dark-border bg-dark-elevated0 text-text-primary focus:ring-2 focus:ring-orange-accent" />
```

## 7. Anti‑patterns (Do NOT use)
- `bg-gradient-to-*` on structural surfaces.
- Random `from-[#hex] to-[#hex]` palettes.
- Mixing raw Tailwind grays (`text-gray-400`) instead of semantic tiers.
- Inline styles for standard palette usage.
- Icon buttons without focus styles.

## 8. Accessibility & Focus
Add focus rings for actionable elements:
```
<button class="btn-primary focus:outline-none focus:ring-2 focus:ring-orange-accent focus:ring-offset-2">Action</button>
```

## 9. Examples
### Card
```
<div class="bg-dark-elevated1 border border-dark-border rounded-lg p-4">
  <h3 class="text-text-primary">Title</h3>
  <p class="text-text-secondary">Details...</p>
</div>
```

### Badge
```
<span class="badge-primary">strength</span>
<span class="badge-secondary">cardio</span>
```

### Modal
```
<div class="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
  <div class="bg-dark-elevated1 border border-dark-border rounded-lg shadow-xl p-6 w-full max-w-md">
    <h2 class="text-text-primary mb-4">Modal Title</h2>
    <button class="btn-primary w-full">Confirm</button>
  </div>
</div>
```

## 10. Mobile vs Admin Parity
- Helper class names identical across apps.
- Components must not rely on app‑specific gradient tokens.
- Shared design tokens allow future theme swaps.

## 11. How to Extend
Add new surface or role by defining a variable then mapping to a helper class in `globals.css`. Keep naming consistent (`bg-dark-elevated2`, etc.).

## 12. Checklist Before Merging UI Changes
- [ ] No gradient utility classes in modified files.
- [ ] No raw hex colors outside token definitions.
- [ ] Semantic text classes used.
- [ ] Buttons focus styles present.
- [ ] Dark surfaces use elevation scale.

## 13. Future Enhancements
- Light mode tokens.
- High contrast mode.
- Theming via user preference (persisted in profile).

---
If uncertain about a class, search existing usage or open a PR for review with screenshots.
