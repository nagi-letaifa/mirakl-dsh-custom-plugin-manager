# mirakl-dsh-custom-plugin-manager

Adds **Settings › Custom plugins** to the DSH Web GUI. The page lists every custom
(non-official) package installed in the current profile (the profile's
`package.json` dependencies), shows its installed version, checks whether a newer
version exists remotely and offers to install it.

| Install source | Remote check | Update |
|---|---|---|
| `link:` / `file:` directory inside a Git checkout | `git fetch`, then the `package.json` version on the upstream branch (and new commits touching the package) | `git pull --ff-only` in the checkout, then an HMR profile reconciliation: changed plugins are replaced live. Every plugin of the same checkout is updated together; the page says so before confirming. |
| npm registry | `latest` dist-tag of the configured registry | Plugin Manager removal + installation of `name@latest` (bundles only) |
| GitHub git spec | remote `package.json` (via `gh api`, else raw.githubusercontent.com) | Plugin Manager removal + reinstallation (bundles only) |
| tarball / other | not checkable | — |

A checkout with uncommitted changes is never pulled. For github.com remotes,
git runs with the GitHub CLI sign-in (`gh auth git-credential`) when `gh` is
signed in, without changing the global git configuration (`useGhCredentials`).

After an update the browser half of updated plugins loads on the next page
reload (the page offers a **Reload page** button). A result with
`restart-required` needs a DSH restart.

The agent gets a read-only `list_custom_plugins` tool. Updating stays a user
action, like package installation through `plugin_manager`.

## Config (`cordis.patch.yml`)

- `gitPath`, `ghPath` — binaries.
- `useGhCredentials` (default `true`).
- `timeoutMs` (default `60000`) — per git/gh/registry call.
- `cacheMinutes` (default `10`) — remote results are reused this long unless **Check for updates** is pressed.
- `includeOfficial` (default `false`) — also list official `@deepseek-ai` packages.
