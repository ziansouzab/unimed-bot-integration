import { conexaoRedis } from '../config/redis.js';


async function obterTokenAutenticacao(): Promise<string> {
    const CHAVE_REDIS = 'token_api_siprov';

    const tokenEmCache = await conexaoRedis.get(CHAVE_REDIS);
    
    if (tokenEmCache) {
        console.log('[API Integrada] Usando token em cache do Redis.');
        return tokenEmCache;
    }

    console.log('[API Integrada] Token expirado ou ausente. Gerando um novo...');

    const stringLogin = Buffer.from(`${process.env.SIPROV_EMAIL}:${process.env.SIPROV_SENHA}`).toString('base64');
    
    const respostaAuth = await fetch('https://acesso.siprov.com.br/siprov-api/ext/autenticacao', {
        method: 'POST',
        headers: { 
            'Authorization': `Basic ${stringLogin}`,
            'Accept': '*/*',  
        }
    });

    if (!respostaAuth.ok) {
        throw new Error(`Falha ao autenticar na API externa: ${respostaAuth.statusText}`);
    }

    const dadosAuth = await respostaAuth.json();
    const novoToken = dadosAuth.authorizationToken; 

    const tempoExpiracaoSegundos = 43100; 

    await conexaoRedis.setex(CHAVE_REDIS, tempoExpiracaoSegundos, novoToken);

    return novoToken;
}

export async function buscarDadosBeneficiario(codPessoa: string) {
    let token = await obterTokenAutenticacao();

    const urlConsulta = `https://acesso.siprov.com.br/siprov-api/ext/associado`;
    const params = new URLSearchParams({
        codPessoa: codPessoa
    });

    const urlComParams = `${urlConsulta}?${params.toString()}`;

    let resposta = await fetch(urlComParams, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*'
        }
    });

    if (resposta.status === 401) {
        console.warn('[API Integrada] Token foi rejeitado pela API. Forçando renovação...');
        await conexaoRedis.del('token_api_siprov');
        
        token = await obterTokenAutenticacao();
        
        resposta = await fetch(urlConsulta, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });
    }

    if (!resposta.ok) {
        throw new Error(`Erro ao buscar dados na API: ${resposta.status}`);
    }

    return await resposta.json();
}