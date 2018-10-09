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