import { LightningElement, api, track } from "lwc";

const COLOR_PALETTE = [
  "#0176d3",
  "#00bfa5",
  "#ff9800",
  "#7b1fa2",
  "#e91e63",
  "#3296ed",
  "#4caf50",
  "#ff5722",
  "#0284c7",
  "#10b981",
  "#f59e0b",
  "#8b5cf6"
];

export default class SmartGridChartPanel extends LightningElement {
  @api data = [];
  @api columns = [];
  @api objectApiName = "Account";
  @api isOpen = false;

  @track _groupByField = "Industry";
  @track _aggregateField = "AnnualRevenue";
  @track selectedGroupBy = null;
  @track chartType = "DONUT"; // 'DONUT' | 'BAR' | 'FUNNEL'

  @api
  get groupByField() {
    return this._groupByField || "Industry";
  }
  set groupByField(val) {
    if (val) {
      this._groupByField = val;
    }
  }

  @api
  get aggregateField() {
    return this._aggregateField || "AnnualRevenue";
  }
  set aggregateField(val) {
    this._aggregateField = val;
  }

  get currentGroupByField() {
    return this.selectedGroupBy || this.groupByField;
  }

  get objectSubtitle() {
    return `${this.objectApiName || "Dataset"} Aggregation`;
  }

  get groupByOptions() {
    if (this.columns && this.columns.length > 0) {
      const opts = this.columns
        .filter((col) => col.fieldName && col.fieldName !== "Id")
        .map((col) => ({
          label: col.label || col.fieldName,
          value: col.fieldName
        }));
      if (opts.length > 0) return opts;
    }
    if (this.data && this.data.length > 0) {
      const sample = this.data[0];
      return Object.keys(sample)
        .filter(
          (k) =>
            k !== "Id" && k !== "attributes" && typeof sample[k] !== "object"
        )
        .map((k) => ({ label: k, value: k }));
    }
    return [
      { label: "Industry", value: "Industry" },
      { label: "Rating", value: "Rating" },
      { label: "Type", value: "Type" }
    ];
  }

  handleGroupByChange(event) {
    this.selectedGroupBy = event.detail.value;
  }

  get isDonut() {
    return this.chartType === "DONUT";
  }

  get isBar() {
    return this.chartType === "BAR";
  }

  get isFunnel() {
    return this.chartType === "FUNNEL";
  }

  get donutVariant() {
    return this.isDonut ? "brand" : "neutral";
  }

  get barVariant() {
    return this.isBar ? "brand" : "neutral";
  }

  get funnelVariant() {
    return this.isFunnel ? "brand" : "neutral";
  }

  get chartData() {
    if (!this.data || this.data.length === 0) {
      return [];
    }

    const groupMap = new Map();
    let grandSum = 0;
    let hasNumericValues = false;

    this.data.forEach((item) => {
      const groupVal = item[this.currentGroupByField] || "(Unassigned)";
      const rawNum = this.aggregateField ? item[this.aggregateField] : 0;
      let numVal = 0;
      if (typeof rawNum === "number") {
        numVal = rawNum;
        hasNumericValues = true;
      } else if (rawNum !== undefined && rawNum !== null && rawNum !== "") {
        const parsed = parseFloat(rawNum);
        if (!isNaN(parsed)) {
          numVal = parsed;
          hasNumericValues = true;
        }
      }

      const current = groupMap.get(groupVal) || { count: 0, sum: 0 };
      current.count += 1;
      current.sum += numVal;
      grandSum += numVal;
      groupMap.set(groupVal, current);
    });

    const list = [];
    let colorIdx = 0;
    const totalRecords = this.data.length;

    groupMap.forEach((val, label) => {
      const color = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
      colorIdx++;

      let percentage = 0;
      let formattedVal = "";

      if (grandSum > 0 && hasNumericValues) {
        percentage = Math.round((val.sum / grandSum) * 100);
        formattedVal = `$${Math.round(val.sum).toLocaleString()}`;
      } else {
        percentage =
          totalRecords > 0 ? Math.round((val.count / totalRecords) * 100) : 0;
        formattedVal = `${val.count} recs`;
      }

      list.push({
        label,
        count: val.count,
        sum: val.sum,
        percentage,
        formattedValue: formattedVal,
        color,
        dotStyle: `background-color: ${color};`,
        barFillStyle: `width: ${Math.max(percentage, 4)}%; background-color: ${color};`
      });
    });

    // Sort descending by sum if positive, else by count
    if (grandSum > 0 && hasNumericValues) {
      list.sort((a, b) => b.sum - a.sum);
    } else {
      list.sort((a, b) => b.count - a.count);
    }
    return list;
  }

  get totalRecordCount() {
    return this.data ? this.data.length : 0;
  }

  get groupCount() {
    return this.chartData.length;
  }

  get formattedTotalSum() {
    const total = this.chartData.reduce((acc, item) => acc + item.sum, 0);
    if (total > 0) {
      return `$${Math.round(total).toLocaleString()}`;
    }
    return `${this.totalRecordCount} Total`;
  }

  get volumeKpiLabel() {
    const total = this.chartData.reduce((acc, item) => acc + item.sum, 0);
    return total > 0 ? "Total Volume" : "Volume Count";
  }

  get donutCenterText() {
    return this.totalRecordCount;
  }

  get donutSlices() {
    const items = this.chartData;
    if (items.length === 0) {
      return [];
    }

    const hasSum = items.some((i) => i.sum > 0);
    const total = hasSum
      ? items.reduce((acc, i) => acc + i.sum, 0)
      : items.reduce((acc, i) => acc + i.count, 0);

    if (total === 0) {
      return [];
    }

    const cx = 100;
    const cy = 100;
    const rOuter = 80;
    const rInner = 45;

    // Single group edge case (SVG arc cannot do full 360 circle in one path)
    if (items.length === 1 || items[0].percentage === 100) {
      const item = items[0];
      const pathData = [
        `M ${cx} ${cy - rOuter}`,
        `A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy + rOuter}`,
        `A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy - rOuter}`,
        `M ${cx} ${cy - rInner}`,
        `A ${rInner} ${rInner} 0 1 0 ${cx} ${cy + rInner}`,
        `A ${rInner} ${rInner} 0 1 0 ${cx} ${cy - rInner}`,
        "Z"
      ].join(" ");
      return [{ ...item, pathData }];
    }

    let startAngle = -Math.PI / 2;

    return items.map((item) => {
      const sliceVal = hasSum ? item.sum : item.count;
      const rawAngle = (sliceVal / total) * 2 * Math.PI;
      const angle = Math.min(rawAngle, 1.999 * Math.PI);
      const endAngle = startAngle + angle;

      const x1 = cx + rOuter * Math.cos(startAngle);
      const y1 = cy + rOuter * Math.sin(startAngle);
      const x2 = cx + rOuter * Math.cos(endAngle);
      const y2 = cy + rOuter * Math.sin(endAngle);

      const x3 = cx + rInner * Math.cos(endAngle);
      const y3 = cy + rInner * Math.sin(endAngle);
      const x4 = cx + rInner * Math.cos(startAngle);
      const y4 = cy + rInner * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
        "Z"
      ].join(" ");

      startAngle = endAngle;

      return {
        ...item,
        pathData
      };
    });
  }

  get funnelTrapezoids() {
    let items = this.chartData;
    if (items.length === 0) return [];

    // If there are more than 7 categories, take top 6 and aggregate remainder into 'Other'
    if (items.length > 7) {
      const topItems = items.slice(0, 6);
      const rest = items.slice(6);
      const otherCount = rest.reduce((sum, i) => sum + i.count, 0);
      const otherSum = rest.reduce((sum, i) => sum + i.sum, 0);
      const otherPct = rest.reduce((sum, i) => sum + i.percentage, 0);
      topItems.push({
        label: `Other (${rest.length} groups)`,
        count: otherCount,
        sum: otherSum,
        percentage: otherPct,
        formattedValue:
          otherSum > 0
            ? `$${Math.round(otherSum).toLocaleString()}`
            : `${otherCount} recs`,
        color: "#64748b"
      });
      items = topItems;
    }

    const totalHeight = 170;
    const stepHeight = totalHeight / items.length;
    const maxWidth = 260;
    const minWidth = 80;
    const widthStep =
      items.length > 1 ? (maxWidth - minWidth) / items.length : 0;

    return items.map((item, idx) => {
      const topY = idx * stepHeight + 10;
      const botY = (idx + 1) * stepHeight + 10;

      const topW = maxWidth - idx * widthStep;
      const botW = maxWidth - (idx + 1) * widthStep;

      const x1 = (280 - topW) / 2;
      const x2 = (280 + topW) / 2;
      const x3 = (280 + botW) / 2;
      const x4 = (280 - botW) / 2;

      const points = `${x1},${topY} ${x2},${topY} ${x3},${botY} ${x4},${botY}`;
      const textY = (topY + botY) / 2 + 4;

      return {
        ...item,
        points,
        textY
      };
    });
  }

  handleSelectDonut() {
    this.chartType = "DONUT";
  }

  handleSelectBar() {
    this.chartType = "BAR";
  }

  handleSelectFunnel() {
    this.chartType = "FUNNEL";
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }
}
