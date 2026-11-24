package auth

import (
	"encoding/base64"
	"encoding/json"
	"testing"
	"time"
)

func TestGoogleIdentityChecks(t *testing.T) {
	g := googleSignIn{clientID: "test-client"}
	cases := []struct {
		name     string
		override map[string]any
		valid    bool
	}{
		{"verified", nil, true},
		{"string verification claim", map[string]any{"email_verified": "true"}, true},
		{"unverified email", map[string]any{"email_verified": false}, false},
		{"wrong nonce", map[string]any{"nonce": "other"}, false},
		{"wrong audience", map[string]any{"aud": "other"}, false},
		{"extra audience", map[string]any{"aud": []string{"test-client", "other"}}, false},
		{"wrong authorized party", map[string]any{"azp": "other"}, false},
		{"wrong issuer", map[string]any{"iss": "https://example.test"}, false},
		{"expired", map[string]any{"exp": 1}, false},
		{"missing subject", map[string]any{"sub": ""}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			now := time.Now()
			claims := map[string]any{
				"iss": "https://accounts.google.com", "sub": "subject", "aud": "test-client",
				"nonce": "nonce", "iat": now.Add(-time.Minute).Unix(), "exp": now.Add(time.Minute).Unix(),
				"email": "shopper@example.test", "email_verified": true,
			}
			for key, value := range tc.override {
				claims[key] = value
			}
			payload, err := json.Marshal(claims)
			if err != nil {
				t.Fatal(err)
			}
			header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","typ":"JWT"}`))
			raw := header + "." + base64.RawURLEncoding.EncodeToString(payload) + ".AA"
			// These are claim checks for a response from the direct token endpoint.
			identity, err := g.directTokenIdentity(raw, "nonce")
			if (err == nil) != tc.valid {
				t.Fatalf("valid=%v, error=%v", tc.valid, err)
			}
			if tc.valid && identity.Subject != "subject" {
				t.Fatalf("unexpected subject %q", identity.Subject)
			}
		})
	}
}
