const API_BASE = 'http://localhost:3000/api';

// Global App State
const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  userId: localStorage.getItem('userId') || null,
  revenus: [],
  depenses: [],
  categories: [],
  selectedRevenuId: null,
  chartInstance: null
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  checkAuthStatus();

  // Attach Event Listeners
  setupFormListeners();

  if (state.token && state.userId) {
    await loadDashboardData();
  }
}

function showView(viewName) {
  const authSection = document.getElementById('authSection');
  const revenusSection = document.getElementById('revenusSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const navUser = document.getElementById('navUser');

  if (viewName === 'auth') {
    if (authSection) authSection.classList.remove('d-none');
    if (revenusSection) revenusSection.classList.add('d-none');
    if (dashboardSection) dashboardSection.classList.add('d-none');
    if (navUser) navUser.classList.add('d-none');
  } else if (viewName === 'revenus') {
    if (authSection) authSection.classList.add('d-none');
    if (revenusSection) revenusSection.classList.remove('d-none');
    if (dashboardSection) dashboardSection.classList.add('d-none');
    if (navUser) navUser.classList.remove('d-none');
    renderRevenuesCards();
  } else if (viewName === 'dashboard') {
    if (authSection) authSection.classList.add('d-none');
    if (revenusSection) revenusSection.classList.add('d-none');
    if (dashboardSection) dashboardSection.classList.remove('d-none');
    if (navUser) navUser.classList.remove('d-none');
  }
}

function checkAuthStatus() {
  if (state.token && state.userId) {
    if (state.selectedRevenuId) {
      showView('dashboard');
    } else {
      showView('revenus');
    }
  } else {
    showView('auth');
  }
}

// --- API COMMUNICATIONS ---

// 1. Authentification
async function login(email, motDePasse) {
  try {
    const res = await fetch(`${API_BASE}/connexion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse })
    });
    const data = await res.json();

    if (data.success) {
      state.token = data.token;
      state.userId = data.utilisateur.id;
      state.user = data.utilisateur;
      state.selectedRevenuId = null; // Always open revenues selection screen on new login

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.utilisateur.id);

      showToast('Connexion réussie ! Bienvenue.', 'success');
      await loadDashboardData();
      showView('revenus');
    } else {
      showToast(data.message || 'Identifiants incorrects', 'danger');
    }
  } catch (err) {
    console.error('Erreur Connexion :', err);
    showToast('Impossible de contacter le serveur backend', 'danger');
  }
}

async function register(nom, email, numero, motDePasse) {
  try {
    const res = await fetch(`${API_BASE}/inscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, numero, motDePasse })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Compte créé avec succès ! Connectez-vous maintenant.', 'success');
      // Switch to login tab if modal exists
      const loginTabBtn = document.getElementById('login-tab');
      if (loginTabBtn) loginTabBtn.click();
    } else {
      showToast(data.message || 'Erreur lors de l\'inscription', 'danger');
    }
  } catch (err) {
    console.error('Erreur Inscription :', err);
    showToast('Impossible de contacter le serveur backend', 'danger');
  }
}

function logout() {
  state.token = null;
  state.userId = null;
  state.user = null;
  state.selectedRevenuId = null;
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  showToast('Déconnexion réussie.', 'info');
  checkAuthStatus();
}

// 2. Data Fetching
async function loadDashboardData() {
  if (!state.userId) return;

  try {
    // Parallel fetching categories, user profile, revenues & expenses
    const [resCat, resProfile, resRev, resDep] = await Promise.all([
      fetch(`${API_BASE}/categories`),
      fetch(`${API_BASE}/utilisateur/${state.userId}/complet`, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      }),
      fetch(`${API_BASE}/revenus/${state.userId}`),
      fetch(`${API_BASE}/depenses/${state.userId}`)
    ]);

    const dataCat = await resCat.json();
    const dataProfile = await resProfile.json();
    const dataRev = await resRev.json();
    const dataDep = await resDep.json();

    if (dataCat.success) state.categories = dataCat.data;
    if (dataProfile.success && dataProfile.profil.length > 0) {
      state.user = {
        nom: dataProfile.profil[0].utilisateur_nom,
        email: dataProfile.profil[0].utilisateur_email
      };
      updateUserInfoUI();
    }
    if (dataRev.success) state.revenus = dataRev.data;
    if (dataDep.success) state.depenses = dataDep.data;

    renderCategoriesDropdown();
    renderRevenuesSelect();
    renderRevenuesCards();
    await updateFinancialKPIs();
    renderExpensesTable();
    updateCharts();

  } catch (err) {
    console.error('Erreur chargement tableau de bord :', err);
    showToast('Erreur de synchronisation avec le serveur', 'danger');
  }
}

// 3. Financial Calculations & KPIs
async function updateFinancialKPIs() {
  const kpiIncome = document.getElementById('kpiIncome');
  const kpiExpense = document.getElementById('kpiExpense');
  const kpiBalance = document.getElementById('kpiBalance');
  const kpiStatusBadge = document.getElementById('kpiStatusBadge');

  if (!state.selectedRevenuId) {
    if (kpiIncome) kpiIncome.textContent = '0 XAF';
    if (kpiExpense) kpiExpense.textContent = '0 XAF';
    if (kpiBalance) kpiBalance.textContent = '0 XAF';
    if (kpiStatusBadge) {
      kpiStatusBadge.textContent = 'Aucun Revenu Sélectionné';
      kpiStatusBadge.className = 'badge-status badge-pending';
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/revenus/${state.selectedRevenuId}/bilan`);
    const data = await res.json();

    if (data.success) {
      const { revenuTotal, totalDepensesPrevisionnelles, resteBudgetaire } = data.data;

      if (kpiIncome) kpiIncome.textContent = formatCurrency(revenuTotal);
      if (kpiExpense) kpiExpense.textContent = formatCurrency(totalDepensesPrevisionnelles);
      if (kpiBalance) kpiBalance.textContent = formatCurrency(resteBudgetaire);

      if (kpiStatusBadge) {
        if (resteBudgetaire >= 0) {
          kpiStatusBadge.textContent = 'Budget Sain (Excédent)';
          kpiStatusBadge.className = 'badge-status badge-paid';
        } else {
          kpiStatusBadge.textContent = 'Alerte : Dépassement';
          kpiStatusBadge.className = 'badge-status badge-canceled';
        }
      }
    }
  } catch (err) {
    console.error('Erreur calcul bilan :', err);
  }
}

// --- DOM RENDERERS ---

function updateUserInfoUI() {
  const userNameEl = document.getElementById('navUserName');
  const userEmailEl = document.getElementById('navUserEmail');

  if (userNameEl && state.user) userNameEl.textContent = state.user.nom;
  if (userEmailEl && state.user) userEmailEl.textContent = state.user.email;
}

function renderCategoriesDropdown() {
  const selects = ['expenseCategorySelect', 'editExpenseCategorySelect'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Choisir une catégorie...</option>';
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.ID;
      opt.textContent = cat.NOM_CATEGORIE;
      select.appendChild(opt);
    });
  });

  // Render category list in Category Modal
  const categoryListContainer = document.getElementById('categoryListContainer');
  if (categoryListContainer) {
    categoryListContainer.innerHTML = state.categories.map(c => `
      <div class="d-flex align-items-center justify-content-between p-2 mb-2 glass-pill">
        <span><i class="bi bi-tag-fill me-2 text-primary"></i>${escapeHtml(c.NOM_CATEGORIE)}</span>
        <span class="badge bg-dark border border-secondary">ID #${c.ID}</span>
      </div>
    `).join('');
  }
}

function renderRevenuesSelect() {
  const revSelect = document.getElementById('selectedRevenuSelect');
  const modalRevSelect = document.getElementById('expenseRevenuSelect');

  if (revSelect) {
    revSelect.innerHTML = state.revenus.map(r => `
      <option value="${r.ID}" ${r.ID == state.selectedRevenuId ? 'selected' : ''}>
        Mois : ${formatDateMonth(r.MOIS)} - ${formatCurrency(r.MONTANT)}
      </option>
    `).join('');

    if (state.revenus.length === 0) {
      revSelect.innerHTML = '<option value="">Aucun revenu créé</option>';
    }
  }

  if (modalRevSelect) {
    modalRevSelect.innerHTML = state.revenus.map(r => `
      <option value="${r.ID}">
        Mois : ${formatDateMonth(r.MOIS)} (${formatCurrency(r.MONTANT)})
      </option>
    `).join('');
  }
}

function renderRevenuesCards() {
  const container = document.getElementById('revenusCardsContainer');
  if (!container) return;

  const searchInput = document.getElementById('revenueSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filteredRevenus = state.revenus || [];
  if (query) {
    filteredRevenus = filteredRevenus.filter(r => {
      const monthStr = formatDateMonth(r.MOIS).toLowerCase();
      const rawDateStr = (r.MOIS || '').toLowerCase();
      return monthStr.includes(query) || rawDateStr.includes(query);
    });
  }

  if (!state.revenus || state.revenus.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="glass-card p-5 mx-auto" style="max-width: 500px;">
          <div class="logo-badge mx-auto mb-3" style="width: 64px; height: 64px; font-size: 2rem;">
            <i class="bi bi-wallet2"></i>
          </div>
          <h3 class="fw-bold mb-2">Aucun Revenu Mensuel</h3>
          <p class="text-muted small mb-4">
            Vous n'avez pas encore configuré de revenu mensuel. Ajoutez votre premier revenu pour commencer à suivre vos dépenses prévisionnelles.
          </p>
          <button class="btn btn-stitch-primary" data-bs-toggle="modal" data-bs-target="#addRevenueModal">
            <i class="bi bi-plus-circle-fill me-1"></i> Ajouter mon premier revenu
          </button>
        </div>
      </div>
    `;
    return;
  }

  if (filteredRevenus.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="glass-card p-4 mx-auto" style="max-width: 450px;">
          <i class="bi bi-search fs-1 text-muted d-block mb-2"></i>
          <h5 class="fw-bold mb-1">Aucun résultat trouvé</h5>
          <p class="text-muted small mb-0">Aucun revenu ne correspond à "${escapeHtml(query)}".</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredRevenus.map(r => {
    const revExpenses = state.depenses.filter(d => d.REVENU_ID == r.ID);
    const totalExp = revExpenses.reduce((sum, d) => sum + parseFloat(d.MONTANT_CAT || 0), 0);
    const solde = parseFloat(r.MONTANT || 0) - totalExp;
    const isPositive = solde >= 0;

    return `
      <div class="col-12">
        <div class="glass-card revenue-list-item d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="logo-badge" style="width: 48px; height: 48px; font-size: 1.3rem;">
              <i class="bi bi-calendar-event"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="fw-bold fs-5 text-white">${formatDateMonth(r.MOIS)}</span>
                <span class="badge-status ${isPositive ? 'badge-paid' : 'badge-canceled'}">
                  ${isPositive ? 'Excédent' : 'Déficit'}
                </span>
              </div>
              <div class="text-muted small">
                Montant Prévu : <strong class="text-success">${formatCurrency(r.MONTANT)}</strong>
                <span class="mx-2">•</span>
                Dépenses (${revExpenses.length}) : <strong class="text-light">${formatCurrency(totalExp)}</strong>
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-3 ms-auto ms-md-0">
            <div class="text-end d-none d-lg-block me-2">
              <div class="text-muted fs-8">Reste disponible</div>
              <div class="fw-bold fs-6 ${isPositive ? 'text-gradient' : 'text-danger'}">${formatCurrency(solde)}</div>
            </div>
            <button
              class="btn btn-stitch-primary btn-sm px-3"
              onclick="selectRevenuAndOpenDashboard(${r.ID})"
            >
              <i class="bi bi-pie-chart-fill me-1"></i> Bilan Détaillé
            </button>
            <button
              class="btn btn-stitch-danger btn-sm px-2 py-1"
              onclick="deleteRevenu(${r.ID})"
              title="Supprimer ce revenu"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function selectRevenuAndOpenDashboard(revenuId) {
  state.selectedRevenuId = revenuId;
  renderRevenuesSelect();
  await updateFinancialKPIs();
  renderExpensesTable();
  updateCharts();
  showView('dashboard');
}

function deleteRevenu(revenuId) {
  showConfirmModal(
    'Supprimer ce revenu ?',
    'Voulez-vous vraiment supprimer ce revenu mensuel et toutes les dépenses associées ?',
    async () => {
      try {
        const res = await fetch(`${API_BASE}/revenus/${revenuId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast('Revenu supprimé avec succès', 'success');
          if (state.selectedRevenuId == revenuId) {
            state.selectedRevenuId = null;
          }
          await loadDashboardData();
          showView('revenus');
        } else {
          showToast(data.message || 'Erreur lors de la suppression', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erreur réseau', 'danger');
      }
    }
  );
}

function renderExpensesTable() {
  const tbody = document.getElementById('expensesTableBody');
  if (!tbody) return;

  // Filter expenses linked to the currently selected revenue
  const currentExpenses = state.depenses.filter(d => d.REVENU_ID == state.selectedRevenuId);

  if (currentExpenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          Aucune dépense enregistrée pour ce revenu.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = currentExpenses.map(d => {
    let statusClass = 'badge-pending';
    let statusText = 'En attente';
    if (d.STATUT == 1) { statusClass = 'badge-paid'; statusText = 'Payé'; }
    else if (d.STATUT == 2) { statusClass = 'badge-canceled'; statusText = 'Annulé'; }

    return `
      <tr>
        <td class="fw-semibold">
          <i class="bi bi-receipt text-secondary me-2"></i>${escapeHtml(d.TITRE)}
        </td>
        <td>
          <span class="badge glass-pill text-light">
            <i class="bi bi-folder2 me-1"></i>${escapeHtml(d.NOM_CATEGORIE || 'Général')}
          </span>
        </td>
        <td class="fw-bold text-gradient">${formatCurrency(d.MONTANT_CAT)}</td>
        <td><span class="badge-status ${statusClass}">${statusText}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-stitch-secondary me-1" onclick="openEditExpenseModal(${d.ID})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-stitch-danger" onclick="deleteExpense(${d.ID})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Chart Visualization
function updateCharts() {
  const canvas = document.getElementById('expenseChart');
  if (!canvas) return;

  const currentExpenses = state.depenses.filter(d => d.REVENU_ID == state.selectedRevenuId);

  // Group by category
  const categoriesMap = {};
  currentExpenses.forEach(d => {
    const catName = d.NOM_CATEGORIE || 'Autre';
    categoriesMap[catName] = (categoriesMap[catName] || 0) + parseFloat(d.MONTANT_CAT);
  });

  const labels = Object.keys(categoriesMap);
  const dataValues = Object.values(categoriesMap);

  if (state.chartInstance) {
    state.chartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  state.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length > 0 ? labels : ['Aucune dépense'],
      datasets: [{
        data: dataValues.length > 0 ? dataValues : [1],
        backgroundColor: [
          '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'
        ],
        borderWidth: 2,
        borderColor: '#111827'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
        }
      },
      cutout: '70%'
    }
  });
}

// --- ACTION HANDLERS ---

function setupFormListeners() {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      login(email, pass);
    });
  }

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nom = document.getElementById('regNom').value;
      const email = document.getElementById('regEmail').value;
      const numero = document.getElementById('regNumero').value;
      const pass = document.getElementById('regPassword').value;
      register(nom, email, numero, pass);
    });
  }

  // Revenue Search Filter
  const searchInput = document.getElementById('revenueSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderRevenuesCards();
    });
  }

  // Revenue Change
  const revSelect = document.getElementById('selectedRevenuSelect');
  if (revSelect) {
    revSelect.addEventListener('change', async (e) => {
      state.selectedRevenuId = e.target.value;
      await updateFinancialKPIs();
      renderExpensesTable();
      updateCharts();
    });
  }

  // Add Revenue Form
  const addRevenueForm = document.getElementById('addRevenueForm');
  if (addRevenueForm) {
    addRevenueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const montant = document.getElementById('revMontant').value;
      const mois = document.getElementById('revMois').value;

      try {
        const res = await fetch(`${API_BASE}/revenus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utilisateurId: state.userId,
            montant: parseFloat(montant),
            mois
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Revenu mensuel ajouté !', 'success');
          const modalEl = document.getElementById('addRevenueModal');
          const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          modalInstance.hide();
          addRevenueForm.reset();
          if (data.id) {
            state.selectedRevenuId = data.id;
          }
          await loadDashboardData();
          showView('revenus');
        } else {
          showToast(data.message || 'Erreur lors de l\'ajout', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erreur serveur', 'danger');
      }
    });
  }

  // Add Expense Form
  const addExpenseForm = document.getElementById('addExpenseForm');
  if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titre = document.getElementById('expenseTitre').value;
      const montantCat = document.getElementById('expenseMontant').value;
      const categorieId = document.getElementById('expenseCategorySelect').value;
      const revenuId = document.getElementById('expenseRevenuSelect').value || state.selectedRevenuId;
      const statut = document.getElementById('expenseStatutSelect').value;

      try {
        const res = await fetch(`${API_BASE}/depenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            revenuId,
            categorieId,
            montantCat: parseFloat(montantCat),
            titre,
            statut: parseInt(statut)
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Dépense prévisionnelle ajoutée !', 'success');
          bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
          addExpenseForm.reset();
          await loadDashboardData();
        } else {
          showToast(data.message || 'Erreur d\'ajout', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erreur serveur', 'danger');
      }
    });
  }

  // Add Category Form
  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nom = document.getElementById('catNomInput').value;
      try {
        const res = await fetch(`${API_BASE}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Nouvelle catégorie ajoutée !', 'success');
          document.getElementById('catNomInput').value = '';
          await loadDashboardData();
        } else {
          showToast(data.message, 'danger');
        }
      } catch (err) {
        showToast('Erreur serveur', 'danger');
      }
    });
  }
}

function deleteExpense(depenseId) {
  showConfirmModal(
    'Supprimer la dépense ?',
    'Voulez-vous vraiment supprimer cette dépense prévisionnelle ?',
    async () => {
      try {
        const res = await fetch(`${API_BASE}/depenses/${depenseId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast('Dépense supprimée avec succès', 'success');
          await loadDashboardData();
        } else {
          showToast(data.message || 'Erreur lors de la suppression', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Erreur réseau', 'danger');
      }
    }
  );
}

// Modal helper for editing expense
function openEditExpenseModal(id) {
  const expense = state.depenses.find(d => d.ID == id);
  if (!expense) return;

  document.getElementById('editExpenseId').value = expense.ID;
  document.getElementById('editExpenseTitre').value = expense.TITRE;
  document.getElementById('editExpenseMontant').value = expense.MONTANT_CAT;
  document.getElementById('editExpenseCategorySelect').value = expense.CATEGORIE_ID;
  document.getElementById('editExpenseStatutSelect').value = expense.STATUT;

  const modal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
  modal.show();
}

// Edit Expense Submit
async function submitEditExpense() {
  const id = document.getElementById('editExpenseId').value;
  const titre = document.getElementById('editExpenseTitre').value;
  const montantCat = document.getElementById('editExpenseMontant').value;
  const categorieId = document.getElementById('editExpenseCategorySelect').value;
  const statut = document.getElementById('editExpenseStatutSelect').value;

  try {
    const res = await fetch(`${API_BASE}/depenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revenuId: state.selectedRevenuId,
        categorieId,
        montantCat: parseFloat(montantCat),
        titre,
        statut: parseInt(statut)
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Dépense mise à jour !', 'success');
      bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
      await loadDashboardData();
    } else {
      showToast(data.message, 'danger');
    }
  } catch (err) {
    showToast('Erreur serveur', 'danger');
  }
}

// --- UTILITY FUNCTIONS ---

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(num);
}

function formatDateMonth(isoDate) {
  if (!isoDate) return 'N/A';
  const d = new Date(isoDate);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white bg-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0 mb-2 show`;
  toastEl.role = 'alert';
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  toastContainer.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 4000);
}

function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  } else {
    input.type = 'password';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  }
}

function showConfirmModal(title, message, onConfirmCallback) {
  const modalEl = document.getElementById('deleteConfirmModal');
  const titleEl = document.getElementById('deleteConfirmTitle');
  const msgEl = document.getElementById('deleteConfirmMessage');
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  if (!modalEl || !confirmBtn) return;

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener('click', async () => {
    modalInstance.hide();
    await onConfirmCallback();
  });

  modalInstance.show();
}
