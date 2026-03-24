import { chromium } from 'playwright';
import gerarSessao from './gerar-sessao.js';


export default async function cadastrarPessoa(dados: any, tentativa = 1) {

    const mapaEstadoCivil: Record<string, string> = {
        "SOLTEIRO": "1",
        "CASADO": "2",
        "VIUVO": "3",
        "SEPARADO": "4",
        "DIVORCIADO": "5",
        "OUTROS": "6",
        "UNIAO ESTAVEL": "7"
    };

    const mapaPlanoSaude: Record<string, string> = {
        "ESSENCIAL PLUS DOC ADESAO": "388",
        "ESSENCIAL ADESAO": "338",
        "PLENO (SEM ORTO) ADESAO": "454",
        "ESSENCIAL PLUS ADESAO": "384"
    };

    const mapaPlanoSiprovPlanoUnimed: Record<string, string> = {
        "Essencial Nacional": "ESSENCIAL ADESAO",
        "Essencial Plus Nacional": "ESSENCIAL PLUS ADESAO",
        "Essencial Plus Doc Nacional": "ESSENCIAL PLUS DOC ADESAO",
        "Pleno Nacional": "PLENO (SEM ORTO) ADESAO"
    };

    const planoSaudeUnimed =  mapaPlanoSiprovPlanoUnimed[dados.planos[0].nome];

    if (!planoSaudeUnimed) {
        return { sucesso: false, cliente: dados.nomePessoa, mensagem: "Plano Incorreto ou não cadastrado!"}
    }
    
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
    
        try {
            console.log(`Cadastrando...`);
            await page.goto("https://portal.segurosunimed.com.br/");

        try {
            await page.getByText("Sair do Portal", {exact: false}).waitFor({ state: "visible", timeout: 5000 });
            console.log('🔓 Sessão válida detectada. Continuando...');
        } catch (erroSessao) {
            if (tentativa === 1) {
                console.warn('Sessão inválida ou expirada! Iniciando auto-renovação...');
                        
                await browser.close(); 
                        
                await gerarSessao(); 
                        
                console.log('Nova sessão gerada! Reiniciando o processo...');
                        
                return await cadastrarPessoa(dados, 2); 
            } else {
                throw new Error('Falha na autenticação mesmo após renovar a sessão. Verifique as credenciais no .env.');
            }
        }
        await page.getByRole('button', { name: 'Estipulante'}).waitFor({ state: "visible", timeout: 10000});
        await page.getByRole('button', { name: 'Estipulante'}).click();
        await page.waitForURL('**https://portal.segurosunimed.com.br/estipulante**', { timeout: 10000 });
        
        await page.goto('https://portal.segurosunimed.com.br/estipulante/odonto/movimentacao-cadastral/cadastros/incluir-titular');

        const frameCadastro = page.frameLocator('iframe.responsive-iframe');
        
        await frameCadastro.locator('#num_cpf').waitFor({ state: 'visible' });
        console.log('Formulário carregado! Preenchendo dados...');

        await frameCadastro.locator('#num_cpf').fill(dados.cpfCnpj.replace(/\D/g, ""));
        await frameCadastro.locator('#nome_associado').fill(dados.nomePessoa);

        if(dados.sexo === "M") {
            await frameCadastro.locator('input[name="ind_sexo"][value="M"]').check();
        } else {
            await frameCadastro.locator('input[name="ind_sexo"][value="F"]').check();
        }

        await frameCadastro.locator('#data_nascimento').pressSequentially(dados.dataNascimento, { delay: 50 });
        await frameCadastro.locator('#nome_mae').fill(dados.nomeMae);

        const valorEstadoCivil = mapaEstadoCivil[dados.estadoCivil];
        if (valorEstadoCivil) {
            await frameCadastro.locator('#ind_estado_civil').selectOption(valorEstadoCivil);
        } else {
            console.warn(`Estado civil desconhecido: ${dados.estadoCivil}. Selecionado a opção "Outros".`);
            await frameCadastro.locator('#ind_estado_civil').selectOption('6');
        }

        const valorPlanoSaude = mapaPlanoSaude[planoSaudeUnimed];
        if (valorPlanoSaude) {
            await frameCadastro.locator('#cod_plano').selectOption(valorPlanoSaude);
        } else {
            console.warn(`Plano desconhecido: ${dados.planoSaude}.`);
            return { sucesso: false, cliente: dados.nomeCompleto, mensagem: "Tipo de Plano Incorreto"}
        }

        console.log("Preenchendo Município...");
        await frameCadastro.locator('img[onclick*="cod_municipio_resid"]').click();
        const popupBusca = frameCadastro.locator('#divPopUp');
        await popupBusca.waitFor({state: 'visible'});
        await popupBusca.locator('select[name="sgl_uf_popup"]').selectOption(dados.endereco.uf);
        await popupBusca.locator('#nom_municipio_popup').fill(dados.endereco.cidade);
        await popupBusca.locator('#continuar').click();
        const divResultado = popupBusca.locator('#divResultado');
        await divResultado.waitFor({ state: 'visible' });
        await divResultado.locator('a').first().click();
        console.log('Município preenchido com sucesso!');

        await frameCadastro.locator('#num_unico_saude').fill(dados.numeroCartaoDesconto.replace(/\D/g, ""));

        await frameCadastro.locator('#num_cep').pressSequentially(dados.endereco.cep.replace(/\D/g, ""), { delay: 50 });
        await frameCadastro.locator('#num_endereco').fill(dados.endereco.numero);

        await frameCadastro.locator('#ddd_celular_1').fill(dados.dddCelular);
        await frameCadastro.locator('#num_celular_1').fill(dados.numeroCelular);
        await frameCadastro.locator('#end_email_1').fill(dados.email);

        await frameCadastro.locator('#num_matric_empresa').fill(dados.matriculaEmpresa);
        
        console.log('Enviando formulário...');

        await frameCadastro.locator('.botao.incluir').click();

        try{
            const divMensagem = frameCadastro.locator('.msgErro');
            await divMensagem.waitFor({ state: 'visible', timeout: 10000 });
            const textoRetorno = await divMensagem.innerText();

            if (textoRetorno.toLowerCase().includes('sucesso')) {
                console.log('SUCESSO: Pessoa cadastrada perfeitamente!');
                console.log(`Mensagem exata: ${textoRetorno.trim()}`);
                return { sucesso: true, cliente: dados.nomeCompleto, mensagem: textoRetorno.trim() };

            } else {
                console.error(`ALERTA: O site retornou uma falha de negócio.`);
                console.error(`Motivo: ${textoRetorno.trim()}`);
                return { sucesso: false, cliente: dados.nomeCompleto, mensagem: textoRetorno.trim() };
            }

        } catch (erroTimeout) {
            console.error('ERRO: O site demorou muito para responder ou não exibiu nenhuma mensagem.');
            return { sucesso: false, cliente: dados.nomeCompleto, mensagem: "O portal da Seguradora demorou muito para responder." };
        }  
        
    } catch (e) {
        console.error('Erro na execução do robô:', e);
        return { sucesso: false, cliente: dados.nomeCompleto, mensagem: `Erro interno no robô: ${String(e)}` };
    } finally {
        if (browser.isConnected()) {
            await browser.close();
        }
    }
}
