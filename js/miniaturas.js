// Controle da barra de miniaturas e da ordem, criação e exclusão de slides

function mostrarMiniaturas() {
  const area = document.getElementById('area-miniaturas');
  if (!area) return;

  area.innerHTML = '';
  let miniaturaAtiva = null;

  estado.slides.forEach((slide, indice) => {
    const estaAtivo = indice === estado.indiceSlideAtual;
    const classeAtiva = estaAtivo ? 'ativo' : '';
    const tituloExibicao = pegarNomeSlide(slide);
    const elementoMiniatura = document.createElement('div');

    elementoMiniatura.className = `miniatura ${classeAtiva}`;
    elementoMiniatura.innerHTML = `
      <div class="miniatura-numero">${indice + 1}</div>
      <div style="margin-top: 10px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%;">${escaparHTML(tituloExibicao)}</div>
    `;

    elementoMiniatura.addEventListener('click', () => {
      estado.indiceSlideAtual = indice;
      atualizarTela();
    });

    if (estaAtivo) {
      miniaturaAtiva = elementoMiniatura;
    }

    area.appendChild(elementoMiniatura);
  });

  if (miniaturaAtiva) {
    miniaturaAtiva.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
}

function mostrarListaEstrutura() {
  const area = document.getElementById('lista-slides-ordem');
  if (!area) return;

  area.innerHTML = '';

  estado.slides.forEach((slide, indice) => {
    const classeAtiva = indice === estado.indiceSlideAtual ? 'ativo' : '';
    const rotulo = pegarNomeSlide(slide);
    const slideFixo = SLIDES_FIXOS.has(slide.id);

    const atributosBotaoExcluir = slideFixo
      ? 'disabled style="opacity: 0.25; cursor: not-allowed;" title="Slide base (não pode ser apagado)"'
      : 'title="Apagar slide"';

    const itemSlide = document.createElement('div');
    itemSlide.className = `item-estrutura ${classeAtiva}`;
    itemSlide.innerHTML = `
      <div class="item-estrutura-rotulo">
        <span class="item-estrutura-num">${indice + 1}</span>
        <span style="font-weight: 600; text-overflow: ellipsis; overflow: hidden;">${escaparHTML(rotulo)}</span>
      </div>
      <div class="item-estrutura-controles">
        <button class="btn-controle duplicar" data-indice="${indice}" title="Duplicar slide">⧉</button>
        <button class="btn-controle mover-cima" data-indice="${indice}" title="Mover para cima" ${indice === 0 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>▲</button>
        <button class="btn-controle mover-baixo" data-indice="${indice}" title="Mover para baixo" ${indice === estado.slides.length - 1 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>▼</button>
        <button class="btn-controle excluir" data-indice="${indice}" ${atributosBotaoExcluir}>&times;</button>
      </div>
    `;

    // Seleciona o slide e navega diretamente para a aba de edição
    itemSlide.querySelector('.item-estrutura-rotulo').addEventListener('click', () => {
      estado.indiceSlideAtual = indice;
      atualizarTela();
      document.getElementById('btn-aba-editor').click();
    });

    itemSlide.querySelector('.duplicar').addEventListener('click', (evento) => {
      evento.stopPropagation();
      duplicarSlide(indice);
    });

    if (indice > 0) {
      itemSlide.querySelector('.mover-cima').addEventListener('click', (evento) => {
        evento.stopPropagation();
        trocarSlides(indice, indice - 1);
      });
    }

    if (indice < estado.slides.length - 1) {
      itemSlide.querySelector('.mover-baixo').addEventListener('click', (evento) => {
        evento.stopPropagation();
        trocarSlides(indice, indice + 1);
      });
    }

    if (!slideFixo) {
      itemSlide.querySelector('.excluir').addEventListener('click', (evento) => {
        evento.stopPropagation();
        removerSlide(indice);
      });
    }

    area.appendChild(itemSlide);
  });
}

function duplicarSlide(indice) {
  const slideOriginal = estado.slides[indice];
  if (!slideOriginal) return;

  const copia = JSON.parse(JSON.stringify(slideOriginal));
  copia.id = gerarIdUnico('slide');

  if (Array.isArray(copia.itens)) {
    copia.itens = copia.itens.map((item) => ({ ...item, id: gerarIdUnico('item') }));
  }

  if (Array.isArray(copia.pontosDados)) {
    copia.pontosDados = copia.pontosDados.map((ponto) => ({ ...ponto, id: gerarIdUnico('ponto') }));
  }

  if (Array.isArray(copia.registros)) {
    copia.registros = copia.registros.map((reg) => ({ ...reg, id: gerarIdUnico('reg') }));
  }

  if (Array.isArray(copia.mesesManuais)) {
    copia.mesesManuais = copia.mesesManuais.map((mes) => ({ ...mes, id: gerarIdUnico('mes') }));
  }

  if (copia.tipo === 'mensal') {
    const nomesUsados = new Set(pegarSlidesMensais().map((s) => s.nome));
    const proximoMesDisponivel = LISTA_MESES.find((mes) => !nomesUsados.has(mes));
    copia.nome = proximoMesDisponivel || `${copia.nome} (Cópia)`;

    const slideTotalizador = estado.slides.find((s) => s.tipo === 'totalizador');
    if (slideTotalizador && Array.isArray(slideTotalizador.mesesManuais)) {
      slideTotalizador.mesesManuais = slideTotalizador.mesesManuais.filter((m) => m.nome !== copia.nome);
    }
  }

  estado.slides.splice(indice + 1, 0, copia);
  estado.indiceSlideAtual = indice + 1;
  atualizarTela();
}

function trocarSlides(indiceOrigem, indiceDestino) {
  const slideTemporario = estado.slides[indiceOrigem];
  estado.slides[indiceOrigem] = estado.slides[indiceDestino];
  estado.slides[indiceDestino] = slideTemporario;

  if (estado.indiceSlideAtual === indiceOrigem) {
    estado.indiceSlideAtual = indiceDestino;
  } else if (estado.indiceSlideAtual === indiceDestino) {
    estado.indiceSlideAtual = indiceOrigem;
  }

  atualizarTela();
}

function removerSlide(indice) {
  const slideAlvo = estado.slides[indice];

  if (slideAlvo && SLIDES_FIXOS.has(slideAlvo.id)) {
    alert('Esse slide faz parte da base da apresentação e não pode ser apagado.');
    return;
  }

  if (estado.slides.length <= 1) {
    alert('A apresentação precisa ter pelo menos um slide.');
    return;
  }

  if (confirm(`Tem certeza que deseja apagar o slide ${indice + 1}?`)) {
    estado.slides.splice(indice, 1);

    if (estado.indiceSlideAtual >= estado.slides.length) {
      estado.indiceSlideAtual = estado.slides.length - 1;
    }

    atualizarTela();
  }
}

function criarModeloSlide(tipo) {
  const idUnico = gerarIdUnico('slide');

  switch (tipo) {
    case 'capa':
      return {
        id: idUnico,
        tipo: 'capa',
        titulo: 'Capa Inicial'
      };

    case 'totalizador':
      return {
        id: idUnico,
        tipo: 'totalizador',
        titulo: 'Totalizador Anual',
        tituloObs: 'Resumo do Período',
        textoObs: 'Escreva aqui um resumo geral dos resultados deste período.',
        mesesManuais: []
      };

    case 'mensal': {
      const slidesMensaisExistentes = pegarSlidesMensais();
      const nomesUsados = new Set(slidesMensaisExistentes.map((s) => s.nome));
      const proximoNome = LISTA_MESES.find((mes) => !nomesUsados.has(mes)) || `Mês ${slidesMensaisExistentes.length + 1}`;

      // Remove o mês dos lançamentos manuais caso ele já estivesse lá
      const slideTotalizador = estado.slides.find((s) => s.tipo === 'totalizador');
      if (slideTotalizador && Array.isArray(slideTotalizador.mesesManuais)) {
        slideTotalizador.mesesManuais = slideTotalizador.mesesManuais.filter((m) => m.nome !== proximoNome);
      }

      return {
        id: idUnico,
        tipo: 'mensal',
        nome: proximoNome,
        quantidade: 350,
        desviosInternos: 0,
        desviosExternos: 0,
        diasAtraso: 0,
        observacoes: 'Escreva aqui as observações deste mês.'
      };
    }

    case 'slide4':
      return {
        id: idUnico,
        tipo: 'slide4',
        titulo: 'Entregas por Categoria',
        tituloObs: 'Observações',
        textoObs: 'Escreva aqui os destaques sobre as categorias mostradas no gráfico.',
        formatoMoeda: false,
        itens: [
          { id: gerarIdUnico('item'), rotulo: 'Item A', valor: 120 },
          { id: gerarIdUnico('item'), rotulo: 'Item B', valor: 85 }
        ]
      };

    case 'slide5':
      return {
        id: idUnico,
        tipo: 'slide5',
        titulo: 'Realizado x Meta',
        tituloObs: 'Observações',
        textoObs: 'Comparação entre o que foi entregue (linha normal) e a meta prevista (linha tracejada) em cada período.',
        pontosDados: [
          { id: gerarIdUnico('ponto'), rotulo: 'Janeiro', realizado: 340, projecao: 360 },
          { id: gerarIdUnico('ponto'), rotulo: 'Fevereiro', realizado: 365, projecao: 380 }
        ]
      };

    case 'slide6':
      return {
        id: idUnico,
        tipo: 'slide6',
        titulo: 'Divisão por Categoria',
        tituloObs: 'Observações',
        textoObs: 'Escreva aqui comentários sobre a divisão mostrada no gráfico.',
        formatoRosca: false,
        itens: [
          { id: gerarIdUnico('item'), rotulo: 'Janeiro', valor: 4 },
          { id: gerarIdUnico('item'), rotulo: 'Fevereiro', valor: 3 },
          { id: gerarIdUnico('item'), rotulo: 'Março', valor: 5 }
        ]
      };

    case 'slide7':
      return {
        id: idUnico,
        tipo: 'slide7',
        titulo: 'Evolução de Indicadores',
        tituloObs: 'Observações',
        textoObs: 'Acompanhamento dos valores de cada linha ao longo dos meses.',
        registros: [
          { id: gerarIdUnico('reg'), idItem: '101', quantidade: 150, periodo: 'Janeiro', rotuloMetrica: 'Indicador' },
          { id: gerarIdUnico('reg'), idItem: '101', quantidade: 180, periodo: 'Fevereiro', rotuloMetrica: 'Indicador' },
          { id: gerarIdUnico('reg'), idItem: '101', quantidade: 165, periodo: 'Março', rotuloMetrica: 'Indicador' }
        ]
      };

    case 'slide8':
      return {
        id: idUnico,
        tipo: 'slide8',
        titulo: 'Anotações Gerais',
        subtitulo: 'Pontos Importantes',
        texto: 'Digite aqui o texto deste slide.'
      };

    case 'encerramento':
      return {
        id: idUnico,
        tipo: 'encerramento',
        textoAgradecimento: 'Obrigado a todos!',
        subtitulo: `${estado.identificacao} • ApVision`
      };

    default:
      return null;
  }
}

function adicionarSlide() {
  const seletorTipo = document.getElementById('selecionar-tipo-slide');
  if (!seletorTipo) return;

  const novoSlide = criarModeloSlide(seletorTipo.value);
  if (!novoSlide) return;

  estado.slides.push(novoSlide);
  estado.indiceSlideAtual = estado.slides.length - 1;
  atualizarTela();

  document.getElementById('btn-aba-editor').click();
}
