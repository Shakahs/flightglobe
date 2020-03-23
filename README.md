## FlightGlobe

FlightGlobe is a tool for visualizing global air traffic in a useful way.

[Demo here](https://www.flight.earth)
 
It projects near real-time flight positions with accurate latitude, longitude, and altitude over a 3D globe. Users can also view a table of flight data and filter visible flights by various parameters. FlightGlobe is meant to be an alternative to other visualization tools that project flight data over 2D maps.  

FlightGlobe consists of a web-based client to display flight positions and backend services to obtain and serve the flight position data.  

##### Backend

The backend consists of containerized Collector, Persistor, and Server services written in Golang, deployed to Kubernetes, and communicating via Redis Pub/Sub.

Collectors load flight position updates from upstream APIs, filter invalid data, transform accepted data into a standardized format, and publish it to Redis Pub/Sub. 

Persistors subscribe to the collector data, further transform it, and save it to a datastore or publish it to a Pub/Sub channel.

Servers subscribe to the persisted data and serve it to clients via WebSocket connections, in addition to serving the static files that make up the frontend application.  

##### Frontend

The frontend is a TypeScript application that utilizes MobX for reactive state, CesiumJS for the 3D globe, and React for the settings and data filtering UI. 

Flight data is stored in the FlightStore, and each Flight is represented by a Flight object that is subscribed to the relevant state in MobX. State updates will cause the Flight object to recompute and update its representation on the globe by rendering, derendering, moving, changing color, etc. 

##### Dev Environment

Prerequisites: Kubernetes cluster available (I use Minikube)

1. yarn/npm install #javascript dependencies
2. ./buildexecutables.sh #build Golang backend executables
3. tilt up #launch backend components in Kubernetes
4. yarn dev  #launch frontend

##### Prod Environment

1. yarn install
2. yarn build
3. ./buildimages.sh

##### Deployment

#create namespaces
kubectl --kubeconfig=/tmp/kubeconfig.yaml create namespace flightglobe

install ingress-nginx via helm, with values file to provide the DO specific annotation to the letsencrypt challenge works
helm install --kubeconfig /tmp/kubeconfig.yaml -f helm/ingress-nginx.yaml my-ingress stable/nginx-ingress

apply the new loadbalancer IP to DNS

install cert-manager via helm, instructions on cert-manager.io. Also need to install the CRD definitions so it works
https://cert-manager.io/docs/installation/kubernetes/#installing-with-helm
kubectl --kubeconfig=/tmp/kubeconfig.yaml create namespace cert-manager
kubectl --kubeconfig=/tmp/kubeconfig.yaml apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v0.14.0/cert-manager.crds.yaml
helm install --kubeconfig /tmp/kubeconfig.yaml cert-manager jetstack/cert-manager --namespace cert-manager --version v0.14.0

install flightglobe letsencrypt-staging issuer
kubectl --kubeconfig=/tmp/kubeconfig.yaml apply -f dataserver/k8s/cert-manager/letsencrypt-staging.yaml -n flightglobe

install Redis & RabbitMQ
helm install --kubeconfig /tmp/kubeconfig.yaml  -f helm/redisconfig.yaml  -n flightglobe redis stable/redis
helm install --kubeconfig /tmp/kubeconfig.yaml  -f helm/rabbitmq.yaml  -n flightglobe rabbitmq stable/rabbitmq
 
install the app 
kubectl --kubeconfig=/tmp/kubeconfig.yaml -n flightglobe apply -f dataserver/k8s/fr-collector2.yaml
kubectl --kubeconfig=/tmp/kubeconfig.yaml -n flightglobe apply -f dataserver/k8s/fg-redis-persistor.yaml
kubectl --kubeconfig=/tmp/kubeconfig.yaml -n flightglobe apply -f dataserver/k8s/rest-server.yaml

install the app  ingress
kubectl --kubeconfig=/tmp/kubeconfig.yaml -n flightglobe apply -f dataserver/k8s/rest-server-ingress.yaml 
