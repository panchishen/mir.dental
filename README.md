# mir.dental — копия сайта из веб-архивов

Статическая копия сайта стоматологии «МИР ДЕНТАЛ» (mir.dental). Её восстановили после того, как хостинг Beget перестал отдавать сайт из‑за кибератаки.

Демо: https://panchishen.github.io/mir.dental/

## Откуда взяты данные

| Источник | Что дал |
|---|---|
| Wayback Machine (web.archive.org) | основная часть: самый свежий снимок каждого URL; главная от 14.10.2026, страницы до 15.10.2026 |
| Common Crawl | 6 страниц, которых нет в Wayback (снимки 17.07–12.10.2026) |
| SVN wordpress.org, jsDelivr | стандартные файлы WordPress и плагинов (dashicons, mediaelement, иконки версии для слабовидящих, иконка видео Owl Carousel) |
| archive.today, arquivo.pt, Ghostarchive | копий сайта нет |

## Что восстановлено, а что нет

- Восстановлено 266 страниц: услуги, портфолио, отзывы, врачи, статьи, цены, контакты.
- Не сохранились ни в одном архиве 18 страниц. Они открывают страницу 404 с телефонами клиники. Список — в разделе ниже.
- Нет около 700 картинок и 42 видео. Большинство картинок — уменьшенные webp из кеша WordPress (`wp-content/cache/img`), архивы их не сохранили. На их месте пусто, значки битых картинок скрыты.
- Формы показываются как на сайте: со своей разметкой, маской телефона и проверкой полей. Всплывающие формы записи, звонка, консультации, расчёта, вопроса и контроля качества собраны из родных блоков сайта: их точная разметка генерировалась сервером и в архивы не попала. Форма отзыва взята со страницы отзывов без изменений. При отправке любой формы открывается окно «Демо-версия сайта» с телефонами клиники, данные никуда не уходят, в том числе в CRM. 3D‑тур не работает: его файлы не сохранились.
- Счётчик Яндекс.Метрики из копии убран, а сама копия закрыта от индексации (`noindex`), чтобы не создавать дубль сайта в поиске.

Самые полные данные (база WordPress, все загруженные файлы) — в резервных копиях Beget или у разработчика сайта. Если их удастся получить, сайт можно восстановить целиком.

### Страницы, которых нет ни в одном архиве

```
/articles/ispravlenie-prikusa-elajnerami/
/articles/nesemnoe-protezirovanie-zubov/
/articles/pamyatka-pered-lechenie-zubov-v-medikamentoznom-sne/
/articles/snyatie-vinirov-i-koronok-lazerom/
/blog/
/pervichnyj-priem/
/review/page/2/
/service/gnatolog-moskva/
/service/ispravlenie-prikusa-u-vzroslyh/ispravlenie-prikusa-s-pomoshhyu-elajnerov/
/service/page/3/
/service/protezirovanie/protezirovanie-1-zuba/
/service/protezirovanie/protezirovanie-2-zubov/
/service/protezirovanie/snyatie-koronki-erbievym-lazerom/
/service/terapiya-i-diagnostika/lechenie-kanalov-zubov-lazerom-litetouch/
/service/terapiya-i-diagnostika/lechenie-kariesa-zubov-litetouch/
/service/terapiya-i-diagnostika/panoramnyj-snimok-zubov/
/soglasie-na-obrabotku-personalnyh-dannyh/
/team/page/2/
```

## Скрипты (`tools/`)

- `download.py` — скачивает самый свежий снимок каждого URL из Wayback по выгрузке CDX. Работает в один поток с паузами: при частых запросах web.archive.org блокирует IP.
- `cc_fetch.py` — ищет недостающие страницы в Common Crawl и достаёт их из WARC.
- `build.py` — собирает статическую версию: переписывает ссылки на относительные, подставляет недостающие CSS-бандлы, подключает `preview-shim.js`, ставит `noindex`.
- `preview-shim.js` — заглушка для форм и AJAX WordPress в статической копии.

Сайт рассчитан на адрес `/mir.dental/` (GitHub Pages). Для другого адреса пересоберите копию с нужной базой — она задаётся четвёртым аргументом `build.py`.
