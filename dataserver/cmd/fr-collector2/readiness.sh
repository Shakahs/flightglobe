#!/bin/sh
#ensure we can reach rabbitmq and redis
nc -vz -w 1 $RABBITMQ_HOST $RABBITMQ_PORT