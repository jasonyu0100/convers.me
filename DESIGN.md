# Convers.me Design System

This document outlines the design system used in Convers.me, defining consistent patterns and best practices for UI development.

## Table of Contents

- [Typography](#typography)
- [Colors](#colors)
- [Buttons](#buttons)
- [Form Elements](#form-elements)
- [Cards and Containers](#cards-and-containers)
- [Backgrounds](#backgrounds)
- [Avatars](#avatars)
- [Loading States](#loading-states)
- [Animations](#animations)
- [Common Tailwind Patterns](#common-tailwind-patterns)

## Typography

We use the Creato Display font family throughout the application with various weights:

```
.creato-thin {
  font-family: var(--font-creato-thin);
  font-weight: 100;
}

.creato-light {
  font-family: var(--font-creato-light);
  font-weight: 300;
}

.creato-regular {
  font-family: var(--font-creato-regular);
  font-weight: 400;
}

.creato-medium {
  font-family: var(--font-creato-medium);
  font-weight: 500;
}

.creato-bold {
  font-family: var(--font-creato-bold);
  font-weight: 700;
}

.creato-extraBold {
  font-family: var(--font-creato-extraBold);
  font-weight: 800;
}

.creato-black {
  font-family: var(--font-creato-black);
  font-weight: 900;
}
```

## Colors

Our primary color palette is defined in the Tailwind configuration. We use gradient backgrounds extensively for interactive elements.

### Common Color Combinations

- **Primary actions**: `bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white`
- **Secondary actions**: `bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white`
- **Outline elements**: `border border-slate-200 hover:border-slate-400 bg-transparent hover:bg-slate-50 text-slate-700`

## Buttons

Buttons follow a consistent pattern with variants, sizes, and states:

```tsx
<button className={`${BUTTON_BASE_CLASSES} ${BUTTON_SIZE_CLASSES[size]} ${BUTTON_VARIANT_CLASSES[variant]} ${widthClass} ${stateClasses} ${className}`}>
  {children}
</button>
```

### Button Base Classes

```
inline-flex items-center justify-center font-bold rounded-full transition-all duration-200
```

### Button Sizes

- **Small (sm)**: `px-3 py-1.5 text-sm`
- **Medium (md)**: `px-4 py-2.5 text-base`
- **Large (lg)**: `px-6 py-3 text-lg`

### Button Variants

- **Primary**: `bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm`
- **Secondary**: `bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-sm`
- **Outline**: `border border-slate-200 hover:border-slate-400 bg-transparent hover:bg-slate-50 text-slate-700`
- **Text**: `bg-transparent hover:bg-slate-50 text-slate-700`

## Form Elements

Form elements follow a consistent style pattern:

### Text Fields

Inputs are styled with consistent borders, focus states, and hover effects:

```
border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200
```

### Select Fields

Select dropdowns match the styling of text inputs for consistency.

## Cards and Containers

Card-like containers use consistent styling:

```
bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200
```

## Backgrounds

The app uses sophisticated gradient backgrounds with floating shapes and texture overlays:

```tsx
<div className="relative h-full w-full overflow-hidden">
  {/* Gradient background */}
  <div
    className={backgroundVariants({ intensity, color, className })}
    style={{
      background: gradientColors[color][intensity],
      backgroundSize: "300% 300%",
      animation: animated ? "gradientShift 25s ease infinite" : "none",
      zIndex: 0,
    }}
  ></div>

  {/* Floating shapes */}
  {/* ... */}

  {/* Texture overlay */}
  {/* ... */}
</div>
```

## Avatars

Avatars use consistent sizing and fallback patterns:

```
overflow-hidden rounded-full border border-slate-200
```

### Avatar Sizes

- **Small (sm)**: `h-8 w-8`
- **Medium (md)**: `h-10 w-10`
- **Large (lg)**: `h-12 w-12`
- **XL**: `h-16 w-16`

### Avatar Fallbacks

When no image is available, we use a colorful background with initials, dynamically assigned based on the user name.

## Loading States

Loading states use a consistent spinner pattern:

```tsx
<div className="relative">
  {/* Subtle glow effect */}
  <div
    className={`absolute inset-0 ${LOADING_COLOR_CLASSES[color]} rounded-full opacity-20 blur-md`}
    style={{ transform: "scale(1.35)" }}
    aria-hidden="true"
  ></div>

  {/* Main spinner */}
  <div className={`${LOADING_SIZE_CLASSES[size]} ${LOADING_COLOR_CLASSES[color]} relative z-10 animate-spin`}>
    <svg>...</svg>
  </div>
</div>
```

## Animations

We use consistent animations defined in Tailwind configuration:

```js
animation: {
  loadingBar: 'loadingBar 2s infinite linear',
  fadeIn: 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  slideIn: 'slideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  scaleIn: 'scaleIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  slideUp: 'slideUp 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
}
```

### Keyframes

```js
keyframes: {
  loadingBar: {
    '0%': { width: '0%' },
    '100%': { width: '100%' },
  },
  fadeIn: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  slideIn: {
    '0%': { transform: 'translateY(20px)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },
  scaleIn: {
    '0%': { transform: 'scale(0.95)', opacity: 0 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },
  slideUp: {
    '0%': { transform: 'translateY(10px) scale(0.98)', opacity: 0 },
    '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
  },
}
```

## Common Tailwind Patterns

### Flexbox Layouts

- **Centered column**: `flex flex-col items-center justify-center`
- **Spaced row**: `flex flex-row items-center justify-between`
- **Wrapped grid**: `flex flex-wrap gap-4`

### Spacing

- **Card padding**: `p-4 sm:p-6`
- **Section spacing**: `my-6 sm:my-8`
- **Grid gaps**: `gap-4 md:gap-6`

### Responsive Patterns

- **Responsive containers**: `w-full max-w-md mx-auto`
- **Responsive text**: `text-sm sm:text-base lg:text-lg`
- **Responsive grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### Interactive States

- **Hover effects**: `hover:bg-slate-50 transition-all duration-200`
- **Focus states**: `focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`
- **Active states**: `active:scale-95 transition-transform`

### Shadows

- **Subtle shadow**: `shadow-sm`
- **Card shadow**: `shadow`
- **Elevated shadow**: `shadow-md`
- **Focused shadow**: `shadow-lg`
- **Glow effect**: `shadow-glow` (custom: `-15px 15px 50px 0px rgba(255, 255, 255, 0.15)`)
