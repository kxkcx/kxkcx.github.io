(function () {
  const root = document.getElementById('appRoot');
  const nav = document.getElementById('mainNav');
  const statsPosts = document.getElementById('statsPosts');
  const statsCategories = document.getElementById('statsCategories');
  const statsTags = document.getElementById('statsTags');
  const recentList = document.getElementById('recentList');
  const tagCloud = document.getElementById('tagCloud');
  const categoryCloud = document.getElementById('categoryCloud');
  const siteLayout = document.getElementById('siteLayout');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const themeBtn = document.getElementById('themeBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const readingProgress = document.getElementById('readingProgress');
  const backToTop = document.getElementById('backToTop');

  const LAYOUT_KEY = 'blog-front-layout-v1';
  const RUNTIME_KEY = 'blog-runtime-compiled-v1';
  const THEME_KEY = 'blog-front-theme-v1';

  const RUN_LANGS = {
    js: 'javascript', javascript: 'javascript', node: 'javascript',
    py: 'python', python: 'python', python3: 'python',
    java: 'java'
  };
  const WANDBOX_API = 'https://wandbox.org/api/compile.json';
  const WANDBOX_COMPILERS = {
    python: 'cpython-3.12.7',
    java: 'openjdk-jdk-21+35',
    javascript: 'nodejs-20.17.0'
  };

  const state = {
    posts: [],
    contentCache: new Map(),
    sidebarCollapsed: false,
    searchActiveIndex: 0
  };

  function readRuntimeSnapshot() {
    try {
      const raw = localStorage.getItem(RUNTIME_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.posts)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function applyRuntimeSnapshot(snapshot) {
    if (!snapshot) return false;
    const normalized = normalize(snapshot.posts || []);
    if (!normalized.length) return false;
    state.posts = normalized;
    state.contentCache = new Map();
    const markdowns = snapshot.markdowns || {};
    Object.keys(markdowns).forEach(function (path) {
      state.contentCache.set(path, String(markdowns[path] || ''));
    });
    updateSidebar();
    route();
    return true;
  }

  function applyLayout() {
    if (!siteLayout || !toggleSidebarBtn) return;
    siteLayout.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    document.body.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    toggleSidebarBtn.textContent = state.sidebarCollapsed ? '展开侧栏' : '收起侧栏';
    toggleSidebarBtn.setAttribute('aria-pressed', state.sidebarCollapsed ? 'true' : 'false');
  }

  function restoreLayout() {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state.sidebarCollapsed = !!parsed.sidebarCollapsed;
    } catch (e) {
      state.sidebarCollapsed = false;
    }
  }

  function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    applyLayout();
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ sidebarCollapsed: state.sidebarCollapsed }));
  }

  /* ===== Theme (dark mode) ===== */
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (themeBtn) {
      themeBtn.textContent = isDark ? '亮色' : '暗色';
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
  }

  function restoreTheme() {
    let theme = 'light';
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) {
        theme = saved;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      }
    } catch (e) { /* noop */ }
    applyTheme(theme);
  }

  function toggleTheme() {
    const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* noop */ }
  }

  /* ===== Search ===== */
  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('hidden');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    renderSearchResults('');
  }

  function closeSearch() {
    if (searchOverlay) searchOverlay.classList.add('hidden');
  }

  function highlight(text, term) {
    const safe = esc(text);
    if (!term) return safe;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx < 0) return safe;
    const start = Math.max(0, idx - 30);
    const slice = text.slice(start, idx + term.length + 50);
    const prefix = start > 0 ? '…' : '';
    const re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return prefix + esc(slice).replace(re, '<mark>$1</mark>');
  }

  function searchPosts(query) {
    const term = query.trim().toLowerCase();
    if (!term) return state.posts.slice(0, 8);
    return state.posts.filter(function (p) {
      const hay = (p.title + ' ' + p.excerpt + ' ' + p.tags.join(' ') + ' ' + p.categories.join(' ') + ' ' +
        (state.contentCache.get(p.contentPath) || '')).toLowerCase();
      return hay.indexOf(term) >= 0;
    }).slice(0, 12);
  }

  function renderSearchResults(query) {
    if (!searchResults) return;
    const results = searchPosts(query);
    state.searchActiveIndex = 0;
    state._searchResults = results;
    if (!results.length) {
      searchResults.innerHTML = '<div class="search-result"><small>没有匹配结果</small></div>';
      return;
    }
    const term = query.trim();
    searchResults.innerHTML = results.map(function (p, i) {
      const body = state.contentCache.get(p.contentPath) || p.excerpt || '';
      return '<a class="search-result' + (i === 0 ? ' active' : '') + '" data-index="' + i +
        '" href="#/post/' + encodeURIComponent(p.slug) + '">' +
        '<strong>' + highlight(p.title, term) + '</strong>' +
        '<small>' + dateText(p.publishedAt) + '</small>' +
        (body ? '<div>' + highlight(body, term) + '</div>' : '') +
        '</a>';
    }).join('');
  }

  function moveSearchActive(delta) {
    const results = state._searchResults || [];
    if (!results.length) return;
    state.searchActiveIndex = (state.searchActiveIndex + delta + results.length) % results.length;
    searchResults.querySelectorAll('.search-result').forEach(function (el, i) {
      el.classList.toggle('active', i === state.searchActiveIndex);
      if (i === state.searchActiveIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function gotoSearchActive() {
    const results = state._searchResults || [];
    const target = results[state.searchActiveIndex];
    if (target) {
      location.hash = '#/post/' + encodeURIComponent(target.slug);
      closeSearch();
    }
  }

  /* ===== Reading progress + back to top ===== */
  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? (doc.scrollTop / max) : 0;
    if (readingProgress) readingProgress.style.width = (ratio * 100).toFixed(1) + '%';
    if (backToTop) backToTop.classList.toggle('hidden', doc.scrollTop < 400);
    updateTocActive();
  }

  function updateTocActive() {
    const toc = document.getElementById('articleToc');
    if (!toc) return;
    const headings = root.querySelectorAll('.article-body h2[id], .article-body h3[id]');
    let currentId = '';
    headings.forEach(function (h) {
      if (h.getBoundingClientRect().top <= 96) currentId = h.id;
    });
    toc.querySelectorAll('a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      if (ch === '>') return '&gt;';
      if (ch === '"') return '&quot;';
      return '&#39;';
    });
  }

  function dateText(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function parseList(v) {
    return Array.isArray(v) ? v.filter(Boolean).map(String) : [];
  }

  function normalize(posts) {
    return (Array.isArray(posts) ? posts : []).map(function (p) {
      return {
        id: String(p.id || p.slug || ''),
        slug: String(p.slug || p.id || ''),
        title: String(p.title || 'Untitled'),
        publishedAt: String(p.publishedAt || ''),
        archive: String(p.archive || ''),
        categories: parseList(p.categories),
        tags: parseList(p.tags),
        excerpt: String(p.excerpt || ''),
        contentPath: String(p.contentPath || '')
      };
    }).filter(function (p) {
      return p.slug && p.contentPath;
    }).sort(function (a, b) {
      return a.publishedAt < b.publishedAt ? 1 : -1;
    });
  }

  function byTerm(list, key) {
    const map = new Map();
    list.forEach(function (post) {
      post[key].forEach(function (term) {
        if (!map.has(term)) map.set(term, []);
        map.get(term).push(post);
      });
    });
    return map;
  }

  function updateSidebar() {
    const posts = state.posts;
    const tags = byTerm(posts, 'tags');
    const categories = byTerm(posts, 'categories');

    statsPosts.textContent = String(posts.length);
    statsTags.textContent = String(tags.size);
    statsCategories.textContent = String(categories.size);

    recentList.innerHTML = posts.slice(0, 8).map(function (post) {
      return '<li><a href="#/post/' + encodeURIComponent(post.slug) + '">' +
        '<span>' + esc(post.title) + '</span>' +
        '<small>' + dateText(post.publishedAt) + '</small>' +
      '</a></li>';
    }).join('');

    tagCloud.innerHTML = Array.from(tags.entries()).slice(0, 16).map(function (entry) {
      const term = entry[0];
      return '<li><a href="#/tags/' + encodeURIComponent(term) + '"><span>' + esc(term) + '</span><small>' + entry[1].length + '</small></a></li>';
    }).join('');

    categoryCloud.innerHTML = Array.from(categories.entries()).slice(0, 16).map(function (entry) {
      const term = entry[0];
      return '<li><a href="#/categories/' + encodeURIComponent(term) + '"><span>' + esc(term) + '</span><small>' + entry[1].length + '</small></a></li>';
    }).join('');
  }

  function markNav(route) {
    nav.querySelectorAll('a').forEach(function (a) {
      a.classList.toggle('active', a.dataset.route === route);
    });
  }

  function card(post) {
    const tags = post.tags.map(function (tag) { return '<span class="chip">#' + esc(tag) + '</span>'; }).join('');
    const cats = post.categories.map(function (cat) { return '<span class="chip">' + esc(cat) + '</span>'; }).join('');
    return '<article class="post-card">' +
      '<h3><a href="#/post/' + encodeURIComponent(post.slug) + '">' + esc(post.title) + '</a></h3>' +
      '<div class="post-meta"><span>' + dateText(post.publishedAt) + '</span><span>' + esc(post.archive) + '</span></div>' +
      (post.excerpt ? '<p>' + esc(post.excerpt) + '</p>' : '') +
      ((tags || cats) ? '<div class="chips">' + cats + tags + '</div>' : '') +
      '</article>';
  }

  function renderHome() {
    markNav('home');
    document.title = 'coderkou | 博客';
    root.innerHTML = '<section class="hero"><h2>写作与工程实践</h2><p>后台写 Markdown，编译即同步到前台。侧边栏、首页、归档全部由同一份内存数据驱动。</p></section>' +
      '<section class="post-list">' +
      (state.posts.length ? state.posts.map(card).join('') : '<div class="empty">暂无文章，去后台发布第一篇吧。</div>') +
      '</section>';
  }

  function renderArchives() {
    markNav('archives');
    document.title = '归档 | coderkou';
    const groups = new Map();
    state.posts.forEach(function (p) {
      const y = dateText(p.publishedAt).slice(0, 4);
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y).push(p);
    });
    const years = Array.from(groups.keys()).sort(function (a, b) { return Number(b) - Number(a); });
    const html = years.map(function (y) {
      return '<section><h3>' + y + ' (' + groups.get(y).length + ')</h3><div class="post-list">' + groups.get(y).map(card).join('') + '</div></section>';
    }).join('');
    root.innerHTML = '<section class="hero"><h2>归档</h2><p>共 ' + state.posts.length + ' 篇文章</p></section>' + (html || '<div class="empty">暂无归档内容。</div>');
  }

  function renderTermPage(type, term) {
    markNav(type);
    const key = type === 'tags' ? 'tags' : 'categories';
    const title = type === 'tags' ? '标签' : '分类';
    const groups = byTerm(state.posts, key);
    if (!term) {
      const html = Array.from(groups.entries()).sort(function (a, b) { return a[0].localeCompare(b[0], 'zh-CN'); }).map(function (entry) {
        return '<article class="post-card"><h3><a href="#/' + type + '/' + encodeURIComponent(entry[0]) + '">' + esc(entry[0]) + '</a></h3><div class="post-meta"><span>共 ' + entry[1].length + ' 篇</span></div></article>';
      }).join('');
      root.innerHTML = '<section class="hero"><h2>' + title + '</h2><p>共 ' + groups.size + ' 个' + title + '</p></section><section class="post-list">' + (html || '<div class="empty">暂无数据。</div>') + '</section>';
      document.title = title + ' | coderkou';
      return;
    }
    const list = groups.get(term) || [];
    root.innerHTML = '<section class="hero"><h2>' + title + '：' + esc(term) + '</h2><p>共 ' + list.length + ' 篇文章</p></section><section class="post-list">' + (list.length ? list.map(card).join('') : '<div class="empty">没有相关文章。</div>') + '</section>';
    document.title = term + ' | coderkou';
  }

  function loadMarkdown(post) {
    if (state.contentCache.has(post.contentPath)) {
      return Promise.resolve(state.contentCache.get(post.contentPath));
    }
    return fetch('/' + post.contentPath + '?ts=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('无法加载文章正文: ' + post.contentPath);
        return r.text();
      })
      .then(function (text) {
        state.contentCache.set(post.contentPath, text);
        return text;
      });
  }

  function renderPost(slug) {
    markNav('home');
    const post = state.posts.find(function (p) { return p.slug === slug; });
    if (!post) {
      root.innerHTML = '<div class="empty">文章不存在。</div>';
      return;
    }
    document.title = post.title + ' | coderkou';
    loadMarkdown(post)
      .then(function (md) {
        const html = window.marked ? window.marked.parse(md) : '<pre>' + esc(md) + '</pre>';
        const stats = readingStats(md);
        root.innerHTML = '<article class="article">' +
          '<h1>' + esc(post.title) + '</h1>' +
          '<div class="article-meta">发布于 ' + dateText(post.publishedAt) + (post.archive ? ' · ' + esc(post.archive) : '') + '</div>' +
          '<div class="article-reading-meta"><span>约 ' + stats.words + ' 字</span><span>预计阅读 ' + stats.minutes + ' 分钟</span></div>' +
          '<div class="chips">' +
          post.categories.map(function (c) { return '<a class="chip" href="#/categories/' + encodeURIComponent(c) + '">' + esc(c) + '</a>'; }).join('') +
          post.tags.map(function (t) { return '<a class="chip" href="#/tags/' + encodeURIComponent(t) + '">#' + esc(t) + '</a>'; }).join('') +
          '</div>' +
          '<div class="article-body">' + html + '</div>' +
          renderPostNav(post) +
          renderRelated(post) +
        '</article>';
        enhanceHeadings();
        enhanceCodeBlocks();
        window.scrollTo(0, 0);
      })
      .catch(function (err) {
        root.innerHTML = '<div class="empty">' + esc(err.message || '文章加载失败') + '</div>';
      });
  }

  function readingStats(md) {
    const text = String(md || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#*>`\-]/g, ' ');
    const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
    const total = cjk + words;
    return { words: total, minutes: Math.max(1, Math.round(total / 350)) };
  }

  function slugify(text) {
    return String(text || '').trim().toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section';
  }

  function enhanceHeadings() {
    const body = root.querySelector('.article-body');
    if (!body) return;
    const headings = body.querySelectorAll('h2, h3');
    const used = new Set();
    const items = [];
    headings.forEach(function (h) {
      let id = slugify(h.textContent);
      let unique = id;
      let n = 1;
      while (used.has(unique)) { unique = id + '-' + n++; }
      used.add(unique);
      h.id = unique;
      items.push({ id: unique, text: h.textContent, level: h.tagName === 'H3' ? 3 : 2 });
    });
    if (items.length < 2) return;
    const toc = document.createElement('nav');
    toc.id = 'articleToc';
    toc.className = 'toc';
    toc.innerHTML = '<div class="toc-title">目录</div><ul>' + items.map(function (it) {
      return '<li><a class="level-' + it.level + '" href="#' + it.id + '">' + esc(it.text) + '</a></li>';
    }).join('') + '</ul>';
    body.parentNode.insertBefore(toc, body);
    toc.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        const el = document.getElementById(a.getAttribute('href').slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function langFromClass(codeEl) {
    const cls = (codeEl.className || '').match(/language-([\w-]+)/);
    return cls ? cls[1].toLowerCase() : '';
  }

  function enhanceCodeBlocks() {
    const body = root.querySelector('.article-body');
    if (!body) return;
    body.querySelectorAll('pre').forEach(function (pre) {
      const code = pre.querySelector('code');
      const lang = code ? langFromClass(code) : '';
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      const runtime = RUN_LANGS[lang];
      const runBtn = runtime ? '<button type="button" data-act="run">运行</button>' : '';
      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      toolbar.innerHTML = '<span class="code-lang">' + esc(lang || 'text') + '</span>' +
        '<span class="code-actions">' + runBtn + '<button type="button" data-act="copy">复制</button></span>';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(toolbar);
      wrapper.appendChild(pre);
      const output = document.createElement('div');
      output.className = 'code-output hidden';
      wrapper.appendChild(output);

      const source = code ? code.textContent : pre.textContent;
      toolbar.querySelector('[data-act="copy"]').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        copyText(source).then(function () {
          btn.textContent = '已复制';
          setTimeout(function () { btn.textContent = '复制'; }, 1400);
        });
      });
      const rb = toolbar.querySelector('[data-act="run"]');
      if (rb) {
        rb.addEventListener('click', function () {
          runCode(runtime, source, output, rb);
        });
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
      resolve();
    });
  }

  function runCode(runtime, source, output, btn) {
    output.classList.remove('hidden', 'error');
    output.textContent = '运行中…';
    if (runtime === 'javascript') {
      runJavaScript(source, output);
      return;
    }
    runRemote(runtime, source, output, btn);
  }

  function runJavaScript(source, output) {
    const logs = [];
    const sandbox = {
      console: {
        log: pushLog, info: pushLog, warn: pushLog, error: pushLog,
        debug: pushLog
      }
    };
    function pushLog() {
      logs.push(Array.prototype.map.call(arguments, function (a) {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch (e) { return String(a); }
      }).join(' '));
    }
    try {
      const fn = new Function('console', '"use strict";\n' + source);
      const result = fn(sandbox.console);
      if (result !== undefined) logs.push('=> ' + (typeof result === 'object' ? JSON.stringify(result) : String(result)));
      output.classList.remove('error');
      output.textContent = logs.length ? logs.join('\n') : '(无输出)';
    } catch (err) {
      output.classList.add('error');
      output.textContent = String(err && err.stack ? err.stack : err);
    }
  }

  function runRemote(language, source, output, btn) {
    const compiler = WANDBOX_COMPILERS[language];
    if (!compiler) {
      output.classList.add('error');
      output.textContent = '暂不支持在线运行该语言：' + language;
      return;
    }
    const code = language === 'java'
      ? source.replace(/public\s+((?:final\s+|abstract\s+|strictfp\s+)*class\s)/, '$1')
      : source;
    if (btn) btn.disabled = true;
    fetch(WANDBOX_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        compiler: compiler,
        save: false
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('执行服务返回 ' + r.status);
        return r.json();
      })
      .then(function (data) {
        const compileErr = data.compiler_error || '';
        const out = [data.program_output || '', data.program_error || ''].filter(Boolean).join('\n');
        const hasErr = !!compileErr || !!data.program_error || (data.status && data.status !== '0');
        output.classList.toggle('error', hasErr);
        const text = [compileErr, out].filter(Boolean).join('\n');
        output.textContent = text || '(无输出)';
      })
      .catch(function (err) {
        output.classList.add('error');
        output.textContent = '在线运行失败：' + (err.message || err) + '\n（办公网或离线环境可能无法访问执行服务，仅 JS 支持本地运行。）';
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  function renderPostNav(post) {
    const idx = state.posts.findIndex(function (p) { return p.slug === post.slug; });
    const newer = idx > 0 ? state.posts[idx - 1] : null;
    const older = idx >= 0 && idx < state.posts.length - 1 ? state.posts[idx + 1] : null;
    if (!newer && !older) return '';
    return '<nav class="post-nav">' +
      (newer ? '<a class="prev" href="#/post/' + encodeURIComponent(newer.slug) + '"><small>← 上一篇</small>' + esc(newer.title) + '</a>' : '<span></span>') +
      (older ? '<a class="next" href="#/post/' + encodeURIComponent(older.slug) + '"><small>下一篇 →</small>' + esc(older.title) + '</a>' : '<span></span>') +
      '</nav>';
  }

  function renderRelated(post) {
    const tagSet = new Set(post.tags.concat(post.categories));
    const scored = state.posts.filter(function (p) { return p.slug !== post.slug; }).map(function (p) {
      let score = 0;
      p.tags.concat(p.categories).forEach(function (t) { if (tagSet.has(t)) score++; });
      return { post: p, score: score };
    }).filter(function (s) { return s.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4);
    if (!scored.length) return '';
    return '<section class="related"><h3>相关文章</h3><div class="post-list">' +
      scored.map(function (s) { return card(s.post); }).join('') + '</div></section>';
  }

  function route() {
    closeSearch();
    const hash = (location.hash || '#/').replace(/^#/, '');
    const parts = hash.split('/').filter(Boolean);
    if (!parts.length) {
      renderHome();
      return;
    }
    if (parts[0] === 'post' && parts[1]) {
      renderPost(decodeURIComponent(parts.slice(1).join('/')));
      return;
    }
    if (parts[0] === 'archives') {
      renderArchives();
      return;
    }
    if (parts[0] === 'tags') {
      renderTermPage('tags', parts[1] ? decodeURIComponent(parts.slice(1).join('/')) : '');
      return;
    }
    if (parts[0] === 'categories') {
      renderTermPage('categories', parts[1] ? decodeURIComponent(parts.slice(1).join('/')) : '');
      return;
    }
    renderHome();
  }

  function boot() {
    restoreLayout();
    applyLayout();
    restoreTheme();

    const runtimeSnapshot = readRuntimeSnapshot();
    const hasRuntime = runtimeSnapshot ? applyRuntimeSnapshot(runtimeSnapshot) : false;

    fetch('/blog-data/posts.json?ts=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('posts.json 加载失败');
        return r.json();
      })
      .then(function (data) {
        const latestRuntime = readRuntimeSnapshot();
        if (latestRuntime && applyRuntimeSnapshot(latestRuntime)) {
          return;
        }
        if (hasRuntime) {
          return;
        }
        state.posts = normalize(data);
        state.contentCache = new Map();
        updateSidebar();
        route();
      })
      .catch(function (err) {
        root.innerHTML = '<div class="empty">' + esc(err.message || '加载失败') + '</div>';
      });

    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', openSearch);
    }
    if (searchOverlay) {
      searchOverlay.addEventListener('click', function (e) {
        if (e.target === searchOverlay) closeSearch();
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', function () { renderSearchResults(searchInput.value); });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveSearchActive(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveSearchActive(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); gotoSearchActive(); }
        else if (e.key === 'Escape') { closeSearch(); }
      });
    }

    document.addEventListener('keydown', function (e) {
      const typing = /^(INPUT|TEXTAREA)$/.test((e.target && e.target.tagName) || '');
      if (e.key === '/' && !typing) { e.preventDefault(); openSearch(); }
      else if (e.key === 'Escape') { closeSearch(); }
    });

    if (backToTop) {
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    window.addEventListener('storage', function (event) {
      if (event.key !== RUNTIME_KEY) return;
      const snapshot = readRuntimeSnapshot();
      if (snapshot) {
        applyRuntimeSnapshot(snapshot);
      }
    });
  }

  window.addEventListener('hashchange', route);
  boot();
})();
