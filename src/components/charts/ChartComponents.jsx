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

// Time Horizon Chart Component
export const TimeHorizonChart = ({ data, comparisonMode }) => {
  if (comparisonMode) {
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
            name={`MAPE - ${data.primary.name}`}
          />
          <Line
            yAxisId="left"
            type="monotone"
            data={data.secondary.data}
            dataKey="mape"
            stroke="#82ca9d"
            name={`MAPE - ${data.secondary.name}`}
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

// Distribution Chart Component
export const MetricsDistributionChart = ({ metricsDistributionData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <div className="h-full">
        <h3 className="text-sm font-medium mb-1 text-center">
          Trend Accuracy Distribution
        </h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart
            data={metricsDistributionData.continuous?.trend || []}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceArea x1={0} x2={50} fill="rgba(255, 0, 0, 0.15)" />
            <ReferenceLine
              x={50}
              stroke="#ff0000"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <XAxis dataKey="value" domain={[0, 100]} />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke={METRIC_COLOUR["trend_accuracy"]}
              fill={METRIC_COLOUR["trend_accuracy"]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-full">
        <h3 className="text-sm font-medium mb-1 text-center">
          Cost Savings Distribution
        </h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart
            data={metricsDistributionData.continuous?.savings || []}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceArea
              x1={metricsDistributionData.minMaxValues?.savingsMin || -15}
              x2={0}
              fill="rgba(255, 0, 0, 0.15)"
            />
            <ReferenceLine
              x={0}
              stroke="#ff0000"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <XAxis
              dataKey="value"
              domain={[
                metricsDistributionData.minMaxValues?.savingsMin || -15,
                metricsDistributionData.minMaxValues?.savingsMax || 25,
              ]}
            />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke={METRIC_COLOUR["cost_savings"]}
              fill={METRIC_COLOUR["cost_savings"]}
            />
          </AreaChart>
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
        typeof item.savings_efficiency === "number",
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
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="savings_efficiency"
          stroke="#ff7300"
          name="Efficiency"
          strokeWidth={2}
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
