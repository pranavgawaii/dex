<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/command.svg" width="80" alt="DEX Logo">
  <h1>DEX Command Center</h1>
  <p><strong>A hyper-optimized personal developer operating system for placement preparation, technical tracking, and daily productivity.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=flat-square&logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/TailwindCSS-Premium-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase" alt="Supabase">
  </p>
</div>

<br />

## ✦ Core Philosophy

DEX is designed to replace fragmented tools (Notion, Google Sheets, scattered apps) with a unified, high-performance dashboard that tracks technical progress natively. It provides a beautiful interface built to monitor Data Structures, Algorithms, SQL skills, Interview preparations, and system design pipelines securely from a single centralized web OS.

<br />

## 🌟 Key Features

- **Dashboard:** Unifies all productivity streams—tracking daily GitHub commits, LeetCode completions, quick actions, and personal metrics seamlessly.
- **DSA Tracker:** Tracks progression through structured lists (like NeetCode 150), including difficulty splits and detailed algorithm mastery.
- **SQL Analytics:** A dedicated space to track database query practices and optimizations.
- **Job Intelligence:** An AI-powered Job Description (JD) analyzer hooked into Gemini AI to instantly vet applications, score fit rates, and surface company-specific interview insights.
- **Placement CRM:** An integrated Kanban-style application manager with resume injection and technical skill alignment checking.
- **Navi Assistant:** A fully native Gemini AI assistant operating globally across the OS for dynamic feedback, post generation, and technical suggestions.
- **Daily Reflection & Health:** Maintain comprehensive daily execution logs and health tracking (sleep, water, steps).

<br />

## 🛠️ Tech Stack & Architecture

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language:** TypeScript 
- **Styling:** Tailwind CSS + Framer Motion (glassmorphic & minimal elements)
- **Authentication & Database:** [Supabase](https://supabase.com/) (PostgreSQL + JWT Auth)
- **AI Core:** Google Gemini SDK
- **Fonts:** TwitterChirp, Inter, Geist Mono

<br />

## 🚀 Local Development Setup

### 1. Pre-requisites
Ensure you have Node.js (`v18+`) and npm installed. 
You will also need a Supabase project and a Gemini API Key.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/pranavgawaii/dex
cd dex
npm install
```

### 3. Environment Variables
Duplicate the example environment file:
```bash
cp .env.local.example .env.local
```
Fill in all required keys (Supabase URLs, Gemini tokens, GitHub/LeetCode usernames). 

### 4. Database Setup
Initialize the necessary tables and seed data using the Supabase CLI:
```bash
npx supabase link --project-ref your_project_ref
npx supabase db push
```

### 5. Start Developer Server
```bash
npm run dev
```
Navigate your browser to `http://localhost:3000` to boot DEX.

<br />

## 🚢 Deployment

DEX is heavily optimized for zero-config Vercel deployments. 
1. Connect your GitHub repository to Vercel.
2. Inject your `.env.local` contents into the Production Environment Variables portal.
3. Configure the **Build Command** to `npm run build` and **Install Command** to `npm install`.
4. Deploy. Vercel Cron jobs will automatically run via standard declarations in `vercel.json` if configured.

<br />

## 📄 License
This project is proprietary and intended for personal use by the creator.
