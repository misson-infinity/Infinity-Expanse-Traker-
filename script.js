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
        renderDataForSelectedMonth();
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
    
    // --- PDF GENERATION (আপনার অনুরোধ অনুযায়ী নতুন ডিজাইন) ---

    // Helper function to convert image to base64
    const imageToBase64 = (url) => {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));
    };

    async function generatePDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const logoUrl = 'vector_lecture_design.png';
            const logoBase64 = await imageToBase64(logoUrl);

            // --- নতুন হেডার ডিজাইন ---
            const pageWidth = doc.internal.pageSize.getWidth();
            const marginRight = 14;

            // ১. বাম দিকের মূল শিরোনাম
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.setTextColor('#2A9D8F'); // Primary Color
            doc.text('Infinity Expense Tracker', marginRight, 25);

            // ২. ডান দিকের লোগো এবং আপনার তথ্য (বড় ও রঙিন)
            const logoSize = 25; // ছবি বড় করা হয়েছে
            const logoX = pageWidth - marginRight - logoSize;
            doc.addImage(logoBase64, 'PNG', logoX, 15, logoSize, logoSize);
            
            const textBlockX = logoX - 5; // লেখা ও ছবির মধ্যে গ্যাপ

            // "Website Prepared by" লেখা
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(150); // হালকা ধূসর রঙ
            doc.text('Website Prepared by:', textBlockX, 20, { align: 'right' });

            // আপনার নাম (বড় এবং রঙিন)
            doc.setFontSize(14); // ফন্ট সাইজ বড় করা হয়েছে
            doc.setFont(undefined, 'bold');
            doc.setTextColor('#E76F51'); // Danger Color (একটি আকর্ষণীয় রঙ)
            doc.text('Md Habibur Rahman Mahi', textBlockX, 27, { align: 'right' });
            
            // আপনার পদবি (রঙিন এবং স্টাইলিশ)
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            doc.setTextColor('#264653'); // Secondary Color
            doc.text('Founder of Infinity Group', textBlockX, 33, { align: 'right' });

            // --- রিপোর্ট সম্পর্কিত তথ্য ---
            const selectedMonthName = monthFilter.options[monthFilter.selectedIndex].text;
            const selectedYear = yearFilter.value;
            const reportSubTitle = `Monthly Report: ${selectedMonthName} ${selectedYear}`;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);
            doc.text(reportSubTitle, marginRight, 45); // Y-অক্ষ বরাবর নিচে নামানো হয়েছে
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, marginRight, 50);

            // টেবিল শুরু করার জন্য নতুন অবস্থান
            let yPos = 60; 
            
            // --- টেবিল ও সারাংশ (অপরিবর্তিত) ---
            const currentMonthYearKey = `${selectedYear}-${monthFilter.value}`;
            const monthData = allData[currentMonthYearKey] || { income: [], expenses: [] };

            const addTable = (title, data, headers, yStart) => {
                if (data.length > 0) {
                    doc.setFontSize(14);
                    doc.text(title, marginRight, yStart);
                    doc.autoTable({
                        startY: yStart + 7,
                        head: [headers],
                        body: data,
                        theme: 'striped',
                        headStyles: { fillColor: title === "Income" ? [42, 157, 143] : [38, 70, 83] },
                        margin: { left: marginRight }
                    });
                    return doc.lastAutoTable.finalY + 10;
                }
                doc.setFontSize(12);
                doc.text(`No ${title.toLowerCase()} data for this month.`, marginRight, yStart);
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
            doc.text("Summary", marginRight, yPos);
            doc.setFontSize(12);
            doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, marginRight, yPos + 7);
            doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, marginRight, yPos + 14);
            doc.setFont(undefined, 'bold');
            doc.text(`Final Balance: ₹${balance.toFixed(2)}`, marginRight, yPos + 21);
            
            doc.save(`Infinity_Report_${selectedMonthName}_${selectedYear}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Could not generate PDF. Make sure 'vector_lecture_design.png' is in the folder.");
        }
    }

    initializeApp();
});