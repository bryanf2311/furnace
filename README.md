# Furnace

A small-group sync app for the brothers. Plan the week, pitch ideas, vote on what to study, RSVP, and chat — all in one place. Built for the men of the forge.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4**
- **Firebase** — Google Authentication + Firestore (real-time)
- **Netlify** for hosting

## Features

- **Google sign-in** for every brother in the group
- **Leader (admin) role** — promote/demote from the Leaders page
- **This-week plan** with Monday + Wednesday Bible studies and biweekly Friday hangouts; admins add topics, readings, and notes
- **RSVP** — In / Maybe / Out, with live tallies
- **Idea board** — anyone pitches, anyone votes, top ideas float up
- **Calendar** — six-week grid view with planned meetings marked
- **Chat** — group message stream
- **Rotating Scripture** of the week in the footer

## Setup

1. **Create a Firebase project** at https://console.firebase.google.com
2. **Enable Google sign-in** under Authentication → Sign-in method
3. **Create a Firestore database** (start in production mode, then paste the rules from `firestore.rules`)
4. **Copy `.env.example` to `.env.local`** and fill in the values from Project Settings → General → Your apps
5. **Add your Google email** to `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated). That email will be promoted to Leader on first sign-in.
6. Run `npm install && npm run dev` and open http://localhost:3000

## Deploy to Netlify

1. Push this repo to GitHub
2. Connect the repo in Netlify (Build command `npm run build`, publish `.next`)
3. In Netlify → Site settings → Environment variables, add the same `NEXT_PUBLIC_FIREBASE_*` values from your `.env.local`
4. Deploy

## Promote other leaders

Sign in with your leader account, then visit `/admin` (or click "Leaders" in the nav). Promote any member with one click.
