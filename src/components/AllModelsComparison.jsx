import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Metrics to display: key, label, whether lower values are better
const metricsList = [
  { key: "avg_mape", label: "Average MAPE (%)", lowerIsBetter: true },
  { key: "avg_mse", label: "Average MSE", lowerIsBetter: true },
  { key: "std_mape", label: "MAPE Std Dev", lowerIsBetter: true },
  { key: "min_mape", label: "Min MAPE (%)", lowerIsBetter: true },
  { key: "max_mape", label: "Max MAPE (%)", lowerIsBetter: true },
  { key: "avg_sgnif_trend_acc", label: "Trend Accuracy (%)", lowerIsBetter: false },
  { key: "avg_cost_savings", label: "Cost Savings (%)", lowerIsBetter: false },
  { key: "avg_perfect_savings", label: "Perfect Savings (%)", lowerIsBetter: false },
  { key: "avg_savings_efficiency", label: "Savings Efficiency (%)", lowerIsBetter: false },
];

const AllModelsComparison = ({ models, selectedPrimary, selectedSecondary }) => {
  // Determine best value per metric
  const bestValues = {};
  metricsList.forEach(({ key, lowerIsBetter }) => {
    const vals = models.map((m) => m.metrics?.[key]).filter((v) => v !== undefined);
    if (vals.length) {
      bestValues[key] = lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
    }
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>All Models Comparison</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-2 whitespace-nowrap truncate">Metric</th>
              {models.map((m, colIndex) => (
                <th
                  key={m.name}
                  className={`py-2 px-2 whitespace-normal break-words ${
                    m.name === selectedPrimary
                      ? 'bg-blue-50 font-semibold'
                      : m.name === selectedSecondary
                      ? 'bg-green-50 font-semibold'
                      : ''
                  }`}
                >
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricsList.map(({ key, label }) => (
              <tr key={key} className="border-t">
                <td className="py-1 px-2 font-medium whitespace-nowrap truncate">{label}</td>
                {models.map((m) => {
                  const val = m.metrics?.[key];
                  const isBest = val !== undefined && val === bestValues[key];
                  return (
                    <td
                      key={m.name}
                      className={`py-1 px-2 ${
                        m.name === selectedPrimary
                          ? 'bg-blue-50'
                          : m.name === selectedSecondary
                          ? 'bg-green-50'
                          : ''
                      } ${isBest ? 'text-green-600 font-semibold' : ''} whitespace-nowrap`}
                    >
                      {val !== undefined ? val.toFixed(2) : 'N/A'}
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

export default AllModelsComparison;
