package cors

import "net/http"

const (
	corsAllowOriginHeader  string = "Access-Control-Allow-Origin"
	corsAllowMethodsHeader string = "Access-Control-Allow-Methods"
	corsAllowHeadersHeader string = "Access-Control-Allow-Headers"
	corsAllowCredentials   string = "Access-Control-Allow-Credentials"
)

// middleware to handle CORS headers and OPTIONS requests
func CORSHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set(corsAllowOriginHeader, origin)
		}
		w.Header().Set(corsAllowCredentials, "true")
		w.Header().Set(corsAllowMethodsHeader, "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set(corsAllowHeadersHeader, "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
