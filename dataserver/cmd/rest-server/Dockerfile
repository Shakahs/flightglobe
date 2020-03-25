FROM centos:7

RUN yum install -y nc && yum clean all
COPY readiness.sh /var/flightglobe/readiness.sh

COPY rest-server /var/flightglobe/rest-server
CMD ["/var/flightglobe/rest-server"]
