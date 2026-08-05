"""
Generates all 5 diagrams for the Chapter 4 of the Project Report.
Output: PNG files saved into the same folder as this script.
"""
import os
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle, Ellipse
from matplotlib.lines import Line2D

OUT = os.path.dirname(os.path.abspath(__file__))

# ---------- shared style ----------
plt.rcParams.update({
    "font.family": "Times New Roman",
    "font.size": 11,
})

# Colour palette
C_BG      = "#F7FAFC"
C_BLUE    = "#1D4E89"
C_TEAL    = "#2A9D8F"
C_ORANGE  = "#E76F51"
C_YELLOW  = "#F4A261"
C_GREY    = "#6C757D"
C_LIGHT   = "#E9ECEF"

# =========================================================================
# Figure 4.1 — System Architecture (4-layer)
# =========================================================================
def fig_architecture():
    fig, ax = plt.subplots(figsize=(10, 9))
    ax.set_xlim(0, 10); ax.set_ylim(0, 12)
    ax.axis("off")

    def layer(y, h, color, title):
        r = FancyBboxPatch((0.5, y), 9, h,
                           boxstyle="round,pad=0.05,rounding_size=0.15",
                           linewidth=1.5, edgecolor=color,
                           facecolor=color + "22")
        ax.add_patch(r)
        # Layer title placed OUTSIDE (above-left of) the band to avoid collisions
        ax.text(0.55, y + h + 0.05, title, fontsize=11, weight="bold",
                color=color, va="bottom", ha="left")

    def box(x, y, w, h, label, color):
        r = FancyBboxPatch((x, y), w, h,
                           boxstyle="round,pad=0.02,rounding_size=0.08",
                           linewidth=1.2, edgecolor=color,
                           facecolor="white")
        ax.add_patch(r)
        ax.text(x + w/2, y + h/2, label, ha="center", va="center",
                fontsize=10, weight="bold", color=color)

    def arrow(x1, y1, x2, y2, color="#333"):
        a = FancyArrowPatch((x1, y1), (x2, y2),
                            arrowstyle="-|>", mutation_scale=15,
                            linewidth=1.3, color=color)
        ax.add_patch(a)

    # Taller canvas to fit layer labels above each band
    ax.set_ylim(0, 12)

    # User icon on top
    ax.text(5, 11.6, "[ Analyst / User ]", ha="center", fontsize=11, weight="bold")

    # Layer 1 — Presentation (React)
    layer(9.4, 1.0, C_BLUE, "Presentation Layer")
    box(1.0, 9.5, 2.5, 0.8, "Dashboard\n(React)", C_BLUE)
    box(3.8, 9.5, 2.4, 0.8, "Predict Form\n(Axios)", C_BLUE)
    box(6.5, 9.5, 2.5, 0.8, "Charts\n(Recharts)", C_BLUE)

    # Layer 2 — API
    layer(7.5, 1.0, C_TEAL, "API Layer")
    box(1.0, 7.6, 2.5, 0.8, "FastAPI\n/predict", C_TEAL)
    box(3.8, 7.6, 2.4, 0.8, "Pydantic\nValidation", C_TEAL)
    box(6.5, 7.6, 2.5, 0.8, "CORS\nMiddleware", C_TEAL)

    # Layer 3 — ML Core
    layer(5.6, 1.0, C_ORANGE, "Machine Learning Core")
    box(1.0, 5.7, 2.5, 0.8, "XGBoost\nClassifier", C_ORANGE)
    box(3.8, 5.7, 2.4, 0.8, "SHAP\nTreeExplainer", C_ORANGE)
    box(6.5, 5.7, 2.5, 0.8, "Preprocessing\nPipeline", C_ORANGE)

    # Layer 4 — RPA
    layer(3.7, 1.0, C_YELLOW, "Robotic Process Automation Layer")
    box(0.8, 3.8, 2.0, 0.8, "Bot 1\nAlert (SMS)", C_YELLOW)
    box(2.95, 3.8, 2.0, 0.8, "Bot 2\nCase (SQLite)", C_YELLOW)
    box(5.1, 3.8, 2.0, 0.8, "Bot 3\nSTR Report", C_YELLOW)
    box(7.25, 3.8, 2.0, 0.8, "Bot 4\nAudit Logger", C_YELLOW)

    # Layer 5 — Data Stores
    layer(1.8, 1.0, C_GREY, "Data Stores")
    box(1.0, 1.9, 2.5, 0.8, "Model .pkl\n/ SHAP", C_GREY)
    box(3.8, 1.9, 2.4, 0.8, "SQLite\ncases.db", C_GREY)
    box(6.5, 1.9, 2.5, 0.8, "Logs\n(txt + JSON)", C_GREY)

    # Arrows between layers
    arrow(5, 11.5, 5, 10.45)   # user to presentation
    arrow(5, 9.35, 5, 8.55)    # presentation to API
    arrow(5, 7.45, 5, 6.65)    # API to ML
    arrow(5, 5.55, 5, 4.75)    # ML to RPA
    arrow(5, 3.65, 5, 2.85)    # RPA to storage

    plt.title("Fig. 4.1  System Architecture of Fraud Detection Ecosystem",
              fontsize=13, pad=12)
    plt.tight_layout()
    out = os.path.join(OUT, "fig_4_1_architecture.png")
    plt.savefig(out, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    print("saved", out)


# =========================================================================
# Figure 4.2 — Data Flow Diagram
# =========================================================================
def fig_dataflow():
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_xlim(0, 14); ax.set_ylim(0, 8)
    ax.axis("off")

    def node(x, y, w, h, label, color):
        r = FancyBboxPatch((x-w/2, y-h/2), w, h,
                           boxstyle="round,pad=0.02,rounding_size=0.1",
                           linewidth=1.3, edgecolor=color, facecolor=color+"22")
        ax.add_patch(r)
        ax.text(x, y, label, ha="center", va="center", fontsize=10, weight="bold")

    def arrow(x1, y1, x2, y2, label=None, color="#333"):
        a = FancyArrowPatch((x1, y1), (x2, y2),
                            arrowstyle="-|>", mutation_scale=14,
                            linewidth=1.2, color=color)
        ax.add_patch(a)
        if label:
            mx, my = (x1+x2)/2, (y1+y2)/2 + 0.18
            ax.text(mx, my, label, ha="center", fontsize=8.5, style="italic",
                    color="#444")

    # Main horizontal flow
    node(1.0, 5.5, 1.6, 0.9, "User /\nAnalyst", C_BLUE)
    node(3.2, 5.5, 1.6, 0.9, "Predict\nForm", C_BLUE)
    node(5.4, 5.5, 1.7, 0.9, "FastAPI\n/predict", C_TEAL)
    node(7.7, 5.5, 1.7, 0.9, "Preprocess\n& Validate", C_TEAL)
    node(10.0, 5.5, 1.8, 0.9, "XGBoost\n+ SHAP", C_ORANGE)
    node(12.5, 5.5, 1.6, 0.9, "JSON\nResponse", C_TEAL)

    # Arrows across top row
    arrow(1.8, 5.5, 2.4, 5.5, "input")
    arrow(4.0, 5.5, 4.6, 5.5, "HTTP POST")
    arrow(6.25, 5.5, 6.85, 5.5, "dict")
    arrow(8.55, 5.5, 9.1, 5.5, "vector")
    arrow(10.9, 5.5, 11.7, 5.5, "prob + shap")

    # Branch: if prob > 0.5 -> RPA bots
    node(10.0, 3.0, 2.4, 0.8, "probability > 0.5 ?", C_GREY)
    arrow(10.0, 5.05, 10.0, 3.4, "yes", color=C_ORANGE)

    # RPA bots row
    node(2.0, 1.3, 1.9, 0.8, "Bot 1\nAlert", C_YELLOW)
    node(4.5, 1.3, 1.9, 0.8, "Bot 2\nCase", C_YELLOW)
    node(7.0, 1.3, 1.9, 0.8, "Bot 3\nSTR Report", C_YELLOW)
    node(9.5, 1.3, 1.9, 0.8, "Bot 4\nLogger", C_YELLOW)

    # Arrows from decision to bots
    arrow(9.2, 2.6, 2.8, 1.7, color=C_YELLOW)
    arrow(9.4, 2.6, 5.0, 1.7, color=C_YELLOW)
    arrow(9.8, 2.6, 7.3, 1.7, color=C_YELLOW)
    arrow(10.2, 2.6, 9.5, 1.7, color=C_YELLOW)

    # Bot outputs join back to response
    node(12.5, 2.5, 1.6, 0.8, "rpa_actions\narray", C_TEAL)
    arrow(10.5, 1.3, 11.8, 2.2, color=C_GREY)
    arrow(12.5, 2.9, 12.5, 5.05, color=C_GREY)

    # Response back to dashboard
    arrow(11.7, 5.1, 4.0, 5.1, color=C_BLUE)  # return arrow below main
    ax.text(8, 4.85, "response rendered on Dashboard", ha="center", fontsize=9,
            style="italic", color=C_BLUE)

    plt.title("Fig. 4.2  Data Flow Diagram — from User Input to Automated Response",
              fontsize=13, pad=12)
    plt.tight_layout()
    out = os.path.join(OUT, "fig_4_2_dataflow.png")
    plt.savefig(out, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    print("saved", out)


# =========================================================================
# Figure 4.3 — ML Pipeline Flowchart
# =========================================================================
def fig_ml_pipeline():
    fig, ax = plt.subplots(figsize=(7, 12))
    ax.set_xlim(0, 10); ax.set_ylim(0, 24)
    ax.axis("off")

    def node(y, label, color, shape="box", h=1.3, w=6):
        x = 5
        if shape == "box":
            r = FancyBboxPatch((x-w/2, y-h/2), w, h,
                               boxstyle="round,pad=0.04,rounding_size=0.15",
                               linewidth=1.3, edgecolor=color, facecolor=color+"22")
            ax.add_patch(r)
        elif shape == "diamond":
            from matplotlib.patches import Polygon
            pts = [(x, y+h/2), (x+w/2, y), (x, y-h/2), (x-w/2, y)]
            p = Polygon(pts, closed=True, linewidth=1.3, edgecolor=color,
                        facecolor=color+"22")
            ax.add_patch(p)
        elif shape == "oval":
            e = Ellipse((x, y), w, h, linewidth=1.3, edgecolor=color,
                        facecolor=color+"22")
            ax.add_patch(e)
        ax.text(x, y, label, ha="center", va="center", fontsize=10.5,
                weight="bold")

    def arrow(y1, y2, color="#333"):
        a = FancyArrowPatch((5, y1), (5, y2),
                            arrowstyle="-|>", mutation_scale=15,
                            linewidth=1.3, color=color)
        ax.add_patch(a)

    steps = [
        (22.8, "Start",                                    C_GREY,   "oval"),
        (21.1, "Load IEEE-CIS Fraud Dataset\n(590,540 rows, 433 cols)", C_BLUE, "box"),
        (19.1, "Merge Transaction + Identity tables\n(left join on TransactionID)", C_BLUE, "box"),
        (17.1, "Drop columns with > 90% missing\n+ impute numeric with median", C_BLUE, "box"),
        (15.1, "Label encode categorical columns\n(471 features total)", C_BLUE, "box"),
        (13.1, "Stratified 80 / 20 train-test split\n(fraud rate preserved)", C_TEAL, "box"),
        (11.1, "Apply SMOTE on training set only\n(class balancing, no leakage)", C_TEAL, "box"),
        (9.1,  "Train 4 classifiers in parallel\nXGBoost · LightGBM · RF · AdaBoost", C_ORANGE, "box"),
        (7.1,  "Evaluate on test set\nPrec / Rec / F1 / AUC-ROC / AP", C_ORANGE, "box"),
        (5.1,  "Best F1 model?",                           C_YELLOW, "diamond"),
        (2.9,  "Select XGBoost (F1 = 0.6762)\nSave .pkl + SHAP explainer", C_YELLOW, "box"),
        (0.8,  "End",                                      C_GREY,   "oval"),
    ]
    for y, label, color, shape in steps:
        node(y, label, color, shape, h=1.4 if shape != "diamond" else 2.0,
             w=7 if shape != "diamond" else 5)

    # arrows between
    ys = [22.1, 20.4, 18.4, 16.4, 14.4, 12.4, 10.4, 8.4, 6.4, 4.1, 2.2]
    ys2 = [21.8, 19.8, 17.8, 15.8, 13.8, 11.8, 9.8, 7.8, 6.1, 3.6, 1.5]
    for a, b in zip(ys, ys2):
        arrow(a, b)

    plt.title("Fig. 4.3  Machine Learning Pipeline Flowchart", fontsize=13, pad=6)
    plt.tight_layout()
    out = os.path.join(OUT, "fig_4_3_ml_pipeline.png")
    plt.savefig(out, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    print("saved", out)


# =========================================================================
# Figure 4.4 — Use Case Diagram
# =========================================================================
def fig_use_case():
    fig, ax = plt.subplots(figsize=(11, 7))
    ax.set_xlim(0, 14); ax.set_ylim(0, 9)
    ax.axis("off")

    # Actors (stick figures using text)
    def actor(x, y, name):
        # head
        ax.add_patch(Circle((x, y+1.1), 0.22, facecolor="white",
                            edgecolor="black", linewidth=1.5))
        # body
        ax.plot([x, x], [y+0.88, y+0.25], color="black", linewidth=1.5)
        # arms
        ax.plot([x-0.35, x+0.35], [y+0.65, y+0.65], color="black", linewidth=1.5)
        # legs
        ax.plot([x, x-0.25], [y+0.25, y-0.15], color="black", linewidth=1.5)
        ax.plot([x, x+0.25], [y+0.25, y-0.15], color="black", linewidth=1.5)
        ax.text(x, y-0.4, name, ha="center", fontsize=10, weight="bold")

    actor(1.2, 5.0, "Analyst")
    actor(1.2, 2.0, "Customer")
    actor(12.8, 5.0, "System\nAdmin")

    # System boundary
    ax.add_patch(Rectangle((3.2, 0.5), 8.1, 8.0, linewidth=1.6,
                           edgecolor=C_BLUE, facecolor="none",
                           linestyle="-"))
    ax.text(7.25, 8.2, "Fraud Detection & Prevention Ecosystem",
            ha="center", fontsize=12, weight="bold", color=C_BLUE)

    # Use cases (ovals)
    def uc(x, y, label, w=2.6, h=0.75):
        e = Ellipse((x, y), w, h, linewidth=1.2,
                    edgecolor=C_TEAL, facecolor=C_TEAL+"22")
        ax.add_patch(e)
        ax.text(x, y, label, ha="center", va="center", fontsize=9.5)

    uc(5.0, 7.2, "Submit Transaction")
    uc(5.0, 6.0, "View Dashboard")
    uc(5.0, 4.8, "Inspect SHAP Explanation")
    uc(5.0, 3.6, "Review Alert / Case")
    uc(5.0, 2.4, "Generate STR Report")

    uc(9.5, 7.2, "Trigger RPA Bots")
    uc(9.5, 6.0, "Receive SMS / Email Alert")
    uc(9.5, 4.8, "Open Fraud Case")
    uc(9.5, 3.6, "Write Audit Log")
    uc(9.5, 2.4, "Manage Model / Retrain")

    # Associations (lines)
    def line(x1, y1, x2, y2):
        ax.plot([x1, x2], [y1, y2], color="#444", linewidth=1.0)

    # Analyst connections
    for uy in [7.2, 6.0, 4.8, 3.6, 2.4]:
        line(1.55, 5.0, 3.7, uy)
    # Customer connections
    line(1.55, 2.0, 8.2, 6.0)   # receive SMS
    # System Admin
    line(12.45, 5.0, 10.8, 2.4)   # manage model
    line(12.45, 5.0, 10.8, 3.6)   # audit log

    # <<include>> from Submit Transaction -> Trigger RPA Bots
    a = FancyArrowPatch((6.3, 7.2), (8.2, 7.2),
                        arrowstyle="->", mutation_scale=12,
                        linewidth=1.0, linestyle="dashed", color="#666")
    ax.add_patch(a)
    ax.text(7.25, 7.45, "<<include>>", ha="center", fontsize=8, style="italic",
            color="#666")

    # <<include>> Trigger RPA Bots -> SMS, Case, Log
    for uy in [6.0, 4.8, 3.6]:
        a = FancyArrowPatch((9.5, 6.82), (9.5, uy+0.38),
                            arrowstyle="->", mutation_scale=10,
                            linewidth=0.9, linestyle="dashed", color="#666")
        ax.add_patch(a)

    plt.title("Fig. 4.4  Use Case Diagram", fontsize=13, pad=12)
    plt.tight_layout()
    out = os.path.join(OUT, "fig_4_4_use_case.png")
    plt.savefig(out, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    print("saved", out)


# =========================================================================
# Figure 4.5 — ER Diagram (Case Management)
# =========================================================================
def fig_er_diagram():
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(0, 14); ax.set_ylim(0, 9)
    ax.axis("off")

    def entity(x, y, name, attrs, color):
        w = 3.6
        h = 0.6 + len(attrs) * 0.45
        # Header
        ax.add_patch(Rectangle((x, y+h-0.6), w, 0.6, linewidth=1.3,
                               edgecolor=color, facecolor=color))
        ax.text(x+w/2, y+h-0.3, name, ha="center", va="center",
                fontsize=12, weight="bold", color="white")
        # Body
        ax.add_patch(Rectangle((x, y), w, h-0.6, linewidth=1.3,
                               edgecolor=color, facecolor="white"))
        for i, (marker, attr, dtype) in enumerate(attrs):
            ay = y + h - 0.6 - 0.25 - i * 0.45
            prefix = {"PK": "[PK] ", "FK": "[FK] ", "": "      "}.get(marker, "      ")
            ax.text(x+0.15, ay, f"{prefix}{attr}", ha="left", va="center",
                    fontsize=9.5, weight="bold" if marker == "PK" else "normal",
                    color=color if marker in ("PK","FK") else "black")
            ax.text(x+w-0.15, ay, dtype, ha="right", va="center",
                    fontsize=8.5, color="#555", style="italic")
        return x, y, w, h

    # cases entity
    cases_attrs = [
        ("PK", "case_id",       "INTEGER"),
        ("",   "txn_id",        "TEXT"),
        ("",   "amount",        "REAL"),
        ("",   "fraud_prob",    "REAL"),
        ("",   "risk_level",    "TEXT"),
        ("",   "queue",         "TEXT"),
        ("",   "status",        "TEXT"),
        ("",   "created_at",    "DATETIME"),
    ]
    cx, cy, cw, ch = entity(5.2, 3.6, "cases", cases_attrs, C_BLUE)

    # alerts entity
    alerts_attrs = [
        ("PK", "alert_id",    "INTEGER"),
        ("FK", "case_id",     "INTEGER"),
        ("",   "channel",     "TEXT"),
        ("",   "message",     "TEXT"),
        ("",   "sent_at",     "DATETIME"),
    ]
    ax_, ay_, aw_, ah_ = entity(0.3, 4.0, "alerts", alerts_attrs, C_TEAL)

    # audit_log entity
    log_attrs = [
        ("PK", "log_id",    "INTEGER"),
        ("FK", "case_id",   "INTEGER"),
        ("",   "action",    "TEXT"),
        ("",   "actor",     "TEXT"),
        ("",   "details",   "JSON"),
        ("",   "logged_at", "DATETIME"),
    ]
    lx, ly, lw, lh = entity(10.1, 3.7, "audit_log", log_attrs, C_ORANGE)

    # reports entity
    rep_attrs = [
        ("PK", "report_id",   "INTEGER"),
        ("FK", "case_id",     "INTEGER"),
        ("",   "filename",    "TEXT"),
        ("",   "format",      "TEXT"),
        ("",   "generated_at","DATETIME"),
    ]
    rx, ry, rw, rh = entity(5.2, 0.1, "reports", rep_attrs, C_YELLOW)

    # Relationships (crow's foot style simplified)
    def rel(x1, y1, x2, y2, label):
        ax.plot([x1, x2], [y1, y2], color="#444", linewidth=1.4)
        ax.text((x1+x2)/2, (y1+y2)/2 + 0.2, label, ha="center",
                fontsize=9, style="italic", color=C_BLUE, weight="bold")
        # cardinality markers
        ax.text(x1, y1, "1", color="#444", fontsize=10, weight="bold",
                ha="center", va="center",
                bbox=dict(boxstyle="circle,pad=0.1", fc="white", ec="#444"))
        ax.text(x2, y2, "N", color="#444", fontsize=10, weight="bold",
                ha="center", va="center",
                bbox=dict(boxstyle="circle,pad=0.1", fc="white", ec="#444"))

    # cases <--> alerts
    rel(cx, cy+ch/2, ax_+aw_, ay_+ah_/2, "triggers")
    # cases <--> audit_log
    rel(cx+cw, cy+ch/2, lx, ly+lh/2, "records")
    # cases <--> reports
    rel(cx+cw/2, cy, rx+rw/2, ry+rh, "generates")

    plt.title("Fig. 4.5  Entity-Relationship Diagram — Case Management Database",
              fontsize=13, pad=12)
    plt.tight_layout()
    out = os.path.join(OUT, "fig_4_5_er_diagram.png")
    plt.savefig(out, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    print("saved", out)


if __name__ == "__main__":
    fig_architecture()
    fig_dataflow()
    fig_ml_pipeline()
    fig_use_case()
    fig_er_diagram()
    print("\nAll 5 diagrams generated in:", OUT)
