import { useState } from "react";

type Language = "fr" | "en" | "pt";

const faqCopy = {
  fr: {
    title: "Questions frequentes",
    intro:
      "Retrouvez les reponses essentielles sur les commandes, la location, les cartes cadeaux, le retrait au guichet et l'espace client.",
    contact: "Contacter AK Fashion Plus",
    asideTitle: "Besoin d'une aide precise ?",
    asideText: "Commande, location, carte cadeau ou retrait en Angola.",
    asideButton: "Ouvrir le contact",
    questions: [
      [
        "Comment commander sur AK Fashion Plus ?",
        "Choisissez vos articles dans la boutique, ajoutez-les au panier, renseignez les informations du beneficiaire puis validez le paiement.",
      ],
      [
        "Puis-je acheter et faire retirer au guichet en Angola ?",
        "Oui. Le parcours prevoit la livraison ou le retrait au guichet selon l'adresse, la ville et la disponibilite du service.",
      ],
      [
        "Comment fonctionne la location ?",
        "Les articles disponibles en location affichent un prix journalier. Vous selectionnez les dates, payez la reservation puis l'article est prepare pour livraison ou retrait.",
      ],
      [
        "Les articles seconde main sont-ils controles ?",
        "Oui. Les articles revendus passent par une verification avant d'etre proposes dans la section seconde main.",
      ],
      [
        "Comment utiliser une carte cadeau ?",
        "La carte cadeau peut etre utilisee au moment du paiement si elle est active et si son solde couvre tout ou partie de l'achat.",
      ],
      [
        "Puis-je payer une partie avec une carte cadeau et le reste autrement ?",
        "Oui, si le solde ne couvre pas tout le montant, le reste peut etre complete avec un autre moyen de paiement disponible.",
      ],
      [
        "Comment suivre ma commande ?",
        "Apres connexion, l'espace client permet de consulter les commandes, locations, favoris et cartes cadeaux rattaches au compte.",
      ],
      [
        "Comment contacter le support ?",
        "La page Contact permet d'envoyer une demande a l'equipe AK Fashion Plus pour une commande, une location, une revente ou une question generale.",
      ],
    ],
  },
  en: {
    title: "Frequently asked questions",
    intro:
      "Find the key answers about orders, rentals, gift cards, counter pickup and your customer account.",
    contact: "Contact AK Fashion Plus",
    asideTitle: "Need specific help?",
    asideText: "Order, rental, gift card or pickup in Angola.",
    asideButton: "Open contact",
    questions: [
      [
        "How do I order on AK Fashion Plus?",
        "Choose your items in the shop, add them to your cart, enter the beneficiary details and confirm payment.",
      ],
      [
        "Can I buy and collect at the Angola counter?",
        "Yes. The flow supports delivery or counter pickup depending on address, city and service availability.",
      ],
      [
        "How does rental work?",
        "Rental items display a daily price. Select the dates, pay the reservation and the item is prepared for delivery or pickup.",
      ],
      [
        "Are second hand items checked?",
        "Yes. Resale items are reviewed before being listed in the second hand section.",
      ],
      [
        "How do I use a gift card?",
        "A gift card can be used during checkout if it is active and its balance covers all or part of the purchase.",
      ],
      [
        "Can I pay partly with a gift card and the rest another way?",
        "Yes. If the balance is not enough, the remaining amount can be paid with another available payment method.",
      ],
      [
        "How do I track my order?",
        "After signing in, your account shows orders, rentals, favorites and gift cards linked to your profile.",
      ],
      [
        "How do I contact support?",
        "The Contact page lets you send a request to AK Fashion Plus for an order, rental, resale or general question.",
      ],
    ],
  },
  pt: {
    title: "Perguntas frequentes",
    intro:
      "Encontre respostas sobre encomendas, aluguer, cartoes presente, levantamento no balcao e conta cliente.",
    contact: "Contactar AK Fashion Plus",
    asideTitle: "Precisa de ajuda especifica?",
    asideText: "Encomenda, aluguer, cartao presente ou levantamento em Angola.",
    asideButton: "Abrir contacto",
    questions: [
      [
        "Como encomendar na AK Fashion Plus?",
        "Escolha os artigos na loja, adicione ao carrinho, indique os dados do beneficiario e confirme o pagamento.",
      ],
      [
        "Posso comprar e levantar no balcao em Angola?",
        "Sim. O percurso permite entrega ou levantamento no balcao conforme endereco, cidade e disponibilidade.",
      ],
      [
        "Como funciona o aluguer?",
        "Os artigos para aluguer mostram preco diario. Escolha as datas, pague a reserva e o artigo sera preparado.",
      ],
      [
        "Os artigos de segunda mao sao verificados?",
        "Sim. Os artigos revendidos sao verificados antes de aparecerem na seccao segunda mao.",
      ],
      [
        "Como usar um cartao presente?",
        "O cartao presente pode ser usado no pagamento se estiver ativo e tiver saldo disponivel.",
      ],
      [
        "Posso pagar parte com cartao presente e o resto de outra forma?",
        "Sim. Se o saldo nao cobrir tudo, pode completar com outro metodo de pagamento disponivel.",
      ],
      [
        "Como acompanhar a minha encomenda?",
        "Depois de iniciar sessao, a conta mostra encomendas, alugueres, favoritos e cartoes presente.",
      ],
      [
        "Como contactar o suporte?",
        "A pagina Contacto permite enviar um pedido para encomenda, aluguer, revenda ou questao geral.",
      ],
    ],
  },
};

export default function FaqPage({
  go,
  language,
}: {
  go: (page: string) => void;
  language: Language;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const copy = faqCopy[language];

  return (
    <section className="info-page faq-page">
      <header className="info-hero">
        <p className="eyebrow">FAQ</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <button onClick={() => go("contact")} type="button">
          {copy.contact}
        </button>
      </header>

      <section className="faq-layout">
        <aside>
          <strong>{copy.asideTitle}</strong>
          <span>{copy.asideText}</span>
          <button onClick={() => go("contact")} type="button">
            {copy.asideButton}
          </button>
        </aside>
        <div className="faq-list">
          {copy.questions.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <article className={isOpen ? "open" : ""} key={question}>
                <button
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  type="button"
                >
                  <span>{question}</span>
                  <i aria-hidden="true" />
                </button>
                <div>
                  <p>{answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
