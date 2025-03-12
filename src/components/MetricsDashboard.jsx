import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
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

const METRIC_COLOUR = {
  'rmse': '#8884d8',
  'mape': '#82ca9d',
  'smape': '#ffc658',
  'direction_accuracy': '#ff7300',
  'smape_cv': '#ff69b4',
}

const ERROR_CATEGORIES = [
  { range: '< 1%', label: 'Very Accurate (< 1%)', color: '#22c55e' },
  { range: '1-5%', label: 'Good (1-5%)', color: '#84cc16' },
  { range: '5-10%', label: 'Acceptable (5-10%)', color: '#eab308' },
  { range: '10-20%', label: 'Poor (10-20%)', color: '#f97316' },
  { range: '20-50%', label: 'Very Poor (20-50%)', color: '#ef4444' },
  { range: '50-100%', label: 'Unreliable (50-100%)', color: '#dc2626' },
  { range: '> 100%', label: 'Extreme Error (> 100%)', color: '#991b1b' }
];

const MetricsDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [timeHorizonData, setTimeHorizonData] = useState([]);
  const [generationData, setGenerationData] = useState([]);
  const [sizeData, setSizeData] = useState([]);
  const [errorThresholdData, setErrorThresholdData] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [instanceFamilyData, setInstanceFamilyData] = useState([]);
  const [azErrorData, setAzErrorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
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

  const parseModifiers = (modifiersStr) => {
    if (!modifiersStr) return [];
    try {
      // Remove quotes, brackets and spaces, then split into individual chars
      return modifiersStr.replace(/[\[\]'" ]/g, '').split(',').filter(m => m);
    } catch (e) {
      console.error('Error parsing modifiers:', e);
      return [];
    }
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
        direction_accuracy: (_.meanBy(group, 'direction_accuracy') || 0) * 100,
        count: group.length
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
        rmse: _.meanBy(group, 'rmse') || 0,
        smape_cv: _.meanBy(group, 'smape_cv') || 0,
        direction_accuracy: (_.meanBy(group, 'direction_accuracy') || 0) * 100
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
         direction_accuracy: (_.meanBy(group, 'direction_accuracy') || 0) * 100
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
         direction_accuracy: (_.meanBy(group, 'direction_accuracy') || 0) * 100
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

  // New file upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null); // Reset error state
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        const trimmedData = parsed.data.map(d => {
          for (const key in d) {
            if (typeof d[key] === 'string') {
              d[key] = d[key].trim();
            }
          }
          return d;
        });
        setRawData(trimmedData);
        // Update related filter options and processed datasets after upload
        // ...existing code to extract filter options and process data...
        const allModifiers = _.uniq(
          trimmedData.flatMap(d => {
            // ...existing parseModifiers function...
            return d.modifiers ? d.modifiers.replace(/[\[\]'" ]/g, '').split(',').filter(m => m) : [];
          })
        ).sort();
        setFilterOptions({
          av_zones: _.uniq(trimmedData.map(d => d.av_zone)).sort(),
          instance_types: _.uniq(trimmedData.map(d => d.instance_type)).sort((a, b) => {
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
          sizes: _.uniq(trimmedData.map(d => d.size)).sort((a, b) => (SIZE_ORDER[a] || 999) - (SIZE_ORDER[b] || 999)),
          time_horizons: _.uniq(trimmedData.map(d => d.n_timestep)).sort((a, b) => a - b),
          generations: _.uniq(trimmedData.map(d => d.generation)).sort(),
          modifiers: allModifiers,
          region: _.uniq(trimmedData.map(d => d.region)).sort(),                   // new extraction
          instance_family: _.uniq(trimmedData.map(d => d.instance_family)).sort()  // new extraction
        });
        setTimeHorizonData(processTimeHorizonData(trimmedData));
        setGenerationData(processGenerationData(trimmedData));
        setSizeData(processSizeData(trimmedData));
        setErrorThresholdData(processErrorThresholds(trimmedData));
        setCorrelationData(processCorrelationData(trimmedData));
        setRegionData(processRegionData(trimmedData));                      // new
        setInstanceFamilyData(processInstanceFamilyData(trimmedData));      // new
        setAzErrorData(processAzErrorDistribution(trimmedData));            // new
        setLoading(false);
      } catch (err) {
        setError('Error processing the CSV file. Please check the file format.');
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Remove or disable the useEffect that fetches the CSV from the server
  // ...existing code commented out or removed...
  
  useEffect(() => {
    if (rawData.length > 0) {
      let filteredData = rawData;
      
      // Apply all filters except time_horizons to base data
      if (filters.av_zones.length > 0) {
        filteredData = filteredData.filter(d => d.av_zone && filters.av_zones.includes(d.av_zone));
      }
      if (filters.instance_types.length > 0) {
        filteredData = filteredData.filter(d => d.instance_type && filters.instance_types.includes(d.instance_type));
      }
      if (filters.sizes.length > 0) {
        filteredData = filteredData.filter(d => d.size && filters.sizes.includes(d.size));
      }
      // Added time horizons filtering (cast n_timestep to number)
      if (filters.time_horizons.length > 0) {
        filteredData = filteredData.filter(d => filters.time_horizons.includes(parseInt(d.n_timestep)));
      }
      // Updated generation filtering now compares numbers
      if (filters.generations.length > 0) {
        filteredData = filteredData.filter(d => d.generation !== undefined && filters.generations.includes(parseInt(d.generation)));
      }
      if (filters.modifiers.length > 0) {
        filteredData = filteredData.filter(d => {
          const instanceModifiers = parseModifiers(d.modifiers);
          return filters.modifiers.some(mod => instanceModifiers.includes(mod));
        });
      }
      if (filters.region.length > 0) {   // new region filtering
        filteredData = filteredData.filter(d => d.region && filters.region.includes(d.region));
      }
      if (filters.instance_family.length > 0) {   // new instance family filtering
        filteredData = filteredData.filter(d => d.instance_family && filters.instance_family.includes(d.instance_family));
      }

      // Update all datasets with the filtered data
      setTimeHorizonData(processTimeHorizonData(filteredData));
      setGenerationData(processGenerationData(filteredData));
      setSizeData(processSizeData(filteredData));
      setErrorThresholdData(processErrorThresholds(filteredData));
      setCorrelationData(processCorrelationData(filteredData));
      setRegionData(processRegionData(filteredData));                    // new
      setInstanceFamilyData(processInstanceFamilyData(filteredData));    // new
      setAzErrorData(processAzErrorDistribution(filteredData));          // new
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
            <p className="mb-4">Upload a CSV file containing model metrics data to begin analysis.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Upload CSV Metrics File</label>
              <input 
                type="file" 
                accept=".csv" 
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
        />
        
        {/* File Upload option at the bottom */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-1">Upload New CSV Metrics File</label>
            <input 
              type="file" 
              accept=".csv" 
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