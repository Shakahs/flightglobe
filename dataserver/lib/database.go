package lib

import (
	_ "github.com/jackc/pgx/stdlib"
	"github.com/jmoiron/sqlx"
)

var DB = sqlx.MustConnect("pgx",
	"postgres://flightglobe:flightglobe@localhost/flightglobe")
