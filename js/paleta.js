// Controle da aba de cores da apresentação

function mostrarPaleta() {
  const area = document.getElementById('area-paleta');
  if (!area) return;

  const p = estado.paleta;

  area.innerHTML = `
    <div class="texto-ajuda">
      Escolha as cores da apresentação. A mudança aparece na hora nos slides e também no PowerPoint gerado.
    </div>

    <div class="titulo-secao" style="font-size: 11px; margin-bottom: 10px;">Cores Principais</div>
    <div class="grade-paleta">
      <div class="paleta-item">
        <input type="color" id="pal-titulo" value="#${p.corTitulo}">
        <label for="pal-titulo">Títulos</label>
      </div>
      <div class="paleta-item">
        <input type="color" id="pal-barra" value="#${p.corBarra}">
        <label for="pal-barra">Barras de KPI</label>
      </div>
      <div class="paleta-item">
        <input type="color" id="pal-grafico" value="#${p.corGrafico}">
        <label for="pal-grafico">Gráficos</label>
      </div>
    </div>

    <div class="titulo-secao" style="font-size: 11px; margin-top: 18px; margin-bottom: 8px;">Tons Gerados para os Gráficos</div>
    <div id="previa-variacoes" style="display: flex; gap: 4px;"></div>

    <button class="btn-secundario" id="btn-reiniciar-paleta" style="margin-top: 20px; border-color: var(--cor-perigo); color: var(--cor-perigo);">
      ↺ Voltar Cores Padrão
    </button>
  `;

  function removerCerquilhaHex(valorHex) {
    return String(valorHex || '').replace('#', '').toUpperCase();
  }

  function atualizarPreviaVariacoes() {
    const recipienteVariacoes = document.getElementById('previa-variacoes');
    if (!recipienteVariacoes) return;

    recipienteVariacoes.innerHTML = variacoesGrafico(6)
      .map((cor) => `<div style="flex: 1; height: 18px; border-radius: 3px; background: #${cor}; border: 1px solid rgba(0, 0, 0, 0.15);"></div>`)
      .join('');
  }

  function aplicarAlteracaoDeCor() {
    atualizarCoresGlobais();
    atualizarPreviaVariacoes();
    atualizarPrevia();
  }

  const seletoresDeCor = [
    { id: 'pal-titulo', propriedade: 'corTitulo' },
    { id: 'pal-barra', propriedade: 'corBarra' },
    { id: 'pal-grafico', propriedade: 'corGrafico' }
  ];

  seletoresDeCor.forEach(({ id, propriedade }) => {
    const seletor = document.getElementById(id);
    if (seletor) {
      seletor.addEventListener('input', (evento) => {
        estado.paleta[propriedade] = removerCerquilhaHex(evento.target.value);
        aplicarAlteracaoDeCor();
      });
    }
  });

  document.getElementById('btn-reiniciar-paleta').addEventListener('click', () => {
    estado.paleta = { ...PALETA_PADRAO };
    atualizarCoresGlobais();
    mostrarPaleta();
    atualizarPrevia();
  });

  atualizarPreviaVariacoes();
}
