(function () {
  var storageKey = 'markdown-publisher-config-v1';
  var authKey = 'publisher-auth-ok';
  var defaultConfig = {
    owner: 'kxkcx',
    repo: 'kxkcx.github.io',
    branch: 'master',
    token: ''
  };

  var authShell = document.getElementById('authShell');
  var editorShell = document.getElementById('editorShell');
  var loginUserEl = document.getElementById('loginUser');
  var loginPassEl = document.getElementById('loginPass');
  var loginBtn = document.getElementById('loginBtn');
  var loginStatusEl = document.getElementById('loginStatus');
  var logoutBtn = document.getElementById('logoutBtn');

  function setLoginStatus(message, type) {
    if (!loginStatusEl) {
      return;
    }
    loginStatusEl.textContent = message;
    loginStatusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function isAuthenticated() {
    return sessionStorage.getItem(authKey) === '1';
  }

  function showEditor() {
    if (authShell) {
      authShell.style.display = 'none';
    }
    if (editorShell) {
      editorShell.style.display = '';
    }
  }

  function showLogin() {
    if (authShell) {
      authShell.style.display = '';
    }
    if (editorShell) {
      editorShell.style.display = 'none';
    }
    if (loginUserEl) {
      loginUserEl.value = '';
    }
    if (loginPassEl) {
      loginPassEl.value = '';
    }
  }

  function handleLogin() {
    var user = (loginUserEl && loginUserEl.value || '').trim();
    var pass = (loginPassEl && loginPassEl.value || '').trim();
    if (user === 'vesper' && pass === 'vesper') {
      sessionStorage.setItem(authKey, '1');
      setLoginStatus('登录成功。', 'success');
      showEditor();
      if (tokenEl && tokenEl.value.trim()) {
        listMarkdownDocs();
      }
      return;
    }
    setLoginStatus('账号或密码错误。', 'error');
  }

  function handleLogout() {
    sessionStorage.removeItem(authKey);
    if (loginPassEl) {
      loginPassEl.value = '';
    }
    setLoginStatus('已退出登录。', '');
    showLogin();
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  if (loginPassEl) {
    loginPassEl.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        handleLogin();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  if (isAuthenticated()) {
    showEditor();
  } else {
    showLogin();
    setLoginStatus('未登录', '');
  }

  var ownerEl = document.getElementById('owner');
  var repoEl = document.getElementById('repo');
  var branchEl = document.getElementById('branch');
  var tokenEl = document.getElementById('token');
  var titleEl = document.getElementById('title');
  var slugEl = document.getElementById('slug');
  var publishDateEl = document.getElementById('publishDate');
  var categoryEl = document.getElementById('category');
  var tagsEl = document.getElementById('tags');
  var markdownEl = document.getElementById('markdown');
  var statusEl = document.getElementById('status');
  var previewBodyEl = document.getElementById('previewBody');
  var previewBtn = document.getElementById('previewBtn');
  var compileBtn = document.getElementById('compileBtn');
  var deployBtn = document.getElementById('deployBtn');
  var previewPanel = document.getElementById('previewPanel');
  var tokenHelpBtn = document.getElementById('tokenHelpBtn');
  var verifyTokenBtn = document.getElementById('verifyTokenBtn');
  var workspaceGridEl = document.getElementById('workspaceGrid');
  var toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  var docPathEl = document.getElementById('docPath');
  var docTreeEl = document.getElementById('docTree');
  var selectedDirEl = document.getElementById('selectedDir');
  var docStatusEl = document.getElementById('docStatus');
  var refreshDocsBtn = document.getElementById('refreshDocsBtn');
  var selectedNodeEl = document.getElementById('selectedNode');
  var publishedDocListEl = document.getElementById('publishedDocList');
  var publishedStatusEl = document.getElementById('publishedStatus');
  var publishedCountEl = document.getElementById('publishedCount');
  var treeContextMenuEl = document.getElementById('treeContextMenu');
  var contextCreateDocBtn = document.getElementById('contextCreateDocBtn');
  var contextCreateDirBtn = document.getElementById('contextCreateDirBtn');
  var contextSaveDocBtn = document.getElementById('contextSaveDocBtn');
  var contextRenameDocBtn = document.getElementById('contextRenameDocBtn');
  var contextDeleteDocBtn = document.getElementById('contextDeleteDocBtn');
  var currentDocPath = '';
  var currentDocSha = '';
  var selectedDirPath = 'posts';
  var selectedNodeType = 'dir';
  var selectedNodePath = 'posts';
  var markdownPaths = [];
  var allDocPaths = [];
  var publishedHtmlPaths = [];
  var publishedPostMetaByPath = {};
  var directoryPaths = [];
  var directoryMarkerPaths = [];
  var compiledPayload = null;
  var compiledPreviewUrl = '';
  var compileDirty = true;
  var directoryMarkerName = '.publisher-dir';

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function setDocStatus(message, type) {
    if (!docStatusEl) {
      return;
    }
    docStatusEl.textContent = message;
    docStatusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function setPublishedStatus(message, type) {
    if (!publishedStatusEl) {
      return;
    }
    publishedStatusEl.textContent = message;
    publishedStatusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function markCompileDirty() {
    compileDirty = true;
  }

  function clearCompiledPreviewUrl() {
    if (compiledPreviewUrl) {
      URL.revokeObjectURL(compiledPreviewUrl);
      compiledPreviewUrl = '';
    }
  }

  function hideTreeContextMenu() {
    if (!treeContextMenuEl) {
      return;
    }
    treeContextMenuEl.hidden = true;
  }

  function updateTreeContextMenuState() {
    if (!treeContextMenuEl) {
      return;
    }

    var canCreate = selectedNodeType !== 'published';
    var canSave = selectedNodeType === 'file' && isMarkdownPath(selectedNodePath);
    var canRename = selectedNodeType === 'dir' || (selectedNodeType === 'file' && isMarkdownPath(selectedNodePath)) || selectedNodeType === 'published';
    var canDelete = selectedNodeType === 'dir' || (selectedNodeType === 'file' && isMarkdownPath(selectedNodePath)) || selectedNodeType === 'published';

    if (contextCreateDocBtn) {
      contextCreateDocBtn.disabled = !canCreate;
    }
    if (contextCreateDirBtn) {
      contextCreateDirBtn.disabled = !canCreate;
    }

    if (contextSaveDocBtn) {
      contextSaveDocBtn.disabled = !canSave;
    }
    if (contextRenameDocBtn) {
      contextRenameDocBtn.disabled = !canRename;
    }
    if (contextDeleteDocBtn) {
      contextDeleteDocBtn.disabled = !canDelete;
    }
  }

  function showTreeContextMenu(event, nodeType, nodePath) {
    if (!treeContextMenuEl) {
      return;
    }

    event.preventDefault();

    if (nodeType === 'file') {
      setSelectedFile(nodePath);
    } else if (nodeType === 'published') {
      setSelectedPublished(nodePath);
    } else {
      setSelectedDirectory(nodePath || 'posts');
    }

    updateTreeContextMenuState();
    treeContextMenuEl.hidden = false;

    var menuWidth = treeContextMenuEl.offsetWidth || 136;
    var menuHeight = treeContextMenuEl.offsetHeight || 180;
    var anchor = event.currentTarget;
    var rect = anchor && typeof anchor.getBoundingClientRect === 'function'
      ? anchor.getBoundingClientRect()
      : { left: event.clientX, right: event.clientX, top: event.clientY, bottom: event.clientY, height: 0 };
    var gap = 8;
    var preferredRight = rect.right + gap;
    var preferredLeft = rect.left - menuWidth - gap;
    var x = preferredRight + menuWidth <= window.innerWidth
      ? preferredRight
      : Math.max(8, preferredLeft);
    var maxY = window.innerHeight - menuHeight - 8;
    var y = Math.max(8, Math.min(rect.top, maxY));

    treeContextMenuEl.style.left = x + 'px';
    treeContextMenuEl.style.top = y + 'px';
  }

  function appendVersionToUrl(url, version) {
    var value = String(url || '');
    if (!value || value.indexOf('://') !== -1 || value.indexOf('data:') === 0 || value.indexOf('blob:') === 0 || value.charAt(0) !== '/') {
      return value;
    }
    if (/[?&]v=/.test(value)) {
      return value.replace(/([?&])v=[^&]*/i, '$1v=' + encodeURIComponent(version));
    }
    return value + (value.indexOf('?') === -1 ? '?' : '&') + 'v=' + encodeURIComponent(version);
  }

  function applyNoCacheMeta(doc) {
    var head = doc.head || doc.querySelector('head');
    if (!head) {
      return;
    }

    function upsertMeta(httpEquiv, content) {
      var selector = 'meta[http-equiv="' + httpEquiv + '"]';
      var node = head.querySelector(selector);
      if (!node) {
        node = doc.createElement('meta');
        node.setAttribute('http-equiv', httpEquiv);
        head.insertBefore(node, head.firstChild);
      }
      node.setAttribute('content', content);
    }

    upsertMeta('Cache-Control', 'no-cache, no-store, must-revalidate');
    upsertMeta('Pragma', 'no-cache');
    upsertMeta('Expires', '0');
  }

  function applyVersionToStaticAssets(doc, version) {
    var assetNodes = doc.querySelectorAll('link[href], script[src], img[src]');
    for (var i = 0; i < assetNodes.length; i++) {
      var node = assetNodes[i];
      if (node.hasAttribute('href')) {
        node.setAttribute('href', appendVersionToUrl(node.getAttribute('href'), version));
      }
      if (node.hasAttribute('src')) {
        node.setAttribute('src', appendVersionToUrl(node.getAttribute('src'), version));
      }
    }
  }

  function buildPreviewHtml(articleHtml) {
    var origin = window.location.origin.replace(/\/$/, '');
    return String(articleHtml || '')
      .replace(/(<head[^>]*>)/i, '$1\n<base href="' + origin + '/">')
      .replace(/(href|src)="\/(?!\/)/g, '$1="' + origin + '/');
  }

  function basename(path) {
    var chunks = String(path || '').split('/');
    return chunks[chunks.length - 1] || '';
  }

  function isDirectoryMarkerPath(path) {
    return new RegExp('(?:^|/)' + directoryMarkerName.replace('.', '\\.') + '$', 'i').test(String(path || ''));
  }

  function dirname(path) {
    var normalized = String(path || '').trim().replace(/\/+$/g, '');
    if (!normalized || normalized.indexOf('/') === -1) {
      return '';
    }
    return normalized.slice(0, normalized.lastIndexOf('/'));
  }

  function trimSlashes(path) {
    return String(path || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
  }

  function setSelectedDirectory(path) {
    selectedDirPath = trimSlashes(path) || 'posts';
    selectedNodeType = 'dir';
    selectedNodePath = selectedDirPath;
    if (selectedDirEl) {
      selectedDirEl.textContent = '当前目录: ' + selectedDirPath;
    }
    if (docPathEl && (!docPathEl.value.trim() || /\/$/.test(docPathEl.value.trim()))) {
      docPathEl.value = selectedDirPath + '/';
    }
    if (selectedNodeEl) {
      selectedNodeEl.textContent = '当前选中: 目录 ' + selectedDirPath;
    }
  }

  function setSelectedFile(path) {
    var normalized = trimSlashes(path);
    if (!normalized) {
      return;
    }
    selectedNodeType = 'file';
    selectedNodePath = normalized;
    selectedDirPath = dirname(normalized) || selectedDirPath || 'posts';
    if (selectedDirEl) {
      selectedDirEl.textContent = '当前目录: ' + selectedDirPath;
    }
    if (docPathEl) {
      docPathEl.value = normalized;
    }
    if (selectedNodeEl) {
      selectedNodeEl.textContent = '当前选中: 文件 ' + normalized;
    }
  }

  function setSelectedPublished(path) {
    var normalized = trimSlashes(path);
    if (!normalized) {
      return;
    }
    selectedNodeType = 'published';
    selectedNodePath = normalized;
    selectedDirPath = dirname(normalized) || selectedDirPath || 'posts';
    if (selectedDirEl) {
      selectedDirEl.textContent = '当前目录: ' + selectedDirPath;
    }
    if (docPathEl) {
      docPathEl.value = normalized;
    }
    if (selectedNodeEl) {
      selectedNodeEl.textContent = '当前选中: 已发布 ' + normalized;
    }
  }

  function findAvailableName(baseDir, preferredName) {
    var safeBaseDir = trimSlashes(baseDir);
    var baseName = String(preferredName || '').trim() || 'untitled.md';
    if (!/\.md$/i.test(baseName)) {
      baseName += '.md';
    }
    var candidate = safeBaseDir ? safeBaseDir + '/' + baseName : baseName;
    if (markdownPaths.indexOf(candidate) === -1) {
      return baseName;
    }

    var stem = baseName.replace(/\.md$/i, '');
    var index = 2;
    while (index < 1000) {
      var name = stem + ' ' + index + '.md';
      var path = safeBaseDir ? safeBaseDir + '/' + name : name;
      if (markdownPaths.indexOf(path) === -1) {
        return name;
      }
      index++;
    }
    return Date.now() + '.md';
  }

  function titleFromMarkdown(content, fallbackPath) {
    var match = String(content || '').match(/^#\s+(.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
    return basename(fallbackPath).replace(/\.md$/i, '') || getCurrentDateText();
  }

  function slugFromPath(path, fallbackTitle) {
    var file = basename(path).replace(/\.md$/i, '');
    var match = file.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
    if (match && match[1]) {
      return slugify(match[1]);
    }
    return slugify(file || fallbackTitle || 'new-post');
  }

  function getCurrentDateText() {
    var now = new Date();
    var y = String(now.getFullYear());
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function slugify(input) {
    return String(input || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'new-post';
  }

  function parseListInput(value) {
    return String(value || '')
      .split(/[，,]/)
      .map(function (item) { return item.trim(); })
      .filter(function (item, index, arr) { return item && arr.indexOf(item) === index; });
  }

  function getPublishDateFromPath(path) {
    var match = String(path || '').match(/(?:^posts\/)?(\d{4})-(\d{2})-(\d{2})|^(\d{4})\/(\d{2})\/(\d{2})\//i);
    if (!match) {
      return '';
    }
    return (match[1] || match[4]) + '-' + (match[2] || match[5]) + '-' + (match[3] || match[6]);
  }

  function parseMarkdownMeta(content) {
    var text = String(content || '');
    var meta = { title: '', date: '', categories: [], tags: [], body: text };
    var match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) {
      return meta;
    }
    var lines = match[1].split(/\r?\n/);
    var currentKey = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var pair = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
      if (pair) {
        currentKey = pair[1].toLowerCase();
        var value = pair[2].trim().replace(/^['"]|['"]$/g, '');
        if (currentKey === 'title') meta.title = value;
        if (currentKey === 'date') meta.date = value.slice(0, 10);
        if (currentKey === 'category' || currentKey === 'categories') meta.categories = parseListInput(value.replace(/^\[|\]$/g, ''));
        if (currentKey === 'tag' || currentKey === 'tags') meta.tags = parseListInput(value.replace(/^\[|\]$/g, ''));
        continue;
      }
      var item = line.match(/^\s*-\s*(.+)$/);
      if (item && (currentKey === 'categories' || currentKey === 'category')) {
        meta.categories.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
      }
      if (item && (currentKey === 'tags' || currentKey === 'tag')) {
        meta.tags.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
      }
    }
    meta.body = text.slice(match[0].length);
    return meta;
  }

  function escapeRegExp(value) {
    return String(value || '').replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
  }

  function stripLegacyPublishedIntro(markdown, title, dateText, fallbackPath) {
    var text = String(markdown || '').replace(/^\uFEFF/, '');
    var candidates = [title, dateText, basename(fallbackPath).replace(/\.md$/i, '')]
      .map(function (item) { return String(item || '').trim(); })
      .filter(function (item, index, arr) { return item && arr.indexOf(item) === index; });

    for (var i = 0; i < candidates.length; i++) {
      var pattern = new RegExp('^#\\s+' + escapeRegExp(candidates[i]) + '\\s*(?:\\r?\\n){1,2}', 'i');
      text = text.replace(pattern, '');
    }

    var datePattern = dateText ? escapeRegExp(dateText) : '\\d{4}-\\d{2}-\\d{2}';
    text = text.replace(new RegExp('^>\\s*发布时间[:：]\\s*' + datePattern + '\\s*(?:\\r?\\n){1,2}', 'i'), '');
    return text.replace(/^\s+/, '');
  }

  function buildMarkdownWithMeta(title, dateText, categories, tags, markdown) {
    var cleanedMarkdown = stripLegacyPublishedIntro(markdown, title, dateText, '');
    var lines = ['---', 'title: ' + title, 'date: ' + dateText, 'categories:'];
    if (categories.length) {
      categories.forEach(function (item) { lines.push('  - ' + item); });
    } else {
      lines.push('  - 未分类');
    }
    lines.push('tags:');
    if (tags.length) {
      tags.forEach(function (item) { lines.push('  - ' + item); });
    }
    lines.push('---', '', String(cleanedMarkdown || '').replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trim(), '');
    return lines.join('\n');
  }
  function buildExcerptFromMarkdown(markdown, maxLength) {
    var text = String(markdown || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
      .replace(/[#>*_~\-|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    return text.slice(0, maxLength).trim() + '...';
  }

  function isMarkdownPath(path) {
    return /\.md$/i.test(String(path || ''));
  }

  function isPublishedHtmlPath(path) {
    return /^\d{4}\/\d{2}\/\d{2}\/.+\/index\.html$/i.test(String(path || ''));
  }

  function parsePublishedHtmlMeta(path) {
    var match = String(path || '').match(/^(\d{4})\/(\d{2})\/(\d{2})\/(.+)\/index\.html$/i);
    if (!match) {
      return null;
    }
    return {
      year: match[1],
      month: match[2],
      day: match[3],
      slug: match[4]
    };
  }

  function displayNameForPath(path) {
    if (isPublishedHtmlPath(path)) {
      var meta = parsePublishedHtmlMeta(path);
      return (meta ? meta.slug : basename(path)) + ' (HTML)';
    }
    return basename(path);
  }

  function htmlArticleToMarkdown(htmlText, fallbackPath) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(String(htmlText || ''), 'text/html');
    var title = '';
    var titleNode = doc.querySelector('.article-title') || doc.querySelector('.post-title') || doc.querySelector('title');
    if (titleNode) {
      title = String(titleNode.textContent || '').trim();
    }
    if (!title) {
      title = basename(fallbackPath).replace(/\.html$/i, '');
    }

    var bodyNode = doc.querySelector('.article-entry') || doc.querySelector('.post-body') || doc.querySelector('article');
    var bodyText = bodyNode ? String(bodyNode.textContent || '').replace(/\r/g, '').trim() : '';
    if (!bodyText) {
      bodyText = '（从已发布 HTML 自动提取，建议补充正文）';
    }

    return '# ' + title + '\n\n' + bodyText + '\n';
  }

  function toBase64Utf8(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function fromBase64Utf8(base64Text) {
    var binary = atob(base64Text);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function encodePath(path) {
    return path.split('/').map(function (segment) {
      return encodeURIComponent(segment);
    }).join('/');
  }

  function loadConfig() {
    try {
      var raw = localStorage.getItem(storageKey);
      var parsed = raw ? JSON.parse(raw) : {};
      ownerEl.value = parsed.owner || defaultConfig.owner;
      repoEl.value = parsed.repo || defaultConfig.repo;
      branchEl.value = parsed.branch || defaultConfig.branch;
      tokenEl.value = parsed.token || defaultConfig.token;
    } catch (e) {
      ownerEl.value = defaultConfig.owner;
      repoEl.value = defaultConfig.repo;
      branchEl.value = defaultConfig.branch;
      tokenEl.value = defaultConfig.token;
    }

    if (!titleEl.value.trim()) {
      titleEl.value = getCurrentDateText();
    }
    if (!slugEl.value.trim()) {
      slugEl.value = getCurrentDateText();
    }
    if (publishDateEl && !publishDateEl.value) {
      publishDateEl.value = getCurrentDateText();
    }
  }

  function saveConfig() {
    localStorage.setItem(storageKey, JSON.stringify({
      owner: ownerEl.value.trim(),
      repo: repoEl.value.trim(),
      branch: branchEl.value.trim() || 'main',
      token: tokenEl.value.trim()
    }));
  }

  function renderPreview() {
    previewBodyEl.innerHTML = marked.parse(markdownEl.value || '');
    if (previewPanel) {
      previewPanel.open = true;
    }
  }

  async function resolveCompilePayload() {
    var deployVersion = String(Date.now());
    var markdown = markdownEl.value || '';
    var title = titleEl.value.trim();
    var selectedDocPath = String(docPathEl.value || '').trim();
    var markdownMeta = parseMarkdownMeta(markdown);
    if (markdownMeta.body !== markdown) {
      markdown = markdownMeta.body;
      markdownEl.value = markdown;
    }

    if (!title) {
      title = titleFromMarkdown(markdown, selectedDocPath || currentDocPath || '');
      titleEl.value = title;
    }

    if (!markdown.trim()) {
      markdown = '# ' + title + '\n\n';
      markdownEl.value = markdown;
    }
    var slug = slugify(slugEl.value.trim() || title);
    var categories = parseListInput(categoryEl && categoryEl.value || markdownMeta.categories.join(','));
    var tags = parseListInput(tagsEl && tagsEl.value || markdownMeta.tags.join(','));
    var dateValue = publishDateEl && publishDateEl.value || markdownMeta.date || getPublishDateFromPath(selectedDocPath) || getCurrentDateText();
    var dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.test(dateValue) ? dateValue.split('-') : getCurrentDateText().split('-');
    var year = dateParts[0];
    var month = dateParts[1];
    var day = dateParts[2];

    var postDocMatch = selectedDocPath.match(/^posts\/(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/i);
    if (postDocMatch) {
      if (!(publishDateEl && publishDateEl.value)) {
        year = postDocMatch[1];
        month = postDocMatch[2];
        day = postDocMatch[3];
      }
      if (!slugEl.value.trim()) {
        slug = slugify(postDocMatch[4]);
      }
    }

    var publishedHtmlMatch = selectedDocPath.match(/^(\d{4})\/(\d{2})\/(\d{2})\/(.+)\/index\.html$/i);
    if (publishedHtmlMatch) {
      if (!(publishDateEl && publishDateEl.value)) {
        year = publishedHtmlMatch[1];
        month = publishedHtmlMatch[2];
        day = publishedHtmlMatch[3];
      }
      if (!slugEl.value.trim()) {
        slug = slugify(publishedHtmlMatch[4]);
      }
    }
    slugEl.value = slug;
    if (publishDateEl) {
      publishDateEl.value = year + '-' + month + '-' + day;
    }
    if (categoryEl) {
      categoryEl.value = categories.join(', ');
    }
    if (tagsEl) {
      tagsEl.value = tags.join(', ');
    }

    var dateText = year + '-' + month + '-' + day;
    var cleanedMarkdown = stripLegacyPublishedIntro(markdown, title, dateText, selectedDocPath || currentDocPath || '');
    if (cleanedMarkdown !== markdown) {
      markdown = cleanedMarkdown;
      markdownEl.value = markdown;
    }
    var htmlContent = marked.parse(markdown);
    previewBodyEl.innerHTML = htmlContent;
    if (previewPanel) {
      previewPanel.open = true;
    }

    var htmlPath = year + '/' + month + '/' + day + '/' + slug + '/index.html';
    var markdownPath = selectedDocPath && /\.md$/i.test(selectedDocPath)
      ? selectedDocPath
      : 'posts/' + dateText + '-' + slug + '.md';
    var articleUrl = '/' + htmlPath;
    var excerpt = buildExcerptFromMarkdown(markdown, 180);
    var articleHtml = await buildArticleHtml(title, htmlContent, dateText, htmlPath, selectedDocPath, deployVersion, categories, tags);
    var markdownWithMeta = buildMarkdownWithMeta(title, dateText, categories, tags, markdown);

    return {
      title: title,
      markdown: markdown,
      selectedDocPath: selectedDocPath,
      slug: slug,
      dateText: dateText,
      htmlContent: htmlContent,
      htmlPath: htmlPath,
      markdownPath: markdownPath,
      articleUrl: articleUrl,
      excerpt: excerpt,
      articleHtml: articleHtml,
      markdownWithMeta: markdownWithMeta,
      categories: categories,
      tags: tags,
      archive: year + '/' + month,
      deployVersion: deployVersion
    };
  }

  async function compileArticle() {
    try {
      setStatus('正在编译 Markdown...', '');
      var payload = await resolveCompilePayload();
      compiledPayload = payload;
      compileDirty = false;
      clearCompiledPreviewUrl();
      compiledPreviewUrl = URL.createObjectURL(new Blob([buildPreviewHtml(payload.articleHtml)], { type: 'text/html;charset=utf-8' }));
      window.open(compiledPreviewUrl, '_blank', 'noopener');
      setStatus('编译完成，已生成本地网页结果。确认无误后再点“部署”推送到 GitHub。', 'success');
    } catch (error) {
      console.error(error);
      setStatus('编译失败: ' + error.message, 'error');
    }
  }

  async function githubRequest(url, token, options) {
    var response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      var detail = await response.text();
      var message = 'GitHub API 错误: ' + response.status + ' ' + detail;
      if (response.status === 403 && detail.indexOf('Resource not accessible by personal access token') !== -1) {
        message = 'Token 无法访问目标仓库。请确认 Token 具备 Contents: Read and write，并已授权该仓库。';
      }
      throw new Error(message);
    }

    return response.status === 204 ? null : response.json();
  }

  async function assertRepoWritable(owner, repo, token) {
    var repoInfo = await githubRequest('https://api.github.com/repos/' + owner + '/' + repo, token, { method: 'GET' });
    var p = repoInfo.permissions || {};
    var canWrite = p.push === true || p.admin === true || p.maintain === true;
    if (!canWrite) {
      throw new Error('Token 可以读取仓库，但没有写权限。请给该 Token 添加 Contents: Read and write。');
    }
  }

  async function getPagesSourceBranch(owner, repo, token) {
    try {
      var pageInfo = await githubRequest('https://api.github.com/repos/' + owner + '/' + repo + '/pages', token, { method: 'GET' });
      if (pageInfo && pageInfo.source && pageInfo.source.branch) {
        return pageInfo.source.branch;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async function verifyToken() {
    var token = tokenEl.value.trim();
    var owner = ownerEl.value.trim();
    var repo = repoEl.value.trim();
    if (!token) {
      setStatus('请先填写 Token。', 'error');
      return;
    }

    setStatus('正在验证 Token...', '');
    try {
      await githubRequest('https://api.github.com/user', token, { method: 'GET' });
      if (owner && repo) {
        await githubRequest('https://api.github.com/repos/' + owner + '/' + repo, token, { method: 'GET' });
      }
      setStatus('Token 验证通过，可以用于发布。', 'success');
    } catch (error) {
      setStatus('Token 验证失败: ' + error.message, 'error');
    }
  }

  async function getFileSha(owner, repo, branch, path, token) {
    var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodePath(path) + '?ref=' + encodeURIComponent(branch);
    var response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('读取文件失败: ' + path);
    }

    var payload = await response.json();
    return payload.sha || null;
  }

  async function readJsonFile(owner, repo, branch, path, token) {
    var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodePath(path) + '?ref=' + encodeURIComponent(branch);
    var response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      throw new Error('读取 JSON 失败: ' + path);
    }

    var payload = await response.json();
    var content = fromBase64Utf8((payload.content || '').replace(/\n/g, ''));
    return JSON.parse(content);
  }

  async function readTextFile(owner, repo, branch, path, token) {
    var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodePath(path) + '?ref=' + encodeURIComponent(branch);
    var response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('读取文本文件失败: ' + path);
    }

    var payload = await response.json();
    return {
      sha: payload.sha,
      content: fromBase64Utf8((payload.content || '').replace(/\n/g, ''))
    };
  }

  async function upsertFile(owner, repo, branch, path, content, token, message) {
    var sha = await getFileSha(owner, repo, branch, path, token);
    var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodePath(path);
    var body = {
      message: message,
      content: toBase64Utf8(content),
      branch: branch
    };

    if (sha) {
      body.sha = sha;
    }

    await githubRequest(url, token, {
      method: 'PUT',
      body: body
    });
  }

  async function deleteFile(owner, repo, branch, path, sha, token, message) {
    var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodePath(path);
    await githubRequest(url, token, {
      method: 'DELETE',
      body: {
        message: message,
        branch: branch,
        sha: sha
      }
    });
  }

  function getRepoContext() {
    return {
      owner: ownerEl.value.trim(),
      repo: repoEl.value.trim(),
      branch: branchEl.value.trim() || 'main',
      token: tokenEl.value.trim()
    };
  }

  async function getWritableRepoContext() {
    var context = getRepoContext();
    if (!context.owner || !context.repo || !context.token) {
      return context;
    }

    var pagesBranch = await getPagesSourceBranch(context.owner, context.repo, context.token);
    if (pagesBranch && pagesBranch !== context.branch) {
      context.branch = pagesBranch;
      branchEl.value = pagesBranch;
      saveConfig();
    }

    return context;
  }

  function buildTree(paths, dirs) {
    var root = { dirs: {}, files: [] };
    var dirList = Array.isArray(dirs) ? dirs.slice().sort(function (a, b) {
      return a.localeCompare(b);
    }) : [];

    for (var d = 0; d < dirList.length; d++) {
      var dirPath = dirList[d];
      var dirParts = dirPath.split('/');
      var dirCursor = root;
      for (var k = 0; k < dirParts.length; k++) {
        var dirPart = dirParts[k];
        if (!dirPart) {
          continue;
        }
        if (!dirCursor.dirs[dirPart]) {
          dirCursor.dirs[dirPart] = { name: dirPart, path: dirParts.slice(0, k + 1).join('/'), dirs: {}, files: [] };
        }
        dirCursor = dirCursor.dirs[dirPart];
      }
    }

    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var parts = path.split('/');
      var cursor = root;
      for (var j = 0; j < parts.length; j++) {
        var part = parts[j];
        var isLeaf = j === parts.length - 1;
        if (isLeaf) {
          cursor.files.push(path);
        } else {
          if (!cursor.dirs[part]) {
            cursor.dirs[part] = { name: part, path: parts.slice(0, j + 1).join('/'), dirs: {}, files: [] };
          }
          cursor = cursor.dirs[part];
        }
      }
    }
    return root;
  }

  function clearEditorState() {
    currentDocPath = '';
    currentDocSha = '';
    markdownEl.value = '';
    titleEl.value = '';
    slugEl.value = '';
    previewBodyEl.innerHTML = '';
    clearCompiledPreviewUrl();
    compiledPayload = null;
    compileDirty = true;
  }

  function ensureDirectoryPath(path) {
    var current = trimSlashes(path);
    while (current) {
      if (directoryPaths.indexOf(current) === -1) {
        directoryPaths.push(current);
      }
      current = dirname(current);
    }
    directoryPaths.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function rebuildDirectoryPathsFromState() {
    var dirs = collectDirectoryPathsFromFiles(markdownPaths);
    for (var i = 0; i < directoryMarkerPaths.length; i++) {
      var markerDir = dirname(directoryMarkerPaths[i]);
      if (markerDir && dirs.indexOf(markerDir) === -1) {
        dirs.push(markerDir);
      }
    }
    directoryPaths = dirs.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function refreshTreeFromState() {
    rebuildDirectoryPathsFromState();
    renderDocTree(markdownPaths);
  }

  function replacePathPrefix(path, oldPrefix, newPrefix) {
    return newPrefix + path.slice(oldPrefix.length);
  }

  function getPublishedInfoFromMarkdownPath(markdownPath) {
    var normalized = trimSlashes(markdownPath);
    var fileName = basename(normalized);
    var match = fileName.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/i);
    if (!match) {
      return null;
    }

    var year = match[1];
    var month = match[2];
    var day = match[3];
    var slug = slugify(match[4]);
    var htmlPath = year + '/' + month + '/' + day + '/' + slug + '/index.html';
    return {
      htmlPath: htmlPath,
      articleUrl: '/' + htmlPath
    };
  }

  function repoPathFromArticleUrl(url) {
    var normalized = String(url || '').trim().replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '');
    return trimSlashes(normalized);
  }

  async function deletePublishedArtifacts(context, markdownFilePaths) {
    var manifestPath = 'blog-data/posts.json';
    var articleUrls = [];

    for (var i = 0; i < markdownFilePaths.length; i++) {
      var info = getPublishedInfoFromMarkdownPath(markdownFilePaths[i]);
      if (!info) {
        continue;
      }

      articleUrls.push(info.articleUrl);
      var htmlSha = await getFileSha(context.owner, context.repo, context.branch, info.htmlPath, context.token);
      if (htmlSha) {
        await deleteFile(context.owner, context.repo, context.branch, info.htmlPath, htmlSha, context.token, 'publish: delete ' + info.htmlPath);
      }
    }

    if (!articleUrls.length) {
      return;
    }

    var posts = await readJsonFile(context.owner, context.repo, context.branch, manifestPath, context.token);
    var nextPosts = posts.filter(function (item) {
      return articleUrls.indexOf(String(item && item.url || '')) === -1;
    });

    await upsertFile(
      context.owner,
      context.repo,
      context.branch,
      manifestPath,
      JSON.stringify(nextPosts, null, 2) + '\n',
      context.token,
      'publish: remove deleted posts from manifest'
    );
  }

  function collectDirectoryPathsFromFiles(paths) {
    var dirMap = {};
    for (var i = 0; i < paths.length; i++) {
      var currentDir = dirname(paths[i]);
      while (currentDir) {
        dirMap[currentDir] = true;
        currentDir = dirname(currentDir);
      }
    }
    return Object.keys(dirMap);
  }

  function displayTitleFromPublishedPath(path) {
    var meta = publishedPostMetaByPath[trimSlashes(path)];
    if (meta && meta.title) {
      return meta.title;
    }
    var parsed = parsePublishedHtmlMeta(path);
    return parsed ? parsed.slug : basename(path);
  }

  function renderPublishedDocs(paths) {
    if (!publishedDocListEl) {
      return;
    }

    publishedDocListEl.innerHTML = '';
    var items = (paths || []).slice().sort(function (a, b) {
      return a.localeCompare(b);
    });

    if (publishedCountEl) {
      publishedCountEl.textContent = items.length + ' 篇';
    }

    for (var i = 0; i < items.length; i++) {
      var path = items[i];
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'published-item' + (path === currentDocPath ? ' active' : '');
      item.addEventListener('click', (function (targetPath) {
        return function () {
          loadMarkdownDoc(targetPath);
        };
      })(path));
      item.addEventListener('contextmenu', (function (targetPath) {
        return function (event) {
          showTreeContextMenu(event, 'published', targetPath);
        };
      })(path));

      var title = document.createElement('span');
      title.className = 'published-item-title';
      title.textContent = displayTitleFromPublishedPath(path);

      var sub = document.createElement('span');
      sub.className = 'published-item-path';
      sub.textContent = path;

      item.appendChild(title);
      item.appendChild(sub);
      publishedDocListEl.appendChild(item);
    }
  }

  function renderDirNode(node, container, depth) {
    var details = document.createElement('details');
    details.className = 'tree-dir';
    details.open = depth < 2 || selectedDirPath.indexOf(node.path) === 0 || currentDocPath.indexOf(node.path + '/') === 0;

    var summary = document.createElement('summary');
    summary.textContent = node.name;
    if (selectedNodeType === 'dir' && selectedNodePath === node.path) {
      summary.classList.add('active-dir');
    }
    summary.addEventListener('click', function () {
      setSelectedDirectory(node.path);
      renderDocTree(markdownPaths);
    });
    summary.addEventListener('contextmenu', function (event) {
      showTreeContextMenu(event, 'dir', node.path);
    });

    details.appendChild(summary);

    var childWrap = document.createElement('div');
    childWrap.className = 'tree-children';

    var dirNames = Object.keys(node.dirs).sort(function (a, b) {
      return a.localeCompare(b);
    });
    for (var i = 0; i < dirNames.length; i++) {
      renderDirNode(node.dirs[dirNames[i]], childWrap, depth + 1);
    }

    var files = node.files.slice().sort(function (a, b) {
      return a.localeCompare(b);
    });
    for (var j = 0; j < files.length; j++) {
      var filePath = files[j];
      var fileBtn = document.createElement('button');
      fileBtn.type = 'button';
      fileBtn.className = 'tree-file' + (filePath === currentDocPath ? ' active' : '');
      fileBtn.textContent = displayNameForPath(filePath);
      fileBtn.title = filePath;
      fileBtn.addEventListener('click', (function (path) {
        return function () {
          loadMarkdownDoc(path);
        };
      })(filePath));
      fileBtn.addEventListener('contextmenu', (function (path) {
        return function (event) {
          showTreeContextMenu(event, 'file', path);
        };
      })(filePath));
      childWrap.appendChild(fileBtn);
    }

    details.appendChild(childWrap);
    container.appendChild(details);
  }

  function renderDocTree(paths) {
    if (!docTreeEl) {
      return;
    }
    docTreeEl.innerHTML = '';
    var tree = buildTree(paths, directoryPaths);
    var rootTree = tree.dirs.posts || { dirs: {}, files: [] };

    var topDirs = Object.keys(rootTree.dirs).sort(function (a, b) {
      return a.localeCompare(b);
    });
    for (var i = 0; i < topDirs.length; i++) {
      renderDirNode(rootTree.dirs[topDirs[i]], docTreeEl, 0);
    }

    var rootFiles = rootTree.files.slice().sort(function (a, b) {
      return a.localeCompare(b);
    });
    for (var j = 0; j < rootFiles.length; j++) {
      var rootBtn = document.createElement('button');
      rootBtn.type = 'button';
      rootBtn.className = 'tree-file' + (rootFiles[j] === currentDocPath ? ' active' : '');
      rootBtn.textContent = displayNameForPath(rootFiles[j]);
      rootBtn.title = rootFiles[j];
      rootBtn.addEventListener('click', (function (path) {
        return function () {
          loadMarkdownDoc(path);
        };
      })(rootFiles[j]));
      rootBtn.addEventListener('contextmenu', (function (path) {
        return function (event) {
          showTreeContextMenu(event, 'file', path);
        };
      })(rootFiles[j]));
      docTreeEl.appendChild(rootBtn);
    }
  }

  async function listMarkdownDocs() {
    try {
      var context = getRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      setDocStatus('正在加载 Markdown 文档列表...', '');
      var treeUrl = 'https://api.github.com/repos/' + context.owner + '/' + context.repo + '/git/trees/' + encodeURIComponent(context.branch) + '?recursive=1';
      var tree = await githubRequest(treeUrl, context.token, { method: 'GET' });
      var nodes = Array.isArray(tree.tree) ? tree.tree : [];
      var docs = nodes
        .filter(function (node) {
          return node && node.type === 'blob' && /\.md$/i.test(node.path || '') && !isDirectoryMarkerPath(node.path || '');
        })
        .map(function (node) {
          return node.path;
        })
        .sort(function (a, b) {
          return a.localeCompare(b);
        });

      var htmlDocs = nodes
        .filter(function (node) {
          return node && node.type === 'blob' && isPublishedHtmlPath(node.path || '');
        })
        .map(function (node) {
          return node.path;
        })
        .sort(function (a, b) {
          return a.localeCompare(b);
        });

      var markers = nodes
        .filter(function (node) {
          return node && node.type === 'blob' && isDirectoryMarkerPath(node.path || '');
        })
        .map(function (node) {
          return node.path;
        });

      var manifestPosts = await readJsonFile(context.owner, context.repo, context.branch, 'blog-data/posts.json', context.token);
      var publishedMeta = {};
      var publishedList = [];
      var htmlDocSet = {};
      for (var h = 0; h < htmlDocs.length; h++) {
        htmlDocSet[htmlDocs[h]] = true;
      }
      for (var p = 0; p < manifestPosts.length; p++) {
        var item = manifestPosts[p];
        var repoPath = repoPathFromArticleUrl(item && item.url || '');
        if (repoPath && htmlDocSet[repoPath]) {
          publishedMeta[repoPath] = item;
          publishedList.push(repoPath);
        }
      }

      var dirs = collectDirectoryPathsFromFiles(docs.concat(htmlDocs));

      for (var m = 0; m < markers.length; m++) {
        var markerDir = dirname(markers[m]);
        if (markerDir && dirs.indexOf(markerDir) === -1) {
          dirs.push(markerDir);
        }
      }

      markdownPaths = docs;
      allDocPaths = docs;
      publishedHtmlPaths = publishedList;
      publishedPostMetaByPath = publishedMeta;
      directoryMarkerPaths = markers;
      directoryPaths = dirs.sort(function (a, b) {
        return a.localeCompare(b);
      });
      renderDocTree(markdownPaths);
      renderPublishedDocs(publishedHtmlPaths);
      setDocStatus('已加载 ' + docs.length + ' 个 Markdown 文档，' + publishedList.length + ' 个已发布博客。', 'success');
      setPublishedStatus('已加载 ' + publishedList.length + ' 个已发布博客。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('加载文档列表失败: ' + error.message, 'error');
      setPublishedStatus('加载已发布博客失败: ' + error.message, 'error');
    }
  }

  async function loadMarkdownDoc(path) {
    try {
      var targetPath = String(path || '').trim();
      if (!targetPath) {
        setDocStatus('请选择一个 Markdown 文档。', 'error');
        return;
      }

      var context = getRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      setDocStatus('正在加载文档: ' + targetPath, '');
      var file = await readTextFile(context.owner, context.repo, context.branch, targetPath, context.token);
      if (!file) {
        throw new Error('文档不存在: ' + targetPath);
      }

      var content = file.content;
      if (isPublishedHtmlPath(targetPath)) {
        content = htmlArticleToMarkdown(file.content, targetPath);
      }

      markdownEl.value = content;
      currentDocPath = targetPath;
      currentDocSha = file.sha || '';
      setSelectedFile(targetPath);
      var meta = parseMarkdownMeta(content);
      var publishedMeta = publishedPostMetaByPath[trimSlashes(targetPath)] || {};
      titleEl.value = meta.title || publishedMeta.title || titleFromMarkdown(meta.body || content, targetPath);
      slugEl.value = slugFromPath(targetPath, titleEl.value);
      var loadedDate = meta.date || String(publishedMeta.publishedAt || '').slice(0, 10) || getPublishDateFromPath(targetPath) || getCurrentDateText();
      if (publishDateEl) publishDateEl.value = loadedDate;
      if (categoryEl) categoryEl.value = (meta.categories.length ? meta.categories : (publishedMeta.categories || [])).join(', ');
      if (tagsEl) tagsEl.value = (meta.tags.length ? meta.tags : (publishedMeta.tags || [])).join(', ');
      content = stripLegacyPublishedIntro(meta.body || content, titleEl.value, loadedDate, targetPath);
      markdownEl.value = content;
      renderPreview();
      renderDocTree(allDocPaths);
      renderPublishedDocs(publishedHtmlPaths);
      setDocStatus('已加载文档: ' + targetPath, 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('加载文档失败: ' + error.message, 'error');
    }
  }

  async function saveMarkdownDoc() {
    try {
      var context = await getWritableRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      var targetPath = selectedNodeType === 'file'
        ? selectedNodePath
        : String(docPathEl.value || currentDocPath || '').trim();
      if (!targetPath || !/\.md$/i.test(targetPath)) {
        setDocStatus('仅支持保存 Markdown 文件。HTML 已发布文档请先编译，再部署更新。', 'error');
        return;
      }

      await upsertFile(
        context.owner,
        context.repo,
        context.branch,
        targetPath,
        markdownEl.value,
        context.token,
        'docs: save ' + targetPath
      );

      var file = await readTextFile(context.owner, context.repo, context.branch, targetPath, context.token);
      currentDocPath = targetPath;
      currentDocSha = file && file.sha ? file.sha : '';
      setSelectedFile(targetPath);
      setDocStatus('保存成功: ' + targetPath, 'success');
      refreshTreeFromState();
      setStatus('Markdown 文档已保存。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('保存文档失败: ' + error.message, 'error');
    }
  }

  async function createMarkdownDoc() {
    try {
      var context = await getWritableRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      var inputPath = String(docPathEl.value || '').trim();
      var defaultFile = getCurrentDateText() + '-' + slugify(slugEl.value.trim() || titleEl.value.trim() || 'new-post') + '.md';
      var baseDir = selectedNodeType === 'file'
        ? dirname(selectedNodePath)
        : (selectedNodePath || selectedDirPath || 'posts');

      if (inputPath && !/\.md$/i.test(inputPath)) {
        baseDir = trimSlashes(inputPath);
      }

      var suggestedName = findAvailableName(baseDir, defaultFile);
      var userInputName = window.prompt('新建文档名（仅文件名，可不写 .md）', suggestedName);
      if (userInputName === null) {
        return;
      }

      var fileName = String(userInputName || '').trim().replace(/[\\/]/g, '-');
      if (!fileName) {
        setDocStatus('文件名不能为空。', 'error');
        return;
      }
      if (!/\.md$/i.test(fileName)) {
        fileName += '.md';
      }

      var targetPath = trimSlashes(baseDir) + '/' + fileName;
      if (!/\.md$/i.test(targetPath)) {
        setDocStatus('新建文档路径必须以 .md 结尾。', 'error');
        return;
      }

      var existingSha = await getFileSha(context.owner, context.repo, context.branch, targetPath, context.token);
      if (existingSha) {
        setDocStatus('该文档已存在，请换一个路径。', 'error');
        return;
      }

      var content = markdownEl.value.trim();
      if (!content) {
        var title = titleEl.value.trim() || '新文档';
        content = '# ' + title + '\n\n';
      }

      await upsertFile(context.owner, context.repo, context.branch, targetPath, content, context.token, 'docs: create ' + targetPath);
      docPathEl.value = targetPath;
      currentDocPath = targetPath;
      currentDocSha = await getFileSha(context.owner, context.repo, context.branch, targetPath, context.token) || '';
      setSelectedFile(targetPath);
      if (markdownPaths.indexOf(targetPath) === -1) {
        markdownPaths.push(targetPath);
        markdownPaths.sort(function (a, b) {
          return a.localeCompare(b);
        });
      }
      ensureDirectoryPath(dirname(targetPath));
      markdownEl.value = content;
      titleEl.value = titleFromMarkdown(content, targetPath);
      slugEl.value = slugFromPath(targetPath, titleEl.value);
      renderPreview();
      refreshTreeFromState();
      setStatus('新建 Markdown 文档成功。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('新建文档失败: ' + error.message, 'error');
    }
  }

  async function createDirectory() {
    try {
      var context = await getWritableRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      var baseDir = selectedNodeType === 'file'
        ? dirname(selectedNodePath)
        : (selectedNodePath || selectedDirPath || 'posts');
      var newDirNameInput = window.prompt('新建目录名', 'new-folder');
      if (newDirNameInput === null) {
        return;
      }

      var newDirName = String(newDirNameInput || '').trim().replace(/[\\/]/g, '-');
      if (!newDirName) {
        setDocStatus('目录名不能为空。', 'error');
        return;
      }

      var targetDirPath = trimSlashes(baseDir ? baseDir + '/' + newDirName : newDirName);
      if (directoryPaths.indexOf(targetDirPath) !== -1) {
        setDocStatus('该目录已存在。', 'error');
        return;
      }

      var markerPath = targetDirPath + '/' + directoryMarkerName;
      await upsertFile(context.owner, context.repo, context.branch, markerPath, '', context.token, 'docs: create dir ' + targetDirPath);
      setSelectedDirectory(targetDirPath);
      if (directoryMarkerPaths.indexOf(markerPath) === -1) {
        directoryMarkerPaths.push(markerPath);
      }
      ensureDirectoryPath(targetDirPath);
      refreshTreeFromState();
      setDocStatus('目录创建成功: ' + targetDirPath, 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('新建目录失败: ' + error.message, 'error');
    }
  }

  async function deleteMarkdownDoc() {
    try {
      var context = await getWritableRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      if (!selectedNodePath) {
        setDocStatus('请先选择要删除的 Markdown 文档。', 'error');
        return;
      }

      if (selectedNodeType === 'dir') {
        var dirPrefix = trimSlashes(selectedNodePath);
        var markdownDeleteTargets = markdownPaths.filter(function (path) {
          return path.indexOf(dirPrefix + '/') === 0;
        });
        var dirTargets = markdownPaths.filter(function (path) {
          return path.indexOf(dirPrefix + '/') === 0;
        }).concat(directoryMarkerPaths.filter(function (path) {
          return path.indexOf(dirPrefix + '/') === 0;
        }));

        if (!dirTargets.length) {
          var directMarker = dirPrefix + '/' + directoryMarkerName;
          if (directoryMarkerPaths.indexOf(directMarker) !== -1) {
            dirTargets.push(directMarker);
          }
        }

        if (!dirTargets.length) {
          setDocStatus('该目录下没有可删除内容。', 'error');
          return;
        }

        if (!window.confirm('确认删除目录 ' + dirPrefix + ' 下的 ' + dirTargets.length + ' 个项目吗？')) {
          return;
        }

        for (var i = 0; i < dirTargets.length; i++) {
          var itemPath = dirTargets[i];
          var itemSha = await getFileSha(context.owner, context.repo, context.branch, itemPath, context.token);
          if (itemSha) {
            await deleteFile(context.owner, context.repo, context.branch, itemPath, itemSha, context.token, 'docs: delete ' + itemPath);
          }
        }

        await deletePublishedArtifacts(context, markdownDeleteTargets);

        if (currentDocPath && currentDocPath.indexOf(dirPrefix + '/') === 0) {
          clearEditorState();
        }

        markdownPaths = markdownPaths.filter(function (path) {
          return path.indexOf(dirPrefix + '/') !== 0;
        });
        directoryMarkerPaths = directoryMarkerPaths.filter(function (path) {
          return path.indexOf(dirPrefix + '/') !== 0 && path !== dirPrefix + '/' + directoryMarkerName;
        });

        setSelectedDirectory(dirname(dirPrefix) || 'posts');
        refreshTreeFromState();
        setDocStatus('目录删除完成: ' + dirPrefix, 'success');
        setStatus('目录内容已删除。', 'success');
        return;
      }

      var targetPath = selectedNodePath;
      if (!isMarkdownPath(targetPath)) {
        setDocStatus('HTML 已发布文档不支持直接删除。', 'error');
        return;
      }

      if (!window.confirm('确认删除文档: ' + targetPath + ' ?')) {
        return;
      }

      var sha = currentDocPath === targetPath ? currentDocSha : '';
      if (!sha) {
        sha = await getFileSha(context.owner, context.repo, context.branch, targetPath, context.token);
      }
      if (!sha) {
        setDocStatus('文档不存在，无法删除。', 'error');
        return;
      }

      await deleteFile(context.owner, context.repo, context.branch, targetPath, sha, context.token, 'docs: delete ' + targetPath);
      await deletePublishedArtifacts(context, [targetPath]);
      if (currentDocPath === targetPath) {
        clearEditorState();
      }
      markdownPaths = markdownPaths.filter(function (path) {
        return path !== targetPath;
      });
      selectedNodeType = 'dir';
      selectedNodePath = selectedDirPath;
      docPathEl.value = selectedDirPath + '/';
      refreshTreeFromState();
      setDocStatus('删除成功: ' + targetPath, 'success');
      setStatus('Markdown 文档已删除。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('删除文档失败: ' + error.message, 'error');
    }
  }

  async function renamePublishedBlog() {
    try {
      var context = await getWritableRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setPublishedStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      var targetPath = trimSlashes(selectedNodePath);
      if (!isPublishedHtmlPath(targetPath)) {
        setPublishedStatus('请先选择已发布博客。', 'error');
        return;
      }

      var file = await readTextFile(context.owner, context.repo, context.branch, targetPath, context.token);
      if (!file) {
        setPublishedStatus('已发布博客不存在。', 'error');
        return;
      }

      var currentTitle = displayTitleFromPublishedPath(targetPath);
      var newTitleInput = window.prompt('重命名已发布博客标题', currentTitle);
      if (newTitleInput === null) {
        return;
      }

      var newTitle = String(newTitleInput || '').trim();
      if (!newTitle) {
        setPublishedStatus('标题不能为空。', 'error');
        return;
      }

      var parser = new DOMParser();
      var doc = parser.parseFromString(file.content, 'text/html');
      if (doc.title !== undefined) {
        doc.title = newTitle + ' | coderkou';
      }
      var titleNode = doc.querySelector('.post-title');
      if (titleNode) {
        titleNode.textContent = newTitle;
      }
      var ogTitleNode = doc.querySelector('meta[property="og:title"]');
      if (ogTitleNode) {
        ogTitleNode.setAttribute('content', newTitle);
      }
      var postNameMeta = doc.querySelector('span[itemprop="post"] meta[itemprop="name"]');
      if (postNameMeta) {
        postNameMeta.setAttribute('content', newTitle + ' | coderkou');
      }

      await upsertFile(context.owner, context.repo, context.branch, targetPath, '<!DOCTYPE html>\n' + doc.documentElement.outerHTML, context.token, 'publish: rename title ' + targetPath);

      var posts = await readJsonFile(context.owner, context.repo, context.branch, 'blog-data/posts.json', context.token);
      for (var i = 0; i < posts.length; i++) {
        if (String(posts[i] && posts[i].url || '') === '/' + targetPath) {
          posts[i].title = newTitle;
        }
      }
      await upsertFile(context.owner, context.repo, context.branch, 'blog-data/posts.json', JSON.stringify(posts, null, 2) + '\n', context.token, 'publish: update published title');

      if (publishedPostMetaByPath[targetPath]) {
        publishedPostMetaByPath[targetPath].title = newTitle;
      }
      if (currentDocPath === targetPath) {
        titleEl.value = newTitle;
      }
      renderPublishedDocs(publishedHtmlPaths);
      setPublishedStatus('已发布博客标题已更新。', 'success');
    } catch (error) {
      console.error(error);
      setPublishedStatus('重命名已发布博客失败: ' + error.message, 'error');
    }
  }

  async function deletePublishedBlog() {
    try {
      var context = await getWritableRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setPublishedStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      var targetPath = trimSlashes(selectedNodePath);
      if (!isPublishedHtmlPath(targetPath)) {
        setPublishedStatus('请先选择已发布博客。', 'error');
        return;
      }

      if (!window.confirm('确认删除已发布博客: ' + targetPath + ' ?')) {
        return;
      }

      var htmlSha = await getFileSha(context.owner, context.repo, context.branch, targetPath, context.token);
      if (htmlSha) {
        await deleteFile(context.owner, context.repo, context.branch, targetPath, htmlSha, context.token, 'publish: delete ' + targetPath);
      }

      var posts = await readJsonFile(context.owner, context.repo, context.branch, 'blog-data/posts.json', context.token);
      var nextPosts = posts.filter(function (item) {
        return String(item && item.url || '') !== '/' + targetPath;
      });
      await upsertFile(context.owner, context.repo, context.branch, 'blog-data/posts.json', JSON.stringify(nextPosts, null, 2) + '\n', context.token, 'publish: remove published blog');

      publishedHtmlPaths = publishedHtmlPaths.filter(function (path) {
        return path !== targetPath;
      });
      delete publishedPostMetaByPath[targetPath];
      if (currentDocPath === targetPath) {
        clearEditorState();
      }
      renderPublishedDocs(publishedHtmlPaths);
      setPublishedStatus('已发布博客已删除。', 'success');
    } catch (error) {
      console.error(error);
      setPublishedStatus('删除已发布博客失败: ' + error.message, 'error');
    }
  }

  async function renameSelectedNode() {
    try {
      var context = await getWritableRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      if (!selectedNodePath) {
        setDocStatus('请先在目录树中选择文件或目录。', 'error');
        return;
      }

      if (selectedNodeType === 'file') {
        if (!isMarkdownPath(selectedNodePath)) {
          setDocStatus('HTML 已发布文档不支持直接重命名，请基于内容重新发布。', 'error');
          return;
        }

        var oldFilePath = selectedNodePath;
        var oldFileName = basename(oldFilePath);
        var newFileNameInput = window.prompt('重命名文件', oldFileName);
        if (newFileNameInput === null) {
          return;
        }

        var newFileName = String(newFileNameInput || '').trim().replace(/[\\/]/g, '-');
        if (!newFileName) {
          setDocStatus('文件名不能为空。', 'error');
          return;
        }
        if (!/\.md$/i.test(newFileName)) {
          newFileName += '.md';
        }

        var newFilePath = (dirname(oldFilePath) ? dirname(oldFilePath) + '/' : '') + newFileName;
        if (newFilePath === oldFilePath) {
          return;
        }

        var existingSha = await getFileSha(context.owner, context.repo, context.branch, newFilePath, context.token);
        if (existingSha) {
          setDocStatus('目标文件已存在。', 'error');
          return;
        }

        var oldFile = await readTextFile(context.owner, context.repo, context.branch, oldFilePath, context.token);
        if (!oldFile) {
          setDocStatus('原文件不存在。', 'error');
          return;
        }

        await upsertFile(context.owner, context.repo, context.branch, newFilePath, oldFile.content, context.token, 'docs: rename ' + oldFilePath + ' -> ' + newFilePath);
        await deleteFile(context.owner, context.repo, context.branch, oldFilePath, oldFile.sha, context.token, 'docs: rename cleanup ' + oldFilePath);

        if (currentDocPath === oldFilePath) {
          currentDocPath = newFilePath;
          currentDocSha = await getFileSha(context.owner, context.repo, context.branch, newFilePath, context.token) || '';
          setSelectedFile(newFilePath);
        }

        markdownPaths = markdownPaths.map(function (path) {
          return path === oldFilePath ? newFilePath : path;
        }).sort(function (a, b) {
          return a.localeCompare(b);
        });
        refreshTreeFromState();
        setDocStatus('重命名成功: ' + newFilePath, 'success');
        return;
      }

      var oldDirPath = trimSlashes(selectedNodePath);
      var oldDirName = basename(oldDirPath);
      var newDirNameInput = window.prompt('重命名目录', oldDirName);
      if (newDirNameInput === null) {
        return;
      }

      var newDirName = String(newDirNameInput || '').trim().replace(/[\\/]/g, '-');
      if (!newDirName) {
        setDocStatus('目录名不能为空。', 'error');
        return;
      }

      var parentDir = dirname(oldDirPath);
      var newDirPath = parentDir ? (parentDir + '/' + newDirName) : newDirName;
      if (newDirPath === oldDirPath) {
        return;
      }

      var moveTargets = markdownPaths.filter(function (path) {
        return path.indexOf(oldDirPath + '/') === 0;
      }).concat(directoryMarkerPaths.filter(function (path) {
        return path.indexOf(oldDirPath + '/') === 0;
      }));
      if (!moveTargets.length) {
        setDocStatus('目录下没有可重命名内容。', 'error');
        return;
      }

      if (!window.confirm('确认将目录 ' + oldDirPath + ' 下 ' + moveTargets.length + ' 个文件重命名到 ' + newDirPath + ' 吗？')) {
        return;
      }

      for (var i = 0; i < moveTargets.length; i++) {
        var oldPath = moveTargets[i];
        var suffix = oldPath.slice(oldDirPath.length + 1);
        var nextPath = newDirPath + '/' + suffix;
        var checkSha = await getFileSha(context.owner, context.repo, context.branch, nextPath, context.token);
        if (checkSha) {
          throw new Error('目标已存在: ' + nextPath);
        }

        var file = await readTextFile(context.owner, context.repo, context.branch, oldPath, context.token);
        if (!file) {
          continue;
        }
        await upsertFile(context.owner, context.repo, context.branch, nextPath, file.content, context.token, 'docs: move ' + oldPath + ' -> ' + nextPath);
        await deleteFile(context.owner, context.repo, context.branch, oldPath, file.sha, context.token, 'docs: move cleanup ' + oldPath);

        if (currentDocPath === oldPath) {
          currentDocPath = nextPath;
          currentDocSha = await getFileSha(context.owner, context.repo, context.branch, nextPath, context.token) || '';
        }
      }

      markdownPaths = markdownPaths.map(function (path) {
        return path.indexOf(oldDirPath + '/') === 0
          ? replacePathPrefix(path, oldDirPath, newDirPath)
          : path;
      }).sort(function (a, b) {
        return a.localeCompare(b);
      });
      directoryMarkerPaths = directoryMarkerPaths.map(function (path) {
        return path.indexOf(oldDirPath + '/') === 0
          ? replacePathPrefix(path, oldDirPath, newDirPath)
          : path;
      });
      setSelectedDirectory(newDirPath);
      refreshTreeFromState();
      setDocStatus('目录重命名成功: ' + newDirPath, 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('重命名失败: ' + error.message, 'error');
    }
  }

  function buildPublisherFeedScript() {
    return "(function () {\n  function safeText(value) {\n    return String(value || '').replace(/[&<>\"']/g, function (ch) {\n      if (ch === '&') return '&amp;';\n      if (ch === '<') return '&lt;';\n      if (ch === '>') return '&gt;';\n      if (ch === '\"') return '&quot;';\n      return '&#39;';\n    });\n  }\n  function normalizeUrl(url) {\n    var value = String(url || '').trim();\n    if (!value) return '';\n    return value.charAt(0) === '/' ? value : '/' + value;\n  }\n  function parseDate(input) {\n    var d = new Date(input || '');\n    return Number.isNaN(d.getTime()) ? null : d;\n  }\n  function dayText(d) {\n    return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');\n  }\n  function dateText(d) {\n    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');\n  }\n  function list(value) {\n    return Array.isArray(value) ? value.filter(Boolean).map(String) : [];\n  }\n  function sorted(posts) {\n    return posts.slice().sort(function (a, b) { return b.date - a.date; });\n  }\n  function slug(value) {\n    return encodeURIComponent(String(value || '').trim()).replace(/%2F/gi, '/');\n  }\n  function groupByTerm(posts, key) {\n    var groups = {};\n    posts.forEach(function (post) {\n      list(post[key]).forEach(function (term) {\n        if (!groups[term]) groups[term] = [];\n        groups[term].push(post);\n      });\n    });\n    return groups;\n  }\n  function updateCounts(posts) {\n    var tagTotal = Object.keys(groupByTerm(posts, 'tags')).length;\n    var categoryTotal = Object.keys(groupByTerm(posts, 'categories')).length;\n    document.querySelectorAll('.site-state-posts .site-state-item-count').forEach(function (n) { n.textContent = String(posts.length); });\n    document.querySelectorAll('.site-state-tags .site-state-item-count').forEach(function (n) { n.textContent = String(tagTotal); });\n    document.querySelectorAll('.site-state-categories .site-state-item-count').forEach(function (n) { n.textContent = String(categoryTotal); });\n  }\n  function termMeta(post) {\n    var html = '';\n    if (post.categories.length) {\n      html += '<span class=\"post-meta-item\"><span class=\"post-meta-item-icon\"><i class=\"far fa-folder\"></i></span><span class=\"post-meta-item-text\">分类于</span> ' + post.categories.map(function (c) { return '<a href=\"/categories/?term=' + slug(c) + '\">' + safeText(c) + '</a>'; }).join(' / ') + '</span>';\n    }\n    if (post.tags.length) {\n      html += '<span class=\"post-meta-item\"><span class=\"post-meta-item-icon\"><i class=\"fa fa-tags\"></i></span><span class=\"post-meta-item-text\">标签</span> ' + post.tags.map(function (t) { return '<a href=\"/tags/?term=' + slug(t) + '\">#' + safeText(t) + '</a>'; }).join(' ') + '</span>';\n    }\n    return html;\n  }\n  function postBlock(post) {\n    var body = post.excerpt ? ('<div class=\"post-body\" itemprop=\"articleBody\"><p>' + safeText(post.excerpt) + '</p></div>') : '';\n    return '<div class=\"post-block\" style=\"visibility:visible;opacity:1;transform:none\"><article itemscope itemtype=\"http://schema.org/Article\" class=\"post-content\"><header class=\"post-header\"><h2 class=\"post-title\" itemprop=\"name headline\"><a href=\"' + safeText(post.url) + '\" class=\"post-title-link\" itemprop=\"url\">' + safeText(post.title) + '</a></h2><div class=\"post-meta-container\"><div class=\"post-meta\"><span class=\"post-meta-item\"><span class=\"post-meta-item-icon\"><i class=\"far fa-calendar\"></i></span><span class=\"post-meta-item-text\">发表于</span><time>' + dateText(post.date) + '</time></span>' + termMeta(post) + '</div></div></header>' + body + '</article></div>';\n  }\n  function patchHome(posts) {\n    var root = document.querySelector('.main-inner.index.posts-expand');\n    if (!root) return;\n    root.querySelectorAll('.post-block').forEach(function (n) { n.remove(); });\n    root.insertAdjacentHTML('beforeend', sorted(posts).filter(function (p) { return p.date && p.url; }).map(postBlock).join(''));\n  }\n  function archiveHtml(posts) {\n    var valid = sorted(posts.filter(function (p) { return !!p.date; }));\n    var groups = {};\n    valid.forEach(function (item) { var y = String(item.date.getFullYear()); (groups[y] || (groups[y] = [])).push(item); });\n    var html = '<div class=\"collection-title\"><span class=\"collection-header\">嗯..! 目前共计 ' + valid.length + ' 篇日志。继续努力。</span></div>';\n    Object.keys(groups).sort(function (a, b) { return Number(b) - Number(a); }).forEach(function (year) {\n      html += '<div class=\"collection-year\"><span class=\"collection-header\">' + year + '<span class=\"collection-year-count\">' + groups[year].length + '</span></span></div>';\n      groups[year].forEach(function (p) { html += '<article itemscope itemtype=\"http://schema.org/Article\"><header class=\"post-header\"><div class=\"post-meta-container\"><time>' + dayText(p.date) + '</time></div><div class=\"post-title\"><a class=\"post-title-link\" href=\"' + safeText(p.url) + '\">' + safeText(p.title) + '</a></div></header></article>'; });\n    });\n    return html;\n  }\n  function patchArchives(posts) {\n    var content = document.querySelector('.main-inner.archive.posts-collapse .post-block .post-content');\n    if (content) content.innerHTML = archiveHtml(posts);\n  }\n  function patchTags(posts) {\n    var body = document.querySelector('.main-inner.page .post-body');\n    if (!body || !/\\/tags\\/?(?:index\\.html)?$/.test(location.pathname)) return;\n    var groups = groupByTerm(posts, 'tags');\n    var terms = Object.keys(groups).sort();\n    body.innerHTML = '<div class=\"tag-cloud\"><div class=\"tag-cloud-title\">目前共计 ' + terms.length + ' 个标签</div><div class=\"tag-cloud-tags\">' + terms.map(function (t) { return '<a href=\"/tags/?term=' + slug(t) + '\" style=\"font-size: 12px;\" class=\"tag-cloud-0\">' + safeText(t) + '</a>'; }).join(' ') + '</div></div>';\n  }\n  function patchCategories(posts) {\n    var body = document.querySelector('.main-inner.page .post-body');\n    if (!body || !/\\/categories\\/?(?:index\\.html)?$/.test(location.pathname)) return;\n    var groups = groupByTerm(posts, 'categories');\n    var terms = Object.keys(groups).sort();\n    body.innerHTML = '<div class=\"category-all-page\"><div class=\"category-all-title\">目前共计 ' + terms.length + ' 个分类</div><div class=\"category-all\"><ul class=\"category-list\">' + terms.map(function (t) { return '<li class=\"category-list-item\"><a class=\"category-list-link\" href=\"/categories/?term=' + slug(t) + '\">' + safeText(t) + '</a><span class=\"category-list-count\">' + groups[t].length + '</span></li>'; }).join('') + '</ul></div></div>';\n  }\n  function patchTermListing(posts) {\n    var params = new URLSearchParams(location.search || '');\n    var term = params.get('term') || '';\n    var isTagPage = /^\\/tags\\/?/.test(location.pathname);\n    var isCategoryPage = /^\\/categories\\/?/.test(location.pathname);\n    var tag = isTagPage ? term || decodeURIComponent((location.pathname.match(/^\\/tags\\/([^/]+)/) || [])[1] || '') : '';\n    var category = isCategoryPage ? term || decodeURIComponent((location.pathname.match(/^\\/categories\\/([^/]+)/) || [])[1] || '') : '';\n    var root = document.querySelector('.main-inner.archive.posts-collapse .post-block .post-content') || document.querySelector('.main-inner.page .post-body');\n    if (!root || (!tag && !category)) return;\n    var filtered = posts.filter(function (p) { return tag ? p.tags.indexOf(tag) !== -1 : p.categories.indexOf(category) !== -1; });\n    root.innerHTML = archiveHtml(filtered);\n  }\n  fetch('/blog-data/posts.json?ts=' + Date.now())\n    .then(function (r) { if (!r.ok) throw new Error('feed not found'); return r.json(); })\n    .then(function (posts) {\n      if (!Array.isArray(posts) || !posts.length) return;\n      var normalized = posts.map(function (item) { return { title: String(item && item.title || ''), url: normalizeUrl(item && item.url || ''), date: parseDate(item && item.publishedAt), excerpt: String(item && item.excerpt || ''), categories: list(item && item.categories), tags: list(item && item.tags) }; }).filter(function (item) { return item.url; });\n      updateCounts(normalized);\n      patchHome(normalized);\n      patchArchives(normalized);\n      patchTags(normalized);\n      patchCategories(normalized);\n      patchTermListing(normalized);\n    })\n    .catch(function () {});\n})();\n";
  }

  async function ensurePublisherFeedInjected(owner, repo, branch, token, deployVersion) {
    function ensureEditorEntryInjected(html) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(String(html || ''), 'text/html');
      var staleMenuEntry = doc.querySelector('.menu-item-editor');
      if (staleMenuEntry) {
        staleMenuEntry.remove();
      }

      var authorEntry = '<span class="links-of-author-item">\n          <a href="/editor.html" title="后台登录">后台登录</a>\n        </span>';
      var authorLinks = doc.querySelector('.links-of-author.animated');
      if (authorLinks && authorLinks.querySelector('a[title="后台登录"]') === null) {
        authorLinks.insertAdjacentHTML('beforeend', authorEntry);
      }

      applyNoCacheMeta(doc);
      applyVersionToStaticAssets(doc, deployVersion);

      return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    }

    var scriptPath = 'js/publisher-feed.js';
    var scriptVersion = deployVersion || String(Date.now());
    var scriptSrc = '/js/publisher-feed.js?v=' + scriptVersion;
    await upsertFile(owner, repo, branch, scriptPath, buildPublisherFeedScript(), token, 'chore: update publisher feed script');

    var targets = ['index.html', 'archives/index.html', 'tags/index.html', 'categories/index.html'];
    for (var i = 0; i < targets.length; i++) {
      var pagePath = targets[i];
      var file = await readTextFile(owner, repo, branch, pagePath, token);
      if (!file || !file.content) {
        continue;
      }
      var scriptTagPattern = /<script[^>]*src=["']\/js\/publisher-feed\.js(?:\?[^"']*)?["'][^>]*><\/script>/i;
      var updated = ensureEditorEntryInjected(file.content);

      if (scriptTagPattern.test(updated)) {
        updated = updated.replace(scriptTagPattern, '<script src="' + scriptSrc + '"></script>');
      } else if (updated.indexOf('</body>') !== -1) {
        updated = updated.replace('</body>', '\n<script src="' + scriptSrc + '"></script>\n</body>');
      }

      if (updated !== file.content) {
        await upsertFile(owner, repo, branch, pagePath, updated, token, 'chore: inject publisher feed script');
      }
    }
  }

  async function fetchLocalAssetText(path) {
    var response = await fetch('/' + path + '?ts=' + Date.now(), {
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error('读取本地资源失败: ' + path + ' (' + response.status + ')');
    }
    return response.text();
  }

  async function ensureEditorAssetsSynced(owner, repo, branch, token) {
    var assets = ['editor.html', 'css/editor.css', 'js/editor.js'];
    for (var i = 0; i < assets.length; i++) {
      var path = assets[i];
      var content = await fetchLocalAssetText(path);
      await upsertFile(owner, repo, branch, path, content, token, 'chore: sync editor asset ' + path);
    }
  }

  async function readLocalPostsManifest() {
    try {
      var raw = await fetchLocalAssetText('blog-data/posts.json');
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('读取本地文章清单失败:', error);
      return [];
    }
  }

  function sortPostsForNavigation(posts) {
    return posts.slice().sort(function (a, b) {
      var aTime = Date.parse(a && a.publishedAt || '') || 0;
      var bTime = Date.parse(b && b.publishedAt || '') || 0;
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return String(a && a.url || '').localeCompare(String(b && b.url || ''));
    });
  }

  function buildPostNavHtml(previousPost, nextPost) {
    function navLink(post, rel, isPrevious) {
      if (!post || !post.url) {
        return '';
      }

      var href = appendVersionToUrl(post.url, post.version || '');
      var icon = isPrevious ? '<i class="fa fa-angle-left"></i> ' : ' <i class="fa fa-angle-right"></i>';
      var label = isPrevious
        ? icon + post.title
        : post.title + icon;
      return '<a href="' + href + '" rel="' + rel + '" title="' + post.title + '">' + label + '</a>';
    }

    return [
      '<div class="post-nav">',
      '  <div class="post-nav-item">' + navLink(previousPost, 'prev', true) + '</div>',
      '  <div class="post-nav-item">' + navLink(nextPost, 'next', false) + '</div>',
      '</div>'
    ].join('');
  }

  function getArticleTemplateCandidates(selectedDocPath, htmlPath) {
    var candidates = [];

    function pushCandidate(path) {
      if (!path || candidates.indexOf(path) !== -1 || path === htmlPath || !isPublishedHtmlPath(path)) {
        return;
      }
      candidates.push(path);
    }

    pushCandidate(selectedDocPath);

    for (var i = 0; i < allDocPaths.length; i++) {
      pushCandidate(allDocPaths[i]);
    }

    pushCandidate('2024/09/14/spring技术内幕/index.html');
    pushCandidate('2024/09/07/spring-boot/index.html');
    return candidates;
  }

  async function getArticleTemplateHtml(selectedDocPath, htmlPath) {
    var candidates = getArticleTemplateCandidates(selectedDocPath, htmlPath);
    for (var i = 0; i < candidates.length; i++) {
      try {
        return await fetchLocalAssetText(candidates[i]);
      } catch (error) {
        console.warn('读取文章模板失败:', candidates[i], error);
      }
    }
    return null;
  }

  async function buildArticleHtml(title, htmlContent, dateText, htmlPath, selectedDocPath, deployVersion, categories, tags) {
    var templateHtml = await getArticleTemplateHtml(selectedDocPath, htmlPath);
    if (!templateHtml) {
      throw new Error('未找到可复用的旧博客文章模板，无法生成旧样式页面。');
    }

    var manifestPosts = await readLocalPostsManifest();

    var parser = new DOMParser();
    var doc = parser.parseFromString(templateHtml, 'text/html');
    var pathWithoutIndex = htmlPath.replace(/index\.html$/i, '');
    var mainConfigNode = doc.querySelector('.next-config[data-name="main"]');
    var hostname = 'kxkcx.github.io';

    if (mainConfigNode) {
      try {
        hostname = JSON.parse(mainConfigNode.textContent || '{}').hostname || hostname;
      } catch (error) {
        console.warn('读取主配置失败:', error);
      }
    }

    var canonicalUrl = 'https://' + hostname + '/' + pathWithoutIndex;
    var isoPublished = dateText + 'T00:00:00.000Z';
    var displayTime = dateText + ' 00:00:00';
    var excerpt = buildExcerptFromMarkdown(markdownEl.value || '', 160);
    var currentArticleUrl = '/' + htmlPath;

    doc.documentElement.lang = 'zh-CN';
    if (doc.title !== undefined) {
      doc.title = title + ' | coderkou';
    }

    applyNoCacheMeta(doc);
    applyVersionToStaticAssets(doc, deployVersion);

    var selectors = {
      description: 'meta[name="description"]',
      ogTitle: 'meta[property="og:title"]',
      ogUrl: 'meta[property="og:url"]',
      ogDescription: 'meta[property="og:description"]',
      articlePublished: 'meta[property="article:published_time"]',
      articleModified: 'meta[property="article:modified_time"]',
      canonical: 'link[rel="canonical"]'
    };

    var descNode = doc.querySelector(selectors.description);
    if (descNode) {
      descNode.setAttribute('content', excerpt);
    }
    var ogTitleNode = doc.querySelector(selectors.ogTitle);
    if (ogTitleNode) {
      ogTitleNode.setAttribute('content', title);
    }
    var ogUrlNode = doc.querySelector(selectors.ogUrl);
    if (ogUrlNode) {
      ogUrlNode.setAttribute('content', canonicalUrl + 'index.html');
    }
    var ogDescriptionNode = doc.querySelector(selectors.ogDescription);
    if (ogDescriptionNode) {
      ogDescriptionNode.setAttribute('content', excerpt);
    }
    var articlePublishedNode = doc.querySelector(selectors.articlePublished);
    if (articlePublishedNode) {
      articlePublishedNode.setAttribute('content', isoPublished);
    }
    var articleModifiedNode = doc.querySelector(selectors.articleModified);
    if (articleModifiedNode) {
      articleModifiedNode.setAttribute('content', isoPublished);
    }
    var canonicalNode = doc.querySelector(selectors.canonical);
    if (canonicalNode) {
      canonicalNode.setAttribute('href', canonicalUrl);
    }

    var pageConfigNode = doc.querySelector('.next-config[data-name="page"]');
    if (pageConfigNode) {
      pageConfigNode.textContent = JSON.stringify({
        sidebar: '',
        isHome: false,
        isPost: true,
        lang: 'zh-CN',
        comments: true,
        permalink: canonicalUrl,
        path: pathWithoutIndex,
        title: title
      });
    }

    var mainEntity = doc.querySelector('link[itemprop="mainEntityOfPage"]');
    if (mainEntity) {
      mainEntity.setAttribute('href', canonicalUrl);
    }

    var postNameMeta = doc.querySelector('span[itemprop="post"] meta[itemprop="name"]');
    if (postNameMeta) {
      postNameMeta.setAttribute('content', title + ' | coderkou');
    }
    var postDescriptionMeta = doc.querySelector('span[itemprop="post"] meta[itemprop="description"]');
    if (postDescriptionMeta) {
      postDescriptionMeta.setAttribute('content', excerpt);
    }

    var postTitleNode = doc.querySelector('.post-title');
    if (postTitleNode) {
      postTitleNode.textContent = title;
    }

    var articleNode = doc.querySelector('article.post-content');
    if (articleNode) {
      articleNode.setAttribute('lang', 'zh-CN');
    }

    var timeNode = doc.querySelector('time[itemprop="dateCreated datePublished"]');
    if (timeNode) {
      timeNode.setAttribute('datetime', dateText + 'T00:00:00+08:00');
      timeNode.setAttribute('title', '创建时间：' + displayTime + ' / 修改时间：' + displayTime);
      timeNode.textContent = dateText;
    }
    var bodyNode = doc.querySelector('.post-body');
    if (bodyNode) {
      bodyNode.innerHTML = htmlContent;
    }

    var metaContainer = doc.querySelector('.post-meta');
    if (metaContainer) {
      var oldTerms = metaContainer.querySelectorAll('.publisher-term-meta');
      for (var tm = 0; tm < oldTerms.length; tm++) oldTerms[tm].remove();
      if (categories && categories.length) {
        metaContainer.insertAdjacentHTML('beforeend', '<span class="post-meta-item publisher-term-meta"><span class="post-meta-item-icon"><i class="far fa-folder"></i></span><span class="post-meta-item-text">分类于</span> ' + categories.map(function (item) { return '<a href="/categories/?term=' + encodeURIComponent(item) + '">' + item + '</a>'; }).join(' / ') + '</span>');
      }
      if (tags && tags.length) {
        metaContainer.insertAdjacentHTML('beforeend', '<span class="post-meta-item publisher-term-meta"><span class="post-meta-item-icon"><i class="fa fa-tags"></i></span><span class="post-meta-item-text">标签</span> ' + tags.map(function (item) { return '<a href="/tags/?term=' + encodeURIComponent(item) + '">#' + item + '</a>'; }).join(' ') + '</span>');
      }
    }

    var sidebarInner = doc.querySelector('.sidebar-inner');
    if (sidebarInner) {
      sidebarInner.className = 'sidebar-inner sidebar-overview-active';
    }

    var tocWrap = doc.querySelector('.post-toc-wrap.sidebar-panel');
    if (tocWrap) {
      tocWrap.innerHTML = '';
    }

    var postNav = doc.querySelector('.post-nav');
    if (postNav) {
      postNav.remove();
    }

    var navPosts = manifestPosts.filter(function (item) {
      return item && item.url && item.url !== currentArticleUrl;
    });
    navPosts.push({
      title: title,
      url: currentArticleUrl,
      version: deployVersion,
      publishedAt: dateText + 'T00:00:00Z'
    });
    navPosts = sortPostsForNavigation(navPosts);

    var currentIndex = -1;
    for (var i = 0; i < navPosts.length; i++) {
      if (navPosts[i].url === currentArticleUrl) {
        currentIndex = i;
        break;
      }
    }

    var previousPost = currentIndex > 0 ? navPosts[currentIndex - 1] : null;
    var nextPost = currentIndex >= 0 && currentIndex < navPosts.length - 1 ? navPosts[currentIndex + 1] : null;
    var postFooter = doc.querySelector('.post-footer');
    if (!postFooter) {
      postFooter = doc.createElement('footer');
      postFooter.className = 'post-footer';
      articleNode.appendChild(postFooter);
    }

    if (previousPost || nextPost) {
      postFooter.innerHTML = buildPostNavHtml(previousPost, nextPost);
    } else {
      postFooter.remove();
    }

    var poweredBy = doc.querySelector('.powered-by');
    if (poweredBy) {
      poweredBy.remove();
    }

    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }

  async function deploy() {
    try {
      if (!isAuthenticated()) {
        setStatus('请先登录后台账号。', 'error');
        return;
      }

      if (!compiledPayload || compileDirty) {
        setStatus('请先点击“编译”，确认网页结果后再部署。', 'error');
        return;
      }

      saveConfig();

      var owner = ownerEl.value.trim();
      var repo = repoEl.value.trim();
      var branch = branchEl.value.trim() || 'main';
      var token = tokenEl.value.trim();
      if (!owner || !repo || !token) {
        setStatus('请至少填写 Owner、Repo、Token 后再部署。', 'error');
        return;
      }

      var payload = compiledPayload;
      var title = payload.title;
      var selectedDocPath = payload.selectedDocPath;
      var markdownPath = payload.markdownPath;
      var articleUrl = payload.articleUrl;
      var excerpt = payload.excerpt;
      var articleHtml = payload.articleHtml;
      var markdownWithMeta = payload.markdownWithMeta;
      var htmlPath = payload.htmlPath;

      setStatus('正在检查仓库写权限...', '');
      await assertRepoWritable(owner, repo, token);

      var pagesBranch = await getPagesSourceBranch(owner, repo, token);
      if (pagesBranch && pagesBranch !== branch) {
        branch = pagesBranch;
        branchEl.value = pagesBranch;
        setStatus('检测到 Pages 发布分支为 ' + pagesBranch + '，已自动切换后继续发布...', '');
      }

      setStatus('正在同步后台页面资源...', '');
      await ensureEditorAssetsSynced(owner, repo, branch, token);

      var manifestPath = 'blog-data/posts.json';

      setStatus('正在上传文章页面...', '');
      await upsertFile(owner, repo, branch, htmlPath, articleHtml, token, 'publish: ' + title + ' (html)');

      setStatus('正在上传 Markdown 源文件...', '');
      await upsertFile(owner, repo, branch, markdownPath, markdownWithMeta, token, 'publish: ' + title + ' (markdown)');
      docPathEl.value = markdownPath;
      currentDocPath = markdownPath;
      setSelectedFile(markdownPath);
      currentDocSha = await getFileSha(owner, repo, branch, markdownPath, token) || '';

      setStatus('正在更新主页文章清单...', '');
      var posts = await readJsonFile(owner, repo, branch, manifestPath, token);
      var nextPosts = posts.filter(function (item) {
        return item.url !== articleUrl;
      });
      nextPosts.unshift({
        title: title,
        url: articleUrl,
        version: payload.deployVersion,
        publishedAt: payload.dateText + 'T00:00:00Z',
        excerpt: excerpt,
        categories: payload.categories,
        tags: payload.tags,
        archive: payload.archive
      });
      await upsertFile(owner, repo, branch, manifestPath, JSON.stringify(nextPosts, null, 2) + '\n', token, 'publish: ' + title + ' (manifest)');

      setStatus('正在同步主页与归档原生样式...', '');
      await ensurePublisherFeedInjected(owner, repo, branch, token, payload.deployVersion);

      setStatus('部署成功，GitHub Pages 通常会在 1-2 分钟内更新。', 'success');
    } catch (error) {
      console.error(error);
      setStatus('部署失败: ' + error.message, 'error');
    }
  }

  previewBtn.addEventListener('click', function () {
    renderPreview();
    setStatus('已更新预览。', '');
  });

  if (compileBtn) {
    compileBtn.addEventListener('click', compileArticle);
  }

  deployBtn.addEventListener('click', deploy);

  if (tokenHelpBtn) {
    tokenHelpBtn.addEventListener('click', function () {
      window.open('https://github.com/settings/personal-access-tokens/new', '_blank', 'noopener');
      setStatus('已打开 GitHub 官方 Token 创建页面。请选择最小必要权限（Contents: Read and write）。', '');
    });
  }

  if (verifyTokenBtn) {
    verifyTokenBtn.addEventListener('click', verifyToken);
  }

  if (refreshDocsBtn) {
    refreshDocsBtn.addEventListener('click', listMarkdownDocs);
  }

  if (contextCreateDocBtn) {
    contextCreateDocBtn.addEventListener('click', function () {
      hideTreeContextMenu();
      createMarkdownDoc();
    });
  }

  if (contextCreateDirBtn) {
    contextCreateDirBtn.addEventListener('click', function () {
      hideTreeContextMenu();
      createDirectory();
    });
  }

  if (contextSaveDocBtn) {
    contextSaveDocBtn.addEventListener('click', function () {
      hideTreeContextMenu();
      saveMarkdownDoc();
    });
  }

  if (contextDeleteDocBtn) {
    contextDeleteDocBtn.addEventListener('click', function () {
      hideTreeContextMenu();
      if (selectedNodeType === 'published') {
        deletePublishedBlog();
      } else {
        deleteMarkdownDoc();
      }
    });
  }

  if (contextRenameDocBtn) {
    contextRenameDocBtn.addEventListener('click', function () {
      hideTreeContextMenu();
      if (selectedNodeType === 'published') {
        renamePublishedBlog();
      } else {
        renameSelectedNode();
      }
    });
  }

  if (docTreeEl) {
    docTreeEl.addEventListener('contextmenu', function (event) {
      if (event.target === docTreeEl) {
        showTreeContextMenu(event, 'dir', selectedDirPath || 'posts');
      }
    });
  }

  document.addEventListener('click', function () {
    hideTreeContextMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      hideTreeContextMenu();
    }
  });

  if (toggleSidebarBtn && workspaceGridEl) {
    toggleSidebarBtn.addEventListener('click', function () {
      var collapsed = workspaceGridEl.classList.toggle('sidebar-collapsed');
      toggleSidebarBtn.textContent = collapsed ? '展开侧边栏' : '折叠侧边栏';
    });
  }

  [ownerEl, repoEl, branchEl, tokenEl].forEach(function (input) {
    input.addEventListener('change', saveConfig);
  });

  titleEl.addEventListener('input', function () {
    markCompileDirty();
    if (!slugEl.value.trim()) {
      slugEl.value = slugify(titleEl.value);
    }
  });

  slugEl.addEventListener('input', markCompileDirty);
  if (publishDateEl) publishDateEl.addEventListener('input', markCompileDirty);
  if (categoryEl) categoryEl.addEventListener('input', markCompileDirty);
  if (tagsEl) tagsEl.addEventListener('input', markCompileDirty);
  markdownEl.addEventListener('input', function () {
    markCompileDirty();
    renderPreview();
  });

  if (docPathEl) {
    docPathEl.addEventListener('change', function () {
      markCompileDirty();
      var next = docPathEl.value.trim();
      currentDocSha = '';
      if (!next) {
        return;
      }
      if (/\.md$/i.test(next)) {
        selectedNodeType = 'file';
        selectedNodePath = trimSlashes(next);
      } else {
        setSelectedDirectory(next);
      }
    });
  }

  loadConfig();
  setSelectedDirectory('posts');

  if (isAuthenticated() && tokenEl.value.trim()) {
    listMarkdownDocs();
  }
})();
