// ===== AUTHENTICATION MODULE (SECURED) =====

const AuthManager = {
    currentUser: null,
    sessionToken: null,
    rememberMe: false,

    init() {
        // Load user from secure storage
        this.loadSession();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Handle auth state on page load
        this.handleAuthState();
    },

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                // Remove inline handler and use addEventListener
                loginForm.removeAttribute('onsubmit');
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin(e);
                });
            }
        });
    },

    handleAuthState() {
        if (this.currentUser) {
            document.getElementById('authContainer')?.classList.add('hidden');
            document.getElementById('mainDashboard')?.classList.remove('hidden');
            this.updateWelcomeMessage();
            
            // Show user menu button
            const userMenuContainer = document.getElementById('userMenuContainer');
            if (userMenuContainer) {
                userMenuContainer.style.display = 'block';
            }
            
            // Update dropdown user name
            const dropdownUserName = document.getElementById('dropdownUserName');
            if (dropdownUserName && this.currentUser) {
                dropdownUserName.textContent = this.currentUser.name || 'User';
            }
        } else {
            document.getElementById('authContainer')?.classList.remove('hidden');
            document.getElementById('mainDashboard')?.classList.add('hidden');
            
            // Hide user menu button
            const userMenuContainer = document.getElementById('userMenuContainer');
            if (userMenuContainer) {
                userMenuContainer.style.display = 'none';
            }
        }
        
        // Setup click outside listener
        this.setupClickOutsideListener();
    },

    setupClickOutsideListener() {
        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('userDropdown');
            const userMenuBtn = document.getElementById('userMenuBtn');
            
            if (dropdown && dropdown.style.display === 'block') {
                if (!dropdown.contains(event.target) && !userMenuBtn.contains(event.target)) {
                    dropdown.style.display = 'none';
                }
            }
        });
    },

    async handleLogin(event) {
        event.preventDefault();
        event.stopPropagation();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            NotificationSystem.error('Form elements not found');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validate inputs
        if (!email || !password) {
            NotificationSystem.error('Please fill in all fields');
            return;
        }

        // Validate email format
        if (!SecurityUtils.validateEmail(email)) {
            NotificationSystem.error('Please enter a valid email address');
            return;
        }

        // Rate limiting check
        const rateLimitKey = `login_${email}`;
        if (!SecurityUtils.rateLimiter.isAllowed(rateLimitKey)) {
            NotificationSystem.error('Too many login attempts. Please wait a minute.');
            return;
        }

        try {
            // Attempt login
            const result = await this.login(email, password);
            
            if (result.success) {
                this.currentUser = result.user;
                this.sessionToken = result.token;
                
                // Store session securely
                this.saveSession(result.user, result.token);
                
                // Update UI
                this.handleAuthState();
                this.updateWelcomeMessage();
                
                // Clear form
                emailInput.value = '';
                passwordInput.value = '';
                
                NotificationSystem.success('Login successful! Welcome back!', 3000);
            }
        } catch (error) {
            NotificationSystem.error(error.message || 'Login failed');
        }
    },

    async login(email, password) {
        // Get users from secure storage
        const users = DataManager.get(DataManager.STORAGE_KEYS.USER + '_list', []);
        
        // Find user by email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password (in production, use proper password hashing)
        // For demo, we use simple hash comparison
        const passwordHash = SecurityUtils.simpleHash(password);
        if (user.passwordHash !== passwordHash) {
            throw new Error('Invalid email or password');
        }

        // Generate session token
        const token = SecurityUtils.generateToken(64);

        // Return user without password data
        const { passwordHash: _, ...safeUser } = user;
        
        return {
            success: true,
            user: safeUser,
            token: token
        };
    },

    async handleSignup(event) {
        event.preventDefault();
        event.stopPropagation();

        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const confirmPasswordInput = document.getElementById('signupConfirmPassword');

        if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
            NotificationSystem.error('Form elements not found');
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate inputs
        if (!name || !email || !password) {
            NotificationSystem.error('Please fill in all fields');
            return;
        }

        // Validate email
        if (!SecurityUtils.validateEmail(email)) {
            NotificationSystem.error('Please enter a valid email address');
            return;
        }

        // Validate password strength
        const passwordValidation = SecurityUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
            NotificationSystem.warning('Password should be stronger');
        }

        // Check password match
        if (password !== confirmPassword) {
            NotificationSystem.error('Passwords do not match');
            return;
        }

        // Check minimum length
        if (password.length < 6) {
            NotificationSystem.error('Password must be at least 6 characters');
            return;
        }

        // Rate limiting
        const rateLimitKey = `signup_${email}`;
        if (!SecurityUtils.rateLimiter.isAllowed(rateLimitKey)) {
            NotificationSystem.error('Too many signup attempts. Please wait.');
            return;
        }

        try {
            const result = await this.register({ name, email, password });
            
            if (result.success) {
                this.currentUser = result.user;
                this.sessionToken = result.token;
                this.saveSession(result.user, result.token);
                
                // Update UI
                this.handleAuthState();
                this.updateWelcomeMessage();
                
                // Clear forms
                nameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
                
                NotificationSystem.success('Account created! Welcome to LifeOS!', 3000);
            }
        } catch (error) {
            NotificationSystem.error(error.message || 'Registration failed');
        }
    },

    async register(data) {
        const users = DataManager.get(DataManager.STORAGE_KEYS.USER + '_list', []);
        
        // Check if email exists
        if (users.some(u => u.email === data.email)) {
            throw new Error('Email already registered');
        }

        // Hash password
        const passwordHash = SecurityUtils.simpleHash(data.password);

        // Create new user
        const newUser = {
            id: `user_${Date.now()}_${SecurityUtils.generateToken(8)}`,
            email: data.email,
            name: SecurityUtils.sanitizeInput(data.name),
            passwordHash: passwordHash,
            preferences: {
                theme: 'dark',
                language: 'en',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to storage
        users.push(newUser);
        DataManager.set(DataManager.STORAGE_KEYS.USER + '_list', users);

        // Generate token
        const token = SecurityUtils.generateToken(64);

        // Return without password
        const { passwordHash: _, ...safeUser } = newUser;
        
        return {
            success: true,
            user: safeUser,
            token: token
        };
    },

    saveSession(user, token) {
        // Store session data securely
        const sessionData = {
            user: user,
            token: token,
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };
        
        SecurityUtils.secureStorage.set(DataManager.STORAGE_KEYS.USER, sessionData);
    },

    loadSession() {
        const session = SecurityUtils.secureStorage.get(DataManager.STORAGE_KEYS.USER);
        
        if (session) {
            // Check if session is expired
            if (session.expiresAt && Date.now() > session.expiresAt) {
                this.logout();
                return false;
            }
            
            this.currentUser = session.user;
            this.sessionToken = session.token;
            return true;
        }
        
        return false;
    },

    logout() {
        // Clear session
        this.currentUser = null;
        this.sessionToken = null;
        
        // Remove from secure storage
        SecurityUtils.secureStorage.remove(DataManager.STORAGE_KEYS.USER);
        
        // Note: We don't clear tasks, transactions, moods on logout
        // as they're stored locally and should persist
        
        // Update UI
        this.handleAuthState();
        
        NotificationSystem.info('Logged out successfully');
    },

    handleLogout() {
        this.logout();
    },

    showSignup() {
        const authContainer = document.getElementById('authContainer');
        const loginForm = document.getElementById('loginForm');
        
        if (loginForm) {
            loginForm.style.display = 'none';
        }

        let signupForm = document.getElementById('signupForm');
        if (!signupForm) {
            const signupHTML = `
                <form class="auth-form" id="signupForm">
                    <input type="text" placeholder="Full Name" id="signupName" required minlength="2" maxlength="50">
                    <input type="email" placeholder="Email" id="signupEmail" required>
                    <input type="password" placeholder="Password" id="signupPassword" required minlength="6">
                    <input type="password" placeholder="Confirm Password" id="signupConfirmPassword" required>
                    <button type="submit" data-i18n="signup">Sign Up</button>
                </form>
                <p style="text-align: center; margin-top: 1rem;">
                    <span data-i18n="haveAccount">Already have an account?</span>
                    <a href="#" onclick="AuthManager.showLogin(); return false;" style="color: var(--accent-primary);" data-i18n="loginLink">Login</a>
                </p>
            `;
            
            if (authContainer) {
                authContainer.innerHTML = signupHTML;
                
                signupForm = document.getElementById('signupForm');
                if (signupForm) {
                    signupForm.addEventListener('submit', (e) => this.handleSignup(e));
                }
            }
        }
    },

    showLogin() {
        const authContainer = document.getElementById('authContainer');
        
        const loginHTML = `
            <h2 style="text-align: center; margin-bottom: 2rem;" data-i18n="welcomeBack">Welcome Back!</h2>
            <form class="auth-form" id="loginForm">
                <input type="email" placeholder="Email" id="email" required>
                <input type="password" placeholder="Password" id="password" required>
                <button type="submit" data-i18n="login">Login</button>
            </form>
            <p style="text-align: center; margin-top: 1rem;">
                <span data-i18n="noAccount">Don't have an account?</span>
                <a href="#" onclick="AuthManager.showSignup(); return false;" style="color: var(--accent-primary);" data-i18n="signup">Sign up</a>
            </p>
        `;
        
        if (authContainer) {
            authContainer.innerHTML = loginHTML;
            
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
        }
    },

    toggleAuth() {
        if (this.currentUser) {
            this.showUserMenu();
        } else {
            this.showLogin();
        }
    },

    toggleUserMenu(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        const userName = document.getElementById('dropdownUserName');
        
        if (!dropdown) return;
        
        // Update user name in dropdown
        if (userName && this.currentUser) {
            userName.textContent = this.currentUser.name || 'User';
        }
        
        // Toggle dropdown visibility
        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    },

    closeUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    },

    showUserMenu() {
        // This function is now handled by toggleUserMenu
        this.toggleUserMenu(event);
    },

    updateWelcomeMessage() {
        if (this.currentUser) {
            const welcomeEl = document.querySelector('[data-i18n="welcomeMessage"]');
            if (welcomeEl) {
                welcomeEl.textContent = `Welcome back, ${SecurityUtils.escapeHtml(this.currentUser.name)}! 👋`;
            }
        }
    },

    viewProfile() {
        if (!this.currentUser) return;
        
        // Get user stats
        const tasks = DataManager.getData('tasks') || [];
        const completedTasks = tasks.filter(t => t.completed).length;
        const transactions = DataManager.getData('transactions') || [];
        const moods = DataManager.getData('moods') || [];
        
        ModalManager.create({
            id: 'profile-modal',
            title: 'My Profile',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 80px; margin-bottom: 20px;">
                        <i class="fas fa-user-circle" style="color: var(--accent-primary);"></i>
                    </div>
                    <h3 style="margin-bottom: 5px;">${SecurityUtils.escapeHtml(this.currentUser.name)}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 5px;">${SecurityUtils.escapeHtml(this.currentUser.email)}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">
                        <i class="fas fa-calendar"></i> Member since: ${this.currentUser.createdAt ? new Date(this.currentUser.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    
                    <!-- User Stats -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; padding: 15px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: 700; color: var(--accent-primary);">${tasks.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Total Tasks</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${completedTasks}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Completed</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${moods.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Mood Entries</div>
                        </div>
                    </div>
                    
                    <!-- Edit Profile Section -->
                    <div style="margin-top: 20px; text-align: left;">
                        <h4 style="margin-bottom: 15px; color: var(--text-primary);"><i class="fas fa-edit"></i> Edit Profile</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <input type="text" id="editProfileName" placeholder="Your Name" value="${SecurityUtils.escapeHtml(this.currentUser.name || '')}" 
                                style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
                            <button onclick="AuthManager.updateProfile()" class="btn-primary" style="width: 100%;">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            `,
            size: 'medium',
            buttons: [{
                id: 'close',
                text: 'Close',
                primary: true
            }]
        });
    },

    updateProfile() {
        const nameInput = document.getElementById('editProfileName');
        if (!nameInput || !this.currentUser) return;
        
        const newName = nameInput.value.trim();
        if (!newName) {
            NotificationSystem.error('Name cannot be empty');
            return;
        }
        
        // Update user name
        this.currentUser.name = newName;
        
        // Save to storage
        this.saveSession(this.currentUser, this.sessionToken);
        
        // Update UI
        this.updateWelcomeMessage();
        
        // Update dropdown name
        const dropdownUserName = document.getElementById('dropdownUserName');
        if (dropdownUserName) {
            dropdownUserName.textContent = newName;
        }
        
        NotificationSystem.success('Profile updated successfully!');
    },

    viewSettings() {
        const currentLang = localStorage.getItem('language') || 'en';
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        
        ModalManager.create({
            id: 'settings-modal',
            title: 'Settings',
            content: `
                <div style="display: flex; flex-direction: column; gap: 16px; padding: 10px;">
                    <!-- Theme Settings -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-${currentTheme === 'dark' ? 'moon' : 'sun'}" style="color: var(--accent-primary); font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">Theme</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Current: ${currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                            </div>
                        </div>
                        <button onclick="toggleTheme(); setTimeout(() => { ModalManager.close('settings-modal'); AuthManager.viewSettings(); }, 300);" class="modal-btn" style="padding: 8px 16px;">
                            <i class="fas fa-toggle-on"></i> Toggle
                        </button>
                    </div>
                    
                    <!-- Language Settings -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-globe" style="color: var(--accent-primary); font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">Language</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Select your preferred language</div>
                            </div>
                        </div>
                        <select id="settingsLanguage" onchange="AuthManager.changeSettingsLanguage(this.value)" class="modal-btn" style="padding: 8px 12px; min-width: 120px;">
                            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
                            <option value="ur" ${currentLang === 'ur' ? 'selected' : ''}>اردو</option>
                            <option value="ar" ${currentLang === 'ar' ? 'selected' : ''}>عربي</option>
                            <option value="es" ${currentLang === 'es' ? 'selected' : ''}>Español</option>
                        </select>
                    </div>
                    
                    <!-- Notifications Settings -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-bell" style="color: var(--accent-primary); font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">Notifications</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Task reminders & alerts</div>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notificationsToggle" checked onchange="AuthManager.toggleNotifications(this.checked)">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    
                    <!-- Data Management -->
                    <div style="padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <h4 style="margin-bottom: 15px; color: var(--text-primary);"><i class="fas fa-database"></i> Data Management</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="exportData()" class="modal-btn" style="flex: 1; min-width: 120px;">
                                <i class="fas fa-download"></i> Export Data
                            </button>
                            <button onclick="document.getElementById('importFile').click()" class="modal-btn" style="flex: 1; min-width: 120px;">
                                <i class="fas fa-upload"></i> Import Data
                            </button>
                            <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importDataFromFile(event)">
                        </div>
                    </div>
                    
                    <!-- About Section -->
                    <div style="padding: 16px; background: var(--bg-primary); border-radius: 12px; text-align: center;">
                        <h4 style="margin-bottom: 10px; color: var(--text-primary);">LifeOS</h4>
                        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">Version 2.0.0</p>
                        <p style="font-size: 11px; color: var(--text-secondary);">AI-Powered Life Manager</p>
                    </div>
                </div>
            `,
            size: 'medium',
            buttons: [{
                id: 'close',
                text: 'Close',
                primary: true
            }]
        });
    },

    changeSettingsLanguage(lang) {
        changeLanguage(lang);
        NotificationSystem.success(`Language changed to ${lang === 'en' ? 'English' : lang === 'ur' ? 'اردو' : lang === 'ar' ? 'عربي' : 'Español'}`);
    },

    toggleNotifications(enabled) {
        localStorage.setItem('notifications_enabled', enabled);
        if (enabled) {
            NotificationSystem.success('Notifications enabled');
        } else {
            NotificationSystem.info('Notifications disabled');
        }
    }
};

// Make globally available
window.AuthManager = AuthManager;

// Create global functions for HTML inline handlers
window.handleLogin = function(event) {
    return AuthManager.handleLogin(event);
};

window.handleSignup = function(event) {
    return AuthManager.handleSignup(event);
};

window.showSignup = function() {
    AuthManager.showSignup();
};

window.showLogin = function() {
    AuthManager.showLogin();
};

window.toggleAuth = function() {
    AuthManager.toggleUserMenu(event);
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => AuthManager.init());
