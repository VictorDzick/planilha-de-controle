// Controle de lançamentos
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];
let grafico;

// Salvar no localStorage
function salvarLocal() {
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
}

// Atualizar tabela, resumo e gráfico
function atualizarTabela() {
  const tabelaBody = document.querySelector("#tabela tbody");
  tabelaBody.innerHTML = "";

  let totalReceita = 0;
  let totalDespesa = 0;

  lancamentos.forEach((item, index) => {
    const row = document.createElement("tr");
    row.className = item.tipo === "receita" ? "table-success" : "table-danger";

    row.innerHTML = `
      <td>${item.tipo.toUpperCase()}</td>
      <td>${item.descricao}</td>
      <td>${item.valor.toFixed(2).replace(".", ",")}</td>
      <td>
        <button class="btn btn-sm btn-danger"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;

    // Botão excluir
    row.querySelector("button").addEventListener("click", () => {
      lancamentos.splice(index, 1);
      salvarLocal();
      atualizarTabela();
    });

    tabelaBody.appendChild(row);

    if (item.tipo === "receita") totalReceita += item.valor;
    else totalDespesa += item.valor;
  });

  // Atualizar resumo
  document.getElementById("totalReceita").innerText = totalReceita.toFixed(2).replace(".", ",");
  document.getElementById("totalDespesa").innerText = totalDespesa.toFixed(2).replace(".", ",");
  const saldo = totalReceita - totalDespesa;
  const saldoEl = document.getElementById("saldo");
  saldoEl.innerText = saldo.toFixed(2).replace(".", ",");
  saldoEl.className = saldo >= 0 ? "saldo-positivo" : "saldo-negativo";

  // Atualizar gráfico
  atualizarGrafico(totalReceita, totalDespesa);
}

// Atualizar gráfico Chart.js
function atualizarGrafico(receitas, despesas) {
  const ctx = document.getElementById("graficoGastos").getContext("2d");
  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        data: [receitas, despesas],
        backgroundColor: ["#198754", "#dc3545"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// Adicionar lançamento
function adicionar() {
  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);

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

// Remover todos os lançamentos
function removerTudo() {
  if (confirm("Tem certeza que deseja remover todos os lançamentos?")) {
    lancamentos = [];
    salvarLocal();
    atualizarTabela();
  }
}

// Inicializa tabela e gráfico
atualizarTabela();

// -------- PWA e instalação --------
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

const btnInstalar = document.getElementById('btnInstalar');
btnInstalar.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') console.log("PWA instalado pelo usuário");
    deferredPrompt = null;
  }
  mostrarAvaliacao();
});

// -------- Modal Avaliação Bootstrap --------
const modalAvaliacao = new bootstrap.Modal(document.getElementById("modalAvaliacao"));

function mostrarAvaliacao() {
  modalAvaliacao.show();
}

// Envio do formulário de avaliação
const form = document.getElementById("formAvaliacao");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  fetch(form.action, {
    method: form.method,
    body: formData,
    headers: { "Accept": "application/json" }
  }).then(response => {
    if (response.ok) {
      alert("Obrigado por avaliar nosso site!");
      form.reset();
      modalAvaliacao.hide();
    } else {
      alert("Erro ao enviar avaliação. Tente novamente.");
    }
  }).catch(() => {
    alert("Erro ao enviar avaliação. Tente novamente.");
  });
});

// -------- Service Worker (PWA) --------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(reg => console.log("Service Worker registrado:", reg))
      .catch(err => console.log("Erro ao registrar SW:", err));
  });
}
