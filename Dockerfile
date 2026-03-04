# ---
# NOTE: This Dockerfile is configured for local development.
# In a production environment, you would typically use multistage builds
# to separate build dependencies from the final runtime image, and run
# the applications on distinct services or load balancers.
# ---

# Base Image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

# ---
# Backend Setup
# ---
WORKDIR /app/backend
# Copy package file if it exists, otherwise we'll run npm init later
# COPY backend/package*.json ./
# RUN npm install

# ---
# Frontend Setup
# ---
WORKDIR /app/frontend
# COPY frontend/package*.json ./
# RUN npm install

# Expose ports for Next.js (3000) and Express (5000)
EXPOSE 3000 5000

# We will use docker-compose commands to start the specific services
CMD ["sh", "-c", "echo 'Use docker-compose to start services' && sleep infinity"]
