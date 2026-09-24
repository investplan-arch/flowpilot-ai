# FlowPilot AI — produkcja i obsługa

Stan na 24.09.2026. Bieżący produkt SaaS działa w Supabase i Render. Starszy panel DotacjaPlus na GitHub Pages oraz scenariusze Make są osobnym, historycznym przepływem i nie stanowią źródła danych tego panelu.

## Adresy i źródła

- Panel klienta: https://flowpilot-ai-app.onrender.com/
- Kod: `investplan-arch/flowpilot-ai`, gałąź `main`.
- Projekt Supabase: `jhkmemvsmnvyqfouzhqb`.
- Serwis Render: `srv-daio0rmq1p3s73css2q0`.
- Render pobiera stronę z `https://jhkmemvsmnvyqfouzhqb.supabase.co/functions/v1/flowpilot-app` w czasie budowy. W repozytorium źródłem HTML jest `render/app.html`, a jego opakowaniem funkcja `supabase/functions/flowpilot-app/index.ts`. Przy zmianie strony trzeba zachować zgodność tych plików, wdrożyć funkcję i ponownie zbudować Render.

## Aktualny przepływ

1. Klient wysyła wiadomość do połączonej strony Facebook.
2. Meta wywołuje `meta-webhook`; funkcja sprawdza podpis HMAC, identyfikator MID i powiązanie strony z organizacją, a następnie zapisuje kontakt, rozmowę i wiadomość w Supabase.
3. Gdy OpenAI jest dostępne, powstaje projekt odpowiedzi do ręcznej akceptacji. Przy braku środków wiadomość nadal trafia do skrzynki, ale nie powstaje nowy projekt AI.
4. Użytkownik loguje się przez Supabase Auth. Funkcje `saas-status`, `inbox-data`, `sales-pipeline` i pozostałe sprawdzają JWT oraz organizację.
5. `send-message` wysyła odpowiedź dopiero po kliknięciu użytkownika. Edytowany projekt jest odpowiedzią ręczną; tylko wysłanie identycznej treści oznacza projekt AI jako zaakceptowany.
6. Zmiany w pipeline i zadania follow-up są zapisywane w bazie danej organizacji.

Konto nowej firmy powstaje po jednorazowym zaproszeniu administratora lub po zakupie zarejestrowanym przez zweryfikowany webhook Stripe. Sam parametr `payment=success` w adresie strony nie uprawnia do założenia konta. Zaproszenie przypisane do adresu e-mail korzysta z `redeem-client-invite` i nie zależy od limitu wysyłki e-mail w Supabase Auth.

## Stan usług i ograniczenia

- Messenger: połączony dla jednej organizacji; odbiór wiadomości był aktywny 24.09.2026. Nie wysyłać testów do prawdziwych klientów bez ich zgody.
- AI: klucz jest zapisany, ale runtime zgłasza `quota_exhausted` / `credit_balance_exhausted`. Odbiór i ręczna odpowiedź pozostają dostępne. Po doładowaniu środków wykonać test nowego projektu AI i jego ręcznej akceptacji.
- Stripe: linki płatności i sekret webhooka są skonfigurowane, ale w chwili audytu nie było aktywnej subskrypcji ani nieprzypisanego zakupu. Nie uznawać płatności za przetestowaną bez rzeczywistego zdarzenia Stripe.
- WhatsApp: funkcje webhooka i konfiguracji istnieją, lecz numer nie jest połączony.
- W panelu są starsze projekty oczekujące na decyzję. Sprawdzić ich aktualność przed wysłaniem.

## Wdrożenie i kontrola

1. Sprawdzić `git diff --check`, testy w `tests/` oraz brak sekretów w zmianach.
2. Wdrożyć zmienione funkcje Supabase z dotychczasową wartością `verify_jwt` (`meta-webhook`: `false`, `send-message`: `true`, `flowpilot-app`: `false`).
3. Przy zmianie HTML uruchomić nowy deploy Render po aktualizacji `flowpilot-app` i porównać SHA-256 strony z `render/app.html`.
4. Sprawdzić odpowiedź strony, odmowę wywołania funkcji bez sesji, odbiór webhooka bez poprawnego podpisu oraz liczniki wiadomości i błędy funkcji.
5. Test po zalogowaniu obejmuje otwarcie skrzynki, filtrowanie, szczegóły rozmowy, ręczny szkic i ścieżkę wysyłki. Test wysyłki wykonywać tylko na własnej rozmowie testowej.

Nie umieszczać klucza OpenAI, tokenów Meta, sekretu Stripe ani danych klientów w repozytorium. Produkcyjne wiadomości pozostają pod kontrolą użytkownika.
