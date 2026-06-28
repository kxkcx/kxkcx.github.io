(function () {
  function safeText(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      if (ch === '>') return '&gt;';
      if (ch === '"') return '&quot;';
      return '&#39;';
    });
  }
  function normalizeUrl(url) {
    var value = String(url || '').trim();
    if (!value) return '';
    return value.charAt(0) === '/' ? value : '/' + value;
  }
  function parseDate(input) {
    var d = new Date(input || '');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function dayText(d) {
    return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dateText(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
  }
  function sorted(posts) {
    return posts.slice().sort(function (a, b) { return b.date - a.date; });
  }
  function slug(value) {
    return encodeURIComponent(String(value || '').trim()).replace(/%2F/gi, '/');
  }
  function groupByTerm(posts, key) {
    var groups = {};
    posts.forEach(function (post) {
      list(post[key]).forEach(function (term) {
        if (!groups[term]) groups[term] = [];
        groups[term].push(post);
      });
    });
    return groups;
  }
  function updateCounts(posts) {
    var tagTotal = Object.keys(groupByTerm(posts, 'tags')).length;
    var categoryTotal = Object.keys(groupByTerm(posts, 'categories')).length;
    document.querySelectorAll('.site-state-posts .site-state-item-count').forEach(function (n) { n.textContent = String(posts.length); });
    document.querySelectorAll('.site-state-tags .site-state-item-count').forEach(function (n) { n.textContent = String(tagTotal); });
    document.querySelectorAll('.site-state-categories .site-state-item-count').forEach(function (n) { n.textContent = String(categoryTotal); });
  }
  function termMeta(post) {
    var html = '';
    if (post.categories.length) {
      html += '<span class="post-meta-item"><span class="post-meta-item-icon"><i class="far fa-folder"></i></span><span class="post-meta-item-text">分类于</span> ' + post.categories.map(function (c) { return '<a href="/categories/?term=' + slug(c) + '">' + safeText(c) + '</a>'; }).join(' / ') + '</span>';
    }
    if (post.tags.length) {
      html += '<span class="post-meta-item"><span class="post-meta-item-icon"><i class="fa fa-tags"></i></span><span class="post-meta-item-text">标签</span> ' + post.tags.map(function (t) { return '<a href="/tags/?term=' + slug(t) + '">#' + safeText(t) + '</a>'; }).join(' ') + '</span>';
    }
    return html;
  }
  function postBlock(post) {
    var body = post.excerpt ? ('<div class="post-body" itemprop="articleBody"><p>' + safeText(post.excerpt) + '</p></div>') : '';
    return '<div class="post-block" style="visibility:visible;opacity:1;transform:none"><article itemscope itemtype="http://schema.org/Article" class="post-content"><header class="post-header"><h2 class="post-title" itemprop="name headline"><a href="' + safeText(post.url) + '" class="post-title-link" itemprop="url">' + safeText(post.title) + '</a></h2><div class="post-meta-container"><div class="post-meta"><span class="post-meta-item"><span class="post-meta-item-icon"><i class="far fa-calendar"></i></span><span class="post-meta-item-text">发表于</span><time>' + dateText(post.date) + '</time></span>' + termMeta(post) + '</div></div></header>' + body + '</article></div>';
  }
  function patchHome(posts) {
    var root = document.querySelector('.main-inner.index.posts-expand');
    if (!root) return;
    root.querySelectorAll('.post-block').forEach(function (n) { n.remove(); });
    root.insertAdjacentHTML('beforeend', sorted(posts).filter(function (p) { return p.date && p.url; }).map(postBlock).join(''));
  }
  function archiveHtml(posts) {
    var valid = sorted(posts.filter(function (p) { return !!p.date; }));
    var groups = {};
    valid.forEach(function (item) { var y = String(item.date.getFullYear()); (groups[y] || (groups[y] = [])).push(item); });
    var html = '<div class="collection-title"><span class="collection-header">嗯..! 目前共计 ' + valid.length + ' 篇日志。继续努力。</span></div>';
    Object.keys(groups).sort(function (a, b) { return Number(b) - Number(a); }).forEach(function (year) {
      html += '<div class="collection-year"><span class="collection-header">' + year + '<span class="collection-year-count">' + groups[year].length + '</span></span></div>';
      groups[year].forEach(function (p) { html += '<article itemscope itemtype="http://schema.org/Article"><header class="post-header"><div class="post-meta-container"><time>' + dayText(p.date) + '</time></div><div class="post-title"><a class="post-title-link" href="' + safeText(p.url) + '">' + safeText(p.title) + '</a></div></header></article>'; });
    });
    return html;
  }
  function patchArchives(posts) {
    var content = document.querySelector('.main-inner.archive.posts-collapse .post-block .post-content');
    if (content) content.innerHTML = archiveHtml(posts);
  }
  function patchTags(posts) {
    var body = document.querySelector('.main-inner.page .post-body');
    if (!body || !/\/tags\/?(?:index\.html)?$/.test(location.pathname)) return;
    var groups = groupByTerm(posts, 'tags');
    var terms = Object.keys(groups).sort();
    body.innerHTML = '<div class="tag-cloud"><div class="tag-cloud-title">目前共计 ' + terms.length + ' 个标签</div><div class="tag-cloud-tags">' + terms.map(function (t) { return '<a href="/tags/?term=' + slug(t) + '" style="font-size: 12px;" class="tag-cloud-0">' + safeText(t) + '</a>'; }).join(' ') + '</div></div>';
  }
  function patchCategories(posts) {
    var body = document.querySelector('.main-inner.page .post-body');
    if (!body || !/\/categories\/?(?:index\.html)?$/.test(location.pathname)) return;
    var groups = groupByTerm(posts, 'categories');
    var terms = Object.keys(groups).sort();
    body.innerHTML = '<div class="category-all-page"><div class="category-all-title">目前共计 ' + terms.length + ' 个分类</div><div class="category-all"><ul class="category-list">' + terms.map(function (t) { return '<li class="category-list-item"><a class="category-list-link" href="/categories/?term=' + slug(t) + '">' + safeText(t) + '</a><span class="category-list-count">' + groups[t].length + '</span></li>'; }).join('') + '</ul></div></div>';
  }
  function patchTermListing(posts) {
    var params = new URLSearchParams(location.search || '');
    var term = params.get('term') || '';
    var isTagPage = /^\/tags\/?/.test(location.pathname);
    var isCategoryPage = /^\/categories\/?/.test(location.pathname);
    var tag = isTagPage ? term || decodeURIComponent((location.pathname.match(/^\/tags\/([^/]+)/) || [])[1] || '') : '';
    var category = isCategoryPage ? term || decodeURIComponent((location.pathname.match(/^\/categories\/([^/]+)/) || [])[1] || '') : '';
    var root = document.querySelector('.main-inner.archive.posts-collapse .post-block .post-content') || document.querySelector('.main-inner.page .post-body');
    if (!root || (!tag && !category)) return;
    var filtered = posts.filter(function (p) { return tag ? p.tags.indexOf(tag) !== -1 : p.categories.indexOf(category) !== -1; });
    root.innerHTML = archiveHtml(filtered);
  }
  fetch('/blog-data/posts.json?ts=' + Date.now())
    .then(function (r) { if (!r.ok) throw new Error('feed not found'); return r.json(); })
    .then(function (posts) {
      if (!Array.isArray(posts) || !posts.length) return;
      var normalized = posts.map(function (item) { return { title: String(item && item.title || ''), url: normalizeUrl(item && item.url || ''), date: parseDate(item && item.publishedAt), excerpt: String(item && item.excerpt || ''), categories: list(item && item.categories), tags: list(item && item.tags) }; }).filter(function (item) { return item.url; });
      updateCounts(normalized);
      patchHome(normalized);
      patchArchives(normalized);
      patchTags(normalized);
      patchCategories(normalized);
      patchTermListing(normalized);
    })
    .catch(function () {});
})();
