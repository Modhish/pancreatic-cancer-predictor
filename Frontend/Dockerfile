# Frontend Dockerfile with dev (HMR) and preview targets
FROM node:20-alpine AS base
WORKDIR /app
COPY Frontend/package.json Frontend/package-lock.json* ./
RUN npm ci || npm install

# --- Dev target: hot reload via `npm run dev`
FROM base AS dev
WORKDIR /app
COPY Frontend/ ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# --- Preview target: static build + vite preview
FROM base AS preview
WORKDIR /app
COPY Frontend/ ./
RUN npm run build
RUN npm install -g vite@5
EXPOSE 5173
CMD ["vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
