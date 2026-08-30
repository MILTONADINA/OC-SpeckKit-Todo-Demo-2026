# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `feature/2-todo-list-management`.

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

---

## Authentication

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Login uses **username + password** (not email-only) | `POST /todo/login` body; `Login.vue` fields | Feature 1 FR-001 |
| Usernames stored **lowercase** | `auth.controller.js` normalizes on register/login | Feature 1 + security.mdc |
| Passwords hashed with **bcrypt** (`SALT_ROUNDS = 10`) | `auth.controller.js`; never returned in API | Feature 1 FR-003 |
| Sessions use **JWT + Session table**; client sends `Authorization: Bearer <token>` | `session` model; `authenticate` middleware; `services.js` interceptor | Feature 1 FR-004 |
| Session lifetime **24 hours** | JWT `expiresIn: 86400`; `expirationDate` on session row | Feature 1 FR-005 |
| Login **reuses** non-expired session for same user | `findOrCreateSession` in `auth.controller.js` | Feature 1 FR-006 |
| Default role for new users is **`worker`** | `user.model.js` default; register controller | Feature 1 FR-007 |
| Authenticated requests resolve to **`req.user.id`** | `authenticate` middleware | Feature 1 FR-008 |

## Registration validation

| Rule | Client | Server |
|------|--------|--------|
| Email required | `emailRules` in `validation.js` | `400` — `Email is required.` |
| Email format | `emailRules` regex | `400` — `Enter a valid email address.` |
| Username required | `Register.vue` rules | `400` — `Username is required.` |
| Password min 8 chars | `Register.vue` rules | `400` — `Password must be at least 8 characters.` |
| Confirm password must match | `Register.vue` rules | — (client only) |
| Duplicate username | — | `400` — `Username is already taken.` |
| Duplicate email | — | `400` — `Email is already registered.` |

## Session & routing (frontend)

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Session stored in `localStorage` key **`user`** | `authServices.persistUserSession` | Feature 1 US-1.1 |
| Protected routes require session; unauthenticated → **login** | `router.beforeEach` `requiresAuth` | Feature 1 US-1.5 |
| Signed-in user visiting login/register → **home** | `router.beforeEach` `guestOnly` | Feature 1 US-1.3 |
| `401` clears `user` and redirects to login | `services.js` response interceptor | Feature 1 US-1.3 |
| Sign out calls API, clears `localStorage`, routes to login | `MenuBar.vue` + `authServices.logoutUser` | Feature 2 |

## List ownership & scoping

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| All list endpoints require **`authenticate`** | `list.routes.js` | Feature 2 FR-001 |
| List belongs to one user for its lifetime | `userId` FK; never updated after create | Feature 2 FR-002 |
| Reads/updates/deletes scoped by **`userId: req.user.id`** | `list.controller.js`; `getAccessibleListOrNull` | Feature 2 FR-003 |
| Create sets **`userId` from `req.user.id` only** | `list.controller.js` ignores body `userId` | Feature 2 FR-004 |
| Cross-user list access returns **`404`** (not `403`) | `getAccessibleListOrNull` + controller | Feature 2 US-2.5 |
| Lists ordered **alphabetically by name** in API responses | `order: [["name", "ASC"]]` | Feature 2 FR-006 |

## List validation

| Rule | Client | Server |
|------|--------|--------|
| Name required (non-whitespace) | `Dashboard.vue` rules | `400` — `List name is required.` |
| Name max 100 characters | — | `400` — `List name must be 100 characters or fewer.` |
| Names trimmed before save | `Dashboard.vue` trims on submit | `list.controller.js` trims |

## UI (dashboard)

| Screen | Route name | Notes |
|--------|------------|-------|
| Login | `login` | Full-screen; no `MenuBar` |
| Register | `register` | Full-screen; no `MenuBar` |
| Dashboard | `home` | **My Lists** heading; `+ New List` dialog; row edit/delete icons |
| App chrome | — | `MenuBar` shows user name + **Sign out**; hidden on login/register |

| UI rule | Detail |
|---------|--------|
| Empty state | **"No lists yet. Create your first list."** |
| Row actions | Edit/delete icon buttons with `aria-label` **Edit list** / **Delete list** |
| Primary CTAs | `oc-cta` on **+ New List** and dialog **Create** |
| Loading | Progress indicator while lists fetch |
| Errors | `<v-alert type="error">` for API failures |

Todo **items** UI is deferred to Feature 3.
