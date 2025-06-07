// script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const incomeForm = document.getElementById('incomeForm');
    const expenseForm = document.getElementById('expenseForm');
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');
    const incomeTableBody = document.getElementById('incomeTableBody');
    const expenseTableBody = document.getElementById('expenseTableBody');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const currentBalanceEl = document.getElementById('currentBalance');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const themeIcon = document.querySelector('.theme-icon i');
    const generatePdfBtn = document.getElementById('generatePdfBtn');

    // App State
    let allData = JSON.parse(localStorage.getItem('budgetData')) || {};

    // --- INITIALIZATION ---
    function initializeApp() {
        loadDarkModePreference();
        setDefaultDateInputs();
        populateFilters();
        renderDataForSelectedMonth();
        setupEventListeners();
    }

    function setDefaultDateInputs() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = today;
        document.getElementById('expenseDate').value = today;
    }

    function populateFilters() {
        const currentDate = new Date();
        monthFilter.value = currentDate.getMonth();
        yearFilter.value = currentDate.getFullYear();
    }

    // --- DARK MODE ---
    function loadDarkModePreference() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            localStorage.setItem('darkMode', 'disabled');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
        renderDataForSelectedMonth(); // Re-render to apply color changes
    }

    // --- DATA HANDLING ---
    function saveData() {
        localStorage.setItem('budgetData', JSON.stringify(allData));
    }

    function getMonthYearKey(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${date.getMonth()}`;
    }
    
    function formatDateForDisplay(dateStr) {
        const date = new Date(dateStr);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-CA');
    }

    function addItem(type, itemData) {
        const monthYearKey = getMonthYearKey(itemData.date);
        if (!allData[monthYearKey]) {
            allData[monthYearKey] = { income: [], expenses: [] };
        }
        itemData.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        allData[monthYearKey][type].push(itemData);
        saveData();
        renderDataForSelectedMonth();
    }

    function deleteItem(type, id, monthYearKey) {
        if (allData[monthYearKey] && allData[monthYearKey][type]) {
            allData[monthYearKey][type] = allData[monthYearKey][type].filter(item => item.id !== id);
            if (allData[monthYearKey].income.length === 0 && allData[monthYearKey].expenses.length === 0) {
                delete allData[monthYearKey];
            }
            saveData();
            renderDataForSelectedMonth();
        }
    }

    // --- RENDERING ---
    function renderDataForSelectedMonth() {
        const selectedYear = parseInt(yearFilter.value);
        const selectedMonth = parseInt(monthFilter.value);
        const currentMonthYearKey = `${selectedYear}-${selectedMonth}`;
        const monthData = allData[currentMonthYearKey] || { income: [], expenses: [] };
        renderTable(incomeTableBody, monthData.income, 'income', currentMonthYearKey);
        renderTable(expenseTableBody, monthData.expenses, 'expenses', currentMonthYearKey);
        updateSummary(monthData.income, monthData.expenses);
    }

    function renderTable(tbody, items, type, monthYearKey) {
        tbody.innerHTML = '';
        if (!items || items.length === 0) {
            const row = tbody.insertRow();
            row.insertCell().colSpan = 4;
            row.cells[0].textContent = `No ${type} recorded.`;
            row.cells[0].style.textAlign = 'center';
            return;
        }
        items.sort((a, b) => new Date(a.date) - new Date(b.date));
        items.forEach(item => {
            const row = tbody.insertRow();
            row.insertCell().textContent = formatDateForDisplay(item.date);
            row.insertCell().textContent = item.source || item.description;
            row.insertCell().textContent = `₹${parseFloat(item.amount).toFixed(2)}`;
            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.onclick = () => deleteItem(type, item.id, monthYearKey);
            actionsCell.appendChild(deleteBtn);
        });
    }

    function updateSummary(incomeItems = [], expenseItems = []) {
        const totalIncome = incomeItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenseItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const balance = totalIncome - totalExpenses;
        totalIncomeEl.textContent = `₹${totalIncome.toFixed(2)}`;
        totalExpensesEl.textContent = `₹${totalExpenses.toFixed(2)}`;
        currentBalanceEl.textContent = `₹${balance.toFixed(2)}`;
        const isDarkMode = document.body.classList.contains('dark-mode');
        if (balance >= 0) {
            currentBalanceEl.style.color = isDarkMode ? 'var(--accent-color)' : 'var(--primary-color)';
        } else {
            currentBalanceEl.style.color = 'var(--danger-color)';
        }
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        incomeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                source: document.getElementById('incomeSource').value.trim(),
                amount: parseFloat(document.getElementById('incomeAmount').value),
                date: document.getElementById('incomeDate').value
            };
            if (data.source && data.amount > 0 && data.date) {
                addItem('income', data);
                incomeForm.reset();
                setDefaultDateInputs();
            }
        });
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                description: document.getElementById('expenseDescription').value.trim(),
                amount: parseFloat(document.getElementById('expenseAmount').value),
                date: document.getElementById('expenseDate').value
            };
            if (data.description && data.amount > 0 && data.date) {
                addItem('expenses', data);
                expenseForm.reset();
                setDefaultDateInputs();
            }
        });
        monthFilter.addEventListener('change', renderDataForSelectedMonth);
        yearFilter.addEventListener('change', renderDataForSelectedMonth);
        darkModeToggle.addEventListener('change', toggleDarkMode);
        generatePdfBtn.addEventListener('click', generatePDF);
    }
    
    // --- PDF GENERATION ---
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const selectedMonthName = monthFilter.options[monthFilter.selectedIndex].text;
        const selectedYear = yearFilter.value;
        const reportTitle = `Budget Report: ${selectedMonthName} ${selectedYear}`;
        const currentMonthYearKey = `${selectedYear}-${monthFilter.value}`;
        const monthData = allData[currentMonthYearKey] || { income: [], expenses: [] };
        
        doc.setFontSize(18);
        doc.text(reportTitle, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        let yPos = 40;
        
        const addTable = (title, data, headers, yStart) => {
            if (data.length > 0) {
                doc.setFontSize(14);
                doc.text(title, 14, yStart);
                doc.autoTable({
                    startY: yStart + 7,
                    head: [headers],
                    body: data,
                    theme: 'striped',
                    headStyles: { fillColor: title === "Income" ? [42, 157, 143] : [38, 70, 83] }
                });
                return doc.lastAutoTable.finalY + 10;
            }
            doc.setFontSize(12);
            doc.text(`No ${title.toLowerCase()} data for this month.`, 14, yStart);
            return yStart + 10;
        };

        const incomeData = monthData.income.map(i => [formatDateForDisplay(i.date), i.source, `₹${parseFloat(i.amount).toFixed(2)}`]);
        yPos = addTable("Income", incomeData, ['Date', 'Source', 'Amount'], yPos);
        
        const expenseData = monthData.expenses.map(e => [formatDateForDisplay(e.date), e.description, `₹${parseFloat(e.amount).toFixed(2)}`]);
        yPos = addTable("Expenses", expenseData, ['Date', 'Description', 'Amount'], yPos);
        
        const totalIncome = monthData.income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = monthData.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const balance = totalIncome - totalExpenses;
        
        doc.setFontSize(14);
        doc.text("Summary", 14, yPos);
        doc.setFontSize(12);
        doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 14, yPos + 7);
        doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, 14, yPos + 14);
        doc.setFont(undefined, 'bold');
        doc.text(`Final Balance: ₹${balance.toFixed(2)}`, 14, yPos + 21);
        
        doc.save(`Budget_Report_${selectedMonthName}_${selectedYear}.pdf`);
    }

    initializeApp();
});