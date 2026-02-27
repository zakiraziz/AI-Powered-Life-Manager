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
        } else {
            document.getElementById('authContainer')?.classList.remove('hidden');
            document.getElementById('mainDashboard')?.classList.add('hidden');
        }
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

    showUserMenu() {
        const userMenu = document.getElementById('userMenu');
        
        if (!userMenu || !this.currentUser) return;

        userMenu.innerHTML = `
            <div class="user-dropdown">
                <i class="fas fa-user-circle"></i>
                <span>${SecurityUtils.escapeHtml(this.currentUser.name)}</span>
                <div class="dropdown-content">
                    <a href="#" onclick="AuthManager.viewProfile(); return false;"><i class="fas fa-user"></i> Profile</a>
                    <a href="#" onclick="AuthManager.viewSettings(); return false;"><i class="fas fa-cog"></i> Settings</a>
                    <a href="#" onclick="AuthManager.logout(); return false;"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;
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
        
        ModalManager.create({
            id: 'profile-modal',
            title: 'Profile',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">
                        <i class="fas fa-user-circle" style="color: var(--accent-primary);"></i>
                    </div>
                    <h3 style="margin-bottom: 10px;">${SecurityUtils.escapeHtml(this.currentUser.name)}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 5px;">${SecurityUtils.escapeHtml(this.currentUser.email)}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        Member since: ${new Date(this.currentUser.createdAt).toLocaleDateString()}
                    </p>
                </div>
            `,
            size: 'small',
            buttons: [{
                id: 'close',
                text: 'Close',
                primary: true
            }]
        });
    },

    viewSettings() {
        ModalManager.create({
            id: 'settings-modal',
            title: 'Settings',
            content: `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                        <span>Theme</span>
                        <button onclick="toggleTheme()" class="modal-btn">Toggle Theme</button>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                        <span>Language</span>
                        <select id="settingsLanguage" class="modal-btn" style="padding: 8px;">
                            <option value="en">English</option>
                            <option value="ur">اردو</option>
                            <option value="ar">عربي</option>
                            <option value="es">Español</option>
                        </select>
                    </div>
                    <div style="padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                        <h4 style="margin-bottom: 10px;">Data Management</h4>
                        <button onclick="exportData()" class="modal-btn" style="margin-right: 8px;">
                            <i class="fas fa-download"></i> Export Data
                        </button>
                        <button onclick="document.getElementById('importFile').click()" class="modal-btn">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importDataFromFile(event)">
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
    }
};

// Make globally available
window.AuthManager = AuthManager;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => AuthManager.init());
