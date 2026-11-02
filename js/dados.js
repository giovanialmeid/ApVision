// Estado principal, dados iniciais, cores e salvamento do ApVision

const LISTA_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ORDEM_MESES = LISTA_MESES.reduce((mapa, nomeMes, indice) => {
  mapa[nomeMes] = indice + 1;
  return mapa;
}, {});

const PALETA_PADRAO = {
  corTitulo: '2B579A',
  corBarra: '4472C4',
  corGrafico: '2B579A',
  corTerciaria: '404040',
  corAlerta: 'C0392B',
  corFundo: 'F2F2F2',
  corBorda: 'BFBFBF',
  corTexto: '262626'
};

const FONTE_TITULO = 'Outfit';
const FONTE_CORPO = 'Inter';
const CHAVE_ARMAZENAMENTO = 'apvision_estado_projeto';

// Slides base iniciais que ficam travados para evitar exclusão sem querer
const SLIDES_FIXOS = new Set(['s_capa', 's_totalizador', 's_m1', 's_encerramento']);

const TIPOS_SLIDE_VALIDOS = new Set([
  'capa', 'totalizador', 'mensal', 'slide4', 'slide5',
  'slide6', 'slide7', 'slide8', 'encerramento'
]);

function criarEstadoPadrao() {
  return {
    identificacao: 'Painel de Resultados',
    periodo: 'Janeiro a Março de 2026',
    kpiCapa: 'KPIs',
    slides: [
      {
        id: 's_capa',
        tipo: 'capa',
        titulo: 'Capa Inicial'
      },
      {
        id: 's_totalizador',
        tipo: 'totalizador',
        titulo: 'Totalizador Anual',
        tituloObs: 'Resumo do Período',
        textoObs: 'Resumo geral dos três primeiros meses do ano. O volume de entregas cresceu a cada mês e quase todos os prazos foram cumpridos dentro do esperado.',
        mesesManuais: []
      },
      {
        id: 's_m1',
        tipo: 'mensal',
        nome: 'Janeiro',
        quantidade: 345,
        desviosInternos: 8,
        desviosExternos: 3,
        diasAtraso: 0,
        observacoes: 'Entregas fechadas dois dias antes do prazo. Mês tranquilo e com poucas correções.'
      },
      {
        id: 's_m2',
        tipo: 'mensal',
        nome: 'Fevereiro',
        quantidade: 350,
        desviosInternos: 12,
        desviosExternos: 5,
        diasAtraso: 1,
        observacoes: 'Teve 1 dia de atraso por conta da demora para receber alguns dados externos no fechamento.'
      },
      {
        id: 's_m3',
        tipo: 'mensal',
        nome: 'Março',
        quantidade: 370,
        desviosInternos: 6,
        desviosExternos: 2,
        diasAtraso: 0,
        observacoes: 'Mês com mais entregas no trimestre, mantendo um bom ritmo e poucos erros.'
      },
      {
        id: 's_s4',
        tipo: 'slide4',
        titulo: 'Entregas por Categoria',
        tituloObs: 'Observações',
        textoObs: 'Comparação das tarefas feitas no trimestre. A parte de chamados resolvidos teve a maior quantidade no período.',
        formatoMoeda: false,
        itens: [
          { id: 'i4_1', rotulo: 'Chamados Resolvidos', valor: 380 },
          { id: 'i4_2', rotulo: 'Revisões', valor: 110 },
          { id: 'i4_3', rotulo: 'Tarefas Automáticas', valor: 250 },
          { id: 'i4_4', rotulo: 'Suporte Técnico', valor: 190 }
        ]
      },
      {
        id: 's_s6',
        tipo: 'slide6',
        titulo: 'Divisão de Demandas por Mês',
        tituloObs: 'Observações',
        textoObs: 'Divisão das demandas entregues em cada mês do trimestre. Janeiro teve a maior parte das entregas.',
        formatoRosca: false,
        itens: [
          { id: 'i6_1', rotulo: 'Janeiro', valor: 5 },
          { id: 'i6_2', rotulo: 'Fevereiro', valor: 4 },
          { id: 'i6_3', rotulo: 'Março', valor: 3 }
        ]
      },
      {
        id: 's_encerramento',
        tipo: 'encerramento',
        textoAgradecimento: 'Obrigado a todos!',
        subtitulo: 'Painel de Resultados • ApVision'
      }
    ],
    indiceSlideAtual: 0,
    paleta: { ...PALETA_PADRAO }
  };
}

const estado = criarEstadoPadrao();

// Referência da instância ativa do Chart.js para destruição antes de recriar a prévia
let graficoAtivo = null;

// ---------- Funções utilitárias ----------

function escaparHTML(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paraNumero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function gerarIdUnico(prefixo = 'id') {
  const aleatorio = Math.random().toString(36).slice(2, 6);
  return `${prefixo}_${Date.now()}_${aleatorio}`;
}

function ordenarPorMes(lista, chaveMes = 'nome') {
  return [...lista].sort((a, b) => {
    const ordemA = ORDEM_MESES[a[chaveMes]] || 99;
    const ordemB = ORDEM_MESES[b[chaveMes]] || 99;
    return ordemA - ordemB;
  });
}

function limparNomeArquivo(texto) {
  const limpo = String(texto || 'Apresentacao')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return limpo || 'Apresentacao';
}

function validarHexCor(valor, corPadrao) {
  const limpo = String(valor || '').replace('#', '').trim();
  return /^[0-9A-Fa-f]{6}$/.test(limpo) ? limpo.toUpperCase() : corPadrao;
}

// Calcula a luminosidade percebida (YIQ) para definir texto claro ou escuro sobre fundos coloridos
function obterCorTextoContraste(corHex) {
  const hexSeguro = validarHexCor(corHex, PALETA_PADRAO.corGrafico);
  const r = parseInt(hexSeguro.slice(0, 2), 16);
  const g = parseInt(hexSeguro.slice(2, 4), 16);
  const b = parseInt(hexSeguro.slice(4, 6), 16);
  const luminosidadePercebida = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return luminosidadePercebida >= 165 ? '262626' : 'FFFFFF';
}

// ---------- Persistência do projeto ----------

function salvarLocal() {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
  } catch (erro) {
    // Caso o armazenamento esteja bloqueado ou sem espaço, a aplicação segue funcionando em memória
  }
}

function carregarLocal() {
  try {
    const conteudoSalvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!conteudoSalvo) return;
    aplicarProjeto(JSON.parse(conteudoSalvo));
  } catch (erro) {
    // Se o conteúdo local estiver inválido, mantém o estado inicial padrão
  }
}

function reiniciarProjeto() {
  const padrao = criarEstadoPadrao();
  estado.identificacao = padrao.identificacao;
  estado.periodo = padrao.periodo;
  estado.kpiCapa = padrao.kpiCapa;
  estado.slides = padrao.slides;
  estado.indiceSlideAtual = padrao.indiceSlideAtual;
  estado.paleta = { ...padrao.paleta };
  salvarLocal();
}

function normalizarSlide(slide) {
  const copia = { ...slide };
  copia.id = String(copia.id || gerarIdUnico('slide'));

  if (copia.tipo === 'capa') {
    copia.titulo = String(copia.titulo ?? 'Capa Inicial');
  }

  if (copia.tipo === 'totalizador') {
    copia.titulo = 'Totalizador Anual';
    copia.tituloObs = String(copia.tituloObs ?? 'Resumo do Período');
    copia.textoObs = String(copia.textoObs ?? '');
    copia.mesesManuais = Array.isArray(copia.mesesManuais)
      ? copia.mesesManuais.map((mes) => ({
          id: mes.id || gerarIdUnico('mes'),
          nome: mes.nome || 'Janeiro',
          quantidade: paraNumero(mes.quantidade),
          desviosInternos: paraNumero(mes.desviosInternos),
          desviosExternos: paraNumero(mes.desviosExternos),
          diasAtraso: paraNumero(mes.diasAtraso)
        }))
      : [];
  }

  if (copia.tipo === 'mensal') {
    copia.nome = String(copia.nome || 'Janeiro');
    copia.quantidade = paraNumero(copia.quantidade);
    copia.desviosInternos = paraNumero(copia.desviosInternos);
    copia.desviosExternos = paraNumero(copia.desviosExternos);
    copia.diasAtraso = paraNumero(copia.diasAtraso);
    copia.observacoes = String(copia.observacoes ?? copia.obs ?? '');
    delete copia.obs;
  }

  if (copia.tipo === 'slide4') {
    copia.titulo = String(copia.titulo ?? 'Entregas por Categoria');
    copia.tituloObs = String(copia.tituloObs ?? 'Observações');
    copia.textoObs = String(copia.textoObs ?? '');
    copia.formatoMoeda = Boolean(copia.formatoMoeda);
  }

  if (copia.tipo === 'slide6') {
    copia.titulo = String(copia.titulo ?? 'Divisão por Categoria');
    copia.tituloObs = String(copia.tituloObs ?? 'Observações');
    copia.textoObs = String(copia.textoObs ?? '');
    copia.formatoRosca = Boolean(copia.formatoRosca);
  }

  if (copia.tipo === 'slide4' || copia.tipo === 'slide6') {
    copia.itens = Array.isArray(copia.itens) && copia.itens.length > 0
      ? copia.itens.map((item) => ({
          id: item.id || gerarIdUnico('item'),
          rotulo: String(item.rotulo ?? 'Item'),
          valor: paraNumero(item.valor)
        }))
      : [{ id: gerarIdUnico('item'), rotulo: 'Item 1', valor: 10 }];
  }

  if (copia.tipo === 'slide5') {
    copia.titulo = String(copia.titulo ?? 'Realizado x Meta');
    copia.tituloObs = String(copia.tituloObs ?? 'Observações');
    copia.textoObs = String(copia.textoObs ?? '');
    copia.pontosDados = Array.isArray(copia.pontosDados) && copia.pontosDados.length > 0
      ? copia.pontosDados.map((ponto) => ({
          id: ponto.id || gerarIdUnico('ponto'),
          rotulo: String(ponto.rotulo ?? 'Período'),
          realizado: paraNumero(ponto.realizado),
          projecao: paraNumero(ponto.projecao)
        }))
      : [
          { id: gerarIdUnico('ponto'), rotulo: 'Janeiro', realizado: 340, projecao: 360 },
          { id: gerarIdUnico('ponto'), rotulo: 'Fevereiro', realizado: 355, projecao: 375 }
        ];
  }

  if (copia.tipo === 'slide7') {
    copia.titulo = String(copia.titulo ?? 'Evolução de Indicadores');
    copia.tituloObs = String(copia.tituloObs ?? 'Observações');
    copia.textoObs = String(copia.textoObs ?? '');
    copia.registros = Array.isArray(copia.registros)
      ? copia.registros.map((reg) => ({
          id: reg.id || gerarIdUnico('reg'),
          idItem: String(reg.idItem ?? '101'),
          quantidade: paraNumero(reg.quantidade ?? reg.valor),
          periodo: reg.periodo || 'Janeiro',
          rotuloMetrica: String(reg.rotuloMetrica || 'Indicador')
        }))
      : [];
  }

  if (copia.tipo === 'slide8') {
    copia.titulo = String(copia.titulo ?? 'Texto Livre');
    copia.subtitulo = String(copia.subtitulo ?? '');
    copia.texto = String(copia.texto ?? '');
  }

  if (copia.tipo === 'encerramento') {
    copia.textoAgradecimento = String(copia.textoAgradecimento ?? 'Obrigado a todos!');
    copia.subtitulo = String(copia.subtitulo ?? 'Painel de Resultados • ApVision');
  }

  return copia;
}

function aplicarProjeto(dados) {
  if (!dados || typeof dados !== 'object' || !Array.isArray(dados.slides) || dados.slides.length === 0) {
    return false;
  }

  const slidesValidos = dados.slides.filter(
    (slide) => slide && typeof slide === 'object' && TIPOS_SLIDE_VALIDOS.has(slide.tipo)
  );

  if (slidesValidos.length === 0) {
    return false;
  }

  const idsUsados = new Set();
  const slidesNormalizados = slidesValidos.map((slide) => {
    const normalizado = normalizarSlide(slide);
    if (idsUsados.has(normalizado.id)) {
      normalizado.id = gerarIdUnico('slide');
    }
    idsUsados.add(normalizado.id);
    return normalizado;
  });

  const paletaRecebida = dados.paleta && typeof dados.paleta === 'object' ? dados.paleta : {};
  const paletaValidada = {};
  Object.keys(PALETA_PADRAO).forEach((chave) => {
    paletaValidada[chave] = validarHexCor(paletaRecebida[chave], PALETA_PADRAO[chave]);
  });

  const indiceRecebido = Number.isInteger(dados.indiceSlideAtual) ? dados.indiceSlideAtual : 0;

  estado.identificacao = String(dados.identificacao || 'Painel de Resultados');
  estado.periodo = String(dados.periodo || 'Período Atual');
  estado.kpiCapa = String(dados.kpiCapa || 'KPIs');
  estado.slides = slidesNormalizados;
  estado.paleta = paletaValidada;
  estado.indiceSlideAtual = Math.min(Math.max(0, indiceRecebido), slidesNormalizados.length - 1);

  return true;
}

function salvarProjeto() {
  const conteudoJson = JSON.stringify(estado, null, 2);
  const arquivoBlob = new Blob([conteudoJson], { type: 'application/json' });
  const enderecoTemporario = URL.createObjectURL(arquivoBlob);
  const linkDownload = document.createElement('a');

  linkDownload.href = enderecoTemporario;
  linkDownload.download = `ApVision_${limparNomeArquivo(estado.identificacao)}.json`;
  linkDownload.click();

  URL.revokeObjectURL(enderecoTemporario);
}

function importarProjeto(arquivo, aoTerminar) {
  const leitor = new FileReader();

  leitor.onload = () => {
    let sucesso = false;
    try {
      const dadosLidos = JSON.parse(leitor.result);
      sucesso = aplicarProjeto(dadosLidos);
    } catch (erro) {
      sucesso = false;
    }
    aoTerminar(sucesso);
  };

  leitor.onerror = () => aoTerminar(false);
  leitor.readAsText(arquivo);
}

// ---------- Paleta e geração de variações de cores (HEX <-> HSL) ----------

function hexParaHsl(hex) {
  const codigoLimpo = String(hex || '2B579A').replace('#', '');
  const r = parseInt(codigoLimpo.slice(0, 2), 16) / 255;
  const g = parseInt(codigoLimpo.slice(2, 4), 16) / 255;
  const b = parseInt(codigoLimpo.slice(4, 6), 16) / 255;

  const maior = Math.max(r, g, b);
  const menor = Math.min(r, g, b);
  let matiz = 0;
  let saturacao = 0;
  const luminosidade = (maior + menor) / 2;

  if (maior !== menor) {
    const diferenca = maior - menor;
    saturacao = luminosidade > 0.5
      ? diferenca / (2 - maior - menor)
      : diferenca / (maior + menor);

    switch (maior) {
      case r:
        matiz = ((g - b) / diferenca + (g < b ? 6 : 0));
        break;
      case g:
        matiz = ((b - r) / diferenca + 2);
        break;
      case b:
        matiz = ((r - g) / diferenca + 4);
        break;
    }
    matiz *= 60;
  }

  return { h: matiz, s: saturacao * 100, l: luminosidade * 100 };
}

function hslParaHex(h, s, l) {
  const sat = s / 100;
  const lum = l / 100;
  const calcularIndice = (n) => (n + h / 30) % 12;
  const amplitude = sat * Math.min(lum, 1 - lum);

  const converterCanal = (n) => {
    const k = calcularIndice(n);
    const canal = lum - amplitude * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * canal).toString(16).padStart(2, '0');
  };

  return (converterCanal(0) + converterCanal(8) + converterCanal(4)).toUpperCase();
}

// Gera tons harmônicos variando a luminosidade a partir da cor base de gráficos
function variacoesGrafico(quantidade) {
  const corBase = estado.paleta.corGrafico || PALETA_PADRAO.corGrafico;
  const { h, s, l } = hexParaHsl(corBase);
  const deslocamentos = [0, 18, -14, 32, -24, 44, -32, 54];
  const tons = [];

  for (let i = 0; i < quantidade; i++) {
    const variacao = deslocamentos[i % deslocamentos.length] + Math.floor(i / deslocamentos.length) * 6;
    const novaLuminosidade = Math.min(86, Math.max(16, l + variacao));
    tons.push(hslParaHex(h, s, novaLuminosidade));
  }

  return tons;
}

function obterCoresSlide() {
  const p = estado.paleta;
  return {
    titulo: p.corTitulo,
    barra: p.corBarra,
    grafico: p.corGrafico,
    terciaria: p.corTerciaria,
    alerta: p.corAlerta,
    fundo: p.corFundo,
    borda: p.corBorda,
    texto: p.corTexto,
    branco: 'FFFFFF'
  };
}

function atualizarCoresGlobais() {
  const p = estado.paleta;
  const raiz = document.documentElement;

  raiz.style.setProperty('--slide-titulo', '#' + p.corTitulo);
  raiz.style.setProperty('--slide-barra', '#' + p.corBarra);
  raiz.style.setProperty('--slide-grafico', '#' + p.corGrafico);
  raiz.style.setProperty('--slide-terciaria', '#' + p.corTerciaria);
  raiz.style.setProperty('--slide-alerta', '#' + p.corAlerta);
  raiz.style.setProperty('--slide-fundo', '#' + p.corFundo);
  raiz.style.setProperty('--slide-borda', '#' + p.corBorda);
  raiz.style.setProperty('--slide-texto', '#' + p.corTexto);
}

// ---------- Consultas e métricas dos slides ----------

function pegarNomeSlide(slide) {
  if (!slide) return '';

  switch (slide.tipo) {
    case 'capa':
      return 'Capa Inicial';
    case 'totalizador':
      return 'Totalizador Anual';
    case 'mensal':
      return `Indicadores - ${slide.nome || ''}`;
    case 'slide4':
      return slide.titulo || 'Gráfico de Barras';
    case 'slide5':
      return slide.titulo || 'Gráfico de Linhas';
    case 'slide6':
      return slide.titulo || (slide.formatoRosca ? 'Gráfico de Rosca' : 'Gráfico de Pizza');
    case 'slide7':
      return slide.titulo || 'Evolução de Indicadores';
    case 'slide8':
      return slide.titulo || 'Caixa de Texto Livre';
    case 'encerramento':
      return 'Capa Final';
    default:
      return slide.titulo || '';
  }
}

function pegarSlidesMensais() {
  return estado.slides.filter((slide) => slide.tipo === 'mensal');
}

function pegarMesesManuais() {
  const slideTotalizador = estado.slides.find((slide) => slide.tipo === 'totalizador');
  return (slideTotalizador && slideTotalizador.mesesManuais) || [];
}

function pegarTodosMesesParaGrafico() {
  const vindosDosSlides = pegarSlidesMensais();
  const nomesNosSlides = new Set(vindosDosSlides.map((slide) => slide.nome));
  const vindosManuais = pegarMesesManuais().filter((mes) => !nomesNosSlides.has(mes.nome));
  return ordenarPorMes([...vindosDosSlides, ...vindosManuais], 'nome');
}

function pegarMetricasConsolidadas() {
  const todosOsMeses = pegarTodosMesesParaGrafico();
  let totalQuantidade = 0;
  let totalInternos = 0;
  let totalExternos = 0;
  let totalAtraso = 0;

  todosOsMeses.forEach((mes) => {
    totalQuantidade += paraNumero(mes.quantidade);
    totalInternos += paraNumero(mes.desviosInternos);
    totalExternos += paraNumero(mes.desviosExternos);
    totalAtraso += paraNumero(mes.diasAtraso);
  });

  return {
    totalQuantidade,
    totalInternos,
    totalExternos,
    totalAtraso
  };
}
