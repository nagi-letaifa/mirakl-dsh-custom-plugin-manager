window.__ModuleLoader__.load({
  id: 'mirakl-dsh-custom-plugin-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'miraklCustomPlugins';
    const SECTION = 'mirakl-dsh-custom-plugin-manager';
    const API = 'api/miraklCustomPlugins/';

    const en = {
      nav: 'Custom plugins',
      title: 'Custom plugins',
      intro: 'Plugins you installed in this profile outside the official catalog, with their installed version and whether a newer version exists remotely.',
      check: 'Check for updates',
      checking: 'Checking…',
      lastChecked: 'Last checked {time}',
      neverChecked: 'Not checked yet',
      summaryUpdates: '{count} update(s) available',
      summaryNone: 'Everything is up to date',
      loading: 'Loading installed plugins…',
      empty: 'No custom plugin is installed in this profile.',
      partOf: 'part of {name}',
      disabled: 'not selected',
      bundle: 'bundle',
      missing: 'files missing',
      'kind.path': 'local checkout',
      'kind.registry': 'registry',
      'kind.git': 'git',
      'kind.tarball': 'tarball',
      'status.unchecked': 'Not checked',
      'status.up-to-date': 'Up to date',
      'status.update-available': 'v{version} available',
      'status.changes-available': '{count} new commit(s)',
      'status.no-remote': 'No remote',
      'status.unknown': 'Cannot check',
      'status.error': 'Check failed',
      'status.removed-remotely': 'Not found remotely',
      'reason.not-git': 'Linked from a directory that is not a Git checkout, so there is no remote to compare with.',
      'reason.no-upstream': 'The Git branch has no upstream branch to compare with.',
      'reason.unsupported-git-host': 'Only GitHub git specs can be checked.',
      'reason.tarball': 'Tarball installs cannot be checked.',
      dirty: 'The Git checkout has uncommitted changes; commit or discard them to update.',
      ahead: 'The local checkout has {count} commit(s) not on {upstream}.',
      sameVersion: 'Same version number, newer commits on {upstream}.',
      notBundleUpdate: 'Not a bundle: update it from its own bundle or with the plugin_manager tool.',
      update: 'Update',
      updating: 'Updating…',
      cancel: 'Cancel',
      confirmGit: 'This runs git pull --ff-only in {repo}.',
      confirmGitOthers: 'It also updates the other plugins of that checkout: {names}.',
      confirmReinstall: 'This removes {name} and installs {target}.',
      confirmGo: 'Update now',
      updated: 'Updated {from} → {to}.',
      updatedLive: 'Applied live.',
      updatedRestart: 'Restart DSH to finish ({reason}).',
      reloadHint: 'Reload the page to load the new browser code.',
      reload: 'Reload page',
      failed: 'Update failed: {reason}',
      error: 'Could not load custom plugins: {reason}',
      auth: 'Your session is not authorized; reload the page.',
      source: 'Source',
      remote: 'Remote',
      search: 'Search plugins',
      searchPlaceholder: 'Search by name, source, status…',
      clearSearch: 'Clear search',
      matchCount: '{shown} of {total}',
      noMatch: 'No plugin matches “{query}”.',
    };

    const fr = {
      nav: 'Plugins personnalisés',
      title: 'Plugins personnalisés',
      intro: 'Les plugins installés dans ce profil en dehors du catalogue officiel, avec leur version installée et l’existence éventuelle d’une version plus récente à distance.',
      check: 'Rechercher des mises à jour',
      checking: 'Vérification…',
      lastChecked: 'Dernière vérification {time}',
      neverChecked: 'Pas encore vérifié',
      summaryUpdates: '{count} mise(s) à jour disponible(s)',
      summaryNone: 'Tout est à jour',
      loading: 'Chargement des plugins installés…',
      empty: 'Aucun plugin personnalisé n’est installé dans ce profil.',
      partOf: 'fait partie de {name}',
      disabled: 'non sélectionné',
      bundle: 'bundle',
      missing: 'fichiers manquants',
      'kind.path': 'copie locale',
      'kind.registry': 'registre',
      'kind.git': 'git',
      'kind.tarball': 'archive',
      'status.unchecked': 'Non vérifié',
      'status.up-to-date': 'À jour',
      'status.update-available': 'v{version} disponible',
      'status.changes-available': '{count} nouveau(x) commit(s)',
      'status.no-remote': 'Pas de dépôt distant',
      'status.unknown': 'Vérification impossible',
      'status.error': 'Échec de la vérification',
      'status.removed-remotely': 'Introuvable à distance',
      'reason.not-git': 'Lié depuis un dossier qui n’est pas un dépôt Git : aucun dépôt distant à comparer.',
      'reason.no-upstream': 'La branche Git n’a pas de branche amont à comparer.',
      'reason.unsupported-git-host': 'Seules les sources git GitHub peuvent être vérifiées.',
      'reason.tarball': 'Les installations depuis une archive ne peuvent pas être vérifiées.',
      dirty: 'La copie Git contient des modifications non validées ; validez-les ou annulez-les pour mettre à jour.',
      ahead: 'La copie locale a {count} commit(s) absents de {upstream}.',
      sameVersion: 'Même numéro de version, commits plus récents sur {upstream}.',
      notBundleUpdate: 'Ce n’est pas un bundle : mettez-le à jour via son bundle ou l’outil plugin_manager.',
      update: 'Mettre à jour',
      updating: 'Mise à jour…',
      cancel: 'Annuler',
      confirmGit: 'Cela exécute git pull --ff-only dans {repo}.',
      confirmGitOthers: 'Cela met aussi à jour les autres plugins de ce dépôt : {names}.',
      confirmReinstall: 'Cela supprime {name} puis installe {target}.',
      confirmGo: 'Mettre à jour',
      updated: 'Mis à jour {from} → {to}.',
      updatedLive: 'Appliqué à chaud.',
      updatedRestart: 'Redémarrez DSH pour terminer ({reason}).',
      reloadHint: 'Rechargez la page pour charger le nouveau code navigateur.',
      reload: 'Recharger la page',
      failed: 'Échec de la mise à jour : {reason}',
      error: 'Impossible de charger les plugins personnalisés : {reason}',
      auth: 'Votre session n’est pas autorisée ; rechargez la page.',
      source: 'Source',
      remote: 'Distant',
      search: 'Rechercher des plugins',
      searchPlaceholder: 'Rechercher par nom, source, statut…',
      clearSearch: 'Effacer la recherche',
      matchCount: '{shown} sur {total}',
      noMatch: 'Aucun plugin ne correspond à « {query} ».',
    };

    const CSS = `
.mcp-section { max-width: 760px; display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary); }
.mcp-heading { margin: 0; font-size: 18px; font-weight: 600; }
.mcp-intro { margin: 0; font-size: 13px; line-height: 19px; color: var(--dsw-alias-label-tertiary); }
.mcp-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 4px; }
.mcp-toolbar-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.mcp-toolbar-text .mcp-sub { color: var(--dsw-alias-label-tertiary); }
.mcp-btn { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: var(--dsw-radius-sm, 6px); cursor: pointer; height: 28px; padding: 0 10px; font: inherit; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); background: transparent; white-space: nowrap; flex: none; }
.mcp-btn:disabled { cursor: not-allowed; opacity: .4; }
.mcp-btn:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 2px; }
.mcp-btn-primary { background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); }
.mcp-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.mcp-btn-outline { border: .5px solid var(--dsw-alias-border-l3); }
.mcp-btn-outline:hover:not(:disabled), .mcp-btn-ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.mcp-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border-top: .5px solid var(--dsw-alias-border-l2); }
.mcp-row { border-bottom: .5px solid var(--dsw-alias-border-l2); padding: 12px 2px; }
.mcp-row[data-member=true] .mcp-line { padding-left: 24px; }
.mcp-row[data-member=true] .mcp-detail { margin-left: 80px; }
.mcp-line { display: flex; align-items: center; gap: 16px; min-width: 0; }
.mcp-icon { box-sizing: border-box; border: .5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-md, 8px); width: 40px; height: 40px; flex: none; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; color: var(--dsw-alias-label-secondary); font-size: 15px; font-weight: 600; background: var(--dsw-alias-bg-layer-1); }
.mcp-icon img { width: 26px; height: 26px; object-fit: contain; }
.mcp-main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.mcp-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.mcp-title { font-size: 13.5px; font-weight: 500; line-height: 20px; overflow-wrap: anywhere; }
.mcp-version { font-variant-numeric: tabular-nums; font-size: 11.5px; line-height: 16px; padding: 1px 6px; border-radius: var(--dsw-radius-sm, 6px); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
.mcp-tag { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary); }
.mcp-module { font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.mcp-end { flex: none; display: inline-flex; align-items: center; gap: 10px; }
.mcp-state { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.mcp-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); flex: none; }
.mcp-state[data-tone=ok] .mcp-dot { background: var(--dsw-alias-state-success-primary); }
.mcp-state[data-tone=update] { color: var(--dsw-alias-label-primary); font-weight: 500; }
.mcp-state[data-tone=update] .mcp-dot { background: var(--dsw-alias-brand-primary); }
.mcp-state[data-tone=error] { color: var(--dsw-alias-state-error-primary); }
.mcp-state[data-tone=error] .mcp-dot { background: var(--dsw-alias-state-error-primary); }
.mcp-state[data-tone=warn] .mcp-dot { background: var(--dsw-alias-state-warn-primary); }
.mcp-detail { margin: 6px 0 0 56px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.mcp-detail[data-tone=error] { color: var(--dsw-alias-state-error-primary); }
.mcp-detail[data-tone=ok] { color: var(--dsw-alias-label-secondary); }
.mcp-confirm { margin: 8px 0 0 56px; padding: 10px 12px; border: .5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-layer-1); display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.mcp-row[data-member=true] .mcp-confirm { margin-left: 80px; }
.mcp-confirm p { margin: 0; }
.mcp-confirm code { font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 11.5px; }
.mcp-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.mcp-spin { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid currentColor; border-right-color: transparent; animation: mcp-spin .8s linear infinite; flex: none; }
@keyframes mcp-spin { to { transform: rotate(360deg); } }
.mcp-banner { margin: 0; padding: 8px 12px; border-radius: var(--dsw-radius-md, 8px); font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-state-error-primary); border: .5px solid var(--dsw-alias-state-error-primary); }
.mcp-empty { margin: 0; font-size: 13px; color: var(--dsw-alias-label-tertiary); }
.mcp-search { position: relative; display: flex; align-items: center; gap: 10px; }
.mcp-search-box { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; }
.mcp-search-icon { position: absolute; left: 9px; width: 14px; height: 14px; color: var(--dsw-alias-label-tertiary); pointer-events: none; }
.mcp-search-input { box-sizing: border-box; width: 100%; height: 30px; padding: 0 30px 0 30px; border: .5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-sm, 6px); background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; line-height: 18px; outline: none; }
.mcp-search-input::placeholder { color: var(--dsw-alias-label-tertiary); }
.mcp-search-input:focus-visible { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary); }
.mcp-search-input::-webkit-search-cancel-button { display: none; }
.mcp-search-clear { position: absolute; right: 4px; width: 22px; height: 22px; padding: 0; border: none; border-radius: var(--dsw-radius-sm, 6px); background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.mcp-search-clear:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.mcp-search-clear:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.mcp-search-count { flex: none; font-variant-numeric: tabular-nums; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
mark.mcp-hit { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); color: inherit; border-radius: 2px; }
`;

    // ------------------------------------------------------------ store

    function createStore() {
      let state = { data: null, loading: false, checking: false, error: null, confirm: null, updating: null, results: {} };
      const listeners = new Set();
      let started = false;
      const set = (patch) => { state = { ...state, ...patch }; for (const l of listeners) l(); };

      async function call(path, method = 'GET', body) {
        const response = await fetch(new URL(API + path, document.baseURI), {
          method,
          credentials: 'same-origin',
          headers: method === 'POST' ? { 'content-type': 'application/json' } : undefined,
          body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
        });
        if (response.status === 401 || response.status === 403) throw Object.assign(new Error('auth'), { auth: true });
        const json = await response.json().catch(() => null);
        if (!json) throw new Error(`HTTP ${response.status}`);
        if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
        return json;
      }
      const asError = (error) => (error && error.auth ? { key: 'auth' } : { key: 'error', reason: error.message });

      async function load() {
        set({ loading: true });
        try { set({ data: await call('list'), error: null }); } catch (error) { set({ error: asError(error) }); } finally { set({ loading: false }); }
      }
      async function check(force) {
        if (state.checking) return;
        set({ checking: true });
        try { set({ data: await call('check', 'POST', { force: Boolean(force) }), error: null }); } catch (error) { set({ error: asError(error) }); } finally { set({ checking: false }); }
      }
      async function update(name) {
        set({ updating: name, confirm: null, results: { ...state.results, [name]: undefined } });
        try {
          const response = await call('update', 'POST', { name });
          const { result, ...data } = response;
          set({ data, results: { ...state.results, [name]: { ok: true, result } } });
        } catch (error) {
          set({ results: { ...state.results, [name]: { ok: false, reason: error.auth ? 'auth' : error.message } } });
          load();
        } finally {
          set({ updating: null });
        }
      }
      return {
        get: () => state,
        subscribe(listener) {
          const first = listeners.size === 0;
          listeners.add(listener);
          // Each time the page opens: fresh inventory, then a remote check (served from the Host cache when recent).
          if (first && !started) { started = true; load().then(() => check(false)).finally(() => { started = false; }); }
          return () => listeners.delete(listener);
        },
        check,
        update,
        confirm: (name) => set({ confirm: name }),
      };
    }

    // ------------------------------------------------------------ view

    const pickMeta = (meta, uiLocale) => {
      if (!meta) return {};
      const lang = String(uiLocale || 'en');
      return meta[lang] || meta[lang.split('-')[0]] || meta.en || {};
    };
    const formatTime = (at, locale) => { try { return new Date(at).toLocaleString(locale || undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; } };
    const shortRepo = (repo) => {
      if (!repo) return '';
      const url = repo.remoteUrl || '';
      const m = /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(url);
      return m ? m[1] : (url || repo.root);
    };

    function sourceLine(t, p) {
      const parts = [p.name];
      if (p.kind === 'path' && p.repo) parts.push(`${t('kind.path')} · ${shortRepo(p.repo)}${p.repo.path ? `/${p.repo.path}` : ''} @ ${p.repo.branch || '?'} (${p.repo.head || '?'})`);
      else parts.push(`${t(`kind.${p.kind}`)} · ${p.spec}`);
      return parts.join(' — ');
    }

    function StateBadge({ t, p, checking }) {
      const r = p.remote;
      if (!r) {
        return checking
          ? h('span', { className: 'mcp-state' }, h('span', { className: 'mcp-spin', 'aria-hidden': true }), t('checking'))
          : h('span', { className: 'mcp-state' }, h('span', { className: 'mcp-dot' }), t('status.unchecked'));
      }
      const tone = r.status === 'up-to-date' ? 'ok'
        : (r.status === 'update-available' || r.status === 'changes-available') ? 'update'
          : (r.status === 'error' || r.status === 'removed-remotely') ? 'error'
            : 'idle';
      const label = r.status === 'update-available' ? t('status.update-available', { version: r.version })
        : r.status === 'changes-available' ? t('status.changes-available', { count: r.behind })
          : t(`status.${r.status}`);
      return h('span', { className: 'mcp-state', 'data-tone': tone, title: r.via || undefined }, h('span', { className: 'mcp-dot' }), label);
    }

    function Icon({ p, title }) {
      const [failed, setFailed] = React.useState(false);
      const letter = (title || p.name).replace(/^(@[^/]+\/|mirakl-dsh-)/, '').charAt(0).toUpperCase();
      return h('span', { className: 'mcp-icon', 'aria-hidden': true },
        p.hasIcon && !failed
          ? h('img', { alt: '', src: new URL(`${API}icon?name=${encodeURIComponent(p.name)}`, document.baseURI).href, onError: () => setFailed(true) })
          : letter);
    }

    const normalize = (text) => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tokensOf = (query) => normalize(query).split(/\s+/).filter(Boolean);

    function statusText(t, p) {
      const r = p.remote;
      if (!r) return t('status.unchecked');
      if (r.status === 'update-available') return t('status.update-available', { version: r.version }) + ' update';
      if (r.status === 'changes-available') return t('status.changes-available', { count: r.behind }) + ' update';
      return t(`status.${r.status}`);
    }

    function haystack(t, p, uiLocale) {
      const parts = [p.name, p.version, p.version && `v${p.version}`, p.spec, p.kind && t(`kind.${p.kind}`), p.partOf, statusText(t, p)];
      for (const m of Object.values(p.meta || {})) if (m) parts.push(m.title, m.description);
      if (p.repo) parts.push(shortRepo(p.repo), p.repo.path, p.repo.branch, p.repo.root);
      if (p.isBundle) parts.push(t('bundle'));
      if (p.isBundle && !p.enabled) parts.push(t('disabled'));
      if (p.missing) parts.push(t('missing'));
      void uiLocale;
      return normalize(parts.filter(Boolean).join(' \n '));
    }

    // Keeps bundle groups together: a match on a member keeps its bundle row, a match on a bundle keeps its members.
    function filterPlugins(t, plugins, query, uiLocale) {
      const tokens = tokensOf(query);
      if (!tokens.length) return plugins;
      const hit = new Set(plugins.filter((p) => { const text = haystack(t, p, uiLocale); return tokens.every((tok) => text.includes(tok)); }).map((p) => p.name));
      const keep = new Set(hit);
      for (const p of plugins) {
        if (p.partOf && hit.has(p.name)) keep.add(p.partOf);
        if (p.partOf && hit.has(p.partOf)) keep.add(p.name);
      }
      return plugins.filter((p) => keep.has(p.name));
    }

    // Highlights the query tokens inside a visible label (accent-insensitive).
    function highlight(text, tokens) {
      const str = String(text ?? '');
      if (!tokens || !tokens.length || !str) return str;
      const norm = normalize(str);
      if (norm.length !== str.length) return str;
      const ranges = [];
      for (const tok of tokens) { let i = norm.indexOf(tok); while (i !== -1) { ranges.push([i, i + tok.length]); i = norm.indexOf(tok, i + tok.length); } }
      if (!ranges.length) return str;
      ranges.sort((a, b) => a[0] - b[0]);
      const merged = [];
      for (const r of ranges) { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push([...r]); }
      const out = []; let pos = 0;
      merged.forEach(([a, b], k) => { if (a > pos) out.push(str.slice(pos, a)); out.push(h('mark', { key: k, className: 'mcp-hit' }, str.slice(a, b))); pos = b; });
      if (pos < str.length) out.push(str.slice(pos));
      return out;
    }

    const SearchIcon = () => h('svg', { className: 'mcp-search-icon', viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true },
      h('circle', { cx: 7, cy: 7, r: 4.5 }), h('path', { d: 'M10.5 10.5 14 14', strokeLinecap: 'round' }));
    const ClearIcon = () => h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true },
      h('path', { d: 'M4 4l8 8M12 4l-8 8', strokeLinecap: 'round' }));

    function SearchBar({ t, query, setQuery, shown, total }) {
      const ref = React.useRef(null);
      return h('div', { className: 'mcp-search', role: 'search' },
        h('div', { className: 'mcp-search-box' },
          h(SearchIcon),
          h('input', {
            ref, type: 'search', className: 'mcp-search-input', value: query, placeholder: t('searchPlaceholder'), 'aria-label': t('search'),
            spellCheck: false, autoComplete: 'off',
            onChange: (e) => setQuery(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Escape' && query) { e.preventDefault(); e.stopPropagation(); setQuery(''); } },
          }),
          query ? h('button', { type: 'button', className: 'mcp-search-clear', title: t('clearSearch'), 'aria-label': t('clearSearch'), onClick: () => { setQuery(''); ref.current && ref.current.focus(); } }, h(ClearIcon)) : null),
        query.trim() ? h('span', { className: 'mcp-search-count', 'aria-live': 'polite' }, t('matchCount', { shown, total })) : null);
    }

    function Row({ t, p, s, store, uiLocale, all, tokens }) {
      const meta = pickMeta(p.meta, uiLocale);
      const title = meta.title || p.name;
      const r = p.remote;
      const updating = s.updating === p.name;
      const result = s.results[p.name];
      const hasUpdate = r && (r.status === 'update-available' || r.status === 'changes-available');

      const details = [];
      if (r && r.reason) details.push(h('div', { key: 'reason', className: 'mcp-detail' }, t(`reason.${r.reason}`)));
      if (r && r.error) details.push(h('div', { key: 'err', className: 'mcp-detail', 'data-tone': 'error' }, r.error));
      if (hasUpdate && r.dirty) details.push(h('div', { key: 'dirty', className: 'mcp-detail', 'data-tone': 'error' }, t('dirty')));
      if (hasUpdate && r.status === 'changes-available') details.push(h('div', { key: 'same', className: 'mcp-detail' }, t('sameVersion', { upstream: r.via })));
      if (r && r.ahead > 0) details.push(h('div', { key: 'ahead', className: 'mcp-detail' }, t('ahead', { count: r.ahead, upstream: r.via })));
      if (hasUpdate && !r.updatable && !r.dirty && !p.isBundle && p.kind !== 'path') details.push(h('div', { key: 'nb', className: 'mcp-detail' }, t('notBundleUpdate')));
      if (result) {
        if (result.ok) {
          const res = result.result;
          const text = [
            t('updated', { from: res.from ? `v${res.from}` : '?', to: res.to ? `v${res.to}` : (res.commits ? res.commits.after : '?') }),
            res.application === 'applied' ? t('updatedLive') : res.application === 'restart-required' ? t('updatedRestart', { reason: res.restartReason || '' }) : res.application,
            res.reloadPage ? t('reloadHint') : '',
          ].filter(Boolean).join(' ');
          details.push(h('div', { key: 'res', className: 'mcp-detail', 'data-tone': 'ok' }, text, ' ',
            res.reloadPage ? h('button', { type: 'button', className: 'mcp-btn mcp-btn-outline', style: { marginLeft: 6 }, onClick: () => window.location.reload() }, t('reload')) : null));
          if (res.warnings && res.warnings.length) details.push(h('div', { key: 'warn', className: 'mcp-detail' }, res.warnings.join(' · ')));
        } else {
          details.push(h('div', { key: 'res', className: 'mcp-detail', 'data-tone': 'error' }, result.reason === 'auth' ? t('auth') : t('failed', { reason: result.reason })));
        }
      }

      let confirm = null;
      if (s.confirm === p.name && r) {
        const lines = [];
        if (p.kind === 'path' && p.repo) {
          lines.push(h('p', { key: 'g' }, t('confirmGit', { repo: shortRepo(p.repo) })));
          const others = all.filter((x) => x.name !== p.name && x.repo && x.repo.root === p.repo.root).map((x) => x.name);
          if (others.length) lines.push(h('p', { key: 'o' }, t('confirmGitOthers', { names: others.join(', ') })));
        } else {
          lines.push(h('p', { key: 'r' }, t('confirmReinstall', { name: p.name, target: p.kind === 'registry' ? `${p.name}@${r.version}` : p.spec })));
        }
        confirm = h('div', { className: 'mcp-confirm', role: 'group', 'aria-label': t('update') },
          ...lines,
          h('div', { className: 'mcp-confirm-actions' },
            h('button', { type: 'button', className: 'mcp-btn mcp-btn-ghost', onClick: () => store.confirm(null) }, t('cancel')),
            h('button', { type: 'button', className: 'mcp-btn mcp-btn-primary', onClick: () => store.update(p.name), autoFocus: true }, t('confirmGo'))));
      }

      const tags = [];
      if (p.partOf) tags.push(t('partOf', { name: p.partOf }));
      else if (p.isBundle) tags.push(t('bundle'));
      if (p.isBundle && !p.enabled) tags.push(t('disabled'));
      if (p.missing) tags.push(t('missing'));

      return h('li', { className: 'mcp-row', 'data-member': p.partOf ? 'true' : undefined },
        h('div', { className: 'mcp-line' },
          h(Icon, { p, title }),
          h('div', { className: 'mcp-main' },
            h('div', { className: 'mcp-title-row' },
              h('span', { className: 'mcp-title' }, highlight(title, tokens)),
              p.version ? h('span', { className: 'mcp-version' }, `v${p.version}`) : null,
              tags.length ? h('span', { className: 'mcp-tag' }, tags.join(' · ')) : null),
            h('span', { className: 'mcp-module', title: p.repo ? p.repo.root : undefined }, highlight(sourceLine(t, p), tokens))),
          h('div', { className: 'mcp-end' },
            updating
              ? h('span', { className: 'mcp-state' }, h('span', { className: 'mcp-spin', 'aria-hidden': true }), t('updating'))
              : h(StateBadge, { t, p, checking: s.checking }),
            r && r.updatable && !updating && s.confirm !== p.name
              ? h('button', { type: 'button', className: 'mcp-btn mcp-btn-primary', disabled: Boolean(s.updating), onClick: () => store.confirm(p.name) }, t('update'))
              : null)),
        ...details,
        confirm);
    }

    function makePage(store) {
      return function CustomPluginsPage({ t, uiLocale }) {
        const s = React.useSyncExternalStore(store.subscribe, store.get);
        const plugins = (s.data && s.data.plugins) || [];
        const [query, setQuery] = React.useState('');
        const tokens = React.useMemo(() => tokensOf(query), [query]);
        const visible = React.useMemo(() => filterPlugins(t, plugins, query, uiLocale), [t, plugins, query, uiLocale]);
        const updates = plugins.filter((p) => p.remote && (p.remote.status === 'update-available' || p.remote.status === 'changes-available')).length;
        const lastCheckAt = s.data && s.data.lastCheckAt;

        let body;
        if (!s.data && (s.loading || !s.error)) body = h('p', { className: 'mcp-empty' }, t('loading'));
        else if (s.data && plugins.length === 0) body = h('p', { className: 'mcp-empty' }, t('empty'));
        else if (s.data && visible.length === 0) body = h('p', { className: 'mcp-empty' }, t('noMatch', { query: query.trim() }));
        else if (s.data) body = h('ul', { className: 'mcp-rows' }, visible.map((p) => h(Row, { key: p.name, t, p, s, store, uiLocale, all: plugins, tokens })));

        return h('div', { className: 'mcp-section' },
          h('style', null, CSS),
          h('h2', { className: 'mcp-heading' }, t('title')),
          h('p', { className: 'mcp-intro' }, t('intro')),
          s.error ? h('p', { className: 'mcp-banner', role: 'alert' }, s.error.key === 'auth' ? t('auth') : t('error', { reason: s.error.reason })) : null,
          s.data && plugins.length ? h('div', { className: 'mcp-toolbar' },
            h('div', { className: 'mcp-toolbar-text', 'aria-live': 'polite' },
              h('span', null, s.checking ? t('checking') : lastCheckAt ? (updates ? t('summaryUpdates', { count: updates }) : t('summaryNone')) : t('neverChecked')),
              lastCheckAt ? h('span', { className: 'mcp-sub' }, t('lastChecked', { time: formatTime(lastCheckAt, uiLocale) })) : null),
            h('button', { type: 'button', className: 'mcp-btn mcp-btn-outline', disabled: s.checking || Boolean(s.updating), onClick: () => store.check(true) },
              s.checking ? h('span', { className: 'mcp-spin', 'aria-hidden': true }) : null,
              s.checking ? t('checking') : t('check'))) : null,
          s.data && plugins.length ? h(SearchBar, { t, query, setQuery, shown: visible.length, total: plugins.length }) : null,
          body);
      };
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, fr }), 'mirakl-dsh-custom-plugin-manager: dictionaries');
        const t = ctx.locale.bind(NS);
        const store = createStore();
        const Page = makePage(store);
        const PageWithLocale = (props) => {
          const snapshot = React.useSyncExternalStore((fn) => ctx.locale.subscribe(fn), () => ctx.locale.getSnapshot());
          const active = snapshot && snapshot.active;
          return h(Page, { ...props, t, uiLocale: typeof active === 'string' && active ? active : navigator.language });
        };
        ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: SECTION,
          order: 65,
          label: () => t('nav'),
          locale: NS,
        }, PageWithLocale)), 'mirakl-dsh-custom-plugin-manager: settings section');
      },
    };
  },
});
