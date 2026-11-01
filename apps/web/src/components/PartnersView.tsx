'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, AUTHORIZED_PARTNERS } from '../context/AuthContext';
import { ShieldCheck, Mail, Phone, Building, Vote } from 'lucide-react';

export const PartnersView: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const activePartner = user || AUTHORIZED_PARTNERS[0];

  const partnerDetails = [
    {
      ...AUTHORIZED_PARTNERS[0],
      unit: 'Executive Strategy & Strategic Partnerships',
      votingPower: '25% Equal Voting',
      status: 'Active Founding Partner',
    },
    {
      ...AUTHORIZED_PARTNERS[1],
      unit: 'Software Architecture & AI Technology (BU-AI)',
      votingPower: '25% Equal Voting',
      status: 'Active Founding Partner',
    },
    {
      ...AUTHORIZED_PARTNERS[2],
      unit: 'Corporate Finance, Treasury & Business Deals',
      votingPower: '25% Equal Voting',
      status: 'Active Founding Partner',
    },
    {
      ...AUTHORIZED_PARTNERS[3],
      unit: 'Operations Execution & Digital Transformation (BU-DTC)',
      votingPower: '25% Equal Voting',
      status: 'Active Founding Partner',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel-cyan flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-dim text-cyan border border-cyan/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Equal Partner Governance Model</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">{t('navPartners')}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            الملكية وحقوق التصويت والقرارات المالية موزعة بالتساوي الصارم (25% لكل شريك) بين الشركاء الأربعة المؤسسين.
            كافة الحسابات البنكية، والمصروفات، والمعاملات متاحة بشفافية كاملة لجميع الشركاء.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-navy-950/80 p-4 rounded-xl border border-surface-border">
          <div className="text-center">
            <div className="text-2xl font-black text-cyan font-mono">100%</div>
            <div className="text-[10px] text-slate-400">Total Equity Allocated</div>
          </div>
          <div className="h-8 w-[1px] bg-surface-border"></div>
          <div className="text-center">
            <div className="text-2xl font-black text-white font-mono">4 / 4</div>
            <div className="text-[10px] text-slate-400">Active Partners</div>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {partnerDetails.map((partner) => {
          const isSelected = activePartner.id === partner.id;

          return (
            <div
              key={partner.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'bg-navy-800/90 border-cyan shadow-glow-cyan'
                  : 'bg-navy-900/60 border-surface-border hover:border-cyan/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-navy-950 border border-surface-border flex items-center justify-center text-3xl shadow-inner">
                    {partner.avatar}
                  </div>
                  <div className="text-end">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black font-mono bg-cyan-dim text-cyan border border-cyan/40">
                      {partner.ownership}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white">{partner.name}</h3>
                <p className="text-xs text-cyan font-mono mt-0.5">{partner.role}</p>

                <div className="mt-4 pt-4 border-t border-surface-border/60 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{partner.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{partner.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{partner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Vote className="w-3.5 h-3.5 text-cyan shrink-0" />
                    <span className="font-mono text-[11px] text-cyan">{partner.votingPower}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-surface-border text-center">
                {isSelected ? (
                  <span className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold bg-cyan/15 text-cyan border border-cyan/40">
                    حسابك المسجل به حالياً
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold bg-navy-950 text-slate-400 border border-surface-border">
                    شريك مؤسس نشط
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
