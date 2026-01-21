# TimeArc: Principal Investigator Collaboration Visualization

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

## 🎯 Overview

TimeArc is an interactive data visualization tool that displays collaborative relationships between Principal Investigators (PIs) across research proposals over time. The visualization uses a timeline-based approach where proposals are represented as vertical arcs connecting the PIs involved, making it easy to identify collaboration patterns, active periods, and research themes.

### 🎥 Live Demo
Open [index.html](index.html) in your browser to see the visualization in action.

![TimeArc Visualization](docs/screenshot.png)

### 🌟 Key Highlights
- **Visual Collaboration Analysis**: Instantly identify who works with whom and when
- **Time-Based Insights**: Track research activity trends across years
- **Interactive Exploration**: Zoom, pan, and filter to focus on specific aspects
- **Data Flexibility**: Support for Excel and CSV formats with automatic parsing

## 🎯 Use Cases

This visualization tool is ideal for:

1. **Research Administration**: 
   - Track collaboration patterns across departments
   - Identify highly collaborative researchers
   - Analyze proposal submission trends over time

2. **Grant Management**:
   - Visualize funding distribution across PIs
   - Monitor active research periods
   - Identify collaboration opportunities

3. **Academic Analytics**:
   - Study research team formation
   - Analyze interdisciplinary collaborations
   - Track research theme evolution

4. **Strategic Planning**:
   - Identify research capacity by time period
   - Plan resource allocation based on collaboration patterns
   - Foster new partnerships based on existing networks

## ✨ Features

### Core Functionality
- **Interactive Timeline**: Visualize proposals across time with precise date positioning
- **Collaborative Arcs**: Vertical lines connecting all PIs involved in each proposal
- **PI Name Filter**: Searchable dropdown (Select2) to filter proposals by specific Principal Investigator
- **Dynamic PI Count Filter**: Filter proposals by number of collaborating PIs
- **Smart PI Sorting**: When filtering by PI, automatically sorts other PIs by collaboration strength
- **Zoom & Pan**: Explore the timeline at different granularities (years, quarters, months)
- **Hover Tooltips**: Detailed proposal information on hover, including funding details
- **Theme Color Coding**: Visual distinction of proposals by research theme/category

### User Interactions
- **PI Label Hover**: Highlight all proposals involving a specific PI
- **Proposal Arc Hover**: Display detailed information about the proposal and all involved PIs
- **Search & Filter**: Type to search PI names in dropdown filter
- **Slider Controls**: Smooth filtering and zoom controls
- **Drag to Pan**: Horizontal panning by dragging the chart
- **Responsive Design**: Adapts to different screen sizes

### Visual Enhancements
- **Optimized Spacing**: Enhanced spacing between year labels and first PI row for better readability
- **Refined Line Weight**: Connection lines use optimized stroke width (1.0px) for cleaner appearance
- **Improved Opacity**: Lines have 0.5 opacity for better overlap visibility
- **Dynamic Positioning**: PIs are positioned based on collaboration frequency

### Data Support
- **Excel Files**: .xlsx and .xls formats
- **CSV Files**: Standard comma-separated values
- **Automatic Date Parsing**: Handles multiple date formats
- **Default Dataset**: Automatically loads dataset.xlsx on startup

## 🎨 Visual Design

### What You'll See
- **Timeline Axis**: Horizontal axis showing years, quarters, or months depending on zoom level
- **PI Rows**: Each Principal Investigator has their own horizontal row
- **Proposal Arcs**: Vertical lines connecting all PIs involved in a proposal
- **Color Themes**: Different colors represent different research themes
- **Interactive Hover**: Rich tooltips show detailed information on hover

### Design Philosophy
The visualization follows these principles:
- **Clarity**: Clean, uncluttered design focusing on the data
- **Interactivity**: Direct manipulation for exploration
- **Context**: Always show temporal and collaborative relationships
- **Responsiveness**: Adapts to different screen sizes and data densities

## 🚀 Technical Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Visualization** | D3.js v7 | SVG rendering and data binding |
| **UI Framework** | Tailwind CSS + Custom CSS | Responsive UI and custom chart styles |
| **Search Component** | Select2 + jQuery | Enhanced searchable dropdown for PI filter |
| **Data Parsing** | SheetJS (xlsx) | Excel file reading and parsing |
| **Date Handling** | Native JavaScript Date | Multi-format date parsing |

### 📊 Why These Technologies?

**D3.js**: Industry standard for data visualization, providing:
- Powerful data binding capabilities
- Precise SVG control for custom visualizations
- Built-in scales, axes, and transition support
- Large community and extensive documentation

**Tailwind CSS**: Enables rapid UI development with:
- Utility-first approach for consistent styling
- Responsive design utilities
- Easy customization through configuration
- Minimal CSS footprint

**SheetJS**: Robust Excel parsing with:
- Support for both old (.xls) and new (.xlsx) formats
- Client-side processing (no server required)
- Handles various data formats and encoding

**Select2**: Enhanced dropdown functionality with:
- Real-time search and filtering
- Clean, modern UI design
- Keyboard navigation support
- Seamless integration with jQuery

### Project Structure

```
Lab/
├── index.html          # Main HTML structure
├── css/
│   └── main.css       # Custom styles for visualization
├── js/
│   └── main.js        # Core visualization logic
├── dataset.xlsx        # Default data file (optional)
└── README.md          # This file
```

**File Organization**:
- `index.html`: Single-page application entry point
- `css/main.css`: All custom styles for the visualization
- `js/main.js`: Complete visualization logic (~1200 lines)
- `dataset.xlsx`: Default data file (optional)

### 📁 Data Schema

The application expects data with the following columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `proposal_no` | String | Yes | Unique proposal identifier |
| `date_submitted` | Date/String | Yes | Submission date (various formats supported) |
| `PI` | String | Yes | Principal Investigator name |
| `title` | String | Yes | Proposal title |
| `theme` | String | No | Research theme/category for color coding |
| `sponsor` | String | No | Funding sponsor organization |
| `credit` | Number/String | No | PI credit allocation |
| `first` | Number/String | No | First-year funding amount |
| `total` | Number/String | No | Total funding amount |

#### Date Format Support
The application intelligently parses multiple date formats:
- ISO Format: `2021-08-27`
- US Format: `08/27/2021`
- European Format: `27-08-2021`
- Excel Serial Dates: Numeric values (e.g., 44425)
- Date Objects: Native JavaScript Date instances

#### Example Data Row
```csv
proposal_no,date_submitted,PI,title,theme,sponsor,credit,first,total
PROP-2021-001,2021-08-27,Dr. Jane Smith,Advanced AI Research,Artificial Intelligence,NSF,0.5,50000,150000
```

## 💻 Code Architecture

### HTML Structure (`index.html`)
- **Semantic Layout**: Clear separation of header, controls, chart area, and tooltip
- **External Dependencies**: CDN links for D3.js, Tailwind CSS, and SheetJS
- **Accessibility**: Descriptive titles and labels for all interactive elements

### CSS Architecture (`css/main.css`)
Organized into logical sections:
1. **Global Styles**: Body typography and background
2. **Tooltip Component**: Positioned overlay with table formatting
3. **Chart Elements**: Grid lines, axes, labels, and visual elements
4. **Interactive States**: Hover effects and transitions
5. **Dimming Effects**: Visual focus mechanisms

### JavaScript Architecture (`js/main.js`)

#### State Management
```javascript
{
  allProposalsData: Array,     // Complete dataset
  currentFilter: {
    piCount: String|Number,    // PI count filter ('all' or number)
    piName: String             // PI name filter ('all' or PI name)
  },
  currentZoom: Object,          // Zoom and pan state
  xScaleOriginal: d3.Scale,    // Original scale before transformations
  currentPan: Number            // Pan offset in pixels
}
```

#### Key Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `setupFilterListeners()` | Initialize UI event handlers | None |
| `applyFilters()` | Apply current filters and redraw | None |
| `loadDefaultDataset()` | Load dataset.xlsx on startup | None |
| `processDataAndDraw(rawData)` | Parse and normalize data | Raw data array |
| `drawChart(proposals)` | Render D3.js visualization | Filtered proposals |
| `updateChartWithZoom()` | Recalculate scale on zoom/pan | None |
| `getFractionalYear(proposal)` | Convert date to decimal year | Proposal object |

#### Data Processing Pipeline
1. **Load**: Fetch data from file or user upload
2. **Parse**: Convert Excel/CSV to JSON with date parsing
3. **Group**: Combine rows by `proposal_no`
4. **Normalize**: Parse numeric values and create Date objects
5. **Sort**: Order by submission date
6. **Calculate**: Determine fractional year positions
7. **Render**: Draw SVG elements with D3.js

### D3.js Visualization Details

#### Scale Configuration
```javascript
// Y-axis: Categorical scale for PI names
yScale = d3.scalePoint()
  .domain(uniquePIs)           // All unique PI names
  .range([margin.top, height]) // Vertical spacing
  .padding(0.5);              // Space between rows

// X-axis: Linear time scale
xScale = d3.scaleLinear()
  .domain([yearStart, yearEnd]) // Time range
  .range([margin.left, width]); // Horizontal spacing
```

#### Rendering Layers
1. **Grid Lines**: Background vertical lines for time reference
2. **Axes**: Top and bottom time axes with dynamic formatting
3. **PI Lines**: Horizontal reference lines for each PI
4. **Proposal Links**: Vertical connecting lines (drawn first)
5. **Proposal Nodes**: Circular markers at each PI position (drawn last)
6. **Labels**: PI names on Y-axis

#### Zoom Implementation
- **Scale Factor**: 0.5x to 10x magnification
- **Adaptive Ticks**: Automatic switch between years/quarters/months
- **Pan Support**: Drag-to-pan with domain offset calculation
- **Smooth Transitions**: CSS transitions for visual feedback

## ⚡ Performance Considerations

### Optimization Techniques
1. **Data Grouping**: Proposals grouped before rendering to minimize rows
2. **Clipping Paths**: SVG clip-path prevents overflow rendering
3. **Pointer Events**: Nodes use `pointer-events: none` for efficient hovering
4. **Debouncing**: Zoom updates apply immediately without throttling
5. **Selective Rendering**: Only visible elements updated on zoom/pan

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **SVG Support**: Required for visualization
- **ES6 Features**: Arrow functions, template literals, const/let
- **FileReader API**: Required for file uploads

## 📖 Usage Guide

### ⚡ Quick Start

**Option 1: Using Default Data**
```bash
# Simply open the HTML file in any modern browser
# The visualization will automatically load dataset.xlsx if present
```

**Option 2: With Your Own Data**
1. Open [index.html](index.html) in your browser
2. Click the "Upload Data" button
3. Select your Excel (.xlsx, .xls) or CSV file
4. The visualization will update automatically

**Option 3: Replace Default Dataset**
```bash
# Replace the default dataset file
cp your-data.xlsx dataset.xlsx
# Open index.html in browser
```

### Getting Started

1. **Place Data File**
   ```bash
   # Place your Excel file in the same directory
   cp your-data.xlsx Lab/dataset.xlsx
   ```

2. **Open in Browser**
   ```bash
   # Open index.html in a web browser
   open index.html  # macOS
   start index.html # Windows
   ```

3. **Upload Custom Data** (Optional)
   - Click "Upload Data" button
   - Select .xlsx, .xls, or .csv file
   - Data will be processed and visualized automatically

### Interactive Controls

#### PI Name Filter (Searchable Dropdown)
- **Type to Search**: Quickly find PIs by typing their name
- **All PIs Option**: Default selection shows all proposals
- **Live Filtering**: Chart updates immediately when PI is selected
- **Smart Sorting**: When a PI is selected, other PIs are sorted by collaboration strength
- **Clear Selection**: X button to quickly clear the filter

#### PI Count Filter Slider
- **Position 0**: Show all proposals
- **Position 1-N**: Show only proposals with exactly N PIs
- **Label**: Displays current filter and matching count
- **Combine Filters**: Works together with PI name filter

#### Zoom Slider
- **Range**: 0.5x (zoomed out) to 10x (zoomed in)
- **Time Granularity**:
  - < 1.5x: Yearly labels
  - 1.5x - 4.5x: Quarterly labels (Q1/2023)
  - ≥ 4.5x: Monthly labels (01/2023)

#### Pan Control
- **Drag**: Click and drag horizontally on chart
- **Visual Feedback**: Cursor changes to "grabbing"

#### Reset Button
- Clears all filters (PI name and count)
- Resets zoom to 1.0x
- Resets pan offset to 0

### Tooltip Information

#### PI Label Tooltip
- Total number of proposals
- Active year range
- Instruction to hover on arcs

#### Proposal Arc Tooltip
- Proposal title and number
- Submission date (formatted)
- Sponsor organization
- Research theme (color-coded)
- PI table with:
  - PI names
  - Credit allocation
  - First-year funding
  - Total funding

## 🎨 Customization

### Modifying Colors
Edit `css/main.css` to change color schemes:

```css
/* Change theme colors */
const colorScale = d3.scaleOrdinal()
  .domain(themes)
  .range(['#1f77b4', '#ff7f0e', '#2ca02c', ...]); // Custom colors

/* Customize Select2 dropdown appearance */
.select2-container--default .select2-results__option--highlighted[aria-selected] {
    background-color: #3b82f6; /* Change highlight color */
}
```

### Adjusting Layout
Modify dimensions in `js/main.js`:

```javascript
const margin = { top: 80, right: 50, bottom: 50, left: 200 };
const extraSpacing = 40;  // Extra space after year label
const rowHeight = 30;     // Increase for more spacing

// Connection line styling
.attr("stroke-width", 1.0)      // Line thickness
.attr("stroke-opacity", 0.5)    // Line transparency
```

### Adding New Filters
1. Add HTML control in `index.html`
2. Add event listener in `setupFilterListeners()`
3. Update `currentFilter` object with new filter property
4. Implement filter logic in `applyFilters()`
5. Initialize Select2 if using searchable dropdown

Example:
```javascript
// In setupFilterListeners()
$('#myNewFilter').select2({
    placeholder: 'Search...',
    allowClear: true,
    width: '250px'
});

// In applyFilters()
if (currentFilter.myNewField !== 'all') {
    filteredData = filteredData.filter(p => /* filter logic */);
}
```

## 🔧 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Chart not appearing | Check browser console for errors; ensure dataset.xlsx exists |
| Dates not parsing | Verify date column format; see Data Schema section |
| Performance issues | Reduce dataset size or lower zoom level |
| Tooltips not showing | Check CSS is loaded correctly |
| File upload fails | Verify file format (.xlsx, .xls, .csv) |

### Debug Mode
Open browser developer console (F12) to see:
- Data loading messages
- Parsing warnings
- Sample proposals
- PI statistics

## 🚧 Future Enhancements

### Recently Added Features ✅
- [x] PI name filter with searchable dropdown (Select2)
- [x] Smart PI sorting based on collaboration strength
- [x] Optimized visual spacing and line weights
- [x] Combined filter support (PI name + count)

### Planned Features
- [ ] Export visualization as PNG/SVG
- [ ] Advanced filters (date range, theme, sponsor)
- [ ] Network graph view of PI collaborations
- [ ] Statistics dashboard with collaboration metrics
- [ ] Collaboration strength indicators (edge thickness)
- [ ] Multi-PI selection filter
- [ ] Time animation (auto-play timeline)
- [ ] Mobile-optimized touch controls
- [ ] Save/load filter configurations

### Performance Improvements
- [ ] Virtual scrolling for large datasets
- [ ] Canvas renderer option for 1000+ proposals
- [ ] Web Workers for data processing
- [ ] Progressive loading for large files

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Code Style**: Follow existing patterns and add comments
2. **Testing**: Test with multiple data formats and sizes
3. **Documentation**: Update README for new features
4. **Performance**: Profile changes with large datasets

## 📄 License

This project is released under the MIT License.

## 🙏 Credits

### Libraries
- **D3.js**: Michael Bostock and contributors
- **Tailwind CSS**: Adam Wathan and Tailwind Labs
- **SheetJS**: SheetJS LLC
- **Select2**: Kevin Brown and contributors
- **jQuery**: jQuery Foundation

### Inspiration
- Sankey diagrams and arc diagrams in data visualization
- Timeline-based collaboration analysis tools
- Network analysis in academic research

## 💬 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the documentation wiki

## 📊 Presentation Tips

When presenting this project, highlight these key aspects:

### For Technical Audiences
- **Architecture**: Explain the D3.js data-driven approach and SVG rendering
- **Data Processing**: Show how dates are parsed and normalized from multiple formats
- **Interactivity**: Demonstrate zoom, pan, and filtering capabilities live
- **Code Quality**: Point to well-documented code with clear separation of concerns

### For Non-Technical Audiences
- **Problem Statement**: Begin with the challenge of visualizing research collaborations
- **Solution**: Show how the timeline view makes patterns immediately visible
- **Use Cases**: Provide concrete examples of insights gained from the visualization
- **Live Demo**: Use the interactive features to explore real data

### Key Points to Emphasize
1. **No Server Required**: Runs entirely in the browser
2. **Easy Data Upload**: Drag and drop Excel files
3. **Smart Filtering**: Searchable PI dropdown with real-time results
4. **Intelligent Sorting**: PIs automatically arranged by collaboration strength
5. **Instant Insights**: See collaboration patterns at a glance
6. **Flexible & Extensible**: Easy to customize and enhance

### Demo Scenarios
1. **Find Prolific Collaborators**: Show PIs with many connections
2. **Analyze Specific PI**: Use searchable filter to focus on one researcher
3. **Collaboration Strength**: Demonstrate smart sorting when filtering
4. **Time-Based Trends**: Identify busy periods vs. quiet periods
5. **Theme Analysis**: Filter by research theme to see patterns
6. **Combined Filters**: Show PI name + count filters working together

## 📈 Key Insights You Can Discover

With TimeArc, you can answer questions like:

- **Who are the most collaborative PIs?** Look for PIs with many vertical arcs
- **What are the peak submission periods?** Dense clusters of arcs show high activity
- **How do collaborations form?** Track repeated connections between same PIs
- **What themes dominate each period?** Color patterns reveal research focus shifts
- **Who bridges different research areas?** PIs connected to multiple themes
- **What's the typical team size?** Use the PI count filter to analyze
- **Who collaborates most with a specific PI?** Use PI filter with smart sorting
- **Which PIs work together frequently?** Close positioning indicates strong collaboration

---

**Last Updated**: January 2026  
**Version**: 1.1.0 - Added PI name filter with searchable dropdown and smart sorting
