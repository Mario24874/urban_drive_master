# Urban Drive - Testing Checklist

## Pre-Testing Setup

- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run dev` to start the development server
- [ ] Open browser DevTools (F12)
- [ ] Enable "Disable cache" in Network tab
- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)

---

## ✅ Functional Testing

### Authentication Flow
- [ ] **Login** with valid credentials works
- [ ] **Login** with invalid credentials shows error toast
- [ ] **Register** new user account works
- [ ] **Register** validates all form fields (Zod validation)
- [ ] **Password reset** sends email notification (Sonner toast)
- [ ] **Logout** clears session and redirects to login

### Navigation
- [ ] **Desktop tabs** switch between Home, Map, Contacts, Messages, Profile
- [ ] **Mobile bottom nav** works on small screens (<640px)
- [ ] **Navbar user menu** (DropdownMenu) opens and shows user info
- [ ] **Mobile drawer** (Sheet) opens from hamburger menu
- [ ] **Share APK** modal opens from navbar menu

### Location Features
- [ ] **GPS location** is requested on login
- [ ] **Location refresh** button updates coordinates
- [ ] **Location toast** shows success/error messages (Sonner)
- [ ] **Fallback to IP location** works if GPS denied
- [ ] **Map component** displays user location marker

### Contacts & Messaging
- [ ] **Contacts list** loads from Firestore
- [ ] **Search contacts** filters results in real-time
- [ ] **Select contact** opens chat interface
- [ ] **Send message** creates new message in Firestore
- [ ] **Message animations** (Framer Motion) appear smoothly
- [ ] **Typing indicator** shows 3 animated dots
- [ ] **Read receipts** show checkmark icons
- [ ] **Back button** returns to contacts list

### Profile Management
- [ ] **Profile editor** loads current user data
- [ ] **Edit profile** updates display name, phone, bio
- [ ] **User type toggle** switches between User/Driver
- [ ] **Visibility toggle** updates isVisible status
- [ ] **Save changes** shows success toast (Sonner)
- [ ] **Avatar** displays user initials or photo

### Modals & Dialogs
- [ ] **Download APK** modal (Shadcn Dialog) opens/closes
- [ ] **Share APK** modal with form inputs works
- [ ] **Terms of Use** dialog in Register opens/closes
- [ ] **Modals** close on backdrop click
- [ ] **Modals** close on ESC key press

### PWA Features
- [ ] **PWA Update Notification** shows Sonner toast when new version available
- [ ] **Install prompt** appears on supported devices
- [ ] **Offline ready** toast shows when app cached
- [ ] **Service Worker** registers successfully

---

## 📱 Responsive Design Testing

### Mobile (320px - 640px)
- [ ] Login/Register forms fit on iPhone SE (320px width)
- [ ] Touch targets ≥ 44px (buttons, nav items)
- [ ] Bottom navigation visible and functional
- [ ] Chat messages don't overflow
- [ ] Profile editor form scrollable
- [ ] Modals open from bottom (sheet behavior)

### Tablet (641px - 1024px)
- [ ] Desktop tabs visible at top
- [ ] Two-column layouts work (contacts + chat)
- [ ] Map component properly sized
- [ ] Navbar shows all items inline

### Desktop (1025px+)
- [ ] Full desktop layout with sidebar navigation
- [ ] User dropdown menu in navbar
- [ ] All content centered with max-width
- [ ] No horizontal scrolling

### Safe Areas (iPhone X+)
- [ ] Bottom nav respects notch safe area
- [ ] Top content doesn't hide behind status bar
- [ ] Modals account for rounded corners

---

## 🎨 UI/UX Testing

### Shadcn UI Components
- [ ] **Button** variants (default, ghost, outline) render correctly
- [ ] **Input** fields have proper focus states
- [ ] **Card** components have shadows and borders
- [ ] **Dialog** has backdrop blur effect
- [ ] **Sheet** slides in from right side
- [ ] **Tabs** highlight active tab
- [ ] **Avatar** shows fallback initials
- [ ] **Badge** displays user type correctly
- [ ] **ScrollArea** has custom scrollbar

### Animations (Framer Motion)
- [ ] **Login/Register** fade in on mount
- [ ] **Chat messages** slide up when sent
- [ ] **Typing indicator** dots bounce smoothly
- [ ] **Search bar** slides down when toggled
- [ ] **Contact list** items fade in/out
- [ ] **Profile editor** fades in on tab switch
- [ ] **Modals** have smooth open/close transitions

### Toasts (Sonner)
- [ ] **Success toasts** appear in top-right (green)
- [ ] **Error toasts** appear in top-right (red)
- [ ] **Info toasts** appear in top-right (blue)
- [ ] **Toast close button** works
- [ ] **PWA update toast** has action button
- [ ] **Multiple toasts** stack properly

---

## ⚡ Performance Testing

### Code Splitting
- [ ] Open DevTools Network tab
- [ ] **Lazy loaded** chunks appear (PortableInterfaceNew, PWAUpdateNotification)
- [ ] **Bundle size** for main chunk < 200KB (gzipped)
- [ ] **Initial load** time < 3 seconds on 3G

### React.memo Optimization
- [ ] **ChatInterface** doesn't re-render when switching tabs
- [ ] **GPSMapComponent** doesn't re-render on unrelated state changes
- [ ] **ProfileEditor** only re-renders when user data changes
- [ ] **ContactList** only re-renders when contacts/search changes

### Web Vitals (Chrome DevTools > Lighthouse)
- [ ] **FCP** (First Contentful Paint) < 1.8s
- [ ] **LCP** (Largest Contentful Paint) < 2.5s
- [ ] **CLS** (Cumulative Layout Shift) < 0.1
- [ ] **TTI** (Time to Interactive) < 3.5s
- [ ] **TBT** (Total Blocking Time) < 300ms

### Lighthouse Scores
- [ ] **Performance** ≥ 90
- [ ] **Accessibility** ≥ 95
- [ ] **Best Practices** ≥ 90
- [ ] **SEO** ≥ 90
- [ ] **PWA** ≥ 90

---

## ♿ Accessibility Testing

### Keyboard Navigation
- [ ] **Tab** key navigates through all interactive elements
- [ ] **Enter/Space** activates buttons and links
- [ ] **ESC** closes modals and dropdowns
- [ ] **Arrow keys** work in dropdown menus
- [ ] **Focus visible** (ring) on all focusable elements

### Screen Reader (NVDA/JAWS/VoiceOver)
- [ ] **Form labels** announced correctly
- [ ] **Button purposes** described clearly
- [ ] **Error messages** read aloud
- [ ] **Landmark regions** (nav, main, aside) identified
- [ ] **Modal titles** announced on open
- [ ] **Loading states** communicated

### Visual Accessibility
- [ ] **Color contrast** ≥ 4.5:1 for normal text (WCAG AA)
- [ ] **Color contrast** ≥ 3:1 for large text
- [ ] **Focus indicators** visible on all elements
- [ ] **Error states** not indicated by color alone
- [ ] **Text resizable** to 200% without breaking layout

### Motion Preferences
- [ ] Open Settings > Accessibility > Reduce Motion
- [ ] **Animations disabled** when `prefers-reduced-motion: reduce`
- [ ] **Transitions** become instant (0.01ms)
- [ ] **App still usable** without animations

---

## 🐛 Edge Cases & Error Handling

### Network Errors
- [ ] **Offline mode** shows appropriate message
- [ ] **Failed API calls** show error toasts
- [ ] **Timeout errors** handled gracefully
- [ ] **Retry mechanisms** work for failed requests

### Empty States
- [ ] **No contacts** shows "No contacts available" message
- [ ] **No messages** shows "Send the first message" prompt
- [ ] **No location** shows location error message
- [ ] **No search results** shows "No contacts found"

### Form Validation
- [ ] **Email format** validated (Zod)
- [ ] **Password length** enforced (min 6 characters)
- [ ] **Required fields** show validation errors
- [ ] **Phone number** format validated
- [ ] **Terms acceptance** required for registration

### Data Edge Cases
- [ ] **Very long names** truncate with ellipsis
- [ ] **Special characters** in messages render correctly
- [ ] **Empty bio** doesn't break profile layout
- [ ] **Missing avatar** shows initials fallback
- [ ] **Location permission denied** falls back to IP

---

## 🔒 Security Testing

### Authentication Security
- [ ] **Passwords** not visible in console/network tab
- [ ] **Firebase API keys** in environment variables
- [ ] **Session tokens** stored securely
- [ ] **Logout** clears all auth state
- [ ] **Protected routes** redirect to login when unauthenticated

### Data Privacy
- [ ] **User location** only shared when visible
- [ ] **Profile visibility** toggle works
- [ ] **Messages** only visible to sender/receiver
- [ ] **Firestore rules** prevent unauthorized access

---

## 📊 Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] No console errors
- [ ] Animations smooth

### Firefox
- [ ] All features work
- [ ] WebGL map rendering works
- [ ] Flexbox/Grid layouts correct

### Safari (iOS/macOS)
- [ ] All features work
- [ ] Touch events work on iOS
- [ ] Safe area insets respected
- [ ] No webkit-specific issues

---

## 🎯 Final Verification

### Code Quality
- [ ] **No TypeScript errors** (`npm run build`)
- [ ] **No ESLint warnings** (if configured)
- [ ] **No console errors** in browser
- [ ] **No memory leaks** in Chrome DevTools > Memory

### Git & Deployment
- [ ] **All changes committed** to Git
- [ ] **Build succeeds** (`npm run build`)
- [ ] **Production build** optimized (<500KB total)
- [ ] **Environment variables** configured for production

---

## 📈 Success Metrics (from Plan)

| Metric                  | Before  | Target   | Actual  |
|-------------------------|---------|----------|---------|
| Total Lines of Code     | ~8,000  | ~4,800   | ____    |
| PortableInterface.tsx   | 1,503   | ~200     | 299 ✅  |
| Bundle Size             | 450 KB  | <500 KB  | ____    |
| Shadcn Components       | 0       | 12+      | 16 ✅   |
| Lighthouse Performance  | 85      | 90+      | ____    |
| Lighthouse Accessibility| 80      | 95+      | ____    |

---

## ✅ Sign-Off

**Tested By:** _________________
**Date:** _________________
**Overall Result:** ⬜ PASS / ⬜ FAIL
**Notes:**

---

**Next Steps After Testing:**
1. Fix any failing tests
2. Update documentation
3. Deploy to staging environment
4. Perform UAT (User Acceptance Testing)
5. Deploy to production
