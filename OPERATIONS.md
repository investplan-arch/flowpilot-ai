# FlowPilot AI: produkcja i obsługa

Stan: produkcyjne MVP DotacjaPlus, oczekuje na odblokowanie pełnego ruchu Messenger przez Meta App Review.

## Adresy

- Landing: https://investplan-arch.github.io/flowpilot-ai/
- Panel operatora: https://investplan-arch.github.io/flowpilot-ai/app.html
- Wejście do panelu: https://investplan-arch.github.io/flowpilot-ai/approval.html
- Polityka prywatności: https://investplan-arch.github.io/flowpilot-ai/privacy.html
- Usuwanie danych: https://investplan-arch.github.io/flowpilot-ai/data-deletion.html

## Jedno źródło konfiguracji

Centralna konfiguracja firmy znajduje się wyłącznie w prywatnym repozytorium `investplan-arch/flowpilot-data`, plik `dotacjaplus/config.json`.

Zawiera m.in. cennik, formularz onboardingowy, zasady płatności, regułę rozpoczęcia prac, statusy CRM, zasady researchu i politykę ręcznej akceptacji wiadomości. System Intake pobiera tę konfigurację przy każdym przetwarzaniu wiadomości. Nie wolno kopiować cen, linku Stripe, danych kontaktowych ani warunków współpracy do publicznych plików.

Pole `payment.payment_link` pozostaje puste do czasu podania lub utworzenia zatwierdzonego linku Stripe. System nie może wymyślać linku ani numeru rachunku.

## Architektura produkcyjna

1. Klient wysyła wiadomość do strony DotacjaPlus na Messengerze.
2. Meta przekazuje webhook do scenariusza `dotacjaplus - Intake AI + Approval`.
3. System pomija echa, potwierdzenia dostarczenia i ponowne doręczenie znanego MID.
4. Historia danego klienta jest pobierana z prywatnych rekordów CRM.
5. AI przygotowuje szkic odpowiedzi i aktualizuje kartę CRM zgodnie z centralną konfiguracją.
6. Każda wiadomość jest zapisywana jako osobny, niezmienny rekord CRM.
7. Panel operatora pobiera rekordy, decyzje, ręczne aktualizacje CRM i leady WWW przez chroniony backend Make.
8. Operator może poprawić szkic, odrzucić go albo zatwierdzić wysłanie.
9. Dopiero po ręcznej akceptacji wiadomość jest wysyłana do Messengera.
10. Po udanej wysyłce decyzja jest zapisywana w prywatnym CRM.

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

Panel pokazuje przeterminowane i dzisiejsze follow-upy w kolejce priorytetowej.

## Panel operatora

Po połączeniu panel pokazuje Dashboard, AI Inbox, CRM i System. Dostępne są cztery warianty wyglądu. Klucz operatora może być zapamiętany lokalnie na urządzeniu operatora i nie jest publikowany w repozytorium.

Dostępne działania:

- `Popraw AI`: generuje nową wersję bez wysyłania,
- `Odrzuć`: zapisuje decyzję bez wysyłania,
- `Wyślij do klienta`: wymaga potwierdzenia operatora, wysyła wiadomość i zapisuje decyzję,
- `Edytuj CRM`: zapisuje statusy, nazwę klienta, następny krok, follow-up i stan onboarding/płatności bez zmiany historii rozmów.

## Formularz WWW

Formularz na landing page zapisuje zgłoszenia w prywatnym repozytorium danych z etykietą `flowpilot-web-lead`. Sukces jest pokazywany dopiero po odpowiedzi backendu.

## Zasady bezpieczeństwa

- Nie umieszczać tokenów Meta, klucza operatora ani prywatnych danych w publicznym repozytorium.
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
- testowe rekordy aktualizacji zostały usunięte z produkcyjnych etykiet,
- centralna konfiguracja firmy jest pobierana przez Intake,
- wcześniejsze testy Messenger -> AI -> CRM -> panel -> ręczna akceptacja -> Messenger zakończyły się HTTP 200 po stronie Meta dla uprawnionego testowego użytkownika.

## Zewnętrzny blocker Meta

Meta App Review pozostaje procesem zewnętrznym. Ostatni potwierdzony stan zgłoszenia FlowPoint: `Review in progress`.

Do zgłoszenia przekazano `pages_show_list`, `pages_manage_metadata`, `pages_messaging` i `public_profile`.

Do czasu przyznania właściwego dostępu i publikacji aplikacji zwykli użytkownicy strony mogą nie generować webhooków Messenger dla aplikacji. Jest to obecnie główny blocker pełnej produkcji dla wszystkich klientów.
