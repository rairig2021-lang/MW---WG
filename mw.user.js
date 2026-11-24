// ==UserScript==
// @name         MapleStory Watch → Google Sheet
// @namespace    https://github.com/rairig2021-lang
// @version      1.0.1
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

  async function sendToSheet(btn) {
    btn.textContent = "Working...";
    const rows = (await getRows()).map(addChannelRoom);
    if (!rows.length) { btn.textContent = "No rows found"; return; }

    GM_xmlhttpRequest({
      method: "POST",
      url: WEB_APP_URL,
      data: JSON.stringify(rows),
      headers: { "Content-Type": "text/plain" },
      onload: () => { btn.textContent = "Sent " + rows.length + " rows ✓"; },
      onerror: () => { btn.textContent = "Failed ✗ (see console)"; }
    });
  }

  const btn = document.createElement("button");
  btn.textContent = "Export to Sheet";
  btn.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:99999;padding:10px 14px;" +
    "background:#2d6cdf;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:14px;";
  btn.onclick = () => sendToSheet(btn);
  document.body.appendChild(btn);
})();
