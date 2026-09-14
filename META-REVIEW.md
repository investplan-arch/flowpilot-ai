# FlowPoint: materiały do App Review
Stan: przygotowanie. Nie jest to potwierdzenie uzyskania uprawnień ani weryfikacji.

## Ustawienia
Kategoria: Boty Messengera dla firm.
Polityka: https://investplan-arch.github.io/flowpilot-ai/privacy.html
Usuwanie danych: https://investplan-arch.github.io/flowpilot-ai/data-deletion.html
Dane firmy: https://investplan-arch.github.io/flowpilot-ai/company.html

## Opis aplikacji (do skopiowania)
FlowPoint is the Meta application used by FlowPilot AI to assist businesses with inbound Messenger conversations. For the DotacjaPlus workflow, an incoming message is processed in Make and OpenAI generates a draft reply. A human operator reviews the draft and can approve it, request a revision or take over the conversation. The reply is sent through Messenger after the operator approves it. The current production onboarding for additional businesses remains subject to Meta verification and permission approval.

## pages_messaging (do skopiowania)
We use pages_messaging to receive inbound messages sent to a connected Facebook Page and to send a reply approved by the Page's operator. The message text is processed by OpenAI through Make to produce a draft. In the DotacjaPlus workflow, the operator reviews the draft before sending. This enables the business to respond to customer enquiries while retaining human control over the reply. Our review demonstration will show the original incoming message, the generated draft, the operator's approval and the resulting reply in Messenger.

## pages_manage_metadata (sprawdź demonstrację subskrypcji)
We use pages_manage_metadata to subscribe a connected Page to the webhook events needed to receive customer messages. These events start the inbound conversation workflow. The permission supports delivery of Page messaging events to the application's configured webhook.

## pages_show_list
Do not claim an implemented self-service Page picker unless it can actually be demonstrated. If the permission is needed in the current Meta authorization flow, show that exact flow and explain how an administrator selects the Page to connect.

## business_management
Do not claim a Business Manager API feature that the application does not implement. Confirm whether this permission is required by the actual onboarding use case. If it is optional and unused, exclude it from the review request. Do not remove required permissions blindly.

## public_profile
Describe only the basic account identification actually used by the Meta login flow. Do not request additional profile fields merely for a better looking demo.

## Instrukcja demonstracji
1. Podłączona strona testowa: DotacjaPlus. Potwierdź dostęp recenzenta zgodnie z aktualnymi instrukcjami Meta.
2. Wyślij nową wiadomość testową do strony. Nie używaj prawdziwych danych klienta.
3. Pokaż odbiór zdarzenia i szkic w panelu operatora.
4. Pokaż akcję POPRAW i nową wersję, jeżeli demonstrujesz tę funkcję.
5. Kliknij WYŚLIJ dla właściwej rozmowy.
6. Pokaż odpowiedź w Messengerze i identyfikator udanej wysyłki.
7. Pokaż ścieżkę PRZEJMUJĘ, opisując wyłącznie zachowanie faktycznie potwierdzone testem.
Nagranie musi przedstawiać prawdziwe działanie. Nie zastępuj go animacją.

## Dane dla recenzenta
Wprowadź prywatnie w panelu Meta: działający adres panelu testowego, sposób uzyskania dostępu i instrukcje testowe. Nie publikuj tutaj haseł, tokenów, PSID klientów ani adresów webhooków służących do wykonywania akcji.
Brak zatwierdzonego sposobu dostępu recenzenta pozostaje blokadą wysłania kompletnego zgłoszenia.

## Data handling: informacje znane
Dostawcy w aktualnym przepływie: Meta, Make, OpenAI i GitHub.
Przetwarzane informacje: treść wiadomości, PSID, identyfikatory zdarzeń, szkic oraz dane obsługi.
Dane panelu są przechowywane w repozytorium prywatnym; repozytorium strony jest publiczne.
Przed odpowiedzią na szczegółowe pytania należy sprawdzić faktyczne umowy z dostawcami, transfery, historię Make i GitHub, kontrolę dostępu panelu oraz procedurę usuwania.
Nie deklaruj automatycznego czyszczenia, wyłącznego hostingu w UE, szyfrowania end-to-end ani izolacji wielu klientów, jeśli nie zostało to potwierdzone.

## Otwarte bramki
- Zakończenie weryfikacji firmy oraz wymaganej access verification.
- Zatwierdzenie App Review i publikacja aplikacji.
- Weryfikacja publicznej dostępności stron polityki i usuwania danych.
- Potwierdzenie aktualnych danych rejestrowych i obsługi kontaktowego adresu e-mail.
- Wymiana ujawnionego Page Access Token i potwierdzenie unieważnienia starego.
- Pełny test po wymianie tokenu, w tym konto bez roli w aplikacji.
- Dostęp recenzenta i rzeczywiste nagranie demonstracyjne.
