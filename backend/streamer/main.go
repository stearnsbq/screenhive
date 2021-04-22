package main

import (
	"flag"
	"fmt"
)

func main() {

	echo := flag.String("echo", "echo!", "string to echo back to you!")
	flag.Parse()

	fmt.Println(*echo)

}
