/**
 * TimeArc Visualization - Main JavaScript
 * 
 * This script implements an interactive timeline visualization showing collaborations
 * between Principal Investigators (PIs) across research proposals over time.
 * 
 * Key Features:
 * - Loads data from Excel (.xlsx, .xls) or CSV files
 * - Displays proposals as vertical arcs connecting collaborating PIs
 * - Interactive filtering by number of PIs per proposal
 * - Zoom and pan functionality for detailed exploration
 * - Hover tooltips with detailed proposal information
 * - Automatic time axis formatting (years/quarters/months based on zoom level)
 * 
 * Dependencies:
 * - D3.js v7 (for data visualization)
 * - SheetJS (for Excel file parsing)
 * 
 * @author TimeArc Team
 * @version 1.0.0
 */

/* ============================================
   GLOBAL STATE MANAGEMENT
   ============================================ */

/**
 * @type {Array<Object>} allProposalsData - Complete dataset of all proposals
 * Each proposal object contains:
 *   - proposal_no: Unique identifier
 *   - title: Proposal title
 *   - year: Submission year
 *   - date: Date object of submission
 *   - dateStr: Formatted date string
 *   - theme: Research theme/category
 *   - sponsor: Funding sponsor
 *   - pis: Array of PI objects with name, credit, first, total
 */
let allProposalsData = [];

/**
 * @type {Object} currentFilter - Active filter settings
 * @property {string|number} piCount - Number of PIs to filter ('all' or specific number)
 * @property {string} piName - PI name to filter ('all' or specific PI name)
 */
let currentFilter = { piCount: 'all', piName: 'all' };

/**
 * @type {Object} currentZoom - Zoom and pan state
 * @property {number} k - Zoom scale factor (1 = no zoom)
 * @property {number} x - Horizontal offset for panning
 */
let currentZoom = { k: 1, x: 0 };

/**
 * @type {d3.ScaleLinear|null} xScaleOriginal - Original X-axis scale before zoom transformations
 */
let xScaleOriginal = null;

/**
 * @type {boolean} isUpdatingFilter - Flag to prevent infinite loops when updating filters
 */
let isUpdatingFilter = false;

/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Initialize the application on DOM load
 * Loads default dataset and sets up event listeners
 */
window.addEventListener('DOMContentLoaded', function () {
    loadDefaultDataset();
    setupFilterListeners();
});

/* ============================================
   EVENT LISTENER SETUP
   ============================================ */

/**
 * Configure all filter and control event listeners
 * Handles PI count slider, zoom controls, and reset button
 */
function setupFilterListeners() {
    const piCountSlider = document.getElementById('piCountFilter');
    const piCountLabel = document.getElementById('piCountLabel');

    // PI Count Slider: Filter proposals by number of PIs
    piCountSlider.addEventListener('input', function (e) {
        const value = parseInt(e.target.value);
        currentFilter.piCount = value === 0 ? 'all' : value.toString();

        // Update label display
        if (value === 0) {
            piCountLabel.textContent = 'All';
        } else {
            const count = allProposalsData.filter(p => p.pis.length === value).length;
            piCountLabel.textContent = `${value} PI (${count})`;
        }

        applyFilters();
    });

    // Reset Filter Button: Clear all filters and zoom
    document.getElementById('resetFilter').addEventListener('click', function () {
        currentFilter.piCount = 'all';
        currentFilter.piName = 'all';
        piCountSlider.value = 0;
        piCountLabel.textContent = 'All';
        
        // Update Select2 without triggering change event
        isUpdatingFilter = true;
        $('#piNameFilter').val('all').trigger('change.select2');
        // Manually update the displayed text
        $('#select2-piNameFilter-container')
            .text('All PIs')
            .attr('title', 'All PIs');
        isUpdatingFilter = false;
        
        currentZoom = { k: 1, x: 0 };
        currentPan = 0;
        document.getElementById('zoomSlider').value = 1;
        document.getElementById('zoomLevel').textContent = '1.0x';
        applyFilters();
    });

    // Zoom Slider: Control zoom level
    document.getElementById('zoomSlider').addEventListener('input', function (e) {
        currentZoom.k = parseFloat(e.target.value);
        document.getElementById('zoomLevel').textContent = currentZoom.k.toFixed(1) + 'x';
        applyFilters();
    });

    // Zoom Reset Button: Return to 100% zoom
    document.getElementById('zoomReset').addEventListener('click', function () {
        currentZoom = { k: 1, x: 0 };
        currentPan = 0;
        document.getElementById('zoomSlider').value = 1;
        document.getElementById('zoomLevel').textContent = '1.0x';
        applyFilters();
    });
}

/* ============================================
   FILTER APPLICATION
   ============================================ */

/**
 * Apply current filters to the dataset and redraw the chart
 * Filters by PI count and updates the display information
 */
function applyFilters() {
    if (allProposalsData.length === 0) return;

    let filteredData = [...allProposalsData];

    // Filter by PI name if not showing all
    if (currentFilter.piName !== 'all') {
        filteredData = filteredData.filter(p =>
            p.pis.some(pi => pi.name === currentFilter.piName)
        );
    }

    // Filter by PI count if not showing all
    if (currentFilter.piCount !== 'all') {
        const targetCount = parseInt(currentFilter.piCount);
        filteredData = filteredData.filter(p => p.pis.length === targetCount);
    }

    // Update filter information display
    const filterInfo = document.getElementById('filterInfo');
    filterInfo.textContent = `Showing ${filteredData.length}/${allProposalsData.length} proposals`;

    // Redraw chart with filtered data
    drawChart(filteredData);
}

/* ============================================
   DATA LOADING
   ============================================ */

/**
 * Load the default dataset.xlsx file
 * Fetches and processes the Excel file on initial page load
 */
function loadDefaultDataset() {
    fetch('data/dataset.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error('dataset.xlsx file not found');
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            console.log("📊 Loaded sheet:", firstSheetName);
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                cellDates: true,
                defval: "",
                raw: false  // Get formatted values
            });

            processDataAndDraw(jsonData);
        })
        .catch(error => {
            console.error('❌ Error loading dataset.xlsx:', error);
            d3.select("#chart").html(`
                <div class='p-4 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg'>
                    <strong>⚠️ dataset.xlsx file not found</strong>
                    <p class='mt-2 text-sm'>Please place the <code>dataset.xlsx</code> file in the same directory as <code>index.html</code> or upload a new file.</p>
                </div>
            `);
        });
}

/**
 * Handle file upload event
 * Supports both Excel (.xlsx, .xls) and CSV (.csv) files
 */
document.getElementById('uploadFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    // Handle Excel files
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.onload = function (event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Assume data is in the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            console.log("Read sheet:", firstSheetName);
            // Convert sheet to JSON
            // cellDates: true converts Excel date columns to JS Date objects
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { cellDates: true, defval: "" });

            processDataAndDraw(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }
    // Handle CSV files
    else if (fileName.endsWith('.csv')) {
        reader.onload = function (event) {
            const text = event.target.result;
            const data = d3.csvParse(text);
            processDataAndDraw(data);
        };
        reader.readAsText(file);
    }
    else {
        alert("Please select a file in .xlsx, .xls, or .csv format");
    }
});

/* ============================================
   DATA PROCESSING
   ============================================ */

/**
 * Process raw data and draw the visualization
 * Handles data normalization, grouping by proposal, and date parsing
 * 
 * @param {Array<Object>} rawData - Raw data from Excel/CSV file
 * 
 * Expected columns in raw data:
 * - proposal_no: Unique proposal identifier
 * - date_submitted: Submission date (various formats supported)
 * - PI: Principal Investigator name
 * - title: Proposal title
 * - theme: Research theme/category
 * - sponsor: Funding sponsor
 * - credit: PI credit allocation
 * - first: First-year funding amount
 * - total: Total funding amount
 */
function processDataAndDraw(rawData) {
    // Clear existing chart and legend
    d3.select("#chart").html("");
    d3.select("#legend").html("");

    // --- DATA NORMALIZATION ---
    const groupedProposals = new Map();

    rawData.forEach((d, index) => {
        // Parse date: supports string (CSV), Date object (Excel), and Excel serial number
        let year = null;
        let dateStr = d.date_submitted;

        if (dateStr instanceof Date && !isNaN(dateStr)) {
            // Date object from Excel (parsed by SheetJS)
            year = dateStr.getFullYear();
        } else if (typeof dateStr === 'number') {
            // Excel serial date (days since 1900-01-01)
            const excelDate = new Date((dateStr - 25569) * 86400 * 1000);
            year = excelDate.getFullYear();
        } else if (typeof dateStr === 'string' && dateStr.trim()) {
            // Try various string formats
            dateStr = dateStr.trim();

            // Format: YYYY-MM-DD or YYYY/MM/DD
            if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(dateStr)) {
                year = parseInt(dateStr.substring(0, 4));
            }
            // Format: MM/DD/YYYY or MM-DD-YYYY
            else if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(dateStr)) {
                year = parseInt(dateStr.split(/[-\/]/).pop());
            }
            // Try parsing as Date
            else {
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj.getTime())) {
                    year = dateObj.getFullYear();
                } else {
                    // Fallback: Find 4-digit year in string (19xx or 20xx)
                    const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) {
                        year = parseInt(yearMatch[0]);
                    }
                }
            }
        }

        if (!year || year < 1900 || year > 2100) {
            console.warn(`⚠️ Row ${index + 1}: Cannot parse year. date_submitted="${dateStr}", proposal_no="${d.proposal_no}"`);
            return; // Skip if no valid year
        }

        // Debug logging (only first 3 rows)
        if (index < 3) {
            console.log(`✓ Row ${index + 1}: ${d.proposal_no} → Year: ${year} (from "${dateStr}")`);
        }

        // Create proposal entry if it doesn't exist
        if (!groupedProposals.has(d.proposal_no)) {
            // Store Date object for accurate sorting
            let dateObj = null;
            if (dateStr instanceof Date && !isNaN(dateStr)) {
                dateObj = dateStr;
            } else if (typeof dateStr === 'string' && dateStr.trim()) {
                dateObj = new Date(dateStr);
                if (isNaN(dateObj.getTime())) dateObj = null;
            }

            groupedProposals.set(d.proposal_no, {
                proposal_no: d.proposal_no,
                title: d.title,
                year: year,
                date: dateObj,
                dateStr: dateStr instanceof Date ? dateStr.toISOString().split('T')[0] : dateStr,
                theme: d.theme || "Other",
                sponsor: d.sponsor,
                pis: []
            });
        }

        /**
         * Parse numeric values from string or number format
         * Handles currency symbols, commas, and whitespace
         * @param {string|number} val - Value to parse
         * @returns {number} Parsed number or 0 if invalid
         */
        const parseNumber = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                // Remove commas, whitespace, currency symbols
                const cleaned = val.replace(/[,$\s]/g, '');
                const num = parseFloat(cleaned);
                return isNaN(num) ? 0 : num;
            }
            return 0;
        };

        // Add PI information to proposal
        groupedProposals.get(d.proposal_no).pis.push({
            name: d.PI ? String(d.PI).trim() : "Unknown",
            credit: parseNumber(d.credit),
            first: parseNumber(d.first),
            total: parseNumber(d.total)
        });
    });

    const proposals = Array.from(groupedProposals.values());

    // Log dataset statistics
    console.log(`\n📈 Total proposals after processing: ${proposals.length}`);
    console.log(`📅 Year range: ${Math.min(...proposals.map(p => p.year))} - ${Math.max(...proposals.map(p => p.year))}`);
    console.log(`👥 Unique PIs: ${new Set(proposals.flatMap(p => p.pis.map(pi => pi.name))).size}`);

    // Calculate PI counts per proposal
    const piCounts = proposals.map(p => p.pis.length);
    const maxPICount = Math.max(...piCounts);
    console.log(`🔢 PIs per proposal: min=${Math.min(...piCounts)}, max=${maxPICount}`);

    // Setup slider range: 0 = All, 1-maxPICount = specific PI count
    const piCountFilter = document.getElementById('piCountFilter');
    const piCountLabel = document.getElementById('piCountLabel');
    piCountFilter.max = maxPICount;
    piCountFilter.value = 0;
    piCountLabel.textContent = 'All';

    // Populate PI name filter dropdown
    const piNameFilter = document.getElementById('piNameFilter');
    const uniquePINames = Array.from(new Set(proposals.flatMap(p => p.pis.map(pi => pi.name)))).sort();

    // Store current selection before destroying
    const currentSelection = currentFilter.piName || 'all';

    // Destroy existing Select2 if it exists
    if ($(piNameFilter).hasClass('select2-hidden-accessible')) {
        $(piNameFilter).select2('destroy');
    }

    // Clear existing options except "All PIs"
    piNameFilter.innerHTML = '<option value="all">All PIs</option>';

    // Add each PI as an option
    uniquePINames.forEach(piName => {
        const option = document.createElement('option');
        option.value = piName;
        option.textContent = piName;
        piNameFilter.appendChild(option);
    });

    // Initialize Select2 for searchable dropdown
    $(piNameFilter).select2({
        placeholder: 'Select a PI...',
        allowClear: true,
        width: '250px'
    });

    // Attach event listener using jQuery (for Select2 compatibility) - BEFORE setting value
    $(piNameFilter).off('change').on('change', function (e) {
        if (isUpdatingFilter) {
            console.log('Skipping filter update (already updating)');
            return;
        }
        
        const selectedValue = $(this).val();
        console.log('PI Filter changed to:', selectedValue);
        
        isUpdatingFilter = true;
        currentFilter.piName = selectedValue;
        console.log('currentFilter.piName:', currentFilter.piName);
        
        // Get the selected option text BEFORE applying filters
        const selectedOption = $(this).find('option:selected');
        const selectedText = selectedOption.text();
        console.log('Selected option text:', selectedText);
        
        // Apply filters
        applyFilters();
        
        // Force update Select2 UI after a brief delay to ensure it sticks
        setTimeout(() => {
            // Manually update the displayed text
            $('#select2-piNameFilter-container')
                .text(selectedText)
                .attr('title', selectedText);
            
            console.log('Manually updated Select2 DOM to:', selectedText);
            console.log('Select2 DOM title:', $('#select2-piNameFilter-container').attr('title'));
            
            isUpdatingFilter = false;
        }, 50);
    });

    // Restore previous selection (if the PI still exists in new data)
    console.log('Restoring selection. Current:', currentSelection);
    
    // Use change.select2 to update UI only, not trigger full change event
    isUpdatingFilter = true;
    if (currentSelection !== 'all' && uniquePINames.includes(currentSelection)) {
        console.log('Restoring PI selection:', currentSelection);
        $(piNameFilter).val(currentSelection);
    } else {
        console.log('Setting PI to "all"');
        $(piNameFilter).val('all');
        currentFilter.piName = 'all';
    }
    
    // Force Select2 to update its display - use plain 'change' event but with flag to prevent handler
    $(piNameFilter).trigger('change.select2');
    
    // Also manually update the displayed text in case Select2 doesn't pick it up
    const selectedOption = $(piNameFilter).find('option:selected');
    $('#select2-piNameFilter-container')
        .text(selectedOption.text())
        .attr('title', selectedOption.text());
    
    isUpdatingFilter = false;

    // Log sample proposals (first 3)
    console.log("\n📋 Sample proposals (first 3):");
    proposals.slice(0, 3).forEach(p => {
        console.log(`  - ${p.proposal_no} (${p.year}, ${p.dateStr}): ${p.title.substring(0, 50)}...`);
        console.log(`    PIs: ${p.pis.map(pi => `${pi.name} (credit=${pi.credit}, first=$${pi.first}, total=$${pi.total})`).join(', ')}`);
    });

    // Store original data
    allProposalsData = proposals;

    // Only reset filters on initial load (not when uploading new data with existing filter)
    if (currentFilter.piCount === undefined) {
        currentFilter.piCount = 'all';
    }
    // piName is handled in the Select2 initialization above

    document.getElementById('filterInfo').textContent = `Showing ${proposals.length}/${proposals.length} proposals`;

    // Validate data
    if (proposals.length === 0) {
        d3.select("#chart").html(`
            <div class='p-4 text-red-500 bg-red-50 border border-red-200 rounded-lg'>
                <strong>No valid data found!</strong>
                <p class='mt-2 text-sm'>Please check:</p>
                <ul class='list-disc ml-5 mt-1 text-sm'>
                    <li>File has columns: <code>proposal_no</code>, <code>date_submitted</code>, <code>PI</code></li>
                    <li>Column <code>date_submitted</code> has valid date format (e.g., 2021-08-27)</li>
                    <li>Open Console (F12) for detailed information</li>
                </ul>
            </div>
        `);
        return;
    }

    // Draw chart with all data initially
    drawChart(proposals);
}

/* ============================================
   CHART DRAWING
   ============================================ */

/**
 * Draw the main TimeArc visualization
 * Creates an interactive D3.js chart with proposals as vertical arcs connecting PIs
 * 
 * @param {Array<Object>} proposals - Array of proposal objects to visualize
 * 
 * Chart Structure:
 * - X-axis: Time (years/quarters/months depending on zoom)
 * - Y-axis: PI names (sorted by number of proposals)
 * - Visual elements: Vertical lines connecting collaborating PIs per proposal
 * - Interactions: Zoom, pan, hover tooltips, filtering
 */
function drawChart(proposals) {
    // Clear existing chart and legend
    d3.select("#chart").html("");
    d3.select("#legend").html("");

    // Handle empty filtered dataset
    if (proposals.length === 0) {
        d3.select("#chart").html(`
            <div class='p-4 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg'>
                <strong>⚠️ No proposals match the current filter</strong>
                <p class='mt-2 text-sm'>Try changing the filter or reset to default.</p>
            </div>
        `);
        return;
    }

    // --- DATA PREPARATION ---

    // Get unique PIs and count proposals
    const piStats = new Map();
    proposals.forEach(p => {
        p.pis.forEach(pi => {
            piStats.set(pi.name, (piStats.get(pi.name) || 0) + 1);
        });
    });

    // Build collaboration matrix: count how many times each pair of PIs work together
    const collaborationMatrix = new Map();
    proposals.forEach(p => {
        const piNames = p.pis.map(pi => pi.name);
        // For each pair of PIs in this proposal
        for (let i = 0; i < piNames.length; i++) {
            for (let j = i + 1; j < piNames.length; j++) {
                const pi1 = piNames[i];
                const pi2 = piNames[j];
                const key = [pi1, pi2].sort().join('|||');
                collaborationMatrix.set(key, (collaborationMatrix.get(key) || 0) + 1);
            }
        }
    });

    // Helper function to get collaboration count between two PIs
    const getCollaboration = (pi1, pi2) => {
        const key = [pi1, pi2].sort().join('|||');
        return collaborationMatrix.get(key) || 0;
    };

    /**
     * Sort PIs to place collaborators near each other using improved algorithm
     * This creates a linear arrangement where PIs with more collaborations are closer together
     * If filtering by a specific PI, sort by collaboration count with that PI
     */
    const allPIs = Array.from(piStats.keys());

    let sortedPIs = [];

    // If filtering by a specific PI, use special sorting
    if (currentFilter.piName !== 'all') {
        const filteredPI = currentFilter.piName;

        // Calculate collaboration count with the filtered PI for all other PIs
        const collabWithFilteredPI = new Map();
        allPIs.forEach(pi => {
            if (pi !== filteredPI) {
                collabWithFilteredPI.set(pi, getCollaboration(filteredPI, pi));
            }
        });

        // Sort: filtered PI first, then others by collaboration count (descending)
        sortedPIs = [filteredPI].concat(
            allPIs
                .filter(pi => pi !== filteredPI)
                .sort((a, b) => {
                    const collabA = collabWithFilteredPI.get(a);
                    const collabB = collabWithFilteredPI.get(b);
                    // Sort by collaboration count descending, then by proposal count
                    if (collabB !== collabA) {
                        return collabB - collabA;
                    }
                    return piStats.get(b) - piStats.get(a);
                })
        );
    } else {
        // Original greedy algorithm for no filter
        const totalCollabs = new Map();
        allPIs.forEach(pi => {
            let total = 0;
            allPIs.forEach(otherPI => {
                if (pi !== otherPI) {
                    total += getCollaboration(pi, otherPI);
                }
            });
            totalCollabs.set(pi, total);
        });

        const remaining = new Set(allPIs);

        // Start with the PI with most collaborations
        let currentPI = allPIs.reduce((a, b) => totalCollabs.get(b) > totalCollabs.get(a) ? b : a);
        sortedPIs.push(currentPI);
        remaining.delete(currentPI);

        // Greedy algorithm: Always add the PI with strongest collaboration to any PI already in the sorted list
        while (remaining.size > 0) {
            let bestPI = null;
            let bestScore = -1;
            let bestPosition = -1;

            // For each remaining PI, find the best position to insert it
            for (const pi of remaining) {
                // Calculate collaboration score with each position
                for (let pos = 0; pos <= sortedPIs.length; pos++) {
                    let score = 0;

                    // Score based on collaboration with neighbors
                    if (pos > 0) {
                        // Collaboration with left neighbor
                        score += getCollaboration(pi, sortedPIs[pos - 1]) * 10;
                    }
                    if (pos < sortedPIs.length) {
                        // Collaboration with right neighbor
                        score += getCollaboration(pi, sortedPIs[pos]) * 10;
                    }

                    // Bonus: collaboration with nearby PIs (within 3 positions)
                    const range = 3;
                    for (let i = Math.max(0, pos - range); i < Math.min(sortedPIs.length, pos + range); i++) {
                        if (i !== pos - 1 && i !== pos) {
                            const distance = Math.abs(i - pos) + 1;
                            score += getCollaboration(pi, sortedPIs[i]) / distance;
                        }
                    }

                    // Update best if this score is higher
                    if (score > bestScore) {
                        bestScore = score;
                        bestPI = pi;
                        bestPosition = pos;
                    }
                }
            }

            // If no collaboration found, add the PI with most proposals at the end
            if (bestScore === 0) {
                const remainingArray = Array.from(remaining).sort((a, b) =>
                    piStats.get(b) - piStats.get(a)
                );
                bestPI = remainingArray[0];
                bestPosition = sortedPIs.length;
            }

            // Insert the PI at the best position
            sortedPIs.splice(bestPosition, 0, bestPI);
            remaining.delete(bestPI);
        }
    }

    const uniquePIs = sortedPIs;

    // Get unique themes for color coding
    const themes = Array.from(new Set(proposals.map(d => d.theme))).sort();
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(themes);

    // --- DIMENSIONS & SCALES ---

    const margin = { top: 80, right: 50, bottom: 50, left: 200 };

    /**
     * Calculate dynamic Y positions for PIs based on collaboration
     * - PIs with more collaborations are placed closer together
     * - Distance between consecutive PIs = n_proposals × 10px (if collaborating) or 100px (if not)
     */
    const piYPositions = new Map();
    let currentY = margin.top + 40; // Add extra spacing after year label

    uniquePIs.forEach((pi, index) => {
        piYPositions.set(pi, currentY);

        // Calculate distance to next PI (if not last)
        if (index < uniquePIs.length - 1) {
            const nextPI = uniquePIs[index + 1];
            const collaborations = getCollaboration(pi, nextPI);

            // Distance formula:
            // - If they collaborate: distance = collaborations × 10px
            // - If they don't collaborate: distance = 100px
            const distance = collaborations > 0 ? collaborations * 10 : 100;
            currentY += distance;
        }
    });

    // Total height based on actual positions
    const height = Math.max(600, currentY + margin.bottom + 50);
    const width = document.getElementById('chart').clientWidth; // Full width

    // Y Scale: Custom scale using calculated positions
    const yScale = (piName) => piYPositions.get(piName);

    // X Scale: Time (year)
    const yearExtent = d3.extent(proposals, d => d.year);
    // Extend range by 1 year on each side for spacing
    const xScale = d3.scaleLinear()
        .domain([yearExtent[0] - 1, yearExtent[1] + 1])
        .range([margin.left, width - margin.right]);

    // Store original scale for zoom transformations
    xScaleOriginal = xScale.copy();

    // Apply current zoom if active
    if (currentZoom.k !== 1) {
        const domain = xScale.domain();
        const center = (domain[0] + domain[1]) / 2;
        const range = (domain[1] - domain[0]) / currentZoom.k;
        xScale.domain([center - range / 2, center + range / 2]);
    }

    // --- SVG SETUP ---

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; cursor: grab;");

    // Define clip-path to prevent proposals from overlapping PI labels
    svg.append("defs")
        .append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

    /**
     * Add drag behavior for horizontal panning
     * Allows users to pan the timeline left/right by dragging
     */
    const drag = d3.drag()
        .on("start", function () {
            svg.style("cursor", "grabbing");
        })
        .on("drag", function (event) {
            // Update pan offset
            const previousPan = currentPan;
            currentPan += event.dx;

            // Check if pan exceeds boundaries
            const domain = xScaleOriginal.domain();
            const center = (domain[0] + domain[1]) / 2;
            const range = (domain[1] - domain[0]) / currentZoom.k;
            const panOffset = -currentPan / ((width - margin.left - margin.right) / (domain[1] - domain[0]));

            const newDomainStart = center - range / 2 + panOffset;
            const newDomainEnd = center + range / 2 + panOffset;

            // Limit pan to year boundaries (with buffer)
            const minYear = yearExtent[0] - 1;
            const maxYear = yearExtent[1] + 1;

            if (newDomainStart < minYear || newDomainEnd > maxYear) {
                // Revert pan if it exceeds boundaries
                currentPan = previousPan;
                return;
            }

            updateChartWithZoom();
        })
        .on("end", function () {
            svg.style("cursor", "grab");
        });

    svg.call(drag);

    // Create container groups for layered rendering (order matters for z-index)
    const chartGroup = svg.append("g")
        .attr("clip-path", "url(#chart-clip)");
    const axisGroup = svg.append("g");
    const proposalsGroup = svg.append("g")
        .attr("clip-path", "url(#chart-clip)"); // Proposals layer on top

    /**
     * Update chart visualization based on current zoom/pan state
     * Recalculates scale domain and updates all visual elements
     * 
     * Time Axis Formatting:
     * - Zoom < 1.5x: Show years only
     * - Zoom 1.5x-4.5x: Show quarters (Q1/2023)
     * - Zoom >= 4.5x: Show months (01/2023)
     */
    function updateChartWithZoom() {
        // Apply zoom and pan to scale
        const domain = xScaleOriginal.domain();
        const center = (domain[0] + domain[1]) / 2;
        const range = (domain[1] - domain[0]) / currentZoom.k;

        // Calculate pan offset in domain units
        const panOffset = -currentPan / ((width - margin.left - margin.right) / (domain[1] - domain[0]));

        // Calculate new domain with zoom and pan
        let newDomainStart = center - range / 2 + panOffset;
        let newDomainEnd = center + range / 2 + panOffset;

        // Limit domain to year boundaries
        const minYear = yearExtent[0] - 1;
        const maxYear = yearExtent[1] + 1;

        // Adjust if exceeds boundaries
        if (newDomainStart < minYear) {
            const shift = minYear - newDomainStart;
            newDomainStart = minYear;
            newDomainEnd += shift;
        }
        if (newDomainEnd > maxYear) {
            const shift = newDomainEnd - maxYear;
            newDomainEnd = maxYear;
            newDomainStart -= shift;
        }

        // Apply constrained domain
        xScale.domain([newDomainStart, newDomainEnd]);

        // Determine tick format based on zoom level
        let tickFormatter, customTicks;
        const currentDomain = xScale.domain();

        if (currentZoom.k >= 4.5) {
            // High zoom: show months (MM/YYYY)
            customTicks = [];
            const startYear = Math.floor(currentDomain[0]);
            const endYear = Math.ceil(currentDomain[1]);

            for (let year = startYear; year <= endYear; year++) {
                for (let month = 0; month < 12; month++) {
                    const fractionalYear = year + month / 12;
                    if (fractionalYear >= currentDomain[0] && fractionalYear <= currentDomain[1]) {
                        customTicks.push(fractionalYear);
                    }
                }
            }

            tickFormatter = (d) => {
                const year = Math.floor(d);
                const month = Math.round((d - year) * 12) + 1;
                return `${String(month).padStart(2, '0')}/${year}`;
            };
        } else if (currentZoom.k >= 1.5) {
            // Medium zoom: show quarters
            customTicks = [];
            const startYear = Math.floor(currentDomain[0]);
            const endYear = Math.ceil(currentDomain[1]);

            for (let year = startYear; year <= endYear; year++) {
                for (let quarter = 0; quarter < 4; quarter++) {
                    const fractionalYear = year + quarter / 4;
                    if (fractionalYear >= currentDomain[0] && fractionalYear <= currentDomain[1]) {
                        customTicks.push(fractionalYear);
                    }
                }
            }

            tickFormatter = (d) => {
                const year = Math.floor(d);
                const quarter = Math.floor((d - year) * 4) + 1;
                return `Q${quarter}/${year}`;
            };
        } else {
            // Low zoom: show years only
            customTicks = null; // Use default ticks
            tickFormatter = d3.format("d");
        }

        // Update X axis - top
        const topAxis = customTicks
            ? d3.axisTop(xScale).tickValues(customTicks).tickFormat(tickFormatter)
            : d3.axisTop(xScale).tickFormat(tickFormatter);

        axisGroup.select(".x-axis-top")
            .call(topAxis)
            .selectAll("text")
            .attr("class", "axis-text")
            .style("font-weight", "bold")
            .style("font-size", currentZoom.k >= 3 ? "10px" : "12px");

        // Update X axis - bottom
        const bottomAxis = customTicks
            ? d3.axisBottom(xScale).tickValues(customTicks).tickFormat(tickFormatter)
            : d3.axisBottom(xScale).tickFormat(tickFormatter);

        axisGroup.select(".x-axis-bottom")
            .call(bottomAxis)
            .selectAll("text")
            .attr("class", "axis-text")
            .style("font-size", currentZoom.k >= 3 ? "10px" : "12px");

        // Update grid lines
        const newTicks = xScale.ticks();
        chartGroup.select(".grid").selectAll(".grid-line")
            .data(newTicks)
            .join("line")
            .attr("class", "grid-line")
            .attr("x1", d => xScale(d))
            .attr("x2", d => xScale(d))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .attr("stroke", "#f1f5f9");

        // Update proposal positions based on fractional year
        proposalsGroup.selectAll(".proposal-group").each(function (d) {
            const group = d3.select(this);
            const newX = xScale(d.fractionalYear);

            // Update nodes
            group.selectAll("circle")
                .attr("cx", newX);

            // Update arcs (elegant cubic bezier curves)
            group.selectAll(".proposal-arc").each(function () {
                const arc = d3.select(this);
                const pathData = arc.attr("d");

                // Parse the cubic bezier path
                const pathMatch = pathData.match(/M ([\d.]+),([\d.]+) C ([\d.]+),([\d.]+) ([\d.]+),([\d.]+) ([\d.]+),([\d.]+)/);
                if (pathMatch) {
                    const y1 = parseFloat(pathMatch[2]);
                    const y2 = parseFloat(pathMatch[8]);
                    const distance = Math.abs(y2 - y1);
                    const arcWidth = Math.min(distance * 0.35, 80);

                    // Recreate smooth arc with new X position
                    const controlX1 = newX + arcWidth * 0.5;
                    const controlY1 = y1 + (y2 - y1) * 0.2;
                    const controlX2 = newX + arcWidth * 0.5;
                    const controlY2 = y2 - (y2 - y1) * 0.2;

                    const newPathData = `M ${newX},${y1} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${newX},${y2}`;
                    arc.attr("d", newPathData);
                }
            });
        });
    }

    // --- DRAW AXES & GRID ---

    // Vertical grid lines (time axis)
    const xTicks = xScale.ticks(yearExtent[1] - yearExtent[0] + 2);
    chartGroup.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(xTicks)
        .join("line")
        .attr("class", "grid-line")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#f1f5f9");

    // X Axis (Years) - Top
    const xAxis = d3.axisTop(xScale).tickFormat(d3.format("d")).ticks(xTicks.length);
    axisGroup.append("g")
        .attr("class", "x-axis-top")
        .attr("transform", `translate(0, ${margin.top})`)
        .call(xAxis)
        .selectAll("text")
        .attr("class", "axis-text")
        .style("font-weight", "bold");

    // X Axis (Years) - Bottom (for easier viewing with long PI lists)
    const xAxisBottom = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(xTicks.length);
    axisGroup.append("g")
        .attr("class", "x-axis-bottom")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxisBottom)
        .selectAll("text")
        .attr("class", "axis-text");

    // Y Axis (PI Names) - Horizontal lines for visual guidance
    const piLinesGroup = axisGroup.append("g");
    piLinesGroup.selectAll("line")
        .data(uniquePIs)
        .join("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#f8fafc")
        .attr("stroke-width", 1);

    // Apply zoom formatting if zoomed
    if (currentZoom.k !== 1) {
        updateChartWithZoom();
    }

    /**
     * PI Labels on Y-axis
     * Clickable labels that highlight all proposals involving that PI
     */
    const piLabelsGroup = axisGroup.append("g")
        .selectAll("text")
        .data(uniquePIs)
        .join("text")
        .attr("class", "pi-label")
        .attr("x", margin.left - 10)
        .attr("y", d => yScale(d))
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .text(d => d)
        .on("mouseenter", function (event, piName) {
            // Find all PIs that collaborate with the hovered PI
            const collaboratingPIs = new Set();
            collaboratingPIs.add(piName); // Include the PI itself

            // Find all proposals involving this PI and collect collaborators
            proposals.forEach(p => {
                const hasPi = p.pis.some(pi => pi.name === piName);
                if (hasPi) {
                    // Add all PIs from this proposal
                    p.pis.forEach(pi => collaboratingPIs.add(pi.name));
                }
            });

            // Highlight/dim PI labels based on collaboration
            piLabelsGroup.style("font-weight", function (d) {
                return collaboratingPIs.has(d) ? "bold" : "normal";
            })
                .style("opacity", function (d) {
                    return collaboratingPIs.has(d) ? 1 : 0.2;
                })
                .style("fill", function (d) {
                    return collaboratingPIs.has(d) ? "#0f172a" : "#cbd5e1";
                });

            // Highlight all proposals involving this PI
            proposalGroups.each(function (d) {
                const group = d3.select(this);
                const hasPi = d.pis.some(pi => pi.name === piName);

                if (hasPi) {
                    group.classed("highlighted", true);
                    group.classed("dimmed", false);
                } else {
                    group.classed("highlighted", false);
                    group.classed("dimmed", true);
                }
            });

            // Show summary tooltip for this PI
            const piProposals = proposals.filter(p => p.pis.some(pi => pi.name === piName));
            const totalProposals = piProposals.length;
            const years = piProposals.map(p => p.year).sort((a, b) => a - b);
            const yearRange = years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : 'N/A';
            const collaboratorCount = collaboratingPIs.size - 1; // Exclude the PI itself

            tooltip.style("opacity", 1);
            tooltip.html(`
                <h4>${piName}</h4>
                <div class="text-xs text-slate-600 mt-2">
                    <div><strong>Total Proposals:</strong> ${totalProposals}</div>
                    <div><strong>Collaborators:</strong> ${collaboratorCount} PIs</div>
                    <div><strong>Active Years:</strong> ${yearRange}</div>
                    <div class="mt-2 text-slate-500 italic">Hover over arcs for proposal details</div>
                </div>
            `);
        })
        .on("mousemove", function (event) {
            const tooltipW = tooltip.node().offsetWidth;
            let left = event.pageX + 15;
            let top = event.pageY + 15;
            if (left + tooltipW > window.innerWidth) {
                left = event.pageX - tooltipW - 15;
            }
            tooltip.style("left", left + "px").style("top", top + "px");
        })
        .on("mouseleave", function () {
            // Reset PI label styles
            piLabelsGroup.style("font-weight", "normal")
                .style("opacity", 1)
                .style("fill", "#334155");

            // Remove all highlights
            proposalGroups.classed("highlighted", false);
            proposalGroups.classed("dimmed", false);
            tooltip.style("opacity", 0);
        });

    // --- DRAW LEGEND ---

    const legendContainer = d3.select("#legend");
    themes.forEach(theme => {
        const item = legendContainer.append("div")
            .attr("class", "flex items-center space-x-2");

        item.append("span")
            .style("width", "12px")
            .style("height", "12px")
            .style("background-color", colorScale(theme))
            .style("border-radius", "50%")
            .style("display", "inline-block");

        item.append("span")
            .text(theme || "Unknown");
    });

    // --- DRAW PROPOSALS ---

    /**
     * Calculate fractional year from date for precise positioning
     * Converts date to decimal year (e.g., July 1, 2020 = 2020.5)
     * 
     * @param {Object} proposal - Proposal object with date property
     * @returns {number} Fractional year (e.g., 2020.5 for mid-year)
     */
    const getFractionalYear = (proposal) => {
        if (proposal.date && !isNaN(proposal.date.getTime())) {
            const year = proposal.date.getFullYear();
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            const yearProgress = (proposal.date - startOfYear) / (endOfYear - startOfYear);
            return year + yearProgress;
        }
        // Fallback: if no date, return mid-year
        return proposal.year + 0.5;
    };

    // Sort proposals by actual date (not just year)
    proposals.sort((a, b) => {
        if (a.date && b.date) {
            return a.date - b.date;
        } else if (a.date) {
            return -1;
        } else if (b.date) {
            return 1;
        }
        // Fallback: sort by year, then by proposal_no
        if (a.year !== b.year) return a.year - b.year;
        return a.proposal_no.localeCompare(b.proposal_no);
    });

    // Calculate X position for each proposal based on actual date
    proposals.forEach(p => {
        const fractionalYear = getFractionalYear(p);
        p.x = xScale(fractionalYear);
        p.fractionalYear = fractionalYear; // Store for zoom updates
    });

    // Create proposal groups in proposalsGroup (on top layer)
    const proposalGroups = proposalsGroup.append("g")
        .selectAll("g")
        .data(proposals)
        .join("g")
        .attr("class", "proposal-group");

    /**
     * Draw proposal arcs connecting PIs using TimeArcs style
     * Creates horizontal curved arcs between all pairs of PIs in each proposal
     */
    proposalGroups.each(function (d) {
        const group = d3.select(this);
        const color = colorScale(d.theme);
        const x = d.x;

        const piData = d.pis.map(pi => ({
            name: pi.name,
            y: yScale(pi.name),
            pi: pi
        })).filter(p => p.y !== undefined);

        if (piData.length === 0) return;

        // Sort PIs by Y position (top to bottom)
        piData.sort((a, b) => a.y - b.y);

        if (piData.length === 1) {
            // Single PI: draw a circle marker
            group.append("circle")
                .attr("class", "proposal-node single-pi")
                .attr("cx", x)
                .attr("cy", piData[0].y)
                .attr("r", 4)
                .attr("fill", color)
                .attr("fill-opacity", 0.8)
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 1.5);
        } else {
            // Multiple PIs: draw elegant horizontal arcs between ALL pairs
            for (let i = 0; i < piData.length; i++) {
                for (let j = i + 1; j < piData.length; j++) {
                    const source = piData[i];
                    const target = piData[j];

                    const y1 = source.y;
                    const y2 = target.y;
                    const midY = (y1 + y2) / 2;
                    const distance = Math.abs(y2 - y1);

                    // Arc width: shorter arcs for cleaner visualization
                    const arcWidth = Math.min(distance * 0.35, 80);

                    // Create smooth arc using cubic bezier curve
                    const controlX1 = x + arcWidth * 0.5;
                    const controlY1 = y1 + (y2 - y1) * 0.2;
                    const controlX2 = x + arcWidth * 0.5;
                    const controlY2 = y2 - (y2 - y1) * 0.2;
                    const endX = x;

                    // Symmetrical arc path
                    const pathData = `M ${x},${y1} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${y2}`;

                    group.append("path")
                        .attr("class", "proposal-arc")
                        .attr("d", pathData)
                        .attr("stroke", color)
                        .attr("stroke-width", 1.0)
                        .attr("stroke-opacity", 0.5)
                        .attr("fill", "none")
                        .attr("stroke-linecap", "round")
                        .style("cursor", "pointer");
                }
            }

            // Draw nodes at each PI position with size based on number of PIs
            const nodeRadius = piData.length > 3 ? 3 : 3.5;
            piData.forEach(p => {
                group.append("circle")
                    .attr("class", "proposal-node multi-pi")
                    .attr("cx", x)
                    .attr("cy", p.y)
                    .attr("r", nodeRadius)
                    .attr("fill", color)
                    .attr("fill-opacity", 0.9)
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 1.0)
                    .style("cursor", "pointer");
            });
        }
    });

    // --- INTERACTION HANDLERS ---

    const tooltip = d3.select("#tooltip");

    /**
     * Attach hover events to proposal arcs and nodes
     * Shows detailed tooltip with proposal information and PI details
     * If multiple proposals share the same date AND have common PIs, shows all of them
     */
    proposalsGroup.selectAll(".proposal-arc, .proposal-node").on("mouseenter", function (event) {
        const d = d3.select(this.parentNode).datum();

        // Get PI names in the current proposal
        const currentPINames = new Set(d.pis.map(pi => pi.name));

        // Find all proposals with the same date AND at least one common PI
        const sameDateProposals = proposals.filter(p => {
            // Check if same date
            let isSameDate = false;
            if (d.date && p.date) {
                // Compare dates (same day)
                isSameDate = d.date.toDateString() === p.date.toDateString();
            } else if (d.dateStr && p.dateStr) {
                // Fallback: compare date strings
                isSameDate = d.dateStr === p.dateStr;
            }

            if (!isSameDate) return false;

            // Check if has at least one common PI
            const proposalPINames = new Set(p.pis.map(pi => pi.name));
            const hasCommonPI = [...currentPINames].some(pi => proposalPINames.has(pi));

            return hasCommonPI;
        });

        // If only one proposal on this date, use original behavior
        // If multiple proposals, show all of them
        const proposalsToShow = sameDateProposals.length > 1 ? sameDateProposals : [d];

        // Collect all PI names from all proposals being shown
        const allPINames = new Set();
        proposalsToShow.forEach(proposal => {
            proposal.pis.forEach(pi => allPINames.add(pi.name));
        });

        // Highlight all proposal groups with the same date
        proposalGroups.each(function (p) {
            const group = d3.select(this);
            const isSameDate = proposalsToShow.some(prop => prop.proposal_no === p.proposal_no);

            if (isSameDate) {
                group.selectAll(".proposal-arc")
                    .attr("stroke-width", 3)
                    .attr("stroke-opacity", 0.8);

                group.selectAll(".proposal-node")
                    .attr("r", 5)
                    .attr("stroke-width", 2.5);
            }
        });

        // Highlight PI labels involved in these proposals
        piLabelsGroup.style("font-weight", function (piName) {
            return allPINames.has(piName) ? "bold" : "normal";
        })
            .style("opacity", function (piName) {
                return allPINames.has(piName) ? 1 : 0.2;
            })
            .style("fill", function (piName) {
                return allPINames.has(piName) ? "#0f172a" : "#cbd5e1";
            });

        tooltip.style("opacity", 1);

        /**
         * Format currency values for display
         * @param {number} val - Numeric value to format
         * @returns {string} Formatted currency string or '-' if invalid
         */
        const formatCurrency = val => val ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val) : '-';

        /**
         * Format date for display
         * @param {string} dateStr - Date string to format
         * @returns {string} Formatted date or 'N/A'
         */
        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return dateStr;
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        };

        // Build tooltip content for all proposals on the same date
        let content = '';

        // Show header if multiple proposals
        if (proposalsToShow.length > 1) {
            content += `<div class="mb-3 pb-2 border-b border-slate-200">
                <strong class="text-sm">${proposalsToShow.length} Proposals on ${formatDate(d.dateStr)}</strong>
            </div>`;
        }

        // Generate content for each proposal
        proposalsToShow.forEach((proposal, index) => {
            // Generate PI table rows for this proposal
            let piRows = proposal.pis.map(pi => `
                <tr>
                    <td><strong>${pi.name}</strong></td>
                    <td>${pi.credit}</td>
                    <td>${formatCurrency(pi.first)}</td>
                    <td>${formatCurrency(pi.total)}</td>
                </tr>
            `).join("");

            // Add separator between proposals
            if (index > 0) {
                content += `<div class="my-3 border-t border-slate-200"></div>`;
            }

            content += `
                <h4>${proposal.title}</h4>
                <div class="mb-2">
                    <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">${proposal.proposal_no}</span>
                </div>
                <div class="text-xs mb-2 text-slate-600">
                    ${proposalsToShow.length === 1 ? `<div><strong>Date Submitted:</strong> ${formatDate(proposal.dateStr)}</div>` : ''}
                    <div><strong>Sponsor:</strong> ${proposal.sponsor || 'N/A'}</div>
                    <div><strong>Theme:</strong> <span style="color:${colorScale(proposal.theme)}">${proposal.theme}</span></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>PI Name</th>
                            <th>Credit</th>
                            <th>First ($)</th>
                            <th>Total ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${piRows}
                    </tbody>
                </table>
            `;
        });

        tooltip.html(content);
    })
        .on("mousemove", function (event) {
            const tooltipW = tooltip.node().offsetWidth;

            let left = event.pageX + 15;
            let top = event.pageY + 15;

            // Keep tooltip within viewport
            if (left + tooltipW > window.innerWidth) {
                left = event.pageX - tooltipW - 15;
            }

            tooltip.style("left", left + "px")
                .style("top", top + "px");
        })
        .on("mouseleave", function () {
            // Reset all proposal arcs and nodes to default
            proposalGroups.selectAll(".proposal-arc")
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", 0.4);

            proposalGroups.selectAll(".proposal-node")
                .each(function () {
                    const node = d3.select(this);
                    const isSinglePI = node.classed("single-pi");
                    const radius = isSinglePI ? 4 : (node.classed("multi-pi") ? 3.5 : 3);
                    node.attr("r", radius).attr("stroke-width", 1.5);
                });

            // Reset PI label styles
            piLabelsGroup.style("font-weight", "normal")
                .style("opacity", 1)
                .style("fill", "#334155");

            tooltip.style("opacity", 0);
        });
}
