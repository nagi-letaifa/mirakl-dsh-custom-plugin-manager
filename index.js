/**
 * Custom plugin manager — Host half.
 *
 * Lists every custom (non-official) package installed in the current profile,
 * reads its installed version, checks whether a newer version exists remotely
 * and updates it on request:
 *
 *   - linked / file packages inside a Git checkout: `git fetch`, then compare the
 *     package.json version on the upstream branch; update = `git pull --ff-only`
 *     followed by an HMR profile reconciliation (changed plugins are replaced live).
 *   - registry packages: compare with the registry's `latest` dist-tag; update =
 *     Plugin Manager remove + install of `name@latest` (bundles only).
 *   - GitHub git specs: compare with the remote package.json (through `gh api`
 *     when available); update = Plugin Manager remove + reinstall (bundles only).
 *
 * GitHub remotes can be fetched with the GitHub CLI sign-in (`gh auth
 * git-credential`) without touching the user's global git configuration.
 *
 * Authenticated routes on the shared /api channel (prefix /api/miraklCustomPlugins):
 *   GET  list              installed plugins with the last known remote state
 *   POST check  { force }  check remotes (cached for `cacheMinutes` unless forced)
 *   POST update { name }   update one plugin, returns the outcome and the new list
 *   GET  icon?name=…       the package's exported icon
 *
 * Agent tool: `list_custom_plugins` (read-only). Updating stays a user action in
 * Settings › Custom plugins, like package installation through plugin_manager.
 */
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadDshModule(specifier) {
  try {
    return await import(specifier);
  } catch {
    const entry = realpathSync(process.argv[1]);
    const resolved = createRequire(entry).resolve(specifier);
    return await import(pathToFileURL(resolved.replace(/index\.cjs$/, 'index.mjs')).href);
  }
}

const z = (await loadDshModule('@deepseek-ai/schemastery')).default;
const { defineTool } = await loadDshModule('@deepseek-ai/dsh-tools');

export const name = 'mirakl-dsh-custom-plugin-manager';

export const Config = z.object({
  gitPath: z.string().default('git').description('git binary (name on PATH or absolute path).'),
  ghPath: z.string().default('gh').description('GitHub CLI binary, used for GitHub credentials and remote package.json reads.'),
  useGhCredentials: z.boolean().default(true).description('Use the GitHub CLI sign-in (gh auth git-credential) for git fetch/pull on github.com remotes.'),
  timeoutMs: z.number().min(2000).max(300000).default(60000).description('Timeout per git/gh/registry call, in milliseconds.'),
  cacheMinutes: z.number().min(0).max(1440).default(10).description('How long a remote check result is reused before checking again (0 = always check).'),
  includeOfficial: z.boolean().default(false).description('Also list official @deepseek-ai bundles installed in the profile.'),
});

export const inject = ['connection', 'pluginManager', 'profileContext', 'tools'];

const ROUTE = '/api/miraklCustomPlugins';
const ICON_TYPES = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const ICON_MAX = 256 * 1024;

const message = (error) => (error instanceof Error ? error.message : String(error));
const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const readJson = (file) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return undefined; } };
const real = (p) => { try { return realpathSync(p); } catch { return undefined; } };
const posix = (p) => p.split(sep).join('/');
const inside = (parent, child) => { const r = relative(parent, child); return r === '' || (!r.startsWith('..') && !isAbsolute(r)); };

// ------------------------------------------------------------------ versions

function parseVersion(value) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(String(value ?? '').trim());
  return m ? { core: [+m[1], +m[2], +m[3]], pre: m[4] ? m[4].split('.') : [] } : undefined;
}

/** Semver precedence: >0 when a is newer than b, 0 when equal, NaN when not comparable. */
export function compareVersions(a, b) {
  const A = parseVersion(a);
  const B = parseVersion(b);
  if (!A || !B) return a === b ? 0 : NaN;
  for (let i = 0; i < 3; i++) if (A.core[i] !== B.core[i]) return A.core[i] - B.core[i];
  if (!A.pre.length || !B.pre.length) return (A.pre.length ? -1 : 0) + (B.pre.length ? 1 : 0);
  for (let i = 0; i < Math.max(A.pre.length, B.pre.length); i++) {
    const x = A.pre[i];
    const y = B.pre[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) return +x - +y;
    if (nx) return -1;
    if (ny) return 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

// ------------------------------------------------------------------ specs

/** Classify a profile dependency spec in pnpm's vocabulary. */
function classifySpec(spec) {
  const s = String(spec ?? '').trim();
  if (/^(link|file):/.test(s)) return 'path';
  if (/^(\.{0,2}\/|~\/|[A-Za-z]:[\\/])/.test(s)) return 'path';
  if (/^(git\+|git:|github:|gitlab:|bitbucket:|ssh:)/.test(s) || /^[\w.-]+@[\w.-]+:/.test(s) || /\.git(#.*)?$/.test(s)) return 'git';
  if (/^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/#]+(#.*)?$/.test(s)) return 'git';
  if (/^[\w.-]+\/[\w.-]+(#.*)?$/.test(s) && !s.startsWith('@')) return 'git'; // owner/repo shorthand
  if (/^https?:\/\//.test(s)) return 'tarball';
  return 'registry';
}

/** owner, repo and ref of a GitHub git spec, when it names one. */
function githubOf(spec) {
  const s = String(spec ?? '').trim();
  let m = /^github:([^/]+)\/([^#]+?)(?:\.git)?(?:#(.+))?$/.exec(s)
    || /github\.com[/:]([^/]+)\/([^#/]+?)(?:\.git)?(?:#(.+))?$/.exec(s)
    || (!s.startsWith('@') && /^([\w.-]+)\/([\w.-]+?)(?:#(.+))?$/.exec(s));
  if (!m) return undefined;
  let ref = m[3];
  if (ref && /^semver:/.test(ref)) ref = undefined;
  return { owner: m[1], repo: m[2], ref };
}

function githubRemote(url) {
  const m = /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(String(url ?? ''));
  return m ? { owner: m[1], repo: m[2] } : undefined;
}

// ------------------------------------------------------------------ plugin

export function apply(ctx, config) {
  const logger = ctx.logger?.(name) ?? console;
  const cfg = () => {
    const read = (k, d) => { const v = config?.[k]; return v === undefined || v === null || v === '' ? d : v; };
    return {
      gitPath: read('gitPath', 'git'),
      ghPath: read('ghPath', 'gh'),
      useGhCredentials: read('useGhCredentials', true) !== false,
      timeoutMs: Number(read('timeoutMs', 60000)) || 60000,
      cacheMs: Math.max(0, Number(read('cacheMinutes', 10))) * 60_000,
      includeOfficial: read('includeOfficial', false) === true,
    };
  };

  const abort = new AbortController();
  ctx.effect(() => () => abort.abort(), `${name}: abort`);

  /** Remote results by package name: { at, remote }. */
  const remoteCache = new Map();
  let lastCheckAt = null;
  let busy = null; // { name, startedAt }
  let checking = null; // in-flight check promise

  function run(cmd, args, { cwd, env, timeout } = {}) {
    return new Promise((resolvePromise) => {
      execFile(cmd, args, {
        cwd,
        timeout: timeout ?? cfg().timeoutMs,
        maxBuffer: 8 * 1024 * 1024,
        signal: abort.signal,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GH_NO_UPDATE_NOTIFIER: '1', GH_PROMPT_DISABLED: '1', ...env },
      }, (error, stdout, stderr) => {
        resolvePromise({
          code: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
          error: error ? (error.code === 'ENOENT' ? `${cmd} is not installed` : (String(stderr || '').trim() || error.message)) : undefined,
        });
      });
    });
  }

  let ghReady;
  async function ghAvailable() {
    if (ghReady === undefined) {
      ghReady = run(cfg().ghPath, ['auth', 'status', '--hostname', 'github.com'], { timeout: 15000 }).then((r) => r.code === 0);
      ghReady.then((ok) => { if (!ok) setTimeout(() => { ghReady = undefined; }, 60_000); });
    }
    return ghReady;
  }

  async function git(repo, args, { network = false, remoteUrl } = {}) {
    const c = cfg();
    const pre = [];
    if (network && c.useGhCredentials && githubRemote(remoteUrl) && await ghAvailable()) {
      const gh = /[\s"']/.test(c.ghPath) ? JSON.stringify(c.ghPath) : c.ghPath;
      pre.push('-c', 'credential.helper=', '-c', `credential.helper=!${gh} auth git-credential`);
    }
    return run(c.gitPath, [...pre, '-C', repo, ...args]);
  }
  const gitOut = async (repo, args) => { const r = await git(repo, args); return r.code === 0 ? r.stdout.trim() : undefined; };

  // -------------------------------------------------------------- inventory

  function packageDirOf(pkgName, spec, profileDir) {
    const s = String(spec ?? '');
    const m = /^(?:link|file):(.*)$/.exec(s);
    if (m || classifySpec(s) === 'path') {
      let p = m ? m[1] : s;
      if (p.startsWith('~/')) p = join(homedir(), p.slice(2));
      const dir = resolve(profileDir, p);
      if (existsSync(join(dir, 'package.json'))) return real(dir) ?? dir;
    }
    const installed = join(profileDir, 'node_modules', ...pkgName.split('/'));
    return real(installed) ?? installed;
  }

  function readMeta(dir, pkg) {
    const meta = {};
    const localeDir = join(dir, 'locale');
    try {
      for (const file of readdirSync(localeDir)) {
        if (!file.endsWith('.json')) continue;
        const m = readJson(join(localeDir, file))?.meta;
        if (m && (m.title || m.description)) meta[file.slice(0, -5)] = { title: m.title, description: m.description };
      }
    } catch { /* no locale */ }
    if (!meta.en) meta.en = { title: undefined, description: pkg?.description };
    return meta;
  }

  function iconPathOf(dir, pkg) {
    const candidates = [];
    if (typeof pkg?.icon === 'string') candidates.push(pkg.icon);
    const exp = pkg?.exports?.['./icon'];
    if (typeof exp === 'string') candidates.push(exp);
    else if (exp && typeof exp.default === 'string') candidates.push(exp.default);
    for (const c of candidates) {
      const file = resolve(dir, c);
      const realFile = real(file);
      if (!realFile || !inside(dir, realFile) || !ICON_TYPES[extname(realFile).toLowerCase()]) continue;
      try { if (statSync(realFile).size <= ICON_MAX) return realFile; } catch { /* skip */ }
    }
    return undefined;
  }

  const repoCache = new Map(); // dir -> repo info promise (per inventory)
  async function repoOf(dir) {
    const root = await gitOut(dir, ['rev-parse', '--show-toplevel']);
    if (!root) return undefined;
    const rootReal = real(root) ?? root;
    if (!repoCache.has(rootReal)) {
      repoCache.set(rootReal, (async () => {
        const [branch, upstream, head] = await Promise.all([
          gitOut(rootReal, ['rev-parse', '--abbrev-ref', 'HEAD']),
          gitOut(rootReal, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
          gitOut(rootReal, ['rev-parse', '--short', 'HEAD']),
        ]);
        const remoteName = upstream ? upstream.split('/')[0] : await gitOut(rootReal, ['config', '--get', `branch.${branch}.remote`]);
        const remoteUrl = remoteName ? await gitOut(rootReal, ['remote', 'get-url', remoteName]) : undefined;
        return { root: rootReal, branch, upstream, head, remoteName, remoteUrl: remoteUrl?.replace(/\/\/[^@/]+@/, '//') };
      })());
    }
    return repoCache.get(rootReal);
  }

  /** Installed custom plugins with the last known remote state. */
  async function inventory() {
    const profileDir = ctx.profileContext.dir;
    const manifest = readJson(join(profileDir, 'package.json')) ?? {};
    const deps = { ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) };
    const selected = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles : [];
    let bundles = [];
    try { bundles = await ctx.pluginManager.listBundles(); } catch (error) { logger.warn?.(`listBundles failed: ${message(error)}`); }
    const bundleByName = new Map(bundles.map((b) => [b.name, b]));
    const includeOfficial = cfg().includeOfficial;
    repoCache.clear();

    const entries = [];
    for (const [pkgName, spec] of Object.entries(deps)) {
      const bundle = bundleByName.get(pkgName);
      if (!includeOfficial && (bundle?.official || pkgName.startsWith('@deepseek-ai/'))) continue;
      const kind = classifySpec(spec);
      const dir = packageDirOf(pkgName, spec, profileDir);
      const pkg = readJson(join(dir, 'package.json'));
      const isBundle = Boolean(pkg?.dsh?.bundle?.patch);
      const entry = {
        name: pkgName,
        version: pkg?.version ?? bundle?.version ?? null,
        description: pkg?.description ?? bundle?.description ?? '',
        meta: pkg ? readMeta(dir, pkg) : {},
        hasIcon: Boolean(pkg && iconPathOf(dir, pkg)),
        spec: String(spec),
        source: bundle?.source ?? String(spec),
        kind,
        dir,
        missing: !pkg,
        isBundle,
        enabled: selected.includes(pkgName),
        partOf: undefined,
        repo: undefined,
        remote: remoteCache.get(pkgName)?.remote ?? null,
      };
      if (kind === 'path' && pkg) {
        const repo = await repoOf(dir);
        if (repo) entry.repo = { ...repo, path: posix(relative(repo.root, dir)) };
      }
      entries.push(entry);
    }
    // A non-selected package inside a selected bundle's directory is a member of that bundle.
    for (const e of entries) {
      if (e.enabled || e.isBundle) continue;
      const owner = entries.find((o) => o !== e && o.enabled && o.isBundle && inside(o.dir, e.dir));
      if (owner) e.partOf = owner.name;
    }
    entries.sort((a, b) => (a.partOf ?? a.name).localeCompare(b.partOf ?? b.name) || (a.partOf ? 1 : 0) - (b.partOf ? 1 : 0) || a.name.localeCompare(b.name));
    return entries;
  }

  // -------------------------------------------------------------- remote checks

  async function registryUrl() {
    try {
      const r = await ctx.pluginManager.registries();
      return (r.registry ?? r.resolved ?? 'https://registry.npmjs.org/').replace(/\/?$/, '/');
    } catch {
      return 'https://registry.npmjs.org/';
    }
  }

  async function fetchJson(url, headers) {
    const signal = AbortSignal.any([abort.signal, AbortSignal.timeout(cfg().timeoutMs)]);
    const response = await fetch(url, { headers, signal });
    if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
    return response.json();
  }

  async function remotePackageJsonGithub({ owner, repo, ref }, path = 'package.json') {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    if (await ghAvailable()) {
      const r = await run(cfg().ghPath, ['api', '-H', 'Accept: application/vnd.github.raw', `repos/${owner}/${repo}/contents/${path}${q}`]);
      if (r.code === 0) return JSON.parse(r.stdout);
    }
    return fetchJson(`https://raw.githubusercontent.com/${owner}/${repo}/${ref ?? 'HEAD'}/${path}`);
  }

  function statusFor(local, remoteVersion, behind) {
    const cmp = compareVersions(remoteVersion, local);
    if (cmp > 0) return 'update-available';
    if (behind > 0) return 'changes-available';
    if (Number.isNaN(cmp) && remoteVersion && remoteVersion !== local) return 'unknown';
    return 'up-to-date';
  }

  /** Check every entry's remote; one fetch per Git checkout. */
  async function checkRemotes(entries) {
    const fetched = new Map(); // repo root -> fetch result promise
    let registry;
    await Promise.all(entries.map(async (e) => {
      let remote;
      try {
        if (e.missing) remote = { status: 'error', error: 'package files are missing' };
        else if (e.kind === 'path') {
          if (!e.repo) remote = { status: 'no-remote', reason: 'not-git' };
          else if (!e.repo.upstream) remote = { status: 'no-remote', reason: 'no-upstream' };
          else {
            const { root, upstream, remoteUrl } = e.repo;
            if (!fetched.has(root)) fetched.set(root, git(root, ['fetch', '--quiet', '--prune', e.repo.remoteName ?? 'origin'], { network: true, remoteUrl }));
            const f = await fetched.get(root);
            const rel = e.repo.path ? `${e.repo.path}/package.json` : 'package.json';
            const [shown, behindPath, behindRepo, ahead, dirty] = await Promise.all([
              gitOut(root, ['show', `${upstream}:${rel}`]),
              gitOut(root, ['rev-list', '--count', `HEAD..${upstream}`, '--', e.repo.path || '.']),
              gitOut(root, ['rev-list', '--count', `HEAD..${upstream}`]),
              gitOut(root, ['rev-list', '--count', `${upstream}..HEAD`]),
              gitOut(root, ['status', '--porcelain', '--untracked-files=no']),
            ]);
            let remoteVersion = null;
            try { remoteVersion = shown ? JSON.parse(shown).version ?? null : null; } catch { /* unreadable */ }
            const behind = Number(behindPath) || 0;
            remote = {
              status: f.code !== 0 ? 'error' : remoteVersion === null && !shown ? 'removed-remotely' : statusFor(e.version, remoteVersion, behind),
              version: remoteVersion,
              behind,
              repoBehind: Number(behindRepo) || 0,
              ahead: Number(ahead) || 0,
              dirty: Boolean(dirty),
              via: `${upstream}`,
              ...(f.code !== 0 ? { error: `git fetch failed: ${f.error}` } : {}),
            };
          }
        } else if (e.kind === 'registry') {
          registry ??= await registryUrl();
          const alias = /^npm:(.+?)(?:@[^@/]+)?$/.exec(e.spec);
          const regName = alias ? alias[1] : e.name;
          const doc = await fetchJson(registry + regName.replace('/', '%2f'), { accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8' });
          const latest = doc?.['dist-tags']?.latest ?? null;
          remote = { status: statusFor(e.version, latest, 0), version: latest, via: registry };
        } else if (e.kind === 'git') {
          const gh = githubOf(e.spec);
          if (!gh) remote = { status: 'unknown', reason: 'unsupported-git-host' };
          else {
            const pkg = await remotePackageJsonGithub(gh);
            const v = pkg?.version ?? null;
            remote = { status: statusFor(e.version, v, 0), version: v, via: `github.com/${gh.owner}/${gh.repo}${gh.ref ? `#${gh.ref}` : ''}` };
          }
        } else {
          remote = { status: 'unknown', reason: 'tarball' };
        }
      } catch (error) {
        remote = { status: 'error', error: message(error) };
      }
      remote.checkedAt = Date.now();
      remote.updatable = updatable(e, remote);
      e.remote = remote;
      remoteCache.set(e.name, { at: remote.checkedAt, remote });
    }));
    lastCheckAt = Date.now();
    return entries;
  }

  function updatable(e, remote) {
    if (!remote || !['update-available', 'changes-available'].includes(remote.status)) return false;
    if (e.kind === 'path') return Boolean(e.repo?.upstream) && !remote.dirty && (remote.repoBehind ?? 0) > 0;
    if (e.kind === 'registry' || e.kind === 'git') return e.isBundle;
    return false;
  }

  async function check(force) {
    const entries = await inventory();
    const ttl = cfg().cacheMs;
    const fresh = !force && ttl > 0 && entries.every((e) => e.remote && Date.now() - e.remote.checkedAt < ttl);
    if (fresh) return entries;
    if (!checking) checking = checkRemotes(entries).finally(() => { checking = null; });
    await checking;
    return inventory();
  }

  // -------------------------------------------------------------- update

  async function reconcile() {
    let hmr;
    try { hmr = ctx.get?.('hmr'); } catch { hmr = undefined; }
    if (!hmr || typeof hmr.reconcileProfile !== 'function') return { application: 'restart-required', restartReason: 'no-hmr', warnings: [] };
    const recompose = () => hmr.reconcileProfile([]);
    const { warnings = [], pending = [], restartReason } = await (typeof hmr.runExclusive === 'function' ? hmr.runExclusive(recompose) : recompose());
    const reason = restartReason ?? pending[0]?.reason;
    return reason ? { application: 'restart-required', restartReason: reason, warnings } : { application: 'applied', warnings };
  }

  async function update(pkgName) {
    if (busy) throw Object.assign(new Error(`an update of ${busy.name} is already running`), { status: 409 });
    busy = { name: pkgName, startedAt: Date.now() };
    try {
      const entries = await checkRemotes(await inventory());
      const e = entries.find((x) => x.name === pkgName);
      if (!e) throw Object.assign(new Error(`${pkgName} is not a custom plugin of this profile`), { status: 404 });
      if (!e.remote?.updatable) {
        const why = e.remote?.dirty ? 'its Git checkout has uncommitted changes' : e.remote?.status === 'error' ? e.remote.error : `no update is available (${e.remote?.status ?? 'unknown'})`;
        throw Object.assign(new Error(`${pkgName} cannot be updated: ${why}`), { status: 409 });
      }
      const from = e.version;

      if (e.kind === 'path') {
        const { root, remoteUrl, upstream } = e.repo;
        const before = await gitOut(root, ['rev-parse', '--short', 'HEAD']);
        const pull = await git(root, ['pull', '--ff-only', '--quiet'], { network: true, remoteUrl });
        if (pull.code !== 0) throw new Error(`git pull --ff-only failed: ${pull.error}`);
        const after = await gitOut(root, ['rev-parse', '--short', 'HEAD']);
        const affected = entries.filter((x) => x.repo?.root === root).map((x) => x.name);
        const applied = await reconcile();
        for (const n of affected) remoteCache.delete(n);
        const now = (await inventory()).find((x) => x.name === pkgName);
        logger.info?.(`updated ${root} ${before}..${after} (${upstream}); ${applied.application}`);
        return { name: pkgName, method: 'git-pull', from, to: now?.version ?? null, commits: { before, after }, repo: root, affected, ...applied, reloadPage: true };
      }

      // Registry and git specs: Plugin Manager removal + installation (the Official "Update" path).
      const wasEnabled = e.enabled;
      const exact = /^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(e.spec);
      const target = e.kind === 'registry' ? `${e.name}@${e.remote.version}` : e.source;
      const removed = await ctx.pluginManager.removeBundle(e.name);
      if (removed.application === 'failed') throw new Error(`removal failed: ${removed.error?.diagnostic ?? removed.error?.code ?? 'unknown error'}`);
      const installed = await ctx.pluginManager.installBundle(target, { enabled: wasEnabled, saveExact: exact });
      remoteCache.delete(pkgName);
      if (installed.application === 'failed') {
        throw new Error(`installation of ${target} failed (${installed.error?.code ?? installed.packageResult?.kind ?? 'unknown'}): ${installed.error?.diagnostic ?? installed.packageResult?.output?.slice(-500) ?? ''}`);
      }
      return {
        name: pkgName, method: 'reinstall', from, to: installed.version ?? e.remote.version, target,
        application: installed.application, restartReason: installed.restartReason, warnings: installed.warnings ?? [], reloadPage: true,
      };
    } finally {
      busy = null;
    }
  }

  // -------------------------------------------------------------- views

  /** Wire shape for the page and the tool (no absolute host paths beyond the repo root). */
  const view = (entries) => ({
    plugins: entries.map((e) => ({
      name: e.name,
      version: e.version,
      description: e.description,
      meta: e.meta,
      hasIcon: e.hasIcon,
      kind: e.kind,
      spec: e.spec,
      isBundle: e.isBundle,
      enabled: e.enabled,
      partOf: e.partOf ?? null,
      missing: e.missing,
      repo: e.repo ? { root: e.repo.root, path: e.repo.path, branch: e.repo.branch, upstream: e.repo.upstream ?? null, head: e.repo.head, remoteUrl: e.repo.remoteUrl ?? null } : null,
      remote: e.remote,
    })),
    lastCheckAt,
    busy,
    checking: Boolean(checking),
  });

  // -------------------------------------------------------------- routes

  const route = (path, method, handler) => ctx.effect(() => ctx.connection.fetch.register({
    path: `${ROUTE}/${path}`,
    methods: [method],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        return await handler(request);
      } catch (error) {
        logger.warn?.(`${path} failed: ${message(error)}`);
        return json(error?.status ?? 500, { error: message(error) });
      }
    },
  }), `${name}: ${path} route`);

  const body = async (request) => { const b = await request.json().catch(() => ({})); return b && typeof b === 'object' ? b : {}; };

  route('list', 'GET', async () => json(200, view(await inventory())));
  route('check', 'POST', async (request) => json(200, view(await check((await body(request)).force === true))));
  route('update', 'POST', async (request) => {
    const { name: target } = await body(request);
    if (typeof target !== 'string' || !target) return json(400, { error: 'name is required' });
    const result = await update(target);
    return json(200, { result, ...view(await inventory()) });
  });
  route('icon', 'GET', async (request) => {
    const target = new URL(request.url).searchParams.get('name') ?? '';
    const deps = readJson(join(ctx.profileContext.dir, 'package.json'))?.dependencies ?? {};
    if (!Object.hasOwn(deps, target)) return new Response('not found', { status: 404 });
    const dir = packageDirOf(target, deps[target], ctx.profileContext.dir);
    const file = iconPathOf(dir, readJson(join(dir, 'package.json')));
    if (!file) return new Response('not found', { status: 404 });
    return new Response(readFileSync(file), {
      status: 200,
      headers: { 'content-type': ICON_TYPES[extname(file).toLowerCase()], 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" },
    });
  });

  // -------------------------------------------------------------- agent tool (read-only)

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'list_custom_plugins',
    description: 'List the custom (non-official) plugin packages installed in the current DSH profile with their installed version, source (linked Git checkout, registry, git spec), and whether a newer version exists remotely. Updating is a user action in Settings › Custom plugins.',
    parameters: {
      check_remote: { type: 'boolean', description: 'Check remotes for newer versions (git fetch / registry lookup). Defaults to true; false returns the last known state.' },
      force: { type: 'boolean', description: 'Ignore the cached remote check result. Defaults to false.' },
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    timeoutMs: 180000,
    async execute(args) {
      const entries = args?.check_remote === false ? await inventory() : await check(args?.force === true);
      const v = view(entries);
      return {
        lastCheckAt: v.lastCheckAt ? new Date(v.lastCheckAt).toISOString() : null,
        plugins: v.plugins.map((p) => ({
          name: p.name,
          title: p.meta?.en?.title ?? null,
          installedVersion: p.version,
          source: p.kind === 'path' && p.repo ? `git checkout ${p.repo.root}${p.repo.path ? `/${p.repo.path}` : ''} (${p.repo.upstream ?? 'no upstream'})` : `${p.kind}: ${p.spec}`,
          bundle: p.isBundle,
          selected: p.enabled,
          partOf: p.partOf,
          remoteStatus: p.remote?.status ?? 'not-checked',
          remoteVersion: p.remote?.version ?? null,
          newCommits: p.remote?.behind ?? null,
          updatable: p.remote?.updatable ?? false,
          error: p.remote?.error ?? null,
        })),
      };
    },
  })), `${name}: list_custom_plugins tool`);
}
