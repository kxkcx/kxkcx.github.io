(function () {
  function safeText(value) {
    return String(value || "").replace(/[&<>"\']/g, function (ch) {
      if (ch === "&") return "&amp;";
      if (ch === "<") return "&lt;";
      if (ch === ">") return "&gt;";
      if (ch === "\"") return "&quot;";
      return "&#39;";
    });
  }
  function normalizeUrl(url) {
    var value = String(url || "").trim();
    if (!value) return "";
    return value.charAt(0) === "/" ? value : "/" + value;
  }
  function withVersion(url, version) {
    var base = normalizeUrl(url);
    var v = String(version || "").trim();
    if (!base || !v) return base;
    return base + (base.indexOf("?") === -1 ? "?" : "&") + "v=" + encodeURIComponent(v);
  }
  function parseDate(input) {
    var d = new Date(input || "");
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function dayText(d) {
    return String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dateText(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function sorted(posts) {
    return posts.slice().sort(function (a, b) { return b.date - a.date; });
  }
  function removeLegacyBlocks() {
    var nodes = document.querySelectorAll("#publisher-live-home, #publisher-live-archives");
    for (var i = 0; i < nodes.length; i++) { nodes[i].remove(); }
  }
  function updatePostCount(total) {
    var counters = document.querySelectorAll(".site-state-posts .site-state-item-count");
    for (var i = 0; i < counters.length; i++) { counters[i].textContent = String(total); }
  }
  function patchHome(posts) {
    var root = document.querySelector(".main-inner.index.posts-expand");
    if (!root) return;
    var blocks = root.querySelectorAll(".post-block");
    for (var i = 0; i < blocks.length; i++) {
      blocks[i].remove();
    }
    var ordered = sorted(posts);
    for (var j = 0; j < ordered.length; j++) {
      var post = ordered[j];
      if (!post.date || !post.url) continue;
      var block = document.createElement("div");
      block.className = "post-block";
      block.style.visibility = "visible";
      block.style.opacity = "1";
      block.style.transform = "none";
      var body = post.excerpt ? ("<div class=\"post-body\" itemprop=\"articleBody\"><p>" + safeText(post.excerpt) + "</p></div>") : "";
      block.innerHTML = "<article itemscope itemtype=\"http://schema.org/Article\" class=\"post-content\"><header class=\"post-header\"><h2 class=\"post-title\" itemprop=\"name headline\"><a href=\"" + safeText(post.url) + "\" class=\"post-title-link\" itemprop=\"url\">" + safeText(post.title) + "</a></h2><div class=\"post-meta-container\"><div class=\"post-meta\"><span class=\"post-meta-item\"><span class=\"post-meta-item-icon\"><i class=\"far fa-calendar\"></i></span><span class=\"post-meta-item-text\">发表于</span><time>" + dateText(post.date) + "</time></span></div></div></header>" + body + "</article>";
      var descendants = block.querySelectorAll("*");
      for (var n = 0; n < descendants.length; n++) {
        descendants[n].style.visibility = "visible";
        descendants[n].style.opacity = "1";
        descendants[n].style.transform = "none";
      }
      root.appendChild(block);
    }
  }
  function patchArchives(posts) {
    var content = document.querySelector(".main-inner.archive.posts-collapse .post-block .post-content");
    if (!content) return;
    var valid = sorted(posts.filter(function (p) { return !!p.date; }));
    if (!valid.length) return;
    var groups = {};
    for (var i = 0; i < valid.length; i++) {
      var item = valid[i];
      var y = String(item.date.getFullYear());
      if (!groups[y]) groups[y] = [];
      groups[y].push(item);
    }
    var years = Object.keys(groups).sort(function (a, b) { return Number(b) - Number(a); });
    var html = "<div class=\"collection-title\"><span class=\"collection-header\">嗯..! 目前共计 " + valid.length + " 篇日志。继续努力。</span></div>";
    for (var j = 0; j < years.length; j++) {
      var year = years[j];
      var arr = groups[year];
      html += "<div class=\"collection-year\"><span class=\"collection-header\">" + year + "<span class=\"collection-year-count\">" + arr.length + "</span></span></div>";
      for (var k = 0; k < arr.length; k++) {
        var p = arr[k];
        html += "<article itemscope itemtype=\"http://schema.org/Article\"><header class=\"post-header\"><div class=\"post-meta-container\"><time>" + dayText(p.date) + "</time></div><div class=\"post-title\"><a class=\"post-title-link\" href=\"" + safeText(p.url) + "\">" + safeText(p.title) + "</a></div></header></article>";
      }
    }
    content.innerHTML = html;
  }
  fetch("/blog-data/posts.json?ts=" + Date.now())
    .then(function (r) { if (!r.ok) throw new Error("feed not found"); return r.json(); })
    .then(function (posts) {
      if (!Array.isArray(posts) || !posts.length) return;
      var normalized = posts.map(function (item) {
        return {
          title: String(item && item.title || ""),
          url: normalizeUrl(item && item.url || ""),
          date: parseDate(item && item.publishedAt),
          excerpt: String(item && item.excerpt || "")
        };
      }).filter(function (item) { return item.url; });
      removeLegacyBlocks();
      updatePostCount(normalized.length);
      patchHome(normalized);
      patchArchives(normalized);
    })
    .catch(function () {});
})();
