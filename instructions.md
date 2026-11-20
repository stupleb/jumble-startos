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

Link previews are off on every new installation, and stay off until you turn them on. Turning them on has two risks, because previews work for everyone who can open Jumble, not just you:

- **Anyone can learn your server's IP address.** Every site behind a previewed link sees it. A visitor picks the links, so a stranger can find out where your server is by opening a link to a site they run. That includes visitors over Tor.
- **Your server makes requests for strangers.** A visitor can have your server load web pages of their choosing, up to ten a second. Those requests come from your IP address, not theirs, so a site that blocks or reports them blocks or reports you.

Previews only reach public websites. They can't be used to reach devices on your home network or the services on your server.

Whether to turn them on depends on who can reach Jumble:

- **Only you and people you trust use Jumble, on your home network:** turning previews on is fine.
- **You publish Jumble over Tor or a public domain to keep your server's location private:** leave previews off.
- **You run Jumble as a public instance and don't mind your server's IP address being known:** turning previews on is fine.
- **You publish Jumble through a tunnel to keep your home IP private and want previews:** send Jumble's outbound traffic through that tunnel too. If you use the tunnel for another reason, there's nothing to change.

You can change your mind any time by running **Link Previews** again. Each person can also hide previews in their own browser, under **Settings** → **General** → **Link previews** in Jumble. That only affects their browser.

## Limitations

- Trust scores on profiles and people search are looked up on jumble.social's servers, as in every copy of Jumble.
- Translation, media uploads and "Login with Google" use outside services, and only when you turn them on or use them.
- Onion links get no preview, even with link previews on.
