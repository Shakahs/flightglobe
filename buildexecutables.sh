#!/bin/bash
( cd dataserver/cmd/fr-collector && go get -v && go build -v )
( cd dataserver/cmd/fr-collector2 && go get -v && go build -v )
( cd dataserver/cmd/redis-point-persistor && go get -v && go build -v )
( cd dataserver/cmd/fg-server && go get -v && go build -v )
