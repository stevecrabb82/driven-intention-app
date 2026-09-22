import React, { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Target, Flame, CheckCircle2, X, Save } from "lucide-react";

const categories = [
  { id: "business", label: "Business" },
  { id: "health", label: "Health & Fitness" },
  { id: "financial", label: "Financial" },
  { id: "personal", label: "Personal" },
];

const starter = [
  {
    id: crypto.randomUUID(),
    category: "business",
    title: "Build the next 90 days around the highest-value opportunities",
    why: "Create focus, momentum, and measurable progress.",
    progress: 25,
    priorities: [
      { id: crypto.randomUUID(), text: "Choose the top 3 outcomes for this quarter", done: true },
      { id: crypto.randomUUID(), text: "Block weekly time for the most important next steps", done: false },
    ],
  },
];

function loadGoals() {
  try {
    const raw = localStorage.getItem("driven-intention-goals");
    return raw ? JSON.parse(raw) : starter;
  } catch {
    return starter;
  }
}

export default function App() {
  const [goals, setGoals] = useState(loadGoals);
  const [active, setActive] = useState("all");
  const [editing, setEditing] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = [
    "Clarity creates momentum. Decide what matters, then move.",
    "You do not need the whole staircase. Win the next step.",
    "Your standards shape your future more than your circumstances.",
    "Consistency on the lead measures creates the lag results.",
  ];

  useEffect(() => {
    localStorage.setItem("driven-intention-goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    const t = setInterval(() => setQuoteIndex(i => (i + 1) % quotes.length), 9000);
    return () => clearInterval(t);
  }, []);

  const shown = useMemo(
    () => active === "all" ? goals : goals.filter(g => g.category === active),
    [goals, active]
  );

  const completedPriorities = goals.flatMap(g => g.priorities).filter(p => p.done).length;
  const totalPriorities = goals.flatMap(g => g.priorities).length;
  const score = totalPriorities ? Math.round((completedPriorities / totalPriorities) * 100) : 0;

  function newGoal() {
    setEditing({
      id: crypto.randomUUID(),
      category: active === "all" ? "business" : active,
      title: "",
      why: "",
      progress: 0,
      priorities: [],
      isNew: true,
    });
  }

  function saveGoal(goal) {
    const clean = { ...goal };
    delete clean.isNew;
    setGoals(old => goal.isNew ? [...old, clean] : old.map(g => g.id === goal.id ? clean : g));
    setEditing(null);
  }

  function deleteGoal(id) {
    if (confirm("Delete this 90-day goal?")) setGoals(old => old.filter(g => g.id !== id));
  }

  function togglePriority(goalId, priorityId) {
    setGoals(old => old.map(g => g.id === goalId ? {
      ...g,
      priorities: g.priorities.map(p => p.id === priorityId ? { ...p, done: !p.done } : p)
    } : g));
  }

  return (
    <div className="app-shell">
      <aside>
        <div className="brand"><div className="brand-mark"><span className="wing left">⌁</span><span className="summit">▲</span><span className="wing right">⌁</span></div><div><b>DRIVEN</b><small>INTENTION</small></div></div>
        <nav>
          <button className="nav-active"><Target size={18}/> 90-Day Goals</button>
          <button disabled>Weekly Scorecard <em>Soon</em></button>
          <button disabled>Accountability <em>Soon</em></button>
          <button disabled>Net Worth <em>Soon</em></button>
          <button disabled>Receipts & Projects <em>Soon</em></button>
        </nav>
        <div className="sidebar-note">
          <Flame size={20}/>
          <b>Build the life on purpose.</b>
          <p>Focus on the actions you control. The results follow.</p>
        </div>
      </aside>

      <main>
        <header className="compact-head">
          <div><p className="eyebrow">90-DAY EXECUTION SYSTEM</p><h1>Turn intention into action.</h1><p className="sub">Big goals become real through the next right actions.</p></div>
          <button className="primary" onClick={newGoal}><Plus size={18}/> Add 90-Day Goal</button>
        </header>

        <section className="quote"><span>“</span><p>{quotes[quoteIndex]}</p><small>MINDSET • DISCIPLINE • EXECUTION</small></section>

        <section className="stats">
          <div><small>ACTIVE GOALS</small><strong>{goals.length}</strong><p>Across every area of life</p></div>
          <div><small>PRIORITIES COMPLETE</small><strong>{completedPriorities}/{totalPriorities}</strong><p>Most important next steps</p></div>
          <div><small>EXECUTION SCORE</small><strong>{score}%</strong><p>Based on completed priorities</p></div>
        </section>

        <div className="filters">
          <button className={active === "all" ? "selected" : ""} onClick={() => setActive("all")}>All</button>
          {categories.map(c => <button key={c.id} className={active === c.id ? "selected" : ""} onClick={() => setActive(c.id)}>{c.label}</button>)}
        </div>

        <section className="goal-grid">
          {shown.map(goal => {
            const cat = categories.find(c => c.id === goal.category);
            const done = goal.priorities.filter(p => p.done).length;
            return <article className="goal-card" key={goal.id}>
              <div className="goal-top">
                <span className={"category " + goal.category}>{cat?.label}</span>
                <div><button className="icon" onClick={() => setEditing({...goal})}><Pencil size={16}/></button><button className="icon danger" onClick={() => deleteGoal(goal.id)}><Trash2 size={16}/></button></div>
              </div>
              <h2>{goal.title}</h2>
              {goal.why && <p className="why">{goal.why}</p>}
              <div className="progress-row"><span>Goal progress</span><b>{goal.progress}%</b></div>
              <div className="bar"><i style={{width: goal.progress + "%"}} /></div>
              <div className="next-step-link"><span className={"goal-dot " + goal.category}></span><div><small>WORKING TOWARD</small><b>{goal.title}</b></div></div>
              <div className="priority-head"><b>Next Steps</b><span>{done}/{goal.priorities.length}</span></div>
              <div className="priority-list">
                {goal.priorities.map(p => <button key={p.id} className={"priority " + (p.done ? "done" : "")} onClick={() => togglePriority(goal.id, p.id)}>
                  <CheckCircle2 size={19}/><span>{p.text}</span>
                </button>)}
                {!goal.priorities.length && <p className="empty">No priorities yet. Edit this goal to add your next steps.</p>}
              </div>
              <button className="add-priority" onClick={() => setEditing({...goal, addPriorityNow: true})}><Plus size={16}/> Add Priority</button>
            </article>
          })}
          {!shown.length && <div className="empty-state"><Target size={30}/><h3>No goals here yet.</h3><p>Add a 90-day goal and turn it into concrete next steps.</p><button className="primary" onClick={newGoal}><Plus size={18}/> Add Goal</button></div>}
        </section>
      </main>

      {editing && <GoalModal goal={editing} onClose={() => setEditing(null)} onSave={saveGoal}/>}
    </div>
  );
}

function GoalModal({ goal, onClose, onSave }) {
  const [draft, setDraft] = useState(goal);
  const [newPriority, setNewPriority] = useState("");
  const priorityRef = React.useRef(null);

  useEffect(() => {
    if (goal.addPriorityNow) setTimeout(() => priorityRef.current?.focus(), 100);
  }, []);

  function addPriority() {
    const text = newPriority.trim();
    if (!text) return;
    setDraft(d => ({...d, priorities: [...d.priorities, {id: crypto.randomUUID(), text, done: false}]}));
    setNewPriority("");
  }

  function removePriority(id) {
    setDraft(d => ({...d, priorities: d.priorities.filter(p => p.id !== id)}));
  }

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-head"><div><p className="eyebrow">{draft.isNew ? "NEW 90-DAY GOAL" : "EDIT 90-DAY GOAL"}</p><h2>{draft.isNew ? "What are you committed to achieving?" : "Keep the goal clear and actionable."}</h2></div><button className="icon" onClick={onClose}><X/></button></div>
      <label>Category<select value={draft.category} onChange={e => setDraft({...draft, category:e.target.value})}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
      <label>90-Day Goal<input autoFocus={!goal.addPriorityNow} value={draft.title} onChange={e => setDraft({...draft, title:e.target.value})} placeholder="Example: Close 3 profitable deals this quarter"/></label>
      <label>Why this matters<textarea value={draft.why} onChange={e => setDraft({...draft, why:e.target.value})} placeholder="Connect the goal to the bigger reason behind it."/></label>
      <label>Progress — {draft.progress}%<input className="range" type="range" min="0" max="100" step="5" value={draft.progress} onChange={e => setDraft({...draft, progress:Number(e.target.value)})}/></label>
      <div className="priority-editor">
        <div className="priority-head"><b>Most Important Next Steps</b><span>{draft.priorities.length}</span></div>
        {draft.priorities.map(p => <div className="edit-priority" key={p.id}><input value={p.text} onChange={e => setDraft(d => ({...d, priorities:d.priorities.map(x => x.id === p.id ? {...x,text:e.target.value} : x)}))}/><button className="icon danger" onClick={() => removePriority(p.id)}><Trash2 size={16}/></button></div>)}
        <div className="new-priority"><input ref={priorityRef} value={newPriority} onChange={e => setNewPriority(e.target.value)} onKeyDown={e => e.key === "Enter" && addPriority()} placeholder="Add a 5-minute next step or key priority..."/><button onClick={addPriority}><Plus size={17}/> Add</button></div>
      </div>
      <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!draft.title.trim()} onClick={() => onSave(draft)}><Save size={17}/> Save Goal</button></div>
    </div>
  </div>
}