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
// Helper para escapar HTML
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper para calcular diff de palavras e retornar HTML
function computeWordDiffHtml(text1, text2) {
  const diff = Diff.diffWords(text1, text2);
  let leftHtml = "";
  let rightHtml = "";

  diff.forEach((part) => {
    const escapedValue = escapeHtml(part.value);
    if (part.removed) {
      leftHtml += `<span class="diff-word-remove">${escapedValue}</span>`;
    } else if (part.added) {
      rightHtml += `<span class="diff-word-add">${escapedValue}</span>`;
    } else {
      leftHtml += escapedValue;
      rightHtml += escapedValue;
    }
  });

  return { leftHtml, rightHtml };
}

function renderMergeView(text1, text2) {
  const container = document.getElementById("merge-rows-container");
  container.innerHTML = "";
  mergeRows = [];

  const diffs = Diff.diffLines(text1, text2);
  let rowIdCounter = 0;
  let i = 0;
  
  let lLine = 1; 
  let rLine = 1; 
  let cLine = 1; 

  while (i < diffs.length) {
    const part = diffs[i];
    const rowId = rowIdCounter++;

    // 1. Comum (Sem alterações)
    if (!part.added && !part.removed) {
      const linesCount = countLines(part.value);
      const safeHtml = escapeHtml(part.value);
      
      createRow(container, rowId, "common", 
        { html: safeHtml, raw: part.value, startLine: lLine },
        { html: safeHtml, raw: part.value, startLine: cLine },
        { html: safeHtml, raw: part.value, startLine: rLine }
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

      // Calcula o HTML com destaque de palavras se houver conteúdo em ambos os lados
      let leftHtml = escapeHtml(leftContent);
      let rightHtml = escapeHtml(rightContent);

      if (leftContent && rightContent) {
          const wordDiff = computeWordDiffHtml(leftContent, rightContent);
          leftHtml = wordDiff.leftHtml;
          rightHtml = wordDiff.rightHtml;
      }

      createRow(container, rowId, type, 
        { html: leftHtml, raw: leftContent, startLine: lLine },
        { html: "", raw: "", startLine: cLine }, // Center is empty
        { html: rightHtml, raw: rightContent, startLine: rLine }
      );

      lLine += lCount;
      rLine += rCount;
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

function createRow(container, id, type, leftData, centerData, rightData) {
  const row = document.createElement("div");
  row.className = `merge-row ${type}`; 
  row.dataset.id = id;

  const createCell = (className, data, isEditable = false, side = null) => {
      const cell = document.createElement("div");
      cell.className = `merge-cell ${className}`;
      if (className === 'center') cell.id = `center-cell-wrapper-${id}`;
      
      // Classes adicionais para coloração de fundo baseada no tipo
      if (type !== 'common') {
          if (side === 'left') cell.classList.add('diff-remove');
          else if (side === 'right') cell.classList.add('diff-add');
          
          if (className === 'center') cell.classList.add('conflict-center');
      }

      // Gutter
      const gutter = document.createElement("div");
      gutter.className = "cell-gutter";
      gutter.innerText = data.raw ? generateLineNumbers(data.startLine, data.raw) : "";
      cell.appendChild(gutter);

      // Content
      const contentDiv = document.createElement("div");
      contentDiv.className = "cell-text";
      if (!data.raw && !isEditable) contentDiv.classList.add("diff-empty");
      
      if (isEditable) {
           contentDiv.contentEditable = true;
           contentDiv.id = `center-cell-${id}`;
      }
      contentDiv.innerHTML = data.html || ""; 
      
      cell.appendChild(contentDiv);

      // Botão de ação
      if (side && type !== 'common' && data.raw) {
          const btn = document.createElement("button");
          btn.className = "action-arrow";
          btn.innerHTML = side === 'left' ? "&gt;" : "&lt;";
          btn.title = "Usar este bloco";
          btn.onclick = () => applyContentToCenter(id, data.raw);
          cell.appendChild(btn);
      }
      return cell;
  };

  row.appendChild(createCell('left', leftData, false, 'left'));
  row.appendChild(createCell('center', centerData, true));
  row.appendChild(createCell('right', rightData, false, 'right'));
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
