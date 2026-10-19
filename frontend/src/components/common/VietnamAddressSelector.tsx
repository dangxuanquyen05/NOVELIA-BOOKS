import React, { useState } from 'react';
import { MapPin, ChevronDown, Check, Edit3, ListFilter } from 'lucide-react';
import {
  VIETNAM_PROVINCES,
  getDistrictsByProvince,
  getWardsByDistrict,
} from '../../data/vietnamLocations';

export interface VietnamAddressSelectorProps {
  province: string;
  district: string;
  ward: string;
  onChange: (address: { province: string; district: string; ward: string }) => void;
  required?: boolean;
  className?: string;
}

export const VietnamAddressSelector: React.FC<VietnamAddressSelectorProps> = ({
  province,
  district,
  ward,
  onChange,
  required = true,
  className = '',
}) => {
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  // Available districts and wards based on active selections
  const availableDistricts = province ? getDistrictsByProvince(province) : [];
  const availableWards = province && district ? getWardsByDistrict(province, district) : [];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value;
    onChange({
      province: newProvince,
      district: '',
      ward: '',
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    onChange({
      province,
      district: newDistrict,
      ward: '',
    });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWard = e.target.value;
    onChange({
      province,
      district,
      ward: newWard,
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode toggle bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#B88E52]" />
          Địa giới hành chính giao hàng:
        </span>
        <button
          type="button"
          onClick={() => setIsManualMode(!isManualMode)}
          className="text-[11px] font-semibold text-[#8C6D3B] hover:text-[#8C5D3B] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          {isManualMode ? (
            <>
              <ListFilter className="w-3 h-3" /> Chọn nhanh từ danh mục (Khuyên dùng)
            </>
          ) : (
            <>
              <Edit3 className="w-3 h-3" /> Nhập tay thủ công
            </>
          )}
        </button>
      </div>

      {isManualMode ? (
        /* Manual input fallback mode */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Tỉnh / Thành phố {required && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={province}
              onChange={(e) => onChange({ province: e.target.value, district, ward })}
              placeholder="VD: Hà Nội, TP.HCM..."
              className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#8C5D3B] focus:ring-1 focus:ring-[#8C5D3B] bg-[#FAFAF8]"
              required={required}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Quận / Huyện {required && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => onChange({ province, district: e.target.value, ward })}
              placeholder="VD: Quận Đống Đa..."
              className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#8C5D3B] focus:ring-1 focus:ring-[#8C5D3B] bg-[#FAFAF8]"
              required={required}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Phường / Xã {required && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={ward}
              onChange={(e) => onChange({ province, district, ward: e.target.value })}
              placeholder="VD: Phường Cát Linh..."
              className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#8C5D3B] focus:ring-1 focus:ring-[#8C5D3B] bg-[#FAFAF8]"
              required={required}
            />
          </div>
        </div>
      ) : (
        /* Interactive cascading dropdowns */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Tỉnh / Thành phố */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700">
              Tỉnh / Thành phố {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <select
                value={province}
                onChange={handleProvinceChange}
                required={required}
                className="w-full text-xs rounded-xl border border-[#D5CDC0] py-3 pl-3 pr-8 focus:outline-none focus:border-[#8C5D3B] focus:ring-2 focus:ring-[#8C5D3B]/20 bg-white appearance-none cursor-pointer transition-all hover:border-stone-400 font-medium text-stone-800"
              >
                <option value="">-- Chọn Tỉnh / Thành phố --</option>
                {VIETNAM_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Quận / Huyện */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700">
              Quận / Huyện {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <select
                value={district}
                onChange={handleDistrictChange}
                disabled={!province || availableDistricts.length === 0}
                required={required}
                className={`w-full text-xs rounded-xl border py-3 pl-3 pr-8 focus:outline-none focus:border-[#8C5D3B] focus:ring-2 focus:ring-[#8C5D3B]/20 appearance-none transition-all font-medium ${
                  !province
                    ? 'bg-stone-100/70 border-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-white border-[#D5CDC0] text-stone-800 hover:border-stone-400 cursor-pointer'
                }`}
              >
                <option value="">
                  {!province ? '-- Chọn Tỉnh/TP trước --' : '-- Chọn Quận / Huyện --'}
                </option>
                {availableDistricts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Phường / Xã */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700">
              Phường / Xã {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              {availableWards.length > 0 ? (
                <select
                  value={ward}
                  onChange={handleWardChange}
                  disabled={!district}
                  required={required}
                  className={`w-full text-xs rounded-xl border py-3 pl-3 pr-8 focus:outline-none focus:border-[#8C5D3B] focus:ring-2 focus:ring-[#8C5D3B]/20 appearance-none transition-all font-medium ${
                    !district
                      ? 'bg-stone-100/70 border-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-white border-[#D5CDC0] text-stone-800 hover:border-stone-400 cursor-pointer'
                  }`}
                >
                  <option value="">
                    {!district ? '-- Chọn Quận/Huyện trước --' : '-- Chọn Phường / Xã --'}
                  </option>
                  {availableWards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => onChange({ province, district, ward: e.target.value })}
                  disabled={!district}
                  placeholder={!district ? 'Chọn Quận/Huyện trước' : 'Nhập tên Phường/Xã...'}
                  className={`w-full text-xs rounded-xl border p-3 focus:outline-none focus:border-[#8C5D3B] focus:ring-1 focus:ring-[#8C5D3B] ${
                    !district ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-white border-[#D5CDC0]'
                  }`}
                  required={required}
                />
              )}
              {availableWards.length > 0 && (
                <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected location confirmation tag */}
      {province && district && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF0E6] border border-[#D5E3DA] text-[11px] text-[#8C5D3B] font-medium">
          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>
            Đã chọn: <strong className="font-bold">{ward ? `${ward}, ` : ''}{district}, {province}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
