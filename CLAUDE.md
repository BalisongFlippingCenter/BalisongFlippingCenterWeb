# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5157
npm run build      # Type-check with tsc, then Vite production build
npm run lint       # ESLint with zero warnings allowed
npm run preview    # Preview the production build locally
```

There are no tests in this project.

### Docker / Production

```bash
docker build -t balisong-hub .     # Multi-stage build: Node 20 Alpine → Nginx
docker run -p 80:80 balisong-hub   # Serves built assets via Nginx on port 80
```

## Architecture

### Tech Stack

React 18 + TypeScript + Vite, Tailwind CSS (custom config — see below), Redux Toolkit, React Router v6, Axios, Motion (`motion/react`), FontAwesome, `@react-oauth/google`, `react-headroom`, AWS Amplify Gen 2.

### Backend

The app communicates with a **custom REST API** running on AWS EC2 at `http://ec2-3-217-173-234.compute-1.amazonaws.com:8080`. The Amplify backend (`/amplify`) is a mostly-boilerplate setup (Cognito auth + a placeholder DynamoDB `Todo` model) and is **not** used for the main app functionality.

### Authentication Flow

Two Axios instances are defined in `src/api/axios.ts`:
- `axiosApiInstance` — unauthenticated requests (login, register, public data)
- `axiosApiInstanceAuth` — authenticated requests; a request interceptor attaches the `Bearer` access token from Redux state, and a response interceptor automatically retries on `403` by calling `/auth/refresh-access-token` to get a new access token

> **Circular dependency fix:** `axios.ts` does not import `store` directly (that created a cycle: axios → store → authSlice → authActions → axios). Instead, the store is injected via `setStore(store)` called in `main.tsx` immediately after the store is created. Do not re-introduce a direct `store` import in `axios.ts`.

On app mount (`App.tsx`), the app attempts to restore a session by calling `/auth/refresh-token-login`. The refresh token is stored in an HTTP-only cookie; the access token lives only in Redux state (never persisted to localStorage).

Google OAuth is wired up at the root via `<GoogleOAuthProvider>` in `src/main.tsx` (client ID is public/non-secret). The login page uses `@react-oauth/google` components to handle the OAuth flow.

"Remember me" stores only a flag and email in `localStorage` — not the token itself.

### Redux State

Two slices in `src/redux/`:
- **`auth`** — `user: Profile | null`, `accessToken: string | null`, `rememberLoginCredentials`, loading/error state. Actions: `setCredentials`, `setNewAccessToken`, `setNewUser`, error/remember helpers.
- **`collection`** — `collection: Collection | null`, `collectionKnives: CollectionKnife[]`. Set on login alongside credentials.

Use `useAppSelector` / `useAppDispatch` from `src/redux/hooks.ts` (typed wrappers). The files in `src/hooks/` (`useAuth.tsx`, `useCollection.tsx`) are fully commented out — they were a prior context-based approach now replaced by Redux.

### Routing

All routes render inside `MainLayout` (auto-hiding header via `react-headroom` + `<Outlet>`). Three protection layers:
- **Public** — no guard
- **`ProtectedRoutes`** — redirects *authenticated* users away (login, register)
- **`AuthProtectedRoutes`** — role-based; accepts `allowedRoles: string[]` (currently `"USER"` or `"ADMIN"`); redirects unauthenticated users to `/login`, unauthorized roles to `/unauthorized`

User profile pages use dynamic routes: `/:account/:identifier` for profile, `/:account/:identifier/collection` for collection, `/:account/:identifier/collection/:knife` for a specific knife.

### Data Models (`src/modals/`)

Note the directory is named `modals` (not `models`) — this is intentional in this codebase.

- **`Profile`** — authenticated user; includes role, social links, display name, `identifierCode` (used in profile URLs alongside `displayName`)
- **`Collection`** — belongs to a user, holds an array of `CollectionKnife`
- **`CollectionKnife`** / **`CollectionKnifeDTO`** — detailed knife entry with specs (blade, handle, pivot, scores). `DTO` variant uses `File` for `coverPhoto`; the entity variant uses `string` (URL).
- **`Post`** / **`CollectionTimelinePostModal`** / **`PostCover`** / **`PostPreview`** / **`CreationPostDTO`** — post-related models for community feed and collection timeline events.

### Images

The backend stores images in **AWS S3** and returns full URLs (e.g. `https://bucket.s3.amazonaws.com/...`). The `Image` component (`src/components/Image.tsx`) detects this — if `imageId` starts with `http://` or `https://`, it renders a plain `<img src>` directly. Otherwise it falls back to the old `/file/${imageId}` arraybuffer fetch path (legacy). `ProfileImageDisplay` (`src/components/ProfileImageDisplay.tsx`) reads `user.profileImg` from Redux and renders the S3 URL directly.

### Component Conventions

**`EditAndDisplay` pattern** — components in `src/components/collectionKnifePageComponents/` (e.g. `BladeFinishEditAndDisplay.tsx`) each manage a single knife field. They render as read-only display by default and switch to an edit input on toggle. The owner's view gets `UsersCollectionKnifeDisplay`; others get `CollectionKnifeDisplay`.

**Multi-step knife form** — `AddNewKnifeToCollectionPage` orchestrates a 3-step flow: (1) `NewCollectionKnifeForm` (required fields + optional specs/rankings), (2) `GalleryInput` for photo uploads, (3) `NewCollectionKnifeSubmit` for API submission. State is lifted to the page component and passed down via props; `CollectionKnifeDTO` is the transfer object between steps.

**Input components** — `src/components/input/` contains individual controlled input components for each knife field. Each takes a `parent<FieldName>` prop (current value) and a `set<FieldName>OnChange` callback, following a consistent controlled-component pattern.

**`comboBoxData/`** — `src/comboBoxData/` contains static string arrays (e.g. `BladeFinish.ts`, `PivotSystem.ts`) that drive the dropdown options in input and `EditAndDisplay` components.

### Tailwind Custom Configuration

The project overrides Tailwind's default color palette entirely — standard colors like `text-gray-500` will not work. Use only the defined custom colors:

| Token | Value |
|---|---|
| `dark-primary` | `#001314` |
| `blue-primary` | `#108198` |
| `shadow-green` | `#001a1a` |
| `shadow-green-offset` | `#003333` |
| `white` / `black` | standard |
| `light-blue` | `#99c2ff` |
| `blue` | `#0066ff` |
| `red` | `#b91c1c` |
| `green` | `#22c55e` |
| `gold` | `#e6b800` |
| `shadow` | `#808080` |
| `instagram-pink` | `#e1306c` |
| `shadow-red` | `#1a0000` |
| `shadow-red-offset` | `#330000` |

Breakpoints are also custom: `xsm` (100px), `sm` (550px), `md` (950px), `lg` (1310px). The `md` breakpoint (950px) is the main mobile/desktop threshold used throughout the header and components.

### Project Description
This is the front end repo for the project. The project directly communicates with the backend to complete the overall application. This is meant to be a website for balisong flipping enthusiest. The project is meant to consits with 3 main parts: 
1- A social media platform where users create accounts, have their own unique display names, accounts, knife collections and more where they can create posts and interact with others posts. Down the road users will be able to follow specific users to primarily see their posts. Most all other social media features will apply on posts such as likes, flags, saves, bookmarking, and commenting. This application is not inteded to feature a direct messaging platform to other users outside of posting comments on posts. 
2- An informational area to display info on specific knives and companies/makers. This is important for new enthusiest to be able to see active balisong makers, their knives and all the info associated.
3- There will be a third section of the application known as the Tutorial Center where users will be able to view peoples posts on cool combos or tricks, or directly search tutorials on specific tricks.

This project is one little bit at a time. Claude needs to remember to plan with me first before doing any coding. Any questions must be asked and already existing code needs to stay relatively the same.

Also claude needs to remember that alot of the functionality will need to be implemented on the backend. The frontend will only be used as a GUI for everything.

## Known Backend Issues

- **Login/refresh response missing profile fields** — `/auth/login` and `/auth/refresh-token-login` do not return all `Profile` fields (`profileCaption`, `profileImg`, social links, etc.) in the account object. This causes saved values to appear empty after logout/login. Needs to be fixed on the backend so the full account is returned on every auth response.
- **Post response missing embedded knife reference** — `/posts/any` (and likely `/posts/:id`) returns only `referenceKnifeId` (an integer) inside the post object instead of a full embedded knife object. The frontend needs `displayName`, `knifeMaker`, `baseKnifeModel`, and `coverPhoto` to render the referenced knife card on the feed and post page. The backend needs to join and embed the full `CollectionKnife` data in every post response, the same way it already embeds the `author` object. Until fixed, referenced knives will not display on any post. The frontend mapping in `Post.ts` (`mapPostDetail`) already handles the embedded object shape via `normalizeKnifeRef` — no frontend change needed once the backend sends the data.

## Product World & Tutorial Center — Design Notes

### `/learn` page entry point
When building out the **Product World** and **Tutorial Center** pages, include a small, unobtrusive link or card pointing logged-in users to the `/learn` page. These two areas are the primary support zones for new hobbyists, making them the natural discovery point for the learn page rather than cluttering the header nav or bottom nav. Something subtle — e.g. a "New to balisongs? Start here →" callout card near the top of each page — is the intended pattern.

### Video upload strategy
Native video uploads are capped at **90 seconds / ~150–200MB per file** — enough for trick clips, combo runs, and short show-off content. For longer tutorial content (full breakdowns, YouTube-length tutorials), the platform supports **YouTube URL embeds** rather than direct uploads. This keeps storage and infrastructure costs manageable while still surfacing long-form tutorial content in the community.

- **Short native clips** (trick combos, show-offs, buy/sell footage) → direct upload, enforced duration/size cap
- **Long tutorials** → YouTube embed via URL, video lives on YouTube's infrastructure
- The Tutorial Center post type should support a `youtubeUrl` field on the backend alongside the existing `mediaFiles` field. The frontend should render an embedded YouTube player when this field is present.
- This approach benefits creators too — their tutorials drive YouTube engagement while also reaching the balisong community on this platform.

## Future Implementation

- **Registration verify redirect** — `UserRegistrationForm.tsx` line 94 hardcodes `navigate("/register/verify/tzenisekj@gmail.com")` after successful registration. This needs to be updated to use the `email` state variable: `navigate(\`/register/verify/${email.trim()}\`)` once the email verification flow is built out.
- **Google sign-up flow** — `GoogleLoginComponent.tsx` currently only logs the OAuth token response. Needs to be wired up to the backend to register/login the user and then prompt for a display name on first Google sign-in.

### Settings Page TODOs

- **Notifications settings** — Add a Notifications section to `ProfileConfigurePage.tsx` with toggles for email/push preferences (e.g. likes, comments, new followers). Depends on the notifications system being built on the backend first.
- **Privacy settings** — Add a Privacy section with controls for profile visibility (Public / Followers Only) and who can comment on posts. Ties into the follow system and should be implemented once following is built out.
- **Connected Accounts** — Add a Connected Accounts section showing whether Google OAuth is linked, with the ability to link/unlink. Relevant since Google login already exists via `GoogleLoginComponent.tsx`.
- **Terms of Service page** — `/terms` route currently leads to 404. A static `TermsOfServicePage.tsx` needs to be created and added to the router in `App.tsx`.
- **Privacy Policy page** — `/privacy` route currently leads to 404. A static `PrivacyPolicyPage.tsx` needs to be created and added to the router in `App.tsx`.

## Legal TODOs (Pre-Launch)

### Priority 1 — Terms of Service & Disclaimers
- **Draft Terms of Service** — must include: user responsibility for local law compliance (balisongs are illegal/restricted in some U.S. states and countries), assumption of risk clause for trick/tutorial content, minimum age requirement (recommend 18+), and a clear statement that all transactions are off-platform and the site is not a party to any sale or exchange.
- **Buy/Sell post disclaimer** — add a visible notice on Buy/Sell posts: *"All transactions occur off-platform. Balisong Flipping Center is not a party to any sale and assumes no responsibility for off-platform exchanges."*
- **Tutorial/Combo post disclaimer** — add a visible notice on Tutorial/Trick Tutorial/Combo posts: *"Attempting these tricks involves risk of serious injury. Always use safety gear and train responsibly."*

### Priority 2 — Report / Flag System
- **"Report this post" button** on all user-generated content (posts, comments). Backend review queue required.
- **Flagged content policy** — remove posts flagged as illegal sales in restricted jurisdictions. Document the policy publicly.
- A working report system demonstrates good-faith moderation and strengthens Section 230 coverage.
- *The Discord bot flag system is partially in place — this needs a full backend review queue to be complete.*

### Priority 3 — Attorney Review (~$500–$1,500 one-time)
- Hire a business or internet law attorney to draft/review the ToS. Bundle a Privacy Policy review at the same time.
- Services like Clerky or a local business attorney are cost-effective options.
- Only needs to happen once unless the platform changes significantly.

### Priority 4 — Privacy Policy (Legally Required)
- Required by law since the platform collects user data (email at minimum).
- Must address: **COPPA** (U.S. users under 13), **GDPR** (any EU users), **CCPA** (any California users).
- Bundle with attorney ToS review to keep costs down.
- Once drafted, the `/privacy` page needs to be built and linked in the footer and registration flow.

### Notes
- Platform model (neutral connector, no payment processing) is legally similar to Reddit/Instagram and well protected under Section 230.
- No payment processing = no PCI compliance, fraud liability, or money transmission laws to worry about.
- Good ToS + a working report system are the two most important protections before going public.