
export const normalizarNumero = (numTelefone: string): { ddd: string; numero:string } => {

    const telefone = numTelefone?.replace(/\D/g, "") || "";

    const ddd = telefone.slice(0, 2);
    const numero = telefone.slice(2);

    return{ddd, numero}
}