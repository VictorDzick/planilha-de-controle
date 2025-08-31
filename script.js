let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];
    let grafico;

    function salvarLocal() {
      localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
    }

    function atualizarTabela() {
      let tabela = document.getElementById("tabela");
      tabela.innerHTML = `
        <tr>
          <th>Tipo</th>
          <th>Descrição</th>
          <th>Valor (R$)</th>
          <th>Ação</th>
        </tr>
      `;

      let totalReceita = 0;
      let totalDespesa = 0;

      lancamentos.forEach((item, index) => {
        let row = tabela.insertRow();
        row.className = item.tipo === "receita" ? "receitas" : "despesas";
        row.insertCell(0).innerText = item.tipo.toUpperCase();
        row.insertCell(1).innerText = item.descricao;
        row.insertCell(2).innerText = item.valor.toFixed(2).replace(".", ",");
        let acao = row.insertCell(3);
        let btnDel = document.createElement("button");
        btnDel.innerText = "Excluir";
        btnDel.style.background = "red";
        btnDel.style.color = "white";
        btnDel.onclick = () => {
          lancamentos.splice(index, 1);
          salvarLocal();
          atualizarTabela();
        };
        acao.appendChild(btnDel);

        if (item.tipo === "receita") {
          totalReceita += item.valor;
        } else {
          totalDespesa += item.valor;
        }
      });

      document.getElementById("totalReceita").innerText = totalReceita.toFixed(2).replace(".", ",");
      document.getElementById("totalDespesa").innerText = totalDespesa.toFixed(2).replace(".", ",");
      
      let saldo = totalReceita - totalDespesa;
      let saldoEl = document.getElementById("saldo");
      saldoEl.innerText = saldo.toFixed(2).replace(".", ",");

      if (saldo >= 0) {
        saldoEl.className = "positivo";
      } else {
        saldoEl.className = "negativo";
      }

      atualizarGrafico(totalReceita, totalDespesa);
    }

    function atualizarGrafico(receitas, despesas) {
      let ctx = document.getElementById("graficoGastos").getContext("2d");

      if (grafico) {
        grafico.destroy(); // recriar gráfico para atualizar
      }

      grafico = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Receitas", "Despesas"],
          datasets: [{
            data: [receitas, despesas],
            backgroundColor: ["#28a745", "#dc3545"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
    }

    function adicionar() {
      let tipo = document.getElementById("tipo").value;
      let descricao = document.getElementById("descricao").value;
      let valor = parseFloat(document.getElementById("valor").value);

      if (!descricao || isNaN(valor) || valor <= 0) {
        alert("Preencha a descrição e o valor corretamente!");
        return;
      }

      lancamentos.push({ tipo, descricao, valor });
      salvarLocal();
      atualizarTabela();

      document.getElementById("descricao").value = "";
      document.getElementById("valor").value = "";
    }

    atualizarTabela();

    function removerTudo() {
  if (confirm("Tem certeza que deseja remover todos os lançamentos?")) {
    lancamentos = [];
    salvarLocal();
    atualizarTabela();
  }
}