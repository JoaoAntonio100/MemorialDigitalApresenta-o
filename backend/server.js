import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './src/lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  return res.json({
    mensagem: 'API do Memorial Digital funcionando.'
  });
});

app.get('/teste-banco', async (req, res) => {
  try {
    const quantidade = await prisma.memorial.count();

    return res.json({
      bancoConectado: true,
      quantidadeDeMemoriais: quantidade
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      bancoConectado: false,
      erro: error.message
    });
  }
});

const memoriais = [
  {
    id: '1',
    nome: 'Exemplo de Memorial',
    dataNascimento: '01/01/1900',
    dataMorte: '01/01/2000',
    setor: 'A',
    lote: '1',
    localizacao: 'Quadra A, Lote 1',
    descricao: 'Memorial de exemplo',
    biografia: 'Biografia de exemplo',
    imagem: '',
    tipo: 'historica',
    data: '30/07/2026'
  }
];

app.get('/api/memoriais', (req, res) => {
  res.json(memoriais);
});

app.post('/api/memoriais', (req, res) => {
  const memorial = {
    ...req.body,
    id: Date.now().toString(),
    data: new Date().toLocaleDateString('pt-BR')
  };
  memoriais.unshift(memorial);
  res.status(201).json(memorial);
});

app.put('/api/memoriais/:id', (req, res) => {
  const index = memoriais.findIndex(item => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Memorial não encontrado' });
  }

  memoriais[index] = { ...memoriais[index], ...req.body };
  res.json(memoriais[index]);
});

app.delete('/api/memoriais/:id', (req, res) => {
  const index = memoriais.findIndex(item => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Memorial não encontrado' });
  }

  memoriais.splice(index, 1);
  res.json({ message: 'Memorial removido' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@memorial.com' && password === '123456') {
    return res.json({ success: true, token: 'fake-token' });
  }

  return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
