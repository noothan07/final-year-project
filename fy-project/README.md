# Attendance Marker and Calculator System (MERN)

Mobile-first MERN application for faculty to:

- Authenticate (JWT)
- Select class + date + subject
- Mark attendance using a **single list** (absentees OR presents)
- View monthly summary per student
- Export monthly Excel report

## Project Structure

This repo uses two folders at the same level:

- `fy-project/` (Frontend - React + Vite + Tailwind v4 + Axios + Framer Motion)
- `backend/` (Backend - Node + Express + MongoDB + JWT + Excel export)

## Prerequisites

- Node.js LTS
- MongoDB running locally, or a MongoDB Atlas connection string

## Backend Setup

1. Create env file:

   Copy `backend/.env.example` to `backend/.env`.

2. Install deps:

   Run in `d:\final_yr project\backend`:
   
   - `npm install`

3. Start backend:

   - `npm run dev`

Backend runs at `http://localhost:5000`.

## Frontend Setup

1. Install deps:

   Run in `d:\final_yr project\fy-project`:
   
   - `npm install`

2. Start frontend + backend together:

   From `fy-project/`:
   
   - `npm run dev:all`

Frontend runs at `http://localhost:5173`.
The frontend proxies API calls to the backend (`/api/*` -> `http://localhost:5000`).

## First Login (Faculty)

Create a faculty user via API (one-time) using:

- `POST /api/auth/register`

Body:

```json
{
  "name": "Faculty",
  "email": "faculty@college.edu",
  "password": "password123",
  "role": "faculty"
}
```

Then login via the UI (`/login`).

## Key APIs

- `POST /api/auth/login`
- `GET /api/students?department=&year=&section=`
- `POST /api/attendance/mark`
- `GET /api/reports/monthly?department=&year=&section=&subject=&month=YYYY-MM`
- `GET /api/reports/monthly/export?...` (Excel download)

## Smart Attendance Rule

Faculty enters **only one list**:

- Absentees list -> remaining students marked Present
- Presents list -> remaining students marked Absent

Duplicate attendance for the same **class + date + subject** is prevented.
