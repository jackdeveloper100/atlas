# Client Map Clarification & Technical Architecture Requirements

> **Document Type:** Client Clarification Analysis & Implementation Specification  
> **Target Project:** Atlaslocal (Jack Developer 100 / Atlas)  
> **Date:** August 19, 2026  
> **Status:** Review & Action Plan  

---

## Executive Summary

Following the client's latest feedback (CLT Matthew Lockstone UK), significant clarifications have been established for the map rendering pipeline, data delivery architecture, zoom behaviors, interactive map elements, and faction color systems. 

The core shift moves heavy geometric computation (**polygon clipping, border dissolving, pole-of-inaccessibility label anchor calculation, and contested hatching**) **strictly to a daily server-side post-tick batch job**. The client web app becomes a lightweight, high-performance rendering canvas consuming immutable, CDN-cached JSON bundles from Cloudflare R2.

---

## 1. What Has Changed in Existing Functionality & Requirements

The table below highlights the key shifts between the current/prior implementation and the clarified client specification:

| Feature / Architectural Layer | Previous / Current Implementation | Clarified Client Requirement |
| :--- | :--- | :--- |
| **Polygon Union / Border Dissolving** | Computed client-side or rendered as un-dissolved individual subregion polygons. | **Server-side Batch Job ONLY.** Runs once per day after the tick. Merges subregions using `polygon-clipping` (union) into a single dissolved national border path per nation. Library MUST NOT be shipped to client browser. |
| **Label Anchor Point Calculation** | Computed on client using simple polygon centroid or bounding-box center (risking labels landing in ocean/outside concave territories). | **Server-side Precomputed Anchor.** Uses **centroid** or **pole-of-inaccessibility (Polylabel)** at build time to guarantee labels land strictly inside landmass bounds. |
| **Contested Region Rendering** | Dynamic client-side overlay styling / conditional rendering. | **Precomputed Hatch Overlays.** Build-step flags contested subregions and precomputes hatch overlay paths into the daily bundle. |
| **Data Publishing & CDN Delivery** | Dynamic API responses from backend database queries on client load. | **R2 Immutable Daily Bundles.** Output versioned by date (e.g., `/map/2026-08-11/nations.json`). Immutable once written, CDN-cacheable, light client fetch. |
| **Zoom Levels & Map Modes** | Single fixed interactive view showing subregions and basic text labels. | **Dual Zoom Setting System:**<br>1. **Nation View (Zoom 1):** Precomputed dissolved national borders + dynamic fitting nation name.<br>2. **Region View (Zoom 2):** Zooming in replaces nation labels with region/subregion labels while maintaining nation colors. |
| **Interactive Elements & Micro-Animations** | Static/basic SVG click handlers on region paths. | **Interactable Capital City Tokens:** Custom vector tokens with hover & click animations that trigger the **Dossier Panel animation**. |
| **Aquatic Feature Labels** | Land-only labelling; water rendered as plain background fill. | **Dedicated Aquatic Labels:** Named labels for lakes, seas, and oceans rendered directly on water bodies. |
| **Faction Color Palette** | Ad-hoc or generated CSS colors. | **Strict 50 Faction Palette:** Desaturated-atlas logic spanning 6 hue bands (Reds/Oranges, Ambers, Greens, Teals/Blues, Purples, Neutrals). |

---

## 2. Actionable Implementation Roadmap ("What Needs to be Done")

### Phase A: Server-Side Daily Batch Pipeline (`engine/src/batch/mapBuilder.js`)
1. **Post-Tick Build Step Integration**:
   - Hook into the daily game engine tick execution pipeline (`engine/src/index.js` / `snapshots`).
   - Group active subregion geometry by current `nationId`.
2. **Polygon Dissolving (Union)**:
   - Install and utilize `polygon-clipping` strictly on the server-side build worker.
   - Perform boolean union operations across all subregions belonging to a single nation to generate dissolved multi-polygon / single-polygon SVG paths (`borderPath`).
3. **Anchor Point Calculation (Pole-of-Inaccessibility)**:
   - Integrate `@mapbox/polylabel` or centroid algorithms to compute optimal `labelPoint: [x, y]` coordinates inside the largest polygon of each nation.
4. **Contested Region Pre-hatching**:
   - Check subregion contested flags post-tick.
   - Generate static hatch pattern definitions/overlay paths for contested subregions.
5. **JSON Bundle Generation & R2 Upload**:
   - Generate bundle output structure:
     ```json
     {
       "date": "2026-08-11",
       "nations": [
         {
           "nationId": "ashen-run",
           "name": "Ashen Run",
           "color": "#B85C4E",
           "borderPath": "M 350,80 Q...",
           "labelPoint": [410, 120],
           "capitalPoint": [415, 125],
           "subregionIds": ["sub-1", "sub-2"]
         }
       ],
       "contestedOverlays": [ ... ],
       "subregions": [ ... ]
     }
     ```
   - Publish to Cloudflare R2 bucket at key path `/map/YYYY-MM-DD/nations.json` with `Cache-Control: public, max-age=31536000, immutable`.

---

### Phase B: Frontend Map Component Engine (`frontend/src/components/projection/ProjectionMapCanvas.jsx`)
1. **Dual Zoom State Engine**:
   - Implement zoom listener (e.g., via D3-zoom or SVG transform/matrix scale handler).
   - Set zoom scale threshold $T_{zoom}$ (e.g., scale $\ge 1.8x$).
   - **Nation View ($scale < T_{zoom}$)**: Render precomputed `borderPath` shapes with precomputed nation labels placed at `labelPoint`.
   - **Region View ($scale \ge T_{zoom}$)**: Transition nation labels out, render subregion polygon borders, and render individual region labels while retaining nation fill colors.
2. **Dynamic Nation Name Auto-Fitting**:
   - Implement SVG text scaling and rotation/curve logic to fit dynamic national borders as territories grow or shrink.
3. **Interactable Capital City Tokens**:
   - Render distinct capital city icon tokens at `capitalPoint`.
   - Add CSS keyframe micro-animations for hover (bounce/pulse scale) and click (ripple wave / glow).
   - Connect `onClick` event to trigger the Dossier Panel slide-in animation.
4. **Aquatic Cartographic Labels**:
   - Render static/dynamic labels for major lakes, seas, and oceans using italicized desaturated cartographic styling (`font-style: italic; fill: #4B6B75`).

---

### Phase C: Faction Palette Design System Integration (`frontend/src/utils/factionColors.js`)
Map the 50 desaturated atlas faction colors provided by the client into a structured constant:

```javascript
export const FACTION_PALETTE = [
  // Reds / Oranges / Browns (1-10)
  { id: 1, name: 'Brick Red', hex: '#B85C4E' },
  { id: 2, name: 'Rust Orange', hex: '#C17A4A' },
  { id: 3, name: 'Terracotta', hex: '#BD6B4F' },
  { id: 4, name: 'Burnt Sienna', hex: '#A5583C' },
  { id: 5, name: 'Clay Red', hex: '#9C5048' },
  { id: 6, name: 'Oxblood', hex: '#5C2E30' },
  { id: 7, name: 'Copper', hex: '#B87D52' },
  { id: 8, name: 'Chestnut', hex: '#7A4A3A' },
  { id: 9, name: 'Dusty Coral', hex: '#C48470' },
  { id: 10, name: 'Mahogany', hex: '#6B3A32' },
  
  // Golds / Ambers / Yellows (11-18)
  { id: 11, name: 'Burnt Gold', hex: '#D4A24C' },
  { id: 12, name: 'Mustard Olive', hex: '#C4B478' },
  { id: 13, name: 'Ochre', hex: '#B8923E' },
  { id: 14, name: 'Sand Gold', hex: '#D6C088' },
  { id: 15, name: 'Bronze Yellow', hex: '#A6863E' },
  { id: 16, name: 'Wheat', hex: '#CBB56A' },
  { id: 17, name: 'Amber Brown', hex: '#9A7638' },
  { id: 18, name: 'Pale Gold', hex: '#DECB94' },

  // Greens (19-27)
  { id: 19, name: 'Olive Green', hex: '#6B7A4F' },
  { id: 20, name: 'Moss', hex: '#7D8C5C' },
  { id: 21, name: 'Forest Sage', hex: '#566B4E' },
  { id: 22, name: 'Fern', hex: '#8A9A6B' },
  { id: 23, name: 'Deep Pine', hex: '#3F5240' },
  { id: 24, name: 'Sage Grey-Green', hex: '#8FA394' },
  { id: 25, name: 'Olive Drab', hex: '#5E6B3E' },
  { id: 26, name: 'Celadon', hex: '#9DAD8A' },
  { id: 27, name: 'Dark Juniper', hex: '#485844' },

  // Teals / Blues (28-36)
  { id: 28, name: 'Slate Blue', hex: '#7A8A93' },
  { id: 29, name: 'Dusty Teal', hex: '#5F8078' },
  { id: 30, name: 'Steel Blue', hex: '#5C7080' },
  { id: 31, name: 'Deep Teal', hex: '#3E5A56' },
  { id: 32, name: 'Powder Blue', hex: '#9BAFB6' },
  { id: 33, name: 'Navy Slate', hex: '#3A4A56' },
  { id: 34, name: 'Muted Cyan', hex: '#6B9895' }, // Note: Corrected hex syntax from 7-char string #6B98957
  { id: 35, name: 'Storm Blue', hex: '#4E6270' },
  { id: 36, name: 'Pale Denim', hex: '#8CA0AC' },

  // Purples / Mauves (37-43)
  { id: 37, name: 'Dusty Mauve', hex: '#A98B8E' },
  { id: 38, name: 'Plum', hex: '#6E4A5C' },
  { id: 39, name: 'Heather', hex: '#8A7488' },
  { id: 40, name: 'Wine Purple', hex: '#5C3A48' },
  { id: 41, name: 'Lavender Grey', hex: '#9C8C9A' },
  { id: 42, name: 'Aubergine', hex: '#4A3244' },
  { id: 43, name: 'Dusty Orchid', hex: '#B08A9C' },

  // Neutrals / Creams / Greys (44-50)
  { id: 44, name: 'Nibiya Cream', hex: '#E8DFC0' },
  { id: 45, name: 'Pale Sand', hex: '#D8CBA0' },
  { id: 46, name: 'Warm Grey', hex: '#8C8272' },
  { id: 47, name: 'Cool Grey', hex: '#7C8280' },
  { id: 48, name: 'Bone', hex: '#DCD3B8' },
  { id: 49, name: 'Charcoal Brown', hex: '#4A3E36' },
  { id: 50, name: 'Driftwood', hex: '#A69C84' }
];
```

---

## 3. Clarifications, Questions & Recommended Default Implementations

While these questions can be sent to client **Matthew Lockstone** for formal confirmation, **development can proceed immediately** using the following industry-standard recommended choices:

---

### ❓ Question 1: Multi-Polygon Nations (Islands & Non-Contiguous Exclaves)
> *When a nation controls non-contiguous territory (e.g., an island archipelago or an exclave separated by another nation):*

* **Recommended Default Implementation**: **Option A + Area Threshold Filter**
  * The build job calculates the pole-of-inaccessibility (`polylabel`) on the **single largest contiguous landmass polygon** for the main national label.
  * If a secondary island/exclave polygon exceeds **25%** of the nation's total land area, a secondary smaller sub-label is rendered on it. Small micro-islands receive no text label to prevent map clutter.

---

### ❓ Question 2: Data Source for Aquatic Labels (Seas, Lakes & Oceans)
> *Where are the official names and coordinate anchor points for water bodies stored?*

* **Recommended Default Implementation**: **Dedicated Static Configuration (`aquatic_features.json`)**
  * Create `frontend/src/config/aquatic_features.json` containing static coordinate anchors and names for major bodies of water (e.g., oceans, seas, gulfs, large lakes):
    ```json
    [
      { "id": "azure-sea", "name": "Azure Sea", "labelPoint": [520, 410], "fontSize": 14, "fontStyle": "italic" },
      { "id": "northern-ocean", "name": "Northern Ocean", "labelPoint": [750, 140], "fontSize": 18, "fontStyle": "italic" }
    ]
    ```
  * This decouples water body cartography from land subregion ownership changes.

---

### ❓ Question 3: Dynamic Label Fitting & Auto-Scaling Behavior
> *For nation labels that adapt as territory boundaries expand or shrink:*

* **Recommended Default Implementation**: **Area-Proportional Scaling Clamped Between Min/Max Bounds**
  * Compute label font size proportionally to dissolved polygon area: `fontSize = clamp(Math.sqrt(area) * k, 12px, 32px)`.
  * If a micro-nation's total dissolved width is smaller than its label string at `12px`, **hide the nation label at Nation View (Zoom 1)** and render it only when the user zooms into **Region View (Zoom 2)**.

---

### ❓ Question 4: Capital City Location & Movement Rules
> *How are capital city coordinates derived?*

* **Recommended Default Implementation**: **Subregion-Anchored Capital Node (`capitalSubregionId`)**
  * Each nation has a `capitalSubregionId` field in the database/JSON bundle.
  * The capital city token `[x,y]` position defaults to the centroid/anchor of that specific subregion.
  * If that subregion is captured during a tick, the engine reassigns `capitalSubregionId` to the nation's next largest core subregion.

---

### ❓ Question 5: Dossier Panel Integration & Interaction
> *When a user clicks a Capital City Token, what specific payload and view state should open?*

* **Recommended Default Implementation**: **Slide-In Nation Dossier Drawer (`ProjectionInspectorPanel.jsx`)**
  * Clicking a capital token triggers a pulse micro-animation on the token and opens the right-hand side `ProjectionInspectorPanel`.
  * Passes payload: `{ nationId, nationName, capitalName, leader, gdp, military, stability, activeTreaties, controlledSubregions }`.

---

### ❓ Question 6: Contested Subregion Hatching Visual Design
> *How should contested subregion hatch overlays be rendered visually?*

* **Recommended Default Implementation**: **Precalculated SVG Diagonal Stripe Overlay (`SVG <pattern>`)**
  * At build time, any subregion flagged as contested gets an overlay path referencing a SVG `<pattern>` of semi-transparent $45^\circ$ dark diagonal stripes (`rgba(0, 0, 0, 0.25)`).
  * This overlays clearly on top of the occupying nation's base fill color without clashing with the 50-faction desaturated atlas color palette.

---

## Summary Checklist for Next Sprint

- [x] Document client clarification specs & recommended implementation defaults.
- [ ] Add `polygon-clipping` and `@mapbox/polylabel` to `engine` server dependencies.
- [ ] Create `engine/src/batch/mapBuilder.js` to process daily post-tick dissolved borders & anchor points.
- [ ] Update Cloudflare R2 exporter to write date-versioned `/map/YYYY-MM-DD/nations.json`.
- [ ] Update `ProjectionMapCanvas.jsx` with dual zoom scale thresholds (Nation View vs Region View).
- [ ] Implement interactive Capital City vector tokens with CSS animations & dossier panel triggers.
- [ ] Render cartographic labels for water bodies (lakes, seas, oceans) via `aquatic_features.json`.
- [ ] Integrate the desaturated 50-color atlas palette into nation styling utilities.

