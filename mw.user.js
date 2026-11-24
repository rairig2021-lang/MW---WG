// ==UserScript==
// @name         MapleStory Watch → Google Sheet
// @namespace    https://github.com/rairig2021-lang
// @version      1.1.1
// @match        https://maplestory.watch/market*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @updateURL    https://raw.githubusercontent.com/rairig2021-lang/MW---WG/main/mw.user.js
// @downloadURL  https://raw.githubusercontent.com/rairig2021-lang/MW---WG/main/mw.user.js
// ==/UserScript==

(function () {
  "use strict";

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbypfVJLDBgCbeletQnEwZ0Q1RHgJuZxhYol0SNTFsNjzyx-QYT4UHLbMeSHnliOYso2/exec";

  function getRows() {
    const trs = [...document.querySelectorAll("tr[data-row]")];
    if (!trs.length) return [];

    const item = new URLSearchParams(location.search).get("item") || "";
    const txt = (el) => (el ? el.textContent.trim() : "");
    const num = (s) => { const n = parseFloat(String(s).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; };

    // 1000 -> 1K, 1500 -> 1.5K, 1000000 -> 1M
    const fmtPrice = (n) => {
      const f = (v, suffix) => String(Math.round(v * 100) / 100).replace(/\.0+$/, "") + suffix;
      if (n >= 1e9) return f(n / 1e9, "B");
      if (n >= 1e6) return f(n / 1e6, "M");
      if (n >= 1e3) return f(n / 1e3, "K");
      return String(n);
    };

    // "2h ago", "15m ago", "3d ago" -> minutes, so rows sort most recent first
    const minutesAgo = (s) => {
      const t = s.toLowerCase();
      if (/now/.test(t) && !/\d/.test(t)) return 0;
      const m = t.match(/(\d+(?:\.\d+)?)\s*(s|sec|second|m|min|minute|h|hr|hour|d|day|w|week|mo|month|y|yr|year)/);
      if (!m) return Infinity;
      const n = parseFloat(m[1]), u = m[2];
      if (u.startsWith("s")) return n / 60;
      if (u === "m" || u.startsWith("min")) return n;
      if (u.startsWith("h")) return n * 60;
      if (u.startsWith("d")) return n * 1440;
      if (u.startsWith("w")) return n * 10080;
      if (u === "mo" || u.startsWith("month")) return n * 43200;
      if (u.startsWith("y")) return n * 525600;
      return Infinity;
    };

    const data = trs.map((tr) => {
      const cells = tr.querySelectorAll(":scope > td");
      const priceBox = cells[0]?.querySelector(".font-extrabold");
      const countText = txt(priceBox?.querySelector(".listing-count"));
      const priceText = txt(priceBox).replace(countText, "").trim();
      const pip = cells[0]?.querySelector(".slot-pips")?.getAttribute("aria-label") || "";
      const listed = txt(cells[3]);
      return {
        _m: minutesAgo(listed),
        "Listed": listed,
        "Price": fmtPrice(num(priceText)),
        "Channel": tr.dataset.channel || "",
        "Room": tr.dataset.room || "",
        "Seller": txt(cells[1]?.querySelector(".text-gold")),
        "Slots worked": (pip.match(/(\d+)\s*worked/i) || [])[1] ?? "",
        "Slots failed": (pip.match(/(\d+)\s*failed/i) || [])[1] ?? "",
        "Item": item,
      };
    });

    data.sort((a, b) => a._m - b._m);
    return data;
  }

  // Small message at the top of the screen (shows inside a popup if one is open)
  function setStatus(text) {
    console.log("[MW export]", text);
    const host = document.querySelector("dialog[open], [role='dialog']") || document.body;
    let el = document.getElementById("mw-export-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "mw-export-toast";
      el.style.cssText =
        "position:fixed;top:16px;left:50%;transform:translateX(-50%);" +
        "z-index:2147483647;padding:10px 14px;background:#2d6cdf;color:#fff;" +
        "border-radius:8px;font-size:14px;pointer-events:none;";
    }
    if (el.parentNode !== host) host.appendChild(el);
    el.textContent = text;
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.display = "none"), 4000);
  }

  function sendToSheet() {
    setStatus("Working...");
    const rows = getRows();
    if (!rows.length) { setStatus("No listing rows found on this page"); return; }

    GM_xmlhttpRequest({
      method: "POST",
      url: WEB_APP_URL,
      data: JSON.stringify(rows),
      headers: { "Content-Type": "text/plain" },
      onload: () => setStatus("Sent " + rows.length + " rows ✓"),
      onerror: () => setStatus("Failed ✗ (see console)")
    });
  }

  // Way 1: Tampermonkey menu
  GM_registerMenuCommand("Export to Sheet", sendToSheet);

  // Way 2: keyboard shortcut Alt+Shift+S
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === "KeyS") {
      e.preventDefault();
      e.stopPropagation();
      sendToSheet();
    }
  }, true);
})();
