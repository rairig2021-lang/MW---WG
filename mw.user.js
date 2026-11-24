// ==UserScript==
// @name         MapleStory Watch → Google Sheet
// @namespace    https://github.com/rairig2021-lang
// @version      1.0.2
// @match        https://maplestory.watch/market*
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @updateURL    https://raw.githubusercontent.com/rairig2021-lang/MW---WG/main/mw.user.js
// @downloadURL  https://raw.githubusercontent.com/rairig2021-lang/MW---WG/main/mw.user.js
// ==/UserScript==

(function () {
  "use strict";

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbypfVJLDBgCbeletQnEwZ0Q1RHgJuZxhYol0SNTFsNjzyx-QYT4UHLbMeSHnliOYso2/exec";

  // Paste the scraping logic from your old console script here.
  // Must return an array of objects with these keys:
  // Listed, Price, Location, Seller, "Slots worked", "Slots failed", Item
  async function getRows() {
    return [];
  }

  // Splits "Ch. 22 Free Market <11>" into Channel=22, Room=11
  function addChannelRoom(r) {
    const m = /Ch\.\s*(\d+).*<(\d+)>/.exec(r.Location || "");
    r.Channel = m ? Number(m[1]) : "";
    r.Room = m ? Number(m[2]) : "";
    return r;
  }

   // Small message at the top of the screen (shows inside the popup if one is open)
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

  async function sendToSheet() {
    setStatus("Working...");
    const rows = (await getRows()).map(addChannelRoom);
    if (!rows.length) { setStatus("No rows found"); return; }

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
