@AGENTS.md

## Design Context

### Users
Forrest Lofegren, solo operator of Freedom Ryder Handcycles. Uses the CRM daily on desktop to manage leads, track email sequences, and monitor ad performance. His dad Bob is a secondary stakeholder who only receives weekly CSV exports and never touches the UI. Freedom Ryder serves disabled riders, including veterans seeking VA-funded handcycles.

### Brand Personality
**Professional, Clean, Reliable.** The interface should feel like a trusted business tool, not a toy. Forrest needs to glance at his pipeline and know exactly where things stand. No visual clutter, no unnecessary decoration.

### Aesthetic Direction
- **Palette:** Warm neutrals (cream #f6f1eb, warm-white #faf8f5) with forest green (#2d5a3d, #1e3d2a) as primary, rust (#c4573a) for alerts/destructive, amber (#b8860b) for warnings, sage (#5a8a6a) for secondary accents
- **Typography:** DM Serif Display for headings (warmth, personality), DM Sans for body text (clean readability)
- **Theme:** Light mode only. Organic, earthy, grounded. Not sterile or corporate.
- **Components:** shadcn/ui with brand-customized tokens. Lucide icons.
- **Anti-references:** No SaaS-blue, no neon gradients, no dark mode dashboard aesthetic. This is not a tech startup tool. It should feel like a well-made leather notebook, not a spaceship cockpit.

### Design Principles
1. **Clarity over cleverness.** Every element earns its pixels. If Forrest has to think about what something means, it's wrong.
2. **Information density without clutter.** Show the data Forrest needs (lead count, pipeline status, ROAS) without overwhelming. Use whitespace and typography hierarchy, not boxes and borders.
3. **Consistency is trust.** Same colors mean the same things everywhere. Green = positive/primary, rust = alert/destructive, amber = warning/pending. Never deviate.
4. **Accessibility is baseline.** WCAG AA minimum. Good contrast ratios, keyboard navigable, screen reader friendly. Freedom Ryder serves disabled riders. The tool should reflect that respect.
5. **Warmth over sterility.** The cream backgrounds, serif headings, and organic color palette create a feeling of craftsmanship. This is intentional. Don't flatten it into generic gray.
