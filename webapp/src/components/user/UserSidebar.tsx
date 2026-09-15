type UserSidebarProps = {
  currentPage: string;
  go: (page: string) => void;
};

const links = [
  ["user-dashboard", "Apercu", "Vue d'ensemble"],
  ["user-orders", "Commandes", "Suivi achats"],
  ["user-rentals", "Locations", "Articles loues"],
  ["user-gift-cards", "Cadeaux", "Cartes cadeaux"],
  ["user-favorites", "Favoris", "Selection"],
  ["user-notifications", "Notifications", "Messages"],
  ["user-profile", "Profil", "Informations"],
];

export default function UserSidebar({ currentPage, go }: UserSidebarProps) {
  return (
    <aside className="user-sidebar">
      <button
        className="user-sidebar-brand"
        onClick={() => go("home")}
        type="button"
      >
        <span>AK</span>
        <strong>Fashion Plus</strong>
      </button>
      <nav aria-label="Navigation espace client">
        {links.map(([id, label, helper]) => (
          <button
            className={currentPage === id ? "active" : ""}
            key={id}
            onClick={() => go(id)}
            type="button"
          >
            <span>{label}</span>
            <small>{helper}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}
