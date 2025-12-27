// script.js - Controle de Gastos

// Variáveis globais
let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
let metas = JSON.parse(localStorage.getItem('metas')) || [];
let deferredPrompt;
let updateAvailable = false;
let registration;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos no contexto correto
    if (typeof mostrarAba === 'function') {
        mostrarAba('inicio');
    }
    
    atualizarTabela();
    atualizarResumo();
    atualizarGrafico();
    atualizarTabelaMetas();
    atualizarEstatisticasMetas();
    
    // Configurar PWA
    configurarPWA();
    
    // Configurar avaliação
    configurarAvaliacao();
    
    // Verificar atualizações a cada 5 minutos
    setInterval(verificarAtualizacao, 300000);
});

// Sistema de Mensagem de Salvamento Automático
function mostrarMensagemSalvamento() {
    // Criar mensagem temporária
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show shadow" role="alert">
            <i class="fa-solid fa-check me-2"></i>
            Dados salvos automaticamente
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Função para mostrar abas
function mostrarAba(aba) {
    console.log('Mostrando aba:', aba);
    
    // Esconder todas as abas
    const abas = document.querySelectorAll('.aba-conteudo');
    abas.forEach(abaElement => {
        if (abaElement && abaElement.style) {
            abaElement.style.display = 'none';
        }
    });
    
    // Mostrar a aba selecionada
    const abaSelecionada = document.getElementById(`aba-${aba}`);
    if (abaSelecionada && abaSelecionada.style) {
        abaSelecionada.style.display = 'block';
    }
    
    // Atualizar navegação ativa
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (link && link.classList) {
            link.classList.remove('active');
        }
    });
    
    // Adicionar classe active ao link clicado
    const linkAtivo = document.querySelector(`[onclick="mostrarAba('${aba}')"]`);
    if (linkAtivo && linkAtivo.classList) {
        linkAtivo.classList.add('active');
    }
    
    // Atualizar gráfico se for a aba inicial
    if (aba === 'inicio') {
        setTimeout(atualizarGrafico, 100);
    }
}

// Funções para transações
function adicionar() {
    const tipo = document.getElementById('tipo').value;
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    
    if (!descricao || isNaN(valor) || valor <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const transacao = {
        id: Date.now(),
        tipo,
        descricao,
        valor,
        data: new Date().toISOString()
    };
    
    transacoes.push(transacao);
    salvarTransacoes();
    atualizarTabela();
    atualizarResumo();
    atualizarGrafico();
    
    // Limpar campos
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('descricao').focus();
    
    // Verificar metas
    verificarMetas();
}

function removerTransacao(id) {
    if (confirm('Tem certeza que deseja remover esta transação?')) {
        transacoes = transacoes.filter(t => t.id !== id);
        salvarTransacoes();
        atualizarTabela();
        atualizarResumo();
        atualizarGrafico();
        verificarMetas();
    }
}

function removerTudo() {
    if (transacoes.length === 0) {
        alert('Não há transações para remover.');
        return;
    }
    
    if (confirm('Tem certeza que deseja remover TODAS as transações? Esta ação não pode ser desfeita.')) {
        transacoes = [];
        salvarTransacoes();
        atualizarTabela();
        atualizarResumo();
        atualizarGrafico();
        verificarMetas();
    }
}

function atualizarTabela() {
    const tbody = document.querySelector('#tabela tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (transacoes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="fa-solid fa-receipt fa-2x mb-2"></i>
                    <p>Nenhuma transação cadastrada</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const transacoesOrdenadas = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    transacoesOrdenadas.forEach(transacao => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="badge ${transacao.tipo === 'receita' ? 'bg-success' : 'bg-danger'}">
                    ${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </span>
            </td>
            <td>${transacao.descricao}</td>
            <td class="${transacao.tipo === 'receita' ? 'text-success' : 'text-danger'}">
                R$ ${transacao.valor.toFixed(2)}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removerTransacao(${transacao.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarResumo() {
    const totalReceita = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const totalDespesa = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const saldo = totalReceita - totalDespesa;
    
    const totalReceitaElement = document.getElementById('totalReceita');
    const totalDespesaElement = document.getElementById('totalDespesa');
    const saldoElement = document.getElementById('saldo');
    
    if (totalReceitaElement) totalReceitaElement.textContent = totalReceita.toFixed(2);
    if (totalDespesaElement) totalDespesaElement.textContent = totalDespesa.toFixed(2);
    if (saldoElement) {
        saldoElement.textContent = saldo.toFixed(2);
        saldoElement.className = `fs-5 ${saldo >= 0 ? 'text-success' : 'text-danger'}`;
    }
}

function atualizarGrafico() {
    const ctx = document.getElementById('graficoGastos');
    if (!ctx) return;
    
    // Calcular totais de receitas e despesas
    const totalReceita = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const totalDespesa = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const saldo = totalReceita - totalDespesa;
    
    // Se não há transações, mostrar mensagem
    if (totalReceita === 0 && totalDespesa === 0) {
        ctx.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fa-solid fa-chart-bar fa-2x mb-2"></i>
                <p>Nenhuma transação para exibir no gráfico</p>
            </div>
        `;
        return;
    }
    
    // Destruir gráfico anterior se existir
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Criar novo gráfico de barras
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Receitas', 'Despesas', 'Saldo'],
            datasets: [{
                label: 'Valores em R$',
                data: [totalReceita, totalDespesa, saldo],
                backgroundColor: [
                    '#28a745', // Verde para receitas
                    '#dc3545', // Vermelho para despesas
                    saldo >= 0 ? '#17a2b8' : '#ffc107' // Azul para saldo positivo, amarelo para negativo
                ],
                borderColor: [
                    '#218838',
                    '#c82333',
                    saldo >= 0 ? '#138496' : '#e0a800'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Resumo Financeiro',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Funções para metas
function adicionarMeta() {
    const descricao = document.getElementById('descricaoMeta').value.trim();
    const valorMeta = parseFloat(document.getElementById('valorMeta').value);
    const tipo = document.getElementById('tipoMeta').value;
    
    if (!descricao || isNaN(valorMeta) || valorMeta <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const meta = {
        id: Date.now(),
        descricao,
        valorMeta,
        tipo,
        dataCriacao: new Date().toISOString(),
        progresso: 0,
        concluida: false
    };
    
    metas.push(meta);
    salvarMetas();
    atualizarTabelaMetas();
    atualizarEstatisticasMetas();
    
    // Limpar campos
    document.getElementById('descricaoMeta').value = '';
    document.getElementById('valorMeta').value = '';
    document.getElementById('descricaoMeta').focus();
}

function removerMeta(id) {
    if (confirm('Tem certeza que deseja remover esta meta?')) {
        metas = metas.filter(m => m.id !== id);
        salvarMetas();
        atualizarTabelaMetas();
        atualizarEstatisticasMetas();
    }
}

function atualizarTabelaMetas() {
    const tbody = document.querySelector('#tabelaMetas tbody');
    const semMetas = document.getElementById('sem-metas');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (metas.length === 0) {
        if (semMetas) semMetas.style.display = 'block';
        return;
    }
    
    if (semMetas) semMetas.style.display = 'none';
    
    metas.forEach(meta => {
        const progresso = calcularProgressoMeta(meta);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${meta.descricao}</td>
            <td>R$ ${meta.valorMeta.toFixed(2)}</td>
            <td>
                <div class="progress">
                    <div class="progress-bar ${progresso >= 100 ? 'bg-success' : 'bg-info'}" 
                         role="progressbar" 
                         style="width: ${Math.min(progresso, 100)}%">
                        ${progresso.toFixed(1)}%
                    </div>
                </div>
            </td>
            <td>
                <span class="badge ${meta.concluida ? 'bg-success' : progresso > 0 ? 'bg-warning' : 'bg-secondary'}">
                    ${meta.concluida ? 'Concluída' : progresso > 0 ? 'Em Andamento' : 'Não Iniciada'}
                </span>
            </td>
            <td>${new Date(meta.dataCriacao).toLocaleDateString('pt-BR')}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removerMeta(${meta.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function calcularProgressoMeta(meta) {
    if (meta.tipo === 'receita') {
        const totalReceita = transacoes
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + t.valor, 0);
        return (totalReceita / meta.valorMeta) * 100;
    } else { // economia
        const totalReceita = transacoes
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + t.valor, 0);
        const totalDespesa = transacoes
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + t.valor, 0);
        const economia = totalReceita - totalDespesa;
        return (economia / meta.valorMeta) * 100;
    }
}

function verificarMetas() {
    let metasAtualizadas = false;
    
    metas.forEach(meta => {
        const progresso = calcularProgressoMeta(meta);
        const anteriorConcluida = meta.concluida;
        meta.concluida = progresso >= 100;
        
        if (anteriorConcluida !== meta.concluida) {
            metasAtualizadas = true;
            
            if (meta.concluida) {
                // Meta concluída - mostrar notificação
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Meta Concluída! 🎉', {
                        body: `Você alcançou a meta: ${meta.descricao}`,
                        icon: '/icons/icon-192x192.png'
                    });
                }
            }
        }
    });
    
    if (metasAtualizadas) {
        salvarMetas();
        atualizarTabelaMetas();
        atualizarEstatisticasMetas();
    }
}

function atualizarEstatisticasMetas() {
    const totalMetas = document.getElementById('totalMetas');
    const metasConcluidas = document.getElementById('metasConcluidas');
    const metasAndamento = document.getElementById('metasAndamento');
    const taxaSucesso = document.getElementById('taxaSucesso');
    
    if (!totalMetas || !metasConcluidas || !metasAndamento || !taxaSucesso) return;
    
    const total = metas.length;
    const concluidas = metas.filter(m => m.concluida).length;
    const andamento = metas.filter(m => !m.concluida && calcularProgressoMeta(m) > 0).length;
    const taxa = total > 0 ? (concluidas / total) * 100 : 0;
    
    totalMetas.textContent = total;
    metasConcluidas.textContent = concluidas;
    metasAndamento.textContent = andamento;
    taxaSucesso.textContent = `${taxa.toFixed(0)}%`;
}

// Local Storage - MODIFICADO PARA MOSTRAR MENSAGEM
function salvarTransacoes() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
    mostrarMensagemSalvamento(); // ← MENSAGEM ADICIONADA AQUI
}

function salvarMetas() {
    localStorage.setItem('metas', JSON.stringify(metas));
    mostrarMensagemSalvamento(); // ← MENSAGEM ADICIONADA AQUI
}

// PWA Functions
function configurarPWA() {
    // Instalação PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const btnInstalar = document.getElementById('btnInstalar');
        if (btnInstalar) {
            btnInstalar.style.display = 'block';
        }
    });

    const btnInstalar = document.getElementById('btnInstalar');
    if (btnInstalar) {
        btnInstalar.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    deferredPrompt = null;
                    btnInstalar.style.display = 'none';
                }
            }
        });
    }

    // Notificações
    if ('Notification' in window) {
        Notification.requestPermission();
    }

    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                registration = reg;
                console.log('Service Worker registrado com sucesso');
                
                // Verificar atualizações
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            updateAvailable = true;
                            mostrarModalAtualizacao();
                        }
                    });
                });
            })
            .catch((err) => {
                console.log('Falha ao registrar Service Worker:', err);
            });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (updateAvailable) {
                window.location.reload();
            }
        });
    }
}

function mostrarModalAtualizacao() {
    const modal = new bootstrap.Modal(document.getElementById('updateModal'));
    modal.show();
    
    document.getElementById('btnAtualizar').addEventListener('click', () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    });
}

function verificarAtualizacao() {
    if (registration) {
        registration.update();
    }
}

// Sistema de Avaliação
function configurarAvaliacao() {
    // Mostrar modal de avaliação após 1 minuto
    setTimeout(() => {
        if (!localStorage.getItem('avaliacaoEnviada')) {
            const modal = new bootstrap.Modal(document.getElementById('modalAvaliacao'));
            modal.show();
        }
    }, 60000);

    // Configurar envio do formulário
    const formAvaliacao = document.getElementById('formAvaliacao');
    if (formAvaliacao) {
        formAvaliacao.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem('avaliacaoEnviada', 'true');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAvaliacao'));
                    modal.hide();
                    alert('Obrigado pela sua avaliação!');
                }
            })
            .catch(error => {
                console.error('Erro ao enviar avaliação:', error);
                alert('Erro ao enviar avaliação. Tente novamente.');
            });
        });
    }
}

// Exportar dados
function exportarDados() {
    const dados = {
        transacoes: transacoes,
        metas: metas,
        exportadoEm: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-gastos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Importar dados
function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            
            if (confirm('Isso substituirá todos os dados atuais. Continuar?')) {
                if (dados.transacoes) transacoes = dados.transacoes;
                if (dados.metas) metas = dados.metas;
                
                salvarTransacoes();
                salvarMetas();
                atualizarTabela();
                atualizarResumo();
                atualizarGrafico();
                atualizarTabelaMetas();
                atualizarEstatisticasMetas();
                
                alert('Dados importados com sucesso!');
            }
        } catch (error) {
            alert('Erro ao importar dados. Verifique o arquivo.');
        }
    };
    reader.readAsText(file);
    
    // Limpar input
    event.target.value = '';
}

// Adicionar botões de exportação/importação dinamicamente
function adicionarBotoesBackup() {
    const resumoSection = document.querySelector('.row.mb-4');
    if (!resumoSection) return;
    
    const backupDiv = document.createElement('div');
    backupDiv.className = 'col-12 mt-3';
    backupDiv.innerHTML = `
        <div class="d-flex gap-2 justify-content-center">
            <button class="btn btn-outline-primary btn-sm" onclick="exportarDados()">
                <i class="fa-solid fa-download"></i> Exportar Dados
            </button>
            <label class="btn btn-outline-secondary btn-sm">
                <i class="fa-solid fa-upload"></i> Importar Dados
                <input type="file" accept=".json" onchange="importarDados(event)" style="display: none;">
            </label>
        </div>
    `;
    
    resumoSection.parentNode.insertBefore(backupDiv, resumoSection.nextSibling);
}

// Inicializar botões de backup quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(adicionarBotoesBackup, 1000);
});

// Tornar funções globais para acesso pelo HTML
window.mostrarAba = mostrarAba;
window.adicionar = adicionar;
window.removerTudo = removerTudo;
window.removerTransacao = removerTransacao;
window.adicionarMeta = adicionarMeta;
window.removerMeta = removerMeta;
window.exportarDados = exportarDados;
window.importarDados = importarDados;