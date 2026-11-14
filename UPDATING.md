# Updating the upstream version

The package builds its own image from three sources: Jumble's web app, cloned from a release tag and built from source; the nginx base image that serves it; and the link-preview service in `preview/`, which is this package's own Go code and has only its Go toolchain and `golang.org/x/net` to track.

## Determining the upstream version

### Jumble

The pin is `JUMBLE_VERSION` (the tag) and `JUMBLE_COMMIT` (the commit that tag points at) in `Dockerfile`. The latest release:

```bash
gh release view -R CodyTseng/jumble --json tagName -q .tagName
```

### nginx

`FROM docker.io/library/nginx:<minor>-alpine` in `Dockerfile` tracks the current stable minor line. The stable minor is the even one listed at <https://nginx.org/en/download.html>.

### Build toolchains and preview dependencies

- Node: the `node:<version>-alpine` tag in `Dockerfile` follows the `FROM` line of upstream's own `Dockerfile` at the new tag (and its `.nvmrc`).
- Go: `golang:<minor>-alpine` in `Dockerfile` and the `go` line in `preview/go.mod` follow the current Go release.
- `golang.org/x/net` in `preview/go.mod`: `go list -m -u golang.org/x/net` from `preview/`.

## Applying the bump

### Jumble

1. Set `JUMBLE_VERSION` to the new tag and `JUMBLE_COMMIT` to `git ls-remote https://github.com/CodyTseng/jumble.git refs/tags/<tag>` (the build fails if they disagree).
2. Diff upstream's `nginx.conf` between the old and new tag and carry any change into this repo's `nginx.conf`. Ours is upstream's plus the `limit_req_zone`, `server_tokens`, `real_ip` and `location = /preview/` lines, the last with its `Sec-Fetch-Site` check.
3. Check that `src/services/web.service.ts` still requests `${LINK_PREVIEW_SERVER}/?url=` and reads `title`, `description` and `image`, and that `src/constants.ts` still reads `VITE_LINK_PREVIEW_SERVER`. If either moved, the preview service or the build variable has to follow.
4. Update the version in `startos/versions/current.ts` to the tag without its `v` (`v26.11.1` → `26.11.1:0`).

### nginx

Change the minor in the `FROM` line. Nothing else depends on it.

### Build toolchains and preview dependencies

Change the image tags in `Dockerfile`. For Go and `x/net`, edit `preview/go.mod` and regenerate `go.sum` without a local Go install:

```bash
docker run --rm -v "$PWD/preview":/src -w /src docker.io/library/golang:<minor>-alpine sh -c 'go get golang.org/x/net@latest && go mod tidy'
```
