CREATE OR REPLACE FUNCTION insert_track_position()
  RETURNS trigger AS
  $$
  BEGIN
    INSERT INTO flight_tracks_export (icao,  lat, lng)
    VALUES (NEW.icao, NEW.lat, NEW.lng);
    RETURN NEW;
  END;
  $$
  LANGUAGE plpgsql;