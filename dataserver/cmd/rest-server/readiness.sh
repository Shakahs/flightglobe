#!/bin/sh
#ensure we can reach redis
nc -vz -w 1 $REDIS_ADDRESS $REDIS_PORT