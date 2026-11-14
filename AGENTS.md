# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

- The SSRF guard lives in the dialer's `Control` hook, which sees the address actually connected to. Don't move it to a URL or DNS check before the request: that lets DNS rebinding and redirects through.
- Build the bundle with `VITE_LINK_PREVIEW_SERVER=/preview` (relative): an absolute URL would pin one of the server's addresses into every visitor's bundle.
