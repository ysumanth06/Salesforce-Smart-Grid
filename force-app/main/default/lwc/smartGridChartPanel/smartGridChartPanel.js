import { LightningElement, api, track } from "lwc";

const COLOR_PALETTE = [
  "#0176d3",
  "#00bfa5",
  "#ff9800",
  "#7b1fa2",
  "#e91e63",
  "#3296ed",
  "#4caf50",
  "#ff5722"
];

export default class SmartGridChartPanel extends LightningElement {
  @api data = [];
  @api groupByField = "Industry";
  @api aggregateField = "AnnualRevenue";
  @api isOpen = false;

  @track chartType = "DONUT"; // 'DONUT' | 'BAR' | 'FUNNEL'

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

  /**
   * @description Aggregates dataset records by groupByField and sums aggregateField
   */
  get chartData() {
    if (!this.data || this.data.length === 0) {
      return [];
    }

    const groupMap = new Map();
    let grandSum = 0;

    this.data.forEach((item) => {
      const groupVal = item[this.groupByField] || "(Unassigned)";
      const rawNum = item[this.aggregateField];
      const numVal =
        typeof rawNum === "number" ? rawNum : parseFloat(rawNum) || 0;

      const current = groupMap.get(groupVal) || { count: 0, sum: 0 };
      current.count += 1;
      current.sum += numVal;
      grandSum += numVal;
      groupMap.set(groupVal, current);
    });

    const list = [];
    let colorIdx = 0;

    groupMap.forEach((val, label) => {
      const color = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
      colorIdx++;

      const percentage =
        grandSum > 0 ? Math.round((val.sum / grandSum) * 100) : 0;
      let formattedVal = `$${val.sum.toLocaleString()}`;
      if (val.sum === 0) {
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
        barFillStyle: `width: ${percentage}%; background-color: ${color};`
      });
    });

    // Sort descending by sum
    list.sort((a, b) => b.sum - a.sum);
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
    return `$${Math.round(total).toLocaleString()}`;
  }

  /**
   * @description Computes SVG donut path segments
   */
  get donutSlices() {
    const items = this.chartData;
    const total = items.reduce((acc, i) => acc + i.sum, 0) || items.length;
    if (total === 0) {
      return [];
    }

    let startAngle = 0;
    const cx = 100;
    const cy = 100;
    const rOuter = 80;
    const rInner = 45;

    return items.map((item) => {
      const sliceVal = item.sum || item.count || 1;
      const angle = (sliceVal / total) * 2 * Math.PI;
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

  /**
   * @description Computes SVG polygon points for Funnel stages
   */
  get funnelTrapezoids() {
    const items = this.chartData;
    if (items.length === 0) return [];

    const totalHeight = 160;
    const stepHeight = totalHeight / items.length;
    const maxWidth = 220;
    const minWidth = 60;
    const widthStep = (maxWidth - minWidth) / items.length;

    return items.map((item, idx) => {
      const topY = idx * stepHeight + 10;
      const botY = (idx + 1) * stepHeight + 10;

      const topW = maxWidth - idx * widthStep;
      const botW = maxWidth - (idx + 1) * widthStep;

      const x1 = (240 - topW) / 2;
      const x2 = (240 + topW) / 2;
      const x3 = (240 + botW) / 2;
      const x4 = (240 - botW) / 2;

      const points = `${x1},${topY} ${x2},${topY} ${x3},${botY} ${x4},${botY}`;

      return {
        ...item,
        points
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
