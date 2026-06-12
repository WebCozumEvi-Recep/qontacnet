export default function NFCCardMockup() {
  return (
    <div className="relative flex items-center justify-center">
      {/* NFC wave rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="nfc-wave absolute w-48 h-48 rounded-full border border-amber-400/40" />
        <div className="nfc-wave-2 absolute w-64 h-64 rounded-full border border-amber-400/25" />
        <div className="nfc-wave-3 absolute w-80 h-80 rounded-full border border-amber-400/15" />
      </div>

      {/* Card */}
      <div className="float relative z-10 w-72 h-44 rounded-2xl overflow-hidden pulse-glow"
        style={{
          background: "linear-gradient(135deg, #141210 0%, #1c1a17 50%, #0c0b0a 100%)",
          border: "1px solid rgba(212, 175, 55,0.3)"
        }}>
        {/* Shine */}
        <div className="absolute inset-0 opacity-30"
          style={{ background: "linear-gradient(135deg, rgba(212, 175, 55,0.2) 0%, transparent 50%, rgba(169, 130, 31,0.2) 100%)" }} />

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(212, 175, 55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-amber-400/70 font-mono tracking-widest mb-1">NETWORK CARD</div>
              <div className="text-2xl font-bold tracking-wider text-white">QONTAC</div>
            </div>
            {/* NFC icon */}
            <div className="flex flex-col items-end gap-0.5 mt-1">
              <div className="w-4 h-0.5 rounded-full bg-amber-400/60" />
              <div className="w-5 h-0.5 rounded-full bg-amber-400/80" />
              <div className="w-6 h-0.5 rounded-full bg-amber-400" />
              <div className="text-[8px] text-amber-400/60 mt-1 font-mono">NFC</div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            {/* QR placeholder */}
            <div className="w-12 h-12 rounded-lg border border-white/20 grid grid-cols-3 gap-px p-1.5 opacity-70">
              {Array.from({length: 9}).map((_, i) => (
                <div key={i} className={`rounded-sm ${[0,1,3,5,6,8].includes(i) ? "bg-white" : "bg-transparent"}`} />
              ))}
            </div>

            <div className="text-right">
              <div className="text-[10px] text-[#AAB3C5] font-mono">qontac.net</div>
              <div className="w-16 h-0.5 mt-1 rounded-full" style={{ background: "linear-gradient(90deg, #d4af37, #a9821f)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
