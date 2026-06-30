(function () {
  const loginShell = document.getElementById('loginShell');
  const appShell = document.getElementById('appShell');
  const loginBtn = document.getElementById('loginBtn');
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const loginStatus = document.getElementById('loginStatus');
  const logoutBtn = document.getElementById('logoutBtn');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const workspaceGrid = document.getElementById('workspaceGrid');

  const postList = document.getElementById('postList');
  const searchInput = document.getElementById('searchInput');
  const newBtn = document.getElementById('newBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const compileBtn = document.getElementById('compileBtn');
  const previewBtn = document.getElementById('previewBtn');
  const deployBtn = document.getElementById('deployBtn');
  const forceSyncCheckbox = document.getElementById('forceSync');

  const ownerInput = document.getElementById('owner');
  const repoInput = document.getElementById('repo');
  const branchInput = document.getElementById('branch');
  const tokenInput = document.getElementById('token');

  const titleInput = document.getElementById('title');
  const slugInput = document.getElementById('slug');
  const dateInput = document.getElementById('publishDate');
  const categoryInput = document.getElementById('category');
  const tagsInput = document.getElementById('tags');
  const excerptInput = document.getElementById('excerpt');
  const markdownInput = document.getElementById('markdown');
  const statusEl = document.getElementById('status');
  const previewBody = document.getElementById('previewBody');

  const materialQuery = document.getElementById('materialQuery');
  const materialSearchBtn = document.getElementById('materialSearchBtn');
  const materialTabSearch = document.getElementById('materialTabSearch');
  const materialTabFav = document.getElementById('materialTabFav');
  const materialFavCount = document.getElementById('materialFavCount');
  const materialStatus = document.getElementById('materialStatus');
  const materialList = document.getElementById('materialList');
  const materialMoreBtn = document.getElementById('materialMoreBtn');

  const STORAGE_KEY = 'blog-publisher-config-v3';
  const SESSION_KEY = 'blog-publisher-auth-v3';
  const LAYOUT_KEY = 'blog-publisher-layout-v1';
  const RUNTIME_KEY = 'blog-runtime-compiled-v1';
  const FAVORITES_KEY = 'blog-material-favorites-v1';
  const SUMMARY_CACHE_KEY = 'blog-material-summary-cache-v1';
  const HN_PAGE_SIZE = 30;

  const state = {
    posts: [],
    markdownMap: new Map(),
    selectedId: '',
    sidebarCollapsed: false,
    materialTab: 'search',
    materialResults: [],
    favorites: [],
    materialKeyword: '',
    materialPage: 0,
    materialPages: 0,
    materialLoading: false,
    summaryCache: {}
  };

  function applySidebarLayout() {
    if (!workspaceGrid || !toggleSidebarBtn) return;
    workspaceGrid.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    toggleSidebarBtn.textContent = state.sidebarCollapsed ? '展开侧边栏' : '隐藏侧边栏';
  }

  function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    applySidebarLayout();
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ sidebarCollapsed: state.sidebarCollapsed }));
  }

  function restoreLayout() {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (!raw) return;
      const layout = JSON.parse(raw);
      state.sidebarCollapsed = !!layout.sidebarCollapsed;
    } catch (e) {
      state.sidebarCollapsed = false;
    }
  }

  function setStatus(text) {
    statusEl.textContent = text;
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

  function splitTerms(value) {
    return String(value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function toDateInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  function slugify(value) {
    const base = String(value || '').trim().toLowerCase();
    const slug = base
      .replace(/[\\:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || 'new-post-' + Date.now();
  }

  function saveConfig() {
    const cfg = {
      owner: ownerInput.value.trim(),
      repo: repoInput.value.trim(),
      branch: branchInput.value.trim() || 'master',
      token: tokenInput.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cfg = JSON.parse(raw);
      ownerInput.value = cfg.owner || '';
      repoInput.value = cfg.repo || '';
      branchInput.value = cfg.branch || 'master';
      tokenInput.value = cfg.token || '';
    } catch (e) {
      console.warn(e);
    }
  }

  function renderPostList() {
    const query = searchInput.value.trim().toLowerCase();
    const list = state.posts.filter(function (post) {
      if (!query) return true;
      return post.title.toLowerCase().includes(query) || post.slug.toLowerCase().includes(query);
    });
    postList.innerHTML = list.map(function (post) {
      const active = post.id === state.selectedId ? ' active' : '';
      return '<article class="post-item' + active + '" data-id="' + esc(post.id) + '">' +
        '<strong>' + esc(post.title) + '</strong>' +
        '<small>' + esc(toDateInput(post.publishedAt)) + ' · ' + esc(post.slug) + '</small>' +
      '</article>';
    }).join('');
  }

  function currentPost() {
    return state.posts.find(function (p) { return p.id === state.selectedId; }) || null;
  }

  function fillForm(post) {
    if (!post) {
      titleInput.value = '';
      slugInput.value = '';
      dateInput.value = '';
      categoryInput.value = '';
      tagsInput.value = '';
      excerptInput.value = '';
      markdownInput.value = '';
      previewBody.innerHTML = '';
      return;
    }
    titleInput.value = post.title;
    slugInput.value = post.slug;
    dateInput.value = toDateInput(post.publishedAt);
    categoryInput.value = post.categories.join(', ');
    tagsInput.value = post.tags.join(', ');
    excerptInput.value = post.excerpt || '';
    markdownInput.value = state.markdownMap.get(post.contentPath) || '';
  }

  function deriveExcerpt(markdown) {
    const plain = String(markdown || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]+`/g, ' ')
      .replace(/[#>*\-\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain.slice(0, 120);
  }

  function compileCurrent() {
    let post = currentPost();
    const title = titleInput.value.trim();
    if (!title) {
      setStatus('请先填写标题。');
      return null;
    }

    const slug = slugify(slugInput.value || title);
    const date = dateInput.value || new Date().toISOString().slice(0, 10);
    const categories = splitTerms(categoryInput.value);
    const tags = splitTerms(tagsInput.value);
    const markdown = markdownInput.value.replace(/\r\n?/g, '\n');
    const excerpt = excerptInput.value.trim() || deriveExcerpt(markdown);
    const contentPath = 'blog-data/posts/' + slug + '.md';

    if (!post) {
      post = { id: slug };
      state.posts.unshift(post);
      state.selectedId = slug;
    }

    const oldPath = post.contentPath;
    post.id = slug;
    post.slug = slug;
    post.title = title;
    post.publishedAt = date + 'T00:00:00Z';
    post.archive = date.slice(0, 7).replace('-', '/');
    post.categories = categories;
    post.tags = tags;
    post.excerpt = excerpt;
    post.contentPath = contentPath;
    post.updatedAt = new Date().toISOString();

    if (oldPath && oldPath !== contentPath) {
      state.markdownMap.delete(oldPath);
    }
    state.markdownMap.set(contentPath, markdown + '\n');

    state.posts.sort(function (a, b) { return a.publishedAt < b.publishedAt ? 1 : -1; });
    writeRuntimeSnapshot();
    renderPostList();
    setStatus('编译完成：已更新内存数据库。');
    return post;
  }

  function writeRuntimeSnapshot() {
    const markdowns = {};
    state.markdownMap.forEach(function (content, contentPath) {
      markdowns[contentPath] = String(content || '');
    });

    const posts = state.posts.map(function (p) {
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        archive: p.archive,
        categories: p.categories,
        tags: p.tags,
        excerpt: p.excerpt,
        contentPath: p.contentPath,
        updatedAt: p.updatedAt || new Date().toISOString()
      };
    });

    localStorage.setItem(RUNTIME_KEY, JSON.stringify({
      updatedAt: new Date().toISOString(),
      posts: posts,
      markdowns: markdowns
    }));
  }

  function previewCurrent() {
    const post = compileCurrent();
    if (!post) return;
    const md = state.markdownMap.get(post.contentPath) || '';
    const html = window.marked ? window.marked.parse(md) : '<pre>' + esc(md) + '</pre>';
    previewBody.innerHTML = html;
  }

  function loadMaterialFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      state.favorites = Array.isArray(list) ? list : [];
    } catch (e) {
      state.favorites = [];
    }
  }

  function saveMaterialFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
  }

  function isFavorited(url) {
    return state.favorites.some(function (m) { return m.url === url; });
  }

  function toggleFavorite(item) {
    if (isFavorited(item.url)) {
      state.favorites = state.favorites.filter(function (m) { return m.url !== item.url; });
    } else {
      state.favorites = [Object.assign({}, item, { savedAt: new Date().toISOString() })].concat(state.favorites);
    }
    saveMaterialFavorites();
    renderMaterials();
  }

  function insertMaterial(item) {
    const snippet = '- [' + item.title + '](' + item.url + ')';
    const el = markdownInput;
    const start = typeof el.selectionStart === 'number' ? el.selectionStart : el.value.length;
    const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    el.value = before + prefix + snippet + '\n' + after;
    const caret = (before + prefix + snippet + '\n').length;
    el.focus();
    el.setSelectionRange(caret, caret);
    setStatus('已插入素材引用：' + item.title);
  }

  function fetchMaterials(keyword) {
    const url = 'https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=20&query=' + encodeURIComponent(keyword);
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('抓取失败(' + r.status + ')');
        return r.json();
      })
      .then(function (data) {
        const hits = Array.isArray(data.hits) ? data.hits : [];
        return hits
          .filter(function (h) { return h.url && h.title; })
          .map(function (h) {
            return {
              title: String(h.title),
              url: String(h.url),
              source: 'Hacker News',
              points: Number(h.points) || 0,
              author: String(h.author || ''),
              comments: Number(h.num_comments) || 0,
              createdAt: String(h.created_at || '')
            };
          })
          .sort(function (a, b) { return b.points - a.points; });
      });
  }

  function searchMaterials() {
    const keyword = (materialQuery.value || '').trim();
    if (!keyword) {
      materialStatus.textContent = '请输入关键词。';
      return;
    }
    state.materialTab = 'search';
    updateMaterialTabs();
    materialStatus.textContent = '正在抓取「' + keyword + '」相关优质文章...';
    materialList.innerHTML = '';
    fetchMaterials(keyword)
      .then(function (items) {
        state.materialResults = items;
        materialStatus.textContent = items.length
          ? '共找到 ' + items.length + ' 篇（按热度排序）。'
          : '未找到相关文章，换个关键词试试。';
        renderMaterials();
      })
      .catch(function (err) {
        materialStatus.textContent = '抓取失败：' + (err.message || String(err)) + '（可能受网络限制）';
      });
  }

  function updateMaterialTabs() {
    materialTabSearch.classList.toggle('active', state.materialTab === 'search');
    materialTabFav.classList.toggle('active', state.materialTab === 'fav');
    if (materialFavCount) materialFavCount.textContent = String(state.favorites.length);
  }

  function renderMaterials() {
    updateMaterialTabs();
    const list = state.materialTab === 'fav' ? state.favorites : state.materialResults;
    if (!list.length) {
      materialList.innerHTML = '<p class="material-status">' +
        (state.materialTab === 'fav' ? '还没有收藏，点击搜索结果里的「收藏」。' : '暂无结果。') +
        '</p>';
      return;
    }
    materialList.innerHTML = list.map(function (item) {
      const faved = isFavorited(item.url);
      const meta = [];
      if (item.source) meta.push(esc(item.source));
      if (item.points) meta.push('▲ ' + item.points);
      if (item.comments) meta.push('💬 ' + item.comments);
      if (item.author) meta.push('@' + esc(item.author));
      return '<article class="material-item" data-url="' + esc(item.url) + '">' +
        '<a class="m-title" href="' + esc(item.url) + '" target="_blank" rel="noopener">' + esc(item.title) + '</a>' +
        '<div class="m-meta">' + meta.join('<span>·</span>') + '</div>' +
        '<div class="m-actions">' +
          '<button data-act="fav" class="' + (faved ? 'faved' : '') + '" type="button">' + (faved ? '已收藏' : '收藏') + '</button>' +
          '<button data-act="insert" type="button">插入正文</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function findMaterialByUrl(url) {
    return state.materialResults.find(function (m) { return m.url === url; }) ||
      state.favorites.find(function (m) { return m.url === url; }) || null;
  }

  function onMaterialListClick(event) {
    const btn = event.target.closest('button[data-act]');
    if (!btn) return;
    const node = event.target.closest('.material-item');
    if (!node) return;
    const url = node.getAttribute('data-url') || '';
    const item = findMaterialByUrl(url);
    if (!item) return;
    const act = btn.getAttribute('data-act');
    if (act === 'fav') toggleFavorite(item);
    if (act === 'insert') insertMaterial(item);
  }

  function loadFromRemote() {
    return fetch('/blog-data/posts.json?ts=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('无法加载 posts.json');
        return r.json();
      })
      .then(function (posts) {
        state.posts = (Array.isArray(posts) ? posts : []).map(function (p) {
          return {
            id: String(p.id || p.slug || ''),
            title: String(p.title || ''),
            slug: String(p.slug || ''),
            publishedAt: String(p.publishedAt || ''),
            archive: String(p.archive || ''),
            categories: Array.isArray(p.categories) ? p.categories : [],
            tags: Array.isArray(p.tags) ? p.tags : [],
            excerpt: String(p.excerpt || ''),
            contentPath: String(p.contentPath || ''),
            updatedAt: String(p.updatedAt || '')
          };
        }).filter(function (p) { return p.id && p.contentPath; });

        return Promise.all(state.posts.map(function (post) {
          return fetch('/' + post.contentPath + '?ts=' + Date.now())
            .then(function (r) { return r.ok ? r.text() : ''; })
            .then(function (text) { state.markdownMap.set(post.contentPath, text || ''); });
        }));
      })
      .then(function () {
        state.selectedId = state.posts[0] ? state.posts[0].id : '';
        renderPostList();
        fillForm(currentPost());
        setStatus('已加载远程数据，准备编辑。');
      });
  }

  function config() {
    return {
      owner: ownerInput.value.trim(),
      repo: repoInput.value.trim(),
      branch: branchInput.value.trim() || 'master',
      token: tokenInput.value.trim()
    };
  }

  function ghRequest(path, options) {
    const cfg = config();
    if (!cfg.token) throw new Error('请先填写 GitHub Token');
    const url = 'https://api.github.com' + path;
    const headers = Object.assign({
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + cfg.token,
      'X-GitHub-Api-Version': '2022-11-28'
    }, (options && options.headers) || {});
    return fetch(url, Object.assign({}, options || {}, { headers: headers })).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error('GitHub API错误(' + r.status + '): ' + t);
        });
      }
      if (r.status === 204) return null;
      return r.json();
    });
  }

  function buildPostsJson() {
    const out = state.posts.map(function (p) {
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        archive: p.archive,
        categories: p.categories,
        tags: p.tags,
        excerpt: p.excerpt,
        contentPath: p.contentPath,
        updatedAt: p.updatedAt || new Date().toISOString()
      };
    });
    return JSON.stringify(out, null, 2) + '\n';
  }

  function readStaticFile(path) {
    return fetch('/' + path + '?ts=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('读取静态文件失败: ' + path);
        return r.text();
      });
  }

  function buildDeploymentFiles() {
    const files = {};
    files['blog-data/posts.json'] = buildPostsJson();

    state.posts.forEach(function (post) {
      files[post.contentPath] = (state.markdownMap.get(post.contentPath) || '').replace(/\r\n?/g, '\n');
    });

    const staticFiles = [
      'index.html',
      'editor.html',
      'css/blog.css',
      'css/editor-modern.css',
      'js/vendor/marked.min.js',
      'js/app.js',
      'js/editor-new.js'
    ];

    return Promise.all(staticFiles.map(function (p) {
      return readStaticFile(p).then(function (text) { files[p] = text; });
    })).then(function () {
      return files;
    });
  }

  function upsertByContentsApi(files) {
    const cfg = config();
    const paths = Object.keys(files);
    let chain = Promise.resolve();
    paths.forEach(function (filePath) {
      chain = chain.then(function () {
        const basePath = '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + encodeURIComponent(filePath).replace(/%2F/g, '/');
        return ghRequest(basePath + '?ref=' + encodeURIComponent(cfg.branch), { method: 'GET' })
          .then(function (existing) {
            return existing && existing.sha ? existing.sha : '';
          })
          .catch(function () {
            return '';
          })
          .then(function (sha) {
            const body = {
              message: 'chore(blog): deploy ' + filePath,
              content: btoa(unescape(encodeURIComponent(files[filePath]))),
              branch: cfg.branch
            };
            if (sha) body.sha = sha;
            return ghRequest(basePath, {
              method: 'PUT',
              body: JSON.stringify(body)
            });
          });
      });
    });
    return chain;
  }

  function forceSyncByGitTree(files) {
    const cfg = config();
    const repoBase = '/repos/' + cfg.owner + '/' + cfg.repo;
    const managedPaths = new Set(Object.keys(files));

    function shouldKeepRemote(path) {
      if (managedPaths.has(path)) return true;
      if (path === 'CNAME' || path === 'readme.md' || path === 'README.md') return true;
      if (path.indexOf('images/') === 0) return true;
      if (path.indexOf('.github/') === 0) return true;
      return false;
    }

    return ghRequest(repoBase + '/git/ref/heads/' + encodeURIComponent(cfg.branch), { method: 'GET' })
      .then(function (ref) {
        const latestCommitSha = ref.object.sha;
        return ghRequest(repoBase + '/git/commits/' + latestCommitSha, { method: 'GET' })
          .then(function (commit) {
            return {
              latestCommitSha: latestCommitSha,
              baseTreeSha: commit.tree.sha
            };
          });
      })
      .then(function (ctx) {
        return Promise.all(Object.keys(files).map(function (path) {
          return ghRequest(repoBase + '/git/blobs', {
            method: 'POST',
            body: JSON.stringify({
              content: files[path],
              encoding: 'utf-8'
            })
          }).then(function (blob) {
            return {
              path: path,
              mode: '100644',
              type: 'blob',
              sha: blob.sha
            };
          });
        })).then(function (entries) {
          return ghRequest(repoBase + '/git/trees/' + ctx.baseTreeSha + '?recursive=1', { method: 'GET' })
            .then(function (treeRes) {
              const deletions = (treeRes.tree || []).filter(function (node) {
                return node.type === 'blob' && !shouldKeepRemote(node.path);
              }).map(function (node) {
                return {
                  path: node.path,
                  mode: '100644',
                  type: 'blob',
                  sha: null
                };
              });
              return {
                latestCommitSha: ctx.latestCommitSha,
                baseTreeSha: ctx.baseTreeSha,
                tree: entries.concat(deletions)
              };
            });
        });
      })
      .then(function (payload) {
        return ghRequest(repoBase + '/git/trees', {
          method: 'POST',
          body: JSON.stringify({
            base_tree: payload.baseTreeSha,
            tree: payload.tree
          })
        }).then(function (newTree) {
          return {
            latestCommitSha: payload.latestCommitSha,
            treeSha: newTree.sha
          };
        });
      })
      .then(function (ctx) {
        return ghRequest(repoBase + '/git/commits', {
          method: 'POST',
          body: JSON.stringify({
            message: 'chore(blog): force sync full site',
            tree: ctx.treeSha,
            parents: [ctx.latestCommitSha]
          })
        });
      })
      .then(function (commit) {
        return ghRequest(repoBase + '/git/refs/heads/' + encodeURIComponent(cfg.branch), {
          method: 'PATCH',
          body: JSON.stringify({
            sha: commit.sha,
            force: true
          })
        });
      });
  }

  function validateDeployConfig() {
    const cfg = config();
    if (!cfg.owner || !cfg.repo || !cfg.branch || !cfg.token) {
      throw new Error('请完整填写 Owner / Repo / Branch / Token');
    }
  }

  function deploy() {
    try {
      validateDeployConfig();
      compileCurrent();
      saveConfig();
    } catch (err) {
      setStatus(err.message || String(err));
      return;
    }

    const force = !!forceSyncCheckbox.checked;
    setStatus(force ? '正在执行强制同步（全量覆盖）...' : '正在部署（增量更新）...');

    buildDeploymentFiles()
      .then(function (files) {
        if (force) return forceSyncByGitTree(files);
        return upsertByContentsApi(files);
      })
      .then(function () {
        localStorage.removeItem(RUNTIME_KEY);
        setStatus('部署成功。前台刷新后可见最新内容。');
      })
      .catch(function (err) {
        setStatus('部署失败：' + (err.message || String(err)));
      });
  }

  function createPost() {
    state.selectedId = '';
    fillForm(null);
    titleInput.focus();
    setStatus('新建模式：填写后点击“编译”。');
  }

  function removePost() {
    const post = currentPost();
    if (!post) {
      setStatus('请先选择文章。');
      return;
    }
    if (!confirm('确认删除文章：' + post.title + ' ?')) return;
    state.posts = state.posts.filter(function (p) { return p.id !== post.id; });
    state.markdownMap.delete(post.contentPath);
    state.selectedId = state.posts[0] ? state.posts[0].id : '';
    writeRuntimeSnapshot();
    renderPostList();
    fillForm(currentPost());
    setStatus('已删除，点击部署后远程将同步删除。');
  }

  function onPostListClick(event) {
    const node = event.target.closest('.post-item');
    if (!node) return;
    const id = node.getAttribute('data-id') || '';
    state.selectedId = id;
    renderPostList();
    fillForm(currentPost());
  }

  function tryLogin() {
    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();
    if (user !== 'coderkou' || pass !== 'coderkou') {
      loginStatus.textContent = '账号或密码错误';
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');
    loginShell.classList.add('hidden');
    appShell.classList.remove('hidden');
    loginStatus.textContent = '';
    loadConfig();
    loadFromRemote().catch(function (err) {
      setStatus('初始化失败：' + (err.message || String(err)));
    });
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    appShell.classList.add('hidden');
    loginShell.classList.remove('hidden');
  }

  function bootstrap() {
    restoreLayout();
    applySidebarLayout();

    loginBtn.addEventListener('click', tryLogin);
    logoutBtn.addEventListener('click', logout);
    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }
    newBtn.addEventListener('click', createPost);
    deleteBtn.addEventListener('click', removePost);
    compileBtn.addEventListener('click', compileCurrent);
    previewBtn.addEventListener('click', previewCurrent);
    deployBtn.addEventListener('click', deploy);
    postList.addEventListener('click', onPostListClick);
    searchInput.addEventListener('input', renderPostList);

    if (materialSearchBtn) materialSearchBtn.addEventListener('click', searchMaterials);
    if (materialQuery) {
      materialQuery.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') searchMaterials();
      });
    }
    if (materialTabSearch) {
      materialTabSearch.addEventListener('click', function () {
        state.materialTab = 'search';
        renderMaterials();
      });
    }
    if (materialTabFav) {
      materialTabFav.addEventListener('click', function () {
        state.materialTab = 'fav';
        renderMaterials();
      });
    }
    if (materialList) materialList.addEventListener('click', onMaterialListClick);
    loadMaterialFavorites();
    renderMaterials();

    ownerInput.addEventListener('change', saveConfig);
    repoInput.addEventListener('change', saveConfig);
    branchInput.addEventListener('change', saveConfig);
    tokenInput.addEventListener('change', saveConfig);

    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      loginShell.classList.add('hidden');
      appShell.classList.remove('hidden');
      loadConfig();
      loadFromRemote().catch(function (err) {
        setStatus('初始化失败：' + (err.message || String(err)));
      });
    }
  }

  bootstrap();
})();
