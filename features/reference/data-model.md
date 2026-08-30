# Data Model Reference

**Status:** reflects Feature 4 (user profile management) on `feature/4-user-profile-management`.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only (excluded from default scope) |
| `role` | STRING(20) | Default `worker` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; JWT stored server-side |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required; references `users.id` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; max 100 chars |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade on list delete |
| `title` | STRING | Required; max 255 chars |
| `completed` | BOOLEAN | Default `false` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

* `User hasMany Session` (`userId`)
* `Session belongsTo User` (`userId`)
* `User hasMany List` (`userId`)
* `List belongsTo User` (`userId`)
* `User hasMany Todo` (`userId`)
* `Todo belongsTo User` (`userId`)
* `List hasMany Todo` (`listId`, `onDelete: CASCADE`)
* `Todo belongsTo List` (`listId`)
