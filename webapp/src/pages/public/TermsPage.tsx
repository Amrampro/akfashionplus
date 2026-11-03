import sections from "./termsContent.json";

const identity = [
  ["Marque", "Alfredo Kavula Fashion Plus"],
  ["Dénomination commerciale", "AK Fashion Plus"],
  ["Titulaire / exploitant", "ALFREDO KAVULA-Fashion Plus Unipessoal Lda."],
  ["Activité", "Mode, habillement, chaussures, accessoires et services connexes"],
  ["Devises affichées", "EUR (€) et AOA (Kz), avec possibilité d’autres devises"],
  ["Pays de référence", "Portugal"],
  ["Version", "1.0"],
  ["Dernière mise à jour", "31 août 2026"],
];

export default function TermsPage() {
  return (
    <div className="info-page terms-page" lang="fr" data-no-translate>
      <header className="info-hero">
        <p className="eyebrow">Alfredo Kavula Fashion Plus</p>
        <h1>Termes et conditions</h1>
        <p>D’utilisation de la marque</p>
        <p>Identité de la marque · Propriété intellectuelle · Utilisation autorisée · Contenus · Partenaires</p>
        <p>ALFREDO KAVULA-Fashion Plus Unipessoal Lda.</p>
        <p>Version 1.0 · Dernière mise à jour : <time dateTime="2026-08-31">31 août 2026</time></p>
      </header>
      <nav className="terms-toc" aria-label="Sommaire des termes et conditions">
        <h2>Sommaire</h2>
        <ol>
          {sections.map((section) => (
            <li key={section.number}><a href={`#article-${section.number}`}>{section.title}</a></li>
          ))}
        </ol>
        <a href="#identification-marque">Identification de la marque</a>
      </nav>
      <article className="terms-content" aria-label="Termes et conditions d’utilisation de la marque">
        {sections.map((section) => (
          <section id={`article-${section.number}`} key={section.number}>
            <h2>{section.number}. {section.title}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>
        ))}
        <section id="identification-marque">
          <h2>Identification de la marque</h2>
          <dl className="terms-identity">
            {identity.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          <p>© Alfredo Kavula Fashion Plus — Tous droits réservés.</p>
        </section>
      </article>
    </div>
  );
}
