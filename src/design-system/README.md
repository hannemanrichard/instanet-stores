# Bellami Stores design system

**Theme:** Modern Minimal (tweakcn) — primary indigo `#5138F5`, accent lavender `#E8E9FF`.

| Concern | Source of truth |
| --- | --- |
| Colors / radius | `tokens.css` + `tokens.ts` |
| Brand contract | `DESIGN.md` (repo root) |
| Fonts | `src/app/layout.tsx` (`--font-inter`, `--font-cairo`, serif, mono) |
| Nav icons | `src/shared/components/layout/navIcons.ts` + Hugeicons |
| Public import | `@/design-system` |

Prefer semantic utilities (`bg-primary`, `text-muted-foreground`, `border-border`). Do not hard-code hex in feature UI.

See `docs/UI_TRANSFORMATIONS_BELLAMI_STORES.md` for the affiliate → stores port playbook.
