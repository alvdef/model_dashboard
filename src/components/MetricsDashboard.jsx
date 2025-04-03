import React, { useState, useEffect } from 'react';
// Remove Papa import since we're using JSON
import _ from 'lodash';
import { Card, CardContent } from "@/components/ui/card";
import FilterBar from './FilterBar';
import VisualizationGrid from './VisualizationGrid';

const SIZE_ORDER = {
  'nano': 1,
  'micro': 2,
  'small': 3,
  'medium': 4,
  'large': 5,
  'xlarge': 6,
  '2xlarge': 7,
  '3xlarge': 8,
  '4xlarge': 9,
  '6xlarge': 10,
  '8xlarge': 11,
  '9xlarge': 12,
  '10xlarge': 13,
  '12xlarge': 14,
  '16xlarge': 15,
  '18xlarge': 16,
  '24xlarge': 17,
  '32xlarge': 18,
  '48xlarge': 19,
  'metal': 20,
  'metal-16xl': 21,
  'metal-24xl': 22,
  'metal-32xl': 23,
  'metal-48xl': 24
};


const MetricsDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [overallMetrics, setOverallMetrics] = useState(null);
  const [timeHorizonData, setTimeHorizonData] = useState([]);
  const [generationData, setGenerationData] = useState([]);
  const [sizeData, setSizeData] = useState([]);
  const [errorThresholdData, setErrorThresholdData] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [instanceFamilyData, setInstanceFamilyData] = useState([]);
  const [azErrorData, setAzErrorData] = useState([]);
  const [instanceTimeSeriesData, setInstanceTimeSeriesData] = useState([]); // New state for instance time series
  const [trendAccuracyData, setTrendAccuracyData] = useState([]);
  const [costSavingsData, setCostSavingsData] = useState([]);
  const [metricsDistributionData, setMetricsDistributionData] = useState([]);
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
    instance_family: []
  });
  const [filterOptions, setFilterOptions] = useState({
    av_zones: [],
    instance_types: [],
    sizes: [],
    generations: [],
    modifiers: [],
    region: [],
    instance_family: []
  });

  const parseModifiers = (modifiers) => {
    // Modifiers are now an array, not a string
    if (!modifiers || !Array.isArray(modifiers)) return [];
    return modifiers;
  };

  const processTimeHorizonData = (data) => {
    let filteredData = data;
    // Apply filters only if they have values
    if (filters.av_zones.length > 0) {
      filteredData = filteredData.filter(d => d.av_zone && filters.av_zones.includes(d.av_zone));
    }
    if (filters.instance_types.length > 0) {
      filteredData = filteredData.filter(d => d.instance_type && filters.instance_types.includes(d.instance_type));
    }
    if (filters.sizes.length > 0) {
      filteredData = filteredData.filter(d => d.size && filters.sizes.includes(d.size));
    }
    if (filters.generations.length > 0) {
      filteredData = filteredData.filter(d => d.generation && filters.generations.includes(d.generation));
    }
    if (filters.modifiers.length > 0) {
      filteredData = filteredData.filter(d => {
        const instanceModifiers = parseModifiers(d.modifiers);
        return filters.modifiers.some(mod => instanceModifiers.includes(mod));
      });
    }

    return _.chain(filteredData)
      .groupBy('n_timestep')
      .map((group, timestep) => ({
        timestep: parseInt(timestep),
        rmse: _.meanBy(group, 'rmse') || 0,
        mape: _.meanBy(group, 'mape') || 0,
        smape: _.meanBy(group, 'smape') || 0,
        smape_cv: _.meanBy(group, 'smape_cv') || 0,
        sgnif_trend_acc: (_.meanBy(group, 'sgnif_trend_acc') || 0) * 100, // Convert to percentage
        cost_savings: _.meanBy(group, 'cost_savings') || 0
      }))
      .sortBy('timestep')
      .value();
  };

  const processGenerationData = (data) => {
    return _.chain(data)
      .groupBy('generation')
      .map((group, gen) => ({
        generation: gen || 'Unknown',
        count: group.length,
        mape: _.meanBy(group, 'mape') || 0,
        smape_cv: _.meanBy(group, 'smape_cv') || 0,
        sgnif_trend_acc: (_.meanBy(group, 'sgnif_trend_acc') || 0) * 100, // Convert to percentage
        cost_savings: _.meanBy(group, 'cost_savings') || 0
      }))
      .sortBy('generation')
      .value();
  };

  const processSizeData = (data) => {
    return _.chain(data)
      .groupBy('size')
      .map((group, size) => ({
        size: size || 'Unknown',
        count: group.length,
        mape: _.meanBy(group, 'mape') || 0,
        rmse: _.meanBy(group, 'rmse') || 0,
        direction_accuracy: (_.meanBy(group, 'direction_accuracy') || 0) * 100,
        smape: _.meanBy(group, 'smape') || 0,
        smape_cv: _.meanBy(group, 'smape_cv') || 0,
        order: SIZE_ORDER[size] || 999 // Add order property
      }))
      .sortBy('order') // Sort by the order instead of size
      .value();
  };

  const processErrorThresholds = (data) => {
    return _.chain(data)
      .groupBy('size')
      .map((instances, size) => {
        const total = instances.length;
        const distribution = {
          size,
          order: SIZE_ORDER[size] || 999
        };

        // Calculate percentages for each error range
        const mapeValues = instances.map(d => d.mape);
        
        distribution['Very Accurate (< 1%)'] = (mapeValues.filter(v => v <= 1).length / total) * 100;
        distribution['Good (1-5%)'] = (mapeValues.filter(v => v > 1 && v <= 5).length / total) * 100;
        distribution['Acceptable (5-10%)'] = (mapeValues.filter(v => v > 5 && v <= 10).length / total) * 100;
        distribution['Poor (10-20%)'] = (mapeValues.filter(v => v > 10 && v <= 20).length / total) * 100;
        distribution['Very Poor (20-50%)'] = (mapeValues.filter(v => v > 20 && v <= 50).length / total) * 100;
        distribution['Unreliable (50-100%)'] = (mapeValues.filter(v => v > 50 && v <= 100).length / total) * 100;
        distribution['Extreme Error (> 100%)'] = (mapeValues.filter(v => v > 100).length / total) * 100;

        return distribution;
      })
      .sortBy('order')
      .value();
  };

  const processCorrelationData = (data) => {
    const metrics = ['rmse', 'mape', 'smape', 'smape_cv', 'direction_accuracy'];
    const characteristics = ['size', 'generation'];
    
    // Convert categorical variables to numeric
    const processedData = data.map(d => ({
      ...d,
      size_order: SIZE_ORDER[d.size] || 999,
      generation: parseInt(d.generation)
    }));

    // Calculate correlations and format for visualization
    return metrics.flatMap(metric => {
      return characteristics.map(char => {
        const values = processedData.map(d => [d[metric], d[char === 'size' ? 'size_order' : char]]);
        const correlation = calculateCorrelation(values);
        return {
          metric,
          characteristic: char,
          correlation: correlation
        };
      });
    });
  };

  const calculateCorrelation = (pairs) => {
    const n = pairs.length;
    if (n === 0) return 0;

    const sumX = pairs.reduce((acc, [x]) => acc + x, 0);
    const sumY = pairs.reduce((acc, [, y]) => acc + y, 0);
    const sumXY = pairs.reduce((acc, [x, y]) => acc + x * y, 0);
    const sumX2 = pairs.reduce((acc, [x]) => acc + x * x, 0);
    const sumY2 = pairs.reduce((acc, [, y]) => acc + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const processRegionData = (data) => {
    return _.chain(data)
      .groupBy('region')
      .map((group, region) => ({
         region: region || 'Unknown',
         count: group.length,
         rmse: _.meanBy(group, 'rmse') || 0,
         mape: _.meanBy(group, 'mape') || 0,
         smape: _.meanBy(group, 'smape') || 0,
         sgnif_trend_acc: (_.meanBy(group, 'sgnif_trend_acc') || 0) * 100, // Convert to percentage
         cost_savings: _.meanBy(group, 'cost_savings') || 0
      }))
      .sortBy('region')
      .value();
  };

  const processInstanceFamilyData = (data) => {
    return _.chain(data)
      .groupBy('instance_family')
      .map((group, family) => ({
         instance_family: family || 'Unknown',
         count: group.length,
         rmse: _.meanBy(group, 'rmse') || 0,
         mape: _.meanBy(group, 'mape') || 0,
         smape: _.meanBy(group, 'smape') || 0,
         sgnif_trend_acc: (_.meanBy(group, 'sgnif_trend_acc') || 0) * 100, // Convert to percentage
         cost_savings: _.meanBy(group, 'cost_savings') || 0
      }))
      .sortBy('instance_family')
      .value();
  };

  const processAzErrorDistribution = (data) => {
    return _.chain(data)
      .groupBy('av_zone')
      .map((instances, zone) => {
        const total = instances.length;
        const distribution = {
          av_zone: zone
        };

        // Calculate percentages for each error range
        const mapeValues = instances.map(d => d.mape);
        
        distribution['Very Accurate (< 1%)'] = (mapeValues.filter(v => v <= 1).length / total) * 100;
        distribution['Good (1-5%)'] = (mapeValues.filter(v => v > 1 && v <= 5).length / total) * 100;
        distribution['Acceptable (5-10%)'] = (mapeValues.filter(v => v > 5 && v <= 10).length / total) * 100;
        distribution['Poor (10-20%)'] = (mapeValues.filter(v => v > 10 && v <= 20).length / total) * 100;
        distribution['Very Poor (20-50%)'] = (mapeValues.filter(v => v > 20 && v <= 50).length / total) * 100;
        distribution['Unreliable (50-100%)'] = (mapeValues.filter(v => v > 50 && v <= 100).length / total) * 100;
        distribution['Extreme Error (> 100%)'] = (mapeValues.filter(v => v > 100).length / total) * 100;

        return distribution;
      })
      .sortBy('av_zone')
      .value();
  };

  // New function to process instance time series data by instance type
  const processInstanceTimeSeriesData = (data) => {
    // Group data by instance_type and then by time step
    const instanceTypesData = {};
    
    data.forEach(entry => {
      const instanceType = entry.instance_type;
      const timeStep = entry.n_timestep;
      const mape = entry.mape;
      
      if (!instanceType) return;
      
      if (!instanceTypesData[instanceType]) {
        instanceTypesData[instanceType] = {
          instance_type: instanceType,
          timeSteps: {}
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
    
    Object.values(instanceTypesData).forEach(typeData => {
      Object.entries(typeData.timeSteps).forEach(([timeStep, mapeValues]) => {
        // Calculate average MAPE for this instance type and time step
        const avgMape = mapeValues.reduce((sum, val) => sum + val, 0) / mapeValues.length;
        
        heatmapData.push({
          instance_type: typeData.instance_type,
          time_step: parseInt(timeStep),
          mape: avgMape,
          count: mapeValues.length // Include count of instances for reference
        });
      });
    });
    
    return heatmapData;
  };

  // Process trend accuracy data by instance family
  const processTrendAccuracyData = (data) => {
    return _.chain(data)
      // Group by instance family
      .groupBy('instance_family')
      .map((group, family) => ({
        instance_family: family || 'Unknown',
        count: group.length,
        avg_trend_accuracy: _.meanBy(group, 'sgnif_trend_acc') * 100 || 0,
        avg_cost_savings: _.meanBy(group, 'cost_savings') || 0
      }))
      .sortBy('instance_family')
      .value();
  };

  // Process metrics distribution data
  const processMetricsDistributionData = (data) => {
    // Create unique entries by instance_id to avoid duplicates
    const uniqueInstances = _.uniqBy(data, 'instance_id');
    
    // Continuous distribution data
    const trendValues = [];
    const savingsValues = [];
    
    // Collect values for continuous distribution
    uniqueInstances.forEach(instance => {
      const trendAcc = instance.sgnif_trend_acc * 100;
      const savings = instance.cost_savings;
      
      // Collect values for continuous distribution
      if (!isNaN(trendAcc)) trendValues.push(trendAcc);
      if (!isNaN(savings)) savingsValues.push(savings);
    });
    
    // Calculate min/max values for proper domain rendering
    const minMaxValues = {
      trendMin: Math.floor(Math.min(...trendValues)) || 0,
      trendMax: Math.ceil(Math.max(...trendValues)) || 100,
      savingsMin: Math.floor(Math.min(...savingsValues)) || -15,
      savingsMax: Math.ceil(Math.max(...savingsValues)) || 25
    };
    
    // Create continuous distribution data with dynamic range
    const continuousDistribution = {
      trend: createContinuousDistribution(
        trendValues, 
        minMaxValues.trendMin, 
        minMaxValues.trendMax, 
        50
      ),
      savings: createContinuousDistribution(
        savingsValues, 
        minMaxValues.savingsMin, 
        minMaxValues.savingsMax, 
        120
      )
    };
    
    // Return just the continuous data and min/max values for domain rendering
    return {
      continuous: continuousDistribution,
      minMaxValues: minMaxValues
    };
  };
  
  // Helper function to create continuous distribution data
  const createContinuousDistribution = (values, min, max, numBins) => {
    if (!values.length) return [];
    
    // Create bins
    const binWidth = (max - min) / numBins;
    const bins = Array(numBins).fill(0);
    
    // Count values in each bin
    values.forEach(value => {
      if (value < min) value = min;
      if (value > max) value = max;
      
      const binIndex = Math.floor((value - min) / binWidth);
      // Ensure index is within bounds
      if (binIndex >= 0 && binIndex < numBins) {
        bins[binIndex]++;
      }
    });
    
    // Convert counts to percentages and create data points
    const totalCount = values.length;
    return bins.map((count, i) => {
      const binStart = min + (i * binWidth);
      return {
        value: binStart + (binWidth / 2), // Use midpoint of bin as x-value
        count: count,
        percentage: (count / totalCount) * 100,
      };
    });
  };

  // New file upload handler for JSON
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null); // Reset error state
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonText = event.target.result;
        const parsedData = JSON.parse(jsonText);
        
        // Store overall metrics
        setOverallMetrics(parsedData.overall_metrics);
        
        // Transform the nested instances structure to a flat array for processing
        const flattenedData = [];
        
        Object.entries(parsedData.instances).forEach(([instanceId, instanceData]) => {
          const { metadata, metrics } = instanceData;
          
          // For each metrics entry, create a flattened record
          metrics.forEach(metric => {
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
              rmse: metric.rmse,
              sgnif_trend_acc: metric.sgnif_trend_acc,
              cost_savings: metric.cost_savings
            });
          });
        });
        
        setRawData(flattenedData);
        
        // Extract unique values for filters
        const allModifiers = _.uniq(
          flattenedData.flatMap(d => d.modifiers || [])
        ).sort();
        
        setFilterOptions({
          av_zones: _.uniq(flattenedData.map(d => d.av_zone)).sort(),
          instance_types: _.uniq(flattenedData.map(d => d.instance_type)).sort((a, b) => {
            const aPrefix = a.split('.')[0];
            const bPrefix = b.split('.')[0];
            const aSuffix = a.substring(aPrefix.length + 1);
            const bSuffix = b.substring(bPrefix.length + 1);
            const aOrder = SIZE_ORDER[aSuffix] || 999;
            const bOrder = SIZE_ORDER[bSuffix] || 999;

            if (aPrefix === bPrefix) {
              return aOrder - bOrder;
            }
            return aPrefix.localeCompare(bPrefix);
          }),
          sizes: _.uniq(flattenedData.map(d => d.size)).sort((a, b) => (SIZE_ORDER[a] || 999) - (SIZE_ORDER[b] || 999)),
          time_horizons: _.uniq(flattenedData.map(d => d.n_timestep)).sort((a, b) => a - b),
          generations: _.uniq(flattenedData.map(d => d.generation)).sort(),
          modifiers: allModifiers,
          region: _.uniq(flattenedData.map(d => d.region)).sort(),
          instance_family: _.uniq(flattenedData.map(d => d.instance_family)).sort()
        });
        
        // Process data for visualizations
        setTimeHorizonData(processTimeHorizonData(flattenedData));
        setGenerationData(processGenerationData(flattenedData));
        setSizeData(processSizeData(flattenedData));
        setErrorThresholdData(processErrorThresholds(flattenedData));
        setCorrelationData(processCorrelationData(flattenedData));
        setRegionData(processRegionData(flattenedData));
        setInstanceFamilyData(processInstanceFamilyData(flattenedData));
        setAzErrorData(processAzErrorDistribution(flattenedData));
        setInstanceTimeSeriesData(processInstanceTimeSeriesData(flattenedData));
        setTrendAccuracyData(processTrendAccuracyData(flattenedData));
        setMetricsDistributionData(processMetricsDistributionData(flattenedData));
        setLoading(false);
      } catch (err) {
        console.error("Error processing JSON:", err);
        setError('Error processing the JSON file. Please check the file format.');
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (rawData.length > 0) {
      let filteredData = rawData;
      
      // Apply all filters
      if (filters.av_zones.length > 0) {
        filteredData = filteredData.filter(d => d.av_zone && filters.av_zones.includes(d.av_zone));
      }
      if (filters.instance_types.length > 0) {
        filteredData = filteredData.filter(d => d.instance_type && filters.instance_types.includes(d.instance_type));
      }
      if (filters.sizes.length > 0) {
        filteredData = filteredData.filter(d => d.size && filters.sizes.includes(d.size));
      }
      if (filters.time_horizons.length > 0) {
        filteredData = filteredData.filter(d => filters.time_horizons.includes(d.n_timestep));
      }
      if (filters.generations.length > 0) {
        filteredData = filteredData.filter(d => d.generation !== undefined && filters.generations.includes(d.generation));
      }
      if (filters.modifiers.length > 0) {
        filteredData = filteredData.filter(d => {
          const instanceModifiers = d.modifiers || [];
          return filters.modifiers.some(mod => instanceModifiers.includes(mod));
        });
      }
      if (filters.region.length > 0) {
        filteredData = filteredData.filter(d => d.region && filters.region.includes(d.region));
      }
      if (filters.instance_family.length > 0) {
        filteredData = filteredData.filter(d => d.instance_family && filters.instance_family.includes(d.instance_family));
      }
      
      // Update all datasets with the filtered data
      setTimeHorizonData(processTimeHorizonData(filteredData));
      setGenerationData(processGenerationData(filteredData));
      setSizeData(processSizeData(filteredData));
      setErrorThresholdData(processErrorThresholds(filteredData));
      setCorrelationData(processCorrelationData(filteredData));
      setRegionData(processRegionData(filteredData));
      setInstanceFamilyData(processInstanceFamilyData(filteredData));
      setAzErrorData(processAzErrorDistribution(filteredData));
      setInstanceTimeSeriesData(processInstanceTimeSeriesData(filteredData));
      setTrendAccuracyData(processTrendAccuracyData(filteredData));
      setMetricsDistributionData(processMetricsDistributionData(filteredData));
    }
  }, [filters, rawData]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Model Metrics Dashboard</h2>
            <p className="mb-4">Upload a JSON file containing model metrics data to begin analysis.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Upload JSON Metrics File</label>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload} 
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
      {/* Fixed Filter Bar */}
      <div className="flex-shrink-0 z-10 sticky top-0 bg-white">
        <FilterBar 
          filterOptions={filterOptions} 
          filters={filters} 
          handleFilterChange={handleFilterChange} 
        />
      </div>
      
      {/* Scrollable Visualization Area */}
      <div className="flex-grow overflow-y-auto p-4">
        <VisualizationGrid
          timeHorizonData={timeHorizonData}
          generationData={generationData}
          sizeData={sizeData}
          errorThresholdData={errorThresholdData}
          regionData={regionData}
          instanceFamilyData={instanceFamilyData}
          azErrorData={azErrorData}
          instanceTimeSeriesData={instanceTimeSeriesData} // Pass the new data
          trendAccuracyData={trendAccuracyData}
          metricsDistributionData={metricsDistributionData}
        />
        
        {/* File Upload option at the bottom */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-1">Upload New JSON Metrics File</label>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload} 
              className="border rounded p-2"
            />
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsDashboard;