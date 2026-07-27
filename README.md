# BalisongFlippingCenter — Web

React/TypeScript frontend for the BalisongFlippingCenter community platform — a full-stack web application for balisong knife enthusiasts to share content, connect with other flippers, and showcase their skills.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=flat-square&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=flat-square&logo=docker)

---

## Overview

BalisongFlippingCenterWeb is the client for the BalisongFlippingCenter platform. It talks to the [BalisongFlippingCenterServer](https://github.com/BalisongFlippingCenter/BalisongFlippingCenterServer) REST API for auth, posts, knife collections, and profiles, and connects over WebSocket/STOMP for real-time messaging.

**Backend repo:** [BalisongFlippingCenterServer](https://github.com/BalisongFlippingCenter/BalisongFlippingCenterServer)

> Note: this repo includes an AWS Amplify setup (`/amplify`, Cognito auth + a placeholder DynamoDB model) left over from early scaffolding. It is **not** used by the running app — auth and data go through the custom Spring Boot API above.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS |
| State | Redux Toolkit + React Redux |
| Routing | React Router 6 |
| HTTP client | Axios |
| Real-time | STOMP over WebSocket (`@stomp/stompjs`) |
| Auth | Google OAuth (`@react-oauth/google`) + JWT from the backend |
| Icons | FontAwesome |
| Animation | Motion |
| Virtualization | TanStack Virtual |
| Containerization | Docker (multi-stage build → Nginx) |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Environment variables

Copy `.env.example` to `.env` and fill in real values:

```
VITE_API_BASE_URL=
VITE_WS_URL=
```

`.env.production` and `.env.test` are already committed with the correct URLs for those environments — Vite picks the right one automatically based on build mode, so no manual wiring is needed in CI.

### Run locally

```bash
git clone https://github.com/BalisongFlippingCenter/BalisongFlippingCenterWeb.git
cd BalisongFlippingCenterWeb
npm install
npm run dev
```

The dev server runs on `http://localhost:5157`.

### Build

```bash
npm run build       # type-checks with tsc, then builds with Vite (mode: production)
npm run preview     # serve the production build locally
```

### Run with Docker

```bash
docker build --build-arg BUILD_MODE=production -t balisong-web .
docker run -p 80:80 balisong-web
```

---

## Project structure

```
src/
├── api/                        # Axios client, API calls
├── components/                 # Reusable UI components
├── pages/                      # Route-level page components
├── layouts/                    # Shared page layouts
├── routes/                     # React Router route definitions
├── redux/                      # Redux Toolkit store, slices
├── hooks/                      # Custom hooks
├── modals/                     # Modal components
├── comboBoxData/               # Static dropdown/select data
├── data/                       # Static app data
└── utils/                      # Shared helpers
```

---

## CI/CD

Two GitHub Actions pipelines, split by branch:

- **`test`** (`.github/workflows/deploy-web-to-ecr.yml`) — builds a Docker image, pushes to ECR, and deploys via SSH to a container on the staging EC2 host, port 80. Push or merge into `test` to update staging.
- **`main`** (`.github/workflows/deploy-web-to-prod.yml`) — builds the static site with Vite, syncs `dist/` to the production S3 bucket, and invalidates CloudFront. Authenticates to AWS via GitHub OIDC, assuming the `balisong-frontend-deploy` IAM role provisioned in the [Terraform infra repo](https://github.com/BalisongFlippingCenter/BalisongFlippingCenterTerraformProd) — no static AWS keys involved.

Note production here is **not** a Docker container — CloudFront serves the built static assets directly from S3, and only routes `/api/*` to the backend EC2 instance.

Promote staging to production by merging `test` into `main`.

Two additional checks run independent of deploy:
- **`devChecks.yml`** — type-check + build on push to `main`/`dev`.
- **`pr-checks.yml`** — type-check + build, plus a guard against merging with the dummy dev-login token left active, on PRs into `main`.

---

## Related

- [BalisongFlippingCenterServer](https://github.com/BalisongFlippingCenter/BalisongFlippingCenterServer) — Spring Boot backend
- [BalisongFlippingCenterTerraformProd](https://github.com/BalisongFlippingCenter/BalisongFlippingCenterTerraformProd) — production AWS infrastructure (Terraform)

---

## Author

**Tyler Zenisek** — [tylerzeniseks.com](https://www.tylerzeniseks.com) · [GitHub](https://github.com/tzenisekj)
