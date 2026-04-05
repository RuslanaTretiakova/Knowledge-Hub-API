# Knowledge Hub API

REST API for Knowledge Hub platform built with Nest.js framework.

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js 24.x.x - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.

## Downloading
```bash
git clone {repository URL}
```

## Installing NPM modules
```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default values:
```
PORT=4000
```

## Running application
```bash
npm start
```

After starting the app on port (4000 as default) you can open in your browser OpenAPI documentation by typing http://localhost:4000/doc/.
For more information about OpenAPI/Swagger please visit https://swagger.io/.

## API Endpoints

### Users
- `GET /user` — get all users
- `GET /user/:id` — get user by id
- `POST /user` — create user (login, password, role?)
- `PUT /user/:id` — update password (oldPassword, newPassword)
- `DELETE /user/:id` — delete user

### Articles
- `GET /article` — get all articles (filters: ?status=, ?categoryId=, ?tag=)
- `GET /article/:id` — get article by id
- `POST /article` — create article (title, content, status?, authorId?, categoryId?, tags?)
- `PUT /article/:id` — update article
- `DELETE /article/:id` — delete article

### Categories
- `GET /category` — get all categories
- `GET /category/:id` — get category by id
- `POST /category` — create category (name, description)
- `PUT /category/:id` — update category
- `DELETE /category/:id` — delete category

### Comments
- `GET /comment?articleId={id}` — get comments for article
- `GET /comment/:id` — get comment by id
- `POST /comment` — create comment (content, articleId, authorId?)
- `DELETE /comment/:id` — delete comment

## Cascade behavior

- Deleting a **User** sets `authorId` to null in their articles and deletes their comments
- Deleting a **Category** sets `categoryId` to null in related articles
- Deleting an **Article** deletes all its comments

## Testing

After application running open new terminal and enter:

To run all tests without authorization
```bash
npm run test
```

To run only one of all test suites
```bash
npm run test -- <path to suite>
```

To run all test with authorization
```bash
npm run test:auth
```

To run only specific test suite with authorization
```bash
npm run test:auth -- <path to suite>
```

To run refresh token tests
```bash
npm run test:refresh
```

To run RBAC (role-based access control) tests
```bash
npm run test:rbac
```

## Auto-fix and format
```bash
npm run lint
```
```bash
npm run format
```

## Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging
