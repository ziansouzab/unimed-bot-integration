import type { Request, Response } from 'express';

import { roboQueue } from '../config/redis.js';
import { cadastroSchema, exclusaoSchema } from '../schemas/unimed.schema.js';
import { buscarDadosBeneficiario } from '../integrations/api-dados.js';

export const cadastrarPlano = async (req: Request, res: Response): Promise<any> => {

    try {
        const { codPessoa, tipoSituacao } = req.body;

        if ( !codPessoa || tipoSituacao !== "ATIVO") {
            return res.status(400).json({
                erro: "Dados não informados na requisição."
            });
        }

        const dadosCliente = await buscarDadosBeneficiario(codPessoa);

        const validacao = cadastroSchema.safeParse(dadosCliente);

         if (!validacao.success) {
            const errosFormatados = validacao.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
            console.warn(`[Controller] Erro de validação do Zod: Dados inválidos recebidos.`);
            
            return res.status(400).json({ 
                erro: 'Dados de entrada inválidos', 
                detalhes: errosFormatados 
            });
        }

        const job = await roboQueue.add('cadastrar', validacao.data); 
        return res.status(202).json({mensagem: 'Tarefa adicionada a fila com sucesso.', tarefa: job.id});
    } catch(erro) {
        res.status(500).json({ sucesso: false, erro: String(erro) });
    }

}
