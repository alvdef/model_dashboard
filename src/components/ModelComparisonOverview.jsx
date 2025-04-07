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
        <Card>
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
        <Card>
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

              {secondaryModel && (
                <div className="text-xs text-gray-500 mt-2 border-t pt-2">
                  <p>* Green text indicates better performance</p>
                  <p>
                    * Lower is better for error metrics, higher for trend
                    accuracy and cost metrics
                  </p>
                  <p>
                    * Efficiency shows what % of theoretical maximum savings the
                    model achieves
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModelComparisonOverview;
