//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/lazarev-a-auca-2022/passwordgen/internal/generator"
)

func main() {
	js.Global().Set("wasmGeneratePassword", js.FuncOf(generatePassword))
	js.Global().Set("wasmScoreStrength", js.FuncOf(scoreStrength))
	js.Global().Set("wasmGenerateMnemonic", js.FuncOf(generateMnemonic))
	js.Global().Set("wasmVerifyEntropy", js.FuncOf(verifyEntropy))
	select {}
}

func generatePassword(_ js.Value, args []js.Value) any {
	if len(args) < 2 {
		return js.ValueOf("")
	}
	opts := args[1]
	password, err := generator.Generate(args[0].Int(), generator.Options{
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

func generateMnemonic(_ js.Value, args []js.Value) any {
	if len(args) < 3 {
		return js.ValueOf("")
	}
	jsArr := args[2]
	wordlist := make([]string, jsArr.Length())
	for i := range wordlist {
		wordlist[i] = jsArr.Index(i).String()
	}
	mnemonic, err := generator.GenerateMnemonic(args[0].Int(), args[1].String(), wordlist)
	if err != nil {
		return js.ValueOf("")
	}
	return js.ValueOf(mnemonic)
}

func verifyEntropy(_ js.Value, _ []js.Value) any {
	result := js.Global().Get("Object").New()
	ok, chi2, err := generator.VerifyEntropy()
	if err != nil {
		result.Set("ok", false)
		result.Set("chi2", 0.0)
		return result
	}
	result.Set("ok", ok)
	result.Set("chi2", chi2)
	return result
}
