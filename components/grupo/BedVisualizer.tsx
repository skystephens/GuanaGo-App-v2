import React from 'react';

export type BedType = 'single' | 'double' | 'queen' | 'king' | 'twin' | 'triple';

const BED_LABELS: Record<BedType, string> = {
  single: 'Cama Sencilla',
  double: 'Cama Doble',
  queen: 'Cama Queen',
  king: 'Cama King',
  twin: '2 Camas',
  triple: '3+ Camas',
};

const BED_CAPACITY: Record<BedType, string> = {
  single: '1 persona',
  double: '2 personas',
  queen: '2 personas',
  king: '2 personas',
  twin: '2 personas',
  triple: '3-4 personas',
};

/** Floor-plan (top-down) SVG illustrations for each bed type */
function BedFloorPlan({ bedType, color }: { bedType: BedType; color: string }) {
  const c25 = `${color}40`;
  const c50 = `${color}80`;

  switch (bedType) {
    case 'single':
      return (
        <svg viewBox="0 0 70 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="2" y="2" width="66" height="96" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          {/* Headboard */}
          <rect x="8" y="7" width="54" height="13" rx="3" fill={color}/>
          {/* Mattress */}
          <rect x="8" y="22" width="54" height="68" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          {/* Pillow */}
          <rect x="14" y="26" width="42" height="18" rx="4" fill={c50}/>
          {/* Blanket crease */}
          <line x1="8" y1="78" x2="62" y2="78" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
        </svg>
      );

    case 'double':
      return (
        <svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="2" y="2" width="86" height="96" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          <rect x="8" y="7" width="74" height="13" rx="3" fill={color}/>
          <rect x="8" y="22" width="74" height="68" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="11" y="26" width="30" height="18" rx="4" fill={c50}/>
          <rect x="49" y="26" width="30" height="18" rx="4" fill={c50}/>
          <line x1="8" y1="78" x2="82" y2="78" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
        </svg>
      );

    case 'queen':
      return (
        <svg viewBox="0 0 108 106" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="2" y="2" width="104" height="102" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          <rect x="8" y="7" width="92" height="14" rx="3" fill={color}/>
          <text x="54" y="18" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">♛</text>
          <rect x="8" y="23" width="92" height="72" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="12" y="27" width="40" height="18" rx="4" fill={c50}/>
          <rect x="56" y="27" width="40" height="18" rx="4" fill={c50}/>
          <line x1="8" y1="83" x2="100" y2="83" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
          <line x1="54" y1="48" x2="54" y2="83" stroke={color} strokeWidth="0.8" opacity="0.25"/>
        </svg>
      );

    case 'king':
      return (
        <svg viewBox="0 0 128 106" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="2" y="2" width="124" height="102" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          <rect x="8" y="7" width="112" height="14" rx="4" fill={color}/>
          <text x="64" y="18" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">♛ KING</text>
          <rect x="8" y="23" width="112" height="72" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="12" y="27" width="49" height="20" rx="4" fill={c50}/>
          <rect x="67" y="27" width="49" height="20" rx="4" fill={c50}/>
          <line x1="8" y1="83" x2="120" y2="83" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
          <line x1="64" y1="50" x2="64" y2="83" stroke={color} strokeWidth="0.8" opacity="0.25"/>
        </svg>
      );

    case 'twin':
      return (
        <svg viewBox="0 0 152 106" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="2" y="2" width="148" height="102" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          {/* Bed 1 */}
          <rect x="8" y="7" width="62" height="11" rx="3" fill={color}/>
          <rect x="8" y="20" width="62" height="74" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="12" y="23" width="54" height="18" rx="4" fill={c50}/>
          <line x1="8" y1="82" x2="70" y2="82" stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.6"/>
          {/* Nightstand */}
          <rect x="74" y="38" width="6" height="12" rx="2" fill="#e2e8f0"/>
          {/* Bed 2 */}
          <rect x="82" y="7" width="62" height="11" rx="3" fill={color}/>
          <rect x="82" y="20" width="62" height="74" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="86" y="23" width="54" height="18" rx="4" fill={c50}/>
          <line x1="82" y1="82" x2="144" y2="82" stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.6"/>
        </svg>
      );

    case 'triple':
      return (
        <svg viewBox="0 0 212 106" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="2" y="2" width="208" height="102" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          {/* Bed 1 */}
          <rect x="6" y="7" width="60" height="11" rx="3" fill={color}/>
          <rect x="6" y="20" width="60" height="74" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="10" y="23" width="52" height="17" rx="4" fill={c50}/>
          {/* Bed 2 */}
          <rect x="76" y="7" width="60" height="11" rx="3" fill={color}/>
          <rect x="76" y="20" width="60" height="74" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="80" y="23" width="52" height="17" rx="4" fill={c50}/>
          {/* Bed 3 */}
          <rect x="146" y="7" width="60" height="11" rx="3" fill={color}/>
          <rect x="146" y="20" width="60" height="74" rx="3" fill={c25} stroke={color} strokeWidth="1.5"/>
          <rect x="150" y="23" width="52" height="17" rx="4" fill={c50}/>
        </svg>
      );
  }
}

interface BedVisualizerProps {
  bedType: BedType;
  selected?: boolean;
  onClick?: () => void;
  /** Render smaller version for use inside cards */
  compact?: boolean;
}

const BedVisualizer: React.FC<BedVisualizerProps> = ({ bedType, selected, onClick, compact }) => {
  const baseClasses = `flex flex-col items-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${compact ? 'p-2' : 'p-3'}`;
  const stateClasses = selected
    ? 'border-cyan-500 bg-cyan-50 shadow-md shadow-cyan-100/60'
    : 'border-gray-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/30';

  const imgClass = compact ? 'w-20 h-14' : 'w-28 h-20';
  const labelClass = compact ? 'text-[11px]' : 'text-xs';

  return (
    <button type="button" onClick={onClick} className={`${baseClasses} ${stateClasses}`}>
      <div className={`${imgClass} flex items-center justify-center`}>
        <BedFloorPlan bedType={bedType} color={selected ? '#0891b2' : '#94a3b8'} />
      </div>
      <span className={`font-semibold text-center leading-tight ${labelClass} ${selected ? 'text-cyan-700' : 'text-gray-600'}`}>
        {BED_LABELS[bedType]}
      </span>
      <span className={`${labelClass} ${selected ? 'text-cyan-500' : 'text-gray-400'}`}>
        {BED_CAPACITY[bedType]}
      </span>
    </button>
  );
};

export { BED_LABELS, BED_CAPACITY };
export default BedVisualizer;
