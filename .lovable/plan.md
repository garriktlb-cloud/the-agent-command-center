
User answered all 3 questions:
1. Files in Lovable Cloud storage
2. "Request support" creates a task
3. Search filters topics on Browse

Also need to address pre-existing build errors in seed files (enum type mismatches) so the build is green.

## Coaching Section

### Pages
- **`/coaching` — Index**
  - Header: "Coaching with The List Bar"
  - "Continue learning" row: 4 compact cards with thumbnail, title, thin progress bar (based on `coaching_progress`)
  - "Browse topics" section with a search input — live client-side filter on title/description
  - Grid of topic cards (thumbnail, title, description, "Explore" button)

- **`/coaching/:topicId` — Topic detail**
  - Back link + topic title
  - Dark media player card (current episode title, duration, progress, play)
  - Listen / Watch toggle pills — switches player + episode list filter
  - Two columns:
    - Left: "Key Takeaway" + one-sentence summary + **"Request support from List Bar"** button (creates a task with `title: "Coaching: <topic>"`, `description: <key takeaway>`, `task_type: todo`)
    - Right: numbered episode list (title, duration, Listen/Watch action)

### Database (migration)
- `coaching_topics` — id, title, description, thumbnail_path (storage path), sort_order, created_at
- `coaching_episodes` — id, topic_id, title, duration_seconds, media_type ('audio'|'video'), media_path, episode_number, key_takeaway
- `coaching_progress` — id, user_id, episode_id, completed bool, last_position_seconds, updated_at (UNIQUE on user_id+episode_id)
- RLS: topics + episodes readable by any authenticated user; progress is per-user CRUD on `auth.uid() = user_id`

### Storage
- Public bucket `coaching-media` for thumbnails, audio (.mp3), video (.mp4)
- Public read policy so signed URLs aren't needed for playback

### Files
- New: `src/pages/Coaching.tsx`, `src/pages/CoachingTopic.tsx`
- New: `src/components/coaching/TopicCard.tsx`, `ContinueCard.tsx`, `EpisodeRow.tsx`, `MediaPlayerCard.tsx`
- Edit: `src/App.tsx` — replace placeholder route, add `/coaching/:topicId`
- Migration: 3 tables + RLS + `coaching-media` storage bucket + RLS

### Pre-existing build errors (fix in same change)
TS errors in `src/pages/Contacts.tsx`, `src/pages/Seed.tsx`, `src/seed.tsx`, `src/pages/Tasks.tsx` — string literals don't satisfy DB enums (`listing_type`, `stage`, `priority`, `task_type`, `app_role`). Fix by typing the seed arrays with `Database["public"]["Tables"][...]["Insert"]` or narrowing literals with `as const`. Pure TS fix, no runtime change.

### Out of scope
- No coaching content seeding (you'll upload topics/episodes via the backend later, or I can add a small seed step on request)
- No video transcription, comments, or quizzes
