-- CreateTable
CREATE TABLE "Memorial" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "biografia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memorial_pkey" PRIMARY KEY ("id")
);
