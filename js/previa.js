// Monta a pré-visualização dos slides e os gráficos na tela

const MENSAGEM_BIBLIOTECA_INDISPONIVEL =
  '<div style="text-align: center; font-size: 0.85rem; color: #666666;">A biblioteca de gráficos não carregou. Confira o arquivo estaticos/chart.js.</div>';

function bibliotecaGraficoDisponivel() {
  return typeof Chart !== 'undefined';
}

const pluginValoresPizza = {
  id: 'rotulosValoresPizza',
  afterDatasetsDraw(grafico) {
    const { ctx: contexto } = grafico;
    const metadados = grafico.getDatasetMeta(0);
    const serie = grafico.data.datasets[0];
    const coresFatias = Array.isArray(serie.backgroundColor) ? serie.backgroundColor : [];

    metadados.data.forEach((fatia, indice) => {
      const valor = paraNumero(serie.data[indice]);
      if (valor <= 0) return;

      const propriedades = fatia.getProps(
        ['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'],
        true
      );
      const anguloMedio = (propriedades.startAngle + propriedades.endAngle) / 2;
      const raioMedio = (propriedades.innerRadius + propriedades.outerRadius) / 2;
      const posicaoX = propriedades.x + Math.cos(anguloMedio) * raioMedio;
      const posicaoY = propriedades.y + Math.sin(anguloMedio) * raioMedio;
      const corFatia = coresFatias[indice] || estado.paleta.corGrafico;

      contexto.save();
      contexto.fillStyle = '#' + obterCorTextoContraste(corFatia);
      contexto.font = `bold 13px ${FONTE_CORPO}, sans-serif`;
      contexto.textAlign = 'center';
      contexto.textBaseline = 'middle';
      contexto.fillText(valor.toLocaleString('pt-BR'), posicaoX, posicaoY);
      contexto.restore();
    });
  }
};

function criarPluginRotulosPontos(tamanhoFonte = 10, deslocamentoVertical = 8) {
  return {
    id: 'rotulosPontosLinha',
    afterDatasetsDraw(grafico) {
      const { ctx: contexto } = grafico;
      grafico.data.datasets.forEach((serie, indiceSerie) => {
        const metadados = grafico.getDatasetMeta(indiceSerie);
        metadados.data.forEach((ponto, indicePonto) => {
          const valor = serie.data[indicePonto];
          if (valor === null || valor === undefined) return;

          contexto.save();
          contexto.fillStyle = serie.borderColor;
          contexto.font = `bold ${tamanhoFonte}px ${FONTE_CORPO}, sans-serif`;
          contexto.textAlign = 'center';
          contexto.textBaseline = 'bottom';
          contexto.fillText(paraNumero(valor).toLocaleString('pt-BR'), ponto.x, ponto.y - deslocamentoVertical);
          contexto.restore();
        });
      });
    }
  };
}

function criarPluginRotulosBarras(formatarValor) {
  return {
    id: 'rotulosDadosBarras',
    afterDatasetsDraw(grafico) {
      const { ctx: contexto, data: dados } = grafico;
      const corBarra = dados.datasets[0].backgroundColor || estado.paleta.corGrafico;

      grafico.getDatasetMeta(0).data.forEach((barra, indice) => {
        const valor = dados.datasets[0].data[indice];
        const rotulo = formatarValor(valor);
        const centroBarraX = (barra.base + barra.x) / 2;
        const centroBarraY = barra.y;
        const larguraBarra = Math.abs(barra.x - barra.base);

        contexto.save();
        contexto.font = `bold 9px ${FONTE_CORPO}, sans-serif`;

        const larguraMinimaInterna = contexto.measureText(rotulo).width + 14;
        const cabeDentroDaBarra = larguraBarra >= larguraMinimaInterna;

        contexto.fillStyle = cabeDentroDaBarra
          ? '#' + obterCorTextoContraste(corBarra)
          : '#' + estado.paleta.corTexto;
        contexto.textAlign = cabeDentroDaBarra ? 'center' : 'left';
        contexto.textBaseline = 'middle';
        contexto.fillText(rotulo, cabeDentroDaBarra ? centroBarraX : barra.x + 6, centroBarraY);
        contexto.restore();
      });
    }
  };
}

function renderizarPreviaCapa(palco) {
  palco.innerHTML = `
    <div class="capa">
      <div class="capa-kpi">${escaparHTML(estado.kpiCapa)}</div>
      <h1 class="capa-titulo">${escaparHTML(estado.identificacao)}</h1>
      <div class="capa-linha"></div>
      <div class="capa-periodo">Apresentação de Indicadores<br>Período: <span>${escaparHTML(estado.periodo)}</span></div>
    </div>
  `;
}

function renderizarPreviaTotalizador(palco, slide) {
  const metricas = pegarMetricasConsolidadas();
  const todosOsMeses = pegarTodosMesesParaGrafico();

  palco.innerHTML = `
    <div class="fundo-slide">
      <div class="topo-slide">
        <div class="topo-titulo">${escaparHTML(slide.titulo)}</div>
        <div class="topo-sub">${escaparHTML(estado.periodo)}</div>
      </div>

      <div class="indicadores">
        <div class="cartao-ind">
          <div class="barra-status"></div>
          <div class="valor-ind">${metricas.totalQuantidade.toLocaleString('pt-BR')}</div>
          <div class="rotulo-ind">Processados</div>
        </div>
        <div class="cartao-ind">
          <div class="barra-status"></div>
          <div class="valor-ind">${metricas.totalInternos.toLocaleString('pt-BR')}</div>
          <div class="rotulo-ind">Erros Internos</div>
        </div>
        <div class="cartao-ind">
          <div class="barra-status"></div>
          <div class="valor-ind">${metricas.totalExternos.toLocaleString('pt-BR')}</div>
          <div class="rotulo-ind">Erros Externos</div>
        </div>
        <div class="cartao-ind ${metricas.totalAtraso > 0 ? 'alerta' : ''}">
          <div class="barra-status"></div>
          <div class="valor-ind">${metricas.totalAtraso.toLocaleString('pt-BR')}</div>
          <div class="rotulo-ind">Dias de Atraso</div>
        </div>
      </div>

      <div class="grade-painel">
        <div class="area-grafico">
          ${!bibliotecaGraficoDisponivel()
            ? MENSAGEM_BIBLIOTECA_INDISPONIVEL
            : todosOsMeses.length > 0
              ? '<div class="moldura-grafico"><canvas id="tela-grafico-totalizador"></canvas></div>'
              : '<div style="text-align: center; font-size: 0.85rem; color: #666666;">Adicione meses para mostrar o gráfico comparativo.</div>'}
        </div>
        <div class="area-obs">
          <div class="obs-titulo">${escaparHTML(slide.tituloObs || 'Resumo do Período')}</div>
          <div class="obs-texto" style="white-space: pre-wrap;">${escaparHTML(slide.textoObs || '')}</div>
        </div>
      </div>
    </div>
  `;

  if (todosOsMeses.length === 0 || !bibliotecaGraficoDisponivel()) return;

  const contexto = document.getElementById('tela-grafico-totalizador').getContext('2d');
  const tons = variacoesGrafico(3);

  graficoAtivo = new Chart(contexto, {
    type: 'bar',
    data: {
      labels: todosOsMeses.map((mes) => mes.nome),
      datasets: [
        {
          label: 'Processados',
          data: todosOsMeses.map((mes) => paraNumero(mes.quantidade)),
          backgroundColor: '#' + tons[0],
          yAxisID: 'eixoEsquerdo',
          borderRadius: 3
        },
        {
          label: 'Erros Internos',
          data: todosOsMeses.map((mes) => paraNumero(mes.desviosInternos)),
          backgroundColor: '#' + tons[1],
          yAxisID: 'eixoDireito',
          borderRadius: 3
        },
        {
          label: 'Erros Externos',
          data: todosOsMeses.map((mes) => paraNumero(mes.desviosExternos)),
          backgroundColor: '#' + tons[2],
          yAxisID: 'eixoDireito',
          borderRadius: 3
        },
        {
          label: 'Dias de Atraso',
          data: todosOsMeses.map((mes) => paraNumero(mes.diasAtraso)),
          backgroundColor: '#' + estado.paleta.corAlerta,
          yAxisID: 'eixoDireito',
          borderRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 8, font: { size: 9, family: FONTE_CORPO } }
        }
      },
      scales: {
        eixoEsquerdo: {
          type: 'linear',
          position: 'left',
          grid: { display: false },
          ticks: { font: { size: 8 } }
        },
        eixoDireito: {
          type: 'linear',
          position: 'right',
          grid: { color: '#' + estado.paleta.corBorda, drawBorder: false },
          ticks: { font: { size: 8 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 9, weight: 'bold' } }
        }
      }
    }
  });
}

function renderizarPreviaMensal(palco, slide) {
  const diasAtraso = paraNumero(slide.diasAtraso);

  palco.innerHTML = `
    <div class="fundo-slide">
      <div class="topo-slide">
        <div class="topo-titulo">Indicadores - ${escaparHTML(slide.nome)}</div>
        <div class="topo-sub">${escaparHTML(estado.identificacao)}</div>
      </div>

      <div class="bloco-mensal">
        <div class="grade-cartoes">
          <div class="cartao-mensal">
            <div class="barra-status"></div>
            <div class="valor-cartao">${paraNumero(slide.quantidade).toLocaleString('pt-BR')}</div>
            <div class="nome-cartao">Total Processado</div>
          </div>
          <div class="cartao-mensal">
            <div class="barra-status"></div>
            <div class="valor-cartao">${paraNumero(slide.desviosInternos).toLocaleString('pt-BR')}</div>
            <div class="nome-cartao">Erros Internos</div>
          </div>
          <div class="cartao-mensal">
            <div class="barra-status"></div>
            <div class="valor-cartao">${paraNumero(slide.desviosExternos).toLocaleString('pt-BR')}</div>
            <div class="nome-cartao">Erros Externos</div>
          </div>
          <div class="cartao-mensal ${diasAtraso > 0 ? 'alerta' : ''}">
            <div class="barra-status"></div>
            <div class="valor-cartao">${diasAtraso.toLocaleString('pt-BR')}</div>
            <div class="nome-cartao">Dias de Atraso</div>
          </div>
        </div>

        <div class="area-obs" style="padding: 8% 6% 6% 6%;">
          <div class="obs-titulo">Observações do Mês</div>
          <div class="obs-texto" style="font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${escaparHTML(slide.observacoes || 'Nenhuma observação cadastrada para este mês.')}</div>
        </div>
      </div>
    </div>
  `;
}

function renderizarPreviaSlide4(palco, slide) {
  const itens = Array.isArray(slide.itens) ? slide.itens : [];

  palco.innerHTML = `
    <div class="fundo-slide">
      <div class="topo-slide">
        <div class="topo-titulo">${escaparHTML(slide.titulo)}</div>
        <div class="topo-sub">${escaparHTML(estado.identificacao)}</div>
      </div>

      <div class="grade-painel">
        <div class="area-grafico">
          ${!bibliotecaGraficoDisponivel()
            ? MENSAGEM_BIBLIOTECA_INDISPONIVEL
            : itens.length > 0
              ? '<div class="moldura-grafico"><canvas id="tela-grafico-slide4"></canvas></div>'
              : '<div style="text-align: center; font-size: 0.85rem; color: #666666;">Adicione itens para mostrar o gráfico de barras.</div>'}
        </div>
        <div class="area-obs">
          <div class="obs-titulo">${escaparHTML(slide.tituloObs || 'Observações')}</div>
          <div class="obs-texto" style="white-space: pre-wrap;">${escaparHTML(slide.textoObs || 'Comparação entre os itens cadastrados no período.')}</div>
        </div>
      </div>
    </div>
  `;

  if (itens.length === 0 || !bibliotecaGraficoDisponivel()) return;

  const contexto = document.getElementById('tela-grafico-slide4').getContext('2d');
  const formatarValor = (valor) => slide.formatoMoeda
    ? paraNumero(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : paraNumero(valor).toLocaleString('pt-BR');

  graficoAtivo = new Chart(contexto, {
    type: 'bar',
    data: {
      labels: itens.map((item) => item.rotulo),
      datasets: [{
        label: 'Quantidade',
        data: itens.map((item) => paraNumero(item.valor)),
        backgroundColor: '#' + variacoesGrafico(1)[0],
        borderRadius: 3
      }]
    },
    options: {
      indexAxis: 'y',
      layout: { padding: { right: 56 } },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatarValor(ctx.parsed.x)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 }, callback: (valor) => formatarValor(valor) },
          afterFit(eixo) {
            eixo.paddingRight = 14;
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 9, weight: 'bold' } }
        }
      }
    },
    plugins: [criarPluginRotulosBarras(formatarValor)]
  });
}

function renderizarPreviaSlide5(palco, slide) {
  const pontosDados = Array.isArray(slide.pontosDados) ? slide.pontosDados : [];

  palco.innerHTML = `
    <div class="fundo-slide">
      <div class="topo-slide">
        <div class="topo-titulo">${escaparHTML(slide.titulo)}</div>
        <div class="topo-sub">${escaparHTML(estado.identificacao)}</div>
      </div>

      <div class="grade-painel">
        <div class="area-grafico">
          ${!bibliotecaGraficoDisponivel()
            ? MENSAGEM_BIBLIOTECA_INDISPONIVEL
            : pontosDados.length > 0
              ? '<div class="moldura-grafico"><canvas id="tela-grafico-slide5"></canvas></div>'
              : '<div style="text-align: center; font-size: 0.85rem; color: #666666;">Adicione períodos para mostrar o gráfico de linhas.</div>'}
        </div>
        <div class="area-obs">
          <div class="obs-titulo">${escaparHTML(slide.tituloObs || 'Observações')}</div>
          <div class="obs-texto" style="white-space: pre-wrap;">${escaparHTML(slide.textoObs || 'Comparação entre os valores entregues e a meta prevista.')}</div>
        </div>
      </div>
    </div>
  `;

  if (pontosDados.length === 0 || !bibliotecaGraficoDisponivel()) return;

  const contexto = document.getElementById('tela-grafico-slide5').getContext('2d');
  const tons = variacoesGrafico(2);

  graficoAtivo = new Chart(contexto, {
    type: 'line',
    data: {
      labels: pontosDados.map((ponto) => ponto.rotulo),
      datasets: [
        {
          label: 'Realizado',
          data: pontosDados.map((ponto) => paraNumero(ponto.realizado)),
          borderColor: '#' + tons[0],
          backgroundColor: '#' + tons[0],
          borderWidth: 3,
          tension: 0.25,
          fill: false,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#' + tons[0]
        },
        {
          label: 'Meta',
          data: pontosDados.map((ponto) => paraNumero(ponto.projecao)),
          borderColor: '#' + tons[1],
          backgroundColor: '#' + tons[1],
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.25,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#' + tons[1]
        }
      ]
    },
    options: {
      layout: { padding: { top: 24, right: 16, bottom: 8, left: 8 } },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, font: { size: 9 }, padding: 8 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('pt-BR')}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10, weight: 'bold' } }
        },
        y: {
          grid: { color: '#' + estado.paleta.corBorda },
          ticks: {
            font: { size: 9 },
            callback: (valor) => valor.toLocaleString('pt-BR')
          }
        }
      }
    },
    plugins: [criarPluginRotulosPontos(10, 8)]
  });
}

function renderizarPreviaSlide6(palco, slide) {
  const itens = Array.isArray(slide.itens) ? slide.itens : [];
  const somaValores = itens.reduce((soma, item) => soma + Math.max(0, paraNumero(item.valor)), 0);

  palco.innerHTML = `
    <div class="fundo-slide">
      <div class="topo-slide">
        <div class="topo-titulo">${escaparHTML(slide.titulo)}</div>
        <div class="topo-sub">${escaparHTML(estado.identificacao)}</div>
      </div>

      <div class="grade-painel">
        <div class="area-grafico" style="padding: 2%;">
          ${!bibliotecaGraficoDisponivel()
            ? MENSAGEM_BIBLIOTECA_INDISPONIVEL
            : itens.length > 0 && somaValores > 0
              ? '<div class="moldura-grafico"><canvas id="tela-grafico-slide6"></canvas></div>'
              : '<div style="text-align: center; font-size: 0.85rem; color: #666666;">Coloque valores maiores que zero nas fatias para mostrar o gráfico.</div>'}
        </div>
        <div class="area-obs">
          <div class="obs-titulo">${escaparHTML(slide.tituloObs || 'Observações')}</div>
          <div class="obs-texto" style="white-space: pre-wrap;">${escaparHTML(slide.textoObs || 'Divisão entre os itens cadastrados no gráfico.')}</div>
        </div>
      </div>
    </div>
  `;

  if (itens.length === 0 || somaValores <= 0 || !bibliotecaGraficoDisponivel()) return;

  const contexto = document.getElementById('tela-grafico-slide6').getContext('2d');
  const quantidadeCores = Math.max(6, itens.length);

  graficoAtivo = new Chart(contexto, {
    type: slide.formatoRosca ? 'doughnut' : 'pie',
    data: {
      labels: itens.map((item) => item.rotulo),
      datasets: [{
        data: itens.map((item) => Math.max(0, paraNumero(item.valor))),
        backgroundColor: variacoesGrafico(quantidadeCores).map((cor) => '#' + cor)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: slide.formatoRosca ? '52%' : '0%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, font: { size: 9 } }
        }
      }
    },
    plugins: [pluginValoresPizza]
  });
}

function renderizarPreviaSlide7(palco, slide) {
  const registros = Array.isArray(slide.registros) ? slide.registros : [];
  const totalRegistros = registros.length;
  const seriesUnicas = new Set(registros.map((reg) => reg.idItem)).size;
  const volumeTotal = registros.reduce((soma, reg) => soma + paraNumero(reg.quantidade), 0);
  const mediaPorRegistro = totalRegistros > 0 ? Math.round(volumeTotal / totalRegistros) : 0;

  palco.innerHTML = `
    <div class="fundo-slide">
      <div class="topo-slide">
        <div class="topo-titulo">${escaparHTML(slide.titulo)}</div>
        <div class="topo-sub">${escaparHTML(estado.identificacao)}</div>
      </div>

      <div class="indicadores" style="margin: 1% 0 2.5% 0; gap: 2.5%;">
        <div class="cartao-ind">
          <div class="barra-status"></div>
          <div class="valor-ind">${totalRegistros}</div>
          <div class="rotulo-ind">Dados</div>
        </div>
        <div class="cartao-ind">
          <div class="barra-status"></div>
          <div class="valor-ind">${seriesUnicas}</div>
          <div class="rotulo-ind">Linhas</div>
        </div>
        <div class="cartao-ind">
          <div class="barra-status"></div>
          <div class="valor-ind">${volumeTotal.toLocaleString('pt-BR')}</div>
          <div class="rotulo-ind">Soma Total</div>
        </div>
        <div class="cartao-ind">
          <div class="barra-status"></div>
          <div class="valor-ind">${mediaPorRegistro.toLocaleString('pt-BR')}</div>
          <div class="rotulo-ind">Média</div>
        </div>
      </div>

      <div class="grade-painel">
        <div class="area-grafico">
          ${!bibliotecaGraficoDisponivel()
            ? MENSAGEM_BIBLIOTECA_INDISPONIVEL
            : registros.length > 0
              ? '<div class="moldura-grafico"><canvas id="tela-grafico-slide7"></canvas></div>'
              : '<div style="text-align: center; font-size: 0.85rem; color: #666666;">Adicione dados no painel ao lado para mostrar o gráfico.</div>'}
        </div>
        <div class="area-obs">
          <div class="obs-titulo">${escaparHTML(slide.tituloObs || 'Observações')}</div>
          <div class="obs-texto" style="white-space: pre-wrap;">${escaparHTML(slide.textoObs || 'Acompanhamento dos valores de cada linha ao longo dos meses.')}</div>
        </div>
      </div>
    </div>
  `;

  if (registros.length === 0 || !bibliotecaGraficoDisponivel()) return;

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
  const coresGeradas = variacoesGrafico(Math.max(6, codigosSeries.length));

  const seriesGrafico = codigosSeries.map((codigo, indice) => {
    const corHex = '#' + coresGeradas[indice % coresGeradas.length];
    const valoresPorPeriodo = {};

    agrupadosPorSerie[codigo].forEach((reg) => {
      valoresPorPeriodo[reg.periodo] = paraNumero(reg.quantidade);
    });

    return {
      label: `Linha: ${codigo}`,
      data: periodosUnicos.map((periodo) => (
        valoresPorPeriodo[periodo] !== undefined ? valoresPorPeriodo[periodo] : null
      )),
      borderColor: corHex,
      backgroundColor: corHex,
      borderWidth: 3,
      tension: 0.25,
      fill: false,
      showLine: true,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: corHex,
      spanGaps: true
    };
  });

  const contexto = document.getElementById('tela-grafico-slide7').getContext('2d');
  graficoAtivo = new Chart(contexto, {
    type: 'line',
    data: {
      labels: periodosUnicos,
      datasets: seriesGrafico
    },
    options: {
      layout: { padding: { top: 24, right: 16, bottom: 8, left: 8 } },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, font: { size: 9 }, padding: 8 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toLocaleString('pt-BR') : '—'}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10, weight: 'bold' } }
        },
        y: {
          grid: { color: '#' + estado.paleta.corBorda },
          ticks: {
            font: { size: 9 },
            callback: (valor) => valor.toLocaleString('pt-BR')
          }
        }
      }
    },
    plugins: [criarPluginRotulosPontos(9, 6)]
  });
}

function renderizarPreviaSlide8(palco, slide) {
  const blocoSubtitulo = slide.subtitulo
    ? `<div class="subtitulo-texto-livre">${escaparHTML(slide.subtitulo)}</div>`
    : '';

  palco.innerHTML = `
    <div class="fundo-slide">
      <div class="topo-slide">
        <div class="topo-titulo">${escaparHTML(slide.titulo)}</div>
        <div class="topo-sub">${escaparHTML(estado.identificacao)}</div>
      </div>

      <div class="area-texto-livre">
        ${blocoSubtitulo}
        <div class="texto-livre" style="white-space: pre-wrap;">${escaparHTML(slide.texto || 'Digite aqui o texto deste slide.')}</div>
      </div>
    </div>
  `;
}

function renderizarPreviaEncerramento(palco, slide) {
  palco.innerHTML = `
    <div class="capa-final">
      <div class="capa-final-cartao">
        <h1 class="capa-final-titulo">${escaparHTML(slide.textoAgradecimento)}</h1>
        <p class="capa-final-sub">${escaparHTML(slide.subtitulo)}</p>
      </div>
    </div>
  `;
}

function mostrarPreviaSlide() {
  const palco = document.getElementById('palco-previa-slide');
  if (!palco) return;

  if (graficoAtivo) {
    graficoAtivo.destroy();
    graficoAtivo = null;
  }

  if (estado.slides.length === 0) {
    palco.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #404040;">Nenhum slide cadastrado. Adicione um novo slide na aba Estrutura.</div>';
    return;
  }

  const slide = estado.slides[estado.indiceSlideAtual];
  if (!slide) return;

  switch (slide.tipo) {
    case 'capa':
      renderizarPreviaCapa(palco);
      break;
    case 'totalizador':
      renderizarPreviaTotalizador(palco, slide);
      break;
    case 'mensal':
      renderizarPreviaMensal(palco, slide);
      break;
    case 'slide4':
      renderizarPreviaSlide4(palco, slide);
      break;
    case 'slide5':
      renderizarPreviaSlide5(palco, slide);
      break;
    case 'slide6':
      renderizarPreviaSlide6(palco, slide);
      break;
    case 'slide7':
      renderizarPreviaSlide7(palco, slide);
      break;
    case 'slide8':
      renderizarPreviaSlide8(palco, slide);
      break;
    case 'encerramento':
      renderizarPreviaEncerramento(palco, slide);
      break;
  }
}
