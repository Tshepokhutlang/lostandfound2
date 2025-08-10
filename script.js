// === SECTION: STATE DEFINITION ===
const state = {
    currentUser: null,
    items: [
        {
           
        },
        {
           
        }
    ],
    users: [
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'user' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'user' },
        { id: 3, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'admin', password: 'admin123' }
    ]
};
// === SECTION: DOM ELEMENT REFERENCES ===
const navLinksEl = document.getElementById('navLinks');
const toastEl = document.getElementById('toast');
// === SECTION: PAGE MAPPING ===
const pages = {
    home: document.getElementById('homePage'),
    login: document.getElementById('loginPage'),
    register: document.getElementById('registerPage'),
    report: document.getElementById('reportPage'),
    myItems: document.getElementById('myItemsPage'),
    admin: document.getElementById('adminPage')
};

function showPage(page) {
    Object.values(pages).forEach(p => p.classList.add('hidden'));
    pages[page].classList.remove('hidden');
}
// === SECTION: NAVIGATION & UI FUNCTIONS ===
function showToast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.style.backgroundColor = isError ? '#e74c3c' : '#2c3e50';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
    if (!isError) {
        new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3')
            .play().catch(() => {});
    }
}

function updateNavigation() {
    navLinksEl.innerHTML = '';
    const links = state.currentUser
        ? (state.currentUser.role === 'admin'
            ? [{ text: 'Admin', page: 'admin' }, { text: 'Logout', page: 'logout' }]
            : [{ text: 'Report Item', page: 'report' }, { text: 'My Items', page: 'myItems' }, { text: 'Logout', page: 'logout' }])
        : [{ text: 'Home', page: 'home' }, { text: 'Login', page: 'login' }, { text: 'Register', page: 'register' }];

    links.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = link.text;
        a.onclick = () => {
            if (link.page === 'logout') logout();
            else {
                showPage(link.page);
                if (link.page === 'home') loadItems();
                if (link.page === 'myItems') loadMyItems();
                if (link.page === 'admin') loadAdminData();
            }
        };
        li.appendChild(a);
        navLinksEl.appendChild(li);
    });
}
// === SECTION: AUTHENTICATION FUNCTIONS ===
function login(email, password) {
    const user = state.users.find(u =>
        u.email === email &&
        (u.password === password || (email === 'admin@example.com' && password === 'admin123'))
    );
    if (user) {
        state.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateNavigation();
        showToast('Welcome back!');
        showPage(user.role === 'admin' ? 'admin' : 'home');
        loadItems();
    } else {
        showToast('Invalid credentials', true);
    }
}

function register(firstName, lastName, email, password) {
    if (state.users.some(u => u.email === email)) {
        showToast('Email already exists!', true);
        return;
    }
    const newUser = {
        id: state.users.length + 1,
        firstName, lastName, email, password, role: 'user'
    };
    state.users.push(newUser);
    state.currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    updateNavigation();
    showToast('Account created!');
    showPage('home');
    loadItems();
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    updateNavigation();
    showToast('You’ve been logged out.');
    showPage('home');
    loadItems();
}

// === SECTION: ITEM DISPLAY & FILTERING ===
function loadItems() {
    const itemListEl = document.getElementById('itemList');
    const filtered = filterItems(true);
    itemListEl.innerHTML = filtered.map(item => `
        <div class="card">
            <h3>${item.name} <span class="badge badge-${item.status}">${item.status}</span></h3>
            ${item.image ? `<img src="${item.image}" alt="Item" class="item-image">` : ''}
            <p><strong>Category:</strong> ${item.category}</p>
            <p>${item.description}</p>
            <p><strong>Reported by:</strong> ${item.owner}</p>
            <p><strong>Date:</strong> ${item.date}</p>
            ${item.location ? `<p><strong>Location:</strong> ${item.location}</p>` : ''}
        </div>
    `).join('');
}


function filterItems(returnOnly = false) {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const filtered = state.items.filter(item =>
        (item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query))
    ).filter(item => !status || item.status === status);
    if (returnOnly) return filtered;
    loadItems();
}
// === SECTION: MY ITEMS MANAGEMENT ===
function loadMyItems() {
    const userFullName = `${state.currentUser.firstName} ${state.currentUser.lastName}`;
    const myItems = state.items.filter(item => item.owner === userFullName);
    const myItemListEl = document.getElementById('myItemList');
    myItemListEl.innerHTML = myItems.length > 0
        ? myItems.map(item => `
            <div class="card">
                <h3>${item.name} <span class="badge badge-${item.status}">${item.status}</span></h3>
                <p><strong>Category:</strong> ${item.category}</p>
                <p>${item.description}</p>
                <p><strong>Date:</strong> ${item.date}</p>
                <p><strong>Location:</strong> ${item.location}</p>
                <div class="mt-1">
                    <button class="btn" onclick="printFlier(${item.id})"><i class="fas fa-print"></i> Print Flier</button>
                    <button class="btn" onclick="editItem(${item.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `).join('')
        : '<p>You haven’t reported any items yet.</p>';
}

window.printFlier = function(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Flier - ${item.name}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; }
                .header { text-align: center; border-bottom: 2px solid #5b42f5; padding-bottom: 10px; }
                .header h1 { color: #5b42f5; }
                .item-image { width: 100%; height: 200px; object-fit: cover; margin: 15px 0; background: #f0f0f0; }
                .detail { margin: 10px 0; font-size: 1.1em; }
                .btn { display: block; width: 100%; padding: 10px; background: #5b42f5; color: white; text-align: center; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Found Item Alert!</h1>
                <p>If this is yours, please contact us.</p>
            </div>
            <h2>${item.name}</h2>
            ${item.image ? `<img src="${item.image}" class="item-image">` : '<div class="item-image">[Image Not Available]</div>'}
            <div class="detail"><strong>Status:</strong> ${item.status}</div>
            <div class="detail"><strong>Description:</strong> ${item.description}</div>
            <div class="detail"><strong>Location:</strong> ${item.location}</div>
            <div class="detail"><strong>Date:</strong> ${item.date}</div>
            <a href="#" class="btn" onclick="window.print()">Print This Flier</a>
        </body>
        </html>
    `);
    printWindow.document.close();
};
// === SECTION: REPORTING & ITEM ACTIONS ===
function reportItem(name, description, status) {
    const fileInput = document.getElementById('itemImage');
    let image = null;
    if (fileInput?.files[0]) {
        image = URL.createObjectURL(fileInput.files[0]);
    }
    const location = document.getElementById('location').value;
    const category = document.getElementById('category').value;
    const newItem = {
        id: Date.now(),
        name, description, status,
        owner: `${state.currentUser.firstName} ${state.currentUser.lastName}`,
        date: new Date().toISOString().split('T')[0],
        image,
        location: location || 'Not specified',
        category
    };
    state.items.unshift(newItem);
    checkForMatches(newItem);
    showToast('Item reported successfully!');
    showPage('home');
    loadItems();
}

function checkForMatches(newItem) {
    const possibleMatches = state.items.filter(item =>
        item.status !== newItem.status &&
        (item.name.toLowerCase().includes(newItem.name.toLowerCase()) ||
         newItem.description.toLowerCase().includes(item.name.toLowerCase()))
    );
    if (possibleMatches.length > 0) {
        showToast(`Match alert: ${possibleMatches.length} potential match(es) found! Check your email.`, false);
    }
}

// === SECTION: DATA EXPORT & ADMIN UTILS ===
function exportData() {
    const csv = [
        ['Name', 'Description', 'Status', 'Owner', 'Date', 'Location', 'Category'].join(','),
        ...state.items.map(i => [i.name, i.description, i.status, i.owner, i.date, i.location, i.category].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lostings-items-export.csv';
    a.click();
}

function init() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) state.currentUser = JSON.parse(savedUser);
    updateNavigation();
    showPage('home');
    loadItems();


    document.getElementById('loginForm').onsubmit = e => {
        e.preventDefault();
        login(
            document.getElementById('email').value,
            document.getElementById('password').value
        );
    };

    document.getElementById('registerForm').onsubmit = e => {
        e.preventDefault();
        register(
            document.getElementById('firstName').value,
            document.getElementById('lastName').value,
            document.getElementById('regEmail').value,
            document.getElementById('regPassword').value
        );
    };

    document.getElementById('itemForm').onsubmit = e => {
        e.preventDefault();
        reportItem(
            document.getElementById('itemName').value,
            document.getElementById('itemDescription').value,
            document.querySelector('input[name="status"]:checked').value
        );
    };

    document.getElementById('showRegister').onclick = e => {
        e.preventDefault();
        showPage('register');
    };

    document.getElementById('showLogin').onclick = e => {
        e.preventDefault();
        showPage('login');
    };

    document.getElementById('searchInput')?.addEventListener('input', filterItems);
    document.getElementById('filterStatus')?.addEventListener('change', filterItems);
}
// === SECTION: EDIT, DELETE & ADMIN FUNCTIONS ===
window.editItem = function(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById(item.status === 'lost' ? 'statusLost' : 'statusFound').checked = true;
    document.getElementById('location').value = item.location;
    document.getElementById('category').value = item.category;

    const form = document.getElementById('itemForm');
    form.onsubmit = e => {
        e.preventDefault();
        const name = document.getElementById('itemName').value;
        const desc = document.getElementById('itemDescription').value;
        const status = document.querySelector('input[name="status"]:checked').value;
        const location = document.getElementById('location').value;
        const category = document.getElementById('category').value;
        Object.assign(item, { name, description: desc, status, location, category });
        showToast('Item updated!');
        showPage('myItems');
        loadMyItems();
    };
    form.querySelector('button').textContent = 'Update Item';
    showPage('report');
};


window.deleteItem = function(id) {
    if (confirm('Delete this item?')) {
        state.items = state.items.filter(i => i.id !== id);
        showToast('Item deleted.');
        loadMyItems();
    }
};

window.adminDeleteItem = function(id) {
    if (confirm('Delete this item permanently?')) {
        state.items = state.items.filter(i => i.id !== id);
        showToast('Item removed.');
        loadAdminData();
    }
};

window.deleteUser = function(id) {
    if (id === state.currentUser.id) return alert("You can't delete yourself.");
    if (confirm('Delete this user?')) {
        state.users = state.users.filter(u => u.id !== id);
        showToast('User deleted.');
        loadAdminData();
    }
};

window.loadAdminData = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;

    const usersTableEl = document.querySelector('#usersTable tbody');
    usersTableEl.innerHTML = state.users.map(u => `
        <tr>
            <td>${u.firstName} ${u.lastName}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>${u.id !== state.currentUser.id ? `<button class="btn btn-danger" onclick="deleteUser(${u.id})">Delete</button>` : 'Current User'}</td>
        </tr>
    `).join('');

    const adminItemListEl = document.getElementById('adminItemList');
    adminItemListEl.innerHTML = state.items.map(item => `
        <div class="card">
            <h3>${item.name} <span class="badge badge-${item.status}">${item.status}</span></h3>
            <p><strong>Category:</strong> ${item.category}</p>
            <p>${item.description}</p>
            <p><strong>Owner:</strong> ${item.owner}</p>
            <p><strong>Date:</strong> ${item.date}</p>
            <button class="btn btn-danger" onclick="adminDeleteItem(${item.id})">Delete</button>
        </div>
    `).join('');
};


init();
