// -------- Controle de lançamentos --------
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


// --------- Detectar iOS ---------
function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator) && window.navigator.standalone;
}


// -------- Instalação PWA --------
let deferredPrompt;
const btnInstalar = document.getElementById('btnInstalar');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Função: mostrar instruções para iOS
function mostrarInstrucoesIOS() {
  const overlay = document.createElement('div');
  overlay.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    ">
      <div style="
        background: white;
        border-radius: 15px;
        padding: 20px;
        max-width: 320px;
        text-align: center;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
      ">
        <h5 style="color:#198754;">📱 Instalar no iPhone</h5>
        <p>Toque em <strong>Compartilhar</strong> 
        <span style="font-size:22px;">⬆️</span> 
        e depois selecione<br>
        <strong>“Adicionar à Tela de Início”</strong>.</p>
        <button id="fechar-ios" style="
          background:#198754;
          color:white;
          border:none;
          border-radius:8px;
          padding:8px 16px;
          margin-top:10px;
          cursor:pointer;
        ">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('fechar-ios').addEventListener('click', () => overlay.remove());
}

// Mostrar botão flutuante no iPhone
if (isIOS() && !isInStandaloneMode()) {
  const btnFlutuante = document.createElement('button');
  btnFlutuante.innerHTML = '<i class="fa-solid fa-plus"></i>';
  btnFlutuante.style.cssText = `
    position: fixed;
    bottom: 25px;
    right: 25px;
    background: #198754;
    color: white;
    border: none;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 24px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    cursor: pointer;
    z-index: 9999;
  `;
  document.body.appendChild(btnFlutuante);

  btnFlutuante.addEventListener('click', mostrarInstrucoesIOS);
} else {
  // Android/PC
  btnInstalar.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') console.log("PWA instalado pelo usuário");
      deferredPrompt = null;
    }
    mostrarAvaliacao();
  });
}


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


// -------- Service Worker --------
// -------- Service Worker (PWA) --------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) => {
      console.log("✅ Service Worker registrado com sucesso!");

      // Quando detectar nova versão do SW
      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        newWorker.onstatechange = () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("🚀 Nova versão detectada!");
            
            // Exibir modal Bootstrap de atualização
            const updateModal = new bootstrap.Modal(document.getElementById("updateModal"));
            updateModal.show();

            // Ação ao clicar em "Atualizar agora"
            document.getElementById("btnAtualizar").addEventListener("click", () => {
              newWorker.postMessage({ action: "skipWaiting" });
              window.location.reload();
            });
          }
        };
      };
    })
    .catch((err) => console.error("❌ Erro ao registrar o Service Worker:", err));

  // Atualizar automaticamente quando o SW for ativado
  let refreshing;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
}
