# AI Career Copilot 🚀

> **An AI-powered career optimization system that generates ATS-tailored resumes, analyzes skill gaps, and prepares candidate interview strategies.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)]([https://ai-career-copilot.vercel.app](https://ai-career-copilot-drab.vercel.app/))
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/muge-yilmaz/ai-career-copilot)

---

## 📌 Architectural Overview

`AI Career Copilot` is a full-stack platform designed to automate and optimize the career preparation pipeline. Built with **Next.js (App Router)** and **TypeScript**, the system bridges dynamic user profile data with LLM API integrations to parse job descriptions, compute skill match percentages, and dynamically construct ATS-compliant technical resumes.

---

## 🛠 Tech Stack & Tooling


![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)


| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Server-Side Rendering (SSR), Server Actions, API Routes |
| **Language** | TypeScript | End-to-end type safety, interface strictness |
| **Styling & UI** | Tailwind CSS / Lucide React | Responsive, accessible UI components (WCAG 2.1) |
| **Database & ORM** | Prisma ORM with MongoDB Atlas | Document modeling, type-safe queries, dynamic schemas |
| **Authentication** | Auth0 / NextAuth | Protected route middleware, JWT session management |
| **AI Integration** | LLM API Pipelines | Structured prompt engineering, JSON response parsing |
| **Testing & Tooling**| Jest & ESLint | Unit validation, strict linting rules |

---

## Key Features

* **ATS Resume Generator:** Dynamically compiles user experience and tech stacks into ATS-friendly Markdown and PDF structures.
* **Job Description Matcher:** Analyzes target job postings against candidate profiles to highlight missing technical keywords.
* **Dynamic AI Coaching:** Generates interview questions and targeted preparation strategies based on real-time candidate data.
* **Type-Safe Data Layer:** Built using Prisma ORM connected to MongoDB Atlas for relational-like document mapping.
* **Accessible UI System:** Fully responsive frontend compliant with WCAG 2.1 guidelines.

---

## 🏗 Data Model & Architecture

```text
[ User Interface (Next.js / Tailwind) ]
               │
               ▼ (Server Actions / API Routes)
[ Application Layer (TypeScript / Middleware) ] ──► [ Auth0 Guard ]
               │
        ┌──────┴────────────────────────┐
        ▼                               ▼
[ Prisma ORM ]                 [ LLM API Service ]
        │                               │
        ▼                               ▼
[ MongoDB Atlas ]             [ Structured JSON Output ]

```

---

## 🚀 Getting Started

### Prerequisites

* Node.js v18.0.0 or higher
* npm / pnpm / yarn
* MongoDB Atlas Cluster connection URI
* Auth0 Domain & Client ID

### Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/muge-yilmaz/ai-career-copilot.git](https://github.com/muge-yilmaz/ai-career-copilot.git)
cd ai-career-copilot

```


2. **Install dependencies:**
```bash
npm install

```


3. **Set up Environment Variables:**
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/ai-career-copilot"
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="[https://your-tenant.auth0.com](https://your-tenant.auth0.com)"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
AI_API_KEY="your-ai-service-api-key"

```


4. **Synchronize Prisma Database Schema:**
```bash
npx prisma db push

```


5. **Run the Development Server:**
```bash
npm run dev

```


Open [http://localhost:3000](http://localhost:3000?utm_source=gemini) in your browser.

---

## 🧪 Running Tests

Execute the unit test suite using Jest:

```bash
npm run test

```

---


## 👩‍💻 Author & Contact

**Müge Yılmaz** — Full-Stack AI Developer & UI/UX Engineer

* **Email:** [mugeyilmaz.web@gmail.com](https://www.google.com/search?q=mailto%3Amugeyilmaz.web%40gmail.com)
* **LinkedIn:** [linkedin.com/in/muge-yilmaz](https://linkedin.com/in/muge-yilmaz)
* **GitHub:** [github.com/muge-yilmaz](https://github.com/muge-yilmaz)
