FROM centos:7

RUN yum install -y nc && yum clean all
COPY liveness.sh /var/flightglobe/liveness.sh
COPY readiness.sh /var/flightglobe/readiness.sh

COPY fr-collector2 /var/flightglobe/fr-collector2
CMD ["/var/flightglobe/fr-collector2"]
