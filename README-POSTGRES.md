# Meets — PostgreSQL persistence

This version removes the Firebase/Firestore dependency from the application flow and uses an Express API + PostgreSQL.

## Architecture

- `snack/`: Expo React Native application.
- `backend/`: Node.js + Express REST API.
- PostgreSQL 17 runs in Docker.
- JWT authentication is persisted in AsyncStorage on the mobile app.
- Passwords are hashed with bcrypt.
- Database schema is in `backend/migrations/001_init.sql` and incremental changes in `002_image_storage.sql` / `003_ratings_events_history.sql`.
- Automated persistence tests use `pg-mem` to exercise the repository layer without requiring Docker.

## Start PostgreSQL + API

```bash
cd backend
cp .env.example .env
docker compose up --build
```

API: `http://localhost:3334`
Health: `http://localhost:3334/health`
Adminer: `http://localhost:8081` (server `postgres`, database `meets`, user `postgres`, password `postgres`)

## Start mobile

```bash
cd snack
npm install
npx expo start
```

Android emulator uses `10.0.2.2:3333` by default. For a physical phone, create `snack/.env` with your computer's LAN address:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:3333
```

The phone and computer must be on the same network and port 3333 must be reachable.

## Tests

```bash
cd backend
npm install
npm test
```

The tests cover:
- user creation/read;
- profile update;
- post persistence;
- like toggle;
- save/favorite persistence;
- history persistence;
- event/live/post creation;
- settings persistence;
- presentation ratings with 1–5 stars;
- public speaker averages and six skill averages;
- controlled one-rating-per-user/per-presentation/per-speaker updates;
- auditable history for content, likes, saves, favorites and ratings;
- event date, time and location;
- ownership checks for deleting your own posts/events.

## What was changed

The previous login only navigated to the app, signup sent profile data to `/users/me` without authentication, and several screens rendered hard-coded sample data.

Those flows were replaced with real API calls. The app now persists:
- account/login session;
- profile;
- feed posts;
- likes;
- favorites;
- saved posts;
- history;
- events;
- live rooms;
- notifications;
- settings.

Search and chat now read from the API instead of rendering fake sample records. Empty states are shown when the database has no records.

## Important

Do not use the development JWT secret in production. Set a strong `JWT_SECRET` and restrict `CORS_ORIGIN`.
