# Permanent Project Rules & Development Guidelines

## 1. Technology Stack
- **Languages & Runtimes**: Plain HTML5, CSS3, and vanilla JavaScript only.
- **Constraints**: No frameworks, no build tools, no npm, no package bundlers.

## 2. Aesthetic & Design Philosophy
- **Style**: Hyper-clean, minimalist, editorial, and high-end (reminiscent of a premium Substack or print magazine).
- **Spacing**: Generous whitespace and measured pacing.
- **Hierarchy**: Strong, deliberate typographic hierarchy.
- **Palette**: Maximum 1 accent color; strictly no gradients; no drop-shadows used as decorative elements.
- **Visuals**: Strictly NO emojis anywhere in copy or UI elements; no stock "AI slop" or generic illustration kits.

## 3. Typography
- **Heading Font**: One serif display font for headings (Google Fonts, linked via stylesheet).
- **Body Font**: One clean sans-serif for body copy.
- **Icons**: No icon-font libraries (e.g. FontAwesome). Use crisp, accessible inline SVGs if icons are required.

## 4. Layout & Grid
- **System**: 12-column responsive grid.
- **Approach**: Mobile-first architecture.
- **Breakpoints**:
  - `480px` (Mobile landscape)
  - `768px` (Tablet portrait)
  - `1024px` (Tablet landscape / small desktop)
  - `1280px` (Desktop)
- **Responsiveness**: Every section must be fully responsive across all breakpoints and tested visually at mobile widths.

## 5. Verification & Testing
- **Internal Browser Tool**: Do NOT use internal browser tools or automated visual verification agents.
- **Delivery**: Generate clean code and detailed written walkthroughs only. Manual verification is handled by the user in their own browser.

## 6. Accessibility & Semantic Standards
- **Semantic HTML**: Mandatory use of standard landmark and structural tags (`<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`).
- **Accessibility (a11y)**:
  - Meaningful `alt` text on images.
  - Clear `aria-label` attributes where contextual cues are required.
  - Visible, intentional keyboard focus states (`:focus-visible`).
  - No color-only status indicators (must include text, patterns, or shape labels).

## 7. Frontend App Rules
- API base URL lives only in `frontend/js/config.js`. Never hardcode URLs elsewhere.
- All fetch calls go through `frontend/js/api.js`.
- JWT stored in `localStorage` key `"sp_token"`; user object in `"sp_user"`.
- Never trust client values for price, role, or payment status.
- Every page reuses `navbar.css`, `global.css`, and its own page CSS.
