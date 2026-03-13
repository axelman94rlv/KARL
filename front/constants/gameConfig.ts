export const GAMES = {
  goat: {
    id: "goat",
    name: "THE GOAT !!!",
    color: "#FFA722",
    type: "game",
    column: "left", // Colonne gauche
    rows: 2, // Occupe 2.5 lignes (350px)
    image: require("@/assets/images/GOAT2.png"),
    imageHeight: 210, // Taille de l'image (sera clippée)
    titleGap: 30, // Gap entre le titre et l'image
    description: "GOAT !!! est un jeu rapide, compétitif et très social : vide ta main en posant des combinaisons plus fortes que celles en jeu, bloque tes adversaires, et grimpe (ou chute) dans la hiérarchie à chaque manche. Devient le GOAT ultime en vidant tes cartes en premier",
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
    description: "POULEUX est un jeu de rapidité et de sang-froid : repère les combinaisons perdantes, balance-les avant les autres, et évite d'être le dernier à tenir la pire main. Un seul pouleux suffit à tout perdre.",
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
    description: "CACTUS est un jeu de mémoire et de stratégie : mémorise tes cartes, échange-les au bon moment, et tente de clôturer avec la main la plus basse. Un mauvais échange peut tout faire basculer.",
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
