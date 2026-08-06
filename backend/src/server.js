import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

import prisma from "./lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

if (!JWT_SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
  throw new Error("JWT_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD_HASH devem ser configurados.");
}

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token de autenticação ausente." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ erro: "Acesso não autorizado." });
    }

    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
};

const app = express();

// The deployed API is behind Render's reverse proxy, so req.ip uses the client address.
app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    // Requests without Origin are non-browser clients, such as health checks.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
}));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/", (req, res) => {
  return res.json({
    mensagem: "API do Memorial Digital funcionando.",
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (attempts && now - attempts.firstAttempt < LOGIN_WINDOW_MS) {
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const retryAfter = Math.ceil((LOGIN_WINDOW_MS - (now - attempts.firstAttempt)) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ message: "Muitas tentativas. Tente novamente mais tarde." });
    }
  } else if (attempts) {
    loginAttempts.delete(ip);
  }

  const passwordMatches = typeof password === "string"
    && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (email === ADMIN_EMAIL && passwordMatches) {
    loginAttempts.delete(ip);
    const token = jwt.sign(
      { email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      token,
    });
  }

  const currentAttempts = loginAttempts.get(ip);
  loginAttempts.set(ip, {
    count: (currentAttempts?.count || 0) + 1,
    firstAttempt: currentAttempts?.firstAttempt || now,
  });

  return res.status(401).json({
    success: false,
    message: "Credenciais inválidas.",
  });
});

app.get("/api/teste-banco", async (req, res) => {
  try {
    const quantidade = await prisma.memorial.count();

    return res.json({
      bancoConectado: true,
      quantidadeDeMemoriais: quantidade,
    });
  } catch (error) {
    console.error("Erro ao acessar o banco:", error);

    return res.status(500).json({
      bancoConectado: false,
      erro: error.message,
    });
  }
});

app.get("/api/memoriais", async (req, res) => {
  try {
    const memoriais = await prisma.memorial.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(memoriais);
  } catch (error) {
    console.error("Erro ao listar memoriais:", error);
    return res.status(500).json({ erro: error.message });
  }
});

app.get("/api/memoriais/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id },
    });

    if (!memorial) {
      return res.status(404).json({ erro: "Memorial não encontrado." });
    }

    return res.json(memorial);
  } catch (error) {
    console.error("Erro ao buscar memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
});

app.post("/api/memoriais", authenticateAdmin, upload.fields([
  { name: "imagem", maxCount: 1 },
  { name: "galeria", maxCount: 10 },
]), async (req, res) => {
  try {
    const { nome, biografia, descricao, dataNascimento, dataMorte, localizacao, tipo } = req.body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({ erro: "O campo nome é obrigatório." });
    }

    const imagensGaleria = (req.files?.galeria || []).map((file) => `/uploads/${file.filename}`);
    const imagemPrincipal = req.files?.imagem?.[0]
      ? `/uploads/${req.files.imagem[0].filename}`
      : (req.body.imagem?.trim() || imagensGaleria[0] || null);

    const memorial = await prisma.memorial.create({
      data: {
        nome: nome.trim(),
        biografia: biografia?.trim() || null,
        descricao: descricao?.trim() || null,
        dataNascimento: dataNascimento?.trim() || null,
        dataMorte: dataMorte?.trim() || null,
        localizacao: localizacao?.trim() || null,
        tipo: tipo || "historica",
        imagem: imagemPrincipal,
        galeria: imagensGaleria,
      },
    });

    return res.status(201).json(memorial);
  } catch (error) {
    console.error("Erro ao criar memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
});

app.put("/api/memoriais/:id", authenticateAdmin, upload.fields([
  { name: "imagem", maxCount: 1 },
  { name: "galeria", maxCount: 10 },
]), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const { nome, biografia, descricao, dataNascimento, dataMorte, localizacao, tipo } = req.body;

    const memorialExistente = await prisma.memorial.findUnique({
      where: { id },
    });

    if (!memorialExistente) {
      return res.status(404).json({ erro: "Memorial não encontrado." });
    }

    const galeriaNova = (req.files?.galeria || []).map((file) => `/uploads/${file.filename}`);
    const galeriaFinal = galeriaNova.length > 0 ? galeriaNova : memorialExistente.galeria ?? [];
    const imagemPrincipal = req.files?.imagem?.[0]
      ? `/uploads/${req.files.imagem[0].filename}`
      : (req.body.imagem?.trim() || memorialExistente.imagem || galeriaFinal[0] || null);

    const memorial = await prisma.memorial.update({
      where: { id },
      data: {
        nome: nome?.trim() || memorialExistente.nome,
        biografia: biografia === undefined ? memorialExistente.biografia : biografia?.trim() || null,
        descricao: descricao === undefined ? memorialExistente.descricao : descricao?.trim() || null,
        dataNascimento: dataNascimento === undefined ? memorialExistente.dataNascimento : dataNascimento?.trim() || null,
        dataMorte: dataMorte === undefined ? memorialExistente.dataMorte : dataMorte?.trim() || null,
        localizacao: localizacao === undefined ? memorialExistente.localizacao : localizacao?.trim() || null,
        tipo: tipo || memorialExistente.tipo || "historica",
        imagem: imagemPrincipal,
        galeria: galeriaFinal,
      },
    });

    return res.json(memorial);
  } catch (error) {
    console.error("Erro ao atualizar memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
});

app.delete("/api/memoriais/:id", authenticateAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const memorialExistente = await prisma.memorial.findUnique({
      where: { id },
    });

    if (!memorialExistente) {
      return res.status(404).json({ erro: "Memorial não encontrado." });
    }

    await prisma.memorial.delete({
      where: { id },
    });

    return res.json({ mensagem: "Memorial removido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
