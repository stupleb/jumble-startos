// jumble-preview answers Jumble's link-preview requests: GET /?url=<page>
// returns {"title","description","image"} read from the page's <head>.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"os"
	"strings"
	"sync"
	"syscall"
	"time"
	"unicode/utf8"

	"golang.org/x/net/html"
	"golang.org/x/net/html/charset"
)

const (
	maxBody         = 1 << 20
	maxRedirects    = 5
	maxConcurrent   = 8
	maxCacheEntries = 2000
	cacheTTL        = 6 * time.Hour
	failureTTL      = 10 * time.Minute
	userAgent       = "Mozilla/5.0 (compatible; jumble-startos link preview)"
)

var errBlocked = errors.New("destination not allowed")

var blockedPrefixes = func() []netip.Prefix {
	var ps []netip.Prefix
	for _, s := range []string{
		"0.0.0.0/8", "100.64.0.0/10", "192.0.0.0/24", "192.0.2.0/24", "198.18.0.0/15",
		"198.51.100.0/24", "203.0.113.0/24", "240.0.0.0/4",
		"64:ff9b::/96", "64:ff9b:1::/48", "2001::/32", "2001:db8::/32", "2002::/16", "fec0::/10",
	} {
		ps = append(ps, netip.MustParsePrefix(s))
	}
	return ps
}()

func allowedAddr(ap netip.AddrPort) bool {
	if ap.Port() != 80 && ap.Port() != 443 {
		return false
	}
	ip := ap.Addr().Unmap()
	if !ip.IsGlobalUnicast() || ip.IsPrivate() {
		return false
	}
	for _, p := range blockedPrefixes {
		if p.Contains(ip) {
			return false
		}
	}
	return true
}

func allowedURL(u *url.URL) bool {
	if u.Scheme != "http" && u.Scheme != "https" || u.Hostname() == "" || u.User != nil {
		return false
	}
	p := u.Port()
	return p == "" || p == "80" || p == "443"
}

// The check runs on the address actually dialled, after DNS, so a hostname
// that resolves to a private address is refused on every redirect hop.
var client = &http.Client{
	Timeout: 10 * time.Second,
	Transport: &http.Transport{
		Proxy: nil,
		DialContext: (&net.Dialer{
			Timeout: 5 * time.Second,
			Control: func(_, address string, _ syscall.RawConn) error {
				ap, err := netip.ParseAddrPort(address)
				if err != nil || !allowedAddr(ap) {
					return errBlocked
				}
				return nil
			},
		}).DialContext,
		TLSHandshakeTimeout:    5 * time.Second,
		ResponseHeaderTimeout:  5 * time.Second,
		MaxResponseHeaderBytes: 64 << 10,
		MaxIdleConns:           32,
		IdleConnTimeout:        30 * time.Second,
	},
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= maxRedirects || !allowedURL(req.URL) {
			return errBlocked
		}
		return nil
	},
}

type preview struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	Image       string `json:"image,omitempty"`
}

type cached struct {
	p       preview
	expires time.Time
}

var (
	cacheMu sync.Mutex
	cache   = map[string]cached{}
	slots   = make(chan struct{}, maxConcurrent)
)

func fromCache(key string) (preview, bool) {
	cacheMu.Lock()
	defer cacheMu.Unlock()
	c, ok := cache[key]
	if !ok || time.Now().After(c.expires) {
		return preview{}, false
	}
	return c.p, true
}

func store(key string, p preview, ttl time.Duration) {
	cacheMu.Lock()
	defer cacheMu.Unlock()
	if len(cache) >= maxCacheEntries {
		now := time.Now()
		for k, c := range cache {
			if now.After(c.expires) || len(cache) >= maxCacheEntries {
				delete(cache, k)
			}
		}
	}
	cache[key] = cached{p, time.Now().Add(ttl)}
}

func fetch(ctx context.Context, target *url.URL) (preview, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		return preview{}, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1")
	res, err := client.Do(req)
	if err != nil {
		return preview{}, err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return preview{}, errors.New(res.Status)
	}
	ct := res.Header.Get("Content-Type")
	if mt, _, _ := mime.ParseMediaType(ct); mt != "text/html" && mt != "application/xhtml+xml" {
		return preview{}, nil
	}
	body, err := charset.NewReader(io.LimitReader(res.Body, maxBody), ct)
	if err != nil {
		return preview{}, err
	}
	return parseHead(body, res.Request.URL), nil
}

func parseHead(r io.Reader, base *url.URL) preview {
	meta := map[string]string{}
	var title strings.Builder
	inTitle := false
	z := html.NewTokenizer(r)
	for {
		switch z.Next() {
		case html.ErrorToken:
			return build(meta, title.String(), base)
		case html.TextToken:
			if inTitle && title.Len() < 1024 {
				title.Write(z.Text())
			}
		case html.EndTagToken:
			name, _ := z.TagName()
			switch string(name) {
			case "title":
				inTitle = false
			case "head":
				return build(meta, title.String(), base)
			}
		case html.StartTagToken, html.SelfClosingTagToken:
			name, hasAttr := z.TagName()
			switch string(name) {
			case "body":
				return build(meta, title.String(), base)
			case "title":
				inTitle = true
			case "meta":
				var key, content string
				for hasAttr {
					var k, v []byte
					k, v, hasAttr = z.TagAttr()
					switch string(k) {
					case "property", "name":
						if key == "" {
							key = strings.ToLower(strings.TrimSpace(string(v)))
						}
					case "content":
						content = string(v)
					}
				}
				if _, seen := meta[key]; key != "" && !seen {
					meta[key] = content
				}
			}
		}
	}
}

func first(meta map[string]string, keys ...string) string {
	for _, k := range keys {
		if v := strings.TrimSpace(meta[k]); v != "" {
			return v
		}
	}
	return ""
}

func clip(s string, n int) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) <= n {
		return s
	}
	s = s[:n]
	for !utf8.ValidString(s) {
		s = s[:len(s)-1]
	}
	return s + "…"
}

func build(meta map[string]string, title string, base *url.URL) preview {
	p := preview{
		Title:       clip(first(meta, "og:title", "twitter:title"), 300),
		Description: clip(first(meta, "og:description", "twitter:description", "description"), 1000),
	}
	if p.Title == "" {
		p.Title = clip(title, 300)
	}
	if img := first(meta, "og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"); img != "" {
		if u, err := base.Parse(img); err == nil && (u.Scheme == "http" || u.Scheme == "https") {
			p.Image = u.String()
		}
	}
	return p
}

var previewsOn = os.Getenv("PREVIEWS") == "on"

func handle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if !previewsOn {
		reply(w, http.StatusNotFound, preview{})
		return
	}
	target, err := url.Parse(r.URL.Query().Get("url"))
	if err != nil || !allowedURL(target) {
		reply(w, http.StatusBadRequest, preview{})
		return
	}
	target.Fragment = ""
	key := target.String()
	p, ok := fromCache(key)
	if !ok {
		select {
		case slots <- struct{}{}:
		case <-r.Context().Done():
			return
		}
		p, err = fetch(r.Context(), target)
		<-slots
		if err != nil {
			if r.Context().Err() == nil {
				store(key, preview{}, failureTTL)
			}
			reply(w, http.StatusBadGateway, preview{})
			return
		}
		store(key, p, cacheTTL)
	}
	w.Header().Set("Cache-Control", "public, max-age=3600")
	reply(w, http.StatusOK, p)
}

func reply(w http.ResponseWriter, status int, p preview) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(p)
}

func main() {
	addr := os.Getenv("LISTEN")
	if addr == "" {
		addr = "127.0.0.1:8081"
	}
	srv := &http.Server{
		Addr:              addr,
		Handler:           http.HandlerFunc(handle),
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      20 * time.Second,
	}
	log.Printf("link preview service listening on %s, previews on: %t", addr, previewsOn)
	log.Fatal(srv.ListenAndServe())
}
