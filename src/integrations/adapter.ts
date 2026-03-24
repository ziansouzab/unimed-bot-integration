import { normalizarNumero } from "../utils/utils.js";

const estadosBrasileiros: Record<string, string> = {
    "AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas",
    "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo",
    "GO": "Goiás", "MA": "Maranhão", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul",
    "MG": "Minas Gerais", "PA": "Pará", "PB": "Paraíba", "PR": "Paraná",
    "PE": "Pernambuco", "PI": "Piauí", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul", "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina",
    "SP": "São Paulo", "SE": "Sergipe", "TO": "Tocantins"
};

export function adaptarParaRobo(dadosApi: any) {
    const pessoa = dadosApi.itens?.[0];

    if (!pessoa) {
        throw new Error("A API retornou sucesso, mas a lista de itens está vazia.");
    }

    const {ddd, numero} = normalizarNumero(pessoa.telefoneCelular);

    const cpfLimpo = (pessoa.cpfCnpj || "").replace(/\D/g, '');
    const cepLimpo = (pessoa.endereco?.cep || "").replace(/\D/g, '');
    const cartaoLimpo = (pessoa.numeroCartaoDesconto || "").replace(/\s/g, '');

    return {
        nomeCompleto: pessoa.nomePessoa || "",
        cpf: cpfLimpo,
        sexo: pessoa.sexo === 'F' ? 'Feminino' : pessoa.sexo === 'M' ? 'Masculino' : "",
        dataNascimento: pessoa.dataNascimento || "",
        nomeMae: pessoa.nomeMae || "",
        
        estadoCivil: pessoa.estadoCivil,
        matriculaEmpresa: Date.now().toString(),
        email: pessoa.email,
        
        planoSaude: pessoa.planos?.[0]?.nome || "",
        
        ufMunicipio: estadosBrasileiros[pessoa.endereco?.uf],
        nomeMunicipio: pessoa.endereco?.cidade,
        cep: cepLimpo,
        numEndereco: pessoa.endereco?.numero,
        
        dddCelular: ddd,
        numCelular: numero,
        cartaoSaude: cartaoLimpo,
    };
}