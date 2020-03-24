#!/bin/sh
#ensure the liveness file exists and is not too old (40 second limit).
# the liveness file is touched each time the FlightRadar24_Collector_Verifier receives a message
stat /tmp/app-is-live &&  [ "$(( $(date +"%s") - $(stat -c "%Y" /tmp/app-is-live) ))" -lt "40" ]