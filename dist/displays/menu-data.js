// RAVINTOLA BABYLON — display menu data
// Transcribed and verified against Babylon_menu.pdf (Jan 2026 menu)
// Prices in EUR: norm = normaali, perhe = perhekoko. All pizzas are (L).

const PIZZAS = [
  { img: "buffalo-margarita.jpg", name: "Buffalo margarita", desc: "Basilika, mozzarella",                                                        norm: "10,50", perhe: "17,50" },
  { img: "bresaola.jpg",          name: "Bresaola pizza",    desc: "Vihannekset, rucola, kuivattua naudanlihaa",                                   norm: "13,50", perhe: "20,50" },
  { img: "smoked-salmon.jpg",     name: "Smoked salmon pizza", desc: "Kylmäsavulohi, smetana, capers",                                             norm: "15,50", perhe: "22,50" },
  { img: "super-supreme.jpg",     name: "Super supreme pizza", desc: "Kana, sipuli, olivi, paprikka, mozzarella",                                  norm: "13,50", perhe: "20,50" },
  { img: "juusto.jpg",            name: "Juusto pizza",      desc: "Aurajuusto, juustokuutiosalaatti, tomaatti, 5 kpl mozzarella sticks, cheddar-kastike", norm: "15,50", perhe: "22,50" },
  { img: "joes.jpg",              name: "Joe’s pizza",       desc: "Pepperoni, herkkusieni, truffeliöljy",                                         norm: "14,50", perhe: "22,00" },
  { img: "piccolo-mondo.jpg",     name: "Piccolo mondo",     desc: "Suguk-makkara, kananmuna, tomaatti, jalapeño",                                 norm: "14,50", perhe: "22,00" },
  { img: "lucca.jpg",             name: "Lucca pizza",       desc: "Kebab, sipuli, ranskalaiset, salaatti, paprikamajoneesi",                     norm: "14,50", perhe: "21,00" },
  { img: "americano.jpg",         name: "Americano",         desc: "Pizzasuikale, ananas, aurajuusto",                                             norm: "13,50", perhe: "21,00" },
  { img: "babylon.jpg",           name: "Babylon pizza",     desc: "Kebab, salami, sipuli, kana-bekoni, jalapeño, pepperonimakkara",               norm: "14,50", perhe: "21,00" }
];

// Build-your-own pizza pricing (Norm. … Perhe.)
const OMA_PIZZA = [
  { name: "1 täyte",        norm: "11,50", perhe: "19,50" },
  { name: "2 täytettä",     norm: "12,50", perhe: "21,50" },
  { name: "3 täytettä",     norm: "13,50", perhe: "22,50" },
  { name: "4 täytettä",     norm: "14,50", perhe: "24,50" },
  { name: "Lisätäytteet",   norm: "1,50",  perhe: "2,50"  }
];

const TAYTTEET = {
  "Liha & kana":  ["Kebab", "Pizzasuikale", "Salami", "Pepperoni", "Jauheliha", "Kana", "Kana-pekoni"],
  "Merenelävät":  ["Katkarapu", "Simpukka", "Savulohi"],
  "Vihannekset":  ["Jalapeño", "Sipuli", "Tomaatti", "Kirsikkatomaatti", "Tuore herkkusieni", "Tuore paprika", "Vihreä pepperoni", "Suolakurkku", "Oliivi", "Jäävuorisalaatti", "Ananas"],
  "Juustot":      ["Mozzarellajuusto", "Vuohenjuusto", "Cheddarjuusto", "Juustokuutio"],
  "Kastikkeet":   ["Smetana", "Majoneesi", "Talon majoneesi", "BBQ-kastike", "Tacokastike", "Valkokastike", "Pesto", "Valkosipulikerma", "Tahini", "Mango", "Hot-kastike"],
  "Lisäkkeet":    ["Kananmuna", "Ranskalaiset (3,50 €)", "Rucola"]
};

const ANNOKSET = [
  { name: "Rulla kebab / kana", price: "12,50", desc: "Lisätäytteet: juusto, kuutiosalaatti, aura, jalapeño – 1,50 €/kpl" },
  { name: "Pitaleipä",          price: "11,50", desc: "Lisätäytteet: juusto, kuutiosalaatti, aura, jalapeño – 1,50 €/kpl" },
  { name: "Kanashawarma",       price: "10,50", desc: "Sisältää: kana, valkosipulikerma, suolakurkku + ranskalaiset" },
  { name: "Kebab-annos",        price: "11,50", desc: "Lisuke: riisi, ranskalaiset tai kermaperunat · lisätäytteet 1,50 €/kpl" },
  { name: "Kana döner / kanafilee-annos", price: "11,50", desc: "Lisuke: riisi, ranskalaiset tai kermaperunat · lisätäytteet 1,50 €/kpl" },
  { name: "Kanakori (4 kpl)",   price: "12,50", desc: "Sisältää: ranskalaiset, mozzarella sticks, sipulirenkaat" }
];

const SIPIT = [
  { name: "Sipit 10 kpl", price: "10,50" },
  { name: "Sipit 16 kpl", price: "14,50" },
  { name: "Sipit 20 kpl", price: "17,50" }
];
const SIPIT_NOTE = "Kastikkeet: Hot, BBQ, valkosipulikerma, mango · kaikki sisältävät ranskalaiset";

const BURGERIT = [
  { name: "Burger-annos", price: "11,50", desc: "180 g pihvi, sipuli, tomaatti · Ateria +3,00 €" },
  { name: "Kana-burger",  price: "7,50",  desc: "Ateria +3,00 €" }
];

const MUUT = [
  { name: "Tuplaliha", price: "+5,00" }
];
