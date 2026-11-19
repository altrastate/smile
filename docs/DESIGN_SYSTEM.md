# Design system

Smile should feel natural, calm, and commercially credible. The references studied for this system were Kristy Creatives, Forest Futures Unfolded, Amazon, and Mobile Shop Uganda. The lessons taken from them are editorial type, generous space, predictable commerce controls, visible price and availability, and a short path to a decision. Their layouts, colours, and assets are not reused.

## Colour

Tokens live in `src/app/globals.css`.

| Token | Hex | Use |
| --- | --- | --- |
| `forest-950` | `#0E2419` | Rare, deepest brand field |
| `forest-900` | `#13281F` | Headings |
| `forest-800` | `#1B4332` | Primary actions, wordmark. White text on this green is the button combination |
| `forest-700` | `#245C40` | Primary hover |
| `botanical-700` | `#1F6B3A` | Large labels and focus outline |
| `botanical-600` | `#2F7D4A` | Large fills only. Not for small text |
| `ivory-50` | `#F7F4EE` | Page background |
| `ivory-100` | `#F1EBE1` | Quiet panels |
| `beige-200` | `#E6DCCB` | Dividers and swatch edges |
| `beige-300` | `#D4C6B0` | Control borders |
| `charcoal-900` | `#1C1916` | Body text on ivory |
| `charcoal-700` | `#3F3A34` | Secondary text |
| `charcoal-500` | `#6B645C` | Placeholder text. Do not use it for essential copy |
| `clay-700` | `#7A4632` | A single earth accent, used sparingly |
| `danger-700` | `#8B2E2E` | Errors |
| `warning-800` | `#7A4E10` | Warnings |

Body copy is charcoal on ivory. Green is for identity and action. This keeps contrast with the palette instead of putting mid-green text on a cream page.

## Typography

- Fraunces, via `next/font`, for headings and product names.
- Source Sans 3 for interface and body text.
- Display heading: `text-4xl` on small screens, `text-6xl` on medium screens and up, tight line height.
- Section heading: `text-3xl`, `text-4xl` from the medium breakpoint.
- Body: `text-base` or `text-lg`, relaxed line height.
- Labels: `text-sm`, semibold.

Do not set long paragraphs in the serif.

## Space, width, and grid

Spacing follows Tailwind’s 4px scale. Related controls use `gap-2` or `gap-3`. Sections use `py-16`, and `md:py-24` on the opening section.

The content width is `max-w-6xl` (72rem) with `px-5` of page padding. A reading measure stays near `max-w-xl` or `max-w-2xl`.

From the large breakpoint, the homepage hero uses two columns: writing, then the botanical drawing. Sections stack to one column below that.

## Borders, radius, and shadow

Controls and cards use a 1px `beige-300` border, or a forest border when the control is an action. Corners are `rounded-sm` (2px). Shadows are limited to `shadow-soft` on the dialog and menu. Do not use glass, large radii, or gradient fills.

Dividers are `border-beige-300`.

## Breakpoints

| Name | Width | Behaviour |
| --- | --- | --- |
| default | under 640px | One column, full-width controls, 44px targets |
| `sm` | 640px | Swatches can sit two across |
| `md` | 768px | Larger headings, footer can sit on one row |
| `lg` | 1024px | Twelve-column composition |
| `xl` | 1280px | Content width stays capped |

## Components

Shared controls are in `src/components/ui`.

| Component | Behaviour |
| --- | --- |
| Button | `primary`, `secondary`, `ghost`, `danger`, sizes `md` and `sm` |
| Icon button | Requires a visible name through `label` |
| Input, textarea, select, search field | Always labelled. Errors set `aria-invalid` and point at the message |
| Checkbox and radio | Native controls, 44px hit area |
| Badge | Short status text, not a button |
| Dialog | Focus is kept inside. Always has a title and a Close control. `align="end"` places it as a side panel for the mobile menu |
| Dropdown menu | Keyboard menu for a small set of actions |
| Tooltip | Extra name for an icon button. Not the only name |
| Tabs | One visible panel at a time |
| Breadcrumbs | The current crumb is text, not a link |
| Pagination | Previous, numbered pages, Next. Disabled at the ends |
| Product card | Name, category, business, optional summary, image or a letter fallback. Price and stock are not shown |
| Section heading | Eyebrow, title, optional description |
| Empty state | Honest explanation when a feature is absent |
| Loading state | Text plus a static mark, with `role="status"`. It is not shown on a timer |
| Alert | `info`, `success`, `warning`, `danger`. Danger uses `role="alert"` |

## Focus and accessibility

Every control has a visible `:focus-visible` outline in botanical green. Icon buttons have an accessible name. The page has one `h1`, a skip link, and `lang="en"`. Colour is not the only signal for errors: each field also has text.

## Loading and errors

A loading state is rendered only while a real request is in flight. The public pages do not start a request on load.

Validation errors are attached to the field. A successful local check says that nothing was saved. Network and database failures go through `toAppError` and are shown as an alert. They are not replaced with an empty success state.

## Imagery

`public/brand/logo.svg` is the full lockup traced from the supplied artwork, with a transparent background. `public/brand/mark.svg` is the hand and leaves alone, used in the header beside the name. `public/brand/canopy.svg` is an original line drawing made for the homepage. It is not a photograph and it is not a Smile product. No third-party image is hotlinked. Product photographs in `Products/` stay out of the interface until they belong to real catalogue records.

## Commerce conventions for later phases

Product cards keep the same structure: image, name, price, availability. Search, categories, and the cart entry stay in predictable places. Checkout copy should be short, with the price and the payment choice visible. Those screens are not built in this phase.
