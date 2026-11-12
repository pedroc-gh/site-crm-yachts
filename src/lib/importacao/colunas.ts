// Colunas das planilhas de importação. É a fonte única para o modelo (.xlsx) e para a leitura.
import { ETAPAS, ORIGENS, UFS, MAX_ITENS, rotuloStatusEmbarcacao } from "@/lib/rotulos";

export type TipoImportacao = "clientes" | "embarcacoes";

export type Coluna = {
  chave: string;
  titulo: string;
  obrigatorio?: boolean;
  /** Texto de ajuda que vai para a aba "Instruções" */
  ajuda: string;
  exemplo: string | number;
  /** Lista fechada de valores: vira menu suspenso no Excel */
  opcoes?: string[];
  largura?: number;
};

export const COLUNAS_CLIENTES: Coluna[] = [
  { chave: "nome", titulo: "Nome completo", obrigatorio: true, ajuda: "Nome do cliente.", exemplo: "Ricardo Almeida", largura: 28 },
  { chave: "telefone", titulo: "Celular", ajuda: "Com DDD. Celular OU e-mail é obrigatório.", exemplo: "11 95799 7972", largura: 16 },
  { chave: "email", titulo: "E-mail", ajuda: "Celular OU e-mail é obrigatório.", exemplo: "ricardo@exemplo.com.br", largura: 26 },
  { chave: "cpfCnpj", titulo: "CPF ou CNPJ", ajuda: "Com ou sem pontuação.", exemplo: "123.456.789-00", largura: 18 },
  { chave: "dataNascimento", titulo: "Data de nascimento", ajuda: "dd/mm/aaaa", exemplo: "15/03/1975", largura: 14 },
  { chave: "cidade", titulo: "Cidade", ajuda: "", exemplo: "São Paulo", largura: 16 },
  { chave: "uf", titulo: "UF", ajuda: "Sigla do estado.", exemplo: "SP", opcoes: UFS, largura: 6 },
  { chave: "profissao", titulo: "Profissão / empresa", ajuda: "", exemplo: "Empresário", largura: 18 },
  { chave: "origem", titulo: "Origem", ajuda: "Como chegou até a Regatta. Pode ser outro texto.", exemplo: "Indicação", opcoes: ORIGENS, largura: 18 },
  { chave: "interesse", titulo: "Interesse", ajuda: "Novo, Seminovo ou vazio (a definir).", exemplo: "Novo", opcoes: ["Novo", "Seminovo"], largura: 11 },
  { chave: "modeloInteresse", titulo: "Modelo de interesse", ajuda: "", exemplo: "SESSA C68", largura: 18 },
  { chave: "orcamento", titulo: "Orçamento (R$)", ajuda: "Número. Ex.: 3500000 ou 3.500.000,00", exemplo: 3500000, largura: 15 },
  { chave: "possuiBarco", titulo: "Barco atual", ajuda: "Possível troca.", exemplo: "Phantom 345, 2019", largura: 20 },
  { chave: "etapa", titulo: "Etapa do funil", ajuda: "Vazio = Novo lead.", exemplo: "Qualificado", opcoes: ETAPAS.map((e) => e.rotulo), largura: 18 },
  { chave: "proximoContato", titulo: "Próximo contato", ajuda: "dd/mm/aaaa", exemplo: "30/11/2026", largura: 14 },
  { chave: "emailConsultor", titulo: "E-mail do consultor", ajuda: "E-mail de acesso de um consultor cadastrado em Equipe. Vazio = quem está importando.", exemplo: "", largura: 26 },
  { chave: "observacoes", titulo: "Observações", ajuda: "", exemplo: "Família com 3 filhos, marina em Guarujá", largura: 34 },
];

export const COLUNAS_EMBARCACOES: Coluna[] = [
  { chave: "condicao", titulo: "Condição", obrigatorio: true, ajuda: "Novo ou Seminovo.", exemplo: "Seminovo", opcoes: ["Novo", "Seminovo"], largura: 11 },
  { chave: "marca", titulo: "Marca / estaleiro", obrigatorio: true, ajuda: "", exemplo: "Sessa Marine", largura: 16 },
  { chave: "modelo", titulo: "Modelo", obrigatorio: true, ajuda: "Como o fabricante escreve.", exemplo: "SESSA F42", largura: 16 },
  { chave: "preco", titulo: "Preço de venda (R$)", obrigatorio: true, ajuda: "Número. Ex.: 3450000 ou 3.450.000,00", exemplo: 3450000, largura: 16 },
  { chave: "ano", titulo: "Ano", ajuda: "", exemplo: 2021, largura: 8 },
  { chave: "comprimentoPes", titulo: "Comprimento (pés)", ajuda: "", exemplo: 42, largura: 12 },
  { chave: "motorizacao", titulo: "Motorização", ajuda: "", exemplo: "2x Volvo Penta D6 435", largura: 22 },
  { chave: "horasMotor", titulo: "Horas de motor", ajuda: "Só para seminovos.", exemplo: 310, largura: 10 },
  { chave: "combustivel", titulo: "Combustível", ajuda: "", exemplo: "Diesel", opcoes: ["Diesel", "Gasolina", "Elétrico", "Híbrido"], largura: 11 },
  { chave: "cabines", titulo: "Cabines", ajuda: "", exemplo: 2, largura: 8 },
  { chave: "capacidade", titulo: "Capacidade (pessoas)", ajuda: "", exemplo: 12, largura: 10 },
  { chave: "cor", titulo: "Cor do casco", ajuda: "", exemplo: "Branco", largura: 12 },
  { chave: "localizacao", titulo: "Localização", ajuda: "Marina, cidade.", exemplo: "Marina, Angra dos Reis - RJ", largura: 24 },
  { chave: "inscricao", titulo: "Inscrição / nº do casco", ajuda: "Seminovos: evita cadastrar o mesmo barco duas vezes.", exemplo: "ABC-000123", largura: 18 },
  { chave: "status", titulo: "Situação", ajuda: "Vazio = Disponível (seminovo) ou Sob encomenda (novo).", exemplo: "Disponível", opcoes: Object.values(rotuloStatusEmbarcacao), largura: 14 },
  { chave: "equipamentos", titulo: "Itens e equipamentos", ajuda: `Separados por ponto e vírgula (;) ou um por linha na célula. Máximo ${MAX_ITENS}.`, exemplo: "Gerador 9 kW; Ar-condicionado; GPS e sonda", largura: 40 },
  { chave: "descricao", titulo: "Texto de apresentação", ajuda: "Aparece na proposta.", exemplo: "Revisado e com garantia.", largura: 34 },
];

export const colunasDe = (tipo: TipoImportacao) => (tipo === "clientes" ? COLUNAS_CLIENTES : COLUNAS_EMBARCACOES);

/** "Preço de venda (R$) *" -> "precodevendar" — para casar cabeçalhos com pequenas diferenças. */
export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
