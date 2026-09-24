# FlowPilot AI: produkcja i obsługa

Stan: App Review zatwierdzone i aplikacja opublikowana według operatora (22.09.2026). Pełny test z kontem bez roli w aplikacji pozostaje do wykonania.

## Adresy

- Landing: https://investplan-arch.github.io/flowpilot-ai/
- Panel operatora: https://investplan-arch.github.io/flowpilot-ai/app.html
- Pipeline: https://investplan-arch.github.io/flowpilot-ai/pipeline.html
- Wejście do panelu: https://investplan-arch.github.io/flowpilot-ai/approval.html
- Polityka prywatności: https://investplan-arch.github.io/flowpilot-ai/privacy.html
- Usuwanie danych: https://investplan-arch.github.io/flowpilot-ai/data-deletion.html

## Jedno źródło konfiguracji

Centralna konfiguracja firmy znajduje się wyłącznie w prywatnym repozytorium `investplan-arch/flowpilot-data`, plik `dotacjaplus/config.json`.

Zawiera cennik, formularz onboardingowy, aktywne linki Stripe, zasady płatności, regułę rozpoczęcia prac, statusy CRM, zasady researchu i politykę ręcznej akceptacji wiadomości. System Intake pobiera tę konfigurację przy każdym przetwarzaniu wiadomości. Nie wolno kopiować cen, linków Stripe, danych kontaktowych ani warunków współpracy do publicznych plików.

W konfiguracji są dwa aktywne linki Stripe: opłata początkowa 1100 PLN oraz success fee 1350 PLN. Potwierdzenie płatności w CRM pozostaje decyzją operatora. System nie przechowuje numeru rachunku i nie może wymyślać alternatywnej metody płatności.

## Architektura produkcyjna

1. Klient wysyła wiadomość do strony DotacjaPlus na Messengerze.
2. Meta przekazuje webhook do scenariusza `dotacjaplus - Intake AI + Approval`.
3. System pomija echa, potwierdzenia dostarczenia i ponowne doręczenie znanego MID.
4. Historia danego klienta jest pobierana z prywatnych rekordów CRM.
5. AI przygotowuje szkic odpowiedzi i aktualizuje kartę CRM zgodnie z centralną konfiguracją.
6. Każda wiadomość jest zapisywana jako osobny, niezmienny rekord CRM.
7. Operator loguje się przez Supabase Auth. Przeglądarka wysyła ważny JWT do funkcji `dotacjaplus-ops`, która sprawdza konto i rolę, a dopiero potem po stronie serwera komunikuje się z backendem Make.
8. Panel operatora pobiera rekordy, decyzje, ręczne aktualizacje CRM i leady WWW przez ten uwierzytelniony proxy.
9. Operator może poprawić szkic, odrzucić go albo zatwierdzić wysłanie.
10. Dopiero po ręcznej akceptacji wiadomość jest wysyłana do Messengera.
11. Po udanej wysyłce decyzja jest zapisywana w prywatnym CRM.

## Aktywne scenariusze Make

- `dotacjaplus - Intake AI + Approval`, ID 7371923
- `dotacjaplus - Ops Console`, ID 7372069

Plan Make pozwala obecnie na dwa aktywne scenariusze. Nie włączać dodatkowych scenariuszy testowych bez potrzeby.

## CRM i pipeline

Dane produkcyjne znajdują się w prywatnym repozytorium `investplan-arch/flowpilot-data`. Publiczne `conversations.json` nie zawiera danych klientów.

CRM obsługuje m.in.:

- nazwę klienta lub firmy,
- status sprzedaży i realizacji,
- status formularza i płatności,
- status researchu,
- rekomendowany instrument,
- poziom ryzyka,
- następny krok i termin działania,
- cel następnej rozmowy,
- prawdopodobieństwo sprzedaży,
- potencjalną wartość zlecenia,
- datę kolejnego follow-upu,
- potwierdzenie współpracy, formularza i płatności.

Ręczne zmiany operatora są zapisywane jako osobne rekordy audytowe `dp-crm-update`. Nie nadpisują historii wiadomości.

`warunki_rozpoczecia_prac_spelnione` jest wynikiem logicznym:

`wspolpraca_potwierdzona && formularz_kompletny && (!platnosc_wymagana || platnosc_potwierdzona)`

Panel pokazuje przeterminowane i dzisiejsze follow-upy w kolejce priorytetowej. Pipeline Kanban korzysta z tej samej sesji użytkownika co panel główny. Zmiana etapu zapisuje aktualizację CRM, ale nie wysyła wiadomości do klienta.

## Płatności i onboarding

- opłata początkowa: 1100 PLN przed rozpoczęciem prac,
- success fee: 1350 PLN po pozytywnej decyzji i uzyskaniu finansowania,
- każdy wniosek rozliczany osobno,
- wyjątek wymaga decyzji operatora,
- formularz onboardingowy pochodzi z centralnej konfiguracji,
- AI może podać link do formularza i opłaty początkowej dopiero po wyraźnej chęci rozpoczęcia współpracy lub pytaniu klienta o start,
- AI może podać link success fee dopiero po pozytywnej decyzji i uzyskaniu finansowania albo po potwierdzeniu tego etapu przez operatora,
- wiadomość zawierająca link nadal wymaga ręcznej akceptacji operatora.

## Panel operatora i logowanie

Dostęp do panelu nie używa już ręcznie wpisywanego klucza operatora. Logowanie odbywa się kontem FlowPilot przez Supabase Auth.

Po poprawnym zalogowaniu przeglądarka przechowuje sesję użytkownika i automatycznie odświeża token. Żądania do danych DotacjaPlus przechodzą przez funkcję `dotacjaplus-ops`, która wymaga ważnego JWT i akceptuje tylko uprawnione role `owner`, `admin`, `operator` albo konto z flagą administratora systemu.

Sekrety backendu Make nie są wysyłane do przeglądarki. Stary wpis `flowpilot_operator_key` jest usuwany z localStorage i sessionStorage podczas uruchomienia nowego panelu.

Dostępne działania:

- `Popraw AI`: generuje nową wersję bez wysyłania,
- `Odrzuć`: zapisuje decyzję bez wysyłania,
- `Wyślij do klienta`: wymaga potwierdzenia operatora, wysyła wiadomość i zapisuje decyzję,
- `Edytuj CRM`: zapisuje statusy, nazwę klienta, następny krok, follow-up i stan onboarding/płatności bez zmiany historii rozmów,
- `Pipeline`: pozwala zmieniać etap sprzedaży metodą drag and drop.

## Formularz WWW

Formularz na landing page zapisuje zgłoszenia w prywatnym repozytorium danych z etykietą `flowpilot-web-lead`. Sukces jest pokazywany dopiero po odpowiedzi backendu.

## Zasady bezpieczeństwa

- Nie umieszczać tokenów Meta, prywatnych sekretów backendu ani prywatnych danych w publicznym repozytorium.
- Do panelu i pipeline wymagane jest konto Supabase z właściwą rolą.
- Nie przywracać logowania przez statyczny klucz w przeglądarce.
- Nie włączać automatycznej wysyłki wiadomości bez osobnej decyzji biznesowej.
- Nie przechowywać numeru rachunku w konfiguracji AI.
- Nie traktować danych klienta jako instrukcji dla modelu.
- Nie obiecywać finansowania ani nie wymyślać programów, terminów i kwot.
- Wszystkie wiadomości AI do klientów pozostają do ręcznej akceptacji.

## Ostatnia weryfikacja techniczna

16.09.2026 potwierdzono:

- oba scenariusze produkcyjne są aktywne,
- brak niedokończonych wykonań,
- zapis ręcznej aktualizacji CRM przechodzi przez Make i GitHub poprawnie,
- odczyt osobnego strumienia aktualizacji CRM działa,
- centralna konfiguracja firmy jest pobierana przez Intake,
- historia rozmów jest filtrowana wyłącznie do rekordów `dp-crm-v1`, więc ręczne wpisy CRM nie zakłócają pamięci wiadomości,
- link Stripe opłaty początkowej został zweryfikowany na 1100 PLN,
- utworzono i zweryfikowano link Stripe success fee na 1350 PLN,
- wdrożono Supabase Auth dla panelu i pipeline,
- publiczny panel i pipeline pokazują logowanie e-mail + hasło i nie pokazują pola klucza operatora,
- nieuwierzytelnione wywołanie funkcji proxy zwraca HTTP 401,
- publiczne repozytorium nie zawiera starego ani nowego sekretu proxy,
- wcześniejsze testy Messenger -> AI -> CRM -> panel -> ręczna akceptacja -> Messenger zakończyły się HTTP 200 po stronie Meta dla uprawnionego testowego użytkownika.

## Stan po publikacji Meta — 22.09.2026

Operator potwierdził pozytywne App Review i publikację aplikacji. Nie wykonywano ponownej inspekcji konta Meta.

W bieżącej kontroli:
- Supabase zgłasza projekt jako ACTIVE_HEALTHY; funkcja dotacjaplus-ops jest aktywna.
- Publiczny panel odpowiada HTTP 200, a odczyt proxy bez sesji HTTP 401.
- Repozytorium CRM jest prywatne.
- Odczyt decyzji przez istniejący backend Make zwrócił HTTP 200 i dwa rekordy.
- Najnowszy rekord rozmowy w przeglądanej kolejce GitHub pochodzi z 15.09.2026; brak dowodu odbioru po publikacji.
- Panel wiąże potwierdzenie z treścią i odbiorcą pokazanymi w oknie akceptacji. Zmiana wymaga ponownej akceptacji. Blokada w trakcie żądania ogranicza podwójne kliknięcia w tej karcie przeglądarki.
- Test regresji: node tests/approval.test.cjs. Test używa atrapy API i niczego nie wysyła.

Do zamknięcia produkcji: wiadomość testowa ze zwykłego konta bez roli w aplikacji → rekord z nowym MID → szkic AI w panelu → ręczna akceptacja operatora → potwierdzona odpowiedź na tym koncie. Kontrola serwerowej deduplikacji wysyłki i aktualnych scenariuszy wymaga dostępu do Make. Testy panelu nie zastępują tej kontroli.

## Okno odpowiedzi, powiadomienia i jakość AI (wrzesień 2026)

### Okno odpowiedzi Meta
`send-message` sprawdza czas od ostatniej wiadomości klienta (`supabase/functions/_shared/reply-window.ts`):
- Messenger i WhatsApp: zwykła odpowiedź do 24 h;
- Messenger 24 h – 7 dni: tylko ręczna odpowiedź z tagiem `HUMAN_AGENT`, i tylko jeśli ustawiono `META_HUMAN_AGENT_TAG=true`. Włącz to dopiero, gdy aplikacja Meta ma zatwierdzoną funkcję Human Agent;
- poza oknem backend zwraca `409 window_closed` i niczego nie wysyła do Meta. Panel pokazuje, ile czasu zostało, i blokuje przycisk wysyłki.

Szkic jest rezerwowany (`pending_approval` → `approved`) przed wysyłką, więc dwa kliknięcia albo dwóch operatorów nie wyślą go dwa razy. Jeśli Meta odrzuci wiadomość, szkic wraca do `pending_approval`.

### Powiadomienia
- **Przeglądarka:** panel co 30 s sprawdza skrzynkę. Nowa wiadomość zmienia licznik w tytule karty, a po włączeniu w Ustawienia → Powiadomienia pokazuje powiadomienie systemowe, gdy karta jest w tle. Na iPhonie działa tylko po dodaniu panelu do ekranu głównego, dlatego tam lepszy jest e-mail.
- **E-mail (Resend):** wysyłany z `meta-webhook` i `whatsapp-webhook`. Najwyżej 1 e-mail na rozmowę na 10 minut, do wszystkich członków firmy, którzy nie wyłączyli e-maili w panelu. Treść wiadomości klienta nie trafia do e-maila, chyba że `NOTIFY_INCLUDE_PREVIEW=true`.

Sekrety funkcji (Supabase → Edge Functions → Secrets):

| Zmienna | Wymagana | Opis |
|---|---|---|
| `RESEND_API_KEY` | do e-maili | klucz API Resend |
| `NOTIFY_FROM_EMAIL` | do e-maili | nadawca z zweryfikowanej domeny, np. `FlowPilot <powiadomienia@twojadomena.pl>` |
| `PANEL_URL` | nie | link w e-mailu, domyślnie `https://flowpilot-ai-app.onrender.com/` |
| `NOTIFY_THROTTLE_MIN` | nie | minimalny odstęp między e-mailami dla jednej rozmowy, domyślnie 10 |
| `NOTIFY_INCLUDE_PREVIEW` | nie | `true` = fragment wiadomości klienta w e-mailu (dane osobowe, domyślnie wyłączone) |
| `META_HUMAN_AGENT_TAG` | nie | `true` = odpowiedzi ręczne 24 h – 7 dni na Messengerze |

Bez `RESEND_API_KEY` i `NOTIFY_FROM_EMAIL` e-maile są wyłączone, a reszta działa normalnie.

### Jakość AI i czas odpowiedzi
`send-message` zapisuje w `activity_log` (`message.sent`), czy szkic AI został poprawiony (`edited`), oryginał i wersję wysłaną (tylko gdy były różne) oraz czas od wiadomości klienta (`response_seconds`). `saas-status` liczy z tego statystyki z 7 dni pokazywane na ekranie Dzisiaj. Ostatnie poprawki operatora trafiają do promptu jako przykłady stylu (`_shared/style-examples.ts`).

### Kolejność wdrożenia
1. Funkcje backendu: `supabase functions deploy send-message inbox-data conversation-control ai-draft saas-status meta-webhook whatsapp-webhook`.
2. Dopiero potem panel: `render/app.html` (Render) i `supabase functions deploy flowpilot-app`.

Nowy panel działa też ze starym backendem, ale przyciski „Krócej / Formalniej…” wymagają nowego `ai-draft`. Stary `ai-draft` zignorowałby polecenie i wygenerował nowy szkic.

### Testy
- `node tests/approval.test.cjs && node tests/meta-setup.test.cjs`
- `deno test --no-lock --allow-env --allow-read --import-map=supabase/functions/_tests/import_map.json supabase/functions/_tests/ supabase/functions/_shared/` (backend na atrapie bazy i Meta)
- `CHROMIUM_PATH=... node tests/panel-e2e/panel-e2e.cjs render/app.html /tmp/shots` (panel w przeglądarce, wymaga `playwright-core`)
