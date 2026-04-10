

# Plan: Phased Listing Forms with Marketing Details

## What We're Building
Two-phase data entry for listings — a lean **Contract Form** to create the listing, and a **Marketing Form** to enrich it with property details later. Both write to the same `listings` row.

## Database Migration
Add property detail columns to the `listings` table:
- `bedrooms` (integer, nullable)
- `bathrooms` (numeric, nullable — allows 1.5, 2.5)
- `sqft` (integer, nullable)
- `lot_size` (text, nullable — e.g. "0.25 acres")
- `year_built` (integer, nullable)
- `description` (text, nullable)
- `features` (text[], nullable — array of feature tags)
- `property_type` (text, nullable — e.g. Single Family, Condo, Townhouse)
- `garage_spaces` (integer, nullable)

No new RLS policies needed — existing policies already cover updates.

## New Components

### 1. `src/components/forms/NewListingForm.tsx` — Contract Form
- Fields: address, city, state, zip, seller name, listing type (buyer/seller), price, listing date
- Uses `react-hook-form` + `zod` validation
- On submit: inserts into `listings`, navigates to the new listing detail page
- Triggered from the "New" button on the Listings page via a Dialog

### 2. `src/components/forms/MarketingDetailsForm.tsx` — Marketing Form
- Fields: property type, bedrooms, bathrooms, sqft, lot size, year built, garage spaces, description, features
- Pre-fills any existing data from the listing row
- On submit: updates the same `listings` row
- Accessible from the Listing Detail page (e.g. a "Marketing Details" tab or section)

### 3. Wire into existing pages
- **Listings page**: "New" button opens the Contract Form dialog
- **Listing Detail page**: Add a "Property Details" tab/section with the Marketing Form, showing completion status (e.g. "5 of 9 fields complete")

## Technical Details
- Both forms use `react-hook-form` with `zod` schemas
- Contract Form does `supabase.from('listings').insert(...)` 
- Marketing Form does `supabase.from('listings').update(...).eq('id', listingId)`
- Forms are independent components (~100-120 lines each), easy to modify later
- Adding/removing fields = update zod schema + add/remove `<FormField>` + migration if new column

