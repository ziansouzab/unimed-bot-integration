import express from 'express';
import { cadastrarPlano } from './controllers/unimed.controller.js';

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


app.post('/api/cadastrar', cadastrarPlano);

app.post('/api/excluir-plano', async (req, res) => {
    try {
        const validacao = exclusaoSchema.safeParse(req.body);
        
        if (!validacao.success) {
            const errosFormatados = validacao.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
            console.warn(`Erro de validação do Zod: Dados inválidos recebidos.`);
            
            return res.status(400).json({ 
                erro: 'Dados de entrada inválidos', 
                detalhes: errosFormatados 
            });
        }

        const job = await roboQueue.add('excluir', validacao.data);
       
        return res.status(202).json({mensagem: "Tarefa adicionada a fila com sucesso.", tarefa: job.id});

    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: String(erro) });
    }
})

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`API do Robô rodando na porta ${PORT}`);
});