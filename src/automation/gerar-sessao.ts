import { chromium } from 'playwright';

export default async function gerarSessao() {
    const cpf = process.env.UNIMED_CPF;
    const senha = process.env.UNIMED_SENHA;

    if (!cpf || !senha) {
        throw new Error ('Variaveis de ambiente não configuradas!')
    }

    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
        ]
     });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Fazendo login...');
    await page.goto('https://rh-sso.segurosunimed.com.br/auth/realms/unimed-externos/protocol/openid-connect/auth?response_type=code&client_id=portal-da-seguros-3538e5bb-6b57-4f60-a36a-b33fb0fc0f01&state=NEtuSS1WaHRwbXNYYjJiTnVKbkZKTkV4T1JwWjhtLTV4b2FYMFNaRVpUckwx&redirect_uri=https%3A%2F%2Fportal.segurosunimed.com.br&scope=openid%20offline_access%20profile%20email%20address%20phone%20roles%20web-origins%20microprofile-jwt&code_challenge=VxEu910PMwucQ6cGheYiwh7KkJNHf5EfqPEh8xXqt9c&code_challenge_method=S256&nonce=NEtuSS1WaHRwbXNYYjJiTnVKbkZKTkV4T1JwWjhtLTV4b2FYMFNaRVpUckwx');
    
    await page.fill('#username', cpf);
    await page.fill('#password', senha);
    await page.click('#kc-login');

    await page.waitForURL('**https://portal.segurosunimed.com.br/**', { timeout: 15000 });

    await context.storageState({ path: 'sessao.json' });
    console.log('Sessão salva com sucesso no arquivo sessao.json!');

    await browser.close();
}