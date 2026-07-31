/* Costanti condivise. Tutto quello che è "elenco di valori ammessi" sta qui,
   così aggiungere una difficoltà o una stagione è una riga sola. */

export const DIFFS = ['facile', 'moderato', 'impegnativo', 'alpinistico'];

export const SEASONS = ['primavera', 'estate', 'autunno', 'inverno'];

export const SEASON_EMOJI = {
  primavera: '🌱', estate: '☀️', autunno: '🍂', inverno: '❄️',
};

export const SORTS = {
  drive: 'Vicinanza',
  rating: 'Valutazione',
  difficulty: 'Difficoltà',
  name: 'Nome',
};

/* Colore del pin sulla mappa, per tipo di attività. */
export const KIND_COLOR = {
  sentiero: '#4a7c59', acqua: '#2563eb', animali: '#b45309', cultura: '#6d28d9',
  avventura: '#db2777', arrampicata: '#c2410c', alpinismo: '#b91c1c', capanna: '#0f766e',
  bici: '#0284c7', gusto: '#a16207', pioggia: '#475569', inverno: '#0891b2',
};

/* Raggruppamento delle schede quando si ordina per vicinanza. Da Simöu il
   tempo in auto è il vincolo che decide davvero come sarà la giornata. */
export const DRIVE_BANDS = [
  { max: 15, label: 'Dietro casa', hint: 'fino a 15 minuti' },
  { max: 25, label: 'Un salto', hint: '15-25 minuti' },
  { max: 40, label: 'Mezza giornata', hint: '25-40 minuti' },
  { max: Infinity, label: 'Giornata intera', hint: 'oltre 40 minuti' },
];

/* Oltre questo valore il filtro "tempo in auto" viene considerato disattivato. */
export const DRIVE_MAX = 70;
export const DRIVE_DEFAULT = 45;

/* Soglia oltre la quale il tempo in auto viene evidenziato in arancione. */
export const DRIVE_FAR = 40;

export const STORAGE = {
  favs: 'simou:favs',
  theme: 'simou:theme',
};
