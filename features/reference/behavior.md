# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `feature/4-user-profile-management`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

---

## Todo ownership & scoping

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| All todo endpoints require **`authenticate`** | `list.routes.js`, `todo.routes.js` | Feature 3 FR-001 |
| Todo belongs to one list and one user for its lifetime | `listId` + `userId` FKs | Feature 3 FR-002 |
| Reads/updates/deletes scoped by **`userId: req.user.id`** | `todo.controller.js`; `getAccessibleTodoOrNull` | Feature 3 FR-003 |
| Parent list must be owned before create/read todos | `getAccessibleListOrNull` in todo controller | Feature 3 FR-004 |
| Create sets **`userId` and `listId` from server context only** | `todo.controller.js` ignores spoofed body fields | Feature 3 FR-005 |
| Cross-user list/todo access returns **`404`** | authorization helpers | Feature 3 US-3.5 |
| New todos default to **`completed: false`** | `todo.controller.js` create | Feature 3 FR-007 |
| Deleting a list **cascades** todos | `List hasMany Todo` with `onDelete: CASCADE` | Feature 3 FR-008 |
| Todos ordered **incomplete first**, then `createdAt` ASC | `todo.controller.js` `findAllByList` | Feature 3 FR-009 |

## Todo validation

| Rule | Client | Server |
|------|--------|--------|
| Title required (non-whitespace) | `Dashboard.vue` todo dialogs | `400` — `Todo title is required.` |
| Title max 255 characters | — | `400` — `Todo title must be 255 characters or fewer.` |
| Titles trimmed before save | `Dashboard.vue` trims on submit | `todo.controller.js` trims |

## UI (dashboard — list items)

| UI rule | Detail |
|---------|--------|
| Items icon | Each list row has **Items** icon (`aria-label`: **View items for &lt;name&gt;**) |
| List-items dialog | Title **&lt;list name&gt; — Items**; **+ Add Item** (`oc-cta`); **Close** button |
| Add/edit/delete todos | Nested dialogs; checkbox toggles `completed` |
| Completed styling | Struck-through / muted title when `completed: true` |
| Empty state | **"No todos in this list yet."** inside items dialog |
| Add item scope | **+ Add Item** only visible inside open items dialog — not on main lists view |

Due dates are deferred to Feature 5.

## Profile ownership & scoping

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Profile endpoints require **`authenticate`** | `user.routes.js` | Feature 4 FR-001 |
| User may read/update **only their own** profile (`id === req.user.id`) | `getAccessibleUserOrNull` | Feature 4 FR-002 |
| Cross-user profile access returns **`404`** | `user.controller.js` | Feature 4 FR-003 |
| Password hash **never returned** | User model `defaultScope`; profile response builder | Feature 4 FR-007 |
| After profile update, refresh **`localStorage` user** + dispatch **`user-logged-in`** | `MenuBar.vue` + `persistUserSession` | Feature 4 FR-008 |

## Profile validation

| Rule | Client | Server |
|------|--------|--------|
| Required name/email/username fields | `MenuBar.vue` edit dialog | `400` with field-specific messages |
| Email format | shared `emailRules` | `400` — `Enter a valid email address.` |
| Optional password min 8 chars | edit dialog rules | `400` — `Password must be at least 8 characters.` |
| Password confirm match | edit dialog rules | client only |
| Username lowercase on save | — | `user.controller.js` normalizes |
| Duplicate username/email | — | `400` — taken / registered messages |

## UI (MenuBar — profile)

| UI rule | Detail |
|---------|--------|
| User icon | `mdi-account-circle` opens profile `<v-menu>` |
| Profile dropdown | Shows full name, username, email; **Edit Profile** (`oc-cta`); **Log out** |
| Sign out removed | No standalone **Sign out** button on app bar (Feature 4 US-4.4) |
| Edit Profile dialog | Pre-filled fields; optional password + confirm; **Save** / **Cancel** |
