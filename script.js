// Estado global
let mergeRows = []; // Armazena referências para facilitar a extração do resultado

// Funções de Navegação
function startMerge() {
  const text1 = document.getElementById("text1").value.replace(/\t/g, '    ');
  const text2 = document.getElementById("text2").value.replace(/\t/g, '    ');

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
    document.getElementById("btn-download").style.display = display;
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
  
  // Assegura numeração correta após renderização inicial
  recalcCenterLineNumbers();
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
      
      // Modificado: Aplica a classe de vazio no container (cell) e não no texto
      if (!data.raw && !isEditable) {
          cell.classList.add("diff-empty-container");
      }
      
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
        cell.textContent = content; // Usa textContent para segurança
        
        // Remove classe de conflito se resolvido
        const parentCell = cell.closest('.merge-cell');
        if (parentCell) {
            parentCell.classList.remove('conflict-center');
            parentCell.style.borderColor = '#333'; // Reseta borda
        }

        // Atualiza a numeração de TODAS as linhas centrais para manter consistência
        recalcCenterLineNumbers();
    }
}

function recalcCenterLineNumbers() {
    const container = document.getElementById("merge-rows-container");
    const rows = container.getElementsByClassName("merge-row");
    let currentLine = 1;

    for (let row of rows) {
        // Encontra a célula central
        const centerCell = row.querySelector(".merge-cell.center");
        if (!centerCell) continue;

        const contentDiv = centerCell.querySelector(".cell-text");
        const gutter = centerCell.querySelector(".cell-gutter");
        
        if (contentDiv && gutter) {
            const text = contentDiv.textContent;
            // Se tiver texto (mesmo que vazio, mas existindo como bloco lógico), conta linhas
            // Se estiver vazio (conflito não resolvido), assumimos 0 linhas visualmente?
            // Ou assumimos que o bloco existe mas vazio? 
            // O comportamento atual de 'conflict' é vazio.
            
            // Se for 'common', sempre tem texto.
            // Se for 'conflict', pode estar vazio (0 linhas no output) ou preenchido.
            
            // Mas cuidado: countLines("") retorna 0.
            const lines = countLines(text);
            
            if (lines > 0) {
                gutter.innerText = generateLineNumbers(currentLine, text);
                currentLine += lines;
            } else {
                gutter.innerText = "";
                // Não incrementa currentLine se não há texto no output, 
                // o que resolve o problema de "buracos" na numeração.
            }
        }
    }
}

function copyResult() {
    const container = document.getElementById("merge-rows-container");
    const rows = container.getElementsByClassName("merge-row");
    let result = [];

    for (let row of rows) {
        const centerCellText = row.querySelector(".merge-cell.center .cell-text");
        if (centerCellText) {
            // textContent é mais seguro que innerText para preservar raw code
            result.push(centerCellText.textContent);
        }
    }

    // Unir com base na lógica de blocos
    const finalString = result.join(""); 
    
    navigator.clipboard.writeText(finalString).then(() => {
        const btn = document.getElementById("btn-copy");
        const originalText = btn.innerText;
        btn.innerText = "Copiado!";
        setTimeout(() => btn.innerText = originalText, 2000);
    });
}

function downloadResult() {
    const container = document.getElementById("merge-rows-container");
    const rows = container.getElementsByClassName("merge-row");
    let content = "";
    
    for (let row of rows) {
        const cell = row.querySelector(".merge-cell.center .cell-text");
        if(cell) content += cell.textContent;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged_result.txt";
    a.click();
    URL.revokeObjectURL(url);
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
