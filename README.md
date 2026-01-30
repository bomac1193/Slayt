# Slayt · Taste-Driven Content OS

One control room for grids, rollouts, and campaigns—powered by a unified Taste Brain (Subtaste) and Folio collections. We optimise for resonance, not just posting volume.

## Diagnosis (market gap)
- Schedulers are commoditised; AI outputs are generic and stateless.
- Rollouts/templates are static; performance rarely feeds back into strategy.
- Taste signals are siloed (no single brain across grid/YouTube/rollouts).
- Visual fidelity is weak; previews/crops don’t reflect what actually ships.

## Guiding policy
- **One Taste Brain:** every signal (ratings, skips, Folio saves, platform dislikes, performance) updates a single genome that conditions all generation, scoring, and rollouts.
- **Platform-native UX:** grid-first architecture; tuned previews and non-destructive crops for IG/TikTok/YouTube/X.
- **Rollout automation:** archetype-aware templates auto-filled with taste-aligned AI; A/B and performance feedback close the loop.
- **Avant AI stack:** multi-model chain (spiky → polish) with taste directives and brand guardrails.

## Strategy (blue-ocean moves)
- **Collection-driven generation:** Folio saves + taste genome condition titles/hooks/descriptions and rollout copy.
- **Performance-closing loop:** every post scored vs taste + outcome; future recs adapt automatically; “why it worked” surfaced.
- **Archetype rollout kits:** templates/styles recommended per glyph; on-brand/off-brand checks before scheduling.
- **Admin/test harness:** neutral vs profiled modes to stress-test learning and confidence.
- **Visual fidelity:** accurate platform previews; non-destructive crop/reposition saved to uploads.

## ERRC (Eliminate / Reduce / Raise / Create)
- **Eliminate:** generic one-size generations; siloed per-surface prefs; vanity dashboards.
- **Reduce:** manual rollout planning; per-post prompt tinkering; shallow analytics.
- **Raise:** taste-aware generation quality; platform-specific previews/crops; rollout automation; guardrails.
- **Create:** unified Taste Brain; taste-driven rollout builder; avant multi-model stack with spiky/safe control; Folio-conditioned AI; template marketplace indexed by archetype.

## Horizons (defensibility)
- **1–2 yrs:** Taste Brain across all surfaces; taste-driven rollout automation; avant stack default; performance loop live.
- **5–10 yrs:** Dynamic playbooks that rewrite/schedule themselves from results; template marketplace with rev-share; team governance/provenance.
- **10–20 yrs:** Adaptive brand pilot that self-optimises campaigns; collective (privacy-safe) taste graph birthing new subgenres/rollouts.

## Getting Started
```bash
git clone https://github.com/your-org/slayt.git
cd slayt && npm install
cd client && npm install
# copy env and configure
cp .env.example .env
npm run dev           # backend
cd client && npm run dev  # frontend
```

Key env (server):
- `MONGODB_URI`, `JWT_SECRET`
- `CLOUDINARY_*` for media
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, (optional `GROK_API_KEY`/`XAI_API_KEY`)
- `FOLIO_API_URL` for collections/taste conditioning
