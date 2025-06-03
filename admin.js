let currentDetailId = null;
let currentRejectId = null;
let currentTodayAppointmentId = null;
let currentAcceptId = null;
let currentAcceptIds = [];
let currentCompletionModal = null;
let currentCompletionId = null;  // Add this line
let currentWarningModal = null; // Add this at the top with other modal state variables
let today = new Date().toLocaleDateString('en-CA');
let isAcceptRequest = null;

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Debug logging function
function debugLog(label, data) {
    console.log(`%c${label}:`, 'color: #00bfff; font-weight: bold', data);
}

// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';

// Set initial theme
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.checked = currentTheme === 'dark';

themeToggle.addEventListener('change', function () {
    const theme = this.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// Toast notification function
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || (() => {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon;
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle" style="color: #28a745;"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle" style="color: #dc3545;"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle" style="color: var(--sidebar-active);"></i>';
    }

    toast.innerHTML = `${icon} ${message}`;
    toastContainer.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let appointmentRequests = [];
let appointmentLogs = [];
let todayAppointments = [
    // {
    //     id: 1,
    //     patientName: "John Smith",
    //     date: new Date().toISOString().split('T')[0],
    //     time: "10:00 AM",
    //     procedure: "Dental Cleaning",
    //     status: "Scheduled",
    //     patientInfo: {
    //         patientId: "HFDC-2023-003",
    //         birthdate: "1985-03-20",
    //         age: 38,
    //         gender: "Male",
    //         address: "789 Pine St, Manila",
    //         email: "johnsmith@example.com"
    //     }
    // },
    // {
    //     id: 2,
    //     patientName: "Maria Garcia",
    //     date: new Date().toISOString().split('T')[0],
    //     time: "11:30 AM",
    //     procedure: "Tooth Extraction",
    //     status: "Scheduled",
    //     patientInfo: {
    //         patientId: "HFDC-2023-004",
    //         birthdate: "1988-11-12",
    //         age: 35,
    //         gender: "Female",
    //         address: "321 Elm St, Pasig City",
    //         email: "mariagarcia@example.com"
    //     }
    // },
    // {
    //     id: 3,
    //     patientName: "David Wilson",
    //     date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    //     time: "9:00 AM",
    //     procedure: "Tooth Extraction",
    //     status: "Scheduled",
    //     patientInfo: {
    //         patientId: "HFDC-2023-005",
    //         birthdate: "1979-09-05",
    //         age: 44,
    //         gender: "Male",
    //         address: "654 Maple St, Taguig City",
    //         email: "davidwilson@example.com"
    //     }
    // }
];

// Statistics data
// let statsData = {
//     weekly: {
//         labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
//         visits: [30, 45, 35, 50, 40, 35, 45],
//         income: [1500, 2250, 1750, 2500, 2000, 1750, 2250]
//     },
//     monthly: {
//         labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
//         visits: [200, 250, 180, 300],
//         income: [10000, 12500, 9000, 15000]
//     },
//     yearly: {
//         labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
//         visits: [800, 900, 1200, 1100, 1300, 1400, 1200, 1100, 1000, 1200, 1300, 1500],
//         income: [40000, 45000, 60000, 55000, 65000, 70000, 60000, 55000, 50000, 60000, 65000, 75000]
//     }
// };

let statsData = {
    weekly: { labels: [], visits: [] },
    monthly: { labels: [], visits: [] },
    yearly: { labels: [], visits: [] }
};

// Fix time conversion function
function convertTo24Hour(time12h) {
    if (!time12h) return '';

    // Handle cases where time is already in 24h format
    if (time12h.toLowerCase().includes('am') || time12h.toLowerCase().includes('pm')) {
        const [time, modifier] = time12h.toUpperCase().split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);

        if (modifier === 'PM' && hours < 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) {
            hours = 0;
        }

        return `${String(hours).padStart(2, '0')}:${minutes}:00`;
    }

    return time12h; // Return as-is if already in 24h format
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async function () {
    try {
        debugLog('Initializing dashboard...');
        await fetchAppointmentRequests();
        debugLog('Initial Appointment Requests', appointmentRequests);
        await fetchAppointmentRequests(today);
        debugLog('Initial Today Appointments', todayAppointments);

        // Verify DOM elements including calendar elements
        const criticalElements = [
            'rejectConfirmationModal',
            'appointmentDetailsModal',
            'requestTableBody',
            'todayTableBody',
            'calendarDays',
            'calendarGrid',
            'currentMonthYear',
            'prevMonth',
            'nextMonth',
            'today'
        ];

        const missingElements = [];
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                missingElements.push(id);
            }
        });

        if (missingElements.length > 0) {
            throw new Error(`Critical elements missing: ${missingElements.join(', ')}`);
        }

        // Initialize components with error handling
        try {
            const logoutButtons = document.querySelectorAll('.logout-btn');
            logoutButtons.forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    sessionStorage.removeItem('user');
                    localStorage.removeItem('user');
                    window.location.href = 'landingpage.html';
                });
            });


            initCharts();
            initializeCalendar();
            updateRequestsTable();
            updateRequestCount();
            initializeTodaySection();
            updateStatistics(); // Initial statistics update

            // Set up auto-update interval for statistics (every 5 seconds)
            setInterval(() => {
                updateStatistics();
            }, 5000);

        } catch (e) {
            console.error('Failed to initialize dashboard components:', e);
        }

    } catch (e) {
        console.error('Dashboard initialization failed:', e);
        showToast('Failed to initialize dashboard. Please refresh the page.', 'error');
    }
});

async function fetchAppointmentRequests(date = null) {
    showLoading();
    let url = date
        ? `http://localhost:3000/appointments/${encodeURIComponent(date)}`
        : `http://localhost:3000/appointments`;

    try {

        let response = await fetch(url);
        let data = await response.json();

        console.log("TEST:", data)

        if (date) {
            todayAppointments = [];
            todayAppointments = data;
            console.log("NO DATE URL", url)
        } else {
            appointmentRequests = data;
            console.log("URL", url)
        }

    } catch (error) {
        console.error("Failed to fetch appointments:", error);
    }

    hideLoading();
}

// Appointment functions
function logAppointmentAction(request, action) {
    const logEntry = {
        id: request.id,
        patientName: request.patientName,
        requestedDateTime: `${request.requestedDate} ${request.requestedTime}`,
        procedure: request.procedure,
        status: action,
        actionDate: new Date().toISOString(),
        actionType: action === "Auto-Cancelled" ? "System" : "Manual"
    };

    // Get existing logs from localStorage
    let appointmentLogs = JSON.parse(localStorage.getItem('appointmentLogs') || '[]');
    appointmentLogs.push(logEntry);

    // Save updated logs to localStorage
    localStorage.setItem('appointmentLogs', JSON.stringify(appointmentLogs));
}

function updateRequestsTable() {
    const tableBody = document.getElementById('requestTableBody');
    tableBody.innerHTML = '';

    if (appointmentRequests.length === 0) {
        // Create a row showing no requests
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 20px;">
                <i class="fas fa-inbox" style="font-size: 24px; color: var(--text-muted); margin-bottom: 10px;"></i>
                <p style="color: var(--text-muted); margin: 0;">No appointment requests available</p>
            </td>
        `;
        tableBody.appendChild(emptyRow);

        // Disable select all checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        selectAllCheckbox.disabled = true;
        selectAllCheckbox.checked = false;

        // Hide bulk actions if visible
        const bulkActions = document.getElementById('requestBulkActions');
        bulkActions.classList.remove('show');
        return;
    }

    // Enable select all checkbox if there are requests
    const selectAllCheckbox = document.getElementById('selectAll');
    selectAllCheckbox.disabled = false;

    appointmentRequests.forEach(request => {
        const requestDate = new Date(request.request_date);
        const requestedDate = new Date(request.requested_date);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="checkbox-wrapper"><input type="checkbox" data-id="${request.id}" ${selectAllCheckbox.checked ? 'checked' : ''}></td>
            <td class="clickable-cell" onclick="showAppointmentDetails(${request.id})">
                <span class="patient-name">${request.patient_name}</span>
            </td>
            <td class="clickable-cell" onclick="showAppointmentDetails(${request.id})">
                ${formatDateForDisplay(requestedDate)}
            </td>
            <td class="clickable-cell" onclick="showAppointmentDetails(${request.id})">
                ${ensureTimeFormat(request.requested_time)}
            </td>
            <td class="clickable-cell" onclick="showAppointmentDetails(${request.id})">
                <span class="procedure-tag">${request.procedure}</span>
            </td>
            <td class="clickable-cell" onclick="showAppointmentDetails(${request.id})">
                ${formatDateToString(requestDate)}
            </td>
            <td>
                <button class="action-btn accept-btn" onclick="acceptRequest(${request.id})">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="action-btn reject-btn" onclick="showRejectModal(${request.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update bulk actions visibility after table update
    updateBulkActionVisibility('requestTableBody', 'requestBulkActions', 'requestSelectedCount');
}

function updateRequestCount() {
    const requestCount = document.getElementById('requestCount');
    const count = appointmentRequests.length;
    requestCount.textContent = count;

    // Show/hide based on count
    if (count > 0) {
        requestCount.classList.add('show');
    } else {
        requestCount.classList.remove('show');
    }
}

function openTodayTab(evt, tabName) {
    const tabContents = document.querySelectorAll('.tab-pane');
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabContents.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Function to update the modal buttons based on status
function updateModalButtons(status) {
    const completeBtn = document.querySelector('.action-btn.complete-btn');
    const cancelBtn = document.querySelector('.action-btn.cancel-btn');

    if (status === 'Completed') {
        completeBtn.disabled = true;
        completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
        completeBtn.style.opacity = '0.7';
        completeBtn.style.cursor = 'not-allowed';

        cancelBtn.disabled = true;
        cancelBtn.style.opacity = '0.7';
        cancelBtn.style.cursor = 'not-allowed';
    } else {
        completeBtn.disabled = false;
        completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Complete Selected';  // Changed from "Mark as Completed" to "Complete"
        completeBtn.style.opacity = '1';
        completeBtn.style.cursor = 'pointer';

        cancelBtn.disabled = false;
        cancelBtn.style.opacity = '1';
        cancelBtn.style.cursor = 'pointer';
    }
}

function showTodayAppointmentDetails(id) {
    currentTodayAppointmentId = id;
    const appointment = todayAppointments.find(app => app.id === id);
    console.log("ALANSON:", appointment)

    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }

    // Update buttons based on status
    updateModalButtons(appointment.status);

    // Reset all tabs to inactive
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Set patient info tab as active
    document.getElementById('today-patient-info').classList.add('active');
    document.querySelector('.tab-btn[onclick*="today-patient-info"]').classList.add('active');

    // Populate patient info
    document.getElementById('today-patient-name').textContent = appointment.firstName + '' + appointment.lastName;
    document.getElementById('today-patient-id').textContent = appointment.patientId || 'N/A';
    document.getElementById('today-contact').textContent = appointment.phoneNumber || 'Not provided';
    document.getElementById('today-email').textContent = appointment.email || 'Not provided';
    document.getElementById('today-age').textContent = appointment.age || 'Not provided';
    document.getElementById('today-gender').textContent = appointment.gender || 'Not provided';
    document.getElementById('today-address').textContent = appointment.address || 'Not provided';

    // Populate appointment info
    document.getElementById('today-appointment-date').textContent = formatDateForDisplay(new Date(appointment.requestedDate));
    document.getElementById('today-appointment-time').textContent = ensureTimeFormat(appointment.requestedTime);
    document.getElementById('today-procedure').textContent = appointment.procedure;

    // Set status badge
    const statusBadge = document.getElementById('today-status');
    statusBadge.textContent = appointment.status;
    statusBadge.className = 'status-badge status-' + appointment.status.toLowerCase();

    // Load photos and forms
    loadTodayPatientPhotos(id);
    loadTodayPatientForms(id);

    // Load appointment history
    loadTodayAppointmentHistory(id);

    // Show modal
    document.getElementById('todayAppointmentModal').classList.add('active');

    // Update modal footer buttons based on status
    const modalFooter = document.querySelector('#todayAppointmentModal .modal-footer');
    if (appointment.status === "Completed") {
        modalFooter.innerHTML = `
            <div style="color: var(--text-muted); font-style: italic;">
                <i class="fas fa-check-circle"></i> This appointment has been completed
            </div>`;
    } else if (appointment.status === "Cancelled") {
        modalFooter.innerHTML = `
            <div style="color: var(--text-muted); font-style: italic;">
                <i class="fas fa-times-circle"></i> This appointment has been cancelled
            </div>`;
    } else {
        modalFooter.innerHTML = `
            <button class="action-btn complete-btn" onclick="completeAppointment(currentTodayAppointmentId)">
                <i class="fas fa-check-circle"></i> Mark as Completed
            </button>
            <button class="action-btn cancel-btn" onclick="cancelTodayAppointment(currentTodayAppointmentId)">
                <i class="fas fa-times"></i> Cancel Appointment
            </button>
        `;
    }
}

function loadTodayPatientPhotos(patientId) {
    const beforePhotos = document.getElementById('today-before-photos');
    const afterPhotos = document.getElementById('today-after-photos');

    // Clear existing photos
    beforePhotos.innerHTML = '';
    afterPhotos.innerHTML = '';

    // Sample data - replace with actual data from your backend
    const sampleBeforePhotos = [];
    const sampleAfterPhotos = [];

    if (sampleBeforePhotos.length === 0) {
        beforePhotos.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-camera-slash"></i>
                <p>No before photos uploaded</p>
            </div>
        `;
    } else {
        sampleBeforePhotos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo.url}" alt="Before treatment">
                <button class="delete-photo" onclick="deleteTodayPhoto(${photo.id}, 'before')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            beforePhotos.appendChild(photoItem);
        });
    }

    if (sampleAfterPhotos.length === 0) {
        afterPhotos.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-camera-slash"></i>
                <p>No after photos uploaded</p>
            </div>
        `;
    } else {
        sampleAfterPhotos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo.url}" alt="After treatment">
                <button class="delete-photo" onclick="deleteTodayPhoto(${photo.id}, 'after')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            afterPhotos.appendChild(photoItem);
        });
    }
}

function loadTodayPatientForms(patientId) {
    const formsList = document.getElementById('today-forms-list');
    const formPreview = document.getElementById('today-form-preview');

    // Clear existing forms
    formsList.innerHTML = '';

    // Sample data - replace with actual data from your backend
    const sampleForms = [];

    if (sampleForms.length === 0) {
        formsList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-file-excel"></i>
                <p>No forms uploaded</p>
            </li>
        `;
    } else {
        sampleForms.forEach(form => {
            const formItem = document.createElement('li');
            formItem.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <div>
                    <div>${form.name}</div>
                    <small>${formatDateForDisplay(new Date(form.date))}</small>
                </div>
            `;
            formItem.addEventListener('click', () => previewTodayForm(form.id));
            formsList.appendChild(formItem);
        });
    }
}

function uploadTodayPhoto(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';  // Accept only image files

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB', 'error');
            return;
        }

        // Create temporary image to check dimensions
        const img = new Image();
        img.onload = function () {
            // Create canvas with fixed dimensions
            const canvas = document.createElement('canvas');
            canvas.width = 800;  // Fixed width
            canvas.height = 600; // Fixed height

            // Draw and resize image to canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 800, 600);

            // Convert to base64
            const resizedImage = canvas.toDataURL('image/jpeg', 0.85);

            // Update UI with the new photo
            const photoContainer = document.getElementById(`today-${type}-photos`);
            photoContainer.innerHTML = `
                <div class="photo-item">
                    <img src="${resizedImage}" alt="${type} treatment photo">
                    <button class="delete-photo" onclick="deleteTodayPhoto('${type}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            showToast(`${type} photo uploaded successfully`, 'success');
        };

        img.onerror = function () {
            showToast('Error loading image. Please try again.', 'error');
        };

        // Read the file
        const reader = new FileReader();
        reader.onload = function (e) {
            img.src = e.target.result;
        };
        reader.onerror = function () {
            showToast('Error reading file. Please try again.', 'error');
        };
        reader.readAsDataURL(file);
    };

    input.click();
}

function deleteTodayPhoto(type) {
    if (confirm(`Are you sure you want to delete this ${type} photo?`)) {
        const photoContainer = document.getElementById(`today-${type}-photos`);
        photoContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-camera-slash"></i>
                <p>No ${type} photos uploaded</p>
                <small>Upload a photo (800x600 pixels)</small>
            </div>
        `;
        showToast(`${type} photo deleted`, 'success');
    }
}

function uploadTodayForm() {
    showToast('Upload form functionality would be implemented here', 'info');
}

function deleteTodayPhoto(photoId, type) {
    if (confirm(`Are you sure you want to delete this ${type} photo?`)) {
        showToast(`Deleted ${type} photo`, 'success');
        loadTodayPatientPhotos(currentTodayAppointmentId);
    }
}

function previewTodayForm(formId) {
    const formPreview = document.getElementById('today-form-preview');
    formPreview.innerHTML = `
        <iframe src="path/to/form_${formId}.pdf" style="width:100%; height:100%; border:none;"></iframe>
    `;
}

// Today's appointments functions
function initializeTodaySection() {
    const thisDay = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDate').textContent = thisDay.toLocaleDateString('en-US', options);
    updateAppointmentsForDate(today);
}



function cancelAppointment(id) {
    const appointmentIndex = todayAppointments.findIndex(app => app.id === id);
    if (appointmentIndex !== -1) {
        const appointment = todayAppointments[appointmentIndex];
        todayAppointments[appointmentIndex].status = "Cancelled";

        // Update canceled count
        const canceledCount = document.getElementById('canceledCount');
        canceledCount.textContent = (parseInt(canceledCount.textContent) + 1).toString();

        // Update UI
        updateAppointmentsForDate(new Date(appointment.date).toLocaleDateString('en-CA'));
        updateStatistics();
        updateCalendar(new Date());

        showToast(`Appointment cancelled for ${appointment.patientName}`, 'warning');
    }
}



function closePhotoConfirmationModal() {
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function closeCompleteModal() {
    const modal = document.getElementById('completeConfirmationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}


function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Standardize form handling
function uploadForm(isToday = false) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.png';

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formId = 'form-' + Date.now();
            const formName = file.name;
            const listId = isToday ? 'today-forms-list' : 'forms-list';

            addFormToList(formId, formName, listId);
            showToast('Form uploaded successfully!', 'success');
        }
    };

    fileInput.click();
}



function proceedToPhotos(id) {
    closeWarningModal();  // Keep this existing close
    closeCompletionModal(); // Add this line to close completion modal
    showTodayAppointmentDetails(id);

    setTimeout(() => {
        const photosTabBtn = document.querySelector('.tab-btn[onclick*="today-photos"]');
        if (photosTabBtn) {
            photosTabBtn.click();
        }
    }, 100);
}

function completeWithoutPhotos(id) {
    if (confirm('Are you sure you want to complete this appointment without photos? This action cannot be undone.')) {
        proceedWithCompletion(id);
        closeWarningModal();
    }
}

function proceedWithCompletion(id) {
    const appointmentIndex = todayAppointments.findIndex(app => app.id === id);
    const appointment = todayAppointments[appointmentIndex];

    // Update appointment status
    todayAppointments[appointmentIndex].status = 'Completed';
    todayAppointments[appointmentIndex].completedAt = new Date().toISOString();

    // Update UI
    updateAppointmentsForDate(new Date().toLocaleDateString('en-CA'));
    updateStatistics();
    updateCalendar(new Date());

    // Show confirmation
    showToast(`Appointment completed for ${appointment.patientName}`, 'success');

    // Close modals
    closeCompletionModal();
    closeTodayAppointmentModal();
}

function updateTodayCount() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointmentCount = todayAppointments.filter(app =>
        app.date === todayStr &&
        app.status !== "Completed" &&
        app.status !== "Cancelled"
    ).length;

    const todayCountBadge = document.getElementById('todayCount');
    todayCountBadge.textContent = todayAppointmentCount;

    // Show/hide the notification badge
    if (todayAppointmentCount > 0) {
        todayCountBadge.classList.add('show');
    } else {
        todayCountBadge.classList.remove('show');
    }
}

function cancelTodayAppointment(id) {
    const appointment = todayAppointments.find(app => app.id === id);
    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }

    // Create and show the cancel confirmation modal
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';

    // Add click event listener to close on blank space click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeCompletionModal();
        }
    });

    modal.innerHTML = `
        <div class="confirmation-content" style="max-width: 500px;">
            <div class="confirmation-header">
                <div style="display: flex; align-items: center;">
                    <div class="confirmation-icon warning-icon">
                        <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
                    </div>
                    <h3 class="confirmation-title">Cancel Appointment</h3>
                </div>
                <button onclick="closeCompletionModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="confirmation-message">
                <p>You're about to cancel this appointment:</p>
                <div class="appointment-info" style="margin: 15px 0; padding: 15px; background: var(--hover-bg); border-radius: 8px;">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div class="info-content">
                            <label>Patient</label>
                            <span>${appointment.patientName}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-tooth"></i>
                        <div class="info-content">
                            <label>Procedure</label>
                            <span>${appointment.procedure}</span>
                        </div>
                    </div>
                </div>
                <p>This action cannot be undone. Are you sure you want to cancel this appointment?</p>
            </div>
            
            <div class="confirmation-buttons" style="justify-content: space-between;">
                <button class="cancel-btn" onclick="closeCompletionModal()">
                    <i class="fas fa-times"></i> Back
                </button>
                <button class="warning-btn" onclick="proceedWithCancellation(${id})">
                    <i class="fas fa-times-circle"></i> Cancel Appointment
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    // Store reference to the modal for later closing
    currentCompletionModal = modal;
}

function proceedWithCancellation(id) {
    const appointmentIndex = todayAppointments.findIndex(app => app.id === id);
    if (appointmentIndex !== -1) {
        const appointment = todayAppointments[appointmentIndex];
        todayAppointments[appointmentIndex].status = "Cancelled";

        // Update the status badge and modal footer immediately
        const statusBadge = document.getElementById('today-status');
        statusBadge.textContent = "Cancelled";
        statusBadge.className = 'status-badge status-cancelled';

        const modalFooter = document.querySelector('#todayAppointmentModal .modal-footer');
        modalFooter.innerHTML = `
            <div style="color: var(--text-muted); font-style: italic;">
                <i class="fas fa-times-circle"></i> This appointment has been cancelled
            </div>`;

        // Update UI
        updateAppointmentsForDate(new Date(appointment.date).toLocaleDateString('en-CA'));
        updateStatistics();
        updateCalendar(new Date());

        // Show confirmation toast
        showToast(`Appointment cancelled for ${appointment.patientName}`, 'warning');

        // Close the confirmation modal
        closeCompletionModal();

        // Close the appointment details modal
        closeTodayAppointmentModal();
    }
}

// Add these new helper functions for date formatting
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

function formatDateToString(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

function ensureTimeFormat(timeStr) {
    if (!timeStr) return '';

    // If time already includes AM/PM, return as is
    if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
        return timeStr;
    }

    // Convert 24h to 12h format with AM/PM
    let [hours, minutes] = timeStr.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

async function updateAppointmentsForDate(date) {
    const formattedDate = date;
    await fetchAppointmentRequests(formattedDate);

    const todayTableBody = document.getElementById('todayTableBody');
    const todayCount = document.getElementById('todayCount');

    // Clear existing appointments
    todayTableBody.innerHTML = '';

    // Update appointment count
    todayCount.textContent = todayAppointments.length;

    // Show/hide based on count
    if (todayAppointments.length > 0) {
        todayCount.classList.add('show');
    } else {
        todayCount.classList.remove('show');

        // Show empty state row
        const emptyRow = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.style.textAlign = 'center';
        td.style.color = 'var(--text-muted)';
        td.style.padding = '20px';
        td.textContent = 'No appointments found for this date.';
        emptyRow.appendChild(td);
        todayTableBody.appendChild(emptyRow);

        // Exit early since there's nothing more to render
        return;
    }

    // Sort appointments by time (implement actual sorting logic if needed)
    todayAppointments.sort((a, b) => {
        return a.requestedTime.localeCompare(b.requestedTime);
    });

    // Populate table
    todayAppointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.requestedDate);
        const row = document.createElement('tr');
        row.onclick = (e) => {
            if (!e.target.closest('button') && !e.target.closest('input[type="checkbox"]')) {
                showTodayAppointmentDetails(appointment.id);
            }
        };
        row.style.cursor = 'pointer';

        let actionColumn = '';
        if (appointment.status === "Scheduled") {
            actionColumn = `
                <button class="action-btn complete-btn small" onclick="event.stopPropagation(); completeAppointment(${appointment.id})" title="Complete">
                    <i class="fas fa-check-circle"></i> Complete
                </button>
                <button class="action-btn cancel-btn small" onclick="event.stopPropagation(); showCancelConfirmation(${appointment.id})" title="Cancel">
                    <i class="fas fa-times-circle"></i> Cancel
                </button>
            `;
        }

        row.innerHTML = `
            <td class="checkbox-wrapper">
                ${appointment.status === "Scheduled" ? `<input type="checkbox" data-id="${appointment.id}">` : ''}
            </td>
            <td><span class="patient-name" data-full-text="${appointment.patientName}">${appointment.patientName}</span></td>
            <td>${formatDateForDisplay(appointmentDate)}</td>
            <td>${ensureTimeFormat(appointment.requestedTime)}</td>
            <td><span class="procedure-tag" data-full-text="${appointment.procedure}">${appointment.procedure}</span></td>
            <td><span class="status-badge status-${appointment.status}">
                ${appointment.status}
            </span></td>
            <td>${actionColumn}</td>
        `;
        todayTableBody.appendChild(row);
    });

    updateBulkActionVisibility('todayTableBody', 'appointmentBulkActions', 'appointmentSelectedCount');
}


function showCancelConfirmation(id) {
    const appointment = todayAppointments.find(app => app.id === id);
    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }

    // Create and show the cancel confirmation modal
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeCompletionModal();
        }
    });

    modal.innerHTML = `
        <div class="confirmation-content" style="max-width: 500px;">
            <div class="confirmation-header">
                <div style="display: flex; align-items: center;">
                    <div class="confirmation-icon warning-icon">
                        <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
                    </div>
                    <h3 class="confirmation-title">Cancel Appointment</h3>
                </div>
                <button onclick="closeCompletionModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="confirmation-message">
                <p>You're about to cancel this appointment:</p>
                <div class="appointment-info" style="margin: 15px 0; padding: 15px; background: var(--hover-bg); border-radius: 8px;">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div class="info-content">
                            <label>Patient</label>
                            <span>${appointment.patientName}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-tooth"></i>
                        <div class="info-content">
                            <label>Procedure</label>
                            <span>${appointment.procedure}</span>
                        </div>
                    </div>
                </div>
                <p>This action cannot be undone. Are you sure you want to cancel this appointment?</p>
            </div>
            
            <div class="confirmation-buttons" style="justify-content: space-between;">
                <button class="cancel-btn" onclick="closeCompletionModal()">
                    <i class="fas fa-times"></i> Back
                </button>
                <button class="warning-btn" onclick="proceedWithCancellation(${id})">
                    <i class="fas fa-times-circle"></i> Cancel Appointment
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    currentCompletionModal = modal;
}

// Statistics functions
function updateStatistics() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Count only today's scheduled appointments
    const scheduledToday = todayAppointments.filter(app =>
        app.date === today && app.status === "Scheduled"
    ).length;

    // Count total appointment requests
    const requests = appointmentRequests.length;

    // Count all completed appointments
    const completed = todayAppointments.filter(app =>
        app.status === "Completed"
    ).length;

    // Count all cancelled appointments
    const canceled = todayAppointments.filter(app =>
        app.status === "Cancelled"
    ).length;

    // Update the UI
    document.getElementById('scheduledCount').textContent = scheduledToday;
    document.getElementById('upcomingCount').textContent = requests;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('canceledCount').textContent = canceled;

    // Keep walk-in at 0 as requested
    document.getElementById('walkInCount').textContent = '0';
}

// Chart functions
let patientActivityChart;

async function initCharts() {

    await updateWeeklyStats()
    console.log("outside", statsData);

    const ctx = document.getElementById('patientActivityChart').getContext('2d');

    patientActivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: statsData.weekly.labels,
            datasets: [{
                label: 'Patient Visits',
                data: statsData.weekly.visits,
                backgroundColor: 'rgba(0, 191, 255, 0.7)',
                borderColor: 'rgba(0, 191, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                        callback: function (value) {
                            const metric = document.getElementById('chartMetric').value;
                            if (metric === 'income') return '₱' + value.toLocaleString('en-PH');
                            return value;
                        }
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const metric = document.getElementById('chartMetric').value;
                            if (metric === 'income') return '₱' + context.parsed.y.toLocaleString('en-PH');
                            return context.parsed.y;
                        }
                    }
                },
                legend: { display: false }
            }
        }
    });

    updateTimePeriod('weekly');

    document.querySelectorAll('.time-period-btn').forEach(button => {
        button.addEventListener('click', function () {
            const period = this.getAttribute('data-period');
            updateTimePeriod(period);
            document.querySelectorAll('.time-period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    document.getElementById('chartMetric').addEventListener('change', function () {
        const activePeriod = document.querySelector('.time-period-btn.active').getAttribute('data-period');
        updateChartData(activePeriod, this.value);
    });
}

function updateTimePeriod(period) {
    const metric = document.getElementById('chartMetric').value;
    updateChartData(period, metric);
    updatePercentageText(period);
}

async function updateChartData(period, metric) {
    console.log("updateChartData", period, metric)

    await loadStatsForPeriod(period)

    const data = statsData[period];

    patientActivityChart.data.datasets[0].label = metric === 'visits' ? 'Patient Visits' : 'Total Income ($)';
    patientActivityChart.data.datasets[0].data = metric === 'visits' ? data.visits : data.income;
    patientActivityChart.data.datasets[0].backgroundColor = metric === 'visits' ?
        'rgba(0, 191, 255, 0.7)' : 'rgba(76, 175, 80, 0.7)';
    patientActivityChart.data.datasets[0].borderColor = metric === 'visits' ?
        'rgba(0, 191, 255, 1)' : 'rgba(76, 175, 80, 1)';

    patientActivityChart.data.labels = data.labels;
    patientActivityChart.update();
}

async function loadStatsForPeriod(period) {
    if (period === 'monthly') return updateMonthlyStats();
    if (period === 'yearly') return updateYearlyStats();
    if (period === 'weekly') return updateWeeklyStats();
}

function updatePercentageText(period) {
    const percentageElement = document.querySelector('.percentage-change');
    const metric = document.getElementById('chartMetric').value;
    const data = statsData[period][metric];

    const current = Array.isArray(data) ? data[data.length - 1] : data;
    const previous = Array.isArray(data) ? data[data.length - 2] : data * 0.9;

    const percentage = Math.round(((current - previous) / previous) * 100);
    const timeFrame = period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year';

    const text = `${percentage}% ${percentage >= 0 ? 'higher' : 'lower'} than last ${timeFrame}`;
    percentageElement.textContent = text;
    percentageElement.style.color = percentage >= 0 ? '#00bfff' : '#f44336';
}

// Calendar functions
// Default: load weekly stats only
async function updateWeeklyStats() {
    try {
        const res = await fetch('http://localhost:3000/stats/weekly');
        const data = await res.json();

        statsData.weekly = {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            visits: formatData(data, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
        };

        console.log('Weekly stats loaded:', statsData.weekly);

    } catch (err) {
        console.error('Failed to load weekly stats:', err);
    }
}

async function updateMonthlyStats() {
    try {
        const res = await fetch('http://localhost:3000/stats/monthly');
        const data = await res.json();

        const labels = Array.from({ length: data.length }, (_, i) => `Week ${i + 1}`);

        statsData.monthly = {
            labels,
            visits: formatData(data, labels),
        };

        console.log('Monthly stats loaded:', statsData.monthly);

    } catch (err) {
        console.error('Failed to load monthly stats:', err);
    }
}

async function updateYearlyStats() {
    try {
        const res = await fetch('http://localhost:3000/stats/yearly');
        const data = await res.json();

        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        statsData.yearly = {
            labels,
            visits: formatData(data, labels),
        };

        console.log('Yearly stats loaded:', statsData.yearly);

    } catch (err) {
        console.error('Failed to load yearly stats:', err);
    }
}

const formatData = (rawData, labels) => {
    const map = new Map(rawData.map(item => [item.day || item.week || item.month, +item.visits]));
    return labels.map(label => map.get(label) || 0);
};

function initializeCalendar() {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');

    calendarDays.innerHTML = '';
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day-header';
        dayElement.textContent = day;
        calendarDays.appendChild(dayElement);
    });

    updateCalendar(new Date());

    document.getElementById('prevMonth').addEventListener('click', () => {
        const currentDate = new Date(currentMonthYear.dataset.date);
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar(currentDate);
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        const currentDate = new Date(currentMonthYear.dataset.date);
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar(currentDate);
    });

    document.getElementById('today').addEventListener('click', () => {
        const today = new Date();
        updateCalendar(today);

        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        const allDays = document.querySelectorAll('.calendar-day');
        allDays.forEach(dayElement => {
            if (dayElement.classList.contains('today')) {
                dayElement.classList.add('selected');
                const formattedDate = today.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                document.getElementById('todayDate').textContent = formattedDate;
                updateAppointmentsForDate(today.toLocaleDateString('en-CA'));
            }
        });
    });

    currentMonthYear.addEventListener('click', (e) => {
        const currentDate = new Date(currentMonthYear.dataset.date);
        if (!document.querySelector('.modal-overlay')) {
            showYearPicker(currentDate.getFullYear());
        }
    });
}

function updateCalendar(date) {
    const currentMonthYear = document.getElementById('currentMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    const today = new Date();

    currentMonthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    currentMonthYear.dataset.date = date.toISOString();
    calendarGrid.innerHTML = '';

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const startingDay = firstDay.getDay();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();

    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);

        // Format dates consistently for comparison
        const formattedDate = formatDate(currentDate);

        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
            if (date.toDateString() === today.toDateString()) {
                dayElement.classList.add('selected');
            }
        }

        const hasAppointments = todayAppointments.some(appointment => {
            const apptDate = new Date(appointment.date);
            return apptDate.getFullYear() === currentDate.getFullYear() &&
                apptDate.getMonth() === currentDate.getMonth() &&
                apptDate.getDate() === currentDate.getDate() &&
                appointment.status !== "Completed" &&
                appointment.status !== "Cancelled";
        });

        if (hasAppointments) {
            dayElement.classList.add('has-appointments');

            // Create and append the appointment indicator dot
            const dot = document.createElement('div');
            dot.className = 'appointment-dot';
            dayElement.appendChild(dot);
        }

        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);

        dayElement.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day.selected').forEach(el => {
                el.classList.remove('selected');
            });
            dayElement.classList.add('selected');

            updateAppointmentsForDate(currentDate);

            const formattedDate = currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('todayDate').textContent = formattedDate;
            updateAppointmentsForDate(currentDate.toLocaleDateString('en-CA'));
        });
    }
}

// Helper function to format dates consistently
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Date picker functions
function showYearPicker(year) {
    closeDatePicker();

    const calendarContainer = document.querySelector('.calendar-container');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const datePickerPopup = document.createElement('div');
    datePickerPopup.className = 'date-picker-popup';

    calendarContainer.appendChild(overlay);
    overlay.appendChild(datePickerPopup);

    setTimeout(() => overlay.classList.add('active'), 10);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDatePicker();
        }
    });

    const header = document.createElement('div');
    header.className = 'date-picker-header';
    header.innerHTML = `<h3>Select Year</h3><i class="fas fa-times" onclick="closeDatePicker()"></i>`;
    datePickerPopup.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'date-picker-grid';

    const startYear = year - 50;
    const endYear = year + 50;

    for (let y = startYear; y <= endYear; y++) {
        const yearElement = document.createElement('div');
        yearElement.className = 'year-option' + (y === year ? 'selected' : '');
        yearElement.textContent = y;
        yearElement.addEventListener('click', () => {
            document.querySelectorAll('.year-option').forEach(el => el.classList.remove('selected'));
            yearElement.classList.add('selected');
            showMonthPicker(y);
        });
        grid.appendChild(yearElement);
    }

    datePickerPopup.appendChild(grid);
    datePickerPopup.appendChild(createDatePickerActions());

    setTimeout(() => {
        const selectedYear = datePickerPopup.querySelector('.year-option.selected');
        if (selectedYear) selectedYear.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
}

function showMonthPicker(year) {
    const datePickerPopup = document.querySelector('.date-picker-popup');
    if (!datePickerPopup) return;

    datePickerPopup.innerHTML = '';
    datePickerPopup.appendChild(createDatePickerHeader(`Select Month ${year}`));

    const grid = document.createElement('div');
    grid.className = 'date-picker-grid';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((month, index) => {
        const monthElement = document.createElement('div');
        monthElement.className = 'month-option';
        monthElement.textContent = month;
        monthElement.addEventListener('click', () => {
            const currentDate = new Date();
            currentDate.setFullYear(year);
            currentDate.setMonth(index);
            updateCalendar(currentDate);
            closeDatePicker();
        });
        grid.appendChild(monthElement);
    });

    datePickerPopup.appendChild(grid);
    datePickerPopup.appendChild(createDatePickerActions());
}

function createDatePickerHeader(title) {
    const header = document.createElement('div');
    header.className = 'date-picker-header';
    header.innerHTML = `<h3>${title}</h3><i class="fas fa-times" onclick="closeDatePicker()"></i>`;
    return header;
}

function createDatePickerActions() {
    const actions = document.createElement('div');
    actions.className = 'date-picker-actions';
    actions.innerHTML = `<button class="cancel" onclick="closeDatePicker()">Cancel</button>`;
    return actions;
}

function closeDatePicker() {
    const calendarContainer = document.querySelector('.calendar-container');
    const overlay = calendarContainer.querySelector('.modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// Modal functions
function showRejectModal(id) {
    currentRejectId = id;
    // Close details modal before showing reject modal
    closeDetailsModal();
    document.getElementById('rejectConfirmationModal').classList.add('active');
}

function closeRejectModal() {
    document.getElementById('rejectConfirmationModal').classList.remove('active');
    currentRejectId = null;
    document.getElementById('rejectionReason').value = '';
}

function submitRejection() {
    const reason = document.getElementById('rejectionReason').value.trim();
    if (!reason) {
        showToast('Please provide a reason for rejection', 'warning');
        return;
    }

    if (currentRejectId) {
        rejectRequest(currentRejectId, reason);
    } else {
        bulkRejectRequests(reason);
    }

    closeRejectModal();
    currentDetailId = null;
}

async function rejectRequest(id, reason) {
    isAcceptRequest = false;
    const requestIndex = appointmentRequests.findIndex(req => req.id === id);
    if (requestIndex !== -1) {
        const request = appointmentRequests[requestIndex];

        const formattedRequest = {
            patientName: request.patient_name,
            procedure: request.procedure,
            requestedDate: request.requested_date,
            requestedTime: request.requested_time,
            contact: request.contact,
            email: request.email,
            id: request.id
        };

        window.currentRequestToNotify = formattedRequest;

        const label = `Do you want to send a confirmation message via SMS to ${formattedRequest.patientName}?`;
        document.getElementById("notificationModalMessage").textContent = label;
        document.getElementById("notificationConfirmationModal").classList.add("active");

        await fetch("http://localhost:3000/appointments/updateStatus", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                appointment_id: id,   // 👈 Match the param your backend expects
                new_status: 4        // 👈 Match field expected by backend
            })
        });

        // Log the rejection
        logAppointmentAction({
            ...request,
            rejectionReason: reason
        }, "Rejected");

        // Remove the request from the array
        appointmentRequests.splice(requestIndex, 1);

        // Update UI
        updateRequestsTable();
        updateRequestCount();
        updateStatistics();

        // Show success notification
        showToast(`Rejected appointment for ${request.patient_name}`, 'warning');
    }
}

function openTab(evt, tabName) {
    const modalId = evt.target.closest('.confirmation-modal').id;
    const modal = document.getElementById(modalId);

    if (!modal) return;

    const tabContents = modal.querySelectorAll('.tab-pane');
    const tabButtons = modal.querySelectorAll('.tab-btn');

    tabContents.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        evt.currentTarget.classList.add('active');
    }
}

async function fetchAppointmentRequestsById(id) {
    const response = await fetch(`http://localhost:3000/appointments/id/${id}`)
    console.log("BY ID:", response)
    return await response.json();
}

async function showAppointmentDetails(id) {
    debugLog('Opening details for ID', id);
    currentDetailId = id;
    console.log(id)
    const request = await fetchAppointmentRequestsById(id);

    if (!request) {
        debugLog('Request not found for ID', id);
        showToast('Appointment not found', 'error');
        return;
    }

    // Reset all tabs to inactive
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Set patient info tab as active
    document.getElementById('patient-info').classList.add('active');
    document.querySelector('.tab-btn[onclick*="patient-info"]').classList.add('active');

    debugLog('Found request', request);

    // Close any other open modals first
    closeAcceptModal();
    closeRejectModal();

    // Populate patient info
    document.getElementById('detail-patient-name').textContent = request.patientInfo?.patientName;
    // document.getElementById('detail-patient-id').textContent = request.patientInfo?.patientId || 'N/A';
    document.getElementById('detail-contact').textContent = request.patientInfo?.phoneNumber || 'Not provided';
    document.getElementById('detail-email').textContent = request.patientInfo?.email || 'Not provided';
    document.getElementById('detail-age').textContent = request.patientInfo?.age || 'Not provided';
    document.getElementById('detail-gender').textContent = request.patientInfo?.gender || 'Not provided';
    document.getElementById('detail-address').textContent = request.patientInfo?.address || 'Not provided';

    // Populate appointment info
    document.getElementById('detail-requested-date').textContent = formatDateForDisplay(new Date(request.requestedDate));
    document.getElementById('detail-requested-time').textContent = ensureTimeFormat(request.requestedTime);
    document.getElementById('detail-procedure').textContent = request.procedure;
    document.getElementById('detail-notes').textContent = request.notes || 'No additional notes';

    // Load photos and forms (placeholder - you would implement actual loading)
    loadPatientPhotos(id);
    loadPatientForms(id);

    // Load appointment history
    loadAppointmentHistory(id);

    // Show modal
    document.getElementById('appointmentDetailsModal').classList.add('active');
}

function loadPatientPhotos(patientId) {
    const beforePhotos = document.getElementById('before-photos');
    const afterPhotos = document.getElementById('after-photos');

    // Clear existing photos
    beforePhotos.innerHTML = '';
    afterPhotos.innerHTML = '';

    // Add empty state for both sections by default
    beforePhotos.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-camera-slash"></i>
            <p>No before photos uploaded</p>
            <small>Upload a photo (800x600 pixels)</small>
        </div>
    `;

    afterPhotos.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-camera-slash"></i>
            <p>No after photos uploaded</p>
            <small>Upload a photo (800x600 pixels)</small>
        </div>
    `;
}

function uploadPhoto(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        // Create temporary image to check dimensions
        const img = new Image();
        img.onload = function () {
            // Create canvas with fixed dimensions
            const canvas = document.createElement('canvas');
            canvas.width = 800;  // Fixed width
            canvas.height = 600; // Fixed height

            // Draw and resize image to canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 800, 600);

            // Convert to base64
            const resizedImage = canvas.toDataURL('image/jpeg', 0.85);

            // Update UI with the new photo
            const photoContainer = document.getElementById(`${type}-photos`);
            photoContainer.innerHTML = `
                <div class="photo-item">
                    <img src="${resizedImage}" alt="${type} treatment photo">
                    <button class="delete-photo" onclick="deletePhoto('${type}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            showToast(`${type} photo uploaded successfully`, 'success');
        };

        img.onerror = function () {
            showToast('Error loading image', 'error');
        };

        // Read the file
        const reader = new FileReader();
        reader.onload = function (e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    input.click();
}

function deletePhoto(type) {
    if (confirm(`Are you sure you want to delete this ${type} photo?`)) {
        const photoContainer = document.getElementById(`${type}-photos`);
        photoContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-camera-slash"></i>
                <p>No ${type} photos uploaded</p>
                <small>Upload a photo (800x600 pixels)</small>
            </div>
        `;
        showToast(`${type} photo deleted`, 'success');
    }
}

function loadPatientForms(patientId) {
    const formsList = document.getElementById('forms-list');
    const formPreview = document.getElementById('form-preview');

    // Clear existing forms
    formsList.innerHTML = '';

    // Sample data - replace with actual data from your backend
    const sampleForms = [
        { id: 1, name: 'Medical History Form.pdf', date: '2023-05-15' },
        { id: 2, name: 'Consent Form.pdf', date: '2023-05-15' }
    ];

    if (sampleForms.length === 0) {
        formsList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-file-excel"></i>
                <p>No forms uploaded</p>
            </li>
        `;
    } else {
        sampleForms.forEach(form => {
            const formItem = document.createElement('li');
            formItem.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <div>
                    <div>${form.name}</div>
                    <small>${formatDateForDisplay(new Date(form.date))}</small>
                </div>
            `;
            formItem.addEventListener('click', () => previewForm(form.id));
            formsList.appendChild(formItem);
        });
    }
}

function previewForm(formId) {
    const formPreview = document.getElementById('form-preview');
    formPreview.innerHTML = `
        <iframe src="path/to/form_${formId}.pdf" style="width:100%; height:100%; border:none;"></iframe>
    `;
}

function uploadForm() {
    showToast('Upload form functionality would be implemented here', 'info');
}

function loadAppointmentHistory(patientId) {
    const historyList = document.getElementById('appointmentHistoryList');

    // Sample data - replace with actual history data from your backend
    const appointmentHistory = []; // Empty array to simulate no history

    if (appointmentHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard"></i>
                <p>No appointment history available</p>
                <small>This patient hasn't had any previous appointments</small>
            </div>
        `;
        return;
    }

    // If there is history, display it
    historyList.innerHTML = appointmentHistory.map(appointment => `
        <div class="history-item">
            <div class="history-header">
                <h5>${appointment.procedure}</h5>
                <span class="history-date">${formatDateForDisplay(appointment.date)}</span>
            </div>
            <span class="status-badge status-${appointment.status.toLowerCase()}">
                ${appointment.status}
            </span>
            <div class="history-details">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <div class="info-content">
                        <label>Time</label>
                        <span>${appointment.time}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-user-md"></i>
                    <div class="info-content">
                        <label>Dentist</label>
                        <span>${appointment.dentist}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function closeDetailsModal() {
    const modal = document.getElementById('appointmentDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        currentDetailId = null;
    }
}

function closeAllModals() {
    closeDetailsModal();
    closeAcceptModal();
    closeRejectModal();
    closeTodayAppointmentModal();
}

function acceptRequest(id) {
    // First close the details modal if it's open
    closeDetailsModal();

    // Then set up and show the accept confirmation
    isAcceptRequest = true;
    currentAcceptId = id;
    currentAcceptIds = [id];
    let request = appointmentRequests.find(req => req.id === id);
    console.log("TESTappointment:", request)
    console.log("ID:", id)

    document.getElementById('acceptModalTitle').textContent = 'Accept Appointment';
    document.getElementById('acceptModalMessage').textContent =
        `Are you sure you want to accept the appointment for ${request.patient_name}?`;

    // Store request data temporarily for confirmation handler
    window.currentRequestToNotify = request;
    document.getElementById('acceptConfirmationModal').classList.add('active');
}

async function confirmSendNotification() {
    const requests = window.currentRequestToNotify
        ? [window.currentRequestToNotify]
        : Array.isArray(window.bulkRequestsToNotify)
            ? window.bulkRequestsToNotify
            : [];

    for (const request of requests) {
        if (!request) continue;

        // Parse and format the date
        const dateObj = new Date(request.requestedDate);
        const dateOnly = dateObj.toISOString().split("T")[0]; // "2025-05-31"
        const fullDateTime = new Date(`${dateOnly}T${request.requestedTime}`);

        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const formattedTime = fullDateTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const rejectionReason = document.getElementById('rejectionReason').value.trim();

        let messageText = isAcceptRequest
            ? `Hi ${request.patientName}, your requested appointment in Holy Family Dental Clinic for ${request.procedure} scheduled on ${formattedDate} at ${formattedTime} has been approved. Thank you and see you!`
            : `Hi ${request.patientName}, your requested appointment in Holy Family Dental Clinic for ${request.procedure} scheduled on ${formattedDate} at ${formattedTime} has been rejected` +
            (rejectionReason ? ` due to ${rejectionReason}.` : `.`);


        let contact = String(request.contact || request.phoneNumber || '').padStart(11, "0");
        const formattedNumber = contact.replace(/^0/, "+63");

        try {
            const smsBody = encodeURIComponent(messageText);
            window.location.href = `sms:${formattedNumber}?&body=${smsBody}`;
            showToast(`SMS app opened for ${request.patientName}`, 'success');
            await new Promise(res => setTimeout(res, 600));
        } catch (error) {
            console.error("Failed to notify:", request.patientName, error);
            showToast(`Failed to notify ${request.patientName}`, 'error');
        }
    }

    closeNotificationModal();
}

function closeAcceptModal() {
    document.getElementById('acceptConfirmationModal').classList.remove('active');
    // currentAcceptId = null;
    // currentAcceptIds = [];
}

async function confirmAcceptAppointment() {
    const request = appointmentRequests.find(req => req.id == currentAcceptId);
    console.log("check request:", request)

    if (!request) {
        console.warn("No request found for currentAcceptId");
        return;
    }

    // Prepare modal content BEFORE updating the appointmentRequests
    const formattedRequest = {
        patientName: request.patient_name,
        procedure: request.procedure,
        requestedDate: request.requested_date,
        requestedTime: request.requested_time,
        contact: request.contact,
        email: request.email,
        id: request.id
    };

    window.currentRequestToNotify = formattedRequest;

    const label = `Do you want to send a confirmation message via SMS to ${formattedRequest.patientName}?`;
    document.getElementById("notificationModalMessage").textContent = label;
    document.getElementById("notificationConfirmationModal").classList.add("active");

    // Update the appointment status
    await fetch("http://localhost:3000/appointments/updateStatus", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            appointment_id: currentAcceptId,
            new_status: 2
        })
    });

    // Refresh the appointment lists AFTER modal and update
    await fetchAppointmentRequests();
    await fetchAppointmentRequests(today);

    // Close the original modal
    closeAcceptModal();

    // Update UI elements
    updateRequestsTable();
    updateRequestCount();
    updateStatistics();
    updateCalendar(new Date());
    updateAppointmentsForDate(new Date().toLocaleDateString('en-CA'));

    // Reset checkboxes
    document.getElementById('selectAll').checked = false;
    document.getElementById('selectAllToday').checked = false;
    updateBulkActionVisibility('requestTableBody', 'requestBulkActions', 'requestSelectedCount');
    updateBulkActionVisibility('todayTableBody', 'appointmentBulkActions', 'appointmentSelectedCount');
}



function closeNotificationModal() {
    const modal = document.getElementById("notificationConfirmationModal");
    modal.classList.remove("active");
}

// Bulk action functions
function updateBulkActionVisibility(tableId, bulkActionId, selectedCountId) {
    const checkboxes = document.querySelectorAll(`#${tableId} input[type="checkbox"]:not([id="${bulkActionId}"])`);
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked && !cb.id.includes('selectAll')).length;
    const bulkActions = document.getElementById(bulkActionId);
    const countElement = document.getElementById(selectedCountId);

    // Immediately hide bulk actions if no items are selected
    if (selectedCount === 0) {
        bulkActions.classList.remove('show');
        // Clear the "Select All" checkbox
        const selectAllCheckbox = document.getElementById(tableId === 'requestTableBody' ? 'selectAll' : 'selectAllToday');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
    } else {
        bulkActions.classList.add('show');
        countElement.textContent = selectedCount;
    }
}

function showBulkRejectModal() {
    const checkboxes = document.querySelectorAll('#requestTableBody input[type="checkbox"]:checked');
    const count = checkboxes.length;

    document.getElementById('rejectConfirmationModal').classList.add('active');
    document.querySelector('#rejectConfirmationModal .confirmation-title').innerHTML =
        `<i class="fas fa-times-circle" style="color: #dc3545;"></i> Reject ${count} Appointments`;
    document.querySelector('#rejectConfirmationModal .confirmation-message').innerHTML =
        `You are about to reject <strong>${count}</strong> selected appointment(s).<br>Please provide a reason:`;
}

function bulkRejectRequests(reason) {
    const checkboxes = document.querySelectorAll('#requestTableBody input[type="checkbox"]:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

    ids.forEach(id => {
        rejectRequest(id, reason);
    });

    document.getElementById('selectAll').checked = false;
    closeRejectModal();
    updateBulkActionVisibility('requestTableBody', 'requestBulkActions', 'requestSelectedCount');
}

function bulkConfirmAppointments() {
    const checkboxes = document.querySelectorAll('#todayTableBody input[type="checkbox"]:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

    ids.forEach(id => {
        confirmAppointment(id);
    });

    document.getElementById('selectAllToday').checked = false;
    updateBulkActionVisibility('todayTableBody', 'appointmentBulkActions', 'appointmentSelectedCount');
}

function bulkAcceptRequests() {
    closeAllModals();
    const checkboxes = document.querySelectorAll('#requestTableBody input[type="checkbox"]:checked');
    currentAcceptIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    currentAcceptId = null;

    document.getElementById('acceptModalTitle').textContent = 'Accept Multiple Appointments';
    document.getElementById('acceptModalMessage').textContent =
        `Are you sure you want to accept ${currentAcceptIds.length} appointments?`;
    document.getElementById('acceptConfirmationModal').classList.add('active');
}

function bulkCompleteAppointments() {
    const checkboxes = document.querySelectorAll('#todayTableBody input[type="checkbox"]:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id))
        .filter(id => {
            const appointment = todayAppointments.find(app => app.id === id);
            return appointment && appointment.status === "Scheduled";
        });

    if (ids.length === 0) {
        showToast('No valid appointments selected for completion', 'warning');
        return;
    }

    // Create and show the bulk completion confirmation modal
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    modal.innerHTML = `
        <div class="confirmation-content" style="max-width: 500px;">
            <div class="confirmation-header">
                <div style="display: flex; align-items: center;">
                    <div class="confirmation-icon accept-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="confirmation-title">Complete Multiple Appointments</h3>
                </div>
                <button onclick="this.closest('.confirmation-modal').remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="confirmation-message">
                <p>You are about to mark ${ids.length} appointment(s) as completed.</p>
                <p>This action cannot be undone. Do you want to continue?</p>
            </div>
            
            <div class="confirmation-buttons" style="justify-content: space-between;">
                <button class="cancel-btn" onclick="this.closest('.confirmation-modal').remove()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="confirm-btn" onclick="processBulkCompletion(${JSON.stringify(ids)})">
                    <i class="fas fa-check"></i> Complete All
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function processBulkCompletion(ids) {
    ids.forEach(id => {
        const appointmentIndex = todayAppointments.findIndex(app => app.id === id);
        if (appointmentIndex !== -1) {
            todayAppointments[appointmentIndex].status = "Completed";
            todayAppointments[appointmentIndex].completedAt = new Date().toISOString();
        }
    });

    // Update UI
    updateAppointmentsForDate(new Date().toLocaleDateString('en-CA'));
    updateStatistics();
    updateCalendar(new Date());

    // Reset select all checkbox
    document.getElementById('selectAllToday').checked = false;

    // Hide bulk actions
    updateBulkActionVisibility('todayTableBody', 'appointmentBulkActions', 'appointmentSelectedCount');

    // Show success message
    showToast(`Successfully completed ${ids.length} appointments`, 'success');

    // Close ALL confirmation modals
    const modals = document.querySelectorAll('.confirmation-modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });
}

function bulkCancelAppointments() {
    const checkboxes = document.querySelectorAll('#todayTableBody input[type="checkbox"]:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id))
        .filter(id => {
            const appointment = todayAppointments.find(app => app.id === id);
            return appointment && appointment.status === "Scheduled";
        });

    if (ids.length === 0) {
        showToast('No valid appointments selected for cancellation', 'warning');
        return;
    }

    // Create and show the bulk cancellation confirmation modal
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    modal.innerHTML = `
        <div class="confirmation-content" style="max-width: 500px;">
            <div class="confirmation-header">
                <div style="display: flex; align-items: center;">
                    <div class="confirmation-icon warning-icon">
                        <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
                    </div>
                    <h3 class="confirmation-title">Cancel Multiple Appointments</h3>
                </div>
                <button onclick="this.closest('.confirmation-modal').remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="confirmation-message">
                <p>You are about to cancel ${ids.length} appointment(s).</p>
                <p>This action cannot be undone. Do you want to continue?</p>
            </div>
            
            <div class="confirmation-buttons" style="justify-content: space-between;">
                <button class="cancel-btn" onclick="this.closest('.confirmation-modal').remove()">
                    <i class="fas fa-times"></i> Back
                </button>
                <button class="warning-btn" onclick="processBulkCancellation(${JSON.stringify(ids)})">
                    <i class="fas fa-times-circle"></i> Cancel All
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function processBulkCancellation(ids) {
    ids.forEach(id => {
        const appointmentIndex = todayAppointments.findIndex(app => app.id === id);
        if (appointmentIndex !== -1) {
            todayAppointments[appointmentIndex].status = "Cancelled";
        }
    });

    // Update UI
    updateAppointmentsForDate(new Date()).toLocaleDateString('en-CA');
    updateStatistics();
    updateCalendar(new Date());

    // Reset select all checkbox
    document.getElementById('selectAllToday').checked = false;

    // Hide bulk actions
    updateBulkActionVisibility('todayTableBody', 'appointmentBulkActions', 'appointmentSelectedCount');

    // Show success message
    showToast(`Successfully cancelled ${ids.length} appointments`, 'warning');

    // Close the confirmation modal
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.remove();
    }
}

// Search and filter functions
function filterAppointments() {
    const searchText = document.getElementById('searchRequests').value.toLowerCase();
    const selectedProcedure = document.getElementById('procedureFilter').value;
    const tableRows = document.querySelectorAll('#requestTableBody tr');

    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let matchesSearch = false;
        let matchesProcedure = !selectedProcedure;

        // Skip the first cell (checkbox) and the last cell (actions)
        for (let i = 1; i < cells.length - 1; i++) {
            const cell = cells[i];
            const text = cell.textContent;

            // Remove existing highlights
            cell.innerHTML = cell.innerHTML.replace(/<mark class="highlight">(.*?)<\/mark>/g, '$1');

            if (searchText && text.toLowerCase().includes(searchText)) {
                // Highlight matching text
                const regex = new RegExp(`(${searchText})`, 'gi');
                cell.innerHTML = text.replace(regex, '<mark class="highlight">$1</mark>');
                matchesSearch = true;
            }

            // Check if this cell contains the procedure
            if (i === 4 && text.includes(selectedProcedure)) { // Index 4 is the procedure column
                matchesProcedure = true;
            }
        }

        // Show/hide rows based on both search and filter
        row.style.display = (searchText === '' || matchesSearch) && (matchesProcedure) ? '' : 'none';
    });

    // Update "no results" message
    updateNoResultsMessage(searchText, selectedProcedure);
}

function updateNoResultsMessage(searchText, selectedProcedure) {
    const visibleRows = document.querySelectorAll('#requestTableBody tr[style=""]').length;
    const noResults = document.querySelector('.no-results');

    if ((searchText || selectedProcedure) && visibleRows === 0) {
        if (!noResults) {
            const message = document.createElement('tr');
            message.className = 'no-results';
            let filterText = '';
            if (searchText && selectedProcedure) {
                filterText = `"${searchText}" and procedure "${selectedProcedure}"`;
            } else if (searchText) {
                filterText = `"${searchText}"`;
            } else {
                filterText = `procedure "${selectedProcedure}"`;
            }
            message.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 20px;">
                    <i class="fas fa-search" style="font-size: 24px; color: var(--text-muted); margin-bottom: 10px;"></i>
                    <p style="color: var(--text-muted); margin: 0;">No results found for ${filterText}</p>
                </td>
            `;
            document.getElementById('requestTableBody').appendChild(message);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

function resetFilters() {
    document.getElementById('searchRequests').value = '';
    document.getElementById('procedureFilter').value = '';
    filterAppointments();
    showToast('Filters have been reset', 'info');
}

// Setup modal closing handlers
function setupModalClosing(modalId) {
    const modal = document.getElementById(modalId);
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            if (modalId === 'appointmentDetailsModal') {
                closeDetailsModal();
            } else if (modalId === 'todayAppointmentModal') {
                closeTodayAppointmentModal();
            }
        }
    });
}

// Initialize modal closing handlers
document.addEventListener('DOMContentLoaded', function () {
    setupModalClosing('appointmentDetailsModal');
    setupModalClosing('todayAppointmentModal');
});

function closeTodayAppointmentModal() {
    document.getElementById('todayAppointmentModal').classList.remove('active');
    currentTodayAppointmentId = null;
}

function loadTodayAppointmentHistory(patientId) {
    const historyList = document.getElementById('today-appointment-history-list');

    // Clear existing content
    historyList.innerHTML = '';

    // Sample data - replace with actual history data from your backend
    const appointmentHistory = []; // Empty array to simulate no history

    if (appointmentHistory.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty-state">
                <i class="fas fa-calendar-times"></i>
                <h4>No Appointment History</h4>
                <p>This patient hasn't had any previous appointments</p>
                <small>New appointments will appear here once completed</small>
            </div>
        `;
        return;
    }

    // If there is history, display it
    historyList.innerHTML = appointmentHistory.map(appointment => `
        <div class="history-item">
            <div class="history-header">
                <h5>${appointment.procedure}</h5>
                <span class="history-date">${formatDateForDisplay(appointment.date)}</span>
            </div>
            <span class="status-badge status-${appointment.status.toLowerCase()}">
                ${appointment.status}
            </span>
            <div class="history-details">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <div class="info-content">
                        <label>Time</label>
                        <span>${appointment.time}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-user-md"></i>
                    <div class="info-content">
                        <label>Dentist</label>
                        <span>${appointment.dentist}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Check for expired appointments
function checkExpiredAppointments() {
    const now = new Date();
    const expired = appointmentRequests.filter(request => {
        const requestDate = new Date(request.requestedDate + ' ' + convertTo24Hour(request.requestedTime));
        return requestDate < now;
    });

    if (expired.length > 0) {
        expired.forEach(request => {
            // Log the auto-cancellation
            logAppointmentAction(request, "Auto-Cancelled");

            // Remove from requests array
            const index = appointmentRequests.findIndex(req => req.id === request.id);
            if (index !== -1) {
                appointmentRequests.splice(index, 1);
            }

            // Show notification
            showToast(`Appointment for ${request.patientName} auto-cancelled due to expiration`, 'warning');
        });

        // Update UI
        updateRequestsTable();
        updateRequestCount();
        updateStatistics();
        updateCalendar(new Date());
    }
}

// Initialize event listeners for search and filter
document.getElementById('searchRequests').addEventListener('input', filterAppointments);
document.getElementById('procedureFilter').addEventListener('change', filterAppointments);

// Initialize event listeners for modal closing
document.getElementById('rejectConfirmationModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeRejectModal();
    }
});

document.getElementById('acceptConfirmationModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeAcceptModal();
    }
});

document.getElementById('appointmentDetailsModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeDetailsModal();
    }
});

document.getElementById('todayAppointmentModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeTodayAppointmentModal();
    }
});

// Update select all checkboxes
function updateSelectAllCheckbox(tableId, selectAllId) {
    const checkboxes = document.querySelectorAll(`#${tableId} input[type="checkbox"]:not([id="${selectAllId}"])`);
    const selectAllCheckbox = document.getElementById(selectAllId);
    const totalCheckboxes = checkboxes.length;
    const checkedCheckboxes = Array.from(checkboxes).filter(cb => cb.checked).length;

    // Simply check if all checkboxes are checked, no indeterminate state
    selectAllCheckbox.checked = totalCheckboxes > 0 && totalCheckboxes === checkedCheckboxes;
    // Remove indeterminate state
    selectAllCheckbox.indeterminate = false;
}

// Modify existing event listeners for select all
document.getElementById('selectAll').addEventListener('change', function () {
    const checkboxes = document.querySelectorAll('#requestTableBody input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = this.checked);
    updateBulkActionVisibility('requestTableBody', 'requestBulkActions', 'requestSelectedCount');
});

document.getElementById('selectAllToday').addEventListener('change', function () {
    const checkboxes = document.querySelectorAll('#todayTableBody input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = this.checked);
    updateBulkActionVisibility('todayTableBody', 'appointmentBulkActions', 'appointmentSelectedCount');
});

// Modify event delegation for checkbox changes
document.getElementById('requestTableBody').addEventListener('change', function (e) {
    if (e.target.type === 'checkbox') {
        updateBulkActionVisibility('requestTableBody', 'requestBulkActions', 'requestSelectedCount');
        updateSelectAllCheckbox('requestTableBody', 'selectAll');
    }
});

document.getElementById('todayTableBody').addEventListener('change', function (e) {
    if (e.target.type === 'checkbox') {
        updateBulkActionVisibility('todayTableBody', 'appointmentBulkActions', 'appointmentSelectedCount');
        updateSelectAllCheckbox('todayTableBody', 'selectAllToday');
    }
});

function confirmAppointment(id) {
    const appointment = todayAppointments.find(app => app.id === id);
    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }

    // Set up and show the accept confirmation modal
    currentAcceptId = id;
    currentAcceptIds = [id];

    document.getElementById('acceptModalTitle').textContent = 'Confirm Appointment';
    document.getElementById('acceptModalMessage').textContent =
        `Are you sure you want to confirm the appointment for ${appointment.patientName}?`;
    document.getElementById('acceptConfirmationModal').classList.add('active');
}

/**
 * Initiates the completion process for an appointment
 * @param {string} id - The ID of the appointment to complete
 */
function completeAppointment(id) {
    currentCompletionId = id;
    const appointment = todayAppointments.find(app => app.id === id);

    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }

    // Get the before and after photos from the UI or storage
    const beforePhoto = document.querySelector('#today-before-photos img')?.src || '';
    const afterPhoto = document.querySelector('#today-after-photos img')?.src || '';

    // Create and show the completion confirmation modal
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeCompletionModal();
        }
    });

    modal.innerHTML = `
        <div class="confirmation-content" style="max-width: 700px;">
            <div class="modal-decoration modal-decoration-1"></div>
            <div class="modal-decoration modal-decoration-2"></div>
            
            <div class="confirmation-header">
                <div style="display: flex; align-items: center;">
                    <div class="confirmation-icon accept-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="confirmation-title">Complete Appointment</h3>
                </div>
                <button onclick="closeCompletionModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="confirmation-message">
                <p>You're about to mark this appointment as completed:</p>
                <div class="appointment-info" style="margin: 15px 0; padding: 15px; background: var(--hover-bg); border-radius: 8px;">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div class="info-content">
                            <label>Patient</label>
                            <span>${appointment.patientName}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-tooth"></i>
                        <div class="info-content">
                            <label>Procedure</label>
                            <span>${appointment.procedure}</span>
                        </div>
                    </div>
                </div>

                <div class="photo-preview-container" style="margin: 20px 0; display: flex; gap: 20px;">
                    <div class="photo-preview" style="flex: 1;">
                        <h4 style="margin-bottom: 10px;"><i class="fas fa-camera"></i> Before Treatment</h4>
                        ${beforePhoto ?
            `<img src="${beforePhoto}" alt="Before treatment" style="width: 100%; height: 200px; object-fit: contain; border-radius: 8px;">` :
            `<div class="empty-photo" style="height: 200px; background: var(--hover-bg); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <div style="text-align: center; color: var(--text-muted);">
                                    <i class="fas fa-camera-slash" style="font-size: 24px; margin-bottom: 8px;"></i>
                                    <p style="margin: 0;">No before photo</p>
                                </div>
                            </div>`
        }
                    </div>
                    <div class="photo-preview" style="flex: 1;">
                        <h4 style="margin-bottom: 10px;"><i class="fas fa-camera"></i> After Treatment</h4>
                        ${afterPhoto ?
            `<img src="${afterPhoto}" alt="After treatment" style="width: 100%; height: 200px; object-fit: contain; border-radius: 8px;">` :
            `<div class="empty-photo" style="height: 200px; background: var(--hover-bg); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <div style="text-align: center; color: var(--text-muted);">
                                    <i class="fas fa-camera-slash" style="font-size: 24px; margin-bottom: 8px;"></i>
                                    <p style="margin: 0;">No after photo</p>
                                </div>
                            </div>`
        }
                    </div>
                </div>

                ${!beforePhoto || !afterPhoto ?
            `<p style="color: var(--text-muted); font-style: italic; margin-top: 10px;">
                        <i class="fas fa-info-circle"></i> Some photos are missing. Would you like to upload them before completing?
                    </p>` : ''
        }
            </div>
            
            <div class="confirmation-buttons" style="justify-content: space-between;">
                <button class="cancel-btn" onclick="closeCompletionModal()">
                    <i class="fas fa-times"></i> Back
                </button>
                <div>
                    
                    <button class="confirm-btn complete-btn" onclick="finalizeCompletion(${id}, true)">
                        <i class="fas fa-check"></i> Complete Now
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    currentCompletionModal = modal;
}

/**
 * Closes the completion modal
 */
function closeCompletionModal() {
    if (currentCompletionModal) {
        currentCompletionModal.classList.remove('active');
        setTimeout(() => {
            currentCompletionModal.remove();
            currentCompletionModal = null;
        }, 300);
    }
}

/**
 * Handles uploading after photos for an appointment
 * @param {string} id - The appointment ID
 */
function uploadAfterPhotos(id) {
    const appointment = todayAppointments.find(app => app.id === id);
    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }

    // Close completion modal
    closeCompletionModal();

    // Show appointment details modal first
    showTodayAppointmentDetails(id);

    // Wait for modal to open then switch to photos tab
    setTimeout(() => {
        // Find and click the photos tab button
        const photosTabBtn = document.querySelector('.tab-btn[onclick*="today-photos"]');
        if (photosTabBtn) {
            photosTabBtn.click();
        }

        // Focus on the photos section
        const photosSection = document.getElementById('today-before-photos');
        if (photosSection) {
            photosSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
}

/**
 * Finalizes the appointment completion
 * @param {string} id - The appointment ID
 * @param {boolean} skipPhotos - Whether to skip photo upload
 */
function finalizeCompletion(id, skipPhotos = false) {
    const appointmentIndex = todayAppointments.findIndex(app => app.id === id);

    if (appointmentIndex === -1) {
        showToast('Appointment not found', 'error');
        return;
    }

    // Check if before and after photos exist
    const beforePhotos = document.querySelector('#today-before-photos .photo-item');
    const afterPhotos = document.querySelector('#today-after-photos .photo-item');

    if (!beforePhotos || !afterPhotos) {
        // Show warning modal for missing photos
        const warningModal = document.createElement('div');
        warningModal.className = 'confirmation-modal';
        currentWarningModal = warningModal; // Store reference to the modal

        warningModal.innerHTML = `
            <div class="confirmation-content" style="max-width: 500px;">
                <div class="confirmation-header">
                    <div style="display: flex; align-items: center;">
                        <div class="confirmation-icon warning-icon">
                            <i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>
                        </div>
                        <h3 class="confirmation-title">Missing Photos</h3>
                    </div>
                    <button onclick="closeWarningModal()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="confirmation-message">
                    <p>${!beforePhotos && !afterPhotos ? 'No before and after photos uploaded' :
                !beforePhotos ? 'No before photos uploaded' : 'No after photos uploaded'}</p>
                    <p>Would you like to upload the missing photos before completing?</p>
                </div>
                
                <div class="confirmation-buttons" style="justify-content: space-between;">
                    <button class="action-btn" onclick="proceedToPhotos(${id})" style="background: var(--sidebar-active); color: white;">
                        <i class="fas fa-camera"></i> Upload Photos
                    </button>
                    <button class="warning-btn" onclick="completeWithoutPhotos(${id})">
                        <i class="fas fa-check"></i> Complete Without Photos
                    </button>
                </div>
            </div>
        `;

        // Add click event listener to close on background click
        warningModal.addEventListener('click', function (e) {
            if (e.target === warningModal) {
                closeWarningModal();
            }
        });

        document.body.appendChild(warningModal);
        setTimeout(() => warningModal.classList.add('active'), 10);
        return;
    }

    // If we have both photos, proceed with completion
    proceedWithCompletion(id);
}

function closeWarningModal() {
    if (currentWarningModal) {
        currentWarningModal.classList.remove('active');
        setTimeout(() => {
            currentWarningModal.remove();
            currentWarningModal = null;
        }, 300);
    }
}

function proceedToPhotos(id) {
    closeWarningModal();  // Keep this existing close
    closeCompletionModal(); // Add this line to close completion modal
    showTodayAppointmentDetails(id);

    setTimeout(() => {
        const photosTabBtn = document.querySelector('.tab-btn[onclick*="today-photos"]');
        if (photosTabBtn) {
            photosTabBtn.click();
        }
    }, 100);
}

function completeWithoutPhotos(id) {
    if (confirm('Are you sure you want to complete this appointment without photos? This action cannot be undone.')) {
        proceedWithCompletion(id);
        closeWarningModal();
    }
}

function proceedWithCompletion(id) {
    const appointmentIndex = todayAppointments.findIndex(app => app.id === id);
    const appointment = todayAppointments[appointmentIndex];

    // Update appointment status
    todayAppointments[appointmentIndex].status = 'Completed';
    todayAppointments[appointmentIndex].completedAt = new Date().toISOString();

    // Update UI
    updateAppointmentsForDate(new Date()).toLocaleDateString('en-CA');
    updateStatistics();
    updateCalendar(new Date());

    // Show confirmation
    showToast(`Appointment completed for ${appointment.patientName}`, 'success');

    // Close modals
    closeCompletionModal();
    closeTodayAppointmentModal();
}

// Form management functions

// Global variable to track the current patient ID
let currentPatientId = null;

// Function to handle form upload for regular appointment details
function uploadForm() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.png'; // Accept common document formats

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you would upload to a server here
            // For this demo, we'll simulate the upload

            // Create a mock form entry
            const formId = 'form-' + Date.now();
            const formName = file.name;

            // Add to the forms list
            addFormToList(formId, formName, 'forms-list');

            // Show success toast
            showToast('Form uploaded successfully!', 'success');
        }
    };

    fileInput.click();
}

// Function to handle form upload for today's appointment
function uploadTodayForm() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.png'; // Accept common document formats

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you would upload to a server here
            // For this demo, we'll simulate the upload

            // Create a mock form entry
            const formId = 'today-form-' + Date.now();
            const formName = file.name;

            // Add to the forms list
            addFormToList(formId, formName, 'today-forms-list');

            // Show success toast
            showToast('Form uploaded successfully!', 'success');
        }
    };

    fileInput.click();
}

// Helper function to add a form to the list
function addFormToList(formId, formName, listId) {
    const formsList = document.getElementById(listId);

    // Remove empty state if it exists
    const emptyState = formsList.querySelector('.empty-state');
    if (emptyState) {
        formsList.removeChild(emptyState);
    }

    // Create new list item
    const listItem = document.createElement('li');
    listItem.dataset.formId = formId;
    listItem.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <span>${formName}</span>
        <button class="delete-form-btn" onclick="deleteForm('${formId}', '${listId}')">
            <i class="fas fa-trash"></i>
        </button>
    `;

    // Add click handler to preview the form
    listItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-form-btn') && !e.target.closest('.delete-form-btn')) {
            previewForm(formId, formName, listId.includes('today') ? 'today-form-preview' : 'form-preview');
        }
    });

    formsList.appendChild(listItem);
}

// Function to preview a form
function previewForm(formId, formName, previewContainerId) {
    const previewContainer = document.getElementById(previewContainerId);

    // Clear previous preview
    previewContainer.innerHTML = '';

    // Create a loading state
    previewContainer.innerHTML = `
        <div class="form-preview-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading form preview...</p>
        </div>
    `;

    // Simulate loading delay (in a real app, this would be an actual API call)
    setTimeout(() => {
        // Based on file extension, show appropriate preview
        const fileExt = formName.split('.').pop().toLowerCase();

        if (fileExt === 'pdf') {
            // For PDFs, we'll show a mock PDF viewer
            previewContainer.innerHTML = `
                <div class="form-preview-content">
                    <div class="form-preview-header">
                        <h4>${formName}</h4>
                        <div class="form-actions">
                            <button class="action-btn" onclick="downloadForm('${formId}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="action-btn" onclick="printForm('${formId}')">
                                <i class="fas fa-print"></i> Print
                            </button>
                        </div>
                    </div>
                    
                    <div class="pdf-preview">
                        <div class="pdf-toolbar">
                            <button class="pdf-tool"><i class="fas fa-search-plus"></i></button>
                            <button class="pdf-tool"><i class="fas fa-search-minus"></i></button>
                            <span class="page-info">Page 1 of 2</span>
                            <button class="pdf-tool"><i class="fas fa-chevron-left"></i></button>
                            <button class="pdf-tool"><i class="fas fa-chevron-right"></i></button>
                        </div>
                        
                        <div class="pdf-page">
                            <div class="pdf-page-content">
                                <h3>${formName.replace('.pdf', '')}</h3>
                                <p>This is a mock preview of the PDF document.</p>
                                <p>In a real application, this would show the actual PDF content using a PDF viewer library.</p>
                                <div class="form-data">
                                    <p><strong>Patient Name:</strong> ${document.getElementById('today-patient-name').textContent}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="pdf-page" style="margin-top: 20px;">
                            <div class="pdf-page-content">
                                <h4>Page 2</h4>
                                <p>Additional form content would appear here.</p>
                                <div class="signature-line">
                                    <p>_________________________</p>
                                    <p>Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
            // For images, show the image
            previewContainer.innerHTML = `
                <div class="form-preview-content">
                    <div class="form-preview-header">
                        <h4>${formName}</h4>
                        <div class="form-actions">
                            <button class="action-btn" onclick="downloadForm('${formId}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="action-btn" onclick="printForm('${formId}')">
                                <i class="fas fa-print"></i> Print
                            </button>
                        </div>
                    </div>
                    
                    <div class="image-preview">
                        <img src="path/to/forms/${formId}" alt="${formName}" style="max-width: 100%; max-height: 500px;">
                        <div class="image-zoom-controls">
                            <button class="zoom-btn" onclick="zoomImage('${formId}', 'in')">
                                <i class="fas fa-search-plus"></i>
                            </button>
                            <button class="zoom-btn" onclick="zoomImage('${formId}', 'out')">
                                <i class="fas fa-search-minus"></i>
                            </button>
                            <button class="zoom-btn" onclick="zoomImage('${formId}', 'reset')">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        else if (['doc', 'docx'].includes(fileExt)) {
            // For Word documents, show a mock preview
            previewContainer.innerHTML = `
                <div class="form-preview-content">
                    <div class="form-preview-header">
                        <h4>${formName}</h4>
                        <div class="form-actions">
                            <button class="action-btn" onclick="downloadForm('${formId}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="action-btn" onclick="printForm('${formId}')">
                                <i class="fas fa-print"></i> Print
                            </button>
                        </div>
                    </div>
                    
                    <div class="document-preview">
                        <div class="document-header">
                            <h3>${formName.replace('.' + fileExt, '')}</h3>
                            <p>Mock Document Preview</p>
                        </div>
                        
                        <div class="document-content">
                            <p><strong>Patient Information:</strong></p>
                            <ul>
                                <li>Name: ${document.getElementById('today-patient-name').textContent}</li>
                                <li>ID: ${document.getElementById('today-patient-id').textContent}</li>
                                <li>Date: ${new Date().toLocaleDateString()}</li>
                            </ul>
                            
                            <p><strong>Form Details:</strong></p>
                            <p>This is a mock preview of a Word document. In a real application, this would show the actual document content using a document viewer.</p>
                            
                            <table class="form-table">
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                                <tr>
                                    <td>Procedure</td>
                                    <td>${document.getElementById('today-procedure').textContent}</td>
                                </tr>
                                <tr>
                                    <td>Status</td>
                                    <td>${document.getElementById('today-status').textContent}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        else {
            // For unknown file types, show a generic preview
            previewContainer.innerHTML = `
                <div class="form-preview-content">
                    <div class="form-preview-header">
                        <h4>${formName}</h4>
                        <div class="form-actions">
                            <button class="action-btn" onclick="downloadForm('${formId}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="action-btn" onclick="printForm('${formId}')">
                                <i class="fas fa-print"></i> Print
                            </button>
                        </div>
                    </div>
                    
                    <div class="generic-preview">
                        <i class="fas fa-file-alt" style="font-size: 48px;"></i>
                        <p>Preview not available for this file type</p>
                        <button class="action-btn" onclick="downloadForm('${formId}')">
                            <i class="fas fa-download"></i> Download to view
                        </button>
                    </div>
                </div>
            `;
        }
    }, 1000); // Simulate network delay
}

// Helper function for image zoom (for image previews)
function zoomImage(formId, action) {
    const img = document.querySelector(`.image-preview img[alt*="${formId}"]`);
    if (!img) return;

    let currentZoom = parseFloat(img.style.transform.replace('scale(', '').replace(')', '')) || 1;

    switch (action) {
        case 'in':
            currentZoom += 0.2;
            break;
        case 'out':
            currentZoom = Math.max(0.5, currentZoom - 0.2);
            break;
        case 'reset':
            currentZoom = 1;
            break;
    }

    img.style.transform = `scale(${currentZoom})`;
}

// Function to delete a form
function deleteForm(formId, listId) {
    event.stopPropagation(); // Prevent triggering the preview

    // In a real app, you would make a server request to delete
    // For this demo, we'll just remove from the UI
    const formsList = document.getElementById(listId);
    const formItem = formsList.querySelector(`li[data-form-id="${formId}"]`);

    if (formItem) {
        formsList.removeChild(formItem);
        showToast('Form deleted', 'success');
    }

    // Show empty state if no forms left
    if (formsList.children.length === 0) {
        formsList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-file-excel"></i>
                <p>No forms uploaded</p>
            </li>
        `;
    }

    // Clear preview if viewing this form
    const previewContainer = listId.includes('today') ?
        document.getElementById('today-form-preview') :
        document.getElementById('form-preview');
    previewContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-file-pdf"></i>
            <p>Select a form to preview</p>
        </div>
    `;
}

// Mock functions for download and print
function downloadForm(formId) {
    showToast('Downloading form...', 'info');
    // In a real app, this would trigger a download
}

function printForm(formId) {
    showToast('Preparing form for printing...', 'info');
    // In a real app, this would trigger printing
}

// Add this to your modal close handlers
document.getElementById('completeConfirmationModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeCompleteModal();
    }
});