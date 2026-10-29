export type Separability = "unlikely" | "possible-with-labels";

export type CropGroup = {
  id: string;
  name: string;
  note: string;
};

export type Crop = {
  id: string;
  name: string;
  local: string;
  scientific: string;
  groupId: string;
  parentId?: string;
  covered?: boolean;
  separability: Separability;
  /** Wikimedia search hints used only by the photo pipeline. */
  search: string;
};

export const groups: CropGroup[] = [
  {
    id: "highland-veg",
    name: "Highland & temperate vegetables",
    note: "At 10 m these crops share a short, dense canopy. Cabbage, potato and carrot cannot be separated from each other at 90% with Sentinel-2 alone. Elevation and season can suggest the group, not the species. Plastic roofs should be flagged as covered, not guessed.",
  },
  {
    id: "lowland-veg",
    name: "Lowland & semi-temperate vegetables",
    note: "Mixed gardens and trellised crops (beans, ampalaya, sayote) collapse into a few pixels. Species labels need field boundaries and ground photos. Do not treat a green pixel as a named vegetable.",
  },
  {
    id: "grains",
    name: "Grains, cereals & root crops",
    note: "Irrigated palay can show a flood-then-green pattern, especially with Sentinel-1, but that model is not trained here. Heirloom versus modern rice, and white versus yellow corn, are not separable at 10 m. Root crops spend much of the season as low or mixed cover.",
  },
  {
    id: "fruits",
    name: "Fruits & berries",
    note: "Tree crops look like other woody cover. Banana and pineapple are more distinctive in uniform lowland blocks, still only with labels. Strawberries in Benguet are often under plastic; flag covered instead of naming the fruit. Variety (Saba versus Lakatan) is not visible at 10 m.",
  },
  {
    id: "plantation",
    name: "Plantation & industrial crops",
    note: "Coffee under pine or alnus is a woody understory and is easy to confuse with forest. Coconut, rubber and sugarcane are scarce or patchy in CAR. Species and variety labels are withheld.",
  },
  {
    id: "flowers",
    name: "Cut flowers",
    note: "Roses, mums, anthuriums and gladiolas in Benguet are commonly grown under plastic or shade. A bright roof is a covered surface, not a flower species.",
  },
];

export const crops: Crop[] = [
  { id: "cabbage", name: "Cabbage", local: "Repolyo", scientific: "Brassica oleracea var. capitata", groupId: "highland-veg", separability: "unlikely", search: "cabbage Brassica oleracea capitata" },
  { id: "wombok", name: "Chinese cabbage", local: "Wombok", scientific: "Brassica rapa subsp. pekinensis", groupId: "highland-veg", separability: "unlikely", search: "napa cabbage Brassica rapa pekinensis" },
  { id: "carrot", name: "Carrot", local: "Karot", scientific: "Daucus carota", groupId: "highland-veg", separability: "unlikely", search: "carrot Daucus carota roots" },
  { id: "potato", name: "White potato", local: "Patatas", scientific: "Solanum tuberosum", groupId: "highland-veg", separability: "unlikely", search: "potato Solanum tuberosum plant" },
  { id: "broccoli", name: "Broccoli", local: "Brokoli", scientific: "Brassica oleracea var. italica", groupId: "highland-veg", separability: "unlikely", search: "broccoli Brassica oleracea italica" },
  { id: "cauliflower", name: "Cauliflower", local: "Koliplawer", scientific: "Brassica oleracea var. botrytis", groupId: "highland-veg", separability: "unlikely", search: "cauliflower Brassica oleracea botrytis" },
  { id: "lettuce", name: "Lettuce", local: "Letsugas", scientific: "Lactuca sativa", groupId: "highland-veg", separability: "unlikely", search: "lettuce Lactuca sativa" },
  { id: "celery", name: "Celery", local: "Kintsay", scientific: "Apium graveolens", groupId: "highland-veg", separability: "unlikely", search: "celery Apium graveolens" },
  { id: "leek", name: "Leek", local: "Leek", scientific: "Allium ampeloprasum", groupId: "highland-veg", separability: "unlikely", search: "leek Allium ampeloprasum" },
  { id: "scallion", name: "Scallion", local: "Dahon ng sibuyas", scientific: "Allium fistulosum", groupId: "highland-veg", separability: "unlikely", search: "scallion Allium fistulosum" },
  { id: "radish", name: "Radish", local: "Labanos", scientific: "Raphanus sativus", groupId: "highland-veg", separability: "unlikely", search: "radish Raphanus sativus" },
  { id: "bell-pepper", name: "Bell pepper", local: "Atsal", scientific: "Capsicum annuum", groupId: "highland-veg", covered: true, separability: "unlikely", search: "bell pepper Capsicum annuum" },
  { id: "snap-pea", name: "Snap pea", local: "Sitsaro", scientific: "Pisum sativum", groupId: "highland-veg", separability: "unlikely", search: "snap pea Pisum sativum" },
  { id: "chayote", name: "Chayote", local: "Sayote", scientific: "Sicyos edulis", groupId: "lowland-veg", separability: "unlikely", search: "chayote Sechium edule fruit" },
  { id: "baguio-bean", name: "Snap bean", local: "Baguio beans", scientific: "Phaseolus vulgaris", groupId: "lowland-veg", separability: "unlikely", search: "common bean Phaseolus vulgaris pods" },
  { id: "tomato", name: "Tomato", local: "Kamatis", scientific: "Solanum lycopersicum", groupId: "lowland-veg", separability: "unlikely", search: "tomato Solanum lycopersicum" },
  { id: "eggplant", name: "Eggplant", local: "Talong", scientific: "Solanum melongena", groupId: "lowland-veg", separability: "unlikely", search: "eggplant Solanum melongena" },
  { id: "ampalaya", name: "Bitter gourd", local: "Ampalaya", scientific: "Momordica charantia", groupId: "lowland-veg", separability: "unlikely", search: "bitter gourd Momordica charantia" },
  { id: "upo", name: "Bottle gourd", local: "Upo", scientific: "Lagenaria siceraria", groupId: "lowland-veg", separability: "unlikely", search: "bottle gourd Lagenaria siceraria" },
  { id: "squash", name: "Squash", local: "Kalabasa", scientific: "Cucurbita moschata", groupId: "lowland-veg", separability: "unlikely", search: "squash Cucurbita moschata" },
  { id: "okra", name: "Okra", local: "Okra", scientific: "Abelmoschus esculentus", groupId: "lowland-veg", separability: "unlikely", search: "okra Abelmoschus esculentus" },
  { id: "ginger", name: "Ginger", local: "Luya", scientific: "Zingiber officinale", groupId: "lowland-veg", separability: "unlikely", search: "ginger Zingiber officinale" },
  { id: "garlic", name: "Garlic", local: "Bawang", scientific: "Allium sativum", groupId: "lowland-veg", separability: "unlikely", search: "garlic Allium sativum bulbs" },
  { id: "onion", name: "Onion", local: "Sibuyas", scientific: "Allium cepa", groupId: "lowland-veg", separability: "unlikely", search: "onion Allium cepa" },
  { id: "mung", name: "Mung bean", local: "Monggo", scientific: "Vigna radiata", groupId: "lowland-veg", separability: "unlikely", search: "mung bean Vigna radiata" },
  { id: "palay", name: "Rice", local: "Palay", scientific: "Oryza sativa", groupId: "grains", separability: "possible-with-labels", search: "rice paddy Oryza sativa" },
  { id: "heirloom-rice", name: "Heirloom rice", local: "Palay", scientific: "Oryza sativa", groupId: "grains", parentId: "palay", separability: "unlikely", search: "heirloom rice Cordillera Philippines" },
  { id: "corn", name: "Corn", local: "Mais", scientific: "Zea mays", groupId: "grains", separability: "possible-with-labels", search: "maize Zea mays field" },
  { id: "corn-white", name: "White corn", local: "Mais na puti", scientific: "Zea mays", groupId: "grains", parentId: "corn", separability: "unlikely", search: "white corn maize ear" },
  { id: "corn-yellow", name: "Yellow corn", local: "Mais na dilaw", scientific: "Zea mays", groupId: "grains", parentId: "corn", separability: "unlikely", search: "yellow corn maize ear" },
  { id: "camote", name: "Sweet potato", local: "Kamote", scientific: "Ipomoea batatas", groupId: "grains", separability: "unlikely", search: "sweet potato Ipomoea batatas" },
  { id: "gabi", name: "Taro", local: "Gabi", scientific: "Colocasia esculenta", groupId: "grains", separability: "unlikely", search: "taro Colocasia esculenta" },
  { id: "cassava", name: "Cassava", local: "Kamoteng kahoy", scientific: "Manihot esculenta", groupId: "grains", separability: "unlikely", search: "cassava Manihot esculenta" },
  { id: "ube", name: "Yam", local: "Ube", scientific: "Dioscorea alata", groupId: "grains", separability: "unlikely", search: "purple yam Dioscorea alata" },
  { id: "strawberry", name: "Strawberry", local: "Strawberry", scientific: "Fragaria × ananassa", groupId: "fruits", covered: true, separability: "unlikely", search: "strawberry Fragaria fruit" },
  { id: "banana", name: "Banana", local: "Saging", scientific: "Musa", groupId: "fruits", separability: "possible-with-labels", search: "banana Musa fruit plant" },
  { id: "banana-saba", name: "Saba banana", local: "Saba", scientific: "Musa × paradisiaca", groupId: "fruits", parentId: "banana", separability: "unlikely", search: "saba banana Philippines" },
  { id: "banana-lakatan", name: "Lakatan banana", local: "Lakatan", scientific: "Musa acuminata", groupId: "fruits", parentId: "banana", separability: "unlikely", search: "lakatan banana" },
  { id: "citrus", name: "Citrus", local: "Citrus", scientific: "Citrus", groupId: "fruits", separability: "unlikely", search: "citrus fruit tree" },
  { id: "calamansi", name: "Calamansi", local: "Kalamansi", scientific: "Citrus × microcarpa", groupId: "fruits", parentId: "citrus", separability: "unlikely", search: "calamansi Citrus microcarpa" },
  { id: "mandarin", name: "Mandarin", local: "Dalanghita", scientific: "Citrus reticulata", groupId: "fruits", parentId: "citrus", separability: "unlikely", search: "mandarin orange Citrus reticulata" },
  { id: "orange", name: "Orange", local: "Dalandan", scientific: "Citrus × sinensis", groupId: "fruits", parentId: "citrus", separability: "unlikely", search: "orange fruit Citrus sinensis" },
  { id: "lemon", name: "Lemon", local: "Limon", scientific: "Citrus × limon", groupId: "fruits", parentId: "citrus", separability: "unlikely", search: "lemon Citrus limon" },
  { id: "mango", name: "Mango", local: "Mangga", scientific: "Mangifera indica", groupId: "fruits", separability: "unlikely", search: "mango Mangifera indica" },
  { id: "pineapple", name: "Pineapple", local: "Pinya", scientific: "Ananas comosus", groupId: "fruits", separability: "possible-with-labels", search: "pineapple Ananas comosus" },
  { id: "papaya", name: "Papaya", local: "Papaya", scientific: "Carica papaya", groupId: "fruits", separability: "unlikely", search: "papaya Carica papaya" },
  { id: "lanzones", name: "Lanzones", local: "Lansones", scientific: "Lansium domesticum", groupId: "fruits", separability: "unlikely", search: "lanzones Lansium domesticum" },
  { id: "rambutan", name: "Rambutan", local: "Rambutan", scientific: "Nephelium lappaceum", groupId: "fruits", separability: "unlikely", search: "rambutan Nephelium lappaceum" },
  { id: "watermelon", name: "Watermelon", local: "Pakwan", scientific: "Citrullus lanatus", groupId: "fruits", separability: "unlikely", search: "watermelon Citrullus lanatus" },
  { id: "coffee", name: "Coffee", local: "Kape", scientific: "Coffea", groupId: "plantation", separability: "unlikely", search: "coffee Coffea cherries" },
  { id: "coffee-arabica", name: "Arabica coffee", local: "Arabica", scientific: "Coffea arabica", groupId: "plantation", parentId: "coffee", separability: "unlikely", search: "Coffea arabica cherries" },
  { id: "coffee-robusta", name: "Robusta coffee", local: "Robusta", scientific: "Coffea canephora", groupId: "plantation", parentId: "coffee", separability: "unlikely", search: "Coffea canephora robusta" },
  { id: "coffee-excelsa", name: "Excelsa coffee", local: "Excelsa", scientific: "Coffea liberica var. dewevrei", groupId: "plantation", parentId: "coffee", separability: "unlikely", search: "Coffea excelsa" },
  { id: "coffee-liberica", name: "Liberica coffee", local: "Liberica", scientific: "Coffea liberica", groupId: "plantation", parentId: "coffee", separability: "unlikely", search: "Coffea liberica" },
  { id: "tobacco", name: "Tobacco", local: "Tabako", scientific: "Nicotiana tabacum", groupId: "plantation", separability: "unlikely", search: "tobacco Nicotiana tabacum" },
  { id: "tobacco-virginia", name: "Virginia tobacco", local: "Virginia", scientific: "Nicotiana tabacum", groupId: "plantation", parentId: "tobacco", separability: "unlikely", search: "virginia tobacco leaf" },
  { id: "tobacco-native", name: "Native tobacco", local: "Native", scientific: "Nicotiana tabacum", groupId: "plantation", parentId: "tobacco", separability: "unlikely", search: "native tobacco Philippines" },
  { id: "sugarcane", name: "Sugarcane", local: "Tubo", scientific: "Saccharum officinarum", groupId: "plantation", separability: "possible-with-labels", search: "sugarcane Saccharum officinarum" },
  { id: "tiger-grass", name: "Tiger grass", local: "Buy-o", scientific: "Thysanolaena latifolia", groupId: "plantation", separability: "unlikely", search: "Thysanolaena latifolia tiger grass" },
  { id: "cacao", name: "Cacao", local: "Kakaw", scientific: "Theobroma cacao", groupId: "plantation", separability: "unlikely", search: "cacao Theobroma cacao pods" },
  { id: "cashew", name: "Cashew", local: "Kasoy", scientific: "Anacardium occidentale", groupId: "plantation", separability: "unlikely", search: "cashew Anacardium occidentale" },
  { id: "coconut", name: "Coconut", local: "Niyog", scientific: "Cocos nucifera", groupId: "plantation", separability: "possible-with-labels", search: "coconut Cocos nucifera" },
  { id: "rubber", name: "Rubber", local: "Goma", scientific: "Hevea brasiliensis", groupId: "plantation", separability: "unlikely", search: "rubber Hevea brasiliensis" },
  { id: "rose", name: "Rose", local: "Rosas", scientific: "Rosa", groupId: "flowers", covered: true, separability: "unlikely", search: "garden rose Rosa flower" },
  { id: "chrysanthemum", name: "Chrysanthemum", local: "Krisantemo", scientific: "Chrysanthemum", groupId: "flowers", covered: true, separability: "unlikely", search: "chrysanthemum flower" },
  { id: "anthurium", name: "Anthurium", local: "Anthurium", scientific: "Anthurium andraeanum", groupId: "flowers", covered: true, separability: "unlikely", search: "anthurium flower" },
  { id: "gladiolus", name: "Gladiolus", local: "Gladiola", scientific: "Gladiolus", groupId: "flowers", covered: true, separability: "unlikely", search: "gladiolus flower" },
];

export function groupById(id: string): CropGroup | undefined {
  return groups.find((group) => group.id === id);
}

export function cropById(id: string): Crop | undefined {
  return crops.find((crop) => crop.id === id);
}
