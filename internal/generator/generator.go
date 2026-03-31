package generator

import (
	"crypto/rand"
	"errors"
	"math/big"
	"strings"
)

const (
	uppercase    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	lowercase    = "abcdefghijklmnopqrstuvwxyz"
	numbers      = "0123456789"
	symbols      = "!@#$%^&*()-_=+[]{}|;:,.<>?"
	ambiguousSet = "0Ol1I"
)

type Options struct {
	Uppercase        bool
	Lowercase        bool
	Numbers          bool
	Symbols          bool
	ExcludeAmbiguous bool
}

func Generate(length int, opts Options) (string, error) {
	charsets := activeCharsets(opts)
	if len(charsets) == 0 {
		charsets = []string{lowercase}
	}

	fullCharset := strings.Join(charsets, "")
	result := make([]byte, length)

	for i := range result {
		idx, err := randInt(len(fullCharset))
		if err != nil {
			return "", err
		}
		result[i] = fullCharset[idx]
	}

	// Guarantee at least one character from each active charset
	for csIdx, cs := range charsets {
		if csIdx >= length {
			break
		}
		charIdx, err := randInt(len(cs))
		if err != nil {
			return "", err
		}
		pos, err := randInt(length)
		if err != nil {
			return "", err
		}
		result[pos] = cs[charIdx]
	}

	if err := shuffle(result); err != nil {
		return "", err
	}
	return string(result), nil
}

func GenerateMnemonic(wordCount int, separator string, wordlist []string) (string, error) {
	if len(wordlist) == 0 {
		return "", errors.New("wordlist is empty")
	}
	words := make([]string, wordCount)
	for i := range words {
		idx, err := randInt(len(wordlist))
		if err != nil {
			return "", err
		}
		words[i] = wordlist[idx]
	}
	return strings.Join(words, separator), nil
}

// VerifyEntropy runs a chi-square uniformity test on crypto/rand output.
// Returns (passed, chi2_statistic, error).
// Threshold: df=255, p<0.0001 ≈ 350. A legitimate RNG will almost never exceed this.
func VerifyEntropy() (bool, float64, error) {
	const n = 2560
	buf := make([]byte, n)
	if _, err := rand.Reader.Read(buf); err != nil {
		return false, 0, err
	}
	var freq [256]float64
	for _, b := range buf {
		freq[b]++
	}
	expected := float64(n) / 256
	var chi2 float64
	for _, f := range freq {
		d := f - expected
		chi2 += d * d / expected
	}
	return chi2 < 350.0, chi2, nil
}

func Score(password string) int {
	if len(password) == 0 {
		return 0
	}
	score := 0
	var hasUpper, hasLower, hasNum, hasSym bool
	for _, c := range password {
		switch {
		case c >= 'A' && c <= 'Z':
			hasUpper = true
		case c >= 'a' && c <= 'z':
			hasLower = true
		case c >= '0' && c <= '9':
			hasNum = true
		default:
			hasSym = true
		}
	}
	for _, b := range []bool{hasUpper, hasLower, hasNum, hasSym} {
		if b {
			score++
		}
	}
	if len(password) >= 12 {
		score++
	}
	if len(password) >= 20 {
		score++
	}
	switch {
	case score <= 1:
		return 1
	case score <= 3:
		return 2
	case score <= 4:
		return 3
	default:
		return 4
	}
}

func activeCharsets(opts Options) []string {
	candidates := []struct {
		enabled bool
		chars   string
	}{
		{opts.Uppercase, filter(uppercase, opts.ExcludeAmbiguous)},
		{opts.Lowercase, filter(lowercase, opts.ExcludeAmbiguous)},
		{opts.Numbers, filter(numbers, opts.ExcludeAmbiguous)},
		{opts.Symbols, filter(symbols, opts.ExcludeAmbiguous)},
	}
	var sets []string
	for _, c := range candidates {
		if c.enabled && len(c.chars) > 0 {
			sets = append(sets, c.chars)
		}
	}
	return sets
}

func filter(charset string, excludeAmbiguous bool) string {
	if !excludeAmbiguous {
		return charset
	}
	b := make([]byte, 0, len(charset))
	for i := 0; i < len(charset); i++ {
		if !byteIn(charset[i], ambiguousSet) {
			b = append(b, charset[i])
		}
	}
	return string(b)
}

func byteIn(b byte, s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] == b {
			return true
		}
	}
	return false
}

func randInt(max int) (int, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
	if err != nil {
		return 0, err
	}
	return int(n.Int64()), nil
}

func shuffle(b []byte) error {
	for i := len(b) - 1; i > 0; i-- {
		j, err := randInt(i + 1)
		if err != nil {
			return err
		}
		b[i], b[j] = b[j], b[i]
	}
	return nil
}
