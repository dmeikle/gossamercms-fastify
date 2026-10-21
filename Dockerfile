FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS prod
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
