# ----------------------------------------------------
# Lightweight Nginx Alpine web server for PokeAPI
# ----------------------------------------------------
FROM nginx:alpine

# Copy static frontend web assets into Nginx default serving root
COPY . /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]