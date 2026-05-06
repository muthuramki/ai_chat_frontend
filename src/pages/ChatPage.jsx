import { useState, useRef, useEffect, useCallback } from "react";
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
    background:
      role === "user"
        ? "var(--accent)"
        : role === "error"
        ? "rgba(255, 80, 80, 0.08)"
        : "rgba(255, 255, 255, 0.05)",
    color: role === "error" ? "#ff6b6b" : "#fff",
    fontSize: "15px",
    border:
      role === "user"
        ? "none"
        : role === "error"
        ? "1px solid rgba(255,80,80,0.3)"
        : "1px solid var(--glass-border)",
    lineHeight: "1.6",
    boxShadow:
      role === "user" ? "0 8px 32px rgba(124, 77, 255, 0.2)" : "none",
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
    cursor: "pointer",
    border: "none",
    flexShrink: 0,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Serialize messages for localStorage — strip large row arrays to keep
 * storage size small, but preserve all metadata so the UI re-renders correctly.
 */
const serializeMessages = (msgs) =>
  msgs.slice(-50).map((m) => ({
    ...m,
    // Keep a small preview (10 rows) so the restored chat still shows data,
    // but don't store hundreds of rows.
    rows: Array.isArray(m.rows) ? m.rows.slice(0, 10) : [],
    columns: m.columns || [],
  }));

/**
 * Build the last-10-turn history array sent to the backend for context.
 */
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

/**
 * Extract the primary table name from any SQL string.
 * Handles backtick-quoted names and ALTER TABLE patterns.
 */
const extractTableName = (sql) => {
  if (!sql) return null;
  // Covers: FROM `tbl`, INTO `tbl`, UPDATE `tbl`, TABLE `tbl` (ALTER / CREATE)
  const match = sql.match(
    /(?:FROM|INTO|UPDATE|TABLE)\s+[`"]?(\w+)[`"]?/i
  );
  return match?.[1] || null;
};

// Types that should render a data table
const TABLE_DISPLAY_TYPES = new Set(["select", "create_db", "drop_db"]);

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatPage({ activeConnId }) {
  const storageKey = `chat_history_${activeConnId}`;

  // Load persisted history for the active connection on mount / connection switch
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
  const bottomRef = useRef(null);

  // Keep a ref so async callbacks always read the latest messages
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const isDisabled = !activeConnId || loading;

  // ── Switch connection → load that connection's history ────────────────────
  useEffect(() => {
    if (!activeConnId) {
      setMessages([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`chat_history_${activeConnId}`);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
    setInput("");
  }, [activeConnId]);

  // ── Persist messages to localStorage whenever they change ─────────────────
  useEffect(() => {
    if (!activeConnId) return;
    // Don't persist if there's nothing to save
    if (messages.length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(serializeMessages(messages)));
    } catch {
      // Quota exceeded — silently ignore
    }
  }, [messages, storageKey, activeConnId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(storageKey);
    setMessages([]);
  }, [storageKey]);

  // ── Refresh table after write operations ──────────────────────────────────
  const refreshTable = useCallback(async (tableName) => {
    const selectSql = `SELECT * FROM \`${tableName}\` LIMIT 100`;
    try {
      const history = buildHistory(messagesRef.current);
      const data = await askAI(selectSql, history, false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          ...data,
          explanation:
            data.explanation || `Showing updated records in \`${tableName}\`.`,
          sql: selectSql,
        },
      ]);
    } catch (e) {
      console.error("Auto-refresh failed:", e);
    }
  }, []);

  // ── Main send handler ─────────────────────────────────────────────────────
  const send = useCallback(
    async (text, confirm = false) => {
      const prompt = (text !== undefined ? text : input).trim();
      if (!prompt || loading || !activeConnId) return;

      // Only push a user bubble for fresh (non-confirm) messages
      if (!confirm) {
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text: prompt }]);
      }

      const history = buildHistory(messagesRef.current);

      setLoading(true);
      try {
        const data = await askAI(prompt, history, confirm);

        // ── SELECT came back with no rows → retry once with the raw SQL ──
        if (
          data.type === "select" &&
          data.sql &&
          (!data.rows || data.rows.length === 0) &&
          !data.form_fields?.length &&
          !data.needs_confirmation
        ) {
          try {
            const retryData = await askAI(data.sql, history, false);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                ...retryData,
                explanation: data.explanation || retryData.explanation,
                sql: data.sql,
                originalPrompt: prompt,
              },
            ]);
          } catch {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", ...data, originalPrompt: prompt },
            ]);
          }
          return;
        }

        // ── Normal response ───────────────────────────────────────────────
        setMessages((prev) => [
          ...prev,
          { role: "assistant", ...data, originalPrompt: prompt },
        ]);

        // Auto-refresh table after mutating operations
        const shouldRefresh =
          data.type === "insert" ||
          data.type === "update" ||
          data.type === "alter" ||
          (confirm && data.type === "delete");

        if (shouldRefresh) {
          const sql =
            data.sql ||
            (data.queries?.length ? data.queries[data.queries.length - 1] : "");
          const tableName = extractTableName(sql);
          if (tableName) {
            setTimeout(() => refreshTable(tableName), 800);
          }
        }
      } catch (e) {
        // ── Build a user-facing error message ─────────────────────────────
        let msg = "An unexpected error occurred. Please try again.";

        if (e.response?.status === 403) {
          msg =
            "⚠️ Access Denied: This action requires Administrator privileges. Go to Settings and set your connection role to Admin.";
        } else if (e.response?.status === 400) {
          msg =
            e.response?.data?.detail ||
            "⚠️ This query was blocked for safety reasons.";
        } else if (e.response?.data?.detail) {
          msg = e.response.data.detail;
        } else if (e.message) {
          msg = e.message;
        }

        setMessages((prev) => [
          ...prev,
          { role: "error", text: msg },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, activeConnId, refreshTable]
  );

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <div style={s.chatContent}>
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              opacity: 0.8,
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>✨</div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#fff",
                textAlign: "center",
              }}
            >
              Hi, I'm your AI Data Assistant
            </div>
            <div
              style={{
                fontSize: "16px",
                color: "var(--text2)",
                marginTop: "12px",
                textAlign: "center",
                maxWidth: "400px",
              }}
            >
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
                      {/* Explanation text */}
                      {m.explanation && (
                        <div style={{ marginBottom: 16 }}>{m.explanation}</div>
                      )}

                      {/* DYNAMIC INSERT FORM */}
                      {m.form_fields?.length > 0 && (
                        <div
                          style={{
                            background: "rgba(255, 255, 255, 0.03)",
                            padding: "20px",
                            borderRadius: "20px",
                            border: "1px solid var(--glass-border)",
                            marginTop: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px",
                            }}
                          >
                            {m.form_fields.map((field) => (
                              <div
                                key={field}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                }}
                              >
                                <label
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "var(--text3)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  {field}
                                </label>
                                <input
                                  className="form-input-dynamic"
                                  placeholder={`Enter ${field}...`}
                                  style={{
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid var(--glass-border)",
                                    padding: "10px 14px",
                                    borderRadius: "12px",
                                    color: "#fff",
                                    fontSize: "14px",
                                    outline: "none",
                                  }}
                                  id={`field-${field}-${i}`}
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const values = m.form_fields
                                  .map((f) => {
                                    const el = document.getElementById(
                                      `field-${f}-${i}`
                                    );
                                    return `${f}="${el?.value || ""}"`;
                                  })
                                  .join(", ");
                                send(
                                  `Add new record to the ${
                                    m.table_hint || "correct"
                                  } table with these values: ${values}`
                                );
                              }}
                              style={{
                                background: "var(--accent)",
                                color: "#fff",
                                padding: "12px",
                                borderRadius: "14px",
                                fontWeight: "700",
                                fontSize: "13px",
                                marginTop: "8px",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              SUBMIT DATA
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SQL TAG(S) */}
                      {m.queries?.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginTop: m.explanation ? 0 : 0,
                          }}
                        >
                          {m.queries.map((q, j) => (
                            <SqlTag key={j} sql={q} />
                          ))}
                        </div>
                      ) : (
                        m.sql && <SqlTag sql={m.sql} />
                      )}

                      {/* DATA TABLE */}
                      {TABLE_DISPLAY_TYPES.has(m.type) &&
                        (m.rows?.length > 0 || m.columns?.length > 0) && (
                          <div style={{ marginTop: 16 }}>
                            <DataTable
                              rows={m.rows || []}
                              columns={m.columns}
                            />
                          </div>
                        )}

                      {/* SUCCESS / INFO MESSAGE */}
                      {m.message && !m.needs_confirmation && (
                        <div
                          style={{
                            marginTop: "12px",
                            color: "var(--accent-cyan)",
                            fontSize: "13px",
                          }}
                        >
                          {m.message}
                        </div>
                      )}

                      {/* CONFIRMATION PROMPT */}
                      {m.needs_confirmation && (
                        <div
                          style={{
                            marginTop: "20px",
                            borderTop: "1px solid var(--glass-border)",
                            paddingTop: "16px",
                          }}
                        >
                          <div
                            style={{
                              color: "var(--accent-pink)",
                              fontSize: "13px",
                              marginBottom: "12px",
                            }}
                          >
                            {m.message}
                          </div>
                          <button
                            onClick={() => send(m.originalPrompt, true)}
                            style={{
                              background: "var(--accent)",
                              color: "#fff",
                              padding: "10px 24px",
                              borderRadius: "50px",
                              fontSize: "13px",
                              fontWeight: "800",
                              boxShadow: "0 4px 15px rgba(124, 77, 255, 0.3)",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            CONFIRM AND EXECUTE
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* User bubble or Error bubble */
                    m.text
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  color: "var(--accent)",
                  fontSize: "14px",
                  animation: "pulse 1s infinite",
                  paddingLeft: "4px",
                }}
              >
                Thinking...
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div style={s.inputSection}>
        {messages.length > 0 && (
          <div style={{ textAlign: "right", marginBottom: "8px" }}>
            <button
              onClick={clearHistory}
              style={{
                fontSize: "11px",
                color: "var(--text3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              🗑 Clear History
            </button>
          </div>
        )}
        <div style={s.capsuleInput}>
          <textarea
            placeholder={
              activeConnId
                ? "Enter your goal/prompts here..........."
                : "Select a connection first..."
            }
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