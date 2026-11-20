<p align="center">
  <img src="icon.png" alt="Jumble Logo" width="21%">
</p>

# Jumble on StartOS

> Everything not listed in this document should behave the same as upstream
> Jumble. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[Jumble](https://github.com/CodyTseng/jumble) is a Nostr web client built around relays and relay sets. The package serves Jumble's web build from the server and adds a link-preview service of its own, off until the owner turns it on, so that link previews never go through `scout.jumble.social`.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Upstream publishes no container image, so the package builds one from its own `Dockerfile`, for x86_64 and aarch64.

- **Web app:** Jumble is cloned at its release tag (the build checks the tag's commit) and built with `npm run build`. The only build variable set is `VITE_LINK_PREVIEW_SERVER=/preview`. The bundle and its source maps are served by nginx (Alpine), with upstream's `nginx.conf`, its Content-Security-Policy included, plus the preview route below. `server_tokens` is off, so responses don't name the nginx version.
- **Link-preview service (`jumble-preview`):** a small Go program in this repo's `preview/` directory. For `GET /preview/?url=<page>` it fetches the page and returns `{title, description, image}` from its Open Graph, Twitter-card and `<title>` tags, in the shape Jumble expects from `scout.jumble.social`. With previews off it answers every request with an empty 404 and fetches nothing.

Two subcontainers run from the one image:

| Subcontainer | Runs | Listens on |
| --- | --- | --- |
| `web` | `nginx -g 'daemon off;'` | port 80 |
| `preview` | `jumble-preview`, as user `nobody` | `127.0.0.1:8081`, reachable only through nginx |

## Volume and Data Layout

One volume, `main`, holds only `store.json`, the owner's link-preview choice; no subcontainer mounts it. Jumble keeps accounts, keys, relay lists and settings in the visitor's browser (local storage and IndexedDB), so each browser has its own Jumble, and nothing a user does is stored on the server. The preview service keeps an in-memory cache of up to 2,000 results, six hours for a preview and ten minutes for a failed fetch, lost on restart.

## File Models

`store.json` on the `main` volume (JSON) holds one key, `linkPreviews`: absent until the owner runs **Link Previews**, then `true` or `false`. Only that action writes it, and a hand edit survives. Changing it restarts the service. `main.ts` passes it to the preview service as `PREVIEWS=on|off`, an environment variable read once at start. Absent counts as off. `nginx.conf` is baked into the image and the package writes no other configuration.

## Dependencies

None.

## Network Access and Interfaces

One interface serves both the web app and the preview route.

| Interface | id | Type | Port | Protocol | Serves |
| --- | --- | --- | --- | --- | --- |
| Web UI | `ui` | ui | 80 | HTTP | the Jumble web app, and `/preview/` |

**Outbound from the server.** Only the preview service connects out, and only while link previews are on. Anyone who can load Jumble's address can then make the server fetch a public web page, and that site sees the server's IP address (or that of the outbound gateway StartOS sends it through). That holds for visitors over Tor too, so on a server published over Tor or clearnet to hide its location, previews give the location away. The requests carry nothing of the visitor's: they are plain `GET`s to ports 80 or 443 with a fixed user agent and no cookies, headers or body the visitor controls. Before connecting it checks the address actually being dialled, on every redirect hop, and refuses loopback, private (RFC 1918, unique-local IPv6), link-local, CGNAT, documentation, benchmarking, reserved, NAT64, 6to4 and Teredo ranges, so it cannot be used to reach the server itself, StartOS's internal network or the LAN. It only connects to ports 80 and 443, follows at most five redirects, reads at most 1 MiB of a page, and stops at the end of `<head>`. Non-HTML responses return an empty preview. nginx limits `/preview/` to 10 requests per second per client (burst 50), keyed on the client address StartOS's proxy appends to `X-Forwarded-For` (a client-supplied value doesn't change it), and refuses with 403 any request whose `Sec-Fetch-Site` header isn't `same-origin`. That stops other websites from making their visitors' browsers trigger fetches; a client that sets the header itself is held only by the rate limit.

**Outbound from the browser.** Everything else Jumble does is the visitor's browser talking to third parties directly, as upstream:

- Nostr relays: by default `nos.lol`, `relay.primal.net`, `offchain.pub` and `relay.ditto.pub`, plus separate defaults for search, trending notes, direct messages and Nostr Connect. Users change them in the app.
- `fayan.jumble.social`: trust-score badges on profiles and people search.
- Only when a user turns them on or uses them: translation (`api.jumble.social`, or a LibreTranslate server they enter), media uploads (`nostr.build` by default, or a Blossom server such as `blossom.jumble.social`), "Login with Google" (`auth.njump.me` and its Pomegranate signing operators), embedded YouTube and X posts, and each relay's own favicon.

## Installation and First-Run Flow

The service starts serving as soon as it is installed, with link previews off, and raises the **Link Previews** task until the owner chooses. There is no admin account and no login gate: Jumble's sign-in is the visitor's own Nostr key, held in their browser or signer.

## Actions

The package has one action.

**Link Previews** turns the server's preview service on or off. Run it once after install: that clears the task. Run it again any time to change your mind.

- **What it changes:** `linkPreviews` in `store.json`. The service restarts, so Jumble is unreachable for a few seconds; open pages keep working once it's back.
- **Repeat safety:** idempotent.
- **When to leave it off:** when Jumble is published over Tor or a public domain to keep the server's IP private, or when anyone you don't trust can reach it: they can make the server fetch pages from its own IP address. With previews off, link cards stay empty for every visitor, whatever their in-app **Link previews** setting.

## Tasks

**Link Previews** (`important`) is raised at init while `store.json` has no `linkPreviews` choice, so on every fresh install and on a restore of a backup made before a choice. It doesn't block startup. Running **Link Previews**, with previews on or off, clears it for good: it only returns if `store.json` loses the key.

## Health Checks

Both checks test that the daemon is listening on its port, with a 10-second grace period after start. **Link Previews** is shown only while previews are on.

| Check | Probes | A failure means |
| --- | --- | --- |
| **Web Interface** (`web`) | nginx on port 80 | nginx did not start. Its log shows why; with a baked-in config this is a broken image, not something a user can fix. |
| **Link Previews** (`preview`) | `jumble-preview` on `127.0.0.1:8081` | the preview service exited. The app still works; link cards stay empty until it restarts. |

A healthy preview service can still return no preview for a given link: the site refused the fetch, timed out, served no metadata, redirected to a blocked address, or is an onion site, which the service does not reach.

## Backups and Restore

The `main` volume is copied whole (`ofVolumes`). It holds only the link-preview choice, which a restore brings back. Nothing else lives on the server. A user's accounts and settings live in their browser, tied to the address they opened Jumble on; on another server or address they sign in again.

## Limitations and Differences

What this package does differently from a stock Jumble deployment, and what it can't offer.

1. Link previews are off by default and never use `scout.jumble.social`. Turned on, they come from the server's own preview service: linked sites see the server's IP address (or the outbound gateway StartOS sends it through), and onion links get no preview.
2. Community mode (`VITE_COMMUNITY_RELAYS`, `VITE_COMMUNITY_RELAY_SETS`) is not available. Upstream fixes those relays at build time, so the package cannot set them per server.
3. The GIF picker is off: it needs a Klipy API key at build time.
4. Trust scores and people search still use `fayan.jumble.social`. Upstream hardcodes it and offers no self-hostable replacement.
5. Upstream's `docker-compose.yml` proxy sidecar is not shipped. Jumble no longer reads the variable it set.

---

## Quick Reference for AI Consumers

```yaml
package_id: jumble
image: built from Dockerfile (Jumble web build + nginx + jumble-preview)
architectures: [x86_64, aarch64]
subcontainers: [web, preview]
volumes:
  main: not mounted in any subcontainer (holds store.json)
file_models:
  - main/store.json
startos_managed_env_vars:
  - LISTEN
  - PREVIEWS
dependencies: none
interfaces:
  ui: { type: ui, port: 80 }
actions:
  - link-previews
tasks:
  - { action: link-previews, severity: important }
health_checks:
  - web
  - preview
```
