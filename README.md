# Real-Time Event Ticket Booking — Frontend

A React frontend for a ticket booking system built to solve one
specific problem properly: **preventing two people from booking the
same seat at the same time.**

## Why this exists

Platforms like Amazon and Flipkart sometimes oversell during
high-demand sales — multiple people end up buying the same limited
stock, and the platform has to cancel and refund orders afterward.
That happens because of a race condition: many requests check
availability and confirm a purchase without one atomic step in
between. Ticket booking is the same problem in its cleanest form — a
seat is either taken or it isn't, no quantity math involved — so it's
what I used to actually build and prove a correct solution to that
problem, end to end.

## Live demo

- **Frontend:** https://ticket-booking-frontend-ebon.vercel.app
- **Backend API:** https://ticket-booking-system-0vdx.onrender.com
- **Backend repo:** https://github.com/aayanbhuddiwork-sys/ticket-booking-system

> Note: the backend runs on Render's free tier, which sleeps after
> inactivity. The first request after a period of no traffic can take
> 20–30 seconds to wake up — the app shows a "waking up the server"
> message during this time rather than appearing broken.

## Tech stack

React (Vite) · react-router-dom · axios · deployed on Vercel, talking
to a Node/Express/PostgreSQL/Redis/Kafka backend deployed on Render.

## What's built, phase by phase

### Phase 1 — Foundation & Auth
Project scaffold, routing, a centralized API client, and shared login
state via React Context. JWT auth (register/login) wired to the live
backend, with tokens stored in localStorage. A dedicated component
handles the backend's cold-start delay so it's communicated to the
user rather than looking like a bug.

### Phase 2 — Core Booking Flow
A live seat grid pulling real seat data from the backend. Supports
holding up to 3 seats at once, each with its own independent
countdown matching the backend's actual Redis TTL, plus confirm and
release actions. Multi-seat confirms are sent sequentially (not in
parallel) to respect the backend's rate limiter.

### Phase 3 — Live System Internals Panel
A split-pane layout: the normal booking UI on the left, a terminal-
style feed on the right showing real backend activity — Redis lock
acquisitions, rejections, Postgres commits, Kafka publishes — as it
actually happens, driven by real API responses rather than a scripted
animation. Instrumented once at the API client level, so every page
feeds the panel automatically.

### Phase 4 — Concurrency in Action
- **Race-condition demo** — fires two hold requests at the same seat
  at the exact same instant and shows which one the backend's lock let
  through (one 200, one 409), live.
- **My Bookings** — view and cancel your bookings, calling the
  backend's real cancellation endpoint.
- **Phase 1 vs Phase 2 speed comparison** — times a direct-lock booking
  against a Redis hold/confirm booking on real, separate requests, and
  reports the actual measured difference rather than a claimed one.

## Running locally

```bash
git clone https://github.com/aayanbhuddiwork-sys/ticket-booking-frontend.git
cd ticket-booking-frontend
npm install
```

Create a `.env` file in the project root:
```
VITE_API_URL=https://ticket-booking-system-0vdx.onrender.com
```

Then:
```bash
npm run dev
```

## More detail

See [`FULL_INTERVIEW_PREP.md`](./FULL_INTERVIEW_PREP.md) in this repo for
the detailed design decisions, tradeoffs, and real bugs found and
fixed while building this — including a database constraint bug that
permanently blocked rebooking cancelled seats, and an honest (not
cherry-picked) latency comparison between the two booking approaches.
