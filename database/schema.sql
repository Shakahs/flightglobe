CREATE SCHEMA "public";

CREATE SEQUENCE positions_id_seq START WITH 1;

CREATE SEQUENCE positions_id_seq1 START WITH 1;

CREATE TABLE positions ( 
	id                   bigserial  NOT NULL,
	icao                 char(6)  NOT NULL,
	ptime                timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	lat                  real  NOT NULL,
	lng                  real  NOT NULL,
	heading              real  NOT NULL,
	altitude             integer  NOT NULL,
	CONSTRAINT pk_positions_id PRIMARY KEY ( id )
 );

CREATE INDEX idx_positions_icao ON positions ( icao );

CREATE INDEX idx_positions_ptime ON positions ( ptime );

