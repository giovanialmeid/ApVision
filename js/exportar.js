// Geração do arquivo PowerPoint (.pptx)

const MEDIDAS_PPT = {
  largura: 13.333,
  altura: 7.5,
  margemX: 0.8,
  margemY: 0.375
};

function adicionarFundoSlide(slidePpt, corFundo) {
  slidePpt.addShape('rect', {
    x: 0,
    y: 0,
    w: MEDIDAS_PPT.largura,
    h: MEDIDAS_PPT.altura,
    fill: { color: corFundo },
    line: { color: corFundo, width: 0 }
  });
}

function desenharCaixaBranca(slidePpt, caixa, cores) {
  slidePpt.addShape('roundRect', {
    x: caixa.x,
    y: caixa.y,
    w: caixa.w,
    h: caixa.h,
    fill: { color: cores.branco },
    line: { color: cores.borda, width: 1 }
  });
}

function montarMolduraPadrao(slidePpt, titulo, subtitulo, cores) {
  adicionarFundoSlide(slidePpt, cores.fundo);

  const x = MEDIDAS_PPT.margemX;
  const y = MEDIDAS_PPT.margemY;
  const larguraInterna = MEDIDAS_PPT.largura - (MEDIDAS_PPT.margemX * 2);

  const subtituloSeguro = String(subtitulo || '');
  const larguraSubtitulo = Math.min(4.2, Math.max(2.15, 0.38 + (subtituloSeguro.length * 0.085)));
  const alturaSubtitulo = 0.34;
  const subtituloX = x + larguraInterna - larguraSubtitulo;
  const subtituloY = y + 0.10;

  slidePpt.addText(String(titulo || ''), {
    x,
    y: y + 0.01,
    w: larguraInterna - larguraSubtitulo - 0.2,
    h: 0.48,
    fontFace: FONTE_TITULO,
    fontSize: 23,
    bold: true,
    color: cores.titulo,
    margin: 0
  });

  slidePpt.addShape('roundRect', {
    x: subtituloX,
    y: subtituloY,
    w: larguraSubtitulo,
    h: alturaSubtitulo,
    fill: { color: cores.branco },
    line: { color: cores.borda, width: 1 }
  });

  slidePpt.addText(subtituloSeguro, {
    x: subtituloX + 0.08,
    y: subtituloY + 0.05,
    w: larguraSubtitulo - 0.16,
    h: alturaSubtitulo - 0.10,
    align: 'center',
    valign: 'mid',
    fontFace: FONTE_CORPO,
    fontSize: 9.5,
    bold: true,
    color: cores.terciaria,
    margin: 0
  });

  const yDivisor = y + 0.72;
  slidePpt.addShape('line', {
    x,
    y: yDivisor,
    w: larguraInterna,
    h: 0,
    line: { color: cores.borda, width: 1.4 }
  });

  const yConteudo = yDivisor + 0.24;
  return {
    x,
    y: yConteudo,
    w: larguraInterna,
    h: MEDIDAS_PPT.altura - MEDIDAS_PPT.margemY - yConteudo
  };
}

function calcularGradePainel(quadro, yInicial = quadro.y, alturaDisponivel = quadro.h) {
  const espacoColunas = quadro.w * 0.04;
  const larguraGrafico = (quadro.w - espacoColunas) * (2.2 / 3.2);
  const larguraObs = quadro.w - espacoColunas - larguraGrafico;

  return {
    caixaGrafico: {
      x: quadro.x,
      y: yInicial,
      w: larguraGrafico,
      h: alturaDisponivel
    },
    caixaObs: {
      x: quadro.x + larguraGrafico + espacoColunas,
      y: yInicial,
      w: larguraObs,
      h: alturaDisponivel
    }
  };
}

function desenharCartaoKpi(slidePpt, config, cores) {
  const espacoX = config.espacoX !== undefined ? config.espacoX : (config.w * 0.08);
  const espacoY = config.espacoY !== undefined ? config.espacoY : (config.h * 0.14);
  const alturaBarraTopo = config.alturaBarraTopo || 0.08;
  const raioCanto = 0.05;

  slidePpt.addShape('roundRect', {
    x: config.x,
    y: config.y,
    w: config.w,
    h: config.h,
    fill: { color: config.corDestaque },
    line: { color: config.corDestaque, width: 0 },
    rectRadius: raioCanto
  });

  slidePpt.addShape('roundRect', {
    x: config.x,
    y: config.y + alturaBarraTopo,
    w: config.w,
    h: config.h - alturaBarraTopo,
    fill: { color: cores.branco },
    line: { color: cores.borda, width: 1 },
    rectRadius: raioCanto
  });

  slidePpt.addText(String(config.valor), {
    x: config.x + espacoX,
    y: config.y + espacoY,
    w: config.w - (espacoX * 2),
    h: config.h * 0.43,
    fontFace: FONTE_TITULO,
    fontSize: config.tamanhoValor || 22,
    bold: true,
    color: config.corValor || cores.texto,
    margin: 0
  });

  slidePpt.addText(String(config.rotulo), {
    x: config.x + espacoX,
    y: config.y + config.h - espacoY - 0.28,
    w: config.w - (espacoX * 2),
    h: 0.24,
    fontFace: FONTE_CORPO,
    fontSize: config.tamanhoRotulo || 8.2,
    bold: true,
    color: cores.terciaria,
    margin: 0
  });
}

function desenharFilaCartoesKpi(slidePpt, quadro, listaCartoes, alturaCartao, cores) {
  const espacoHorizontal = quadro.w * 0.03;
  const larguraCartao = (quadro.w - (espacoHorizontal * (listaCartoes.length - 1))) / listaCartoes.length;

  listaCartoes.forEach((cartao, indice) => {
    desenharCartaoKpi(slidePpt, {
      x: quadro.x + (indice * (larguraCartao + espacoHorizontal)),
      y: quadro.y,
      w: larguraCartao,
      h: alturaCartao,
      valor: cartao.valor,
      rotulo: cartao.rotulo,
      corDestaque: cartao.corDestaque,
      corValor: cartao.corValor,
      tamanhoValor: 21,
      tamanhoRotulo: 7.4
    }, cores);
  });
}

function desenharPainelObservacoes(slidePpt, config, cores) {
  const espacoSuperior = config.espacoSupPct !== undefined ? config.espacoSupPct : 0.10;
  const espacoLateral = config.espacoLatPct !== undefined ? config.espacoLatPct : 0.10;
  const espacoInferior = config.espacoInfPct !== undefined ? config.espacoInfPct : 0.10;

  desenharCaixaBranca(slidePpt, config, cores);

  const xTexto = config.x + (config.w * espacoLateral);
  const larguraTexto = config.w - (config.w * espacoLateral * 2);
  const yTitulo = config.y + (config.h * espacoSuperior);
  const yCorpo = yTitulo + 0.42;
  const alturaCorpo = config.h - (config.h * espacoInferior) - yCorpo + config.y;

  slidePpt.addText(String(config.titulo || ''), {
    x: xTexto,
    y: yTitulo,
    w: larguraTexto,
    h: 0.30,
    fontFace: FONTE_TITULO,
    fontSize: config.tamanhoTitulo || 12,
    bold: true,
    color: cores.titulo,
    margin: 0
  });

  slidePpt.addText(String(config.texto || ''), {
    x: xTexto,
    y: yCorpo,
    w: larguraTexto,
    h: alturaCorpo,
    fontFace: FONTE_CORPO,
    fontSize: config.tamanhoTexto || 8.8,
    color: cores.terciaria,
    valign: 'top',
    margin: 0
  });
}

function desenharEstadoGraficoVazio(slidePpt, caixa, mensagem, cores) {
  slidePpt.addText(mensagem, {
    x: caixa.x + (caixa.w * 0.08),
    y: caixa.y + (caixa.h * 0.42),
    w: caixa.w * 0.84,
    h: 0.5,
    align: 'center',
    valign: 'mid',
    fontFace: FONTE_CORPO,
    fontSize: 11,
    color: cores.terciaria,
    margin: 0
  });
}

function opcoesGraficoPadrao(cores, sobrescrever = {}) {
  return {
    showValue: true,
    dataLabelFontFace: FONTE_CORPO,
    dataLabelFontSize: 9,
    dataLabelFontBold: true,
    dataLabelPosition: 't',
    showLegend: true,
    legendPos: 'b',
    legendFontFace: FONTE_CORPO,
    legendFontSize: 8,
    catAxisLabelFontFace: FONTE_CORPO,
    catAxisLabelFontBold: true,
    catAxisLabelFontSize: 9,
    valAxisLabelFontFace: FONTE_CORPO,
    valAxisLabelFontSize: 9,
    catGridLine: { style: 'none' },
    valGridLine: { color: cores.borda, style: 'solid', size: 1 },
    catAxisLineColor: cores.borda,
    valAxisLineColor: cores.borda,
    ...sobrescrever
  };
}

// ---------- Exportadores por modelo de slide ----------

function exportarSlideCapa(apresentacao, cores) {
  const slidePpt = apresentacao.addSlide();
  adicionarFundoSlide(slidePpt, cores.fundo);

  slidePpt.addText(String(estado.kpiCapa || '').toUpperCase(), {
    x: 1.2,
    y: 2.05,
    w: 10.93,
    h: 0.35,
    align: 'center',
    fontFace: FONTE_TITULO,
    fontSize: 12.5,
    bold: true,
    color: cores.alerta,
    charSpacing: 1.4,
    margin: 0
  });

  slidePpt.addText(estado.identificacao, {
    x: 1.2,
    y: 2.35,
    w: 10.93,
    h: 1.0,
    align: 'center',
    valign: 'mid',
    fontFace: FONTE_TITULO,
    fontSize: 38,
    bold: true,
    color: cores.texto,
    margin: 0
  });

  slidePpt.addShape('line', {
    x: 2.0,
    y: 3.72,
    w: 9.33,
    h: 0,
    line: { color: cores.borda, width: 1.8, dashType: 'dash' }
  });

  slidePpt.addText(`Apresentação de Indicadores\nPeríodo: ${estado.periodo}`, {
    x: 1.2,
    y: 3.95,
    w: 10.93,
    h: 0.9,
    align: 'center',
    fontFace: FONTE_CORPO,
    fontSize: 15.5,
    color: cores.terciaria,
    margin: 0
  });
}

function exportarSlideTotalizador(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  const quadro = montarMolduraPadrao(slidePpt, slide.titulo, estado.periodo, cores);
  const metricas = pegarMetricasConsolidadas();

  const alturaLinhaKpi = 1.18;
  const espacoVerticalKpi = quadro.h * 0.07;

  const cartoesKpi = [
    { valor: metricas.totalQuantidade.toLocaleString('pt-BR'), rotulo: 'Processados', corDestaque: cores.barra, corValor: cores.texto },
    { valor: metricas.totalInternos.toLocaleString('pt-BR'), rotulo: 'Erros Internos', corDestaque: cores.barra, corValor: cores.texto },
    { valor: metricas.totalExternos.toLocaleString('pt-BR'), rotulo: 'Erros Externos', corDestaque: cores.barra, corValor: cores.texto },
    {
      valor: metricas.totalAtraso.toLocaleString('pt-BR'),
      rotulo: 'Dias de Atraso',
      corDestaque: metricas.totalAtraso > 0 ? cores.alerta : cores.barra,
      corValor: metricas.totalAtraso > 0 ? cores.alerta : cores.texto
    }
  ];

  desenharFilaCartoesKpi(slidePpt, quadro, cartoesKpi, alturaLinhaKpi, cores);

  const yPainel = quadro.y + alturaLinhaKpi + espacoVerticalKpi;
  const alturaPainel = quadro.h - alturaLinhaKpi - espacoVerticalKpi;
  const { caixaGrafico, caixaObs } = calcularGradePainel(quadro, yPainel, alturaPainel);

  desenharCaixaBranca(slidePpt, caixaGrafico, cores);

  const margemGrafX = caixaGrafico.w * 0.035;
  const margemGrafY = caixaGrafico.h * 0.05;
  const todosOsMeses = pegarTodosMesesParaGrafico();

  if (todosOsMeses.length > 0) {
    const rotulosMeses = todosOsMeses.map((mes) => mes.nome);

    slidePpt.addChart(apresentacao.ChartType.bar, [
      {
        name: 'Processados',
        labels: rotulosMeses,
        values: todosOsMeses.map((mes) => paraNumero(mes.quantidade))
      },
      {
        name: 'Erros Internos',
        labels: rotulosMeses,
        values: todosOsMeses.map((mes) => paraNumero(mes.desviosInternos))
      },
      {
        name: 'Erros Externos',
        labels: rotulosMeses,
        values: todosOsMeses.map((mes) => paraNumero(mes.desviosExternos))
      },
      {
        name: 'Dias de Atraso',
        labels: rotulosMeses,
        values: todosOsMeses.map((mes) => paraNumero(mes.diasAtraso))
      }
    ], {
      x: caixaGrafico.x + margemGrafX,
      y: caixaGrafico.y + margemGrafY,
      w: caixaGrafico.w - (margemGrafX * 2),
      h: caixaGrafico.h - (margemGrafY * 2),
      barDir: 'col',
      barGrouping: 'clustered',
      barGapWidthPct: 55,
      chartColors: [...variacoesGrafico(3), cores.alerta],
      ...opcoesGraficoPadrao(cores, { showValue: false, valAxisLabelFontSize: 8 })
    });
  } else {
    desenharEstadoGraficoVazio(slidePpt, caixaGrafico, 'Adicione meses para mostrar o gráfico comparativo.', cores);
  }

  desenharPainelObservacoes(slidePpt, {
    ...caixaObs,
    titulo: slide.tituloObs || 'Resumo do Período',
    texto: slide.textoObs || '',
    tamanhoTitulo: 11.5,
    tamanhoTexto: 8.8
  }, cores);
}

function exportarSlideMensal(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  const quadro = montarMolduraPadrao(slidePpt, `Indicadores - ${slide.nome}`, estado.identificacao, cores);

  const espacoGrade = quadro.w * 0.05;
  const larguraEsquerda = (quadro.w - espacoGrade) * (1.2 / 2.2);
  const larguraDireita = quadro.w - espacoGrade - larguraEsquerda;

  const xEsquerda = quadro.x;
  const xDireita = quadro.x + larguraEsquerda + espacoGrade;

  const espacoCartaoX = larguraEsquerda * 0.06;
  const espacoCartaoY = quadro.h * 0.06;
  const larguraCartao = (larguraEsquerda - espacoCartaoX) / 2;
  const alturaCartao = (quadro.h - espacoCartaoY) / 2;
  const diasAtraso = paraNumero(slide.diasAtraso);

  const cartoesMensais = [
    {
      valor: paraNumero(slide.quantidade).toLocaleString('pt-BR'),
      rotulo: 'Total Processado',
      corDestaque: cores.barra,
      corValor: cores.texto
    },
    {
      valor: paraNumero(slide.desviosInternos).toLocaleString('pt-BR'),
      rotulo: 'Erros Internos',
      corDestaque: cores.barra,
      corValor: cores.texto
    },
    {
      valor: paraNumero(slide.desviosExternos).toLocaleString('pt-BR'),
      rotulo: 'Erros Externos',
      corDestaque: cores.barra,
      corValor: cores.texto
    },
    {
      valor: diasAtraso.toLocaleString('pt-BR'),
      rotulo: 'Dias de Atraso',
      corDestaque: diasAtraso > 0 ? cores.alerta : cores.barra,
      corValor: diasAtraso > 0 ? cores.alerta : cores.texto
    }
  ];

  cartoesMensais.forEach((cartao, indice) => {
    desenharCartaoKpi(slidePpt, {
      x: xEsquerda + ((indice % 2) * (larguraCartao + espacoCartaoX)),
      y: quadro.y + (indice < 2 ? 0 : (alturaCartao + espacoCartaoY)),
      w: larguraCartao,
      h: alturaCartao,
      valor: cartao.valor,
      rotulo: cartao.rotulo,
      corDestaque: cartao.corDestaque,
      corValor: cartao.corValor,
      tamanhoValor: 28,
      tamanhoRotulo: 7.8,
      espacoY: alturaCartao * 0.18
    }, cores);
  });

  desenharPainelObservacoes(slidePpt, {
    x: xDireita,
    y: quadro.y,
    w: larguraDireita,
    h: quadro.h,
    titulo: 'Observações do Mês',
    texto: slide.observacoes || 'Nenhuma observação cadastrada para este mês.',
    espacoSupPct: 0.08,
    espacoLatPct: 0.06,
    espacoInfPct: 0.06,
    tamanhoTitulo: 12,
    tamanhoTexto: 8.5
  }, cores);
}

function exportarSlide4(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  const quadro = montarMolduraPadrao(slidePpt, slide.titulo, estado.identificacao, cores);
  const { caixaGrafico, caixaObs } = calcularGradePainel(quadro);

  desenharCaixaBranca(slidePpt, caixaGrafico, cores);

  const margemGrafX = caixaGrafico.w * 0.035;
  const margemGrafY = caixaGrafico.h * 0.05;
  const itens = Array.isArray(slide.itens) ? slide.itens : [];

  if (itens.length > 0) {
    slidePpt.addChart(apresentacao.ChartType.bar, [{
      name: 'Quantidade',
      labels: itens.map((item) => item.rotulo),
      values: itens.map((item) => paraNumero(item.valor))
    }], {
      x: caixaGrafico.x + margemGrafX,
      y: caixaGrafico.y + margemGrafY,
      w: caixaGrafico.w - (margemGrafX * 2),
      h: caixaGrafico.h - (margemGrafY * 2),
      barDir: 'bar',
      barGrouping: 'clustered',
      barGapWidthPct: 45,
      chartColors: [variacoesGrafico(1)[0]],
      ...opcoesGraficoPadrao(cores, {
        showLegend: false,
        dataLabelColor: cores.texto,
        dataLabelPosition: 'outEnd',
        valGridLine: { style: 'none' },
        dataLabelFormatCode: slide.formatoMoeda ? '"R$" #,##0.00' : '#,##0',
        valAxisLabelFormatCode: slide.formatoMoeda ? '"R$" #,##0' : '#,##0'
      })
    });
  } else {
    desenharEstadoGraficoVazio(slidePpt, caixaGrafico, 'Adicione itens para mostrar o gráfico de barras.', cores);
  }

  desenharPainelObservacoes(slidePpt, {
    ...caixaObs,
    titulo: slide.tituloObs || 'Observações',
    texto: slide.textoObs || 'Comparação entre os itens cadastrados no período.',
    tamanhoTitulo: 11.5,
    tamanhoTexto: 8.8
  }, cores);
}

function exportarSlide5(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  const quadro = montarMolduraPadrao(slidePpt, slide.titulo, estado.identificacao, cores);
  const { caixaGrafico, caixaObs } = calcularGradePainel(quadro);

  desenharCaixaBranca(slidePpt, caixaGrafico, cores);

  const margemGrafX = caixaGrafico.w * 0.035;
  const margemGrafY = caixaGrafico.h * 0.05;
  const pontosDados = Array.isArray(slide.pontosDados) ? slide.pontosDados : [];

  if (pontosDados.length > 0) {
    const rotulos = pontosDados.map((ponto) => ponto.rotulo);

    slidePpt.addChart(apresentacao.ChartType.line, [
      {
        name: 'Realizado',
        labels: rotulos,
        values: pontosDados.map((ponto) => paraNumero(ponto.realizado)),
        lineDataSymbol: 'circle'
      },
      {
        name: 'Meta',
        labels: rotulos,
        values: pontosDados.map((ponto) => paraNumero(ponto.projecao)),
        lineDataSymbol: 'circle',
        lineDash: 'dash'
      }
    ], {
      x: caixaGrafico.x + margemGrafX,
      y: caixaGrafico.y + margemGrafY,
      w: caixaGrafico.w - (margemGrafX * 2),
      h: caixaGrafico.h - (margemGrafY * 2),
      chartColors: variacoesGrafico(2),
      lineSize: 2.5,
      lineSmoothing: true,
      lineDataSymbolSize: 8,
      ...opcoesGraficoPadrao(cores, { dataLabelColor: cores.grafico })
    });
  } else {
    desenharEstadoGraficoVazio(slidePpt, caixaGrafico, 'Adicione períodos para mostrar o gráfico de linhas.', cores);
  }

  desenharPainelObservacoes(slidePpt, {
    ...caixaObs,
    titulo: slide.tituloObs || 'Observações',
    texto: slide.textoObs || 'Comparação entre os valores entregues e a meta prevista.',
    tamanhoTitulo: 11.5,
    tamanhoTexto: 8.8
  }, cores);
}

function exportarSlide6(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  const quadro = montarMolduraPadrao(slidePpt, slide.titulo, estado.identificacao, cores);
  const { caixaGrafico, caixaObs } = calcularGradePainel(quadro);

  desenharCaixaBranca(slidePpt, caixaGrafico, cores);

  const margemGrafX = caixaGrafico.w * 0.02;
  const margemGrafY = caixaGrafico.h * 0.04;
  const itens = Array.isArray(slide.itens) ? slide.itens : [];
  const somaValores = itens.reduce((soma, item) => soma + Math.max(0, paraNumero(item.valor)), 0);

  if (itens.length > 0 && somaValores > 0) {
    const tipoGrafico = slide.formatoRosca
      ? apresentacao.ChartType.doughnut
      : apresentacao.ChartType.pie;

    slidePpt.addChart(tipoGrafico, [{
      name: slide.titulo || 'Divisão',
      labels: itens.map((item) => item.rotulo),
      values: itens.map((item) => Math.max(0, paraNumero(item.valor)))
    }], {
      x: caixaGrafico.x + margemGrafX,
      y: caixaGrafico.y + margemGrafY,
      w: caixaGrafico.w - (margemGrafX * 2),
      h: caixaGrafico.h - (margemGrafY * 2),
      chartColors: variacoesGrafico(Math.max(6, itens.length)),
      ...(slide.formatoRosca ? { holeSize: 52 } : {}),
      ...opcoesGraficoPadrao(cores, {
        dataLabelColor: obterCorTextoContraste(cores.grafico),
        dataLabelFontSize: 10,
        dataLabelPosition: 'ctr'
      })
    });
  } else {
    desenharEstadoGraficoVazio(slidePpt, caixaGrafico, 'Coloque valores maiores que zero nas fatias para mostrar o gráfico.', cores);
  }

  desenharPainelObservacoes(slidePpt, {
    ...caixaObs,
    titulo: slide.tituloObs || 'Observações',
    texto: slide.textoObs || 'Divisão entre os itens cadastrados no gráfico.',
    tamanhoTitulo: 11.5,
    tamanhoTexto: 8.8
  }, cores);
}

function exportarSlide7(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  const quadro = montarMolduraPadrao(slidePpt, slide.titulo, estado.identificacao, cores);
  const registros = Array.isArray(slide.registros) ? slide.registros : [];

  const totalRegistros = registros.length;
  const seriesUnicas = new Set(registros.map((reg) => reg.idItem)).size;
  const volumeTotal = registros.reduce((soma, reg) => soma + paraNumero(reg.quantidade), 0);
  const mediaPorRegistro = totalRegistros > 0 ? Math.round(volumeTotal / totalRegistros) : 0;

  const alturaLinhaKpi = 1.12;
  const espacoVerticalKpi = quadro.h * 0.06;

  const cartoesKpi = [
    { valor: totalRegistros, rotulo: 'Dados', corDestaque: cores.barra, corValor: cores.texto },
    { valor: seriesUnicas, rotulo: 'Linhas', corDestaque: cores.barra, corValor: cores.texto },
    { valor: volumeTotal.toLocaleString('pt-BR'), rotulo: 'Soma Total', corDestaque: cores.barra, corValor: cores.texto },
    { valor: mediaPorRegistro.toLocaleString('pt-BR'), rotulo: 'Média', corDestaque: cores.barra, corValor: cores.texto }
  ];

  desenharFilaCartoesKpi(slidePpt, quadro, cartoesKpi, alturaLinhaKpi, cores);

  const yPainel = quadro.y + alturaLinhaKpi + espacoVerticalKpi;
  const alturaPainel = quadro.h - alturaLinhaKpi - espacoVerticalKpi;
  const { caixaGrafico, caixaObs } = calcularGradePainel(quadro, yPainel, alturaPainel);

  desenharCaixaBranca(slidePpt, caixaGrafico, cores);

  const margemGrafX = caixaGrafico.w * 0.035;
  const margemGrafY = caixaGrafico.h * 0.05;

  if (registros.length > 0) {
    const agrupadosPorSerie = {};
    registros.forEach((reg) => {
      if (!agrupadosPorSerie[reg.idItem]) {
        agrupadosPorSerie[reg.idItem] = [];
      }
      agrupadosPorSerie[reg.idItem].push(reg);
    });

    const periodosUnicos = [...new Set(registros.map((reg) => reg.periodo))];
    periodosUnicos.sort((a, b) => (ORDEM_MESES[a] || 99) - (ORDEM_MESES[b] || 99));

    const codigosSeries = Object.keys(agrupadosPorSerie).sort();
    const coresSeries = variacoesGrafico(Math.max(6, codigosSeries.length));

    const dadosLinhas = codigosSeries.map((codigo) => {
      const valoresPorPeriodo = {};
      agrupadosPorSerie[codigo].forEach((reg) => {
        valoresPorPeriodo[reg.periodo] = paraNumero(reg.quantidade);
      });

      return {
        name: `Linha: ${codigo}`,
        labels: periodosUnicos,
        values: periodosUnicos.map((periodo) => (
          valoresPorPeriodo[periodo] !== undefined ? valoresPorPeriodo[periodo] : null
        )),
        lineDataSymbol: 'circle'
      };
    });

    slidePpt.addChart(apresentacao.ChartType.line, dadosLinhas, {
      x: caixaGrafico.x + margemGrafX,
      y: caixaGrafico.y + margemGrafY,
      w: caixaGrafico.w - (margemGrafX * 2),
      h: caixaGrafico.h - (margemGrafY * 2),
      chartColors: coresSeries.slice(0, codigosSeries.length),
      lineSize: 2.5,
      lineSmoothing: true,
      lineDataSymbolSize: 8,
      ...opcoesGraficoPadrao(cores, { dataLabelColor: cores.grafico })
    });
  } else {
    desenharEstadoGraficoVazio(slidePpt, caixaGrafico, 'Adicione dados no painel para mostrar o gráfico.', cores);
  }

  desenharPainelObservacoes(slidePpt, {
    ...caixaObs,
    titulo: slide.tituloObs || 'Observações',
    texto: slide.textoObs || 'Acompanhamento dos valores de cada linha ao longo dos meses.',
    tamanhoTitulo: 11.5,
    tamanhoTexto: 8.8
  }, cores);
}

function exportarSlide8(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  const quadro = montarMolduraPadrao(slidePpt, slide.titulo, estado.identificacao, cores);

  desenharCaixaBranca(slidePpt, quadro, cores);

  const margemLateral = quadro.w * 0.05;
  const margemSuperior = quadro.h * 0.07;
  const larguraTexto = quadro.w - (margemLateral * 2);
  let yTexto = quadro.y + margemSuperior;
  let alturaTexto = quadro.h - (margemSuperior * 2);

  if (slide.subtitulo) {
    slidePpt.addText(String(slide.subtitulo), {
      x: quadro.x + margemLateral,
      y: yTexto,
      w: larguraTexto,
      h: 0.36,
      fontFace: FONTE_TITULO,
      fontSize: 15,
      bold: true,
      color: cores.titulo,
      margin: 0
    });
    yTexto += 0.46;
    alturaTexto -= 0.46;
  }

  slidePpt.addText(String(slide.texto || ''), {
    x: quadro.x + margemLateral,
    y: yTexto,
    w: larguraTexto,
    h: alturaTexto,
    fontFace: FONTE_CORPO,
    fontSize: 13,
    color: cores.texto,
    valign: 'top',
    margin: 0
  });
}

function exportarSlideEncerramento(apresentacao, slide, cores) {
  const slidePpt = apresentacao.addSlide();
  adicionarFundoSlide(slidePpt, cores.fundo);

  const larguraCartao = MEDIDAS_PPT.largura * 0.70;
  const alturaCartao = 3.55;
  const xCartao = (MEDIDAS_PPT.largura - larguraCartao) / 2;
  const yCartao = (MEDIDAS_PPT.altura - alturaCartao) / 2;

  slidePpt.addShape('roundRect', {
    x: xCartao,
    y: yCartao,
    w: larguraCartao,
    h: alturaCartao,
    fill: { color: cores.titulo },
    line: { color: cores.titulo, width: 0 }
  });

  slidePpt.addText(String(slide.textoAgradecimento || ''), {
    x: xCartao + 0.45,
    y: yCartao + 0.92,
    w: larguraCartao - 0.9,
    h: 0.8,
    align: 'center',
    fontFace: FONTE_TITULO,
    fontSize: 40,
    bold: true,
    color: cores.branco,
    margin: 0
  });

  slidePpt.addText(String(slide.subtitulo || ''), {
    x: xCartao + 0.55,
    y: yCartao + 2.05,
    w: larguraCartao - 1.1,
    h: 0.45,
    align: 'center',
    fontFace: FONTE_CORPO,
    fontSize: 14,
    color: cores.branco,
    margin: 0
  });
}

async function exportarApresentacao() {
  if (typeof PptxGenJS === 'undefined') {
    alert('A biblioteca de PowerPoint não carregou. Confira se o arquivo estaticos/pptxgen.bundle.js está na pasta.');
    return;
  }

  if (estado.slides.length === 0) {
    alert('Adicione pelo menos um slide antes de gerar o PowerPoint.');
    return;
  }

  const botaoExportar = document.getElementById('btn-exportar-pptx');
  const rotuloOriginal = botaoExportar ? botaoExportar.innerHTML : '';

  if (botaoExportar) {
    botaoExportar.disabled = true;
    botaoExportar.innerHTML = 'Gerando...';
  }

  try {
    const apresentacao = new PptxGenJS();
    apresentacao.layout = 'LAYOUT_WIDE';
    const cores = obterCoresSlide();

    estado.slides.forEach((slide) => {
      switch (slide.tipo) {
        case 'capa':
          exportarSlideCapa(apresentacao, cores);
          break;
        case 'totalizador':
          exportarSlideTotalizador(apresentacao, slide, cores);
          break;
        case 'mensal':
          exportarSlideMensal(apresentacao, slide, cores);
          break;
        case 'slide4':
          exportarSlide4(apresentacao, slide, cores);
          break;
        case 'slide5':
          exportarSlide5(apresentacao, slide, cores);
          break;
        case 'slide6':
          exportarSlide6(apresentacao, slide, cores);
          break;
        case 'slide7':
          exportarSlide7(apresentacao, slide, cores);
          break;
        case 'slide8':
          exportarSlide8(apresentacao, slide, cores);
          break;
        case 'encerramento':
          exportarSlideEncerramento(apresentacao, slide, cores);
          break;
      }
    });

    const nomeArquivo = `ApVision_${limparNomeArquivo(estado.identificacao)}.pptx`;
    await apresentacao.writeFile({ fileName: nomeArquivo });
  } catch (erro) {
    console.error('Erro ao gerar PowerPoint:', erro);
    alert('Ocorreu um erro ao gerar o arquivo PowerPoint. Tente de novo.');
  } finally {
    if (botaoExportar) {
      botaoExportar.disabled = false;
      botaoExportar.innerHTML = rotuloOriginal;
    }
  }
}
