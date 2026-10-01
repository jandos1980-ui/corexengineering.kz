# corexengineering.kz

## Установка на сервер клиента

Готовая сборка для https://corexengineering.kz/: [скачать corex-site.zip](https://github.com/jandos1980-ui/corexengineering.kz/releases/latest/download/corex-site.zip).

Скачивайте файл **corex-site.zip** из Assets релиза. Автоматический **Source code (zip)** содержит демонстрационную версию с noindex и не предназначен для запуска основного домена без подготовки.

В клиентском архиве: папка `site/` для web root, `INSTALL.md`, версия исходников и контрольные суммы. [Инструкция установки](release/INSTALL.md). Сборка архива разработчиком: `python release/build_release.py --output ../output/client-release/corex-site.zip` (Python 3.9+). На сервере клиента Python не требуется.

## Публикация клиентского сайта

GitHub Pages автоматически публикует ветку `main`, каталог `/`:
https://jandos1980-ui.github.io/corexengineering.kz/

Запрос на push изменений сайта включает их публикацию для клиента:

1. Проверить изменения и создать коммит.
2. Отправить коммит в `origin/main` обычным push, без force.
3. Дождаться успешного GitHub Actions `pages build and deployment` для этого коммита.
4. Проверить изменения на публичном сайте и сообщить результат.

Push только в другую ветку не обновляет клиентский сайт. Если публикация завершилась ошибкой, изменения в GitHub ещё не означают обновления сайта.

Этот checkout содержит статический сайт с HTML в корне. Для его публикации не требуются npm, React или локальная сборка.

## Редактор типографии

Редактор вынесен в отдельный репозиторий: https://github.com/jandos1980-ui/corex-typography-editor.
Он запускается локально с папкой сайта через `python serve.py --site ПУТЬ_К_САЙТУ`. В архив клиентского сайта редактор не входит.
