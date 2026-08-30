# Behavior & Rules Reference

**Living snapshot** of product rules on integrated `dev` after Features 1-5.

These files answer: *"What rules does the app enforce right now?"*
They do **not** authorize new scope; implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes and payloads |
| [data-model.md](./data-model.md) | Tables, columns, and associations |
| **This file** | Ownership, sorting, validation, and UI rules |

---

## Authentication

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Login uses **username + password** | `POST /todo/login`; `Login.vue` | Feature 1 FR-001 |
| Registration collects first name, last name, email, username, and password | `POST /todo/register`; `Register.vue` | Feature 1 FR-002 |
| Usernames are trimmed and stored lowercase | `auth.controller.js` | Feature 1 |
| Passwords are bcrypt hashes using `SALT_ROUNDS = 10` and are never returned | `auth.controller.js`; User default scope | Features 1 and 4 |
| Sessions use a JWT stored in the `sessions` table | auth controller and Session model | Feature 1 FR-004 |
| Clients authenticate with `Authorization: Bearer <token>` | API service interceptor; `authenticate` | Feature 1 FR-004 |
| Session lifetime is 24 hours | JWT `expiresIn: 86400`; `expirationDate` | Feature 1 FR-005 |
| Login reuses the newest non-expired session for that user | `findOrCreateSession` | Feature 1 FR-006 |
| New users receive role `worker` | User model and register controller | Feature 1 FR-007 |
| A valid session resolves one user as `req.user.id` | `authenticate` | Feature 1 FR-008 |

## Registration Validation

| Rule | Client | Server |
|------|--------|--------|
| First name required | Registration rules | `400` - `First name is required.` |
| Last name required | Registration rules | `400` - `Last name is required.` |
| Email required and valid | Shared `emailRules` | `400` - required or invalid-email message |
| Username required | Registration rules | `400` - `Username is required.` |
| Password minimum 8 characters | Registration rules | `400` - `Password must be at least 8 characters.` |
| Password confirmation must match | Registration rules | Client only |
| Username must be unique | - | `400` - `Username is already taken.` |
| Email must be unique | - | `400` - `Email is already registered.` |

## Session and Routing

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Session payload is stored under localStorage key `user` | `persistUserSession` | Feature 1 US-1.1 |
| Protected dashboard without a session redirects to login | router `requiresAuth` guard | Features 1-2 |
| Signed-in user visiting login or register redirects home | router `guestOnly` guard | Feature 1 US-1.3 |
| API `401` clears local session and redirects to login | API response interceptor | Feature 1 US-1.3 |
| Logout invalidates the server session, clears localStorage, and routes to login | `MenuBar.vue`; auth service | Features 1 and 4 |

## List Ownership and Scoping

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Every list endpoint requires `authenticate` | `list.routes.js` | Feature 2 FR-001 |
| A list belongs to one user for its lifetime | `userId` foreign key; ownership is never updated | Feature 2 FR-002 |
| List reads, updates, and deletes are scoped to `req.user.id` | list controller; `getAccessibleListOrNull` | Feature 2 FR-003 |
| Create derives `userId` from `req.user.id` and ignores body ownership | list controller | Feature 2 FR-004 |
| Cross-user list access returns `404`, never `403` | authorization helper and controller | Feature 2 US-2.5 |
| List API results are ordered alphabetically by name | `order: [["name", "ASC"]]` | Feature 2 FR-006 |
| Deleting a list deletes its todos | list-todo association with `onDelete: CASCADE` | Feature 3 FR-008 |

## List Validation

| Rule | Client | Server |
|------|--------|--------|
| Name required and non-whitespace | Dashboard dialog rules | `400` - `List name is required.` |
| Name maximum 100 characters | - | `400` - `List name must be 100 characters or fewer.` |
| Names are trimmed before save | Dashboard submit handler | list controller |

## Dashboard List UI

| UI rule | Detail | Provenance |
|---------|--------|------------|
| Single-view dashboard | Route `home`; heading **My Lists**; no sidebar/main split | Feature 2 |
| Add list | **+ New List** opens a dialog; **Create** and **Cancel** actions | Feature 2 |
| Existing lists | One row per list with **Edit list** and **Delete list** icon actions | Feature 2 |
| Empty state | **No lists yet. Create your first list.** | Feature 2 |
| Loading and errors | Progress indicator while loading; error alert for API failures | Feature 2 |
| Primary actions | `oc-cta` styling on **+ New List** and **Create** | Feature 2 |

## Todo Ownership and Scoping

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Every todo endpoint requires `authenticate` | list and todo routes | Feature 3 FR-001 |
| A todo belongs to exactly one list and one user for its lifetime | `listId` and `userId` foreign keys | Feature 3 FR-002 |
| Todo reads, updates, and deletes are scoped to `req.user.id` | todo controller; `getAccessibleTodoOrNull` | Feature 3 FR-003 |
| Parent list ownership is required before creating or reading todos | `getAccessibleListOrNull` | Feature 3 FR-004 |
| Create derives `listId` and `userId` from server context | todo controller ignores spoofed ownership fields | Feature 3 FR-005 |
| Cross-user list or todo access returns `404` | authorization helpers and todo controller | Feature 3 US-3.5 |
| New todos default to `completed: false` | todo controller and Todo model | Feature 3 FR-007 |
| Todos are ordered incomplete first, then `createdAt` ascending | todo controller | Feature 3 FR-009; unchanged by Feature 5 |

## Todo Validation and Dates

| Rule | Client | Server | Provenance |
|------|--------|--------|------------|
| Title required and non-whitespace | Todo dialog rules | `400` - `Todo title is required.` | Feature 3 |
| Title maximum 255 characters | - | `400` - max-length message | Feature 3 |
| Titles are trimmed before save | Dashboard submit handler | todo controller | Feature 3 |
| Due date is optional and calendar-only | Optional `type="date"` fields | `YYYY-MM-DD` stored as `DATEONLY` | Feature 5 |
| Invalid due date is rejected | Browser date input | `400` - valid-date message | Feature 5 |
| `dueDate: null` clears the date | Clear field and save | todo controller | Feature 5 |
| Omitted `dueDate` preserves the current date on update | - | todo controller | Feature 5 |

## Dashboard Todo UI

| UI rule | Detail | Provenance |
|---------|--------|------------|
| Items action | Every list row has **View items for <name>** icon action | Feature 3 |
| List-items dialog | Title **<list name> — Items**, **+ Add Item**, and **Close** | Feature 3 |
| Add/edit/delete | Nested dialogs; checkbox toggles `completed` | Feature 3 |
| Empty state | **No todos in this list yet.** | Feature 3 |
| Add-item scope | **+ Add Item** appears only inside the open list-items dialog | Feature 3 |
| Completed style | Completed title is struck through and muted | Feature 3 |
| Due-date entry | Optional date field in add-item and edit-item dialogs | Feature 5 |
| Due-date display | A formatted **Due <date>** label appears when set | Feature 5 |
| Overdue style | Incomplete todo with a date before today in the browser's local calendar uses error color | Feature 5 |
| Completed overdue rule | Completed todos are never styled overdue | Feature 5 |

## Profile Ownership and Scoping

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Profile endpoints require `authenticate` | `user.routes.js` | Feature 4 FR-001 |
| A user may read or update only their own profile | `getAccessibleUserOrNull` compares ID to `req.user.id` | Feature 4 FR-002 |
| Cross-user profile access returns `404`, never `403` | user controller | Feature 4 FR-003 |
| Password update is optional and is bcrypt-hashed when supplied | user controller | Feature 4 FR-005 |
| Password hash is never returned | User default scope and profile response builder | Feature 4 FR-007 |
| Successful update refreshes localStorage and dispatches `user-logged-in` | `MenuBar.vue`; `persistUserSession` | Feature 4 FR-008 |

## Profile Validation

| Rule | Client | Server |
|------|--------|--------|
| First name, last name, email, and username required | Edit Profile dialog | Field-specific `400` message |
| Email format | Shared `emailRules` | `400` - `Enter a valid email address.` |
| Optional password minimum 8 characters | Edit Profile dialog | `400` - minimum-length message |
| Password confirmation must match | Edit Profile dialog | Client only |
| Username normalized to lowercase | - | user controller |
| Username and email must remain unique | - | Field-specific `400` message |

## App Chrome and Profile UI

| UI rule | Detail | Provenance |
|---------|--------|------------|
| Guest screens | Login and register are full-screen and hide `MenuBar` | Features 1-2 |
| User menu | Account-circle icon opens a profile dropdown | Feature 4 |
| Profile details | Dropdown shows full name, username, and email | Feature 4 |
| Edit Profile | Pre-filled dialog with optional password and **Save** / **Cancel** | Feature 4 |
| Logout | Dropdown provides **Log out** | Feature 4 |
| Removed control | No standalone **Sign out** button appears in the app bar | Feature 4 US-4.4 |
