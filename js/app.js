(function () {
  const root = document.getElementById('appRoot');
  const nav = document.getElementById('mainNav');
  const statsPosts = document.getElementById('statsPosts');
  const statsCategories = document.getElementById('statsCategories');
  const statsTags = document.getElementById('statsTags');
  const recentList = document.getElementById('recentList');
  const tagCloud = document.getElementById('tagCloud');
  const categoryCloud = document.getElementById('categoryCloud');

  const state = {
    posts: [],
    contentCache: new Map()
  };

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
        root.innerHTML = '<article class="article">' +
          '<h1>' + esc(post.title) + '</h1>' +
          '<div class="article-meta">发布于 ' + dateText(post.publishedAt) + (post.archive ? ' · ' + esc(post.archive) : '') + '</div>' +
          '<div class="chips">' +
          post.categories.map(function (c) { return '<a class="chip" href="#/categories/' + encodeURIComponent(c) + '">' + esc(c) + '</a>'; }).join('') +
          post.tags.map(function (t) { return '<a class="chip" href="#/tags/' + encodeURIComponent(t) + '">#' + esc(t) + '</a>'; }).join('') +
          '</div>' +
          '<div class="article-body">' + html + '</div>' +
        '</article>';
      })
      .catch(function (err) {
        root.innerHTML = '<div class="empty">' + esc(err.message || '文章加载失败') + '</div>';
      });
  }

  function route() {
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
    fetch('/blog-data/posts.json?ts=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('posts.json 加载失败');
        return r.json();
      })
      .then(function (data) {
        state.posts = normalize(data);
        updateSidebar();
        route();
      })
      .catch(function (err) {
        root.innerHTML = '<div class="empty">' + esc(err.message || '加载失败') + '</div>';
      });
  }

  window.addEventListener('hashchange', route);
  boot();
})();
