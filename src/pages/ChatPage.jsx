import { useState, useRef, useEffect } from "react";
import { askAI } from "../services/api";
import DataTable from "../components/DataTable";
import SqlTag from "../components/SqlTag";

const s = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    padding: "24px 32px",
    background: "transparent",
  },
  chatContent: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    paddingBottom: "40px",
  },
  msgWrap: (role) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: role === "user" ? "flex-end" : "flex-start",
    gap: "12px",
  }),
  bubble: (role) => ({
    maxWidth: role === "user" ? "600px" : "100%",
    padding: "16px 24px",
    borderRadius: "24px",
    background: role === "user" ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    fontSize: "15px",
    border: role === "user" ? "none" : "1px solid var(--glass-border)",
    lineHeight: "1.6",
    boxShadow: role === "user" ? "0 8px 32px rgba(124, 77, 255, 0.2)" : "none",
  }),
  inputSection: {
    marginTop: "auto",
    paddingTop: "20px",
  },
  capsuleInput: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid var(--glass-border)",
    borderRadius: "50px",
    padding: "6px 6px 6px 24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "15px",
    padding: "12px 0",
    outline: "none",
    resize: "none",
  },
  sendBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "var(--accent)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 4px 15px rgba(124, 77, 255, 0.3)",
  },
};

// ✅ rows தவிர மற்றதை save பண்ணு
const serializeMessages = (msgs) =>
  msgs.slice(-50).map((m) => ({
    ...m,
    rows: [],
    columns: m.columns || [],
  }));

// ✅ messages → AI history format
const buildHistory = (messages) =>
  messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content:
        m.role === "user"
          ? m.text
          : [m.explanation, m.sql].filter(Boolean).join(" | "),
    }))
    .filter((m) => m.content?.trim());

export default function ChatPage({ activeConnId }) {
  const storageKey = `chat_history_${activeConnId}`;

  const [messages, setMessages] = useState(() => {
    if (!activeConnId) return [];
    try {
      const saved = localStorage.getItem(`chat_history_${activeConnId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  // ✅ latest messages ref - send() closure issue fix
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const isDisabled = !activeConnId || loading;

  // ✅ Connection மாறும்போது history load
  useEffect(() => {
    if (!activeConnId) return;
    try {
      const saved = localStorage.getItem(`chat_history_${activeConnId}`);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [activeConnId]);

  // ✅ messages மாறும்போது localStorage save
  useEffect(() => {
    if (!activeConnId || messages.length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(serializeMessages(messages)));
    } catch {}
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearHistory = () => {
    localStorage.removeItem(storageKey);
    setMessages([]);
  };

  const send = async (text, confirm = false) => {
    const prompt = (text || input).trim();
    if (!prompt || loading) return;

    if (!confirm) {
      setInput("");
      setMessages((p) => [...p, { role: "user", text: prompt }]);
    }

    // ✅ Current messages-இருந்து history build பண்ணு
    const history = buildHistory(messagesRef.current);

    setLoading(true);
    try {
      const data = await askAI(prompt, history, confirm);

      // ✅ SELECT sql வந்து rows இல்லன்னா re-execute
      if (
        data.type === "select" &&
        data.sql &&
        (!data.rows || data.rows.length === 0) &&
        !data.form_fields?.length &&
        !data.needs_confirmation
      ) {
        try {
          const retryData = await askAI(data.sql, history, false);
          setMessages((p) => [
            ...p,
            {
              role: "assistant",
              ...retryData,
              explanation: data.explanation || retryData.explanation,
              sql: data.sql,
              originalPrompt: prompt,
            },
          ]);
        } catch {
          setMessages((p) => [
            ...p,
            { role: "assistant", ...data, originalPrompt: prompt },
          ]);
        }
        return;
      }

      setMessages((p) => [
        ...p,
        { role: "assistant", ...data, originalPrompt: prompt },
      ]);

      // 🔥 AUTO-REFRESH after INSERT/UPDATE/DELETE
      const justExecuted =
        data.type === "insert" ||
        data.type === "update" ||
        (confirm && data.type === "delete");

      if (justExecuted) {
        const sql =
          data.sql ||
          (data.queries && data.queries[data.queries.length - 1]) ||
          "";
        const tableMatch = sql.match(/(?:FROM|INTO|UPDATE)\s+[`"]?(\w+)[`"]?/i);
        if (tableMatch?.[1]) {
          setTimeout(() => {
            send(`show all records in ${tableMatch[1]} table`, false);
          }, 1000);
        }
      }
    } catch (e) {
      let msg = e.message;
      if (e.response?.status === 403) {
        msg = "⚠️ Access Denied: This action requires Administrator privileges. Go to Settings and set your connection role to Admin.";
      } else if (e.response?.data?.detail) {
        msg = e.response.data.detail;
      }
      setMessages((p) => [...p, { role: "error", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={s.root}>
      <div style={s.chatContent}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: 0.8 }}>
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>✨</div>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#fff", textAlign: "center" }}>
              Hi, I'm your AI Data Assistant
            </div>
            <div style={{ fontSize: "16px", color: "var(--text2)", marginTop: "12px", textAlign: "center", maxWidth: "400px" }}>
              {activeConnId
                ? "Ask me anything about your database in plain English."
                : "Please select a database connection in the sidebar to begin."}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} style={s.msgWrap(m.role)}>
                <div style={s.bubble(m.role)}>
                  {m.role === "assistant" ? (
                    <>
                      {m.explanation && (
                        <div style={{ marginBottom: 16 }}>{m.explanation}</div>
                      )}

                      {/* DYNAMIC FORM */}
                      {m.form_fields && m.form_fields.length > 0 && (
                        <div style={{
                          background: "rgba(255, 255, 255, 0.03)", padding: "20px",
                          borderRadius: "20px", border: "1px solid var(--glass-border)", marginTop: "12px",
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {m.form_fields.map((field) => (
                              <div key={field} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text3)", textTransform: "uppercase" }}>
                                  {field}
                                </label>
                                <input
                                  className="form-input-dynamic"
                                  placeholder={`Enter ${field}...`}
                                  style={{
                                    background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--glass-border)",
                                    padding: "10px 14px", borderRadius: "12px", color: "#fff", fontSize: "14px", outline: "none",
                                  }}
                                  id={`field-${field}-${i}`}
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const values = m.form_fields.map((f) => {
                                  const val = document.getElementById(`field-${f}-${i}`).value;
                                  return `${f}="${val}"`;
                                }).join(", ");
                                send(`Add new record to the ${m.table_hint || "correct"} table with these values: ${values}`);
                              }}
                              style={{
                                background: "var(--accent)", color: "#fff", padding: "12px",
                                borderRadius: "14px", fontWeight: "700", fontSize: "13px", marginTop: "8px",
                              }}
                            >
                              SUBMIT DATA
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SQL TAGS */}
                      {m.queries && m.queries.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {m.queries.map((q, j) => <SqlTag key={j} sql={q} />)}
                        </div>
                      ) : (
                        m.sql && <SqlTag sql={m.sql} />
                      )}

                      {/* DATA TABLE */}
                      {m.type === "select" && (m.rows?.length > 0 || m.columns?.length > 0) && (
                        <div style={{ marginTop: 16 }}>
                          <DataTable rows={m.rows || []} columns={m.columns} />
                        </div>
                      )}

                      {/* CONFIRMATION */}
                      {m.needs_confirmation && (
                        <div style={{ marginTop: "20px", borderTop: "1px solid var(--glass-border)", paddingTop: "16px" }}>
                          <div style={{ color: "var(--accent-pink)", fontSize: "13px", marginBottom: "12px" }}>
                            {m.message}
                          </div>
                          <button
                            onClick={() => send(m.originalPrompt, true)}
                            style={{
                              background: "var(--accent)", color: "#fff", padding: "10px 24px",
                              borderRadius: "50px", fontSize: "13px", fontWeight: "800",
                              boxShadow: "0 4px 15px rgba(124, 77, 255, 0.3)",
                            }}
                          >
                            CONFIRM AND EXECUTE
                          </button>
                        </div>
                      )}

                      {/* SUCCESS MESSAGE */}
                      {m.message && !m.needs_confirmation && (
                        <div style={{ marginTop: "12px", color: "var(--accent-cyan)", fontSize: "13px" }}>
                          {m.message}
                        </div>
                      )}
                    </>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: "var(--accent)", fontSize: "14px", animation: "pulse 1s infinite" }}>
                Thinking...
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputSection}>
        {messages.length > 0 && (
          <div style={{ textAlign: "right", marginBottom: "8px" }}>
            <button
              onClick={clearHistory}
              style={{ fontSize: "11px", color: "var(--text3)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            >
              🗑 Clear History
            </button>
          </div>
        )}
        <div style={s.capsuleInput}>
          <textarea
            placeholder={activeConnId ? "Enter your goal/prompts here..........." : "Select a connection first..."}
            style={s.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            disabled={isDisabled}
          />
          <button
            style={{ ...s.sendBtn, opacity: isDisabled ? 0.5 : 1 }}
            onClick={() => send()}
            disabled={isDisabled}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}