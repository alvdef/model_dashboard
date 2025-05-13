import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  ReferenceArea,
  ReferenceLine,
} from "recharts";

// Common color schemes for metrics
export const METRIC_COLOUR = {
  mse: "#8884d8",
  mape: "#82ca9d",
  smape: "#ffc658",
  direction_accuracy: "#ff7300",
  smape_cv: "#ff69b4",
  trend_accuracy: "#3366cc",
  cost_savings: "#ff9900",
  sgnif_trend_acc: "#3366cc",
};

// Error categories for stacked bar charts
export const ERROR_CATEGORIES = [
  { range: "< 1%", label: "Very Accurate (< 1%)", color: "#22c55e" },
  { range: "1-5%", label: "Good (1-5%)", color: "#84cc16" },
  { range: "5-10%", label: "Acceptable (5-10%)", color: "#eab308" },
  { range: "10-20%", label: "Poor (10-20%)", color: "#f97316" },
  { range: "20-50%", label: "Very Poor (20-50%)", color: "#ef4444" },
  { range: "50-100%", label: "Unreliable (50-100%)", color: "#dc2626" },
  { range: "> 100%", label: "Extreme Error (> 100%)", color: "#991b1b" },
];

// MAPE gradient color function
export const getMapeColor = (mape) => {
  if (mape < 5) return "#22c55e"; // Very low error - green
  if (mape < 10) return "#84cc16"; // Low error - light green
  if (mape < 20) return "#eab308"; // Medium error - yellow
  if (mape < 30) return "#f97316"; // Medium-high error - orange
  if (mape < 50) return "#ef4444"; // High error - light red
  return "#991b1b"; // Very high error - dark red
};

// Helper: create cumulative distribution for trend and savings
const createCumulativeDistribution = (raw, minDefault, maxDefault, filterStep) => {
  const values = raw.map((d) => d.value);
  const minVal = Math.min(...values, minDefault);
  const maxVal = Math.max(...values, maxDefault);
  const min = Math.floor(minVal);
  const max = Math.ceil(maxVal);
  const bins = Array.from({ length: max - min + 1 }, (_, i) => ({ value: min + i, percentage: 0, cumulativePercentage: 0 }));
  raw.forEach(({ value, percentage }) => {
    const idx = Math.min(Math.max(Math.round(value) - min, 0), bins.length - 1);
    bins[idx].percentage += percentage;
  });
  let cum = 0;
  bins.forEach((b) => {
    cum += b.percentage;
    b.cumulativePercentage = parseFloat(cum.toFixed(2));
  });
  let lower = min;
  let upper = max;
  bins.forEach((b) => {
    if (b.cumulativePercentage >= 2 && lower === min) lower = b.value;
    if (b.cumulativePercentage >= 98 && upper === max) upper = b.value;
  });
  const mirrorLow = min + max - upper;
  const mirrorHigh = min + max - lower;
  const domainLow = Math.min(lower, mirrorLow);
  const domainHigh = Math.max(upper, mirrorHigh);
  const filtered = bins.filter((b) => b.percentage > 0 || b.value % filterStep === 0 || b.value === lower || b.value === upper);
  return { filtered, domain: [domainLow, domainHigh] };
};

// Time Horizon Chart Component
export const TimeHorizonChart = ({ data, comparisonMode }) => {
  console.log('TimeHorizonChart render:', { 
    comparisonMode, 
    dataLengths: comparisonMode ? 
      { primary: data.primary.data.length, secondary: data.secondary.data.length } : data.length,
    dataDetails: comparisonMode ? {
      primary: {
        name: data.primary.name,
        firstPoint: data.primary.data[0],
        lastPoint: data.primary.data[data.primary.data.length-1],
        avgMape: data.primary.data.reduce((acc, point) => acc + point.mape, 0) / data.primary.data.length
      },
      secondary: {
        name: data.secondary.name,
        firstPoint: data.secondary.data[0],
        lastPoint: data.secondary.data[data.secondary.data.length-1],
        avgMape: data.secondary.data.reduce((acc, point) => acc + point.mape, 0) / data.secondary.data.length
      }
    } : null
  });
  
  if (comparisonMode) {
    // Add labels with calculated overall average MAPE for each model
    const primaryAvgMape = data.primary.data.reduce((sum, point) => sum + point.mape, 0) / data.primary.data.length;
    const secondaryAvgMape = data.secondary.data.reduce((sum, point) => sum + point.mape, 0) / data.secondary.data.length;
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 10, right: 50, left: 40, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="timestep"
            allowDuplicatedCategory={false}
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            yAxisId="left"
            label={{
              value: "Error (%)",
              angle: -90,
              position: "insideLeft",
              offset: -15,
              fontSize: 12,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: "Trend Accuracy (%)",
              angle: 90,
              position: "insideRight",
              offset: -15,
              fontSize: 12,
            }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line
            yAxisId="left"
            type="monotone"
            data={data.primary.data}
            dataKey="mape"
            stroke="#8884d8"
            name={`MAPE - ${data.primary.name} : ${primaryAvgMape.toFixed(2)}%`}
          />
          <Line
            yAxisId="left"
            type="monotone"
            data={data.secondary.data}
            dataKey="mape"
            stroke="#82ca9d"
            name={`MAPE - ${data.secondary.name} : ${secondaryAvgMape.toFixed(2)}%`}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 50, left: 40, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestep" />
        <YAxis
          yAxisId="left"
          label={{
            value: "Error (%)",
            angle: -90,
            position: "insideLeft",
            offset: -15,
            fontSize: 12,
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{
            value: "Trend Accuracy (%)",
            angle: 90,
            position: "insideRight",
            offset: -15,
            fontSize: 12,
          }}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="mape"
          stroke={METRIC_COLOUR["mape"]}
          name="MAPE"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Distribution Chart Component - updated with better axis formatting and visualization
export const MetricsDistributionChart = ({ metricsDistributionData }) => {
  // Trend accuracy distribution
  const { filtered: cumulativeTrendData, domain: trendDomain } = React.useMemo(() => {
    const result = createCumulativeDistribution(
      metricsDistributionData.continuous?.trend || [],
      0,
      100,
      10
    );
    console.log('Trend distribution result:', result);
    return result;
  }, [metricsDistributionData.continuous?.trend]);

  // Cost savings distribution
  const { filtered: cumulativeSavingsData, domain: savingsDomain } = React.useMemo(() => {
    const minDef = metricsDistributionData.minMaxValues?.savingsMin ?? -15;
    const maxDef = metricsDistributionData.minMaxValues?.savingsMax ?? 25;
    const result = createCumulativeDistribution(
      metricsDistributionData.continuous?.savings || [],
      minDef,
      maxDef,
      5
    );
    console.log('Savings distribution result:', result);
    return result;
  }, [metricsDistributionData.continuous?.savings, metricsDistributionData.minMaxValues]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <div className="h-full">
        <h3 className="text-sm font-medium mb-1 text-center">
          Trend Accuracy Distribution (2% to 98% Cumulative)
        </h3>
        <ResponsiveContainer width="100%" height="80%">
          <ComposedChart
            data={cumulativeTrendData}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceArea
              yAxisId="left"
              x1={0}
              x2={50}
              fill="rgba(255, 0, 0, 0.15)"
            />
            <ReferenceLine
              yAxisId="left"
              x={50}
              stroke="#ff0000"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            {/* Left axis for cumulative % */}
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tickCount={11}
              tickFormatter={(tick) => Math.round(tick)}
            />
            {/* Right axis for frequency % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(tick) => `${tick.toFixed(1)}%`}
            />
            <XAxis
              dataKey="value"
              domain={trendDomain}
              tickCount={10}
              tickFormatter={(tick) => Math.round(tick)}
            />
            <Tooltip
              formatter={(value, name) => [
                name === "cumulativePercentage"
                  ? `${Math.round(value)}%`
                  : `${value.toFixed(2)}%`,
                name === "cumulativePercentage"
                  ? "Cumulative %"
                  : "Frequency %",
              ]}
              labelFormatter={(label) => `Trend Accuracy: ${label}%`}
            />
            <Legend />
            {/* Frequency area uses right axis */}
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="percentage"
              stroke={METRIC_COLOUR["trend_accuracy"]}
              fill={METRIC_COLOUR["trend_accuracy"]}
              name="Frequency %"
              opacity={0.5}
            />
            {/* Cumulative line uses left axis */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulativePercentage"
              stroke="#ff7300"
              name="Cumulative %"
              strokeWidth={2}
            />
            <ReferenceLine
              yAxisId="left"
              y={2}
              stroke="#00aa00"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <ReferenceLine
              yAxisId="left"
              y={98}
              stroke="#00aa00"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-full">
        <h3 className="text-sm font-medium mb-1 text-center">
          Cost Savings Distribution (2% to 98% Cumulative)
        </h3>
        <ResponsiveContainer width="100%" height="80%">
          <ComposedChart
            data={cumulativeSavingsData}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceArea
              yAxisId="left"
              x1={-10}
              x2={0}
              fill="rgba(255, 0, 0, 0.15)"
            />
            <ReferenceLine
              yAxisId="left"
              x={0}
              stroke="#ff0000"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            {/* Left axis for cumulative % */}
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tickCount={11}
              tickFormatter={(tick) => Math.round(tick)}
            />
            {/* Right axis for frequency % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(tick) => `${tick.toFixed(1)}%`}
            />
            <XAxis
              dataKey="value"
              domain={savingsDomain}
              tickCount={10}
              tickFormatter={(tick) => Math.round(tick)}
            />
            <Tooltip
              formatter={(value, name) => [
                name === "cumulativePercentage"
                  ? `${Math.round(value)}%`
                  : `${value.toFixed(2)}%`,
                name === "cumulativePercentage"
                  ? "Cumulative %"
                  : "Frequency %",
              ]}
              labelFormatter={(label) =>
                `Cost Savings: ${parseFloat(label).toFixed(0)}%`
              }
            />
            <Legend />
            {/* Frequency area uses right axis */}
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="percentage"
              stroke={METRIC_COLOUR["cost_savings"]}
              fill={METRIC_COLOUR["cost_savings"]}
              name="Frequency %"
              opacity={0.5}
            />
            {/* Cumulative line uses left axis */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulativePercentage"
              stroke="#ff7300"
              name="Cumulative %"
              strokeWidth={2}
            />
            <ReferenceLine
              yAxisId="left"
              y={2}
              stroke="#00aa00"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <ReferenceLine
              yAxisId="left"
              y={98}
              stroke="#00aa00"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ErrorDistribution Chart
export const ErrorDistributionChart = ({ data, categoryField = "size" }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 20, left: 90, bottom: 10 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" unit="%" domain={[0, 100]} />
        <YAxis
          dataKey={categoryField}
          type="category"
          width={60}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        {ERROR_CATEGORIES.map(({ label, color }) => (
          <Bar key={label} dataKey={label} stackId="a" fill={color} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Generic Bar Chart for various data types
export const MetricsBarChart = ({
  data,
  xAxis,
  primaryMetric = "mape",
  secondaryMetric = "sgnif_trend_acc",
  primaryLabel = "MAPE (%)",
  secondaryLabel = "Trend Accuracy (%)",
  secondaryDomain = [0, 100],
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 50, left: 40, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxis} tick={{ fontSize: 10 }} />
        <YAxis
          yAxisId="left"
          label={{
            value: primaryLabel,
            angle: -90,
            position: "insideLeft",
            offset: -15,
            fontSize: 12,
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{
            value: secondaryLabel,
            angle: 90,
            position: "insideRight",
            offset: -5,
            fontSize: 12,
          }}
          domain={secondaryDomain}
        />
        <Tooltip formatter={(value) => `${value.toFixed(2)}`} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar
          yAxisId="left"
          dataKey={primaryMetric}
          fill={METRIC_COLOUR[primaryMetric]}
          name={primaryLabel}
        />
        <Bar
          yAxisId="right"
          dataKey={secondaryMetric}
          fill={METRIC_COLOUR[secondaryMetric]}
          name={secondaryLabel}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const CostEfficiencyChart = ({ data }) => {
  if (
    !data ||
    data.length === 0 ||
    !data.some(
      (item) =>
        typeof item.cost_savings === "number" &&
        typeof item.perfect_savings === "number" &&
        typeof item.savings_efficiency === "number"
    )
  ) {
    return (
      <div className="flex h-full items-center justify-center flex-col">
        <p className="text-center text-gray-500">
          No cost efficiency data available
        </p>
        <p className="text-center text-gray-400 text-xs mt-2">
          This visualization requires cost_savings, perfect_savings, and
          savings_efficiency metrics
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="size" />
        <YAxis
          yAxisId="left"
          label={{
            value: "Savings (%)",
            angle: -90,
            position: "insideLeft",
            offset: -10,
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          label={{
            value: "Efficiency (%)",
            angle: 90,
            position: "insideRight",
            offset: -10,
          }}
        />
        <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar
          yAxisId="left"
          dataKey="cost_savings"
          fill={METRIC_COLOUR["cost_savings"]}
          name="Actual Savings"
        />
        <Bar
          yAxisId="left"
          dataKey="perfect_savings"
          fill="#8884d8"
          name="Perfect Savings"
          opacity={0.7}
        />
        <ReferenceLine
          y={0}
          stroke="#000"
          strokeDasharray="3 3"
          yAxisId="left"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
