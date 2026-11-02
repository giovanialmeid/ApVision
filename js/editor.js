// Cria os campos de edição no painel lateral conforme o tipo de slide

function renderizarListaItensGrafico(recipiente, slide, mensagemMinimo) {
  recipiente.innerHTML = '';

  slide.itens.forEach((item) => {
    const linhaItem = document.createElement('div');
    linhaItem.className = 'linha-item';
    linhaItem.innerHTML = `
      <input type="text" class="entrada-rotulo-item" value="${escaparHTML(item.rotulo)}">
      <input type="number" step="any" class="entrada-valor-item" value="${escaparHTML(item.valor)}">
      <button class="btn-remover" title="Remover item">&times;</button>
    `;

    linhaItem.querySelector('.entrada-rotulo-item').addEventListener('input', (evento) => {
      item.rotulo = evento.target.value;
      atualizarPrevia();
    });

    linhaItem.querySelector('.entrada-valor-item').addEventListener('input', (evento) => {
      item.valor = paraNumero(evento.target.value);
      atualizarPrevia();
    });

    linhaItem.querySelector('.btn-remover').addEventListener('click', () => {
      if (slide.itens.length <= 1) {
        alert(mensagemMinimo);
        return;
      }
      slide.itens = slide.itens.filter((atual) => atual.id !== item.id);
      atualizarTela();
    });

    recipiente.appendChild(linhaItem);
  });
}

function renderizarEditorCapa(area) {
  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-capa-identificacao">Título Principal (Capa e Topo)</label>
      <input type="text" id="editar-capa-identificacao" value="${escaparHTML(estado.identificacao)}">
    </div>
    <div class="campo">
      <label for="editar-capa-periodo">Período da Apresentação</label>
      <input type="text" id="editar-capa-periodo" value="${escaparHTML(estado.periodo)}">
    </div>
    <div class="campo">
      <label for="editar-capa-kpi">Texto Acima do Título</label>
      <input type="text" id="editar-capa-kpi" value="${escaparHTML(estado.kpiCapa)}">
    </div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-capa-identificacao').addEventListener('input', (evento) => {
    const identificacaoAnterior = estado.identificacao;
    estado.identificacao = evento.target.value;

    // Atualiza o subtítulo da capa final se ainda estiver usando o padrão automático
    estado.slides.forEach((s) => {
      if (s.tipo === 'encerramento' && s.subtitulo === `${identificacaoAnterior} • ApVision`) {
        s.subtitulo = `${estado.identificacao} • ApVision`;
      }
    });

    atualizarPrevia();
  });

  document.getElementById('editar-capa-periodo').addEventListener('input', (evento) => {
    estado.periodo = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-capa-kpi').addEventListener('input', (evento) => {
    estado.kpiCapa = evento.target.value;
    atualizarPrevia();
  });
}

function renderizarEditorTotalizador(area, slide) {
  if (!Array.isArray(slide.mesesManuais)) {
    slide.mesesManuais = [];
  }

  slide.titulo = 'Totalizador Anual';

  const mesesNosSlides = pegarSlidesMensais().map((s) => s.nome);
  const mesesNosManuais = slide.mesesManuais.map((m) => m.nome);
  const mesesDisponiveis = LISTA_MESES.filter(
    (mes) => !mesesNosSlides.includes(mes) && !mesesNosManuais.includes(mes)
  );

  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label>Título do Slide</label>
      <input type="text" value="Totalizador Anual" disabled style="opacity: 0.7; cursor: not-allowed;">
      <div style="font-size: 10px; color: var(--cor-texto-secundario); margin-top: 4px;">Título fixo deste slide.</div>
    </div>
    <div class="campo">
      <label for="editar-tot-titulo-obs">Título das Observações</label>
      <input type="text" id="editar-tot-titulo-obs" value="${escaparHTML(slide.tituloObs)}">
    </div>
    <div class="campo">
      <label for="editar-tot-texto-obs">Observações</label>
      <textarea id="editar-tot-texto-obs" rows="4">${escaparHTML(slide.textoObs)}</textarea>
    </div>

    <div class="titulo-secao" style="margin-top: 20px; font-size: 12px; border-top: 1px solid var(--cor-borda); padding-top: 14px;">
      <span>Meses do Ano</span>
    </div>
    <div class="texto-ajuda">
      Adicione aqui os meses que <strong>não</strong> têm um slide próprio. Os slides mensais criados já entram na soma automaticamente.
    </div>

    ${mesesDisponiveis.length > 0 ? `
      <div style="display: flex; gap: 8px; margin-bottom: 14px;">
        <select id="editar-tot-selecionar-mes" style="flex: 1;">
          ${mesesDisponiveis.map((mes) => `<option value="${mes}">${mes}</option>`).join('')}
        </select>
        <button class="btn-secundario" id="btn-tot-adicionar-mes" style="width: auto; padding: 6px 14px; font-size: 12px; border-color: var(--cor-verde); color: var(--cor-verde);">+ Adicionar Mês</button>
      </div>
    ` : '<div style="font-size: 11px; color: var(--cor-texto-secundario); padding: 6px 0 14px; text-align: center;">Todos os 12 meses já foram adicionados.</div>'}

    <div id="editar-tot-lista-meses"></div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-tot-titulo-obs').addEventListener('input', (evento) => {
    slide.tituloObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-tot-texto-obs').addEventListener('input', (evento) => {
    slide.textoObs = evento.target.value;
    atualizarPrevia();
  });

  const botaoAdicionarMes = document.getElementById('btn-tot-adicionar-mes');
  if (botaoAdicionarMes) {
    botaoAdicionarMes.addEventListener('click', () => {
      const seletorMes = document.getElementById('editar-tot-selecionar-mes');
      const nomeMes = seletorMes.value;
      if (!nomeMes) return;

      slide.mesesManuais.push({
        id: gerarIdUnico('mes'),
        nome: nomeMes,
        quantidade: 0,
        desviosInternos: 0,
        desviosExternos: 0,
        diasAtraso: 0
      });

      atualizarTela();
    });
  }

  const areaListaMeses = document.getElementById('editar-tot-lista-meses');
  const manuaisOrdenados = ordenarPorMes(slide.mesesManuais, 'nome');
  const slidesOrdenados = ordenarPorMes(pegarSlidesMensais(), 'nome');

  manuaisOrdenados.forEach((mes) => {
    const cartao = document.createElement('div');
    cartao.className = 'cartao-dados';
    cartao.innerHTML = `
      <div class="cartao-dados-topo">
        <span>${escaparHTML(mes.nome)}</span>
        <button class="btn-remover tot-mes-remover" title="Remover mês">&times;</button>
      </div>
      <div class="campo-duplo" style="margin-bottom: 8px;">
        <div>
          <label style="font-size: 9px;">Processados</label>
          <input type="number" class="tot-mes-qtd" value="${escaparHTML(mes.quantidade)}">
        </div>
        <div>
          <label style="font-size: 9px;">Dias de Atraso</label>
          <input type="number" class="tot-mes-atraso" value="${escaparHTML(mes.diasAtraso)}">
        </div>
      </div>
      <div class="campo-duplo" style="margin-bottom: 0;">
        <div>
          <label style="font-size: 9px;">Erros Internos</label>
          <input type="number" class="tot-mes-internos" value="${escaparHTML(mes.desviosInternos)}">
        </div>
        <div>
          <label style="font-size: 9px;">Erros Externos</label>
          <input type="number" class="tot-mes-externos" value="${escaparHTML(mes.desviosExternos)}">
        </div>
      </div>
    `;

    cartao.querySelector('.tot-mes-qtd').addEventListener('input', (evento) => {
      mes.quantidade = paraNumero(evento.target.value);
      atualizarPrevia();
    });

    cartao.querySelector('.tot-mes-atraso').addEventListener('input', (evento) => {
      mes.diasAtraso = paraNumero(evento.target.value);
      atualizarPrevia();
    });

    cartao.querySelector('.tot-mes-internos').addEventListener('input', (evento) => {
      mes.desviosInternos = paraNumero(evento.target.value);
      atualizarPrevia();
    });

    cartao.querySelector('.tot-mes-externos').addEventListener('input', (evento) => {
      mes.desviosExternos = paraNumero(evento.target.value);
      atualizarPrevia();
    });

    cartao.querySelector('.tot-mes-remover').addEventListener('click', () => {
      slide.mesesManuais = slide.mesesManuais.filter((atual) => atual.id !== mes.id);
      atualizarTela();
    });

    areaListaMeses.appendChild(cartao);
  });

  if (slidesOrdenados.length > 0) {
    const divisor = document.createElement('div');
    divisor.style.cssText = 'font-size: 10px; font-weight: 600; color: var(--cor-texto-secundario); text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 8px; padding-top: 8px; border-top: 1px solid var(--cor-borda);';
    divisor.textContent = 'Slides Mensais Criados (automático)';
    areaListaMeses.appendChild(divisor);

    slidesOrdenados.forEach((mes) => {
      const cartao = document.createElement('div');
      cartao.className = 'cartao-dados';
      cartao.style.opacity = '0.75';
      cartao.innerHTML = `
        <div class="cartao-dados-topo" style="margin-bottom: 6px;">
          <span>${escaparHTML(mes.nome)}</span>
          <span style="font-size: 9px; background: var(--cor-superficie-3); padding: 2px 8px; border-radius: 10px; color: var(--cor-texto-secundario);">Slide Mensal</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 10px;">
          <div><strong>${paraNumero(mes.quantidade).toLocaleString('pt-BR')}</strong><br><span style="color: var(--cor-texto-secundario);">Proc.</span></div>
          <div><strong>${paraNumero(mes.desviosInternos)}</strong><br><span style="color: var(--cor-texto-secundario);">Erros Int.</span></div>
          <div><strong>${paraNumero(mes.desviosExternos)}</strong><br><span style="color: var(--cor-texto-secundario);">Erros Ext.</span></div>
          <div><strong>${paraNumero(mes.diasAtraso)}</strong><br><span style="color: var(--cor-texto-secundario);">Atraso</span></div>
        </div>
      `;
      areaListaMeses.appendChild(cartao);
    });
  }

  if (manuaisOrdenados.length === 0 && slidesOrdenados.length === 0) {
    areaListaMeses.innerHTML = '<div style="color: var(--cor-texto-secundario); font-size: 11px; text-align: center; padding: 16px;">Nenhum mês cadastrado ainda. Adicione meses acima ou crie slides mensais.</div>';
  }
}

function renderizarEditorMensal(area, slide) {
  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-men-nome">Nome do Mês / Período</label>
      <input type="text" id="editar-men-nome" value="${escaparHTML(slide.nome)}">
    </div>
    <div class="campo-duplo">
      <div>
        <label for="editar-men-qtd">Processados</label>
        <input type="number" id="editar-men-qtd" value="${escaparHTML(slide.quantidade)}">
      </div>
      <div>
        <label for="editar-men-atraso">Dias de Atraso</label>
        <input type="number" id="editar-men-atraso" value="${escaparHTML(slide.diasAtraso)}">
      </div>
    </div>
    <div class="campo-duplo">
      <div>
        <label for="editar-men-internos">Erros Internos</label>
        <input type="number" id="editar-men-internos" value="${escaparHTML(slide.desviosInternos)}">
      </div>
      <div>
        <label for="editar-men-externos">Erros Externos</label>
        <input type="number" id="editar-men-externos" value="${escaparHTML(slide.desviosExternos)}">
      </div>
    </div>
    <div class="campo">
      <label for="editar-men-obs">Observações do Mês</label>
      <textarea id="editar-men-obs" rows="4">${escaparHTML(slide.observacoes || '')}</textarea>
    </div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-men-nome').addEventListener('input', (evento) => {
    slide.nome = evento.target.value;
    atualizarPreviaENomes();
  });

  document.getElementById('editar-men-qtd').addEventListener('input', (evento) => {
    slide.quantidade = paraNumero(evento.target.value);
    atualizarPrevia();
  });

  document.getElementById('editar-men-atraso').addEventListener('input', (evento) => {
    slide.diasAtraso = paraNumero(evento.target.value);
    atualizarPrevia();
  });

  document.getElementById('editar-men-internos').addEventListener('input', (evento) => {
    slide.desviosInternos = paraNumero(evento.target.value);
    atualizarPrevia();
  });

  document.getElementById('editar-men-externos').addEventListener('input', (evento) => {
    slide.desviosExternos = paraNumero(evento.target.value);
    atualizarPrevia();
  });

  document.getElementById('editar-men-obs').addEventListener('input', (evento) => {
    slide.observacoes = evento.target.value;
    atualizarPrevia();
  });
}

function renderizarEditorSlide4(area, slide) {
  if (!Array.isArray(slide.itens)) {
    slide.itens = [];
  }

  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-s4-titulo">Título do Slide</label>
      <input type="text" id="editar-s4-titulo" value="${escaparHTML(slide.titulo)}">
    </div>
    <div class="campo">
      <label for="editar-s4-titulo-obs">Título das Observações</label>
      <input type="text" id="editar-s4-titulo-obs" value="${escaparHTML(slide.tituloObs || 'Observações')}">
    </div>
    <div class="campo">
      <label for="editar-s4-texto-obs">Observações</label>
      <textarea id="editar-s4-texto-obs" rows="5">${escaparHTML(slide.textoObs || '')}</textarea>
    </div>
    <div class="campo" style="display: flex; align-items: center; gap: 8px;">
      <input type="checkbox" id="editar-s4-moeda" ${slide.formatoMoeda ? 'checked' : ''} style="width: auto; margin: 0;">
      <label for="editar-s4-moeda" style="margin: 0; cursor: pointer;">Mostrar valores em R$ (moeda)</label>
    </div>
    <div class="titulo-secao" style="margin-top: 20px; font-size: 12px;">
      <span>Barras do Gráfico</span>
      <button class="btn-secundario" id="btn-adicionar-item-s4" style="width: auto; padding: 2px 10px; font-size: 11px;">+ Adicionar</button>
    </div>
    <div class="lista-dinamica" id="editar-s4-lista-itens"></div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-s4-titulo').addEventListener('input', (evento) => {
    slide.titulo = evento.target.value;
    atualizarPreviaENomes();
  });

  document.getElementById('editar-s4-titulo-obs').addEventListener('input', (evento) => {
    slide.tituloObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-s4-texto-obs').addEventListener('input', (evento) => {
    slide.textoObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-s4-moeda').addEventListener('change', (evento) => {
    slide.formatoMoeda = evento.target.checked;
    atualizarPrevia();
  });

  document.getElementById('btn-adicionar-item-s4').addEventListener('click', () => {
    slide.itens.push({
      id: gerarIdUnico('item'),
      rotulo: 'Novo Item',
      valor: 100
    });
    atualizarTela();
  });

  renderizarListaItensGrafico(
    document.getElementById('editar-s4-lista-itens'),
    slide,
    'Deixe pelo menos um item no gráfico.'
  );
}

function renderizarEditorSlide5(area, slide) {
  if (!Array.isArray(slide.pontosDados) || slide.pontosDados.length === 0) {
    const mesesBase = pegarSlidesMensais();
    slide.pontosDados = mesesBase.length > 0
      ? mesesBase.map((mes) => ({
          id: gerarIdUnico('ponto'),
          rotulo: mes.nome,
          realizado: paraNumero(mes.quantidade),
          projecao: Math.round(paraNumero(mes.quantidade) * 1.05)
        }))
      : [
          { id: gerarIdUnico('ponto'), rotulo: 'Janeiro', realizado: 340, projecao: 360 },
          { id: gerarIdUnico('ponto'), rotulo: 'Fevereiro', realizado: 355, projecao: 375 },
          { id: gerarIdUnico('ponto'), rotulo: 'Março', realizado: 370, projecao: 390 }
        ];
  }

  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-s5-titulo">Título do Slide</label>
      <input type="text" id="editar-s5-titulo" value="${escaparHTML(slide.titulo)}">
    </div>
    <div class="campo">
      <label for="editar-s5-titulo-obs">Título das Observações</label>
      <input type="text" id="editar-s5-titulo-obs" value="${escaparHTML(slide.tituloObs || 'Observações')}">
    </div>
    <div class="campo">
      <label for="editar-s5-texto-obs">Observações</label>
      <textarea id="editar-s5-texto-obs" rows="5">${escaparHTML(slide.textoObs || '')}</textarea>
    </div>
    <div class="titulo-secao" style="margin-top: 20px; font-size: 12px;">
      <span>Valores por Período</span>
      <button class="btn-secundario" id="btn-adicionar-ponto-s5" style="width: auto; padding: 2px 10px; font-size: 11px;">+ Adicionar</button>
    </div>
    <div class="texto-ajuda">
      Preencha os valores realizados e a meta prevista para cada período.
    </div>
    <div class="lista-dinamica" id="editar-s5-lista-pontos"></div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-s5-titulo').addEventListener('input', (evento) => {
    slide.titulo = evento.target.value;
    atualizarPreviaENomes();
  });

  document.getElementById('editar-s5-titulo-obs').addEventListener('input', (evento) => {
    slide.tituloObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-s5-texto-obs').addEventListener('input', (evento) => {
    slide.textoObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('btn-adicionar-ponto-s5').addEventListener('click', () => {
    slide.pontosDados.push({
      id: gerarIdUnico('ponto'),
      rotulo: `Mês ${slide.pontosDados.length + 1}`,
      realizado: 350,
      projecao: 370
    });
    atualizarTela();
  });

  const recipientePontos = document.getElementById('editar-s5-lista-pontos');

  function renderizarPontosSlide5() {
    recipientePontos.innerHTML = '';

    slide.pontosDados.forEach((ponto) => {
      const cartaoPonto = document.createElement('div');
      cartaoPonto.className = 'cartao-dados';
      cartaoPonto.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <input type="text" class="entrada-rotulo-ponto" value="${escaparHTML(ponto.rotulo)}"
            style="font-weight: 600; font-size: 12px; color: var(--cor-azul); border: none; border-bottom: 1px solid var(--cor-borda-clara); background: transparent; width: calc(100% - 28px); padding: 2px 4px;">
          <button class="btn-remover remover-ponto" title="Remover período">&times;</button>
        </div>
        <div class="campo-duplo" style="margin-bottom: 0;">
          <div>
            <label style="font-size: 9px;">Realizado</label>
            <input type="number" class="entrada-realizado" value="${escaparHTML(ponto.realizado)}">
          </div>
          <div>
            <label style="font-size: 9px;">Meta</label>
            <input type="number" class="entrada-projecao" value="${escaparHTML(ponto.projecao)}">
          </div>
        </div>
      `;

      cartaoPonto.querySelector('.entrada-rotulo-ponto').addEventListener('input', (evento) => {
        ponto.rotulo = evento.target.value;
        atualizarPrevia();
      });

      cartaoPonto.querySelector('.entrada-realizado').addEventListener('input', (evento) => {
        ponto.realizado = paraNumero(evento.target.value);
        atualizarPrevia();
      });

      cartaoPonto.querySelector('.entrada-projecao').addEventListener('input', (evento) => {
        ponto.projecao = paraNumero(evento.target.value);
        atualizarPrevia();
      });

      cartaoPonto.querySelector('.remover-ponto').addEventListener('click', () => {
        if (slide.pontosDados.length <= 1) {
          alert('Deixe pelo menos um período no gráfico.');
          return;
        }
        slide.pontosDados = slide.pontosDados.filter((atual) => atual.id !== ponto.id);
        atualizarTela();
      });

      recipientePontos.appendChild(cartaoPonto);
    });
  }

  renderizarPontosSlide5();
}

function renderizarEditorSlide6(area, slide) {
  if (!Array.isArray(slide.itens)) {
    slide.itens = [];
  }

  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-s6-titulo">Título do Slide</label>
      <input type="text" id="editar-s6-titulo" value="${escaparHTML(slide.titulo)}">
    </div>
    <div class="campo">
      <label for="editar-s6-titulo-obs">Título das Observações</label>
      <input type="text" id="editar-s6-titulo-obs" value="${escaparHTML(slide.tituloObs || 'Observações')}">
    </div>
    <div class="campo">
      <label for="editar-s6-texto-obs">Observações</label>
      <textarea id="editar-s6-texto-obs" rows="5">${escaparHTML(slide.textoObs || '')}</textarea>
    </div>
    <div class="campo" style="display: flex; align-items: center; gap: 8px;">
      <input type="checkbox" id="editar-s6-rosca" ${slide.formatoRosca ? 'checked' : ''} style="width: auto; margin: 0;">
      <label for="editar-s6-rosca" style="margin: 0; cursor: pointer;">Mostrar em formato de Rosca</label>
    </div>
    <div class="titulo-secao" style="margin-top: 20px; font-size: 12px;">
      <span>Fatias do Gráfico</span>
      <button class="btn-secundario" id="btn-adicionar-item-s6" style="width: auto; padding: 2px 10px; font-size: 11px;">+ Adicionar</button>
    </div>
    <div class="lista-dinamica" id="editar-s6-lista-itens"></div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-s6-titulo').addEventListener('input', (evento) => {
    slide.titulo = evento.target.value;
    atualizarPreviaENomes();
  });

  document.getElementById('editar-s6-titulo-obs').addEventListener('input', (evento) => {
    slide.tituloObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-s6-texto-obs').addEventListener('input', (evento) => {
    slide.textoObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-s6-rosca').addEventListener('change', (evento) => {
    slide.formatoRosca = evento.target.checked;
    atualizarPreviaENomes();
  });

  document.getElementById('btn-adicionar-item-s6').addEventListener('click', () => {
    slide.itens.push({
      id: gerarIdUnico('item'),
      rotulo: 'Nova Fatia',
      valor: 5
    });
    atualizarTela();
  });

  renderizarListaItensGrafico(
    document.getElementById('editar-s6-lista-itens'),
    slide,
    'Deixe pelo menos uma fatia no gráfico.'
  );
}

function renderizarEditorSlide7(area, slide) {
  if (!Array.isArray(slide.registros)) {
    slide.registros = [];
  }

  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-s7-titulo">Título do Slide</label>
      <input type="text" id="editar-s7-titulo" value="${escaparHTML(slide.titulo)}">
    </div>
    <div class="campo">
      <label for="editar-s7-titulo-obs">Título das Observações</label>
      <input type="text" id="editar-s7-titulo-obs" value="${escaparHTML(slide.tituloObs || 'Observações')}">
    </div>
    <div class="campo">
      <label for="editar-s7-texto-obs">Observações</label>
      <textarea id="editar-s7-texto-obs" rows="4">${escaparHTML(slide.textoObs || '')}</textarea>
    </div>

    <div class="titulo-secao" style="margin-top: 20px; font-size: 12px; border-top: 1px solid var(--cor-borda); padding-top: 14px;">
      <span>Adicionar Valor na Linha</span>
    </div>
    <div class="texto-ajuda">
      Digite o nome ou código da linha, o valor e o mês. Clique em "+ Adicionar" para colocar no gráfico.
    </div>
    <div class="campo" style="margin-bottom: 10px;">
      <label for="editar-s7-novo-id" style="font-size: 9px;">Nome ou Código da Linha</label>
      <input type="text" id="editar-s7-novo-id" placeholder="Ex: 101" autocomplete="off">
    </div>
    <div class="campo-duplo" style="margin-bottom: 10px;">
      <div>
        <label for="editar-s7-nova-qtd" style="font-size: 9px;">Valor</label>
        <input type="number" id="editar-s7-nova-qtd" placeholder="Ex: 150" min="0">
      </div>
      <div>
        <label for="editar-s7-novo-periodo" style="font-size: 9px;">Mês</label>
        <select id="editar-s7-novo-periodo">
          ${LISTA_MESES.map((mes) => `<option value="${mes}">${mes}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="campo" style="margin-bottom: 10px;">
      <label for="editar-s7-nova-metrica" style="font-size: 9px;">Descrição (Opcional)</label>
      <input type="text" id="editar-s7-nova-metrica" placeholder="Ex: Chamados, Vendas, Entregas..." autocomplete="off">
    </div>
    <button class="btn-secundario" id="btn-s7-adicionar-registro" style="border-color: var(--cor-verde); color: var(--cor-verde); margin-bottom: 16px;">+ Adicionar</button>

    <div class="titulo-secao" style="margin-top: 8px; font-size: 12px;">
      <span>Dados Cadastrados (${slide.registros.length})</span>
    </div>
    <div class="lista-dinamica" id="editar-s7-lista-registros"></div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-s7-titulo').addEventListener('input', (evento) => {
    slide.titulo = evento.target.value;
    atualizarPreviaENomes();
  });

  document.getElementById('editar-s7-titulo-obs').addEventListener('input', (evento) => {
    slide.tituloObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-s7-texto-obs').addEventListener('input', (evento) => {
    slide.textoObs = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('btn-s7-adicionar-registro').addEventListener('click', () => {
    const novoId = document.getElementById('editar-s7-novo-id').value.trim();
    const valorInformado = document.getElementById('editar-s7-nova-qtd').value.trim();
    const novoPeriodo = document.getElementById('editar-s7-novo-periodo').value;
    const novaMetrica = document.getElementById('editar-s7-nova-metrica').value.trim() || 'Indicador';

    if (!novoId) {
      alert('Digite o nome ou código da linha.');
      return;
    }

    if (valorInformado === '' || Number.isNaN(Number(valorInformado)) || Number(valorInformado) < 0) {
      alert('Digite um valor válido (zero ou maior).');
      return;
    }

    const indiceExistente = slide.registros.findIndex(
      (reg) => reg.idItem === novoId && reg.periodo === novoPeriodo
    );

    if (indiceExistente !== -1) {
      slide.registros[indiceExistente].quantidade = paraNumero(valorInformado);
      slide.registros[indiceExistente].rotuloMetrica = novaMetrica;
    } else {
      slide.registros.push({
        id: gerarIdUnico('reg'),
        idItem: novoId,
        quantidade: paraNumero(valorInformado),
        periodo: novoPeriodo,
        rotuloMetrica: novaMetrica
      });
    }

    document.getElementById('editar-s7-nova-qtd').value = '';
    atualizarTela();
  });

  const listaRegistros = document.getElementById('editar-s7-lista-registros');

  if (slide.registros.length === 0) {
    listaRegistros.innerHTML = '<div style="color: var(--cor-texto-secundario); font-size: 11px; text-align: center; padding: 12px;">Nenhum dado adicionado ainda. Use os campos acima para incluir.</div>';
    return;
  }

  const registrosOrdenados = [...slide.registros].sort((a, b) => {
    if (a.idItem !== b.idItem) {
      return a.idItem.localeCompare(b.idItem);
    }
    return (ORDEM_MESES[a.periodo] || 99) - (ORDEM_MESES[b.periodo] || 99);
  });

  registrosOrdenados.forEach((registro) => {
    const cartaoRegistro = document.createElement('div');
    cartaoRegistro.className = 'cartao-dados';
    cartaoRegistro.style.padding = '8px 10px';
    cartaoRegistro.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="flex: 1;">
          <span style="font-weight: 700; font-size: 12px; color: var(--cor-verde); font-family: var(--fonte-titulo);">Linha: ${escaparHTML(registro.idItem)}</span>
          <span style="font-size: 11px; color: var(--cor-texto-secundario); margin-left: 8px;">${escaparHTML(registro.periodo)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 700; font-size: 13px; color: var(--cor-azul); font-family: var(--fonte-titulo);">${paraNumero(registro.quantidade).toLocaleString('pt-BR')}</span>
          <button class="btn-remover remover-registro-s7" title="Remover item">&times;</button>
        </div>
      </div>
      <div style="font-size: 9px; color: var(--cor-texto-secundario); margin-top: 2px; font-style: italic;">${escaparHTML(registro.rotuloMetrica || 'Indicador')}</div>
    `;

    cartaoRegistro.querySelector('.remover-registro-s7').addEventListener('click', () => {
      slide.registros = slide.registros.filter((atual) => atual.id !== registro.id);
      atualizarTela();
    });

    listaRegistros.appendChild(cartaoRegistro);
  });
}

function renderizarEditorSlide8(area, slide) {
  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-s8-titulo">Título do Slide</label>
      <input type="text" id="editar-s8-titulo" value="${escaparHTML(slide.titulo)}">
    </div>
    <div class="campo">
      <label for="editar-s8-subtitulo">Subtítulo (Opcional)</label>
      <input type="text" id="editar-s8-subtitulo" value="${escaparHTML(slide.subtitulo || '')}" placeholder="Ex: Pontos principais">
    </div>
    <div class="campo">
      <label for="editar-s8-texto">Texto</label>
      <textarea id="editar-s8-texto" rows="12">${escaparHTML(slide.texto || '')}</textarea>
    </div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-s8-titulo').addEventListener('input', (evento) => {
    slide.titulo = evento.target.value;
    atualizarPreviaENomes();
  });

  document.getElementById('editar-s8-subtitulo').addEventListener('input', (evento) => {
    slide.subtitulo = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-s8-texto').addEventListener('input', (evento) => {
    slide.texto = evento.target.value;
    atualizarPrevia();
  });
}

function renderizarEditorEncerramento(area, slide) {
  const formulario = document.createElement('div');
  formulario.innerHTML = `
    <div class="campo">
      <label for="editar-encerramento-texto">Mensagem Final</label>
      <input type="text" id="editar-encerramento-texto" value="${escaparHTML(slide.textoAgradecimento)}">
    </div>
    <div class="campo">
      <label for="editar-encerramento-subtitulo">Subtítulo</label>
      <input type="text" id="editar-encerramento-subtitulo" value="${escaparHTML(slide.subtitulo)}">
    </div>
  `;

  area.appendChild(formulario);

  document.getElementById('editar-encerramento-texto').addEventListener('input', (evento) => {
    slide.textoAgradecimento = evento.target.value;
    atualizarPrevia();
  });

  document.getElementById('editar-encerramento-subtitulo').addEventListener('input', (evento) => {
    slide.subtitulo = evento.target.value;
    atualizarPrevia();
  });
}

function mostrarEditor() {
  const area = document.getElementById('area-campos-editor');
  if (!area) return;

  area.innerHTML = '';

  if (estado.slides.length === 0) {
    area.innerHTML = '<div class="mensagem-vazia-painel">Nenhum slide disponível para edição.</div>';
    return;
  }

  const slide = estado.slides[estado.indiceSlideAtual];
  if (!slide) return;

  switch (slide.tipo) {
    case 'capa':
      renderizarEditorCapa(area);
      break;
    case 'totalizador':
      renderizarEditorTotalizador(area, slide);
      break;
    case 'mensal':
      renderizarEditorMensal(area, slide);
      break;
    case 'slide4':
      renderizarEditorSlide4(area, slide);
      break;
    case 'slide5':
      renderizarEditorSlide5(area, slide);
      break;
    case 'slide6':
      renderizarEditorSlide6(area, slide);
      break;
    case 'slide7':
      renderizarEditorSlide7(area, slide);
      break;
    case 'slide8':
      renderizarEditorSlide8(area, slide);
      break;
    case 'encerramento':
      renderizarEditorEncerramento(area, slide);
      break;
  }
}
