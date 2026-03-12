import { chromium } from 'playwright';
import gerarSessao from './gerar-sessao.js';

export default async function excluirPessoa(dados: any, tentativa = 1) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
        ]
     });
    const context = await browser.newContext({ storageState: 'sessao.json' });
    const page = await context.newPage();

    function obterPrimeiroDiaDoMesAtual(): string {
    const dataAtual = new Date();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    
    const ano = dataAtual.getFullYear();

    return `01/${mes}/${ano}`; 
    }

    try {

        console.log(`Cancelando plano...`);
        await page.goto("https://portal.segurosunimed.com.br/");
        
        try{
            await page.getByText("Sair do Portal", {exact: false}).waitFor({ state: "visible", timeout: 5000 });
            console.log('🔓 Sessão válida detectada. Continuando...');
        } catch (erroSessao) {
            if (tentativa === 1) {
                console.warn('Sessão inválida ou expirada! Iniciando auto-renovação...');
                
                await browser.close(); 
                
                await gerarSessao(); 
                
                console.log('Nova sessão gerada! Reiniciando o processo...');
                
                return await excluirPessoa(dados, 2); 
            } else {
                throw new Error('Falha na autenticação mesmo após renovar a sessão. Verifique as credenciais no .env.');
            }
        }
        await page.getByRole('button', { name: 'Estipulante'}).waitFor({ state: "visible", timeout: 10000});
        await page.getByRole('button', { name: 'Estipulante'}).click();
        await page.waitForURL('**https://portal.segurosunimed.com.br/estipulante**', { timeout: 10000 });
        
        await page.goto('https://portal.segurosunimed.com.br/estipulante/odonto/movimentacao-cadastral/cadastros/excluir-beneficiario');

        const frameExclusao = page.frameLocator('iframe.responsive-iframe');

        await frameExclusao.locator('#pesq_benef').waitFor({ state: 'visible' });
        await frameExclusao.locator('img[onclick*="abrePesquisaBeneficiario()"]').click();

        const popupBusca = frameExclusao.locator('#divPopUp');
        await popupBusca.waitFor({state: 'visible'});
        await popupBusca.locator("#num_cpf").fill(dados.cpf);
        await popupBusca.locator('#continuar').click();

        const divResultado = popupBusca.locator('#divResultado');
        await divResultado.waitFor({ state: 'visible' });
        await divResultado.locator('tr').filter({ hasText: 'ATIVO'}).locator('a').first().click();

        await popupBusca.waitFor({ state: 'hidden', timeout: 10000});
        await frameExclusao.locator('.botao.continuar').click();

        await frameExclusao.getByText("Referência da Movimentação", {exact: false}).waitFor({ state: "visible", timeout: 10000 });

        const dataExclusao = obterPrimeiroDiaDoMesAtual();
        await frameExclusao.locator('#dt_exclusao').fill(dataExclusao);

        await frameExclusao.locator('#cod_motivo_exc_assoc').selectOption('53');

        await frameExclusao.locator('.botao.incluir').click();

        try{
            const divMensagem = frameExclusao.locator('.msgErro');
            await divMensagem.waitFor({ state: 'visible', timeout: 10000 });
            const textoRetorno = await divMensagem.innerText();

            if (textoRetorno.toLowerCase().includes('sucesso')) {
                console.log('SUCESSO: Pessoa excluida com sucesso!');
                console.log(`Mensagem exata: ${textoRetorno.trim()}`);
                return { sucesso: true, mensagem: textoRetorno.trim() };
            } else {
                console.error(`ALERTA: O site retornou uma falha de negócio ao excluir.`);
                console.error(`Motivo: ${textoRetorno.trim()}`);
                return { sucesso: false, mensagem: textoRetorno.trim() };
            }

        } catch (erroTimeout) {
            console.error('ERRO: O site demorou muito para responder ou não exibiu nenhuma mensagem.');
            return { sucesso: false, mensagem: "O portal da Seguradora demorou muito para responder." };
        }

    } catch(e){
        console.error('Erro na execução do robô:', e);
        return { sucesso: false, mensagem: `Erro interno no robô: ${String(e)}` };
    } finally {
        if (browser.isConnected()){
            await browser.close();
        }
    }
}
