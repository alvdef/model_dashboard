import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TimeHorizonChart,
  MetricsDistributionChart,
  ErrorDistributionChart,
  MetricsBarChart,
  CostEfficiencyChart, // Import from ChartComponents instead
  getMapeColor,
  METRIC_COLOUR,
} from "./charts/ChartComponents";

// Size order for consistent sorting
const SIZE_ORDER = {
  nano: 1,
  micro: 2,
  small: 3,
  medium: 4,
  large: 5,
  xlarge: 6,
  "2xlarge": 7,
  "3xlarge": 8,
  "4xlarge": 9,
  "6xlarge": 10,
  "8xlarge": 11,
  "9xlarge": 12,
  "10xlarge": 13,
  "12xlarge": 14,
  "16xlarge": 15,
  "18xlarge": 16,
  "24xlarge": 17,
  "32xlarge": 18,
  "48xlarge": 19,
  metal: 20,
  "metal-16xl": 21,
  "metal-24xl": 22,
  "metal-32xl": 23,
  "metal-48xl": 24,
};

const VisualizationGrid = ({
  timeHorizonData,
  generationData,
  sizeData,
  errorThresholdData,
  errorThresholdDataSecondary,
  regionData,
  instanceFamilyData,
  azErrorData,
  instanceTimeSeriesData,
  trendAccuracyData,
  metricsDistributionData,
  costEfficiencyData, // New prop
  comparisonMode = false,
  primaryName = "Primary Model",
  secondaryName = "Secondary Model",
}) => {
  // State to manage collapse
  const [hidden, setHidden] = useState({
    timeHorizon: false,
    generation: false,
    size: false,
    errorThreshold: false,
    region: false,
    instanceFamily: false,
    azError: false,
    instanceTimeSeries: false,
    trendAccuracy: false,
    continuousDistribution: false,
    costEfficiency: false, // Add new state
  });

  // State for instance time series sort configuration
  const [sortConfig, setSortConfig] = useState({
    criterion: "family", // Options: 'family', 'generation', 'modification', 'size'
    direction: "asc", // Direction: 'asc' or 'desc'
  });

  const toggleVisibility = (key) => {
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSort = (sortType) => {
    setSortConfig((prev) => {
      if (prev.criterion === sortType) {
        return {
          ...prev,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        return { criterion: sortType, direction: "asc" };
      }
    });
  };

  // Render the time horizon chart
  const renderTimeHorizonChart = () => {
    if (hidden.timeHorizon) return null;

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("timeHorizon")}
        >
          <CardTitle>
            {comparisonMode
              ? "Time Horizon Performance Comparison"
              : "Time Horizon Performance Degradation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <TimeHorizonChart
            data={timeHorizonData}
            comparisonMode={comparisonMode}
          />
        </CardContent>
      </Card>
    );
  };

  // Render performance by generation chart
  const renderGenerationChart = () => {
    if (hidden.generation) return null;

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("generation")}
        >
          <CardTitle>Performance by Instance Generation</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <MetricsBarChart
            data={generationData}
            xAxis="generation"
            primaryMetric="mape"
            secondaryMetric="sgnif_trend_acc"
          />
        </CardContent>
      </Card>
    );
  };

  // Render performance by size chart
  const renderSizeChart = () => {
    if (hidden.size) return null;

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("size")}
        >
          <CardTitle>Performance by Instance Size</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <MetricsBarChart
            data={sizeData}
            xAxis="size"
            primaryMetric="mape"
            secondaryMetric="sgnif_trend_acc"
          />
        </CardContent>
      </Card>
    );
  };

  // Render error distribution by size chart
  const renderErrorThresholdChart = () => {
    if (hidden.errorThreshold) return null;

    if (comparisonMode) {
      return (
        <Card className="h-full col-span-1 md:col-span-2">
          <CardHeader
            className="py-3 cursor-pointer"
            onClick={() => toggleVisibility("errorThreshold")}
          >
            <CardTitle>Prediction Error Distribution by Size (Comparison)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="h-full flex flex-col">
                <CardTitle className="text-sm text-center mb-2">
                  {primaryName}
                </CardTitle>
                <div className="flex-grow h-[90%]">
                  <ErrorDistributionChart
                    data={errorThresholdData}
                    categoryField="size"
                  />
                </div>
              </div>
              <div className="h-full flex flex-col">
                <CardTitle className="text-sm text-center mb-2">
                  {secondaryName}
                </CardTitle>
                <div className="flex-grow h-[90%]">
                  <ErrorDistributionChart
                    data={errorThresholdDataSecondary}
                    categoryField="size"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("errorThreshold")}
        >
          <CardTitle>Prediction Error Distribution by Size</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ErrorDistributionChart
            data={errorThresholdData}
            categoryField="size"
          />
        </CardContent>
      </Card>
    );
  };

  // Render metrics distribution chart
  const renderMetricsDistributionChart = () => {
    if (hidden.continuousDistribution) return null;

    return (
      <Card className="h-full col-span-1 md:col-span-2">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("continuousDistribution")}
        >
          <CardTitle>Distribution of Metrics</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <MetricsDistributionChart
            metricsDistributionData={metricsDistributionData}
          />
        </CardContent>
      </Card>
    );
  };

  // Render performance by region chart
  const renderRegionChart = () => {
    if (hidden.region) return null;

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("region")}
        >
          <CardTitle>Performance by Region</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <MetricsBarChart
            data={regionData}
            xAxis="region"
            primaryMetric="mape"
            secondaryMetric="cost_savings"
            secondaryLabel="Cost Savings (%)"
            secondaryDomain={[-15, 30]}
          />
        </CardContent>
      </Card>
    );
  };

  // Render AZ error distribution chart
  const renderAZErrorChart = () => {
    if (hidden.azError) return null;

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("azError")}
        >
          <CardTitle>Prediction Error Distribution by AZ</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ErrorDistributionChart data={azErrorData} categoryField="av_zone" />
        </CardContent>
      </Card>
    );
  };

  // Render performance by instance family chart
  const renderInstanceFamilyChart = () => {
    if (hidden.instanceFamily) return null;

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("instanceFamily")}
        >
          <CardTitle>Performance by Instance Family</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <MetricsBarChart
            data={instanceFamilyData}
            xAxis="instance_family"
            primaryMetric="mape"
            secondaryMetric="sgnif_trend_acc"
          />
        </CardContent>
      </Card>
    );
  };

  // Render trend accuracy chart
  const renderTrendAccuracyChart = () => {
    if (hidden.trendAccuracy) return null;

    return (
      <Card className="h-full">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("trendAccuracy")}
        >
          <CardTitle>Prediction Quality by Instance Family</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <MetricsBarChart
            data={trendAccuracyData}
            xAxis="instance_family"
            primaryMetric="avg_trend_accuracy"
            secondaryMetric="avg_cost_savings"
            primaryLabel="Trend Accuracy (%)"
            secondaryLabel="Cost Savings (%)"
            secondaryDomain={[-20, 30]}
          />
        </CardContent>
      </Card>
    );
  };

  // Render instance time series heatmap
  const renderInstanceTimeSeriesChart = () => {
    if (hidden.instanceTimeSeries) return null;

    // Parse instance type components for sorting
    const parseInstanceType = (instanceType) => {
      const [prefix, suffix] = instanceType.split(".");
      const family = prefix.replace(/\d+/g, "");
      const generation = parseInt(prefix.replace(/\D+/g, "") || "0");
      const modification = prefix.replace(/^\D+\d+/, ""); // Get any letters after the generation number
      const size = suffix || "";
      return { instanceType, family, generation, modification, size };
    };

    // Get and sort instance types
    const uniqueInstanceTypes = Array.from(
      new Set(instanceTimeSeriesData.map((item) => item.instance_type)),
    )
      .map(parseInstanceType)
      .sort((a, b) => {
        // Set comparison values based on sort criterion
        let valueA, valueB;
        if (sortConfig.criterion === "family") {
          valueA = a.family;
          valueB = b.family;
        } else if (sortConfig.criterion === "generation") {
          valueA = a.generation;
          valueB = b.generation;
        } else if (sortConfig.criterion === "modification") {
          valueA = a.modification;
          valueB = b.modification;
        } else {
          // 'size'
          valueA = SIZE_ORDER[a.size] || 999;
          valueB = SIZE_ORDER[b.size] || 999;
        }

        // Perform comparison
        let comparison = 0;
        if (typeof valueA === "string" && typeof valueB === "string") {
          comparison = valueA.localeCompare(valueB);
        } else {
          comparison = valueA - valueB;
        }

        // Apply sort direction
        return sortConfig.direction === "asc" ? comparison : -comparison;
      })
      .map((item) => item.instanceType);

    // Get unique time steps
    const uniqueTimeSteps = Array.from(
      new Set(instanceTimeSeriesData.map((item) => item.time_step)),
    ).sort((a, b) => a - b);

    // Create a lookup map: { instance_type: { time_step: item } }
    const dataMap = {};
    instanceTimeSeriesData.forEach((item) => {
      if (!dataMap[item.instance_type]) dataMap[item.instance_type] = {};
      dataMap[item.instance_type][item.time_step] = item;
    });

    return (
      <Card className="h-full col-span-1 xl:col-span-3">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("instanceTimeSeries")}
        >
          <CardTitle>
            MAPE Progression by Instance Type and Time Horizon
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="text-xs text-gray-500 mb-2">
            Values represent average MAPE (%). Cell color indicates error
            magnitude: green (low) to red (high).
          </div>

          {/* Sorting controls */}
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <span>Sort by:</span>
            <button
              className={`px-2 py-1 rounded ${sortConfig.criterion === "family" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onClick={() => toggleSort("family")}
            >
              Instance Family{" "}
              {sortConfig.criterion === "family" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
            <button
              className={`px-2 py-1 rounded ${sortConfig.criterion === "generation" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onClick={() => toggleSort("generation")}
            >
              Generation{" "}
              {sortConfig.criterion === "generation" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
            <button
              className={`px-2 py-1 rounded ${sortConfig.criterion === "modification" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onClick={() => toggleSort("modification")}
            >
              Modification{" "}
              {sortConfig.criterion === "modification" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
            <button
              className={`px-2 py-1 rounded ${sortConfig.criterion === "size" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onClick={() => toggleSort("size")}
            >
              Size{" "}
              {sortConfig.criterion === "size" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
          </div>

          {/* Heatmap table */}
          <table className="border-collapse w-fit text-xs">
            <thead>
              <tr>
                <th className="border p-0.5 bg-gray-200"></th>
                {uniqueTimeSteps.map((ts) => (
                  <th key={ts} className="border p-0.5 bg-gray-200 text-center">
                    t+{ts}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueInstanceTypes.map((instType) => (
                <tr key={instType}>
                  <td className="border p-0.5 bg-gray-200">{instType}</td>
                  {uniqueTimeSteps.map((ts) => {
                    const cellData = dataMap[instType] && dataMap[instType][ts];
                    const mape = cellData ? cellData.mape : null;
                    const bgColor =
                      mape !== null ? getMapeColor(mape) : "#f1f5f9";
                    return (
                      <td
                        key={ts}
                        className="border p-0.5 text-center"
                        style={{ backgroundColor: bgColor, minWidth: "40px" }}
                      >
                        {mape !== null ? mape.toFixed(1) + "%" : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  };

  // Render cost efficiency chart
  const renderCostEfficiencyChart = () => {
    if (hidden.costEfficiency) return null;

    return (
      <Card className="h-full col-span-1 md:col-span-1">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleVisibility("costEfficiency")}
        >
          <CardTitle>Cost Efficiency Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <CostEfficiencyChart data={costEfficiencyData} />
        </CardContent>
      </Card>
    );
  };

  // Render restore buttons section
  const renderRestoreButtons = () => {
    // Only show component if there are hidden items
    if (Object.values(hidden).every((v) => !v)) {
      return (
        <span className="text-sm text-gray-500">No hidden visualizations</span>
      );
    }

    return (
      <>
        {hidden.timeHorizon && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("timeHorizon")}
          >
            Time Horizon Performance
          </button>
        )}
        {hidden.generation && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("generation")}
          >
            Instance Generation
          </button>
        )}
        {hidden.size && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("size")}
          >
            Instance Size
          </button>
        )}
        {hidden.errorThreshold && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("errorThreshold")}
          >
            Error Distribution by Size
          </button>
        )}
        {hidden.region && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("region")}
          >
            Performance by Region
          </button>
        )}
        {hidden.instanceFamily && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("instanceFamily")}
          >
            Instance Family
          </button>
        )}
        {hidden.azError && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("azError")}
          >
            Error Distribution by AZ
          </button>
        )}
        {hidden.trendAccuracy && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("trendAccuracy")}
          >
            Prediction Quality
          </button>
        )}
        {hidden.instanceTimeSeries && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("instanceTimeSeries")}
          >
            MAPE Progression
          </button>
        )}
        {hidden.continuousDistribution && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("continuousDistribution")}
          >
            Metrics Distribution
          </button>
        )}
        {hidden.costEfficiency && (
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={() => toggleVisibility("costEfficiency")}
          >
            Cost Efficiency
          </button>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Cost Efficiency Chart (prominently positioned near the top) */}
        {renderCostEfficiencyChart()}

        {/* Time Horizon Chart */}
        {renderTimeHorizonChart()}

        {/* Generation Chart */}
        {renderGenerationChart()}

        {/* Size Chart */}
        {renderSizeChart()}

        {/* Error Threshold Chart */}
        {renderErrorThresholdChart()}

        {/* Metrics Distribution Chart */}
        {renderMetricsDistributionChart()}

        {/* Instance Time Series Chart */}
        {renderInstanceTimeSeriesChart()}

        {/* Region Chart */}
        {renderRegionChart()}

        {/* AZ Error Chart */}
        {renderAZErrorChart()}

        {/* Instance Family Chart */}
        {renderInstanceFamilyChart()}

        {/* Trend Accuracy Chart */}
        {renderTrendAccuracyChart()}
      </div>

      {/* Restore buttons */}
      <div className="mt-4 mb-2">
        <Card>
          <CardHeader className="py-2">
            <CardTitle>Restore Hidden Visualizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">{renderRestoreButtons()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisualizationGrid;
