# Stackline Full Stack Assessment — Bug Fixes & UX Improvements

## How to Run

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Issues Identified & Fixed

### Issue 1 : Product Data Passed via URL Query String

**Problem:** The entire product object was `JSON.stringify`-ed into the URL query parameter (`?product=%7B%22stacklineSku%22...%7D`). This creates extremely long URLs that cannot be shared, bookmarked, or indexed by search engines. URLs can exceed browser length limits.

**User Scenario:** A user copies the product page URL to share with a friend. The URL is 2000+ characters of encoded JSON. If a messaging app truncates it, the link breaks entirely and shows "Product not found."

**Fix:** Replaced the query-string approach with a proper dynamic route `/product/[sku]`. The product detail page now fetches data from the existing `/api/products/[sku]` endpoint using the SKU from the URL. Links on the list page are now clean: `/product/E8ZVY2BP3`.


---

### Issue 2 : Subcategories Not Filtered by Selected Category

**Problem:** When fetching subcategories, the API call was `fetch('/api/subcategories')` without passing the selected category. The API accepts a `category` query param but it was never sent. This meant all subcategories from every category appeared regardless of which category was selected.

**User Scenario:** User selects category "Tablets" and then opens the subcategory dropdown, expecting to see only tablet-related subcategories. Instead, they see irrelevant options like "Running Shoes" and "Headphones" mixed in.

**Fix:** Changed the fetch call to include the category parameter: `fetch('/api/subcategories?category=${encodeURIComponent(selectedCategory)}')`.


---

### Issue 3 : No Price Displayed Anywhere in the Application

**Problem:** The `sample-products.json` data contains `retailPrice` for every product, but the `Product` TypeScript interface on both pages omitted it. The server-side interface in `lib/products.ts` also omitted it. An eCommerce application with no prices is fundamentally unusable — users cannot make purchase decisions.

**User Scenario:** A user browses the product catalog looking for a headset under $50. There are no prices anywhere — not on the list page cards and not on the product detail page. They leave the site.

**Fix:** Added `retailPrice: number` to all Product interfaces (client-side and server-side). Prices are now displayed on product cards and prominently on the product detail page.


---

### Issue 4 : Search Fires on Every Keystroke

**Problem:** The search input directly updated state on every `onChange`, which triggered a `useEffect` to make a new API request for each character typed. Typing "kindle" fired 6 sequential API requests, causing visible UI flicker as results loaded and replaced each other.

**User Scenario:** User types "headphones" and watches the product grid flash 10 times in 2 seconds as partial matches for "h", "he", "hea", etc. load and reload.

**Fix:** Introduced a debounce with a 300ms delay. A separate `searchInput` state drives the input field, and a `useEffect` with `setTimeout` updates the actual `search` state (which triggers the API call) only after the user stops typing.


---

### Issue 5 : No Error Handling on Any API Call

**Problem:** All three `fetch` calls (categories, subcategories, products) had no `.catch()` handler. If any request failed due to network issues, `setLoading(false)` was never called, leaving the user stuck on "Loading products..." forever with no way to recover.

**User Scenario:** User has flaky WiFi. The product fetch fails silently. They see "Loading products..." indefinitely with no error message and no retry button.

**Fix:** Added `.catch()` handlers to all fetch calls. Added an `error` state that shows a clear error message with a "Try Again" button. Used `.finally()` to ensure loading state is always cleared.


---

### Issue 6 : Category Dropdown Has No Way to Deselect

**Problem:** The Radix UI `Select` component doesn't support deselecting a value. Once a category was selected, there was no "All Categories" option in the dropdown to go back. The placeholder "All Categories" disappeared after selection. The only way to reset was the "Clear Filters" button.

**User Scenario:** User selects "Tablets", then wants to see all categories again. They open the dropdown looking for an "All" option but can't find one. They don't notice the "Clear Filters" button and think the app is broken.

**Fix:** Added an explicit `<SelectItem value="all">All Categories</SelectItem>` option at the top of both category and subcategory dropdowns. The `onValueChange` handler maps `"all"` back to `undefined`.


---

### Issue 7 : No Pagination — Only First 20 Products Visible

**Problem:** The product fetch had a hard-coded `limit=20` with no pagination controls, "Load More" button, or infinite scroll. The API returns a `total` count but it was completely ignored. Users could never see products beyond the first 20.

**User Scenario:** There are 30 products in the "Headphones" category but the user only sees 20 with no indication that more exist.

**Fix:** Added a "Load More Products" button that appears when there are more products to load. The button appends the next page of results to the existing list. The count display now shows "Showing X of Y products" so users know how many total results exist.


---

### Issue 8 : Nested Interactive Elements — Button Inside Link

**Problem:** Each product card had a `<Button>` nested inside a `<Link>` (`<a>` tag). This is invalid HTML — `<a>` elements cannot contain `<button>` elements. Screen readers announce both a link and a button for the same action, confusing assistive technology users. The button didn't add any functionality since clicking anywhere on the card already navigated.

**User Scenario:** A screen reader user hears "link, StackShop product, button, View Details" and doesn't know which element to activate. Keyboard navigation also shows two focusable elements for one action.

**Fix:** Replaced the `<Button>` with a `<span>` styled as a text CTA with a chevron icon. Added `group` class to the link so the text changes color on hover, providing visual feedback without nesting interactive elements.


---

### Issue 9 : Loading State Is Plain Text

**Problem:** The loading state was just the text "Loading products..." with no visual skeleton, spinner, or animation. Users had no confidence that anything was happening, especially on slower connections. The content area jumped when products loaded.

**User Scenario:** User opens the page and sees "Loading products..." for 2 seconds. There's no animation, no skeleton layout, no indication of progress. It feels broken.

**Fix:** Replaced the plain text with skeleton card placeholders that match the product card layout (image area, text lines, badge placeholders). The skeleton cards use `animate-pulse` to show loading activity and prevent layout shift when real data loads.


---

### Issue 10 : Empty State Has No Guidance

**Problem:** When search or filters returned no results, the user saw only "No products found" — no suggestions on what to do next, no way to clear filters, no encouraging message.

**User Scenario:** User misspells "kindel" (instead of "kindle") and sees "No products found" with no suggestion to check spelling, modify the search, or clear filters.

**Fix:** Added a richer empty state with helper text ("Try adjusting your search or filters") and a "Clear all filters" button that appears when any filter is active.
**Further Improvement:**
A potential enhancement would be implementing fuzzy search or similarity-based suggestions. If a user enters a slightly misspelled query (e.g., "kindel"), the system could suggest the closest matching product such as "Kindle" using a fuzzy matching approach (e.g., Fuse.js or string similarity algorithms). This would improve search usability and help users recover from typos instead of reaching a dead-end state.

---

### Issue 11 : Page Metadata Is Default Next.js Boilerplate

**Problem:** The browser tab displayed "Create Next App" and the meta description was "Generated by create next app." This looks unprofessional and hurts SEO.

**User Scenario:** User has multiple tabs open. The StackShop tab says "Create Next App" — they can't tell which tab is the store.

**Fix:** Updated `metadata` in `layout.tsx` to `title: "StackShop"` and `description: "Browse and discover products on StackShop"`.


---

### Issue 12 : Image Thumbnails Overflow on Products with Many Images

**Problem:** Thumbnails used a fixed 4-column grid. Products with 8-13 images created 2-3 rows of thumbnails, making the thumbnail area taller than the main image and pushing product info below the fold.

**User Scenario:** A product with 12 images shows 3 rows of tiny thumbnails stacked vertically. On mobile, this pushes the product title and features far down the page.

**Fix:** Changed the thumbnail container from a grid to a horizontal scrollable row (`flex overflow-x-auto`). Thumbnails are fixed at 80×80px with `flex-shrink-0` so they scroll horizontally instead of wrapping.


---

### Issue 13 : "Back to Products" Loses All Filter and Search State

**Problem:** The "Back to Products" link on the product detail page was a hard `<Link href="/">`, which always navigated to a fresh home page. Search/filter state was only stored in React `useState` and not reflected in the URL, so any search terms or category filters were lost when navigating away and back.

**User Scenario:** User searches "headphones", opens the 3rd result to check details, then clicks "Back to Products." Their search is gone, filters are reset, and they're back at the top of the unfiltered product list. They have to redo the search.

**Fix:** Two changes: (1) The product detail page now uses `router.back()` to navigate via browser history. (2) The home page syncs search/filter state to URL query params (e.g., `/?search=headphones&category=Tablets`) using `window.history.replaceState`. On mount, state is initialized from the URL via `useSearchParams`. This means going back restores the full URL including filters.



### Issue 14 : Product Card Image Not Flush with Card Edges

**Problem:** The Card component's base class includes `py-6` (24px top/bottom padding) and `rounded-xl` corners. Product card images used `rounded-t-lg` which is a smaller radius than the card's `rounded-xl`. This created a visible gap above the product image and mismatched corner rounding — the image corners didn't align with the card corners.

**User Scenario:** A user looking at the product grid notices small gaps above each product image and slightly different corner shapes between the image and the card border. It looks unpolished.

**Fix:** Added `overflow-hidden pt-0` to the product Card so the image sits flush at the top. The card's `overflow-hidden` combined with `rounded-xl` naturally clips the image to match the card's corner radius, so `rounded-t-lg` was removed from the image container.


---

### Issue 15 : No Focus Ring on Product Card Links

**Problem:** The `<Link>` wrapping each product card had no `focus-visible` style. Keyboard users tabbing through the product grid had no visual indication of which card was currently focused. This is a WCAG accessibility violation.

**User Scenario:** A keyboard-only user presses Tab to navigate through products. Nothing visually highlights — they can't tell which card will activate when they press Enter.

**Fix:** Added `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-xl` to the Link className so a visible ring appears on keyboard focus.



### Issue 16 : `offset || 0` Uses Falsy Check Instead of Nullish Coalescing

**Problem:** In `lib/products.ts`, the line `const limit = filters?.limit || filtered.length` uses `||` which treats `0` as falsy. If `limit` is explicitly `0`, it incorrectly defaults to `filtered.length` (returning all products). Should use `??` to only default on `null`/`undefined`.

**User Scenario:** An API consumer passes `?limit=0` expecting no results. Instead, they get the entire product catalog.

**Fix:** Changed `||` to `??` for both `offset` and `limit`.


---

### Issue 17 : `parseInt` Doesn't Validate for NaN in Products API

**Problem:** In the products API route, `parseInt(searchParams.get('limit')!)` returns `NaN` if the value isn't a number (e.g., `?limit=abc`). Then `Array.slice(NaN, NaN)` returns `[]`, silently returning empty results with no error.

**User Scenario:** A malformed URL like `/api/products?limit=abc` returns `{ products: [], total: 30 }` — claiming 30 products exist but returning none.

**Fix:** Parse the values first, then use `Number.isNaN()` to fall back to sensible defaults (20 for limit, 0 for offset).


---

### Issue 18: No Upper Bound on `limit` Parameter — Enables Data Scraping

**Problem:** The products API accepted any value for `limit` with no maximum cap. A request to `/api/products?limit=999999` would return the entire product catalog in a single response, enabling trivial data scraping. Negative values were also accepted.

**User Scenario:** A competitor scripts `curl /api/products?limit=100000` and downloads the full catalog with pricing in one request.

**Fix:** Added a `MAX_LIMIT` of 100. The `limit` is clamped with `Math.min()` and `Math.max(0, ...)` to ensure it stays within a valid range.



---

### Issue 19: No Input Length Validation on Search/Filter Parameters

**Problem:** The `search`, `category`, and `subCategory` query parameters had no length limits. An attacker could send a multi-megabyte string as the search query, forcing the server to run `.toLowerCase().includes()` on that string against every product — a CPU-intensive operation.

**User Scenario:** Attacker sends `/api/products?search=AAAA...` (1MB string) repeatedly, degrading server performance for all users.

**Fix:** All string parameters are truncated to a maximum of 200 characters via `.slice(0, MAX_PARAM_LENGTH)` before being used in filtering.



---

### Issue 20 : No Security Headers Configured

**Problem:** No security headers were set in the Next.js config. The `X-Powered-By: Next.js` header was sent by default (revealing the framework), no `X-Frame-Options` was set (allowing clickjacking via iframes), and no `X-Content-Type-Options` was set (allowing MIME-type sniffing).

**User Scenario:** Attacker embeds the store in a hidden iframe on a malicious site, overlays fake UI on top, and tricks users into clicking unintended actions (clickjacking).

**Fix:** Disabled `poweredByHeader` and added security headers: `X-Frame-Options: DENY` (prevents iframe embedding), `X-Content-Type-Options: nosniff` (prevents MIME sniffing), and `Referrer-Policy: strict-origin-when-cross-origin`.


---

### Issue 21 (Good Practise): No Clickable Logo/Brand Link on Product Detail Page

**Problem:** The product detail page had no site-wide header or clickable brand name. Users expect to be able to click the site logo or brand name (e.g., "StackShop") on any page to return to the home page. Without it, users on the product detail page had no familiar, universal way to navigate home — the only option was the browser back button or the "Back to Products" link.

**User Scenario:** A user lands on a product detail page via a shared link. They want to browse the full catalog but there is no logo or brand name to click. They don't know to use the "Back to Products" button (which goes to their previous page, not necessarily the home page).

**Fix:** Added a consistent StackShop header with a `<Link href="/">` on the product detail page across all states (loading, error, and product view). This follows the standard eCommerce pattern of a clickable logo on every page.


---

### Enhancement: Added "Add to Cart" Button on Product Detail Page

The original product detail page had no primary call-to-action. Users could view product information but had no next step. Added an "Add to Cart" button as the primary CTA to complete the eCommerce user flow.


