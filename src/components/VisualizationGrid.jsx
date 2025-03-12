import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const METRIC_COLOUR = {
  'rmse': '#8884d8',
  'mape': '#82ca9d',
  'smape': '#ffc658',
  'direction_accuracy': '#ff7300',
  'smape_cv': '#ff69b4',
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

const VisualizationGrid = ({ 
  timeHorizonData, 
  generationData, 
  sizeData, 
  errorThresholdData, 
  regionData, 
  instanceFamilyData,
  azErrorData
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      <Card className="h-full">
        <CardHeader className="py-3">
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
                label={{ value: 'Error', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'STD', angle: 90, position: 'insideRight', offset: -15, fontSize: 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="right" type="monotone" dataKey="smape_cv" stroke={METRIC_COLOUR['smape_cv']} name="STD" />
              <Line yAxisId="left" type="monotone" dataKey="mape" stroke={METRIC_COLOUR['mape']} name="MAPE" />
              <Line yAxisId="left" type="monotone" dataKey="smape" stroke={METRIC_COLOUR['smape']} name="SMAPE" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="py-3">
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
                label={{ value: 'RMSE', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'Dir. Acc. (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="rmse" fill={METRIC_COLOUR['rmse']} name="RMSE" />
              <Bar yAxisId="right" dataKey="direction_accuracy" fill={METRIC_COLOUR['direction_accuracy']} name="Dir. Acc." />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="py-3">
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
              <Bar yAxisId="right" dataKey="smape_cv" fill={METRIC_COLOUR['smape_cv']} name="STD" />
              <Bar yAxisId="left" dataKey="mape" fill={METRIC_COLOUR['mape']} name="MAPE" />
              <Bar yAxisId="left" dataKey="smape" fill={METRIC_COLOUR['smape']} name="SMAPE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="py-3">
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
              <XAxis type="number" unit="%" />
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
      
      <Card className="h-full">
        <CardHeader className="py-3">
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
                label={{ value: 'RMSE', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'Dir. Acc. (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="rmse" fill={METRIC_COLOUR['rmse']} name="RMSE" />
              <Bar yAxisId="right" dataKey="direction_accuracy" fill={METRIC_COLOUR['direction_accuracy']} name="Dir. Acc." />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="h-full">
        <CardHeader className="py-3">
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
                label={{ value: 'RMSE', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'Dir. Acc. (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="rmse" fill={METRIC_COLOUR['rmse']} name="RMSE" />
              <Bar yAxisId="right" dataKey="direction_accuracy" fill={METRIC_COLOUR['direction_accuracy']} name="Dir. Acc." />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="py-3">
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
              <XAxis type="number" unit="%" />
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
    </div>
  );
};

export default VisualizationGrid;
