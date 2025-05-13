import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ModelConfigComparison = ({ primaryConfig, secondaryConfig, primaryName, secondaryName }) => {
  // Check if we have configs to compare
  if (!primaryConfig || !secondaryConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No configuration data available.</p>
        </CardContent>
      </Card>
    );
  }

  // Function to format values for display
  const formatValue = (value) => {
    if (value === undefined || value === null) return "-";
    if (Array.isArray(value)) {
      return value.length === 0 ? "[]" : value.join(", ");
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return value.toString();
  };

  // Function to find all differences between the two configs and flatten them
  const findDifferences = () => {
    const differences = [];
    
    // Helper function to compare nested objects and add differences
    const compareObjects = (obj1, obj2, path = "") => {
      // Handle case where one object exists but other doesn't
      if (!obj1 || !obj2) {
        differences.push({
          path: path.slice(0, -1), // Remove trailing dot
          primaryValue: obj1,
          secondaryValue: obj2
        });
        return;
      }
      
      // Get all keys from both objects
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      
      // Compare each key
      for (const key of allKeys) {
        const val1 = obj1[key];
        const val2 = obj2[key];
        
        // Skip if values are identical
        if (JSON.stringify(val1) === JSON.stringify(val2)) {
          continue;
        }
        
        const currentPath = path + key;
        
        // Recursively compare nested objects
        if (typeof val1 === 'object' && typeof val2 === 'object' && 
            val1 !== null && val2 !== null && 
            !Array.isArray(val1) && !Array.isArray(val2)) {
          compareObjects(val1, val2, currentPath + '.');
        } else {
          // Add leaf node differences
          differences.push({
            path: currentPath,
            primaryValue: val1,
            secondaryValue: val2
          });
        }
      }
    };
    
    compareObjects(primaryConfig, secondaryConfig);
    return differences;
  };
  
  const differences = findDifferences();

  // Function to get a more readable label from the path
  const getReadableLabel = (path) => {
    // Replace dots with spaces and capitalize first letter of each word
    return path.split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' > ');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Configuration Differences</CardTitle>
      </CardHeader>
      <CardContent>
        {differences.length === 0 ? (
          <div className="bg-green-100 p-2 rounded text-center">
            Both models have identical configurations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Configuration Property</th>
                  <th className="border p-2 text-left">{primaryName || "Primary Model"}</th>
                  <th className="border p-2 text-left">{secondaryName || "Secondary Model"}</th>
                </tr>
              </thead>
              <tbody>
                {differences.map((diff, index) => (
                  <tr key={index} className="bg-yellow-50">
                    <td className="border p-2 font-medium">{getReadableLabel(diff.path)}</td>
                    <td className="border p-2">{formatValue(diff.primaryValue)}</td>
                    <td className="border p-2">{formatValue(diff.secondaryValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelConfigComparison;