"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import rwandaLocations from "../../../rwanda-locations.json";

interface LocationSelectorProps {
  defaultProvince?: string;
  defaultDistrict?: string;
  defaultSector?: string;
  defaultCell?: string;
  defaultVillage?: string;
  onLocationChange?: (location: {
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  }) => void;
}

export function RwandaLocationSelector({
  defaultProvince,
  defaultDistrict,
  defaultSector,
  defaultCell,
  defaultVillage,
  onLocationChange,
}: LocationSelectorProps) {
  const [province, setProvince] = useState(defaultProvince || "");
  const [district, setDistrict] = useState(defaultDistrict || "");
  const [sector, setSector] = useState(defaultSector || "");
  const [cell, setCell] = useState(defaultCell || "");
  const [village, setVillage] = useState(defaultVillage || "");

  const locations = rwandaLocations as Record<string, any>;

  const provinces = Object.keys(locations);
  const districts = province ? Object.keys(locations[province] || {}) : [];
  const sectors = province && district ? Object.keys(locations[province]?.[district] || {}) : [];
  const cells = province && district && sector ? Object.keys(locations[province]?.[district]?.[sector] || {}) : [];
  const villages = province && district && sector && cell ? (locations[province]?.[district]?.[sector]?.[cell] || []) : [];

  useEffect(() => {
    if (onLocationChange) {
      onLocationChange({ province, district, sector, cell, village });
    }
  }, [province, district, sector, cell, village, onLocationChange]);

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict("");
    setSector("");
    setCell("");
    setVillage("");
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setSector("");
    setCell("");
    setVillage("");
  };

  const handleSectorChange = (value: string) => {
    setSector(value);
    setCell("");
    setVillage("");
  };

  const handleCellChange = (value: string) => {
    setCell(value);
    setVillage("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="province">Province</Label>
        <Select name="province" value={province} onValueChange={handleProvinceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select province" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((prov) => (
              <SelectItem key={prov} value={prov}>
                {prov}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="district">District</Label>
        <Select name="district" value={district} onValueChange={handleDistrictChange} disabled={!province}>
          <SelectTrigger>
            <SelectValue placeholder="Select district" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((dist) => (
              <SelectItem key={dist} value={dist}>
                {dist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sector">Sector</Label>
        <Select name="sector" value={sector} onValueChange={handleSectorChange} disabled={!district}>
          <SelectTrigger>
            <SelectValue placeholder="Select sector" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((sect) => (
              <SelectItem key={sect} value={sect}>
                {sect}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cell">Cell</Label>
        <Select name="cell" value={cell} onValueChange={handleCellChange} disabled={!sector}>
          <SelectTrigger>
            <SelectValue placeholder="Select cell" />
          </SelectTrigger>
          <SelectContent>
            {cells.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="village">Village</Label>
        <Select name="village" value={village} onValueChange={setVillage} disabled={!cell}>
          <SelectTrigger>
            <SelectValue placeholder="Select village" />
          </SelectTrigger>
          <SelectContent>
            {villages.map((vill: string) => (
              <SelectItem key={vill} value={vill}>
                {vill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
