// Run: node seed-grocery.js
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const D = "https://images.unsplash.com/photo-1550583724-12770d98a633?w=400"; // dairy
const B = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"; // bakery
const S = "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400"; // snacks
const BV = "https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=400"; // beverages
const PC = "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400"; // personal care
const HH = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400"; // household

const categories = [
  { name: "Dairy & Eggs", slug: "dairy-eggs", image: D },
  { name: "Bakery & Breads", slug: "bakery-breads", image: B },
  { name: "Snacks & Munchies", slug: "snacks-munchies", image: S },
  { name: "Beverages", slug: "beverages", image: BV },
  { name: "Personal Care", slug: "personal-care", image: PC },
  { name: "Household Essentials", slug: "household", image: HH },
];

const dairy = [
  ["Amul Taaza Toned Milk","amul-taaza-1l",72,75,"1L"],["Amul Gold Full Cream Milk","amul-gold-500ml",33,35,"500ml"],
  ["Mother Dairy Full Cream Milk","md-fcm-1l",66,68,"1L"],["Amul Salted Butter","amul-butter-100g",52,56,"100g"],
  ["Amul Paneer","amul-paneer-200g",85,92,"200g"],["Mother Dairy Paneer","md-paneer-200g",80,88,"200g"],
  ["Eggs White (6 pcs)","eggs-6-pcs",45,55,"6pcs"],["Eggs Brown (6 pcs)","brown-eggs-6",75,90,"6pcs"],
  ["Amul Masti Dahi","amul-dahi-200g",20,25,"200g"],["Mother Dairy Curd","md-curd-400g",45,50,"400g"],
  ["Amul Cheese Slices","amul-cheese-slices-10",145,160,"10pcs"],["Amul Cheese Block","amul-cheese-200g",115,125,"200g"],
  ["Epigamia Greek Yogurt","epigamia-yogurt",55,65,"90g"],["Hershey's Milkshake","hersheys-milkshake",35,40,"180ml"],
  ["Amul Kool Cafe","amul-kool-cafe",25,30,"200ml"],["Yakult Probiotic Drink","yakult-5",80,85,"5pcs"],
];

const bakery = [
  ["Harvest Gold White Bread","hg-white-bread",30,35,"400g"],["Harvest Gold Brown Bread","hg-brown-bread",45,50,"400g"],
  ["Multigrain Bread","multigrain-bread",55,65,"400g"],["Burger Buns (2 pcs)","burger-buns-2",25,30,"2pcs"],
  ["Pav (6 pcs)","pav-6-pcs",20,25,"6pcs"],["Britannia Fruit Cake","britannia-cake",20,25,"45g"],
  ["Cookies (Choco Chip)","choco-chip-cookies",99,120,"150g"],["Rusk (Premium)","premium-rusk",45,55,"200g"],
  ["Croissant","croissant",45,60,"1pc"],["Pizza Base (2 pcs)","pizza-base-2",35,45,"2pcs"],
  ["Chocolate Muffin","choco-muffin",35,45,"1pc"],["English Oven Garlic Bread","garlic-bread",65,80,"200g"],
];

const snacks = [
  ["Lay's Classic Salted","lays-salted",20,20,"50g"],["Lay's India's Magic Masala","lays-masala",20,20,"50g"],
  ["Kurkure Masala Munch","kurkure-masala",20,20,"80g"],["Doritos Nacho Cheese","doritos-nacho",50,50,"60g"],
  ["Haldiram's Bhujia Sev","haldirams-bhujia",45,50,"200g"],["Haldiram's Khatta Meetha","haldirams-km",45,50,"200g"],
  ["Cadbury Dairy Milk","dairy-milk-silk",80,85,"60g"],["KitKat Share Bag","kitkat-share",99,110,"120g"],
  ["Oreo Vanilla Biscuits","oreo-vanilla",35,40,"120g"],["Parle-G Gold","parle-g-gold",25,30,"200g"],
  ["Hide & Seek Biscuits","hide-seek",45,50,"120g"],["Maggi 2-Minute Noodles","maggi-12",168,180,"12pcs"],
  ["Knorr Tomato Soup","knorr-soup",55,60,"45g"],["Act II Popcorn","act-ii-popcorn",35,40,"100g"],
];

const beverages = [
  ["Coca-Cola","coca-cola-750ml",45,50,"750ml"],["Pepsi","pepsi-750ml",45,50,"750ml"],
  ["Sprite","sprite-750ml",45,50,"750ml"],["Thums Up","thums-up-750ml",45,50,"750ml"],
  ["Red Bull Energy Drink","red-bull",115,125,"250ml"],["Tata Tea Gold","tata-tea-500g",320,350,"500g"],
  ["Nescafe Classic Coffee","nescafe-50g",165,180,"50g"],["Bru Instant Coffee","bru-50g",150,170,"50g"],
  ["Real Fruit Power Orange","real-orange-1l",115,125,"1L"],["Tropicana Apple Juice","tropicana-apple-1l",110,120,"1L"],
  ["Bisleri Water","bisleri-1l",20,20,"1L"],["Maaza Mango Drink","maaza-1.2l",65,75,"1.2L"],
  ["Bournvita Health Drink","bournvita-500g",245,260,"500g"],["Horlicks Classic Malt","horlicks-500g",255,275,"500g"],
];

const personalCare = [
  ["Dove Cream Bar","dove-soap-125g",65,75,"125g"],["Dettol Original Soap","dettol-soap-3",145,165,"3x125g"],
  ["Colgate MaxFresh Gel","colgate-maxfresh",125,140,"150g"],["Oral-B Toothbrush","oral-b-tb",45,60,"1pc"],
  ["Head & Shoulders Shampoo","h-s-shampoo",185,210,"180ml"],["Panting Shampoo","pantene-shampoo",175,195,"180ml"],
  ["Parachute Coconut Oil","parachute-oil",135,150,"250ml"],["Nivea Men Facewash","nivea-facewash",199,225,"100ml"],
  ["Gillette Shaving Foam","gillette-foam",199,220,"200ml"],["Whisper Ultra Clean","whisper-ultra-15",199,225,"15pcs"],
];

const household = [
  ["Surf Excel Easy Wash","surf-excel-1kg",165,185,"1kg"],["Ariel Matic Front Load","ariel-1kg",245,280,"1kg"],
  ["Vim Dishwash Liquid","vim-liquid-500ml",99,115,"500ml"],["Vim Dishwash Bar","vim-bar-3",45,55,"3x125g"],
  ["Lizol Floor Cleaner","lizol-500ml",95,110,"500ml"],["Harpic Toilet Cleaner","harpic-500ml",95,110,"500ml"],
  ["Comfort Fabric Conditioner","comfort-800ml",215,240,"800ml"],["Dettol Antiseptic Liquid","dettol-liquid-500ml",199,220,"500ml"],
  ["Godrej Aer Spray","aer-spray",145,170,"240ml"],["Mortein Mosquito Coil","mortein-coil",45,55,"10pcs"],
];

// Helper to generate bulk items
function generateBulk(categoryName, categorySlug, count, basePrice, baseImg) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    const price = Math.floor(basePrice + (Math.random() * basePrice * 0.5));
    const mrp = Math.floor(price * 1.2);
    items.push([
      `${categoryName} Item ${i}`,
      `${categorySlug}-item-${i}`,
      price,
      mrp,
      "500g"
    ]);
  }
  return items;
}

const bulkItems = [
  ...generateBulk("Dal & Pulses", "dal-pulses", 80, 80, HH),
  ...generateBulk("Atta, Rice & Oil", "atta-rice-oil", 80, 150, HH),
  ...generateBulk("Masala & Spices", "masala-spices", 80, 50, HH),
  ...generateBulk("Dry Fruits & Seeds", "dry-fruits-seeds", 80, 250, BV),
  ...generateBulk("Instant Food", "instant-food", 60, 60, S),
  ...generateBulk("Frozen Food", "frozen-food", 60, 120, D),
];

async function run() {
  console.log("🚀 Starting Catalog Expansion...");
  
  // Create categories
  const catMap = {};
  for (const c of categories) {
    let existing = await p.category.findFirst({
      where: { OR: [{ slug: c.slug }, { name: c.name }] }
    });
    
    if (existing) {
      existing = await p.category.update({
        where: { id: existing.id },
        data: { image: c.image, slug: c.slug, name: c.name }
      });
    } else {
      existing = await p.category.create({
        data: { name: c.name, slug: c.slug, image: c.image, isActive: true },
      });
    }
    catMap[c.slug] = existing.id;
  }

  // Add more bulk categories if needed
  const bulkCats = ["Dal & Pulses", "Atta, Rice & Oil", "Masala & Spices", "Dry Fruits & Seeds", "Instant Food", "Frozen Food"];
  for (const bc of bulkCats) {
    const slug = bc.toLowerCase().replace(/ & /g, "-").replace(/, /g, "-").replace(/ /g, "-");
    let existing = await p.category.findFirst({
      where: { OR: [{ slug }, { name: bc }] }
    });
    
    if (existing) {
      catMap[slug] = existing.id;
    } else {
      const created = await p.category.create({
        data: { name: bc, slug, isActive: true },
      });
      catMap[slug] = created.id;
    }
  }

  let added = 0;
  const allBatches = [
    { items: dairy, slug: "dairy-eggs", img: D, tags: ["dairy", "fresh"] },
    { items: bakery, slug: "bakery-breads", img: B, tags: ["bakery", "fresh"] },
    { items: snacks, slug: "snacks-munchies", img: S, tags: ["snacks"] },
    { items: beverages, slug: "beverages", img: BV, tags: ["beverages"] },
    { items: personalCare, slug: "personal-care", img: PC, tags: ["care"] },
    { items: household, slug: "household", img: HH, tags: ["home"] },
  ];

  for (const batch of allBatches) {
    for (const [name, slug, price, mrp, unit] of batch.items) {
      const categoryId = catMap[batch.slug];
      if (!categoryId) {
        console.warn(`⚠️ Category ${batch.slug} not found, skipping product ${name}`);
        continue;
      }

      await p.product.upsert({
        where: { slug },
        update: {},
        create: {
          name, slug, price, mrp, unit,
          images: JSON.stringify([batch.img]),
          tags: JSON.stringify(batch.tags),
          category: { connect: { id: categoryId } },
          inventory: { create: { stock: Math.floor(Math.random() * 200) + 50 } },
        },
      });
      added++;
    }
  }

  // Add bulk items
  for (const [name, slug, price, mrp, unit] of bulkItems) {
    const catSlug = slug.split("-item-")[0];
    const categoryId = catMap[catSlug];
    if (!categoryId) {
      console.warn(`⚠️ Bulk Category ${catSlug} not found, skipping product ${name}`);
      continue;
    }

    await p.product.upsert({
      where: { slug },
      update: {},
      create: {
        name, slug, price, mrp, unit,
        images: JSON.stringify(["https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"]),
        tags: JSON.stringify(["grocery"]),
        category: { connect: { id: categoryId } },
        inventory: { create: { stock: Math.floor(Math.random() * 200) + 50 } },
      },
    });
    added++;
  }

  console.log(`✅ Successfully added ${added} items to catalog!`);
  await p.$disconnect();
}

run().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
