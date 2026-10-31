'use client';

import React from 'react';
import { Zone } from '@/types/database';
import { Sparkles, Smartphone, SmartphoneCharging, Package, Crown, Plus, CheckCircle2 } from 'lucide-react';

interface ZoneTabsProps {
  zones: Zone[];
  activeZoneSlug: string;
  onSelectZone: (slug: string) => void;
  onOpenZoneManager?: () => void;
  isAdmin?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  SmartphoneCharging: <SmartphoneCharging className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Crown: <Crown className="w-4 h-4" />,
};

export default function ZoneTabs({
  zones,
  activeZoneSlug,
  onSelectZone,
  onOpenZoneManager,
  isAdmin,
}: ZoneTabsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">
            Zonas del Catálogo
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            (Estructura modular escalable)
          </span>
        </div>

        {isAdmin && onOpenZoneManager && (
          <button
            onClick={onOpenZoneManager}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Gestionar / Activar Zonas
          </button>
        )}
      </div>

      {/* Barra de pestañas con scroll horizontal táctil suave para móvil */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {zones.map((zone) => {
          const isSelected = zone.slug === activeZoneSlug;
          const isActiveInDB = zone.is_active;

          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.slug)}
              className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 border ${
                isSelected
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-lg shadow-rose-950/50 scale-102'
                  : isActiveInDB
                  ? 'bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                  : 'bg-zinc-900/50 text-zinc-400 border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              {zone.logo_url ? (
                <img
                  src={zone.logo_url}
                  alt={zone.name}
                  className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0"
                />
              ) : (
                <span className={isSelected ? 'text-white' : isActiveInDB ? 'text-rose-400' : 'text-zinc-500'}>
                  {ICON_MAP[zone.icon] || <Package className="w-4 h-4" />}
                </span>
              )}

              <span>{zone.name}</span>

              {isActiveInDB ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  Activa
                </span>
              ) : (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Próxima
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
