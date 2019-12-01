#!/bin/bash
./buildexecutables.sh
gcloud builds submit --tag gcr.io/flight-globe/fg-redis-persistor dataserver/cmd/fg-redis-persistor --async
gcloud builds submit --tag gcr.io/flight-globe/fr-collector2 dataserver/cmd/fr-collector2 --async
gcloud builds submit --tag gcr.io/flight-globe/deepstream-server dataserver/deepstream-server --async
gcloud builds submit --tag gcr.io/flight-globe/deepstream-pusher dataserver/deepstream-pusher --async
