export const GAMES = {
  goat: {
    id: "goat",
    name: "THE GOAT !!!",
    color: "#FFA722",
    type: "game",
    column: "left", // Colonne gauche
    rows: 2, // Occupe 2.5 lignes (350px)
    image: require("@/assets/images/goat.png"),
    imageHeight: 210, // Taille de l'image (sera clippée)
    titleGap: 30, // Gap entre le titre et l'image
  },
  pouleux: {
    id: "pouleux",
    name: "POULEUX",
    color: "#5522FF",
    type: "game",
    column: "right", // Colonne droite
    rows: 1.2, // Occupe 1.5 lignes (280px)
    image: require("@/assets/images/pouleux.png"),
    imageHeight: 120,
    titleGap: 10,
  },
  cactus: {
    id: "cactus",
    name: "CACTUS",
    color: "#29A50D",
    type: "game",
    column: "right", // Colonne droite
    rows: 2, // Occupe 1.5 lignes (280px)
    image: require("@/assets/images/cactus.png"),
    imageHeight: 160,
    titleGap: 80,
  },
  aVenir: {
    id: "aVenir",
    name: "A VENIR ...",
    color: "#6B7280",
    type: "game",
    column: "left", // Colonne gauche
    rows: 1.2, // Occupe 2 lignes (280px)
    isComingSoon: true,
  },
};

export const PAGE_SECTIONS = {
  bienvenue: {
    id: "bienvenue",
    title: "Bienvenue",
    description:
      "It is a long established fact that a reader will be distracted by the readable content",
    type: "text",
    span: 2,
  },
};

export type GameKey = keyof typeof GAMES;
export type SectionKey = keyof typeof PAGE_SECTIONS;
