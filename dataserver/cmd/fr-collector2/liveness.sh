#!/bin/sh
#ensure the liveness file exists and is not too old.
# the liveness file is touched each time the FlightRadar24_Collector_Verifier receives a message
stat /tmp/fr-collector2-live &&  [ "$(( $(date +"%s") - $(stat -c "%Y" /tmp/fr-collector2-live) ))" -lt "40" ]