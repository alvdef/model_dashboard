import React, { useState, useEffect } from "react";
import _ from "lodash";
import { Card, CardContent } from "@/components/ui/card";
import FilterBar from "./FilterBar";
import VisualizationGrid from "./VisualizationGrid";
import ModelComparisonOverview from "./ModelComparisonOverview";

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

const MetricsDashboard = () => {
  // Dual model states
  const [modelData, setModelData] = useState({
    primary: {
      name: null,
      rawData: [],
      overallMetrics: null,
      timeHorizonData: [],
      generationData: [],
      sizeData: [],
      errorThresholdData: [],
      regionData: [],
      instanceFamilyData: [],
      azErrorData: [],
      instanceTimeSeriesData: [],
      trendAccuracyData: [],
      metricsDistributionData: [],
      costEfficiencyData: [],
    },
    secondary: {
      // ...same structure as primary
      name: null,
      rawData: [],
      overallMetrics: null,
      timeHorizonData: [],
      generationData: [],
      sizeData: [],
      errorThresholdData: [],
      regionData: [],
      instanceFamilyData: [],
      azErrorData: [],
      instanceTimeSeriesData: [],
      trendAccuracyData: [],
      metricsDistributionData: [],
      costEfficiencyData: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    av_zones: [],
    instance_types: [],
    sizes: [],
    time_horizons: [],
    generations: [],
    modifiers: [],
    region: [],
    instance_family: [],
  });
  const [filterOptions, setFilterOptions] = useState({
    av_zones: [],
    instance_types: [],
    sizes: [],
    generations: [],
    modifiers: [],
    region: [],
    instance_family: [],
  });
  const [comparisonMode, setComparisonMode] = useState(false);

  // New state for dynamic metrics that change with filters
  const [dynamicMetrics, setDynamicMetrics] = useState({
    primary: null,
    secondary: null,
  });

  // Data processing functions - simplified
  const processTimeHorizonData = (data) => {
    let filteredData = applyFilters(data);
    return _.chain(filteredData)
      .groupBy("n_timestep")
      .map((group, timestep) => ({
        timestep: parseInt(timestep),
        mse: _.meanBy(group, "mse") || 0,
        mape: _.meanBy(group, "mape") || 0,
        sgnif_trend_acc: _.meanBy(group, "sgnif_trend_acc") || 0,
        cost_savings: _.meanBy(group, "cost_savings") || 0,
      }))
      .sortBy("timestep")
      .value();
  };

  const processGenerationData = (data) => {
    return _.chain(data)
      .groupBy("generation")
      .map((group, gen) => ({
        generation: gen || "Unknown",
        count: group.length,
        mape: _.meanBy(group, "mape") || 0,
        // Data already in percentage format
        sgnif_trend_acc: _.meanBy(group, "sgnif_trend_acc") || 0,
        cost_savings: _.meanBy(group, "cost_savings") || 0,
      }))
      .sortBy("generation")
      .value();
  };

  const processSizeData = (data) => {
    return _.chain(data)
      .groupBy("size")
      .map((group, size) => ({
        size: size || "Unknown",
        count: group.length,
        mape: _.meanBy(group, "mape") || 0,
        // Data already in percentage format
        sgnif_trend_acc: _.meanBy(group, "sgnif_trend_acc") || 0,
        cost_savings: _.meanBy(group, "cost_savings") || 0,
        order: SIZE_ORDER[size] || 999,
      }))
      .sortBy("order")
      .value();
  };

  const processErrorThresholds = (data) => {
    return _.chain(data)
      .groupBy("size")
      .map((instances, size) => {
        const total = instances.length;
        const distribution = {
          size,
          order: SIZE_ORDER[size] || 999,
        };

        // Calculate percentages for each error range
        const mapeValues = instances.map((d) => d.mape);

        distribution["Very Accurate (< 1%)"] =
          (mapeValues.filter((v) => v <= 1).length / total) * 100;
        distribution["Good (1-5%)"] =
          (mapeValues.filter((v) => v > 1 && v <= 5).length / total) * 100;
        distribution["Acceptable (5-10%)"] =
          (mapeValues.filter((v) => v > 5 && v <= 10).length / total) * 100;
        distribution["Poor (10-20%)"] =
          (mapeValues.filter((v) => v > 10 && v <= 20).length / total) * 100;
        distribution["Very Poor (20-50%)"] =
          (mapeValues.filter((v) => v > 20 && v <= 50).length / total) * 100;
        distribution["Unreliable (50-100%)"] =
          (mapeValues.filter((v) => v > 50 && v <= 100).length / total) * 100;
        distribution["Extreme Error (> 100%)"] =
          (mapeValues.filter((v) => v > 100).length / total) * 100;

        return distribution;
      })
      .sortBy("order")
      .value();
  };

  const processRegionData = (data) => {
    return _.chain(data)
      .groupBy("region")
      .map((group, region) => ({
        region: region || "Unknown",
        count: group.length,
        mape: _.meanBy(group, "mape") || 0,
        // Data already in percentage format
        sgnif_trend_acc: _.meanBy(group, "sgnif_trend_acc") || 0,
        cost_savings: _.meanBy(group, "cost_savings") || 0,
      }))
      .sortBy("region")
      .value();
  };

  const processInstanceFamilyData = (data) => {
    return _.chain(data)
      .groupBy("instance_family")
      .map((group, family) => ({
        instance_family: family || "Unknown",
        count: group.length,
        mape: _.meanBy(group, "mape") || 0,
        // Data already in percentage format
        sgnif_trend_acc: _.meanBy(group, "sgnif_trend_acc") || 0,
        cost_savings: _.meanBy(group, "cost_savings") || 0,
      }))
      .sortBy("instance_family")
      .value();
  };

  const processAzErrorDistribution = (data) => {
    return _.chain(data)
      .groupBy("av_zone")
      .map((instances, zone) => {
        const total = instances.length;
        const distribution = {
          av_zone: zone,
        };

        // Calculate percentages for each error range
        const mapeValues = instances.map((d) => d.mape);

        distribution["Very Accurate (< 1%)"] =
          (mapeValues.filter((v) => v <= 1).length / total) * 100;
        distribution["Good (1-5%)"] =
          (mapeValues.filter((v) => v > 1 && v <= 5).length / total) * 100;
        distribution["Acceptable (5-10%)"] =
          (mapeValues.filter((v) => v > 5 && v <= 10).length / total) * 100;
        distribution["Poor (10-20%)"] =
          (mapeValues.filter((v) => v > 10 && v <= 20).length / total) * 100;
        distribution["Very Poor (20-50%)"] =
          (mapeValues.filter((v) => v > 20 && v <= 50).length / total) * 100;
        distribution["Unreliable (50-100%)"] =
          (mapeValues.filter((v) => v > 50 && v <= 100).length / total) * 100;
        distribution["Extreme Error (> 100%)"] =
          (mapeValues.filter((v) => v > 100).length / total) * 100;

        return distribution;
      })
      .sortBy("av_zone")
      .value();
  };

  const processInstanceTimeSeriesData = (data) => {
    // Group data by instance_type and then by time step
    const instanceTypesData = {};

    data.forEach((entry) => {
      const instanceType = entry.instance_type;
      const timeStep = entry.n_timestep;
      const mape = entry.mape;

      if (!instanceType) return;

      if (!instanceTypesData[instanceType]) {
        instanceTypesData[instanceType] = {
          instance_type: instanceType,
          timeSteps: {},
        };
      }

      // For each instance type and time step, collect all mape values
      if (!instanceTypesData[instanceType].timeSteps[timeStep]) {
        instanceTypesData[instanceType].timeSteps[timeStep] = [];
      }

      instanceTypesData[instanceType].timeSteps[timeStep].push(mape);
    });

    // Convert to format for heatmap visualization
    const heatmapData = [];

    Object.values(instanceTypesData).forEach((typeData) => {
      Object.entries(typeData.timeSteps).forEach(([timeStep, mapeValues]) => {
        // Calculate average MAPE for this instance type and time step
        const avgMape =
          mapeValues.reduce((sum, val) => sum + val, 0) / mapeValues.length;

        heatmapData.push({
          instance_type: typeData.instance_type,
          time_step: parseInt(timeStep),
          mape: avgMape,
          count: mapeValues.length,
        });
      });
    });

    return heatmapData;
  };

  const processTrendAccuracyData = (data) => {
    return _.chain(data)
      .groupBy("instance_family")
      .map((group, family) => ({
        instance_family: family || "Unknown",
        count: group.length,
        // Data already in percentage format
        avg_trend_accuracy: _.meanBy(group, "sgnif_trend_acc") || 0,
        avg_cost_savings: _.meanBy(group, "cost_savings") || 0,
      }))
      .sortBy("instance_family")
      .value();
  };

  const processMetricsDistributionData = (data) => {
    // Create unique entries by instance_id to avoid duplicates
    const uniqueInstances = _.uniqBy(data, "instance_id");

    // Collect values for continuous distribution
    const trendValues = [];
    const savingsValues = [];

    uniqueInstances.forEach((instance) => {
      // Data already in percentage format
      const trendAcc = instance.sgnif_trend_acc;
      const savings = instance.cost_savings;

      if (!isNaN(trendAcc)) trendValues.push(trendAcc);
      if (!isNaN(savings)) savingsValues.push(savings);
    });

    // Calculate min/max values for proper domain rendering
    const minMaxValues = {
      trendMin: Math.floor(Math.min(...trendValues)) || 0,
      trendMax: Math.ceil(Math.max(...trendValues)) || 100,
      savingsMin: Math.floor(Math.min(...savingsValues)) || -15,
      savingsMax: Math.ceil(Math.max(...savingsValues)) || 25,
    };

    // Create continuous distribution data
    const continuousDistribution = {
      trend: createContinuousDistribution(
        trendValues,
        minMaxValues.trendMin,
        minMaxValues.trendMax,
        50,
      ),
      savings: createContinuousDistribution(
        savingsValues,
        minMaxValues.savingsMin,
        minMaxValues.savingsMax,
        120,
      ),
    };

    return {
      continuous: continuousDistribution,
      minMaxValues: minMaxValues,
    };
  };

  // Helper function to create continuous distribution data
  const createContinuousDistribution = (values, min, max, numBins) => {
    if (!values.length) return [];

    const binWidth = (max - min) / numBins;
    const bins = Array(numBins).fill(0);

    values.forEach((value) => {
      if (value < min) value = min;
      if (value > max) value = max;

      const binIndex = Math.floor((value - min) / binWidth);
      if (binIndex >= 0 && binIndex < numBins) {
        bins[binIndex]++;
      }
    });

    const totalCount = values.length;
    return bins.map((count, i) => ({
      value: min + i * binWidth + binWidth / 2,
      count: count,
      percentage: (count / totalCount) * 100,
    }));
  };

  // Add these processing functions for the new metrics
  const processCostEfficiencyData = (data) => {
    if (!data || data.length === 0) return [];

    return _.chain(data)
      .groupBy("size") // Changed from 'instance_family' to 'size'
      .map((group, size) => {
        const avgCostSavings = _.meanBy(group, "cost_savings") || 0;
        const avgPerfectSavings = _.meanBy(group, "perfect_savings") || 0;

        // Fix efficiency calculation - don't multiply by 100 if data is already in percentage form
        let efficiency = 0;
        if (avgPerfectSavings !== 0) {
          // Simply divide actual by perfect savings (both already in %)
          efficiency = Math.min(
            1,
            Math.max(0, avgCostSavings / avgPerfectSavings),
          );
        } else if (avgCostSavings > 0) {
          // If perfect savings is 0 but we saved something, set to 100%
          efficiency = 1;
        }

        return {
          size: size || "Unknown", // Changed from 'instance_family' to 'size'
          count: group.length,
          cost_savings: avgCostSavings,
          perfect_savings: avgPerfectSavings,
          savings_efficiency: efficiency * 100, // Scale to 0-100 range for display
        };
      })
      .filter(
        (item) =>
          !isNaN(item.cost_savings) &&
          !isNaN(item.perfect_savings) &&
          !isNaN(item.savings_efficiency),
      )
      .sortBy((item) => SIZE_ORDER[item.size] || 999) // Sort by size order
      .value();
  };

  // Apply all active filters to a dataset
  const applyFilters = (data) => {
    let filteredData = data;

    if (filters.av_zones.length > 0) {
      filteredData = filteredData.filter(
        (d) => d.av_zone && filters.av_zones.includes(d.av_zone),
      );
    }
    if (filters.instance_types.length > 0) {
      filteredData = filteredData.filter(
        (d) =>
          d.instance_type && filters.instance_types.includes(d.instance_type),
      );
    }
    if (filters.sizes.length > 0) {
      filteredData = filteredData.filter(
        (d) => d.size && filters.sizes.includes(d.size),
      );
    }
    if (filters.time_horizons.length > 0) {
      filteredData = filteredData.filter((d) =>
        filters.time_horizons.includes(d.n_timestep),
      );
    }
    if (filters.generations.length > 0) {
      filteredData = filteredData.filter(
        (d) =>
          d.generation !== undefined &&
          filters.generations.includes(d.generation),
      );
    }
    if (filters.modifiers.length > 0) {
      filteredData = filteredData.filter((d) => {
        const instanceModifiers = d.modifiers || [];
        return filters.modifiers.some((mod) => instanceModifiers.includes(mod));
      });
    }
    if (filters.region.length > 0) {
      filteredData = filteredData.filter(
        (d) => d.region && filters.region.includes(d.region),
      );
    }
    if (filters.instance_family.length > 0) {
      filteredData = filteredData.filter(
        (d) =>
          d.instance_family &&
          filters.instance_family.includes(d.instance_family),
      );
    }
    return filteredData;
  };

  // File upload handler
  const handleFileUpload = (e, modelType = "primary") => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonText = event.target.result;
        const parsedData = JSON.parse(jsonText);
        const modelName =
          parsedData.config?.model_name ||
          `Model ${modelType === "primary" ? "A" : "B"}`;

        // Transform the nested instances structure to a flat array for processing
        const flattenedData = [];

        Object.entries(parsedData.instances).forEach(
          ([instanceId, instanceData]) => {
            const { metadata, metrics } = instanceData;

            metrics.forEach((metric) => {
              flattenedData.push({
                instance_id: instanceId,
                region: metadata.region,
                av_zone: metadata.av_zone,
                instance_type: metadata.instance_type,
                instance_family: metadata.instance_family,
                generation: metadata.generation,
                modifiers: metadata.modifiers,
                size: metadata.size,
                vcpu: metadata.vcpu,
                memory: metadata.memory,
                architectures: metadata.architectures,
                product_description: metadata.product_description,
                on_demand_price: metadata.on_demand_price,
                n_timestep: metric.n_timestep,
                mape: metric.mape,
                mse: metric.mse,
                sgnif_trend_acc: metric.sgnif_trend_acc,
                cost_savings: metric.cost_savings,
                perfect_savings: metric.perfect_savings,
                savings_efficiency: metric.savings_efficiency,
              });
            });
          },
        );

        // Process and update data for the specified model
        setModelData((prevData) => {
          const updatedModelData = {
            ...prevData[modelType],
            name: modelName,
            rawData: flattenedData,
            overallMetrics: parsedData.overall_metrics,
            timeHorizonData: processTimeHorizonData(flattenedData),
            generationData: processGenerationData(flattenedData),
            sizeData: processSizeData(flattenedData),
            errorThresholdData: processErrorThresholds(flattenedData),
            regionData: processRegionData(flattenedData),
            instanceFamilyData: processInstanceFamilyData(flattenedData),
            azErrorData: processAzErrorDistribution(flattenedData),
            instanceTimeSeriesData:
              processInstanceTimeSeriesData(flattenedData),
            trendAccuracyData: processTrendAccuracyData(flattenedData),
            metricsDistributionData:
              processMetricsDistributionData(flattenedData),
            costEfficiencyData: processCostEfficiencyData(flattenedData),
          };
          return { ...prevData, [modelType]: updatedModelData };
        });

        // Update filter options based on the primary model
        if (modelType === "primary") {
          updateFilterOptions(flattenedData);
        }
        // If both models have data, enable comparison mode
        setModelData((prevData) => {
          if (
            prevData.primary.rawData.length > 0 &&
            prevData.secondary.rawData.length > 0
          ) {
            setComparisonMode(true);
          }
          return prevData;
        });

        setLoading(false);
      } catch (err) {
        console.error(`Error processing ${modelType} model JSON:`, err);
        setError(
          `Error processing the ${modelType === "primary" ? "first" : "second"} JSON file. Please check the file format.`,
        );
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Update filter options based on available data
  const updateFilterOptions = (data) => {
    const allModifiers = _.uniq(data.flatMap((d) => d.modifiers || [])).sort();
    setFilterOptions({
      av_zones: _.uniq(data.map((d) => d.av_zone)).sort(),
      instance_types: _.uniq(data.map((d) => d.instance_type)).sort((a, b) => {
        const aPrefix = a.split(".")[0];
        const bPrefix = b.split(".")[0];
        const aSuffix = a.substring(aPrefix.length + 1);
        const bSuffix = b.substring(bPrefix.length + 1);
        const aOrder = SIZE_ORDER[aSuffix] || 999;
        const bOrder = SIZE_ORDER[bSuffix] || 999;
        if (aPrefix === bPrefix) {
          return aOrder - bOrder;
        }
        return aPrefix.localeCompare(bPrefix);
      }),
      sizes: _.uniq(data.map((d) => d.size)).sort(
        (a, b) => (SIZE_ORDER[a] || 999) - (SIZE_ORDER[b] || 999),
      ),
      time_horizons: _.uniq(data.map((d) => d.n_timestep)).sort(
        (a, b) => a - b,
      ),
      generations: _.uniq(data.map((d) => d.generation)).sort(),
      modifiers: allModifiers,
      region: _.uniq(data.map((d) => d.region)).sort(),
      instance_family: _.uniq(data.map((d) => d.instance_family)).sort(),
    });
  };

  // Calculate overall metrics from filtered data
  const calculateOverallMetrics = (data) => {
    if (!data || data.length === 0) return null;

    // Group by instance_id to get unique instances (avoid counting same instance multiple times)
    const instanceGroups = _.groupBy(data, "instance_id");

    // Collect metric values from all instances
    const mapeValues = [];
    const mseValues = [];
    const trendAccValues = [];
    const costSavingsValues = [];
    const perfectSavingsValues = [];
    const savingsEfficiencyValues = [];

    // Use first timestep for each instance
    Object.values(instanceGroups).forEach((instances) => {
      const instance = _.minBy(instances, "n_timestep");
      if (instance) {
        if (instance.mape !== undefined) mapeValues.push(instance.mape);
        if (instance.mse !== undefined) mseValues.push(instance.mse);
        if (instance.sgnif_trend_acc !== undefined)
          trendAccValues.push(instance.sgnif_trend_acc);
        if (instance.cost_savings !== undefined)
          costSavingsValues.push(instance.cost_savings);
        if (instance.perfect_savings !== undefined)
          perfectSavingsValues.push(instance.perfect_savings);
        if (instance.savings_efficiency !== undefined)
          savingsEfficiencyValues.push(instance.savings_efficiency);
      }
    });

    // Calculate overall metrics
    const metrics = {};

    // Helper function to calculate metrics for an array of values
    const calculateMetricsForValues = (values, metricName) => {
      if (values.length > 0) {
        metrics[`avg_${metricName}`] = _.mean(values);
        metrics[`std_${metricName}`] = calculateStandardDeviation(values);
        metrics[`min_${metricName}`] = _.min(values);
        metrics[`max_${metricName}`] = _.max(values);
      }
    };

    // Calculate metrics for each type
    calculateMetricsForValues(mapeValues, "mape");
    calculateMetricsForValues(mseValues, "mse");
    calculateMetricsForValues(trendAccValues, "sgnif_trend_acc");
    calculateMetricsForValues(costSavingsValues, "cost_savings");
    calculateMetricsForValues(perfectSavingsValues, "perfect_savings");
    calculateMetricsForValues(savingsEfficiencyValues, "savings_efficiency");

    // Add instance counts
    metrics.total_instances = Object.keys(instanceGroups).length;

    return metrics;
  };

  // Helper function to calculate standard deviation
  const calculateStandardDeviation = (values) => {
    if (values.length <= 1) return 0;
    const mean = _.mean(values);
    const squaredDifferences = values.map((value) => Math.pow(value - mean, 2));
    const variance = _.sum(squaredDifferences) / (values.length - 1);
    return Math.sqrt(variance);
  };

  // Apply filters to both models
  useEffect(() => {
    ["primary", "secondary"].forEach((modelType) => {
      if (modelData[modelType].rawData.length > 0) {
        const filteredData = applyFilters(modelData[modelType].rawData);

        // Calculate dynamic metrics based on filtered data
        const calculatedMetrics = calculateOverallMetrics(filteredData);

        // Update dynamic metrics
        setDynamicMetrics((prev) => ({
          ...prev,
          [modelType]: calculatedMetrics,
        }));

        // Update all datasets for this model with the filtered data
        setModelData((prevData) => ({
          ...prevData,
          [modelType]: {
            ...prevData[modelType],
            timeHorizonData: processTimeHorizonData(filteredData),
            generationData: processGenerationData(filteredData),
            sizeData: processSizeData(filteredData),
            errorThresholdData: processErrorThresholds(filteredData),
            regionData: processRegionData(filteredData),
            instanceFamilyData: processInstanceFamilyData(filteredData),
            azErrorData: processAzErrorDistribution(filteredData),
            instanceTimeSeriesData: processInstanceTimeSeriesData(filteredData),
            trendAccuracyData: processTrendAccuracyData(filteredData),
            metricsDistributionData:
              processMetricsDistributionData(filteredData),
            costEfficiencyData: processCostEfficiencyData(filteredData),
          },
        }));
      }
    });
  }, [filters, modelData.primary.rawData, modelData.secondary.rawData]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    if (
      modelData.primary.rawData.length > 0 &&
      modelData.secondary.rawData.length > 0
    ) {
      setComparisonMode(!comparisonMode);
    } else {
      setError("Please upload both model files to enable comparison mode.");
    }
  };

  // Reset secondary model
  const resetSecondaryModel = () => {
    setModelData((prev) => ({
      ...prev,
      secondary: {
        name: null,
        rawData: [],
        overallMetrics: null,
        timeHorizonData: [],
        generationData: [],
        sizeData: [],
        errorThresholdData: [],
        regionData: [],
        instanceFamilyData: [],
        azErrorData: [],
        instanceTimeSeriesData: [],
        trendAccuracyData: [],
        metricsDistributionData: [],
        costEfficiencyData: [],
      },
    }));
    setComparisonMode(false);
  };

  if (loading && modelData.primary.rawData.length === 0) {
    return (
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Model Metrics Dashboard</h2>
            <p className="mb-4">
              Upload a JSON file containing model metrics data to begin
              analysis.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">
                Upload Primary Model JSON File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, "primary")}
                className="border rounded p-2"
              />
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center items-center h-64">
          <div className="loader">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Fixed Filter Bar - keep this sticky */}
      <div className="flex-shrink-0 z-10 sticky top-0 bg-white">
        <FilterBar
          filterOptions={filterOptions}
          filters={filters}
          handleFilterChange={handleFilterChange}
        />
      </div>

      {/* Scrollable Visualization Area - includes all content below filter bar */}
      <div className="flex-grow overflow-y-auto">
        {/* Model Upload Controls */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Model Upload */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">
                    Primary Model{" "}
                    {modelData.primary.name && `(${modelData.primary.name})`}
                  </h3>
                  {modelData.primary.rawData.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Loaded
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, "primary")}
                  className="border rounded p-2 text-sm w-full"
                />
              </CardContent>
            </Card>

            {/* Secondary Model Upload */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">
                    Secondary Model{" "}
                    {modelData.secondary.name &&
                      `(${modelData.secondary.name})`}
                  </h3>
                  {modelData.secondary.rawData.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Loaded
                      </span>
                      <button
                        onClick={resetSecondaryModel}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Reset
                      </button>
                    </div>
                  ) : null}
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, "secondary")}
                  className="border rounded p-2 text-sm w-full"
                />
              </CardContent>
            </Card>
          </div>
          {/* Comparison Controls */}
          {modelData.primary.rawData.length > 0 &&
            modelData.secondary.rawData.length > 0 && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={toggleComparisonMode}
                  className={`px-4 py-2 rounded-md text-white ${
                    comparisonMode
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {comparisonMode
                    ? "Disable Comparison Mode"
                    : "Enable Comparison Mode"}
                </button>
              </div>
            )}
        </div>

        {/* Overall Metrics Comparison */}
        {modelData.primary.rawData.length > 0 && (
          <ModelComparisonOverview
            primaryModel={{
              name: modelData.primary.name,
              metrics:
                dynamicMetrics.primary || modelData.primary.overallMetrics,
            }}
            secondaryModel={
              modelData.secondary.rawData.length > 0
                ? {
                    name: modelData.secondary.name,
                    metrics:
                      dynamicMetrics.secondary ||
                      modelData.secondary.overallMetrics,
                  }
                : null
            }
            isFiltered={Object.values(filters).some((f) => f.length > 0)}
          />
        )}

        {/* Visualizations */}
        <div className="p-4">
          <VisualizationGrid
            timeHorizonData={
              comparisonMode
                ? {
                    primary: {
                      name: modelData.primary.name,
                      data: modelData.primary.timeHorizonData,
                    },
                    secondary: {
                      name: modelData.secondary.name,
                      data: modelData.secondary.timeHorizonData,
                    },
                  }
                : modelData.primary.timeHorizonData
            }
            generationData={modelData.primary.generationData}
            sizeData={modelData.primary.sizeData}
            errorThresholdData={modelData.primary.errorThresholdData}
            regionData={modelData.primary.regionData}
            instanceFamilyData={modelData.primary.instanceFamilyData}
            azErrorData={modelData.primary.azErrorData}
            instanceTimeSeriesData={modelData.primary.instanceTimeSeriesData}
            trendAccuracyData={modelData.primary.trendAccuracyData}
            metricsDistributionData={modelData.primary.metricsDistributionData}
            costEfficiencyData={modelData.primary.costEfficiencyData}
            comparisonMode={comparisonMode}
          />
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
