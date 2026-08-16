-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'producer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Producer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "urn" TEXT,
    "farmName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "description" TEXT,
    "region" TEXT,
    "town" TEXT,
    "phone" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "startedYear" INTEGER,
    "totalDecares" REAL,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "sharedDelivery" BOOLEAN NOT NULL DEFAULT false,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Producer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "varieties" TEXT,
    "sinceYear" INTEGER,
    "decares" REAL,
    "annualYield" REAL,
    "yieldUnit" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Crop_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'gallery',
    "caption" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" REAL NOT NULL,
    "oldPrice" REAL,
    "unit" TEXT NOT NULL DEFAULT 'кг',
    "currency" TEXT NOT NULL DEFAULT 'BGN',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "isOffer" BOOLEAN NOT NULL DEFAULT false,
    "stockNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductListing_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ProductListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "acceptsBankTransfer" BOOLEAN NOT NULL DEFAULT false,
    "bankName" TEXT,
    "bankIban" TEXT,
    "bankHolder" TEXT,
    "acceptsRevolut" BOOLEAN NOT NULL DEFAULT false,
    "revolutLink" TEXT,
    "acceptsCod" BOOLEAN NOT NULL DEFAULT false,
    "codNote" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSettings_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_userId_key" ON "Producer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_slug_key" ON "Producer"("slug");

-- CreateIndex
CREATE INDEX "Producer_region_idx" ON "Producer"("region");

-- CreateIndex
CREATE INDEX "Producer_town_idx" ON "Producer"("town");

-- CreateIndex
CREATE INDEX "Producer_sharedDelivery_idx" ON "Producer"("sharedDelivery");

-- CreateIndex
CREATE INDEX "Crop_producerId_idx" ON "Crop"("producerId");

-- CreateIndex
CREATE INDEX "Photo_producerId_type_idx" ON "Photo"("producerId", "type");

-- CreateIndex
CREATE INDEX "ProductListing_category_idx" ON "ProductListing"("category");

-- CreateIndex
CREATE INDEX "ProductListing_available_idx" ON "ProductListing"("available");

-- CreateIndex
CREATE UNIQUE INDEX "ProductListing_producerId_slug_key" ON "ProductListing"("producerId", "slug");

-- CreateIndex
CREATE INDEX "ListingPhoto_listingId_idx" ON "ListingPhoto"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSettings_producerId_key" ON "PaymentSettings"("producerId");

-- CreateIndex
CREATE INDEX "Review_producerId_idx" ON "Review"("producerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_producerId_authorId_key" ON "Review"("producerId", "authorId");
