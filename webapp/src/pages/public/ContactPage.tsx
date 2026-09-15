type Language = "fr" | "en" | "pt";

const contactCopy = {
  fr: {
    title: "Parlez avec AK Fashion Plus",
    intro:
      "Une question sur une commande, une location, une carte cadeau, une revente ou un retrait au guichet ? Envoyez votre demande a l'equipe.",
    name: "Nom complet",
    namePlaceholder: "Votre nom",
    email: "Email",
    subject: "Sujet",
    message: "Message",
    messagePlaceholder: "Decrivez votre demande",
    submit: "Envoyer la demande",
    subjects: [
      "Commande",
      "Location",
      "Carte cadeau",
      "Revente",
      "Support general",
    ],
    service: "Service client",
    serviceText: "Reponse selon les horaires du service client.",
    counter: "Guichet Angola",
    counterTitle: "Retrait & verification",
    counterText: "Suivi des commandes, locations et articles revendus.",
    before: "Avant de nous ecrire",
    faqTitle: "Consultez la FAQ",
    faqText: "Les reponses principales sont deja regroupees.",
    faqButton: "Voir la FAQ",
  },
  en: {
    title: "Talk to AK Fashion Plus",
    intro:
      "Questions about an order, rental, gift card, resale or counter pickup? Send your request to the team.",
    name: "Full name",
    namePlaceholder: "Your name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    messagePlaceholder: "Describe your request",
    submit: "Send request",
    subjects: ["Order", "Rental", "Gift card", "Resale", "General support"],
    service: "Customer care",
    serviceText: "Reply according to customer service hours.",
    counter: "Angola counter",
    counterTitle: "Pickup & verification",
    counterText: "Order, rental and resale item follow-up.",
    before: "Before writing",
    faqTitle: "Read the FAQ",
    faqText: "The main answers are already grouped there.",
    faqButton: "View FAQ",
  },
  pt: {
    title: "Fale com AK Fashion Plus",
    intro:
      "Tem uma pergunta sobre encomenda, aluguer, cartao presente, revenda ou levantamento no balcao? Envie o pedido a equipa.",
    name: "Nome completo",
    namePlaceholder: "O seu nome",
    email: "Email",
    subject: "Assunto",
    message: "Mensagem",
    messagePlaceholder: "Descreva o seu pedido",
    submit: "Enviar pedido",
    subjects: [
      "Encomenda",
      "Aluguer",
      "Cartao presente",
      "Revenda",
      "Suporte geral",
    ],
    service: "Servico cliente",
    serviceText: "Resposta conforme horario do servico cliente.",
    counter: "Balcao Angola",
    counterTitle: "Levantamento & verificacao",
    counterText: "Seguimento de encomendas, alugueres e artigos revendidos.",
    before: "Antes de escrever",
    faqTitle: "Consulte a FAQ",
    faqText: "As principais respostas ja estao reunidas.",
    faqButton: "Ver FAQ",
  },
};

export default function ContactPage({
  go,
  language,
}: {
  go: (page: string) => void;
  language: Language;
}) {
  const copy = contactCopy[language];

  return (
    <section className="info-page contact-page">
      <header className="info-hero contact-hero">
        <p className="eyebrow">Contact</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>

      <section className="contact-layout">
        <form
          className="contact-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div>
            <label htmlFor="contact-name">{copy.name}</label>
            <input id="contact-name" placeholder={copy.namePlaceholder} />
          </div>
          <div>
            <label htmlFor="contact-email">{copy.email}</label>
            <input id="contact-email" placeholder="exemple@email.com" />
          </div>
          <div>
            <label htmlFor="contact-subject">{copy.subject}</label>
            <select id="contact-subject" defaultValue={copy.subjects[0]}>
              {copy.subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contact-message">{copy.message}</label>
            <textarea
              id="contact-message"
              placeholder={copy.messagePlaceholder}
              rows={6}
            />
          </div>
          <button type="submit">{copy.submit}</button>
        </form>

        <aside className="contact-panel">
          <article>
            <span>{copy.service}</span>
            <strong>support@akfashionplus.com</strong>
            <small>{copy.serviceText}</small>
          </article>
          <article>
            <span>{copy.counter}</span>
            <strong>{copy.counterTitle}</strong>
            <small>{copy.counterText}</small>
          </article>
          <article>
            <span>{copy.before}</span>
            <strong>{copy.faqTitle}</strong>
            <small>{copy.faqText}</small>
            <button onClick={() => go("faq")} type="button">
              {copy.faqButton}
            </button>
          </article>
        </aside>
      </section>
    </section>
  );
}
