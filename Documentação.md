# ApVision — (documentação do projeto)

Giovani Almeida Oliveira 

Esse documento explica como o ApVision funciona por dentro. Escrevi pra qualquer pessoa que precise dar manutenção.

---

## 1. O que é e por que existe

Na empresa, o relatório mensal de KPIs era montado na mão no PowerPoint: copiar slide do mês passado, trocar número por número, ajustar gráfico, torcer pra não esquecer nada. O ApVision automatiza isso: a pessoa preenche os dados num formulário, vê o slide pronto na tela em tempo real, e clica num botão pra baixar o `.pptx` final.

Escolhi fazer tudo em **JavaScript puro, sem framework e sem backend**. Roda em qualquer máquina da empresa só abrindo o `index.html`, sem instalar nada e sem depender de servidor/TI.
As duas únicas bibliotecas são o **Chart.js** (desenha os gráficos da prévia) e o **PptxGenJS** (gera o arquivo PowerPoint).

## 2. A ideia central: um estado só

A regra número 1 do projeto, que eu sigo em todo módulo: **existe um único objeto com todos os dados, e todo o resto só lê ele e desenha**. Nenhuma tela guarda dado próprio.

```js
const estado = {
  cliente: "Nome do Cliente",
  periodo: "Janeiro a Março 2026",
  slides: [ /* array com os slides, na ordem da apresentação */ ],
  indiceSlideAtual: 0,
  paleta: { corTitulo: '2B579A', corBarra: '4472C4', corGrafico: '2B579A', /* ... */ }
};
```

Quando o usuário digita algo, o listener escreve no `estado` e chama uma função de atualização, que redesenha a tela lendo o `estado` de novo. Fluxo sempre no mesmo sentido:

```
usuário digita → listener escreve no estado → função de atualização → tela redesenhada
```

## 3. Os arquivos

```
ApVision/
├── index.html          → a página (única)
├── estaticos/          → CSS + bibliotecas de terceiros
│   ├── estilo.css      → visual da interface (painel, abas, botões)
│   └── slides.css      → visual da PRÉVIA dos slides (16:9)
└── js/
    ├── dados.js        → o estado, a paleta, persistência e funções utilitárias
    ├── previa.js       → desenha o slide atual na tela
    ├── editor.js       → os formulários de edição de cada tipo de slide
    ├── miniaturas.js   → a barra de miniaturas embaixo + aba Estrutura
    ├── exportar.js     → gera o PowerPoint
    ├── paleta.js       → o editor de cores
    └── principal.js    → inicialização, navegação e o "coração" da atualização
```

No começo era um `.js` gigante só. Quebrar em módulos foi das melhores decisões que tomei: achar as coisas ficou muito mais rápido. Os arquivos carregam com `defer` na ordem do `index.html` (o `dados.js` primeiro porque todo mundo depende dele).

## 4. Os tipos de slide

Cada slide é um objeto com um campo `tipo`, e tanto a prévia quanto o editor quanto o export fazem um `switch (slide.tipo)` pra saber o que desenhar:

| tipo | o que é | campos principais |
|---|---|---|
| `capa` | capa inicial | `titulo` |
| `totalizador` | consolidado do ano (soma todos os meses sozinho) | `tituloObs`, `textoObs`, `mesesManuais[]` |
| `mensal` | fechamento de um mês | `nome`, `quantidade`, `desviosApdata`, `desviosCliente`, `diasAtraso`, `obs` |
| `slide4` | barras horizontais (uso pra Horas Extras) | `itens[]`, `formatoMoeda` |
| `slide5` | linhas (realizado × projeção) | `pontosDados[]` |
| `slide6` | pizza (uso pra rescisões) | `itens[]` |
| `slide7` | projeção de demanda por ID | `registros[]` |
| `slide8` | texto livre | `texto` |
| `encerramento` | capa final | `textoAgradecimento`, `subtitulo` |

Exemplo de um slide mensal de verdade:

```js
{
  id: "s_m1",
  tipo: "mensal",
  nome: "Janeiro",
  quantidade: 345,
  desviosApdata: 8,
  desviosCliente: 3,
  diasAtraso: 0,
  obs: "Fechamento concluído 2 dias antes do prazo regulamentar."
}
```

O totalizador é o slide mais legal do modelo: **ninguém digita os totais**. Ele soma sozinho todos os slides mensais (mais uns "meses manuais" que dá pra cadastrar dentro dele, pra mês que não ganhou slide próprio):

```js
function pegarMetricasConsolidadas() {
  const todos = pegarTodosMesesParaGrafico(); // mensais + manuais, ordenados por mês
  let totalQtd = 0, totalApdata = 0, totalCliente = 0, totalAtraso = 0;
  todos.forEach(m => {
    totalQtd     += Number(m.quantidade) || 0;
    totalApdata  += Number(m.desviosApdata) || 0;
    totalCliente += Number(m.desviosCliente) || 0;
    totalAtraso  += Number(m.diasAtraso) || 0;
  });
  return { totalQtd, totalApdata, totalCliente, totalAtraso };
}
```

O `|| 0` ali é de propósito: se alguém apagar o campo e ficar vazio, `Number("")` vira 0 e a soma não vira `NaN`.

Também existe uma lista de slides que não podem ser excluídos, pro relatório nunca ficar sem o esqueleto mínimo:

```js
const SLIDES_TRAVADOS = new Set(['s_capa', 's_totalizador', 's_m1', 's_encerramento']);
```

## 5. O ciclo de atualização

Minha primeira versão tinha uma função só que redesenhava TUDO a cada tecla digitada. Funcionava, mas reconstruir o formulário enquanto você digita nele faz o campo perder o foco — impossível de usar. A solução foi separar em três níveis de atualização, do mais barato pro mais caro:

```js
// só a prévia — usado a cada tecla digitada
function atualizarPrevia() {
  atualizarCabecalhoSlide();
  mostrarPreviaSlide();
  salvarLocal();
}

// prévia + nomes nas miniaturas — usado quando edita um TÍTULO
function atualizarPreviaENomes() {
  atualizarPrevia();
  mostrarMiniaturas();
  mostrarListaEstrutura();
}

// tudo — usado quando muda a ESTRUTURA (adicionar/excluir/mover slide)
function atualizarTela() {
  atualizarCabecalhoSlide();
  mostrarPreviaSlide();
  mostrarMiniaturas();
  mostrarEditor();
  mostrarListaEstrutura();
  salvarLocal();
}
```

A regra pra escolher qual chamar no listener: mudou um dado? `atualizarPrevia()`. Mudou um título (que aparece na miniatura)? `atualizarPreviaENomes()`. Mudou a estrutura do deck? `atualizarTela()`. Depois descobri que é basicamente isso que frameworks tipo React fazem automaticamente — decidir o mínimo que precisa re-renderizar.

## 6. A prévia e os gráficos

O `previa.js` monta o HTML do slide com template string e injeta no palco. Quando o slide tem gráfico, crio o Chart.js logo em seguida — depois de `innerHTML` o elemento `<canvas>` já existe, então não precisa esperar nada:

```js
(() => {
  const contexto = document.getElementById('tela-grafico-slide4').getContext('2d');
  graficoAtivo = new Chart(contexto, { /* config */ });
})();
```

Antes de desenhar um slide novo, o gráfico anterior precisa ser destruído, senão o Chart.js vaza memória:

```js
if (graficoAtivo) {
  graficoAtivo.destroy();
  graficoAtivo = null;
}
```

Os numerozinhos escritos em cima das barras/pontos/fatias não são nativos — são **plugins customizados** do Chart.js que desenham direto no canvas. Exemplo do slide de barras (já com o modo R$ que explico na seção 9):

```js
const formatarValor = (v) => slide.formatoMoeda
  ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : Number(v).toLocaleString('pt-BR');

const pluginRotulosBarras = {
  id: 'rotulosDadosBarras',
  afterDatasetsDraw(chart) {
    const { ctx: c, data } = chart; // ctx é o nome da API, não dá pra traduzir
    chart.getDatasetMeta(0).data.forEach((barra, i) => {
      const valor = data.datasets[0].data[i];
      c.save();
      c.fillStyle = Math.abs(barra.x - barra.base) > 30 ? '#FFFFFF' : '#262626';
      c.font = 'bold 9px Inter, sans-serif';
      c.textAlign = 'center';
      c.fillText(formatarValor(valor), (barra.base + barra.x) / 2, barra.y);
      c.restore();
    });
  }
};
```

## 7. Segurança: escapar o texto do usuário

Se você injeta texto do usuário em `innerHTML` sem tratar, um cliente chamado `Empresa "X"` quebra o formulário (a aspa fecha o `value="..."` antes da hora), e um `<script>` no meio do texto vira injeção de código de verdade (XSS). A solução é uma função que troca os caracteres perigosos pelas entidades HTML, usada em **todo** ponto onde texto do usuário entra num template:

```js
function escaparHTML(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// uso:
`<div class="topo-titulo">${escaparHTML(slide.titulo)}</div>`
```

## 8. O sistema de cores

O usuário só escolhe **3 cores** (achei que dar 10 seletores ia mais atrapalhar do que ajudar): cor dos títulos, cor das barrinhas dos cartões e cor base dos gráficos. A parte que eu mais gostei de fazer: da cor dos gráficos, o sistema **gera variações de tom automaticamente** — escolheu verde, o gráfico inteiro sai em tons de verde combinando entre si.

O truque é converter o hex pra HSL (matiz, saturação, luminosidade), manter a matiz e variar só a luminosidade:

```js
function variacoesGrafico(n) {
  const base = estado.paleta.corGrafico;
  const { h, s, l } = hexParaHsl(base);
  const deslocamentos = [0, 18, -14, 32, -24, 44, -32, 54]; // base, +claro, +escuro, +claro...
  const saida = [];
  for (let i = 0; i < n; i++) {
    const desloc = deslocamentos[i % deslocamentos.length] + Math.floor(i / deslocamentos.length) * 6;
    saida.push(hslParaHex(h, s, Math.min(86, Math.max(16, l + desloc))));
  }
  return saida;
}
// verde 2E7D32 → 2E7D32, 4ABD50, 1B491D, 7ED083, 163C18, ABE0AE
```

O `Math.min(86, Math.max(16, ...))` impede tom branco demais ou preto demais.

A cor escolhida precisa chegar em dois mundos diferentes, então a `atualizarCoresGlobais()` propaga pelos dois canais ao mesmo tempo:

```js
function atualizarCoresGlobais() {
  const p = estado.paleta;
  COR_TITULO = p.corTitulo;   // canal 1: variáveis JS que o exportar.js lê
  COR_BARRA = p.corBarra;
  // canal 2: variáveis CSS que o slides.css lê
  document.documentElement.style.setProperty('--slide-titulo', '#' + p.corTitulo);
  document.documentElement.style.setProperty('--slide-barra', '#' + p.corBarra);
}
```

```css
/* no slides.css */
.topo-titulo  { color: var(--slide-titulo, #2B579A); }
.barra-status { background: var(--slide-barra, #4472C4); }
```

Uma exceção de propósito: o indicador "Dias Fora do Prazo" fica **vermelho sempre**, mesmo com paleta verde. Vermelho ali é significado (alerta), não decoração.

## 9. O modo moeda (R$)

Eu uso o slide de barras pra valores de Horas Extras, e queria mostrar R$. A primeira ideia seria deixar digitar "R$ 380" no campo — mas aí o valor vira texto, o gráfico recebe `NaN` e a barra some. Então a solução foi separar **dado** de **formatação**: o campo continua número (com `step="any"` pra aceitar centavos), e um checkbox no editor liga a exibição em moeda:

```js
document.getElementById('editar-s4-moeda').addEventListener('change', (e) => {
  slide.formatoMoeda = e.target.checked;
  atualizarPrevia();
});
```

Na prévia, o `formatarValor` da seção 6 usa `toLocaleString('pt-BR', { style: 'currency' })`. No PowerPoint, uso o código de formato do Excel — o Office formata sozinho e o gráfico continua editável com números de verdade:

```js
dataLabelFormatCode: slide.formatoMoeda ? '"R$" #,##0.00' : '#,##0',
valAxisLabelFormatCode: slide.formatoMoeda ? '"R$" #,##0' : '#,##0'
```

## 10. Persistência (não perder trabalho)

Dois mecanismos:

**Auto-save no navegador.** Toda função de atualização termina chamando `salvarLocal()`, que grava o `estado` inteiro no `localStorage`. Deu F5, fechou a aba, caiu a luz — abre de volta onde parou. O `try/catch` é porque em aba anônima o localStorage pode não existir:

```js
function salvarLocal() {
  try { localStorage.setItem('apvision_projeto', JSON.stringify(estado)); }
  catch (erro) { /* sem armazenamento disponível — segue sem auto-save */ }
}
```

**Salvar/Abrir Projeto (.json).** O auto-save só guarda UM projeto — se eu começar o relatório do Cliente B, ele sobrescreve o do A. Pra ter vários clientes, backup e passar o projeto pra outra máquina, o botão "Salvar Projeto" baixa o estado como `.json` (navegador não pode sobrescrever arquivo do disco, então cada clique gera um download novo), e o "Abrir Projeto" lê o arquivo de volta com `FileReader`:

```js
function baixarProjeto() {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
  const atalho = document.createElement('a');
  atalho.href = URL.createObjectURL(blob);
  atalho.download = `ApVision_${estado.cliente.replace(/[^a-z0-9]/gi, '_')}.json`;
  atalho.click();
}
```

Na hora de abrir, o `aplicarProjeto()` valida o básico antes de aceitar (tem `slides`? é array? não está vazio?) e completa a paleta com o padrão, pra `.json` de versão antiga não deixar o app sem cor.

Importante entender: **o `.pptx` é mão única**. Ele é o produto final — os dados viram desenho e não voltam. O formato que reabre no ApVision é o `.json`. (Analogia que uso: o json é a receita, o pptx é o bolo pronto.)

## 11. O export pro PowerPoint

O PptxGenJS trabalha em **polegadas** (padrão do PowerPoint). Defini as medidas do slide 16:9 num objeto só:

```js
const MEDIDAS_PPT = {
  width: 13.333,
  height: 7.5,
  espacoX: 0.8,    // margem lateral
  espacoY: 0.375   // margem vertical
};
```

Cada tipo de slide tem seu bloco de montagem, mas as partes repetidas viraram funções: `montarMolduraPadrao()` (fundo + cabeçalho), `desenharCartaoKpi()`, `desenharPainelObs()`. E o maior corte de repetição foi nos gráficos: as ~18 opções de fonte/eixo/legenda apareciam quase iguais em 5 gráficos diferentes. Extraí pra uma função que devolve o padrão e aceita sobrescrever o que muda:

```js
function opcoesGraficoPadrao(sobrescrever = {}) {
  return {
    showValue: true,
    dataLabelFontFace: FONTE_CORPO, dataLabelFontSize: 9, dataLabelFontBold: true,
    showLegend: true, legendPos: 'b', legendFontFace: FONTE_CORPO, legendFontSize: 8,
    catAxisLabelFontFace: FONTE_CORPO, catAxisLabelFontSize: 9,
    valGridLine: { color: COR_CINZA_MEDIO, style: 'solid', size: 1 },
    // ...
    ...sobrescrever   // o que vier aqui ganha do padrão
  };
}

// uso no gráfico de pizza, por exemplo:
...opcoesGraficoPadrao({ dataLabelColor: COR_BRANCO, dataLabelFontSize: 10, dataLabelPosition: 'ctr' })
```

Foram ~200 linhas a menos, e mudar a fonte dos gráficos agora é mexer num lugar só.

O export em si é assíncrono, com o botão travado durante a geração (aprendi que sem isso, duplo clique gera dois arquivos) e erro tratado:

```js
async function exportarPowerPoint() {
  const botaoExportar = document.getElementById('btn-exportar-pptx');
  const rotuloOriginal = botaoExportar.innerHTML;
  botaoExportar.disabled = true;
  botaoExportar.innerHTML = 'Gerando...';
  try {
    const apresentacao = new PptxGenJS();
    // ...um bloco por slide...
    await apresentacao.writeFile({ fileName: nomeArquivo });
  } catch (erro) {
    console.error('Falha ao gerar o PPTX:', erro);
    alert('Não foi possível gerar o arquivo PowerPoint. Tente novamente.');
  } finally {
    botaoExportar.disabled = false;
    botaoExportar.innerHTML = rotuloOriginal;
  }
}
```

O `finally` garante que o botão volta ao normal mesmo se der erro no meio.

## 12. Testes (e um bug que me ensinou uma lição)

Fiz um teste de fumaça que roda com Node + jsdom: ele monta o app inteiro num navegador simulado, com versões falsas (stubs) do Chart.js e do PptxGenJS, e verifica 23 coisas — navegação por todos os slides, escapes de HTML (tento injetar `<script>` e confiro que não entra), auto-save, abrir projeto, o modo R$, o export.

A lição: no meio de um refactor grande, uma renomeação automática transformou `chart.ctx` (nome da API do Chart.js) em `chart.contexto` dentro dos plugins de rótulo. **Meus testes passaram mesmo assim** — porque o stub do Chart não executava os plugins. No navegador real, os rótulos dos gráficos teriam quebrado. Descobri por acaso, mexendo no código depois. A correção foi dupla: consertar os 4 pontos E ensinar o stub a executar os plugins, pra esse tipo de erro nunca mais passar:

```js
window.Chart = class {
  constructor(contexto, config) {
    this.ctx = contexto2d;  // canvas falso que registra cada fillText
    this.data = config.data;
    this.getDatasetMeta = () => ({ data: config.data.datasets[0].data.map(criarElem) });
    // executa os plugins como o Chart.js real faria:
    (config.plugins || []).forEach(p => p.afterDatasetsDraw && p.afterDatasetsDraw(this));
  }
  destroy() {}
};
```

Moral: teste que não exercita o caminho de verdade dá falsa segurança.

## 13. O que vem depois (integração com a base de dados)

O plano da empresa é alimentar os KPIs automaticamente: queries extraem as variáveis da base num arquivo TXT (`NOME_VARIAVEL;valor;AAAA-MM`) e o ApVision importa. O código atual já deixa isso encaminhado:

- a leitura de arquivo já existe no `lerProjeto()` — o futuro `importar.js` copia o padrão (input file + FileReader);
- o posicionamento por mês já existe no `pegarTodosMesesParaGrafico()` — o import só mapeia `2026-01 → Janeiro` e cria o slide se não existir;
- depois de escrever no `estado`, um `atualizarTela()` faz o resto sozinho: totalizador recalcula, gráficos redesenham, auto-save grava.

O de-para entre variável da base e campo do slide (`QTD_PROC → mensal.quantidade`) vai morar num arquivo de configuração JSON, não no código — assim adicionar variável nova não exige mexer no parser.
