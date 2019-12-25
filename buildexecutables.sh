#!/bin/bash
( cd dataserver/cmd/fr-collector2 && go get -v && go build -v )
( cd dataserver/cmd/fg-redis-persistor && go get -v && go build -v )
( cd dataserver/cmd/rest-server && go get -v && go build -v )
