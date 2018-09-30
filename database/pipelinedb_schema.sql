CREATE STREAM position_stream (
  icao                 char(6)  NOT NULL,
	ptime                timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	lat                  real  NOT NULL,
	lng                  real  NOT NULL,
	heading              real  NOT NULL,
	altitude             integer  NOT NULL
);

CREATE CONTINUOUS VIEW active_flights WITH (sw = '10 minutes') as
SELECT icao
from position_stream

CREATE CONTINUOUS VIEW flight_tracks as
SELECT DISTINCT ON (icao, ptime3) icao, lat, lng,
date_round(ptime,'30 seconds') AS ptime3
FROM position_stream
