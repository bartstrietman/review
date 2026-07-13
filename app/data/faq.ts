export interface FaqItem { q: string; a: string }

export const FAQ_DATA: Record<'nl' | 'en', FaqItem[]> = {
  nl: [
    { q: 'Is dit toegestaan volgens het beleid van Google?', a: 'ReviewUpgrade vraagt intern om feedback voordat iemand wordt uitgenodigd voor een publieke review. Je bepaalt zelf wie je uitnodigt, net als bij een persoonlijke follow-up. Veel gevestigde reputatie-tools werken op dezelfde manier. Belangrijk is dat je niemand verhindert die al actief naar een reviewpagina onderweg was.' },
    { q: 'Heb ik technische kennis nodig?', a: 'Nee. Je plakt één regel code op de pagina van je keuze, vergelijkbaar met het toevoegen van een Google Analytics-tag. Het werkt op WordPress, Shopify, Wix en aangepaste HTML-sites.' },
    { q: 'Wat is het verschil tussen de pop-up en het vaste blok?', a: 'De pop-up verschijnt automatisch na een paar seconden op de pagina, ideaal voor een bedankpagina. Het vaste blok staat permanent op een vaste plek, bijvoorbeeld onderin een contactpagina — rustiger en altijd zichtbaar.' },
    { q: 'Wat als de klant de pop-up wegklikt of geen smartphone heeft?', a: 'Geen enkel probleem. Wie wegklikt, heeft simpelweg geen beoordeling gegeven — dat is altijd zijn keuze. De widget grijpt nooit in als iemand niet wil meedoen. Klanten zonder smartphone hoeven niets te doen; de widget is volledig optioneel.' },
    { q: 'Hoe werkt de betaling en facturatie?', a: 'Na je proefperiode van 14 dagen wordt het abonnement automatisch maandelijks geïncasseerd via automatische incasso. Je ontvangt elke maand automatisch een factuur per e-mail voor je administratie. Er is geen jaarcontract — je zit gewoon maand op maand.' },
    { q: 'Hoe kan ik opzeggen?', a: 'Opzeggen doe je via een simpele mail naar opzeggen@reviewupgrade.nl. Geen formulieren, geen gedoe, geen opzegtermijn. Het abonnement stopt aan het einde van de lopende maand.' },
    { q: 'Kan ik op elk moment opzeggen?', a: 'Ja. Je kunt op elk moment per mail opzeggen. Je behoudt toegang tot het einde van de betaalde maand.' },
    { q: 'Wat gebeurt er na de proefperiode als ik niets doe?', a: 'Na 14 dagen starten we de eerste automatische incasso van €19,99 per maand. Je ontvangt hier een herinnering per e-mail vóórdat dit gebeurt. Wil je niet doorgaan, stuur dan vóór het einde van de proefperiode een mail naar opzeggen@reviewupgrade.nl.' },
    { q: 'Wat gebeurt er met de feedbackdata van mijn klanten?', a: 'Ingevulde klachten worden direct via e-mail doorgestuurd naar jou. Ze worden niet opgeslagen op onze servers en niet gedeeld met derden. De eindklant blijft anoniem als hij dat wil — de widget vraagt geen naam of e-mailadres.' },
    { q: 'Werkt dit voor meerdere vestigingen?', a: 'Op dit moment is elk abonnement gekoppeld aan één bedrijfsprofiel. Voor meerdere vestigingen kun je losse abonnementen afsluiten of contact opnemen voor een maatwerkoplossing.' },
  ],
  en: [
    { q: "Is this allowed under Google's policy?", a: "ReviewUpgrade asks for feedback internally before someone is invited to leave a public review. You decide who you invite, just like with a personal follow-up. Many established reputation tools work the same way. What matters is that you don't prevent anyone who was already actively heading to a review page." },
    { q: 'Do I need technical knowledge?', a: 'No. You paste one line of code on the page of your choice, similar to adding a Google Analytics tag. It works on WordPress, Shopify, Wix and custom HTML sites.' },
    { q: "What's the difference between the pop-up and the embedded block?", a: 'The pop-up appears automatically after a few seconds on the page, ideal for a thank-you page. The embedded block stays permanently in a fixed spot, for example at the bottom of a contact page — quieter and always visible.' },
    { q: "What if the customer closes the pop-up or doesn't have a smartphone?", a: "No problem at all. Whoever closes it simply hasn't given a rating — that's always their choice. The widget never intervenes if someone doesn't want to participate. Customers without a smartphone don't need to do anything; the widget is completely optional." },
    { q: 'How does payment and invoicing work?', a: "After your 14-day trial period, the subscription is automatically billed monthly via direct debit. You automatically receive an invoice by email every month for your records. There is no annual contract — you're simply month-to-month." },
    { q: 'How do I cancel?', a: 'Cancel by sending a simple email to cancel@reviewupgrade.nl. No forms, no hassle, no notice period. The subscription stops at the end of the current month.' },
    { q: 'Can I cancel at any time?', a: 'Yes. You can cancel at any time by email. You retain access until the end of the paid month.' },
    { q: "What happens after the trial if I don't do anything?", a: "After 14 days we start the first automatic payment of €19.99 per month. You'll receive a reminder by email before this happens. If you don't want to continue, send an email to cancel@reviewupgrade.nl before the end of the trial period." },
    { q: "What happens with my customers' feedback data?", a: 'Submitted complaints are forwarded directly to you via email. They are not stored on our servers and not shared with third parties. The end customer remains anonymous if they wish — the widget does not ask for a name or email address.' },
    { q: 'Does this work for multiple locations?', a: 'Currently each subscription is linked to one business profile. For multiple locations you can take out separate subscriptions or contact us for a custom solution.' },
  ],
}
