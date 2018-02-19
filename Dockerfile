FROM meroje/alpine-nchan:latest

COPY dataserver/nginx/nginx.conf /etc/nginx/nginx.conf
COPY dataserver/nginx/flightglobe.conf /etc/nginx/conf.d/flightglobe.conf
COPY client-build/ /opt/flightglobe/static/
RUN rm /etc/nginx/conf.d/default.conf