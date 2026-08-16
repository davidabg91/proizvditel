-- CreateTable
CREATE TABLE "ProducerPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProducerPartner_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProducerPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Producer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProducerPartner_partnerId_idx" ON "ProducerPartner"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProducerPartner_producerId_partnerId_key" ON "ProducerPartner"("producerId", "partnerId");
