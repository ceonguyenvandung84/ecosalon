import { PrismaClient } from "@prisma/client";
import { Role, CategoryType, CourseLevel, VideoProvider, QuestionType } from "../lib/enums";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("ðŸŒ± Báº¯t Ä‘áº§u seed database...");

  // Clear existing data
  console.log("ðŸ§¹ XÃ³a dá»¯ liá»‡u cÅ©...");
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.courseWishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.forumReply.deleteMany();
  await prisma.forumThread.deleteMany();
  await prisma.forumCategory.deleteMany();
  await prisma.blogComment.deleteMany();
  await prisma.blogPostTag.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.courseTag.deleteMany();
  await prisma.instructorApplication.deleteMany();
  await prisma.instructorProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.adminActivity.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.affiliate.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.courseQuestion.deleteMany();
  await prisma.courseAnswer.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.certificateTemplate.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.user.deleteMany();

  console.log("âœ… ÄÃ£ xÃ³a dá»¯ liá»‡u cÅ©");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // ============ USERS ============
  console.log("ðŸ‘¥ Táº¡o ngÆ°á»i dÃ¹ng...");

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@salonhair.vn",
      password: hashedPassword,
      fullName: "Quáº£n trá»‹ viÃªn",
      role: Role.ADMIN,
      phone: "0912345678",
      bio: "Quáº£n trá»‹ viÃªn há»‡ thá»‘ng SALON HAIR SYSTEM",
      isActive: true,
    },
  });

  const instructor1 = await prisma.user.create({
    data: {
      email: "giangvien@salonhair.vn",
      password: hashedPassword,
      fullName: "Nguyá»…n Thá»‹ Lan",
      role: Role.INSTRUCTOR,
      phone: "0912345679",
      bio: "ChuyÃªn gia tÃ³c vá»›i 15 nÄƒm kinh nghiá»‡m trong ngÃ nh lÃ m Ä‘áº¹p. ÄÃ£ Ä‘Ã o táº¡o hÆ¡n 5000 há»c viÃªn trÃªn toÃ n quá»‘c.",
      isActive: true,
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      email: "minhhoa@salonhair.vn",
      password: hashedPassword,
      fullName: "Tráº§n Minh Hoa",
      role: Role.INSTRUCTOR,
      phone: "0912345680",
      bio: "ChuyÃªn gia nhuá»™m tÃ³c vÃ  styling. Tá»«ng lÃ m viá»‡c táº¡i cÃ¡c salon ná»•i tiáº¿ng á»Ÿ HÃ  Ná»™i vÃ  TP.HCM.",
      isActive: true,
    },
  });

  const instructor3 = await prisma.user.create({
    data: {
      email: "hangnt@salonhair.vn",
      password: hashedPassword,
      fullName: "Nguyá»…n Thá»‹ Háº±ng",
      role: Role.INSTRUCTOR,
      phone: "0912345681",
      bio: "ChuyÃªn gia chÄƒm sÃ³c da máº·t vÃ  spa. ÄÃ o táº¡o táº¡i nhiá»u trung tÃ¢m uy tÃ­n.",
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: "ngocanh@gmail.com",
      password: hashedPassword,
      fullName: "Tráº§n Ngá»c Anh",
      role: Role.USER,
      phone: "0987654321",
      bio: "YÃªu thÃ­ch lÃ m Ä‘áº¹p vÃ  Ä‘ang há»c cÃ¡ch chÄƒm sÃ³c tÃ³c táº¡i nhÃ ",
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "thanhlan@yahoo.com",
      password: hashedPassword,
      fullName: "LÃª Thanh Lan",
      role: Role.USER,
      phone: "0987654322",
      bio: "Chá»§ tiá»‡m tÃ³c nhá», muá»‘n nÃ¢ng cao ká»¹ nÄƒng",
      isActive: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "honggam@gmail.com",
      password: hashedPassword,
      fullName: "Pháº¡m Há»“ng Gáº¥m",
      role: Role.USER,
      phone: "0987654323",
      isActive: true,
    },
  });

  // Create instructor profiles
  await prisma.instructorProfile.create({
    data: {
      userId: instructor1.id,
      title: "ChuyÃªn gia tÃ³c cao cáº¥p",
      expertise: JSON.stringify(["Cáº¯t tÃ³c", "Nhuá»™m tÃ³c", "Uá»‘n tÃ³c", "Styling"]),
      education: "Tá»‘t nghiá»‡p trÆ°á»ng Äáº¡i há»c Má»¹ thuáº­t á»©ng dá»¥ng",
    },
  });

  await prisma.instructorProfile.create({
    data: {
      userId: instructor2.id,
      title: "ChuyÃªn gia nhuá»™m & Styling",
      expertise: JSON.stringify(["Nhuá»™m tÃ³c", "Bleach", " keratin", "Bá»™i tÃ³c"]),
      education: "Chá»©ng chá»‰ nghá»‡ thuáº­t tÃ³c quá»‘c táº¿",
    },
  });

  await prisma.instructorProfile.create({
    data: {
      userId: instructor3.id,
      title: "ChuyÃªn gia Spa & ChÄƒm sÃ³c da",
      expertise: JSON.stringify(["ChÄƒm sÃ³c da", "Spa", "Massage", "Äiá»u trá»‹ má»¥n"]),
      education: "Tá»‘t nghiá»‡p trÆ°á»ng Y dÆ°á»£c",
    },
  });

  console.log("âœ… ÄÃ£ táº¡o 7 ngÆ°á»i dÃ¹ng");

  // ============ SETTINGS ============
  console.log("âš™ï¸ Táº¡o cÃ i Ä‘áº·t...");

  await prisma.setting.createMany({
    data: [
      { key: "site_name", value: "SALON HAIR SYSTEM" },
      { key: "site_tagline", value: "ÄÃ o táº¡o - Má»¹ pháº©m - Cá»™ng Ä‘á»“ng" },
      { key: "contact_email", value: "contact@salonhair.vn" },
      { key: "contact_phone", value: "19001234" },
      { key: "contact_address", value: "123 ÄÆ°á»ng Nguyá»…n TrÃ£i, Quáº­n 1, TP.HCM" },
      { key: "bank_code", value: "VCB" },
      { key: "bank_name", value: "Vietcombank" },
      { key: "bank_account_number", value: "1027391102" },
      { key: "bank_account_name", value: "SALON HAIR SYSTEM" },
      { key: "social_facebook", value: "https://facebook.com/salonhairsystem" },
      { key: "social_youtube", value: "https://youtube.com/@salonhairsystem" },
      { key: "social_zalo", value: "https://zalo.me/salonhairsystem" },
      { key: "quiz_default_pass_percent", value: "70" },
      { key: "quiz_default_time_limit", value: "30" },
      { key: "quiz_default_attempt_limit", value: "3" },
      { key: "maintenance_mode", value: "false" },
    ],
  });

  console.log("âœ… ÄÃ£ táº¡o cÃ i Ä‘áº·t");

  // ============ CATEGORIES ============
  console.log("ðŸ“‚ Táº¡o danh má»¥c...");

  // Course categories
  const catCoBan = await prisma.category.create({
    data: { name: "Kiáº¿n thá»©c cÆ¡ báº£n", slug: "kien-thuc-co-ban", type: CategoryType.COURSE, icon: "book", description: "CÃ¡c khÃ³a há»c vá» kiáº¿n thá»©c ná»n táº£ng ngÃ nh tÃ³c" },
  });
  const catCatToc = await prisma.category.create({
    data: { name: "Cáº¯t tÃ³c", slug: "cat-toc", type: CategoryType.COURSE, icon: "scissors", description: "Ká»¹ thuáº­t cáº¯t tÃ³c chuyÃªn nghiá»‡p" },
  });
  const catNhuomToc = await prisma.category.create({
    data: { name: "Nhuá»™m tÃ³c", slug: "nhuom-toc", type: CategoryType.COURSE, icon: "palette", description: "Ká»¹ thuáº­t nhuá»™m, táº©y, highlight" },
  });
  const catUonToc = await prisma.category.create({
    data: { name: "Uá»‘n tÃ³c", slug: "uon-toc", type: CategoryType.COURSE, icon: "wind", description: "Ká»¹ thuáº­t uá»‘n, duá»—i, keratin" },
  });
  const catStyling = await prisma.category.create({
    data: { name: "Styling & Makeup", slug: "styling-makeup", type: CategoryType.COURSE, icon: "sparkles", description: "Táº¡o kiá»ƒu tÃ³c vÃ  trang Ä‘iá»ƒm" },
  });
  const catSpa = await prisma.category.create({
    data: { name: "Spa & ChÄƒm sÃ³c da", slug: "spa-cham-soc-da", type: CategoryType.COURSE, icon: "heart", description: "ChÄƒm sÃ³c da vÃ  spa" },
  });
  const catKinhDoanh = await prisma.category.create({
    data: { name: "Kinh doanh Salon", slug: "kinh-doanh-salon", type: CategoryType.COURSE, icon: "briefcase", description: "Quáº£n lÃ½ vÃ  kinh doanh tiá»‡m tÃ³c" },
  });

  // Product categories
  const catShampoo = await prisma.category.create({
    data: { name: "Dáº§u gá»™i", slug: "dau-goi", type: CategoryType.PRODUCT, icon: "droplet", description: "Dáº§u gá»™i cÃ¡c loáº¡i" },
  });
  const catDieuTri = await prisma.category.create({
    data: { name: "Sáº£n pháº©m Ä‘iá»u trá»‹", slug: "san-pham-dieu-tri", type: CategoryType.PRODUCT, icon: "flask", description: "Sáº£n pháº©m Ä‘iá»u trá»‹ tÃ³c" },
  });
  const catStylingProd = await prisma.category.create({
    data: { name: "Styling", slug: "styling", type: CategoryType.PRODUCT, icon: "wand", description: "Sáº£n pháº©m táº¡o kiá»ƒu tÃ³c" },
  });
  const catMauNhuom = await prisma.category.create({
    data: { name: "MÃ u nhuá»™m", slug: "mau-nhuom", type: CategoryType.PRODUCT, icon: "paintbrush", description: "MÃ u nhuá»™m tÃ³c" },
  });
  const catDuoiToc = await prisma.category.create({
    data: { name: "DÆ°á»¡ng tÃ³c", slug: "duong-toc", type: CategoryType.PRODUCT, icon: "droplets", description: "Sáº£n pháº©m dÆ°á»¡ng tÃ³c" },
  });
  const catPhuKien = await prisma.category.create({
    data: { name: "Phá»¥ kiá»‡n", slug: "phu-kien", type: CategoryType.PRODUCT, icon: "scissors", description: "Dá»¥ng cá»¥ vÃ  phá»¥ kiá»‡n tÃ³c" },
  });

  console.log("âœ… ÄÃ£ táº¡o 13 danh má»¥c");

  // ============ BRANDS ============
  console.log("ðŸ·ï¸ Táº¡o thÆ°Æ¡ng hiá»‡u...");

  const brand1 = await prisma.brand.create({
    data: { name: "Olaplex", slug: "olaplex", description: "ThÆ°Æ¡ng hiá»‡u chÄƒm sÃ³c tÃ³c cao cáº¥p tá»« Má»¹" },
  });
  const brand2 = await prisma.brand.create({
    data: { name: "Kerasys", slug: "kerasys", description: "ThÆ°Æ¡ng hiá»‡u má»¹ pháº©m tÃ³c HÃ n Quá»‘c" },
  });
  const brand3 = await prisma.brand.create({
    data: { name: "L'OrÃ©al Professionnel", slug: "loreal-pro", description: "ThÆ°Æ¡ng hiá»‡u chuyÃªn nghiá»‡p tá»« PhÃ¡p" },
  });
  const brand4 = await prisma.brand.create({
    data: { name: "Schwarzkopf", slug: "schwarzkopf", description: "ThÆ°Æ¡ng hiá»‡u Äá»©c vá» chÄƒm sÃ³c tÃ³c" },
  });
  const brand5 = await prisma.brand.create({
    data: { name: "Davines", slug: "davines", description: "ThÆ°Æ¡ng hiá»‡u Ã vá» má»¹ pháº©m tÃ³c bá»n vá»¯ng" },
  });
  const brand6 = await prisma.brand.create({
    data: { name: "Goldwell", slug: "goldwell", description: "ThÆ°Æ¡ng hiá»‡u cao cáº¥p tá»« Äá»©c" },
  });

  console.log("âœ… ÄÃ£ táº¡o 6 thÆ°Æ¡ng hiá»‡u");

  // ============ PRODUCTS ============
  console.log("ðŸ›ï¸ Táº¡o sáº£n pháº©m...");

  const products = [
    // Shampoo
    { title: "Olaplex No.4 Bond Maintenance Shampoo", slug: "olaplex-no4-shampoo", shortDesc: "Dáº§u gá»™i giá»¯ bond cho tÃ³c hÆ° tá»•n", description: "<p>Dáº§u gá»™i Olaplex No.4 giÃºp phá»¥c há»“i vÃ  báº£o vá»‡ cÃ¡c liÃªn káº¿t bÃªn trong tÃ³c. PhÃ¹ há»£p cho tÃ³c hÃ³a nhuá»™m, uá»‘n, nhiá»‡t.</p><p>Æ¯u Ä‘iá»ƒm:</p><ul><li>Phá»¥c há»“i liÃªn káº¿t disulfide</li><li>Giáº£m gÃ£y rá»¥ng tÃ³c</li><li>HÆ°Æ¡ng thÆ¡m nháº¹ nhÃ ng</li></ul>", images: JSON.stringify(["https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600"]), price: 850000, discountPercent: 0, categoryId: catShampoo.id, brandId: brand1.id, stock: 50 },
    { title: "Kerasys Clinic Shampoo", slug: "kerasys-clinic-shampoo", shortDesc: "Dáº§u gá»™i trá»‹ gÃ u cao cáº¥p", description: "<p>Dáº§u gá»™i Kerasys Clinic vá»›i cÃ´ng thá»©c Ä‘áº·c biá»‡t giÃºp trá»‹ gÃ u vÃ  lÃ m sáº¡ch da Ä‘áº§u hiá»‡u quáº£.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600"]), price: 450000, discountPercent: 10, categoryId: catShampoo.id, brandId: brand2.id, stock: 80 },
    { title: "L'OrÃ©al Serie Expert Pro Longer Shampoo", slug: "loreal-prolonger-shampoo", shortDesc: "Dáº§u gá»™i dÆ°á»¡ng dÃ i cho tÃ³c dÃ i", description: "<p>Dáº§u gá»™i cho tÃ³c dÃ i, giÃºp nuÃ´i dÆ°á»¡ng vÃ  báº£o vá»‡ pháº§n ends.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600"]), price: 520000, discountPercent: 0, categoryId: catShampoo.id, brandId: brand3.id, stock: 45 },
    // Äiá»u trá»‹
    { title: "Olaplex No.3 Hair Perfector", slug: "olaplex-no3-hair-perfector", shortDesc: "Treatment phá»¥c há»“i tÃ³c hÆ° tá»•n", description: "<p>Treatment leave-in phá»¥c há»“i tÃ³c hÆ° tá»•n náº·ng. Sá»­ dá»¥ng trÆ°á»›c khi gá»™i 30-45 phÃºt.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600"]), price: 1250000, discountPercent: 5, categoryId: catDieuTri.id, brandId: brand1.id, stock: 35 },
    { title: "Kerasys Elastine Treatment", slug: "kerasys-elastine-treatment", shortDesc: "Treatment phá»¥c há»“i Ä‘á»™ Ä‘Ã n há»“i", description: "<p>Treatment giÃºp phá»¥c há»“i Ä‘á»™ Ä‘Ã n há»“i vÃ  bÃ³ng mÆ°á»£t cho tÃ³c.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600"]), price: 680000, discountPercent: 0, categoryId: catDieuTri.id, brandId: brand2.id, stock: 40 },
    // Styling
    { title: "L'OrÃ©al Tecni Art Pli Line", slug: "loreal-tecni-pli-line", shortDesc: "SÃ¡p táº¡o kiá»ƒu Ä‘á»™ bÃ¡m cao", description: "<p>SÃ¡p táº¡o kiá»ƒu vá»›i Ä‘á»™ bÃ¡m cá»©ng, giá»¯ form tÃ³c cáº£ ngÃ y.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600"]), price: 380000, discountPercent: 0, categoryId: catStylingProd.id, brandId: brand3.id, stock: 100 },
    { title: "Davines Oi All In One Milk", slug: "davines-oi-milk", shortDesc: "Sá»¯a dÆ°á»¡ng Ä‘a nÄƒng", description: "<p>Sá»¯a dÆ°á»¡ng da Ä‘a nÄƒng cho tÃ³c vÃ  cÆ¡ thá»ƒ. Chiáº¿t xuáº¥t tá»« roucou.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=600"]), price: 920000, discountPercent: 15, categoryId: catStylingProd.id, brandId: brand5.id, stock: 25 },
    // MÃ u nhuá»™m
    { title: "Schwarzkopf Palette Color Gel", slug: "schwarzkopf-palette-gel", shortDesc: "Gel nhuá»™m mÃ u tá»± nhiÃªn", description: "<p>Gel nhuá»™m tÃ³c vá»›i 12 tÃ´ng mÃ u tá»± nhiÃªn. Dá»… sá»­ dá»¥ng táº¡i nhÃ .</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=600"]), price: 195000, discountPercent: 0, categoryId: catMauNhuom.id, brandId: brand4.id, stock: 200 },
    { title: "L'OrÃ©al Casting CrÃ¨me Gloss", slug: "loreal-creme-gloss", shortDesc: "Nhuá»™m bÃ³ng mÆ°á»£t khÃ´ng ammonia", description: "<p>Cream nhuá»™m khÃ´ng chá»©a ammonia, dÆ°á»¡ng tÃ³c má»m mÆ°á»£t sau nhuá»™m.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600"]), price: 245000, discountPercent: 10, categoryId: catMauNhuom.id, brandId: brand3.id, stock: 150 },
    // DÆ°á»¡ng tÃ³c
    { title: "Olaplex No.8 Bond Intense Moisture Mask", slug: "olaplex-no8-mask", shortDesc: "Mask dÆ°á»¡ng áº©m sÃ¢u", description: "<p>Mask dÆ°á»¡ng áº©m sÃ¢u phá»¥c há»“i tÃ³c khÃ´ vÃ  xÃ¹. Sá»­ dá»¥ng 1-2 láº§n/tuáº§n.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600"]), price: 1450000, discountPercent: 0, categoryId: catDuoiToc.id, brandId: brand1.id, stock: 30 },
    { title: "Goldwell Kerasys Elastine Serum", slug: "goldwell-elastine-serum", shortDesc: "Serum phá»¥c há»“i elastin", description: "<p>Serum dÆ°á»¡ng phá»¥c há»“i elastin cho tÃ³c bÃ³ng mÆ°á»£t.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600"]), price: 780000, discountPercent: 20, categoryId: catDuoiToc.id, brandId: brand6.id, stock: 55 },
    // Phá»¥ kiá»‡n
    { title: "Ká»m cáº¯t tÃ³c Japanese Steel", slug: "kem-cat-toc-japanese", shortDesc: "Ká»m cáº¯t tÃ³c cháº¥t lÆ°á»£ng Nháº­t", description: "<p>Ká»m cáº¯t tÃ³c lÃ m tá»« thÃ©p Nháº­t Báº£n, sáº¯c bÃ©n, bá»n Ä‘áº¹p.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600"]), price: 1250000, discountPercent: 0, categoryId: catPhuKien.id, stock: 20, isFeatured: true },
    { title: "LÆ°á»£c cháº£i tÃ³c Carbon", slug: "luoc-chai-carbon", shortDesc: "LÆ°á»£c cháº£i chá»‹u nhiá»‡t", description: "<p>LÆ°á»£c lÃ m tá»« carbon chá»‹u nhiá»‡t tá»‘t, phÃ¹ há»£p cho tÃ³c uá»‘n.</p>", images: JSON.stringify(["https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=600"]), price: 350000, discountPercent: 0, categoryId: catPhuKien.id, stock: 60 },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log("âœ… ÄÃ£ táº¡o 14 sáº£n pháº©m");

  // ============ COURSES ============
  console.log("ðŸ“š Táº¡o khÃ³a há»c...");

  const courses = [
    {
      title: "KhÃ³a há»c cáº¯t tÃ³c cÆ¡ báº£n cho ngÆ°á»i má»›i báº¯t Ä‘áº§u",
      slug: "cat-toc-co-ban",
      thumbnailPath: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600",
      shortDesc: "Há»c tá»« con sá»‘ 0 - PhÃ¹ há»£p cho ngÆ°á»i chÆ°a cÃ³ kinh nghiá»‡m",
      description: "<p>KhÃ³a há»c cáº¯t tÃ³c cÆ¡ báº£n Ä‘Æ°á»£c thiáº¿t káº¿ riÃªng cho ngÆ°á»i má»›i báº¯t Ä‘áº§u. Báº¡n sáº½ Ä‘Æ°á»£c há»c tá»« nhá»¯ng kiáº¿n thá»©c ná»n táº£ng nháº¥t vá» cáº¯t tÃ³c.</p><h3>Ná»™i dung khÃ³a há»c:</h3><ul><li>Giá»›i thiá»‡u cÃ¡c dá»¥ng cá»¥ cáº¯t tÃ³c</li><li>CÃ¡ch cáº§m kÃ©o Ä‘Ãºng cÃ¡ch</li><li>CÃ¡c ká»¹ thuáº­t cáº¯t cÆ¡ báº£n</li><li>Cáº¯t tÃ³c theo form máº·t</li><li>Thá»±c hÃ nh trÃªn mannequin</li></ul>",
      price: 2500000,
      discountPrice: 1990000,
      level: CourseLevel.BEGINNER,
      durationHours: 20,
      instructorName: instructor1.fullName,
      instructorBio: instructor1.bio || "",
      instructorId: instructor1.id,
      categoryId: catCoBan.id,
      isPublished: true,
      isFeatured: true,
      studentsCount: 245,
      requirements: JSON.stringify(["KhÃ´ng yÃªu cáº§u kinh nghiá»‡m trÆ°á»›c", "Äam mÃª ngÃ nh tÃ³c"]),
      objectives: JSON.stringify(["Náº¯m vá»¯ng kiáº¿n thá»©c cÆ¡ báº£n vá» cáº¯t tÃ³c", "Cáº¯t Ä‘Æ°á»£c cÃ¡c kiá»ƒu tÃ³c cÆ¡ báº£n", "Tá»± tin phá»¥c vá»¥ khÃ¡ch hÃ ng"]),
      tags: JSON.stringify(["cáº¯t tÃ³c", "cÆ¡ báº£n", "cho ngÆ°á»i má»›i"]),
    },
    {
      title: "Ká»¹ thuáº­t nhuá»™m tÃ³c chuyÃªn nghiá»‡p - Tá»« cÆ¡ báº£n Ä‘áº¿n nÃ¢ng cao",
      slug: "ky-thuat-nhuom-toc-chuyen-nghiep",
      thumbnailPath: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
      shortDesc: "ToÃ n diá»‡n vá» nhuá»™m tÃ³c: táº©y, nhuá»™m, highlight, balayage",
      description: "<p>KhÃ³a há»c toÃ n diá»‡n vá» ká»¹ thuáº­t nhuá»™m tÃ³c, tá»« nhá»¯ng kiáº¿n thá»©c cÆ¡ báº£n nháº¥t Ä‘áº¿n cÃ¡c ká»¹ thuáº­t nÃ¢ng cao nhÆ° balayage, highlight.</p><h3>Báº¡n sáº½ há»c Ä‘Æ°á»£c:</h3><ul><li>LÃ½ thuyáº¿t mÃ u sáº¯c</li><li>Ká»¹ thuáº­t táº©y tÃ³c an toÃ n</li><li>Nhuá»™m toÃ n bá»™ vÃ  nhuá»™m highlight</li><li>Ká»¹ thuáº­t balayage hiá»‡n Ä‘áº¡i</li><li>Äiá»u chá»‰nh mÃ u vÃ  sá»­a lá»—i</li></ul>",
      price: 4500000,
      discountPrice: 3800000,
      level: CourseLevel.INTERMEDIATE,
      durationHours: 35,
      instructorName: instructor2.fullName,
      instructorBio: instructor2.bio || "",
      instructorId: instructor2.id,
      categoryId: catNhuomToc.id,
      isPublished: true,
      isFeatured: true,
      studentsCount: 189,
      requirements: JSON.stringify(["NÃªn cÃ³ kiáº¿n thá»©c cÆ¡ báº£n vá» tÃ³c"]),
      objectives: JSON.stringify(["Nhuá»™m Ä‘Æ°á»£c má»i kiá»ƒu mÃ u", "ThÃ nh tháº¡o ká»¹ thuáº­t balayage", "Tá»± tin tÆ° váº¥n mÃ u cho khÃ¡ch"]),
      tags: JSON.stringify(["nhuá»™m tÃ³c", "balayage", "highlight", "táº©y tÃ³c"]),
    },
    {
      title: "Uá»‘n tÃ³c Silky vÃ  Keratin - Ká»¹ thuáº­t HÃ n Quá»‘c",
      slug: "uon-toc-silky-keratin",
      thumbnailPath: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600",
      shortDesc: "Há»c ká»¹ thuáº­t uá»‘n láº¡nh HÃ n Quá»‘c vÃ  phá»¥c há»“i keratin",
      description: "<p>KhÃ³a há»c uá»‘n tÃ³c Silky vÃ  Keratin theo phong cÃ¡ch HÃ n Quá»‘c. PhÃ¹ há»£p cho nhá»¯ng ai muá»‘n má»Ÿ rá»™ng dá»‹ch vá»¥ uá»‘n tÃ³c táº¡i salon.</p><h3>Ná»™i dung:</h3><ul><li>CÃ¡c loáº¡i thuá»‘c uá»‘n vÃ  cÃ¡ch chá»n</li><li>Ká»¹ thuáº­t uá»‘n láº¡nh</li><li>Uá»‘n Silky kiá»ƒu HÃ n</li><li>Phá»¥c há»“i Keratin</li><li>Báº£o dÆ°á»¡ng sau uá»‘n</li></ul>",
      price: 3500000,
      discountPrice: 2990000,
      level: CourseLevel.INTERMEDIATE,
      durationHours: 25,
      instructorName: instructor1.fullName,
      instructorBio: instructor1.bio || "",
      instructorId: instructor1.id,
      categoryId: catUonToc.id,
      isPublished: true,
      isFeatured: false,
      studentsCount: 156,
      requirements: JSON.stringify(["CÃ³ kiáº¿n thá»©c cÆ¡ báº£n vá» tÃ³c"]),
      objectives: JSON.stringify(["Uá»‘n Ä‘Æ°á»£c nhiá»u kiá»ƒu uá»‘n", "Phá»¥c há»“i keratin chuyÃªn nghiá»‡p"]),
      tags: JSON.stringify(["uá»‘n tÃ³c", "silky", "keratin", "HÃ n Quá»‘c"]),
    },
    {
      title: "Cáº¯t tÃ³c nam chuyÃªn nghiá»‡p",
      slug: "cat-toc-nam-chuyen-nghiep",
      thumbnailPath: "https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=600",
      shortDesc: "CÃ¡c kiá»ƒu cáº¯t tÃ³c nam thá»‹nh hÃ nh 2024",
      description: "<p>KhÃ³a há»c táº­p trung vÃ o cÃ¡c kiá»ƒu tÃ³c nam phá»• biáº¿n: undercut, fade, pompadour, quiff...</p>",
      price: 1800000,
      discountPrice: 1500000,
      level: CourseLevel.BEGINNER,
      durationHours: 15,
      instructorName: instructor1.fullName,
      instructorBio: instructor1.bio || "",
      instructorId: instructor1.id,
      categoryId: catCatToc.id,
      isPublished: true,
      isFeatured: true,
      studentsCount: 312,
      requirements: JSON.stringify([]),
      objectives: JSON.stringify(["Cáº¯t Ä‘Æ°á»£c cÃ¡c kiá»ƒu tÃ³c nam phá»• biáº¿n", "ThÃ nh tháº¡o ká»¹ thuáº­t fade"]),
      tags: JSON.stringify(["cáº¯t tÃ³c nam", "fade", "undercut"]),
    },
    {
      title: "Styling tÃ³c cho wedding & sá»± kiá»‡n",
      slug: "styling-toc-wedding",
      thumbnailPath: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
      shortDesc: "Táº¡o kiá»ƒu tÃ³c cho cÃ´ dÃ¢u vÃ  cÃ¡c sá»± kiá»‡n Ä‘áº·c biá»‡t",
      description: "<p>KhÃ³a há»c styling nÃ¢ng cao, táº­p trung vÃ o táº¡o kiá»ƒu cho wedding vÃ  cÃ¡c sá»± kiá»‡n quan trá»ng.</p>",
      price: 2800000,
      discountPrice: 2400000,
      level: CourseLevel.ADVANCED,
      durationHours: 18,
      instructorName: instructor1.fullName,
      instructorBio: instructor1.bio || "",
      instructorId: instructor1.id,
      categoryId: catStyling.id,
      isPublished: true,
      isFeatured: false,
      studentsCount: 98,
      requirements: JSON.stringify(["CÃ³ kinh nghiá»‡m styling cÆ¡ báº£n"]),
      objectives: JSON.stringify(["Táº¡o Ä‘Æ°á»£c kiá»ƒu tÃ³c cÃ´ dÃ¢u Ä‘áº¹p", "Trang Ä‘iá»ƒm cÆ¡ báº£n Ä‘i kÃ¨m"]),
      tags: JSON.stringify(["styling", "wedding", "sá»± kiá»‡n"]),
    },
    {
      title: "ChÄƒm sÃ³c da máº·t cÆ¡ báº£n cho thá»£ tÃ³c",
      slug: "cham-soc-da-mat-co-ban",
      thumbnailPath: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600",
      shortDesc: "Bá»• sung dá»‹ch vá»¥ chÄƒm sÃ³c da cho salon",
      description: "<p>KhÃ³a há»c giÃºp thá»£ tÃ³c má»Ÿ rá»™ng dá»‹ch vá»¥ sang chÄƒm sÃ³c da máº·t - thá»‹ trÆ°á»ng Ä‘ang ráº¥t hot.</p>",
      price: 3200000,
      discountPrice: 2800000,
      level: CourseLevel.BEGINNER,
      durationHours: 22,
      instructorName: instructor3.fullName,
      instructorBio: instructor3.bio || "",
      instructorId: instructor3.id,
      categoryId: catSpa.id,
      isPublished: true,
      isFeatured: true,
      studentsCount: 134,
      requirements: JSON.stringify([]),
      objectives: JSON.stringify(["Náº¯m vá»¯ng quy trÃ¬nh chÄƒm sÃ³c da", "TÆ° váº¥n Ä‘Æ°á»£c sáº£n pháº©m phÃ¹ há»£p"]),
      tags: JSON.stringify(["spa", "chÄƒm sÃ³c da", "tháº©m má»¹"]),
    },
    {
      title: "Quáº£n lÃ½ vÃ  váº­n hÃ nh Salon thÃ nh cÃ´ng",
      slug: "quan-ly-salon",
      thumbnailPath: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600",
      shortDesc: "Tá»« kinh doanh nhá» Ä‘áº¿n chuá»—i salon",
      description: "<p>KhÃ³a há»c kinh doanh dÃ nh cho chá»§ salon muá»‘n nÃ¢ng cao doanh thu vÃ  quáº£n lÃ½ hiá»‡u quáº£.</p>",
      price: 5000000,
      discountPrice: 4200000,
      level: CourseLevel.ALL_LEVELS,
      durationHours: 30,
      instructorName: instructor1.fullName,
      instructorBio: instructor1.bio || "",
      categoryId: catKinhDoanh.id,
      isPublished: true,
      isFeatured: false,
      studentsCount: 87,
      requirements: JSON.stringify([]),
      objectives: JSON.stringify(["Quáº£n lÃ½ nhÃ¢n sá»± hiá»‡u quáº£", "TÄƒng doanh thu salon", "Marketing dá»‹ch vá»¥ tÃ³c"]),
      tags: JSON.stringify(["kinh doanh", "quáº£n lÃ½", "marketing"]),
    },
    {
      title: "Phá»‘i há»£p mÃ u tÃ³c nÃ¢ng cao - Color Correction",
      slug: "color-correction-nang-cao",
      thumbnailPath: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600",
      shortDesc: "Ká»¹ thuáº­t sá»­a mÃ u nhuá»™m tháº¥t báº¡i",
      description: "<p>KhÃ³a há»c chuyÃªn sÃ¢u vá» color correction - xá»­ lÃ½ cÃ¡c trÆ°á»ng há»£p nhuá»™m tháº¥t báº¡i, muá»‘n Ä‘á»•i mÃ u radical.</p>",
      price: 5500000,
      discountPrice: 4800000,
      level: CourseLevel.ADVANCED,
      durationHours: 28,
      instructorName: instructor2.fullName,
      instructorBio: instructor2.bio || "",
      instructorId: instructor2.id,
      categoryId: catNhuomToc.id,
      isPublished: true,
      isFeatured: false,
      studentsCount: 65,
      requirements: JSON.stringify(["CÃ³ kinh nghiá»‡m nhuá»™m tÃ³c tá»« 2 nÄƒm"]),
      objectives: JSON.stringify(["Sá»­a Ä‘Æ°á»£c má»i lá»—i mÃ u", "Äá»•i mÃ u radical an toÃ n"]),
      tags: JSON.stringify(["color correction", "sá»­a mÃ u", "nÃ¢ng cao"]),
    },
  ];

  const createdCourses = [];
  for (const c of courses) {
    const course = await prisma.course.create({ data: c });
    createdCourses.push(course);
  }

  console.log("âœ… ÄÃ£ táº¡o 8 khÃ³a há»c");

  // ============ LESSONS ============
  console.log("ðŸ“– Táº¡o bÃ i há»c...");

  for (const course of createdCourses) {
    const lessonsData = [
      {
        title: "Giá»›i thiá»‡u khÃ³a há»c",
        slug: "gioi-thieu",
        description: "Tá»•ng quan vá» khÃ³a há»c vÃ  nhá»¯ng gÃ¬ báº¡n sáº½ há»c Ä‘Æ°á»£c",
        content: "<h2>ChÃ o má»«ng báº¡n Ä‘áº¿n vá»›i khÃ³a há»c!</h2><p>Trong bÃ i há»c nÃ y, chÃºng ta sáº½ Ä‘i qua:</p><ul><li>Giá»›i thiá»‡u giáº£ng viÃªn</li><li>Ná»™i dung tá»•ng quan khÃ³a há»c</li><li>CÃ¡ch há»c hiá»‡u quáº£</li></ul>",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoProvider: VideoProvider.YOUTUBE,
        durationMin: 10,
        order: 0,
        isPreview: true,
        isPublished: true,
      },
      {
        title: "LÃ½ thuyáº¿t ná»n táº£ng",
        slug: "ly-thuyet-nen-tang",
        description: "Nhá»¯ng kiáº¿n thá»©c lÃ½ thuyáº¿t quan trá»ng",
        content: "<h2>LÃ½ thuyáº¿t cÆ¡ báº£n</h2><p>TrÆ°á»›c khi thá»±c hÃ nh, chÃºng ta cáº§n náº¯m vá»¯ng lÃ½ thuyáº¿t...</p>",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoProvider: VideoProvider.YOUTUBE,
        durationMin: 25,
        order: 1,
        isPreview: false,
        isPublished: true,
      },
      {
        title: "Thá»±c hÃ nh - BÃ i 1",
        slug: "thuc-hanh-bai-1",
        description: "HÆ°á»›ng dáº«n thá»±c hÃ nh bÃ i 1",
        content: "<h2>Thá»±c hÃ nh</h2><p>BÃ¢y giá» chÃºng ta sáº½ báº¯t Ä‘áº§u thá»±c hÃ nh...</p>",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoProvider: VideoProvider.YOUTUBE,
        durationMin: 35,
        order: 2,
        isPreview: false,
        isPublished: true,
      },
      {
        title: "Thá»±c hÃ nh - BÃ i 2",
        slug: "thuc-hanh-bai-2",
        description: "HÆ°á»›ng dáº«n thá»±c hÃ nh bÃ i 2",
        content: "<h2>Thá»±c hÃ nh nÃ¢ng cao</h2><p>Tiáº¿p tá»¥c vá»›i nhá»¯ng bÃ i thá»±c hÃ nh phá»©c táº¡p hÆ¡n...</p>",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoProvider: VideoProvider.YOUTUBE,
        durationMin: 40,
        order: 3,
        isPreview: false,
        isPublished: true,
      },
      {
        title: "CÃ¡c lá»—i thÆ°á»ng gáº·p",
        slug: "cac-loi-thuong-gap",
        description: "Nhá»¯ng lá»—i phá»• biáº¿n vÃ  cÃ¡ch kháº¯c phá»¥c",
        content: "<h2>CÃ¡c lá»—i thÆ°á»ng gáº·p</h2><p>Trong pháº§n nÃ y, chÃºng ta sáº½ Ä‘i qua cÃ¡c lá»—i phá»• biáº¿n...</p>",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoProvider: VideoProvider.YOUTUBE,
        durationMin: 20,
        order: 4,
        isPreview: true,
        isPublished: true,
      },
    ];

    for (const lesson of lessonsData) {
      await prisma.lesson.create({
        data: {
          ...lesson,
          courseId: course.id,
        },
      });
    }
  }

  console.log("âœ… ÄÃ£ táº¡o bÃ i há»c cho 8 khÃ³a há»c (40 bÃ i)");

  // ============ BLOGS ============
  console.log("ðŸ“ Táº¡o bÃ i viáº¿t...");

  const blogCat1 = await prisma.blogCategory.create({
    data: { name: "Tin tá»©c", slug: "tin-tuc", description: "Tin tá»©c ngÃ nh tÃ³c vÃ  lÃ m Ä‘áº¹p" },
  });
  const blogCat2 = await prisma.blogCategory.create({
    data: { name: "HÆ°á»›ng dáº«n", slug: "huong-dan", description: "BÃ i viáº¿t hÆ°á»›ng dáº«n chÄƒm sÃ³c tÃ³c" },
  });
  const blogCat3 = await prisma.blogCategory.create({
    data: { name: "Xu hÆ°á»›ng", slug: "xu-huong", description: "Xu hÆ°á»›ng tÃ³c má»›i nháº¥t" },
  });

  const blogPosts = [
    {
      title: "Top 10 kiá»ƒu tÃ³c hot nháº¥t 2024",
      slug: "top-10-kieu-toc-hot-2024",
      excerpt: "KhÃ¡m phÃ¡ nhá»¯ng kiá»ƒu tÃ³c Ä‘Æ°á»£c yÃªu thÃ­ch nháº¥t nÄƒm 2024 tá»« cÃ¡c salon hÃ ng Ä‘áº§u.",
      content: "<p>NÄƒm 2024 chá»©ng kiáº¿n sá»± lÃªn ngÃ´i cá»§a nhá»¯ng kiá»ƒu tÃ³c tá»± nhiÃªn vÃ  thÆ° giÃ£n. DÆ°á»›i Ä‘Ã¢y lÃ  top 10 kiá»ƒu tÃ³c hot nháº¥t...</p>",
      coverImage: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800",
      categoryId: blogCat3.id,
      authorId: adminUser.id,
      isPublished: true,
      isFeatured: true,
      viewCount: 1520,
    },
    {
      title: "CÃ¡ch chÄƒm sÃ³c tÃ³c sau khi nhuá»™m",
      slug: "cach-cham-soc-toc-sau-nhuom",
      excerpt: "Nhá»¯ng tips quan trá»ng giÃºp giá»¯ mÃ u tÃ³c nhuá»™m bá»n Ä‘áº¹p lÃ¢u hÆ¡n.",
      content: "<p>Sau khi nhuá»™m tÃ³c, viá»‡c chÄƒm sÃ³c Ä‘Ãºng cÃ¡ch lÃ  ráº¥t quan trá»ng Ä‘á»ƒ giá»¯ mÃ u bá»n vÃ  tÃ³c khá»e máº¡nh...</p>",
      coverImage: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800",
      categoryId: blogCat2.id,
      authorId: instructor1.id,
      isPublished: true,
      isFeatured: false,
      viewCount: 890,
    },
    {
      title: "Má»Ÿ salon tÃ³c cáº§n bao nhiÃªu vá»‘n?",
      slug: "mo-salon-toc-can-bao-nhieu-von",
      excerpt: "PhÃ¢n tÃ­ch chi phÃ­ má»Ÿ má»™t tiá»‡m tÃ³c tá»« nhá» Ä‘áº¿n lá»›n.",
      content: "<p>ÄÃ¢y lÃ  cÃ¢u há»i cá»§a ráº¥t nhiá»u ngÆ°á»i muá»‘n khá»Ÿi nghiá»‡p trong ngÃ nh tÃ³c. HÃ£y cÃ¹ng phÃ¢n tÃ­ch...</p>",
      coverImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800",
      categoryId: blogCat1.id,
      authorId: adminUser.id,
      isPublished: true,
      isFeatured: true,
      viewCount: 2100,
    },
    {
      title: "Xu hÆ°á»›ng tÃ³c balayage mÃ¹a hÃ¨ 2024",
      slug: "xu-huong-toc-balayage-2024",
      excerpt: "Balayage tiáº¿p tá»¥c lÃ  xu hÆ°á»›ng Ä‘Æ°á»£c Æ°a chuá»™ng trong mÃ¹a hÃ¨ nÃ y.",
      content: "<p>Balayage - ká»¹ thuáº­t nhuá»™m táº¡o hiá»‡u á»©ng chuyá»ƒn mÃ u tá»± nhiÃªn - tiáº¿p tá»¥c lÃ  lá»±a chá»n hÃ ng Ä‘áº§u...</p>",
      coverImage: "https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?w=800",
      categoryId: blogCat3.id,
      authorId: instructor2.id,
      isPublished: true,
      isFeatured: false,
      viewCount: 756,
    },
    {
      title: "5 sai láº§m thÆ°á»ng gáº·p khi chÄƒm sÃ³c tÃ³c táº¡i nhÃ ",
      slug: "5-sai-lam-cham-soc-toc",
      excerpt: "Nhá»¯ng thÃ³i quen tÆ°á»Ÿng tá»‘t nhÆ°ng láº¡i háº¡i tÃ³c.",
      content: "<p>CÃ³ nhá»¯ng thÃ³i quen tÆ°á»Ÿng chá»«ng vÃ´ háº¡i nhÆ°ng láº¡i cÃ³ thá»ƒ gÃ¢y háº¡i cho mÃ¡i tÃ³c cá»§a báº¡n...</p>",
      coverImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
      categoryId: blogCat2.id,
      authorId: instructor3.id,
      isPublished: true,
      isFeatured: true,
      viewCount: 1234,
    },
    {
      title: "Review cÃ¡c sáº£n pháº©m dÆ°á»¡ng tÃ³c tá»‘t nháº¥t 2024",
      slug: "review-san-pham-duong-toc-2024",
      excerpt: "ÄÃ¡nh giÃ¡ chi tiáº¿t cÃ¡c sáº£n pháº©m dÆ°á»¡ng tÃ³c Ä‘Æ°á»£c yÃªu thÃ­ch nháº¥t.",
      content: "<p>Trong bÃ i viáº¿t nÃ y, chÃºng tÃ´i sáº½ review chi tiáº¿t cÃ¡c sáº£n pháº©m dÆ°á»¡ng tÃ³c tá»‘t nháº¥t nÄƒm 2024...</p>",
      coverImage: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800",
      categoryId: blogCat1.id,
      authorId: adminUser.id,
      isPublished: true,
      isFeatured: false,
      viewCount: 678,
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.create({ data: post });
  }

  console.log("âœ… ÄÃ£ táº¡o 6 bÃ i viáº¿t");

  // ============ FORUM ============
  console.log("ðŸ’¬ Táº¡o diá»…n Ä‘Ã n...");

  const forumCat1 = await prisma.forumCategory.create({
    data: { name: "Há»i Ä‘Ã¡p chung", slug: "hoi-dap-chung", description: "Há»i Ä‘Ã¡p vá» ngÃ nh tÃ³c", icon: "help-circle", order: 1 },
  });
  const forumCat2 = await prisma.forumCategory.create({
    data: { name: "Ká»¹ thuáº­t cáº¯t & nhuá»™m", slug: "ky-thuat", description: "Trao Ä‘á»•i vá» ká»¹ thuáº­t", icon: "scissors", order: 2 },
  });
  const forumCat3 = await prisma.forumCategory.create({
    data: { name: "Chia sáº» kinh nghiá»‡m", slug: "chia-se", description: "Chia sáº» kinh nghiá»‡m lÃ m tÃ³c", icon: "message-circle", order: 3 },
  });
  const forumCat4 = await prisma.forumCategory.create({
    data: { name: "Tháº¯c máº¯c & GÃ³p Ã½", slug: "thac-mac", description: "Tháº¯c máº¯c vá» khÃ³a há»c vÃ  dá»‹ch vá»¥", icon: "alert-circle", order: 4 },
  });

  const threads = [
    {
      title: "HÆ°á»›ng dáº«n cÃ¡ch pha mÃ u nhuá»™m caramel cho ngÆ°á»i má»›i",
      slug: "huong-dan-pha-mau-nhuom-caramel",
      content: "<p>MÃ¬nh má»›i há»c nhuá»™m tÃ³c, ai cÃ³ kinh nghiá»‡m pha mÃ u caramel khÃ´ng? MÃ¬nh khÃ´ng biáº¿t tá»· lá»‡ nhÆ° tháº¿ nÃ o lÃ  Ä‘Ãºng...</p>",
      categoryId: forumCat2.id,
      authorId: user1.id,
      viewCount: 234,
      replyCount: 5,
    },
    {
      title: "TÃ³c bá»‹ khÃ´ vÃ  gÃ£y rá»¥ng nhiá»u pháº£i lÃ m sao?",
      slug: "toc-kho-ga-yung-nhieu",
      content: "<p>TÃ³c mÃ¬nh gáº§n Ä‘Ã¢y bá»‹ khÃ´, gÃ£y rá»¥ng nhiá»u. Äang dÃ¹ng dáº§u gá»™i bÃ¬nh thÆ°á»ng. MÃ¬nh nÃªn chuyá»ƒn sang sáº£n pháº©m nÃ o?</p>",
      categoryId: forumCat1.id,
      authorId: user2.id,
      viewCount: 567,
      replyCount: 12,
    },
    {
      title: "Chia sáº» cÃ¡ch mÃ¬nh tÄƒng doanh thu salon lÃªn 50%",
      slug: "chia-se-cach-tang-doanh-thu-salon",
      content: "<p>Xuáº¥t phÃ¡t tá»« má»™t salon nhá» vá»›i doanh thu 15 triá»‡u/thÃ¡ng, sau 6 thÃ¡ng Ã¡p dá»¥ng nhá»¯ng chiáº¿n lÆ°á»£c marketing...</p>",
      categoryId: forumCat3.id,
      authorId: instructor1.id,
      isPinned: true,
      viewCount: 1890,
      replyCount: 23,
    },
    {
      title: "NÃªn mua mÃ¡y uá»‘n nhiá»‡t hÃ£ng nÃ o tá»‘t?",
      slug: "nen-mua-may-uon-nhiet-hang-nao",
      content: "<p>Salon mÃ¬nh Ä‘ang cáº§n mua thÃªm mÃ¡y uá»‘n nhiá»‡t. NgÃ¢n sÃ¡ch khoáº£ng 5-10 triá»‡u. CÃ¡c bÃ¡c cÃ³ gá»£i Ã½ hÃ£ng nÃ o khÃ´ng?</p>",
      categoryId: forumCat1.id,
      authorId: user3.id,
      viewCount: 345,
      replyCount: 8,
    },
    {
      title: "Ká»¹ thuáº­t cáº¯t Layer cho tÃ³c dÃ y",
      slug: "ky-thuat-cat-layer-cho-toc-day",
      content: "<p>MÃ¬nh cÃ³ khÃ¡ch tÃ³c ráº¥t dÃ y, cáº¯t Layer nhÆ°ng váº«n khÃ´ng má»ng Ä‘Æ°á»£c. CÃ³ ai cÃ³ kinh nghiá»‡m vá»›i kiá»ƒu tÃ³c nÃ y khÃ´ng?</p>",
      categoryId: forumCat2.id,
      authorId: user1.id,
      viewCount: 189,
      replyCount: 6,
    },
  ];

  for (const thread of threads) {
    await prisma.forumThread.create({ data: thread });
  }

  console.log("âœ… ÄÃ£ táº¡o diá»…n Ä‘Ã n vá»›i 4 danh má»¥c vÃ  5 chá»§ Ä‘á»");

  // ============ COUPONS ============
  console.log("ðŸŽŸï¸ Táº¡o mÃ£ giáº£m giÃ¡...");

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME100",
        label: "ChÃ o má»«ng thÃ nh viÃªn má»›i",
        type: "PERCENT",
        value: 100000,
        minOrderAmount: 0,
        usageLimit: 1000,
        startsAt: now,
        expiresAt: nextMonth,
        isActive: true,
      },
      {
        code: "SUMMER2024",
        label: "Khuyáº¿n mÃ£i mÃ¹a hÃ¨",
        type: "PERCENT",
        value: 15,
        minOrderAmount: 500000,
        usageLimit: 500,
        startsAt: now,
        expiresAt: nextMonth,
        isActive: true,
      },
      {
        code: "COURSE50",
        label: "Giáº£m 50K cho khÃ³a há»c",
        type: "FIXED_AMOUNT",
        value: 50000,
        minOrderAmount: 200000,
        usageLimit: 200,
        startsAt: now,
        expiresAt: nextMonth,
        isActive: true,
      },
      {
        code: "VIP200",
        label: "VIP giáº£m 200K",
        type: "FIXED_AMOUNT",
        value: 200000,
        minOrderAmount: 1000000,
        maxDiscount: 200000,
        usageLimit: 100,
        startsAt: now,
        expiresAt: nextMonth,
        isActive: true,
      },
    ],
  });

  console.log("âœ… ÄÃ£ táº¡o 4 mÃ£ giáº£m giÃ¡");

  // ============ CERTIFICATE TEMPLATE ============
  console.log("ðŸ† Táº¡o máº«u chá»©ng chá»‰...");

  await prisma.certificateTemplate.create({
    data: {
      title: "Máº«u tiÃªu chuáº©n",
      description: "Máº«u chá»©ng chá»‰ máº·c Ä‘á»‹nh cá»§a SALON HAIR SYSTEM",
      svgTemplate: `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#f8f5f0"/>
        <rect x="40" y="40" width="720" height="520" fill="none" stroke="#c9a959" stroke-width="4"/>
        <rect x="50" y="50" width="700" height="500" fill="none" stroke="#c9a959" stroke-width="1"/>
        <text x="400" y="120" text-anchor="middle" font-family="Georgia" font-size="36" fill="#333">CERTIFICATE</text>
        <text x="400" y="160" text-anchor="middle" font-family="Georgia" font-size="24" fill="#666">of Completion</text>
        <line x1="200" y1="190" x2="600" y2="190" stroke="#c9a959" stroke-width="2"/>
        <text x="400" y="240" text-anchor="middle" font-family="Arial" font-size="14" fill="#888">This certifies that</text>
        <text x="400" y="290" text-anchor="middle" font-family="Georgia" font-size="32" fill="#1a1a1a" id="studentName">STUDENT NAME</text>
        <text x="400" y="330" text-anchor="middle" font-family="Arial" font-size="14" fill="#888">has successfully completed the course</text>
        <text x="400" y="380" text-anchor="middle" font-family="Georgia" font-size="24" fill="#333" id="courseTitle">COURSE TITLE</text>
        <text x="400" y="480" text-anchor="middle" font-family="Arial" font-size="12" fill="#999" id="instructorName">Instructor</text>
        <text x="400" y="530" text-anchor="middle" font-family="Arial" font-size="12" fill="#999" id="date">Date</text>
      </svg>`,
      placeholder: JSON.stringify({ studentName: "", courseTitle: "", instructorName: "", date: "" }),
      isDefault: true,
      isActive: true,
    },
  });

  console.log("âœ… ÄÃ£ táº¡o máº«u chá»©ng chá»‰");

  // ============ FAQ ============
  console.log("â“ Táº¡o FAQ...");

  await prisma.fAQ.createMany({
    data: [
      { question: "LÃ m sao Ä‘á»ƒ Ä‘Äƒng kÃ½ khÃ³a há»c?", answer: "Báº¡n cáº§n táº¡o tÃ i khoáº£n vÃ  Ä‘Äƒng nháº­p. Sau Ä‘Ã³ chá»n khÃ³a há»c vÃ  thanh toÃ¡n Ä‘á»ƒ Ä‘Äƒng kÃ½.", category: "KhÃ³a há»c", order: 1, isActive: true },
      { question: "KhÃ³a há»c cÃ³ thá»i háº¡n khÃ´ng?", answer: "KhÃ³a há»c khÃ´ng cÃ³ thá»i háº¡n. Báº¡n cÃ³ thá»ƒ há»c mÃ£i mÃ£i vÃ  xem láº¡i báº¥t ká»³ lÃºc nÃ o.", category: "KhÃ³a há»c", order: 2, isActive: true },
      { question: "LÃ m sao Ä‘á»ƒ nháº­n chá»©ng chá»‰?", answer: "Báº¡n cáº§n hoÃ n thÃ nh 100% bÃ i há»c vÃ  pass quiz cá»§a khÃ³a há»c. Chá»©ng chá»‰ sáº½ Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng.", category: "Chá»©ng chá»‰", order: 1, isActive: true },
      { question: "CÃ³ thá»ƒ hoÃ n tiá»n khÃ³a há»c khÃ´ng?", answer: "KhÃ³a há»c online khÃ´ng Ä‘Æ°á»£c hoÃ n tiá»n sau khi Ä‘Ã£ kÃ­ch hoáº¡t. Vui lÃ²ng Ä‘á»c ká»¹ mÃ´ táº£ trÆ°á»›c khi mua.", category: "KhÃ³a há»c", order: 3, isActive: true },
      { question: "CÃ¡ch thanh toÃ¡n nhÆ° tháº¿ nÃ o?", answer: "ChÃºng tÃ´i há»— trá»£ thanh toÃ¡n qua VietQR (chuyá»ƒn khoáº£n ngÃ¢n hÃ ng), VNPay vÃ  MoMo.", category: "Thanh toÃ¡n", order: 1, isActive: true },
      { question: "Sáº£n pháº©m cÃ³ Ä‘Æ°á»£c Ä‘á»•i tráº£ khÃ´ng?", answer: "Sáº£n pháº©m váº­t lÃ½ Ä‘Æ°á»£c Ä‘á»•i tráº£ trong 7 ngÃ y náº¿u cÃ²n nguyÃªn seal. KhÃ³a há»c online khÃ´ng Ä‘Æ°á»£c hoÃ n tiá»n.", category: "Sáº£n pháº©m", order: 1, isActive: true },
    ],
  });

  console.log("âœ… ÄÃ£ táº¡o FAQ");

  // ============ TAGS ============
  console.log("ðŸ·ï¸ Táº¡o tags...");

  await prisma.tag.createMany({
    data: [
      { name: "Hot", slug: "hot", type: "COURSE" },
      { name: "Má»›i", slug: "new", type: "COURSE" },
      { name: "Bestseller", slug: "bestseller", type: "COURSE" },
      { name: "Free", slug: "free", type: "COURSE" },
      { name: "Sale", slug: "sale", type: "PRODUCT" },
      { name: "New", slug: "new-product", type: "PRODUCT" },
    ],
  });

  console.log("âœ… ÄÃ£ táº¡o tags");

  // ============ USER ADDRESSES ============
  console.log("ðŸ“ Táº¡o Ä‘á»‹a chá»‰ máº«u...");

  await prisma.userAddress.createMany({
    data: [
      {
        userId: user1.id,
        type: "SHIPPING",
        label: "NhÃ  riÃªng",
        fullName: "Tráº§n Ngá»c Anh",
        phone: "0987654321",
        addressLine1: "123 ÄÆ°á»ng LÃª Lá»£i",
        city: "TP.HCM",
        postalCode: "700000",
        isDefault: true,
      },
      {
        userId: user2.id,
        type: "SHIPPING",
        label: "Cá»­a hÃ ng",
        fullName: "LÃª Thanh Lan",
        phone: "0987654322",
        addressLine1: "456 ÄÆ°á»ng Nguyá»…n Huá»‡",
        addressLine2: "Quáº­n 1",
        city: "TP.HCM",
        postalCode: "700000",
        isDefault: true,
      },
    ],
  });

  console.log("âœ… ÄÃ£ táº¡o Ä‘á»‹a chá»‰ máº«u");

  console.log("ðŸŽ‰ Seed hoÃ n táº¥t!");
  console.log("\nðŸ“‹ TÃ i khoáº£n test:");
  console.log("  Admin: admin@salonhair.vn / password123");
  console.log("  Giáº£ng viÃªn: giangvien@salonhair.vn / password123");
  console.log("  User: ngocanh@gmail.com / password123");
}

main()
  .catch((e) => {
    console.error("âŒ Lá»—i seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
