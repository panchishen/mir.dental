/*
 * Preview shim for the static copy of mir.dental (restored from web archive).
 * The original site loaded modal forms from WordPress (admin-ajax.php) and sent
 * leads to the clinic CRM. Neither exists on static hosting, so in the preview:
 *  - modal "forms" show the clinic contacts instead of an endless loader;
 *  - form submission and CRM requests are disabled.
 */
(function () {
  var PREVIEW_HTML =
    '<div class="preview-note" style="padding:32px;text-align:center;font-size:18px;line-height:1.5">' +
    '<p style="margin:0 0 12px"><b>Демо-версия сайта</b></p>' +
    '<p style="margin:0 0 16px">Онлайн-запись в&nbsp;этой копии отключена. Записаться на&nbsp;приём можно по&nbsp;телефону:</p>' +
    '<p style="margin:0 0 8px"><a href="tel:+74952600001">+7&nbsp;(495)&nbsp;260-00-01</a></p>' +
    '<p style="margin:0"><a href="tel:+79300360001">+7&nbsp;(930)&nbsp;036-00-01</a></p>' +
    '</div>';

  function isBlocked(url) {
    url = String(url || "");
    return url.indexOf("admin-ajax.php") !== -1 || url.indexOf("pinscherdev.ru") !== -1;
  }

  function patchJquery($) {
    if (!$ || $.__previewPatched) return;
    $.__previewPatched = true;
    var origPost = $.post;
    $.post = function (url, data, success) {
      if (isBlocked(url)) {
        var cb = typeof data === "function" ? data : success;
        setTimeout(function () {
          if (cb) cb({ html: PREVIEW_HTML, success: false });
        }, 0);
        return $.Deferred().resolve({ html: PREVIEW_HTML }).promise();
      }
      return origPost.apply(this, arguments);
    };
    var origAjax = $.ajax;
    $.ajax = function (opts) {
      var url = typeof opts === "string" ? opts : opts && opts.url;
      if (isBlocked(url)) return $.Deferred().reject().promise();
      return origAjax.apply(this, arguments);
    };
  }

  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function (input) {
      var url = typeof input === "string" ? input : input && input.url;
      if (isBlocked(url)) {
        return Promise.resolve(new Response(JSON.stringify({ success: false, html: PREVIEW_HTML }), {
          headers: { "Content-Type": "application/json" },
        }));
      }
      return origFetch.apply(this, arguments);
    };
  }

  document.addEventListener(
    "submit",
    function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert("Это демо-версия сайта: отправка форм отключена. Запись по телефону +7 (495) 260-00-01.");
    },
    true
  );

  // images that were not preserved by any web archive: hide the broken-image icon
  document.addEventListener(
    "error",
    function (e) {
      if (e.target && e.target.tagName === "IMG") e.target.style.visibility = "hidden";
    },
    true
  );
  Array.prototype.forEach.call(document.images, function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) img.style.visibility = "hidden";
  });

  patchJquery(window.jQuery);
})();
