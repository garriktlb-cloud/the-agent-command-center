

## Marketing Center

Build a new Marketing section with two views: an index page showing curated insight cards, and a detail page for each insight with downloadable images and copy-ready captions.

### Database

Create a `marketing_insights` table:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | e.g. "What Pricing Actually Signals" |
| hook_text | text | Bold quote on card, e.g. "Buyers don't compare price. They compare perceived value." |
| insight_body | text | "How to think about this" paragraph |
| talk_track | text | "What to say in conversations" paragraph |
| social_caption | text | Ready-to-copy Instagram/LinkedIn caption |
| image_path | text nullable | Path in storage bucket |
| sort_order | int default 0 | |
| created_at | timestamptz | |

- RLS: `SELECT` for authenticated users (read-only content).
- Create a `marketing-images` storage bucket (public).
- Seed 3 rows matching the screenshots' content (pricing/value, buyer feelings, positioning/demand).

### Pages and Components

**`src/pages/Marketing.tsx`** — Index page
- Dark header banner: "What top agents are saying right now" + subtitle + search input
- 3-column grid of `MarketingInsightCard` components
- Search filters by title and hook_text
- Links to `/marketing/:id`

**`src/components/marketing/MarketingInsightCard.tsx`**
- Rounded card with large 4:3 dark image area (shows stored image or dark placeholder with "The List Bar" text)
- Below image: bold hook_text

**`src/pages/MarketingInsightDetail.tsx`** — Detail page
- Back link to `/marketing`
- Title heading
- Two-column layout:
  - Left: Large branded image with hook_text overlaid in white centered text, "Download Image" button below
  - Right: Three sections with small uppercase labels — INSIGHT (insight_body), WHAT TO SAY (talk_track), POST THIS (social_caption) with "Copy Caption" button
- Download triggers browser download of the image from storage

**`src/App.tsx`** — Routing
- Replace placeholder route with `Marketing` component
- Add `/marketing/:id` route for detail page

### Seed Data
Insert 3 insights:
1. "What Pricing Actually Signals" — "Buyers don't compare price. They compare perceived value."
2. "First Impressions Are Everything" — "Buyers decide how they feel about a home in seconds."
3. "The Power of Positioning" — "Positioning creates demand. Price follows."

Each with full insight_body, talk_track, and social_caption text. No images initially (dark placeholder with branding text).

### Files changed/created
- `src/pages/Marketing.tsx` (new)
- `src/pages/MarketingInsightDetail.tsx` (new)
- `src/components/marketing/MarketingInsightCard.tsx` (new)
- `src/App.tsx` (update routes)
- DB migration: create table, storage bucket, RLS, seed data

