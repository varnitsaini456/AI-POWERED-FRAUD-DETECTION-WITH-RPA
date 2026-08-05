"""
Generates Fig. 1.1 and Fig. 1.2 for Chapter 1 of the Project Report.
Data compiled from Nilson Report (global card fraud) and Reserve Bank of India
Annual Reports 2019–2024 (Indian digital payments and reported fraud cases).
Numbers are approximations consistent with public industry summaries.
"""
import os
import matplotlib.pyplot as plt
import numpy as np

OUT = os.path.dirname(os.path.abspath(__file__))

plt.rcParams.update({
    "font.family": "Times New Roman",
    "font.size": 11,
})

C_BLUE   = "#1D4E89"
C_ORANGE = "#E76F51"
C_TEAL   = "#2A9D8F"
C_GREY   = "#6C757D"

# =========================================================================
# Figure 1.1 — Global Card Fraud Losses by Year, 2015–2023  (Nilson Report)
# =========================================================================
def fig_1_1():
    years  = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]
    losses = [21.84, 22.80, 24.26, 27.85, 28.65, 28.58, 32.34, 33.83, 33.45]

    fig, ax = plt.subplots(figsize=(8, 4.2))

    ax.plot(years, losses, marker="o", linewidth=2.2, markersize=7,
            color=C_BLUE, zorder=3)
    ax.fill_between(years, losses, alpha=0.12, color=C_BLUE, zorder=2)

    for x, y in zip(years, losses):
        ax.text(x, y + 0.7, f"{y:.1f}", ha="center", fontsize=9,
                color=C_BLUE, weight="bold")

    ax.set_xlabel("Year", fontsize=11, weight="bold")
    ax.set_ylabel("Global Card Fraud Losses (USD Billion)",
                  fontsize=11, weight="bold")
    ax.set_title("Fig. 1.1  Global Card Fraud Losses, 2015–2023",
                 fontsize=12, pad=10)
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.set_xticks(years)
    ax.set_ylim(18, 40)

    # Source note
    ax.text(0.99, -0.20,
            "Source: Nilson Report (approximate figures, industry summary)",
            transform=ax.transAxes, ha="right", va="top",
            fontsize=8, style="italic", color=C_GREY)

    plt.tight_layout()
    out = os.path.join(OUT, "fig_1_1_global_fraud.png")
    plt.savefig(out, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    print("saved", out)


# =========================================================================
# Figure 1.2 — Indian Digital Payment Volume vs. Reported Fraud Cases
#              FY 2019-20 to FY 2023-24  (RBI Annual Reports)
# =========================================================================
def fig_1_2():
    fiscal_years = ["FY\n2019-20", "FY\n2020-21", "FY\n2021-22",
                    "FY\n2022-23", "FY\n2023-24"]

    # Digital transaction volume (in crore / 10^7 transactions)
    # Source: RBI Annual Report + NPCI statistics (rounded)
    digital_txn_cr = [3434, 4372, 7195, 11394, 16443]

    # Reported fraud cases (card + internet + mobile banking)
    # Source: RBI Report on Trend & Progress of Banking in India
    fraud_cases = [52304, 71500, 92500, 102000, 138000]

    fig, ax1 = plt.subplots(figsize=(9, 4.6))

    x = np.arange(len(fiscal_years))
    width = 0.55

    # Bar chart — digital transaction volume (left y-axis)
    bars = ax1.bar(x, digital_txn_cr, width=width, color=C_BLUE,
                   alpha=0.85, label="Digital Txn Volume (crore)",
                   edgecolor="white", linewidth=1.2, zorder=2)
    # Place bar labels INSIDE the bar top to avoid overlap with the line
    for b, v in zip(bars, digital_txn_cr):
        ax1.text(b.get_x() + b.get_width()/2, v - 500, f"{v:,}",
                 ha="center", va="top", fontsize=9, color="white",
                 weight="bold")

    ax1.set_xlabel("Fiscal Year", fontsize=11, weight="bold")
    ax1.set_ylabel("Digital Transaction Volume (crore)",
                   fontsize=11, weight="bold", color=C_BLUE)
    ax1.tick_params(axis="y", labelcolor=C_BLUE)
    ax1.set_xticks(x)
    ax1.set_xticklabels(fiscal_years)
    ax1.set_ylim(0, max(digital_txn_cr) * 1.2)
    ax1.grid(True, axis="y", linestyle="--", alpha=0.4, zorder=1)

    # Line chart — fraud cases (right y-axis)
    ax2 = ax1.twinx()
    ax2.plot(x, fraud_cases, marker="s", linewidth=2.3,
             markersize=8, color=C_ORANGE,
             label="Reported Fraud Cases", zorder=3)
    for xi, v in zip(x, fraud_cases):
        ax2.text(xi, v + 7000, f"{v:,}", ha="center", fontsize=9,
                 color=C_ORANGE, weight="bold")
    ax2.set_ylabel("Reported Fraud Cases", fontsize=11,
                   weight="bold", color=C_ORANGE)
    ax2.tick_params(axis="y", labelcolor=C_ORANGE)
    ax2.set_ylim(0, max(fraud_cases) * 1.25)

    # Combined legend
    lines_1, labels_1 = ax1.get_legend_handles_labels()
    lines_2, labels_2 = ax2.get_legend_handles_labels()
    ax1.legend(lines_1 + lines_2, labels_1 + labels_2,
               loc="upper left", fontsize=9, frameon=True,
               fancybox=True, edgecolor=C_GREY)

    plt.title("Fig. 1.2  Indian Digital Payments vs. Reported Fraud Cases, FY 2019-20 to FY 2023-24",
              fontsize=12, pad=10)

    # Source
    ax1.text(0.99, -0.25,
             "Source: RBI Annual Reports, NPCI statistics (figures rounded)",
             transform=ax1.transAxes, ha="right", va="top",
             fontsize=8, style="italic", color=C_GREY)

    plt.tight_layout()
    out = os.path.join(OUT, "fig_1_2_india_digital_vs_fraud.png")
    plt.savefig(out, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    print("saved", out)


if __name__ == "__main__":
    fig_1_1()
    fig_1_2()
    print("\nChapter 1 figures generated in:", OUT)
