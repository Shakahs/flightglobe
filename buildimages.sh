#!/bin/bash
./buildexecutables.sh
gcloud builds submit --tag gcr.io/flight-globe/fg-redis-persistor dataserver/cmd/fg-redis-persistor --async
gcloud builds submit --tag gcr.io/flight-globe/fr-collector dataserver/cmd/fr-collector --async
gcloud builds submit --tag gcr.io/flight-globe/fg-server dataserver/cmd/fg-server --async
