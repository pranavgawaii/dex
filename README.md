# DEX Command Center

A hyper-optimized personal developer operating system for placement preparation, technical tracking, and daily productivity.

[![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Premium-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

---

## ✦ Overview

**DEX** is a unified, high-performance dashboard designed to replace fragmented tools (Notion, Google Sheets, scattered apps) with a native technical progress tracker. It provides a premium interface for monitoring Data Structures, Algorithms, SQL skills, Interview preparations, and system design pipelines from a single centralized web OS.

## 🌟 Key Features

- **Centralized Dashboard:** Unify productivity streams including daily GitHub commits, LeetCode completions, and personal performance metrics.
- **DSA & SQL Trackers:** Progress through curated technical problem sets (e.g., NeetCode 150) with difficulty analytics and status tracking.
- **AI-Powered Intelligence:** Native Gemini AI integration for analyzing Job Descriptions (JD), vetting applications, and surfacing company-specific interview insights.
- **Placement CRM:** A full-featured Kanban board for application management, combined with resume-fit analysis.
- **Navi Assistant:** A resident AI assistant providing dynamic feedback, post generation, and technical suggestions globally.
- **Daily Reflection:** Integrated logs for execution tracking and health metrics (sleep, water, steps).

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** Tailwind CSS + Framer Motion (Glassmorphic UI)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + JWT)
- **AI Core:** Google Gemini SDK
- **Automation:** Python (Job & Intel Scrapers)

## 📁 Project Structure

```text
├── src/
│   ├── app/            # Next.js App Router (Pages & API Routes)
│   ├── components/     # UI Components (Radix UI, Framer Motion)
│   ├── lib/            # Shared utilities and database logic
│   └── config/         # System configuration
├── scripts/
│   └── scrapers/       # Python-based web scrapers for jobs and intel
├── supabase/
│   └── migrations/     # SQL Database schema and seed files
└── public/             # Static assets and fonts
```

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18+) & npm
- Python 3.10+ (for scrapers)
- A Supabase Project
- A Google Gemini API Key

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/pranavgawaii/dex
cd dex
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory and populate it with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
GEMINI_API_KEY=your_gemini_key
GITHUB_TOKEN=your_github_pat
# See .env.local.example for a full list
```

### 4. Database Initialization
Deploy the schema to your Supabase instance:
```bash
npx supabase link --project-ref your_project_id
npx supabase db push
```

### 5. Running the Application
```bash
npm run dev
```
Access the OS at `http://localhost:3000`.

## 🚢 Deployment

DEX is optimized for Vercel deployment:
1. Connect the repository to Vercel.
2. Add all environment variables from `.env.local` to the Vercel project settings.
3. Ensure the build command is set to `npm run build`.
4. Vercel Cron jobs can be configured to trigger the job scrapers periodically.

## 📄 License

This project is proprietary and intended for personal use. All rights reserved.
