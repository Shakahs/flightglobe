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
SELECT DISTINCT ON (icao, ptime_bucket) icao, lat, lng,
date_round(ptime,'30 seconds') AS ptime_bucket
FROM position_stream;

CREATE TABLE flight_tracks_output  (
	id                   bigserial  NOT NULL,
  icao                 char(6)  NOT NULL,
-- 	ptime                timestamptz NOT NULL,
	lat                  real  NOT NULL,
	lng                  real  NOT NULL
-- 	heading              real  NOT NULL,
-- 	altitude             integer  NOT NULL
);
CREATE INDEX idx_flight_tracks_output_id ON flight_tracks_output ( id );

CREATE CONTINUOUS TRANSFORM test as
SELECT (new).icao::char(6), (new).lat::real, (new).lng::real
FROM output_of('flight_tracks')
THEN EXECUTE PROCEDURE insert_track_position();