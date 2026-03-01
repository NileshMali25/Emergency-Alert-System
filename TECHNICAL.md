# 🔧 Technical Documentation - Emergency Alert System

## For Developers

---

## 📋 Architecture Overview

### Frontend Architecture
- **Type**: Single Page Application (SPA) with multiple HTML pages
- **Pattern**: Client-side rendering with vanilla JavaScript
- **State Management**: LocalStorage for session/user data
- **API Communication**: Fetch API for RESTful operations
- **Routing**: Browser-based navigation between HTML pages

### Data Flow
```
User Action → JavaScript Handler → Fetch API Call → 
RESTful Table API → Database → Response → UI Update
```

---

## 🗄️ Database Design

### Table Relationships
```
Users (1) ←→ (Many) Emergency_Contacts
Users (1) ←→ (Many) Alert_History
Alert_History (Many) ←→ (Many) Emergency_Contacts (via contacts_notified array)
```

### Key Constraints
- All tables have `id` as primary key (UUID)
- `user_id` is foreign key in contacts and alerts
- `is_active` boolean determines if contact receives alerts
- `resolved` boolean tracks alert status
- Soft deletes implemented (records marked as deleted)

---

## 🔐 Authentication System

### Implementation
```javascript
// Registration Flow
1. Validate user input (email, phone, password)
2. Hash password: btoa(password + 'SALT_KEY')
3. Create user record in database
4. Store user object in localStorage
5. Redirect to dashboard

// Login Flow
1. Validate credentials
2. Query database for user by email
3. Compare hashed passwords
4. Store user in localStorage
5. Set isLoggedIn flag
6. Redirect to dashboard

// Session Management
- User data: localStorage.getItem('currentUser')
- Login status: localStorage.getItem('isLoggedIn')
- Cleared on logout
```

### Security Notes
⚠️ **Current Implementation (Demo)**:
- Client-side password hashing (Base64)
- LocalStorage for sessions
- No token-based authentication

🔒 **Production Recommendations**:
- Move to server-side authentication
- Use bcrypt for password hashing
- Implement JWT tokens
- Use httpOnly cookies
- Add CSRF protection
- Rate limiting on login attempts

---

## 🎨 CSS Architecture

### Variable System
```css
:root {
  /* Colors */
  --primary-color: #dc2626;
  --secondary-color: #2563eb;
  /* ... more variables */
}

body.dark-theme {
  /* Override for dark mode */
  --bg-color: #0f172a;
  --text-color: #f1f5f9;
}
```

### Component Structure
- **Global Styles**: Reset, variables, utilities
- **Layout Components**: Container, grid, flex
- **UI Components**: Buttons, cards, forms, modals
- **Page Sections**: Hero, features, dashboard
- **Responsive**: Mobile-first breakpoints

### Naming Convention
- **BEM-inspired**: `.component-element--modifier`
- **Semantic**: `.dashboard-card`, `.contact-item`
- **Utility**: `.btn-primary`, `.alert-success`

---

## 🔌 API Integration

### Endpoint Structure
```
Base URL: tables/{table_name}

GET    /tables/{table}              → List records
GET    /tables/{table}/{id}         → Get single record
POST   /tables/{table}              → Create record
PUT    /tables/{table}/{id}         → Full update
PATCH  /tables/{table}/{id}         → Partial update
DELETE /tables/{table}/{id}         → Delete record
```

### Query Parameters
```javascript
// Pagination
?page=1&limit=10

// Search
?search={query}

// Sort (descending with -)
?sort=-created_at
```

### Request Examples

**Create Contact:**
```javascript
fetch('tables/emergency_contacts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: currentUser.id,
    contact_name: "John Doe",
    phone: "1234567890",
    email: "john@example.com",
    relationship: "Family",
    priority: 1,
    is_active: true,
    added_date: new Date().toISOString()
  })
});
```

**Update User:**
```javascript
fetch(`tables/users/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    theme_preference: 'dark'
  })
});
```

**Search & Filter:**
```javascript
// Get user's contacts
fetch(`tables/emergency_contacts?search=${userId}`)
  .then(res => res.json())
  .then(data => {
    const userContacts = data.data.filter(c => c.user_id === userId);
  });
```

---

## 🚨 Emergency Alert System Logic

### Alert Sending Process
```javascript
async function sendEmergencyAlert(isSilent = false) {
  // 1. Load active contacts
  const contacts = await loadActiveContacts();
  
  // 2. Validate contacts exist
  if (contacts.length === 0) {
    showAlert('No contacts found', 'danger');
    return;
  }
  
  // 3. Create alert record
  const alertData = {
    user_id: currentUser.id,
    alert_type: 'Personal Safety',
    alert_message: message,
    contacts_notified: contacts.map(c => c.id),
    alert_status: 'Sent',
    alert_timestamp: new Date().toISOString(),
    is_silent: isSilent,
    resolved: false
  };
  
  // 4. Save to database
  await fetch('tables/alert_history', {
    method: 'POST',
    body: JSON.stringify(alertData)
  });
  
  // 5. Simulate sending (real implementation would call SMS/Email API)
  // In production: call Twilio, SendGrid, etc.
  
  // 6. Show feedback
  showAlert('Alert sent successfully!', 'success');
  
  // 7. Play sound (if not silent)
  if (!isSilent) playAlertSound();
}
```

### Confirmation Dialog Flow
```javascript
// Step 1: Show modal
emergencyButton.click() → showEmergencyModal()

// Step 2: Load and display contacts
contacts = loadEmergencyContacts()
displayContactsInModal(contacts)

// Step 3: User confirms
confirmButton.click() → sendEmergencyAlert()

// Step 4: Hide modal and send
hideEmergencyModal()
processAlert()
```

---

## 📱 Responsive Design Implementation

### Breakpoints
```css
/* Mobile First */
/* Base: 320px - 640px */

@media (max-width: 640px) {
  /* Small phones */
}

@media (max-width: 968px) {
  /* Tablets */
  .nav-links { display: none; }
  .mobile-menu-icon { display: block; }
}

@media (min-width: 969px) {
  /* Desktop */
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Touch Optimization
- Minimum button size: 44x44px
- Touch-friendly spacing
- No hover-dependent features on mobile
- Swipe-friendly layouts

---

## 🎭 Theme System

### Implementation
```javascript
// Toggle theme
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  
  // Update icon
  const icon = isDark ? 'fa-sun' : 'fa-moon';
  
  // Save to database
  updateUserPreference('theme_preference', newTheme);
  
  // Update localStorage
  currentUser.theme_preference = newTheme;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// Apply on page load
if (user.theme_preference === 'dark') {
  document.body.classList.add('dark-theme');
}
```

### CSS Variables Approach
- Define light theme colors in `:root`
- Override in `body.dark-theme`
- All components use CSS variables
- Instant theme switching

---

## 🔄 State Management

### LocalStorage Structure
```javascript
{
  "currentUser": {
    "id": "uuid-string",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "theme_preference": "dark"
    // ... other user fields
  },
  "isLoggedIn": "true",
  "rememberMe": "true"
}
```

### Data Synchronization
```javascript
// Always sync with database
async function syncUserData() {
  const response = await fetch(`tables/users/${currentUser.id}`);
  const latestUser = await response.json();
  
  // Update localStorage
  localStorage.setItem('currentUser', JSON.stringify(latestUser));
  currentUser = latestUser;
}
```

---

## 🐛 Error Handling

### Try-Catch Pattern
```javascript
async function loadData() {
  try {
    const response = await fetch('tables/users');
    if (!response.ok) throw new Error('Failed to load');
    const data = await response.json();
    // Process data
  } catch (error) {
    console.error('Error:', error);
    showAlert('Failed to load data', 'danger');
  }
}
```

### User Feedback
- Success: Green alert with checkmark
- Error: Red alert with X icon
- Info: Blue alert with info icon
- Auto-dismiss after 5 seconds

---

## 🚀 Performance Optimization

### Implemented
- ✅ CSS minification ready
- ✅ Lazy loading of data
- ✅ Debounced search inputs
- ✅ Efficient DOM updates
- ✅ CSS animations with GPU acceleration
- ✅ Minimal dependencies (vanilla JS)

### Recommendations
- Implement code splitting
- Add service worker for offline
- Enable HTTP/2 server push
- Compress images
- Use CDN for static assets
- Implement caching strategy

---

## 📊 Monitoring & Analytics

### Add These in Production

**Error Tracking:**
```javascript
window.onerror = function(msg, url, line, col, error) {
  // Send to error tracking service
  console.error('Error:', {msg, url, line, col, error});
};
```

**Usage Analytics:**
```javascript
function trackEvent(category, action, label) {
  // Send to analytics service (GA, Mixpanel, etc.)
  console.log('Event:', {category, action, label});
}

// Example usage
trackEvent('Alert', 'Emergency Sent', 'Success');
```

---

## 🔒 Security Checklist

### Current Implementation
- ✅ Password hashing (basic)
- ✅ Input validation
- ✅ XSS prevention (using textContent)
- ✅ SQL injection not applicable (API handles)

### Production Requirements
- [ ] HTTPS only
- [ ] Strong password hashing (bcrypt)
- [ ] JWT token authentication
- [ ] Rate limiting
- [ ] CSRF tokens
- [ ] Content Security Policy
- [ ] Input sanitization
- [ ] Prepared statements for DB
- [ ] Regular security audits

---

## 🧪 Testing Recommendations

### Unit Tests
```javascript
// Example with Jest
describe('Emergency Alert System', () => {
  test('should send alert to all active contacts', async () => {
    const contacts = [
      {id: '1', is_active: true},
      {id: '2', is_active: false}
    ];
    
    const result = await sendAlert(contacts);
    expect(result.notified).toEqual(['1']);
  });
});
```

### Integration Tests
- Test full user registration flow
- Test alert sending end-to-end
- Test contact management CRUD
- Test authentication flow

### E2E Tests
- Use Playwright or Cypress
- Test critical user journeys
- Test responsive layouts
- Test dark/light themes

---

## 📦 Deployment

### Static Hosting (Current)
```bash
# Upload files to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
```

### With Backend (Future)
```bash
# Frontend
npm run build
# Deploy to CDN

# Backend
# Deploy to:
- Heroku
- AWS EC2
- DigitalOcean
- Google Cloud Run
```

---

## 🔄 Version Control

### Git Workflow
```bash
# Feature branches
git checkout -b feature/add-gps-location

# Commit messages
git commit -m "feat: add GPS location to alerts"
git commit -m "fix: resolve mobile layout issue"
git commit -m "docs: update API documentation"

# Conventional Commits
# feat, fix, docs, style, refactor, test, chore
```

---

## 📚 Further Reading

### Recommended Technologies
- **Backend**: Node.js + Express, Python + Flask
- **Database**: PostgreSQL, MongoDB
- **SMS/Email**: Twilio, SendGrid, AWS SNS
- **Push Notifications**: Firebase Cloud Messaging
- **Maps**: Google Maps API, Mapbox
- **Testing**: Jest, Cypress, Playwright
- **Deployment**: Docker, Kubernetes, CI/CD

### Resources
- MDN Web Docs: https://developer.mozilla.org
- REST API Design: https://restfulapi.net
- Web Security: https://owasp.org
- Accessibility: https://www.w3.org/WAI/

---

## 🤝 Contributing Guidelines

1. Fork the repository
2. Create a feature branch
3. Follow code style guide
4. Write tests for new features
5. Update documentation
6. Submit pull request

---

**Technical Documentation v1.0**  
*Last Updated: 2024*
