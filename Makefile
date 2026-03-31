.PHONY: build clean

WASM_OUT  := extension/main.wasm
WASM_EXEC := extension/wasm_exec.js

build:
	GOOS=js GOARCH=wasm go build -o $(WASM_OUT) ./cmd/wasm/
	@if [ -f "$$(go env GOROOT)/misc/wasm/wasm_exec.js" ]; then \
		cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" $(WASM_EXEC); \
	else \
		cp "$$(go env GOROOT)/lib/wasm/wasm_exec.js" $(WASM_EXEC); \
	fi

clean:
	rm -f $(WASM_OUT) $(WASM_EXEC)
