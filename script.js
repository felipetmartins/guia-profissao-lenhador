// script.js - versão atualizada para o index.html com SVGs e classes .positive/.negative
document.addEventListener('DOMContentLoaded', () => {
  const filtro = document.getElementById('filtroPlantavel');
  const tbody = document.getElementById('tabelaMadeiras');

  // Carrega preferência salva (se existir)
  const saved = localStorage.getItem('guia_lenhador_filtro_plantavel');
  if (saved && filtro) {
    filtro.value = saved;
  }

  // Aplica o filtro inicial
  applyFilter();

  // Evento: quando usuário muda o filtro
  if (filtro) {
    filtro.addEventListener('change', () => {
      applyFilter();
      localStorage.setItem('guia_lenhador_filtro_plantavel', filtro.value);
    });
  }

  // Função principal que aplica o filtro
  function applyFilter() {
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let visibleCount = 0;

    rows.forEach(row => {
      // A coluna "Plantável?" foi posicionada como segunda coluna (index 1)
      // Guardamos a implementação de forma resiliente: procuramos uma célula que tenha .positive/.negative
      const plantavelCell = row.cells[1] || row.querySelector('td:nth-child(2)');
      let isPositive = false;
      let isNegative = false;

      if (plantavelCell) {
        if (plantavelCell.querySelector('.positive')) isPositive = true;
        if (plantavelCell.querySelector('.negative')) isNegative = true;

        // Fallback: checar texto (caso haja conteúdo textual)
        const txt = plantavelCell.textContent.trim();
        if (!isPositive && !isNegative) {
          if (/✓|✅|sim|Sim/i.test(txt)) isPositive = true;
          if (/✕|❌|não|nao|Não/i.test(txt)) isNegative = true;
        }
      }

      let show = true;
      const filterVal = filtro ? filtro.value : 'todos';

      if (filterVal === 'sim') {
        show = isPositive;
      } else if (filterVal === 'nao') {
        show = isNegative;
      } else {
        show = true; // 'todos'
      }

      row.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // Atualiza atributo no <table> para permitir estilos / auxílios de acessibilidade
    const table = tbody.closest('table');
    if (table) {
      table.setAttribute('data-visible-rows', String(visibleCount));
    }

    // Log útil para debugging rápido
    // (remova em produção se preferir)
    console.log(`[Guia do Lenhador] linhas visíveis: ${visibleCount}`);
  }

  // --- (Opcional): Se quiser, habilite ordenar por colunas numéricas ao clicar no header ---
  // Implementação simples de ordenação para colunas de números (Stack, Bruto, Processado)
  enableSimpleSorting(tbody);

  function enableSimpleSorting(tbodyRef) {
    if (!tbodyRef) return;
    const table = tbodyRef.closest('table');
    if (!table) return;
    const headers = Array.from(table.querySelectorAll('th'));

    // Colunas que convém ordenar numericamente (0-based index)
    const numericCols = {
      // indice: true  (ajuste se a estrutura da tabela mudar)
      2: true, // Stack
      3: true, // Bruto
      4: true  // Processado
    };

    headers.forEach((th, idx) => {
      // só adiciona interação visual se for uma coluna tratável
      if (numericCols[idx]) {
        th.style.cursor = 'pointer';
        th.title = 'Clique para ordenar';

        let asc = true;
        th.addEventListener('click', () => {
          sortTableByColumn(table, idx, asc, numericCols[idx]);
          asc = !asc;
        });
      }
    });
  }

  function sortTableByColumn(table, colIndex, asc = true, numeric = false) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    rows.sort((a, b) => {
      const aCell = a.cells[colIndex] ? a.cells[colIndex].textContent.trim() : '';
      const bCell = b.cells[colIndex] ? b.cells[colIndex].textContent.trim() : '';

      if (numeric) {
        // remove símbolos como pontos de milhar e vírgula decimal, aceita "15,00" ou "3.000"
        const aNum = parseFloat(aCell.replace(/\./g, '').replace(',', '.')) || 0;
        const bNum = parseFloat(bCell.replace(/\./g, '').replace(',', '.')) || 0;
        return asc ? aNum - bNum : bNum - aNum;
      } else {
        return asc ? collator.compare(aCell, bCell) : collator.compare(bCell, aCell);
      }
    });

    // Re-anexa linhas na nova ordem
    rows.forEach(r => tbody.appendChild(r));
  }
});
