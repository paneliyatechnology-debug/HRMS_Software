<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Permanent Project Development Constraints

Treat these requirements as permanent, project-level development rules:

1. **Inspect Data Flow & API First**:
   - Before implementing any new feature, inspect the existing data flow and backend API availability.

2. **No Fabricated / Mock Data**:
   - Never populate the application with fabricated business records, sample employee data, mock dashboard statistics, or artificial API responses.

3. **Proper Loading, Error & Empty States**:
   - If real backend data is unavailable, implement the UI using proper loading, error, and empty states. Clearly identify any missing backend dependency instead of creating fake data.

4. **Zero Client-Side Business Data Storage**:
   - Do not introduce new `localStorage`, `sessionStorage`, `IndexedDB`, or persistent client-side caching for business data.

5. **Universal Enforcement**:
   - Apply these rules to every future feature, module, component, and refactoring task in this project unless explicitly authorized by the user for a temporary testing implementation.
