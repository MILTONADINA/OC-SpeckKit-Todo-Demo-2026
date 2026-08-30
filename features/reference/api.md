# API Reference

**Status:** reflects Feature 4 (user profile management) on `feature/4-user-profile-management`.

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

### Users (session required)

| Method | Path | Status | Purpose |
|--------|------|--------|---------|
| `GET` | `/todo/users/:id` | `200` | Fetch authenticated user's own profile |
| `PUT` | `/todo/users/:id` | `200` | Update authenticated user's own profile |

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

## Update profile request body

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` is optional. Omit it to leave the current password unchanged.

## Profile success response (`GET` / `PUT`)

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-08-29T12:00:00.000Z",
  "updatedAt": "2026-08-29T12:05:00.000Z"
}
```

## Conventions

* Flat JSON responses (no `{ success, data }` envelope).
* Errors: `{ "message": "Human-readable explanation." }` with appropriate HTTP status.
* Authenticated routes: `Authorization: Bearer <token>`.
* Cross-user list, todo, or profile access returns `404` (not `403`).

## Common error messages

| Situation | Status | Message |
|-----------|--------|---------|
| Empty todo title | `400` | `Todo title is required.` |
| Todo title too long | `400` | `Todo title must be 255 characters or fewer.` |
| List not found / not owned | `404` | `List with id=<id> not found.` |
| Todo not found / not owned | `404` | `Todo with id=<id> not found.` |
| User not found / not self | `404` | `User with id=<id> not found.` |
| Duplicate username on profile update | `400` | `Username is already taken.` |
| Duplicate email on profile update | `400` | `Email is already registered.` |
| Missing/expired token | `401` | `Unauthorized! …` |

See prior features for auth and list error messages.
