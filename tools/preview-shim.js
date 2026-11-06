/*
 * Preview shim for the static copy of mir.dental (restored from web archives).
 *
 * On the live site modal forms were rendered by WordPress (admin-ajax.php, POST)
 * and submitted leads went to the clinic CRM. Static hosting has neither, so here:
 *  - modals get forms built from the site's own markup (same classes, mask, validation);
 *  - the theme validates the form as usual, but instead of sending it the demo notice opens;
 *  - CRM and other server requests are blocked.
 */
(function () {
  var script = document.currentScript;
  var BASE = script ? script.src.replace(/preview-shim\.js.*$/, "") : "/";

  var DEMO_NOTICE =
    '<div class="preview-note" style="padding:32px;text-align:center;font-size:18px;line-height:1.5;color:#0e1130">' +
    '<p style="margin:0 0 12px"><b>Демо-версия сайта</b></p>' +
    '<p style="margin:0 0 16px">Онлайн-запись в&nbsp;этой копии отключена. Записаться на&nbsp;приём можно по&nbsp;телефону:</p>' +
    '<p style="margin:0 0 8px"><a style="color:#d6336c;font-weight:700;text-decoration:none;white-space:nowrap" href="tel:+74952600001">+7&nbsp;(495)&nbsp;260-00-01</a></p>' +
    '<p style="margin:0"><a style="color:#d6336c;font-weight:700;text-decoration:none;white-space:nowrap" href="tel:+79300360001">+7&nbsp;(930)&nbsp;036-00-01</a></p>' +
    "</div>";

  var TOUR_NOTICE =
    '<div class="preview-note" style="padding:32px;text-align:center;font-size:18px;line-height:1.5;color:#0e1130">' +
    '<p style="margin:0 0 12px"><b>3D-тур по&nbsp;клинике</b></p>' +
    '<p style="margin:0">Файлы 3D-тура не&nbsp;сохранились в&nbsp;веб-архивах, поэтому в&nbsp;демо-версии он&nbsp;недоступен.</p>' +
    "</div>";

  /* ---------- form templates (markup and classes of the original site) ---------- */
  var uid = 0;

  function policy() {
    var id = "policy_demo_" + ++uid;
    return (
      '<div class="policy mt-2">' +
      '<input type="radio" id="' + id + '" name="policy_true" value="policy_true" class="policy_true-checkbox" checked/>' +
      '<label for="' + id + '">Нажимая на&nbsp;кнопку, Вы&nbsp;соглашаетесь с&nbsp;условиями <br> ' +
      '<a target="_blank" href="' + BASE + 'policy/">Политики конфиденциальности</a> и&nbsp;' +
      '<a target="_blank" href="' + BASE + 'politika-v-oblasti-obrabotki-personalnyh-dannyh/">Политикой обработки персональных данных</a></label>' +
      "</div>"
    );
  }

  var MESSAGES =
    '<div class="messages">' +
    '<div class="succes d-none"><strong>Спасибо</strong><p>Ваше обращение успешно отправлено, мы&nbsp;свяжемся в&nbsp;самое ближайшее время</p></div>' +
    '<div class="fail d-none"><strong>Ошибка</strong><p>попробуйте обновить страницу и&nbsp;попробовать снова.</p></div>' +
    "</div>";

  var FIELDS = {
    name: '<input type="text" name="name" placeholder="Ваше имя" required>',
    phone: '<input type="text" name="phone" placeholder="Ваш номер телефона" required data-inputmask-mask="[+]9 999 999 99-99">',
    messenger:
      '<div class="select2"><select id="messenger" name="messenger">' +
      '<option value="telegram">Telegram</option><option value="phone">Телефон</option>' +
      "</select></div>",
    question: '<textarea name="content" placeholder="Ваш вопрос" rows="4" required></textarea>',
    complaint: '<textarea name="content" placeholder="Опишите ситуацию" rows="4" required></textarea>',
  };

  function form(o) {
    var fields = o.fields.map(function (f) { return FIELDS[f]; }).join("");
    return (
      '<div class="page_finish form preview-form" style="padding:8px 4px">' +
      '<h2 style="margin-bottom:12px">' + o.title + "</h2>" +
      (o.text ? '<p style="margin-bottom:20px">' + o.text + "</p>" : "") +
      '<form class="form" action="send_form" data="' + o.data + '" method="post" data-ym="' + o.ym + '" enctype="multipart/form-data">' +
      '<div class="d-flex flex-column gap-3">' + fields +
      '<button type="submit" class="btn col-12 btn_2_gr animate">' + o.button + "</button></div>" +
      '<input type="hidden" name="URL" value="' + location.href + '">' +
      policy() + MESSAGES +
      "</form></div>"
    );
  }

  var TEMPLATES = {
    "form/order": function () {
      return form({
        title: "Записаться на&nbsp;приём",
        text: "Оставьте контакты&nbsp;— администратор свяжется с&nbsp;вами, подберёт удобное время и&nbsp;врача.",
        fields: ["name", "phone", "messenger"], button: "Записаться на&nbsp;приём",
        data: "Запись на прием", ym: "ORDER",
      });
    },
    "form/calc": function () {
      return form({
        title: "Рассчитать стоимость лечения",
        text: "Выберите удобный мессенджер. Мы&nbsp;свяжемся с&nbsp;вами, уточним детали и&nbsp;пришлём расчёт.",
        fields: ["name", "phone", "messenger"], button: "Получить расчёт",
        data: "Расчет стоимости", ym: "FORM-CALC",
      });
    },
    "form/call": function () {
      return form({
        title: "Заказать звонок",
        text: "Оставьте номер&nbsp;— перезвоним в&nbsp;ближайшее время.",
        fields: ["name", "phone"], button: "Перезвоните мне",
        data: "Перезвоните мне", ym: "FORM-CALL",
      });
    },
    "form/consult": function () {
      return form({
        title: "Получить консультацию",
        text: "Оставьте контакты, и&nbsp;специалист клиники ответит на&nbsp;ваши вопросы.",
        fields: ["name", "phone"], button: "Получить консультацию",
        data: "Консультация", ym: "FORM-CONSULT",
      });
    },
    "form/quest": function () {
      return form({
        title: "Задать вопрос",
        text: "Напишите вопрос и&nbsp;оставьте номер&nbsp;— врач клиники перезвонит и&nbsp;ответит.",
        fields: ["name", "phone", "question"], button: "Отправить вопрос",
        data: "Вопрос", ym: "FORM-QUEST",
      });
    },
    "form/control": function () {
      return form({
        title: "Служба контроля качества",
        text: "Расскажите, что пошло не&nbsp;так,&nbsp;— руководство клиники свяжется с&nbsp;вами и&nbsp;разберётся в&nbsp;ситуации.",
        fields: ["name", "phone", "complaint"], button: "Отправить обращение",
        data: "Контроль качества", ym: "FORM-CONTROL",
      });
    },
    "3dtour": function () {
      return TOUR_NOTICE;
    },
  };

  /* the review form exists on the reviews page: take the original markup from there */
  function reviewForm() {
    return fetch(BASE + "review/")
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var f = doc.querySelector("form.form_review");
        if (!f) return TEMPLATES["form/consult"]();
        // links in the fetched page are relative to /review/
        f.querySelectorAll("[href],[src]").forEach(function (el) {
          ["href", "src"].forEach(function (a) {
            var v = el.getAttribute(a);
            if (v && !/^(https?:|\/|#|tel:|mailto:)/.test(v)) el.setAttribute(a, new URL(v, BASE + "review/").href);
          });
        });
        return '<div class="preview-form" style="padding:8px 4px"><h2 style="margin-bottom:16px">Оставить отзыв</h2>' + f.outerHTML + "</div>";
      })
      .catch(function () { return TEMPLATES["form/consult"](); });
  }

  /* ---------- demo notice on submit ---------- */
  function showDemoNotice() {
    var $ = window.jQuery;
    var modal = $("#umodal");
    if (!modal.length) return alert("Это демо-версия сайта: отправка форм отключена.");
    modal.removeClass("modal-lg modal-xl modal-full modal-video");
    modal.find(".ajax").html(DEMO_NOTICE);
    if (modal.hasClass("hide")) {
      modal.removeClass("hide");
      $('[data-show="#umodal"]').addClass("show");
    }
  }

  function restoreForm() {
    var $ = window.jQuery;
    var loading = $("form .loading");
    var f = loading.closest("form");
    loading.remove();
    f.find(">*:not(.messages)").show();
  }

  function isBlocked(url) {
    url = String(url || "");
    return url.indexOf("admin-ajax.php") !== -1 || url.indexOf("pinscherdev.ru") !== -1;
  }

  function never($) {
    return $.Deferred().promise(); // never resolves: theme success/fail handlers do not run
  }

  function patchJquery($) {
    if (!$ || $.__previewPatched) return;
    $.__previewPatched = true;
    var origPost = $.post;
    $.post = function (url, data, success) {
      if (!isBlocked(url)) return origPost.apply(this, arguments);
      var cb = typeof data === "function" ? data : success;
      var action = data && data.action;

      if (action === "send_form") {
        restoreForm();
        showDemoNotice();
        return never($);
      }
      if (action === "load_file_ajax") {
        var key = data.file;
        var deliver = function (html) { if (cb) cb({ html: html }); };
        if (key === "form/add_review") reviewForm().then(deliver);
        else setTimeout(function () { deliver((TEMPLATES[key] || TEMPLATES["form/order"])()); }, 0);
        return never($);
      }
      return never($);
    };
    var origAjax = $.ajax;
    $.ajax = function (opts) {
      var url = typeof opts === "string" ? opts : opts && opts.url;
      if (isBlocked(url)) return never($);
      return origAjax.apply(this, arguments);
    };
  }

  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function (input) {
      var url = typeof input === "string" ? input : input && input.url;
      if (isBlocked(url)) {
        return Promise.resolve(new Response(JSON.stringify({ success: false }), {
          headers: { "Content-Type": "application/json" },
        }));
      }
      return origFetch.apply(this, arguments);
    };
  }

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

  // on some pages jQuery is loaded after this script: wait for it
  function tryPatch() {
    if (window.jQuery) {
      patchJquery(window.jQuery);
      return true;
    }
    return false;
  }
  if (!tryPatch()) {
    var timer = setInterval(function () {
      if (tryPatch()) clearInterval(timer);
    }, 20);
    document.addEventListener("DOMContentLoaded", tryPatch);
  }
})();
