export function loadSidebar(containerId) {
  const container = document.getElementById(containerId);

  container.innerHTML = `
    <aside class="sidebar">
        <div>
            <div class="sidebar-header">
                <div class="logo-container">
                    <img src="logo.png" alt="Clinic Logo" class="sidebar-logo">
                </div>
                <div class="sidebar-title">
                    <h2>
                        <span class="holy-family">SMART</span><br>
                        <span class="dental-clinic">DENTISTRY</span>
                    </h2>
                </div>
            </div>

            <ul class="sidebar-menu">
                <li><a href="admin.html"><i class="fas fa-home"></i>Dashboard</a></li>

                <li class="dropdown">
                    <a href="#" class="dropdown-toggle" data-action="toggle-dropdown">
                        <i class="fas fa-tooth"></i>
                        <span>My Clinic</span>
                        <i class="fas fa-chevron-down arrow"></i>
                    </a>
                    <ul class="submenu">
                        <li><a href="clinic-profile.html"><i class="fas fa-hospital"></i>Clinic Profile</a></li>
                        <li><a href="odontogram-prescription.html"><i class="fas fa-tooth"></i>Dental Chart</a></li>
                        <li><a href="Braces-Treatment.html"><i class="fas fa-tooth"></i>Braces Treatment</a></li>
                    </ul>
                </li>

                <li><a href="patients.html"><i class="fas fa-users"></i>Patients</a></li>
                <li><a href="Finance.html"><i class="fas fa-dollar-sign"></i>Finance & Records</a></li>
                <li><a href="Data-Back-Up.html"><i class="fas fa-database"></i>Data Backup</a></li>
            </ul>
        </div>

        <div class="sidebar-footer">
            <ul class="sidebar-menu">
                <li><a href="adminsettings.html"><i class="fas fa-cog"></i>Settings</a></li>
                <li><a href="landingpage.html" data-action="return-home"><i class="fas fa-arrow-left"></i>Return to Home</a>
            </ul>
        </div>
    </aside>
  `;

  attachSidebarEvents(container);
}

function attachSidebarEvents(container) {
  container.addEventListener('click', event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !container.contains(actionEl)) return;

    switch (actionEl.dataset.action) {
      case 'toggle-dropdown':
        handleDropdown(event, actionEl);
        break;

      case 'return-home':
        handleReturnHome(event);
        break;
    }
  });
}

function handleDropdown(event, trigger) {
  event.preventDefault();

  const dropdown = trigger.closest('.dropdown');
  const isActive = dropdown.classList.contains('active');

  document.querySelectorAll('.dropdown.active')
    .forEach(d => d.classList.remove('active'));

  dropdown.classList.toggle('active', !isActive);
}

function handleReturnHome(event) {
  event.preventDefault();

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
  localStorage.removeItem("role");

  window.location.href = "landingpage.html";
}
