Servix

Servix is a full-stack service marketplace platform that allows users to offer, browse, and book services. Built with a modern tech stack, Servix supports real-time chat, authentication, notifications, and booking workflows.

🚀 Features

✅ User Authentication (JWT-based: access & refresh tokens)

📦 Service creation & listing

📅 Booking system with real-time status updates

💬 Real-time chat with Socket.IO

🛎️ Real-time notifications

☁️ Image uploads via Cloudinary

✅ Fully tested backend using Jest + Supertest

🛠️ Tech Stack

Frontend:

Next.js

Tailwind CSS

Zustand (state management)

Backend:

Node.js + Express

Prisma ORM

PostgreSQL (Neon)

Socket.IO

JWT Authentication

Cloudinary API

Testing:

Jest

Supertest

Deployment (planned):

Frontend: Vercel

Backend: Render

📁 Project Structure

Servix/
├── backend/           # Express backend
├── frontend/          # Next.js frontend
├── tests/             # Backend tests
├── .env               # Environment file (local dev)
├── .env.test          # Environment for tests (not committed)
├── .env.test.example  # Example test env (safe to commit)

🧪 Running Tests

Setup

Create a .env.test file in the root directory based on the .env.test.example provided:

cp .env.test.example .env.test

Run tests

npm install
npm test

🖥️ Running Locally

1. Clone the repository

git clone https://github.com/Behrad-BeigZadeh/Servix.git
cd Servix

2. Install dependencies

# Install root (shared) packages
yarn install # or npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

3. Setup Environment Variables
Create a .env file for development:

env
Copy
Edit
PORT=5000
NODE_ENV=development
DATABASE_URL=your_local_db_url
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
Create a .env.test file for tests, based on .env.test.example:

env
Copy
Edit
DATABASE_URL=your_test_db_url
ACCESS_TOKEN_SECRET=your_test_access_secret
REFRESH_TOKEN_SECRET=your_test_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


4. Start the development servers

# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev

5. Running Tests
🧪 Backend Tests
Run backend tests from the root directory:

bash
Copy
Edit
npm test
Make sure .env.test exists in the root (you can base it on .env.test.example).

🧪 Frontend Tests
Run frontend tests from inside the frontend folder:

bash
Copy
Edit
cd frontend
npm run test

