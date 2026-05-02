// Job Portal Frontend Application - 2 Roles: Job Seeker & Recruiter
class JobPortalApp {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
         this.fileBaseURL = 'http://localhost:8080';
        this.token = localStorage.getItem('token');
        let savedUserJSON = localStorage.getItem('user');
        let parsedUser = {};
        if (savedUserJSON) {
            try {
                parsedUser = JSON.parse(savedUserJSON);
            } catch (e) {
                parsedUser = {};
            }
        }
        this.user = parsedUser;
        const savedPage = localStorage.getItem('currentPage');
        this.currentPage = savedPage ? savedPage : 'home';
        // Reliability flag to distinguish fresh login from remembered session
        this._justLoggedIn = false;
        console.trace('JobPortalApp.constructor', { currentPage: this.currentPage, token: !!this.token, user: !!this.user?.email });
        this.captchaText = '';
        // Guard to prevent unintended dashboard redirect after uploads
        this._suppressRedirectToDashboard = false;
        
        this.init();
    }

    init() {
        console.trace('JobPortalApp.init', { token: !!this.token, userEmail: this.user?.email });
        this.bindEvents();
        if (this.token && this.user.email) {
            if (this.currentPage === 'profile') {
                this.loadProfile();
                return;
            }
            if (this._justLoggedIn) {
                this.showDashboard();
                this._justLoggedIn = false;
                return;
            }
            // Restore last page on reload (except profile handled above)
            if (this.currentPage && this.currentPage !== 'home') {
                this.loadPage(this.currentPage);
                return;
            }
            // Default behavior when there is a remembered session but no specific page
            this.showHome();
        } else {
            this.showHome();
        }
    }

    bindEvents() {
        // Bind login form once to avoid duplicate handlers after logout/login cycles
        const loginFormEl = document.getElementById('loginForm');
        if (loginFormEl && !loginFormEl.dataset.bound) {
            loginFormEl.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
            loginFormEl.dataset.bound = 'true';
        }

        // Bind register form once as well
        const registerFormEl = document.getElementById('registerForm');
        if (registerFormEl && !registerFormEl.dataset.bound) {
            registerFormEl.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
            registerFormEl.dataset.bound = 'true';
        }
        // Prevent default submit for profile form if present
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        document.getElementById('registerPassword')?.addEventListener('input', (e) => {
            this.validatePassword(e.target.value);
        });

        document.getElementById('registerEmail')?.addEventListener('blur', (e) => {
            this.validateEmail(e.target.value);
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    generateCaptcha() {
        const canvas = document.getElementById('captchaCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        this.captchaText = '';
        for (let i = 0; i < 6; i++) {
            this.captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.3)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
        
        ctx.font = 'bold 32px Arial';
        for (let i = 0; i < this.captchaText.length; i++) {
            ctx.save();
            ctx.translate(20 + i * 30, 40);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillStyle = `rgb(${Math.random()*100},${Math.random()*100},${Math.random()*100})`;
            ctx.fillText(this.captchaText[i], 0, 0);
            ctx.restore();
        }
        
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }
    }

    validateCaptcha() {
        const userInput = document.getElementById('captchaInput').value.toUpperCase();
        if (userInput !== this.captchaText) {
            this.showModalAlert('loginModal', 'Incorrect CAPTCHA. Please try again.', 'error');
            this.generateCaptcha();
            document.getElementById('captchaInput').value = '';
            return false;
        }
        return true;
    }

    validatePassword(password) {
        const errorDiv = document.getElementById('passwordError');
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            errorDiv.style.display = 'block';
            return false;
        } else {
            errorDiv.style.display = 'none';
            return true;
        }
    }

    validateEmail(email) {
        const errorDiv = document.getElementById('emailError');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Please enter a valid email address';
            errorDiv.style.display = 'block';
            return false;
        } else {
            errorDiv.style.display = 'none';
            return true;
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        console.log('[handleLogin] start', { email, token: this.token, user: this.user });

        if (!this.validateCaptcha()) {
            console.log('[handleLogin] captcha validation failed');
            return;
        }

        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;

        try {
            console.log('[handleLogin] sending login request', { email });
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            console.log('[handleLogin] API response received', { status: response.status, ok: response.ok });

            const data = await response.json();

            if (response.ok) {
                // Validate token presence
                if (!data || !data.token) {
                    console.error('[handleLogin] Missing token in response');
                    this.showModalAlert('loginModal', 'Login failed: invalid token', 'error');
                    this.generateCaptcha();
                    document.getElementById('captchaInput').value = '';
                    return;
                }
                console.log('[handleLogin] response.ok = true');
                this.token = data.token;
                this.user = { 
                    email, 
                    role: data.role,
                    name: data.name || email.split('@')[0]
                };
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                console.log('[handleLogin] token saved to localStorage', this.token);
                console.log('[handleLogin] user saved to localStorage', this.user);
                // Mark that we just logged in for routing decisions
                this._justLoggedIn = true;
                this.showModalAlert('loginModal', 'Login successful!', 'success');
                // Navigate immediately after login (no delay)
                console.log('[handleLogin] post-login navigation', { currentPage: this.currentPage });
                this.hideModal('loginModal');
                console.log('[handleLogin] hideModal completed');
                // Ensure full UI is visible after login
                const homePageEl = document.getElementById('homePage');
                if (homePageEl) homePageEl.style.display = 'none';
                const authSectionEl = document.getElementById('authSection');
                if (authSectionEl) authSectionEl.style.display = 'none';
                const mainContentEl = document.querySelector('.main-content');
                if (mainContentEl) mainContentEl.style.display = 'block';
                const dashboardEl = document.getElementById('dashboard');
                if (dashboardEl) dashboardEl.style.display = 'block';
                const dashboardContentEl = document.getElementById('dashboardContent');
                if (dashboardContentEl) dashboardContentEl.style.display = 'block';
                const navLinksEl = document.getElementById('navLinks');
                if (navLinksEl) navLinksEl.style.display = 'none';
                const userInfoEl = document.getElementById('userInfo');
                if (userInfoEl) userInfoEl.classList.remove('hidden');
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                // End global UI stabilization
                if (this.currentPage === 'profile') {
                    console.log('[handleLogin] loadProfile() invoked');
                    this.loadProfile();
                } else {
                    console.log('[handleLogin] showDashboard() invoked');
                    this.showDashboard();
                }
                console.log('[handleLogin] post-login navigation completed, currentPage=', this.currentPage);
                // Force final layout after login navigation
                this.forceDashboardLayout();
                this._justLoggedIn = false;
            } else {
                console.log('[handleLogin] login failed', data?.message);
                this.showModalAlert('loginModal', data.message || 'Login failed', 'error');
                this.generateCaptcha();
                document.getElementById('captchaInput').value = '';
            }
        } catch (error) {
            console.log('[handleLogin] caught error', error);
            this.showModalAlert('loginModal', 'Network error. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            console.log('[handleLogin] finally: button enabled');
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;

        if (!this.validateEmail(email) || !this.validatePassword(password)) {
            this.showModalAlert('registerModal', 'Please fix the errors above', 'error');
            return;
        }

        if (!role) {
            this.showModalAlert('registerModal', 'Please select your role', 'error');
            return;
        }

        const submitBtn = document.querySelector('#registerForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                this.showModalAlert('registerModal', 'Registration successful! Please login.', 'success');
                setTimeout(() => {
                    this.hideModal('registerModal');
                    this.showModal('loginModal');
                    document.getElementById('loginEmail').value = email;
                }, 1500);
            } else {
                this.showModalAlert('registerModal', data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showModalAlert('registerModal', 'Network error. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    logout() {
        console.trace('JobPortalApp.logout start');
        this.token = null;
        this.user = {};
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Rebind login listener after logout to ensure login still works
        this.bindEvents();
        this.showHome();
        console.trace('JobPortalApp.logout end');
        this.showAlert('Logged out successfully', 'info');
    }

    async apiCall(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (response.status === 401) {
                // Do not auto-logout on 401 if instructed by caller; default behavior remains except when explicitly enabled
                if (options && options.noLogoutOn401) {
                    console.warn('[apiCall] 401 encountered but noLogoutOn401 is set; continuing without logout');
                    return null;
                }
                console.warn('[apiCall] 401 encountered; logging out');
                this.logout();
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    showHome() {
        console.trace('JobPortalApp.showHome');
        // Show home/landing sections
        const homeSection = document.getElementById('homeSection');
        const homePage = document.getElementById('homePage');
        const mainContent = document.querySelector('.main-content');
        if (homeSection) homeSection.style.display = 'block';
        if (homePage) homePage.style.display = 'block';
        if (mainContent) mainContent.style.display = 'block';
        
        // Hide dashboard areas
        const dashboardEl = document.getElementById('dashboard');
        const dashboardContentEl = document.getElementById('dashboardContent');
        if (dashboardEl) dashboardEl.style.display = 'none';
        if (dashboardContentEl) dashboardContentEl.style.display = 'none';
        
        // Reset header/navigation state
        document.getElementById('navLinks').style.display = 'flex';
        document.getElementById('userInfo')?.classList.add('hidden');
        this.setCurrentPage('home');
    }

    showDashboard() {
        console.trace('JobPortalApp.showDashboard');
        const homeSection = document.getElementById('homeSection');
        const homePage = document.getElementById('homePage');
        const mainContent = document.querySelector('.main-content');
        // Hide home area
        if (homeSection) homeSection.style.display = 'none';
        if (homePage) homePage.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        
        // Show dashboard areas explicitly
        const dashboardEl = document.getElementById('dashboard');
        const dashboardContentEl = document.getElementById('dashboardContent');
        if (dashboardEl) dashboardEl.style.display = 'block';
        if (dashboardContentEl) dashboardContentEl.style.display = 'block';
        
        document.getElementById('navLinks').style.display = 'none';
        document.getElementById('userInfo').classList.remove('hidden');
        
        this.updateUserInfo();
        this.loadSidebarMenu();
        this.loadDashboardContent();
        this.setCurrentPage('dashboard');
        // Force final layout after showing dashboard
        this.forceDashboardLayout();
    }

    updateUserInfo() {
        const userName = this.user.name || this.user.email?.split('@')[0] || 'User';
        const avatar = userName.charAt(0).toUpperCase();
        
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = avatar;
        document.getElementById('dashboardUserName').textContent = userName;
        document.getElementById('dashboardAvatar').textContent = avatar;
    }

    loadSidebarMenu() {
        const menuItems = this.getSidebarMenuItems();
        const sidebarMenu = document.getElementById('sidebarMenu');

        sidebarMenu.innerHTML = menuItems.map(item => `
            <li>
                <a href="javascript:void(0)" onclick="event.preventDefault(); window.app.loadPage('${item.page}')" class="${item.page === 'overview' ? 'active' : ''}">
                    <i class="${item.icon}"></i>
                    ${item.label}
                </a>
            </li>
        `).join('');
    }

    getSidebarMenuItems() {
        const commonItems = [
            { page: 'overview', label: 'Dashboard', icon: 'fas fa-tachometer-alt' }
        ];

        if (this.user.role === 'CANDIDATE') {
            return [
                ...commonItems,
                { page: 'jobs', label: 'Browse Jobs', icon: 'fas fa-search' },
                { page: 'applications', label: 'My Applications', icon: 'fas fa-file-alt' },
                { page: 'profile', label: 'My Profile', icon: 'fas fa-user' }
            ];
        } else if (this.user.role === 'RECRUITER') {
            return [
                ...commonItems,
                { page: 'my-jobs', label: 'My Job Posts', icon: 'fas fa-briefcase' },
                { page: 'post-job', label: 'Post New Job', icon: 'fas fa-plus-circle' },
                { page: 'received-applications', label: 'Applications Received', icon: 'fas fa-inbox' },
                { page: 'profile', label: 'Company Profile', icon: 'fas fa-building' }
            ];
        }

        return commonItems;
    }

    async loadPage(page) {
        console.trace('JobPortalApp.loadPage', page, { currentPage: this.currentPage });
        // Ensure UI visibility: show main app and hide auth/home wrappers before rendering
        const homePageEl = document.getElementById('homePage');
        if (homePageEl) homePageEl.style.display = 'none';
        const homeSectionEl = document.getElementById('homeSection');
        if (homeSectionEl) homeSectionEl.style.display = 'none';
        const mainContentEl = document.querySelector('.main-content');
        if (mainContentEl) mainContentEl.style.display = 'block';
        const dashboardEl = document.getElementById('dashboard');
        if (dashboardEl) dashboardEl.style.display = 'block';
        const dashboardContentEl = document.getElementById('dashboardContent');
        if (dashboardContentEl) dashboardContentEl.style.display = 'block';
        const navLinksEl = document.getElementById('navLinks');
        if (navLinksEl) navLinksEl.style.display = 'none';
        const userInfoEl = document.getElementById('userInfo');
        if (userInfoEl) userInfoEl.classList.remove('hidden');
        // If a post-upload redirect was suppressed, ignore attempts to navigate to dashboard views
        if (this._suppressRedirectToDashboard && (page === 'overview' || page === 'dashboard')) {
            this._suppressRedirectToDashboard = false;
            return;
        }
        // Persist current page for reloads
        this.setCurrentPage(page);
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[onclick="app.loadPage('${page}')"]`)?.classList.add('active');

        const content = document.getElementById('dashboardContent');
        content.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            switch (page) {
                case 'overview':
                    await this.loadOverview();
                    break;
                case 'jobs':
                    await this.loadJobs();
                    break;
                case 'applications':
                    await this.loadMyApplications();
                    break;
                case 'my-jobs':
                    await this.loadMyJobs();
                    break;
                case 'post-job':
                    await this.loadPostJob();
                    break;
                case 'received-applications':
                    await this.loadReceivedApplications();
                    break;
                case 'profile':
                    await this.loadProfile();
                    break;
                default:
                    content.innerHTML = '<div class="card"><h2>Page not found</h2></div>';
            }
        } catch (error) {
            content.innerHTML = '<div class="card"><h2>Error</h2><p>Please try again.</p></div>';
        }
    }

    setCurrentPage(page) {
        console.log('[route] setCurrentPage', page);
        this.currentPage = page;
        localStorage.setItem('currentPage', page);
    }

    loadDashboardContent() {
        console.trace('JobPortalApp.loadDashboardContent');
        // Debug: inspect layout chain to identify vertical offset issues
        this.logLayoutChain?.();
        this.loadPage('overview');
        // Force layout after dashboard content is loaded
        this.forceDashboardLayout?.();
    }

    forceDashboardLayout() {
        console.log('[layout] forceDashboardLayout invoked');
        const main = document.querySelector('.main-content');
        const homeSection = document.getElementById('homeSection');
        const dash = document.getElementById('dashboard');
        if (main) main.style.display = 'none';
        if (homeSection) homeSection.style.display = 'none';
        if (dash) dash.style.display = 'block';
    }

    logLayoutChain() {
        try {
            const dashboardContent = document.getElementById('dashboardContent');
            if (!dashboardContent) {
                console.log('[layout] dashboardContent not found');
                return;
            }
            console.log('[layout] Starting layout chain from #dashboardContent');
            let cur = dashboardContent;
            for (let level = 0; cur && level < 8; level++) {
                cur = cur.parentElement;
                if (!cur) break;
                const s = window.getComputedStyle(cur);
                console.log(`[layout] level ${level}: tag=${cur.tagName}, id='${cur.id}', class='${cur.className}', offsetTop=${cur.offsetTop}, marginTop=${s.marginTop}, paddingTop=${s.paddingTop}, position=${s.position}, top=${s.top}`);
            }
        } catch (e) {
            console.log('[layout] logLayoutChain error', e);
        }
    }

    async loadOverview() {
        console.trace('JobPortalApp.loadOverview');
        const content = document.getElementById('dashboardContent');
        
        if (this.user.role === 'CANDIDATE') {
            try {
                const stats = await this.apiCall('/applications/stats');
                
                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1>Welcome back, ${this.user.name || this.user.email?.split('@')[0] || 'User'}!</h1>
                        <p>Track your job applications and find new opportunities</p>
                    </div>
                    <div class="stats-grid fade-in">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-paper-plane"></i></div>
                            <div class="stat-value">${stats.total || 0}</div>
                            <div class="stat-label">Total Applications</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-clock"></i></div>
                            <div class="stat-value">${stats.pending || 0}</div>
                            <div class="stat-label">Pending</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-star"></i></div>
                            <div class="stat-value">${stats.shortlisted || 0}</div>
                            <div class="stat-label">Shortlisted</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                            <div class="stat-value">${stats.accepted || 0}</div>
                            <div class="stat-label">Accepted</div>
                        </div>
                    </div>
                    <div class="card fade-in">
                        <h3><i class="fas fa-rocket"></i> Quick Actions</h3>
                        <div class="quick-actions">
                            <button onclick="app.loadPage('jobs')" class="btn btn-primary btn-large">
                                <i class="fas fa-search"></i> Browse Jobs
                            </button>
                            <button onclick="app.loadPage('applications')" class="btn btn-outline btn-large">
                                <i class="fas fa-file-alt"></i> My Applications
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                content.innerHTML = '<div class="card">Error loading stats</div>';
            }
        } else if (this.user.role === 'RECRUITER') {
            try {
                const jobsResponse = await fetch(`${this.baseURL}/jobs/my-jobs?size=1`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                const jobsData = await jobsResponse.json();
                const activeJobs = jobsData.totalElements || 0;

                const statsResponse = await fetch(`${this.baseURL}/applications/recruiter/stats`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                const statsData = await statsResponse.json();
                const totalApplicants = statsData.totalApplicants || 0;

                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1>Welcome back, ${this.user.name || this.user.email?.split('@')[0] || 'User'}!</h1>
                        <p>Manage your job postings and find great candidates</p>
                    </div>
                    <div class="stats-grid fade-in">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
                            <div class="stat-value">${activeJobs}</div>
                            <div class="stat-label">Active Jobs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-value">${totalApplicants}</div>
                            <div class="stat-label">Total Applicants</div>
                        </div>
                    </div>
                    <div class="card fade-in">
                        <h3><i class="fas fa-rocket"></i> Quick Actions</h3>
                        <div class="quick-actions">
                            <button onclick="app.loadPage('post-job')" class="btn btn-primary btn-large">
                                <i class="fas fa-plus-circle"></i> Post New Job
                            </button>
                            <button onclick="app.loadPage('my-jobs')" class="btn btn-outline btn-large">
                                <i class="fas fa-briefcase"></i> Manage Jobs
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                content.innerHTML = '<div class="card">Error loading stats</div>';
            }
        }
    }

    async loadJobs() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = `
            <div class="page-header fade-in">
                <h1><i class="fas fa-search"></i> Browse Jobs</h1>
                <p>Find your next opportunity</p>
            </div>
            <div class="card fade-in">
                <div class="search-filters">
                    <input type="text" id="jobSearch" placeholder="Search by job title, company, or skills..." class="form-control search-input">
                    <select id="jobTypeFilter" class="form-control form-select">
                        <option value="">All Job Types</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERNSHIP">Internship</option>
                        <option value="REMOTE">Work From Home</option>
                    </select>
                    <select id="locationFilter" class="form-control form-select">
                        <option value="">All Cities</option>
                        <option value="Ahmedabad">Ahmedabad</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Coimbatore">Coimbatore</option>
                        <option value="Delhi NCR">Delhi NCR</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Jaipur">Jaipur</option>
                        <option value="Kolkata">Kolkata</option>
                        <option value="Lucknow">Lucknow</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Pune">Pune</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Indore">Indore</option>
                        <option value="Kochi">Kochi</option>
                        <option value="Remote">Work From Home</option>
                    </select>
                    <button onclick="app.searchJobs()" class="btn btn-primary">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
            </div>
            <div id="jobResults">
                <div class="loading-container"><div class="spinner"></div></div>
            </div>
        `;
        
        this.searchJobs();
    }

    async searchJobs() {
        const keyword = document.getElementById('jobSearch')?.value || '';
        const jobType = document.getElementById('jobTypeFilter')?.value || '';
        const location = document.getElementById('locationFilter')?.value || '';
        
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (jobType) params.append('jobType', jobType);
        if (location) params.append('location', location);
        
        try {
            const response = await fetch(`${this.baseURL}/jobs/public?${params}`, {
                headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
            });
            const data = await response.json();
            
            this.displayJobs(data.content || []);
        } catch (error) {
            document.getElementById('jobResults').innerHTML = '<div class="card">Error loading jobs</div>';
        }
    }

    displayJobs(jobs) {
        const container = document.getElementById('jobResults');
        if (!jobs.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No jobs found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="job-grid">
                ${jobs.map(job => `
                    <div class="job-card fade-in">
                        <div class="job-card-header">
                            <div>
                                <h3 class="job-title">${job.title}</h3>
                                <p class="job-company"><i class="fas fa-building"></i> ${job.company}</p>
                            </div>
                            <span class="job-badge job-badge-${job.jobType.toLowerCase()}">${this.formatJobType(job.jobType)}</span>
                        </div>
                        <div class="job-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Remote'}</span>
                            <span><i class="fas fa-calendar"></i> Posted ${this.formatDate(job.createdAt)}</span>
                            ${job.maxSalary ? `<span><i class="fas fa-money-bill-wave"></i> $${job.minSalary}k - $${job.maxSalary}k</span>` : ''}
                        </div>
                        <p class="job-description">${this.truncateText(job.description, 150)}</p>
                        ${job.skills ? `
                            <div class="job-skills">
                                ${job.skills.split(',').slice(0, 5).map(skill => 
                                    `<span class="skill-tag">${skill.trim()}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                        <div class="job-actions">
                            ${this.user.role === 'CANDIDATE' ? `
                                <button onclick="app.showApplyModal(${job.jobId}, '${job.title.replace(/'/g, "\\'")}', '${job.company.replace(/'/g, "\\'")}' )" class="btn btn-primary btn-block">
                                    <i class="fas fa-paper-plane"></i> Apply Now
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showApplyModal(jobId, jobTitle, company) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'applyModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <button class="close-modal" onclick="document.getElementById('applyModal').remove()">&times;</button>
                <div class="modal-header">
                    <h2><i class="fas fa-paper-plane"></i> Apply for Position</h2>
                    <p class="modal-subtitle">${jobTitle} at ${company}</p>
                </div>
                <div id="applyModalAlert"></div>
                <form id="applyForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicantName">Full Name *</label>
                            <input type="text" id="applicantName" class="form-control" placeholder="Your full name" required>
                        </div>
                        <div class="form-group">
                            <label for="applicantEmail">Email *</label>
                            <input type="email" id="applicantEmail" class="form-control" value="${this.user.email}" placeholder="your.email@example.com" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicantPhone">Phone Number *</label>
                            <input type="tel" id="applicantPhone" class="form-control" placeholder="+91 98765 43210" required>
                            <small class="format-hint">Format: +91 XXXXX XXXXX</small>
                        </div>
                        <div class="form-group">
                            <label for="applicantLocation">Current Location *</label>
                            <select id="applicantLocation" class="form-control form-select" required>
                                <option value="">Select city</option>
                                <option value="Ahmedabad">Ahmedabad</option>
                                <option value="Bangalore">Bangalore</option>
                                <option value="Chennai">Chennai</option>
                                <option value="Coimbatore">Coimbatore</option>
                                <option value="Delhi NCR">Delhi NCR</option>
                                <option value="Hyderabad">Hyderabad</option>
                                <option value="Jaipur">Jaipur</option>
                                <option value="Kolkata">Kolkata</option>
                                <option value="Lucknow">Lucknow</option>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Pune">Pune</option>
                                <option value="Chandigarh">Chandigarh</option>
                                <option value="Indore">Indore</option>
                                <option value="Kochi">Kochi</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group"> 
                        <label for="resumeUpload">Resume *</label> 
                        <input type="file" id="resumeUpload" class="form-control" accept=".pdf,.doc,.docx" required>
                        <small class="form-hint"><i class="fas fa-info-circle"></i> Upload PDF or Word document (Max 5MB)</small>
                    </div>
                    <div class="form-group">
                        <label for="linkedinLink">LinkedIn Profile (Optional)</label>
                        <input type="url" id="linkedinLink" class="form-control" placeholder="https://linkedin.com/in/yourprofile">
                    </div>
                    <div class="form-group">
                        <label for="coverLetter">Cover Letter (Optional)</label>
                        <textarea id="coverLetter" class="form-control" rows="4" placeholder="Tell us why you're a great fit for this role..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-large">
                        <i class="fas fa-paper-plane"></i> Submit Application
                    </button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('applyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitApplication(jobId);
        });
    }

    async submitApplication(jobId) {
    const name = document.getElementById('applicantName').value;
    const email = document.getElementById('applicantEmail').value;
    const phone = document.getElementById('applicantPhone').value;
    const location = document.getElementById('applicantLocation').value;
    const linkedinLink = document.getElementById('linkedinLink').value;
    const coverLetter = document.getElementById('coverLetter').value;

    let coverLetterText = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nLocation: ${location}`;
    
    if (linkedinLink) {
        coverLetterText += `\nLinkedIn: ${linkedinLink}`;
    }
    
    if (coverLetter) {
        coverLetterText += `\n\nCover Letter:\n${coverLetter}`;
    }

    const submitBtn = document.querySelector('#applyForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
        const params = new URLSearchParams({
            jobId: jobId,
            coverLetter: coverLetterText
        });
        
        const response = await fetch(`${this.baseURL}/applications/apply?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        const data = await response.json();
        console.log('Application response:', data); // Debug

        if (response.ok) {
            this.showAlert('Application submitted successfully!', 'success');
            document.getElementById('applyModal').remove();
            // Reload applications page
            setTimeout(() => {
                this.loadPage('applications');
            }, 1000);
        } else {
            const alertContainer = document.getElementById('applyModalAlert');
            alertContainer.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Application error:', error);
        const alertContainer = document.getElementById('applyModalAlert');
        alertContainer.innerHTML = '<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> Network error. Please try again.</div>';
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

    async loadMyApplications() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            const response = await fetch(`${this.baseURL}/applications/my-applications`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load applications');
            }

            const data = await response.json();
            console.log('Applications data:', data); // DEBUG
            
            const applications = data.content || [];

            if (!applications.length) {
                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1><i class="fas fa-file-alt"></i> My Applications</h1>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No applications yet</h3>
                        <p>Start browsing jobs and apply to positions that interest you!</p>
                        <button onclick="app.loadPage('jobs')" class="btn btn-primary btn-large">
                            <i class="fas fa-search"></i> Browse Jobs
                        </button>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-file-alt"></i> My Applications</h1>
                    <p>Track the status of your job applications</p>
                </div>
                <div class="applications-list">
                    ${applications.map(app => `
                        <div class="application-card fade-in">
                            <div class="application-header">
                                <div>
                                    <h3>${app.jobTitle || 'Job Title'}</h3>
                                    <p class="company-name"><i class="fas fa-building"></i> ${app.company || 'Company'}</p>
                                </div>
                                <span class="status-badge status-${(app.status || 'pending').toLowerCase()}">${this.formatStatus(app.status || 'PENDING')}</span>
                            </div>
                            <div class="application-meta">
                                <span><i class="fas fa-calendar"></i> Applied ${this.formatDate(app.appliedAt)}</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${app.jobLocation || 'Remote'}</span>
                            </div>
                            ${app.coverLetter ? `
                                <div class="cover-letter-preview">
                                    <strong><i class="fas fa-file-alt"></i> Application Details:</strong>
                                    <p>${this.truncateText(app.coverLetter, 300)}</p>
                                </div>
                            ` : ''}
                            <div class="application-actions">
                                ${app.status === 'PENDING' || app.status === 'REVIEWED' ? `
                                    <button onclick="app.withdrawApplication(${app.applicationId})" class="btn btn-outline btn-danger">
                                        <i class="fas fa-times"></i> Withdraw Application
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading applications:', error);
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-file-alt"></i> My Applications</h1>
                </div>
                <div class="card">
                    <h3>Unable to load applications</h3>
                    <p>There was an error loading your applications. Please try refreshing the page.</p>
                    <button onclick="app.loadMyApplications()" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    async withdrawApplication(applicationId) {
        if (!confirm('Are you sure you want to withdraw this application?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/applications/${applicationId}/withdraw`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showAlert('Application withdrawn successfully', 'success');
                this.loadMyApplications();
            } else {
                this.showAlert('Failed to withdraw application', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    async loadMyJobs() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading jobs...</p></div>';

        try {
            const response = await fetch(`${this.baseURL}/jobs/my-jobs`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            const jobs = data.content || [];

            if (!jobs.length) {
                content.innerHTML = `
                    <div class="page-header fade-in">
                        <h1><i class="fas fa-briefcase"></i> My Job Posts</h1>
                        <p>Manage your active job listings</p>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-briefcase"></i>
                        <h3>No jobs posted yet</h3>
                        <p>Create your first job posting to start receiving applications</p>
                        <button onclick="app.loadPage('post-job')" class="btn btn-primary btn-large">
                            <i class="fas fa-plus-circle"></i> Post Your First Job
                        </button>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-briefcase"></i> My Job Posts</h1>
                    <p>Manage your active job listings</p>
                </div>
                <div class="job-grid">
                    ${jobs.map(job => `
                        <div class="job-card fade-in">
                            <div class="job-card-header">
                                <div>
                                    <h3 class="job-title">${job.title}</h3>
                                    <p class="job-company"><i class="fas fa-building"></i> ${job.company}</p>
                                </div>
                                <span class="job-badge job-badge-${job.jobType.toLowerCase()}">${this.formatJobType(job.jobType)}</span>
                            </div>
                            <div class="job-meta">
                                <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Remote'}</span>
                                <span><i class="fas fa-calendar"></i> Posted ${this.formatDate(job.createdAt)}</span>
                                <span><i class="fas fa-eye"></i> ${job.status}</span>
                            </div>
                            <p class="job-description">${this.truncateText(job.description, 150)}</p>
                            ${job.skills ? `
                                <div class="job-skills">
                                    ${job.skills.split(',').slice(0, 5).map(skill => 
                                        `<span class="skill-tag">${skill.trim()}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                            <div class="job-actions">
                                <button onclick="app.editJob(${job.jobId})" class="btn btn-outline">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="app.deleteJob(${job.jobId})" class="btn btn-outline btn-danger">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = '<div class="card">Error loading jobs</div>';
        }
    }

    async editJob(jobId) {
        try {
            const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const job = await response.json();

            const content = document.getElementById('dashboardContent');
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-edit"></i> Edit Job</h1>
                    <p>Update your job posting</p>
                </div>
                <div class="card fade-in">
                    <form id="editJobForm" class="job-post-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editJobTitle">Job Title *</label>
                                <input type="text" id="editJobTitle" class="form-control" value="${job.title}" required>
                            </div>
                            <div class="form-group">
                                <label for="editCompany">Company Name *</label>
                                <input type="text" id="editCompany" class="form-control" value="${job.company}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editJobDescription">Job Description *</label>
                            <textarea id="editJobDescription" class="form-control" rows="6" required>${job.description}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editJobType">Job Type *</label>
                                <select id="editJobType" class="form-control form-select" required>
                                    <option value="FULL_TIME" ${job.jobType === 'FULL_TIME' ? 'selected' : ''}>Full Time</option>
                                    <option value="PART_TIME" ${job.jobType === 'PART_TIME' ? 'selected' : ''}>Part Time</option>
                                    <option value="CONTRACT" ${job.jobType === 'CONTRACT' ? 'selected' : ''}>Contract</option>
                                    <option value="INTERNSHIP" ${job.jobType === 'INTERNSHIP' ? 'selected' : ''}>Internship</option>
                                    <option value="REMOTE" ${job.jobType === 'REMOTE' ? 'selected' : ''}>Remote</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editLocation">Location *</label>
                                <input type="text" id="editLocation" class="form-control" value="${job.location || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editMinSalary">Min Salary (in thousands)</label>
                                <input type="number" id="editMinSalary" class="form-control" value="${job.minSalary || ''}">
                            </div>
                            <div class="form-group">
                                <label for="editMaxSalary">Max Salary (in thousands)</label>
                                <input type="number" id="editMaxSalary" class="form-control" value="${job.maxSalary || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editSkills">Required Skills</label>
                            <input type="text" id="editSkills" class="form-control" value="${job.skills || ''}">
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" onclick="app.loadPage('my-jobs')" class="btn btn-outline">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button type="submit" class="btn btn-primary btn-large">
                                <i class="fas fa-save"></i> Update Job
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.getElementById('editJobForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateJob(jobId);
            });
        } catch (error) {
            this.showAlert('Error loading job details', 'error');
        }
    }

    async updateJob(jobId) {
        const deadlineValue = document.getElementById('editApplicationDeadline')?.value;
        let formattedDeadline = null;
        if (deadlineValue) {
            formattedDeadline = new Date(deadlineValue).toISOString();
        }

        const jobData = {
            title: document.getElementById('editJobTitle').value,
            company: document.getElementById('editCompany').value,
            description: document.getElementById('editJobDescription').value,
            jobType: document.getElementById('editJobType').value,
            location: document.getElementById('editLocation').value,
            minSalary: document.getElementById('editMinSalary').value || null,
            maxSalary: document.getElementById('editMaxSalary').value || null,
            skills: document.getElementById('editSkills').value || null,
            applicationDeadline: formattedDeadline,
            requirements: null,
            benefits: null,
            experience: null,
            education: null
        };

        try {
            const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(jobData)
            });

            if (response.ok) {
                this.showAlert('Job updated successfully!', 'success');
                this.loadPage('my-jobs');
            } else {
                this.showAlert('Failed to update job', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    async deleteJob(jobId) {
        if (!confirm('Are you sure you want to delete this job?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showAlert('Job deleted successfully', 'success');
                this.loadMyJobs();
            } else {
                this.showAlert('Failed to delete job', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    async loadPostJob() {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = `
            <div class="page-header fade-in">
                <h1><i class="fas fa-plus-circle"></i> Post a New Job</h1>
                <p>Find the perfect candidate for your team</p>
            </div>
            
            <div class="post-job-container fade-in">
                <div class="post-job-card">
                    <form id="postJobForm" class="job-post-form">
                        <div class="form-section">
                            <h3><i class="fas fa-briefcase"></i> Job Details</h3>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="jobTitle">Job Title *</label>
                                    <input type="text" id="jobTitle" class="form-control" placeholder="e.g. Senior Software Engineer" required>
                                </div>
                                <div class="form-group">
                                    <label for="company">Company Name *</label>
                                    <input type="text" id="company" class="form-control" placeholder="Your company name" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="jobDescription">Job Description *</label>
                                <textarea id="jobDescription" class="form-control" rows="5" placeholder="Describe the role, responsibilities, and requirements..." required></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="jobType">Job Type *</label>
                                    <select id="jobType" class="form-control form-select" required>
                                        <option value="">Select job type</option>
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="INTERNSHIP">Internship</option>
                                        <option value="REMOTE">Work From Home</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="location">Location *</label>
                                    <select id="location" class="form-control form-select" required>
                                        <option value="">Select city</option>
                                        <option value="Ahmedabad">Ahmedabad</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Coimbatore">Coimbatore</option>
                                        <option value="Delhi NCR">Delhi NCR</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Jaipur">Jaipur</option>
                                        <option value="Kolkata">Kolkata</option>
                                        <option value="Lucknow">Lucknow</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Chandigarh">Chandigarh</option>
                                        <option value="Indore">Indore</option>
                                        <option value="Kochi">Kochi</option>
                                        <option value="Remote">Work From Home</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3><i class="fas fa-rupee-sign"></i> Salary & Experience</h3>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="minSalary">Min Salary (₹) *</label>
                                    <select id="minSalary" class="form-control form-select" required>
                                        <option value="">Select</option>
                                        <option value="1">₹1 LPA</option>
                                        <option value="2">₹2 LPA</option>
                                        <option value="3">₹3 LPA</option>
                                        <option value="4">₹4 LPA</option>
                                        <option value="5">₹5 LPA</option>
                                        <option value="6">₹6 LPA</option>
                                        <option value="7">₹7 LPA</option>
                                        <option value="8">₹8 LPA</option>
                                        <option value="10">₹10 LPA</option>
                                        <option value="12">₹12 LPA</option>
                                        <option value="15">₹15 LPA</option>
                                        <option value="20">₹20 LPA</option>
                                        <option value="25">₹25 LPA</option>
                                        <option value="30">₹30 LPA</option>
                                        <option value="40">₹40 LPA</option>
                                        <option value="50">₹50+ LPA</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="maxSalary">Max Salary (₹)</label>
                                    <select id="maxSalary" class="form-control form-select">
                                        <option value="">Select</option>
                                        <option value="2">₹2 LPA</option>
                                        <option value="3">₹3 LPA</option>
                                        <option value="4">₹4 LPA</option>
                                        <option value="5">₹5 LPA</option>
                                        <option value="6">₹6 LPA</option>
                                        <option value="7">₹7 LPA</option>
                                        <option value="8">₹8 LPA</option>
                                        <option value="10">₹10 LPA</option>
                                        <option value="12">₹12 LPA</option>
                                        <option value="15">₹15 LPA</option>
                                        <option value="20">₹20 LPA</option>
                                        <option value="25">₹25 LPA</option>
                                        <option value="30">₹30 LPA</option>
                                        <option value="40">₹40 LPA</option>
                                        <option value="50">₹50 LPA</option>
                                        <option value="75">₹75 LPA</option>
                                        <option value="100">₹1 Cr+</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="experience">Experience Required</label>
                                    <select id="experience" class="form-control form-select">
                                        <option value="">Any</option>
                                        <option value="0">Fresher</option>
                                        <option value="1">1 Year</option>
                                        <option value="2">2 Years</option>
                                        <option value="3">3 Years</option>
                                        <option value="4">4 Years</option>
                                        <option value="5">5 Years</option>
                                        <option value="6">6 Years</option>
                                        <option value="7">7 Years</option>
                                        <option value="8">8 Years</option>
                                        <option value="10">10+ Years</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="applicationDeadline">Application Deadline</label>
                                    <input type="date" id="applicationDeadline" class="form-control">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3><i class="fas fa-tools"></i> Skills & Requirements</h3>
                            
                            <div class="form-group">
                                <label for="skills">Required Skills</label>
                                <input type="text" id="skills" class="form-control" placeholder="e.g. JavaScript, React, Node.js, Python">
                                <small class="form-hint">Separate skills with commas</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="education">Education Required</label>
                                <select id="education" class="form-control form-select">
                                    <option value="">Any</option>
                                    <option value="High School">High School</option>
                                    <option value="Diploma">Diploma</option>
                                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                                    <option value="Master's Degree">Master's Degree</option>
                                    <option value="PhD">PhD</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-large">
                                <i class="fas fa-paper-plane"></i> Post Job
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('applicationDeadline').min = tomorrow.toISOString().split('T')[0];
        
        document.getElementById('postJobForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitJobPost();
        });
    }

    async submitJobPost() {
        const deadlineValue = document.getElementById('applicationDeadline').value;
        let formattedDeadline = null;
        
        if (deadlineValue) {
            formattedDeadline = new Date(deadlineValue).toISOString();
        }

        const minSalaryValue = document.getElementById('minSalary').value;
        const maxSalaryValue = document.getElementById('maxSalary').value;
        
        let minSalary = null;
        let maxSalary = null;
        
        if (minSalaryValue) {
            minSalary = parseFloat(minSalaryValue) * 100000;
        }
        if (maxSalaryValue) {
            maxSalary = parseFloat(maxSalaryValue) * 100000;
        }

        const jobData = {
            title: document.getElementById('jobTitle').value,
            company: document.getElementById('company').value,
            description: document.getElementById('jobDescription').value,
            jobType: document.getElementById('jobType').value,
            location: document.getElementById('location').value || null,
            minSalary: minSalary,
            maxSalary: maxSalary,
            skills: document.getElementById('skills').value || null,
            applicationDeadline: formattedDeadline,
            requirements: document.getElementById('experience')?.value || null,
            benefits: document.getElementById('education')?.value || null,
            experience: document.getElementById('experience')?.value || null,
            education: document.getElementById('education')?.value || null
        };

        console.log('Token:', this.token);
        console.log('Job Data:', JSON.stringify(jobData, null, 2));

        const submitBtn = document.querySelector('#postJobForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(jobData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('Job posted successfully!', 'success');
                this.loadPage('my-jobs');
            } else {
                this.showAlert(data.message || 'Failed to post job', 'error');
            }
        } catch (error) {
            this.showAlert('Network error. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadReceivedApplications() {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

    try {
        const response = await fetch(`${this.baseURL}/applications/recruiter/applications`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const data = await response.json();
        const applications = data.content || [];

        if (!applications.length) {
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-inbox"></i> Applications Received</h1>
                    <p>Review candidates who applied to your jobs</p>
                </div>
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No applications yet</h3>
                    <p>Once candidates apply to your jobs, they'll appear here</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="page-header fade-in">
                <h1><i class="fas fa-inbox"></i> Applications Received</h1>
                <p>Review candidates who applied to your jobs</p>
            </div>
            <div class="applications-list">
                ${applications.map(app => `
                    <div class="application-card fade-in">
                        <div class="application-header">
                            <div>
                                <h3>${app.candidateName}</h3>
                                <p class="company-name"><i class="fas fa-envelope"></i> ${app.candidateEmail}</p>
                            </div>
                            <span class="status-badge status-${app.status.toLowerCase()}">${this.formatStatus(app.status)}</span>
                        </div>
                        <div class="application-meta">
                            <span><i class="fas fa-briefcase"></i> ${app.jobTitle}</span>
                            <span><i class="fas fa-calendar"></i> Applied ${this.formatDate(app.appliedAt)}</span>
                        </div>
                        ${app.coverLetter ? `
                            <div class="cover-letter-preview">
                                <strong><i class="fas fa-file-alt"></i> Application Details:</strong>
                                <p>${this.truncateText(app.coverLetter, 300)}</p>
                            </div>
                        ` : ''}
                        ${app.status !== 'WITHDRAWN' && app.status !== 'ACCEPTED' && app.status !== 'REJECTED' ? `
                            <div class="application-actions">
                                <button onclick="app.updateApplicationStatus(${app.applicationId}, 'SHORTLISTED')" class="btn btn-primary">
                                    <i class="fas fa-star"></i> Shortlist
                                </button>
                                <button onclick="app.updateApplicationStatus(${app.applicationId}, 'ACCEPTED')" class="btn btn-outline" style="color: #10b981; border-color: #10b981;">
                                    <i class="fas fa-check"></i> Accept
                                </button>
                                <button onclick="app.updateApplicationStatus(${app.applicationId}, 'REJECTED')" class="btn btn-outline btn-danger">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = '<div class="card">Error loading applications</div>';
    }
}

    async updateApplicationStatus(applicationId, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this application?`)) {
        return;
    }

    try {
        const response = await fetch(`${this.baseURL}/applications/${applicationId}/status?status=${status}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (response.ok) {
            this.showAlert(`Application ${status.toLowerCase()} successfully`, 'success');
            this.loadReceivedApplications();
        } else {
            this.showAlert('Failed to update application status', 'error');
        }
    } catch (error) {
        this.showAlert('Network error', 'error');
    }
}

    async loadProfile() {
        console.trace('JobPortalApp.loadProfile start');
        const content = document.getElementById('dashboardContent');
        if (!content) {
            console.error('[loadProfile] dashboardContent container not found');
            return;
        }
        
        if (this.user.role === 'CANDIDATE') {
            let profileData = {};
            
            try {
                const profileRes = await fetch(`${this.baseURL}/resume/my-resume`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                if (profileRes.ok) {
                    profileData = await profileRes.json() || {};
                }
            } catch (e) {}

            const userName = this.user.name || this.user.email?.split('@')[0] || 'User';
            const userInitial = userName.charAt(0).toUpperCase();
            const profilePhotoUrl = profileData.profilePhotoUrl ? `${this.fileBaseURL}${profileData.profilePhotoUrl}` : null;
            const resumeUrl = profileData.resumeUrl ? `${this.fileBaseURL}${profileData.resumeUrl}` : null;

            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-user-circle"></i> My Profile</h1>
                    <p>Manage your professional information and resume</p>
                </div>
                
                <div class="profile-grid fade-in">
                    <div class="profile-main">
                        <div class="profile-card">
                            <div class="profile-header-simple">
                                <div class="profile-avatar-wrapper">
                                    <img src="${profilePhotoUrl || ''}" alt="Profile Photo" class="profile-photo-img" id="profilePhotoImg" style="${profilePhotoUrl ? 'display: block;' : 'display: none;'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <div class="profile-avatar-large" id="profilePhotoPlaceholder" style="${profilePhotoUrl ? 'display: none;' : 'display: flex;'}">${userInitial}</div>
                                    <label for="profilePhotoUpload" class="avatar-upload-btn">
                                        <i class="fas fa-camera"></i>
                                    </label>
                                    <input type="file" id="profilePhotoUpload" accept="image/jpeg,image/jpg,image/png" style="display: none;" form="">
                                </div>
                                <div class="profile-info">
                                    <h2>${userName}</h2>
                                    <p class="profile-email">${this.user.email}</p>
                                    <span class="profile-badge">Job Seeker</span>
                                </div>
                            </div>
                            
                                <form id="profileForm" class="profile-form" onsubmit="return false;">
                                <h3><i class="fas fa-id-card"></i> Personal Information</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="profileName">Full Name</label>
                                        <input type="text" id="profileName" class="form-control" value="${profileData.name || this.user.name || ''}" placeholder="Your full name">
                                    </div>
                                    <div class="form-group">
                                        <label for="profilePhone">Phone Number</label>
                                        <input type="tel" id="profilePhone" class="form-control" value="${profileData.phone || ''}" placeholder="+91 98765 43210">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="profileLocation">Location</label>
                                        <input type="text" id="profileLocation" class="form-control" value="${profileData.location || ''}" placeholder="City, Country">
                                    </div>
                                    <div class="form-group">
                                        <label for="profileExperience">Years of Experience</label>
                                        <input type="number" id="profileExperience" class="form-control" value="${profileData.experience || ''}" placeholder="0">
                                    </div>
                                </div>
                                
                                <h3><i class="fas fa-briefcase"></i> Professional Profile</h3>
                                
                                <div class="form-group">
                                    <label for="profileTitle">Job Title</label>
                                    <input type="text" id="profileTitle" class="form-control" value="${profileData.title || ''}" placeholder="e.g. Senior Software Engineer">
                                </div>
                                
                                <div class="form-group">
                                    <label for="profileBio">Professional Summary</label>
                                    <textarea id="profileBio" class="form-control" rows="4" placeholder="Tell employers about yourself, your career goals, and what makes you unique...">${profileData.summary || ''}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="profileSkills">Skills</label>
                                    <input type="text" id="profileSkills" class="form-control" value="${profileData.skills || ''}" placeholder="e.g. JavaScript, Python, Project Management">
                                    <small class="form-hint">Separate skills with commas</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="profileEducation">Education</label>
                                    <textarea id="profileEducation" class="form-control" rows="3" placeholder="Your educational background...">${profileData.education || ''}</textarea>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary btn-large">
                                        <i class="fas fa-save"></i> Save Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div class="profile-sidebar">
                        <div class="profile-card resume-card">
                            <h3><i class="fas fa-file-pdf"></i> Resume</h3>
                            <div class="resume-upload-area" id="resumeArea">
                                ${resumeUrl ? `
                                    <div class="resume-current">
                                        <i class="fas fa-file-pdf"></i>
                                        <p>${profileData.resumeFileName || 'Resume uploaded'}</p>
                                        <a href="${resumeUrl}" target="_blank" class="btn btn-sm btn-outline">
                                            <i class="fas fa-eye"></i> View
                                        </a>
                                    </div>
                                ` : `
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>Upload your resume</p>
                                    <small>PDF, DOC, or DOCX (Max 5MB)</small>
                                `}
                            </div>
                            <div class="resume-actions">
                                <input type="file" id="resumeUpload" class="resume-file-input" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                                <button type="button" id="resumeUploadBtn" class="btn btn-primary btn-block">
                                    <i class="fas fa-upload"></i> ${resumeUrl ? 'Update Resume' : 'Upload Resume'}
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-card">
                            <h3><i class="fas fa-chart-line"></i> Profile Strength</h3>
                            <div class="profile-strength">
                                <div class="strength-bar">
                                    <div class="strength-fill" id="strengthFill"></div>
                                </div>
                                <p id="strengthText">Complete your profile to increase visibility</p>
                            </div>
                            <ul class="strength-checklist" id="strengthChecklist">
                                <li><i class="fas fa-check"></i> Basic info</li>
                                <li><i class="fas fa-check"></i> Profile photo</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            console.log('[loadProfile] render complete', { user: this.user?.email, profilePhotoUrl, resumeUrl });
            
            this.initProfileStrength();
            
            document.getElementById('profileForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.saveProfile();
            });
            
            document.getElementById('resumeUploadBtn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById('resumeUpload').click();
            });
            
            document.getElementById('resumeUpload').addEventListener('change', (e) => this.uploadResume(e));
            
            document.getElementById('profilePhotoUpload').addEventListener('change', (e) => this.uploadProfilePhoto(e));
        } else if (this.user.role === 'RECRUITER') {
            let companyData = {};
            
            try {
                const companyRes = await fetch(`${this.baseURL}/resume/my-resume`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                if (companyRes.ok) {
                    companyData = await companyRes.json() || {};
                }
            } catch (e) {}

            const companyName = this.user.name || 'Company Name';
            
            content.innerHTML = `
                <div class="page-header fade-in">
                    <h1><i class="fas fa-building"></i> Company Profile</h1>
                    <p>Manage your company information and attract talent</p>
                </div>
                
                <div class="profile-grid fade-in">
                    <div class="profile-main">
                        <div class="profile-card">
                            <div class="profile-header-simple">
                                <div class="profile-avatar-large profile-company">${companyName.charAt(0).toUpperCase()}</div>
                                <div class="profile-info">
                                    <h2>${companyName}</h2>
                                    <p class="profile-email">${this.user.email}</p>
                                    <span class="profile-badge" style="background: var(--accent-color);">Employer</span>
                                </div>
                            </div>
                            
                            <form id="profileForm" class="profile-form">
                                <h3><i class="fas fa-building"></i> Company Information</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="companyName">Company Name *</label>
                                        <input type="text" id="companyName" class="form-control" value="${companyName}" placeholder="Your company name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="companyIndustry">Industry *</label>
                                        <select id="companyIndustry" class="form-control form-select" required>
                                            <option value="">Select industry</option>
                                            <option value="IT Services">IT Services & Consulting</option>
                                            <option value="Software Products">Software Products</option>
                                            <option value="E-Commerce">E-Commerce</option>
                                            <option value="Finance">Banking & Finance</option>
                                            <option value="Healthcare">Healthcare</option>
                                            <option value="Education">Education</option>
                                            <option value="Retail">Retail & Consumer Goods</option>
                                            <option value="Manufacturing">Manufacturing</option>
                                            <option value="Real Estate">Real Estate</option>
                                            <option value="Telecom">Telecom</option>
                                            <option value="Automotive">Automotive</option>
                                            <option value="Media">Media & Entertainment</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="companyWebsite">Company Website</label>
                                        <input type="url" id="companyWebsite" class="form-control" value="${companyData.website || ''}" placeholder="https://www.yourcompany.com">
                                    </div>
                                    <div class="form-group">
                                        <label for="companySize">Company Size *</label>
                                        <select id="companySize" class="form-control form-select" required>
                                            <option value="">Select size</option>
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="201-500">201-500 employees</option>
                                            <option value="501-1000">501-1000 employees</option>
                                            <option value="1000-5000">1000-5000 employees</option>
                                            <option value="5000+">5000+ employees</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="companyLocation">Headquarters Location *</label>
                                    <select id="companyLocation" class="form-control form-select" required>
                                        <option value="">Select city</option>
                                        <option value="Ahmedabad">Ahmedabad</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Coimbatore">Coimbatore</option>
                                        <option value="Delhi NCR">Delhi NCR</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Jaipur">Jaipur</option>
                                        <option value="Kolkata">Kolkata</option>
                                        <option value="Lucknow">Lucknow</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Chandigarh">Chandigarh</option>
                                        <option value="Indore">Indore</option>
                                        <option value="Kochi">Kochi</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="companyDescription">Company Description</label>
                                    <textarea id="companyDescription" class="form-control" rows="4" placeholder="Tell candidates about your company, culture, and what makes it a great place to work...">${companyData.summary || ''}</textarea>
                                </div>
                                
                                <h3><i class="fas fa-user-tie"></i> HR Contact Details</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="contactName">HR Contact Name *</label>
                                        <input type="text" id="contactName" class="form-control" value="${companyData.contactName || ''}" placeholder="HR Manager name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="contactPhone">Phone Number *</label>
                                        <input type="tel" id="contactPhone" class="form-control" value="${companyData.phone || ''}" placeholder="+91 98765 43210" required>
                                        <small class="format-hint">Format: +91 XXXXX XXXXX</small>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactEmail">HR Email</label>
                                    <input type="email" id="contactEmail" class="form-control" value="${this.user.email}" placeholder="hr@company.com">
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary btn-large">
                                        <i class="fas fa-save"></i> Save Company Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div class="profile-sidebar">
                        <div class="profile-card company-stats-card">
                            <h3><i class="fas fa-chart-bar"></i> Company Stats</h3>
                            <div class="company-stats">
                                <div class="company-stat">
                                    <i class="fas fa-briefcase"></i>
                                    <div>
                                        <span class="stat-number">0</span>
                                        <span class="stat-label">Active Jobs</span>
                                    </div>
                                </div>
                                <div class="company-stat">
                                    <i class="fas fa-users"></i>
                                    <div>
                                        <span class="stat-number">0</span>
                                        <span class="stat-label">Total Applicants</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-card tips-card">
                            <h3><i class="fas fa-lightbulb"></i> Tips for Hiring</h3>
                            <ul class="hiring-tips">
                                <li><i class="fas fa-check"></i> Provide salary range for better response</li>
                                <li><i class="fas fa-check"></i> Include remote work options</li>
                                <li><i class="fas fa-check"></i> Add company benefits</li>
                                <li><i class="fas fa-check"></i> Write detailed job descriptions</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        } else if (this.user.role === 'RECRUITER') {
            document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.saveCompanyProfile();
            });
        }
    }

    formatStatus(status) {
        const statusMap = {
            'PENDING': 'Under Review',
            'REVIEWED': 'Reviewed',
            'SHORTLISTED': 'Shortlisted',
            'INTERVIEW_SCHEDULED': 'Interview Scheduled',
            'ACCEPTED': 'Accepted',
            'REJECTED': 'Rejected',
            'WITHDRAWN': 'Withdrawn'
        };
        return statusMap[status] || status;
    }

    async saveProfile() {
        const profileData = {
            name: document.getElementById('profileName').value,
            phone: document.getElementById('profilePhone').value,
            location: document.getElementById('profileLocation').value,
            experience: document.getElementById('profileExperience').value,
            summary: document.getElementById('profileBio').value,
            skills: document.getElementById('profileSkills').value,
            education: document.getElementById('profileEducation').value
        };

        try {
            const response = await fetch(`${this.baseURL}/resume/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(profileData)
            });

            
            if (response.ok) {
                this.user.name = profileData.name;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.updateUserInfo();
                this.showToast('Profile saved successfully!', 'success');
                this.initProfileStrength();
            } else {
                const data = await response.json();
                this.showToast(data.message || 'Failed to save profile', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async saveCompanyProfile() {
        const profileData = {
            name: document.getElementById('companyName').value,
            industry: document.getElementById('companyIndustry').value,
            website: document.getElementById('companyWebsite').value,
            companySize: document.getElementById('companySize').value,
            location: document.getElementById('companyLocation').value,
            summary: document.getElementById('companyDescription').value,
            contactName: document.getElementById('contactName').value,
            phone: document.getElementById('contactPhone').value
        };

        try {
            const response = await fetch(`${this.baseURL}/resume/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                this.user.name = profileData.name;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.updateUserInfo();
                this.showToast('Company profile saved successfully!', 'success');
            } else {
                const data = await response.json();
                this.showToast(data.message || 'Failed to save company profile', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async uploadResume(eventOrFile) {
        // Prevent default navigation if called as a form submit
        if (eventOrFile && typeof eventOrFile.preventDefault === 'function') {
            eventOrFile.preventDefault();
            eventOrFile.stopPropagation();
        }
        // Robust file extraction
        let file = null;
        if (eventOrFile instanceof File) {
            file = eventOrFile;
        } else if (eventOrFile?.target?.files?.length) {
            file = eventOrFile.target.files[0];
        } else {
            const input = document.getElementById('resumeUpload');
            if (input?.files?.length) file = input.files[0];
        }
        console.log('[uploadResume] selected file =', file);
        if (!file) {
            this.showToast('Please select a resume file', 'error');
            return false;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast('File size must be less than 5MB', 'error');
            return;
        }

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Only PDF and Word documents are allowed', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const submitBtn = document.getElementById('resumeUploadBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/resume/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            
            if (response.ok) {
                const data = await response.json();
                // New: render profile and ensure we stay on profile without nav
                await this.loadProfile();
                this.setCurrentPage('profile');
                console.log('[uploadResume] success - staying on profile');
                // Suppress potential redirect after upload
                this._suppressRedirectToDashboard = true;
                this.showToast('Resume uploaded successfully!', 'success');
                // Do not manually modify resumeArea here; loadProfile will refresh content
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Update Resume';
                }
                // Keep profile strength in sync
                this.initProfileStrength();
            } else {
                let errorMsg = 'Failed to upload resume';
                try {
                    const data = await response.json();
                    errorMsg = data.message || errorMsg;
                } catch (e) {}
                this.showToast(errorMsg, 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            document.getElementById('resumeUpload').value = '';
        }
        return false;
    }

    async uploadProfilePhoto(eventOrFile) {
        // Prevent default navigation if called as a form submit
        if (eventOrFile && typeof eventOrFile.preventDefault === 'function') {
            eventOrFile.preventDefault();
            eventOrFile.stopPropagation();
        }
        // Robust extraction of the selected file
        let file = null;
        if (eventOrFile instanceof File) {
            file = eventOrFile;
        } else if (eventOrFile?.target?.files?.length) {
            file = eventOrFile.target.files[0];
        } else {
            const input = document.getElementById('profilePhotoUpload');
            if (input?.files?.length) file = input.files[0];
        }
        console.trace('JobPortalApp.uploadProfilePhoto', { fileName: (file?.name) || null });
        if (!file) {
            this.showToast('Please select a photo', 'error');
            return false;
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast('Photo size must be less than 2MB', 'error');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Only JPG and PNG images are allowed', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.baseURL}/resume/upload-photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            
            if (response.ok) {
                const data = await response.json();
                // Refresh profile and ensure we stay on profile
                await this.loadProfile();
                this.setCurrentPage('profile');
                this._suppressRedirectToDashboard = true;
                // Update local user data after profile photo change
                this.user.profilePhotoUrl = data.profilePhotoUrl;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showToast('Profile photo updated!', 'success');
                // Do not manually mutate DOM here; loadProfile will render the latest photo
            } else {
                let errorMsg = 'Failed to upload photo';
                try {
                    const data = await response.json();
                    errorMsg = data.message || errorMsg;
                } catch (e) {}
                this.showToast(errorMsg, 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            // Ensure no navigation occurs after upload; stay on profile
            console.log('[uploadProfilePhoto] finalize - staying on profile');
            // Return false to prevent any default navigation
            return false;
        }
    }

    initProfileStrength() {
        const fields = [
            document.getElementById('profileName')?.value,
            document.getElementById('profilePhone')?.value,
            document.getElementById('profileLocation')?.value,
            document.getElementById('profileTitle')?.value,
            document.getElementById('profileBio')?.value,
            document.getElementById('profileSkills')?.value,
            document.getElementById('profileEducation')?.value,
            document.getElementById('resumeUpload')?.files?.length
        ];
        
        let filled = fields.filter(f => f && f.length > 0).length;
        const resumeCheck = document.querySelector('.resume-current') ? 1 : 0;
        filled += resumeCheck;
        
        const strength = Math.min(100, Math.round((filled / 8) * 100));
        
        const fill = document.getElementById('strengthFill');
        const text = document.getElementById('strengthText');
        
        if (fill) {
            fill.style.width = `${strength}%`;
            fill.style.background = strength < 50 ? 'var(--warning-color)' : strength < 80 ? 'var(--accent-color)' : 'var(--success-color)';
        }
        if (text) {
            if (strength >= 80) {
                text.textContent = 'Your profile is ready for employers!';
            } else if (strength >= 50) {
                text.textContent = 'Good progress! Add more details to stand out.';
            } else {
                text.textContent = 'Complete your profile to increase visibility';
            }
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        // Force correct visibility state
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        modal.style.zIndex = '9999';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        if (modalId === 'loginModal') {
            setTimeout(() => this.generateCaptcha(), 100);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('show');
        modal.removeAttribute('style'); // clear stale inline styles
        modal.style.display = 'none';

        document.body.classList.remove('modal-open');

        // remove backdrops
        document.querySelectorAll('.modal-backdrop,.overlay').forEach(el => el.remove());

        // DO NOT re-add styles later with timeout; keep state clean
        const alertContainer = document.getElementById(`${modalId}Alert`);
        if (alertContainer) alertContainer.innerHTML = '';
        // Important: reset reusable state
        console.log('[modal] hideModal', modalId, 'cleaned up (strict)');
        // Do not touch classList again here
        // Do not restore display/visibility here to avoid mixing states
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    showAlert(message, type = 'info') {
        this.showToast(message, type);
    }

    showModalAlert(modalId, message, type = 'info') {
        const alertContainer = document.getElementById(`${modalId}Alert`);
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-${type}">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                    ${message}
                </div>
            `;
        }
    }

    formatJobType(type) {
        return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// Global functions (use window.app to avoid initialization order issues)
function showModal(modalId) { window.app?.showModal(modalId); }
function hideModal(modalId) { window.app?.hideModal(modalId); }
function showHome() { window.app?.showHome(); }
function showJobs() {
    if (window.app?.token) {
        window.app.loadPage('jobs');
    } else {
        window.app?.showModal('loginModal');
    }
}
function logout() { window.app?.logout(); }

window.app = new JobPortalApp();
// Expose wrappers in case inline handlers expect 'app' globals
window.appRef = window.app;
