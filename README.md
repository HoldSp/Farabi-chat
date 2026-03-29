# Farabi Chat for KazNU

Farabi Chat is a web platform for KazNU students with university email authentication, real-time chat rooms, campus announcements, student events and profile management.

## Project Summary

This project was prepared as a university submission and portfolio-ready GitHub repository. The platform combines:

- student registration with KazNU email verification
- real-time communication through Socket.IO
- chat catalogs by faculty, specialty and dormitory
- announcements and events managed from the same application
- student profile editing and role-based access for admins

## Main Features

- Authentication with KazNU student email format `@live.kaznu.kz`
- Email verification flow with one-time code
- Real-time chat with room switching and recent history
- Catalog of chats by faculty, specialty and dormitory
- Events and announcements feed
- Profile editing for logged-in users
- Admin actions for moderation and content management
- Responsive frontend with light and dark themes

## Tech Stack

- Node.js
- Express
- Socket.IO
- MongoDB with Mongoose
- Nodemailer
- Vanilla HTML, CSS and JavaScript

## Requirements

- Node.js `20.19.0` or newer
- npm
- MongoDB instance for full functionality

## Quick Start

1. Open the project folder:

```bash
cd kaznu-chat
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` from `.env.example` and fill in real values:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/kaznu-chat
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
DISABLE_EMAIL=true
NODE_ENV=development
```

4. Start the application:

```bash
npm start
```

5. Open the browser:

```text
http://localhost:3000
```

## Development Commands

```bash
npm start
npm run dev
npm run check
```

- `npm start` runs the production-style server
- `npm run dev` runs the server in watch mode
- `npm run check` performs a syntax check for the main project files

## Environment Variables

- `PORT`: server port
- `MONGO_URI`: MongoDB connection string
- `MAIL_USER`: sender email for verification codes
- `MAIL_PASS`: app password for the email account
- `DISABLE_EMAIL`: set to `true` to disable real email sending during demo/testing
- `NODE_ENV`: runtime mode

## Notes For Reviewers

- The app starts even if MongoDB is unavailable, but database-backed features require a working MongoDB connection.
- For local demonstration without email delivery, set `DISABLE_EMAIL=true`.
- The frontend is served directly by the Express server from the `public` folder.

## Project Structure

```text
kaznu-chat/
├── config.mjs
├── server.mjs
├── validators.mjs
├── package.json
├── package-lock.json
├── .env.example
└── public/
    ├── app.js
    ├── faculties.js
    ├── index.html
    ├── logo.png
    └── style.css
```

## API Overview

Authentication:

- `POST /api/register`
- `POST /api/verify-email`
- `POST /api/login`
- `POST /api/validate-user`

Application data:

- `GET /api/faculties`
- `GET /api/events`
- `POST /api/events`
- `GET /api/announcements`
- `POST /api/announcements`
- `GET /api/stats`
- `POST /api/presence`
- `PUT /api/profile`

Admin actions:

- `POST /api/admin/make-admin`
- `DELETE /api/messages/:id`

## Security Notes

- Passwords are hashed with `bcryptjs`
- Email input is normalized before validation
- Only verified users can authenticate
- Admin routes require verified admin accounts
- Sensitive configuration is stored via environment variables

## License

ISC
