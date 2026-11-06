//init
show_hide();

//Скрытие блоков
function show_hide() {
  //Показать блоки
  $("body").on("click", "[data-show]", function () {
    var btn = $(this); //Нажатая кнопка
    var btns = $('[data-show="' + btn.attr("data-show") + '"]'); //Подобные кнопки
    var item = $(btn.attr("data-show")); //Элемент действия
    var in_item = item.find(".ajax") ? item.find(".ajax") : item; //Куда вставлять контент
    btns.toggleClass("show");

    //Если это аккардион
    if (btn.attr("data-hide")) {
      $('[data-hide*="' + btn.attr("data-hide") + '"]').removeClass("show");
      $(btn.attr("data-hide")).addClass("hide");
      btn.addClass("show");
    }

    //Скрываем/показываем элемент
    item.toggleClass("hide");

    // При открытии мобильного меню — раскрыть только пункты первого уровня
    if (item.is(".mobile_menu") && !item.hasClass("hide")) {
      item.find(".menu > li.has_childs").addClass("show");
    }

    //Если кнопка внутри
    if (
      btn.closest(".modal").length > 0 &&
      "#" + btn.closest(".modal").attr("ID") == btn.attr("data-show") &&
      !btn.hasClass("modal_close")
    )
      item.removeClass("hide");

    //Ajax загрузка
    if (btn.attr("data-ajax")) {
      in_item.html('<span class="loading"></span>');
      var data = {
        action: "load_file_ajax",
        file: btn.attr("data-ajax"),
        URL: location.href,
      };
      //Передаваемые переменные
      if (btn.attr("data-post")) data["post"] = btn.attr("data-post");
      $.post(
        "/wp-admin/admin-ajax.php",
        data,
        function (response) {
          in_item.html(response.html);
          in_item.find("form").each(function () {
            forms_init($(this));
          });
          lazy_load_reset();
          owl_init();
        },
        "json",
      );
    }

    //Удаляем лишнии классы
    item.find("iframe").attr("src", "");
    if (btn.hasClass("show"))
      item.removeClass("modal-lg modal-xl modal-full modal-video");

    //Большая модалка
    if (btn.hasClass("modal-lg")) item.addClass("modal-lg");

    //Большая модалка
    if (btn.hasClass("modal-xl")) item.addClass("modal-xl");

    //Большая модалка
    if (btn.hasClass("modal-full")) item.addClass("modal-full");

    item.find(".owl-carousel").trigger("refresh.owl.carousel");

    //Убираем скролл
    if (item.hasClass("modal") || btn.hasClass("no-scroll"))
      $("body,html").toggleClass("no-scroll", !item.hasClass("hide"));

    return false;
  });
}

//Инит карусели
function owl_init() {
  $(".owl-carousel:not(.owl-loaded)").each(function () {
    let owl = $(this);
    let number = owl.attr("data-number")
      ? owl.attr("data-number").split(",")
      : [4, 3, 2, 2, 1];
    while (number.length < 5) number.push(number[number.length - 1]);
    let margin = owl.attr("data-margin")
      ? parseInt(owl.attr("data-margin"))
      : 20;
    let nav = owl.attr("data-nav") ? owl.attr("data-nav") === "1" : 1;
    let dots = owl.attr("data-dots") ? owl.attr("data-dots") === "1" : 0;
    let loop = owl.attr("data-loop") ? owl.attr("data-loop") === "1" : 0;
    let center = owl.attr("data-center") ? owl.attr("data-center") === "1" : 0;
    let start = owl.attr("data-start") ? parseInt(owl.attr("data-start")) : 0;
    let autoplay = owl.attr("data-autoplay")
      ? parseInt(owl.attr("data-autoplay"))
      : 0;
    let autoplaytime = owl.attr("data-autoplaytime")
      ? parseInt(owl.attr("data-autoplaytime"))
      : 5000;
    let drag = owl.attr("data-drag") ? parseInt(owl.attr("data-drag")) : 1;
    let autowidth = owl.attr("data-autowidth")
      ? parseInt(owl.attr("data-autowidth"))
      : 0;
    let autoheight = owl.attr("data-auto-height") 
      ? parseInt(owl.attr("data-auto-height")) 
      : 0;
    console.log('autoHeight is ' + autoheight)

    owl.owlCarousel({
      autoWidth: autowidth,
      autoHeight: autoheight,
      loop: loop,
      items: number[3],
      autoplay: autoplay,
      autoplayTimeout: autoplaytime,
      mouseDrag: drag,
      touchDrag: drag,
      startPosition: start,
      nav: nav,
      dots: dots,
      navText: [],
      margin: margin,
      center: center,
      responsive: {
          0:    { items: parseInt(number[4]) || 1 },
          576:  { items: parseInt(number[3]) || 1 },
          992:  { items: parseInt(number[2]) || 1 },
          1200: { items: parseInt(number[1]) || 1 },
          1400: { items: parseInt(number[0]) || 1 },
      },
    });
    lazy_load_reset();
    owl.on("changed.owl.carousel", function (event) {
      lazy_load_reset();
    });
    if (autoheight) {
        // Снимаем инлайн-высоту которую owl насильно ставит
        owl.on('initialized.owl.carousel refreshed.owl.carousel resized.owl.carousel', function() {
            $(this).find('.owl-stage-outer').css('height', '');
            $(this).find('.owl-item').css('height', '');
        });
        // И сразу после инита
        owl.find('.owl-stage-outer').css('height', '');
        owl.find('.owl-item').css('height', '');
    }
  });
}

// Ленивая подгрузка фонов секций
(function () {
  var els = document.querySelectorAll("[data-fon-lazy]");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("bg-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("bg-in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "300px 0px" });
  els.forEach(function (el) { io.observe(el); });
})();

$(function () {
  // ------------------------------------------------------------------
  // МЕНЮ: ЖЕСТКАЯ ПРИВЯЗКА СОБЫТИЙ, ЧТОБЫ НИЧЕГО НЕ ГЛЮЧИЛО
  // ------------------------------------------------------------------

  // CSS-фикс: на мобилке .show управляет подменю, :hover не вмешивается
  var mobileMenuFix = document.createElement("style");
  mobileMenuFix.textContent =
    "@media(max-width:899px){" +
    ".mobile_menu .menu li.has_childs>ul,.mobile_menu .menu li.has_childs>.sub_menu,.mobile_menu .menu li.has_childs>div{display:none !important;height:0 !important;overflow:hidden !important;visibility:hidden !important;opacity:0 !important;transition:none !important;}" +
    ".mobile_menu .menu li.has_childs.show>ul,.mobile_menu .menu li.has_childs.show>.sub_menu,.mobile_menu .menu li.has_childs.show>div{display:block !important;height:auto !important;overflow:visible !important;visibility:visible !important;opacity:1 !important;}" +
    "}";
  document.head.appendChild(mobileMenuFix);

  // Capturing click: стрелка и ссылки в мобильном меню
  document.addEventListener("click", function (e) {
    var mobileMenu = e.target.closest(".mobile_menu:not(.hide)");
    if (!mobileMenu) return;

    if (e.target.closest(".icon.arrow")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var li = e.target.closest("li.has_childs");
      if (li) li.classList.toggle("show");
      return;
    }

    var link = e.target.closest(".menu a");
    if (!link) return;

    var href = link.getAttribute("href");
    if (href && href !== "#" && href.indexOf("javascript") !== 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href = href;
    }
  }, true);

  // Touchend: навигация по ссылкам до mouseleave/layout-shift
  var _mobileMenuTouchStart = null;

  document.addEventListener("touchstart", function (e) {
    var mobileMenu = e.target.closest(".mobile_menu:not(.hide)");
    if (!mobileMenu) { _mobileMenuTouchStart = null; return; }
    _mobileMenuTouchStart = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
  }, true);

  document.addEventListener("touchend", function (e) {
    var mobileMenu = e.target.closest(".mobile_menu:not(.hide)");
    if (!mobileMenu) { _mobileMenuTouchStart = null; return; }

    var wasTap = false;
    if (_mobileMenuTouchStart) {
      var dx = e.changedTouches[0].clientX - _mobileMenuTouchStart.x;
      var dy = e.changedTouches[0].clientY - _mobileMenuTouchStart.y;
      wasTap = Math.sqrt(dx * dx + dy * dy) < 15;
    }
    _mobileMenuTouchStart = null;
    if (!wasTap) return;

    if (e.target.closest(".icon.arrow")) return;

    var link = e.target.closest(".menu a");
    if (link) {
      var href = link.getAttribute("href");
      if (href && href !== "#" && href.indexOf("javascript") !== 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
        link.style.cssText += ";background:rgba(0,123,255,0.15) !important;border-radius:4px;";
        var killEvent = function (evt) { evt.stopImmediatePropagation(); evt.preventDefault(); };
        ["mouseenter","mouseleave","mouseover","mouseout","mousedown","mouseup",
         "click","pointerenter","pointerleave","pointerover","pointerout",
         "pointerdown","pointerup","touchstart","touchend","touchmove"
        ].forEach(function (name) { document.addEventListener(name, killEvent, true); });
        window.location.href = href;
      }
    }
  }, true);

  // Десктопное меню: стрелка раскрывает подменю
  $(document).on("click", ".menu li.has_childs > a .icon.arrow", function (e) {
    if ($(this).closest(".mobile_menu").length) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    $(this).closest("li.has_childs").toggleClass("show");
  });

  // Десктопное меню: клик по тексту ссылки с дочерними — навигация
  $(document).on("click", ".menu li.has_childs > a", function (e) {
    if ($(this).closest(".mobile_menu").length) return;
    if ($(e.target).closest(".icon.arrow").length) return;
    var href = $(this).attr("href");
    if (href && href !== "#" && !href.startsWith("javascript")) {
      window.location.href = href;
    }
  });

  // Десктопный ховер — только вне mobile_menu
  $(".menu li.has_childs")
    .on("mouseenter", function () {
      if ($(window).width() >= 900 && !$(this).closest(".mobile_menu").length) {
        $(this).addClass("show");
      }
    })
    .on("mouseleave", function () {
      if ($(window).width() >= 900 && !$(this).closest(".mobile_menu").length) {
        $(this).removeClass("show");
      }
    });

  //Скрытие модалок при клике вне
  $(".modal").on("click", function (e) {
    var modal = $(this);
    if ($(e.target).hasClass("modal")) $(this).find(".modal_close").click();
  });

  // Ajax - Загрузить ещё
  $(".ajax-load-b").click(function (e) {
    e.preventDefault();
    var el = $(this);
    var href = el.attr("href");
    var index = $(".posts-grid").index(
      el.parent().parent().find(".posts-grid"),
    );
    el.css("pointer-events", "none");
    $.get(href, function (data) {
      var content = $($(data).find(".posts-grid")[index]).html();
      $(content).appendTo(".posts-grid:eq(" + index + ")");
      href = $(data).find(".posts-grid + #ajax-load .ajax-load-b").attr("href");
      console.log(href);
      $(".posts-grid:eq(" + index + ") + #ajax-load + .pagination-number").html(
        $(
          ".posts-grid:eq(" + index + ") + #ajax-load + .pagination-number",
          data,
        ).html(),
      );
      if (href) {
        $(".posts-grid:eq(" + index + ") + #ajax-load .ajax-load-b").html(
          $(
            ".posts-grid:eq(" + index + ") + #ajax-load .ajax-load-b",
            data,
          ).html(),
        );
        el.css("pointer-events", "unset");
        el.attr("href", href);
      } else el.hide();

      //Загружаем изображения если есть
      lazy_load_reset();
    });
  });

  // do-posle
  $(".do-posle").on("mousemove", function (e) {
    $(this)
      .find(".posle")
      .css(
        "width",
        100 -
          (e.pageX - $(this).offset().left - 8) / ($(this).width() / 100) +
          "%",
      );
  });

  //Кнопка наверх
  var header = $("header");
  $(window).scroll(function () {
    if (header.length > 0) {
      if ($(this).scrollTop() > 200 && !header.hasClass("fix"))
        header.addClass("fix");
      if ($(this).scrollTop() < 10 && header.hasClass("fix"))
        header.removeClass("fix");
    }
  });

  //Фиксбар
  setTimeout(function () {
    $(".fix_bar").removeClass("hide");
    $('.fix_bar [href="#header"]').on("click", function (e) {
      e.preventDefault();
      $("html, body").animate({ scrollTop: 2 }, "fast");
      return false;
    });
  }, 1000);

  owl_init();
  setInterval(function () {
    $(".owl-carousel").trigger("refresh.owl.carousel");
  }, 5000);

  //Фильтр по терминам (fix)
  $("[data-terms]").each(function () {
    $(this).parent().attr("data-terms", $(this).data("terms"));
    $(this).removeAttr("data-terms");
  });

  // Фильтрация слайдера team2 — ДОБАВИТЬ СЮДА
  (function () {
    var $slider = $('.team2-slider .owl-carousel');
    if (!$slider.length) return;

    function rebuildSlider(termId) {
      if ($slider.hasClass('owl-loaded')) {
        $slider.trigger('destroy.owl.carousel');
        $slider.removeClass('owl-loaded owl-drag');
      }
      $slider.empty();

      $('.team2-slides-source > [data-terms]').each(function () {
        var terms = $(this).attr('data-terms');
        if (!termId || terms.indexOf('|' + termId + '|') !== -1) {
          $slider.append($(this).clone(true));
        }
      });

      owl_init();
    }

    $(document).on('click', '.team2_b .btns [data-show]', function () {
      var showSel = $(this).attr('data-show') || '';
      var match = showSel.match(/data-terms\*='\|(\d+)\|'/);
      var termId = match ? match[1] : null;
      rebuildSlider(termId);
    });
  }());

  //.do-posle
  $(".do-posle").on("mousemove", function (e) {
    $(this)
      .find(".posle")
      .css(
        "width",
        100 -
          (e.pageX - $(this).offset().left - 8) / ($(this).width() / 100) +
          "%",
      );
  });
});

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  var matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)",
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}
