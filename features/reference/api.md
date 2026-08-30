# API Reference

**Status:** reflects Feature 3 (todo list item management) on `feature/3-todo-list-item-management`.

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
| `DELETE` | `/todo/lists/:listId` | `204` | Delete a list and cascade-delete its todos |

### Todos (session required)

| Method | Path | Status | Purpose |
|--------|------|--------|---------|
| `GET` | `/todo/lists/:listId/todos` | `200` | Fetch todos in an owned list |
| `POST` | `/todo/lists/:listId/todos` | `201` | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | `200` | Update todo title and/or `completed` |
| `DELETE` | `/todo/todos/:id` | `204` | Delete a todo owned by the caller |

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

## Create todo request body

```json
{
  "title": "Buy milk"
}
```

## Todo success response (`GET`, `POST`, `PUT`)

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-08-29T12:05:00.000Z",
  "updatedAt": "2026-08-29T12:05:00.000Z"
}
```

`GET /todo/lists/:listId/todos` returns an array ordered **incomplete first**, then by `createdAt` ascending.

## Conventions

* Flat JSON responses (no `{ success, data }` envelope).
* Errors: `{ "message": "Human-readable explanation." }` with appropriate HTTP status.
* Authenticated routes: `Authorization: Bearer <token>`.
* Cross-user list or todo access returns `404` (not `403`).

## Common error messages

| Situation | Status | Message |
|-----------|--------|---------|
| Empty todo title | `400` | `Todo title is required.` |
| Todo title too long | `400` | `Todo title must be 255 characters or fewer.` |
| List not found / not owned | `404` | `List with id=<id> not found.` |
| Todo not found / not owned | `404` | `Todo with id=<id> not found.` |
| Missing/expired token | `401` | `Unauthorized! …` |

See prior features for auth and list error messages.
