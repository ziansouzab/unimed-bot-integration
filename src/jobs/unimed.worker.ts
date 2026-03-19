import { Worker } from 'bullmq';
import { conexaoRedis } from '../config/redis.js';

import cadastrarPessoa from '../automation/cadastrar-plano.js';
import excluirPessoa from '../automation/cancelar-plano.js';

export const iniciarWorker = () => {
    const worker = new Worker('FilaRoboUnimed', async(job) => {
        console.log(`[Worker] iniciando tarefa ID ${job.id} - Tipo: ${job.name}`);
    
        let resultado;
    
        try{ 
            if (job.name === 'cadastrar') {
                resultado = await cadastrarPessoa(job.data);
            } else if (job.name === 'excluir') {
                resultado = await excluirPessoa(job.data);
            }
    
            const webhookRetorno =  process.env.WEBHOOK_USER_MESSAGE;
    
            if (webhookRetorno) {
                await fetch(webhookRetorno, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tarefa_id: job.id,
                        tipo: job.name,
                        resultado: resultado
                    })
                });
    
                console.log(`Resultado enviado com sucesso!`);
            }
    
            return resultado;
    
        } catch(e) {
            console.error( `Erro fatal na tarefa ${job.id}`, e);
            throw e;
        }
    }, {connection: conexaoRedis as any, concurrency: 1});
}