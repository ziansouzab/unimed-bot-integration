import type { Request, Response } from 'express';

import { roboQueue } from '../config/redis.js';
import { cadastroSchema, exclusaoSchema } from '../schemas/unimed.schema.js';
import { buscarDadosBeneficiario } from '../integrations/api-dados.js';
import { adaptarParaRobo } from '../integrations/adapter.js';

export const orquestradorUnimed =  async (req: Request, res: Response): Promise<any> => {

    try{
        const {codPessoa, tipoSituacao} = req.body;

        if (!codPessoa || !tipoSituacao) {
            return res.status(400).json({
                erro: "código da pessoa ou tipo da situação não informados!"
            })
        }

        const situacaoLimpa = String(tipoSituacao).trim().toUpperCase();

        if(situacaoLimpa === "ATIVO") {
            console.log('[Orquestrador] Direcionando pessoa para CADASTRO DO PLANO');
            return await cadastrarPlano(req,res);
        } else if (situacaoLimpa === "INATIVO") {
            console.log('[Orquestrador] Direcionando pessoa para EXCLUSAO DO PLANO');
            return await excluirPlano(req, res);
        } else {
            return res.status(400).json({erro: 'Tipo de situação não reconhecida pelo robô.'});
        }

    } catch( erro) {
        console.error('[Orquestrador] Erro crítico no endpoint unificado:', erro);
        return res.status(500).json({ sucesso: false, erro: String(erro)});
    }
}

export const cadastrarPlano = async (req: Request, res: Response): Promise<any> => {

    try {
        const { codPessoa } = req.body;

        const dadosCliente = await buscarDadosBeneficiario(codPessoa);

        const dadosAdaptados = adaptarParaRobo(dadosCliente);

        const validacao = cadastroSchema.safeParse(dadosAdaptados);

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

export const excluirPlano = async (req: Request, res: Response): Promise<any> => {

    try {
        const { codPessoa } = req.body;

        const dadosCliente = await buscarDadosBeneficiario(codPessoa);

        const pessoa = dadosCliente.itens?.[0];

        const dadosAdaptados = {
            cpf: (pessoa.cpfCnpj || "").replace(/\D/g, ''),
            nomeCompleto: pessoa.nomePessoa
        }

        const validacao = exclusaoSchema.safeParse(dadosAdaptados);
        
        if (!validacao.success) {
            const errosFormatados = validacao.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
            console.warn(`[Controller] Erro de validação do Zod: Dados inválidos recebidos.`);
            
            return res.status(400).json({ 
                erro: 'Dados de entrada inválidos', 
                detalhes: errosFormatados 
            });
        }

        const job = await roboQueue.add('excluir', validacao.data); 
        return res.status(202).json({mensagem: 'Tarefa adicionada a fila com sucesso.', tarefa: job.id});
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: String(erro) });
    }
}
