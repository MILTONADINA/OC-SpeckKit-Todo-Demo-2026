# API Reference

**Status:** reflects Feature 2 (todo list management) on `feature/2-todo-list-management`.

API mount path: `/todo` (see `backend/server.js`).

## Endpoints

### Auth (no session required)

| Method | Path | Status | Purpose |
|--------|------|--------|---------|
| `POST` | `/todo/register` | `201` | Create account; returns session payload |
| `POST` | `/todo/login` | `200` | Authenticate; returns session payload |

### Auth (session required)

| Method | Path | Status | Purpose |
|--------|------|--------|---------|
| `POST` | `/todo/logout` | `200` | Invalidate current session token |

### Lists (session required)

| Method | Path | Status | Purpose |
|--------|------|--------|---------|
| `GET` | `/todo/lists` | `200` | Fetch lists owned by authenticated user |
| `POST` | `/todo/lists` | `201` | Create a new list |
| `PUT` | `/todo/lists/:listId` | `200` | Rename a list owned by the caller |
| `DELETE` | `/todo/lists/:listId` | `204` | Delete a list owned by the caller |

### Health

| Method | Path | Status | Purpose |
|--------|------|--------|---------|
| `GET` | `/todo/health` | `200` | Service health check |

## Auth success payload

Flat JSON (no envelope):

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

## Register request body

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

## Login request body

```json
{
  "username": "jdoe",
  "password": "password123"
}
```

## Create list request body

```json
{
  "name": "Groceries"
}
```

## List success response (`GET /todo/lists`, `POST`, `PUT`)

Single list object (`201` / `200`):

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-08-29T12:00:00.000Z",
  "updatedAt": "2026-08-29T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of list objects, ordered alphabetically by `name`.

## Conventions

* Flat JSON responses (no `{ success, data }` envelope).
* Errors: `{ "message": "Human-readable explanation." }` with appropriate HTTP status.
* Authenticated routes: `Authorization: Bearer <token>`.
* Password hashes are never returned by the API.
* Cross-user list access returns `404` (not `403`).

## Common error messages

| Situation | Status | Message |
|-----------|--------|---------|
| Missing email on register | `400` | `Email is required.` |
| Invalid email format | `400` | `Enter a valid email address.` |
| Missing username | `400` | `Username is required.` |
| Password too short | `400` | `Password must be at least 8 characters.` |
| Duplicate username | `400` | `Username is already taken.` |
| Duplicate email | `400` | `Email is already registered.` |
| Invalid login | `401` | `Invalid username or password.` |
| Missing/expired token | `401` | `Unauthorized! …` |
| Empty list name | `400` | `List name is required.` |
| List name too long | `400` | `List name must be 100 characters or fewer.` |
| List not found / not owned | `404` | `List with id=<id> not found.` |
