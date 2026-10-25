FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies independently of application source changes.
COPY package*.json ./
RUN npm ci

# React embeds these values in the bundle during compilation.
ARG REACT_APP_API_URL=""
ARG REACT_APP_NAME=CloudCart
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_NAME=$REACT_APP_NAME
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
