import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper component for multi-select filter
const FilterSelect = ({
  label,
  options,
  value,
  onChange,
  formatter = (v) => v,
}) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1">{label}</label>
      <select
        className="border rounded p-1 min-w-36"
        multiple
        size={3}
        value={value}
        onChange={(e) =>
          onChange(
            Array.from(e.target.selectedOptions, (option) =>
              formatter(option.value),
            ),
          )
        }
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label === "Modifiers" ? formatModifier(option) : option}
          </option>
        ))}
      </select>
    </div>
  );
};

// Helper function to format modifiers
const formatModifier = (mod) => {
  switch (mod) {
    case "g":
      return "Graviton";
    case "i":
      return "Intel";
    case "a":
      return "AMD";
    case "d":
      return "NVMe";
    case "n":
      return "Network";
    default:
      return mod;
  }
};

const FilterBar = ({ filterOptions, filters, handleFilterChange }) => {
  return (
    <div className="sticky top-0 z-10 bg-background pb-2 pt-2 shadow-md">
      <Card>
        <CardHeader className="py-2">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-2">
            <FilterSelect
              label="Time Horizons"
              options={filterOptions.time_horizons}
              value={filters.time_horizons}
              onChange={(value) => handleFilterChange("time_horizons", value)}
              formatter={(v) => parseInt(v)}
            />

            <FilterSelect
              label="Regions"
              options={filterOptions.region}
              value={filters.region}
              onChange={(value) => handleFilterChange("region", value)}
            />

            <FilterSelect
              label="Availability Zones"
              options={filterOptions.av_zones}
              value={filters.av_zones}
              onChange={(value) => handleFilterChange("av_zones", value)}
            />

            <FilterSelect
              label="Instance Types"
              options={filterOptions.instance_types}
              value={filters.instance_types}
              onChange={(value) => handleFilterChange("instance_types", value)}
            />

            <FilterSelect
              label="Sizes"
              options={filterOptions.sizes}
              value={filters.sizes}
              onChange={(value) => handleFilterChange("sizes", value)}
            />

            <FilterSelect
              label="Generation"
              options={filterOptions.generations}
              value={filters.generations}
              onChange={(value) => handleFilterChange("generations", value)}
              formatter={(v) => parseInt(v)}
            />

            <FilterSelect
              label="Modifiers"
              options={filterOptions.modifiers}
              value={filters.modifiers}
              onChange={(value) => handleFilterChange("modifiers", value)}
            />
          </div>
          <div className="text-xs text-gray-500">
            Hold Ctrl/Cmd to select multiple options. Clear all selections to
            show all data.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FilterBar;
