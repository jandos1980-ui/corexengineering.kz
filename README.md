# CoreX Engineering

Статический сайт на русском, казахском и английском языках. HTML, CSS и JavaScript; для работы не нужны Node.js, Python, PHP или база данных.

Английская версия добавлена 05.10.2026. Клиентский релиз по ссылке ниже пока содержит RU/KK; актуальную RU/KK/EN-сборку можно подготовить командой из раздела разработки.

## Скачать для размещения на хостинге

**[Скачать corex-site.zip](https://github.com/jandos1980-ui/corexengineering.kz/releases/latest/download/corex-site.zip)**

Программисту достаточно этого файла. Внутри:

- `site/` — файлы сайта; загрузите содержимое в корень хостинга.
- `INSTALL.md` — установка, Nginx/Apache, настройка 404 и проверка сайта.
- `VERSION.txt` и `SHA256SUMS.txt` — версия и контрольные суммы.

Архив настроен для **https://corexengineering.kz/**. Для другого домена нужно обновить SEO-адреса. Форма подготавливает письмо в почтовой программе посетителя; серверной отправки нет.

Автоматический **Code → Download ZIP** и **Source code (zip)** содержат исходники предпросмотра с отключённой индексацией. Для установки используйте **corex-site.zip** из Releases.

## Структура проекта

- `index.html`, `kk/`, `en/`, `solutions/` — 24 страницы RU/KK/EN.
- `assets/`, `documents/` — используемые изображения, шрифты, лицензии и PDF.
- `components/`, корневые CSS/JS — оформление и интерактивность.
- `404.html`, `robots.txt` — служебные страницы и настройки предпросмотра.
- `release/` — инструкция, сборщик клиентского архива и проверка его состава.

## Разработка и выпуск

Для локального просмотра из корня проекта: `python -m http.server 8765`, затем откройте http://localhost:8765/.

Сборка и проверка клиентского архива (Python 3.9+ только на машине разработчика):

```bash
python release/build_release.py --output ../corex-site.zip
python release/verify_release.py ../corex-site.zip
```

[Инструкция установки](release/INSTALL.md) · [Результаты проверки](release/VALIDATION-2026-10-05.md)

GitHub Pages публикует `main`, каталог `/`: [предпросмотр сайта](https://jandos1980-ui.github.io/corexengineering.kz/). Предпросмотр сохраняет `noindex`; производственный ZIP содержит canonical, hreflang и sitemap для основного домена. После изменения сайта проверяйте архив и успешность Pages deployment перед передачей.
