import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ScatterChart, Scatter, Cell, AreaChart, Area, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const METRIC_COLOUR = {
  'rmse': '#8884d8',
  'mape': '#82ca9d',
  'smape': '#ffc658',
  'direction_accuracy': '#ff7300',
  'smape_cv': '#ff69b4',
  'trend_accuracy': '#3366cc',
  'cost_savings': '#ff9900',
  'sgnif_trend_acc': '#3366cc'  // Adding a color for sgnif_trend_acc
};

const ERROR_CATEGORIES = [
  { range: '< 1%', label: 'Very Accurate (< 1%)', color: '#22c55e' },
  { range: '1-5%', label: 'Good (1-5%)', color: '#84cc16' },
  { range: '5-10%', label: 'Acceptable (5-10%)', color: '#eab308' },
  { range: '10-20%', label: 'Poor (10-20%)', color: '#f97316' },
  { range: '20-50%', label: 'Very Poor (20-50%)', color: '#ef4444' },
  { range: '50-100%', label: 'Unreliable (50-100%)', color: '#dc2626' },
  { range: '> 100%', label: 'Extreme Error (> 100%)', color: '#991b1b' }
];

// Define colors for the heatmap - gradient from green (low MAPE) to red (high MAPE)
const getMapeColor = (mape) => {
  if (mape < 5) return '#22c55e'; // Very low error - green
  if (mape < 10) return '#84cc16'; // Low error - light green
  if (mape < 20) return '#eab308'; // Medium error - yellow
  if (mape < 30) return '#f97316'; // Medium-high error - orange
  if (mape < 50) return '#ef4444'; // High error - light red
  return '#991b1b'; // Very high error - dark red
};

const SIZE_ORDER = {
  "nano": 1,
  "micro": 2,
  "small": 3,
  "medium": 4,
  "large": 5,
  "xlarge": 6,
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
  "metal": 20,
  "metal-16xl": 21,
  "metal-24xl": 22,
  "metal-32xl": 23,
  "metal-48xl": 24,
}


const VisualizationGrid = ({ 
  timeHorizonData, 
  generationData, 
  sizeData, 
  errorThresholdData, 
  regionData, 
  instanceFamilyData,
  azErrorData,
  instanceTimeSeriesData,
  trendAccuracyData,
  metricsDistributionData
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
    continuousDistribution: false // Keep only continuous distribution
  });

  const toggleVisibility = (key) => {
    setHidden(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Get unique instance types for Y-axis
  const uniqueInstanceTypes = Array.from(
    new Set(instanceTimeSeriesData.map(item => item.instance_type))
  ).sort();
  
  // Get unique time steps for X-axis
  const uniqueTimeSteps = Array.from(
    new Set(instanceTimeSeriesData.map(item => item.time_step))
  ).sort((a, b) => a - b);
  
  // Create instance type to index mapping for y-coordinate
  const instanceTypeToIndex = {};
  uniqueInstanceTypes.forEach((type, index) => {
    instanceTypeToIndex[type] = index;
  });
  
  // Format data for ScatterChart - transform to {x, y, z} where:
  // x = time step
  // y = instance index
  // z = MAPE value (for color)
  const formattedHeatmapData = instanceTimeSeriesData.map(item => ({
    x: item.time_step,
    y: instanceTypeToIndex[item.instance_type],
    z: item.mape,
    instance_type: item.instance_type,
    mape: item.mape,
    count: item.count
  }));
  
  // Custom tooltip for the heatmap
  const HeatmapTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-md">
          <p className="font-bold">{data.instance_type}</p>
          <p>Time step: t+{data.x}</p>
          <p>Average MAPE: {data.mape.toFixed(2)}%</p>
          <p>Instance count: {data.count}</p>
        </div>
      );
    }
    return null;
  };
  
  // Simplify sort configuration to use just one criterion
  const [sortConfig, setSortConfig] = useState({
    criterion: 'family',     // Options: 'family', 'generation', 'modification', 'size'
    direction: 'asc'         // Sort direction: 'asc' or 'desc'
  });

  // Simplified function to toggle sort configuration
  const toggleSort = (sortType) => {
    setSortConfig(prev => {
      // If clicking the same criterion, toggle direction
      if (prev.criterion === sortType) {
        return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Otherwise set as new criterion with ascending direction
      else {
        return { criterion: sortType, direction: 'asc' };
      }
    });
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Excel-like Heatmap for Instance Type vs Time Step */}
        
        {!hidden.timeHorizon && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('timeHorizon')}>
              <CardTitle>Time Horizon Performance Degradation</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={timeHorizonData} 
                  margin={{ top: 10, right: 50, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestep" />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'Error (%)', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'Trend Accuracy (%)', angle: 90, position: 'insideRight', offset: -15, fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="mape" stroke={METRIC_COLOUR['mape']} name="MAPE" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {!hidden.generation && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('generation')}>
              <CardTitle>Performance by Instance Generation</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={generationData}
                  margin={{ top: 10, right: 50, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generation" />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'MAPE (%)', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'Trend Accuracy (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="mape" fill={METRIC_COLOUR['mape']} name="MAPE" />
                  <Bar yAxisId="right" dataKey="sgnif_trend_acc" fill={METRIC_COLOUR['sgnif_trend_acc']} name="Trend Accuracy" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {!hidden.size && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('size')}>
              <CardTitle>Performance by Instance Size</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={sizeData}
                  margin={{ top: 10, right: 50, left: 40, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="size" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'Error', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'STD', angle: 90, position: 'insideRight', offset: -20, fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="mape" fill={METRIC_COLOUR['mape']} name="MAPE" />
                  <Bar yAxisId="right" dataKey="sgnif_trend_acc" fill={METRIC_COLOUR['sgnif_trend_acc']} name="Trend Accuracy" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {!hidden.errorThreshold && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('errorThreshold')}>
              <CardTitle>Prediction Error Distribution by Size</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={errorThresholdData}
                  margin={{ top: 10, right: 20, left: 90, bottom: 10 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="%" domain={[0, 100]} />
                  <YAxis dataKey="size" type="category" width={60} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {ERROR_CATEGORIES.map(({ label, color }) => (
                    <Bar key={label} dataKey={label} stackId="a" fill={color} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Continuous distribution visualization */}
        {!hidden.continuousDistribution && (
          <Card className="h-full col-span-1 md:col-span-2">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('continuousDistribution')}>
              <CardTitle>Distribution of Metrics</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Trend Accuracy Distribution */}
                <div className="h-full">
                  <h3 className="text-sm font-medium mb-1 text-center">Trend Accuracy Distribution</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart
                      data={metricsDistributionData.continuous?.trend || []}
                      margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      {/* Add reference area to mark 0-50% as "poor performance" */}
                      <ReferenceArea 
                        x1={metricsDistributionData.minMaxValues?.trendMin || 0} 
                        x2={50} 
                        fill="rgba(255, 0, 0, 0.1)" 
                        ifOverflow="visible"
                      />
                      <XAxis 
                        dataKey="value" 
                        label={{ value: 'Trend Accuracy (%)', position: 'insideBottom', offset: -10 }}
                        domain={[
                          metricsDistributionData.minMaxValues?.trendMin || 0, 
                          metricsDistributionData.minMaxValues?.trendMax || 100
                        ]} 
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                      <YAxis 
                        label={{ value: 'Density', angle: -90, position: 'insideLeft', offset: -5 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${name === 'percentage' ? value.toFixed(2) + '%' : value}`, 
                          name === 'percentage' ? 'Percentage' : name
                        ]}
                        labelFormatter={(value) => `Value: ${parseFloat(value).toFixed(1)}%`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke={METRIC_COLOUR['trend_accuracy']} 
                        fill={METRIC_COLOUR['trend_accuracy']} 
                        fillOpacity={0.6}
                        name="Percentage"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Cost Savings Distribution */}
                <div className="h-full">
                  <h3 className="text-sm font-medium mb-1 text-center">Cost Savings Distribution</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart
                      data={metricsDistributionData.continuous?.savings || []}
                      margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      {/* Add reference area to mark negative values as "losses" */}
                      <ReferenceArea 
                        x1={metricsDistributionData.minMaxValues?.savingsMin || -15} 
                        x2={0} 
                        fill="rgba(255, 0, 0, 0.1)" 
                        ifOverflow="visible"
                      />
                      <XAxis 
                        dataKey="value" 
                        label={{ value: 'Cost Savings (%)', position: 'insideBottom', offset: -10 }}
                        domain={[
                          metricsDistributionData.minMaxValues?.savingsMin || -15, 
                          metricsDistributionData.minMaxValues?.savingsMax || 25
                        ]}
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                      <YAxis 
                        label={{ value: 'Density', angle: -90, position: 'insideLeft', offset: -5 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${name === 'percentage' ? value.toFixed(2) + '%' : value}`, 
                          name === 'percentage' ? 'Percentage' : name
                        ]}
                        labelFormatter={(value) => `Value: ${parseFloat(value).toFixed(1)}%`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke={METRIC_COLOUR['cost_savings']} 
                        fill={METRIC_COLOUR['cost_savings']} 
                        fillOpacity={0.6}
                        name="Percentage"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!hidden.instanceTimeSeries && (
          <Card className="h-full col-span-1 xl:col-span-3">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('instanceTimeSeries')}>
              <CardTitle>MAPE Progression by Instance Type and Time Horizon</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <div className="text-xs text-gray-500 mb-2">
                Values represent average MAPE (%). Cell color indicates error magnitude: green (low) to red (high).
              </div>
              {/* Simplified sorting controls */}
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <span>Sort by:</span>
                <button 
                  className={`px-2 py-1 rounded ${sortConfig.criterion === 'family' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => toggleSort('family')}
                >
                  Instance Family {sortConfig.criterion === 'family' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`px-2 py-1 rounded ${sortConfig.criterion === 'generation' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => toggleSort('generation')}
                >
                  Generation {sortConfig.criterion === 'generation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`px-2 py-1 rounded ${sortConfig.criterion === 'modification' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => toggleSort('modification')}
                >
                  Modification {sortConfig.criterion === 'modification' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`px-2 py-1 rounded ${sortConfig.criterion === 'size' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => toggleSort('size')}
                >
                  Size {sortConfig.criterion === 'size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </div>
              {(() => {
                // Parse instance type components for sorting
                const parseInstanceType = (instanceType) => {
                  const [prefix, suffix] = instanceType.split('.');
                  const family = prefix.replace(/\d+/g, '');
                  const generation = parseInt(prefix.replace(/\D+/g, '') || '0');
                  const modification = prefix.replace(/^\D+\d+/, ''); // Get any letters after the generation number
                  const size = suffix || '';
                  return { instanceType, family, generation, modification, size };
                };

                // Get unique instance types with parsed components
                const parsedInstanceTypes = Array.from(
                  new Set(instanceTimeSeriesData.map(item => item.instance_type))
                ).map(parseInstanceType);

                // Sort based on current configuration
                const sortedInstanceTypes = [...parsedInstanceTypes].sort((a, b) => {
                  // Set comparison values based on sort criterion
                  let valueA, valueB;
                  if (sortConfig.criterion === 'family') {
                    valueA = a.family;
                    valueB = b.family;
                  } else if (sortConfig.criterion === 'generation') {
                    valueA = a.generation;
                    valueB = b.generation;
                  } else if (sortConfig.criterion === 'modification') {
                    valueA = a.modification;
                    valueB = b.modification;
                  } else { // 'size'
                    valueA = SIZE_ORDER[a.size] || 999;
                    valueB = SIZE_ORDER[b.size] || 999;
                  }

                  // Perform comparison
                  let comparison = 0;
                  if (typeof valueA === 'string' && typeof valueB === 'string') {
                    comparison = valueA.localeCompare(valueB);
                  } else {
                    comparison = valueA - valueB;
                  }

                  // Apply sort direction
                  return sortConfig.direction === 'asc' ? comparison : -comparison;
                });

                // Extract just the instance types from the sorted objects
                const uniqueInstanceTypes = sortedInstanceTypes.map(item => item.instanceType);
                
                const uniqueTimeSteps = Array.from(
                  new Set(instanceTimeSeriesData.map(item => item.time_step))
                ).sort((a, b) => a - b);
                
                // Create a lookup map: { instance_type: { time_step: item } }
                const dataMap = {};
                instanceTimeSeriesData.forEach(item => {
                  if (!dataMap[item.instance_type]) dataMap[item.instance_type] = {};
                  dataMap[item.instance_type][item.time_step] = item;
                });
                
                return (
                  <table className="border-collapse w-fit text-xs">
                    <thead>
                      <tr>
                        <th className="border p-0.5 bg-gray-200"></th>
                        {uniqueTimeSteps.map(ts => (
                          <th key={ts} className="border p-0.5 bg-gray-200 text-center">t+{ts}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueInstanceTypes.map(instType => (
                        <tr key={instType}>
                          <td className="border p-0.5 bg-gray-200">{instType}</td>
                          {uniqueTimeSteps.map(ts => {
                            const cellData = dataMap[instType] && dataMap[instType][ts];
                            const mape = cellData ? cellData.mape : null;
                            const bgColor = mape !== null ? getMapeColor(mape) : '#f1f5f9';
                            return (
                              <td key={ts} className="border p-0.5 text-center" style={{ backgroundColor: bgColor, minWidth: '40px' }}>
                                {mape !== null ? mape.toFixed(1) + '%' : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {!hidden.region && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('region')}>
              <CardTitle>Performance by Region</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={regionData}
                  margin={{ top: 10, right: 50, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'MAPE (%)', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'Cost Savings (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 12 }}
                    domain={[-15, 30]}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="mape" fill={METRIC_COLOUR['mape']} name="MAPE" />
                  <Bar yAxisId="right" dataKey="cost_savings" fill={METRIC_COLOUR['cost_savings']} name="Cost Savings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {!hidden.azError && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('azError')}>
              <CardTitle>Prediction Error Distribution by AZ</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={azErrorData}
                  margin={{ top: 10, right: 20, left: 90, bottom: 10 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="%" domain={[0, 100]} />
                  <YAxis dataKey="av_zone" type="category" width={60} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {ERROR_CATEGORIES.map(({ label, color }) => (
                    <Bar key={label} dataKey={label} stackId="a" fill={color} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
 
        {!hidden.instanceFamily && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('instanceFamily')}>
              <CardTitle>Performance by Instance Family</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={instanceFamilyData}
                  margin={{ top: 10, right: 50, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="instance_family" tick={{ fontSize: 10 }} />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'MAPE (%)', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'Trend Accuracy (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="mape" fill={METRIC_COLOUR['mape']} name="MAPE" />
                  <Bar yAxisId="right" dataKey="sgnif_trend_acc" fill={METRIC_COLOUR['sgnif_trend_acc']} name="Trend Accuracy" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {!hidden.trendAccuracy && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('trendAccuracy')}>
              <CardTitle>Prediction Quality by Instance Family</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendAccuracyData}
                  margin={{ top: 10, right: 30, left: 30, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="instance_family" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 11 }} 
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Trend Accuracy (%)', angle: -90, position: 'insideLeft', offset: -10, fontSize: 12 }}
                    domain={[0, 100]} // Ensure proper scaling for percentage values
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'MAPE (%)', angle: 90, position: 'insideRight', offset: -15, fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="mape" fill={METRIC_COLOUR['mape']} name="MAPE" />
                  <Bar yAxisId="right" dataKey="sgnif_trend_acc" fill={METRIC_COLOUR['sgnif_trend_acc']} name="Trend Accuracy" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {!hidden.trendAccuracy && (
          <Card className="h-full">
            <CardHeader className="py-3 cursor-pointer" onClick={() => toggleVisibility('trendAccuracy')}>
              <CardTitle>Prediction Quality by Instance Family</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendAccuracyData}
                  margin={{ top: 10, right: 30, left: 30, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="instance_family" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 11 }} 
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Trend Accuracy (%)', angle: -90, position: 'insideLeft', offset: -10, fontSize: 12 }}
                    domain={[0, 100]} // Ensure proper scaling for percentage values
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Cost Savings (%)', angle: 90, position: 'insideRight', offset: -15, fontSize: 12 }}
                    domain={[-20, 30]} // Adjust domain for cost savings
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value.toFixed(2)}%`, name]} 
                    labelFormatter={(label) => `Instance Family: ${label}`} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar 
                    yAxisId="left"
                    dataKey="avg_trend_accuracy" 
                    name="Trend Accuracy" 
                    fill={METRIC_COLOUR['trend_accuracy']} 
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="avg_cost_savings" 
                    name="Cost Savings" 
                    fill={METRIC_COLOUR['cost_savings']} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Restore buttons */}
      <div className="mt-4 mb-2">
        <Card>
          <CardHeader className="py-2">
            <CardTitle>Restore Hidden Visualizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {hidden.instanceTimeSeries && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('instanceTimeSeries')}
                >
                  MAPE Progression
                </button>
              )}
              {hidden.timeHorizon && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('timeHorizon')}
                >
                  Time Horizon Performance
                </button>
              )}
              {hidden.generation && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('generation')}
                >
                  Instance Generation
                </button>
              )}
              {hidden.size && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('size')}
                >
                  Instance Size
                </button>
              )}
              {hidden.errorThreshold && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('errorThreshold')}
                >
                  Error Distribution by Size
                </button>
              )}
              {hidden.region && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('region')}
                >
                  Performance by Region
                </button>
              )}
              {hidden.instanceFamily && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('instanceFamily')}
                >
                  Instance Family
                </button>
              )}
              {hidden.azError && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('azError')}
                >
                  Error Distribution by AZ
                </button>
              )}
              {hidden.metricsDistribution && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('metricsDistribution')}
                >
                  Metrics Distribution
                </button>
              )}
              {hidden.trendAccuracy && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('trendAccuracy')}
                >
                  Prediction Quality
                </button>
              )}
              {hidden.continuousDistribution && (
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() => toggleVisibility('continuousDistribution')}
                >
                  Continuous Distribution
                </button>
              )}
              {Object.values(hidden).every(v => !v) && (
                <span className="text-sm text-gray-500">No hidden visualizations</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisualizationGrid;
