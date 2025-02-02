import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Treemap } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa from 'papaparse';
import _ from 'lodash';

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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    av_zones: [],
    instance_types: [],
    sizes: [],
    time_horizons: [],
    generations: [],    // new
    modifiers: []       // new
  });
  const [filterOptions, setFilterOptions] = useState({
    av_zones: [],
    instance_types: [],
    sizes: [],
    generations: [],    // new
    modifiers: []       // new
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

  // New file upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
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
        instance_types: _.uniq(trimmedData.map(d => d.instance_type)).sort(),
        sizes: _.uniq(trimmedData.map(d => d.size)).sort(),
        time_horizons: _.uniq(trimmedData.map(d => d.n_timestep)).sort((a, b) => a - b),
        generations: _.uniq(trimmedData.map(d => d.generation)).sort(),
        modifiers: allModifiers
      });
      setTimeHorizonData(processTimeHorizonData(trimmedData));
      setGenerationData(processGenerationData(trimmedData));
      setSizeData(processSizeData(trimmedData));
      setErrorThresholdData(processErrorThresholds(trimmedData));
      setCorrelationData(processCorrelationData(trimmedData));
      setLoading(false);
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

      // Update all datasets with the filtered data
      setTimeHorizonData(processTimeHorizonData(filteredData));
      setGenerationData(processGenerationData(filteredData));
      setSizeData(processSizeData(filteredData));
      setErrorThresholdData(processErrorThresholds(filteredData));
      setCorrelationData(processCorrelationData(filteredData));
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
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Upload CSV Metrics File</label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          className="border rounded p-2"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <Card>
      <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Time Horizons</label>
              <select 
                className="border rounded p-1 min-w-48"
                multiple
                size={4}
                value={filters.time_horizons}
                onChange={(e) => handleFilterChange('time_horizons',
                  Array.from(e.target.selectedOptions, option => parseInt(option.value))
                )}
              >
                {filterOptions.time_horizons.map(horizon => (
                  <option key={horizon} value={horizon}>t+{horizon}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Availability Zones</label>
              <select 
                className="border rounded p-1 min-w-48"
                multiple
                size={4}
                value={filters.av_zones}
                onChange={(e) => handleFilterChange('av_zones', 
                  Array.from(e.target.selectedOptions, option => option.value)
                )}
              >
                {filterOptions.av_zones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Instance Types</label>
              <select 
                className="border rounded p-1 min-w-48"
                multiple
                size={4}
                value={filters.instance_types}
                onChange={(e) => handleFilterChange('instance_types',
                  Array.from(e.target.selectedOptions, option => option.value)
                )}
              >
                {filterOptions.instance_types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Sizes</label>
              <select 
                className="border rounded p-1 min-w-48"
                multiple
                size={4}
                value={filters.sizes}
                onChange={(e) => handleFilterChange('sizes',
                  Array.from(e.target.selectedOptions, option => option.value)
                )}
              >
                {filterOptions.sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Generation</label>
              <select 
                className="border rounded p-1 min-w-48"
                multiple
                size={4}
                value={filters.generations}
                onChange={(e) => handleFilterChange('generations',
                  Array.from(e.target.selectedOptions, option => parseInt(option.value))
                )}
              >
                {filterOptions.generations.map(gen => (
                  <option key={gen} value={gen}>{gen}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Modifiers</label>
              <select 
                className="border rounded p-1 min-w-48"
                multiple
                size={4}
                value={filters.modifiers}
                onChange={(e) => handleFilterChange('modifiers',
                  Array.from(e.target.selectedOptions, option => option.value)
                )}
              >
                {filterOptions.modifiers.map(mod => (
                  <option key={mod} value={mod}>
                    {mod === 'g' ? 'Graviton' :
                    mod === 'i' ? 'Intel' :
                    mod === 'a' ? 'AMD' :
                    mod === 'd' ? 'NVMe' :
                    mod === 'n' ? 'Network' :
                    mod}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Hold Ctrl/Cmd to select multiple options. Clear all selections to show all data.
          </div>
        </CardContent>
      </Card>
      
      <Card>
      <CardContent>
        <CardHeader>
          <CardTitle>Time Horizon Performance Degradation</CardTitle>
        </CardHeader>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={timeHorizonData} 
                margin={{ top: 20, right: 60, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestep" 
                  // label={{ value: 'Time Horizon (steps)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  yAxisId="left" 
                  label={{ value: 'Error Metrics', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  label={{ value: 'Standard deviation', angle: 90, position: 'insideRight', offset: 10 }}
                />
                <Tooltip />
                <Legend />
                {/* <Line yAxisId="left" type="monotone" dataKey="rmse" stroke={METRIC_COLOUR['rmse']} name="RMSE" /> */}
                <Line yAxisId="right" type="monotone" dataKey="smape_cv" stroke={METRIC_COLOUR['smape_cv']} name="STD" />
                <Line yAxisId="left" type="monotone" dataKey="mape" stroke={METRIC_COLOUR['mape']} name="MAPE" />
                <Line yAxisId="left" type="monotone" dataKey="smape" stroke={METRIC_COLOUR['smape']} name="SMAPE" />
                {/* <Line yAxisId="right" type="monotone" dataKey="direction_accuracy" stroke="#ff7300" name="Direction Accuracy" /> */}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Instance Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={generationData}
                margin={{ top: 20, right: 60, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="generation" />
                <YAxis 
                  yAxisId="left" 
                  label={{ value: 'RMSE', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  label={{ value: 'Direction Accuracy (%)', angle: 90, position: 'insideRight', offset: 10 }}
                />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="rmse" fill={METRIC_COLOUR['rmse']} name="RMSE" />
                <Bar yAxisId="right" dataKey="direction_accuracy" fill={METRIC_COLOUR['direction_accuracy']} name="Direction Accuracy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Instance Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={sizeData}
                margin={{ top: 20, right: 60, left: 60, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="size" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                />
                <YAxis 
                  yAxisId="left" 
                  label={{ value: 'Error Metrics', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                {/* <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  label={{ value: 'Direction Accuracy (%)', angle: 90, position: 'insideRight', offset: 10 }}
                /> */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  label={{ value: 'Root Mean Squared Error', angle: 90, position: 'insideRight', offset: 10 }}
                />
                <Tooltip />
                <Legend />
                {/* <Bar yAxisId="right" dataKey="rmse" fill={METRIC_COLOUR['rmse']} name="RMSE" /> */}
                <Bar yAxisId="right" dataKey="smape_cv" fill={METRIC_COLOUR['smape_cv']} name="STD" />
                <Bar yAxisId="left" dataKey="mape" fill={METRIC_COLOUR['mape']} name="MAPE" />
                <Bar yAxisId="left" dataKey="smape" fill={METRIC_COLOUR['smape']} name="SMAPE" />
                {/* <Bar yAxisId="right" dataKey="direction_accuracy" fill={METRIC_COLOUR['direction_accuracy']} name="Direction Accuracy" /> */}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Error Distribution by Instance Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={errorThresholdData}
                margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" />
                <YAxis dataKey="size" type="category" width={80} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend verticalAlign="bottom" height={36} />
                
                {ERROR_CATEGORIES.map(({ label, color }) => (
                  <Bar key={label} dataKey={label} stackId="a" fill={color} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
{/* 
      <Card>
        <CardHeader>
          <CardTitle>Correlation Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={correlationData}
                layout="vertical"
                margin={{ top: 20, right: 60, left: 120, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[-1, 1]}
                  tickCount={5}
                />
                <YAxis
                  type="category"
                  dataKey="metric"
                  tickFormatter={(value) => `${value}-${correlationData.find(d => d.metric === value)?.characteristic || ''}`}
                />
                <Tooltip
                  formatter={(value) => value.toFixed(3)}
                />
                <Bar
                  dataKey="correlation"
                  fill={(d) => d.correlation > 0 ? 
                    `rgb(0, ${Math.floor(Math.abs(d.correlation) * 255)}, 0)` :
                    `rgb(${Math.floor(Math.abs(d.correlation) * 255)}, 0, 0)`}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card> */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Upload CSV Metrics File</label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          className="border rounded p-2"
        />
      </div>
    </div>
  );
};

export default MetricsDashboard;