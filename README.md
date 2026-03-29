# Farabi Chat for KazNU

Farabi Chat is a web platform for KazNU students with university email authentication, real-time chat rooms, campus announcements, student events and profile management.

## Project Goal

The goal of the project is to create a single digital space for KazNU students where communication, campus information and student interaction are combined in one web application. The platform focuses on a practical university use case: students can register with a university email, join relevant chats, track events and announcements, and manage their own profile inside one interface.

## Project Summary

This project was prepared as a university submission and portfolio-ready GitHub repository. The platform combines:

- student registration with KazNU email verification
- real-time communication through Socket.IO
- chat catalogs by faculty, specialty and dormitory
- announcements and events managed from the same application
- student profile editing and role-based access for admins

## University Submission Scope

This repository is prepared as a complete submission-ready project for academic review. It includes:

- source code for frontend and backend parts
- environment configuration example
- documented launch steps
- documented API surface
- role-based access logic
- real-time communication support through Socket.IO

## System Architecture

The application follows a simple client-server architecture.

### Frontend

- static UI served from the `public` folder
- vanilla JavaScript for authentication flow, chat UI, profile editing and admin actions
- responsive interface with light and dark themes

### Backend

- Express server exposes REST endpoints for authentication, profile, events, announcements and moderation
- Socket.IO handles real-time messaging and room switching
- Mongoose models store users, messages, events, announcements and pending registrations

### Data Layer

- MongoDB is used as the main persistent storage
- if MongoDB is unavailable, the server still starts, but database-backed features return empty or limited results

## Core User Scenarios

### Student Flow

1. A student registers with a KazNU email address.
2. The system generates and sends a verification code.
3. After verification, the student can sign in.
4. The student can join chat rooms by faculty, specialty or dormitory.
5. The student can update profile information and monitor events and announcements.

### Admin Flow

1. An admin signs in with a verified account.
2. The admin can create events.
3. The admin can publish announcements.
4. The admin can assign admin rights to another user.
5. The admin can delete inappropriate chat messages.

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

## Why This Project Is Useful

- reduces fragmentation between chats, announcements and event coordination
- gives students a focused communication space tied to university identity
- demonstrates full-stack web development concepts in one project
- shows practical use of authentication, real-time communication and database integration

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

## Demo Mode

For presentation, testing or university review, you can run the project in demo-friendly mode:

```env
DISABLE_EMAIL=true
```

This allows the server to run without real email delivery configuration. MongoDB is still recommended for full demonstration of users, events, announcements and message history.

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

## Suggested Demonstration Path

If this project is reviewed manually, the following sequence gives the clearest overview:

1. Launch the application locally.
2. Open the registration screen.
3. Show the faculty and specialty selection flow.
4. Demonstrate login and profile editing.
5. Open the chat catalog and switch between rooms.
6. Show events and announcements pages.
7. If admin access is available, demonstrate creating an event or announcement.

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

## Validation And Security

- only `@live.kaznu.kz` addresses are accepted for registration
- passwords are hashed before persistence
- required fields are validated on the server
- faculty and specialty relationships are checked during registration
- admin endpoints verify both role and email verification state

## Security Notes

- Passwords are hashed with `bcryptjs`
- Email input is normalized before validation
- Only verified users can authenticate
- Admin routes require verified admin accounts
- Sensitive configuration is stored via environment variables

## Repository Status

- GitHub-ready structure
- launch instructions included
- environment example included
- local git history initialized and published
- suitable for university submission, portfolio review and further development

## Future Improvements

- JWT or session-based authentication instead of client-side user persistence
- automated tests for API routes and validation
- file upload support for avatars or attachments
- search and filtering for announcements and events
- deployment configuration for cloud hosting

## License

ISC
