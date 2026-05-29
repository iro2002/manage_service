# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
EXPOSE 3002
CMD ["npm", "run", "preview", "--", "--host", "--port", "3002"]
