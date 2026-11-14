# Jumble

## Documentation

- [Jumble README](https://github.com/CodyTseng/jumble/blob/master/README.md) — upstream's overview of Jumble and its options

## What you get on StartOS

One interface, **Web UI**: Jumble itself, served from your server. Open it in any browser.

Your Nostr account, relays and settings are kept in the browser you use, not on the server. Each browser and each address you open Jumble on starts empty, and you sign in on each one. Anyone who can reach the Web UI gets their own Jumble the same way; they never see yours.

## Getting set up

1. Run **Link Previews** and choose whether your server should fetch link previews. See **Link previews** below before you decide. Until you choose, previews are off and the task stays on the service page.
2. Open the **Web UI**.
3. Sign in with a browser signing extension, a remote signer (bunker), or your private key, or create a new account. An extension or a remote signer keeps your private key out of the page.
4. Jumble starts with a set of public relays. To read and post through relays you run yourself, such as a relay on this server, add their addresses under **Settings** → **Relays** in Jumble.

## Link previews

With link previews on, your server fetches the title and image for links in the notes you read, and Jumble shows them as cards. The list of links you view never goes to Jumble's own preview service. With them off, links show as plain links.

Turning them on has a cost. The sites behind those links see your server's IP address. And anyone who can open Jumble can use it to make your server request web pages of their choosing, so a stranger can learn where your server is just by opening a link to a site they run. That includes visitors over Tor.

- **Only you and people you trust use Jumble, on your home network:** turning previews on is fine.
- **You publish Jumble over Tor or a public domain to keep your server's location private:** leave previews off.
- **You publish Jumble through a tunnel to keep your home IP private and want previews:** send Jumble's outbound traffic through that tunnel too. If you use the tunnel for another reason, there's nothing to change.

You can change your mind any time by running **Link Previews** again. Each person can also hide previews in their own browser, under **Settings** → **General** → **Link previews** in Jumble. That only affects their browser.

## Limitations

- Trust scores on profiles and people search are looked up on jumble.social's servers, as in every copy of Jumble.
- Translation, media uploads and "Login with Google" use outside services, and only when you turn them on or use them.
- Onion links get no preview, even with link previews on.
