package auth

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type googleIdentity struct {
	Subject      string `bson:"subject"`
	Email        string `bson:"email"`
	GivenName    string `bson:"givenName"`
	FamilyName   string `bson:"familyName"`
	HostedDomain string `bson:"hostedDomain,omitempty"`
}

type googleClaims struct {
	jwt.RegisteredClaims
	Email           string          `json:"email"`
	Verified        json.RawMessage `json:"email_verified"`
	Nonce           string          `json:"nonce"`
	AuthorizedParty string          `json:"azp"`
	GivenName       string          `json:"given_name"`
	FamilyName      string          `json:"family_name"`
	HostedDomain    string          `json:"hd"`
}

var emailCollation = &options.Collation{Locale: "en", Strength: 2}

func (g googleSignIn) exchange(ctx context.Context, flow googleFlow, code string) (googleIdentity, error) {
	form := url.Values{
		"grant_type": {"authorization_code"}, "code": {code}, "code_verifier": {flow.GoogleVerifier},
		"client_id": {g.clientID}, "client_secret": {g.clientSecret}, "redirect_uri": {g.callbackURL},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(form.Encode()))
	if err != nil {
		return googleIdentity{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := g.httpClient.Do(req)
	if err != nil {
		return googleIdentity{}, err
	}
	defer resp.Body.Close()
	var result struct {
		IDToken string `json:"id_token"`
	}
	if resp.StatusCode != http.StatusOK || json.NewDecoder(io.LimitReader(resp.Body, 64<<10)).Decode(&result) != nil {
		return googleIdentity{}, errors.New("Google rejected the authorization code")
	}

	// Only tokens received directly from Google's fixed, TLS-validated token
	// endpoint enter here. Google OIDC allows issuer verification via that channel.
	return g.directTokenIdentity(result.IDToken, flow.Nonce)
}

func (g googleSignIn) directTokenIdentity(raw, nonce string) (googleIdentity, error) {
	var claims googleClaims
	parser := jwt.NewParser()
	token, _, err := parser.ParseUnverified(raw, &claims)
	if err != nil || token.Method.Alg() != jwt.SigningMethodRS256.Alg() ||
		jwt.NewValidator(jwt.WithExpirationRequired(), jwt.WithIssuedAt(), jwt.WithAudience(g.clientID)).Validate(&claims) != nil ||
		(claims.Issuer != "https://accounts.google.com" && claims.Issuer != "accounts.google.com") ||
		len(claims.Audience) != 1 || (claims.AuthorizedParty != "" && claims.AuthorizedParty != g.clientID) ||
		claims.Nonce != nonce || claims.IssuedAt == nil || claims.Subject == "" || len(claims.Subject) > 255 || (string(claims.Verified) != "true" && string(claims.Verified) != `"true"`) {
		return googleIdentity{}, errors.New("Google returned an invalid or unverified identity")
	}
	email := strings.TrimSpace(claims.Email)
	address, err := mail.ParseAddress(email)
	if err != nil || address.Address != email || len(email) > 254 {
		return googleIdentity{}, errors.New("Google did not return a valid email address")
	}
	return googleIdentity{
		Subject: claims.Subject, Email: email, GivenName: claims.GivenName, FamilyName: claims.FamilyName,
		HostedDomain: claims.HostedDomain,
	}, nil
}

func completeGoogleAccount(ctx context.Context, linkUserID string, identity googleIdentity) (user.User, error) {
	accounts := getCollection()
	if linkUserID != "" {
		filter := bson.M{
			"_id": linkUserID, "email": identity.Email,
			"$or": bson.A{bson.M{"googleSubject": bson.M{"$exists": false}}, bson.M{"googleSubject": identity.Subject}},
		}
		opts := options.FindOneAndUpdate().SetCollation(emailCollation).SetReturnDocument(options.After)
		var linked user.User
		err := accounts.FindOneAndUpdate(ctx, filter, bson.M{"$set": bson.M{"googleSubject": identity.Subject}}, opts).Decode(&linked)
		switch {
		case err == nil:
			return linked, nil
		case errors.Is(err, mongo.ErrNoDocuments):
			return user.User{}, errors.New("choose a Google account with the same email as your store account")
		case mongo.IsDuplicateKeyError(err):
			return user.User{}, errors.New("this Google account is already connected")
		default:
			log.Printf("could not link Google account: %v", err)
			return user.User{}, errors.New("could not connect Google right now")
		}
	}

	var account user.User
	subjectFilter := bson.M{"googleSubject": identity.Subject}
	err := accounts.FindOne(ctx, subjectFilter).Decode(&account)
	if err == nil {
		return account, nil
	}
	if !errors.Is(err, mongo.ErrNoDocuments) {
		return user.User{}, errors.New("could not load your account right now")
	}
	domain := identity.Email[strings.LastIndexByte(identity.Email, '@')+1:]
	if user.IsConfiguredAdminEmail(identity.Email) && !strings.EqualFold(domain, "gmail.com") && !strings.EqualFold(domain, identity.HostedDomain) {
		return user.User{}, errors.New("sign in with your store password, then connect Google under Profile → Security")
	}
	account = user.User{
		ID: uuid.NewString(), Email: identity.Email, FirstName: strings.TrimSpace(identity.GivenName),
		LastName: strings.TrimSpace(identity.FamilyName), GoogleSubject: identity.Subject,
		Role: RoleCustomer, Addresses: []user.Address{}, CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	if _, err := accounts.InsertOne(ctx, account); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			// A simultaneous signup with the same Google identity may have won.
			var existing user.User
			if accounts.FindOne(ctx, subjectFilter).Decode(&existing) == nil {
				return existing, nil
			}
			return user.User{}, errors.New("an account already uses this email. Sign in with your password, then connect Google under Profile → Security")
		}
		log.Printf("could not create Google account: %v", err)
		return user.User{}, errors.New("could not create your account right now")
	}
	return account, nil
}
