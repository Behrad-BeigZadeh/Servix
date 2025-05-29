#!/bin/sh

echo "⏳ Running Prisma generate..."
npx prisma generate --schema=src/prisma/schema.prisma

echo "🚀 Starting the app..."
npm run dev
