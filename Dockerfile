FROM node:current as build

ARG VITE_API_URL
ARG VITE_APP_URL
ARG VITE_API_OAUTH_CLIENT_ID

COPY . .
RUN npm install
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx"]


