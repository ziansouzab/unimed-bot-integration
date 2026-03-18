import express from 'express';
import {z} from 'zod';

import cadastrarPessoa from './cadastrar-plano.js';
import excluirPessoa from './cancelar-plano.js';
import gerarSessao from './gerar-sessao.js';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    const CHAVE_SECRETA = process.env.API_KEY_ROBO;
    
    const chaveRecebida = req.headers['x-api-key'];

    if (!chaveRecebida || chaveRecebida !== CHAVE_SECRETA) {
        console.warn('Tentativa de acesso bloqueada (API Key inválida).');
        return res.status(401).json({ erro: 'Acesso negado. Chave de API inválida.' });
    }

    next();
});

const cadastroSchema = z.object({
    nomeCompleto: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
    cpf: z.string().length(11, "CPF deve conter exatamente 11 números, sem pontuação"),
    sexo: z.enum(["Masculino", "Feminino"], {message: "Sexo é obrigatório e deve ser 'Masculino' ou 'Feminino'"}),
    dataNascimento: z.string().length(10, "Data de nascimento deve ter 10 caracteres (DD/MM/AAAA)"),
    nomeMae: z.string().min(3, "Nome da mãe obrigatório"),
    estadoCivil: z.string(),
    planoSaude: z.string(),
    ufMunicipio: z.string().min(4, "UF deve conter o nome completo do estado"),
    nomeMunicipio: z.string().min(2, "Nome do município é obrigatório"),
    cartaoSaude: z.string(),
    cep: z.string().length(8, "CEP deve conter exatamente 8 números"),
    numEndereco: z.string().min(1, "Número do endereço é obrigatório"),
    dddCelular: z.string().length(2, "DDD deve ter 2 números"),
    numCelular: z.string().min(8, "Número de celular inválido"),
    email: z.string().email("Formato de e-mail inválido"),
    matriculaEmpresa: z.string().min(1, "Matrícula é obrigatória"),
    dataAdmissao: z.string().length(10, "Data de admissão deve ter 10 caracteres (DD/MM/AAAA)")
});

const exclusaoSchema = z.object({
    nomeCompleto: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
    cpf: z.string().length(11, "CPF deve conter exatamente 11 números, sem pontuação"),
})

app.post('/api/cadastrar', async (req, res) => {
    try {
        const validacao = cadastroSchema.safeParse(req.body);
        if (!validacao.success) {
            const errosFormatados = validacao.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
            console.warn(`Erro de validação do Zod: Dados inválidos recebidos.`);
            
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'Dados de entrada inválidos', 
                detalhes: errosFormatados 
            });
        }
        const dados = validacao.data;
        await gerarSessao();
        const resultadoRobo = await cadastrarPessoa(dados); 

        if(resultadoRobo.sucesso){
            return res.status(201).json({mensagem: 'Beneficiário cadastrado com sucesso.'});
        } else{
            return res.status(400).json(resultadoRobo);
        }
        
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: String(erro) });
    }
});

app.post('/api/excluir-plano', async (req, res) => {
    try {
        const validacao = exclusaoSchema.safeParse(req.body);
        
        if (!validacao.success) {
            const errosFormatados = validacao.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
            console.warn(`Erro de validação do Zod: Dados inválidos recebidos.`);
            
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'Dados de entrada inválidos', 
                detalhes: errosFormatados 
            });
        }

        const dados = validacao.data;
        await gerarSessao();
        const resultadoRobo = await excluirPessoa(dados);

        if (resultadoRobo.sucesso){
            return res.status(200).json({mensagem: "Beneficiário excluído com sucesso"});
        } else {
            return res.status(400).json(resultadoRobo);
        }

    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: String(erro) });
    }
})

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`API do Robô rodando na porta ${PORT}`);
});