// Estado global
let mergeRows = []; // Armazena referências para facilitar a extração do resultado

// Funções de Navegação
function startMerge() {
  const text1 = document.getElementById("text1").value;
  const text2 = document.getElementById("text2").value;

  // Renderizar a UI de Merge
  renderMergeView(text1, text2);

  // Alternar Visibilidade
  document.getElementById("input-stage").style.display = "none";
  document.getElementById("merge-stage").style.display = "flex";
  
  document.getElementById("btn-compare").style.display = "none";
  toggleMergeButtons(true);
}

function showInputStage() {
  document.getElementById("input-stage").style.display = "flex";
  document.getElementById("merge-stage").style.display = "none";
  
  document.getElementById("btn-compare").style.display = "inline-block";
  toggleMergeButtons(false);
}

function toggleMergeButtons(show) {
    const display = show ? "inline-block" : "none";
    document.getElementById("btn-back").style.display = display;
    document.getElementById("btn-copy").style.display = display;
    document.getElementById("btn-accept-left").style.display = display;
    document.getElementById("btn-accept-right").style.display = display;
}

// Lógica Core de Diff e Renderização
function renderMergeView(text1, text2) {
  const container = document.getElementById("merge-rows-container");
  container.innerHTML = "";
  mergeRows = [];

  const diffs = Diff.diffLines(text1, text2);
  let rowIdCounter = 0;
  let i = 0;
  
  // Contadores de linha (1-based)
  let lLine = 1; // Left
  let rLine = 1; // Right
  let cLine = 1; // Center (Result) logic approximation

  while (i < diffs.length) {
    const part = diffs[i];
    const rowId = rowIdCounter++;

    // 1. Comum (Sem alterações)
    if (!part.added && !part.removed) {
      // Lines count
      const linesCount = countLines(part.value);
      
      createRow(container, rowId, "common", 
        part.value, lLine,
        part.value, cLine,
        part.value, rLine
      );
      
      lLine += linesCount;
      rLine += linesCount;
      cLine += linesCount;
      
      i++;
    } 
    // 2. Mudanças (Conflito, Adição ou Remoção)
    else {
      let leftContent = "";
      let rightContent = "";
      let centerContent = ""; 
      
      let type = "conflict"; 
      let lCount = 0;
      let rCount = 0;

      // Analisa par removido/adicionado
      if (part.removed) {
        leftContent = part.value;
        lCount = countLines(leftContent);
        
        i++;
        if (i < diffs.length && diffs[i].added) {
          rightContent = diffs[i].value;
          rCount = countLines(rightContent);
          i++; 
        } else {
            type = "left-only";
        }
      } else if (part.added) {
        rightContent = part.value;
        rCount = countLines(rightContent);
        type = "right-only";
        i++;
      }

      createRow(container, rowId, type, 
        leftContent, lLine,
        centerContent, cLine, // Center is empty -> doesn't consume lines yet
        rightContent, rLine
      );

      lLine += lCount;
      rLine += rCount;
      // cLine does not advance because center content is initially empty for conflicts
      // If we auto-select, we would advance cLine.
    }
  }
}

function countLines(text) {
    if (!text) return 0;
    const split = text.split('\n');
    if (split.length > 0 && split[split.length-1] === '') {
        return split.length - 1; 
    }
    return split.length;
}

function generateLineNumbers(startLine, text) {
    if (!text) return "";
    const count = countLines(text);
    let html = "";
    for (let j = 0; j < count; j++) {
        html += `${startLine + j}\n`;
    }
    return html;
}

function createRow(container, id, type, leftText, lLineStart, centerText, cLineStart, rightText, rLineStart) {
  const row = document.createElement("div");
  row.className = `merge-row ${type}`; // Add type class
  row.dataset.id = id;

  // ... (rest of createRow) ...
  // --- Left Cell ---
  const leftCell = document.createElement("div");
  leftCell.className = `merge-cell left ${type === 'common' ? '' : 'diff-remove'}`;
  
  // Gutter
  const leftGutter = document.createElement("div");
  leftGutter.className = "cell-gutter";
  leftGutter.innerText = generateLineNumbers(lLineStart, leftText);
  leftCell.appendChild(leftGutter);

  // Content
  const leftContentDiv = document.createElement("div");
  leftContentDiv.className = "cell-text";
  if (!leftText) leftContentDiv.classList.add("diff-empty");
  leftContentDiv.textContent = leftText || "";
  leftCell.appendChild(leftContentDiv);
  
  // Botão (Seta) na Esquerda -> Jogar para o Centro
  if (type !== "common" && leftText) {
    const btn = document.createElement("button");
    btn.className = "action-arrow";
    btn.innerHTML = "&gt;"; 
    btn.title = "Usar este bloco";
    btn.onclick = () => applyContentToCenter(id, leftText);
    leftCell.appendChild(btn);
  }

  // --- Center Cell ---
  const centerCell = document.createElement("div");
  centerCell.className = `merge-cell center ${type === 'common' ? '' : 'conflict-center'}`;
  centerCell.id = `center-cell-wrapper-${id}`;

  // Gutter Center
  const centerGutter = document.createElement("div");
  centerGutter.className = "cell-gutter";
  // For conflicts, initially empty, so no line numbers passed
  centerGutter.innerText = generateLineNumbers(cLineStart, centerText);
  centerCell.appendChild(centerGutter);

  // Content Center
  const centerContentDiv = document.createElement("div");
  centerContentDiv.className = "cell-text";
  centerContentDiv.contentEditable = true; // Editable PART
  centerContentDiv.textContent = centerText || ""; 
  centerContentDiv.id = `center-cell-${id}`;
  centerCell.appendChild(centerContentDiv);

  // --- Right Cell ---
  const rightCell = document.createElement("div");
  rightCell.className = `merge-cell right ${type === 'common' ? '' : 'diff-add'}`;

  // Gutter Right
  const rightGutter = document.createElement("div");
  rightGutter.className = "cell-gutter";
  rightGutter.innerText = generateLineNumbers(rLineStart, rightText);
  rightCell.appendChild(rightGutter);

  // Content Right
  const rightContentDiv = document.createElement("div");
  rightContentDiv.className = "cell-text";
  if (!rightText) rightContentDiv.classList.add("diff-empty");
  rightContentDiv.textContent = rightText || "";
  rightCell.appendChild(rightContentDiv);

  // Botão (Seta) na Direita -> Jogar para o Centro
  if (type !== "common" && rightText) {
    const btn = document.createElement("button");
    btn.className = "action-arrow";
    btn.innerHTML = "&lt;"; 
    btn.title = "Usar este bloco";
    btn.onclick = () => applyContentToCenter(id, rightText);
    rightCell.appendChild(btn);
  }

  row.appendChild(leftCell);
  row.appendChild(centerCell);
  row.appendChild(rightCell);
  container.appendChild(row);
}

function acceptAll(side) {
    const container = document.getElementById("merge-rows-container");
    const rows = container.getElementsByClassName("merge-row");
    
    // side: 'left' or 'right'
    for (let row of rows) {
        // Skip common rows
        if (row.classList.contains("common")) continue;
        
        const id = row.dataset.id;
        
        // Find content in the specified side cell
        // .merge-cell.left .cell-text OR .merge-cell.right .cell-text
        const sourceCell = row.querySelector(`.merge-cell.${side} .cell-text`);
        if (sourceCell) {
            const content = sourceCell.innerText; // innerText handles newlines well? Or textContent? 
            // In createRow we set textContent. In input it is pre-wrap.
            // Using textContent from source div is safest to get raw text.
            applyContentToCenter(id, sourceCell.textContent);
        }
    }
}

function applyContentToCenter(rowId, content) {
    const cell = document.getElementById(`center-cell-${rowId}`);
    if (cell) {
        // Opção: Substituir ou Anexar? 
        // Geralmente "Move" substitui o estado atual daquele bloco de conflito
        cell.textContent = content; // Usa textContent para preservar quebras de linha com white-space: pre-wrap
        
        // Update Gutter (Relative line numbers for conflict blocks)
        const gutter = cell.previousElementSibling;
        if (gutter && gutter.classList.contains('cell-gutter')) {
             gutter.innerText = generateLineNumbers(1, content);
        }
    }
}

function copyResult() {
  // Coletar texto de todas as células centrais
  const container = document.getElementById("merge-rows-container");
  let result = "";
  // Percorre as linhas na ordem
  const rows = container.getElementsByClassName("merge-row");
  for (let row of rows) {
    // Select the content div inside the center cell
    const centerCellText = row.querySelector(".merge-cell.center .cell-text");
    if (centerCellText) {
       result += centerCellText.innerText;
    }
  }

  navigator.clipboard.writeText(result).then(() => {
    alert("Resultado copiado para a área de transferência!");
  });
}

// Funções de Input (Mantidas para funcionamento da tela inicial)
function updateLineNumbers(textAreaId, gutterId) {
    const textarea = document.getElementById(textAreaId);
    const gutter = document.getElementById(gutterId);
    if (!textarea || !gutter) return;

    const lines = textarea.value.split('\n').length;
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

// Inicialização
window.onload = function() {
    updateLineNumbers('text1', 'gutter1');
    updateLineNumbers('text2', 'gutter2');
};
