# API Reference

**Status:** reflects the integrated product on `dev` after Features 1-5.

API mount path: `/todo` (see `backend/server.js`).

## Endpoints

### Auth (no session required)

| Method | Path | Success | Purpose | Introduced |
|--------|------|---------|---------|------------|
| `POST` | `/todo/register` | `201` | Create an account and return a session payload | Feature 1 |
| `POST` | `/todo/login` | `200` | Authenticate and return a session payload | Feature 1 |

### Auth (session required)

| Method | Path | Success | Purpose | Introduced |
|--------|------|---------|---------|------------|
| `POST` | `/todo/logout` | `200` | Invalidate the current session token | Feature 1 |

### Lists (session required)

| Method | Path | Success | Purpose | Introduced |
|--------|------|---------|---------|------------|
| `GET` | `/todo/lists` | `200` | Fetch lists owned by the authenticated user | Feature 2 |
| `POST` | `/todo/lists` | `201` | Create a list owned by the authenticated user | Feature 2 |
| `PUT` | `/todo/lists/:listId` | `200` | Rename a list owned by the authenticated user | Feature 2 |
| `DELETE` | `/todo/lists/:listId` | `204` | Delete an owned list and cascade-delete its todos | Features 2-3 |

### Todos (session required)

| Method | Path | Success | Purpose | Introduced |
|--------|------|---------|---------|------------|
| `GET` | `/todo/lists/:listId/todos` | `200` | Fetch todos in an owned list | Feature 3 |
| `POST` | `/todo/lists/:listId/todos` | `201` | Add a todo to an owned list | Feature 3; due date extended in Feature 5 |
| `PUT` | `/todo/todos/:id` | `200` | Update title, completion, and/or due date on an owned todo | Feature 3; due date extended in Feature 5 |
| `DELETE` | `/todo/todos/:id` | `204` | Delete an owned todo | Feature 3 |

### Users (session required)

| Method | Path | Success | Purpose | Introduced |
|--------|------|---------|---------|------------|
| `GET` | `/todo/users/:id` | `200` | Fetch the authenticated user's own profile | Feature 4 |
| `PUT` | `/todo/users/:id` | `200` | Update the authenticated user's own profile | Feature 4 |

### Health

| Method | Path | Success | Purpose |
|--------|------|---------|---------|
| `GET` | `/todo/health` | `200` | Return `{ "status": "ok" }` |

## Authentication

Authenticated routes require:

```http
Authorization: Bearer <token>
```

### Register request

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

### Login request

```json
{
  "username": "jdoe",
  "password": "password123"
}
```

### Register and login success response

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

### Logout success response

```json
{
  "message": "Logged out successfully."
}
```

## Lists

### Create or rename list request

```json
{
  "name": "Groceries"
}
```

The server trims `name`, limits it to 100 characters, and ignores a client-provided `userId` when creating a list.

### List success response

`POST` and `PUT` return one list object:

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-08-29T12:00:00.000Z",
  "updatedAt": "2026-08-29T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of list objects ordered alphabetically by `name`.

## Todos

### Create todo request

```json
{
  "title": "Buy milk",
  "dueDate": "2026-09-15"
}
```

`dueDate` is optional. Omit it or send `null` for no due date. The server sets `listId`, `userId`, and `completed: false`; client-provided ownership fields are ignored.

### Update todo request

Send any combination of `title`, `completed`, and `dueDate`:

```json
{
  "title": "Buy oat milk",
  "completed": false,
  "dueDate": "2026-09-20"
}
```

Send `{ "dueDate": null }` to clear a due date. Omitting `dueDate` leaves the existing value unchanged. A request with no supported update fields returns `400`.

### Todo success response

`POST` and `PUT` return one todo object:

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "dueDate": "2026-09-15",
  "createdAt": "2026-08-29T12:05:00.000Z",
  "updatedAt": "2026-08-29T12:05:00.000Z"
}
```

`dueDate` is `null` when not set. `GET /todo/lists/:listId/todos` returns an array ordered incomplete first, then by `createdAt` ascending.

## User Profile

### Update profile request

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`fName`, `lName`, `email`, and `username` are required. `password` is optional; omit it or send an empty string to keep the existing password.

### Profile success response

`GET` and `PUT` return:

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

The password hash is never returned.

## Conventions

* Successful responses use flat JSON with no `{ success, data }` envelope.
* Errors use `{ "message": "Human-readable explanation." }` with the appropriate HTTP status.
* Authenticated ownership is derived from the session as `req.user.id`, never from request-body ownership fields.
* Cross-user list, todo, and profile access returns `404`, not `403`.

## Error Responses

### Authentication and registration

| Situation | Status | Message |
|-----------|--------|---------|
| Missing first name | `400` | `First name is required.` |
| Missing last name | `400` | `Last name is required.` |
| Missing email | `400` | `Email is required.` |
| Invalid email format | `400` | `Enter a valid email address.` |
| Missing username | `400` | `Username is required.` |
| Missing login password | `400` | `Password is required.` |
| Password shorter than 8 characters | `400` | `Password must be at least 8 characters.` |
| Duplicate username | `400` | `Username is already taken.` |
| Duplicate email | `400` | `Email is already registered.` |
| Invalid login | `401` | `Invalid username or password.` |
| Missing token | `401` | `Unauthorized! No token provided.` |
| Invalid or expired token | `401` | `Unauthorized! Invalid or expired token.` |

### Lists

| Situation | Status | Message |
|-----------|--------|---------|
| Invalid list ID | `400` | `Invalid list id.` |
| Empty list name | `400` | `List name is required.` |
| List name longer than 100 characters | `400` | `List name must be 100 characters or fewer.` |
| List not found or not owned | `404` | `List with id=<id> not found.` |

### Todos

| Situation | Status | Message |
|-----------|--------|---------|
| Invalid todo ID | `400` | `Invalid todo id.` |
| Empty todo title | `400` | `Todo title is required.` |
| Todo title longer than 255 characters | `400` | `Todo title must be 255 characters or fewer.` |
| Invalid due date | `400` | `Due date must be a valid date in YYYY-MM-DD format.` |
| No supported update fields | `400` | `No valid fields to update.` |
| Todo not found or not owned | `404` | `Todo with id=<id> not found.` |

Todo collection routes also return the list errors above when `:listId` is invalid, missing, or not owned.

### User Profile

| Situation | Status | Message |
|-----------|--------|---------|
| Invalid user ID | `400` | `Invalid user id.` |
| Missing required profile field | `400` | Field-specific required message |
| Invalid email format | `400` | `Enter a valid email address.` |
| Password shorter than 8 characters | `400` | `Password must be at least 8 characters.` |
| Duplicate username | `400` | `Username is already taken.` |
| Duplicate email | `400` | `Email is already registered.` |
| User not found or not self | `404` | `User with id=<id> not found.` |
