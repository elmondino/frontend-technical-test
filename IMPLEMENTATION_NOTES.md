# Implementation Notes - Jaguar Frontend Technical Test

This document covers every decision made during implementation: what was built, why, and how it works.

---

## Project Overview

The test asked for a React or JavaScript application that:
1. Fetches a vehicle list from a local JSON API, then fetches per-vehicle details
2. Renders a responsive grid matching three design mockups (mobile, tablet, desktop)
3. Meets WCAG 2.1 accessibility
4. Uses BEM SCSS with a mobile-first approach
5. Optionally: Redux, accessible modal, Read more toggle, staggered animation

All of the optional "Nice to have" items were implemented.

---

## 1. API Layer

### `src/api/helpers.js` - The fetch wrapper

```js
export async function request(apiUrl) {
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
}
```

A thin wrapper around the native `fetch` API (no Axios or similar, as the README prefers native browser APIs). It throws a meaningful error on non-2xx responses so callers can distinguish network errors from HTTP errors. `response.json()` is returned directly as a Promise.

### `src/api/index.js` - getData()

```js
export default async function getData() {
  const vehicles = await request('/api/vehicles.json');
  const validVehicles = vehicles.filter((v) => v.apiUrl);

  const results = await Promise.allSettled(
    validVehicles.map((v) => request(v.apiUrl))
  );

  return results
    .map((result, i) => ({ result, base: validVehicles[i] }))
    .filter(({ result }) => result.status === 'fulfilled')
    .map(({ result, base }) => ({ ...base, ...result.value }))
    .filter(({ price }) => price && price.trim() !== '');
}
```

**Key decisions:**

- **`Promise.allSettled` instead of `Promise.all`**: The `vehicles.json` feed includes a `"problematic"` vehicle whose detail endpoint does not exist. `Promise.all` would reject the entire batch on the first failure. `allSettled` lets every request finish regardless, then we filter out the `'rejected'` ones. This means one broken vehicle never prevents the rest from loading.

- **Two-stage filter**: First filter removes entries with no `apiUrl` before making any requests (saves a round-trip). Second filter after merging removes vehicles without a valid `price` string (empty string counts as missing).

- **Data merge strategy**: `{ ...base, ...result.value }` - the base object from `vehicles.json` carries `media` (image URLs), while the detail endpoint carries `description`, `price`, `meta`. Spreading detail over base means if a field appears in both, the detail value wins (e.g. `id` is in both and they match).

---

## 2. Redux Store

### Why Redux?

The README listed Redux as a "Nice to have". More practically, it prevents the API being called multiple times if `VehicleList` remounts, and it cleanly separates data-fetching concerns from rendering. It also demonstrates familiarity with the toolkit.

### `src/store/vehiclesSlice.js`

```js
export const fetchVehicles = createAsyncThunk('vehicles/fetch', () => getData());
```

`createAsyncThunk` handles the three async lifecycle states automatically: `pending`, `fulfilled`, `rejected`. This gives loading and error state for free without writing manual action creators.

The reducers use the immutable spread pattern (`{ ...state, loading: true }`) rather than Immer's mutation syntax. This was intentional to satisfy the ESLint `no-param-reassign` rule which is active in the airbnb config.

### `src/store/index.js`

Standard `configureStore` setup. Only one slice (`vehicles`) since this is a single-page feature.

### `src/components/VehicleList/useData.js`

```js
export default function useData() {
  const dispatch = useDispatch();
  const { loading, error, data: vehicles } = useSelector((state) => state.vehicles);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  return [loading, error, vehicles];
}
```

The hook deliberately preserves the original `[loading, error, vehicles]` tuple return signature from the pre-existing stub. This means `VehicleList` was not modified to accommodate Redux - the hook is the only layer that knows about Redux.

**`dispatch` in the `useEffect` dependency array**: `dispatch` from `useDispatch` is stable (never changes), so the effect only runs once on mount. Including it satisfies the exhaustive-deps lint rule without causing re-runs.

---

## 3. Component Architecture

### `src/components/VehicleList/index.js`

Three distinct render paths:

1. **Loading** - returns a skeleton UI (`aria-busy="true"`, skeleton shimmer cards)
2. **Error** - returns a centered error message
3. **Results** - returns the `<main>` with `<h1>Our Vehicles</h1>` and the vehicle grid

The grid renders `VehicleCard` with explicit props (not spread) to satisfy the airbnb ESLint rule `react/jsx-props-no-spreading`. `Array.isArray(vehicles)` guard prevents a crash if the Redux state initialises with `[]` or `null`.

### `src/components/VehicleCard/index.js`

**`React.memo`**: Wraps the component to prevent re-renders when parent re-renders but props haven't changed. The vehicle list is static once loaded, so without `memo` every card would re-render if any unrelated state changed.

**`--index` CSS custom property**:

```jsx
<article className="vehicle-card" style={{ '--index': index }}>
```

The staggered animation delay is driven entirely by CSS using this property:

```scss
animation-delay: calc(var(--index, 0) * 0.1s);
```

No JS timers or `setTimeout` needed. Each card delays by 100ms times its position in the list.

**`<picture>` element for responsive images**:

```jsx
<picture>
  <source media="(min-width: 768px)" srcSet={image16x9} />
  <img src={image1x1} alt={name} />
</picture>
```

The browser picks the 16:9 image on tablet and above, and the 1:1 square crop on mobile. This is the semantically correct approach the README explicitly asked for ("Correct semantic HTML mark-up and/or CSS should be used to achieve the size and aspect ratio of the images").

**Read more toggle**:

```jsx
<button
  aria-expanded={expanded}
  aria-controls={`vehicle-extra-${id}`}
>
  {expanded ? 'Read less' : 'Read more'}
</button>

{expanded && (
  <div id={`vehicle-extra-${id}`}>
    ...extra content...
  </div>
)}
```

`aria-expanded` is the WCAG-correct attribute to communicate toggle state to screen readers. `aria-controls` points to the ID of the controlled region, completing the relationship.

**Modal focus return**:

```js
const handleCloseModal = () => {
  setModalOpen(false);
  detailsBtnRef.current?.focus();
};
```

When the modal closes, focus returns to the "View details" button that opened it. This is a WCAG 2.1 requirement (Success Criterion 2.4.3: Focus Order).

**`VehicleCard.displayName`**: Required for React DevTools to display the component name correctly when the component is wrapped in `React.memo`. Without it the DevTools just shows `"memo"`.

### `src/components/VehicleModal/index.js`

Implements the WAI-ARIA 1.1 dialog modal pattern (https://www.w3.org/TR/wai-aria-practices-1.1/#dialog_modal).

**The critical accessibility structure**:

```jsx
return (
  <>
    <div className="vehicle-modal__backdrop" aria-hidden="true" onClick={onClose} />
    <div role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title" ref={dialogRef}>
      ...
    </div>
  </>
);
```

The backdrop and dialog are **siblings** inside a Fragment. This is important: if the backdrop were a parent wrapper with `aria-hidden="true"`, the dialog inside it would also be hidden from the accessibility tree - screen readers could not reach it at all. Making them siblings means `aria-hidden` only applies to the purely visual overlay.

**Focus trap**:

```js
if (e.key === 'Tab') {
  const focusable = dialog.querySelectorAll('button, [href], input, ...');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
```

Tab cycles forward through focusable elements; Shift+Tab cycles backward. Focus never leaves the modal while it is open, as required by WCAG 2.1 SC 2.1.2 (No Keyboard Trap - the modal is an intentional exception to that rule, which is why `aria-modal="true"` is set).

**`aria-labelledby`** links the dialog to its heading (`id="vehicle-modal-title"`). Screen readers announce this heading when the dialog receives focus, giving context immediately.

**Escape key closes the modal**: Standard expected keyboard behaviour per WAI-ARIA practices.

---

## 4. Utility - `src/utils/formatVehicleName.js`

Converts raw vehicle IDs from the API into human-readable display names:

| Input | Output |
|-------|--------|
| `xe`  | `XE`   |
| `xj`  | `XJ`   |
| `fpace` | `F-PACE` |
| `ftype` | `F-TYPE` |
| `ipace` | `I-PACE` |

The logic:
- IDs of 1-2 characters (like `xe`, `xj`) are simply uppercased
- Longer IDs (like `fpace`) are split at position 1: first character uppercased, remainder uppercased, joined with a hyphen

This matches the naming convention Jaguar uses for their vehicle range.

---

## 5. Styling

### BEM structure

Every component has its own `style.scss` file. Class names follow BEM strictly:

- Block: `.vehicle-card`
- Elements: `.vehicle-card__image`, `.vehicle-card__name`, `.vehicle-card__price`
- Modifiers: `.vehicle-list__grid--skeleton`

This is colocated with the component (same directory), keeping styles easy to find and reason about.

### Mobile-first approach

Base styles are for mobile (no media query). Tablet and desktop styles are added in ascending `min-width` breakpoints:

- `min-width: 768px` - 2-column grid, vertical card layout, 16:9 images
- `min-width: 1200px` - 4-column grid

### Responsive image aspect ratios

```scss
// Mobile: 1:1 square (the image fill approach)
&__media {
  aspect-ratio: 1 / 1;
  width: 120px;
}

// Tablet+: 16:9
@media (min-width: 768px) {
  &__media {
    aspect-ratio: 16 / 9;
    width: 100%;
  }
}
```

CSS `aspect-ratio` is used rather than the old padding-top percentage hack. This is the modern, semantically correct approach.

### Staggered animation

```scss
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.vehicle-card {
  animation: fade-in-up .4s ease forwards;
  animation-delay: calc(var(--index, 0) * .1s);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .vehicle-card {
    animation: none;
    opacity: 1;
  }
}
```

Cards start invisible (`opacity: 0`) and animate in upward. The delay is driven by `--index` (a CSS custom property set inline by React). The `prefers-reduced-motion` media query respects the user's OS accessibility preference and disables the animation entirely.

---

## 6. Testing

### Philosophy

- Every piece of logic has dedicated unit tests
- Components are tested in isolation with mocked dependencies
- Tests use `@testing-library/react` v11 patterns (`queryByTestId`, `.not.toBeNull()` - no `toBeInTheDocument` as that requires jest-dom)
- No `{...spread}` in JSX test helpers (ESLint `react/jsx-props-no-spreading` is enforced even in test files)

### Test suite breakdown (48 tests, 7 suites)

| File | Tests | What is covered |
|------|-------|-----------------|
| `api/__tests__/api.test.js` | 5 | `getData()`: initial fetch, traversal, ignores failures, ignores no price |
| `api/__tests__/helpers.test.js` | 4 | `request()`: URL passed to fetch, JSON parsing, HTTP error throws, network error propagates |
| `utils/__tests__/formatVehicleName.test.js` | 5 | Empty/null input, 1-char, 2-char, and long IDs (fpace, ftype) |
| `store/__tests__/vehiclesSlice.test.js` | 6 | Reducer: initial state, pending, fulfilled, rejected with message, rejected fallback |
| `components/VehicleCard/__tests__/VehicleCard.test.js` | 11 | Renders name/price/description, image srcSet, read more toggle, modal open/close, focus return |
| `components/VehicleModal/__tests__/VehicleModal.test.js` | 12 | Renders vehicle details, close button, Escape key, focus trap, backdrop click |
| `components/VehicleList/__tests__/VehicleList.test.js` | 5 | Loading/error/results states, empty array, per-vehicle card rendering |

### Key testing patterns

**Mocking `helpers.js` in API tests**: `jest.mock('../helpers')` replaces the real `request` function with a Jest mock, letting tests control what the API "returns" without actual network calls.

**Mocking `global.fetch` in helpers tests**: The helpers test mocks `global.fetch` directly since `request()` calls the native browser API.

**Mocking child components**: `VehicleCard` tests mock `VehicleModal` to avoid rendering the modal in card tests. `VehicleList` tests mock `VehicleCard` to verify that the correct number of cards is rendered without needing to render the full card tree.

**Redux slice testing without a store**: The slice reducer is a plain function. Tests call it directly with action objects: `reducer(state, fetchVehicles.pending('id', undefined))`. No Provider or store needed.

**RTK rejected action edge case**: When `createAsyncThunk` rejects with `null`, Redux Toolkit serializes it to the string `"null"` (truthy). Tests for the fallback error message therefore use `new Error()` (empty message, falsy) rather than `null`.

---

## 7. Build Configuration

### webpack 4 + Node 20 compatibility

webpack 4 uses an OpenSSL hash algorithm deprecated in Node 17+. Fix:

```json
"start": "NODE_OPTIONS=--openssl-legacy-provider webpack serve --mode development"
```

### postcss exports patching

`postcss@8.2.4` uses a strict `exports` field in `package.json` that blocks access to subpaths like `./lib/input`. Both `css-loader` (needs `./package.json`) and `stylelint` via `postcss-syntax` (needs `./lib/input` etc.) fail without these paths being exported.

The `postinstall` script in `package.json` patches the postcss `package.json` at install time to add the missing export entries. This runs automatically during `npm install`, so `npm install && npm start` works as specified in the README without any manual steps.

### Babel optional chaining plugin

webpack 4 uses `acorn@6` to parse source files. acorn@6 does not understand the optional chaining operator (`?.`), which is ES2020. When targeting modern Chrome, `@babel/preset-env` does not transform `?.` (Chrome supports it natively), leaving the raw syntax for webpack's acorn parser which then fails.

Fix: explicitly add `@babel/plugin-proposal-optional-chaining` to `.babelrc` to force transformation regardless of the browser target:

```json
{
  "plugins": ["@babel/plugin-proposal-optional-chaining"]
}
```

---

## 8. Dependency Notes

- **`react-redux@8.1.3`** (not v9): react-redux v9 requires React 18+. This project uses React 17. v8 is the correct version for React 17 + Redux Toolkit.
- **`@reduxjs/toolkit@2.12.0`**: Works with both React 17 and 18.
- **No test for `useData` hook directly**: `useData` is a thin adapter between the component and Redux. It is tested indirectly - `VehicleList` tests mock the whole hook, and the slice tests cover the Redux layer. A direct hook test would require either a custom Provider wrapper or `@testing-library/react-hooks` (not installed).
