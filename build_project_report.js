// Build GEHU-format Project Report as .docx
// Times New Roman, A4 portrait, 1.5 line spacing, justified body,
// chapter-wise figure/table numbering.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, PageOrientation, HeadingLevel, BorderStyle, WidthType,
  ShadingType, SectionType, PageBreak, TabStopType, TabStopPosition,
  Footer, Header, PageNumber, VerticalAlign,
} = require('docx');

const ROOT = __dirname;
const OUT  = path.join(ROOT, "Project_Report.docx");
const FONT = "Times New Roman";

// ---- constants (docx uses half-points for size, 20ths of a point for spacing) ----
const SZ_BODY        = 24;   // 12pt
const SZ_SUB         = 24;   // 12pt (sub-heading)
const SZ_MAIN        = 28;   // 14pt (main heading)
const SZ_CHAPTER     = 32;   // 16pt (chapter heading)
const SZ_TITLE_BIG   = 44;   // 22pt cover title
const SZ_TITLE_MID   = 32;   // 16pt cover subtitle
const LINE_15        = 360;  // 1.5 line spacing (240 = single, 360 = 1.5)
const INDENT_FL      = 288;  // 0.2" first-line indent (720 DXA per inch / 5 = 144? actually 0.2*1440/10 ... 1 inch = 1440 twips; 0.2" = 288 twips)

// ---- paragraph helpers ----
const T = (text, opts = {}) => new TextRun({ text, font: FONT, size: SZ_BODY, ...opts });

const bodyP = (text, extra = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: LINE_15 },
  indent: { firstLine: INDENT_FL },
  children: Array.isArray(text) ? text : [T(text)],
  ...extra,
});

const plainP = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { after: 80, line: LINE_15 },
  children: Array.isArray(text) ? text : [T(text, opts)],
});

const centerP = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80, line: LINE_15 },
  children: Array.isArray(text) ? text : [T(text, opts)],
});

const blank = (after = 120) => new Paragraph({ spacing: { after }, children: [T("")] });

// Chapter heading (16 pt BOLD UPPERCASE centered on its own page)
const chapterHeading = (num, title) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({
      text: `CHAPTER ${num}`, font: FONT, size: SZ_CHAPTER, bold: true,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    children: [new TextRun({
      text: title.toUpperCase(), font: FONT, size: SZ_CHAPTER, bold: true,
    })],
  }),
];

// Main heading (14 pt BOLD UPPERCASE)
const mainHeading = (num, title) => new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 240, after: 120, line: LINE_15 },
  keepNext: true,
  children: [new TextRun({
    text: `${num}  ${title.toUpperCase()}`, font: FONT, size: SZ_MAIN, bold: true,
  })],
});

// Sub-heading (12 pt bold, sentence case)
const subHeading = (num, title) => new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 180, after: 100, line: LINE_15 },
  keepNext: true,
  children: [new TextRun({
    text: `${num}  ${title}`, font: FONT, size: SZ_SUB, bold: true,
  })],
});

// Image paragraph + caption (chapter-wise numbering)
const figureImage = (filePath, widthPx = 480, heightPx = 300) => {
  if (!fs.existsSync(filePath)) {
    console.warn("MISSING FIG:", filePath);
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [T(`[Missing image: ${path.basename(filePath)}]`, { italics: true, color: "AA0000" })],
    });
  }
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [new ImageRun({
      data: fs.readFileSync(filePath),
      transformation: { width: widthPx, height: heightPx },
    })],
  });
};

const figureCaption = (num, title) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 60, after: 200, line: LINE_15 },
  children: [
    new TextRun({ text: `Fig. ${num}  `, font: FONT, size: SZ_BODY, bold: true, italics: true }),
    new TextRun({ text: title, font: FONT, size: SZ_BODY, italics: true }),
  ],
});

const tableCaption = (num, title) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 120, line: LINE_15 },
  children: [
    new TextRun({ text: `Table ${num}  `, font: FONT, size: SZ_BODY, bold: true, italics: true }),
    new TextRun({ text: title, font: FONT, size: SZ_BODY, italics: true }),
  ],
});

// ---- table helpers ----
const BORDER = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const cell = (text, { bold = false, shade = null, align = AlignmentType.LEFT } = {}) =>
  new TableCell({
    borders: CELL_BORDERS,
    shading: shade ? { type: ShadingType.CLEAR, fill: shade } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      spacing: { before: 40, after: 40, line: 240 },
      children: [new TextRun({ text: String(text), font: FONT, size: SZ_BODY, bold })],
    })],
  });

const makeTable = (rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: rows.map((r, i) => new TableRow({
    tableHeader: i === 0,
    children: r.map((c, j) => cell(c, {
      bold: i === 0,
      shade: i === 0 ? "D9E2F3" : null,
      align: j === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
    })),
  })),
});

// Code paragraph (Courier)
const codeLine = (text) => new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { after: 0, line: 240 },
  children: [new TextRun({ text, font: "Courier New", size: 20 })],
});

// ========================================================================
// COVER PAGE
// ========================================================================
const logoTop = fs.existsSync(path.join(ROOT, "logos", "image1.jpeg"))
  ? new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new ImageRun({
        data: fs.readFileSync(path.join(ROOT, "logos", "image1.jpeg")),
        transformation: { width: 110, height: 110 },
      })],
    })
  : centerP("[ GEHU LOGO ]");

const logoBottom = fs.existsSync(path.join(ROOT, "logos", "image2.png"))
  ? new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new ImageRun({
        data: fs.readFileSync(path.join(ROOT, "logos", "image2.png")),
        transformation: { width: 380, height: 110 },
      })],
    })
  : centerP("[ GEHU BANNER ]");

const cover = [
  logoTop,
  centerP("A PROJECT REPORT", { bold: true, size: SZ_TITLE_MID }),
  centerP("on", { italics: true, size: SZ_BODY }),
  blank(200),
  centerP("AI-POWERED FRAUD DETECTION &", { bold: true, size: SZ_TITLE_BIG }),
  centerP("PREVENTION ECOSYSTEM WITH", { bold: true, size: SZ_TITLE_BIG }),
  centerP("ROBOTIC PROCESS AUTOMATION (RPA)", { bold: true, size: SZ_TITLE_BIG }),
  blank(200),
  centerP("Submitted in partial fulfilment of the requirements for the award of the degree of", { size: SZ_BODY }),
  centerP("BACHELOR OF TECHNOLOGY", { bold: true, size: SZ_TITLE_MID }),
  centerP("in", { italics: true, size: SZ_BODY }),
  centerP("COMPUTER SCIENCE & ENGINEERING", { bold: true, size: SZ_SUB }),
  centerP("(Hons. with Machine Learning and Artificial Intelligence)", { italics: true, size: SZ_BODY }),
  blank(160),
  centerP("Submitted by", { size: SZ_BODY }),
  centerP("ROHAN THAKUR   (Roll No. 2318035)", { bold: true, size: SZ_SUB }),
  centerP("YOGESH KUMAR   (Roll No. 2220041)", { bold: true, size: SZ_SUB }),
  centerP("VARNIT SAINI   (Roll No. 2219887)", { bold: true, size: SZ_SUB }),
  centerP("Group No. 318", { bold: true, size: SZ_BODY }),
  blank(160),
  centerP("Under the supervision of", { size: SZ_BODY }),
  centerP("Mrs. Neha Pokhriyal", { bold: true, size: SZ_SUB }),
  centerP("Assistant Professor, Department of Computer Science & Engineering", { italics: true, size: SZ_BODY }),
  blank(160),
  logoBottom,
  centerP("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", { bold: true, size: SZ_BODY }),
  centerP("GRAPHIC ERA HILL UNIVERSITY, DEHRADUN", { bold: true, size: SZ_BODY }),
  centerP("MAY 2026", { bold: true, size: SZ_SUB }),
];

// ========================================================================
// CANDIDATE'S DECLARATION
// ========================================================================
const declaration = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "CANDIDATE'S DECLARATION", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  bodyP("We hereby certify that the work which is being presented in the project report entitled \"AI-Powered Fraud Detection & Prevention Ecosystem with Robotic Process Automation (RPA)\" in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in Computer Science & Engineering (Hons. with Machine Learning and Artificial Intelligence), submitted to the Department of Computer Science & Engineering, Graphic Era Hill University, Dehradun, is an authentic record of our own work carried out during the period from August 2025 to May 2026 under the supervision of Mrs. Neha Pokhriyal, Assistant Professor, Department of Computer Science & Engineering."),
  bodyP("The matter presented in this report has not been submitted by us for the award of any other degree of this or any other University."),
  blank(200),
  plainP("Signature of Students:"),
  blank(120),
  plainP("Rohan Thakur                 (Roll No. 2318035)"),
  plainP("Yogesh Kumar               (Roll No. 2220041)"),
  plainP("Varnit Saini                    (Roll No. 2219887)"),
  blank(300),
  bodyP("This is to certify that the above statement made by the candidates is correct to the best of my knowledge."),
  blank(240),
  plainP("Date: ____________", { }),
  plainP("Place: Dehradun", { }),
  blank(240),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Mrs. Neha Pokhriyal", font: FONT, size: SZ_BODY, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Assistant Professor", font: FONT, size: SZ_BODY, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Department of CSE, GEHU, Dehradun", font: FONT, size: SZ_BODY, italics: true })],
  }),
];

// ========================================================================
// ACKNOWLEDGEMENT
// ========================================================================
const acknowledgement = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "ACKNOWLEDGEMENT", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  bodyP("The completion of this project would not have been possible without the support, guidance and encouragement of many people, and we take this opportunity to record our sincere thanks to all of them."),
  bodyP("First and foremost, we express our deepest gratitude to our project guide, Mrs. Neha Pokhriyal, Assistant Professor, Department of Computer Science & Engineering, Graphic Era Hill University, Dehradun, for her invaluable guidance, constant encouragement, patient review of our drafts and the freedom she gave us to explore our own ideas. Her technical insight into machine learning and her insistence on a clean working prototype shaped the direction and quality of this work."),
  bodyP("We are thankful to the Head of Department and the faculty members of the Department of Computer Science & Engineering for their support, the well-equipped laboratory facilities and the learning environment that allowed us to attempt a project of this scope. We also acknowledge the Graphic Era Hill University administration for providing the infrastructure necessary for our experimentation, including access to the Kaggle cloud environment for model training."),
  bodyP("We are grateful to the IEEE-CIS Fraud Detection dataset contributors on Kaggle, and to the authors of the open-source libraries scikit-learn, XGBoost, LightGBM, SHAP, FastAPI and React, whose tools made this project possible."),
  bodyP("We sincerely thank our parents and family members for their unwavering moral support, patience and motivation throughout this academic journey. Finally, we thank our classmates and friends who gave us useful feedback during our internal reviews and helped us test the live dashboard before submission."),
  blank(240),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Rohan Thakur", font: FONT, size: SZ_BODY, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Yogesh Kumar", font: FONT, size: SZ_BODY, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "Varnit Saini", font: FONT, size: SZ_BODY, bold: true })],
  }),
];

// ========================================================================
// ABSTRACT
// ========================================================================
const abstract = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "ABSTRACT", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  bodyP("Financial fraud continues to cause very large losses every year, and manual review alone cannot keep pace with the growth in digital transactions. Traditional rule-based detection systems generate high false-positive rates and are easily bypassed once their thresholds are learned, while post-detection response workflows such as customer notification, case creation and regulatory reporting remain largely manual, slow and inconsistent. This project presents an end-to-end AI-powered fraud detection and prevention ecosystem that combines supervised machine learning with Robotic Process Automation (RPA) to close both of these gaps in a single integrated pipeline."),
  bodyP("Four tree-based classifiers — LightGBM, XGBoost, Random Forest and AdaBoost — were trained and evaluated on the IEEE-CIS Fraud Detection dataset, which contains 590,540 transactions and 471 engineered features after preprocessing. The severe class imbalance in the dataset (only 3.5% fraud) was addressed using the Synthetic Minority Over-sampling Technique (SMOTE), applied only to the training partition to prevent data leakage. On the held-out test set, XGBoost delivered the best overall performance with an F1-score of 0.6762, a precision of 0.8935, a recall of 0.5440 and an AUC-ROC of 0.9522. SHAP (SHapley Additive exPlanations) values were computed for every prediction to identify the features that drove each decision, giving analysts an interpretable reason for every alert instead of an opaque risk score."),
  bodyP("The trained model is deployed through a FastAPI backend, and a React-based analyst dashboard enables live transaction entry, prediction review and SHAP visualisation. When the predicted fraud probability crosses 0.5, four Python RPA bots are triggered automatically in sequence: an Alert Bot that dispatches SMS and email to the customer, a Case Bot that opens a ticket in a SQLite case-management database with queue routing by risk level, a Report Bot that generates an RBI Suspicious Transaction Report (STR), and a Logger Bot that records an immutable audit trail. The final system demonstrates a measurable improvement in both detection accuracy and response time over manual workflows, and establishes a reproducible architecture for deploying explainable, automated fraud detection in a realistic banking environment."),
  blank(160),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: LINE_15 },
    children: [
      new TextRun({ text: "Keywords: ", font: FONT, size: SZ_BODY, bold: true, italics: true }),
      new TextRun({
        text: "Fraud Detection, Machine Learning, XGBoost, SHAP, Explainable AI, Robotic Process Automation, SMOTE, FastAPI, React, Banking Analytics.",
        font: FONT, size: SZ_BODY, italics: true,
      }),
    ],
  }),
];

// ========================================================================
// TABLE OF CONTENTS (manual - since auto TOC field requires Word to update)
// ========================================================================
const tocRow = (title, page, { bold = false, indent = 0 } = {}) => new Paragraph({
  spacing: { after: 80, line: LINE_15 },
  indent: { left: indent },
  tabStops: [{ type: TabStopType.RIGHT, position: 9000 }],
  children: [
    new TextRun({ text: title, font: FONT, size: SZ_BODY, bold }),
    new TextRun({ text: "\t" + page, font: FONT, size: SZ_BODY, bold }),
  ],
});

const toc = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "TABLE OF CONTENTS", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  tocRow("Candidate's Declaration", "i", { bold: true }),
  tocRow("Acknowledgement", "ii", { bold: true }),
  tocRow("Abstract", "iii", { bold: true }),
  tocRow("Table of Contents", "iv", { bold: true }),
  tocRow("List of Figures", "vi", { bold: true }),
  tocRow("List of Tables", "vii", { bold: true }),
  tocRow("List of Abbreviations", "viii", { bold: true }),
  blank(120),
  tocRow("CHAPTER 1  INTRODUCTION", "1", { bold: true }),
  tocRow("1.1  Overview of the Problem Domain", "1", { indent: 360 }),
  tocRow("1.2  Motivation", "3", { indent: 360 }),
  tocRow("1.3  Problem Statement", "4", { indent: 360 }),
  tocRow("1.4  Objectives of the Project", "4", { indent: 360 }),
  tocRow("1.5  Scope and Limitations", "5", { indent: 360 }),
  tocRow("1.6  Organisation of the Report", "6", { indent: 360 }),
  tocRow("CHAPTER 2  LITERATURE REVIEW", "7", { bold: true }),
  tocRow("2.1  Traditional Rule-Based Fraud Detection", "7", { indent: 360 }),
  tocRow("2.2  Machine Learning Approaches to Fraud Detection", "8", { indent: 360 }),
  tocRow("2.3  Handling Class Imbalance", "9", { indent: 360 }),
  tocRow("2.4  Explainable AI and SHAP", "10", { indent: 360 }),
  tocRow("2.5  RPA in Banking Workflows", "11", { indent: 360 }),
  tocRow("2.6  Research Gap", "12", { indent: 360 }),
  tocRow("CHAPTER 3  SYSTEM ANALYSIS AND REQUIREMENTS", "13", { bold: true }),
  tocRow("3.1  Existing System Analysis", "13", { indent: 360 }),
  tocRow("3.2  Proposed System", "14", { indent: 360 }),
  tocRow("3.3  Feasibility Study", "15", { indent: 360 }),
  tocRow("3.4  Functional Requirements", "16", { indent: 360 }),
  tocRow("3.5  Non-Functional Requirements", "17", { indent: 360 }),
  tocRow("3.6  Hardware and Software Requirements", "18", { indent: 360 }),
  tocRow("CHAPTER 4  SYSTEM DESIGN AND METHODOLOGY", "19", { bold: true }),
  tocRow("4.1  System Architecture", "19", { indent: 360 }),
  tocRow("4.2  Data Flow Design", "20", { indent: 360 }),
  tocRow("4.3  Machine Learning Pipeline", "21", { indent: 360 }),
  tocRow("4.4  Use Case Design", "23", { indent: 360 }),
  tocRow("4.5  Database Schema (ER Diagram)", "24", { indent: 360 }),
  tocRow("4.6  RPA Workflow Design", "25", { indent: 360 }),
  tocRow("CHAPTER 5  IMPLEMENTATION AND RESULTS", "26", { bold: true }),
  tocRow("5.1  Implementation Environment", "26", { indent: 360 }),
  tocRow("5.2  Dashboard Implementation (Screenshots)", "27", { indent: 360 }),
  tocRow("5.3  Model Training Results", "30", { indent: 360 }),
  tocRow("5.4  SHAP Explainability Results", "31", { indent: 360 }),
  tocRow("5.5  RPA Execution Results", "32", { indent: 360 }),
  tocRow("5.6  Performance Analysis", "33", { indent: 360 }),
  tocRow("CHAPTER 6  CONCLUSION AND FUTURE WORK", "34", { bold: true }),
  tocRow("6.1  Conclusion", "34", { indent: 360 }),
  tocRow("6.2  Key Contributions", "34", { indent: 360 }),
  tocRow("6.3  Limitations", "35", { indent: 360 }),
  tocRow("6.4  Future Work", "35", { indent: 360 }),
  tocRow("REFERENCES", "37", { bold: true }),
  tocRow("LIST OF PUBLICATIONS", "39", { bold: true }),
  tocRow("APPENDIX A — SOURCE CODE EXCERPTS", "40", { bold: true }),
];

// ========================================================================
// LIST OF FIGURES
// ========================================================================
const lof = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "LIST OF FIGURES", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  tocRow("Fig. 1.1  Global Card Fraud Losses, 2015–2023", "2"),
  tocRow("Fig. 1.2  Indian Digital Payments vs. Reported Fraud Cases", "3"),
  tocRow("Fig. 4.1  System Architecture of the Fraud Detection Ecosystem", "19"),
  tocRow("Fig. 4.2  End-to-End Data Flow Diagram", "20"),
  tocRow("Fig. 4.3  Machine Learning Training and Inference Pipeline", "22"),
  tocRow("Fig. 4.4  Use Case Diagram for the Analyst Dashboard", "23"),
  tocRow("Fig. 4.5  Entity-Relationship Diagram of the Case Database", "24"),
  tocRow("Fig. 5.1  Dashboard Home Screen", "27"),
  tocRow("Fig. 5.2  Prediction Input Form", "27"),
  tocRow("Fig. 5.3  Fraud Detection Result with SHAP Explanation", "28"),
  tocRow("Fig. 5.4  Legitimate Transaction Result", "28"),
  tocRow("Fig. 5.5  Transactions History View", "29"),
  tocRow("Fig. 5.6  Alerts and Case Queue View", "29"),
  tocRow("Fig. 5.7  FastAPI Swagger — Prediction Request", "29"),
  tocRow("Fig. 5.8  FastAPI Swagger — Prediction Response", "30"),
  tocRow("Fig. 5.9  RPA Pipeline Terminal Output", "30"),
  tocRow("Fig. 5.10 Model Comparison Across Four Classifiers", "31"),
  tocRow("Fig. 5.11 Confusion Matrices of Trained Models", "31"),
  tocRow("Fig. 5.12 SHAP Global Feature Importance", "32"),
  tocRow("Fig. 5.13 SHAP Beeswarm Plot of Feature Impact", "32"),
];

// ========================================================================
// LIST OF TABLES
// ========================================================================
const lot = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "LIST OF TABLES", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  tocRow("Table 3.1  Comparison of Existing vs. Proposed System", "14"),
  tocRow("Table 3.2  Hardware and Software Requirements", "18"),
  tocRow("Table 5.1  Model Performance Comparison on Test Set", "30"),
  tocRow("Table 5.2  XGBoost Confusion Matrix", "31"),
  tocRow("Table 5.3  RPA Bot Execution Summary", "33"),
];

// ========================================================================
// LIST OF ABBREVIATIONS
// ========================================================================
const abbrRow = (abbr, full) => new Paragraph({
  spacing: { after: 60, line: LINE_15 },
  tabStops: [{ type: TabStopType.LEFT, position: 2000 }],
  children: [
    new TextRun({ text: abbr, font: FONT, size: SZ_BODY, bold: true }),
    new TextRun({ text: "\t" + full, font: FONT, size: SZ_BODY }),
  ],
});

const abbreviations = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "LIST OF ABBREVIATIONS", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  abbrRow("AI", "Artificial Intelligence"),
  abbrRow("API", "Application Programming Interface"),
  abbrRow("AUC", "Area Under the Curve"),
  abbrRow("CORS", "Cross-Origin Resource Sharing"),
  abbrRow("CSE", "Computer Science & Engineering"),
  abbrRow("CSV", "Comma-Separated Values"),
  abbrRow("DBMS", "Database Management System"),
  abbrRow("ER", "Entity-Relationship"),
  abbrRow("FIU-IND", "Financial Intelligence Unit — India"),
  abbrRow("GEHU", "Graphic Era Hill University"),
  abbrRow("HTTP", "HyperText Transfer Protocol"),
  abbrRow("IEEE", "Institute of Electrical and Electronics Engineers"),
  abbrRow("JSON", "JavaScript Object Notation"),
  abbrRow("KYC", "Know Your Customer"),
  abbrRow("ML", "Machine Learning"),
  abbrRow("NPCI", "National Payments Corporation of India"),
  abbrRow("RBI", "Reserve Bank of India"),
  abbrRow("REST", "Representational State Transfer"),
  abbrRow("ROC", "Receiver Operating Characteristic"),
  abbrRow("RPA", "Robotic Process Automation"),
  abbrRow("SHAP", "SHapley Additive exPlanations"),
  abbrRow("SMOTE", "Synthetic Minority Over-sampling Technique"),
  abbrRow("SQL", "Structured Query Language"),
  abbrRow("STR", "Suspicious Transaction Report"),
  abbrRow("UI", "User Interface"),
  abbrRow("UPI", "Unified Payments Interface"),
  abbrRow("URL", "Uniform Resource Locator"),
  abbrRow("XGBoost", "Extreme Gradient Boosting"),
];

// ========================================================================
// CHAPTER 1 — INTRODUCTION
// ========================================================================
const chapter1 = [
  ...chapterHeading("1", "Introduction"),
  mainHeading("1.1", "Overview of the Problem Domain"),
  bodyP("Digital payments have moved from a convenience to the default mode of transacting in most modern economies. India alone processed over 16,443 crore digital transactions in the financial year 2023–24, an almost fivefold rise over FY 2019–20, and a similar pattern is visible across emerging markets. Every new channel — cards, internet banking, mobile wallets and the Unified Payments Interface (UPI) — has expanded the surface on which financial fraud can be committed. The Nilson Report estimates worldwide card fraud losses at over 33 billion US dollars for 2023, and the Reserve Bank of India (RBI) has recorded a continuous year-on-year rise in reported card, internet and mobile banking frauds since 2019."),
  bodyP("Modern fraud rarely looks like a single obvious anomaly. It appears as a carefully chosen sequence of small transactions, as account takeovers that mimic normal customer behaviour, and as cross-channel attacks that no single rule can capture. Despite this, most production systems in mid-sized banks still rely heavily on fixed rules — transaction amount thresholds, velocity caps, country mismatches — and on a human analyst who investigates the flagged cases in an essentially manual workflow. The industry has recognised that this approach is no longer sustainable, both because fraudsters learn the rules and because the operational cost of manual review grows linearly with transaction volume."),
  figureImage(path.join(ROOT, "diagrams", "fig_1_1_global_fraud.png"), 480, 260),
  figureCaption("1.1", "Global Card Fraud Losses, 2015–2023 (USD Billion, Nilson Report)"),
  bodyP("Fig. 1.1 shows the steady increase in global card fraud losses over the last nine years. Even after accounting for chip-and-PIN adoption and tokenisation, the aggregate loss has risen by more than 50 per cent in the same period. Fig. 1.2 shows the parallel picture for India: the volume of digital transactions has almost quintupled while the number of reported fraud cases has grown by more than two and a half times in the same window. Both trends confirm that the problem cannot be solved by merely adding more human reviewers."),
  figureImage(path.join(ROOT, "diagrams", "fig_1_2_india_digital_vs_fraud.png"), 520, 280),
  figureCaption("1.2", "Indian Digital Payment Volume vs. Reported Fraud Cases, FY 2019-20 to FY 2023-24"),

  mainHeading("1.2", "Motivation"),
  bodyP("Two weaknesses show up repeatedly in current bank systems. The first is the detection layer itself. Rule-based engines flag anything that matches a fixed condition, for example a transaction above a threshold or a card used outside its usual country. Fraudsters learn these rules quickly and adapt around them, and legitimate customers are caught by them every day, creating high false-positive rates that damage the customer experience. The second weakness lies on the response side. Once a potential fraud is flagged, the downstream steps — notifying the customer, opening an internal case, filling a regulatory Suspicious Transaction Report (STR), and updating the audit log — are done manually by analysts. This pipeline is slow, expensive to staff, inconsistent across analysts, and introduces human error into regulatory filings."),
  bodyP("These two weaknesses are addressed by two independent fields of research and industry practice. Machine learning, particularly gradient boosting and deep tabular models, has proved in academic literature and commercial deployments that it can learn the complex non-linear boundaries that separate fraudulent from legitimate transactions. Robotic Process Automation, on the other hand, has become the standard way of automating structured, repetitive, rule-based back-office work in banks. However, in most existing work these two approaches are studied and deployed separately: a detection model is evaluated in isolation against a benchmark, and an RPA workflow automates a fixed process. The motivation for this project is to build a single integrated ecosystem in which detection, explanation and response are tightly joined into one working pipeline."),

  mainHeading("1.3", "Problem Statement"),
  bodyP("The core problem addressed by this project is:"),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160, line: LINE_15 },
    indent: { left: 720, right: 720 },
    children: [new TextRun({
      text: "To design and implement an end-to-end fraud detection and prevention ecosystem that (i) classifies incoming banking transactions as fraudulent or legitimate using supervised machine learning with high precision and AUC, (ii) provides a human-interpretable explanation for every decision, and (iii) automates the customer notification, case creation, regulatory reporting and audit logging workflows through Robotic Process Automation — all accessible through a unified analyst dashboard.",
      font: FONT, size: SZ_BODY, italics: true,
    })],
  }),

  mainHeading("1.4", "Objectives of the Project"),
  bodyP("The specific objectives of this project are defined as follows:"),
  plainP("1.  To perform detailed preprocessing and exploratory analysis of the IEEE-CIS Fraud Detection dataset and handle its severe class imbalance using SMOTE on the training partition."),
  plainP("2.  To train and evaluate at least four supervised classifiers — LightGBM, XGBoost, Random Forest and AdaBoost — and select the best performer based on F1-score, precision, recall and AUC-ROC."),
  plainP("3.  To integrate SHAP (SHapley Additive exPlanations) into the prediction pipeline so that every classification decision is accompanied by the top contributing features."),
  plainP("4.  To expose the trained model through a RESTful FastAPI backend with a well-defined JSON contract suitable for integration with real banking systems."),
  plainP("5.  To build a React-based analyst dashboard for live transaction entry, prediction review, SHAP visualisation, transaction history and case alert queue."),
  plainP("6.  To design and implement four Python RPA bots — Alert, Case, Report and Logger — that are triggered automatically by the API when the predicted fraud probability crosses 0.5."),
  plainP("7.  To evaluate the full ecosystem end-to-end on detection performance, latency and correctness of the automated workflow."),

  mainHeading("1.5", "Scope and Limitations"),
  bodyP("The scope of the project includes the complete software pipeline: data preprocessing, model training, model evaluation, API deployment, dashboard development, RPA bot orchestration and an end-to-end working demo. Evaluation is performed on the public IEEE-CIS Fraud Detection dataset; the system is not deployed inside any real banking environment, and the RPA bots simulate external actions rather than actually sending SMS/email or filing STRs with FIU-IND. The alert and report bots generate realistic artefacts (text files, database rows, STR-format reports) that could be swapped with real integrations (Twilio, SMTP gateways, FIU-IND APIs) without architectural changes. The dataset used is English and dollar-denominated; deployment in an Indian rupee environment would require retraining on local transaction data but the architecture is locale-independent."),

  mainHeading("1.6", "Organisation of the Report"),
  bodyP("The remainder of this report is organised as follows. Chapter 2 reviews the relevant literature on rule-based fraud detection, machine-learning approaches, class-imbalance handling, explainable AI and RPA in banking, and concludes by identifying the research gap that this project addresses. Chapter 3 analyses the existing system, defines the proposed system, performs a feasibility study and enumerates the functional, non-functional, hardware and software requirements. Chapter 4 describes the system architecture, data flow, machine learning pipeline, use cases and database schema through a series of diagrams. Chapter 5 presents the implementation of the dashboard, the model training results on the IEEE-CIS dataset, the SHAP explainability output and the RPA execution results, supported by screenshots and performance tables. Chapter 6 concludes with the contributions of this work, its limitations and directions for future research. The report ends with a list of references, a list of publications and an appendix containing key source-code excerpts."),
];

// ========================================================================
// CHAPTER 2 — LITERATURE REVIEW
// ========================================================================
const chapter2 = [
  ...chapterHeading("2", "Literature Review"),
  bodyP("This chapter reviews the published literature and industry practice relevant to the problem addressed by this project. It is organised into six sub-sections covering, respectively, traditional rule-based detection systems, machine-learning approaches to fraud classification, techniques for handling class imbalance, explainable AI and SHAP, the use of Robotic Process Automation in banking workflows, and the research gap that emerges from this review."),

  mainHeading("2.1", "Traditional Rule-Based Fraud Detection"),
  bodyP("The earliest generation of fraud detection systems deployed in banks relied on hand-crafted rules encoded directly into the transaction authorisation pipeline. Typical rules include flagging any transaction above a configurable amount, any card used in a country outside a defined whitelist, any burst of transactions within a short time window, and any merchant category code that has been blacklisted. Bolton and Hand (2002) provided one of the earliest comprehensive surveys of such statistical and rule-based fraud detection approaches, documenting both their simplicity and their fundamental limitations: rules cannot capture multivariate, non-linear patterns, they generate high false-positive rates, and they are easily reverse-engineered by sophisticated fraudsters."),
  bodyP("Phua et al. (2010) extended this survey and showed that rule-based engines in practice require continuous manual tuning by fraud analysts, with rule drift causing detection performance to degrade within weeks of deployment. Ngai et al. (2011) analysed the specific weaknesses of rule-based systems in card fraud and demonstrated that even carefully designed velocity rules are bypassed by fraudsters who spread transactions across multiple cards and time windows."),

  mainHeading("2.2", "Machine Learning Approaches to Fraud Detection"),
  bodyP("The first wave of machine learning applied to fraud detection used logistic regression and decision trees (Chan et al., 1999). These models improved on rule-based engines because they learned feature weights from data rather than relying on fixed thresholds, but their representational capacity was limited. The second wave, starting around 2010, saw the adoption of ensemble methods such as Random Forest and gradient boosting. Bhattacharyya et al. (2011) compared logistic regression, support vector machines and random forests on a card fraud dataset and found that ensemble methods consistently dominated single-model approaches on both precision and recall."),
  bodyP("The current state of the art for tabular fraud detection is dominated by gradient-boosted decision tree libraries. Chen and Guestrin (2016) introduced XGBoost, an efficient and scalable implementation of gradient boosting that has become the de-facto choice for structured-data classification, and Ke et al. (2017) proposed LightGBM, which uses histogram-based splitting and leaf-wise growth to achieve similar accuracy at substantially lower training cost. On public fraud benchmarks such as the IEEE-CIS Fraud Detection dataset, XGBoost and LightGBM consistently achieve AUC-ROC scores above 0.93, outperforming both simpler classifiers and most deep-learning tabular models of comparable size."),
  bodyP("Deep learning approaches have also been explored, most notably autoencoders for anomaly detection and recurrent networks for sequential transaction modelling (Roy et al., 2018). However, recent comparative studies (Shwartz-Ziv and Armon, 2022) have shown that on standard tabular fraud benchmarks, gradient boosted trees still match or beat deep models while being far more interpretable and cheaper to train and deploy. This finding directly motivated the model choice made in this project."),

  mainHeading("2.3", "Handling Class Imbalance"),
  bodyP("Fraud datasets are typically severely imbalanced — the IEEE-CIS dataset used in this project contains only about 3.5 per cent fraudulent transactions. A classifier trained directly on such data is strongly biased towards the majority class and tends to predict every transaction as legitimate. Four main families of techniques have been developed in the literature to address this: random under-sampling, random over-sampling, synthetic over-sampling and cost-sensitive learning. Chawla et al. (2002) introduced SMOTE (Synthetic Minority Over-sampling Technique), which generates synthetic examples of the minority class by interpolating between existing minority points and their nearest neighbours."),
  bodyP("He and Garcia (2009) reviewed class-imbalance techniques for classification and established an important methodological rule: any resampling must be applied only to the training partition after the train-test split, never to the full dataset, otherwise information from the test set leaks into training and evaluation becomes optimistically biased. This rule is strictly followed in the present project. More recent extensions such as Borderline-SMOTE and ADASYN (He et al., 2008) attempt to focus synthetic example generation near the decision boundary, but standard SMOTE remains the most widely used baseline and is the technique adopted here."),

  mainHeading("2.4", "Explainable AI and SHAP"),
  bodyP("As fraud detection moves from rule-based to learned models, the question of model interpretability becomes critical. Banks are required by regulation, internal policy and customer trust to provide a reason for any transaction decline or account action. Ribeiro et al. (2016) introduced LIME, a local surrogate model approach that approximates the behaviour of a complex classifier around a single prediction by fitting a simple interpretable model to perturbations. LIME works for any black-box classifier but is stochastic and can produce unstable explanations across runs."),
  bodyP("Lundberg and Lee (2017) introduced SHAP (SHapley Additive exPlanations), which unifies several previous explanation methods under a single game-theoretic framework based on Shapley values from cooperative game theory. SHAP has three properties that make it particularly suitable for fraud detection: (i) local accuracy — the sum of feature SHAP values equals the model's prediction minus the base value; (ii) consistency — if a feature's contribution increases after a model change, its SHAP value does not decrease; and (iii) the existence of a fast polynomial-time algorithm (TreeSHAP, Lundberg et al. 2020) for tree ensembles such as XGBoost and LightGBM. Because of these properties, SHAP values can be computed for every live prediction with negligible added latency, which is why they are adopted in this project."),

  mainHeading("2.5", "RPA in Banking Workflows"),
  bodyP("Robotic Process Automation refers to software agents that mimic the actions of a human operator across existing enterprise applications — reading from web forms, writing to databases, sending emails, generating documents — without requiring a redesign of the underlying systems. Willcocks et al. (2015) provided an early definition of RPA and distinguished it from traditional workflow engines by its ability to work with legacy applications through their user interface. Asatiani and Penttinen (2016) studied RPA adoption in a European bank and reported cost reductions of 40 to 80 per cent in back-office processes such as reconciliation, reporting and customer notification."),
  bodyP("Aguirre and Rodriguez (2017) specifically surveyed RPA deployments in financial services and identified fraud case handling and regulatory report generation as two of the most impactful application areas, precisely because these processes are structured, rule-based and time-critical. However, the same authors note that most commercial RPA deployments remain disconnected from the detection layer — the bots execute a fixed workflow once a human analyst has already decided that a transaction is fraudulent, rather than being triggered directly by a machine-learning model. This observation is a key input to the research gap identified in Section 2.6."),

  mainHeading("2.6", "Research Gap"),
  bodyP("The survey of the literature yields three clear observations. First, the detection problem itself is now well-studied: gradient-boosted tree ensembles achieve competitive AUC-ROC on public fraud datasets and have established methodologies for handling class imbalance. Second, the explainability problem is also addressed by modern tools, with SHAP offering a principled and fast method for tree models. Third, RPA is an established technology in banking but is typically deployed as a separate back-office utility rather than as the response layer of an intelligent detection system."),
  bodyP("What is consistently missing in the reviewed literature is an integrated ecosystem in which (i) a machine-learning model produces the initial decision, (ii) SHAP explanations accompany that decision for the human analyst, and (iii) RPA bots automatically execute the downstream customer notification, case management, regulatory filing and audit-logging steps, all accessed through a unified dashboard. This integration is the precise gap that this project addresses. The system described in the following chapters is not a novel detection algorithm; it is a novel combination of existing, well-understood components engineered to form a complete, reproducible and deployable fraud response pipeline."),
];

// ========================================================================
// CHAPTER 3 — SYSTEM ANALYSIS AND REQUIREMENTS
// ========================================================================
const chapter3 = [
  ...chapterHeading("3", "System Analysis and Requirements"),
  bodyP("This chapter analyses the existing fraud detection practice in a typical Indian retail bank, describes the proposed integrated system, performs a three-pronged feasibility study, and enumerates the functional, non-functional, hardware and software requirements that guided the design in Chapter 4."),

  mainHeading("3.1", "Existing System Analysis"),
  bodyP("The existing system in a representative mid-sized Indian retail bank can be summarised as a two-layer pipeline. The first layer is a rule-based transaction-screening engine that inspects every incoming card or UPI transaction against a fixed set of rules: amount thresholds, country mismatch rules, velocity caps, merchant-category blacklists and device-fingerprint mismatches. Any transaction that matches one or more rules is queued for manual review by a fraud analyst. The second layer is the analyst's workflow itself. The analyst opens the case in an internal ticketing system, phones or messages the customer to confirm the transaction, updates the case with the customer's response, files a Suspicious Transaction Report with FIU-IND if the case is confirmed as fraud, and finally writes an audit entry into a separate compliance log."),
  bodyP("This existing system has several well-documented weaknesses. False-positive rates of rule-based engines are reported in industry surveys at 10 to 20 per cent, meaning that most manual reviews are wasted on legitimate transactions. Fraudsters systematically probe the rules and adapt around them. The manual workflow itself takes ten to fifteen minutes per case under ideal load and much longer during transaction spikes, giving a sophisticated fraudster enough time to drain an account before the first alert is raised. Data entry into the STR and audit log is inconsistent between analysts, creating compliance risk. And crucially, the detection layer and the response layer never share information beyond a binary flag — the specific reasons a transaction was flagged are never captured structurally, so there is no feedback loop into model improvement."),

  mainHeading("3.2", "Proposed System"),
  bodyP("The proposed system replaces the rule-based detection layer with a supervised machine-learning classifier and replaces the manual response workflow with an orchestrated set of Python RPA bots. Every incoming transaction is scored by an XGBoost model trained on the IEEE-CIS Fraud Detection dataset. If the predicted fraud probability crosses 0.5, the API backend triggers four bots in sequence: Bot 1 (Alert) dispatches an SMS and email to the customer, Bot 2 (Case) creates a record in a SQLite case-management database with queue routing based on risk level, Bot 3 (Report) generates an RBI Suspicious Transaction Report and saves it as a text artefact, and Bot 4 (Logger) writes an immutable audit entry. Every prediction is accompanied by the top five SHAP contributing features, so that both the analyst and the stored case record contain a structured, human-readable reason for the decision."),
  tableCaption("3.1", "Comparison of Existing vs. Proposed System"),
  makeTable([
    ["Aspect", "Existing System", "Proposed System"],
    ["Detection engine", "Hand-coded rules", "XGBoost model (AUC = 0.9522)"],
    ["False-positive rate", "10–20% (industry estimate)", "~10.6% on test set"],
    ["Explainability", "None (binary flag)", "SHAP top-5 features per prediction"],
    ["Customer notification", "Manual phone / email", "Bot 1 — automated SMS + email"],
    ["Case creation", "Manual ticket entry", "Bot 2 — automatic DB record with routing"],
    ["Regulatory reporting", "Manual STR typing", "Bot 3 — auto-generated STR artefact"],
    ["Audit logging", "Manual log entry", "Bot 4 — immutable structured log"],
    ["End-to-end response time", "10–15 minutes per case", "< 2 seconds (API + bots)"],
    ["Feedback to model", "None", "Case DB + SHAP captured for retraining"],
  ]),

  mainHeading("3.3", "Feasibility Study"),
  subHeading("3.3.1", "Technical Feasibility"),
  bodyP("All components of the proposed system use open-source, mature and well-documented technologies: Python 3.10, scikit-learn, XGBoost, LightGBM, SHAP, FastAPI, React 19, Tailwind CSS, SQLite and the standard Python libraries. The training of the model was performed on the Kaggle cloud GPU environment, which is free for academic use and fully reproducible. Inference at production scale requires only a CPU server. No proprietary or licensed components are required, and none of the techniques used are beyond the undergraduate CSE curriculum."),
  subHeading("3.3.2", "Economic Feasibility"),
  bodyP("The direct cost of the implementation consists of student time, a development laptop and free cloud compute credits. No paid APIs or licenses were used. If deployed in production, the incremental infrastructure cost over the existing rule engine is a single API server and a small SQLite or PostgreSQL instance, which is dwarfed by the savings from reduced manual case handling. Industry RPA studies cited in Chapter 2 report savings of 40–80 per cent on comparable workflows."),
  subHeading("3.3.3", "Operational Feasibility"),
  bodyP("The analyst dashboard is designed to mirror the mental model of existing fraud-analyst workstations, so adoption requires minimal training. Bots run as plain Python processes and can be deployed and monitored with standard DevOps tooling. The FastAPI contract is a single POST endpoint consuming and producing JSON, which is the industry default for integration with existing core banking systems."),

  mainHeading("3.4", "Functional Requirements"),
  bodyP("The functional requirements of the system are grouped by module."),
  subHeading("FR-1", "Data and Model Module"),
  plainP("FR-1.1  The system shall load and preprocess the IEEE-CIS Fraud Detection dataset (590,540 transactions, 471 features after preprocessing)."),
  plainP("FR-1.2  The system shall apply SMOTE only to the training partition after the train-test split."),
  plainP("FR-1.3  The system shall train LightGBM, XGBoost, Random Forest and AdaBoost classifiers and persist the best model to disk."),
  plainP("FR-1.4  The system shall compute and persist SHAP values for every prediction."),
  subHeading("FR-2", "API Module"),
  plainP("FR-2.1  The system shall expose a POST /predict endpoint that accepts a JSON transaction and returns fraud_probability, is_fraud, risk_level, shap_explanation and rpa_actions."),
  plainP("FR-2.2  The system shall expose a GET /health endpoint for monitoring."),
  plainP("FR-2.3  The system shall accept CORS requests from the dashboard origin."),
  subHeading("FR-3", "Dashboard Module"),
  plainP("FR-3.1  The system shall provide a Prediction form for live transaction entry."),
  plainP("FR-3.2  The system shall display the prediction result with risk level, SHAP bars and the four RPA actions taken."),
  plainP("FR-3.3  The system shall provide a Transactions history view and an Alerts queue view."),
  subHeading("FR-4", "RPA Module"),
  plainP("FR-4.1  When fraud_probability > 0.5, the system shall trigger Bot 1 (Alert), Bot 2 (Case), Bot 3 (Report) and Bot 4 (Logger) in sequence."),
  plainP("FR-4.2  The Case Bot shall route cases to Senior Analyst / Fraud Analyst Team / Auto-Review based on risk level."),
  plainP("FR-4.3  The Report Bot shall generate an RBI-format STR artefact and persist it to disk."),
  plainP("FR-4.4  The Logger Bot shall write an immutable audit trail covering the full pipeline execution."),

  mainHeading("3.5", "Non-Functional Requirements"),
  plainP("NFR-1  Performance: End-to-end latency from /predict request to all four bot completions shall be under 2 seconds on a standard CPU."),
  plainP("NFR-2  Accuracy: The deployed model shall achieve at least F1 ≥ 0.60 and AUC-ROC ≥ 0.90 on the held-out test set."),
  plainP("NFR-3  Reliability: The API shall handle invalid or missing fields gracefully by filling defaults and shall return structured error responses."),
  plainP("NFR-4  Security: All API inputs shall be validated by Pydantic schemas; the case database shall be accessed only through parameterised SQL."),
  plainP("NFR-5  Usability: The dashboard shall follow a clean, consistent visual hierarchy and be accessible on desktop at 1366×768 resolution or higher."),
  plainP("NFR-6  Auditability: Every fraud decision shall be recorded with its SHAP explanation and the four bot outcomes."),
  plainP("NFR-7  Portability: The system shall run on Windows, Linux or macOS without code changes."),
  plainP("NFR-8  Maintainability: The codebase shall be organised into clearly separated ml/, api/, dashboard/, rpa/ modules."),

  mainHeading("3.6", "Hardware and Software Requirements"),
  tableCaption("3.2", "Hardware and Software Requirements"),
  makeTable([
    ["Category", "Development", "Deployment (minimum)"],
    ["Processor", "Intel i5 / AMD Ryzen 5 or better", "Dual-core 2.4 GHz CPU"],
    ["RAM", "8 GB (16 GB recommended for training)", "4 GB"],
    ["Storage", "10 GB free (dataset + models)", "2 GB free"],
    ["GPU (for training)", "Kaggle T4 / P100 (cloud)", "Not required"],
    ["OS", "Windows 10/11, Ubuntu 20.04+, macOS 12+", "Any Linux with Python 3.10"],
    ["Python", "3.10 or higher", "3.10 or higher"],
    ["Key libraries", "scikit-learn, XGBoost, LightGBM, SHAP, FastAPI, pandas", "FastAPI, XGBoost, SHAP"],
    ["Node.js (dashboard)", "Node 18+ with npm", "Static build served via Nginx"],
    ["Database", "SQLite 3 (bundled with Python)", "SQLite or PostgreSQL"],
    ["Browser", "Chrome 110+ / Firefox 110+ / Edge 110+", "Any modern browser"],
  ]),
];

// ========================================================================
// CHAPTER 4 — SYSTEM DESIGN AND METHODOLOGY
// ========================================================================
const chapter4 = [
  ...chapterHeading("4", "System Design and Methodology"),
  bodyP("This chapter presents the design of the proposed system at five complementary levels: the overall system architecture, the end-to-end data flow, the machine-learning pipeline, the use-case diagram of the analyst dashboard and the entity-relationship diagram of the case database. Each design artefact is produced as a clean figure and discussed in the surrounding text. The final section describes the RPA workflow orchestration that ties the bots to the detection layer."),

  mainHeading("4.1", "System Architecture"),
  bodyP("The system is designed as a four-layer architecture: the client (dashboard) layer, the service (API) layer, the intelligence (machine-learning + SHAP) layer and the automation (RPA + database) layer. The dashboard layer is a React single-page application that communicates with the service layer through RESTful JSON calls. The service layer is a FastAPI backend that loads the trained XGBoost model in memory at startup, validates every incoming request against a Pydantic schema, and delegates prediction to the intelligence layer. The intelligence layer executes the model, computes SHAP values using a TreeExplainer, and returns both the probability and the top five contributing features. Based on the returned probability, the service layer invokes the automation layer, which runs four Python bots in sequence and writes to a SQLite case database."),
  figureImage(path.join(ROOT, "diagrams", "fig_4_1_architecture.png"), 500, 450),
  figureCaption("4.1", "Four-Layer System Architecture of the Fraud Detection Ecosystem"),
  bodyP("This layered design gives several engineering advantages. The dashboard can be swapped for a mobile app without touching the backend, the model can be retrained and redeployed without changing the API contract, and any of the four bots can be replaced with a real external integration (Twilio SMS, SMTP email, FIU-IND filing API) without touching the intelligence layer."),

  mainHeading("4.2", "Data Flow Design"),
  bodyP("Fig. 4.2 shows the end-to-end data flow for a single transaction from the moment the analyst enters it on the dashboard to the moment the four RPA bots have completed and the result is rendered back on the screen. The flow highlights two important design decisions: (i) the SHAP explanation is computed in the same API call as the prediction, so that the analyst never sees a prediction without its reason, and (ii) the four bots execute synchronously within the request for the demo system but are structured as independent functions, which allows them to be moved to an asynchronous queue for production scale without logic changes."),
  figureImage(path.join(ROOT, "diagrams", "fig_4_2_dataflow.png"), 520, 340),
  figureCaption("4.2", "End-to-End Data Flow from Dashboard Input to RPA Response"),

  mainHeading("4.3", "Machine Learning Pipeline"),
  bodyP("The machine-learning pipeline is designed as a reproducible sequence of eight stages: data loading, missing-value handling, categorical encoding, train-test split, SMOTE resampling on the training set only, model training across four classifiers, evaluation and model selection, and finally SHAP explainer fitting and persistence. Fig. 4.3 shows this pipeline in detail, separating the training phase (run once on Kaggle) from the inference phase (run on every live request)."),
  figureImage(path.join(ROOT, "diagrams", "fig_4_3_ml_pipeline.png"), 520, 400),
  figureCaption("4.3", "Machine Learning Training and Inference Pipeline"),
  bodyP("The key methodological rule enforced in this pipeline is that SMOTE is applied strictly after the train-test split and strictly to the training fold only. Applying SMOTE before splitting would leak synthetic minority examples that are nearest-neighbour-derived from points later used for testing, which would yield an optimistically biased evaluation. All four classifiers are trained on the same SMOTE-resampled training set and evaluated on the same untouched test set, giving a fair comparison."),

  mainHeading("4.4", "Use Case Design"),
  bodyP("Fig. 4.4 is the use-case diagram of the analyst dashboard. The primary actor is the Fraud Analyst, who interacts with the system through six use cases: enter a live transaction, view the prediction result, view the SHAP explanation, view the automated RPA actions, browse the transactions history and review the alerts queue. The system itself acts as a secondary actor that triggers the RPA bots and communicates with the case database."),
  figureImage(path.join(ROOT, "diagrams", "fig_4_4_use_case.png"), 480, 360),
  figureCaption("4.4", "Use Case Diagram for the Analyst Dashboard"),

  mainHeading("4.5", "Database Schema (ER Diagram)"),
  bodyP("Fig. 4.5 shows the entity-relationship diagram of the case-management database. The schema is deliberately small and normalised, with three entities: transactions (incoming scored events), cases (fraud investigations opened by Bot 2) and reports (STR artefacts created by Bot 3). A transaction can have at most one case, and each case can spawn at most one regulatory report, giving clean one-to-one relationships and a simple referential-integrity structure."),
  figureImage(path.join(ROOT, "diagrams", "fig_4_5_er_diagram.png"), 560, 380),
  figureCaption("4.5", "Entity-Relationship Diagram of the Case Database"),

  mainHeading("4.6", "RPA Workflow Design"),
  bodyP("The RPA workflow is orchestrated inside the /predict endpoint of the FastAPI backend. As soon as the model returns fraud_probability > 0.5, a transaction context dictionary is constructed containing the transaction id, the customer name, the amount, the merchant, the city, the fraud probability and the top SHAP features. This context is then passed sequentially to the four bots:"),
  plainP("Bot 1 — Alert:  Generates a customer-facing SMS and email containing the transaction amount, merchant and top risk factor; writes both to text-file artefacts to simulate the real gateway."),
  plainP("Bot 2 — Case:  Opens a row in the fraud_cases SQLite table, generates a sequential CASE-XXXX identifier, and assigns the case to Senior Fraud Analyst (probability ≥ 0.7), Fraud Analyst Team (0.3 ≤ probability < 0.7) or Auto-Review Queue (< 0.3)."),
  plainP("Bot 3 — Report:  Constructs an RBI-format Suspicious Transaction Report string containing the STR identifier, date, customer details, amount, risk level and top-3 SHAP factors, then saves it as a text artefact under reports/."),
  plainP("Bot 4 — Logger:  Writes a structured audit entry for every bot outcome to the central pipeline log, along with timestamps, creating an immutable trail for compliance."),
  bodyP("All four bots are implemented as pure Python functions in the rpa/ package, each returning a JSON-serialisable dictionary which is accumulated into the API response. This design means the automation layer is stateless from the API's point of view and can be tested in isolation."),
];

// ========================================================================
// CHAPTER 5 — IMPLEMENTATION AND RESULTS
// ========================================================================
const chapter5 = [
  ...chapterHeading("5", "Implementation and Results"),
  bodyP("This chapter documents the actual implementation of the system and the empirical results obtained on the IEEE-CIS Fraud Detection dataset. Section 5.1 describes the development and training environment. Section 5.2 presents screenshots of the deployed dashboard. Section 5.3 reports the quantitative model-comparison results. Section 5.4 analyses the SHAP explainability output. Section 5.5 demonstrates an end-to-end RPA execution trace. Section 5.6 summarises the overall performance of the ecosystem."),

  mainHeading("5.1", "Implementation Environment"),
  bodyP("Model training was carried out on the Kaggle cloud environment using a single NVIDIA T4 GPU for gradient-boosted libraries that support GPU acceleration, and falling back to CPU for AdaBoost and Random Forest. The backend API was developed and tested on a local Windows 11 laptop with an Intel i5 processor and 16 GB of RAM. The dashboard was developed with React 19 and Tailwind CSS 3, served through the Create-React-App development server on port 3000. The FastAPI backend runs on port 8000 with CORS enabled for the dashboard origin. The SQLite case database and the RPA bot artefacts are persisted on the local file system."),

  mainHeading("5.2", "Dashboard Implementation (Screenshots)"),
  bodyP("Fig. 5.1 to Fig. 5.9 present the screens of the implemented dashboard and backend. Each figure is reproduced directly from the running system."),
  figureImage(path.join(ROOT, "screenshot", "01_dashboard_home.png"), 520, 290),
  figureCaption("5.1", "Dashboard Home Screen with Key Metrics and Navigation"),
  figureImage(path.join(ROOT, "screenshot", "02_predict_form.png"), 520, 290),
  figureCaption("5.2", "Prediction Input Form for Live Transaction Entry"),
  figureImage(path.join(ROOT, "screenshot", "3.png"), 520, 290),
  figureCaption("5.3", "Fraud Detection Result with Risk Level, SHAP Bars and RPA Actions"),
  figureImage(path.join(ROOT, "screenshot", "4.png"), 520, 290),
  figureCaption("5.4", "Legitimate Transaction Result — No RPA Bots Triggered"),
  figureImage(path.join(ROOT, "screenshot", "5.png"), 520, 290),
  figureCaption("5.5", "Transactions History View with Filter and Pagination"),
  figureImage(path.join(ROOT, "screenshot", "6.png"), 520, 290),
  figureCaption("5.6", "Alerts and Case Queue View Populated by Bot 2"),
  figureImage(path.join(ROOT, "screenshot", "7_body.png"), 520, 290),
  figureCaption("5.7", "FastAPI Swagger UI — /predict Request Body"),
  figureImage(path.join(ROOT, "screenshot", "7_response.png"), 520, 290),
  figureCaption("5.8", "FastAPI Swagger UI — /predict Response with SHAP and RPA Actions"),
  figureImage(path.join(ROOT, "screenshot", "8.png"), 520, 290),
  figureCaption("5.9", "RPA Pipeline Terminal Output Showing All Four Bots Executing"),
  bodyP("The screenshots confirm that the full ecosystem works end-to-end: a transaction entered on the dashboard is scored, explained, and triggers the four bots whose outputs are visible both in the dashboard alert queue and in the backend terminal."),

  mainHeading("5.3", "Model Training Results"),
  bodyP("All four classifiers were trained on the same SMOTE-resampled training fold and evaluated on the same held-out test fold. Table 5.1 reports the precision, recall, F1-score and AUC-ROC of each model on the test set. Fig. 5.10 visualises the same metrics as a grouped bar chart."),
  tableCaption("5.1", "Model Performance Comparison on Test Set (118,108 samples)"),
  makeTable([
    ["Model", "Precision", "Recall", "F1-Score", "AUC-ROC"],
    ["LightGBM", "0.8419", "0.5183", "0.6417", "0.9445"],
    ["XGBoost", "0.8935", "0.5440", "0.6762", "0.9522"],
    ["Random Forest", "0.8692", "0.4950", "0.6308", "0.9367"],
    ["AdaBoost", "0.2812", "0.7108", "0.4030", "0.8891"],
  ]),
  figureImage(path.join(ROOT, "model_comparison.png"), 540, 320),
  figureCaption("5.10", "Model Comparison Across the Four Classifiers"),
  bodyP("XGBoost achieves the best overall balance with F1 = 0.6762 and AUC-ROC = 0.9522, and is therefore selected as the production model. LightGBM is a close second and could be a drop-in alternative if training time becomes a constraint. AdaBoost shows the expected pattern for boosted stumps on imbalanced data: high recall (0.71) because it aggressively flags anything remotely suspicious, but very low precision (0.28) because it floods the analyst with false positives. Random Forest is slightly behind the two gradient boosters in every metric. Fig. 5.11 shows the four confusion matrices side-by-side, and Table 5.2 reports the XGBoost confusion matrix numerically."),
  figureImage(path.join(ROOT, "confusion_matrices (1).png"), 540, 320),
  figureCaption("5.11", "Confusion Matrices of the Four Trained Classifiers"),
  tableCaption("5.2", "XGBoost Confusion Matrix on the Held-Out Test Set"),
  makeTable([
    ["", "Predicted Legit", "Predicted Fraud"],
    ["Actual Legit", "113,706 (TN)", "268 (FP)"],
    ["Actual Fraud", "1,885 (FN)", "2,249 (TP)"],
  ]),

  mainHeading("5.4", "SHAP Explainability Results"),
  bodyP("SHAP values were computed using a TreeExplainer fitted on the trained XGBoost model. Fig. 5.12 shows the global feature-importance ranking aggregated over all test predictions, and Fig. 5.13 shows the same data as a beeswarm plot, which additionally reveals the direction of influence of each feature. Across the dataset, the most influential features are V258, V257, V201, C13, card1 and TransactionAmt — a mix of anonymised Vesta engineered variables, counting features and the transaction amount itself. The beeswarm plot shows that high values of V258 and V257 push predictions strongly towards fraud, while the counting feature C13 has a more symmetric effect. These global insights confirm that the model has learned a diverse signal rather than locking onto a single dominant feature."),
  figureImage(path.join(ROOT, "shap_feature_importance.png"), 500, 320),
  figureCaption("5.12", "SHAP Global Feature Importance (Mean Absolute SHAP Value)"),
  figureImage(path.join(ROOT, "shap_beeswarm.png"), 520, 340),
  figureCaption("5.13", "SHAP Beeswarm Plot Showing Feature Impact and Direction"),
  bodyP("For every individual live prediction shown on the dashboard, the top-5 contributing features are highlighted with their SHAP values and their direction (increases / decreases fraud risk). This per-transaction explanation is what makes the system usable by an analyst in practice: a pure probability score of 0.91 would be opaque, but a probability of 0.91 together with \"TransactionAmt, V258 and card1 increased fraud risk\" is an actionable starting point for the investigation."),

  mainHeading("5.5", "RPA Execution Results"),
  bodyP("Table 5.3 summarises the outcome of the four RPA bots during a representative end-to-end execution with fraud_probability = 0.92. All four bots completed successfully in sequence, and the total end-to-end latency from the /predict request to the final logger entry was measured at approximately 1.4 seconds on the development laptop. This is well within the 2-second non-functional performance requirement defined in Section 3.5."),
  tableCaption("5.3", "RPA Bot Execution Summary for a High-Risk Transaction"),
  makeTable([
    ["Bot", "Role", "Outcome", "Artefact"],
    ["Bot 1 — Alert", "Notify customer", "SMS + email dispatched", "rpa/alerts/*.txt"],
    ["Bot 2 — Case", "Open investigation", "CASE-0042 / Senior Fraud Analyst", "rpa/fraud_cases.db"],
    ["Bot 3 — Report", "File regulatory STR", "STR-0042 generated", "rpa/reports/*.txt"],
    ["Bot 4 — Logger", "Write audit trail", "4 entries logged", "rpa/pipeline_log.txt"],
  ]),

  mainHeading("5.6", "Performance Analysis"),
  bodyP("The final system satisfies all the non-functional requirements set in Chapter 3. The end-to-end latency of ~1.4 seconds satisfies NFR-1. The production XGBoost model's F1 of 0.6762 and AUC-ROC of 0.9522 exceed the NFR-2 targets of 0.60 and 0.90 respectively. The Pydantic-based request validation and parameterised SQL in the Case Bot satisfy NFR-4. Compared to the manual baseline described in Section 3.1, the proposed system reduces the per-case operational time from an estimated 10–15 minutes of analyst effort to under 2 seconds of wall-clock time, while preserving a complete audit trail and a structured explanation for every decision. Taken together, these results show that the integrated detection-plus-RPA ecosystem is not only technically feasible on commodity hardware but also meaningfully improves every operational dimension compared to the existing practice."),
];

// ========================================================================
// CHAPTER 6 — CONCLUSION AND FUTURE WORK
// ========================================================================
const chapter6 = [
  ...chapterHeading("6", "Conclusion and Future Work"),

  mainHeading("6.1", "Conclusion"),
  bodyP("This project set out to build an end-to-end, explainable and automated fraud detection ecosystem that goes beyond the standard academic exercise of training and reporting a single classifier. The completed system integrates four well-understood but usually disconnected components — supervised machine learning, SHAP-based explainability, a REST API and Robotic Process Automation — into a single coherent pipeline that takes a transaction from entry to regulatory filing without any manual intervention."),
  bodyP("On the detection side, four gradient-boosted and ensemble classifiers were compared on the IEEE-CIS Fraud Detection dataset after strict methodologically correct SMOTE application. XGBoost emerged as the best model with an F1-score of 0.6762 and an AUC-ROC of 0.9522 on a 118,108-sample held-out test set. Every prediction is accompanied by its top-five SHAP contributing features, making the detection output interpretable rather than opaque."),
  bodyP("On the automation side, four Python bots — Alert, Case, Report and Logger — are orchestrated automatically by the FastAPI backend whenever the predicted fraud probability exceeds 0.5. Each bot produces a concrete artefact (a notification file, a SQLite case record, an STR text report, an audit entry), and the entire downstream workflow completes in under two seconds. The React dashboard ties everything together in a single screen where an analyst can enter a transaction, see the risk level with its SHAP explanation, and watch the four bot outcomes in real time."),

  mainHeading("6.2", "Key Contributions"),
  plainP("1.  A reproducible, end-to-end integration of detection, explanation and automated response — not a new algorithm, but a novel and working combination addressing the research gap identified in Chapter 2."),
  plainP("2.  A published-quality comparison of four classifiers (LightGBM, XGBoost, Random Forest, AdaBoost) on the IEEE-CIS dataset with methodologically correct SMOTE usage."),
  plainP("3.  Per-transaction SHAP explanations surfaced directly to the analyst through a dashboard UI, closing the explainability gap that rule-based and opaque ML systems both suffer from."),
  plainP("4.  A modular four-bot RPA architecture that can be incrementally replaced with real external integrations (Twilio, SMTP, FIU-IND) without any change to the detection or API layer."),
  plainP("5.  A complete open-source code base organised into ml/, api/, dashboard/ and rpa/ modules, reproducible on commodity hardware."),

  mainHeading("6.3", "Limitations"),
  bodyP("Three limitations of the present work are openly acknowledged. First, the system is evaluated on a public English-language, USD-denominated dataset; an Indian deployment would require retraining on domestic card and UPI transaction data. Second, the RPA bots generate realistic artefacts but do not integrate with live external services such as Twilio SMS, SMTP email servers or the FIU-IND STR filing API; these integrations are outside the academic scope of the project but would be straightforward to add. Third, the model is static once deployed; concept drift, which is known to be significant in fraud patterns, is not addressed by an automated retraining loop in the current implementation."),

  mainHeading("6.4", "Future Work"),
  bodyP("The limitations above naturally define the roadmap for future work. Four concrete extensions are planned:"),
  plainP("(i)  Retraining and evaluation on an Indian UPI / card dataset, preferably in collaboration with a banking partner, to measure performance in the intended deployment geography."),
  plainP("(ii)  Integration of the RPA bots with production external services — Twilio for SMS, an authenticated SMTP gateway for email, and the FIU-IND STR submission API once access is granted — replacing the current text-file artefacts with real operational actions."),
  plainP("(iii)  Addition of a continual-learning loop in which confirmed-fraud cases from the Case Bot database are periodically used to retrain the XGBoost model with time-based validation, addressing the concept-drift limitation."),
  plainP("(iv)  Exploration of graph-based features (card-merchant-device graphs) and sequential transformer models over transaction histories to capture fraud patterns that the current tabular model misses by design."),
  bodyP("Taken together, these extensions would move the ecosystem from a reproducible academic prototype towards a genuinely deployable production system, while preserving the core design principle that motivated this project: detection, explanation and response must be treated as a single integrated loop, not as three separate problems."),
];

// ========================================================================
// REFERENCES
// ========================================================================
const refItem = (num, text) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 100, line: LINE_15 },
  indent: { left: 720, hanging: 720 },
  children: [new TextRun({ text: `[${num}]  ${text}`, font: FONT, size: SZ_BODY })],
});

const references = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "REFERENCES", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  refItem(1, "Reserve Bank of India, \"Report on Trend and Progress of Banking in India 2022-23,\" RBI Annual Publication, Mumbai, 2023."),
  refItem(2, "Association of Certified Fraud Examiners, \"Occupational Fraud 2024: A Report to the Nations,\" ACFE, Austin, TX, 2024."),
  refItem(3, "Nilson Report, \"Card Fraud Losses Worldwide,\" Issue 1243, HSN Consultants, 2023."),
  refItem(4, "R. J. Bolton and D. J. Hand, \"Statistical fraud detection: A review,\" Statistical Science, vol. 17, no. 3, pp. 235–255, 2002."),
  refItem(5, "C. Phua, V. Lee, K. Smith, and R. Gayler, \"A comprehensive survey of data mining-based fraud detection research,\" arXiv:1009.6119, 2010."),
  refItem(6, "E. W. T. Ngai, Y. Hu, Y. H. Wong, Y. Chen, and X. Sun, \"The application of data mining techniques in financial fraud detection: A classification framework and an academic review of literature,\" Decision Support Systems, vol. 50, no. 3, pp. 559–569, 2011."),
  refItem(7, "P. K. Chan, W. Fan, A. L. Prodromidis, and S. J. Stolfo, \"Distributed data mining in credit card fraud detection,\" IEEE Intelligent Systems, vol. 14, no. 6, pp. 67–74, 1999."),
  refItem(8, "S. Bhattacharyya, S. Jha, K. Tharakunnel, and J. C. Westland, \"Data mining for credit card fraud: A comparative study,\" Decision Support Systems, vol. 50, no. 3, pp. 602–613, 2011."),
  refItem(9, "T. Chen and C. Guestrin, \"XGBoost: A scalable tree boosting system,\" in Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining, 2016, pp. 785–794."),
  refItem(10, "G. Ke, Q. Meng, T. Finley, T. Wang, W. Chen, W. Ma, Q. Ye, and T.-Y. Liu, \"LightGBM: A highly efficient gradient boosting decision tree,\" in Advances in Neural Information Processing Systems, vol. 30, 2017."),
  refItem(11, "A. Roy, J. Sun, R. Mahoney, L. Alonzi, S. Adams, and P. Beling, \"Deep learning detecting fraud in credit card transactions,\" in 2018 Systems and Information Engineering Design Symposium (SIEDS), 2018, pp. 129–134."),
  refItem(12, "R. Shwartz-Ziv and A. Armon, \"Tabular data: Deep learning is not all you need,\" Information Fusion, vol. 81, pp. 84–90, 2022."),
  refItem(13, "N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, \"SMOTE: Synthetic minority over-sampling technique,\" Journal of Artificial Intelligence Research, vol. 16, pp. 321–357, 2002."),
  refItem(14, "H. He and E. A. Garcia, \"Learning from imbalanced data,\" IEEE Trans. Knowledge and Data Engineering, vol. 21, no. 9, pp. 1263–1284, 2009."),
  refItem(15, "H. He, Y. Bai, E. A. Garcia, and S. Li, \"ADASYN: Adaptive synthetic sampling approach for imbalanced learning,\" in IEEE Int. Joint Conf. Neural Networks, 2008, pp. 1322–1328."),
  refItem(16, "M. T. Ribeiro, S. Singh, and C. Guestrin, \"Why should I trust you? Explaining the predictions of any classifier,\" in Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining, 2016, pp. 1135–1144."),
  refItem(17, "S. M. Lundberg and S.-I. Lee, \"A unified approach to interpreting model predictions,\" in Advances in Neural Information Processing Systems, vol. 30, 2017, pp. 4765–4774."),
  refItem(18, "S. M. Lundberg, G. Erion, H. Chen, A. DeGrave, J. M. Prutkin, B. Nair, R. Katz, J. Himmelfarb, N. Bansal, and S.-I. Lee, \"From local explanations to global understanding with explainable AI for trees,\" Nature Machine Intelligence, vol. 2, no. 1, pp. 56–67, 2020."),
  refItem(19, "L. Willcocks, M. Lacity, and A. Craig, \"The IT function and Robotic Process Automation,\" The Outsourcing Unit Working Research Paper Series, London School of Economics, 2015."),
  refItem(20, "A. Asatiani and E. Penttinen, \"Turning robotic process automation into commercial success – Case OpusCapita,\" Journal of Information Technology Teaching Cases, vol. 6, no. 2, pp. 67–74, 2016."),
  refItem(21, "S. Aguirre and A. Rodriguez, \"Automation of a business process using robotic process automation: A case study,\" in Communications in Computer and Information Science, vol. 742, Springer, 2017, pp. 65–71."),
  refItem(22, "Kaggle, \"IEEE-CIS Fraud Detection Dataset,\" IEEE Computational Intelligence Society and Vesta Corporation, 2019. [Online]. Available: https://www.kaggle.com/competitions/ieee-fraud-detection"),
];

// ========================================================================
// LIST OF PUBLICATIONS
// ========================================================================
const publications = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "LIST OF PUBLICATIONS", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  bodyP("The following conference paper has been prepared from this project work and is under consideration for submission:"),
  blank(160),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: LINE_15 },
    indent: { left: 720, hanging: 720 },
    children: [
      new TextRun({ text: "[P1]  ", font: FONT, size: SZ_BODY, bold: true }),
      new TextRun({
        text: "Rohan Thakur, Yogesh Kumar, Varnit Saini, and Neha Pokhriyal, \"AI-Powered Fraud Detection & Prevention Ecosystem with Robotic Process Automation (RPA),\" manuscript prepared for IEEE Conference submission, Department of Computer Science & Engineering, Graphic Era Hill University, Dehradun, 2026.",
        font: FONT, size: SZ_BODY,
      }),
    ],
  }),
  blank(200),
  bodyP("The paper reports the model-comparison results of Section 5.3 (F1 = 0.6762 and AUC-ROC = 0.9522 for XGBoost on the IEEE-CIS dataset), the SHAP explainability pipeline of Section 5.4 and the four-bot RPA orchestration of Section 5.5. The final compiled manuscript is included as Fraud_Detection_Paper.docx in the project submission bundle."),
];

// ========================================================================
// APPENDIX A — SOURCE CODE EXCERPTS
// ========================================================================
const appendix = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    pageBreakBefore: true,
    children: [new TextRun({ text: "APPENDIX A", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360, line: LINE_15 },
    children: [new TextRun({ text: "SOURCE CODE EXCERPTS", font: FONT, size: SZ_CHAPTER, bold: true })],
  }),
  bodyP("This appendix contains representative excerpts of the source code that implements the ecosystem described in Chapters 4 and 5. The full code base is submitted alongside this report in the project folder."),

  mainHeading("A.1", "ml/predict.py — Model Loading and Prediction with SHAP"),
  codeLine("import joblib, pickle, numpy as np, pandas as pd, shap"),
  codeLine("from pathlib import Path"),
  codeLine(""),
  codeLine("MODEL_DIR = Path(__file__).parent"),
  codeLine("_model = None; _explainer = None; _feature_names = None"),
  codeLine(""),
  codeLine("def load_model():"),
  codeLine("    global _model, _explainer, _feature_names"),
  codeLine("    _model = joblib.load(MODEL_DIR / 'xgb_model.pkl')"),
  codeLine("    with open(MODEL_DIR / 'feature_names.pkl', 'rb') as f:"),
  codeLine("        _feature_names = pickle.load(f)"),
  codeLine("    _explainer = shap.TreeExplainer(_model)"),
  codeLine(""),
  codeLine("def predict(txn: dict) -> dict:"),
  codeLine("    row = pd.DataFrame([{f: txn.get(f, 0) for f in _feature_names}])"),
  codeLine("    prob = float(_model.predict_proba(row)[0][1])"),
  codeLine("    risk = 'HIGH' if prob >= 0.7 else 'MEDIUM' if prob >= 0.3 else 'LOW'"),
  codeLine("    shap_vals = _explainer.shap_values(row)[0]"),
  codeLine("    idx = np.argsort(np.abs(shap_vals))[::-1][:5]"),
  codeLine("    top = [{'feature': _feature_names[i],"),
  codeLine("            'shap_value': float(shap_vals[i]),"),
  codeLine("            'direction': 'increases fraud risk' if shap_vals[i] > 0"),
  codeLine("                         else 'decreases fraud risk'} for i in idx]"),
  codeLine("    return {'fraud_probability': prob, 'is_fraud': int(prob > 0.5),"),
  codeLine("            'risk_level': risk, 'shap_explanation': top}"),

  mainHeading("A.2", "api/app.py — FastAPI Endpoint with RPA Orchestration"),
  codeLine("from fastapi import FastAPI, HTTPException"),
  codeLine("from fastapi.middleware.cors import CORSMiddleware"),
  codeLine("from pydantic import BaseModel, ConfigDict"),
  codeLine("from contextlib import asynccontextmanager"),
  codeLine("from ml.predict import load_model, predict"),
  codeLine("from rpa.bot1_alert import send_alert"),
  codeLine("from rpa.bot2_case  import create_case"),
  codeLine("from rpa.bot3_report import generate_report"),
  codeLine("from rpa.bot4_logger import log_full_pipeline"),
  codeLine(""),
  codeLine("@asynccontextmanager"),
  codeLine("async def lifespan(app):"),
  codeLine("    load_model(); yield"),
  codeLine(""),
  codeLine("app = FastAPI(title='Fraud Detection API', lifespan=lifespan)"),
  codeLine("app.add_middleware(CORSMiddleware, allow_origins=['*'],"),
  codeLine("                   allow_methods=['*'], allow_headers=['*'])"),
  codeLine(""),
  codeLine("class TransactionRequest(BaseModel):"),
  codeLine("    TransactionAmt: float = 0"),
  codeLine("    model_config = ConfigDict(extra='allow')"),
  codeLine(""),
  codeLine("@app.post('/predict')"),
  codeLine("def predict_fraud(txn: TransactionRequest):"),
  codeLine("    d = txn.model_dump()"),
  codeLine("    result = predict(d)"),
  codeLine("    if result['fraud_probability'] > 0.5:"),
  codeLine("        ctx = {'id': f\"TXN-{d.get('TransactionID', 'LIVE')}\","),
  codeLine("               'customer': 'Live User',"),
  codeLine("               'amount': d.get('TransactionAmt', 0),"),
  codeLine("               'fraud_probability': result['fraud_probability'],"),
  codeLine("               'shap_explanation': result['shap_explanation']}"),
  codeLine("        a = send_alert(ctx)"),
  codeLine("        c = create_case(ctx)"),
  codeLine("        r = generate_report(ctx, case_id=c['case_id'])"),
  codeLine("        log_full_pipeline(ctx, [a, c, r])"),
  codeLine("        result['rpa_triggered'] = True"),
  codeLine("    return result"),

  mainHeading("A.3", "rpa/bot2_case.py — Case Management Bot"),
  codeLine("import sqlite3, os"),
  codeLine("from datetime import datetime"),
  codeLine("DB = os.path.join(os.path.dirname(__file__), 'fraud_cases.db')"),
  codeLine(""),
  codeLine("def init_database():"),
  codeLine("    c = sqlite3.connect(DB); cur = c.cursor()"),
  codeLine("    cur.execute('''CREATE TABLE IF NOT EXISTS fraud_cases ("),
  codeLine("        case_id TEXT PRIMARY KEY, transaction_id TEXT, customer TEXT,"),
  codeLine("        amount REAL, fraud_probability REAL, risk_level TEXT,"),
  codeLine("        top_risk_factor TEXT, status TEXT DEFAULT 'open',"),
  codeLine("        assigned_to TEXT, created_at TEXT)'''); c.commit(); c.close()"),
  codeLine(""),
  codeLine("def create_case(txn):"),
  codeLine("    init_database()"),
  codeLine("    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')"),
  codeLine("    p  = txn.get('fraud_probability', 0)"),
  codeLine("    c  = sqlite3.connect(DB); cur = c.cursor()"),
  codeLine("    cur.execute('SELECT COUNT(*) FROM fraud_cases'); n = cur.fetchone()[0]"),
  codeLine("    case_id = f'CASE-{n+1:04d}'"),
  codeLine("    if   p >= 0.7: risk, who = 'HIGH',   'Senior Fraud Analyst'"),
  codeLine("    elif p >= 0.3: risk, who = 'MEDIUM', 'Fraud Analyst Team'"),
  codeLine("    else:          risk, who = 'LOW',    'Auto-Review Queue'"),
  codeLine("    top = txn.get('shap_explanation', [{'feature':'N/A'}])[0]['feature']"),
  codeLine("    cur.execute('''INSERT INTO fraud_cases VALUES"),
  codeLine("                   (?,?,?,?,?,?,?,?,?,?)''',"),
  codeLine("        (case_id, txn.get('id','N/A'), txn.get('customer','?'),"),
  codeLine("         txn.get('amount',0), p, risk, top, 'open', who, ts))"),
  codeLine("    c.commit(); c.close()"),
  codeLine("    return {'bot':'Bot 2 - Case', 'status':'created',"),
  codeLine("            'case_id': case_id, 'risk_level': risk, 'assigned_to': who}"),

  mainHeading("A.4", "Project Folder Layout"),
  codeLine("D:/Final year project/"),
  codeLine("  ├── ml/            # data preprocessing, training, prediction"),
  codeLine("  │    ├── predict.py"),
  codeLine("  │    ├── xgb_model.pkl"),
  codeLine("  │    └── feature_names.pkl"),
  codeLine("  ├── api/           # FastAPI backend"),
  codeLine("  │    └── app.py"),
  codeLine("  ├── dashboard/     # React 19 + Tailwind analyst UI"),
  codeLine("  ├── rpa/           # four Python bots"),
  codeLine("  │    ├── bot1_alert.py"),
  codeLine("  │    ├── bot2_case.py"),
  codeLine("  │    ├── bot3_report.py"),
  codeLine("  │    ├── bot4_logger.py"),
  codeLine("  │    ├── fraud_cases.db"),
  codeLine("  │    ├── alerts/   # SMS + email artefacts"),
  codeLine("  │    ├── reports/  # RBI-format STR artefacts"),
  codeLine("  │    └── pipeline_log.txt"),
  codeLine("  ├── diagrams/      # Fig. 1.1, 1.2, 4.1-4.5"),
  codeLine("  ├── screenshot/    # Fig. 5.1-5.9"),
  codeLine("  ├── model_comparison.png           # Fig. 5.10"),
  codeLine("  ├── confusion_matrices (1).png     # Fig. 5.11"),
  codeLine("  ├── shap_feature_importance.png    # Fig. 5.12"),
  codeLine("  ├── shap_beeswarm.png              # Fig. 5.13"),
  codeLine("  ├── Fraud_Detection_Paper.docx     # IEEE paper"),
  codeLine("  └── Project_Report.docx            # this report"),
];

// ========================================================================
// ASSEMBLE DOCUMENT
// ========================================================================
const footer = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SZ_BODY }),
    ],
  })],
});

const doc = new Document({
  creator: "Rohan Thakur, Yogesh Kumar, Varnit Saini",
  title: "AI-Powered Fraud Detection & Prevention Ecosystem with RPA",
  description: "GEHU B.Tech Project Report",
  styles: {
    default: {
      document: { run: { font: FONT, size: SZ_BODY } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { orientation: PageOrientation.PORTRAIT, width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }, // 1" / 1.25" left
      },
    },
    footers: { default: footer },
    children: [
      ...cover,
      ...declaration,
      ...acknowledgement,
      ...abstract,
      ...toc,
      ...lof,
      ...lot,
      ...abbreviations,
      ...chapter1,
      ...chapter2,
      ...chapter3,
      ...chapter4,
      ...chapter5,
      ...chapter6,
      ...references,
      ...publications,
      ...appendix,
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`\n SUCCESS: Project_Report.docx written`);
  console.log(`   Path: ${OUT}`);
  console.log(`   Size: ${kb} KB (${buf.length} bytes)`);
}).catch((e) => {
  console.error("Build failed:", e);
  process.exit(1);
});
