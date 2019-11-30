# -*- mode: Python -*-

#k8s_yaml('dataserver/k8s/redis.yaml')
#k8s_yaml('dataserver/k8s/nats.yaml')
#k8s_resource('nats-deployment',port_forwards=[4222,8222])

#docker_build('gcr.io/flight-globe/fg-redis-persistor', './dataserver/cmd/fg-redis-persistor')
#k8s_yaml('./dataserver/k8s/fg-redis-persistor.yaml')

#docker_build('gcr.io/flight-globe/fr-collector2', './dataserver/cmd/fr-collector2')
#k8s_yaml('dataserver/k8s/fr-collector2.yaml')

docker_build('gcr.io/flight-globe/deepstream-server', './dataserver/deepstream-server')
k8s_yaml('dataserver/k8s/deepstream-server.yaml')
#k8s_resource('deepstream-server',port_forwards=6020)
