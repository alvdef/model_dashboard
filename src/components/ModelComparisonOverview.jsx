import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ModelComparisonOverview = ({
  primaryModel,
  secondaryModel,
  isFiltered = false,
}) => {
  // Function to determine which model performs better for a metric
  // For most metrics, lower is better (except trend accuracy and cost savings)
  const getBetterModel = (metric, lowerIsBetter = true) => {
    const primaryValue = primaryModel.metrics?.[metric];
    const secondaryValue = secondaryModel?.metrics?.[metric];

    if (primaryValue === undefined || secondaryValue === undefined) return null;

    if (lowerIsBetter) {
      return primaryValue < secondaryValue ? "primary" : "secondary";
    } else {
      return primaryValue > secondaryValue ? "primary" : "secondary";
    }
  };

  // Format a metric value for display
  const formatMetricValue = (value) => {
    if (value === undefined) return "N/A";
    return value.toFixed(2);
  };

  // Render a metric in a compact format
  const renderMetric = (metric, label, lowerIsBetter = true) => {
    const betterModel = getBetterModel(metric, lowerIsBetter);
    const primaryValue = primaryModel.metrics?.[metric];
    const secondaryValue = secondaryModel?.metrics?.[metric];

    return (
      <div className="flex flex-col mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          <span
            className={`text-lg font-semibold ${betterModel === "primary" ? "text-green-600" : ""}`}
          >
            {formatMetricValue(primaryValue)}
          </span>

          {secondaryModel && (
            <>
              <span className="text-gray-400 mx-1">vs</span>
              <span
                className={`text-lg font-semibold ${betterModel === "secondary" ? "text-green-600" : ""}`}
              >
                {formatMetricValue(secondaryValue)}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  // Compare configurations and find differences
  const getConfigDifferences = () => {
    if (!primaryModel?.config || !secondaryModel?.config) return null;

    const differences = [];
    const primaryConfig = primaryModel.config;
    const secondaryConfig = secondaryModel.config;

    // Function to compare nested objects recursively
    const compareObjects = (obj1, obj2, path = '') => {
      const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        // Skip if both are undefined
        if (val1 === undefined && val2 === undefined) continue;

        // Check if values are objects (but not arrays) for recursive comparison
        if (
          val1 && val2 &&
          typeof val1 === 'object' && typeof val2 === 'object' &&
          !Array.isArray(val1) && !Array.isArray(val2)
        ) {
          compareObjects(val1, val2, newPath);
        }
        // For arrays or primitive values, compare directly
        else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          differences.push({
            path: newPath,
            primary: val1,
            secondary: val2,
          });
        }
      }
    };

    // Compare main configuration sections
    const configSections = [
      'sequence_config',
      'dataset_features',
      'dataset_config',
      'model_config',
      'loss_config',
      'training_hyperparams',
      'evaluate_config'
    ];

    for (const section of configSections) {
      compareObjects(primaryConfig[section], secondaryConfig[section], section);
    }

    return differences.length > 0 ? differences : null;
  };

  // Format config value for display
  const formatConfigValue = (value) => {
    if (value === undefined) return "—";
    if (Array.isArray(value)) {
      if (value.length > 3) {
        return `[${value.slice(0, 2).join(', ')}, ... (${value.length} items)]`;
      }
      return `[${value.join(', ')}]`;
    }
    if (typeof value === 'object' && value !== null) {
      return '{...}';
    }
    return String(value);
  };

  // Get configuration differences between models
  const configDifferences = secondaryModel ? getConfigDifferences() : null;

  return (
    <div className="p-4 bg-gray-50">
      <h2 className="text-lg font-bold mb-3">
        {secondaryModel ? "Model Comparison" : "Model Metrics"}
        {isFiltered && (
          <span className="ml-2 text-sm font-normal text-blue-600">
            (Filtered Data)
          </span>
        )}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Error Metrics */}
        <Card className="md:col-span-1">
          <CardHeader className="py-2">
            <CardTitle className="text-base">Error Metrics</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-x-4">
              {renderMetric("avg_mape", "Average MAPE (%)", true)}
              {renderMetric("avg_mse", "Average mse", true)}
              {renderMetric("std_mape", "MAPE Std Dev", true)}
              <div className="col-span-2 border-t my-1"></div>
              <div className="col-span-1">
                {renderMetric("min_mape", "Min MAPE (%)", true)}
              </div>
              <div className="col-span-1">
                {renderMetric("max_mape", "Max MAPE (%)", true)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Performance Metrics */}
        <Card className="md:col-span-1">
          <CardHeader className="py-2">
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-2">
              {renderMetric("avg_sgnif_trend_acc", "Trend Accuracy (%)", false)}
              {renderMetric("avg_cost_savings", "Cost Savings (%)", false)}
              {renderMetric(
                "avg_perfect_savings",
                "Perfect Savings (%)",
                false,
              )}
              {renderMetric(
                "avg_savings_efficiency",
                "Savings Efficiency (%)",
                false,
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Configuration Comparison (only shown when there are differences) */}
        {configDifferences && configDifferences.length > 0 && (
          <Card className="md:col-span-1">
            <CardHeader className="py-2">
              <CardTitle className="text-base">Configuration Differences</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Parameter</th>
                    <th className="py-2">{primaryModel.name || "Primary"}</th>
                    <th className="py-2">{secondaryModel.name || "Secondary"}</th>
                  </tr>
                </thead>
                <tbody>
                  {configDifferences.map((diff, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-1 font-medium">{diff.path}</td>
                      <td className="py-1 font-mono text-xs">
                        {formatConfigValue(diff.primary)}
                      </td>
                      <td className="py-1 font-mono text-xs">
                        {formatConfigValue(diff.secondary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModelComparisonOverview;
