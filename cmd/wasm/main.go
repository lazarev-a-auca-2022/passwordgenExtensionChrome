package main

import (
	"syscall/js"

	"github.com/lazarev-a-auca-2022/passwordgen/internal/generator"
)

func main() {
	js.Global().Set("wasmGeneratePassword", js.FuncOf(generatePassword))
	js.Global().Set("wasmScoreStrength", js.FuncOf(scoreStrength))
	select {}
}

func generatePassword(_ js.Value, args []js.Value) any {
	if len(args) < 2 {
		return js.ValueOf("")
	}
	length := args[0].Int()
	opts := args[1]

	password, err := generator.Generate(length, generator.Options{
		Uppercase:        opts.Get("uppercase").Bool(),
		Lowercase:        opts.Get("lowercase").Bool(),
		Numbers:          opts.Get("numbers").Bool(),
		Symbols:          opts.Get("symbols").Bool(),
		ExcludeAmbiguous: opts.Get("excludeAmbiguous").Bool(),
	})
	if err != nil {
		return js.ValueOf("")
	}
	return js.ValueOf(password)
}

func scoreStrength(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return js.ValueOf(0)
	}
	return js.ValueOf(generator.Score(args[0].String()))
}
