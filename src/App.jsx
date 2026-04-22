// ─────────────────────────────────────────────────────────────────────────────
//  FAIRWAY — v2  |  Firebase + toutes les nouvelles fonctionnalités
//  ⚠️  Remplace FIREBASE_CONFIG par ta propre config avant de déployer
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp }                             from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  onSnapshot, updateDoc, deleteDoc, query, orderBy, serverTimestamp, arrayUnion, arrayRemove
} from "firebase/firestore";
import {
  getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject
} from "firebase/storage";

// ─── FIREBASE CONFIG — remplace par ta config ────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyC955_7t_xXXOvdFu3WFyiCMclXhL3GNuA",
  authDomain:        "fairway-golf-eb620.firebaseapp.com",
  projectId:         "fairway-golf-eb620",
  storageBucket:     "fairway-golf-eb620.firebasestorage.app",
  messagingSenderId: "376863372038",
  appId:             "1:376863372038:web:6f665f6f95918571e12487",
};
const fbApp  = initializeApp(FIREBASE_CONFIG);
const db     = getFirestore(fbApp);
const storage= getStorage(fbApp);

// ─── HELPERS FIREBASE ────────────────────────────────────────────────────────
const col  = (path) => collection(db, path);
const docRef = (path) => doc(db, path);

async function fbSet(path, data)   { await setDoc(doc(db, path), data, { merge: true }); }
async function fbDel(path)         { await deleteDoc(doc(db, path)); }
async function fbGet(path)         { const d = await getDoc(doc(db, path)); return d.exists() ? d.data() : null; }

async function uploadPhoto(base64, path) {
  if (!base64 || !base64.startsWith("data:")) return base64;
  const ref = storageRef(storage, path);
  await uploadString(ref, base64, "data_url");
  return await getDownloadURL(ref);
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg:"#F7F4EF", surface:"#FFFFFF", surfaceAlt:"#F2EEE8",
  border:"#E4DDD3", borderStrong:"#C8BFB3",
  text:"#1A1714", textMid:"#6B6259", textLight:"#9C9189",
  accent:"#2A5C3F", accentLight:"#EBF3EE", accentMid:"#3D7A57",
  gold:"#B8923A", goldLight:"#F5EDD8",
  danger:"#C0392B", dangerLight:"#FDECEA",
  radius:"12px", radiusSm:"8px",
  shadow:"0 1px 4px rgba(26,23,20,0.06), 0 4px 16px rgba(26,23,20,0.07)",
  shadowMd:"0 8px 32px rgba(26,23,20,0.12)",
};

// ─── GOLF DATA — liste complète FFGolf (~700 clubs) ──────────────────────────
const GOLF_COURSES_BY_REGION = {
  "Île-de-France": [
    "Golf National (Albatros) – Guyancourt","Golf National (Aigle) – Guyancourt",
    "Golf de Versailles – Les Gâtines","Golf de Saint-Cloud – Saint-Cloud",
    "Golf de La Boulie – Versailles","Golf de Fourqueux – Fourqueux",
    "Golf de Morfontaine – Morfontaine","Golf de Chantilly (Vineuil) – Vineuil-Saint-Firmin",
    "Golf de Cély – Cély-en-Bière","Golf de Fontainebleau – Fontainebleau",
    "Golf d'Étiolles – Étiolles","Golf de Bussy-Guermantes – Bussy-Guermantes",
    "Golf de Joyenval – Chambourcy","Golf de Villarceaux – Chaussy",
    "Golf Blue Green Villeray – Condé-sur-Vesgre","Golf de Rochefort-en-Yvelines – Rochefort-en-Yvelines",
    "Golf de Saint-Germain-en-Laye – Saint-Germain-en-Laye","Golf de Chevry – Chevry-Cossigny",
    "Golf d'Apremont – Apremont","Golf du Lys-Chantilly – Lamorlaye",
    "Golf d'Ozoir-la-Ferrière – Ozoir-la-Ferrière","Golf de Vaucouleurs – Civry-la-Forêt",
    "Golf de Seraincourt – Seraincourt","Golf de Feucherolles – Feucherolles",
    "Golf Blue Green Émerainville – Émerainville","Golf de Gif-sur-Yvette – Gif-sur-Yvette",
    "Golf de Rocquencourt – Rocquencourt","Golf de Maisons-Laffitte – Maisons-Laffitte",
    "Golf de Villennes – Villennes-sur-Seine","Golf de Saint-Pierre du Perray – Saint-Pierre du Perray",
    "Golf de Corbeil-Essonne – Corbeil-Essonne","Golf de Cergy-Pontoise – Cergy",
    "Golf de Mionnay – Mionnay","Golf Blue Green Paris Ormesson – Ormesson-sur-Marne",
    "Golf Blue Green Serris – Serris","Golf de Torcy – Torcy",
    "Golf de Meaux-Boutigny – Boutigny","Golf de La Forêt du Roi – Auneau",
    "Golf de Senlis – Senlis","Golf Blue Green Verberie – Verberie",
    "Golf du Prieuré – Sailly","Golf International Paris Longchamp – Boulogne-Billancourt",
  ],
  "Nord / Hauts-de-France": [
    "Golf d'Hardelot (Dunes) – Hardelot-Plage","Golf d'Hardelot (Pins) – Hardelot-Plage",
    "Golf du Touquet (Forêt) – Le Touquet","Golf du Touquet (Mer) – Le Touquet",
    "Golf de Wimereux – Wimereux","Aa Saint-Omer Golf Club – Lumbres",
    "Golf et Country Club de la Côte d'Opale – Ruminghem","Arras Golf Club – Anzin-Saint-Aubin",
    "Golf de Bondues – Bondues","Golf de Brigode – Villeneuve-d'Ascq",
    "Golf Blue Green Mérignies – Mérignies","Golf de Valenciennes – Valenciennes",
    "Golf de Dunkerque – Dunkerque","Golf de Compiègne – Compiègne",
    "Golf de l'Ailette – Chamouille","Golf de Roubaix – Roubaix",
    "Golf de Béthune – Beuvry","Golf de Lens – Lens",
    "Golf de Boulogne-sur-Mer – Wimereux","Golf d'Amiens – Amiens",
    "Golf de Saint-Quentin – Saint-Quentin","Golf de Laon – Laon",
    "Golf de Soissons – Soissons","Golf du Val Secret – Gommecourt",
    "Golf de Chauny – Chauny",
  ],
  "Normandie": [
    "Golf de Deauville (Blue Green) – Saint-Arnoult","Golf de Caen – Biéville-Beuville",
    "Golf de Cabourg – Varaville","Golf Blue Green Houlgate – Gonneville-sur-Mer",
    "Golf de Granville – Granville","Golf de Rouen (Mont-Saint-Aignan) – Mont-Saint-Aignan",
    "Golf de Barrière de Deauville – Saint-Arnoult","Golf de Champ de Bataille – Le Neubourg",
    "Golf de Trouville – Tourgéville","Golf Blue Green Jumièges – Jumièges",
    "Golf de Dieppe – Dieppe","Golf du Val de Saire – Quettehou",
    "Golf de Coutainville – Agon-Coutainville","Golf de Courseulles – Courseulles-sur-Mer",
    "Golf de Fontenay-sur-Eure – Fontenay-sur-Eure","Golf de Bellême – Bellême",
    "Golf de Saint-Saëns – Saint-Saëns","Golf d'Évreux – Évreux",
    "Golf de Lisieux – Lisieux","Golf de Mortagne – Mortagne-au-Perche",
    "Golf de Cherbourg – Cherbourg-en-Cotentin",
  ],
  "Bretagne": [
    "Golf de Saint-Laurent (Blue Green) – Auray","Golf Blue Green Val Quéven – Quéven",
    "Golf Blue Green Rhuys-Kerver – Saint-Gildas-de-Rhuys","Golf Blue Green Ploemeur Océan – Ploemeur",
    "Golf Blue Green Baden – Baden","Golf Blue Green Pléneuf-Val-André – Pléneuf-Val-André",
    "Golf de Dinard – Saint-Briac-sur-Mer","Golf de Brest Iroise – Landerneau",
    "Golf de Quimper Cornouaille – Quimper","Golf de Sable-d'Or-les-Pins – Fréhel",
    "Golf de Rennes – Saint-Jacques-de-la-Lande","Golf de Saint-Cast – Saint-Cast-le-Guildo",
    "Golf de Cornouaille – Bénodet","Golf de Concarneau – Concarneau",
    "Golf de Pont-Aven – Névez","Golf de Lorient – Larmor-Plage",
    "Golf de Vannes – Plescop","Golf de Saint-Brieuc – Plérin",
    "Golf de Dinan – Taden","Golf de Fougères – Fougères",
    "Golf de Vitré – Vitré","Golf Blue Green Saint-Malo – Saint-Malo",
    "Golf de la Freslonnière – Le Rheu","Golf de Brest – Iroise",
    "Golf de Crozon – Crozon",
  ],
  "Pays de la Loire": [
    "Golf International Barrière La Baule (Rouge) – Saint-André-des-Eaux",
    "Golf International Barrière La Baule (Bleu) – Saint-André-des-Eaux",
    "Golf du Domaine de La Bretesche – Missillac","Golf Blue Green Savenay – Savenay",
    "Golf Blue Green Pornic – Pornic","Golf Blue Green Erdre Nantes – Nantes",
    "Golf de Nantes – Vigneux-de-Bretagne","Garden Golf Nantes – Carquefou",
    "Golf des Olonnes – Olonne-sur-Mer","Golf Blue Green Les Fontenelles – L'Aiguillon-sur-Vie",
    "Golf Blue Green Port Bourgenay – Talmont-Saint-Hilaire",
    "Golf de Saint-Jean-de-Monts – Saint-Jean-de-Monts",
    "Golf de l'Anjou – Champigné","Golf de Sablé-Solesmes – Sablé-sur-Sarthe",
    "Golf de La Flèche – La Flèche","Golf du Mans – Le Mans",
    "Golf de Laval – Change","Golf d'Angers – Avrillé",
    "Golf de Cholet – Cholet","Golf de Saint-Nazaire – Saint-Nazaire",
    "Golf de La Roche-sur-Yon – La Roche-sur-Yon",
  ],
  "Grand Est / Alsace / Lorraine / Champagne": [
    "Golf Club de Strasbourg – Illkirch-Graffenstaden","Golf de la Grange aux Ormes – Marly",
    "Golf de Reims – Gueux","Golf de Nancy Aingeray – Aingeray",
    "Golf de Metz-Chérisey – Chérisey","Golf d'Épinal – Golbey",
    "Golf Blue Green Amnéville – Amnéville","Golf de Ribeauvillé – Ribeauvillé",
    "Golf de Soufflenheim – Soufflenheim","Golf de Troyes La Cordelière – Troyes",
    "Golf de Mulhouse – Mulhouse","Golf de Colmar – Colmar",
    "Golf de Haguenau – Haguenau","Golf de Saverne – Saverne",
    "Golf de Bar-le-Duc – Bar-le-Duc","Golf de Verdun – Verdun",
    "Golf de Thionville – Thionville","Golf de Sarrebourg – Sarrebourg",
    "Golf d'Épernay – Épernay","Golf de Charleville-Mézières – Charleville-Mézières",
    "Golf de Sedan – Sedan","Golf de Chaumont – Chaumont",
  ],
  "Bourgogne / Franche-Comté": [
    "Golf de Beaune Levernois – Levernois","Golf Club Le Mont Saint-Jean – Les Rousses",
    "Golf du Rochat – Les Rousses","Golf de Dijon Bourgogne – Norges-la-Ville",
    "Golf de Mâcon La Salle – La Salle","Golf de Chalon-sur-Saône – Chalon-sur-Saône",
    "Golf de Besançon – Mamirolle","Golf de Pontarlier – Pontarlier",
    "Golf de Nevers – Magny-Cours","Golf d'Autun – Autun",
    "Golf de Sens – Sens","Golf de l'Auxois – Pouilly-en-Auxois",
    "Golf de Belfort – Danjoutin","Golf de Vesoul – Vesoul",
  ],
  "Centre / Val de Loire": [
    "Golf de Sologne – Villefranche-sur-Cher","Golf Blue Green Ardrée – Saint-Antoine-du-Rocher",
    "Golf de Tours – Ballan-Miré","Golf de Vaugouard – Fontenay-sur-Loing",
    "Golf de Cheverny – Cheverny","Golf du Château des Sept Tours – Courcelles-de-Touraine",
    "Golf d'Orléans-Donnery – Donnery","Golf de Bourges – Bourges",
    "Golf de Blois – Blois","Golf de Châteauroux – Châteauroux",
    "Golf d'Amboise – Amboise","Golf de Vendôme – Vendôme",
    "Golf de Sancerre – Sancerre","Golf de Romorantin – Romorantin-Lanthenay",
  ],
  "Auvergne / Rhône-Alpes": [
    "Golf du Gouverneur (Breuil) – Monthieux","Golf du Gouverneur (Montaplan) – Monthieux",
    "Lyon Salvagny Golf Club – La Tour-de-Salvagny","Beaujolais Golf Club – Lucenay",
    "Golf de Lyon Verger – Saint-Symphorien-d'Ozon","Golf Blue Green Grand Lyon – Chassieu",
    "Garden Golf Mionnay – Mionnay","Golf Blue Green Saint-Étienne – Saint-Étienne",
    "Golf du Lac d'Annecy – Talloires","Golf d'Évian – Évian-les-Bains",
    "Golf de Chamonix – Chamonix","Golf Blue Green Grenoble Bresson – Bresson",
    "Golf de Méribel – Méribel","Golf Sporting Club de Vichy – Bellerive-sur-Allier",
    "Golf Club de Clermont-Ferrand – Cournon-d'Auvergne","Golf des Étangs – Savigneux",
    "Golf Club du Forez – Craintilleux","Golf de Valence – Valence",
    "Golf de Grenoble Charmeil – Charmeil","Golf de Courchevel – Courchevel",
    "Golf de Megève – Megève","Golf des Arcs – Les Arcs",
    "Golf de Val d'Isère – Val d'Isère","Golf de Tignes – Tignes",
    "Golf de Bourg-en-Bresse – Bourg-en-Bresse","Golf de Morzine – Morzine",
    "Golf d'Albertville – Albertville","Golf de Chambéry – Chambéry",
    "Golf de Thonon-les-Bains – Thonon-les-Bains","Golf d'Aix-les-Bains – Aix-les-Bains",
    "Golf de Roanne – Roanne","Golf de Montbrison – Montbrison",
    "Golf de Pélussin – Pélussin","Golf d'Aurillac – Aurillac",
    "Golf de Riom – Riom","Golf du Puy-en-Velay – Le Puy-en-Velay",
    "Golf de Mende – Mende",
  ],
  "Nouvelle-Aquitaine / Sud-Ouest": [
    "Golf de Biarritz Le Phare – Biarritz","Golf de Chantaco – Saint-Jean-de-Luz",
    "Golf d'Hossegor – Soorts-Hossegor","Golf Blue Green Bordeaux Lac – Bordeaux",
    "Golf Bordelais – Bordeaux","Golf de Pessac – Pessac",
    "Golf de Lacanau – Lacanau","Golf d'Arcangues – Arcangues",
    "Golf de Chiberta – Anglet","Golf de Cognac – Cognac",
    "Golf de La Prée La Rochelle – Marsilly","Golf de Royan – Saint-Palais-sur-Mer",
    "Golf de Seignosse – Seignosse","Golf du Médoc – Le Pian-Médoc",
    "Golf de Bordeaux-Cameyrac – Saint-Sulpice-et-Cameyrac",
    "Golf de Périgueux – Périgueux","Golf de Bergerac – Bergerac",
    "Golf de Libourne – Libourne","Golf d'Agen – Agen",
    "Golf de Mont-de-Marsan – Mont-de-Marsan","Golf de Pau – Billère",
    "Golf de Tarbes – Laloubère","Golf de Bayonne – Bayonne",
    "Golf de La Rochelle – Aytre","Golf de Saintes – Saintes",
    "Golf de Poitiers – Poitiers","Golf de Niort – Niort",
    "Golf de Brive – Brive-la-Gaillarde","Golf de Limoges – Limoges",
    "Golf de Guéret – Guéret","Golf de Tulle – Tulle",
    "Golf de Hendaye – Hendaye","Golf d'Arcachon – La Teste-de-Buch",
    "Golf de Cap Ferret – Lège-Cap-Ferret",
  ],
  "Occitanie / Midi-Pyrénées": [
    "Golf Club de Toulouse – Vieille-Toulouse","Golf de Palmola – Buzet-sur-Tarn",
    "Golf de Téoula – Lévignac","Golf Blue Green Toulouse Seilh – Seilh",
    "Golf Blue Green Montpellier Massane – Baillargues",
    "Golf de Montpellier-Fontcaude – Juvignac","Golf de la Grande-Motte – La Grande-Motte",
    "Golf de Nîmes-Campagne – Nîmes","Golf de Carcassonne – Carcassonne",
    "Golf d'Albi Lasbordes – Castelnau-de-Lévis","Golf de Pau – Billère",
    "Golf de Font Romeu – Font-Romeu","Golf de Luchon – Bagnères-de-Luchon",
    "Golf de Castres – Castres","Golf de Rodez – Onet-le-Château",
    "Golf d'Aurillac – Aurillac","Golf de Foix – Foix",
    "Golf de Perpignan – Perpignan","Golf de Béziers – Béziers",
    "Golf de Sète – Sète","Golf de Montauban – Montauban",
    "Golf de Cahors – Labastide-Marnhac","Golf de Figeac – Figeac",
    "Golf de Millau – Millau","Golf de Auch – Auch",
    "Golf de Tarbes – Tarbes",
  ],
  "PACA / Côte d'Azur": [
    "Golf de Cannes-Mougins – Mougins","Golf de Cannes-Mandelieu – Mandelieu-la-Napoule",
    "Golf de Valescure – Saint-Raphaël","Golf de Saint-Tropez – Gassin",
    "Golf de Provence – Venelles","Golf Blue Green Pont Royal – Mallemort",
    "Golf d'Aix-en-Provence – Aix-en-Provence","Golf de Marseille-La Salette – Marseille",
    "Golf de Servanes – Mouriès","Golf de Beauvallon – Grimaud",
    "Golf de Monte-Carlo – Mont-Agel","Golf de Biot – Biot",
    "Golf d'Opio Valbonne – Opio","Golf de Grasse – Grasse",
    "Golf de Barbaroux – Brignoles","Golf de Sainte-Maxime – Sainte-Maxime",
    "Golf de Fréjus – Fréjus","Golf de Bandol – Bandol",
    "Golf de La Ciotat – La Ciotat","Golf de Toulon – La Garde",
    "Golf de Pertuis – Pertuis","Golf de Manosque – Manosque",
    "Golf de Digne-les-Bains – Digne-les-Bains","Golf de Gap – Gap",
    "Golf de Sisteron – Sisteron","Golf de Nice – Cagnes-sur-Mer",
    "Golf de Menton – Menton","Golf du Claux-Amic – Grasse",
    "Golf de l'Esterel – Agay","Golf de Roquebrune – Roquebrune-sur-Argens",
    "Golf Blue Green Auriol – Auriol","Golf de La Crau – La Crau",
    "Golf d'Avignon – Morières-lès-Avignon","Golf de Nîmes Vacquerolles – Nîmes",
    "Golf de Orange – Orange","Golf de Carpentras – Carpentras",
  ],
  "Corse": [
    "Golf Club de Borgo – Borgo","Murtoli Golf Links – Sartène",
    "Golf de Sperone – Bonifacio","Golf de Lezza – Porto-Vecchio",
    "Golf de Bastelicaccia – Bastelicaccia","Golf de l'Alta Rocca – Sainte-Lucie-de-Tallano",
  ],
  "Outre-Mer": [
    "Golf de Saint-François – Saint-François (Guadeloupe)",
    "Golf de Sainte-Rose – Sainte-Rose (Guadeloupe)",
    "Golf du Méridien – Le Diamant (Martinique)",
    "Golf du Gosier – Le Gosier (Guadeloupe)",
    "Golf de l'Éperon – Saint-Gilles-les-Bains (La Réunion)",
    "Golf du Bassin Bleu – Saint-Leu (La Réunion)",
    "Golf de Saint-Denis – Sainte-Clotilde (La Réunion)",
    "Golf de Château Guyot – Cayenne (Guyane)",
  ],
};

const ALL_GOLF_COURSES = Object.entries(GOLF_COURSES_BY_REGION)
  .flatMap(([r,cs]) => cs.map(c => ({ label: c, region: r })));

// ─── ACTIVITÉS ───────────────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
  {
    id:"parcours", label:"Parcours", desc:"18 ou 9 trous",
    icon:(c)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M3 17l4-12 4 5 4-8 4 15"/><path d="M3 20h18"/></svg>,
    color:"#2A5C3F", colorLight:"#EBF3EE", hasCourse:true, hasMaxPlayers:true,
  },
  {
    id:"practice", label:"Practice", desc:"Coups de départ",
    icon:(c)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/><circle cx="5" cy="12" r="2" fill={c}/></svg>,
    color:"#7C5C2A", colorLight:"#F5EDD8", hasCourse:false, hasMaxPlayers:true,
  },
  {
    id:"putting", label:"Putting", desc:"Green d'entraînement",
    icon:(c)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="18" r="2"/><path d="M12 16V6"/><path d="M12 6l6 3"/></svg>,
    color:"#2A5C6E", colorLight:"#E8F3F5", hasCourse:false, hasMaxPlayers:true,
  },
  {
    id:"approches", label:"Approches", desc:"Petit jeu & chipping",
    icon:(c)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M5 19c0-4 2-7 7-7s7 3 7 7"/><circle cx="12" cy="8" r="3"/></svg>,
    color:"#5C2A6E", colorLight:"#F3E8F5", hasCourse:false, hasMaxPlayers:true,
  },
  {
    id:"cours", label:"Cours / Leçon", desc:"Avec un pro",
    icon:(c)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    color:"#6E2A2A", colorLight:"#F5E8E8", hasCourse:false, hasMaxPlayers:false,
  },
  {
    id:"terrasse", label:"Un verre en terrasse", desc:"L'après-golf qui compte",
    icon:(c)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M8 2h8l-1 7H9L8 2z"/><path d="M9 9c0 4 3 6 3 6s3-2 3-6"/><line x1="12" y1="15" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>,
    color:"#A0522D", colorLight:"#FDF0E6", hasCourse:false, hasMaxPlayers:true,
  },
];

const DIFFICULTY_LABELS = ["","Très facile","Facile","Intermédiaire","Difficile","Expert"];
// Ordre officiel des départs FFGolf
const TEE_OPTIONS = ["Blanc","Jaune","Bleu","Rouge","Violet","Orange"];

// ─── DÉPART CONSEILLÉ (règles FFGolf) ────────────────────────────────────────
function conseilleTee(genre, index) {
  const idx = parseFloat(index);
  if (isNaN(idx)) return null;
  if (idx > 53) return "Orange";
  if (genre === "H") {
    if (idx <= 11.4) return "Blanc";
    if (idx <= 26.4) return "Jaune";
    if (idx <= 36)   return "Bleu";
    if (idx <= 45)   return "Rouge";
    if (idx <= 53)   return "Violet";
    return "Orange";
  } else {
    if (idx <= 15.4) return "Bleu";
    if (idx <= 36)   return "Rouge";
    if (idx <= 53)   return "Violet";
    return "Orange";
  }
}

const TEE_COLORS = {
  Blanc:  "#FFFFFF", Jaune: "#F5C518", Bleu: "#2A5C6E",
  Rouge:  "#C0392B", Violet:"#5C2A6E", Orange:"#E8761A",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatDate(s){const d=new Date(s+"T00:00:00");return d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});}
function formatShort(s){const d=new Date(s+"T00:00:00");return d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});}
function hashPw(s){let h=0;for(let i=0;i<s.length;i++){h=Math.imul(31,h)+s.charCodeAt(i)|0;}return h.toString(36);}
function avatarColors(name){const h=(name.charCodeAt(0)*17+(name.charCodeAt(1)||0)*31)%360;return{bg:`hsl(${h},35%,72%)`,fg:`hsl(${h},35%,28%)`};}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g,"").slice(0,10);
  return digits.replace(/(\d{2})(?=\d)/g,"$1 ").trim();
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidPhone(p) { return p.replace(/\D/g,"").length === 10; }

// ─── GLOBAL STYLE ────────────────────────────────────────────────────────────
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Playfair+Display:wght@400;500;600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:${T.bg};}
    input,textarea,select{font-family:'DM Sans',sans-serif;color-scheme:light;}
    button{font-family:'DM Sans',sans-serif;cursor:pointer;}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:${T.borderStrong};border-radius:4px;}
    @keyframes slideUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px) scale(.97);}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}}
    .chover{transition:box-shadow .2s,transform .2s;}
    .chover:hover{box-shadow:${T.shadowMd};transform:translateY(-1px);}
    .pthumb:hover img{transform:scale(1.05);}
    .gbtn:hover{background:${T.surfaceAlt}!important;}
    input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
  `}</style>
);

// ─── LOGO ────────────────────────────────────────────────────────────────────
function FairwayLogo({ variant = "dark", size = "md" }) {
  const color = variant === "light" ? "#E8F0E9" : T.accent;
  const sizes = {
    sm: { icon:22, title:17, sub:7,  gap:3, subGap:2 },
    md: { icon:42, title:34, sub:11, gap:7, subGap:5 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,userSelect:"none"}}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2.5" fill={color} stroke="none"/>
        <line x1="12" y1="2"  x2="12" y2="5"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="5"  y2="12"/>
        <line x1="19" y1="12" x2="22" y2="12"/>
      </svg>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:s.title+2,fontWeight:400,color,letterSpacing:"0.1em",lineHeight:1,marginTop:`${s.gap}px`}}>
        Fairway
      </div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:s.sub,fontWeight:300,color,letterSpacing:"0.2em",textTransform:"uppercase",marginTop:`${s.subGap}px`,opacity:0.75,whiteSpace:"nowrap"}}>
        Votre espace golf en équipe
      </div>
    </div>
  );
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
const Lbl = ({children}) => <span style={{display:"block",fontSize:"11px",fontWeight:500,letterSpacing:"0.07em",textTransform:"uppercase",color:T.textLight,marginBottom:"6px",fontFamily:"'DM Sans',sans-serif"}}>{children}</span>;

function Inp({style,...p}){
  return <input style={{width:"100%",padding:"11px 14px",borderRadius:T.radiusSm,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:"14px",outline:"none",transition:"border-color .15s",fontFamily:"'DM Sans',sans-serif",...style}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border} {...p}/>;
}
function Txta({style,...p}){
  return <textarea style={{width:"100%",padding:"11px 14px",borderRadius:T.radiusSm,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:"14px",outline:"none",resize:"vertical",transition:"border-color .15s",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,...style}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border} {...p}/>;
}
function Btn({variant="primary",style,children,...p}){
  const v={primary:{background:T.accent,color:"#fff",border:"none"},ghost:{background:"transparent",color:T.textMid,border:`1.5px solid ${T.border}`},danger:{background:T.dangerLight,color:T.danger,border:"none"},gold:{background:T.gold,color:"#fff",border:"none"}};
  return <button className={variant==="ghost"?"gbtn":""} style={{padding:"11px 20px",borderRadius:T.radiusSm,fontSize:"14px",fontWeight:500,transition:"all .15s",letterSpacing:".01em",display:"inline-flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap",...v[variant],...style}} {...p}>{children}</button>;
}
function Fld({label,children,error}){
  return(
    <div style={{marginBottom:"14px"}}>
      {label&&<Lbl>{label}</Lbl>}
      {children}
      {error&&<div style={{fontSize:"11px",color:T.danger,marginTop:"4px"}}>{error}</div>}
    </div>
  );
}
function Stars({value=0,size=16,onChange}){
  return(
    <div style={{display:"flex",gap:"2px"}}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i<=value?"#B8923A":"none"} stroke="#B8923A" strokeWidth="1.5"
          style={{cursor:onChange?"pointer":"default"}}
          onClick={()=>onChange&&onChange(i)}
        ><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ))}
    </div>
  );
}
function Ava({profile,size=36}){
  if(profile?.photo) return <img src={profile.photo} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",display:"block",flexShrink:0}}/>;
  const name=profile?.firstName||profile?.username||"?";
  const {bg,fg}=avatarColors(name);
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.38),fontWeight:600,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>{name[0].toUpperCase()}</div>;
}
function Modal({open,onClose,title,children}){
  if(!open)return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(26,23,20,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"640px",maxHeight:"90vh",overflowY:"auto",padding:"24px",animation:"slideUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:500,color:T.text}}>{title}</h2>
          <button onClick={onClose} style={{background:T.surfaceAlt,border:"none",borderRadius:"50%",width:"32px",height:"32px",display:"flex",alignItems:"center",justifyContent:"center",color:T.textMid}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Lightbox({photos,index,onClose,onNav}){
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();if(e.key==="ArrowRight")onNav(1);if(e.key==="ArrowLeft")onNav(-1);};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(10,8,6,0.95)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",maxWidth:"90vw",maxHeight:"90vh"}}>
        <img src={photos[index]} alt="" style={{maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:T.radius,display:"block"}}/>
        <button onClick={onClose} style={{position:"absolute",top:"-14px",right:"-14px",background:T.surface,border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:T.shadow,color:T.text}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        {photos.length>1&&<>
          {[[-1,"‹","left"],[1,"›","right"]].map(([d,ch,s])=>
            <button key={s} onClick={()=>onNav(d)} style={{position:"absolute",[s]:"-52px",top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.08)",color:"#fff",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"50%",width:"40px",height:"40px",fontSize:"20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ch}</button>
          )}
        </>}
      </div>
    </div>
  );
}

// ─── AUTOCOMPLETE GOLF ───────────────────────────────────────────────────────
function CourseSel({ value, onChange, placeholder = "Rechercher un golf…" }) {
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => { setQ(value || ""); }, [value]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const matches = q.length > 1
    ? ALL_GOLF_COURSES.filter(c => c.label.toLowerCase().includes(q.toLowerCase())).slice(0, 12)
    : [];

  // Grouper par région
  const grouped = {};
  matches.forEach(c => { if (!grouped[c.region]) grouped[c.region] = []; grouped[c.region].push(c); });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Inp
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open && matches.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, boxShadow: T.shadowMd, zIndex: 200, maxHeight: "240px", overflowY: "auto", marginTop: "4px" }}>
          {Object.entries(grouped).map(([region, courses]) => (
            <div key={region}>
              <div style={{ padding: "6px 14px", fontSize: "10px", fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.07em", background: T.surfaceAlt }}>{region}</div>
              {courses.map(c => (
                <div key={c.label} onClick={() => { onChange(c.label); setQ(c.label); setOpen(false); }}
                  style={{ padding: "10px 14px", fontSize: "13px", color: T.text, cursor: "pointer", borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {c.label}
                </div>
              ))}
            </div>
          ))}
          <div onClick={() => { onChange(q); setOpen(false); }} style={{ padding: "10px 14px", fontSize: "12px", color: T.accent, cursor: "pointer", fontStyle: "italic" }}>
            + Utiliser "{q}"
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SLOT CHAT ───────────────────────────────────────────────────────────────
function SlotChat({ slotId, profiles, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef();
  const lastSeenRef = useRef(0);

  useEffect(() => {
    if (!slotId) return;
    const q2 = query(col(`chats/${slotId}/messages`), orderBy("createdAt"));
    const unsub = onSnapshot(q2, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      if (!open) {
        const newOnes = msgs.filter(m => m.author !== currentUser.uid && new Date(m.createdAt?.toDate?.() || m.createdAt) > new Date(lastSeenRef.current));
        setUnread(newOnes.length);
      }
    });
    return unsub;
  }, [slotId]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      lastSeenRef.current = Date.now();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [open, messages]);

  async function send() {
    const txt = input.trim();
    if (!txt) return;
    setInput("");
    await fbSet(`chats/${slotId}/messages/${Date.now()}_${currentUser.uid}`, {
      author: currentUser.uid,
      text: txt,
      createdAt: new Date().toISOString(),
    });
  }

  const act = ACTIVITY_TYPES[0];

  return (
    <div style={{ marginTop: "12px", borderTop: `1px solid ${T.border}`, paddingTop: "10px" }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: "7px", background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: T.textMid, fontFamily: "'DM Sans',sans-serif", fontSize: "12px" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={open ? T.accent : T.textMid} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span style={{ color: open ? T.accent : T.textMid, fontWeight: open ? 500 : 400 }}>
          {open ? "Fermer le chat" : "Chat du groupe"}
        </span>
        {messages.length > 0 && !open && <span style={{ fontSize: "11px", color: T.textLight }}>({messages.length})</span>}
        {unread > 0 && !open && <span style={{ background: T.accent, color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", padding: "10px", background: T.surfaceAlt, borderRadius: T.radiusSm, marginBottom: "8px", border: `1px solid ${T.border}` }}>
            {messages.length === 0
              ? <div style={{ textAlign: "center", padding: "20px 0", color: T.textLight, fontSize: "12px", fontStyle: "italic" }}>Lancez la conversation !</div>
              : messages.map(m => {
                const isMine = m.author === currentUser.uid;
                const p = profiles[m.author];
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", gap: "7px" }}>
                    {!isMine && <Ava profile={p} size={24} />}
                    <div style={{ maxWidth: "75%" }}>
                      {!isMine && <div style={{ fontSize: "10px", color: T.textLight, marginBottom: "3px", paddingLeft: "4px" }}>{p?.firstName || m.author}</div>}
                      <div style={{ padding: "8px 12px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMine ? T.accent : T.surface, color: isMine ? "#fff" : T.text, fontSize: "13px", lineHeight: 1.45, fontFamily: "'DM Sans',sans-serif", wordBreak: "break-word" }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })
            }
            <div ref={bottomRef} />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} placeholder="Votre message…" maxLength={400}
              style={{ flex: 1, padding: "10px 14px", borderRadius: "20px", border: `1.5px solid ${T.border}`, background: T.surface, fontSize: "13px", fontFamily: "'DM Sans',sans-serif", outline: "none", color: T.text }}
              onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border}
            />
            <button onClick={send} disabled={!input.trim()} style={{ width: "38px", height: "38px", borderRadius: "50%", background: input.trim() ? T.accent : T.border, border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SLOT CARD ───────────────────────────────────────────────────────────────
function SlotCard({ slot, profiles, currentUser, onJoin, onLeave, onDelete }) {
  const activity = ACTIVITY_TYPES.find(a => a.id === slot.activityType) || ACTIVITY_TYPES[0];
  const isFull   = slot.participants.length >= (slot.maxPlayers || 4);
  const hasJoined= slot.participants.includes(currentUser.uid);
  const isOwner  = slot.author === currentUser.uid;
  const showPlayers = activity.hasMaxPlayers !== false;
  const pct      = slot.participants.length / (slot.maxPlayers || 4);
  const authorProfile = profiles[slot.author];

  return (
    <div className="chover" style={{ background: T.surface, borderRadius: T.radius, border: `1.5px solid ${T.border}`, padding: "20px", boxShadow: T.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: "12px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: activity.colorLight, borderRadius: "6px", padding: "3px 9px", marginBottom: "7px" }}>
            {activity.icon(activity.color)}
            <span style={{ fontSize: "11px", fontWeight: 600, color: activity.color, letterSpacing: "0.03em" }}>{activity.label}</span>
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 500, color: T.text, marginBottom: "5px", lineHeight: 1.3 }}>
            {slot.activityType === "parcours" && slot.course ? slot.course : (slot.location || activity.desc)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: T.textMid, fontSize: "13px", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>{formatDate(slot.date)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>{slot.time}</span>
          </div>
        </div>
        {showPlayers && <div style={{ background: isFull ? T.dangerLight : activity.colorLight, color: isFull ? T.danger : activity.color, borderRadius: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>{slot.participants.length}/{slot.maxPlayers || 4}</div>}
      </div>

      {showPlayers && <div style={{ height: "3px", background: T.surfaceAlt, borderRadius: "2px", marginBottom: "14px", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct * 100}%`, borderRadius: "2px", background: isFull ? T.danger : activity.color, transition: "width .4s" }} /></div>}

      {showPlayers && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          {slot.participants.map(uid => {
            const p = profiles[uid];
            return (
              <div key={uid} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Ava profile={p} size={22} />
                <span style={{ fontSize: "12px", color: uid === currentUser.uid ? activity.color : T.textMid, fontWeight: uid === currentUser.uid ? 500 : 400 }}>{p?.firstName || uid}</span>
              </div>
            );
          })}
          {Array.from({ length: (slot.maxPlayers || 4) - slot.participants.length }).map((_, i) => (
            <div key={i} style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1.5px dashed ${T.borderStrong}`, opacity: .4 }} />
          ))}
        </div>
      )}

      {!showPlayers && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Ava profile={authorProfile} size={22} />
          <span style={{ fontSize: "12px", color: T.textMid }}>{authorProfile?.firstName || slot.author} s'entraîne</span>
        </div>
      )}

      {slot.note && <p style={{ fontSize: "13px", color: T.textMid, fontStyle: "italic", padding: "10px 12px", background: T.surfaceAlt, borderRadius: T.radiusSm, marginBottom: "14px", lineHeight: 1.5 }}>«&nbsp;{slot.note}&nbsp;»</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Ava profile={authorProfile} size={18} />
          <span style={{ fontSize: "11px", color: T.textLight }}>Par {authorProfile?.firstName || slot.author}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {isOwner && <Btn variant="ghost" style={{ padding: "6px 12px", fontSize: "12px", color: T.danger, borderColor: T.dangerLight }} onClick={() => onDelete(slot.id)}>Annuler</Btn>}
          {!isOwner && showPlayers && hasJoined && <Btn variant="ghost" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => onLeave(slot.id)}>Se désister</Btn>}
          {!isOwner && showPlayers && !hasJoined && !isFull && <Btn variant="primary" style={{ padding: "7px 16px", fontSize: "13px", background: activity.color }} onClick={() => onJoin(slot.id)}>Rejoindre</Btn>}
          {!isOwner && showPlayers && !hasJoined && isFull && <span style={{ fontSize: "12px", color: T.textLight, fontStyle: "italic" }}>Complet</span>}
        </div>
      </div>
      <SlotChat slotId={slot.id} profiles={profiles} currentUser={currentUser} />
    </div>
  );
}

// ─── REVIEW CARD ─────────────────────────────────────────────────────────────
function ReviewCard({ rev, profiles, currentUser, onDelete, onEdit, onLightbox }) {
  const authorProfile = profiles[rev.author];
  const isOwner = rev.author === currentUser.uid;
  return (
    <div className="chover" style={{ background: T.surface, borderRadius: T.radius, border: `1.5px solid ${T.border}`, padding: "20px", boxShadow: T.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 500, color: T.text, marginBottom: "6px", lineHeight: 1.3 }}>{rev.course}</div>
          <Stars value={rev.rating} />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "12px" }}>
          <Ava profile={authorProfile} size={30} />
          <div style={{ fontSize: "11px", color: T.textLight, marginTop: "4px" }}>{authorProfile?.firstName || rev.author}</div>
          <div style={{ fontSize: "11px", color: T.textLight }}>{rev.date}</div>
        </div>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textLight }}>Difficulté</span>
          {rev.difficulty > 0 && <span style={{ fontSize: "11px", color: T.accent, fontWeight: 500 }}>{DIFFICULTY_LABELS[rev.difficulty]}</span>}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>{[1,2,3,4,5].map(d => <div key={d} style={{ flex: 1, height: "4px", borderRadius: "2px", background: d <= rev.difficulty ? T.accent : T.border }} />)}</div>
      </div>
      <p style={{ fontSize: "14px", color: T.text, lineHeight: 1.65, marginBottom: rev.tips ? "12px" : "0" }}>{rev.text}</p>
      {rev.tips && <div style={{ borderLeft: `3px solid ${T.gold}`, paddingLeft: "12px", marginBottom: "12px", marginTop: "12px" }}>
        <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: T.gold, display: "block", marginBottom: "3px" }}>Conseil</span>
        <p style={{ fontSize: "13px", color: T.textMid, lineHeight: 1.5, fontStyle: "italic" }}>{rev.tips}</p>
      </div>}
      {rev.photos && rev.photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(rev.photos.length, 4)}, 1fr)`, gap: "6px", marginBottom: "12px" }}>
          {rev.photos.slice(0, 4).map((ph, i) => (
            <div key={i} className="pthumb" onClick={() => onLightbox(rev.photos, i)} style={{ aspectRatio: "1", borderRadius: T.radiusSm, overflow: "hidden", cursor: "zoom-in", border: `1px solid ${T.border}`, position: "relative" }}>
              <img src={ph} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s" }} />
              {i === 3 && rev.photos.length > 4 && <div style={{ position: "absolute", inset: 0, background: "rgba(26,23,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "18px", fontWeight: 600 }}>+{rev.photos.length - 4}</div>}
            </div>
          ))}
        </div>
      )}
      {isOwner && (
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => onEdit(rev)} style={{ background: "none", border: "none", fontSize: "12px", color: T.accent, cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "'DM Sans',sans-serif" }}>Modifier</button>
          <button onClick={() => onDelete(rev.id)} style={{ background: "none", border: "none", fontSize: "12px", color: T.textLight, cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "'DM Sans',sans-serif" }}>Supprimer</button>
        </div>
      )}
    </div>
  );
}

// ─── MEMBER CARD ─────────────────────────────────────────────────────────────
function MemberCard({ profile, currentUser, isFavorite, onToggleFavorite }) {
  if (!profile) return null;
  const isPublic = profile.profilePublic !== false;
  const isMe = profile.uid === currentUser.uid;
  return (
    <div className="chover" style={{ background: T.surface, borderRadius: T.radius, border: `1.5px solid ${T.border}`, padding: "16px 20px", boxShadow: T.shadow, display: "flex", alignItems: "center", gap: "14px" }}>
      <Ava profile={profile} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 500, color: T.text }}>{profile.firstName} {profile.lastName}</div>
          {!isPublic && !isMe && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textLight} strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
        </div>
        {isPublic && profile.index && <div style={{ fontSize: "12px", color: T.accent, fontWeight: 500, marginTop: "2px" }}>Index {profile.index}</div>}
        {!isPublic && !isMe && <div style={{ fontSize: "12px", color: T.textLight, marginTop: "2px", fontStyle: "italic" }}>Profil masqué</div>}
        <div style={{ display: "flex", gap: "10px", marginTop: "5px", flexWrap: "wrap" }}>
          {isPublic && profile.tee && <span style={{ fontSize: "11px", color: T.textLight }}>⛳ Départ {profile.tee}</span>}
          {isPublic && profile.phone && <span style={{ fontSize: "11px", color: T.textLight }}>📱 {formatPhone(profile.phone)}</span>}
          {isPublic && profile.email && <span style={{ fontSize: "11px", color: T.textLight }}>✉️ {profile.email}</span>}
        </div>
      </div>
      {!isMe && (
        <button onClick={() => onToggleFavorite(profile.uid)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? T.gold : "none"} stroke={isFavorite ? T.gold : T.borderStrong} strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function ProfileTab({ currentUser, profiles, onSave, onLogout, onDeleteAccount, notify }) {
  const p = profiles[currentUser.uid] || {};
  const [photo,          setPhoto]          = useState(p.photo || "");
  const [firstName,      setFirstName]      = useState(p.firstName || "");
  const [lastName,       setLastName]       = useState(p.lastName || "");
  const [genre,          setGenre]          = useState(p.genre || "H");
  const [phone,          setPhone]          = useState(p.phone || "");
  const [email,          setEmail]          = useState(p.email || "");
  const [index,          setIndex]          = useState(p.index || "");
  const [tee,            setTee]            = useState(p.tee || "");
  const [profilePublic,  setProfilePublic]  = useState(p.profilePublic !== false);
  const [favorites,      setFavorites]      = useState(p.favorites || []);
  const [editingPw,      setEditingPw]      = useState(false);
  const [pwCurrent,      setPwCurrent]      = useState("");
  const [pwNew,          setPwNew]          = useState("");
  const [pwConfirm,      setPwConfirm]      = useState("");
  const [saved,          setSaved]          = useState(false);
  const [showDeleteConf, setShowDeleteConf] = useState(false);
  const [phoneErr,       setPhoneErr]       = useState("");
  const [emailErr,       setEmailErr]       = useState("");
  const [activeSection,  setActiveSection]  = useState("profil"); // profil | equipe | agenda | favoris

  const conseille = conseilleTee(genre, index);
  const teeColor  = conseille ? TEE_COLORS[conseille] : null;

  function handlePhotoUpload(e) {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) { notify("Photo trop lourde (max 10 Mo)"); return; }
    const r = new FileReader(); r.onload = ev => setPhoto(ev.target.result); r.readAsDataURL(f);
  }

  function validatePhone(v) {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 10) setPhoneErr("10 chiffres requis");
    else setPhoneErr("");
  }
  function validateEmail(v) {
    if (v && !isValidEmail(v)) setEmailErr("Email invalide");
    else setEmailErr("");
  }

  function handleSave() {
    if (phone && !isValidPhone(phone)) { notify("Numéro de téléphone invalide (10 chiffres requis)"); return; }
    if (email && !isValidEmail(email)) { notify("Adresse email invalide"); return; }
    const updated = { ...p, photo, firstName, lastName, genre, phone: phone.replace(/\D/g,""), email, index, tee, profilePublic, favorites };
    onSave(updated, { pwCurrent, pwNew, pwConfirm });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const otherProfiles = Object.values(profiles).filter(pr => pr.uid !== currentUser.uid);
  const favProfiles   = otherProfiles.filter(pr => favorites.includes(pr.uid));

  const sections = [["profil","Mon profil"],["equipe","L'équipe"],["favoris","Favoris"],["agenda","Agenda"]];

  return (
    <div style={{ animation: "slideUp .2s ease" }}>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto", paddingBottom: "2px" }}>
        {sections.map(([id, label]) => (
          <button key={id} onClick={() => setActiveSection(id)} style={{ padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: activeSection === id ? 600 : 400, border: `1.5px solid ${activeSection === id ? T.accent : T.border}`, background: activeSection === id ? T.accentLight : T.surface, color: activeSection === id ? T.accent : T.textMid, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", fontFamily: "'DM Sans',sans-serif" }}>
            {label}
            {id === "favoris" && favProfiles.length > 0 && <span style={{ marginLeft: "5px", background: T.gold, color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{favProfiles.length}</span>}
          </button>
        ))}
      </div>

      {/* ── MON PROFIL ── */}
      {activeSection === "profil" && (
        <>
          <div style={{ background: T.surface, borderRadius: T.radius, border: `1.5px solid ${T.border}`, padding: "28px", boxShadow: T.shadow, marginBottom: "20px" }}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Ava profile={{ ...p, photo }} size={80} />
                <label style={{ position: "absolute", bottom: 0, right: 0, background: T.accent, borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${T.surface}` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 500, color: T.text }}>{firstName || currentUser.username}</div>
                {index && <span style={{ fontSize: "13px", fontWeight: 600, color: T.accent, background: T.accentLight, padding: "3px 10px", borderRadius: "6px", marginTop: "6px", display: "inline-block" }}>Index {index}</span>}
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "20px" }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 500, color: T.text, marginBottom: "16px" }}>Informations personnelles</h3>

              {/* Genre */}
              <Fld label="Genre">
                <div style={{ display: "flex", gap: "8px" }}>
                  {[["H","Homme"],["F","Femme"]].map(([v,l]) => (
                    <button key={v} onClick={() => setGenre(v)} style={{ flex: 1, padding: "10px", borderRadius: T.radiusSm, fontSize: "14px", fontWeight: genre === v ? 600 : 400, border: `1.5px solid ${genre === v ? T.accent : T.border}`, background: genre === v ? T.accentLight : T.surface, color: genre === v ? T.accent : T.textMid, cursor: "pointer", transition: "all .15s", fontFamily: "'DM Sans',sans-serif" }}>{l}</button>
                  ))}
                </div>
              </Fld>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Fld label="Prénom"><Inp value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" /></Fld>
                <Fld label="Nom"><Inp value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom de famille" /></Fld>
              </div>

              {/* Téléphone avec masque */}
              <Fld label="Téléphone" error={phoneErr}>
                <Inp
                  value={formatPhone(phone)}
                  inputMode="numeric"
                  placeholder="06 00 00 00 00"
                  onChange={e => { const d = e.target.value.replace(/\D/g,"").slice(0,10); setPhone(d); }}
                  onBlur={() => validatePhone(phone)}
                  style={{ borderColor: phoneErr ? T.danger : T.border }}
                />
              </Fld>

              {/* Email avec validation */}
              <Fld label="Email" error={emailErr}>
                <Inp
                  value={email}
                  type="email"
                  inputMode="email"
                  placeholder="prenom@exemple.com"
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => validateEmail(email)}
                  style={{ borderColor: emailErr ? T.danger : T.border }}
                />
              </Fld>

              {/* Index */}
              <Fld label="Index handicap">
                <Inp value={index} onChange={e => setIndex(e.target.value)} placeholder="ex: 12.4" inputMode="decimal" />
              </Fld>

              {/* Départ + départ conseillé */}
              <Fld label={
                <span>
                  Départ préféré
                  {conseille && (
                    <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                      — Conseillé&nbsp;:&nbsp;
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: teeColor, border: "1px solid rgba(0,0,0,0.15)", display: "inline-block" }} />
                        <span style={{ fontWeight: 600, color: T.text }}>{conseille}</span>
                      </span>
                    </span>
                  )}
                </span>
              }>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {TEE_OPTIONS.map(t => (
                    <button key={t} onClick={() => setTee(t)} style={{ padding: "7px 12px", borderRadius: T.radiusSm, fontSize: "13px", fontWeight: tee === t ? 600 : 400, border: `1.5px solid ${tee === t ? T.accent : T.border}`, background: tee === t ? T.accentLight : T.surface, color: tee === t ? T.accent : T.textMid, cursor: "pointer", transition: "all .15s", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: TEE_COLORS[t], border: "1px solid rgba(0,0,0,0.15)", display: "inline-block" }} />
                      {t}
                    </button>
                  ))}
                </div>
              </Fld>

              {/* Visibilité */}
              <div style={{ marginTop: "4px", padding: "14px 16px", borderRadius: T.radiusSm, border: `1.5px solid ${profilePublic ? T.accent : T.border}`, background: profilePublic ? T.accentLight : T.surfaceAlt, cursor: "pointer" }} onClick={() => setProfilePublic(v => !v)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: profilePublic ? T.accent : T.textMid }}>{profilePublic ? "Profil visible par l'équipe" : "Profil masqué"}</div>
                    <div style={{ fontSize: "11px", color: T.textLight, marginTop: "2px" }}>{profilePublic ? "Index, départ et contact visibles" : "Seul votre prénom est visible"}</div>
                  </div>
                  <div style={{ width: "40px", height: "22px", borderRadius: "11px", background: profilePublic ? T.accent : T.borderStrong, position: "relative", flexShrink: 0, transition: "background .2s" }}>
                    <div style={{ position: "absolute", top: "3px", left: profilePublic ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connexion */}
          <div style={{ background: T.surface, borderRadius: T.radius, border: `1.5px solid ${T.border}`, padding: "24px", boxShadow: T.shadow, marginBottom: "20px" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 500, color: T.text, marginBottom: "16px" }}>Connexion</h3>
            {!editingPw
              ? <button onClick={() => setEditingPw(true)} style={{ fontSize: "13px", color: T.accent, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>Modifier le mot de passe</button>
              : <div>
                  <Fld label="Mot de passe actuel"><Inp type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Mot de passe actuel" /></Fld>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <Fld label="Nouveau"><Inp type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Nouveau" /></Fld>
                    <Fld label="Confirmer"><Inp type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Confirmer" /></Fld>
                  </div>
                  <button onClick={() => { setEditingPw(false); setPwCurrent(""); setPwNew(""); setPwConfirm(""); }} style={{ fontSize: "12px", color: T.textLight, background: "none", border: "none", padding: 0, cursor: "pointer" }}>Annuler</button>
                </div>
            }
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <Btn variant="primary" style={{ flex: 2, justifyContent: "center" }} onClick={handleSave}>
              {saved ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>Enregistré</> : "Enregistrer"}
            </Btn>
            <Btn variant="ghost" style={{ flex: 1, justifyContent: "center", color: T.danger, borderColor: T.dangerLight }} onClick={onLogout}>Déconnexion</Btn>
          </div>

          {/* Suppression de compte */}
          {!showDeleteConf
            ? <button onClick={() => setShowDeleteConf(true)} style={{ fontSize: "12px", color: T.textLight, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginBottom: "32px" }}>Supprimer mon compte</button>
            : <div style={{ background: T.dangerLight, border: `1.5px solid ${T.danger}22`, borderRadius: T.radius, padding: "18px 20px", marginBottom: "32px" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", color: T.danger, marginBottom: "8px" }}>Supprimer le compte ?</div>
                <p style={{ fontSize: "13px", color: T.textMid, marginBottom: "14px", lineHeight: 1.5 }}>Cette action est irréversible. Toutes vos données seront supprimées définitivement.</p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Btn variant="danger" style={{ flex: 1, justifyContent: "center" }} onClick={onDeleteAccount}>Oui, supprimer</Btn>
                  <Btn variant="ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowDeleteConf(false)}>Annuler</Btn>
                </div>
              </div>
          }
        </>
      )}

      {/* ── L'ÉQUIPE ── */}
      {activeSection === "equipe" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 500, color: T.text }}>L'équipe</h3>
            <span style={{ fontSize: "12px", color: T.textLight }}>{otherProfiles.length + 1} membres</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.values(profiles).map(pr => (
              <MemberCard key={pr.uid} profile={pr} currentUser={currentUser}
                isFavorite={favorites.includes(pr.uid)}
                onToggleFavorite={uid => {
                  const next = favorites.includes(uid) ? favorites.filter(f => f !== uid) : [...favorites, uid];
                  setFavorites(next);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── FAVORIS ── */}
      {activeSection === "favoris" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 500, color: T.text }}>Mes partenaires favoris</h3>
            <span style={{ fontSize: "12px", color: T.textLight }}>{favProfiles.length} favoris</span>
          </div>
          {favProfiles.length === 0
            ? <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.border} strokeWidth="1.5" style={{ display: "block", margin: "0 auto 14px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", color: T.textMid, marginBottom: "6px" }}>Aucun favori</p>
                <p style={{ fontSize: "13px", color: T.textLight }}>Ajoutez des favoris depuis l'onglet "L'équipe"</p>
              </div>
            : <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {favProfiles.map(pr => (
                  <MemberCard key={pr.uid} profile={pr} currentUser={currentUser} isFavorite={true}
                    onToggleFavorite={uid => setFavorites(prev => prev.filter(f => f !== uid))}
                  />
                ))}
              </div>
          }
        </div>
      )}

      {/* ── AGENDA ── */}
      {activeSection === "agenda" && (
        <AgendaView profiles={profiles} currentUser={currentUser} />
      )}
    </div>
  );
}

// ─── AGENDA VIEW ─────────────────────────────────────────────────────────────
function AgendaView({ profiles, currentUser }) {
  const [slots, setSlots] = useState([]);
  const [filterPlayer, setFilterPlayer] = useState("all");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const q2 = query(col("slots"), orderBy("date"));
    const unsub = onSnapshot(q2, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.date >= today);
      setSlots(all);
    });
    return unsub;
  }, []);

  const players = [...new Set(slots.flatMap(s => s.participants))].map(uid => profiles[uid]).filter(Boolean);

  const filtered = filterPlayer === "all" ? slots : slots.filter(s => s.participants.includes(filterPlayer));

  // Grouper par date
  const grouped = {};
  filtered.forEach(s => { if (!grouped[s.date]) grouped[s.date] = []; grouped[s.date].push(s); });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 500, color: T.text }}>Agenda des sorties</h3>
      </div>

      {/* Filtre par joueur */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button onClick={() => setFilterPlayer("all")} style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "12px", border: `1.5px solid ${filterPlayer === "all" ? T.accent : T.border}`, background: filterPlayer === "all" ? T.accentLight : T.surface, color: filterPlayer === "all" ? T.accent : T.textMid, cursor: "pointer" }}>Tous</button>
        {players.map(p => (
          <button key={p.uid} onClick={() => setFilterPlayer(p.uid)} style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "12px", border: `1.5px solid ${filterPlayer === p.uid ? T.accent : T.border}`, background: filterPlayer === p.uid ? T.accentLight : T.surface, color: filterPlayer === p.uid ? T.accent : T.textMid, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            <Ava profile={p} size={16} />
            {p.firstName || p.username}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0
        ? <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.border} strokeWidth="1.5" style={{ display: "block", margin: "0 auto 14px" }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", color: T.textMid }}>Aucune sortie prévue</p>
          </div>
        : Object.entries(grouped).map(([date, daySlots]) => (
            <div key={date} style={{ marginBottom: "24px" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 500, color: T.text, marginBottom: "10px", paddingBottom: "6px", borderBottom: `1px solid ${T.border}` }}>
                {formatDate(date)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {daySlots.map(s => {
                  const act = ACTIVITY_TYPES.find(a => a.id === s.activityType) || ACTIVITY_TYPES[0];
                  const isIn = s.participants.includes(currentUser.uid);
                  return (
                    <div key={s.id} style={{ background: T.surface, border: `1.5px solid ${isIn ? act.color + "44" : T.border}`, borderRadius: T.radiusSm, padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", background: act.colorLight, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {act.icon(act.color)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>{s.activityType === "parcours" && s.course ? s.course.split(" – ")[0] : act.label}</div>
                        <div style={{ fontSize: "11px", color: T.textLight, marginTop: "2px" }}>{s.time} · {s.participants.length} joueur{s.participants.length > 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ display: "flex", flexShrink: 0 }}>
                        {s.participants.slice(0, 4).map(uid => <Ava key={uid} profile={profiles[uid]} size={24} />)}
                      </div>
                      {isIn && <span style={{ fontSize: "10px", fontWeight: 600, color: act.color, background: act.colorLight, padding: "2px 8px", borderRadius: "4px", flexShrink: 0 }}>Inscrit</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      }
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // {uid, username}
  const [profiles,    setProfiles]    = useState({});
  const [slots,       setSlots]       = useState([]);
  const [reviews,     setReviews]     = useState([]);
  const [notifs,      setNotifs]      = useState([]);
  const [tab,         setTab]         = useState("slots");
  const [toast,       setToast]       = useState(null);
  const [lightbox,    setLightbox]    = useState(null);
  const [filterCourse,setFilter]      = useState("Tous");
  const [showNotifs,  setShowNotifs]  = useState(false);
  const [filterActivity, setFilterActivity] = useState("all");
  const [loading,     setLoading]     = useState(true);

  // auth
  const [authMode,  setAuthMode]  = useState("login");
  const [authUser,  setAuthUser]  = useState("");
  const [authPw,    setAuthPw]    = useState("");
  const [authErr,   setAuthErr]   = useState("");
  const [showPw,    setShowPw]    = useState(false);

  // slot form
  const [showSlot,     setShowSlot]     = useState(false);
  const [slotActivity, setSlotActivity] = useState("parcours");
  const [slotDate,     setSlotDate]     = useState("");
  const [slotTime,     setSlotTime]     = useState("");
  const [slotCourse,   setSlotCourse]   = useState("");
  const [slotLocation, setSlotLocation] = useState("");
  const [slotMax,      setSlotMax]      = useState(4);
  const [slotNote,     setSlotNote]     = useState("");

  // review form
  const [showRev,   setShowRev]   = useState(false);
  const [editingRev,setEditingRev]= useState(null); // null = nouveau, obj = édition
  const [revCourse, setRevCourse] = useState("");
  const [revRating, setRevRating] = useState(0);
  const [revDiff,   setRevDiff]   = useState(3);
  const [revText,   setRevText]   = useState("");
  const [revTips,   setRevTips]   = useState("");
  const [revPhotos, setRevPhotos] = useState([]);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 3200); }

  // ── LOAD & REALTIME ──
  useEffect(() => {
    // Restaurer session
    try {
      const sess = localStorage.getItem("fw-session-v2");
      if (sess) setCurrentUser(JSON.parse(sess));
    } catch {}

    // Realtime listeners
    const unsubProfiles = onSnapshot(col("users"), snap => {
      const p = {}; snap.docs.forEach(d => { p[d.id] = { uid: d.id, ...d.data() }; }); setProfiles(p);
    });
    const unsubSlots = onSnapshot(query(col("slots"), orderBy("date")), snap => {
      setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubReviews = onSnapshot(query(col("reviews"), orderBy("createdAt", "desc")), snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubNotifs = onSnapshot(query(col("notifs"), orderBy("createdAt", "desc")), snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    setLoading(false);
    return () => { unsubProfiles(); unsubSlots(); unsubReviews(); unsubNotifs(); };
  }, []);

  // ── AUTH ──
  async function handleLogin() {
    setAuthErr("");
    const pr = Object.values(profiles).find(p => p.username === authUser.trim());
    if (!pr) { setAuthErr("Nom d'utilisateur introuvable."); return; }
    if (pr.passwordHash !== hashPw(authPw)) { setAuthErr("Mot de passe incorrect."); return; }
    const u = { uid: pr.uid, username: pr.username };
    setCurrentUser(u);
    try { localStorage.setItem("fw-session-v2", JSON.stringify(u)); } catch {}
    setAuthUser(""); setAuthPw("");
  }

  async function handleRegister() {
    setAuthErr("");
    const uname = authUser.trim();
    if (!uname || uname.length < 3) { setAuthErr("Identifiant trop court (min 3 caractères)."); return; }
    if (Object.values(profiles).find(p => p.username === uname)) { setAuthErr("Ce nom d'utilisateur est déjà pris."); return; }
    if (authPw.length < 4) { setAuthErr("Mot de passe trop court (min 4 caractères)."); return; }
    const uid = `${uname}_${Date.now()}`;
    const newProfile = { uid, username: uname, passwordHash: hashPw(authPw), firstName: uname, profilePublic: true, createdAt: new Date().toISOString() };
    await fbSet(`users/${uid}`, newProfile);
    const u = { uid, username: uname };
    setCurrentUser(u);
    try { localStorage.setItem("fw-session-v2", JSON.stringify(u)); } catch {}
    setAuthUser(""); setAuthPw("");
    notify("Bienvenue ! Complétez votre profil."); setTab("profile");
  }

  function handleLogout() {
    setCurrentUser(null);
    try { localStorage.removeItem("fw-session-v2"); } catch {}
  }

  async function handleDeleteAccount() {
    if (!currentUser) return;
    // Supprimer le profil
    await fbDel(`users/${currentUser.uid}`);
    // Supprimer ses créneaux (retrait des participants)
    slots.forEach(async s => {
      if (s.participants.includes(currentUser.uid)) {
        await updateDoc(doc(db, `slots/${s.id}`), { participants: arrayRemove(currentUser.uid) });
      }
    });
    handleLogout();
    notify("Compte supprimé.");
  }

  async function handleSaveProfile(updatedProfile, creds) {
    const { pwCurrent, pwNew, pwConfirm } = creds;
    const existing = profiles[currentUser.uid];
    let passwordHash = existing?.passwordHash || "";
    if (pwNew) {
      if (hashPw(pwCurrent) !== passwordHash) { notify("Mot de passe actuel incorrect."); return; }
      if (pwNew !== pwConfirm) { notify("Les mots de passe ne correspondent pas."); return; }
      if (pwNew.length < 4) { notify("Mot de passe trop court."); return; }
      passwordHash = hashPw(pwNew);
    }
    // Upload photo si base64
    let photo = updatedProfile.photo;
    if (photo && photo.startsWith("data:")) {
      try { photo = await uploadPhoto(photo, `avatars/${currentUser.uid}`); } catch {}
    }
    await fbSet(`users/${currentUser.uid}`, { ...updatedProfile, photo, passwordHash, uid: currentUser.uid });
    notify("Profil enregistré !");
  }

  // ── SLOTS ──
  async function handleAddSlot() {
    const act = ACTIVITY_TYPES.find(a => a.id === slotActivity) || ACTIVITY_TYPES[0];
    if (!slotDate || !slotTime) return;
    if (act.hasCourse && !slotCourse.trim()) return;
    const id = Date.now().toString();
    const s = { id, author: currentUser.uid, activityType: slotActivity, date: slotDate, time: slotTime, course: act.hasCourse ? slotCourse : "", location: !act.hasCourse ? slotLocation : "", maxPlayers: act.hasMaxPlayers !== false ? slotMax : 1, participants: [currentUser.uid], note: slotNote, createdAt: new Date().toISOString() };
    await fbSet(`slots/${id}`, s);
    // Notif
    const authorName = profiles[currentUser.uid]?.firstName || currentUser.username;
    const dateStr = new Date(slotDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const notifText = `${authorName} propose ${act.label.toLowerCase()}${s.course ? " · " + s.course.split(" – ")[0] : s.location ? " · " + s.location : ""} le ${dateStr} à ${slotTime}`;
    await fbSet(`notifs/${id}`, { id, type: slotActivity, text: notifText, author: currentUser.uid, readBy: [currentUser.uid], createdAt: new Date().toISOString() });
    setShowSlot(false); setSlotNote(""); setSlotDate(""); setSlotTime(""); setSlotCourse(""); setSlotLocation("");
    notify("Créneau proposé · Équipe notifiée ✓");
  }

  async function handleJoin(id) {
    await updateDoc(doc(db, `slots/${id}`), { participants: arrayUnion(currentUser.uid) });
    notify("Vous avez rejoint la partie");
  }
  async function handleLeave(id) {
    await updateDoc(doc(db, `slots/${id}`), { participants: arrayRemove(currentUser.uid) });
  }
  async function handleDelSlot(id) {
    await fbDel(`slots/${id}`);
  }

  // ── REVIEWS ──
  function openNewReview() {
    setEditingRev(null); setRevCourse(""); setRevRating(0); setRevDiff(3); setRevText(""); setRevTips(""); setRevPhotos([]);
    setShowRev(true);
  }
  function openEditReview(rev) {
    setEditingRev(rev); setRevCourse(rev.course); setRevRating(rev.rating); setRevDiff(rev.difficulty); setRevText(rev.text); setRevTips(rev.tips || ""); setRevPhotos(rev.photos || []);
    setShowRev(true);
  }

  async function handleSubmitReview() {
    if (!revCourse.trim() || revRating === 0 || !revText.trim()) return;
    // Upload photos
    const uploadedPhotos = await Promise.all(
      revPhotos.map(async (ph, i) => {
        if (ph.startsWith("data:")) {
          try { return await uploadPhoto(ph, `reviews/${currentUser.uid}_${Date.now()}_${i}`); } catch { return ph; }
        }
        return ph;
      })
    );
    if (editingRev) {
      await fbSet(`reviews/${editingRev.id}`, { ...editingRev, course: revCourse, rating: revRating, difficulty: revDiff, text: revText, tips: revTips, photos: uploadedPhotos, updatedAt: new Date().toISOString() });
      notify("Avis modifié !");
    } else {
      const id = Date.now().toString();
      await fbSet(`reviews/${id}`, { id, author: currentUser.uid, course: revCourse, rating: revRating, difficulty: revDiff, text: revText, tips: revTips, photos: uploadedPhotos, date: new Date().toLocaleDateString("fr-FR"), createdAt: new Date().toISOString() });
      notify("Avis publié !");
    }
    setShowRev(false);
  }

  async function handleDelReview(id) { await fbDel(`reviews/${id}`); }

  function handleRevPhoto(e) {
    const files = Array.from(e.target.files);
    if (revPhotos.length + files.length > 5) { notify("Maximum 5 photos par avis"); return; }
    files.forEach(f => {
      if (f.size > 10 * 1024 * 1024) { notify("Photo trop lourde (max 10 Mo)"); return; }
      const reader = new FileReader(); reader.onload = ev => setRevPhotos(prev => [...prev, ev.target.result]); reader.readAsDataURL(f);
    });
  }

  // ── DERIVED ──
  const today = new Date().toISOString().split("T")[0];
  const upcoming = slots.filter(s => s.date >= today && (filterActivity === "all" || s.activityType === filterActivity)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = slots.filter(s => s.date < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const stats = {}; reviews.forEach(r => { if (!stats[r.course]) stats[r.course] = { total: 0, count: 0 }; stats[r.course].total += r.rating; stats[r.course].count++; });
  const filtRev = filterCourse === "Tous" ? reviews : reviews.filter(r => r.course === filterCourse);
  const usedActivityTypes = [...new Set(slots.filter(s => s.date >= today).map(s => s.activityType || "parcours"))];
  const myProfile = currentUser ? profiles[currentUser.uid] : null;
  const myUnreadNotifs = notifs.filter(n => n.author !== currentUser?.uid && !n.readBy?.includes(currentUser?.uid));

  // ── LOADING ──
  if (loading) return (
    <>
      <G />
      <div style={{ minHeight: "100vh", background: "#1C4A30", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FairwayLogo variant="light" size="md" />
      </div>
    </>
  );

  // ── LOGIN SCREEN ──
  if (!currentUser || !profiles[currentUser.uid]) return (
    <>
      <G />
      <div style={{ minHeight: "100vh", background: "#1C4A30", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: "400px", width: "100%", animation: "slideUp .4s ease" }}>
          <div style={{ marginBottom: "44px", textAlign: "center" }}>
            <FairwayLogo variant="light" size="md" />
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display: "flex", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              {[["login","Connexion"],["register","Créer un compte"]].map(([m,l]) => (
                <button key={m} onClick={() => { setAuthMode(m); setAuthErr(""); }} style={{ flex: 1, padding: "10px", background: "none", border: "none", borderBottom: `2px solid ${authMode === m ? "#E8EDE8" : "transparent"}`, color: authMode === m ? "#E8EDE8" : "rgba(232,237,232,0.5)", fontSize: "13px", fontWeight: authMode === m ? 500 : 400, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: "-1px" }}>{l}</button>
              ))}
            </div>

            <Fld label="Nom d'utilisateur">
              <input style={{ width: "100%", padding: "11px 14px", borderRadius: T.radiusSm, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#E8EDE8", fontSize: "14px", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                placeholder="Identifiant" value={authUser} onChange={e => setAuthUser(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())}
                autoFocus onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
              />
            </Fld>

            <Fld label="Mot de passe">
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"}
                  style={{ width: "100%", padding: "11px 42px 11px 14px", borderRadius: T.radiusSm, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#E8EDE8", fontSize: "14px", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                  placeholder="••••••••" value={authPw} onChange={e => setAuthPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(232,237,232,0.6)", padding: "2px", display: "flex", alignItems: "center" }}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </Fld>

            {authErr && <div style={{ padding: "10px 12px", background: "rgba(192,57,43,0.25)", color: "#ffb3a7", borderRadius: T.radiusSm, fontSize: "13px", marginBottom: "14px", border: "1px solid rgba(192,57,43,0.4)" }}>{authErr}</div>}

            <button style={{ width: "100%", padding: "13px", borderRadius: T.radiusSm, background: "#E8EDE8", color: "#1C4A30", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={authMode === "login" ? handleLogin : handleRegister}
            >
              {authMode === "login" ? "Se connecter" : "Créer mon compte"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── APP ──
  return (
    <>
      <G />
      <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: "80px" }}>
        {toast && <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: T.text, color: "#fff", padding: "11px 20px", borderRadius: "30px", fontSize: "13px", fontWeight: 500, zIndex: 400, whiteSpace: "nowrap", boxShadow: T.shadowMd, animation: "toastIn .25s cubic-bezier(0.34,1.56,0.64,1)", fontFamily: "'DM Sans',sans-serif" }}>{toast}</div>}
        {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.index} onClose={() => setLightbox(null)} onNav={d => setLightbox(lb => ({ ...lb, index: (lb.index + d + lb.photos.length) % lb.photos.length }))} />}

        {/* HEADER */}
        <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "56px" }}>
              <FairwayLogo variant="dark" size="sm" />
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {tab !== "profile" && (
                  <Btn variant="primary" style={{ padding: "7px 14px", fontSize: "13px" }} onClick={() => tab === "slots" ? setShowSlot(true) : openNewReview()}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                    {tab === "slots" ? "Créneau" : "Avis"}
                  </Btn>
                )}
                {/* Cloche */}
                <button onClick={() => {
                  setShowNotifs(v => !v);
                  if (myUnreadNotifs.length > 0) {
                    myUnreadNotifs.forEach(n => updateDoc(doc(db, `notifs/${n.id}`), { readBy: arrayUnion(currentUser.uid) }));
                  }
                }} style={{ position: "relative", background: "none", border: "none", padding: "6px", cursor: "pointer", borderRadius: "8px", color: T.textMid }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {myUnreadNotifs.length > 0 && <span style={{ position: "absolute", top: "2px", right: "2px", background: T.accent, color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.surface}` }}>{myUnreadNotifs.length > 9 ? "9+" : myUnreadNotifs.length}</span>}
                </button>
                <button onClick={() => setTab("profile")} style={{ background: "none", border: "none", padding: "2px", cursor: "pointer", borderRadius: "50%" }}>
                  <Ava profile={myProfile} size={32} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex" }}>
              {[["profile","Profil"],["slots","Créneaux"],["reviews","Avis"]].map(([t,l]) => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "11px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? T.accent : "transparent"}`, color: tab === t ? T.accent : T.textMid, fontSize: "13px", fontWeight: tab === t ? 500 : 400, cursor: "pointer", transition: "all .15s", fontFamily: "'DM Sans',sans-serif" }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Panneau notifs */}
          {showNotifs && (
            <div style={{ position: "absolute", top: "100%", right: "16px", width: "min(360px,calc(100vw - 32px))", background: T.surface, borderRadius: T.radius, boxShadow: "0 8px 32px rgba(26,23,20,0.18)", border: `1px solid ${T.border}`, zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 500, color: T.text }}>Notifications</span>
                <button onClick={() => setShowNotifs(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textLight, fontSize: "18px" }}>×</button>
              </div>
              {notifs.length === 0
                ? <div style={{ padding: "28px 18px", textAlign: "center", color: T.textLight, fontSize: "13px" }}>Aucune notification</div>
                : <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {notifs.map(n => {
                      const act = ACTIVITY_TYPES.find(a => a.id === n.type) || ACTIVITY_TYPES[0];
                      const isUnread = !n.readBy?.includes(currentUser.uid) && n.author !== currentUser.uid;
                      const timeAgo = (() => { const diff = Date.now() - new Date(n.createdAt).getTime(); const m = Math.floor(diff / 60000); if (m < 1) return "À l'instant"; if (m < 60) return `Il y a ${m} min`; const h = Math.floor(m / 60); if (h < 24) return `Il y a ${h}h`; return `Il y a ${Math.floor(h / 24)}j`; })();
                      return (
                        <div key={n.id} onClick={() => { setShowNotifs(false); setTab("slots"); }} style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: "12px", alignItems: "flex-start", background: isUnread ? T.accentLight : "transparent", cursor: "pointer" }}>
                          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: act.colorLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{act.icon(act.color)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "13px", color: T.text, lineHeight: 1.45, margin: 0 }}>{n.text}</p>
                            <span style={{ fontSize: "11px", color: T.textLight, marginTop: "4px", display: "block" }}>{timeAgo}</span>
                          </div>
                          {isUnread && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: T.accent, flexShrink: 0, marginTop: "5px" }} />}
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}
        </header>

        <main style={{ maxWidth: "680px", margin: "0 auto", padding: "28px 16px", position: "relative" }}>

          {/* ══ SLOTS ══ */}
          {tab === "slots" && (
            <div style={{ animation: "slideUp .2s ease" }}>
              {/* Fond photo */}
              <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
                <div style={{ position: "absolute", inset: 0, background: T.bg }} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 500, color: T.text }}>Créneaux</h2>
                  {upcoming.length > 0 && <span style={{ fontSize: "12px", color: T.textLight }}>{upcoming.length} à venir</span>}
                </div>
                {usedActivityTypes.length > 1 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
                    <button onClick={() => setFilterActivity("all")} style={{ padding: "5px 13px", borderRadius: "20px", fontSize: "12px", fontWeight: filterActivity === "all" ? 500 : 400, border: `1.5px solid ${filterActivity === "all" ? T.accent : T.border}`, background: filterActivity === "all" ? T.accentLight : T.surface, color: filterActivity === "all" ? T.accent : T.textMid, cursor: "pointer" }}>Tous</button>
                    {usedActivityTypes.map(id => { const act = ACTIVITY_TYPES.find(a => a.id === id) || ACTIVITY_TYPES[0]; return (
                      <button key={id} onClick={() => setFilterActivity(filterActivity === id ? "all" : id)} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 13px", borderRadius: "20px", fontSize: "12px", fontWeight: filterActivity === id ? 500 : 400, border: `1.5px solid ${filterActivity === id ? act.color : T.border}`, background: filterActivity === id ? act.colorLight : T.surface, color: filterActivity === id ? act.color : T.textMid, cursor: "pointer" }}>
                        {act.icon(filterActivity === id ? act.color : T.textLight)}{act.label}
                      </button>
                    );})}
                  </div>
                )}
                {upcoming.length === 0 && (
                  <div style={{ textAlign: "center", padding: "64px 20px" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.border} strokeWidth="1.5" style={{ display: "block", margin: "0 auto 14px" }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", color: T.textMid, marginBottom: "6px" }}>Aucun créneau à venir</p>
                    <p style={{ fontSize: "13px", color: T.textLight }}>Proposez une activité à l'équipe !</p>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {upcoming.map(s => <SlotCard key={s.id} slot={s} profiles={profiles} currentUser={currentUser} onJoin={handleJoin} onLeave={handleLeave} onDelete={handleDelSlot} />)}
                </div>
                {past.length > 0 && (
                  <div style={{ marginTop: "40px" }}>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 500, color: T.text, marginBottom: "14px" }}>Sessions passées</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {past.map(s => {
                        const act = ACTIVITY_TYPES.find(a => a.id === s.activityType) || ACTIVITY_TYPES[0];
                        return (
                          <div key={s.id} style={{ background: T.surface, borderRadius: T.radius, border: `1.5px solid ${T.border}`, padding: "16px 20px", boxShadow: T.shadow }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: act.colorLight, borderRadius: "6px", padding: "2px 8px", marginBottom: "6px" }}>
                              {act.icon(act.color)}<span style={{ fontSize: "10px", fontWeight: 600, color: act.color }}>{act.label}</span>
                            </div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", color: T.text }}>{s.activityType === "parcours" && s.course ? s.course.split(" – ")[0] : act.label}</div>
                            <div style={{ fontSize: "12px", color: T.textLight, marginTop: "3px" }}>{formatDate(s.date)} · {s.participants.map(uid => profiles[uid]?.firstName || uid).join(", ")}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ REVIEWS ══ */}
          {tab === "reviews" && (
            <div style={{ animation: "slideUp .2s ease" }}>
              {/* Bannière */}
              <div style={{ position: "relative", borderRadius: T.radius, overflow: "hidden", marginBottom: "24px", height: "180px" }}>
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1C4A30, #3D7A57)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,23,20,0.1) 0%, rgba(26,23,20,0.5) 100%)" }} />
                <div style={{ position: "absolute", bottom: "20px", left: "22px" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 500, color: "#fff" }}>Avis & Parcours</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginTop: "4px", letterSpacing: "0.05em" }}>Partagez vos retours avec l'équipe</div>
                </div>
              </div>

              {Object.keys(stats).length > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 500, color: T.text }}>Parcours notés</h2>
                    <span style={{ fontSize: "12px", color: T.textLight }}>{Object.keys(stats).length} parcours</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: "10px", marginBottom: "24px" }}>
                    {Object.entries(stats).map(([course, { total, count }]) => (
                      <div key={course} onClick={() => setFilter(filterCourse === course ? "Tous" : course)} className="chover" style={{ background: filterCourse === course ? T.accentLight : T.surface, border: `1.5px solid ${filterCourse === course ? T.accent : T.border}`, borderRadius: T.radius, padding: "14px", cursor: "pointer", boxShadow: T.shadow }}>
                        <div style={{ fontSize: "10px", color: T.textLight, marginBottom: "4px", fontWeight: 500 }}>{count} avis</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "13px", color: T.text, lineHeight: 1.3, marginBottom: "8px" }}>{course.split(" – ")[0]}</div>
                        <Stars value={Math.round(total / count)} size={13} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {Object.keys(stats).length > 1 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
                  <button onClick={() => setFilter("Tous")} style={{ padding: "5px 13px", borderRadius: "20px", fontSize: "12px", fontWeight: filterCourse === "Tous" ? 500 : 400, border: `1.5px solid ${filterCourse === "Tous" ? T.accent : T.border}`, background: filterCourse === "Tous" ? T.accentLight : T.surface, color: filterCourse === "Tous" ? T.accent : T.textMid, cursor: "pointer" }}>Tous</button>
                  {Object.keys(stats).map(c => <button key={c} onClick={() => setFilter(filterCourse === c ? "Tous" : c)} style={{ padding: "5px 13px", borderRadius: "20px", fontSize: "12px", fontWeight: filterCourse === c ? 500 : 400, border: `1.5px solid ${filterCourse === c ? T.accent : T.border}`, background: filterCourse === c ? T.accentLight : T.surface, color: filterCourse === c ? T.accent : T.textMid, cursor: "pointer" }}>{c.split(" – ")[0]}</button>)}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 500, color: T.text }}>Avis</h2>
                <span style={{ fontSize: "12px", color: T.textLight }}>{filtRev.length} avis</span>
              </div>
              {filtRev.length === 0 && (
                <div style={{ textAlign: "center", padding: "64px 20px" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.border} strokeWidth="1.5" style={{ display: "block", margin: "0 auto 14px" }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", color: T.textMid, marginBottom: "6px" }}>Aucun avis pour l'instant</p>
                  <p style={{ fontSize: "13px", color: T.textLight }}>Partagez votre retour sur un parcours !</p>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filtRev.map(r => <ReviewCard key={r.id} rev={r} profiles={profiles} currentUser={currentUser} onDelete={handleDelReview} onEdit={openEditReview} onLightbox={(ph, i) => setLightbox({ photos: ph, index: i })} />)}
              </div>
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {tab === "profile" && (
            <ProfileTab currentUser={currentUser} profiles={profiles} onSave={handleSaveProfile} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} notify={notify} />
          )}
        </main>

        {/* ── MODAL CRÉNEAU ── */}
        <Modal open={showSlot} onClose={() => setShowSlot(false)} title="Proposer un créneau">
          <Fld label="Type d'activité">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {ACTIVITY_TYPES.map(act => (
                <button key={act.id} onClick={() => setSlotActivity(act.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: T.radiusSm, border: `1.5px solid ${slotActivity === act.id ? act.color : T.border}`, background: slotActivity === act.id ? act.colorLight : T.surface, cursor: "pointer", textAlign: "left" }}>
                  {act.icon(slotActivity === act.id ? act.color : T.textLight)}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: slotActivity === act.id ? 600 : 400, color: slotActivity === act.id ? act.color : T.text }}>{act.label}</div>
                    <div style={{ fontSize: "11px", color: T.textLight }}>{act.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Fld>
          {ACTIVITY_TYPES.find(a => a.id === slotActivity)?.hasCourse && (
            <Fld label="Parcours"><CourseSel value={slotCourse} onChange={setSlotCourse} /></Fld>
          )}
          {!ACTIVITY_TYPES.find(a => a.id === slotActivity)?.hasCourse && slotActivity !== "cours" && slotActivity !== "terrasse" && (
            <Fld label="Lieu (optionnel)"><Inp value={slotLocation} onChange={e => setSlotLocation(e.target.value)} placeholder="Practice du club, putting green…" /></Fld>
          )}
          {slotActivity === "terrasse" && (
            <Fld label="Lieu"><Inp value={slotLocation} onChange={e => setSlotLocation(e.target.value)} placeholder="Le Bar du Golf, terrasse du club…" /></Fld>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Fld label="Date"><Inp type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} /></Fld>
            <Fld label="Heure"><Inp type="time" value={slotTime} onChange={e => setSlotTime(e.target.value)} /></Fld>
          </div>
          {ACTIVITY_TYPES.find(a => a.id === slotActivity)?.hasMaxPlayers !== false && (
            <Fld label={`Joueurs max : ${slotMax}`}>
              <input type="range" min="2" max="8" value={slotMax} onChange={e => setSlotMax(parseInt(e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.textLight, marginTop: "3px" }}>
                {[2,3,4,5,6,7,8].map(n => <span key={n}>{n}</span>)}
              </div>
            </Fld>
          )}
          <Fld label="Note (optionnel)"><Txta value={slotNote} onChange={e => setSlotNote(e.target.value)} placeholder="Rendez-vous au parking à 8h30…" rows={2} /></Fld>
          <Btn variant="primary" style={{ width: "100%", justifyContent: "center", padding: "13px", marginTop: "4px" }} onClick={handleAddSlot}>Proposer le créneau</Btn>
        </Modal>

        {/* ── MODAL AVIS ── */}
        <Modal open={showRev} onClose={() => setShowRev(false)} title={editingRev ? "Modifier l'avis" : "Nouvel avis"}>
          <Fld label="Parcours"><CourseSel value={revCourse} onChange={setRevCourse} /></Fld>
          <Fld label="Note">
            <Stars value={revRating} size={28} onChange={setRevRating} />
          </Fld>
          <Fld label="Difficulté">
            <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
              {[1,2,3,4,5].map(d => (
                <div key={d} onClick={() => setRevDiff(d)} style={{ flex: 1, height: "6px", borderRadius: "3px", background: d <= revDiff ? T.accent : T.border, cursor: "pointer", transition: "background .15s" }} />
              ))}
            </div>
            <span style={{ fontSize: "12px", color: T.accent }}>{DIFFICULTY_LABELS[revDiff]}</span>
          </Fld>
          <Fld label="Mon avis"><Txta value={revText} onChange={e => setRevText(e.target.value)} placeholder="Partage ton expérience sur ce parcours…" rows={4} /></Fld>
          <Fld label="Conseil (optionnel)"><Txta value={revTips} onChange={e => setRevTips(e.target.value)} placeholder="Un conseil pour bien jouer ce parcours…" rows={2} /></Fld>
          <Fld label={`Photos (${revPhotos.length}/5)`}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              {revPhotos.map((ph, i) => (
                <div key={i} style={{ position: "relative", width: "70px", height: "70px", borderRadius: T.radiusSm, overflow: "hidden" }}>
                  <img src={ph} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => setRevPhotos(prev => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "18px", height: "18px", color: "#fff", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
              {revPhotos.length < 5 && (
                <label style={{ width: "70px", height: "70px", borderRadius: T.radiusSm, border: `1.5px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textLight }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
                  <input type="file" accept="image/*" multiple onChange={handleRevPhoto} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </Fld>
          <Btn variant="primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={handleSubmitReview}>
            {editingRev ? "Enregistrer les modifications" : "Publier l'avis"}
          </Btn>
        </Modal>
      </div>
    </>
  );
}
