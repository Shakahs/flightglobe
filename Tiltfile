# -*- mode: Python -*-

k8s_yaml('dataserver/k8s/redis.yaml')

docker_build('gcr.io/flight-globe/redis-point-persistor', './dataserver/cmd/redis-point-persistor')
k8s_yaml('./dataserver/k8s/redis-point-persistor.yaml')

docker_build('gcr.io/flight-globe/fr-collector', './dataserver/cmd/fr-collector')
k8s_yaml('dataserver/k8s/fr-collector.yaml')

docker_build('gcr.io/flight-globe/fg-server', './dataserver/cmd/fg-server')
k8s_yaml('dataserver/k8s/fg-server.yaml')
k8s_resource('fg-server',port_forwards=8085)
