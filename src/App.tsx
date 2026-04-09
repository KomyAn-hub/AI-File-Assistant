import { useState, useCallback, useRef, useEffect } from "react";
import type { FileRecord, AppMode, ClassificationResult } from "./lib/types";
import { classifyOffline, classifyWithAI } from "./lib/classifier";

const ANALYZING_STEPS = [
  "Reading filename...",
  "Extracting metadata...",
  "Consulting Claude AI...",
  "Matching category rules...",
  "Generating folder path...",
];

const EXAMPLES = [
  { name: "marketing_strategy_q2.docx",  content: "Campaign audience targeting, brand awareness initiatives, social media strategy Q2 2026" },
  { name: "vendor_agreement_2026.pdf",    content: "This NDA agreement entered between parties. Confidential terms, effective date, clauses apply." },
  { name: "invoice_apr_techcorp.xlsx",    content: "Invoice #4421 payment due $12,400 VAT 20% total amount payable billing cycle April" },
  { name: "product_roadmap_2026.pptx",   content: "Q1 Q2 objectives key results strategic initiative AI integration timeline milestones" },
  { name: "hr_onboarding_policy.docx",   content: "Employee onboarding checklist benefits policy handbook new hire orientation probation" },
  { name: "engineering_api_spec.md",     content: "REST API endpoints authentication OAuth2 deployment version control function definitions" },
];

const FOLDER_TREE: { label: string; children: string[] }[] = [
  { label: "Legal",       children: ["Contracts", "NDAs", "Compliance"] },
  { label: "Marketing",   children: ["Campaigns", "Assets", "Analytics"] },
  { label: "Finance",     children: ["Invoices", "Reports", "Budgets"] },
  { label: "Management",  children: ["Strategy", "OKRs", "Board"] },
  { label: "HR",          children: ["Policies", "Onboarding", "Reviews"] },
  { label: "Engineering", children: ["Docs", "Specs", "Runbooks"] },
  { label: "Sales",       children: ["Proposals", "Contracts", "CRM"] },
  { label: "Reports",     children: ["Analytics", "Weekly", "Quarterly"] },
  { label: "General",     children: ["Unsorted", "Archive"] },
];

function confColor(c: number) {
  return c >= 90 ? "#0F6E56" : c >= 70 ? "#185FA5" : "#BA7517";
}

function AnalyzingIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
      <div style={{
        width: 16, height: 16, flexShrink: 0,
        border: "2px solid #E6F1FB", borderTop: "2px solid #185FA5",
        borderRadius: "50%", animation: "aia-spin .75s linear infinite",
      }} />
      <span style={{ fontSize: 12, color: "#185FA5", fontWeight: 500 }}>
        {ANALYZING_STEPS[step % ANALYZING_STEPS.length]}
      </span>
    </div>
  );
}

function CountdownBar({ seconds, total, onCancel }: { seconds: number; total: number; onCancel: () => void }) {
  const pct = Math.round((seconds / total) * 100);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#BA7517" }}>
          Auto-moving in {seconds}s...
        </span>
        <button
          onClick={onCancel}
          style={{ fontSize: 11, padding: "2px 10px", borderRadius: 4, border: "none", background: "#FCEBEB", color: "#791F1F", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "#F1EFE8", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2, background: "#BA7517",
          width: pct + "%", transition: "width 1s linear",
        }} />
      </div>
    </div>
  );
}

function FolderTreePanel({ highlight }: { highlight: string[] }) {
  return (
    <div>
      {FOLDER_TREE.map((node) => {
        const isHL = highlight[0] === node.label;
        return (
          <div key={node.label} style={{ marginBottom: 1 }}>
            <div style={{
              fontFamily: "monospace", fontSize: 11, lineHeight: "20px",
              padding: "1px 5px", borderRadius: 4, marginLeft: -4,
              background: isHL ? "#E6F1FB" : "transparent",
              color: isHL ? "#0C447C" : "var(--color-text-primary)",
              fontWeight: isHL ? 600 : 400,
              transition: "background .3s, color .3s",
            }}>
              {isHL ? "\u25BC" : "\u25BA"} {"\uD83D\uDCC1"} {node.label}
            </div>
            {isHL && node.children.map((child) => {
              const childHL = highlight[1] === child;
              return (
                <div key={child} style={{
                  fontFamily: "monospace", fontSize: 11, lineHeight: "20px",
                  paddingLeft: 18, borderRadius: 4,
                  background: childHL ? "#E1F5EE" : "transparent",
                  color: childHL ? "#085041" : "var(--color-text-secondary)",
                  fontWeight: childHL ? 600 : 400,
                  transition: "background .3s, color .3s",
                }}>
                  {childHL ? "\u25BC" : "\u25BA"} {"\uD83D\uDCC2"} {child}
                  {childHL && (
                    <div style={{
                      paddingLeft: 18, fontSize: 11, lineHeight: "20px",
                      color: "#BA7517", fontWeight: 600, background: "#FAEEDA", borderRadius: 4,
                    }}>
                      {"\uD83D\uDCC4"} \u2190 {highlight[2] ?? "2026"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function TeamsAdaptiveCard({
  file,
  onMoveNow,
  onDismiss,
}: {
  file: FileRecord;
  onMoveNow: () => void;
  onDismiss: () => void;
}) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
  
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.50)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 8,
        width: 360,
        overflow: "hidden",
        border: "1.5px solid #6264A7",
        boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
      }}>
        <div style={{ background: "#6264A7", padding: "11px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, background: "#fff", borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#6264A7", flexShrink: 0,
          }}>T</div>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>AI File Assistant</span>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginLeft: "auto" }}>RemindIT</span>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 500, color: "#6264A7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Reminder
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 500, color: "#111" }}>
            File needs organizing
          </p>
          <div style={{ background: "#f5f5f5", borderRadius: 6, padding: "10px 12px", marginBottom: 14 }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#333" }}>
              <strong style={{ color: "#111" }}>{"\uD83D\uDCC4"} {file.name}</strong>
            </p>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#555" }}>
              Suggested location:
            </p>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#6264A7" }}>
              {"\uD83D\uDCC1"} {file.result?.suggestedPath}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#777" }}>
              Confidence: <strong style={{ color: "#333" }}>{file.result?.confidence}%</strong>
              {" \u00B7 "}{file.result?.reason}
            </p>
          </div>
          <div style={{ background: "#FFF8E1", borderRadius: 6, padding: "8px 10px", marginBottom: 14, fontSize: 11, color: "#7B4F00" }}>
            <strong>Demo mode:</strong> in production, this card appears in Teams chat from the AI File Assistant bot.
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onMoveNow} style={{
              flex: 1, background: "#6264A7", color: "#fff",
              border: "none", borderRadius: 4, padding: "10px 0",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}>
              Move Now
            </button>
            <button onClick={onDismiss} style={{
              flex: 1, background: "#f5f5f5", color: "#333",
              border: "1px solid #ddd", borderRadius: 4, padding: "10px 0",
              fontSize: 14, cursor: "pointer",
            }}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropZone({ onDrop }: { onDrop: (name: string, content: string) => void }) {
  const [over, setOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string | null) ?? "";
      onDrop(file.name, text.slice(0, 500));
    };
    reader.onerror = () => onDrop(file.name, "");
    reader.readAsText(file);
  }, [onDrop]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${over ? "#185FA5" : "#ccc"}`,
        borderRadius: 10, padding: "18px 12px", textAlign: "center",
        background: over ? "#E6F1FB" : "#fafafa",
        transition: "all .2s", marginBottom: 10, cursor: "default",
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 5, lineHeight: 1 }}>{"\uD83D\uDCE5"}</div>
      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: over ? 500 : 400, color: over ? "#185FA5" : "#555" }}>
        {over ? "Drop to analyze!" : "Drag & drop a file here"}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: "#999" }}>
        .docx .pdf .xlsx .md — FileReader extracts name + first 500 chars
      </p>
    </div>
  );
}

function FileCard({
  file,
  onMove,
  onRemind,
  onCancelMove,
  onFeedback,
}: {
  file: FileRecord;
  onMove: (id: string) => void;
  onRemind: (id: string) => void;
  onCancelMove: (id: string) => void;
  onFeedback: (id: string, v: "positive" | "negative") => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (file.status !== "analyzing") return;
    const t = setInterval(() => setStepIdx((s) => s + 1), 520);
    return () => clearInterval(t);
  }, [file.status]);

  const borderColor = {
    analyzing: "#7F77DD", classified: "#185FA5",
    moving: "#BA7517", moved: "#0F6E56", reminded: "#6264A7",
  }[file.status];

  const [badgeLabel, badgeBg, badgeFg] = {
    analyzing:  ["Analyzing...",  "#EEEDFE", "#3C3489"],
    classified: ["Classified",    "#E6F1FB", "#0C447C"],
    moving:     ["Moving...",     "#FAEEDA", "#633806"],
    moved:      ["Moved \u2713",  "#E1F5EE", "#085041"],
    reminded:   ["Reminded",      "#EEEDFE", "#3C3489"],
  }[file.status] as [string, string, string];

  return (
  
    <div style={{
      background: "#fff",
      border: "0.5px solid #e0e0e0",
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 10,
      transition: "border-color .4s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>{"\uD83D\uDCC4"}</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111", wordBreak: "break-all", minWidth: 0 }}>
            {file.name}
          </span>
          <span style={{ flexShrink: 0, background: badgeBg, color: badgeFg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {badgeLabel}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#999", flexShrink: 0 }}>{file.timeLabel}</span>
      </div>

      {file.status === "analyzing" && <AnalyzingIndicator step={stepIdx} />}

      {file.result && file.status !== "analyzing" && (
        <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 7 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Category</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{file.result.category}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Suggested path</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#185FA5" }}>{"\uD83D\uDCC1"} {file.result.suggestedPath}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Confidence</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: confColor(file.result.confidence) }}>
                {file.result.confidence}%
              </div>
            </div>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "#e0e0e0", overflow: "hidden", marginBottom: 7 }}>
            <div style={{ height: "100%", borderRadius: 2, background: confColor(file.result.confidence), width: file.result.confidence + "%", transition: "width .6s ease" }} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#777" }}>
            {"\uD83D\uDCA1"} {file.result.reason}
          </p>
        </div>
      )}

      {file.status === "moving" && file.moveCountdown !== undefined && (
        <CountdownBar seconds={file.moveCountdown} total={3} onCancel={() => onCancelMove(file.id)} />
      )}

      {file.status === "classified" && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => onMove(file.id)}
            style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Move to {file.result?.suggestedPath.split("/")[0]}
          </button>
          <button
            onClick={() => onRemind(file.id)}
            style={{ background: "#fff", color: "#6264A7", border: "1px solid #6264A7", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}
          >
            Remind me later
          </button>
        </div>
      )}

      {file.status === "moved" && (
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: "0 0 7px", fontSize: 13, fontWeight: 500, color: "#0F6E56" }}>
            {"\u2705"} Moved to {file.result?.suggestedPath}
          </p>
          {!file.feedback ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#888" }}>AI self-learning:</span>
              <button onClick={() => onFeedback(file.id, "positive")} style={{ background: "#E1F5EE", color: "#085041", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                {"\uD83D\uDC4D"} Correct
              </button>
              <button onClick={() => onFeedback(file.id, "negative")} style={{ background: "#FCEBEB", color: "#791F1F", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                {"\uD83D\uDC4E"} Wrong folder
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: file.feedback === "positive" ? "#0F6E56" : "#A32D2D" }}>
              {file.feedback === "positive"
                ? "\u2713 Feedback saved \u2014 model confidence +1 for this category"
                : "\u2717 Feedback saved \u2014 AI will re-evaluate this category next time"}
            </p>
          )}
        </div>
      )}

      {file.status === "reminded" && (
        <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 500, color: "#534AB7" }}>
          {"\u23F0"} Reminder sent \u2014 Teams notification delivered to bot channel
        </p>
      )}
    </div>
  );
}

export default function App() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<AppMode>("suggestion");
  const [useAI, setUseAI] = useState(false);
  const [activeHL, setActiveHL] = useState<string[]>([]);
  const [stats, setStats] = useState({ classified: 0, moved: 0, reminded: 0 });

  const [teamsCard, setTeamsCard] = useState<FileRecord | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const processFile = useCallback(async (name: string, body: string) => {
    if (!name.trim()) return;
    const id = Date.now().toString();
    const now = new Date();
    const timeLabel = now.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });

    setFiles((prev) => [
      { id, name: name.trim(), content: body, result: null, status: "analyzing", timestamp: now, timeLabel },
      ...prev,
    ]);

    await new Promise<void>((res) => setTimeout(res, 800 + Math.random() * 500));

    const result: ClassificationResult = useAI
      ? await classifyWithAI(name, body)
      : classifyOffline(name, body);

    setActiveHL(result.highlightPath);
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, result, status: "classified" } : f));
    setStats((s) => ({ ...s, classified: s.classified + 1 }));

    if (mode === "auto") {
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "moving", moveCountdown: 3 } : f));
      let count = 3;
      const t = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(t);
          delete timers.current[id];
          setFiles((prev) => prev.map((f) =>
            f.id === id && f.status === "moving"
              ? { ...f, status: "moved", movedTo: result.suggestedPath, moveCountdown: undefined }
              : f
          ));
          setStats((s) => ({ ...s, moved: s.moved + 1 }));
        } else {
          setFiles((prev) => prev.map((f) =>
            f.id === id && f.status === "moving" ? { ...f, moveCountdown: count } : f
          ));
        }
      }, 1000);
      timers.current[id] = t;
    }
  }, [mode, useAI]);

  const analyze = useCallback(() => {
    processFile(filename, content);
    setFilename("");
    setContent("");
  }, [filename, content, processFile]);

  const onMove = useCallback((id: string) => {
    setFiles((p) => p.map((f) => f.id === id && f.result ? { ...f, status: "moved", movedTo: f.result.suggestedPath } : f));
    setStats((s) => ({ ...s, moved: s.moved + 1 }));
    setTeamsCard(null);
  }, []);

  const onRemind = useCallback((id: string) => {
    setFiles((p) => {
      const updated = p.map((f) => f.id === id ? { ...f, status: "reminded" as const } : f);
    
      const target = updated.find((f) => f.id === id) ?? null;
      setTeamsCard(target);
      return updated;
    });
    setStats((s) => ({ ...s, reminded: s.reminded + 1 }));
  }, []);

  const onCancelMove = useCallback((id: string) => {
    if (timers.current[id]) { clearInterval(timers.current[id]); delete timers.current[id]; }
    setFiles((p) => p.map((f) => f.id === id ? { ...f, status: "classified", moveCountdown: undefined } : f));
  }, []);

  const onFeedback = useCallback((id: string, v: "positive" | "negative") => {
    setFiles((p) => p.map((f) => f.id === id ? { ...f, feedback: v } : f));
  }, []);

  return (
    <>
      <style>{`
        @keyframes aia-spin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing: border-box; }
        input, textarea, button { font-family: inherit; }
      `}</style>
      {teamsCard && (
        <TeamsAdaptiveCard
          file={teamsCard}
          onMoveNow={() => { onMove(teamsCard.id); }}
          onDismiss={() => setTeamsCard(null)}
        />
      )}

      <div style={{ width: 860, margin: "0 auto", paddingBottom: 48, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "#0D1B3E", padding: "18px 24px 20px", borderRadius: "0 0 14px 14px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, background: "#185FA5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {"\uD83D\uDCC1"}
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 500 }}>AI File Assistant</div>
              <div style={{ color: "#B5D4F4", fontSize: 12 }}>SortIT + RemindIT — Microsoft Teams Integration</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {(
              [["Classified", stats.classified, "#B5D4F4"],
               ["Moved",      stats.moved,      "#9FE1CB"],
               ["Reminded",   stats.reminded,   "#FAC775"]] as [string, number, string][]
            ).map(([label, value, color]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 500, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "#7B9FC9", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 210px", gap: 14 }}>
            <div>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 500, color: "#555" }}>Operating mode</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {(["suggestion", "auto"] as AppMode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)} style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                      fontWeight: mode === m ? 500 : 400, transition: "all .15s",
                      border: "1px solid",
                      borderColor: mode === m ? "#185FA5" : "#ddd",
                      background: mode === m ? "#185FA5" : "#fff",
                      color: mode === m ? "#fff" : "#555",
                    }}>
                      {m === "suggestion" ? "\uD83D\uDCAC Suggestion" : "\u26A1 Auto-organize"}
                    </button>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto", fontSize: 12, color: "#555", cursor: "pointer" }}>
                    <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                    {useAI ? "\uD83E\uDD16 Claude AI" : "\uD83D\uDD11 Keyword"}
                  </label>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#999" }}>
                  {mode === "suggestion"
                    ? "Non-intrusive: shows recommendation, you decide"
                    : "Auto-organize: 3-second countdown with Cancel before file moves"}
                </p>
              </div>

              <DropZone onDrop={processFile} />
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 500, color: "#555" }}>Or enter manually</p>
                <input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && filename.trim() && analyze()}
                  placeholder="File name (e.g. marketing_brief_q2.docx)"
                  style={{ width: "100%", marginBottom: 8, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }}
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Content preview (optional — paste a few sentences)"
                  rows={2}
                  style={{ width: "100%", resize: "vertical", marginBottom: 10, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, fontFamily: "monospace" }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={analyze}
                    disabled={!filename.trim()}
                    style={{
                      background: filename.trim() ? "#185FA5" : "#ccc",
                      color: "#fff", border: "none", borderRadius: 8,
                      padding: "8px 20px", fontSize: 13, fontWeight: 500,
                      cursor: filename.trim() ? "pointer" : "default",
                    }}
                  >
                    {"\uD83D\uDD0D"} Analyze
                  </button>
                  <span style={{ fontSize: 11, color: "#999" }}>Quick examples:</span>
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.name}
                      onClick={() => { setFilename(ex.name); setContent(ex.content); }}
                      style={{
                        background: "#f5f5f5", color: "#555",
                        border: "1px solid #ddd", borderRadius: 20,
                        padding: "3px 10px", fontSize: 11, cursor: "pointer",
                      }}
                    >
                      {ex.name.split("_")[0]}
                    </button>
                  ))}
                </div>
              </div>
              {files.length > 0 ? (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500, color: "#555" }}>
                    Results ({files.length})
                  </p>
                  {files.map((f) => (
                    <FileCard
                      key={f.id}
                      file={f}
                      onMove={onMove}
                      onRemind={onRemind}
                      onCancelMove={onCancelMove}
                      onFeedback={onFeedback}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "36px 16px", color: "#bbb" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{"\uD83D\uDCC2"}</div>
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500, color: "#888" }}>No files analyzed yet</p>
                  <p style={{ margin: 0, fontSize: 12 }}>Drop a file above or pick an example</p>
                </div>
              )}
            </div>
            <div>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: 14, position: "sticky", top: 16 }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 500, color: "#555" }}>
                  {"\uD83D\uDCC1"} SharePoint structure
                </p>
                <FolderTreePanel highlight={activeHL} />
                {activeHL.length > 0 && (
                  <div style={{ marginTop: 10, padding: "5px 8px", background: "#E1F5EE", borderRadius: 6, fontSize: 11, color: "#085041", fontWeight: 500 }}>
                    {"\u2192"} {activeHL.join("/")}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: "10px 14px", background: "#f8f9fa", borderRadius: 10, border: "1px solid #e8e8e8", fontSize: 12, color: "#999", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <span>
              {"\uD83D\uDD17"}{" "}
              <a href="https://github.com/KomyAn-hub/AI-File-Assistant" target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5" }}>
                github.com/KomyAn-hub/AI-File-Assistant
              </a>
            </span>
            <span>React 18 + TypeScript + Claude API · Ideathon 2026</span>
          </div>
        </div>
      </div>
    </>
  );
}
