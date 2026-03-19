import { z } from 'zod';

export const cadastroSchema = z.object({
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
});

export const exclusaoSchema = z.object({
    nomeCompleto: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
    cpf: z.string().length(11, "CPF deve conter exatamente 11 números, sem pontuação"),
})