# **Unimed RPA Integrator & Orchestrator**
Um microsserviço assíncrono de RPA (Robotic Process Automation) construído em Node.js e TypeScript. Desenvolvido para automatizar o cadastro e exclusão de beneficiários no portal da Seguradora Unimed integrando com o ERP interno através de processamento em background.

## **O Problema e a Solução**
A gestão manual de planos de saúde em portais de seguradoras é repetitiva e suscetível a erros humanos. Além disso, alto volume de cadastros tornam necessário vários funcionários humanos para realizar a tarefa.

### A Solução:
Este projeto implementa uma arquitetura orientada a eventos utilizando Redis e BullMQ. A API atua como um orquestrador rápido que enriquece os dados via API do ERP, valida contratos de dados estritos e delega a execução pesada de navegação (headless browser) para workers assíncronos, garantindo resiliência e escalabilidade mesmo em servidores com recursos limitados (VPS).

## **Tecnologias e Arquitetura**
Node.js & TypeScript: Base do ecossistema, garantindo tipagem estática e segurança no desenvolvimento.

Express.js: Exposição do endpoint único (Webhook Orquestrador) protegido por API Key.

Playwright: Motor de automação web, navegando de forma headless com injeção de sessão para contornar bloqueios e otimizar tempo de login.

BullMQ & Redis: Sistema de mensageria e fila de trabalhos (Job Queue). 

Zod: Validação de schema e sanitização de dados. Impede que dados sujos ou incompletos do CRM quebrem a automação web.

Padrão Adapter: Utilizado para traduzir e normalizar os payloads do ERP para os formatos rígidos exigidos pelo portal da Unimed.

Docker: Containerização da aplicação utilizando a imagem oficial mcr.microsoft.com/playwright para garantir compatibilidade a nível de sistema operacional (dependências do Chrome embutidas).

## **Funcionalidades Diferenciais**
Orquestrador Unificado: Um único endpoint (/api/unimed) recebe comandos de "ATIVO" ou "INATIVO", roteando internamente para as filas correspondentes de cadastro ou exclusão.

Gestão Inteligente de Sessão: O robô salva os cookies de autenticação da Unimed localmente (sessao.json). Se a sessão expirar, o código intercepta a falha, faz um re-login transparente e retoma o trabalho sem perder a tarefa da fila.

Cache de Token (TTL): A comunicação com a API do ERP utiliza tokens Bearer. O microsserviço busca e faz o cache automático do token no Redis com um Time-To-Live ligeiramente inferior à expiração real, evitando chamadas de login redundantes.

Retorno via Webhook: Ao finalizar a navegação no Playwright (com sucesso ou falha negocial), o worker dispara um webhook reverso, permitindo que o fluxo prossiga (ex: avisando o atendente via WhatsApp).

## **Estrutura em Camadas (Layered Architecture)**
O projeto foi projetado para separar responsabilidades, garantindo fácil manutenção e isolamento do domínio de automação:

```plaintext
/src
│── server.ts                 # Entry point, Middleware de Auth e inicialização do Express
│
├── /config                   # Instâncias de banco de dados e filas (Redis/BullMQ)
├── /schemas                  # Contratos de dados e tipagens inferidas (Zod)
├── /integrations             # Fetchers externos (API) e Padrão Adapter (normalização de dados)
├── /automation               # Scripts puros do Playwright (Navegação, cliques, extração)
├── /controllers              # Regra de negócio da API, roteamento e enfileiramento
└── /jobs                     # Workers do BullMQ em background
└── /utils                    # Scripts utilitários
````
