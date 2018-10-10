CREATE STREAM position_stream (
  icao                 char(6)  NOT NULL,
	ptime                timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	lat                  real  NOT NULL,
	lng                  real  NOT NULL,
	heading              real  NOT NULL,
	altitude             integer  NOT NULL
);

CREATE CONTINUOUS VIEW flight_tracks_aggregated
WITH (ttl = '1 hour', ttl_column = 'ptime_bucket')
AS SELECT DISTINCT ON (icao, ptime_bucket) icao, date_round(ptime,'30 seconds') AS ptime_bucket,
lat, lng, heading, altitude
FROM position_stream;

CREATE TABLE flight_tracks_export  (
	id                   bigserial  NOT NULL,
  icao                 char(6)  NOT NULL,
	ptime                timestamptz NOT NULL,
	lat                  real  NOT NULL,
	lng                  real  NOT NULL,
	heading              real  NOT NULL,
	altitude             integer  NOT NULL
);
CREATE INDEX idx_flight_tracks_export_id ON flight_tracks_export ( id );

CREATE OR REPLACE FUNCTION insert_track_position()
  RETURNS trigger AS
  $$
  BEGIN
    INSERT INTO flight_tracks_export (icao, ptime, lat, lng, heading, altitude)
    VALUES (NEW.icao, NEW.ptime, NEW.lat, NEW.lng, NEW.heading, NEW.altitude);
    RETURN NEW;
  END;
  $$
  LANGUAGE plpgsql;

CREATE CONTINUOUS TRANSFORM flight_tracks_exporter as
SELECT (new).icao::char(6), (new).ptime_bucket::timestamptz as ptime, (new).lat::real, (new).lng::real,
 (new).heading::real, (new).altitude::real
FROM output_of('flight_tracks_aggregated')
THEN EXECUTE PROCEDURE insert_track_position();