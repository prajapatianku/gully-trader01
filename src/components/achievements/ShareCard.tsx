'use client';

import React, { useState, useRef } from 'react';
import { 
  Download, 
  Share2, 
  Award, 
  Sparkles, 
  Palette, 
  User, 
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface ShareCardProps {
  defaultTraderName?: string;
  defaultPnl?: number;
  currency?: 'INR' | 'USD';
}

export default function ShareCard({ defaultTraderName = 'Ankit Sharma', defaultPnl = 15400, currency = 'INR' }: ShareCardProps) {
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  
  // Card customization states
  const [traderName, setTraderName] = useState(defaultTraderName);
  const [achievement, setAchievement] = useState('Green Day');
  const [statLine, setStatLine] = useState(`+${currencySymbol}${defaultPnl.toLocaleString('en-IN')} P&L Today`);
  const [quote, setQuote] = useState('Plan the trade, trade the plan. Discipline over desire.');
  const [theme, setTheme] = useState<'slate' | 'violet' | 'emerald' | 'gold'>('slate');
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Achievement presets
  const achievements = [
    { name: 'Green Day', defaultQuote: 'Patience and strict risk limits paid off today.' },
    { name: '10-Trade Win Streak', defaultQuote: 'Consistency is built trade by trade, setup by setup.' },
    { name: 'Discipline Master', defaultQuote: 'Zero rules broken. The process is the ultimate win.' },
    { name: 'Profit Multiplier', defaultQuote: 'Letting winners run while cutting losers quickly.' }
  ];

  const handleAchievementChange = (achName: string) => {
    setAchievement(achName);
    const selected = achievements.find(a => a.name === achName);
    if (selected) {
      setQuote(selected.defaultQuote);
    }
  };

  const handleExportPNG = () => {
    setExporting(true);

    // Dynamic Canvas Draw
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Theme gradients
    let grad = ctx.createLinearGradient(0, 0, 800, 450);
    if (theme === 'violet') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#311042');
      grad.addColorStop(1, '#0f172a');
    } else if (theme === 'emerald') {
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#064e3b');
      grad.addColorStop(1, '#080c14');
    } else if (theme === 'gold') {
      grad.addColorStop(0, '#422006');
      grad.addColorStop(0.5, '#2e1d0c');
      grad.addColorStop(1, '#0c0a09');
    } else { // slate/blue
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#080c14');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    // Subtle accent grids/patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 450);
      ctx.stroke();
    }
    for (let j = 0; j < 450; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(800, j);
      ctx.stroke();
    }

    // Outer Neon border
    let borderGrad = ctx.createLinearGradient(0, 0, 800, 450);
    if (theme === 'violet') {
      borderGrad.addColorStop(0, '#8b5cf6');
      borderGrad.addColorStop(1, '#ec4899');
    } else if (theme === 'emerald') {
      borderGrad.addColorStop(0, '#10b981');
      borderGrad.addColorStop(1, '#14b8a6');
    } else if (theme === 'gold') {
      borderGrad.addColorStop(0, '#f59e0b');
      borderGrad.addColorStop(1, '#d97706');
    } else {
      borderGrad.addColorStop(0, '#3b82f6');
      borderGrad.addColorStop(1, '#10b981');
    }

    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 794, 444);

    // Inner panel
    ctx.fillStyle = 'rgba(8, 12, 20, 0.4)';
    ctx.fillRect(30, 30, 740, 390);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, 740, 390);

    // Text Draw: Gully Trader logo watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.font = 'bold 36px "Outfit", "Arial"';
    ctx.fillText('GULLY TRADER', 50, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px "Inter", "Arial"';
    ctx.fillText('gullytrader.in', 50, 102);

    // Achievement badge text
    ctx.fillStyle = '#3b82f6';
    if (theme === 'violet') ctx.fillStyle = '#c084fc';
    if (theme === 'emerald') ctx.fillStyle = '#34d399';
    if (theme === 'gold') ctx.fillStyle = '#fbbf24';

    ctx.font = '900 12px "Outfit", "Arial"';
    ctx.fillText('ACHIEVEMENT UNLOCKED', 50, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Outfit", "Arial"';
    ctx.fillText(achievement, 50, 215);

    // Statistic Line
    ctx.fillStyle = '#10b981';
    if (theme === 'violet') ctx.fillStyle = '#f472b6';
    if (theme === 'gold') ctx.fillStyle = '#f59e0b';
    ctx.font = '800 28px "Outfit", "Arial"';
    ctx.fillText(statLine, 50, 265);

    // Trader Name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 16px "Outfit", "Arial"';
    ctx.fillText(`TRADER: ${traderName.toUpperCase()}`, 50, 320);

    // Quote
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'italic 15px "Inter", "Arial"';
    // Handle quote wrapping
    const words = quote.split(' ');
    let line = '';
    let y = 360;
    const maxWidth = 550;
    const lineHeight = 22;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 50, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 50, y);

    // Branding / Badge icon
    ctx.save();
    ctx.beginPath();
    ctx.arc(670, 225, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.stroke();
    ctx.restore();

    // Small ribbon badge symbol
    ctx.fillStyle = '#3b82f6';
    ctx.font = '50px "Outfit"';
    ctx.fillText('🏆', 645, 240);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `gully_trader_${achievement.toLowerCase().replace(/ /g, '_')}.png`;
    link.href = dataUrl;
    link.click();
    setExporting(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://gullytrader.in/verify/card-001293');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeColors = {
    slate: 'from-blue-600 via-slate-900 to-slate-950 border-blue-500/20',
    violet: 'from-purple-800 via-[#1e102f] to-[#0f0c1b] border-purple-500/20',
    emerald: 'from-teal-850 via-[#0a231c] to-[#040e0b] border-teal-500/20',
    gold: 'from-amber-900 via-[#27190b] to-[#120b05] border-amber-500/20'
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        
        {/* Left Side Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md space-y-4">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-4">
              <Award className="h-5 w-5 text-blue-500" />
              Customize Performance Card
            </h3>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Trader Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={traderName}
                  onChange={(e) => setTraderName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Achievement Type</label>
              <select
                value={achievement}
                onChange={(e) => handleAchievementChange(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {achievements.map(a => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Stat line</label>
              <input
                type="text"
                value={statLine}
                onChange={(e) => setStatLine(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Appreciation Quote</label>
              <textarea
                rows={3}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none"
              />
            </div>

            {/* Themes */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Card Gradient Theme</label>
              <div className="flex gap-2">
                {(['slate', 'violet', 'emerald', 'gold'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`h-7 w-7 rounded-full border transition-all ${
                      theme === t ? 'border-white scale-110 ring-1 ring-blue-500' : 'border-slate-800'
                    }`}
                    style={{
                      background: t === 'violet' 
                        ? 'linear-gradient(to right, #8b5cf6, #3b0764)' 
                        : t === 'emerald' 
                        ? 'linear-gradient(to right, #10b981, #064e3b)' 
                        : t === 'gold' 
                        ? 'linear-gradient(to right, #f59e0b, #451a03)' 
                        : 'linear-gradient(to right, #3b82f6, #0f172a)'
                    }}
                    title={`${t} Theme`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md flex flex-col justify-between h-full">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-blue-500" />
              Social Card Preview
            </h3>

            {/* Achievement Card Box */}
            <div 
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-8 flex flex-col justify-between shadow-2xl h-80 ${themeColors[theme]}`}
            >
              {/* Background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              
              {/* Card top */}
              <div className="flex justify-between items-start z-10">
                <div className="leading-tight">
                  <span className="text-sm font-extrabold tracking-wider text-slate-200">GULLY TRADER</span>
                  <p className="text-[10px] text-slate-500 lowercase font-bold mt-0.5">gullytrader.in</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl">
                  🏆
                </div>
              </div>

              {/* Card middle */}
              <div className="z-10 mt-4">
                <span className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase">ACHIEVEMENT UNLOCKED</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">{achievement}</h2>
                <h3 className={`text-xl font-bold mt-1 ${theme === 'slate' ? 'text-emerald-400' : theme === 'violet' ? 'text-pink-400' : theme === 'emerald' ? 'text-teal-400' : 'text-amber-400'}`}>
                  {statLine}
                </h3>
              </div>

              {/* Card bottom */}
              <div className="z-10 mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
                <div className="max-w-[70%]">
                  <p className="text-xs italic text-slate-400 line-clamp-2">"{quote}"</p>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mt-2">TRADER: {traderName}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-bold text-slate-300">
                  <Sparkles className="h-3 w-3 text-teal-400" />
                  VERIFIED LEDGER
                </div>
              </div>
            </div>

            {/* Actions buttons */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={handleExportPNG}
                disabled={exporting}
                className="flex-1 rounded-lg bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
              >
                {exporting ? (
                  'Generating Card...'
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PNG Card
                  </>
                )}
              </button>

              <button
                onClick={handleCopyLink}
                className="rounded-lg border border-slate-800 px-4 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    Link Copied
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Copy Ledger Link
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
