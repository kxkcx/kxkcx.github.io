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
  var markdownEl = document.getElementById('markdown');
  var statusEl = document.getElementById('status');
  var previewBodyEl = document.getElementById('previewBody');
  var previewBtn = document.getElementById('previewBtn');
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
  var createDocBtn = document.getElementById('createDocBtn');
  var saveDocBtn = document.getElementById('saveDocBtn');
  var renameDocBtn = document.getElementById('renameDocBtn');
  var deleteDocBtn = document.getElementById('deleteDocBtn');
  var selectedNodeEl = document.getElementById('selectedNode');
  var currentDocPath = '';
  var currentDocSha = '';
  var selectedDirPath = 'posts';
  var selectedNodeType = 'dir';
  var selectedNodePath = 'posts';
  var markdownPaths = [];
  var allDocPaths = [];

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

  function basename(path) {
    var chunks = String(path || '').split('/');
    return chunks[chunks.length - 1] || '';
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

  function buildTree(paths) {
    var root = { dirs: {}, files: [] };
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

    var pickBtn = document.createElement('button');
    pickBtn.type = 'button';
    pickBtn.className = 'tree-pick';
    pickBtn.textContent = '在此新建';
    pickBtn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedDirectory(node.path);
      setDocStatus('已选目录: ' + node.path + '，可直接点“新建”。', 'success');
    });

    summary.appendChild(pickBtn);
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
    var tree = buildTree(paths);

    var topDirs = Object.keys(tree.dirs).sort(function (a, b) {
      return a.localeCompare(b);
    });
    for (var i = 0; i < topDirs.length; i++) {
      renderDirNode(tree.dirs[topDirs[i]], docTreeEl, 0);
    }

    var rootFiles = tree.files.slice().sort(function (a, b) {
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
          return node && node.type === 'blob' && /\.md$/i.test(node.path || '');
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

      markdownPaths = docs;
      allDocPaths = docs.concat(htmlDocs);
      renderDocTree(allDocPaths);
      setDocStatus('已加载 ' + docs.length + ' 个 Markdown 文档，' + htmlDocs.length + ' 个已发布 HTML 文档。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('加载文档列表失败: ' + error.message, 'error');
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
      titleEl.value = titleFromMarkdown(content, targetPath);
      slugEl.value = slugFromPath(targetPath, titleEl.value);
      renderPreview();
      renderDocTree(allDocPaths);
      setDocStatus('已加载文档: ' + targetPath, 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('加载文档失败: ' + error.message, 'error');
    }
  }

  async function saveMarkdownDoc() {
    try {
      var context = getRepoContext();
      if (!context.owner || !context.repo || !context.token) {
        setDocStatus('请先填写 Owner、Repo、Token。', 'error');
        return;
      }

      var targetPath = selectedNodeType === 'file'
        ? selectedNodePath
        : String(docPathEl.value || currentDocPath || '').trim();
      if (!targetPath || !/\.md$/i.test(targetPath)) {
        setDocStatus('仅支持保存 Markdown 文件。HTML 已发布文档请使用“编译并部署”更新。', 'error');
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
      await listMarkdownDocs();
      setStatus('Markdown 文档已保存。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('保存文档失败: ' + error.message, 'error');
    }
  }

  async function createMarkdownDoc() {
    try {
      var context = getRepoContext();
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
      currentDocSha = '';
      setSelectedFile(targetPath);
      await listMarkdownDocs();
      await loadMarkdownDoc(targetPath);
      setStatus('新建 Markdown 文档成功。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('新建文档失败: ' + error.message, 'error');
    }
  }

  async function deleteMarkdownDoc() {
    try {
      var context = getRepoContext();
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
        var dirTargets = markdownPaths.filter(function (path) {
          return path.indexOf(dirPrefix + '/') === 0;
        });

        if (!dirTargets.length) {
          setDocStatus('该目录下没有 Markdown 文件可删除。', 'error');
          return;
        }

        if (!window.confirm('确认删除目录 ' + dirPrefix + ' 下的 ' + dirTargets.length + ' 个 Markdown 文件吗？')) {
          return;
        }

        for (var i = 0; i < dirTargets.length; i++) {
          var itemPath = dirTargets[i];
          var itemSha = await getFileSha(context.owner, context.repo, context.branch, itemPath, context.token);
          if (itemSha) {
            await deleteFile(context.owner, context.repo, context.branch, itemPath, itemSha, context.token, 'docs: delete ' + itemPath);
          }
        }

        if (currentDocPath && currentDocPath.indexOf(dirPrefix + '/') === 0) {
          currentDocPath = '';
          currentDocSha = '';
          markdownEl.value = '';
          previewBodyEl.innerHTML = '';
        }

        setSelectedDirectory(dirname(dirPrefix) || 'posts');
        await listMarkdownDocs();
        setDocStatus('目录删除完成: ' + dirPrefix, 'success');
        setStatus('目录下 Markdown 已删除。', 'success');
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
      if (currentDocPath === targetPath) {
        currentDocPath = '';
        currentDocSha = '';
      }
      selectedNodeType = 'dir';
      selectedNodePath = selectedDirPath;
      docPathEl.value = selectedDirPath + '/';
      markdownEl.value = '';
      previewBodyEl.innerHTML = '';
      await listMarkdownDocs();
      setDocStatus('删除成功: ' + targetPath, 'success');
      setStatus('Markdown 文档已删除。', 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('删除文档失败: ' + error.message, 'error');
    }
  }

  async function renameSelectedNode() {
    try {
      var context = getRepoContext();
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

        await listMarkdownDocs();
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
      });
      if (!moveTargets.length) {
        setDocStatus('目录下没有 Markdown 文件可重命名。', 'error');
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

      setSelectedDirectory(newDirPath);
      await listMarkdownDocs();
      setDocStatus('目录重命名成功: ' + newDirPath, 'success');
    } catch (error) {
      console.error(error);
      setDocStatus('重命名失败: ' + error.message, 'error');
    }
  }

  function buildPublisherFeedScript() {
    return [
      '(function () {',
      '  function safeText(value) {',
      '    return String(value || "").replace(/[&<>"\\\']/g, function (ch) {',
      '      if (ch === "&") return "&amp;";',
      '      if (ch === "<") return "&lt;";',
      '      if (ch === ">") return "&gt;";',
      '      if (ch === "\\\"") return "&quot;";',
      '      return "&#39;";',
      '    });',
      '  }',
      '  function normalizeUrl(url) {',
      '    var value = String(url || "").trim();',
      '    if (!value) return "";',
      '    return value.charAt(0) === "/" ? value : "/" + value;',
      '  }',
      '  function parseDate(input) {',
      '    var d = new Date(input || "");',
      '    return Number.isNaN(d.getTime()) ? null : d;',
      '  }',
      '  function dayText(d) {',
      '    return String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");',
      '  }',
      '  function dateText(d) {',
      '    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");',
      '  }',
      '  function sorted(posts) {',
      '    return posts.slice().sort(function (a, b) { return b.date - a.date; });',
      '  }',
      '  function removeLegacyBlocks() {',
      '    var nodes = document.querySelectorAll("#publisher-live-home, #publisher-live-archives");',
      '    for (var i = 0; i < nodes.length; i++) { nodes[i].remove(); }',
      '  }',
      '  function updatePostCount(total) {',
      '    var counters = document.querySelectorAll(".site-state-posts .site-state-item-count");',
      '    for (var i = 0; i < counters.length; i++) { counters[i].textContent = String(total); }',
      '  }',
      '  function patchHome(posts) {',
      '    var root = document.querySelector(".main-inner.index.posts-expand");',
      '    if (!root) return;',
      '    var seen = {};',
      '    var links = root.querySelectorAll("a.post-title-link");',
      '    for (var i = 0; i < links.length; i++) {',
      '      var href = normalizeUrl(links[i].getAttribute("href") || "");',
      '      if (href) seen[href] = true;',
      '    }',
      '    var anchor = root.querySelector(".post-block");',
      '    if (!anchor) return;',
      '    var ordered = sorted(posts);',
      '    for (var j = ordered.length - 1; j >= 0; j--) {',
      '      var post = ordered[j];',
      '      if (!post.date || seen[post.url]) continue;',
      '      var block = document.createElement("div");',
      '      block.className = "post-block";',
      '      block.style.visibility = "visible";',
      '      block.style.opacity = "1";',
      '      block.style.transform = "none";',
      '      var body = post.excerpt ? ("<div class=\\\"post-body\\\" itemprop=\\\"articleBody\\\"><p>" + safeText(post.excerpt) + "</p></div>") : "";',
      '      block.innerHTML = "<article itemscope itemtype=\\\"http://schema.org/Article\\\" class=\\\"post-content\\\"><header class=\\\"post-header\\\"><h2 class=\\\"post-title\\\" itemprop=\\\"name headline\\\"><a href=\\\"" + safeText(post.url) + "\\\" class=\\\"post-title-link\\\" itemprop=\\\"url\\\">" + safeText(post.title) + "</a></h2><div class=\\\"post-meta-container\\\"><div class=\\\"post-meta\\\"><span class=\\\"post-meta-item\\\"><span class=\\\"post-meta-item-icon\\\"><i class=\\\"far fa-calendar\\\"></i></span><span class=\\\"post-meta-item-text\\\">发表于</span><time>" + dateText(post.date) + "</time></span></div></div></header>" + body + "</article>";',
      '      var descendants = block.querySelectorAll("*");',
      '      for (var n = 0; n < descendants.length; n++) {',
      '        descendants[n].style.visibility = "visible";',
      '        descendants[n].style.opacity = "1";',
      '        descendants[n].style.transform = "none";',
      '      }',
      '      root.insertBefore(block, anchor);',
      '      seen[post.url] = true;',
      '    }',
      '  }',
      '  function patchArchives(posts) {',
      '    var content = document.querySelector(".main-inner.archive.posts-collapse .post-block .post-content");',
      '    if (!content) return;',
      '    var valid = sorted(posts.filter(function (p) { return !!p.date; }));',
      '    if (!valid.length) return;',
      '    var groups = {};',
      '    for (var i = 0; i < valid.length; i++) {',
      '      var item = valid[i];',
      '      var y = String(item.date.getFullYear());',
      '      if (!groups[y]) groups[y] = [];',
      '      groups[y].push(item);',
      '    }',
      '    var years = Object.keys(groups).sort(function (a, b) { return Number(b) - Number(a); });',
      '    var html = "<div class=\\\"collection-title\\\"><span class=\\\"collection-header\\\">嗯..! 目前共计 " + valid.length + " 篇日志。继续努力。</span></div>";',
      '    for (var j = 0; j < years.length; j++) {',
      '      var year = years[j];',
      '      var arr = groups[year];',
      '      html += "<div class=\\\"collection-year\\\"><span class=\\\"collection-header\\\">" + year + "<span class=\\\"collection-year-count\\\">" + arr.length + "</span></span></div>";',
      '      for (var k = 0; k < arr.length; k++) {',
      '        var p = arr[k];',
      '        html += "<article itemscope itemtype=\\\"http://schema.org/Article\\\"><header class=\\\"post-header\\\"><div class=\\\"post-meta-container\\\"><time>" + dayText(p.date) + "</time></div><div class=\\\"post-title\\\"><a class=\\\"post-title-link\\\" href=\\\"" + safeText(p.url) + "\\\">" + safeText(p.title) + "</a></div></header></article>";',
      '      }',
      '    }',
      '    content.innerHTML = html;',
      '  }',
      '  fetch("/blog-data/posts.json?ts=" + Date.now())',
      '    .then(function (r) { if (!r.ok) throw new Error("feed not found"); return r.json(); })',
      '    .then(function (posts) {',
      '      if (!Array.isArray(posts) || !posts.length) return;',
      '      var normalized = posts.map(function (item) {',
      '        return {',
      '          title: String(item && item.title || ""),',
      '          url: normalizeUrl(item && item.url || ""),',
      '          date: parseDate(item && item.publishedAt),',
      '          excerpt: String(item && item.excerpt || "")',
      '        };',
      '      }).filter(function (item) { return item.url; });',
      '      removeLegacyBlocks();',
      '      updatePostCount(normalized.length);',
      '      patchHome(normalized);',
      '      patchArchives(normalized);',
      '    })',
      '    .catch(function () {});',
      '})();',
      ''
    ].join('\n');
  }

  async function ensurePublisherFeedInjected(owner, repo, branch, token) {
    var scriptPath = 'js/publisher-feed.js';
    var scriptVersion = Date.now();
    var scriptSrc = '/js/publisher-feed.js?v=' + scriptVersion;
    await upsertFile(owner, repo, branch, scriptPath, buildPublisherFeedScript(), token, 'chore: update publisher feed script');

    var targets = ['index.html', 'archives/index.html'];
    for (var i = 0; i < targets.length; i++) {
      var pagePath = targets[i];
      var file = await readTextFile(owner, repo, branch, pagePath, token);
      if (!file || !file.content) {
        continue;
      }
      var scriptTagPattern = /<script[^>]*src=["']\/js\/publisher-feed\.js(?:\?[^"']*)?["'][^>]*><\/script>/i;
      var updated = file.content;

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

  function buildArticleHtml(title, htmlContent, dateText) {
    return [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">',
      '  <title>' + title + '</title>',
      '  <link rel="stylesheet" href="/css/main.css">',
      '</head>',
      '<body>',
      '  <div id="container">',
      '    <div id="wrap">',
      '      <header id="header">',
      '        <div id="header-outer" class="outer">',
      '          <div id="header-title" class="inner">',
      '            <h1 id="logo-wrap"><a href="/" id="logo">Hexo</a></h1>',
      '          </div>',
      '        </div>',
      '      </header>',
      '      <div class="outer">',
      '        <section id="main">',
      '          <article class="article article-type-post">',
      '            <div class="article-meta"><span class="article-date">' + dateText + '</span></div>',
      '            <div class="article-inner">',
      '              <header class="article-header">',
      '                <h1 class="article-title">' + title + '</h1>',
      '              </header>',
      '              <div class="article-entry">' + htmlContent + '</div>',
      '            </div>',
      '          </article>',
      '        </section>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  async function deploy() {
    try {
      if (!isAuthenticated()) {
        setStatus('请先登录后台账号。', 'error');
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

      var markdown = markdownEl.value || '';
      var title = titleEl.value.trim();
      var selectedDocPath = String(docPathEl.value || '').trim();

      if (!markdown.trim() && selectedDocPath && (isMarkdownPath(selectedDocPath) || isPublishedHtmlPath(selectedDocPath))) {
        var existingDoc = await readTextFile(owner, repo, branch, selectedDocPath, token);
        if (existingDoc && existingDoc.content) {
          markdown = isPublishedHtmlPath(selectedDocPath)
            ? htmlArticleToMarkdown(existingDoc.content, selectedDocPath)
            : existingDoc.content;
          markdownEl.value = markdown;
        }
      }

      if (!title) {
        title = titleFromMarkdown(markdown, selectedDocPath || currentDocPath || '');
        titleEl.value = title;
      }

      if (!markdown.trim()) {
        markdown = '# ' + title + '\n\n';
        markdownEl.value = markdown;
      }

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

      var slug = slugify(slugEl.value.trim() || title);
      var now = new Date();
      var year = String(now.getFullYear());
      var month = String(now.getMonth() + 1).padStart(2, '0');
      var day = String(now.getDate()).padStart(2, '0');

      var postDocMatch = selectedDocPath.match(/^posts\/(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/i);
      if (postDocMatch) {
        year = postDocMatch[1];
        month = postDocMatch[2];
        day = postDocMatch[3];
        slug = slugify(postDocMatch[4]);
      }

      var publishedHtmlMatch = selectedDocPath.match(/^(\d{4})\/(\d{2})\/(\d{2})\/(.+)\/index\.html$/i);
      if (publishedHtmlMatch) {
        year = publishedHtmlMatch[1];
        month = publishedHtmlMatch[2];
        day = publishedHtmlMatch[3];
        slug = slugify(publishedHtmlMatch[4]);
      }
      slugEl.value = slug;

      var dateText = year + '-' + month + '-' + day;

      setStatus('正在编译 Markdown...', '');
      var htmlContent = marked.parse(markdown);
      previewBodyEl.innerHTML = htmlContent;
      if (previewPanel) {
        previewPanel.open = true;
      }

      var htmlPath = year + '/' + month + '/' + day + '/' + slug + '/index.html';
      var markdownPath = selectedDocPath && /\.md$/i.test(selectedDocPath)
        ? selectedDocPath
        : 'posts/' + dateText + '-' + slug + '.md';
      var manifestPath = 'blog-data/posts.json';
      var articleUrl = '/' + htmlPath;
      var excerpt = buildExcerptFromMarkdown(markdown, 180);

      var markdownWithMeta = [
        '# ' + title,
        '',
        '> 发布时间: ' + dateText,
        '',
        markdown
      ].join('\n');

      setStatus('正在上传文章页面...', '');
      await upsertFile(owner, repo, branch, htmlPath, buildArticleHtml(title, htmlContent, dateText), token, 'publish: ' + title + ' (html)');

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
        publishedAt: dateText + 'T00:00:00Z',
        excerpt: excerpt
      });
      await upsertFile(owner, repo, branch, manifestPath, JSON.stringify(nextPosts, null, 2) + '\n', token, 'publish: ' + title + ' (manifest)');

      setStatus('正在同步主页与归档原生样式...', '');
      await ensurePublisherFeedInjected(owner, repo, branch, token);

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

  if (createDocBtn) {
    createDocBtn.addEventListener('click', createMarkdownDoc);
  }

  if (saveDocBtn) {
    saveDocBtn.addEventListener('click', saveMarkdownDoc);
  }

  if (deleteDocBtn) {
    deleteDocBtn.addEventListener('click', deleteMarkdownDoc);
  }

  if (renameDocBtn) {
    renameDocBtn.addEventListener('click', renameSelectedNode);
  }

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
    if (!slugEl.value.trim()) {
      slugEl.value = slugify(titleEl.value);
    }
  });

  if (docPathEl) {
    docPathEl.addEventListener('change', function () {
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
