document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements - Auth
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const adminContainer = document.getElementById('admin-container');
    
    const authForm = document.getElementById('auth-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');
    
    const welcomeMsg = document.getElementById('welcome-msg');
    const logoutBtn = document.getElementById('logout-btn');
    
    // UI Elements - App (Calendar)
    const calendarSection = document.querySelector('.calendar-section');
    const calendarDays = document.getElementById('calendar-days');
    const monthYearDisplay = document.getElementById('month-year-display');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    // UI Elements - App (Editor)
    const editorSection = document.getElementById('editor-section');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const tabEdit = document.getElementById('tab-edit');
    const tabPreview = document.getElementById('tab-preview');
    const markdownInput = document.getElementById('markdown-input');
    const markdownPreview = document.getElementById('markdown-preview');
    const saveStatus = document.getElementById('save-status');
    const navCalendarBtn = document.getElementById('nav-calendar-btn');
    const mainLayout = document.querySelector('.main-layout');

    // UI Elements - Admin
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const createUserForm = document.getElementById('create-user-form');
    const userTableBody = document.getElementById('user-table-body');
    const adminStatus = document.getElementById('admin-status');

    // Theme Toggle Logic
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const savedTheme = localStorage.getItem('galender_theme') || 'light';
    
    const iconSun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    const iconMoon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtns.forEach(btn => btn.innerHTML = iconSun);
    } else {
        themeToggleBtns.forEach(btn => btn.innerHTML = iconMoon);
    }

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('galender_theme', 'light');
                themeToggleBtns.forEach(b => b.innerHTML = iconMoon);
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('galender_theme', 'dark');
                themeToggleBtns.forEach(b => b.innerHTML = iconSun);
            }
        });
    });

    let currentUser = null;
    let currentDate = new Date(); // Tracks the currently viewing month/year
    let selectedDateString = null; // YYYY-MM-DD
    let notesData = new Set(); // Stores dates with notes: 'YYYY-MM-DD'

    // Init Editor State
    markdownInput.disabled = true;
    markdownInput.placeholder = "Select a date from the calendar to view or edit notes...";

    // Init App
    const token = localStorage.getItem('galender_token');
    const savedUser = localStorage.getItem('galender_user');
    if (token) {
        currentUser = savedUser || 'User';
        if (currentUser === 'admin') {
            showAdminPanel();
        } else {
            showApp();
        }
    }

    /* -------------------------------------------------------------
       AUTHENTICATION logic
    -------------------------------------------------------------- */
    function hideMessages() {
        errorMsg.classList.add('hidden'); successMsg.classList.add('hidden');
    }
    function showMessage(element, text) {
        element.textContent = text; element.classList.remove('hidden');
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        await handleLogin(username, password);
    });

    async function handleLogin(username, password) {
        try {
            submitBtn.textContent = 'Signing in...'; submitBtn.disabled = true;

            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Login failed');

            localStorage.setItem('galender_token', data.access_token);
            localStorage.setItem('galender_user', username);
            currentUser = username;
            
            showMessage(successMsg, 'Login successful!');
            setTimeout(() => { 
                if (currentUser === 'admin') showAdminPanel();
                else showApp();
            }, 500);

        } catch (error) {
            showMessage(errorMsg, error.message);
        } finally {
            submitBtn.textContent = 'Sign In'; submitBtn.disabled = false;
        }
    }

    function doLogout() {
        localStorage.removeItem('galender_token');
        localStorage.removeItem('galender_user');
        window.location.reload();
    }
    
    logoutBtn.addEventListener('click', doLogout);
    adminLogoutBtn.addEventListener('click', doLogout);

    /* -------------------------------------------------------------
       ADMIN Logic
    -------------------------------------------------------------- */
    function showAdminStatus(msg, isError=false) {
        adminStatus.textContent = msg;
        adminStatus.className = 'status-msg show ' + (isError ? 'error' : 'success');
        setTimeout(() => adminStatus.classList.remove('show'), 3000);
    }
    
    function showAdminPanel() {
        authContainer.classList.add('hidden');
        appContainer.classList.add('hidden');
        adminContainer.classList.remove('hidden');
        loadUsers();
    }

    async function loadUsers() {
        try {
            const token = localStorage.getItem('galender_token');
            const res = await fetch('/api/auth/users', { headers: { 'Authorization': `Bearer ${token}` }});
            if (!res.ok) throw new Error("Failed to fetch users");
            
            const users = await res.json();
            userTableBody.innerHTML = '';
            
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td><strong>${u.username}</strong></td>
                    <td>
                        <button class="action-btn btn-warning" onclick="window.changePassword('${u.username}')">Change Password</button>
                        ${u.username !== 'admin' ? `<button class="action-btn btn-danger" onclick="window.deleteUser('${u.username}')">Delete User</button>` : ''}
                    </td>
                `;
                userTableBody.appendChild(tr);
            });
        } catch (e) {
            showAdminStatus(e.message, true);
        }
    }

    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const btn = createUserForm.querySelector('button');
        btn.disabled = true;
        try {
            const token = localStorage.getItem('galender_token');
            const res = await fetch('/api/auth/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) {
                const err = await res.json(); throw new Error(err.detail || "Failed to create");
            }
            showAdminStatus("User created successfully!");
            document.getElementById('new-username').value = '';
            document.getElementById('new-password').value = '';
            loadUsers();
        } catch (e) {
            showAdminStatus(e.message, true);
        } finally {
            btn.disabled = false;
        }
    });

    window.deleteUser = async (username) => {
        if (!confirm(`Are you sure you want to delete '${username}'? ALL their markdown notes will be securely archived.`)) return;
        try {
            const token = localStorage.getItem('galender_token');
            const res = await fetch(`/api/auth/users/${username}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Deletion failed");
            showAdminStatus(`User ${username} deleted and archived.`);
            loadUsers();
        } catch(e) { showAdminStatus(e.message, true); }
    };

    window.changePassword = async (username) => {
        const newPass = prompt(`Enter new password for ${username}:`);
        if (!newPass) return;
        try {
            const token = localStorage.getItem('galender_token');
            const res = await fetch(`/api/auth/users/${username}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: newPass })
            });
            if (!res.ok) throw new Error("Password change failed");
            showAdminStatus(`Password updated for ${username}.`);
        } catch(e) { showAdminStatus(e.message, true); }
    };

    /* -------------------------------------------------------------
       APPLICATION Logic (Calendar & Editor)
    -------------------------------------------------------------- */
    function showApp() {
        authContainer.classList.add('hidden');
        adminContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        welcomeMsg.textContent = `Welcome, ${currentUser}`;
        
        switchView('calendar');
        fetchNotesList().then(() => { renderCalendar(currentDate); });
    }

    function formatDateString(year, month, day) {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    }

    async function fetchNotesList() {
        try {
            const token = localStorage.getItem('galender_token');
            const res = await fetch('/api/notes/', { headers: { 'Authorization': `Bearer ${token}` }});
            if (res.ok) {
                const data = await res.json();
                notesData.clear();
                data.forEach(n => notesData.add(n.date));
            } else if (res.status === 401) {
                doLogout();
            }
        } catch (error) { console.error('Failed to fetch', error); }
    }

    function renderCalendar(date) {
        calendarDays.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday start: Sunday(0) -> 6, Monday(1) -> 0, etc.
        const emptyCells = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < emptyCells; i++) {
            const div = document.createElement('div');
            div.classList.add('day-cell', 'empty');
            calendarDays.appendChild(div);
        }

        const todayRaw = new Date();
        const todayStr = formatDateString(todayRaw.getFullYear(), todayRaw.getMonth(), todayRaw.getDate());

        for (let day = 1; day <= daysInMonth; day++) {
            const div = document.createElement('div');
            div.classList.add('day-cell');
            div.textContent = day;
            
            const fullDateStr = formatDateString(year, month, day);
            const dateObj = new Date(year, month, day);
            const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
            
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                div.classList.add('weekend');
            }

            if (fullDateStr === todayStr) div.classList.add('today');
            if (notesData.has(fullDateStr)) div.classList.add('has-note');
            if (fullDateStr === selectedDateString) div.classList.add('active');

            div.addEventListener('click', () => {
                document.querySelectorAll('.day-cell.active').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                openEditor(fullDateStr, `${monthNames[month]} ${String(day).padStart(2,'0')}, ${year}`);
            });

            calendarDays.appendChild(div);
        }
    }

    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });

    /* -------------------------------------------------------------
       EDITOR Logic
    -------------------------------------------------------------- */
    async function openEditor(dateStr, displayDateStr) {
        selectedDateString = dateStr;
        selectedDateDisplay.textContent = displayDateStr;
        switchView('editor');
        
        tabEdit.click();
        markdownInput.value = 'Loading...'; markdownInput.disabled = true;

        try {
            const token = localStorage.getItem('galender_token');
            const res = await fetch(`/api/notes/${dateStr}`, { headers: { 'Authorization': `Bearer ${token}` }});
            
            if (res.ok) {
                const data = await res.json();
                markdownInput.value = data.content;
                tabPreview.click();
            } else if (res.status === 404) {
                markdownInput.value = ''; tabEdit.click();
            } else if (res.status === 401) { doLogout(); } 
            else { throw new Error('Load failed'); }
        } catch (error) { markdownInput.value = 'Error loading note.'; } 
        finally { markdownInput.disabled = false; markdownInput.focus(); }
    }

    tabEdit.addEventListener('click', () => {
        tabEdit.classList.add('active'); tabPreview.classList.remove('active');
        markdownInput.classList.remove('hidden'); markdownPreview.classList.add('hidden');
    });

    tabPreview.addEventListener('click', () => {
        tabPreview.classList.add('active'); tabEdit.classList.remove('active');
        markdownInput.classList.add('hidden'); markdownPreview.classList.remove('hidden');
        markdownPreview.innerHTML = marked.parse(markdownInput.value);
    });

    function switchView(view) {
        if (view === 'calendar') {
            editorSection.classList.add('hidden-pane');
            calendarSection.classList.remove('hidden-pane');
        } else if (view === 'editor') {
            calendarSection.classList.add('hidden-pane');
            editorSection.classList.remove('hidden-pane');
        }
    }

    if (navCalendarBtn) navCalendarBtn.addEventListener('click', () => switchView('calendar'));
    
    selectedDateDisplay.addEventListener('click', () => {
        switchView('calendar');
    });

    let saveTimeout;
    let fadeOutTimeout;

    const autoSave = async () => {
        if (!selectedDateString) return;
        try {
            saveStatus.textContent = 'Saving...';
            saveStatus.className = 'status-msg show';
            const content = markdownInput.value;
            const token = localStorage.getItem('galender_token');
            
            const res = await fetch(`/api/notes/${selectedDateString}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: content })
            });

            if (!res.ok) throw new Error('Failed to save');
            
            saveStatus.textContent = 'Saved!'; 
            saveStatus.className = 'status-msg show success';
            
            clearTimeout(fadeOutTimeout);
            fadeOutTimeout = setTimeout(() => saveStatus.classList.remove('show'), 2000);
            
            if (!notesData.has(selectedDateString) && content.trim() !== '') {
                notesData.add(selectedDateString); renderCalendar(currentDate);
            }
        } catch (error) { 
            saveStatus.textContent = 'Error: ' + error.message;
            saveStatus.className = 'status-msg show error';
        }
    };

    markdownInput.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveStatus.textContent = 'Typing...';
        saveStatus.className = 'status-msg show';
        saveTimeout = setTimeout(autoSave, 1500); 
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            clearTimeout(saveTimeout);
            autoSave();
        }
    });
});
