FROM node:24-slim
WORKDIR /app
ARG API_URL
ENV API_URL=${API_URL}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]