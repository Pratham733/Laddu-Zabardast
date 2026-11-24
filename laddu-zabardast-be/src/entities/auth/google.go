package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"html"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	googleCallbackPath = "/auth/google/callback"
	webGoogleReturn    = "/google-sign-in"
	nativeGoogleReturn = "ladduzabardast://oauth/google"
)

type googleSignIn struct {
	clientID, clientSecret, callbackURL, webOrigin string
	httpClient                                     *http.Client
}

type googleFlow struct {
	AutomaticReturn bool            `bson:"automaticReturn,omitempty"`
	ID              string          `bson:"_id"`
	Status          string          `bson:"status"`
	Challenge       string          `bson:"challenge"`
	GoogleVerifier  string          `bson:"googleVerifier"`
	Nonce           string          `bson:"nonce"`
	Platform        string          `bson:"platform"`
	LinkUserID      string          `bson:"linkUserId,omitempty"`
	ExpiresAt       time.Time       `bson:"expiresAt"`
	Identity        *googleIdentity `bson:"identity,omitempty"`
}

type googleStartRequest struct {
	AutomaticReturn bool   `json:"automaticReturn,omitempty"`
	Platform        string `json:"platform"`
	Challenge       string `json:"challenge"`
	Link            bool   `json:"link"`
}

type googleCompleteRequest struct {
	State    string `json:"state"`
	Code     string `json:"code"`
	Verifier string `json:"verifier"`
}

type googleStartResponse struct {
	URL   string `json:"url"`
	State string `json:"state"`
}

type googleStatus struct {
	Enabled bool `json:"enabled"`
}

func RegisterGoogle(ctx context.Context, r *mux.Router) error {
	g := googleSignIn{
		clientID:     strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID")),
		clientSecret: strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_SECRET")),
		callbackURL:  strings.TrimSpace(os.Getenv("GOOGLE_CALLBACK_URL")),
		webOrigin:    strings.TrimSpace(os.Getenv("GOOGLE_WEB_ORIGIN")),
		httpClient: &http.Client{
			Timeout:       10 * time.Second,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse },
		},
	}
	enabled := g.clientID != "" || g.clientSecret != ""
	if enabled {
		if err := g.validateConfig(); err != nil {
			return err
		}
		if err := ensureGoogleIndexes(ctx); err != nil {
			return fmt.Errorf("prepare Google sign-in indexes: %w", err)
		}
		r.HandleFunc("/auth/google/start", googleJSON(utils.WithBodyAndResponse(g.start))).Methods("POST")
		r.HandleFunc(googleCallbackPath, g.callback).Methods("GET")
		r.HandleFunc("/auth/google/complete", googleJSON(utils.WithBodyAndResponse(g.complete))).Methods("POST")
	}
	r.HandleFunc("/auth/google/status", utils.WithResponse(func(w http.ResponseWriter, _ *http.Request) (googleStatus, error) {
		googleNoCache(w)
		return googleStatus{Enabled: enabled}, nil
	})).Methods("GET")
	return nil
}

func (g googleSignIn) validateConfig() error {
	if g.clientID == "" || g.clientSecret == "" || g.callbackURL == "" || g.webOrigin == "" {
		return errors.New("set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL and GOOGLE_WEB_ORIGIN together")
	}
	redirect, err := googleHTTPURL(g.callbackURL)
	if err != nil || redirect.Path != googleCallbackPath || (config.AppConfig.Production && redirect.Scheme != "https") {
		return errors.New("GOOGLE_CALLBACK_URL must be an HTTPS URL (or local HTTP) ending in " + googleCallbackPath)
	}
	origin, err := googleHTTPURL(g.webOrigin)
	if err != nil || origin.Path != "" || (config.AppConfig.Production && origin.Scheme != "https") {
		return errors.New("GOOGLE_WEB_ORIGIN must be an HTTPS origin (or local HTTP) without a path or trailing slash")
	}
	return nil
}

func googleHTTPURL(value string) (*url.URL, error) {
	u, err := url.Parse(value)
	if err != nil || u.Hostname() == "" || u.User != nil || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" {
		return nil, errors.New("invalid URL")
	}
	host := u.Hostname()
	if u.Scheme != "https" && !(u.Scheme == "http" && (host == "localhost" || host == "127.0.0.1" || host == "::1")) {
		return nil, errors.New("HTTPS is required")
	}
	return u, nil
}

func googleNoCache(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")
}

func googleJSON(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		googleNoCache(w)
		r.Body = http.MaxBytesReader(w, r.Body, 4096)
		handler(w, r)
	}
}

func googleFlows() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, "googleAuthFlows")
}

func ensureGoogleIndexes(ctx context.Context) error {
	_, err := googleFlows().Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "expiresAt", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(0),
	})
	if err != nil {
		return err
	}
	_, err = getCollection().Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetName("auth_email_unique").SetUnique(true).SetCollation(emailCollation)},
		{Keys: bson.D{{Key: "googleSubject", Value: 1}}, Options: options.Index().SetName("auth_google_subject_unique").SetUnique(true).SetSparse(true)},
	})
	return err
}

func oauthSecret() string {
	var value [32]byte
	_, _ = rand.Read(value[:]) // crypto/rand always fills the buffer or terminates the process.
	return base64.RawURLEncoding.EncodeToString(value[:])
}

func validOAuthSecret(value string) bool {
	if len(value) != 43 {
		return false
	}
	decoded, err := base64.RawURLEncoding.Strict().DecodeString(value)
	return err == nil && len(decoded) == 32
}

func oauthDigest(value string) string {
	sum := sha256.Sum256([]byte(value))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func (g googleSignIn) start(w http.ResponseWriter, r *http.Request, req googleStartRequest) (googleStartResponse, error) {
	googleNoCache(w)
	if !validOAuthSecret(req.Challenge) || (req.Platform != "web" && req.Platform != "android" && req.Platform != "ios") {
		return googleStartResponse{}, errors.New("invalid Google sign-in request")
	}
	if req.Platform == "web" && r.Header.Get("Origin") != g.webOrigin {
		return googleStartResponse{}, errors.New("open the store at its configured address before signing in with Google")
	}

	flow := googleFlow{
		ID: oauthSecret(), Status: "pending", Challenge: req.Challenge, GoogleVerifier: oauthSecret(),
		Nonce: oauthSecret(), Platform: req.Platform, AutomaticReturn: req.AutomaticReturn, ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	if req.Link {
		account, err := googleLinkAccount(r, req.Platform)
		if err != nil {
			return googleStartResponse{}, err
		}
		flow.LinkUserID = account.ID
	}
	if _, err := googleFlows().InsertOne(r.Context(), flow); err != nil {
		log.Printf("could not create Google sign-in flow: %v", err)
		return googleStartResponse{}, errors.New("could not start Google sign-in")
	}
	params := url.Values{
		"client_id": {g.clientID}, "redirect_uri": {g.callbackURL}, "response_type": {"code"},
		"scope": {"openid email profile"}, "prompt": {"select_account"},
		"state": {flow.ID}, "nonce": {flow.Nonce}, "code_challenge": {oauthDigest(flow.GoogleVerifier)}, "code_challenge_method": {"S256"},
	}
	return googleStartResponse{URL: "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode(), State: flow.ID}, nil
}

func googleLinkAccount(r *http.Request, platform string) (user.User, error) {
	if platform != "web" && !strings.HasPrefix(r.Header.Get("Authorization"), "Bearer ") {
		return user.User{}, errors.New("sign in again before connecting Google")
	}
	return user.AuthenticatedUser(r)
}

func (g googleSignIn) callback(w http.ResponseWriter, r *http.Request) {
	googleNoCache(w)
	query := r.URL.Query()
	state := query.Get("state")
	if !validOAuthSecret(state) {
		http.Error(w, "Google sign-in expired. Return to the store and try again.", http.StatusBadRequest)
		return
	}
	filter := bson.M{"_id": state, "status": "pending", "expiresAt": bson.M{"$gt": time.Now()}}
	var flow googleFlow
	err := googleFlows().FindOneAndUpdate(r.Context(), filter, bson.M{"$set": bson.M{"status": "exchanging"}}).Decode(&flow)
	if err != nil {
		http.Error(w, "Google sign-in expired or was already used. Return to the store and try again.", http.StatusBadRequest)
		return
	}
	if query.Get("error") == "access_denied" {
		g.returnToApp(w, r, flow, "", "cancelled")
		return
	}
	code := query.Get("code")
	if code == "" || len(code) > 2048 {
		g.returnToApp(w, r, flow, "", "failed")
		return
	}
	identity, err := g.exchange(r.Context(), flow, code)
	if err != nil {
		log.Printf("Google sign-in exchange failed: %v", err)
		g.returnToApp(w, r, flow, "", "failed")
		return
	}

	handoff := oauthSecret()
	result, err := googleFlows().UpdateOne(r.Context(), bson.M{"_id": state, "status": "exchanging"}, bson.M{
		"$set":   bson.M{"status": "ready", "identity": identity, "handoff": oauthDigest(handoff), "expiresAt": time.Now().Add(3 * time.Minute)},
		"$unset": bson.M{"googleVerifier": "", "nonce": ""},
	})
	if err != nil || result.MatchedCount == 0 {
		g.returnToApp(w, r, flow, "", "failed")
		return
	}
	g.returnToApp(w, r, flow, handoff, "")
}

func (g googleSignIn) returnToApp(w http.ResponseWriter, r *http.Request, flow googleFlow, code, failure string) {
	params := url.Values{"state": {flow.ID}}
	if failure != "" {
		params.Set("error", failure)
	} else {
		params.Set("code", code)
	}
	if flow.Platform == "web" {
		http.Redirect(w, r, g.webOrigin+webGoogleReturn+"#"+params.Encode(), http.StatusSeeOther)
		return
	}
	target := nativeGoogleReturn + "?" + params.Encode()
	if flow.AutomaticReturn {
		http.Redirect(w, r, target, http.StatusSeeOther)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'")
	fmt.Fprintf(w, `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Return to Laddu Zabardast</title><body style="font:1.125rem system-ui;max-width:28rem;margin:15vh auto;padding:0 1rem"><h1>Return to the app</h1><p><a style="display:inline-block;padding:0.8em 1em;background:#c2410c;color:#fff;border-radius:0.65em" href="%s">Open Laddu Zabardast</a></p></body></html>`, html.EscapeString(target))
}

func (g googleSignIn) complete(w http.ResponseWriter, r *http.Request, req googleCompleteRequest) (*AuthResponsePacket, error) {
	googleNoCache(w)
	if !validOAuthSecret(req.State) || !validOAuthSecret(req.Code) || !validOAuthSecret(req.Verifier) {
		return nil, errors.New("invalid Google sign-in")
	}
	filter := bson.M{
		"_id": req.State, "status": "ready", "expiresAt": bson.M{"$gt": time.Now()},
		"challenge": oauthDigest(req.Verifier), "handoff": oauthDigest(req.Code),
	}
	var flow googleFlow
	if err := googleFlows().FindOne(r.Context(), filter).Decode(&flow); err != nil {
		return nil, errors.New("Google sign-in expired or was already used. Please try again.")
	}
	if flow.Platform == "web" && r.Header.Get("Origin") != g.webOrigin {
		return nil, errors.New("open the store at its configured address before signing in with Google")
	}
	if flow.LinkUserID != "" {
		account, err := googleLinkAccount(r, flow.Platform)
		if err != nil || account.ID != flow.LinkUserID {
			return nil, errors.New("sign in to the original account before connecting Google")
		}
		if flow.Identity == nil || !strings.EqualFold(account.Email, flow.Identity.Email) {
			return nil, errors.New("choose a Google account with the same email as your store account")
		}
	}
	if err := googleFlows().FindOneAndDelete(r.Context(), filter).Decode(&flow); err != nil || flow.Identity == nil {
		return nil, errors.New("Google sign-in expired or was already used. Please try again.")
	}

	account, err := completeGoogleAccount(r.Context(), flow.LinkUserID, *flow.Identity)
	if err != nil {
		return nil, err
	}
	token, err := utils.GenerateToken(account.ID, account.Email)
	if err != nil {
		return nil, errors.New("could not create your session")
	}
	if flow.Platform == "web" {
		http.SetCookie(w, &http.Cookie{
			Name: utils.AuthToken, Value: token, Path: "/", HttpOnly: true,
			Secure: strings.HasPrefix(g.callbackURL, "https://"), SameSite: http.SameSiteLaxMode,
			Expires: time.Now().Add(7 * 24 * time.Hour),
		})
	}
	return &AuthResponsePacket{User: user.BuildUserResponse(account), Token: token, Message: "Signed in with Google"}, nil
}
