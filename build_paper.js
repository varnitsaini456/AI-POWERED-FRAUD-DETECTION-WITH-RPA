// Build IEEE Conference format paper as .docx
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, PageOrientation, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, SectionType, PageBreak, TabStopType,
  TabStopPosition, Footer, PageNumber
} = require('docx');

const FONT = "Times New Roman";

// ----- Helpers -----
const P = (opts) => new Paragraph(opts);
const T = (text, opts = {}) => new TextRun({ text, font: FONT, size: 20, ...opts });

// Body paragraph: 10pt TNR, justified, first-line indent 0.2"
const body = (runs, extra = {}) => P({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 0, line: 240 },
  indent: { firstLine: 288 }, // 0.2" = 288 DXA
  children: runs,
  ...extra,
});

const bodyText = (text) => body([T(text)]);

// Section heading: Roman numeral, centered, 10pt, small caps style (use bold all-caps)
const sectionHeading = (roman, title) => P({
  alignment: AlignmentType.CENTER,
  spacing: { before: 240, after: 120 },
  children: [
    T(`${roman}.  `, { bold: false }),
    T(title.toUpperCase(), { bold: false, smallCaps: true }),
  ],
});

// Subsection heading: italic, letter prefix
const subHeading = (letter, title) => P({
  alignment: AlignmentType.LEFT,
  spacing: { before: 120, after: 60 },
  children: [
    T(`${letter}.  `, { italics: true }),
    T(title, { italics: true }),
  ],
});

// Abstract paragraph: bold italic
const abstractPara = (text) => P({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 80, line: 240 },
  children: [
    T("Abstract—", { bold: true, italics: true }),
    T(text, { bold: true, italics: true }),
  ],
});

const keywordsPara = (text) => P({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 160, line: 240 },
  children: [
    T("Keywords—", { bold: true, italics: true }),
    T(text, { italics: true }),
  ],
});

// ----- Title block (single column section) -----
const titlePara = P({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({
    text: "AI-Powered Fraud Detection & Prevention Ecosystem with Robotic Process Automation (RPA)",
    font: FONT, size: 48, // 24pt
  })],
});

// Authors: names in one line centered, then affiliation
const authorsPara = P({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [new TextRun({
    text: "Rohan Thakur, Yogesh Kumar, Varnit Saini, Mrs. Neha Pokhriyal",
    font: FONT, size: 22, // 11pt
  })],
});

const affiliationPara = P({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [new TextRun({
    text: "Department of Computer Science Engineering (AI & ML)",
    font: FONT, size: 20, italics: true,
  })],
});

const affiliationPara2 = P({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [new TextRun({
    text: "Graphic Era Hill University",
    font: FONT, size: 20, italics: true,
  })],
});

const affiliationPara3 = P({
  alignment: AlignmentType.CENTER,
  spacing: { after: 360 },
  children: [new TextRun({
    text: "Dehradun, Uttarakhand, India",
    font: FONT, size: 20, italics: true,
  })],
});

// ----- Abstract -----
const abstract = abstractPara(
  "Financial fraud continues to cause very large losses every year, and manual review alone cannot keep pace with the growth in digital transactions. This paper presents an end-to-end fraud detection and prevention ecosystem that combines supervised machine learning with Robotic Process Automation (RPA). Four tree-based classifiers — LightGBM, XGBoost, Random Forest, and AdaBoost — were trained on the IEEE-CIS Fraud Detection dataset of 590,540 transactions and 471 features after preprocessing. Class imbalance was handled using SMOTE applied only to the training set to prevent data leakage. On the held-out test set, XGBoost gave the best balance among the four models with an F1-score of 0.6762, precision of 0.8935, and AUC-ROC of 0.9522. SHAP values were generated for every prediction to expose the features that drove the decision, giving analysts a reason for each alert rather than an opaque score. When a transaction crossed the fraud threshold, four Python RPA bots were triggered automatically: a customer alert bot, a case-creation bot with queue routing, a report bot that generated an RBI-format Suspicious Transaction Report, and an audit logger. The detection model is served through a FastAPI backend, and a React dashboard allows analysts to submit live transactions and review the returned explanations and automated actions. The contribution of this work is not a single model but a working pipeline in which detection, explanation, and response are joined into one system."
);

const keywords = keywordsPara(
  "Fraud Detection, Machine Learning, XGBoost, SHAP, Robotic Process Automation, Class Imbalance, SMOTE, Explainable AI, FastAPI"
);

// ========================================================================
// SECTION I — Introduction
// ========================================================================
const introContent = [
  sectionHeading("I", "Introduction"),
  bodyText("Digital payments have moved from a convenience to the default mode of transacting in many economies. India alone processed tens of billions of card and UPI transactions in the last financial year, and a similar shift has happened in most emerging markets. The same growth has also opened new surfaces for financial fraud. The Reserve Bank of India's 2022–23 Trend and Progress report lists a sharp year-on-year rise in reported card and internet banking frauds [1], and the ACFE's 2024 Report to the Nations estimates global occupational and payment fraud losses in the trillions of dollars [2]. The Nilson Report places worldwide card fraud at over thirty billion dollars per year [3]. These numbers make it clear that a detection system cannot be a slow or manual process."),
  bodyText("Two weaknesses show up repeatedly in current bank systems. The first is the detection layer itself. Rule-based engines flag anything that matches a fixed condition, for example a transaction above a threshold or a card used outside its usual country. Fraudsters learn these rules and adapt, and legitimate customers are caught by them every day. The second weakness sits on the other side of the alert. Once a fraud is flagged, the response still involves manual steps: an analyst opens a case, calls or messages the customer, fills a regulatory report, and updates an internal log. This pipeline is slow, expensive to staff, and prone to inconsistency, which is the exact gap that Robotic Process Automation (RPA) is designed to close [14], [15]."),
  bodyText("This paper presents a system that addresses both sides of the problem in one pipeline. On the detection side, four tree-based machine learning models are trained and compared on a real-world fraud dataset, with SMOTE used to correct the heavy class imbalance and SHAP used to explain every prediction. On the response side, four RPA bots are wired into the prediction endpoint so that a detected fraud triggers the full downstream workflow — customer alert, case assignment, regulatory report, and audit log — without analyst involvement. The entire system is served through a FastAPI backend and exposed through a React dashboard that allows the user to submit a live transaction and see both the risk score and the bots' actions."),
  bodyText("The rest of the paper is organised as follows. Section II reviews prior work in fraud detection and RPA. Section III describes the dataset and preprocessing. Section IV details the methodology, including the four candidate models, SHAP integration, and the RPA layer. Section V reports the experimental results and discusses the trade-offs between the models. Section VI concludes the paper and outlines future directions."),
];

// ========================================================================
// SECTION II — Related Work
// ========================================================================
const relatedContent = [
  sectionHeading("II", "Related Work"),
  bodyText("Early approaches to credit card fraud detection were rule-based, using hand-written conditions on transaction amount, time, location, and velocity. These systems are still widely deployed in banks because they are transparent, but they are known to have a high false-positive rate and cannot adapt to new fraud patterns without human intervention [20]."),
  bodyText("The move towards machine learning has been studied in several comparative works. Awoyemi et al. [19] compared Naïve Bayes, k-Nearest Neighbors, and logistic regression on a credit card transaction set and reported that tree-based and distance-based methods outperformed linear baselines. Abdallah, Maarof, and Zainal [20] surveyed a wide range of fraud detection systems and noted that no single classifier dominates across domains, which motivates the comparative approach taken in this paper. Sahin, Bulkan, and Duman [13] proposed a cost-sensitive decision tree variant, acknowledging that misclassifying a fraud is far more expensive than misclassifying a legitimate transaction."),
  bodyText("A separate but closely related problem is class imbalance. In most real fraud datasets the fraud rate sits between one and five per cent, which pushes standard classifiers to optimise for the majority class. Chawla et al. introduced SMOTE to generate synthetic minority examples and reduce this bias [9]. Dal Pozzolo et al. [12] later studied probability calibration on imbalanced data and showed that undersampling distorts predicted probabilities, which matters when a bank needs to threshold the output."),
  bodyText("Gradient boosting has become the preferred family for tabular fraud data. XGBoost [5] and LightGBM [6] consistently appear in the top solutions of the IEEE-CIS and similar Kaggle competitions, with Random Forest [7] and AdaBoost [8] still used as baselines. These four methods form the comparison set in this work."),
  bodyText("Explainability is the next layer. Lundberg and Lee's SHAP framework [10] provides a unified way to attribute a prediction to each input feature, and the tree-specific variant in [11] makes the computation tractable for large gradient-boosted models. SHAP is now standard in regulated domains where a model decision must be defensible to an auditor."),
  bodyText("On the automation side, Robotic Process Automation has been studied mainly in enterprise operations. Van der Aalst, Bichler, and Heinzl [15] position RPA as the automation of rule-based, repeatable office work, and Syed et al. [14] survey challenges in integrating RPA with intelligent systems. Most published fraud systems stop at the detection output and leave the response to human operators. The contribution of this paper is to close that loop by driving the RPA layer directly from the model's output."),
];

// ========================================================================
// SECTION III — Dataset and Preprocessing
// ========================================================================
const datasetContent = [
  sectionHeading("III", "Dataset and Preprocessing"),
  subHeading("A", "Source and Scale"),
  bodyText("The IEEE-CIS Fraud Detection dataset released by Vesta Corporation on Kaggle [4] was used for all experiments. The raw dataset contains 590,540 transactions spanning several months of real e-commerce activity. Each transaction is described by 433 attributes split across two tables: a transaction table with payment, product, and card information, and an identity table with device, browser, and network fingerprints. The label is a single binary column, isFraud."),
  bodyText("The class distribution is heavily skewed: approximately 3.5 per cent of transactions are labelled as fraud, and the remaining 96.5 per cent are legitimate. This ratio is representative of real bank portfolios, which is why the dataset was chosen over smaller balanced benchmarks."),
  subHeading("B", "Preprocessing Pipeline"),
  bodyText("Four preprocessing steps were applied before training. First, the transaction and identity tables were merged on TransactionID using a left join, which keeps every transaction even when no identity record exists. Second, columns with more than ninety per cent missing values were dropped, and the remaining missing numeric cells were filled with the column median. Missing categorical cells were replaced with the string \"unknown\" before encoding. Third, all categorical columns were label-encoded, which suits the tree-based models used later. Fourth, an eighty-twenty stratified split was performed on the combined data, producing 472,432 training rows and 118,108 test rows with the fraud rate preserved in both sets."),
  bodyText("After preprocessing, each transaction was described by 471 features. SMOTE [9] was then applied only to the training split to synthesise new minority examples until the classes were balanced. Applying SMOTE before the train-test split is a known source of data leakage — synthetic points built from a test sample would appear in training — and was deliberately avoided."),
];

// ========================================================================
// SECTION IV — Methodology
// ========================================================================
const methodContent = [
  sectionHeading("IV", "Methodology"),
  subHeading("A", "System Architecture"),
  bodyText("The system is organised as four loosely coupled layers. The machine learning layer holds the trained XGBoost model and a SHAP explainer. The API layer, built on FastAPI [17], exposes a single /predict endpoint and loads the model once at startup. The presentation layer is a React [18] dashboard that collects transaction inputs, displays the returned risk score and SHAP explanation, and renders the actions taken by the automation layer. The automation layer is a set of four Python RPA bots that are invoked from the API whenever the fraud probability crosses a configurable threshold. Each layer can be developed, tested, and replaced independently."),
  subHeading("B", "Candidate Models"),
  bodyText("Four classifiers were trained on the SMOTE-balanced training set and evaluated on the held-out test set. LightGBM [6] was configured with two hundred boosting rounds, a maximum leaf count of thirty-one, and a learning rate of 0.05. XGBoost [5] used two hundred trees, a maximum depth of eight, a learning rate of 0.1, and scale_pos_weight set to the ratio of negative to positive samples in the training data. Random Forest [7] was configured with one hundred trees and the default Gini criterion. AdaBoost [8] used a decision-stump base learner with one hundred boosting rounds. All four models were trained on an identical train split and evaluated on an identical test split so that the reported numbers are directly comparable."),
  subHeading("C", "SHAP Explanation Layer"),
  bodyText("SHAP values were computed with the TreeExplainer variant [11], which exploits the structure of gradient-boosted trees to calculate exact Shapley values in polynomial time. The explainer is instantiated once at server startup together with the model. For each prediction, the top contributing features are extracted and returned alongside the probability. The dashboard renders these as a horizontal bar chart, with positive contributions pushing the decision towards fraud and negative contributions pushing it towards legitimate."),
  subHeading("D", "RPA Layer"),
  bodyText("Four Python scripts implement the automation layer. Bot 1 (Alert) composes an SMS and email message that summarises the flagged transaction and the top three SHAP features. Bot 2 (Case) writes a new record into a SQLite case database, auto-assigning the case to a queue (priority, standard, or low) based on the fraud probability. Bot 3 (Report) generates a Suspicious Transaction Report in the format specified by the Financial Intelligence Unit of India [16] and saves it to disk. Bot 4 (Logger) appends a structured entry to both a plain-text audit log and a JSON log for downstream ingestion. The four bots are invoked sequentially from the /predict endpoint whenever the returned probability exceeds 0.5, and their outputs are attached to the API response so that the dashboard can display what happened."),
  subHeading("E", "Evaluation Metrics"),
  bodyText("Accuracy alone is insufficient for this task because the majority class is so dominant. The primary metrics reported are precision, recall, F1-score, AUC-ROC, and average precision, all computed on the positive (fraud) class. Precision indicates how many of the alerts are real fraud, recall indicates how many of the real frauds are caught, and F1 balances the two. AUC-ROC and average precision summarise behaviour across all thresholds."),
];

// ========================================================================
// SECTION V — Results and Discussion
// ========================================================================

// Helper for table cell (header)
const makeCell = (text, opts = {}) => new TableCell({
  width: { size: opts.width, type: WidthType.DXA },
  shading: opts.header ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
  margins: { top: 60, bottom: 60, left: 80, right: 80 },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  },
  children: [P({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({
      text, font: FONT, size: 18, // 9pt for table
      bold: opts.header || false,
    })],
  })],
});

const tableRow = (cells, width, headerRow = false) => new TableRow({
  tableHeader: headerRow,
  children: cells.map(c => makeCell(c, { width, header: headerRow })),
});

// Table I — 7 columns: Model | Acc | Prec | Rec | F1 | AUC | AP | Time
// Content width in 2-column IEEE ≈ one column. Place table spanning one column.
// Col width per cell: 4800 / 8 = 600 DXA
const TABLE_WIDTH = 4800;
const COLS = 8;
const COL_W = TABLE_WIDTH / COLS;

const tableI = new Table({
  width: { size: TABLE_WIDTH, type: WidthType.DXA },
  columnWidths: Array(COLS).fill(COL_W),
  rows: [
    tableRow(["Model", "Acc", "Prec", "Rec", "F1", "AUC", "AP", "Time(s)"], COL_W, true),
    tableRow(["LightGBM", "0.9804", "0.8782", "0.5093", "0.6447", "0.9450", "0.7072", "208.3"], COL_W),
    tableRow(["XGBoost", "0.9818", "0.8935", "0.5439", "0.6762", "0.9522", "0.7446", "394.2"], COL_W),
    tableRow(["Rand. Forest", "0.9738", "0.6723", "0.4929", "0.5688", "0.9086", "0.5942", "1342.9"], COL_W),
    tableRow(["AdaBoost", "0.8522", "0.1549", "0.7237", "0.2552", "0.8770", "0.3179", "1069.5"], COL_W),
  ],
});

const tableCaption = P({
  alignment: AlignmentType.CENTER,
  spacing: { before: 60, after: 160 },
  children: [
    new TextRun({ text: "TABLE I. ", font: FONT, size: 18, smallCaps: true }),
    new TextRun({ text: "MODEL PERFORMANCE ON TEST SET", font: FONT, size: 18, smallCaps: true }),
  ],
});

const tableTitle = P({
  alignment: AlignmentType.CENTER,
  spacing: { before: 160, after: 40 },
  children: [new TextRun({ text: "TABLE I", font: FONT, size: 18, bold: true })],
});

// Image helpers — figures at column width (about 3.3 inches ≈ 320 px)
const makeFigure = (filename, captionNum, captionText, widthPx) => {
  const buf = fs.readFileSync(path.join(__dirname, filename));
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const width = widthPx;
  const height = Math.round((h / w) * width);
  return [
    P({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 40 },
      children: [new ImageRun({
        type: "png",
        data: buf,
        transformation: { width, height },
        altText: { title: captionText, description: captionText, name: filename },
      })],
    }),
    P({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [
        new TextRun({ text: `Fig. ${captionNum}. `, font: FONT, size: 18, bold: true }),
        new TextRun({ text: captionText, font: FONT, size: 18 }),
      ],
    }),
  ];
};

const resultsContent = [
  sectionHeading("V", "Results and Discussion"),
  subHeading("A", "Overall Model Comparison"),
  bodyText("Table I presents the performance of the four models on the held-out test set of 118,108 transactions. All scores are reported on the positive (fraud) class."),
  tableTitle,
  P({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
    new TextRun({ text: "MODEL PERFORMANCE ON TEST SET", font: FONT, size: 18, smallCaps: true })
  ]}),
  tableI,
  P({ spacing: { after: 120 }, children: [T("")] }),
  ...makeFigure("model_comparison.png", 1, "Comparison of four classifiers across Accuracy, Precision, Recall, F1-score, and AUC-ROC on the held-out test set.", 320),
  subHeading("B", "Discussion"),
  bodyText("Accuracy alone is misleading on this dataset. A trivial model that predicts every transaction as legitimate would reach roughly 96.5 per cent accuracy because the fraud rate is so low. What actually matters is how each model handles the minority class, and the four models behave very differently."),
  bodyText("XGBoost came out on top on nearly every metric that reflects real fraud-detection value: the highest F1 (0.6762), the highest AUC-ROC (0.9522), the highest average precision (0.7446), and the best precision (0.8935). LightGBM was a close second and trained almost twice as fast (208 s against 394 s for XGBoost), which makes it an attractive choice in settings where retraining cost matters more than a small accuracy gap. Both gradient-boosted methods clearly beat the other two baselines."),
  bodyText("Random Forest trailed the boosted models on every metric and took the longest to train after AdaBoost (1343 s). Its recall of 0.4929 means it missed slightly more than half of all fraudulent transactions, and its precision of 0.6723 is noticeably lower than XGBoost's 0.8935, so the alerts it does raise are less trustworthy."),
  bodyText("AdaBoost shows a pattern worth discussing separately because it is the opposite of the others. Its recall of 0.7237 is actually the highest in the table — it flags more fraud than any other model. The problem is precision: at 0.1549, fewer than one in six of its alerts is correct. For every true fraud caught, roughly five legitimate customers would be wrongly flagged. In a production fraud system this is unworkable, because every false positive translates into a blocked card, an unhappy customer, and manual analyst time. AdaBoost's behaviour here is consistent with known weaknesses of the algorithm on imbalanced data: it keeps reweighting hard examples until the decision boundary drifts deep into the majority class, trading precision for recall."),
  subHeading("C", "Confusion Matrices"),
  bodyText("Fig. 2 shows the confusion matrices for all four models side by side. The pattern from Table I is visible directly: XGBoost and LightGBM concentrate the correct predictions on the diagonal with a small number of false positives, Random Forest leaks more to both off-diagonal cells, and AdaBoost shows a very large false-positive block consistent with its low precision."),
  ...makeFigure("confusion_matrices (1).png", 2, "Confusion matrices for the four classifiers on the test set. Rows are actual classes and columns are predicted classes.", 320),
  bodyText("For XGBoost specifically, the test set contains 118,108 transactions with an approximate fraud count of 4,134. With the measured precision of 0.8935 and recall of 0.5439, this corresponds to roughly 2,249 true positives, 1,885 false negatives, 268 false positives, and 113,706 true negatives. The 1,885 false negatives are the most important number for deployment: they represent fraud that slipped past the model. Lowering the decision threshold below 0.5 would reduce this count at the cost of more false alarms, a trade-off that the system operator must make based on the relative cost of each error type."),
  subHeading("D", "Feature Importance and SHAP Analysis"),
  bodyText("The SHAP summary in Fig. 3 ranks the features that the XGBoost model relies on most, averaged over the test set. Card-related identifiers (card1, card2) and product-level features appear near the top, alongside transaction amount, which is consistent with fraud patterns reported in prior work on this dataset. The beeswarm plot in Fig. 4 adds the direction of effect: for each top feature, it shows whether high values push the prediction towards fraud (right of centre) or away from it (left of centre). This view is what makes SHAP useful in practice — not just which features mattered on average, but how an individual value moved a specific prediction."),
  ...makeFigure("shap_feature_importance.png", 3, "Mean absolute SHAP value for the top features of the XGBoost model, aggregated over the test set.", 280),
  ...makeFigure("shap_beeswarm.png", 4, "SHAP beeswarm plot. Each dot is one transaction; horizontal position is the feature's SHAP value (impact on the prediction) and colour encodes the underlying feature value.", 280),
];

// ========================================================================
// SECTION VI — Conclusion and Future Work
// ========================================================================
const conclusionContent = [
  sectionHeading("VI", "Conclusion and Future Work"),
  subHeading("A", "Conclusion"),
  bodyText("This work presented an end-to-end fraud detection and prevention ecosystem that combines a supervised machine-learning pipeline, a model-serving API, an analyst-facing dashboard, and a set of Robotic Process Automation bots that act on each detected fraud without human intervention. Four tree-based classifiers were trained and compared on the IEEE-CIS Fraud Detection dataset of 590,540 transactions with 471 features after preprocessing. XGBoost produced the strongest results, with an F1-score of 0.6762, precision of 0.8935, and AUC-ROC of 0.9522, and was chosen as the production model."),
  bodyText("Rather than stopping at the model, the system wraps the prediction inside an explanation and an action. Every flagged transaction is paired with a SHAP-based ranking of the features that drove the decision, which gives the analyst a reason for the alert instead of a black-box probability. When the probability crosses a configurable threshold, four automation bots fire in sequence: a customer alert bot, a case-creation bot that assigns the incident to the correct queue, a report bot that produces an RBI-format Suspicious Transaction Report, and a logger that writes a complete audit trail. The result is a working prototype of how AI detection and RPA response can be joined into a single pipeline, rather than two separate tools that analysts must stitch together manually."),
  subHeading("B", "Limitations"),
  bodyText("The system has several honest limitations. First, the 1,885 false negatives produced by XGBoost on the test set show that roughly 45 per cent of fraudulent transactions still slip through at the default threshold. Lowering the threshold helps, but increases the false-positive burden on analysts. Second, the RPA bots are simulated: the SMS alert prints a formatted message rather than contacting a real telecom gateway, and the case tracker uses a local SQLite database rather than an enterprise ITSM tool. Third, the model is trained on a static historical dataset and does not adapt as fraud patterns change. Finally, the IEEE-CIS dataset has fully anonymised features, so the SHAP explanations reference names like C1 or V257 rather than human-readable fields; in a real bank deployment this would be solved by feeding the bots the original field names."),
  subHeading("C", "Future Work"),
  bodyText("Several directions would strengthen the system. Online or incremental learning would let the model update on every new batch of confirmed fraud labels without a full retrain. The four RPA bots are designed to be swappable: Bot 1 could be connected to a real SMS gateway or SMTP relay, Bot 2 to an enterprise case management tool, and Bot 3 to the bank's regulatory filing system for direct STR submission to FIU-IND. Graph neural network approaches on a transaction graph would capture shared-card and shared-device relationships that a flat tabular model cannot. Threshold optimisation against an explicit business cost function, rather than a fixed 0.5 cutoff, would let the system be tuned directly to the economics of the bank. A full Bayesian hyperparameter search over the XGBoost configuration is likely to push F1 above 0.70. Finally, adversarial testing — generating synthetic fraudulent transactions designed to evade the current model — would expose blind spots and inform the next round of training."),
];

// ========================================================================
// REFERENCES
// ========================================================================
const refStyle = (n, text) => P({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 40, line: 220 },
  indent: { left: 288, hanging: 288 },
  children: [new TextRun({ text: `[${n}]\t${text}`, font: FONT, size: 18 })],
});

const referencesContent = [
  sectionHeading("VII", "References"),
  refStyle(1, "Reserve Bank of India, Report on Trend and Progress of Banking in India 2022–23, Mumbai, India: RBI, Dec. 2023. [Online]. Available: https://www.rbi.org.in"),
  refStyle(2, "Association of Certified Fraud Examiners, Occupational Fraud 2024: A Report to the Nations, Austin, TX: ACFE, 2024."),
  refStyle(3, "Nilson Report, \"Card Fraud Losses Worldwide,\" The Nilson Report, no. 1254, pp. 5–6, Dec. 2023."),
  refStyle(4, "C. Vesset et al., \"IEEE-CIS Fraud Detection Dataset,\" Kaggle Competition, 2019. [Online]. Available: https://www.kaggle.com/c/ieee-fraud-detection"),
  refStyle(5, "T. Chen and C. Guestrin, \"XGBoost: A Scalable Tree Boosting System,\" in Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining (KDD '16), San Francisco, CA, USA, Aug. 2016, pp. 785–794."),
  refStyle(6, "G. Ke et al., \"LightGBM: A Highly Efficient Gradient Boosting Decision Tree,\" in Proc. 31st Conf. Neural Information Processing Systems (NeurIPS), Long Beach, CA, USA, Dec. 2017, pp. 3146–3154."),
  refStyle(7, "L. Breiman, \"Random Forests,\" Machine Learning, vol. 45, no. 1, pp. 5–32, Oct. 2001."),
  refStyle(8, "Y. Freund and R. E. Schapire, \"A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting,\" Journal of Computer and System Sciences, vol. 55, no. 1, pp. 119–139, Aug. 1997."),
  refStyle(9, "N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, \"SMOTE: Synthetic Minority Over-Sampling Technique,\" Journal of Artificial Intelligence Research, vol. 16, pp. 321–357, Jun. 2002."),
  refStyle(10, "S. M. Lundberg and S.-I. Lee, \"A Unified Approach to Interpreting Model Predictions,\" in Proc. 31st Conf. Neural Information Processing Systems (NeurIPS), Long Beach, CA, USA, Dec. 2017, pp. 4765–4774."),
  refStyle(11, "S. M. Lundberg et al., \"From Local Explanations to Global Understanding with Explainable AI for Trees,\" Nature Machine Intelligence, vol. 2, no. 1, pp. 56–67, Jan. 2020."),
  refStyle(12, "A. Dal Pozzolo, O. Caelen, R. A. Johnson, and G. Bontempi, \"Calibrating Probability with Undersampling for Unbalanced Classification,\" in Proc. IEEE Symp. Computational Intelligence and Data Mining (CIDM), Cape Town, South Africa, Dec. 2015, pp. 159–166."),
  refStyle(13, "Y. Sahin, S. Bulkan, and E. Duman, \"A Cost-Sensitive Decision Tree Approach for Fraud Detection,\" Expert Systems with Applications, vol. 40, no. 15, pp. 5916–5923, Nov. 2013."),
  refStyle(14, "R. Syed et al., \"Robotic Process Automation: Contemporary Themes and Challenges,\" Computers in Industry, vol. 115, Art. no. 103162, Feb. 2020."),
  refStyle(15, "W. M. P. van der Aalst, M. Bichler, and A. Heinzl, \"Robotic Process Automation,\" Business & Information Systems Engineering, vol. 60, no. 4, pp. 269–272, Jul. 2018."),
  refStyle(16, "Financial Intelligence Unit – India (FIU-IND), Guidelines on Filing of Suspicious Transaction Reports (STRs), New Delhi, India: Ministry of Finance, 2023. [Online]. Available: https://fiuindia.gov.in"),
  refStyle(17, "S. Ramírez, FastAPI: Modern, Fast Web Framework for Building APIs with Python 3.8+, 2018. [Online]. Available: https://fastapi.tiangolo.com"),
  refStyle(18, "Meta Open Source, React: A JavaScript Library for Building User Interfaces, 2024. [Online]. Available: https://react.dev"),
  refStyle(19, "J. O. Awoyemi, A. O. Adetunmbi, and S. A. Oluwadare, \"Credit Card Fraud Detection Using Machine Learning Techniques: A Comparative Analysis,\" in Proc. Int. Conf. Computing Networking and Informatics (ICCNI), Lagos, Nigeria, Oct. 2017, pp. 1–9."),
  refStyle(20, "A. Abdallah, M. A. Maarof, and A. Zainal, \"Fraud Detection System: A Survey,\" Journal of Network and Computer Applications, vol. 68, pp. 90–113, Jun. 2016."),
];

// ========================================================================
// DOCUMENT ASSEMBLY — IEEE two-section layout
// ========================================================================
// Section 1: single column for title/authors
// Section 2 (continuous): two columns for abstract + body + refs
// A4 page: 11906 x 16838 DXA
// IEEE margins: top 0.75" (1080), bottom 1" (1440), left/right 0.625" (900)

const doc = new Document({
  creator: "Rohan Thakur",
  title: "AI-Powered Fraud Detection & Prevention Ecosystem with RPA",
  styles: {
    default: {
      document: { run: { font: FONT, size: 20 } }, // 10pt default
    },
  },
  sections: [
    // Section 1: Title block (single column)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1080, bottom: 1440, left: 900, right: 900 },
        },
        column: { count: 1 },
      },
      children: [
        titlePara,
        authorsPara,
        affiliationPara,
        affiliationPara2,
        affiliationPara3,
      ],
    },
    // Section 2: Two-column body (continuous - starts on same page)
    {
      properties: {
        type: SectionType.CONTINUOUS,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1080, bottom: 1440, left: 900, right: 900 },
        },
        column: {
          count: 2,
          space: 432, // 0.3" gap between columns
          equalWidth: true,
        },
      },
      children: [
        abstract,
        keywords,
        ...introContent,
        ...relatedContent,
        ...datasetContent,
        ...methodContent,
        ...resultsContent,
        ...conclusionContent,
        ...referencesContent,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const out = path.join(__dirname, "Fraud_Detection_Paper.docx");
  fs.writeFileSync(out, buffer);
  console.log("Wrote:", out, "(" + buffer.length + " bytes)");
}).catch(err => {
  console.error("Error building docx:", err);
  process.exit(1);
});
