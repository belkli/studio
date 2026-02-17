# הרמוניה - System Design Document (Additional Sections)

## Version 2.0 - Gap Analysis Implementation

---

## 6. Auto-Save System

### 6.1 Overview
The auto-save system ensures users never lose their work by automatically persisting draft form data at regular intervals without requiring manual intervention.

### 6.2 Functional Requirements

#### 6.2.1 Save Triggers
- **Periodic Auto-Save**: System saves form data every 30 seconds if changes have been detected
- **Debounced Save**: After user stops typing, system waits 2 seconds before saving (prevents excessive saves during active typing)
- **Manual Save**: Users can trigger immediate save via "שמור טיוטה" (Save Draft) button
- **Navigation Save**: System saves automatically when user attempts to navigate away from form

#### 6.2.2 Save Conditions
- Auto-save only activates for forms in `טיוטה` (draft) status
- System does not auto-save forms that are already submitted or approved
- Save operations are non-blocking - user can continue editing during save

#### 6.2.3 Visual Indicators
The system provides clear feedback about save status:

**Saving State:**
- Display: "⏳ שומר..." (Saving...)
- Shows during active save operation
- Spinner animation

**Saved State:**
- Display: "✓ נשמר ב-[TIME]" (Saved at [TIME])
- Shows timestamp of last successful save
- Format: HH:MM (e.g., "14:32")
- Appears for 3 seconds, then fades

**Unsaved Changes State:**
- Display: "⚠️ שינויים לא נשמרו" (Unsaved changes)
- Shows when form has been modified since last save
- Orange warning color

**Error State:**
- Display: "❌ שגיאה בשמירה - נסה שוב" (Save error - try again)
- Shows if save fails
- Provides retry mechanism

#### 6.2.4 Save Status Bar
A sticky status bar appears at the top of form pages containing:
- Save status indicator (left side)
- Manual "שמור טיוטה" button (right side)
- Button disabled when no changes or during save
- Status bar remains visible during scroll

### 6.3 Data Persistence
- Form data stored in Firestore `form_submissions` collection
- Each save updates `data_json` field with current form state
- Updates `updated_at` timestamp
- Preserves `created_at` timestamp from initial creation

### 6.4 Error Handling
- Network failure: Queue save for retry when connection restored
- Authentication expiry: Prompt user to re-authenticate
- Validation errors: Save data but mark fields requiring attention
- Storage quota: Notify user if storage limits approached

---

## 7. Digital Signature & Stamp System

### 7.1 Overview
The digital signature system allows Conservatorium Administrators to add handwritten signatures to approved forms, with automatic conservatorium stamp overlay for official documentation.

### 7.2 Signature Workflow

#### 7.2.1 Signature Trigger
Digital signature interface appears when:
- Form status is `ממתין לאישור מנהל` (Pending Admin Approval)
- User role is `conservatorium_admin`
- User clicks "אשר" (Approve) button
- Form has passed all validations

#### 7.2.2 Signature Capture
**Canvas Component:**
- Dimensions: 500px width × 200px height
- Drawing surface: White background, black ink
- Touch-enabled: Works with mouse, stylus, or finger
- Tools provided: Clear button, Redo button (optional)

**User Actions:**
- Draw signature naturally with mouse/finger
- Clear to start over if unsatisfied
- Save signature to proceed with approval
- Cancel to return without approving

**Validation:**
- Cannot approve without drawing signature
- System validates that canvas is not blank
- Minimum stroke count required (prevents accidental approval)

#### 7.2.3 Signature Storage
**File Management:**
- Signature converted to PNG image format
- Stored in Firebase Storage bucket: `signatures/`
- Naming convention: `sig_[USER_ID]_[FORM_ID]_[TIMESTAMP].png`
- Example: `sig_abc123_form456_1640995200000.png`

**Database Reference:**
- URL stored in form document: `signature_url` field
- Additional metadata: `signed_by` (user ID), `signed_at` (timestamp)
- Signature associated with specific approval event

### 7.3 Conservatorium Stamp System

#### 7.3.1 Stamp Management
Each conservatorium has an official stamp image:
- Storage location: Firebase Storage bucket `stamps/`
- Naming convention: `stamp_conservatorium_[CONS_ID].png`
- Example: `stamp_conservatorium_hod_hasharon.png`
- Format: PNG with transparent background
- Recommended size: 200px × 200px

#### 7.3.2 Stamp Association
- Each conservatorium document includes `stamp_url` field
- Admin uploads official stamp during conservatorium setup
- Only Site Admins can upload/change conservatorium stamps
- Stamps version-controlled (optional: keep history)

### 7.4 PDF Generation with Signature & Stamp

#### 7.4.1 PDF Layout Requirements
When generating PDF for approved forms:

**Signature Placement:**
- Position: Bottom-right corner of document
- Size: 150px × 75px (scaled proportionally)
- Above signature line
- Label: "חתימת המנהל" (Manager's Signature)

**Stamp Overlay:**
- Position: Bottom-left corner of document
- Size: 120px × 120px
- Partially overlapping signature area
- Semi-transparent (80% opacity) or full opacity based on design

**Layout Coordination:**
- Both elements visible simultaneously
- No overlap that obscures critical information
- Signature validates document authenticity
- Stamp confirms institutional approval

#### 7.4.2 PDF Generation Process
1. Retrieve form data from Firestore
2. Load signature image from Firebase Storage
3. Load conservatorium stamp from Firebase Storage
4. Generate PDF document with Hebrew RTL layout
5. Embed signature and stamp at specified positions
6. Include all form data in structured format
7. Return downloadable PDF file

---

## 8. Notification System

### 8.1 Overview
The notification system keeps users informed of important events through multiple channels: in-app notifications and email alerts.

### 8.2 Notification Channels

#### 8.2.1 In-App Notifications
**Always Enabled:**
- Every user receives in-app notifications
- Cannot be disabled (core functionality)
- Real-time delivery via Firestore listeners

**Display Mechanism:**
- Notification bell icon in top navigation bar
- Red badge showing unread count
- Click to open dropdown showing recent notifications
- List shows last 10 notifications
- Unread notifications highlighted (blue background)

**Notification Structure:**
- Title (bold, max 50 characters)
- Message (regular text, max 200 characters)
- Timestamp (relative: "לפני 5 דקות" or absolute: "15/02/2024")
- Link to relevant page (optional)
- Read/Unread status

#### 8.2.2 Email Notifications
**User Configurable:**
- Users can enable/disable email notifications globally
- Users can choose which events trigger emails
- Preference stored per user in Firestore

**Email Service:**
- Sent via Firebase Extensions (e.g., Trigger Email)
- Or integrated third-party service (SendGrid, Mailgun)
- HTML email templates with Hebrew RTL support
- Branded with הרמוניה logo and styling

**Email Content:**
- Subject line in Hebrew
- Greeting with user name
- Event description
- Call-to-action button (links to platform)
- Footer with unsubscribe link

### 8.3 Notification Triggers

#### 8.3.1 User Registration Events

**Trigger:** New user completes registration
- **Recipient:** Conservatorium Admin of selected conservatorium
- **Title:** "משתמש חדש ממתין לאישור"
- **Message:** "[User Name] נרשם כ[Role] ומחכה לאישור"
- **Link:** `/admin/users/pending`
- **Channels:** In-app + Email (if enabled)

**Trigger:** User account approved
- **Recipient:** Newly approved user
- **Title:** "חשבונך אושר!"
- **Message:** "החשבון שלך אושר. ניתן להתחבר למערכת ולהתחיל להשתמש בשירותים"
- **Link:** `/login`
- **Channels:** In-app + Email (always sent)

**Trigger:** User account rejected
- **Recipient:** Rejected user
- **Title:** "הבקשה נדחתה"
- **Message:** "הבקשה שלך להצטרף למערכת נדחתה. לפרטים נוספים צור קשר עם מנהל הקונסרבטוריון"
- **Link:** None
- **Channels:** Email only (user cannot access in-app)

#### 8.3.2 Form Submission Events

**Trigger:** Student submits form
- **Recipient:** Assigned teacher
- **Title:** "טופס חדש לאישור"
- **Message:** "[Student Name] הגיש/ה טופס [Form Type] ומחכה לאישור שלך"
- **Link:** `/forms/[form_id]`
- **Channels:** In-app + Email (if enabled)

**Trigger:** Teacher approves form
- **Recipient:** Submitting student
- **Title:** "הטופס אושר על ידי המורה"
- **Message:** "הטופס שלך אושר על ידי [Teacher Name] והועבר לאישור מנהל הקונסרבטוריון"
- **Link:** `/forms/[form_id]`
- **Channels:** In-app + Email (if enabled)

**Recipient:** Conservatorium Admin
- **Title:** "טופס חדש לאישור סופי"
- **Message:** "טופס של [Student Name] אושר על ידי המורה וממתין לאישור שלך"
- **Link:** `/forms/[form_id]`
- **Channels:** In-app + Email (if enabled)

**Trigger:** Admin approves form (final approval)
- **Recipient:** Submitting student
- **Title:** "🎉 הטופס אושר במלואו!"
- **Message:** "הטופס שלך קיבל אישור סופי. ניתן להוריד PDF של הטופס המאושר"
- **Link:** `/forms/[form_id]`
- **Channels:** In-app + Email (always sent)

**Recipient:** Approving teacher
- **Title:** "טופס אושר"
- **Message:** "טופס של [Student Name] אושר סופית על ידי מנהל הקונסרבטוריון"
- **Link:** `/forms/[form_id]`
- **Channels:** In-app only

**Trigger:** Form rejected at any stage
- **Recipient:** Submitting student
- **Title:** "הטופס נדחה"
- **Message:** "הטופס שלך נדחה. סיבה: [Rejection Reason]"
- **Link:** `/forms/[form_id]`
- **Channels:** In-app + Email (always sent)

#### 8.3.3 Comment & Communication Events

**Trigger:** Someone adds comment to form
- **Recipient:** All users associated with form (student, teacher, admin)
- **Title:** "הערה חדשה על טופס"
- **Message:** "[Commenter Name] הוסיף/ה הערה: '[First 50 chars of comment]...'"
- **Link:** `/forms/[form_id]#comments`
- **Channels:** In-app + Email (if enabled)

### 8.4 Notification Preferences

#### 8.4.1 User Settings Page
Users access notification preferences at `/settings/notifications`

**Global Settings:**
- Enable/Disable email notifications (toggle)
- Email address confirmation (displays current email)

**Event-Specific Settings:**
Each event type has individual toggle:
- ☐ טופס חדש הוגש (Form submitted) - For teachers/admins
- ☐ טופס אושר (Form approved) - For students
- ☐ טופס נדחה (Form rejected) - For students
- ☐ הערה חדשה (New comment) - For all users
- ☐ משתמש חדש נרשם (New user registered) - For admins

**Default Settings:**
- New users: All notifications enabled
- Email: Enabled by default
- Users can customize after first login

#### 8.4.2 Preference Storage
Stored in Firestore `users` collection:
```
notification_preferences: {
  email_enabled: boolean,
  notify_form_submitted: boolean,
  notify_form_approved: boolean,
  notify_form_rejected: boolean,
  notify_new_comment: boolean,
  notify_user_registered: boolean
}
```

### 8.5 Real-Time Delivery

#### 8.5.1 In-App Notifications
- Use Firestore real-time listeners
- Notifications collection: `notifications/{notification_id}`
- Subscribe to user's notifications on login
- Update UI immediately when new notification arrives
- Play subtle sound/vibration (optional, user preference)

#### 8.5.2 Email Notifications
- Triggered via Cloud Functions
- Queue-based to handle spikes (Cloud Tasks)
- Retry failed emails up to 3 times
- Track delivery status in Firestore

---

## 9. PDF Generation Specifications

### 9.1 Overview
The system generates professional PDF documents for approved forms that match the layout and structure of the original Excel-based forms currently in use.

### 9.2 PDF Library & Technology
- **Library:** jsPDF with jsPDF-AutoTable plugin
- **Alternative:** PDFKit (if server-side generation preferred)
- **Font Requirements:** Hebrew-compatible font (Rubik, Heebo, or similar)
- **Font Embedding:** Required for proper Hebrew display

### 9.3 Document Structure

#### 9.3.1 Header Section
**Content:**
- System name: "הרמוניה - מערכת ניהול קונסרבטוריונים"
- Form title: Based on form type (e.g., "טופס רסיטל בגרות")
- Academic year: Auto-populated from form data
- Form number/ID: Unique identifier

**Layout:**
- Centered at top of page
- Large bold font for main title
- Smaller font for subtitle
- Decorative border (optional)

#### 9.3.2 Conservatorium Details
**Left Side:**
- Conservatorium name
- Manager name
- Office phone
- Manager mobile
- Email address

**Right Side:**
- Conservatorium logo (if available)
- Address
- City

#### 9.3.3 Student Information Section
**Required Fields:**
- Student full name
- ID number (9 digits)
- School name and symbol (8 digits)
- Grade level (י, יא, יב)
- Instrument
- Years studying at conservatorium
- Teacher name

**Layout:**
- Two-column layout for efficient space usage
- Right-aligned labels (Hebrew)
- Clear separation between fields
- Bold labels, regular text for values

#### 9.3.4 Repertoire Table
**Table Structure:**
- Bordered table with header row
- Right-to-left column order

**Columns:**
1. מס' (Number) - Row number
2. שם המלחין (Composer name)
3. שם היצירה (Composition title)
4. עיבוד (Arranger) - if applicable
5. זמן ביצוע (Duration) - MM:SS format
6. סגנון (Genre/Style)

**Table Styling:**
- Header row: Background color (light blue), bold text
- Alternating row colors for readability (optional)
- Borders on all cells
- Right-aligned text in all columns

**Table Footer:**
- Total duration row: "זמן כולל: [MM:SS]"
- Calculated by summing all composition durations
- Bold text, possibly different background

#### 9.3.5 Additional Sections
**Notes/Comments Section:**
- Free-text area for additional information
- Teacher comments (if any)
- Admin comments (if any)
- Special instructions or requirements

**Approval Section:**
- Teacher approval: Name and date
- Admin approval: Name and date
- Approval status indicator

#### 9.3.6 Footer Section
**Signature Area:**
- Right side: "חתימת המנהל" (Manager's signature)
  - Embedded signature image (if signed)
  - Signature line if not yet signed
  
- Left side: Conservatorium official stamp
  - Embedded stamp image
  - Positioned to partially overlap signature area (traditional style)

**Document Information:**
- Generation date: "תאריך הפקה: [DD/MM/YYYY]"
- Form ID: "מזהה טופס: [ID]"
- Page numbers (if multi-page): "עמוד X מתוך Y"

### 9.4 Layout Requirements

#### 9.4.1 Page Setup
- Page size: A4 (210mm × 297mm)
- Orientation: Portrait
- Margins: 20mm all sides
- Direction: Right-to-Left (RTL)

#### 9.4.2 Typography
- **Headings:** 16-18pt, Bold, Rubik font
- **Subheadings:** 12-14pt, Bold
- **Body text:** 10-12pt, Regular
- **Table text:** 9-11pt
- Line spacing: 1.2-1.5

#### 9.4.3 Color Scheme
- **Primary text:** Black (#000000)
- **Headers:** Dark blue (#1E40AF)
- **Table headers:** Light blue background (#DBEAFE)
- **Borders:** Gray (#6B7280)
- **Highlights:** Yellow (#FEF3C7) for important sections

### 9.5 PDF Generation Triggers

#### 9.5.1 Generation Points
PDFs can be generated at:
- Form approval (automatically generated)
- User request (manual "ייצא PDF" button)
- Admin download (from form view page)

#### 9.5.2 Generation Process
1. Retrieve form data from Firestore
2. Retrieve associated user data (student, teacher, admin)
3. Retrieve conservatorium data
4. Retrieve school data
5. Load signature image (if signed)
6. Load conservatorium stamp image
7. Generate PDF using library
8. Embed images at specified positions
9. Return file for download or storage

#### 9.5.3 Storage Options
**Option A: Generate on-demand**
- Generate PDF when user clicks download
- No storage required
- Always reflects latest data
- Slightly slower (generation time)

**Option B: Generate and store**
- Generate PDF upon approval
- Store in Firebase Storage: `pdfs/form_[ID].pdf`
- Fast access for repeat downloads
- Requires storage space
- May become outdated if form edited

**Recommendation:** Hybrid approach
- Store final approved PDFs
- Generate on-demand for drafts/previews

### 9.6 Accessibility & Compliance

#### 9.6.1 Document Properties
- Title: Form type and student name
- Author: "הרמוניה - מערכת ניהול קונסרבטוריונים"
- Subject: Form category
- Keywords: Student name, conservatorium, academic year
- Language: Hebrew (he-IL)

#### 9.6.2 Security Settings
- Printing: Allowed
- Copying text: Allowed
- Modifying: Not allowed
- Password protection: Optional (admin setting)

---

## 10. Composition Library & Autocomplete System

### 10.1 Overview
The composition library is a searchable database of musical works that helps users quickly find and select pieces for their repertoire without manual typing, while also allowing custom entries for unlisted compositions.

### 10.2 Library Structure

#### 10.2.1 Data Model
Compositions stored in Firestore collection: `compositions`

**Document Fields:**
- `id`: Unique identifier (auto-generated)
- `composer`: Composer full name (e.g., "Bach, J.S.")
- `title`: Composition title (e.g., "Prelude in C Major")
- `title_he`: Hebrew translation of title (optional)
- `duration_minutes`: Typical performance duration (integer)
- `genre`: Musical style (קלאסי, ג'אז, etc.)
- `arranger`: Name of arranger (if arrangement)
- `opus_number`: Opus/catalog number (optional)
- `source`: Origin of data ('seed', 'api', 'user_submitted')
- `approved`: Boolean - whether admin approved
- `created_by`: User ID who submitted (if user_submitted)
- `created_at`: Timestamp
- `search_index`: Concatenated searchable text (for Firestore queries)

### 10.3 Autocomplete Functionality

#### 10.3.1 Search Mechanism
**Composer Autocomplete:**
- User types in composer field
- System searches `compositions` collection
- Filters by `composer` field containing typed text
- Returns distinct composer names (no duplicates)
- Displays in dropdown with up to 10 results
- Case-insensitive search

**Composition Autocomplete:**
- Activated after composer selected
- Searches only compositions by selected composer
- Filters by `title` field containing typed text
- Returns matching compositions
- Displays: "Title - Duration: Xmin"
- Shows up to 20 results

**Combined Search:**
- User can search without selecting composer first
- Searches both composer and title fields
- Displays: "Composer - Title"
- Less efficient but more flexible

#### 10.3.2 Search Performance
- Implement search using Firestore where queries
- For better performance: Use Algolia integration (optional)
- Hebrew text search: Configure tokenization for Hebrew
- Fuzzy matching: Allow minor typos (within 1-2 characters)
- Minimum characters: Start searching after 2 characters typed

#### 10.3.3 Display Format
Autocomplete dropdown shows:
- **Primary text:** Composition title (bold)
- **Secondary text:** Composer name (regular), Duration (italic)
- **Icon:** Musical note icon (optional)
- **Highlighting:** Matched text highlighted in results

Example display:
```
🎵 Prelude in C Major
   Bach, J.S. · 2 דקות
```

### 10.4 Custom Entry System

#### 10.4.1 Custom Entry Flow
When composition not found in library:

1. User types composition name
2. System searches library
3. No results found
4. Display message: "לא נמצא? הקלד ערך מותאם אישית" (Not found? Enter custom value)
5. User clicks "הוסף יצירה חדשה" (Add new composition)
6. Modal/inline form appears with fields:
   - Composer name (required)
   - Composition title (required)
   - Duration (MM:SS format)
   - Arranger (optional)
   - Genre (dropdown selection)
7. User fills and submits
8. Composition added to library with `approved: false`
9. Success message: "✓ יצירה חדשה נוספה וממתינה לאישור מנהל"
10. Composition appears in form but marked as "pending"

#### 10.4.2 Approval Workflow
**For Site Admin:**
- Navigate to "ניהול ספרייה" (Library Management)
- View list of pending compositions
- For each pending composition:
  - See full details
  - Who submitted
  - When submitted
  - Actions: Approve or Reject

**Approval:**
- Click "אשר" button
- Composition `approved` field set to `true`
- Now appears in autocomplete for all users
- Submitter notified (optional)

**Rejection:**
- Click "דחה" button
- Optional: Add rejection reason
- Composition remains with `approved: false`
- Does not appear in general autocomplete
- Submitter notified with reason (optional)
- Can be deleted permanently or kept for audit

### 10.5 Library Seeding & Management

#### 10.5.1 Initial Seed Data
System pre-populated with essential classical repertoire:
- 100-200 commonly performed compositions
- Major composers: Bach, Beethoven, Mozart, Chopin, Debussy, etc.
- Variety of instruments and difficulty levels
- Data sources: Public domain databases, Open Opus API

#### 10.5.2 Bulk Import
**Admin functionality:**
- Import from CSV/Excel file
- CSV columns: Composer, Title, Duration, Genre, Arranger
- Validation before import
- Duplicate detection
- Auto-approve imported data (admin trust)

#### 10.5.3 Library Maintenance
**Admin tools:**
- Edit existing compositions
- Merge duplicates
- Delete obsolete entries
- Bulk approve pending submissions
- Export library to CSV (backup)

### 10.6 Performance Optimization

#### 10.6.1 Caching Strategy
- Cache frequently searched composers
- Cache popular compositions
- Client-side caching of recent searches
- Reduce Firestore read costs

#### 10.6.2 Indexing
- Create Firestore indexes on `composer` field
- Create indexes on `title` field
- Composite indexes for combined searches
- Regular index optimization

---

## 11. Repeater Fields System

### 11.1 Overview
Repeater fields allow users to add multiple entries of the same type (e.g., multiple compositions in repertoire) with add/remove functionality and data validation.

### 11.2 Functional Behavior

#### 11.2.1 Initial State
When form loads:
- Display minimum number of rows as specified in form schema
- For recital forms: Minimum 3 repertoire rows
- For conference forms: Minimum 1 participant row
- Empty rows ready for data entry

#### 11.2.2 Adding Rows
**Add Button:**
- Located at bottom of repeater section
- Label: "+ הוסף [item type]" (e.g., "+ הוסף יצירה")
- Green color, full-width on mobile
- Enabled if below maximum row limit

**Behavior:**
- Click button to add new empty row
- New row appears at bottom of list
- Row numbers auto-increment
- Focus automatically moves to first field of new row
- Smooth animation for row addition

**Constraints:**
- Maximum rows: Defined in form schema (e.g., 10 for repertoire)
- Button disabled when maximum reached
- Message displayed: "הגעת למספר המקסימלי של [X] יצירות"

#### 11.2.3 Removing Rows
**Delete Button:**
- Appears on each row (except when at minimum)
- Icon: 🗑️ trash icon
- Color: Red, but subtle (not prominent)
- Position: Right side of row (RTL layout)

**Behavior:**
- Click to remove row immediately
- Confirm deletion if row contains data
- Confirmation modal: "למחוק שורה זו? הפעולה לא ניתנת לביטול"
- Row animates out smoothly
- Remaining rows re-number automatically

**Constraints:**
- Cannot delete if at minimum row count
- Delete button hidden/disabled when at minimum
- Message displayed (optional): "נדרש לפחות [X] יצירות"

#### 11.2.4 Row Numbering
- Automatic sequential numbering: 1, 2, 3...
- Updates dynamically as rows added/removed
- Displayed in separate column or inline
- Bold styling for visibility

### 11.3 Data Structure

#### 11.3.1 Form Data Storage
Repeater data stored as array in Firestore document:

```
repertoire: [
  {
    composer: string,
    title: string,
    duration: string, // MM:SS format
    arranger: string, // optional
    genre: string
  },
  // ... more compositions
]
```

#### 11.3.2 Validation Rules
**Per-Row Validation:**
- Each row validates independently
- Required fields marked with asterisk
- Validation triggered on blur or submit
- Error messages appear below invalid fields

**Overall Validation:**
- Minimum row count: Must meet form schema requirement
- Maximum row count: Cannot exceed limit
- Empty rows: Allowed in draft, blocked on submission
- Duplicate detection: Warning if same composition appears twice

### 11.4 User Experience

#### 11.4.1 Desktop Layout
- Table format with columns
- Each row has inputs/dropdowns in columns
- Delete button in rightmost column
- Add button below table
- Horizontal scrolling if needed (mobile)

#### 11.4.2 Mobile Layout
- Each row becomes card
- Fields stack vertically within card
- Card has border and padding
- Delete button at top-right of card
- Add button fixed at bottom of screen
- Swipe gesture to delete (optional)

#### 11.4.3 Accessibility
- Keyboard navigation: Tab through fields, Enter to add row
- Screen reader announcements for add/remove actions
- ARIA labels for dynamic content
- Undo functionality for accidental deletion (optional)

---

## 12. Duration Format & Validation

### 12.1 Format Specification

#### 12.1.1 Input Format
- Standard format: MM:SS (minutes:seconds)
- Two digits for minutes (00-99)
- Colon separator
- Two digits for seconds (00-59)
- Examples: "02:30", "05:15", "10:00", "00:45"

#### 12.1.2 Display Format
- Always display with leading zeros
- Example: "5:30" auto-formatted to "05:30"
- Total duration displayed as "זמן כולל: [MM:SS]"

### 12.2 Input Component

#### 12.2.1 User Interface
**Input Field:**
- Placeholder text: "MM:SS (דוגמה: 05:30)"
- Max length: 5 characters (MM:SS)
- Input mask: Automatically inserts colon after minutes
- Type: Text field with pattern validation

**Auto-Formatting:**
- User types: "530" → Auto-formats to "05:30"
- User types: "2" → Prompts for more input
- User pastes "5:30" → Auto-corrects to "05:30"
- User types: "525" → Auto-corrects to "05:25"

**Keyboard Support:**
- Numeric keypad optimized
- Colon key easily accessible
- Arrow keys to adjust values (optional enhancement)

#### 12.2.2 Validation Rules

**Real-Time Validation (on blur):**
- Check format matches MM:SS pattern
- Validate minutes: 00-99 (allow up to 99 minutes)
- Validate seconds: 00-59 (enforce max 59 seconds)

**Error Messages:**
Hebrew error messages:
- Invalid format: "פורמט שגוי. יש להזין זמן בפורמט MM:SS"
- Seconds too high: "השניות לא יכולות לעלות על 59"
- Empty field: "זמן הביצוע הוא שדה חובה"
- Zero duration: "זמן הביצוע חייב להיות גדול מ-00:00"

**Visual Indicators:**
- Invalid input: Red border
- Valid input: Green border (brief flash)
- Required field empty: Orange border

### 12.3 Duration Calculation

#### 12.3.1 Automatic Summation
**Total Duration Calculation:**
- Sum all individual composition durations
- Displayed at bottom of repertoire table
- Format: "זמן כולל: [MM:SS]"
- Updates in real-time as durations entered/changed

**Calculation Logic:**
1. Convert each MM:SS to total seconds
2. Sum all seconds
3. Convert back to MM:SS format
4. Display result

**Example:**
- Composition 1: 02:30 (150 seconds)
- Composition 2: 03:45 (225 seconds)
- Composition 3: 04:15 (255 seconds)
- Total: 10:30 (630 seconds)

#### 12.3.2 Duration Guidelines
**Warning Messages:**
Display warnings if total duration:
- Too short: "זמן כולל קצר מהרגיל לרסיטל" (if < 15 minutes for recital)
- Too long: "זמן כולל חורג מהמומלץ" (if > 45 minutes for recital)
- Warnings non-blocking - user can proceed

**Recommended Durations:**
- Recital (grade 10): 15-20 minutes
- Recital (grade 11): 20-30 minutes
- Recital (grade 12): 25-35 minutes
- Conference performance: 10-20 minutes

---

## 13. Status Badge & Visual Indicator System

### 13.1 Overview
Status badges provide instant visual feedback about form state throughout the application interface.

### 13.2 Status Types & Styling

#### 13.2.1 Draft (טיוטה)
- **Color:** Gray
- **Background:** #F3F4F6 (light gray)
- **Text Color:** #374151 (dark gray)
- **Icon:** 📝 (optional)
- **Meaning:** Form is being edited, not submitted

#### 13.2.2 Pending Teacher Approval (ממתין לאישור מורה)
- **Color:** Yellow
- **Background:** #FEF3C7 (light yellow)
- **Text Color:** #92400E (dark yellow/brown)
- **Icon:** ⏳ (optional)
- **Meaning:** Submitted, awaiting teacher review

#### 13.2.3 Pending Admin Approval (ממתין לאישור מנהל)
- **Color:** Orange
- **Background:** #FED7AA (light orange)
- **Text Color:** #9A3412 (dark orange)
- **Icon:** ⏰ (optional)
- **Meaning:** Teacher approved, awaiting admin review

#### 13.2.4 Approved (מאושר)
- **Color:** Green
- **Background:** #D1FAE5 (light green)
- **Text Color:** #065F46 (dark green)
- **Icon:** ✓ or 🎉 (optional)
- **Meaning:** Fully approved by admin

#### 13.2.5 Rejected (נדחה)
- **Color:** Red
- **Background:** #FEE2E2 (light red)
- **Text Color:** #991B1B (dark red)
- **Icon:** ✗ or ⚠️ (optional)
- **Meaning:** Form rejected at some stage

### 13.3 Badge Component Specifications

#### 13.3.1 Visual Design
- **Shape:** Rounded rectangle (border-radius: 16px)
- **Padding:** 6px horizontal, 2px vertical
- **Font Size:** 12-14px
- **Font Weight:** 500 (medium)
- **Display:** Inline-block

#### 13.3.2 Responsive Behavior
- **Desktop:** Small compact badge
- **Mobile:** Slightly larger for touch-friendly
- **Icon:** Optional on mobile (save space)

### 13.4 Usage Locations

#### 13.4.1 Form List View
- Badge appears in status column
- Replaces text status with visual badge
- Sortable/filterable by status
- Clear at-a-glance understanding

#### 13.4.2 Form Detail View
- Large badge at top of form
- Accompanies form title
- More prominent than list view

#### 13.4.3 Dashboard Cards
- Mini badges in recent activity cards
- Status summary with badge counts
- Color-coded statistics

#### 13.4.4 Notifications
- Badge appears in notification text
- Helps quickly identify notification type
- Consistent with form status badge

---

## 14. Field Dependencies & Cascading Logic

### 14.1 Overview
Field dependencies create intelligent forms where selections in one field automatically affect available options or values in related fields.

### 14.2 Dependency Types

#### 14.2.1 Composer → Composition Filtering
**Dependency:**
- Primary Field: Composer selection (dropdown/autocomplete)
- Dependent Field: Composition selection (dropdown/autocomplete)

**Behavior:**
1. User selects composer from dropdown
2. Composition field becomes active
3. Composition dropdown filtered to show only works by selected composer
4. If user changes composer, composition field resets
5. User can search within filtered compositions

**Implementation:**
- Composition query includes `where('composer', '==', selectedComposer)`
- Query runs on composer selection
- Results populate composition dropdown

#### 14.2.2 Student Selection → Student Data Auto-Fill
**Dependency:**
- Primary Field: Student selection (for teachers creating forms)
- Dependent Fields: Name, ID, School, Instrument, Years Studying

**Behavior:**
1. Teacher opens "Create Form" page
2. First field: "בחר תלמיד/ה" (Select Student)
3. Dropdown shows teacher's assigned students
4. Teacher selects student
5. All student fields auto-populate
6. Fields become read-only (locked)
7. Teacher cannot modify student data

**Implementation:**
- On student selection, fetch student document from Firestore
- Populate form fields with student data
- Set fields to `disabled` or `readOnly` state

#### 14.2.3 Conservatorium Selection → Contact Info Display
**Dependency:**
- Primary Field: Conservatorium selection
- Dependent Fields: Manager name, office phone, manager mobile, email

**Behavior:**
1. User selects conservatorium (during registration or form creation)
2. Conservatorium contact information automatically displays
3. Information shown in read-only format
4. Helps users verify correct conservatorium

**Implementation:**
- Query conservatorium document
- Display fields in non-editable format
- Update if conservatorium selection changes

#### 14.2.4 Ensemble Type → Group Fields Visibility
**Dependency:**
- Primary Field: "האם מדובר בהרכב?" (Is this an ensemble?) - Yes/No radio buttons
- Dependent Fields: Number of participants, conductor name, accompanist details

**Behavior:**
1. User indicates if performance is solo or ensemble
2. If "Yes" (ensemble): Group-specific fields appear
3. If "No" (solo): Group fields hidden
4. Fields required only when visible

**Implementation:**
- Conditional rendering based on ensemble boolean
- Form validation checks only visible required fields

### 14.3 User Experience Guidelines

#### 14.3.1 Clear Indicators
- Dependent fields initially disabled with subtle gray
- Tooltip: "בחר [primary field] תחילה" (Select [primary field] first)
- Fields animate in smoothly when activated

#### 14.3.2 Reset Behavior
- When primary field changes, dependent field resets
- Optional: Confirm reset if dependent field has data
- Message: "שינוי [primary field] ינקה את [dependent field]. להמשיך?"

#### 14.3.3 Loading States
- Show loading indicator while fetching dependent data
- Disable dependent field until data loaded
- Prevent race conditions with proper async handling

---

## 15. Data Seeding & Initial Setup

### 15.1 Overview
The system requires comprehensive initial data to function properly. This section details what data must be seeded and how.

### 15.2 Seed Data Categories

#### 15.2.1 Conservatoriums
**Data Source:** PROMPT_CONTEXT.md (15+ Israeli conservatoriums)
**Fields:** Name, City, Manager Name, Governing Body, Office Phone, Manager Mobile, Manager Email
**Quantity:** Minimum 15 conservatoriums
**Format:** Firestore collection `conservatoriums`

#### 15.2.2 Schools (Mosdot)
**Data Source:** mosdot.xlsx file (if available) or sample data
**Fields:** Symbol Number (8 digits), School Name (Hebrew), City, Address, Sector
**Quantity:** 100+ schools (comprehensive coverage)
**Format:** Firestore collection `schools`
**Note:** Essential for school autocomplete functionality

#### 15.2.3 Instruments
**Data Source:** Predefined list (27 instruments)
**Content:** Hebrew instrument names
**Examples:** פסנתר, כינור, ויולה, צ'לו, חליל, קלרינט, גיטרה, etc.
**Storage:** Firebase configuration document or hardcoded array

#### 15.2.4 Musical Genres
**Data Source:** Predefined list (11 genres)
**Content:** Hebrew genre names
**Examples:** קלאסי, ג'אז, קל, ישראלי, פופ, רוק, עממי, etc.
**Storage:** Firebase configuration document or hardcoded array

#### 15.2.5 Compositions Library
**Data Source:** Curated list + Open Opus API (optional)
**Fields:** Composer, Title, Duration, Genre, Approved Status
**Quantity:** Initial 100-200 compositions
**Format:** Firestore collection `compositions`
**Examples:** Bach's Preludes, Beethoven's Sonatas, Chopin's Nocturnes, etc.

#### 15.2.6 Form Type Templates
**Data Source:** System configuration
**Content:** JSON schemas for Recital Form and Conference Form
**Storage:** Firestore collection `form_types`
**Purpose:** Defines structure and fields for each form type

#### 15.2.7 Test User Accounts
**Purpose:** Development, demo, and testing
**Accounts:**
1. Site Admin (super user)
2. Conservatorium Admin (Hod HaSharon)
3. Teacher (assigned to conservatorium)
4. Student (enrolled with teacher)

**Credentials:** Defined in documentation (not in codebase for security)

### 15.3 Seeding Process

#### 15.3.1 Automated Seeding
**Execution:** Run once during initial system setup
**Method:** Firebase Cloud Function or admin script
**Steps:**
1. Check if collections already populated
2. If empty, insert seed data from JSON files
3. Log seeding progress and results
4. Verify all data inserted correctly

#### 15.3.2 Manual Seeding (Alternative)
**Method:** Firebase Console or Admin SDK script
**Process:**
1. Prepare seed data in JSON format
2. Import to Firestore using bulk upload
3. Verify data integrity
4. Create necessary indexes

#### 15.3.3 Incremental Updates
**Ongoing:** Add new conservatoriums, schools as needed
**Method:** Admin interface for bulk import
**Validation:** Check for duplicates before insertion

### 15.4 Data Validation

#### 15.4.1 Pre-Seeding Validation
- Check data format consistency
- Verify required fields present
- Remove duplicates
- Validate references (e.g., school symbols are 8 digits)

#### 15.4.2 Post-Seeding Verification
- Query each collection to confirm data present
- Verify correct number of documents inserted
- Test search functionality with seeded data
- Check for any missing or malformed entries

---

## 16. Mobile Responsiveness Specifications

### 16.1 Overview
The application must provide an excellent user experience across all device sizes, with particular attention to mobile devices (smartphones and tablets).

### 16.2 Responsive Breakpoints

#### 16.2.1 Device Categories
- **Mobile:** < 640px width
- **Tablet:** 640px - 1024px width
- **Desktop:** > 1024px width

#### 16.2.2 Testing Targets
- iPhone SE (375px × 667px)
- iPhone 12/13 (390px × 844px)
- iPad (768px × 1024px)
- Desktop (1920px × 1080px)

### 16.3 Mobile Layout Adaptations

#### 16.3.1 Navigation
**Desktop:**
- Horizontal navigation bar
- All menu items visible
- Logo on right (RTL)
- User profile on left

**Mobile:**
- Hamburger menu icon (☰) on right (RTL)
- Logo centered or right
- Menu slides in from right (RTL)
- Full-screen overlay menu
- Touch-friendly spacing (minimum 44×44px tap targets)

#### 16.3.2 Form Layouts
**Desktop:**
- Multi-column form layouts
- Side-by-side fields where logical
- Table for repertoire

**Mobile:**
- Single-column layout
- Fields stack vertically
- Full-width inputs
- Larger font size (16px minimum to prevent zoom)
- Repertoire table converts to cards:
  - Each composition = one card
  - Card has border, padding, shadow
  - Fields stack within card
  - Swipe to delete gesture (optional)

#### 16.3.3 Dashboard
**Desktop:**
- Grid layout (3-4 columns)
- Side-by-side statistics cards
- Wide tables

**Mobile:**
- Stacked layout
- Full-width cards
- Stats cards vertically stacked
- Tables become card-based list view
- Horizontal scroll for unavoidable tables

#### 16.3.4 Tables
**Desktop:**
- Standard table with multiple columns
- Scrollable if needed

**Mobile:**
- Convert to card layout
- Each row becomes a card
- Key information prominent
- Expandable for details
- Action buttons at bottom of card

### 16.4 Touch Interactions

#### 16.4.1 Tap Targets
- Minimum size: 44×44px (Apple HIG recommendation)
- Adequate spacing between tappable elements
- Visual feedback on tap (color change, ripple effect)

#### 16.4.2 Gestures
- Pull-to-refresh on lists (optional enhancement)
- Swipe to delete items (repeater rows)
- Swipe between tabs (optional)
- Pinch to zoom on images/PDFs (if applicable)

#### 16.4.3 Input Optimization
- Use appropriate input types:
  - `type="tel"` for phone numbers
  - `type="email"` for email addresses
  - `type="number"` for numeric inputs
  - `inputmode="numeric"` for duration fields
- Native date pickers
- Native dropdowns (or custom with touch optimization)

### 16.5 Performance Optimization

#### 16.5.1 Mobile-Specific Performance
- Lazy load images below the fold
- Reduce initial bundle size
- Optimize images for mobile screens
- Use responsive images (srcset)
- Minimize unnecessary animations
- Defer non-critical resources

#### 16.5.2 Offline Capability
- Cache static assets (service worker)
- Allow viewing forms offline (read-only)
- Queue form submissions if offline
- Sync when connection restored

### 16.6 Typography & Spacing

#### 16.6.1 Font Sizes
**Desktop:**
- Body: 16px
- Headings: 24-32px

**Mobile:**
- Body: 16px (never smaller to prevent zoom)
- Headings: 20-28px
- Small text: 14px minimum

#### 16.6.2 Spacing
- Increase padding on mobile for easier tapping
- Larger margins between sections
- More generous line-height (1.5-1.6)
- Ample whitespace around interactive elements

### 16.7 Orientation Handling

#### 16.7.1 Portrait (Default)
- Optimized for vertical scrolling
- Stacked layouts
- Most interactions assume portrait

#### 16.7.2 Landscape (Tablets)
- Utilize horizontal space
- Side-by-side layouts for tablets
- Modal dialogs centered and sized appropriately

---

## 17. Warning & Notice Component System

### 17.1 Overview
Warning and notice boxes provide important contextual information, alerts, and guidance to users throughout the application.

### 17.2 Notice Types

#### 17.2.1 Critical Warning (Red)
**Purpose:** Alert users to critical information requiring immediate attention

**Visual Design:**
- Background: #FEE2E2 (light red)
- Border: 2px solid #DC2626 (dark red)
- Icon: ⚠️ or ⛔
- Text Color: #991B1B (dark red)

**Use Cases:**
- Deadline approaching: "נותרו 3 ימים להגשת הטופס!"
- Missing required information: "חסרים שדות חובה"
- Action required: "יש לקבל אישור מורה לפני תאריך X"
- Policy violations: "הזמן הכולל עולה על המותר"

**Example Content:**
```
⚠️ הודעה חשובה
האוטובוס אינו תואם לזמן שנרשם. יש להודיע את הסוכן
עד תאריך 15/03/2024
```

#### 17.2.2 Information Notice (Yellow/Blue)
**Purpose:** Provide helpful tips, clarifications, and guidance

**Visual Design:**
- Background: #FEF3C7 (light yellow) or #DBEAFE (light blue)
- Border: 1px solid #F59E0B (orange) or #3B82F6 (blue)
- Icon: ℹ️ or 💡
- Text Color: #92400E (dark orange) or #1E40AF (dark blue)

**Use Cases:**
- Calculation formulas: "זמן ביצוע = 3 דקות פלוס שני דקות = 5 דקות"
- Helpful tips: "מומלץ לכלול יצירות מסגנונות שונים"
- Instructions: "יש למלא פרטי משתתף לפחות 3 שורות"
- Informational: "הטופס ישלח אוטומטית למורה לאישור"

**Example Content:**
```
💡 טיפ שימושי
זמן ביצוע של שישה לשחק כך:
3 דקות + 2 דקות = 5 דקות סה"כ
```

#### 17.2.3 Success Notice (Green)
**Purpose:** Confirm successful actions and provide positive feedback

**Visual Design:**
- Background: #D1FAE5 (light green)
- Border: 1px solid #10B981 (green)
- Icon: ✓ or 🎉
- Text Color: #065F46 (dark green)

**Use Cases:**
- Form saved: "הטופס נשמר בהצלחה"
- Form submitted: "הטופס נשלח לאישור המורה"
- Approval confirmed: "הטופס אושר!"
- Data updated: "השינויים נשמרו"

**Example Content:**
```
✓ הצלחה!
הטופס נשלח לאישור המורה והועבר למנהל
הקונסרבטוריון
```

### 17.3 Component Specifications

#### 17.3.1 Structure
**HTML Structure:**
- Container div with appropriate styling
- Optional icon element
- Title heading (bold, larger)
- Content paragraph(s)
- Optional action button(s)

**Layout:**
- Full-width within parent container
- Padding: 16px
- Margin: 16px 0 (spacing around notice)
- Border-radius: 8px

#### 17.3.2 Typography
- **Title:** 16px, Bold (font-weight: 600)
- **Content:** 14px, Regular
- **Line-height:** 1.5
- **Alignment:** Right (RTL)

#### 17.3.3 Responsive Behavior
**Desktop:**
- Max-width: 100% of container
- Icons on right side (RTL)

**Mobile:**
- Full-width
- Slightly larger padding for readability
- Icons above text (optional)

### 17.4 Conditional Display Logic

#### 17.4.1 Context-Aware Notices
Notices appear based on:
- Form status
- Field values
- User role
- Time/date conditions
- Validation results

**Examples:**
- Show deadline warning if submission date < 7 days away
- Show price warning if calculated price exceeds budget
- Show validation warning if required fields incomplete
- Show tip based on selected instrument

#### 17.4.2 Dismissible Notices
Some notices can be dismissed:
- Close button (×) in top-right corner
- User preference saved in localStorage
- "Don't show again" checkbox (for persistent tips)
- Reappears after X days or on specific triggers

### 17.5 Accessibility

#### 17.5.1 Screen Reader Support
- Use appropriate ARIA roles: `role="alert"` for critical warnings
- Provide text alternatives for icons
- Ensure sufficient color contrast
- Announce dynamic notices to screen readers

#### 17.5.2 Keyboard Navigation
- Close button keyboard accessible (Tab + Enter)
- Action buttons within notice keyboard accessible
- Focus management when notice appears

---

## 18. Security Rules (Firestore)

### 18.1 Overview
Firestore security rules enforce access control at the database level, ensuring users can only access data appropriate for their role and conservatorium affiliation.

### 18.2 Rule Principles

#### 18.2.1 Least Privilege
- Users have minimum necessary permissions
- Default deny: Block all access unless explicitly allowed
- Role-based access control (RBAC)

#### 18.2.2 Data Isolation
- Students see only their own data
- Teachers see only their students' data
- Conservatorium admins see only their conservatorium's data
- Site admins see everything

### 18.3 Rules by Collection

#### 18.3.1 Users Collection
**Read Rules:**
- Users can read their own document
- Teachers can read documents of their assigned students
- Conservatorium admins can read all users in their conservatorium
- Site admins can read all users

**Write Rules:**
- Users can update their own profile (limited fields)
- Cannot change role, conservatorium_id, or approval status
- Conservatorium admins can approve users in their conservatorium
- Site admins can modify any user

#### 18.3.2 Form Submissions Collection
**Read Rules:**
- Students can read forms where they are the student
- Teachers can read forms where they are the assigned teacher
- Conservatorium admins can read all forms in their conservatorium
- Site admins can read all forms

**Write Rules:**
- Students can create new forms (themselves as student)
- Students can edit their own forms in `draft` status
- Teachers can edit forms of their students (any status)
- Conservatorium admins can edit forms in their conservatorium
- Site admins can edit any form

**Delete Rules:**
- Students can delete their own forms in `draft` status
- Teachers can delete forms of their students in `draft` status
- Admins can delete forms in their conservatorium
- Site admins can delete any form

#### 18.3.3 Conservatoriums Collection
**Read Rules:**
- All authenticated users can read conservatorium data
- Necessary for dropdowns, display purposes

**Write Rules:**
- Site admins only
- Conservatorium admins cannot modify their own conservatorium data
- Prevents unauthorized changes to official records

#### 18.3.4 Schools Collection
**Read Rules:**
- All authenticated users can read school data
- Necessary for autocomplete functionality

**Write Rules:**
- Site admins only
- Read-only data for most users

#### 18.3.5 Compositions Collection
**Read Rules:**
- All authenticated users can read approved compositions
- Users can read their own submitted compositions (approved or pending)

**Write Rules:**
- Authenticated users can create new compositions (pending approval)
- Site admins can approve/reject compositions
- Site admins can edit composition details

#### 18.3.6 Notifications Collection
**Read Rules:**
- Users can read their own notifications only
- Cannot read notifications for other users

**Write Rules:**
- System writes via Cloud Functions (server-side)
- Users cannot create or modify notifications
- Users can mark their notifications as read

### 18.4 Helper Functions

#### 18.4.1 Role Checking
Functions to check user role:
- `isStudent()`
- `isTeacher()`
- `isConservatoriumAdmin()`
- `isSiteAdmin()`

#### 18.4.2 Ownership Checking
Functions to verify relationships:
- `isOwnForm()` - Check if user is form owner
- `isAssignedTeacher()` - Check if user is form's teacher
- `isInConservatorium()` - Check if form belongs to user's conservatorium

### 18.5 Security Auditing

#### 18.5.1 Logging
- Log all write operations
- Log permission denial events
- Track unusual access patterns

#### 18.5.2 Monitoring
- Regular review of security rules
- Monitor for unauthorized access attempts
- Alert on suspicious activity

---

## 19. User Approval Workflow

### 19.1 Overview
New users must be approved by a Conservatorium Admin before gaining access to the system, ensuring only legitimate users access conservatorium data.

### 19.2 Registration Flow

#### 19.2.1 User Registration
**Step 1: User Completes Registration Form**
- Selects role (Student or Teacher)
- Selects conservatorium from dropdown
- Fills personal information
- If Student: Selects school, instrument
- Submits registration

**Step 2: Account Created with Pending Status**
- User document created in Firestore
- Field: `approved: false`
- Field: `approved_by: null`
- Field: `approved_at: null`
- User receives confirmation: "הבקשה נשלחה. החשבון שלך ממתין לאישור מנהל הקונסרבטוריון"

**Step 3: Notification Sent to Admin**
- Conservatorium admin receives notification
- Type: `user_pending_approval`
- Title: "משתמש חדש ממתין לאישור"
- Message: "[User Name] נרשם כ[Role] וממתין לאישורך"
- Link: `/admin/users/pending`
- Channels: In-app + Email

#### 19.2.2 Admin Review Process
**Admin Opens Pending Users Page**
- Located at: `/admin/users/pending`
- Shows table/list of all pending users in their conservatorium

**Table Columns:**
- User full name
- Email address
- Requested role (Student / Teacher)
- School (if student)
- Instrument (if student)
- Registration date
- Actions: Approve / Reject buttons

**Admin Actions:**
1. Review user details
2. Verify legitimacy (check email, school, etc.)
3. Click "אשר" (Approve) or "דחה" (Reject)

#### 19.2.3 Approval Flow
**When Admin Clicks "אשר":**
1. User document updated:
   - `approved: true`
   - `approved_by: [admin_id]`
   - `approved_at: [timestamp]`
2. Notification sent to user:
   - Type: `user_approved`
   - Title: "חשבונך אושר!"
   - Message: "החשבון שלך אושר. ניתן להתחבר למערכת"
   - Channels: Email (always) + In-app (if user has logged in)
3. User can now log in
4. Welcome email sent with login instructions

#### 19.2.4 Rejection Flow
**When Admin Clicks "דחה":**
1. Modal appears: "סיבה לדחייה" (Reason for rejection) - optional text field
2. Admin enters reason or leaves blank
3. User document updated:
   - `approved: false`
   - `rejection_reason: [text or null]`
   - `rejected_by: [admin_id]`
   - `rejected_at: [timestamp]`
4. Notification sent to user:
   - Type: `user_rejected`
   - Title: "הבקשה נדחתה"
   - Message: "הבקשה שלך להצטרף נדחתה. [Reason if provided]"
   - Channels: Email only (user cannot access in-app)
5. User account remains in system but cannot log in
6. Optional: Delete account entirely after X days

### 19.3 Admin Interface Requirements

#### 19.3.1 Pending Users List
**Features:**
- Real-time updates (Firestore listener)
- Badge count showing number of pending users
- Filter by role (Student / Teacher)
- Sort by registration date (newest first)
- Search by name or email
- Bulk actions: Approve all, Select multiple

#### 19.3.2 Approved Users List
**Features:**
- View all approved users in conservatorium
- Filter by role
- Search functionality
- View user details
- Optionally: Revoke approval (deactivate user)

#### 19.3.3 Rejected Users List
**Features:**
- Archive of rejected users
- Ability to reverse rejection (re-approve)
- View rejection reason
- Delete rejected users permanently

### 19.4 User Login Restrictions

#### 19.4.1 Login Check
When user attempts login:
1. Authenticate via Firebase Auth
2. Query user document from Firestore
3. Check `approved` field
4. If `approved: true` → Allow login, redirect to dashboard
5. If `approved: false` → Block login, show message

**Blocked Login Message:**
"החשבון שלך ממתין לאישור מנהל הקונסרבטוריון. תקבל/י הודעה כאשר החשבון יאושר."

---

## 20. Payment & Pricing System (Conference Forms)

### 20.1 Overview
Conference and event forms require pricing calculation based on multiple factors including conservatorium tier, ensemble size, and performance duration.

### 20.2 Pricing Structure

#### 20.2.1 Conservatorium Tiers
Conservatoriums classified into tiers based on size/budget:
- **Tier A (שלב א'):** Large conservatoriums
- **Tier B (שלב ב'):** Medium conservatoriums
- **Tier C (שלב ג'):** Small conservatoriums

**Tier Assignment:**
- Stored in conservatorium document: `tier` field
- Assigned by Site Admin during conservatorium setup
- Affects pricing calculations

#### 20.2.2 Ensemble Size Categories
**Size Categories:**
- **Small (קטנות):** 1-10 participants
- **Medium (בינוניות):** 11-20 participants
- **Large (גדולות):** 21+ participants

**Solo vs Ensemble:**
- Solo performances: Priced as "Small"
- Ensembles: Priced by actual size category

#### 20.2.3 Duration Options
**Standard Durations:**
- 10 minutes
- 15 minutes
- 20 minutes
- 25 minutes
- 30 minutes

**Custom Duration:**
- Allowed if within range (5-45 minutes)
- Rounds to nearest pricing bracket

### 20.3 Price Matrix

#### 20.3.1 Base Pricing Structure
Example pricing (values in ILS - Israeli Shekels):

| Tier | Size  | 10min | 15min | 20min | 25min | 30min |
|------|-------|-------|-------|-------|-------|-------|
| A    | Small | 10    | 15    | 20    | 25    | 30    |
| A    | Med   | 15    | 20    | 25    | 30    | 35    |
| A    | Large | 20    | 25    | 30    | 35    | 40    |
| B    | Small | 12    | 16    | 22    | 27    | 32    |
| B    | Med   | 16    | 22    | 27    | 32    | 37    |
| B    | Large | 22    | 27    | 32    | 37    | 42    |
| C    | Small | 13    | 18    | 23    | 28    | 33    |
| C    | Med   | 18    | 23    | 28    | 33    | 38    |
| C    | Large | 23    | 28    | 33    | 38    | 43    |

**Note:** Actual prices configured in Firestore, not hardcoded

#### 20.3.2 Price Lookup
**Calculation Logic:**
1. Retrieve conservatorium tier from conservatorium document
2. Determine ensemble size category from participant count
3. Round duration to nearest pricing bracket
4. Lookup price from pricing_rules collection:
   - `where('conservatorium_tier', '==', tier)`
   - `where('ensemble_size', '==', size)`
   - `where('duration_minutes', '==', duration)`
5. Return calculated price

### 20.4 Price Display

#### 20.4.1 During Form Creation
**Price Calculator Section:**
- Appears after user fills ensemble details
- Shows breakdown:
  - "קונסרבטוריון: [Tier]"
  - "גודל הרכב: [Size]"
  - "משך זמן: [X] דקות"
- Displays total: "סה״כ לתשלום: X ₪"
- Updates automatically when details change

#### 20.4.2 Price Summary
**In Form View:**
- Shows calculated price
- Included in PDF export
- Displayed in form list (optional column)

#### 20.4.3 Admin Override
**Feature:**
- Conservatorium admin can manually override price
- Useful for discounts, scholarships, special cases
- Override price stored: `calculated_price_override`
- Reason field: "סיבה לשינוי מחיר"
- Original calculated price preserved for audit

### 20.5 Payment Status Tracking

#### 20.5.1 Payment States
Forms have payment_status field:
- `pending`: Default state after approval
- `paid`: Payment confirmed
- `waived`: Payment waived (scholarship, etc.)
- `cancelled`: Event cancelled, refund if applicable

#### 20.5.2 Status Management
**Admin Controls:**
- Mark as paid: Button in form view
- Add payment date
- Add payment method (cash, bank transfer, etc.)
- Add transaction reference number

**Display:**
- Payment badge next to price
- Colors: Orange (pending), Green (paid), Gray (waived)

### 20.6 Financial Reporting

#### 20.6.1 Revenue Report
**Admin Dashboard:**
- Total expected revenue (all pending)
- Total collected (paid)
- Outstanding payments
- Filter by date range, conservatorium

#### 20.6.2 Export Options
- Export to CSV/Excel
- Columns: Event, Student, Conservatorium, Price, Status, Date Paid
- For accounting and financial tracking

### 20.7 Configuration Management

#### 20.7.1 Price Administration
**Site Admin Tools:**
- Manage pricing matrix
- Update prices per tier/size/duration
- Effective date for price changes
- Historical price tracking

#### 20.7.2 Conservatorium Tier Management
**Site Admin Can:**
- Assign tier to conservatorium
- Change tier (affects future pricing)
- View pricing impact before confirmation

---

## Appendix A: Glossary & Terminology

### Hebrew-English Term Mapping

| Hebrew | English | Context |
|--------|---------|---------|
| הרמוניה | Harmonia | System name |
| קונסרבטוריון | Conservatorium | Music school |
| רסיטל | Recital | Solo performance |
| כנס | Conference | Group event |
| טיוטה | Draft | Form status |
| ממתין לאישור מורה | Pending teacher approval | Form status |
| ממתין לאישור מנהל | Pending admin approval | Form status |
| מאושר | Approved | Form status |
| נדחה | Rejected | Form status |
| רפרטואר | Repertoire | List of compositions |
| מלחין | Composer | Music creator |
| יצירה | Composition | Musical work |
| זמן ביצוע | Duration | Performance length |
| כלי נגינה | Instrument | Musical instrument |
| הרכב | Ensemble | Musical group |
| מנצח | Conductor | Ensemble leader |
| מלווה | Accompanist | Supporting musician |

---

## Appendix B: References

### External Documentation
- Firebase Documentation: https://firebase.google.com/docs
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Material Design (RTL Guidelines): https://material.io/design/usability/bidirectionality.html
- jsPDF Documentation: https://github.com/parallax/jsPDF

### Internal Documents
- PROMPT_CONTEXT.md - Seed data specifications
- SINGLE_FUNCTIONAL_PROMPT.md - High-level system description
- SDD_ENHANCEMENT_ANALYSIS.md - Gap analysis

---

**Document Version:** 2.0
**Last Updated:** February 17, 2026
**Status:** Active