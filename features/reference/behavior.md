# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `feature/3-todo-list-item-management`.

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
