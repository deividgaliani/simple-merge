# Ferramenta de Diff & Merge de Texto

Uma ferramenta web simples e eficiente para comparar e mesclar dois textos, rodando inteiramente no navegador.

🔗 **Acesse online:** [https://deividgaliani.github.io/simple-merge/](https://deividgaliani.github.io/simple-merge/)

## 🚀 Funcionalidades

*   **Comparação Linha a Linha:** Identifica adições, remoções e modificações entre dois blocos de texto.
*   **Merge Visual:** Interface intuitiva para resolver conflitos.
    *   Clique na esquerda para aceitar a versão original.
    *   Clique na direita para aceitar a versão modificada.
*   **Numeração de Linhas:** Visualização clara com números de linhas sincronizados.
*   **Exportação Rápida:** Botão para copiar o resultado final do merge para a área de transferência.
*   **Dark Mode:** Interface escura confortável para longas sessões de uso.
*   **Processamento Local:** Seus dados nunca saem do seu navegador. Tudo é processado localmente usando Javascript.

## 🛠️ Como Usar

1.  **Texto Original:** Cole o texto base no painel da esquerda.
2.  **Texto Modificado:** Cole o texto com as alterações no painel da direita.
3.  **Comparar:** Clique no botão **"Comparar & Gerar Merge"**.
4.  **Resolver Conflitos:**
    *   O painel central mostrará as diferenças.
    *   Trechos em **vermelho** e **verde** representam conflitos ou mudanças.
    *   Clique no lado que deseja manter. A seleção ficará destacada e o outro lado ficará translúcido/riscado.
5.  **Resultado:** O campo inferior mostrará o texto final mesclado automaticamente conforme suas escolhas.
6.  **Copiar:** Use o botão **"Copiar Resultado"** para levar o texto finalizado para onde precisar.

## 💻 Tecnologias Utilizadas

*   **HTML5 / CSS3** (Flexbox, Variáveis CSS)
*   **JavaScript (ES6+)**
*   **[jsdiff](https://github.com/kpdecker/jsdiff)**: Biblioteca robusta para cálculo de diferenças de texto.

## 📦 Executando Localmente

1.  Clone este repositório:
    ```bash
    git clone https://github.com/deividgaliani/simple-merge.git
    ```
2.  Abra o arquivo `index.html` em seu navegador favorito.

---

Feito com 💜 para facilitar merges manuais rápidos.
