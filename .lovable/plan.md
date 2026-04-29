## News Feed for Agents

A new "News Feed" page where agents see AI-curated, bite-sized briefs about the Denver real estate market and the broader economic data that affects it (rates, inflation, jobs, housing supply). Each brief is written for quick scanning — headline, 2-3 sentence "what it means for you," source link, and tags.

### How AI pulls fresh data

We'll use **Perplexity** (Sonar model) via an edge function. Perplexity is purpose-built for this — it does a live web search, grounds the answer in real articles, and returns citations. We'll prompt it to:

1. Find the most relevant Denver-area real estate news from the past 7 days (DMAR reports, Denver Post real estate, Denverite, BusinessDen, Colorado Real Estate Journal, etc.)
2. Pull current US economic indicators that move housing (Fed funds rate, 30-yr mortgage rate, CPI, jobs report, housing starts)
3. For each item, generate: a 1-line headline, a 2-3 sentence agent-friendly takeaway ("what this means for your clients"), a category tag, and the source URL

A second AI pass (Lovable AI / Gemini) ranks items by relevance to a Denver listing agent and writes the takeaway in the brand voice.

### Refresh model

- **Scheduled refresh**: a `pg_cron` job runs the edge function every morning at 6am MT — agents wake up to a fresh feed.
- **Manual refresh**: an admin/agent can hit a "Refresh now" button on the page (rate-limited to once per hour) to pull on demand.

Articles are cached in the database so we're not paying Perplexity on every page load.

### Database

New table `news_items`:

| Column | Type |
|---|---|
| id | uuid PK |
| category | text (`denver_market`, `mortgage_rates`, `economy`, `policy`) |
| headline | text |
| takeaway | text — agent-friendly 2-3 sentences |
| source_url | text |
| source_name | text |
| published_at | timestamptz — when the source published |
| created_at | timestamptz — when we ingested |
| relevance_score | int (1-10) for sorting |

RLS: any authenticated user can SELECT; only admins (and the edge function via service role) can INSERT/DELETE.

A small `news_refresh_log` table tracks the last refresh time so we can throttle and show "Updated 3h ago."

### Page: `/news`

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│  Banner: "Denver Market Pulse"                          │
│  "AI-curated news + data shaping your market today"     │
│  Last updated 2h ago  ·  [Refresh]                      │
├─────────────────────────────────────────────────────────┤
│  Filter chips: All | Denver Market | Rates | Economy    │
├─────────────────────────────────────────────────────────┤
│  ┌─ Card ──────────────────────────────────────────┐    │
│  │ [Denver Market]  ·  2h ago                      │    │
│  │ Median price up 3% in Highlands Ranch           │    │
│  │ DMAR's October report shows luxury inventory…   │    │
│  │ What it means: Buyers in the $1M+ range have…   │    │
│  │ Source: DMAR Market Trends →                    │    │
│  └─────────────────────────────────────────────────┘    │
│  (more cards)                                           │
└─────────────────────────────────────────────────────────┘
```

Cards are dense (not full-width image cards like Marketing) so an agent can scan 10-15 in under a minute. Category color-coded with subtle accent.

Add **News** to the sidebar's Growth section between Marketing and Coaching, icon `Newspaper`.

### Technical details

**Edge function** `supabase/functions/refresh-news/index.ts`:
1. Calls Perplexity Sonar with a structured prompt asking for ~10 items across the 4 categories
2. Uses Perplexity's `response_format: json_schema` to get structured output (headline, summary, source_url, source_name, category)
3. Passes results to Lovable AI (gemini-3-flash-preview) to rewrite each `summary` as a brand-voice "takeaway" and assign a `relevance_score`
4. Wipes items older than 7 days, inserts new ones, logs refresh timestamp
5. Returns count of items inserted

**Connector**: needs Perplexity connection (`standard_connectors--connect` with `connector_id: perplexity`). Perplexity does NOT use the gateway — uses `PERPLEXITY_API_KEY` directly.

**Cron**: `pg_cron` job calling the edge function daily at 12:00 UTC (6am MT).

**Frontend** `src/pages/News.tsx`:
- TanStack Query fetches `news_items` ordered by `relevance_score DESC, published_at DESC`
- Category filter chips
- Refresh button calls the edge function, then refetches
- Each card links out via `<a target="_blank">` to the source

**Files**:
- `supabase/functions/refresh-news/index.ts` (new)
- `src/pages/News.tsx` (new)
- `src/components/news/NewsCard.tsx` (new)
- `src/App.tsx` (add `/news` route)
- `src/components/layout/AppSidebar.tsx` (add nav item)
- DB migration: `news_items` + `news_refresh_log` tables, RLS, cron job

### What I need from you

1. **Confirm Perplexity** as the news source — I'll prompt you to connect it during build. (Alternative: Firecrawl + manually listed sources, but Perplexity is much simpler for this use case.)
2. **Geographic scope** — Denver metro only, or expand to Colorado / national housing market? Plan assumes Denver metro + national rates/economy.
3. **Daily auto-refresh OK?** Once per day at 6am MT keeps cost low (~30 Perplexity calls/month). Say if you'd prefer twice daily or weekly.
