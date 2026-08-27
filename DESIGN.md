# FinWise — Design System (DESIGN.md)

This document defines the UI style guide and design parameters for FinWise. The visual style is designed to be high-contrast, modern, clean, and energetic for college students, avoiding dry or clinical designs.

---

## 🎨 Color Palette & Design Tokens

| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#F8F9FA` | Soft, clean off-white canvas for comfort and high accessibility. |
| **Card Surface** | `#FFFFFF` | Core container background with a 1px border (`#E2E8F0` / `border-slate-200/80`) and very light shadow. |
| **Primary Brand Teal** | `#0F766E` / `#0D9488` | Major actions, active navigation states, primary buttons, progress indicators. |
| **Accent Amber / Gold** | `#F59E0B` / `#D97706` | Gamified elements, streaks, XP, warning alerts, special insights. |
| **Primary Text** | `#1E293B` | Strict readability for body and labels, matching WCAG AA guidelines. |
| **Deep Headings** | `#0F172A` | Page titles, main numbers, KPI values, cards. |
| **Muted Text** | `#64748B` | Secondary descriptions, timestamps, help text, axis labels. |
| **Success Emerald** | `#10B981` / `#059669` | Positive scores, "Affordable" YES verdicts, budget under-runs. |
| **Warning Orange** | `#F97316` | Spending velocity warnings, "CAUTION" affordability verdicts. |
| **Danger Rose** | `#F43F5E` / `#E11D48` | "Cannot Afford" NO verdicts, over-budget zones, critical errors. |

> [!WARNING]
> **NO DEFAULT TAILWIND BLUE:** Avoid standard blue shades (`blue-500`, `indigo-600`) for navigation or primary states. Use Brand Teal as the main tone, and slate/gray for structures.

---

## ✍️ Typography Pairing
* **Display & Headings:** `Outfit` (sans-serif)
  * Bold, friendly geometric letters. Used for dashboard hero titles, large numeric cards (e.g. Health Score, total balance), and modal headers.
* **Body, Tables, & Controls:** `Plus Jakarta Sans` (sans-serif)
  * High-legibility face with generous line heights (1.5–1.6). Ideal for chat feeds, data tables, and description fields.

---

## 📐 Layout & Spacing Rules
1. **Paddings & Margins:**
   * Container padding: `px-4 md:px-8 py-6`
   * Card internal padding: `p-5 md:p-6`
   * Vertical gap between cards: `gap-6` (24px)
2. **Card Geometry:**
   * Rounded corners: `rounded-2xl` (16px) or `rounded-3xl` (24px) for dashboard highlights.
   * Border width: `border border-slate-200/80` (or `slate-100` on white cards).
   * Shadows: `shadow-sm` or `shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]`. Avoid heavy, dark drop shadows.
3. **Responsive Grids:**
   * Use grid columns dynamically: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` to handle screens ranging from mobile viewport (375px) up to desktop (1440px).

---

## ✨ Motion & Micro-interactions
* **Framer Motion (`motion/react`):**
  * **Tab Switches:** Soft horizontal slide and fade on tab transition.
  * **Hover Lift:** Interactive cards and chips lift slightly on hover: `whileHover={{ y: -3, scale: 1.01 }}`.
  * **Alerts:** Toast/modal alerts fade and scale in with elastic transitions.
* **Transitions:** Always use standard Tailwind duration values: `transition-all duration-200 ease-in-out` for hover color switches.
