
Looking at the current `/coaching` page: both Continue Learning and Browse Topics use cards with the same 16:9-ish thumbnail on top. They sit stacked on the same page, which makes the page feel repetitive — same visual rhythm twice.

A few options, ranked by my recommendation:

### Option A (recommended): Make Continue Learning a horizontal compact list
Drop the thumbnail entirely. Replace the card grid with a horizontal row of slim "resume" tiles:

```text
┌──────────────────────────────────────────────┐
│ ▶  Winning the Listing Appointment           │
│    Episode 2 · 4 min left                    │
│    ████████░░░░░░░░░░  60%                   │
└──────────────────────────────────────────────┘
```

- No image — relies on title, episode position, time remaining, progress bar
- A small play icon on the left signals "resume"
- 1–2 columns on desktop, full-width stack on mobile
- Visually distinct from Browse Topics (which keeps thumbnails)
- Faster scan: user knows what they were doing, not what the topic looks like

This is closer to how Spotify, YouTube, and Audible show "Continue" rows — text-led, action-led.

### Option B: Keep image but make it a tiny square thumbnail
Card becomes horizontal: 64×64 thumbnail on the left, title + progress on the right. Still some visual variety vs Browse Topics, image still there for recognition.

### Option C: Leave as-is, change Browse Topics instead
Make Browse Topics the dense/no-image grid and keep Continue Learning visual. I don't recommend this — Browse is where users discover, so images matter more there.

### My recommendation
**Go with Option A.** Continue Learning is about resuming a known thing, not discovering a new one. The thumbnail adds noise without info. Pairing a text-led Continue row with an image-led Browse grid creates a clear visual hierarchy and makes the page feel less repetitive.

### Files to change
- `src/components/coaching/ContinueCard.tsx` — remove image block, restructure to horizontal layout with play icon, episode info, time-remaining text, progress bar
- `src/pages/Coaching.tsx` — update grid to `grid-cols-1 md:grid-cols-2` (wider tiles since they're shorter), pass episode + time-remaining data to the card
- May need to extend the `coaching-progress` query to also return current episode title and remaining seconds (already have `last_position_seconds` and episode duration in the existing query — just need to surface them)

No DB changes. No new dependencies.
