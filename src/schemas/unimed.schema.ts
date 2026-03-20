import { z } from 'zod';

export const cadastroSchema = z.object({
    nomeCompleto: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
    cpf: z.string().length(14, "CPF deve conter exatamente 14 caracteres, com números e pontuação"),
    sexo: z.enum(["M", "F"], {message: "Sexo é obrigatório e deve ser 'M' ou 'F'"}),
    dataNascimento: z.string().length(10, "Data de nascimento deve ter 10 caracteres (DD/MM/AAAA)"),
    nomeMae: z.string().min(3, "Nome da mãe obrigatório"),
    estadoCivil: z.string(),
    planoSaude: z.string(),
    ufMunicipio: z.string().min(4, "UF deve conter o nome completo do estado"),
    nomeMunicipio: z.string().min(2, "Nome do município é obrigatório"),
    cartaoSaude: z.string(),
    cep: z.string().length(9, "CEP deve conter exatamente 8 números"),
    numEndereco: z.string().min(1, "Número do endereço é obrigatório"),
    numCelular: z.string().min(14, "Número de celular inválido"),
    email: z.string().email("Formato de e-mail inválido"),
    matriculaEmpresa: z.string().min(1, "Matrícula é obrigatória"),
});

export const exclusaoSchema = z.object({
    nomeCompleto: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
    cpf: z.string().length(14, "CPF deve conter exatamente 14 caracteres, com números e pontuação"),
})