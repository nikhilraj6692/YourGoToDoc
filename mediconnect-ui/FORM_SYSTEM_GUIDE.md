# Form System Guide

## Overview
All form styles have been consolidated into `Common.css` to ensure consistency across the MediConnect application. This guide explains how to use the form system and how to customize it when needed.

## Base Form Classes (from Common.css)

### Form Group
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
```

### Form Input
```css
.form-input {
  padding: 0.8rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.2rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  color: #2d3748;
  width: 100%;
  box-sizing: border-box;
}
```

### Form Select
```css
.form-select {
  /* Same base styles as form-input */
  cursor: pointer;
  appearance: none;
  background-image: url("dropdown-arrow.svg");
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
}
```

### Dropdown Select (Alternative)
```css
.dropdown-select {
  /* Alternative select styling */
}
```

## Usage Examples

### Basic Form Input
```html
<div class="form-group">
  <label for="name">Full Name</label>
  <input type="text" id="name" class="form-input" placeholder="Enter your name">
</div>
```

### Form Select
```html
<div class="form-group">
  <label for="specialty">Specialty</label>
  <select id="specialty" class="form-select">
    <option value="">Select specialty</option>
    <option value="cardiology">Cardiology</option>
    <option value="dermatology">Dermatology</option>
  </select>
</div>
```

### Form Row (Side by Side)
```html
<div class="form-row">
  <div class="form-group">
    <label for="firstName">First Name</label>
    <input type="text" id="firstName" class="form-input">
  </div>
  <div class="form-group">
    <label for="lastName">Last Name</label>
    <input type="text" id="lastName" class="form-input">
  </div>
</div>
```

### Search Form Row
```html
<div class="search-form-row">
  <div class="form-group">
    <label for="location">Location</label>
    <input type="text" id="location" class="form-input">
  </div>
  <div class="form-group">
    <label for="specialty">Specialty</label>
    <select id="specialty" class="form-select">
      <option value="">All Specialties</option>
    </select>
  </div>
  <button class="plain-btn">Search</button>
</div>
```

### Input with Icon
```html
<div class="form-group">
  <label for="email">Email</label>
  <div class="form-input">
    <input type="email" id="email" class="form-input" placeholder="Enter your email">
  </div>
</div>
```

### Textarea
```html
<div class="form-group">
  <label for="message">Message</label>
  <textarea id="message" class="form-input textarea" placeholder="Enter your message"></textarea>
</div>
```

### Required Field
```html
<div class="form-group required">
  <label for="email">Email Address</label>
  <input type="email" id="email" class="form-input" required>
</div>
```

## Customization

### Page-Specific Customizations
If you need to customize form styles for a specific page, add your customizations in the page's CSS file:

```css
/* Example: Custom form styles for FindDoctor page */
.find-doctor-container .form-group {
  max-width: 400px; /* Override max-width */
}

.find-doctor-container .form-input,
.find-doctor-container .form-select {
  font-size: 0.9rem; /* Smaller font size */
  max-width: 180px; /* Constrain width */
}

.find-doctor-container .form-select {
  background-image: url("custom-arrow.svg"); /* Custom dropdown arrow */
  border-color: #4299e1; /* Custom focus color */
}
```

### Component-Specific Customizations
For component-specific forms:

```css
/* Example: Custom form styles for AddressMapSelector component */
.address-form .form-group {
  margin-bottom: 0.5rem; /* Tighter spacing */
}

.address-form .form-input {
  border-color: #3182ce; /* Custom border color */
}
```

## Responsive Behavior

The form system includes built-in responsive design:

- **Desktop**: Forms display in rows with proper spacing
- **Tablet (768px)**: Form rows stack vertically
- **Mobile (480px)**: Smaller padding and font sizes

## Validation States

The form system includes validation states:

```css
/* Invalid state */
.form-input:invalid:not(:placeholder-shown) {
  border-color: #e53e3e;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
}

/* Valid state */
.form-input:valid:not(:placeholder-shown) {
  border-color: #38a169;
  box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
}
```

## Migration Guide

### Before (Old way)
```css
/* Each page had its own form styles */
.my-page .form-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.2rem;
  /* ... many more properties */
}
```

### After (New way)
```css
/* Use base styles from Common.css */
/* Only add customizations when needed */
.my-page .form-input {
  font-size: 0.9rem; /* Only override what's different */
  max-width: 200px;
}
```

## Benefits

1. **Consistency**: All forms look and behave the same across the app
2. **Maintainability**: Changes to form styles only need to be made in one place
3. **Performance**: Reduced CSS file sizes
4. **Developer Experience**: Easier to create new forms with consistent styling
5. **Accessibility**: Built-in focus states and validation indicators

## Best Practices

1. **Always use the base classes** from Common.css
2. **Only override what's necessary** for your specific use case
3. **Use semantic HTML** with proper labels and IDs
4. **Test on different screen sizes** to ensure responsive behavior
5. **Use the validation states** for better user experience 