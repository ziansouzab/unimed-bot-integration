import express from 'express';
import { iniciarWorker } from './jobs/unimed.worker.js';
import { orquestradorUnimed } from './controllers/unimed.controller.js';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    const CHAVE_SECRETA = process.env.API_KEY_ROBO;
    
    const chaveRecebida = req.headers['x-api-key'];

    if (!chaveRecebida || chaveRecebida !== CHAVE_SECRETA) {
        return res.status(401).json({ erro: 'Acesso negado. Chave de API inválida.' });
    }

    next();
});


app.post('/api/unimed', orquestradorUnimed);



const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`API do Robô rodando na porta ${PORT}`);

    try{
        iniciarWorker();
        console.log('[Worker] Worker do BullMQ iniciado com sucesso!');
    } catch(erro){
        console.error('Erro ao iniciar o worker');
    }
});