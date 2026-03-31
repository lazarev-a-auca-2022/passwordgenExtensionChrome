$env:GOOS    = "js"
$env:GOARCH  = "wasm"

go build -o extension/main.wasm ./cmd/wasm/
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$goroot = go env GOROOT
$src    = if (Test-Path "$goroot\misc\wasm\wasm_exec.js") {
    "$goroot\misc\wasm\wasm_exec.js"
} else {
    "$goroot\lib\wasm\wasm_exec.js"
}
Copy-Item $src extension\wasm_exec.js

Write-Host "Build complete." -ForegroundColor Green
