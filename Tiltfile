# -*- mode: Python -*-

local("helm upgrade -f ./helm/redisconfig.yaml --install redis stable/redis")
local("helm upgrade -f ./helm/rabbitmq.yaml --install rabbitmq stable/rabbitmq")

docker_build('gcr.io/flight-globe/fg-redis-persistor', './dataserver/cmd/fg-redis-persistor')
k8s_yaml('./dataserver/k8s/fg-redis-persistor.yaml')

docker_build('gcr.io/flight-globe/fr-collector2', './dataserver/cmd/fr-collector2')
k8s_yaml('dataserver/k8s/fr-collector2.yaml')

docker_build('gcr.io/flight-globe/deepstream-server', './dataserver/deepstream-server')
k8s_yaml('dataserver/k8s/deepstream-server.yaml')
k8s_resource('deepstream-server',port_forwards=6020)

docker_build('gcr.io/flight-globe/deepstream-pusher', './dataserver/deepstream-pusher')
k8s_yaml('dataserver/k8s/deepstream-pusher.yaml')