<div align="center">

# 📊 ApVision

### Crie apresentações de indicadores no navegador e exporte direto para PowerPoint (`.pptx`)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![PowerPoint](https://img.shields.io/badge/Exporta_.PPTX-B7472A?style=for-the-badge&logo=microsoftpowerpoint&logoColor=white)

</div>

---

## 💡 Sobre o Projeto

Montar apresentações mensais de resultados no PowerPoint costuma dar trabalho: alinhar caixas de texto, refazer gráficos a cada mês, somar indicadores na mão e manter o padrão de cores em todos os slides.

O **ApVision** foi criado para resolver isso direto no navegador. Você escolhe os tipos de slide, preenche os números em formulários simples, acompanha o resultado ao vivo no palco 16:9 e, com um clique, baixa o arquivo **`.pptx` pronto e editável** para abrir no PowerPoint.

Tudo roda **100% no front-end (client-side)** com HTML, CSS e JavaScript puro, sem precisar instalar banco de dados ou servidor.

---

## ⚙️ O que dá para fazer no ApVision

- **Prévia ao vivo em 16:9**: cada letra digitada ou cor trocada atualiza o slide na hora.
- **Consolidação automática**: o slide **Totalizador Anual** soma sozinho os dados de todos os slides mensais criados, sem precisar calcular nada por fora.
- **9 modelos de slides**:
  1. **Capa Inicial** — título principal, período e destaque superior.
  2. **Totalizador Anual** — 4 cartões com a soma do ano + gráfico comparativo por mês + resumo.
  3. **Indicadores do Mês** — cartões de total processado, erros internos/externos, dias de atraso (com alerta visual automático) e observações.
  4. **Gráfico de Barras (Lateral)** — comparação horizontal entre categorias com opção de formatar valores em Real (`R$`).
  5. **Gráfico de Linhas (Realizado x Meta)** — comparação entre o que foi entregue (linha contínua) e a meta prevista (linha tracejada).
  6. **Gráfico de Pizza ou Rosca** — divisão por fatias com alternância entre Pizza e Rosca e ajuste automático de contraste nos números.
  7. **Evolução de Indicadores** — gráfico de linhas para acompanhar várias séries ao longo dos meses + cartões de soma e média.
  8. **Caixa de Texto Livre** — slide aberto com título, subtítulo opcional e texto para anotações ou pautas.
  9. **Capa Final** — slide de encerramento sincronizado com as cores e o título da apresentação.
- **Paleta de cores inteligente**: basta escolher 3 cores principais (Títulos, Barras e Gráficos) e o sistema calcula automaticamente os tons derivados em `HSL` para colorir as séries dos gráficos.
- **Controle completo dos slides**: adicione novos slides, duplique um slide existente (`⧉`), mude a ordem (`▲` / `▼`), navegue pelas setas do teclado (`←` / `→`) ou apague o que não precisar.
- **Não perde o que você fez**:
  - Salva o rascunho automaticamente no navegador (`localStorage`).
  - Permite baixar o projeto em **`.json`** para continuar editando depois ou em outro computador.

---

## 🗂️ Organização do Código

O projeto foi dividido em módulos pequenos para facilitar a leitura e a manutenção:

```text
ApVision/
├── index.html                 # Estrutura principal da tela (topo, painel lateral e palco 16:9)
├── ApVisionImage.png          # Logo do projeto
├── estaticos/
│   ├── estilo.css             # Visual escuro da ferramenta, botões, abas e listas
│   ├── slides.css             # Visual interno dos slides na pré-visualização
│   ├── chart.js               # Biblioteca Chart.js para os gráficos da prévia
│   └── pptxgen.bundle.js      # Biblioteca PptxGenJS para gerar o arquivo .pptx
└── js/
    ├── dados.js               # Estado central, modelos padrão, cálculos e salvamento (localStorage / JSON)
    ├── principal.js           # Inicialização, eventos dos botões e navegação por teclado
    ├── previa.js              # Desenho dos slides e gráficos no palco central
    ├── editor.js              # Criação dos campos de formulário conforme o slide selecionado
    ├── miniaturas.js          # Barra inferior de miniaturas, criação, duplicação e ordem dos slides
    ├── paleta.js              # Seletor de cores e barra de tons gerados
    └── exportar.js            # Tradução do layout da tela para elementos nativos do PowerPoint (.pptx)
```

---

## 🚀 Como Usar

Não precisa instalar nada (nem Node.js, nem pacotes externos):

1. Baixe ou clone o repositório:
   ```bash
   git clone https://github.com/giovanialmeid/ApVision.git
   ```
2. Abra o arquivo **`index.html`** direto no navegador (Chrome, Edge, Firefox, Brave).
3. Edite os slides pela barra lateral e clique em **Gerar PowerPoint (.pptx)** no canto superior direito.

---

## 👨‍💻 Autor

Feito por **Giovani Almeida Oliveira**  
Estudante de Sistemas de Informação.
