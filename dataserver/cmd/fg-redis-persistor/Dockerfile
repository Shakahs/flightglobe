FROM centos:7

RUN yum install -y nc && yum clean all
COPY liveness.sh /var/flightglobe/liveness.sh
COPY readiness.sh /var/flightglobe/readiness.sh

COPY fg-redis-persistor /var/flightglobe/fg-redis-persistor
CMD ["/var/flightglobe/fg-redis-persistor"]

