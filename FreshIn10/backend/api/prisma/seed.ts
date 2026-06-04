import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const adminPassword = await bcrypt.hash("admin@123", 12);
  const userPassword = await bcrypt.hash("Password@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      password: adminPassword
    },
    create: {
      name: "Admin User",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "ADMIN",
      isVerified: true,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@test.com",
      password: userPassword,
      role: "CUSTOMER",
      isVerified: true,
      cart: { create: {} },
    },
  });

  const deliveryPassword = await bcrypt.hash("password@123", 12);
  const deliveryUser = await prisma.user.upsert({
    where: { email: "deliveryfreshin10@gmail.com" },
    update: {
      password: deliveryPassword
    },
    create: {
      name: "Test Delivery",
      email: "deliveryfreshin10@gmail.com",
      password: deliveryPassword,
      role: "DELIVERY_PARTNER",
      isVerified: true,
    },
  });

  await prisma.deliveryPartner.upsert({
    where: { userId: deliveryUser.id },
    update: {},
    create: {
      userId: deliveryUser.id,
      status: "AVAILABLE",
      isVerified: true,
      vehicleType: "BIKE",
      vehicleNo: "TEST-123",
      licenseNo: "TEST-DL",
    },
  });

  console.log("✅ Users created");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "vegetables" },
      update: {},
      create: { name: "Vegetables", slug: "vegetables", color: "#dcfce7", icon: "🥦", sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: "fruits" },
      update: {},
      create: { name: "Fruits", slug: "fruits", color: "#fef3c7", icon: "🍎", sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: "dairy" },
      update: {},
      create: { name: "Dairy & Eggs", slug: "dairy", color: "#dbeafe", icon: "🥛", sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: "bakery" },
      update: {},
      create: { name: "Bakery", slug: "bakery", color: "#fce7f3", icon: "🍞", sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { slug: "snacks" },
      update: {},
      create: { name: "Snacks", slug: "snacks", color: "#fef9c3", icon: "🍿", sortOrder: 5 },
    }),
    prisma.category.upsert({
      where: { slug: "beverages" },
      update: {},
      create: { name: "Beverages", slug: "beverages", color: "#e0f2fe", icon: "🥤", sortOrder: 6 },
    }),
  ]);
  console.log(`✅ ${categories.length} categories created`);

  // Create sample products
  const products = [
    // Vegetables
    {
      name: "Fresh Tomatoes",
      slug: "fresh-tomatoes",
      price: 29,
      mrp: 40,
      unit: "500g",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_1.svg"],
      categoryId: categories[0].id,
      isFeatured: true,
      isTrending: true,
      tags: ["fresh", "vegetables", "tomato"],
    },
    {
      name: "Organic Spinach",
      slug: "organic-spinach",
      price: 35,
      mrp: 45,
      unit: "250g",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_2.svg"],
      categoryId: categories[0].id,
      isFeatured: true,
      tags: ["organic", "spinach", "leafy"],
    },
    {
      name: "Carrots",
      slug: "carrots",
      price: 25,
      mrp: 35,
      unit: "500g",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_3.svg"],
      categoryId: categories[0].id,
      isTrending: true,
      tags: ["carrot", "vegetables", "orange"],
    },
    {
      name: "Broccoli",
      slug: "broccoli",
      price: 45,
      mrp: 60,
      unit: "400g",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_4.svg"],
      categoryId: categories[0].id,
      tags: ["broccoli", "vegetables", "green"],
    },
    {
      name: "Bell Peppers",
      slug: "bell-peppers",
      price: 39,
      mrp: 50,
      unit: "500g",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_5.svg"],
      categoryId: categories[0].id,
      isFeatured: true,
      tags: ["peppers", "vegetables", "colorful"],
    },
    {
      name: "Onions",
      slug: "onions",
      price: 20,
      mrp: 30,
      unit: "1kg",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_6.svg"],
      categoryId: categories[0].id,
      tags: ["onion", "vegetables", "staple"],
    },
    {
      name: "Potatoes",
      slug: "potatoes",
      price: 22,
      mrp: 32,
      unit: "1kg",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_7.svg"],
      categoryId: categories[0].id,
      tags: ["potato", "vegetables", "staple"],
    },
    {
      name: "Cucumber",
      slug: "cucumber",
      price: 18,
      mrp: 25,
      unit: "500g",
      images: ["http://localhost:3003/public/images/vegetables/vegetable_8.svg"],
      categoryId: categories[0].id,
      tags: ["cucumber", "vegetables", "fresh"],
    },
    // Fruits
    {
      name: "Alphonso Mangoes",
      slug: "alphonso-mangoes",
      price: 149,
      mrp: 199,
      unit: "1kg",
      images: ["http://localhost:3003/public/images/fruits/fruit_1.svg"],
      categoryId: categories[1].id,
      isFeatured: true,
      isTrending: true,
      tags: ["mango", "fruits", "alphonso"],
    },
    {
      name: "Fresh Apples",
      slug: "fresh-apples",
      price: 89,
      mrp: 120,
      unit: "1kg",
      images: ["http://localhost:3003/public/images/fruits/fruit_2.svg"],
      categoryId: categories[1].id,
      isFeatured: true,
      tags: ["apple", "fruits", "red"],
    },
    {
      name: "Bananas",
      slug: "bananas",
      price: 35,
      mrp: 50,
      unit: "1kg",
      images: ["http://localhost:3003/public/images/fruits/fruit_3.svg"],
      categoryId: categories[1].id,
      isTrending: true,
      tags: ["banana", "fruits", "yellow"],
    },
    {
      name: "Oranges",
      slug: "oranges",
      price: 65,
      mrp: 90,
      unit: "1kg",
      images: ["http://localhost:3003/public/images/fruits/fruit_4.svg"],
      categoryId: categories[1].id,
      isFeatured: true,
      tags: ["orange", "fruits", "citrus"],
    },
    {
      name: "Grapes",
      slug: "grapes",
      price: 99,
      mrp: 140,
      unit: "500g",
      images: ["http://localhost:3003/public/images/fruits/fruit_5.svg"],
      categoryId: categories[1].id,
      tags: ["grapes", "fruits", "purple"],
    },
    {
      name: "Strawberries",
      slug: "strawberries",
      price: 129,
      mrp: 180,
      unit: "250g",
      images: ["http://localhost:3003/public/images/fruits/fruit_6.svg"],
      categoryId: categories[1].id,
      isFeatured: true,
      tags: ["strawberry", "fruits", "red"],
    },
    {
      name: "Watermelon",
      slug: "watermelon",
      price: 79,
      mrp: 110,
      unit: "1pc",
      images: ["http://localhost:3003/public/images/fruits/fruit_7.svg"],
      categoryId: categories[1].id,
      tags: ["watermelon", "fruits", "summer"],
    },
    {
      name: "Papaya",
      slug: "papaya",
      price: 45,
      mrp: 65,
      unit: "1pc",
      images: ["http://localhost:3003/public/images/fruits/fruit_8.svg"],
      categoryId: categories[1].id,
      tags: ["papaya", "fruits", "tropical"],
    },
    // Dairy
    {
      name: "Amul Full Cream Milk",
      slug: "amul-full-cream-milk",
      price: 68,
      mrp: 72,
      unit: "1L",
      images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"],
      categoryId: categories[2].id,
      isFeatured: true,
      isTrending: true,
      tags: ["milk", "dairy", "amul"],
    },
    {
      name: "Paneer",
      slug: "paneer",
      price: 199,
      mrp: 250,
      unit: "200g",
      images: ["https://images.unsplash.com/photo-1589985643862-8633ae5f87e7?w=400"],
      categoryId: categories[2].id,
      isFeatured: true,
      tags: ["paneer", "dairy", "cheese"],
    },
    {
      name: "Yogurt",
      slug: "yogurt",
      price: 45,
      mrp: 55,
      unit: "400g",
      images: ["https://images.unsplash.com/photo-1488477181946-6428a0291840?w=400"],
      categoryId: categories[2].id,
      tags: ["yogurt", "dairy", "probiotic"],
    },
    {
      name: "Butter",
      slug: "butter",
      price: 89,
      mrp: 110,
      unit: "100g",
      images: ["https://images.unsplash.com/photo-1589985643862-8633ae5f87e7?w=400"],
      categoryId: categories[2].id,
      tags: ["butter", "dairy", "spread"],
    },
    // Bakery
    {
      name: "Brown Bread",
      slug: "brown-bread",
      price: 45,
      mrp: 50,
      unit: "400g",
      images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"],
      categoryId: categories[3].id,
      isTrending: true,
      tags: ["bread", "bakery", "brown"],
    },
    {
      name: "White Bread",
      slug: "white-bread",
      price: 40,
      mrp: 45,
      unit: "400g",
      images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"],
      categoryId: categories[3].id,
      tags: ["bread", "bakery", "white"],
    },
    {
      name: "Croissants",
      slug: "croissants",
      price: 89,
      mrp: 120,
      unit: "2pc",
      images: ["https://images.unsplash.com/photo-1585518419759-8b0e5fb91b98?w=400"],
      categoryId: categories[3].id,
      isFeatured: true,
      tags: ["croissant", "bakery", "pastry"],
    },
    // Snacks
    {
      name: "Lay's Classic Chips",
      slug: "lays-classic-chips",
      price: 20,
      mrp: 20,
      unit: "52g",
      images: ["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400"],
      categoryId: categories[4].id,
      isFeatured: true,
      tags: ["chips", "snacks", "lays"],
    },
    {
      name: "Doritos",
      slug: "doritos",
      price: 25,
      mrp: 25,
      unit: "55g",
      images: ["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400"],
      categoryId: categories[4].id,
      tags: ["chips", "snacks", "doritos"],
    },
    {
      name: "Pringles",
      slug: "pringles",
      price: 99,
      mrp: 120,
      unit: "165g",
      images: ["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400"],
      categoryId: categories[4].id,
      tags: ["chips", "snacks", "pringles"],
    },
    // Beverages
    {
      name: "Coca Cola",
      slug: "coca-cola",
      price: 45,
      mrp: 50,
      unit: "600ml",
      images: ["https://images.unsplash.com/photo-1554866585-acbb2b3b2b1e?w=400"],
      categoryId: categories[5].id,
      isFeatured: true,
      tags: ["cola", "beverage", "soft-drink"],
    },
    {
      name: "Sprite",
      slug: "sprite",
      price: 45,
      mrp: 50,
      unit: "600ml",
      images: ["https://images.unsplash.com/photo-1554866585-acbb2b3b2b1e?w=400"],
      categoryId: categories[5].id,
      tags: ["sprite", "beverage", "soft-drink"],
    },
    {
      name: "Orange Juice",
      slug: "orange-juice",
      price: 65,
      mrp: 80,
      unit: "1L",
      images: ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400"],
      categoryId: categories[5].id,
      isFeatured: true,
      tags: ["juice", "beverage", "orange"],
    },
  ];

  for (const productData of products) {
    const { images, tags, ...rest } = productData;
    const existing = await prisma.product.findUnique({ where: { slug: rest.slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          ...rest,
          images: JSON.stringify(images),
          tags: JSON.stringify(tags),
          inventory: { create: { stock: 100 } },
        },
      });
    }
  }
  console.log(`✅ ${products.length} products created`);

  // Create sample coupons
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrderAmount: 99,
      maxDiscount: 50,
      usageLimit: 1000,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FLAT50" },
    update: {},
    create: {
      code: "FLAT50",
      type: "FLAT",
      value: 50,
      minOrderAmount: 249,
      isActive: true,
    },
  });
  console.log("✅ Coupons created");

  // Create sample banner
  await prisma.banner.create({
    data: {
      title: "Fresh Vegetables Sale",
      subtitle: "Up to 40% off on all vegetables",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
      link: "/categories/vegetables",
      isActive: true,
      sortOrder: 1,
    },
  }).catch(() => {});

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
