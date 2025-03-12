import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FilterBar = ({ filterOptions, filters, handleFilterChange }) => {
  return (
    <div className="sticky top-0 z-10 bg-background pb-2 pt-2 shadow-md">
      <Card>
        <CardHeader className="py-2">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Time Horizons</label>
              <select 
                className="border rounded p-1 min-w-36"
                multiple
                size={3}
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
              <label className="text-sm font-medium mb-1">Regions</label>
              <select 
                className="border rounded p-1 min-w-36"
                multiple
                size={3}
                value={filters.region}
                onChange={(e) => handleFilterChange('region', 
                  Array.from(e.target.selectedOptions, option => option.value)
                )}
              >
                {filterOptions.region.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Availability Zones</label>
              <select 
                className="border rounded p-1 min-w-36"
                multiple
                size={3}
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
                className="border rounded p-1 min-w-36"
                multiple
                size={3}
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
                className="border rounded p-1 min-w-36"
                multiple
                size={3}
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
                className="border rounded p-1 min-w-36"
                multiple
                size={3}
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
                className="border rounded p-1 min-w-36"
                multiple
                size={3}
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
          <div className="text-xs text-gray-500">
            Hold Ctrl/Cmd to select multiple options. Clear all selections to show all data.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FilterBar;
