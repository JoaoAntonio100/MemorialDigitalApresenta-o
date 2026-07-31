-- AlterTable
ALTER TABLE "Memorial" ADD COLUMN     "dataMorte" TEXT,
ADD COLUMN     "dataNascimento" TEXT,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "localizacao" TEXT,
ADD COLUMN     "tipo" TEXT DEFAULT 'historica';
