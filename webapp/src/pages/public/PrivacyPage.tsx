import { useState, type KeyboardEvent } from "react";
import { useLanguage } from "../../hooks/useLanguage";

const languages = ["pt", "fr", "en"] as const;
type PolicyLanguage = typeof languages[number];
const labels = { pt: "Português", fr: "Français", en: "English" };
const content = {
  pt: {
    title: "Política de privacidade", intro: "Site AK Fashion Plus e aplicação móvel KAVULA Fashion",
    updated: "Última atualização: 18 de novembro de 2026", summary: "Índice", contact: "Contacto e pedidos relativos aos seus dados", authority: "Apresentar uma reclamação à CNPD",
    sections: [
      ["Responsável pelo tratamento", "ALFREDO KAVULA-Fashion Plus Unipessoal Lda. é responsável pelos dados tratados no âmbito do site e da aplicação. Morada: Rua Manuel Fernandes Tomás N 1 1FTE, 2720-708 Amadora, Portugal. Contacto: support@akfashionplus.com."],
      ["Dados abrangidos", "Consoante os serviços utilizados, tratamos nome, email, telefone, endereço, país, idioma, fotografia de perfil, dados da conta, encomendas, alugueres, favoritos, cartões-presente, referências de pagamento e informações de apoio ao cliente. As propostas de venda podem incluir fotografias de artigos e dados bancários necessários ao pagamento. As encomendas para terceiros incluem os dados do beneficiário fornecidos pelo cliente.", "Também podem ser tratados dados técnicos necessários ao funcionamento e à segurança, como endereço IP, informações do dispositivo e registos de acesso. Os dados são fornecidos por si, pelo cliente que o indica como beneficiário ou gerados pela utilização dos serviços e pelo processamento dos pagamentos."],
      ["Finalidades e fundamentos", "A criação e gestão da conta, compras, alugueres, entregas, levantamentos, presentes, pagamentos e propostas de venda destinam-se à execução de um contrato ou a diligências solicitadas antes da sua celebração. Os dados necessários à faturação e ao cumprimento de obrigações legais são tratados com esse fundamento.", "A segurança, a prevenção de fraude, a gestão de pedidos de apoio e a defesa de direitos podem basear-se no interesse legítimo, ponderado com os seus direitos. Quando um tratamento depender do consentimento, este pode ser retirado sem afetar a licitude do tratamento anterior. A falta de dados indispensáveis pode impedir a prestação do serviço solicitado."],
      ["Destinatários e prestadores", "Os dados necessários podem ser acedidos pelo pessoal autorizado e pelos balcões envolvidos no serviço, bem como pelos prestadores de alojamento, email, pagamento e entrega. Os pagamentos por cartão são processados através da Stripe; o serviço conserva referências e estados das transações. As autoridades podem receber dados quando a lei o exigir.", "Alojamento: OVH SAS, 2 rue Kellermann, 59100 Roubaix, França (www.ovh.com). Registo e gestão do domínio: LWS (Ligne Web Services), 10, rue Penthièvre, 75008 Paris, França (www.lws.fr). O papel de registrar não implica, por si só, acesso à base de dados dos clientes."],
      ["Operações internacionais", "Os serviços podem envolver beneficiários, entregas e balcões em Angola. Os dados necessários a essas operações podem, por isso, ser comunicados fora do Espaço Económico Europeu. A morada de um prestador não identifica necessariamente a localização dos servidores. Para conhecer os destinatários, locais de tratamento e garantias aplicáveis à sua operação, contacte-nos. Qualquer transferência abrangida pelo RGPD deve respeitar as condições legais aplicáveis."],
      ["Conservação e eliminação", "Pode pedir a eliminação da conta e dos seus dados por email. Não foi estabelecido um prazo único para todas as categorias de dados. A necessidade de conservação é apreciada segundo a finalidade, a existência de uma conta ou operação em curso, as obrigações legais e eventuais litígios; não deve exceder o necessário.", "A eliminação não abrange automaticamente os documentos que devam ser conservados por obrigações legais, designadamente contabilísticas ou fiscais, ou para a defesa de direitos. Nesse caso, a resposta ao pedido indicará as limitações aplicáveis. O pedido não constitui uma garantia de eliminação imediata de todos os registos."],
      ["Armazenamento local e rastreio", "O site e a aplicação utilizam armazenamento local para funções como sessão, idioma e carrinho. Apagar esse armazenamento pode terminar a sessão ou repor preferências. Não utilizamos Google Analytics, Meta Pixel ou outros instrumentos de rastreio publicitário ou de medição de audiência, segundo a configuração declarada pelo responsável. Os serviços externos de pagamento podem utilizar mecanismos técnicos próprios, descritos nas respetivas políticas."],
      ["Segurança", "O acesso aos dados é condicionado às funções e autorizações previstas no serviço. Os mecanismos de autenticação e proteção técnica destinam-se a reduzir os riscos, mas nenhum sistema garante segurança absoluta. Não envie palavras-passe nem dados completos de cartões por email."],
      ["Os seus direitos", "Nos termos aplicáveis, pode solicitar acesso, retificação, eliminação, limitação do tratamento e portabilidade dos dados, opor-se a tratamentos baseados em interesse legítimo e retirar consentimentos. Envie o pedido para support@akfashionplus.com, indicando a conta e o direito que pretende exercer. Pode ser necessária informação proporcional para confirmar a identidade.", "O prazo de resposta previsto no RGPD é, em regra, de um mês; uma extensão legalmente permitida deve ser comunicada com os respetivos motivos. Pode apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD), em Portugal, ou à autoridade competente, sem prejuízo de outros meios de recurso."],
      ["Dados de terceiros e atualizações", "Ao indicar um beneficiário, forneça apenas os dados necessários à encomenda e informe essa pessoa sobre esta política. As alterações aos serviços ou ao tratamento dos dados podem exigir uma atualização deste documento. Consulte a data da versão e contacte-nos para esclarecimentos."],
    ],
  },
  fr: {
    title: "Politique de confidentialité", intro: "Site AK Fashion Plus et application mobile KAVULA Fashion",
    updated: "Dernière mise à jour : 18 novembre 2026", summary: "Sommaire", contact: "Contact et demandes concernant vos données", authority: "Déposer une réclamation auprès de la CNPD",
    sections: [
      ["Responsable du traitement", "ALFREDO KAVULA-Fashion Plus Unipessoal Lda. est responsable des données traitées dans le cadre du site et de l’application. Adresse : Rua Manuel Fernandes Tomás N 1 1FTE, 2720-708 Amadora, Portugal. Contact : support@akfashionplus.com."],
      ["Données concernées", "Selon les services utilisés, nous traitons les nom, email, téléphone, adresse, pays, langue, photo de profil, données du compte, commandes, locations, favoris, cartes cadeaux, références de paiement et échanges avec le support. Les propositions de vente peuvent inclure des photos d’articles et les coordonnées bancaires nécessaires au règlement. Les commandes pour un tiers comprennent les informations du bénéficiaire fournies par le client.", "Des données techniques nécessaires au fonctionnement et à la sécurité peuvent aussi être traitées, notamment l’adresse IP, les informations sur l’appareil et les journaux d’accès. Les données proviennent de vous, du client qui vous désigne comme bénéficiaire, de l’utilisation des services et du traitement des paiements."],
      ["Finalités et fondements", "La création et la gestion du compte, les achats, locations, livraisons, retraits, cadeaux, paiements et propositions de vente répondent à l’exécution d’un contrat ou de mesures précontractuelles demandées. Les données nécessaires à la facturation et aux obligations légales sont traitées sur ce fondement.", "La sécurité, la prévention de la fraude, le traitement des demandes d’assistance et la défense de droits peuvent relever de l’intérêt légitime, mis en balance avec vos droits. Lorsqu’un traitement repose sur le consentement, celui-ci peut être retiré sans remettre en cause les traitements antérieurs licites. L’absence d’informations indispensables peut empêcher la réalisation du service demandé."],
      ["Destinataires et prestataires", "Les données nécessaires peuvent être accessibles au personnel autorisé et aux guichets concernés, ainsi qu’aux prestataires d’hébergement, d’email, de paiement et de livraison. Les paiements par carte sont traités via Stripe ; le service conserve les références et statuts des transactions. Les autorités peuvent recevoir des informations lorsque la loi l’exige.", "Hébergement : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France (www.ovh.com). Enregistrement et gestion du domaine : LWS (Ligne Web Services), 10, rue Penthièvre, 75008 Paris, France (www.lws.fr). Le rôle de registrar n’implique pas, à lui seul, un accès à la base de données des clients."],
      ["Opérations internationales", "Les services peuvent impliquer des bénéficiaires, livraisons et guichets en Angola. Les données nécessaires à ces opérations peuvent donc être communiquées hors de l’Espace économique européen. L’adresse d’un prestataire n’indique pas nécessairement l’emplacement des serveurs. Contactez-nous pour connaître les destinataires, lieux de traitement et garanties applicables à votre opération. Tout transfert soumis au RGPD doit respecter les conditions légales applicables."],
      ["Conservation et suppression", "Vous pouvez demander la suppression de votre compte et de vos données par email. Aucun délai unique n’a été fixé pour toutes les catégories de données. La nécessité de conservation s’apprécie selon la finalité, l’existence d’un compte ou d’une opération en cours, les obligations légales et les éventuels litiges ; elle ne doit pas dépasser ce qui est nécessaire.", "La suppression ne concerne pas automatiquement les documents à conserver pour des obligations légales, notamment comptables ou fiscales, ou pour la défense de droits. La réponse à votre demande précisera alors les limites applicables. Une demande ne garantit pas l’effacement immédiat de tous les enregistrements."],
      ["Stockage local et suivi", "Le site et l’application utilisent un stockage local pour des fonctions telles que la session, la langue et le panier. Son effacement peut vous déconnecter ou réinitialiser vos préférences. Nous n’utilisons ni Google Analytics, ni Meta Pixel, ni d’autres outils de suivi publicitaire ou de mesure d’audience, selon la configuration déclarée par le responsable. Les services de paiement externes peuvent utiliser leurs propres mécanismes techniques, décrits dans leurs politiques."],
      ["Sécurité", "L’accès aux données dépend des rôles et autorisations prévus dans le service. Les mécanismes d’authentification et de protection technique visent à réduire les risques, sans qu’aucun système puisse garantir une sécurité absolue. N’envoyez pas de mots de passe ni de coordonnées complètes de carte bancaire par email."],
      ["Vos droits", "Dans les conditions applicables, vous pouvez demander l’accès, la rectification, la suppression, la limitation du traitement et la portabilité des données, vous opposer aux traitements fondés sur l’intérêt légitime et retirer vos consentements. Adressez votre demande à support@akfashionplus.com, en indiquant le compte et le droit concerné. Des informations proportionnées peuvent être nécessaires pour vérifier votre identité.", "Le délai de réponse prévu par le RGPD est en principe d’un mois ; une prolongation légalement permise doit vous être signalée et motivée. Vous pouvez saisir la Comissão Nacional de Proteção de Dados (CNPD), au Portugal, ou l’autorité compétente, sans préjudice des autres recours."],
      ["Données de tiers et mises à jour", "Lorsque vous désignez un bénéficiaire, fournissez uniquement les informations nécessaires à la commande et informez cette personne de la présente politique. L’évolution des services ou des traitements peut entraîner une mise à jour du document. Consultez sa date de version et contactez-nous pour toute précision."],
    ],
  },
  en: {
    title: "Privacy policy", intro: "AK Fashion Plus website and KAVULA Fashion mobile application",
    updated: "Last updated: 18 November 2026", summary: "Contents", contact: "Contact and personal data requests", authority: "Submit a complaint to the CNPD",
    sections: [
      ["Data controller", "ALFREDO KAVULA-Fashion Plus Unipessoal Lda. is responsible for personal data processed through the website and application. Address: Rua Manuel Fernandes Tomás N 1 1FTE, 2720-708 Amadora, Portugal. Contact: support@akfashionplus.com."],
      ["Data covered", "Depending on the services used, we process names, email addresses, telephone numbers, addresses, country, language, profile photos, account information, orders, rentals, favourites, gift cards, payment references and support correspondence. Sale proposals may include item photos and bank details needed for payment. Orders for other people include beneficiary information supplied by the customer.", "Technical data needed for operation and security may also be processed, including IP addresses, device information and access logs. Data comes from you, the customer naming you as a beneficiary, use of the services and payment processing."],
      ["Purposes and legal bases", "Account creation and management, purchases, rentals, deliveries, collections, gifts, payments and sale proposals serve to perform a contract or take steps requested before entering into one. Data needed for invoicing and legal obligations is processed on that basis.", "Security, fraud prevention, handling support requests and defending legal claims may rely on legitimate interests balanced against your rights. Where processing relies on consent, you may withdraw it without affecting earlier lawful processing. Without essential information, we may be unable to provide the requested service."],
      ["Recipients and providers", "Necessary information may be accessed by authorised staff and the counters involved in the service, as well as hosting, email, payment and delivery providers. Card payments are processed through Stripe; the service keeps transaction references and statuses. Information may be disclosed to authorities where required by law.", "Hosting: OVH SAS, 2 rue Kellermann, 59100 Roubaix, France (www.ovh.com). Domain registration and management: LWS (Ligne Web Services), 10, rue Penthièvre, 75008 Paris, France (www.lws.fr). Acting as a registrar does not, by itself, imply access to the customer database."],
      ["International operations", "Services may involve beneficiaries, deliveries and counters in Angola. Information necessary for those operations may therefore be shared outside the European Economic Area. A provider’s address does not necessarily identify the location of its servers. Contact us for information about recipients, processing locations and safeguards applicable to your transaction. Any transfer subject to the GDPR must meet the applicable legal conditions."],
      ["Retention and deletion", "You can request deletion of your account and personal data by email. No single retention period has been set for all data categories. The need for retention is assessed against the purpose, an ongoing account or transaction, legal obligations and potential disputes; it must not exceed what is necessary.", "Deletion does not automatically cover records that must be kept for legal obligations, including accounting or tax requirements, or for legal claims. The response to your request will explain any applicable limits. A request does not guarantee immediate erasure of every record."],
      ["Local storage and tracking", "The website and application use local storage for functions such as sessions, language and shopping carts. Clearing it may sign you out or reset preferences. We do not use Google Analytics, Meta Pixel or other advertising tracking or audience measurement tools, according to the configuration declared by the controller. External payment services may use their own technical mechanisms, described in their policies."],
      ["Security", "Access to information is subject to the roles and permissions provided within the service. Authentication and technical safeguards aim to reduce risks, but no system can guarantee absolute security. Do not email passwords or full payment card details."],
      ["Your rights", "Under the applicable conditions, you may request access, correction, erasure, restriction and portability of your data, object to processing based on legitimate interests and withdraw consent. Send your request to support@akfashionplus.com, identifying your account and the right you wish to exercise. Proportionate information may be needed to verify your identity.", "The GDPR response period is generally one month; any legally permitted extension must be explained to you. You may complain to Portugal’s Comissão Nacional de Proteção de Dados (CNPD) or the competent supervisory authority, without prejudice to other remedies."],
      ["Other people’s data and updates", "When naming a beneficiary, provide only the information necessary for the order and inform them of this policy. Changes to services or processing may require updates to this document. Check its version date and contact us for clarification."],
    ],
  },
};

export default function PrivacyPage() {
  const { language } = useLanguage();
  const [selected, setSelected] = useState<PolicyLanguage>(language);
  const copy = content[selected];

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % languages.length;
    else if (event.key === "ArrowLeft") next = (index + languages.length - 1) % languages.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = languages.length - 1;
    else return;
    event.preventDefault();
    setSelected(languages[next]);
    document.getElementById(`privacy-tab-${languages[next]}`)?.focus();
  }

  return (
    <div className="info-page terms-page privacy-page" lang={selected} data-no-translate>
      <header className="privacy-header">
        <p className="eyebrow">AK Fashion Plus</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <p><time dateTime="2026-11-18">{copy.updated}</time></p>
      </header>
      <div className="privacy-tabs" role="tablist" aria-label="Português / Français / English">
        {languages.map((lang, index) => (
          <button key={lang} id={`privacy-tab-${lang}`} type="button" role="tab" lang={lang}
            aria-selected={selected === lang} aria-controls="privacy-panel" tabIndex={selected === lang ? 0 : -1}
            onClick={() => setSelected(lang)} onKeyDown={(event) => navigateTabs(event, index)}>{labels[lang]}</button>
        ))}
      </div>
      <div id="privacy-panel" role="tabpanel" aria-labelledby={`privacy-tab-${selected}`} tabIndex={0}>
        <nav className="terms-toc" aria-label={copy.summary}>
          <h2>{copy.summary}</h2>
          <ol>{copy.sections.map(([title], index) => <li key={index}><a href={`#privacy-section-${index}`}>{title}</a></li>)}</ol>
        </nav>
        <article className="terms-content" aria-label={copy.title}>
          {copy.sections.map(([title, ...paragraphs], index) => (
            <section key={`${selected}-${index}`} id={`privacy-section-${index}`}>
              <h2>{index + 1}. {title}</h2>
              {paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            </section>
          ))}
          <section>
            <h2>{copy.contact}</h2>
            <p><a href="mailto:support@akfashionplus.com">support@akfashionplus.com</a></p>
            <p><a href="https://www.cnpd.pt/cidadaos/participacoes/" target="_blank" rel="noopener noreferrer">{copy.authority}</a></p>
          </section>
        </article>
      </div>
    </div>
  );
}
