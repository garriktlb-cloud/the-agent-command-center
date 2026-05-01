## Add "Make default" toggle inside the template editor

Right now the only place to mark a personal template as default is the templates list page. Adding the same toggle to the editor header so agents don't have to back out.

### Change

In `src/pages/ChecklistTemplates.tsx`, when an agent is viewing one of their own templates, add a button to the right of the template name:

- If not default → outline button: **★ Make default**
- If already default → filled primary button (disabled): **★ Default for new listings**

Reuses the existing `setDefault` mutation, so behavior stays identical to the list page (clears any previously-starred template, sets this one).

Platform templates (read-only) don't get this button.

### Files changed

- `src/pages/ChecklistTemplates.tsx` — header of the editor view only (8-line change).
