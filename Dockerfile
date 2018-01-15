FROM meroje/alpine-nchan:latest

COPY server/nginx.conf /etc/nginx/nginx.conf
COPY server/nginx.vh.default.conf /etc/nginx/conf.d/default.conf
COPY client-build/ /opt/app/static/