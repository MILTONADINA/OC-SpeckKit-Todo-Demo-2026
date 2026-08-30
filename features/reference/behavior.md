# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `feature/1-user-auth`.

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
| Sign out calls API, clears `localStorage`, routes to login | `Home.vue` + `authServices.logoutUser` | Feature 1 US-1.4 |

## Data scoping (foundation)

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| `GET /todo/lists` returns only rows where `userId = req.user.id` | `list.controller.js` | Feature 1 US-1.3 / Feature 2 FR-003 |
| No API returns another user's profile or session | Auth controllers scope by token | Feature 1 Data Ownership |

## UI (Feature 1)

| Screen | Route name | Notes |
|--------|------------|-------|
| Login | `login` | Full-screen; no `MenuBar`; **Sign in** CTA with loading state |
| Register | `register` | Full-screen; no `MenuBar`; shared `emailRules` |
| Home placeholder | `home` | Welcome with first name; standalone **Sign out** button |

`MenuBar` is **not** present in Feature 1 (added in Feature 2).
