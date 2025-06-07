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
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    // --- DATA HANDLING ---
    function saveData() {
        localStorage.setItem('budgetData', JSON.stringify(allData));
    }

    function getMonthYearKey(dateStr) {
        const date = new Date(dateStr);
        // Add 1 to month because getMonth() is 0-indexed, but we want 1-indexed for keys if desired.
        // However, for consistency with filter (0-indexed), let's keep it 0-indexed.
        // Key format: YYYY-M (e.g., 2023-0 for January)
        return `${date.getFullYear()}-${date.getMonth()}`;
    }
    
    function formatDateForDisplay(dateStr) {
        const date = new Date(dateStr);
        // Ensures the date displayed is the one selected, not affected by UTC conversion issues
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-CA'); // YYYY-MM-DD
    }


    function addItem(type, itemData) {
        const monthYearKey = getMonthYearKey(itemData.date);
        if (!allData[monthYearKey]) {
            allData[monthYearKey] = { income: [], expenses: [] };
        }
        itemData.id = Date.now().toString() + Math.random().toString(36).substr(2, 5); // Unique ID
        allData[monthYearKey][type].push(itemData);
        saveData();
        renderDataForSelectedMonth();
    }

    function deleteItem(type, id, monthYearKey) {
        if (allData[monthYearKey] && allData[monthYearKey][type]) {
            allData[monthYearKey][type] = allData[monthYearKey][type].filter(item => item.id !== id);
            // If month becomes empty, remove it (optional)
            if (allData[monthYearKey].income.length === 0 && allData[monthYearKey].expenses.length === 0) {
                delete allData[monthYearKey];
            }
            saveData();
            renderDataForSelectedMonth();
        }
    }

    // --- RENDERING ---
    function renderDataForSelectedMonth() {
        const selectedMonth = parseInt(monthFilter.value);
        const selectedYear = parseInt(yearFilter.value);
        const currentMonthYearKey = `${selectedYear}-${selectedMonth}`;

        const monthData = allData[currentMonthYearKey] || { income: [], expenses: [] };

        renderTable(incomeTableBody, monthData.income, 'income', currentMonthYearKey);
        renderTable(expenseTableBody, monthData.expenses, 'expenses', currentMonthYearKey);
        updateSummary(monthData.income, monthData.expenses);
    }

    function renderTable(tbody, items, type, monthYearKey) {
        tbody.innerHTML = ''; // Clear existing rows
        if (!items || items.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4;
            cell.textContent = `No ${type} recorded for this month.`;
            cell.style.textAlign = 'center';
            return;
        }

        items.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

        items.forEach(item => {
            const row = tbody.insertRow();
            row.insertCell().textContent = formatDateForDisplay(item.date);
            row.insertCell().textContent = item.source || item.description;
            row.insertCell().textContent = `₹${parseFloat(item.amount).toFixed(2)}`;
            
            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteBtn.onclick = () => deleteItem(type, item.id, monthYearKey);
            actionsCell.appendChild(deleteBtn);
        });
    }

    function updateSummary(incomeItems, expenseItems) {
        const totalIncome = incomeItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenseItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const balance = totalIncome - totalExpenses;

        totalIncomeEl.textContent = `₹${totalIncome.toFixed(2)}`;
        totalExpensesEl.textContent = `₹${totalExpenses.toFixed(2)}`;
        currentBalanceEl.textContent = `₹${balance.toFixed(2)}`;
        currentBalanceEl.style.color = balance >= 0 ? 'var(--primary-color)' : 'var(--danger-color)';
         if (document.body.classList.contains('dark-mode')) {
            currentBalanceEl.style.color = balance >= 0 ? 'var(--accent-color)' : 'var(--danger-color)';
        }
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        incomeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const source = document.getElementById('incomeSource').value.trim();
            const amount = parseFloat(document.getElementById('incomeAmount').value);
            const date = document.getElementById('incomeDate').value;
            if (source && amount > 0 && date) {
                addItem('income', { source, amount, date });
                incomeForm.reset();
                setDefaultDateInputs(); // Reset date to today after submission
            } else {
                alert('Please fill in all income fields correctly.');
            }
        });

        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const description = document.getElementById('expenseDescription').value.trim();
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const date = document.getElementById('expenseDate').value;
            if (description && amount > 0 && date) {
                addItem('expenses', { description, amount, date });
                expenseForm.reset();
                setDefaultDateInputs(); // Reset date to today
            } else {
                alert('Please fill in all expense fields correctly.');
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
        const reportTitle = `Monthly Budget Report: ${selectedMonthName} ${selectedYear}`;

        const currentMonthYearKey = `${selectedYear}-${monthFilter.value}`;
        const monthData = allData[currentMonthYearKey] || { income: [], expenses: [] };
        
        // Add Logo (if you have one as base64 or can load it)
        // For simplicity, let's skip the actual image embedding in PDF for now,
        // but you can use doc.addImage() if you have the logo as a base64 string.
        // const logoImg = new Image();
        // logoImg.src = 'logo.svg'; // This won't work directly for PDF, needs base64
        // A placeholder for where logo could go:
        // doc.setFontSize(10);
        // doc.text("Monthly Budget Tracker Logo", 14, 15);


        // Title
        doc.setFontSize(18);
        doc.text(reportTitle, 14, 22); // (text, x, y)
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        let yPos = 40; // Initial Y position for content

        // Income Table
        if (monthData.income.length > 0) {
            doc.setFontSize(14);
            doc.text("Income", 14, yPos);
            yPos += 7;
            doc.autoTable({
                startY: yPos,
                head: [['Date', 'Source', 'Amount (₹)']],
                body: monthData.income.map(item => [formatDateForDisplay(item.date), item.source, parseFloat(item.amount).toFixed(2)]),
                theme: 'striped', // 'striped', 'grid', 'plain'
                headStyles: { fillColor: [42, 157, 143] }, // --primary-color
                margin: { top: 10 }
            });
            yPos = doc.lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(12);
            doc.text("No income data for this month.", 14, yPos);
            yPos += 10;
        }
        

        // Expense Table
        if (monthData.expenses.length > 0) {
            doc.setFontSize(14);
            doc.text("Expenses", 14, yPos);
            yPos += 7;
            doc.autoTable({
                startY: yPos,
                head: [['Date', 'Description', 'Amount (₹)']],
                body: monthData.expenses.map(item => [formatDateForDisplay(item.date), item.description, parseFloat(item.amount).toFixed(2)]),
                theme: 'striped',
                headStyles: { fillColor: [38, 70, 83] }, // --secondary-color
                margin: { top: 10 }
            });
            yPos = doc.lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(12);
            doc.text("No expense data for this month.", 14, yPos);
            yPos += 10;
        }

        // Summary
        yPos = Math.max(yPos, 40); // Ensure summary doesn't overlap if tables are short
        doc.setFontSize(14);
        doc.text("Summary", 14, yPos);
        yPos += 7;
        doc.setFontSize(12);
        const totalIncome = monthData.income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = monthData.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const balance = totalIncome - totalExpenses;

        doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 14, yPos);
        yPos += 7;
        doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, 14, yPos);
        yPos += 7;
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text(`Balance: ₹${balance.toFixed(2)}`, 14, yPos);
        doc.setFont(undefined, 'normal');

        // Footer for PDF
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
            doc.text("Monthly Budget Tracker - Report", 14, doc.internal.pageSize.height - 10);
        }
        
        doc.save(`Budget_Report_${selectedMonthName}_${selectedYear}.pdf`);
    }

    // --- START THE APP ---
    initializeApp();
});