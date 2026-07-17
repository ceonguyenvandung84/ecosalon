-- Seed data for ecosalon D1 (SQLite compatible)
-- Password for admin@ecosalon.vn is Admin@123

-- 1 admin user
INSERT INTO "User" ("id","email","password","fullName","role","isActive","tags","updatedAt")
VALUES ('usr_admin001','admin@ecosalon.vn','$2a$10$KymvUJpp207Ty/15a7IMo.0UlX7ndjtNALUzT8yoL27hhLArp42hO','Quản trị viên','ADMIN',1,'[]',CURRENT_TIMESTAMP);

-- Categories
INSERT INTO "Category" ("id","name","slug","type","createdAt")
VALUES ('cat_prod001','Mỹ phẩm','my-pham','PRODUCT',CURRENT_TIMESTAMP);
INSERT INTO "Category" ("id","name","slug","type","createdAt")
VALUES ('cat_course001','Đào tạo tóc','dao-tao-toc','COURSE',CURRENT_TIMESTAMP);

-- Products
INSERT INTO "Product" ("id","title","slug","shortDesc","description","images","price","categoryId","stock","updatedAt")
VALUES ('prod_001','Dầu gội phục hồi EcoSalon','dau-goi-phuc-hoi-ecosalon','Dầu gội chuyên sâu cho tóc hư tổn','Dầu gội chiết xuất tự nhiên, phục hồi tóc hư tổn và giúp tóc mềm mượt.', '["https://picsum.photos/seed/eco1/600/600"]', 199000, 'cat_prod001', 50, CURRENT_TIMESTAMP);
INSERT INTO "Product" ("id","title","slug","shortDesc","description","images","price","categoryId","stock","updatedAt")
VALUES ('prod_002','Serum dưỡng tóc bóng mượt','serum-duong-toc-bong-muot','Serum chống xơ rối','Serum tinh chất giúp tóc bóng mượt, giảm xơ rối hiệu quả.', '["https://picsum.photos/seed/eco2/600/600"]', 149000, 'cat_prod001', 30, CURRENT_TIMESTAMP);
INSERT INTO "Product" ("id","title","slug","shortDesc","description","images","price","categoryId","stock","updatedAt")
VALUES ('prod_003','Mặt nạ dưỡng da spa','mat-na-duong-da-spa','Mặt nạ thư giãn','Mặt nạ spa thư giãn, cấp ẩm sâu cho làn da.', '["https://picsum.photos/seed/eco3/600/600"]', 259000, 'cat_prod001', 20, CURRENT_TIMESTAMP);

-- Courses
INSERT INTO "Course" ("id","title","slug","shortDesc","description","price","level","instructorName","categoryId","requirements","objectives","tags","updatedAt")
VALUES ('course_001','Cắt tóc nam chuyên nghiệp','cat-toc-nam-chuyen-nghiep','Khóa học cắt tóc nam từ cơ bản đến nâng cao','Học viên được đào tạo bài bản kỹ thuật cắt tóc nam hiện đại, fade, undercut.', 1290000, 'BEGINNER', 'GV Nguyễn Văn A', 'cat_course001', '[]', '["Cắt được các kiểu tóc nam cơ bản","Biết kỹ thuật fade"]', '["cat-toc","co-ban"]', CURRENT_TIMESTAMP);
INSERT INTO "Course" ("id","title","slug","shortDesc","description","price","level","instructorName","categoryId","requirements","objectives","tags","updatedAt")
VALUES ('course_002','Nhuộm tóc & Highlight nghệ thuật','nhuom-toc-highlight-nghe-thuat','Khóa học nhuộm tóc chuyên sâu','Đào tạo kỹ thuật nhuộm, highlight, color correction chuyên nghiệp.', 1890000, 'INTERMEDIATE', 'GV Trần Thị B', 'cat_course001', '[]', '["Pha màu chuẩn","Kỹ thuật highlight"]', '["nhuom","highlight"]', CURRENT_TIMESTAMP);
