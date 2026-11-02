// Inicialização do sistema, eventos dos botões e atualização da tela

function atualizarCabecalhoSlide() {
  const totalSlides = estado.slides.length;

  if (estado.indiceSlideAtual < 0) {
    estado.indiceSlideAtual = 0;
  }
  if (estado.indiceSlideAtual >= totalSlides && totalSlides > 0) {
    estado.indiceSlideAtual = totalSlides - 1;
  }

  const slideAtual = estado.slides[estado.indiceSlideAtual];

  document.getElementById('contador-slide-atual').innerText =
    totalSlides > 0 ? `${estado.indiceSlideAtual + 1} / ${totalSlides}` : '0 / 0';

  document.getElementById('nome-slide-atual').innerText =
    slideAtual ? pegarNomeSlide(slideAtual) : 'Nenhum slide';

  const botaoAnterior = document.getElementById('btn-slide-anterior');
  const botaoProximo = document.getElementById('btn-proximo-slide');

  if (botaoAnterior) {
    botaoAnterior.disabled = totalSlides === 0 || estado.indiceSlideAtual <= 0;
  }
  if (botaoProximo) {
    botaoProximo.disabled = totalSlides === 0 || estado.indiceSlideAtual >= totalSlides - 1;
  }
}

// Atualização completa da interface (usada ao trocar, criar, remover ou reordenar slides)
function atualizarTela() {
  atualizarCabecalhoSlide();
  mostrarPreviaSlide();
  mostrarMiniaturas();
  mostrarEditor();
  mostrarListaEstrutura();
  salvarLocal();
}

// Atualização rápida apenas da prévia (usada durante digitação nos campos do formulário)
function atualizarPrevia() {
  atualizarCabecalhoSlide();
  mostrarPreviaSlide();
  salvarLocal();
}

// Atualiza a prévia e sincroniza os títulos nas miniaturas e na lista de estrutura
function atualizarPreviaENomes() {
  atualizarPrevia();
  mostrarMiniaturas();
  mostrarListaEstrutura();
}

function inicializarEventos() {
  document.getElementById('btn-slide-anterior').addEventListener('click', () => {
    if (estado.slides.length > 0 && estado.indiceSlideAtual > 0) {
      estado.indiceSlideAtual--;
      atualizarTela();
    }
  });

  document.getElementById('btn-proximo-slide').addEventListener('click', () => {
    if (estado.slides.length > 0 && estado.indiceSlideAtual < estado.slides.length - 1) {
      estado.indiceSlideAtual++;
      atualizarTela();
    }
  });

  // Alternância entre as abas do painel lateral
  const botoesAbas = document.querySelectorAll('.btn-aba');
  botoesAbas.forEach((botaoAba) => {
    botaoAba.addEventListener('click', (evento) => {
      botoesAbas.forEach((aba) => aba.classList.remove('ativo'));
      document.querySelectorAll('.aba-painel').forEach((painel) => painel.classList.remove('ativo'));

      evento.currentTarget.classList.add('ativo');
      const idPainel = evento.currentTarget.getAttribute('data-aba');
      const painelAlvo = document.getElementById(idPainel);
      if (painelAlvo) {
        painelAlvo.classList.add('ativo');
      }
    });
  });

  document.getElementById('btn-adicionar-slide').addEventListener('click', adicionarSlide);
  document.getElementById('btn-exportar-pptx').addEventListener('click', exportarApresentacao);
  document.getElementById('btn-salvar-projeto').addEventListener('click', salvarProjeto);

  const botaoNovoProjeto = document.getElementById('btn-novo-projeto');
  if (botaoNovoProjeto) {
    botaoNovoProjeto.addEventListener('click', () => {
      if (confirm('Quer começar um novo projeto do zero? O que não foi salvo em arquivo (.json) será perdido.')) {
        reiniciarProjeto();
        atualizarCoresGlobais();
        mostrarPaleta();
        atualizarTela();
      }
    });
  }

  const entradaArquivo = document.getElementById('entrada-arquivo-projeto');
  document.getElementById('btn-abrir-projeto').addEventListener('click', () => entradaArquivo.click());

  entradaArquivo.addEventListener('change', () => {
    const arquivoSelecionado = entradaArquivo.files[0];
    if (!arquivoSelecionado) return;

    importarProjeto(arquivoSelecionado, (sucesso) => {
      if (sucesso) {
        atualizarCoresGlobais();
        mostrarPaleta();
        atualizarTela();
      } else {
        alert('Não deu para abrir esse arquivo. Confira se é um projeto .json válido.');
      }
      entradaArquivo.value = '';
    });
  });

  // Navegação rápida pelos slides com as setas do teclado fora de campos de digitação
  document.addEventListener('keydown', (evento) => {
    if (evento.ctrlKey || evento.altKey || evento.metaKey) return;

    const elementoFocado = evento.target;
    if (elementoFocado) {
      const nomeTag = elementoFocado.tagName;
      if (nomeTag === 'INPUT' || nomeTag === 'TEXTAREA' || nomeTag === 'SELECT' || elementoFocado.isContentEditable) {
        return;
      }
    }

    if (evento.key === 'ArrowLeft' && estado.slides.length > 0 && estado.indiceSlideAtual > 0) {
      evento.preventDefault();
      estado.indiceSlideAtual--;
      atualizarTela();
    } else if (evento.key === 'ArrowRight' && estado.slides.length > 0 && estado.indiceSlideAtual < estado.slides.length - 1) {
      evento.preventDefault();
      estado.indiceSlideAtual++;
      atualizarTela();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  carregarLocal();
  inicializarEventos();
  atualizarCoresGlobais();
  mostrarPaleta();
  atualizarTela();
});
