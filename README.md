# Servix

Servix is a full-stack service marketplace platform that allows users to offer, browse, and book services. Built with a modern tech stack, Servix supports real-time chat, authentication, notifications, and booking workflows.

✅ User Authentication (JWT-based: access & refresh tokens)  
📦 Service creation & listing  
📅 Booking system with real-time status updates  
💬 Real-time chat with Socket.IO  
🛎️ Real-time notifications  
☁️ Image uploads via Cloudinary  
✅ Fully tested backend using Jest + Supertest  


---

**Frontend:**  
Next.js  
Tailwind CSS  
Zustand (state management)  

**Backend:**  
Node.js + Express  
Prisma ORM  
PostgreSQL (Neon)  
Socket.IO  
JWT Authentication  
Cloudinary API  

**Testing:**  
Jest  
Supertest  

---


## 🚀 Getting Started

### 1️⃣ Clone the Repository

git clone https://github.com/Behrad-BeigZadeh/Servix.git
cd Servix

### 🧰 Backend

1. Go to the `backend/` folder
2. Install dependencies:
   ```bash
   npm install
   
 ### Set up environment variables
-PORT=5000
-NODE_ENV=development
-DATABASE_URL=You can add it from neon
-ACCESS_TOKEN_SECRET=your_access_token
-REFRESH_TOKEN_SECRET=your_refresh_token
-CLOUDINARY_CLOUD_NAME=your_cloudinary_name
-CLOUDINARY_API_KEY=your_cloudinary_key
-CLOUDINARY_API_SECRET=your_cloudinary_secret

 ### Run Backend
    ```bash
    -npm run dev



 ### Seeding Database 
    ```bash
    -npx prisma:migrate
    -npm run seed


---

 ### 🧰 Frontend

1. Go to the `frontend/` folder
2. Install dependencies:
   ```bash
   npm install

 ### Set up environment variables
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

         ```bash
        npm run dev

---

## 🧪 Running Tests

### Setup

Create a `.env.test` file in the root directory based on the `.env.test.example` provided:

```bash
npm install
npm test






