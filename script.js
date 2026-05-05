// Script to manage the finance app state and UI

// Load initial state from localStorage or create default structure
function loadState() {
  try {
    const data = localStorage.getItem('miFinanzasData');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing data', e);
      }
    }
  } catch (err) {
    console.warn('localStorage not accessible', err);
  }
  // Default state
  return {
    config: {
      salary: 0,
      savings: 0,
    },
    categories: [],
    transactions: [],
  };
}

function saveState(state) {
  try {
    localStorage.setItem('miFinanzasData', JSON.stringify(state));
  } catch (err) {
    console.warn('localStorage not accessible', err);
  }
}

// Generate a simple unique ID for items
function generateId() {
  return 'id-' + Math.random().toString(36).substr(2, 9);
}

// Global state variable
let state = loadState();

// Elements
const salaryAmountEl = document.getElementById('salaryAmount');
const savingsAmountEl = document.getElementById('savingsAmount');
const spentAmountEl = document.getElementById('spentAmount');
const availableAmountEl = document.getElementById('availableAmount');
const categoriesListEl = document.getElementById('categoriesList');
const transactionsListEl = document.getElementById('transactionsList');

// Modal elements
const expenseModal = document.getElementById('expenseModal');
const categoryModal = document.getElementById('categoryModal');
const configModal = document.getElementById('configModal');

// Buttons
document.getElementById('openAddExpense').addEventListener('click', openExpenseModal);
document.getElementById('openAddCategory').addEventListener('click', () => openCategoryModal());
document.getElementById('openConfig').addEventListener('click', openConfigModal);

document.getElementById('cancelExpense').addEventListener('click', () => closeModal(expenseModal));
document.getElementById('cancelCategory').addEventListener('click', () => closeModal(categoryModal));
document.getElementById('cancelConfig').addEventListener('click', () => closeModal(configModal));

document.getElementById('saveExpense').addEventListener('click', saveExpense);
document.getElementById('saveCategory').addEventListener('click', saveCategory);
document.getElementById('saveConfig').addEventListener('click', saveConfig);

// Input elements
const expenseConceptEl = document.getElementById('expenseConcept');
const expenseAmountEl = document.getElementById('expenseAmount');
const expenseCategoryEl = document.getElementById('expenseCategory');

const categoryNameEl = document.getElementById('categoryName');
const categoryLimitEl = document.getElementById('categoryLimit');

const configSalaryEl = document.getElementById('configSalary');
const configSavingsEl = document.getElementById('configSavings');

// Variable to keep track of category being edited
let editingCategoryId = null;

// Functions to open modals
function openExpenseModal() {
  // Populate category select
  expenseCategoryEl.innerHTML = '';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    expenseCategoryEl.appendChild(opt);
  });
  expenseConceptEl.value = '';
  expenseAmountEl.value = '';
  openModal(expenseModal);
}

function openCategoryModal(category = null) {
  if (category) {
    // Edit existing category
    editingCategoryId = category.id;
    document.getElementById('categoryModalTitle').textContent = 'Editar categoría';
    categoryNameEl.value = category.name;
    categoryLimitEl.value = category.limit;
  } else {
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = 'Añadir categoría';
    categoryNameEl.value = '';
    categoryLimitEl.value = '';
  }
  openModal(categoryModal);
}

function openConfigModal() {
  configSalaryEl.value = state.config.salary || 0;
  configSavingsEl.value = state.config.savings || 0;
  openModal(configModal);
}

function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
}

// Save functions
function saveExpense() {
  const concept = expenseConceptEl.value.trim();
  const amount = parseFloat(expenseAmountEl.value);
  const categoryId = expenseCategoryEl.value;
  if (!concept || isNaN(amount) || !categoryId) {
    alert('Por favor, rellena todos los campos');
    return;
  }
  // Create transaction
  const date = new Date();
  const dateStr = date.toLocaleDateString('es-ES');
  const transaction = {
    id: generateId(),
    concept,
    amount,
    categoryId,
    date: dateStr,
  };
  state.transactions.push(transaction);
  saveState(state);
  closeModal(expenseModal);
  render();
}

function saveCategory() {
  const name = categoryNameEl.value.trim();
  const limit = parseFloat(categoryLimitEl.value);
  if (!name || isNaN(limit)) {
    alert('Por favor, rellena todos los campos');
    return;
  }
  if (editingCategoryId) {
    // Update existing
    const cat = state.categories.find(c => c.id === editingCategoryId);
    if (cat) {
      cat.name = name;
      cat.limit = limit;
    }
  } else {
    // Add new category
    state.categories.push({ id: generateId(), name, limit });
  }
  saveState(state);
  closeModal(categoryModal);
  render();
}

function saveConfig() {
  const salary = parseFloat(configSalaryEl.value);
  const savings = parseFloat(configSavingsEl.value);
  if (isNaN(salary) || isNaN(savings)) {
    alert('Por favor, rellena todos los campos');
    return;
  }
  state.config.salary = salary;
  state.config.savings = savings;
  saveState(state);
  closeModal(configModal);
  render();
}

// Delete category (and its transactions)
function deleteCategory(categoryId) {
  if (!confirm('¿Eliminar esta categoría? Se borrarán los gastos asociados.')) return;
  // Remove category
  state.categories = state.categories.filter(cat => cat.id !== categoryId);
  // Remove transactions of category
  state.transactions = state.transactions.filter(tx => tx.categoryId !== categoryId);
  saveState(state);
  render();
}

// Render summary
function renderSummary() {
  const totalSpent = state.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const salary = state.config.salary || 0;
  const savings = state.config.savings || 0;
  const available = salary - savings - totalSpent;
  salaryAmountEl.textContent = `${salary.toFixed(2)} €`;
  savingsAmountEl.textContent = `${savings.toFixed(2)} €`;
  spentAmountEl.textContent = `${totalSpent.toFixed(2)} €`;
  availableAmountEl.textContent = `${available.toFixed(2)} €`;
}

// Render categories with progress bars and edit/delete options
function renderCategories() {
  categoriesListEl.innerHTML = '';
  state.categories.forEach(cat => {
    // Calculate spent for category
    const spent = state.transactions
      .filter(tx => tx.categoryId === cat.id)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const limit = cat.limit;
    const percentage = limit > 0 ? spent / limit : 0;
    // Create card
    const card = document.createElement('div');
    card.className = 'category-card';
    // Header with name and actions
    const header = document.createElement('div');
    header.className = 'category-header';
    const title = document.createElement('h3');
    title.textContent = cat.name;
    header.appendChild(title);
    const actions = document.createElement('div');
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => openCategoryModal(cat));
    actions.appendChild(editBtn);
    // Delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Eliminar';
    delBtn.addEventListener('click', () => deleteCategory(cat.id));
    actions.appendChild(delBtn);
    header.appendChild(actions);
    card.appendChild(header);
    // Progress bar container
    const pbContainer = document.createElement('div');
    pbContainer.className = 'progress-bar-container';
    const pb = document.createElement('div');
    pb.className = 'progress-bar';
    // Set color based on percentage
    let color;
    if (percentage < 0.8) {
      color = '#22c55e'; // green
    } else if (percentage < 1) {
      color = '#facc15'; // yellow
    } else {
      color = '#ef4444'; // red
    }
    pb.style.backgroundColor = color;
    pb.style.width = `${Math.min(percentage, 1) * 100}%`;
    pbContainer.appendChild(pb);
    card.appendChild(pbContainer);
    // Progress info
    const info = document.createElement('div');
    info.className = 'progress-info';
    const spentLabel = document.createElement('span');
    spentLabel.textContent = `Gastado: ${spent.toFixed(2)} €`;
    const limitLabel = document.createElement('span');
    limitLabel.textContent = `Límite: ${limit.toFixed(2)} €`;
    info.appendChild(spentLabel);
    info.appendChild(limitLabel);
    card.appendChild(info);
    categoriesListEl.appendChild(card);
  });
}

// Render transactions list
function renderTransactions() {
  transactionsListEl.innerHTML = '';
  // sort by date descending (recent first)
  const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
  sortedTx.forEach(tx => {
    const li = document.createElement('li');
    li.className = 'transaction';
    const left = document.createElement('div');
    left.className = 'trans-left';
    const cat = state.categories.find(c => c.id === tx.categoryId);
    const catName = cat ? cat.name : 'Sin categoría';
    const conceptEl = document.createElement('span');
    conceptEl.textContent = tx.concept;
    const metaEl = document.createElement('span');
    metaEl.textContent = `${catName} · ${tx.date}`;
    left.appendChild(conceptEl);
    left.appendChild(metaEl);
    const right = document.createElement('div');
    right.className = 'trans-right';
    right.textContent = `-${tx.amount.toFixed(2)} €`;
    li.appendChild(left);
    li.appendChild(right);
    transactionsListEl.appendChild(li);
  });
}

// Main render function
function render() {
  renderSummary();
  renderCategories();
  renderTransactions();
}

// Initial render
render();