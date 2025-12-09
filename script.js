// Estado global para armazenar as decisões de merge
// Array de objetos: { id: number, type: 'common'|'conflict', leftText: string, rightText: string, choice: 'left'|'right'|null }
let mergeState = [];

function compareTexts() {
  const text1 = document.getElementById("text1").value;
  const text2 = document.getElementById("text2").value;
  const mergeView = document.getElementById("merge-view");

  if (!mergeView) return; // Segurança caso o elemento não exista

  mergeView.innerHTML = "";
  mergeState = [];

  // Usa jsdiff para calcular diferenças linha a linha
  // Certifique-se de que a biblioteca jsdiff foi carregada antes
  const diffs = Diff.diffLines(text1, text2);

  let currentId = 0;
  let i = 0;

  while (i < diffs.length) {
    const part = diffs[i];

    // 1. Caso Texto Comum (Sem mudanças)
    if (!part.added && !part.removed) {
      renderCommonBlock(part.value);
      mergeState.push({
        id: currentId++,
        type: "common",
        text: part.value,
      });
      i++;
    }
    // 2. Caso Conflito (Remoção seguida de Adição = Modificação) ou (Apenas Remoção / Apenas Adição)
    else {
      let leftText = "";
      let rightText = "";
      let hasLeft = false;
      let hasRight = false;

      // Verifica se é uma remoção (está no texto 1)
      if (part.removed) {
        leftText = part.value;
        hasLeft = true;
        i++; // Avança
        // Verifica se o próximo é uma adição (está no texto 2) - substituindo o trecho anterior
        if (i < diffs.length && diffs[i].added) {
          rightText = diffs[i].value;
          hasRight = true;
          i++;
        }
      } else if (part.added) {
        rightText = part.value;
        hasRight = true;
        i++;
      }

      // Cria o bloco visual de conflito
      const blockId = currentId++;
      // Por padrão, se for só adição, seleciona direita. Se for só remoção, seleciona nenhum (ou esquerda vazio).
      // Para forçar o usuário a escolher, iniciamos como null, ou definimos uma regra padrão.
      // Regra padrão aqui: Prioriza o NOVO (Direita) se houver, senão considera como remoção.
      const defaultChoice = hasRight ? "right" : "left";

      mergeState.push({
        id: blockId,
        type: "conflict",
        leftText: leftText,
        rightText: rightText,
        choice: defaultChoice,
      });

      renderConflictBlock(blockId, leftText, rightText, defaultChoice);
    }
  }

  updateFinalOutput();
}

function renderCommonBlock(text) {
  const div = document.createElement("div");
  div.className = "line-block line-common";
  div.textContent = text;
  document.getElementById("merge-view").appendChild(div);
}

function renderConflictBlock(id, leftText, rightText, initialChoice) {
  const container = document.createElement("div");
  container.className = "conflict-container";
  container.id = `conflict-${id}`;

  // Determina classe inicial
  if (initialChoice === "left") container.classList.add("selected-left");
  if (initialChoice === "right")
    container.classList.add("selected-right");

  // Bloco da Esquerda
  const leftDiv = document.createElement("div");
  leftDiv.className = "conflict-part part-left";
  leftDiv.onclick = () => selectMergeOption(id, "left");
  leftDiv.innerHTML = `<span class="action-btn">Usar Este</span><div class="part-content">${
    escapeHtml(leftText) || "(Vazio)"
  }</div>`;

  // Bloco da Direita
  const rightDiv = document.createElement("div");
  rightDiv.className = "conflict-part part-right";
  rightDiv.onclick = () => selectMergeOption(id, "right");
  rightDiv.innerHTML = `<span class="action-btn">Usar Este</span><div class="part-content">${
    escapeHtml(rightText) || "(Vazio)"
  }</div>`;

  container.appendChild(leftDiv);
  container.appendChild(rightDiv);
  document.getElementById("merge-view").appendChild(container);
}

function selectMergeOption(id, side) {
  // Atualiza estado
  const stateIndex = mergeState.findIndex((x) => x.id === id);
  if (stateIndex === -1) return;

  mergeState[stateIndex].choice = side;

  // Atualiza UI
  const container = document.getElementById(`conflict-${id}`);
  container.classList.remove("selected-left", "selected-right");
  container.classList.add(
    side === "left" ? "selected-left" : "selected-right"
  );

  updateFinalOutput();
}

function updateFinalOutput() {
  let finalText = "";
  mergeState.forEach((block) => {
    if (block.type === "common") {
      finalText += block.text;
    } else {
      if (block.choice === "left") finalText += block.leftText;
      else if (block.choice === "right") finalText += block.rightText;
    }
  });
  const outputElement = document.getElementById("result-output");
  if(outputElement) {
     outputElement.value = finalText;
     // Update line numbers for result since it's updated programmatically
     updateLineNumbers('result-output', 'gutter-result');
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function copyResult() {
  const result = document.getElementById("result-output");
  if(result) {
    result.select();
    document.execCommand("copy");
    alert("Resultado copiado para a área de transferência!");
  }
}

// Inicializa comparação ao carregar
window.onload = function() {
    compareTexts();
    // Initial line numbers
    updateLineNumbers('text1', 'gutter1');
    updateLineNumbers('text2', 'gutter2');

    // Add event listeners for sync scroll
    // Using simple approach: onscroll on textarea updates gutter
    // The HTML elements will have oninput and onscroll attributes, but we can also bind here if needed.
    // For simplicity, we rely on the HTML attributes calling these functions globally.
};

function updateLineNumbers(textAreaId, gutterId) {
    const textarea = document.getElementById(textAreaId);
    const gutter = document.getElementById(gutterId);
    if (!textarea || !gutter) return;

    const lines = textarea.value.split('\n').length;
    // Generate numbers 1 to lines
    // Using Array.from is cleaner but loop is faster for huge files
    let html = '';
    for(let i=1; i<=lines; i++) {
        html += `<div>${i}</div>`;
    }
    gutter.innerHTML = html;
}

function syncScroll(textAreaId, gutterId) {
    const textarea = document.getElementById(textAreaId);
    const gutter = document.getElementById(gutterId);
    if (!textarea || !gutter) return;
    gutter.scrollTop = textarea.scrollTop;
}
