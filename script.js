const form = document.getElementById('form');
const list = document.getElementById('list');
const balance = document.getElementById('balance');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const monthFilter = document.getElementById('monthFilter');

const pieCanvas = document.getElementById('pieChart');
const barCanvas = document.getElementById('barChart');

const aiBtn = document.getElementById('aiBtn');
const aiResult = document.getElementById('aiResult');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

/* Months */
const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

months.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = m;
    monthFilter.appendChild(opt);
});

monthFilter.value = new Date().getMonth();

/* Categories */
const categories = {
    income: ["Salary","Freelance","Business","Investment","Bonus"],
    expense: ["Food","Rent","Groceries","Travel","Bills","Shopping","Entertainment","Health","Education","EMI","Others"]
};

function updateCategories() {
    const type = typeSelect.value;
    categorySelect.innerHTML = "";

    categories[type].forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        categorySelect.appendChild(opt);
    });
}

typeSelect.addEventListener('change', updateCategories);

/* Format Date-Time */
function formatDateTime(dateString) {
    const d = new Date(dateString);

    const datePart = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const timePart = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return `${datePart} • ${timePart}`;
}

/* Add Transaction */
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = document.getElementById('text').value.trim();
    let amount = document.getElementById('amount').value;
    const dateInput = document.getElementById('date').value;

    if (text === "" || amount === "" || isNaN(amount) || dateInput === "") {
        alert("Enter valid data");
        return;
    }

    amount = Number(amount);
    const type = typeSelect.value;
    const category = categorySelect.value;

    // Combine date + current time
    const now = new Date();
    const date = new Date(dateInput);
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    if (type === "expense") amount = -Math.abs(amount);
    else amount = Math.abs(amount);

    const transaction = {
        id: Date.now(),
        text,
        amount,
        category,
        type,
        date
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    form.reset();
    updateCategories();
    init();
});

/* Delete */
list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = Number(e.target.dataset.id);
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        init();
    }
});

/* Charts */
let pieChart, barChart;

function renderCharts(data) {
    const map = {};

    data.filter(t => t.type === 'expense').forEach(t => {
        map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });

    const labels = Object.keys(map);
    const values = Object.values(map);

    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();

    pieChart = new Chart(pieCanvas, {
        type: 'pie',
        data: { labels, datasets: [{ data: values }] }
    });

    barChart = new Chart(barCanvas, {
        type: 'bar',
        data: { labels, datasets: [{ data: values }] }
    });
}

/* Init */
function init() {
    list.innerHTML = "";

    const selectedMonth = Number(monthFilter.value);

    const filtered = transactions.filter(t =>
        new Date(t.date).getMonth() === selectedMonth
    );

    // Latest first
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(t => {
        const li = document.createElement('li');

        li.innerHTML = `
            <div>
                <strong>${t.text}</strong> (${t.category}) <br>
                <small>${formatDateTime(t.date)}</small>
            </div>
            <div>
                ₹${t.amount}
                <button class="delete-btn" data-id="${t.id}">x</button>
            </div>
        `;

        list.appendChild(li);
    });

    const total = filtered.reduce((acc, t) => acc + t.amount, 0);
    balance.innerText = `₹${total}`;

    renderCharts(filtered);
}

monthFilter.addEventListener('change', init);

/* AI Insights */
aiBtn.addEventListener('click', () => {
    const selectedMonth = Number(monthFilter.value);

    const filtered = transactions.filter(t =>
        new Date(t.date).getMonth() === selectedMonth
    );

    const expenses = filtered.filter(t => t.type === 'expense');

    if (expenses.length === 0) {
        aiResult.innerText = "No expense data for this month.";
        return;
    }

    const map = {};
    expenses.forEach(t => {
        map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });

    let maxCat = "";
    let maxVal = 0;

    for (let cat in map) {
        if (map[cat] > maxVal) {
            maxVal = map[cat];
            maxCat = cat;
        }
    }

    const totalExpense = expenses.reduce((acc, t) => acc + Math.abs(t.amount), 0);

    let msg = `You spent most on ${maxCat} (₹${maxVal}). `;

    if (maxVal > totalExpense * 0.4) {
        msg += "⚠️ Try to reduce spending here.";
    } else {
        msg += "✅ Spending looks balanced.";
    }

    aiResult.innerText = msg;
});

/* Start */
updateCategories();
init();