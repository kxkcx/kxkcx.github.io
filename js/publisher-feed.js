(function () {
  function safeText(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      if (ch === "&") return "&amp;";
      if (ch === "<") return "&lt;";
      if (ch === ">") return "&gt;";
      if (ch === "\"") return "&quot;";
      return "&#39;";
    });
  }
  function parseDate(input) {
    var date = new Date(input || "");
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function md(date) {
    return String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  function injectHome(posts) {
    var root = document.querySelector(".main-inner.index") || document.getElementById("main");
    if (!root || document.getElementById("publisher-live-home")) return;
    var list = posts.slice(0, 8).map(function (p) {
      return "<li style=\"margin:8px 0;\"><a href=\"" + safeText(p.url) + "\">" + safeText(p.title) + "</a></li>";
    }).join("");
    var block = document.createElement("div");
    block.id = "publisher-live-home";
    block.className = "post-block";
    block.innerHTML = "<div class=\"post-content\" style=\"padding:16px 24px;\"><h2 style=\"margin:0 0 12px;\">最新发布</h2><ul style=\"margin:0;padding-left:20px;\">" + list + "</ul></div>";
    root.insertBefore(block, root.firstChild);
  }
  function injectArchives(posts) {
    var root = document.querySelector(".main-inner.archive") || document.getElementById("main");
    if (!root || document.getElementById("publisher-live-archives")) return;
    var withDate = posts.map(function (p) {
      return { title: p.title, url: p.url, date: parseDate(p.publishedAt) };
    }).filter(function (x) { return !!x.date; }).sort(function (a, b) { return b.date - a.date; });
    if (!withDate.length) return;
    var html = withDate.map(function (x) {
      return "<article><header class=\"post-header\"><div class=\"post-meta-container\"><time>" + md(x.date) + "</time></div><div class=\"post-title\"><a class=\"post-title-link\" href=\"" + safeText(x.url) + "\">" + safeText(x.title) + "</a></div></header></article>";
    }).join("");
    var block = document.createElement("div");
    block.id = "publisher-live-archives";
    block.className = "post-block";
    block.innerHTML = "<div class=\"post-content\"><div class=\"collection-title\"><span class=\"collection-header\">自动归档（最新）</span></div>" + html + "</div>";
    root.insertBefore(block, root.firstChild);
  }
  fetch("/blog-data/posts.json?ts=" + Date.now())
    .then(function (r) { if (!r.ok) throw new Error("feed not found"); return r.json(); })
    .then(function (posts) {
      if (!Array.isArray(posts) || !posts.length) return;
      injectHome(posts);
      injectArchives(posts);
    })
    .catch(function () {});
})();
