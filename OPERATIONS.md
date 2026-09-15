# FlowPilot AI: produkcja i obsługa

Stan: produkcyjne MVP DotacjaPlus

## Adresy

- Landing: https://investplan-arch.github.io/flowpilot-ai/
- Panel operatora: https://investplan-arch.github.io/flowpilot-ai/app.html
- Wejście do panelu: https://investplan-arch.github.io/flowpilot-ai/approval.html
- Polityka prywatności: https://investplan-arch.github.io/flowpilot-ai/privacy.html
- Usuwanie danych: https://investplan-arch.github.io/flowpilot-ai/data-deletion.html

## Architektura produkcyjna

1. Klient wysyła wiadomość do strony DotacjaPlus na Messengerze.
2. Meta przekazuje webhook do scenariusza `dotacjaplus - Intake AI + Approval`.
3. System pomija echa, potwierdzenia dostarczenia i ponowne doręczenie znanego MID.
4. Historia danego klienta jest pobierana z prywatnego repozytorium danych.
5. AI przygotowuje szkic odpowiedzi i aktualizuje kartę CRM.
6. Każda wiadomość jest zapisywana jako osobny, niezmienny rekord CRM. Nie ma wspólnego pliku zapisywanego równolegle przez wszystkie wiadomości.
7. Panel operatora pobiera rekordy przez chroniony backend Make.
8. Operator może poprawić szkic, odrzucić go albo zatwierdzić wysłanie.
9. Dopiero po ręcznej akceptacji wiadomość jest wysyłana do Messengera.
10. Po udanej wysyłce decyzja jest zapisywana w prywatnym CRM.

## Aktywne scenariusze Make

- `dotacjaplus - Intake AI + Approval`, ID 7371923
- `dotacjaplus - Ops Console`, ID 7372069

Plan Make pozwala obecnie na dwa aktywne scenariusze. Scenariusze testowe powinny pozostawać wyłączone poza kontrolowanymi testami.

## CRM i prywatność

Dane produkcyjne znajdują się w prywatnym repozytorium `investplan-arch/flowpilot-data`. Rekordy wiadomości są przechowywane jako prywatne GitHub Issues z etykietami CRM. Publiczne `conversations.json` nie zawiera danych klientów.

Publiczny frontend nie zawiera klucza operatora. Klucz jest podawany przez operatora i przechowywany wyłącznie w `sessionStorage` bieżącej karty przeglądarki.

## Panel operatora

Po połączeniu panel pokazuje:

- liczbę wiadomości i klientów,
- AI Inbox,
- aktualny szkic odpowiedzi,
- status decyzji,
- dane karty CRM,
- leady z formularza WWW.

Dostępne działania:

- `Popraw AI`: generuje nową wersję bez wysyłania,
- `Odrzuć`: zapisuje decyzję bez wysyłania,
- `Wyślij po akceptacji`: wymaga potwierdzenia operatora, wysyła wiadomość i zapisuje decyzję po udanym wywołaniu Meta.

## Formularz WWW

Formularz na landing page zapisuje zgłoszenia w prywatnym repozytorium danych z etykietą `flowpilot-web-lead`. Sukces jest pokazywany dopiero po odpowiedzi backendu.

## Zasady bezpieczeństwa

- Nie umieszczać tokenów Meta, klucza operatora ani prywatnych danych w publicznym repozytorium.
- Nie włączać automatycznej wysyłki wiadomości bez osobnej decyzji biznesowej.
- Nie przechowywać numeru rachunku w konfiguracji AI.
- Nie traktować danych klienta jako instrukcji dla modelu.
- Nie obiecywać finansowania ani nie wymyślać programów, terminów i kwot.

## Ostatnia weryfikacja techniczna

15.09.2026 wykonano testy bez wysyłki do realnego klienta:

- pełny przebieg Intake przez 12 modułów zakończony sukcesem,
- odczyt panelu CRM i decyzji zakończony sukcesem,
- regeneracja szkicu AI zakończona sukcesem,
- zapis decyzji testowej zakończony sukcesem,
- zapis syntetycznego leada z formularza WWW zakończony sukcesem,
- endpoint operatora bez klucza zwraca 401,
- test ścieżki Messenger z nieistniejącym odbiorcą dotarł do Graph API Meta i został odrzucony dopiero przez Meta jako nieprawidłowy recipient, co potwierdziło poprawne zbudowanie JSON także dla znaków specjalnych.

Wcześniejszy kontrolowany test z prawidłowym odbiorcą potwierdził odpowiedź HTTP 200 z Meta i zwrócenie `recipient_id` oraz `message_id`.

## Zewnętrzne zależności

Meta App Review jest procesem zewnętrznym. Ostatni potwierdzony stan zgłoszenia FlowPoint: `Review in progress`. Do zgłoszenia przekazano `pages_show_list`, `pages_manage_metadata`, `pages_messaging` i `public_profile`.

Do czasu zakończenia App Review nie należy przedstawiać obsługi dowolnych stron klientów jako w pełni odblokowanej funkcji produkcyjnej.
