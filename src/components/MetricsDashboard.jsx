import React, { useState, useEffect } from "react";
import _ from "lodash";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FilterBar from "./FilterBar";
import VisualizationGrid from "./VisualizationGrid";
import AllModelsComparison from "./AllModelsComparison";
import ModelConfigComparison from "./ModelConfigComparison";

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
      config: null, // Add config field to store the configuration
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
      config: null, // Add config field to store the configuration
    },
  });

  const [models, setModels] = useState([]); // track all uploaded models
  const [selectedPrimary, setSelectedPrimary] = useState("");
  const [selectedSecondary, setSelectedSecondary] = useState("");

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

  // Update the models array to be automatically sorted by name
  useEffect(() => {
    setModels((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
  }, [models.length]); // Only re-sort when a new model is added or removed

  // Data processing functions - simplified
  const processTimeHorizonData = (data) => {
    let filteredData = applyFilters(data);
    console.log('Processing time horizon data', { 
      totalDataPoints: filteredData.length,
      uniqueInstances: _.uniqBy(filteredData, 'instance_id').length,
      timestepRange: _.uniq(filteredData.map(d => d.n_timestep)).sort()
    });

    // Group by timestep
    const timeHorizonData = _.chain(filteredData)
      .groupBy("n_timestep")
      .map((group, timestep) => {
        // Count instances in this group
        const instanceCount = group.length;
        
        // Calculate weighted metrics properly
        // For MAPE, we compute the absolute percentage error for each prediction
        // We use the mean directly since MAPE is already normalized as a percentage
        const mape = _.meanBy(group, "mape") || 0;
        const mse = _.meanBy(group, "mse") || 0;
        const trendAcc = _.meanBy(group, "sgnif_trend_acc") || 0;
        const costSavings = _.meanBy(group, "cost_savings") || 0;
        
        console.log(`Timestep ${timestep}: ${instanceCount} instances, MAPE = ${mape.toFixed(2)}`);
        
        return {
          timestep: parseInt(timestep),
          count: instanceCount,
          mape: mape,
          mse: mse,
          sgnif_trend_acc: trendAcc,
          cost_savings: costSavings,
        };
      })
      .sortBy("timestep")
      .value();

    return timeHorizonData;
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
          (mapeValues.filter((v) => v > 50).length / total) * 100;
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
        const avgEfficiency = _.meanBy(group, "savings_efficiency") || 0;

        return {
          size: size || "Unknown", // Changed from 'instance_family' to 'size'
          count: group.length,
          cost_savings: avgCostSavings,
          perfect_savings: avgPerfectSavings,
          savings_efficiency: avgEfficiency, // Use the calculated mean directly
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

  // File upload handler: support multiple files and skip duplicates
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
    setError(null);

    files.forEach((file) => {
      // Skip if this file was already uploaded
      if (models.some((m) => m.fileName === file.name)) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          // Pre-process the JSON string to handle Infinity and NaN values
          const jsonString = event.target.result;
          // Replace "Infinity" and "NaN" with null to allow valid JSON parsing
          const sanitizedJson = jsonString
            .replace(/"(mse|mape|sgnif_trend_acc|cost_savings|perfect_savings|savings_efficiency)": *Infinity/g, '"$1": null')
            .replace(/"(mse|mape|sgnif_trend_acc|cost_savings|perfect_savings|savings_efficiency)": *NaN/g, '"$1": null');
            
          const parsedData = JSON.parse(sanitizedJson);
          const modelName =
            parsedData.config?.model_name || `Model ${models.length + 1}`;
          const configData = parsedData.config || {};
          const flattenedData = [];
          
          // Process instance data and filter out instances with invalid metrics
          Object.entries(parsedData.instances).forEach(
            ([instanceId, instanceData]) => {
              const { metadata, metrics } = instanceData;
              // Filter out metrics with Infinity or NaN values
              metrics.forEach((metric) => {
                // Skip metrics with any invalid values
                if (
                  metric.mape === null || 
                  metric.mse === null || 
                  metric.sgnif_trend_acc === null ||
                  metric.cost_savings === null
                ) {
                  return; // Skip this metric
                }
                
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
            }
          );
          
          // Add to models list with fileName
          setModels((prev) => [
            ...prev,
            { name: modelName, data: flattenedData, config: configData, fileName: file.name },
          ]);

          // Set initial selections and update modelData
          if (!selectedPrimary) {
            setSelectedPrimary(modelName);
            // update primary model data and filter options
            setModelData((prev) => ({
              ...prev,
              primary: {
                ...prev.primary,
                name: modelName,
                config: configData,
                rawData: flattenedData,
                overallMetrics: parsedData.overall_metrics,
                timeHorizonData: processTimeHorizonData(flattenedData),
                generationData: processGenerationData(flattenedData),
                sizeData: processSizeData(flattenedData),
                errorThresholdData: processErrorThresholds(flattenedData),
                regionData: processRegionData(flattenedData),
                instanceFamilyData: processInstanceFamilyData(flattenedData),
                azErrorData: processAzErrorDistribution(flattenedData),
                instanceTimeSeriesData: processInstanceTimeSeriesData(flattenedData),
                trendAccuracyData: processTrendAccuracyData(flattenedData),
                metricsDistributionData: processMetricsDistributionData(flattenedData),
                costEfficiencyData: processCostEfficiencyData(flattenedData),
              },
            }));
            updateFilterOptions(flattenedData);
          } else if (!selectedSecondary) {
            setSelectedSecondary(modelName);
            // update secondary model data
            setModelData((prev) => ({
              ...prev,
              secondary: {
                ...prev.secondary,
                name: modelName,
                config: configData,
                rawData: flattenedData,
                overallMetrics: parsedData.overall_metrics,
                timeHorizonData: processTimeHorizonData(flattenedData),
                generationData: processGenerationData(flattenedData),
                sizeData: processSizeData(flattenedData),
                errorThresholdData: processErrorThresholds(flattenedData),
                regionData: processRegionData(flattenedData),
                instanceFamilyData: processInstanceFamilyData(flattenedData),
                azErrorData: processAzErrorDistribution(flattenedData),
                instanceTimeSeriesData: processInstanceTimeSeriesData(flattenedData),
                trendAccuracyData: processTrendAccuracyData(flattenedData),
                metricsDistributionData: processMetricsDistributionData(flattenedData),
                costEfficiencyData: processCostEfficiencyData(flattenedData),
              },
            }));
            // enable comparison when both models are loaded
            setComparisonMode(true);
          }
        } catch (err) {
          console.error(`Error processing model JSON:`, err);
          setError(`Error processing the JSON file. Please check the file format.`);
        }
        setLoading(false);
      };
      reader.readAsText(file);
    });
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

    console.log('Calculating overall metrics', { 
      totalDataPoints: data.length,
      uniqueInstances: _.uniqBy(data, 'instance_id').length,
      uniqueTimesteps: _.uniq(data.map(d => d.n_timestep)).sort()
    });

    // First approach: Calculate metrics per timestep then average across timesteps
    // This matches the visualization in the time horizon chart
    const byTimestep = _.chain(data)
      .groupBy("n_timestep")
      .map(group => ({
        timestep: _.get(group, '[0].n_timestep'),
        count: group.length,
        mape: _.meanBy(group, "mape"),
        mse: _.meanBy(group, "mse"),
        sgnif_trend_acc: _.meanBy(group, "sgnif_trend_acc"),
        cost_savings: _.meanBy(group, "cost_savings"),
        perfect_savings: _.meanBy(group, "perfect_savings"),
        savings_efficiency: _.meanBy(group, "savings_efficiency")
      }))
      .value();
    
    // Calculate overall averages across timesteps (weighted by count)
    const totalCount = _.sumBy(byTimestep, 'count');
    const timestepWeightedMetrics = {
      avg_mape: _.sumBy(byTimestep, t => t.mape * t.count) / totalCount,
      avg_mse: _.sumBy(byTimestep, t => t.mse * t.count) / totalCount,
      avg_sgnif_trend_acc: _.sumBy(byTimestep, t => t.sgnif_trend_acc * t.count) / totalCount,
      avg_cost_savings: _.sumBy(byTimestep, t => t.cost_savings * t.count) / totalCount,
      avg_perfect_savings: _.sumBy(byTimestep, t => t.perfect_savings * t.count) / totalCount,
      avg_savings_efficiency: _.sumBy(byTimestep, t => t.savings_efficiency * t.count) / totalCount
    };

    // Second approach: Calculate metrics across all instances (traditional way)
    // Group by instance_id to get unique instances
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

    // Calculate overall metrics for all instances (traditional way)
    const instanceMetrics = {};
    
    // Helper function to calculate metrics for an array of values
    const calculateMetricsForValues = (values, metricName) => {
      if (values.length > 0) {
        instanceMetrics[`instance_avg_${metricName}`] = _.mean(values);
        instanceMetrics[`std_${metricName}`] = calculateStandardDeviation(values);
        instanceMetrics[`min_${metricName}`] = _.min(values);
        instanceMetrics[`max_${metricName}`] = _.max(values);
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
    instanceMetrics.total_instances = Object.keys(instanceGroups).length;
    instanceMetrics.total_data_points = data.length;

    // Log comparison between the two calculation methods
    console.log('Metrics calculation comparison:', {
      timestepWeighted: {
        avg_mape: timestepWeightedMetrics.avg_mape,
        avg_mse: timestepWeightedMetrics.avg_mse,
      },
      instanceBased: {
        avg_mape: instanceMetrics.instance_avg_mape,
        avg_mse: instanceMetrics.instance_avg_mse,
      }
    });

    // Use the timestep-weighted metrics as the primary metrics (matches chart view)
    const metrics = {
      ...timestepWeightedMetrics,
      std_mape: instanceMetrics.std_mape,
      min_mape: instanceMetrics.min_mape,
      max_mape: instanceMetrics.max_mape,
      std_mse: instanceMetrics.std_mse,
      total_instances: instanceMetrics.total_instances,
      total_data_points: instanceMetrics.total_data_points
    };

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
        config: null, // Reset config as well
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

  // Handler when selecting primary model
  const handlePrimaryChange = (value) => {
    setSelectedPrimary(value);
    const model = models.find((m) => m.name === value);
    if (model) {
      setModelData((prev) => ({
        ...prev,
        primary: {
          ...prev.primary,
          rawData: model.data,
          name: model.name,
          config: model.config,
        },
      }));
    }
  };

  // Handler when selecting secondary model
  const handleSecondaryChange = (value) => {
    setSelectedSecondary(value);
    if (value === "none") {
      // Clear secondary model data
      setModelData((prev) => ({
        ...prev,
        secondary: {
          ...prev.secondary,
          rawData: [],
          name: null,
          config: null,
        },
      }));
      setComparisonMode(false);
    } else {
      const model = models.find((m) => m.name === value);
      if (model) {
        setModelData((prev) => ({
          ...prev,
          secondary: {
            ...prev.secondary,
            rawData: model.data,
            name: model.name,
            config: model.config,
          },
        }));
        // Enable comparison if primary also exists
        if (modelData.primary.rawData.length > 0) {
          setComparisonMode(true);
        }
      }
    }
  };

  // Build list of all models with filtered metrics
  const allModelsList = models
    .map((m) => ({
      name: m.name,
      metrics: calculateOverallMetrics(applyFilters(m.data)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Show upload screen when no models uploaded
  if (models.length === 0) {
    return (
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Model Metrics Dashboard</h2>
            <p className="mb-4">
              Upload one or more JSON files containing model metrics data to begin analysis.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">
                Upload Model JSON Files
              </label>
              <Button
                variant="outline"
                className="w-full relative py-2"
                onClick={() => document.getElementById('initial-upload').click()}
              >
                <div className="flex items-center justify-center">
                  <span className="mr-2">Choose Files</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 1.5L7.5 11.5M7.5 1.5L3.5 5.5M7.5 1.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.5 13.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Button>
              <input
                id="initial-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
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
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col mb-2">
                  <h3 className="font-medium mb-2">Upload Model JSON Files</h3>
                  <Button 
                    variant="outline" 
                    className="relative cursor-pointer py-2"
                    onClick={() => document.getElementById('model-upload').click()}
                  >
                    <div className="flex items-center justify-center">
                      <span className="mr-2">Choose Files</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 1.5L7.5 11.5M7.5 1.5L3.5 5.5M7.5 1.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.5 13.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </Button>
                  <input
                    id="model-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Selectors for primary and secondary */}
          {models.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Model</label>
                <Select value={selectedPrimary} onValueChange={handlePrimaryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select primary model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secondary Model</label>
                <Select value={selectedSecondary} onValueChange={handleSecondaryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select secondary model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {models.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* All-models comparison table */}
        {allModelsList.length > 0 && (
          <div className="p-4">
            <AllModelsComparison
              models={allModelsList}
              selectedPrimary={selectedPrimary}
              selectedSecondary={selectedSecondary}
            />
          </div>
        )}

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
          
        {/* Model Configuration Comparison */}
        {comparisonMode && modelData.primary.config && modelData.secondary.config && (
          <div className="p-4">
            <ModelConfigComparison 
              primaryConfig={modelData.primary.config}
              secondaryConfig={modelData.secondary.config}
              primaryName={modelData.primary.name}
              secondaryName={modelData.secondary.name}
            />
          </div>
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
            errorThresholdDataSecondary={modelData.secondary.errorThresholdData}
            regionData={modelData.primary.regionData}
            instanceFamilyData={modelData.primary.instanceFamilyData}
            azErrorData={modelData.primary.azErrorData}
            instanceTimeSeriesData={modelData.primary.instanceTimeSeriesData}
            trendAccuracyData={modelData.primary.trendAccuracyData}
            metricsDistributionData={modelData.primary.metricsDistributionData}
            costEfficiencyData={modelData.primary.costEfficiencyData}
            comparisonMode={comparisonMode}
            primaryName={modelData.primary.name}
            secondaryName={modelData.secondary.name}
          />
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
