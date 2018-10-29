package pkg

func CheckEnvVars(vars ...string) {
	for _, v := range vars {
		if v == "" {
			panic("Required env variable not provided")
		}
	}
}
