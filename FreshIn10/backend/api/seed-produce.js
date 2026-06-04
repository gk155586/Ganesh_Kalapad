// Run: node seed-produce.js
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const V = "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400"; // veg
const F = "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400"; // fruit

const vegs = [
  ["Cauliflower","cauliflower",25,35,"500g"],["Cabbage","cabbage",20,30,"1pc"],
  ["Bhindi (Lady Finger)","bhindi",30,40,"500g"],["Green Beans","green-beans",35,45,"500g"],
  ["Garlic","garlic",40,55,"250g"],["Ginger","ginger",35,50,"250g"],
  ["Green Chilli","green-chilli",15,22,"100g"],["Fresh Peas","fresh-peas",45,60,"500g"],
  ["Brinjal (Eggplant)","brinjal",22,30,"500g"],["Bitter Gourd (Karela)","bitter-gourd",28,38,"500g"],
  ["Bottle Gourd (Lauki)","bottle-gourd",18,25,"1pc"],["Ridge Gourd (Turai)","ridge-gourd",22,30,"500g"],
  ["Snake Gourd","snake-gourd",20,28,"500g"],["Pumpkin","pumpkin",18,25,"500g"],
  ["Sweet Potato","sweet-potato",30,42,"500g"],["Radish (Mooli)","radish",15,20,"500g"],
  ["Beetroot","beetroot",28,38,"500g"],["Corn on Cob","corn-cob",15,20,"1pc"],
  ["Drumstick (Moringa)","drumstick",25,35,"250g"],["Spring Onion","spring-onion",15,22,"100g"],
  ["Celery","celery",45,60,"250g"],["Lettuce","lettuce",35,50,"250g"],
  ["Kale","kale",45,65,"200g"],["Methi (Fenugreek)","methi",15,22,"250g"],
  ["Fresh Coriander","fresh-coriander",10,15,"100g"],["Fresh Mint","fresh-mint",10,15,"50g"],
  ["Curry Leaves","curry-leaves",8,12,"50g"],["Mustard Greens (Sarson)","mustard-greens",18,25,"250g"],
  ["Amaranth (Chaulai)","amaranth",20,28,"250g"],["Brussels Sprouts","brussels-sprouts",65,90,"250g"],
  ["Zucchini","zucchini",45,60,"500g"],["Butternut Squash","butternut-squash",35,48,"500g"],
  ["Ivy Gourd (Tindora)","tindora",25,35,"500g"],["Pointed Gourd (Parwal)","parwal",30,42,"500g"],
  ["Raw Jackfruit","raw-jackfruit",35,50,"500g"],["Lotus Stem","lotus-stem",40,55,"250g"],
  ["Arbi (Taro Root)","arbi",25,35,"500g"],["Yam (Suran)","suran",28,38,"500g"],
  ["Water Chestnut","water-chestnut",45,65,"250g"],["Baby Corn","baby-corn",35,48,"200g"],
  ["Cluster Beans (Gawar)","cluster-beans",22,30,"500g"],["Broad Beans (Sem)","broad-beans",30,42,"500g"],
  ["Snow Peas","snow-peas",55,75,"200g"],["Sugar Snap Peas","sugar-snap-peas",55,75,"200g"],
  ["Asparagus","asparagus",75,100,"250g"],["Artichoke","artichoke",80,110,"1pc"],
  ["Turnip (Shalgam)","turnip",18,25,"500g"],["Leek","leek",35,50,"250g"],
  ["Bok Choy","bok-choy",45,60,"250g"],["Purple Cabbage","purple-cabbage",35,48,"500g"],
  ["Cherry Tomatoes","cherry-tomatoes",65,85,"250g"],["Roma Tomatoes","roma-tomatoes",35,48,"500g"],
  ["Yellow Bell Pepper","yellow-bell-pepper",55,75,"2pcs"],["Red Bell Pepper","red-bell-pepper",55,75,"2pcs"],
  ["Baby Spinach","baby-spinach",45,60,"150g"],["Iceberg Lettuce","iceberg-lettuce",35,48,"1pc"],
  ["Rocket Leaves (Arugula)","arugula",55,75,"100g"],["Watercress","watercress",45,60,"100g"],
  ["Kohlrabi","kohlrabi",35,48,"500g"],["Celeriac","celeriac",55,75,"500g"],
  ["Fennel","fennel",40,55,"1pc"],["Endive","endive",55,75,"200g"],
  ["Radicchio","radicchio",60,80,"1pc"],["Swiss Chard","swiss-chard",45,60,"250g"],
  ["Collard Greens","collard-greens",35,48,"250g"],["Drumstick Leaves","drumstick-leaves",15,22,"100g"],
  ["Colocasia Leaves (Arbi Patta)","colocasia-leaves",12,18,"250g"],["Sorrel","sorrel",40,55,"100g"],
  ["Purslane","purslane",30,42,"100g"],["Baby Carrots","baby-carrots",45,60,"250g"],
  ["Purple Yam (Kand)","purple-yam",35,48,"500g"],["Raw Banana","raw-banana",18,25,"500g"],
  ["Green Papaya","green-papaya",20,28,"500g"],["Tinda (Apple Gourd)","tinda",22,30,"500g"],
  ["Spine Gourd (Kankoda)","spine-gourd",30,42,"250g"],["Doodhi","doodhi",18,25,"1pc"],
  ["Singhara (Water Caltrop)","singhara",40,55,"250g"],["Jackfruit Seeds","jackfruit-seeds",25,35,"250g"],
  ["Banana Blossom","banana-blossom",22,30,"1pc"],["Tender Coconut Flesh","tender-coconut-flesh",45,65,"1pc"],
  ["Sprouted Moong","sprouted-moong",25,35,"250g"],["Sprouted Chickpea","sprouted-chickpea",30,42,"250g"],
  ["Raw Turmeric","raw-turmeric",45,65,"100g"],["Green Garlic","green-garlic",20,28,"100g"],
  ["Elephant Yam","elephant-yam",30,42,"500g"],["Sword Beans","sword-beans",28,38,"250g"],
  ["Field Beans (Avrekai)","field-beans",30,42,"250g"],["Hyacinth Beans (Lablab)","hyacinth-beans",28,38,"250g"],
  ["Dolichos Beans","dolichos-beans",30,42,"250g"],["Runner Beans","runner-beans",35,48,"250g"],
  ["Chayote (Chow Chow)","chayote",22,30,"2pcs"],["Winged Beans","winged-beans",35,48,"250g"],
  ["Agathi (Sesbania)","agathi-leaves",15,22,"100g"],["Perch Shoots","pea-shoots",45,62,"100g"],
  ["Mini Capsicum Mix","mini-capsicum",55,75,"200g"],
];

const fruits = [
  ["Pineapple","pineapple",49,70,"1pc"],["Guava (Amrood)","guava",30,42,"500g"],
  ["Pomegranate","pomegranate",99,140,"1pc"],["Kiwi","kiwi",25,35,"1pc"],
  ["Litchi","litchi",99,140,"250g"],["Jamun","jamun",49,70,"250g"],
  ["Chikoo (Sapota)","chikoo",35,50,"500g"],["Custard Apple (Sitaphal)","custard-apple",65,90,"500g"],
  ["Dragon Fruit","dragon-fruit",149,200,"1pc"],["Star Fruit (Carambola)","star-fruit",45,65,"2pcs"],
  ["Passion Fruit","passion-fruit",49,70,"2pcs"],["Fresh Figs","fresh-figs",99,140,"250g"],
  ["Medjool Dates","medjool-dates",149,199,"250g"],["Plum","plum",89,120,"500g"],
  ["Peach","peach",99,140,"500g"],["Pear","pear",79,110,"500g"],
  ["Sweet Cherries","sweet-cherries",249,330,"250g"],["Green Coconut","green-coconut",35,50,"1pc"],
  ["Sweet Lime (Mosambi)","sweet-lime",55,75,"1kg"],["Grapefruit","grapefruit",49,70,"1pc"],
  ["Lemon","lemon",15,22,"6pcs"],["Lime","lime",10,15,"4pcs"],
  ["Amla (Indian Gooseberry)","amla",35,50,"250g"],["Jackfruit","jackfruit",49,70,"500g"],
  ["Wood Apple (Bael)","bael",25,35,"1pc"],["Ber (Indian Jujube)","ber",20,28,"250g"],
  ["Avocado","avocado",79,110,"1pc"],["Blueberries","blueberries",199,265,"125g"],
  ["Raspberries","raspberries",179,240,"125g"],["Blackberries","blackberries",169,225,"125g"],
  ["Muskmelon","muskmelon",55,75,"1pc"],["Honeydew Melon","honeydew-melon",65,90,"500g"],
  ["Cantaloupe","cantaloupe",60,82,"500g"],["Persimmon (Amlok)","persimmon",79,110,"2pcs"],
  ["Loquat (Loquat)","loquat",49,70,"250g"],["Mulberry","mulberry",99,140,"125g"],
  ["Longan","longan",99,140,"250g"],["Rambutan","rambutan",149,200,"250g"],
  ["Mangosteen","mangosteen",249,330,"500g"],["Green Apple","green-apple",89,125,"1kg"],
  ["Red Grapes","red-grapes",99,140,"500g"],["Green Grapes","green-grapes",89,125,"500g"],
  ["Black Grapes","black-grapes",99,140,"500g"],["Banana Robusta","banana-robusta",38,52,"1kg"],
  ["Elaichi Banana","elaichi-banana",55,75,"500g"],["Red Banana","red-banana",65,90,"500g"],
  ["Nendran Banana","nendran-banana",45,65,"1kg"],["Kesar Mango","kesar-mango",169,225,"1kg"],
  ["Totapuri Mango","totapuri-mango",79,110,"1kg"],["Dashehari Mango","dashehari-mango",99,140,"1kg"],
  ["Langra Mango","langra-mango",99,140,"1kg"],["Chaunsa Mango","chaunsa-mango",129,175,"1kg"],
  ["Mallika Mango","mallika-mango",89,125,"1kg"],["Sindhura Mango","sindhura-mango",79,110,"1kg"],
  ["Neelam Mango","neelam-mango",75,105,"1kg"],["Navel Orange","navel-orange",69,95,"1kg"],
  ["Blood Orange","blood-orange",79,110,"500g"],["Mandarin","mandarin",65,90,"1kg"],
  ["Clementine","clementine",99,135,"500g"],["Satsuma","satsuma",85,115,"500g"],
  ["Yuzu","yuzu",120,165,"4pcs"],["Calamondin","calamondin",75,105,"250g"],
  ["Kumquat","kumquat",99,140,"250g"],["Pomelo","pomelo",55,75,"1pc"],
  ["Tamarillo","tamarillo",55,75,"4pcs"],["Cape Gooseberry","cape-gooseberry",99,140,"125g"],
  ["Tomatillo","tomatillo",79,110,"250g"],["Feijoa","feijoa",99,140,"250g"],
  ["Quince","quince",55,75,"500g"],["Sapodilla (Chikoo Small)","sapodilla",30,42,"500g"],
  ["Jackfruit (Ripe)","ripe-jackfruit",65,90,"500g"],["Nance","nance",79,110,"250g"],
  ["Carambola (Star Fruit Yellow)","carambola-yellow",49,70,"2pcs"],
  ["African Star Apple","african-star-apple",79,110,"250g"],
  ["Finger Lime","finger-lime",149,200,"50g"],["Yellow Watermelon","yellow-watermelon",89,120,"500g"],
  ["Piel de Sapo Melon","piel-de-sapo",65,90,"500g"],["Canary Melon","canary-melon",60,82,"500g"],
  ["Galia Melon","galia-melon",65,90,"500g"],["Crenshaw Melon","crenshaw-melon",70,95,"500g"],
  ["Santa Claus Melon","santa-claus-melon",65,90,"500g"],["Casaba Melon","casaba-melon",60,82,"500g"],
  ["Korean Melon","korean-melon",75,105,"1pc"],["Golden Kiwi","golden-kiwi",35,50,"1pc"],
  ["Baby Kiwi","baby-kiwi",99,140,"125g"],["Kiwi Berry","kiwi-berry",99,140,"125g"],
  ["Tropical Mix","tropical-mix",99,140,"500g"],["Berry Mix","berry-mix",149,200,"250g"],
  ["Seasonal Citrus Pack","seasonal-citrus",129,175,"1kg"],["Stone Fruit Mix","stone-fruit-mix",149,200,"500g"],
  ["Pineapple Chunks (Ready to Eat)","pineapple-chunks",49,70,"250g"],
  ["Mango Slices (Ready to Eat)","mango-slices",65,90,"250g"],
  ["Watermelon Cubes (Ready to Eat)","watermelon-cubes",45,65,"250g"],
];

async function run() {
  const vegCat = await p.category.findFirst({ where: { slug: "vegetables" } });
  const fruitCat = await p.category.findFirst({ where: { slug: "fruits" } });

  let added = 0;
  for (const [name, slug, price, mrp, unit] of vegs) {
    await p.product.upsert({
      where: { slug },
      update: {},
      create: {
        name, slug, price, mrp, unit,
        images: JSON.stringify([V]),
        tags: JSON.stringify(["fresh", "vegetables"]),
        categoryId: vegCat.id,
        isFeatured: Math.random() > 0.85,
        isTrending: Math.random() > 0.85,
        inventory: { create: { stock: Math.floor(Math.random() * 200) + 50 } },
      },
    });
    added++;
  }
  for (const [name, slug, price, mrp, unit] of fruits) {
    await p.product.upsert({
      where: { slug },
      update: {},
      create: {
        name, slug, price, mrp, unit,
        images: JSON.stringify([F]),
        tags: JSON.stringify(["fresh", "fruits"]),
        categoryId: fruitCat.id,
        isFeatured: Math.random() > 0.85,
        isTrending: Math.random() > 0.85,
        inventory: { create: { stock: Math.floor(Math.random() * 200) + 50 } },
      },
    });
    added++;
  }
  console.log(`✅ Added ${added} fruits & vegetables`);
  await p.$disconnect();
}

run().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
