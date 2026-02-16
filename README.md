# Smart Bookmark App

A simple full-stack bookmark manager built with Next.js (App Router) and Supabase.

## 🚀 Live Demo
Deployed on Vercel.

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend & Database:** Supabase (Postgres)
- **Authentication:** Google OAuth via Supabase
- **Realtime Updates:** Supabase Realtime (Postgres WAL subscription)
- **Deployment:** Vercel

---

## ✅ Features

- Google OAuth login (no email/password)
- Private bookmarks per user (Row Level Security enabled)
- Add bookmark (title + URL)
- Delete bookmark
- Real-time updates across tabs
- Session-based route protection
- Production-ready environment configuration

---

## 🔐 Security Architecture

### Row-Level Security (RLS)

Bookmarks are private to each user.

Implemented using Supabase RLS policies:

- SELECT only where `user_id = auth.uid()`
- INSERT only with matching `user_id`
- DELETE only for the owner

This ensures:
- User A cannot see User B’s bookmarks
- Direct API calls cannot bypass access rules

---

## ⚡ Realtime Implementation

Realtime updates are implemented using:

- Supabase `postgres_changes`
- Table added to `supabase_realtime` publication

Whenever INSERT or DELETE occurs:
- All connected clients automatically re-fetch bookmarks
- No page refresh required

---

## 🧠 Architecture Overview

1. Google OAuth handled by Supabase
2. Session verified on dashboard load
3. Bookmarks fetched from Postgres
4. Realtime channel subscribed to changes
5. RLS ensures data isolation at DB level

---

## 🧪 Challenges Faced & Solutions

### 1️⃣ OAuth Provider Not Enabled
Error: `Unsupported provider`

**Solution:**  
Enabled Google provider in Supabase → Configured OAuth Client ID and Secret in Google Cloud Console → Added callback URL correctly.

---

### 2️⃣ Realtime Not Triggering
Initial implementation worked but real-time updates did not fire.

**Root Cause:**  
`bookmarks` table was not added to `supabase_realtime` publication.

**Solution:**  
Added table to publication via:
Database → Publications → supabase_realtime

---

### 3️⃣ Environment Variables Not Detected
Error: `supabaseUrl is required`

**Solution:**  
- Used `NEXT_PUBLIC_` prefix
- Restarted dev server after updating `.env.local`

---

## 🏗 Local Setup

1. Clone repo
2. Install dependencies

```bash
npm install

3. Add environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

4. Run development server
npm run dev

📦 Database Schema
create table bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz default now()
);