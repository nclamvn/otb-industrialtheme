# ExcelAI Integration Report for DAFC OTB Platform

**Generated:** 2026-01-27
**Scanned by:** THO (Claude Code)
**Project:** `/Users/mac/excelAI`

---

## 1. Tech Stack Analysis

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Framework |
| TypeScript | 5.3.0 | Type Safety |
| Vite | 5.0.0 | Build Tool |
| Zustand | 4.4.0 | State Management |
| TailwindCSS | 3.4.0 | Styling |
| Recharts | 3.6.0 | Charts/Visualization |
| XLSX | 0.18.5 | Excel Import/Export |
| PapaParse | 5.4.1 | CSV Parsing |
| Lucide React | 0.294.0 | Icons |
| React Dropzone | 14.2.3 | File Upload |
| IDB (IndexedDB) | 7.1.1 | Offline Storage |
| Workbox | 7.0.0 | PWA/Service Worker |
| Playwright | 1.57.0 | E2E Testing |
| Vitest | 4.0.17 | Unit Testing |

### Compatibility with DAFC OTB

| Aspect | ExcelAI | DAFC OTB | Compatibility |
|--------|---------|----------|---------------|
| React | 18.2.0 | 18.3.1 | Compatible |
| TypeScript | 5.3.0 | 5.x | Compatible |
| Zustand | 4.4.0 | (not used) | Can add |
| TailwindCSS | 3.4.0 | 3.4.0 | Compatible |
| XLSX | 0.18.5 | 0.18.5 | **Identical** |

---

## 2. Architecture Map

```
/Users/mac/excelAI/
├── src/                           # 600 TypeScript files
│   ├── ai/                        # AI Copilot Integration
│   │   ├── AIRuntime.ts           # Main AI orchestrator (668 lines)
│   │   ├── tools/                 # AI tool definitions (7 tools)
│   │   ├── context/               # Context assembly
│   │   ├── grounding/             # Source tracking & claims
│   │   ├── sandbox/               # Safe execution environment
│   │   └── types.ts               # AI type definitions
│   │
│   ├── engine/                    # Formula Engine
│   │   ├── FormulaParser.ts       # Parse formulas to AST
│   │   ├── FormulaEvaluator.ts    # Evaluate AST (492 lines)
│   │   └── functions/             # 162 Excel functions (6,480 lines)
│   │       ├── math.ts            # SUM, AVERAGE, etc.
│   │       ├── text.ts            # CONCAT, LEFT, RIGHT, etc.
│   │       ├── logical.ts         # IF, AND, OR, etc.
│   │       ├── date.ts            # DATE, NOW, WORKDAY, etc.
│   │       ├── statistical.ts     # STDEV, CORREL, etc.
│   │       ├── lookup.ts          # VLOOKUP, INDEX, MATCH, etc.
│   │       ├── financial.ts       # NPV, IRR, PRICE, etc.
│   │       ├── array.ts           # FILTER, SORT, UNIQUE, etc.
│   │       └── lambda.ts          # LET, LAMBDA, etc.
│   │
│   ├── nlformula/                 # Natural Language to Formula
│   │   ├── NLFormulaEngine.ts     # Main NL engine
│   │   ├── FormulaInterpreter.ts  # NL interpretation
│   │   ├── FormulaExplainer.ts    # Explain formulas in plain language
│   │   ├── FormulaSuggester.ts    # Auto-suggestions
│   │   └── FunctionLibrary.ts     # 94KB function documentation
│   │
│   ├── datacleaner/               # Data Cleaning Tools
│   │   ├── DataCleanerEngine.ts   # Main cleaner
│   │   ├── QualityAnalyzer.ts     # Data quality scoring
│   │   ├── DuplicateDetector.ts   # Find duplicates
│   │   ├── OutlierDetector.ts     # Statistical outliers
│   │   ├── MissingValueHandler.ts # Handle nulls/blanks
│   │   └── FormatStandardizer.ts  # Normalize formats
│   │
│   ├── macros/                    # Workflow Automation
│   │   ├── WorkflowExecutor.ts    # Execute workflows
│   │   └── types.ts               # 19 action types
│   │
│   ├── proactive/                 # Proactive AI Suggestions
│   │   ├── ProactiveEngine.ts     # Main orchestrator
│   │   ├── DataScanner.ts         # Scan data patterns
│   │   ├── InsightDetector.ts     # Detect insights
│   │   ├── FormulaOptimizer.ts    # Optimize formulas
│   │   └── PatternRecognizer.ts   # Recognize patterns
│   │
│   ├── autoviz/                   # Auto Visualization
│   │   ├── AutoVizEngine.ts       # Main viz engine
│   │   ├── ChartRecommender.ts    # Recommend chart types
│   │   ├── ChartGenerator.ts      # Generate charts
│   │   └── DashboardGenerator.ts  # Auto dashboards
│   │
│   ├── collaboration/             # Real-time Collaboration
│   │   ├── CRDTEngine.ts          # Conflict resolution
│   │   ├── WebSocketClient.ts     # Real-time sync
│   │   ├── PresenceManager.ts     # User presence
│   │   └── CommentManager.ts      # Cell comments
│   │
│   ├── stores/                    # Zustand State (39 stores)
│   │   ├── workbookStore.ts       # Main state (66KB)
│   │   ├── aiStore.ts             # AI state
│   │   ├── chartStore.ts          # Charts state
│   │   ├── pivotStore.ts          # Pivot tables
│   │   └── ... (35 more stores)
│   │
│   ├── components/                # UI Components (55 groups)
│   │   ├── AI/                    # AI Copilot UI (27 files)
│   │   ├── Charts/                # Chart components
│   │   ├── DataCleaner/           # Data cleaning UI
│   │   ├── Grid/                  # Spreadsheet grid
│   │   ├── PivotTable/            # Pivot table UI
│   │   ├── Macros/                # Workflow UI
│   │   ├── NLFormula/             # NL input UI
│   │   └── ... (48 more groups)
│   │
│   ├── utils/                     # Utilities
│   │   └── excelIO.ts             # Import/Export Excel/CSV
│   │
│   └── types/                     # Type Definitions
│       ├── cell.ts                # Cell data types
│       ├── pivot.ts               # Pivot types
│       └── visualization.ts       # Chart types
│
├── dist/                          # Production build (572KB JS, 568KB CSS)
├── package.json                   # Dependencies
└── vite.config.ts                 # Build configuration
```

---

## 3. Features Inventory

### Core Spreadsheet Features

| Feature | Status | Description |
|---------|--------|-------------|
| Cell Editing | 5/5 | Full cell editing with formulas |
| Formatting | 5/5 | Font, colors, borders, alignment |
| Number Formats | 5/5 | Currency, percentage, dates |
| Conditional Formatting | 5/5 | Rules-based highlighting |
| Data Validation | 5/5 | Input restrictions |
| Freeze Panes | 5/5 | Freeze rows/columns |
| Named Ranges | 5/5 | Named cell references |
| Find & Replace | 5/5 | Search with regex |
| Undo/Redo | 5/5 | Full history |
| Print | 5/5 | Page layout, preview |

### Formula Engine

| Category | Functions | Examples |
|----------|-----------|----------|
| Math | 30+ | SUM, AVERAGE, ROUND, SUMIF |
| Text | 25+ | CONCAT, LEFT, MID, SUBSTITUTE |
| Logical | 10+ | IF, AND, OR, IFS, SWITCH |
| Date | 20+ | DATE, WORKDAY, EOMONTH |
| Lookup | 15+ | VLOOKUP, INDEX, MATCH, XLOOKUP |
| Statistical | 30+ | STDEV, CORREL, FORECAST |
| Financial | 25+ | NPV, IRR, PMT, PRICE |
| Array | 15+ | FILTER, SORT, UNIQUE |
| Lambda | 5+ | LET, LAMBDA, MAP |
| **Total** | **162 functions** | |

### Charts & Visualization

| Chart Type | Status |
|------------|--------|
| Bar Chart | Horizontal & Vertical |
| Line Chart | With markers |
| Area Chart | Stacked/100% |
| Pie Chart | With labels |
| Scatter Chart | With trendlines |
| Combo Chart | Mixed types |
| Sparklines | Line, column, win/loss |
| **Total: 19 chart types** | |

### AI Features

| Feature | Status | Description |
|---------|--------|-------------|
| AI Copilot | 5/5 | Chat interface with Claude API |
| NL to Formula | 4/5 | Convert text to formulas |
| Formula Explainer | 5/5 | Explain formulas in plain language |
| Proactive Suggestions | 5/5 | Auto-suggest actions |
| Data Cleaning | 5/5 | Quality analysis, duplicates, outliers |
| Auto Visualization | 5/5 | Recommend & generate charts |
| Context Grounding | 5/5 | Track data sources for claims |

### Advanced Features

| Feature | Status | Description |
|---------|--------|-------------|
| Pivot Tables | 5/5 | Full CRUD, slicers, timelines |
| Macros/Workflows | 5/5 | 19 action types, scheduling |
| Collaboration | 4/5 | CRDT, presence (needs WebSocket server) |
| Offline Mode | 4/5 | IndexedDB persistence |
| PWA | 4/5 | Installable, service worker |

---

## 4. Excel Capabilities Detail

### Import/Export

```typescript
// From: src/utils/excelIO.ts

// IMPORT
importExcelFile(file: File): Promise<ImportResult>
importCSVFile(file: File): Promise<ImportResult>

// EXPORT
exportToExcel(sheets, sheetOrder, fileName): void
exportToCSV(sheet, fileName): void
```

### Supported Formats

| Format | Import | Export |
|--------|--------|--------|
| .xlsx | Yes | Yes |
| .xls | Yes | No |
| .csv | Yes | Yes |
| .tsv | Yes | Yes |
| .pdf | No | Yes (via macros) |

---

## 5. AI Capabilities Detail

### AI Tools (7 tools)

```typescript
// From: src/ai/tools/index.ts

AI_TOOLS = [
  'read_range',      // Read cells/formulas
  'write_range',     // Write values (requires approval)
  'get_dependencies', // Cell precedents/dependents
  'search_cells',    // Find cells by value/formula
  'propose_action',  // Propose changes for approval
  'get_sheet_info',  // Get sheet metadata
  'get_selection',   // Get current selection
]
```

### AI Runtime Features

- **Context Assembly**: Smart token budgeting
- **Grounding**: Track cell reads, formulas, claims
- **Source Tracking**: Know where data came from
- **Auto-Approve**: Low-risk actions auto-execute
- **Streaming**: Real-time response streaming

### Natural Language Processing

```typescript
// From: src/nlformula/NLFormulaEngine.ts

class NLFormulaEngine {
  interpret(input: NLInput): Promise<InterpretationResult>
  explain(formula, context, language): Promise<FormulaExplanation>
  debug(formula, error, context): Promise<DebugResult>
  suggest(partialInput, cursorPosition, context): Promise<SuggestionResult>
  detectLanguage(input): 'en' | 'vi'  // Supports Vietnamese!
}
```

---

## 6. API Interface

### Main Exports

```typescript
// Stores (Zustand)
import { useWorkbookStore } from 'excelAI/stores/workbookStore'
import { useAIStore } from 'excelAI/stores/aiStore'
import { useChartStore } from 'excelAI/stores/chartStore'

// Engines
import { AIRuntime, getAIRuntime } from 'excelAI/ai/AIRuntime'
import { NLFormulaEngine } from 'excelAI/nlformula/NLFormulaEngine'
import { DataCleanerEngine } from 'excelAI/datacleaner/DataCleanerEngine'
import { ProactiveEngine } from 'excelAI/proactive/ProactiveEngine'
import { AutoVizEngine } from 'excelAI/autoviz/AutoVizEngine'

// Utils
import { importExcelFile, exportToExcel } from 'excelAI/utils/excelIO'

// Types
import type { CellData, Sheet } from 'excelAI/types/cell'
import type { ChartType } from 'excelAI/types/visualization'
```

---

## 7. Integration Assessment

### Compatibility Matrix

| Aspect | Compatibility | Notes |
|--------|---------------|-------|
| React Version | HIGH | Both use React 18 |
| TypeScript | HIGH | Both use TS 5.x |
| Build System | MEDIUM | ExcelAI uses Vite, DAFC uses Next.js |
| State Management | MEDIUM | ExcelAI uses Zustand, DAFC uses React Query |
| Excel Library | HIGH | Both use xlsx 0.18.5 |
| Styling | HIGH | Both use Tailwind 3.4 |
| API Structure | LOW | ExcelAI is frontend-only, DAFC has NestJS backend |

### Integration Effort Estimate

| Component | Effort | Complexity |
|-----------|--------|------------|
| Formula Engine | Low | Can embed directly |
| Excel Import/Export | Low | Already compatible |
| NL Formula Engine | Medium | Needs API key management |
| Data Cleaner | Medium | Needs backend integration |
| AI Copilot | High | Needs backend proxy for API keys |
| Charts | Medium | Component adaptation |
| Collaboration | High | Needs WebSocket server |

---

## 8. Integration Strategies

### Strategy 1: Full Embed (Monolith)

**Description**: Embed ExcelAI as a module within DAFC OTB monorepo

```
dafc-otb-monorepo/
├── packages/
│   ├── excelai/           # NEW: ExcelAI as internal package
│   │   ├── src/
│   │   └── package.json
│   ├── shared/
│   └── database/
```

**Pros**:
- Full control over code
- Can customize deeply
- Shared dependencies

**Cons**:
- Large codebase increase (600 files)
- Maintenance burden
- May have conflicts

### Strategy 2: NPM Package

**Description**: Publish ExcelAI as npm package, install in DAFC

```bash
npm install @dafc/excelai
```

**Pros**:
- Clean separation
- Version control
- Easy updates

**Cons**:
- Less customization
- Need to publish/maintain package
- Build complexity

### Strategy 3: Micro-Frontend (iframe)

**Description**: Run ExcelAI as separate app, embed via iframe

```tsx
<iframe src="http://localhost:5173" />
```

**Pros**:
- Complete isolation
- Independent deployment
- No conflicts

**Cons**:
- Communication overhead
- Larger bundle
- User experience gaps

### Strategy 4: Selective Import (Recommended)

**Description**: Extract only needed modules from ExcelAI

**Phase 1 - Core Features**:
- Formula Engine (src/engine/)
- Excel Import/Export (src/utils/excelIO.ts)
- NL Formula Engine (src/nlformula/)

**Phase 2 - Data Tools**:
- Data Cleaner (src/datacleaner/)
- Auto Viz (src/autoviz/)

**Phase 3 - AI Features**:
- AI Runtime (src/ai/)
- Proactive Engine (src/proactive/)

**Pros**:
- Minimal footprint
- Only what you need
- Gradual adoption

**Cons**:
- Manual extraction
- May miss dependencies
- Version sync issues

---

## 9. Dependency Conflicts

### Potential Conflicts

| Package | ExcelAI | DAFC OTB | Resolution |
|---------|---------|----------|------------|
| react | 18.2.0 | 18.3.1 | Use DAFC version |
| react-dom | 18.2.0 | 18.3.1 | Use DAFC version |
| typescript | 5.3.0 | 5.x | Compatible |
| xlsx | 0.18.5 | 0.18.5 | No conflict |
| tailwindcss | 3.4.0 | 3.4.0 | No conflict |
| recharts | 3.6.0 | Not used | Add to DAFC |
| zustand | 4.4.0 | Not used | Add to DAFC |
| lucide-react | 0.294.0 | 0.x | Check version |

### Missing in DAFC (Need to Install)

```bash
pnpm add zustand @tanstack/react-virtual recharts file-saver papaparse idb
pnpm add -D @types/file-saver @types/papaparse
```

---

## 10. Integration Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Extract Formula Engine as package
- [ ] Extract Excel I/O utilities
- [ ] Create `packages/excelai-core/`
- [ ] Add tests for formula functions
- [ ] Integrate basic import in SKU Proposals

### Phase 2: Data Tools (Week 2)

- [ ] Extract Data Cleaner
- [ ] Extract NL Formula Engine
- [ ] Create `packages/excelai-tools/`
- [ ] Add data validation pipeline
- [ ] Integrate with OTB data validation

### Phase 3: AI Features (Week 3-4)

- [ ] Set up AI proxy in NestJS backend
- [ ] Extract AI Runtime
- [ ] Extract Proactive Engine
- [ ] Create `packages/excelai-ai/`
- [ ] Integrate AI suggestions in OTB planning

### Phase 4: Full Integration (Week 5-6)

- [ ] Extract Auto Viz
- [ ] Extract Chart components
- [ ] Integrate with Analytics dashboards
- [ ] Add collaboration features (optional)
- [ ] Performance optimization

---

## 11. Use Cases in DAFC OTB

### 1. SKU Proposal Import

```typescript
// Use ExcelAI's enhanced import for SKU data
import { importExcelFile } from '@dafc/excelai-core'
import { DataCleanerEngine } from '@dafc/excelai-tools'

// Import Excel with validation
const result = await importExcelFile(file)
const cleaner = new DataCleanerEngine()
const cleaned = await cleaner.process(result.sheets[0])
```

### 2. OTB Planning with Formulas

```typescript
// Use formula engine for OTB calculations
import { FormulaEvaluator } from '@dafc/excelai-core'

// Calculate OTB metrics
const formula = '=SUM(Sales)-SUM(Stock)+SUM(OnOrder)'
const result = evaluator.evaluate(parse(formula), context)
```

### 3. Budget Analysis with AI

```typescript
// Use AI for budget insights
import { getAIRuntime } from '@dafc/excelai-ai'

const ai = getAIRuntime()
ai.setApiKey(process.env.CLAUDE_API_KEY)

const response = await ai.sendMessage(
  'Analyze budget allocation and suggest optimization'
)
```

### 4. Natural Language Queries

```typescript
// Allow users to query data with natural language
import { NLFormulaEngine } from '@dafc/excelai-tools'

const engine = new NLFormulaEngine()
const result = await engine.interpret({
  text: 'tổng doanh thu tháng 1', // Vietnamese support!
  language: 'auto',
  context: cellContext
})
// result.formula = '=SUMIF(Month, "Jan", Revenue)'
```

### 5. Auto Visualization

```typescript
// Auto-generate charts for reports
import { AutoVizEngine } from '@dafc/excelai-tools'

const viz = new AutoVizEngine()
const recommendation = await viz.recommend(salesData)
// recommendation.chartType = 'bar'
// recommendation.config = { ... }
```

---

## 12. Executive Summary

### Project Stats

| Metric | Value |
|--------|-------|
| Total Files | 600 TypeScript files |
| Lines of Code | ~50,000+ |
| Test Coverage | 1,878 tests passing |
| Bundle Size | 572KB JS, 568KB CSS |
| Formula Functions | 162 |
| Chart Types | 19 |
| AI Tools | 7 |
| Zustand Stores | 39 |

### Recommendation

**RECOMMENDED STRATEGY: Selective Import (Strategy 4)**

**Reasons**:
1. ExcelAI has many features DAFC doesn't need (collaboration, full spreadsheet UI)
2. Formula Engine alone is 6,480 lines of production-ready code
3. NL Formula supports Vietnamese - great for DAFC users
4. Data Cleaner is perfect for SKU import validation
5. Can adopt incrementally without big-bang migration

**Immediate Value**:
- Replace/enhance existing Excel import with 162 formulas
- Add NL query capability to OTB planning
- Improve data validation with quality analysis
- Add AI-powered suggestions for budget optimization

**Technical Fit**:
- Both use React 18, TypeScript 5, Tailwind 3.4
- Both use xlsx 0.18.5 for Excel handling
- ExcelAI's Zustand stores can coexist with React Query
- AI features need backend proxy (NestJS can handle)

---

## Next Steps

1. **Review this report** with Kiến trúc sư
2. **Decide on strategy** (recommend Strategy 4)
3. **Create Integration Blueprint** with specific modules
4. **Generate CODER PACKs** for implementation
5. **Begin Phase 1** extraction

---

*Report generated by THO (Claude Code) for DAFC OTB Platform integration project.*
