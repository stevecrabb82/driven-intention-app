import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, Target, Flame, CheckCircle2, X, Save, RotateCcw,
  CalendarDays, ShieldCheck, Home, ListTodo, BarChart3, DollarSign, FolderKanban,
  FileText, Users, Settings, HelpCircle, BookOpen, Dumbbell, Apple, Droplets,
  Brain, Sun, Moon, ChevronRight, Bell, Clock, BriefcaseBusiness
} from "lucide-react";

const categories = [
  { id: "business", label: "Business" },
  { id: "financial", label: "Financial" },
  { id: "health", label: "Health" },
  { id: "personal", label: "Personal" },
];

const starter = [];

const demoGoalTitles = new Set([
  "Close Hampton 75-Home Community",
  "Increase Net Worth by $500K",
  "Get to 180 lbs",
  "Be the Best Husband and Father",
]);

const standardDefaults = [
  { id: "steps", text: "10K Steps", icon: "steps", scheduleMode: "days", days: [0,1,2,3,4,5,6], weeklyTarget: 7, trackScore: true, trackStreak: true, goalId: "", completions: {} },
  { id: "lift", text: "Lift / Sauna", icon: "lift", scheduleMode: "days", days: [1,2,3,4,5], weeklyTarget: 5, trackScore: true, trackStreak: true, goalId: "", completions: {} },
  { id: "nutrition", text: "Clean Nutrition", icon: "nutrition", scheduleMode: "days", days: [0,1,2,3,4,5,6], weeklyTarget: 7, trackScore: true, trackStreak: true, goalId: "", completions: {} },
  { id: "hydrate", text: "Hydrate", icon: "hydrate", scheduleMode: "days", days: [0,1,2,3,4,5,6], weeklyTarget: 7, trackScore: true, trackStreak: true, goalId: "", completions: {} },
  { id: "mindset", text: "Mindset / Prayer", icon: "mindset", scheduleMode: "days", days: [0,1,2,3,4,5,6], weeklyTarget: 7, trackScore: true, trackStreak: true, goalId: "", completions: {} },
  { id: "read", text: "Read", icon: "read", scheduleMode: "days", days: [0,1,2,3,4,5,6], weeklyTarget: 7, trackScore: true, trackStreak: true, goalId: "", completions: {} },
  { id: "am", text: "AM Review", icon: "am", scheduleMode: "days", days: [1,2,3,4,5], weeklyTarget: 5, trackScore: true, trackStreak: true, goalId: "", completions: {} },
  { id: "pm", text: "PM Review", icon: "pm", scheduleMode: "days", days: [1,2,3,4,5], weeklyTarget: 5, trackScore: true, trackStreak: true, goalId: "", completions: {} },
];

function loadGoals() {
  try {
    const raw = localStorage.getItem("driven-intention-goals");
    const parsed = raw ? JSON.parse(raw) : starter;
    if (!Array.isArray(parsed)) return [];
    const migrated = localStorage.getItem("driven-intention-demo-goals-cleared");
    if (!migrated) {
      const cleaned = parsed.filter(g => !demoGoalTitles.has(g?.title));
      localStorage.setItem("driven-intention-demo-goals-cleared", "1");
      localStorage.setItem("driven-intention-goals", JSON.stringify(cleaned));
      return cleaned;
    }
    return parsed;
  } catch {
    return [];
  }
}

function loadStandards() {
  try {
    const raw = JSON.parse(localStorage.getItem("driven-intention-standards"));
    const source = Array.isArray(raw) && raw.length ? raw : standardDefaults;
    const todayKey = dateKey(new Date());
    return source.map((s, index) => {
      const fallback = standardDefaults.find(d => d.id === s.id) || standardDefaults[index] || {};
      const migratedCompletions = s.completions || (s.done ? { [todayKey]: true } : {});
      return {
        ...fallback,
        ...s,
        scheduleMode: s.scheduleMode || fallback.scheduleMode || "days",
        days: Array.isArray(s.days) && s.days.length ? s.days : (fallback.days || [0,1,2,3,4,5,6]),
        weeklyTarget: Number(s.weeklyTarget || fallback.weeklyTarget || 5),
        trackScore: s.trackScore !== false,
        trackStreak: s.trackStreak !== false,
        goalId: s.goalId || "",
        completions: migratedCompletions,
      };
    });
  } catch {
    return standardDefaults.map(s => ({...s, completions:{}}));
  }
}

const pad = n => String(n).padStart(2, "0");
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = new Date();
const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function standardScheduleLabel(standard) {
  if (standard.scheduleMode === "flexible") return `${standard.weeklyTarget || 1}x this week - flexible`;
  const days = (standard.days || []).map(d => dayLabels[d]);
  if (days.length === 7) return "Every day";
  if (days.join(",") === "Mon,Tue,Wed,Thu,Fri") return "Weekdays";
  return days.join(", ");
}

function StandardIcon({ type, size = 24 }) {
  const map = {
    steps: Flame, lift: Dumbbell, nutrition: Apple, hydrate: Droplets,
    mindset: Brain, read: BookOpen, am: Sun, pm: Moon,
  };
  const Icon = map[type] || CheckCircle2;
  return <Icon size={size}/>;
}

export default function App() {
  const [goals, setGoals] = useState(loadGoals);
  const [editing, setEditing] = useState(null);
  const [standards, setStandards] = useState(loadStandards);
  const [events, setEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("driven-intention-events")) || []; }
    catch { return []; }
  });
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [activePage, setActivePage] = useState("home");
  const [stepEditor, setStepEditor] = useState(null);
  const [standardsEditor, setStandardsEditor] = useState(null);

  useEffect(() => localStorage.setItem("driven-intention-goals", JSON.stringify(goals)), [goals]);
  useEffect(() => localStorage.setItem("driven-intention-standards", JSON.stringify(standards)), [standards]);
  useEffect(() => localStorage.setItem("driven-intention-events", JSON.stringify(events)), [events]);

  const incompleteGoalMoves = useMemo(
    () => goals.flatMap(g => g.priorities.filter(p => !p.done).map(p => ({
      ...p, type: "goal", goalId: g.id, goalTitle: g.title, category: g.category, progress: g.progress
    }))),
    [goals]
  );

  const todayEvents = useMemo(
    () => events.filter(e => e.date === dateKey(today)),
    [events]
  );

  const topMoves = useMemo(() => {
    const scheduledSourceIds = new Set(todayEvents.map(e => e.sourcePriorityId).filter(Boolean));
    const scheduled = todayEvents.map(e => {
      const g = goals.find(x => x.id === e.goalId);
      return {
        id: e.id, text: e.title, type: "event", category: g?.category || "personal",
        goalTitle: g?.title || "Calendar", progress: g?.progress || 0, time: e.time || "",
        sourcePriorityId: e.sourcePriorityId || "", goalId: e.goalId || "", duration: e.duration || 30,
        reminder: e.reminder || "15", repeat: e.repeat || "none", done: Boolean(e.done), date: e.date
      };
    });
    const unscheduled = goals.flatMap(g => g.priorities
      .filter(p => !scheduledSourceIds.has(p.id) && (!p.date || p.date === dateKey(today)) && (!p.done || p.completedDate === dateKey(today)))
      .map(p => ({...p, type:"goal", goalId:g.id, goalTitle:g.title, category:g.category, progress:g.progress})));
    return [...scheduled, ...unscheduled].slice(0, 3);
  }, [todayEvents, goals]);

  const todayKey = dateKey(today);

  function standardDone(standard, key = todayKey) {
    return Boolean(standard.completions?.[key]);
  }

  function toggleStandardCompletion(id, key = todayKey) {
    setStandards(old => old.map(s => {
      if (s.id !== id) return s;
      const completions = {...(s.completions || {})};
      if (completions[key]) delete completions[key];
      else completions[key] = true;
      return {...s, completions};
    }));
  }

  function standardsForDate(key) {
    const d = new Date(key + "T12:00:00");
    return standards.filter(s => s.scheduleMode === "days"
      ? (s.days || []).includes(d.getDay())
      : true);
  }

  const standardsForToday = useMemo(
    () => standardsForDate(todayKey),
    [standards]
  );

  const weeklyStandardStats = useMemo(() => {
    const start = new Date(today);
    const offset = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - offset);
    start.setHours(12,0,0,0);
    let expected = 0;
    let completed = 0;

    standards.filter(s => s.trackScore !== false).forEach(s => {
      if (s.scheduleMode === "flexible") {
        const target = Math.max(1, Number(s.weeklyTarget) || 1);
        expected += target;
        let hits = 0;
        for (let i=0;i<7;i++) {
          const d = new Date(start);
          d.setDate(start.getDate()+i);
          if (d > today) break;
          if (s.completions?.[dateKey(d)]) hits++;
        }
        completed += Math.min(hits, target);
      } else {
        for (let i=0;i<7;i++) {
          const d = new Date(start);
          d.setDate(start.getDate()+i);
          if (d > today) break;
          if ((s.days || []).includes(d.getDay())) {
            expected++;
            if (s.completions?.[dateKey(d)]) completed++;
          }
        }
      }
    });
    return { expected, completed, score: expected ? Math.round((completed/expected)*100) : 100 };
  }, [standards]);

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date(today);
    for (let i=0;i<90;i++) {
      const key = dateKey(cursor);
      const due = standards.filter(s => s.trackStreak !== false && s.scheduleMode === "days" && (s.days || []).includes(cursor.getDay()));
      if (due.length) {
        if (due.every(s => s.completions?.[key])) count++;
        else break;
      }
      cursor.setDate(cursor.getDate()-1);
    }
    return count;
  }, [standards]);

  function saveStandards(nextStandards) {
    const cleaned = nextStandards
      .map(s => ({...s, text: s.text.trim()}))
      .filter(s => s.text);
    if (!cleaned.length) return;
    setStandards(cleaned);
    setStandardsEditor(null);
  }

  function resetStandards() {
    setStandards(standardDefaults.map(s => ({...s, done: false})));
    setStandardsEditor(null);
  }

  function newGoal() {
    setEditing({
      id: crypto.randomUUID(), category: "business", title: "", why: "",
      progress: 0, priorities: [], isNew: true,
    });
  }

  function newStep(goalId = "", date = dateKey(today)) {
    setStepEditor({
      id: crypto.randomUUID(),
      text: "",
      goalId: goalId || goals[0]?.id || "",
      date,
      time: "",
      duration: 30,
      reminder: "15",
      repeat: "none",
      priority: "normal",
      isNew: true,
    });
  }

  function editStep(move) {
    setStepEditor({
      id: move.id,
      text: move.text,
      goalId: move.goalId,
      date: move.date || "",
      time: move.time || "",
      duration: move.duration || 30,
      reminder: move.reminder || "15",
      repeat: move.repeat || "none",
      priority: move.priority || "normal",
      isNew: false,
    });
  }

  function requestNotifications() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }

  function scheduleLocalReminder(step) {
    if (!step.date || !step.time || step.reminder === "none" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const start = new Date(step.date + "T" + step.time);
    const mins = Number(step.reminder) || 0;
    const delay = start.getTime() - Date.now() - mins * 60000;
    if (delay > 0 && delay < 2147483647) {
      setTimeout(() => {
        const goal = goals.find(g => g.id === step.goalId);
        new Notification("Driven Intention", {
          body: step.text + (goal ? " • " + goal.title : ""),
        });
      }, delay);
    }
  }

  function saveStep(step) {
    const goal = goals.find(g => g.id === step.goalId);
    if (!goal || !step.text.trim()) return;

    if (step.isNew) {
      const priority = {
        id: step.id, text: step.text.trim(), done: false,
        date: step.date || "", time: step.time || "", duration: Number(step.duration) || 30,
        reminder: step.reminder, repeat: step.repeat, priority: step.priority
      };
      setGoals(old => old.map(g => g.id === step.goalId ? {...g, priorities:[...g.priorities, priority]} : g));
    } else {
      setGoals(old => old.map(g => g.id === step.goalId ? {
        ...g,
        priorities: g.priorities.map(p => p.id === step.id ? {
          ...p, text:step.text.trim(), date:step.date || "", time:step.time || "",
          duration:Number(step.duration)||30, reminder:step.reminder, repeat:step.repeat, priority:step.priority
        } : p)
      } : g));
    }

    setEvents(old => {
      const without = old.filter(e => e.sourcePriorityId !== step.id);
      if (!step.date) return without;
      const base = {
        id: crypto.randomUUID(), sourcePriorityId: step.id, title: step.text.trim(),
        date: step.date, time: step.time || "", duration: Number(step.duration) || 30,
        goalId: step.goalId, reminder: step.reminder, repeat: step.repeat, done:false
      };
      const generated = [base];
      if (step.repeat === "weekly") {
        for (let i=1;i<=12;i++) {
          const d = new Date(step.date + "T12:00:00");
          d.setDate(d.getDate() + i*7);
          generated.push({...base,id:crypto.randomUUID(),date:dateKey(d)});
        }
      } else if (step.repeat === "daily") {
        for (let i=1;i<=30;i++) {
          const d = new Date(step.date + "T12:00:00");
          d.setDate(d.getDate() + i);
          generated.push({...base,id:crypto.randomUUID(),date:dateKey(d)});
        }
      } else if (step.repeat === "weekdays") {
        let d = new Date(step.date + "T12:00:00");
        let count = 0;
        while (count < 30) {
          d.setDate(d.getDate()+1);
          if (d.getDay() !== 0 && d.getDay() !== 6) {
            generated.push({...base,id:crypto.randomUUID(),date:dateKey(d)});
            count++;
          }
        }
      }
      return [...without, ...generated];
    });

    if (step.reminder !== "none") requestNotifications();
    scheduleLocalReminder(step);
    setStepEditor(null);
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
      priorities: g.priorities.map(p => {
        if (p.id !== priorityId) return p;
        const nextDone = !p.done;
        return { ...p, done: nextDone, completedDate: nextDone ? dateKey(today) : "" };
      })
    } : g));
  }

  function editMove(move) {
    if (move.type === "event" && move.sourcePriorityId && move.goalId) {
      const goal = goals.find(g => g.id === move.goalId);
      const priority = goal?.priorities.find(p => p.id === move.sourcePriorityId);
      if (priority) {
        editStep({
          ...priority,
          id: priority.id,
          goalId: move.goalId,
          date: move.date || priority.date || "",
          time: move.time || priority.time || "",
          duration: move.duration || priority.duration || 30,
          reminder: move.reminder || priority.reminder || "15",
          repeat: move.repeat || priority.repeat || "none",
          priority: move.priority || priority.priority || "normal",
        });
        return;
      }
    }
    editStep(move);
  }

  function completeMove(move) {
    if (move.type === "event") {
      setEvents(old => old.map(e => e.id === move.id ? { ...e, done: true } : e));
      if (move.sourcePriorityId && move.goalId) togglePriority(move.goalId, move.sourcePriorityId);
    } else {
      togglePriority(move.goalId, move.id);
      setEvents(old => old.map(e => e.sourcePriorityId === move.id ? {...e, done:true} : e));
    }
  }

  function addCalendarEvent() {
    const title = prompt("What should be on your calendar?");
    if (!title?.trim()) return;
    const time = prompt("What time? (optional, for example 9:00 AM)") || "";
    let goalId = "";
    if (goals.length) {
      const choices = goals.map((g, i) => `${i+1}. ${g.title}`).join("\n");
      const pick = prompt(`Which 90-day goal does this move forward?\n${choices}\n\nEnter a number, or leave blank.`);
      const idx = Number(pick) - 1;
      if (Number.isInteger(idx) && goals[idx]) goalId = goals[idx].id;
    }
    setEvents(old => [...old, { id: crypto.randomUUID(), title: title.trim(), date: selectedDate, time, goalId, done: false }]);
  }

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthCells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (monthCells.length % 7) monthCells.push(null);

  const selectedEvents = events.filter(e => e.date === selectedDate);
  const selectedStandards = standardsForDate(selectedDate);
  const currentDateLabel = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="app-shell brand-shell">
      <aside className="brand-sidebar">
        <div className="logo-wrap">
          <div className="brand-logo" aria-label="Driven Intention logo"/>
        </div>

        <nav className="main-nav">
          <button className={activePage==="home"?"nav-active":""} onClick={()=>setActivePage("home")}><Home size={20}/> Home</button>
          <button className={activePage==="goals"?"nav-active":""} onClick={()=>setActivePage("goals")}><Target size={20}/> My Goals</button>
          <button className={activePage==="steps"?"nav-active":""} onClick={()=>setActivePage("steps")}><ListTodo size={20}/> Next Steps</button>
          <button className={activePage==="calendar"?"nav-active":""} onClick={()=>setActivePage("calendar")}><CalendarDays size={20}/> Calendar</button>
          <button className={activePage==="progress"?"nav-active":""} onClick={()=>setActivePage("progress")}><BarChart3 size={20}/> Progress</button>
          <button className={activePage==="finances"?"nav-active":""} onClick={()=>setActivePage("finances")}><DollarSign size={20}/> Finances</button>
          <button className={activePage==="projects"?"nav-active":""} onClick={()=>setActivePage("projects")}><FolderKanban size={20}/> Projects</button>
          <button className={activePage==="notes"?"nav-active":""} onClick={()=>setActivePage("notes")}><FileText size={20}/> Notes & Docs</button>
          <button className={activePage==="accountability"?"nav-active":""} onClick={()=>setActivePage("accountability")}><Users size={20}/> Accountability</button>
          <div className="nav-divider"/>
          <button className={activePage==="settings"?"nav-active":""} onClick={()=>setActivePage("settings")}><Settings size={20}/> Settings</button>
          <button className={activePage==="help"?"nav-active":""} onClick={()=>setActivePage("help")}><HelpCircle size={20}/> Help</button>
        </nav>

        <div className="values">
          <span>PURPOSE</span><span>DISCIPLINE</span><span>GROWTH</span>
          <span>FREEDOM</span><span>FAITH</span><span>LEGACY</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="brand-header">
          <div>
            <h1>Good Morning, Steve</h1>
            <p>TURN INTENTION INTO ACTION.</p>
          </div>
          <div className="header-right">
            <span>{currentDateLabel}</span>
            <Bell size={20}/>
            <span className="avatar">SC</span>
          </div>
        </header>

        {activePage === "home" ? (
<div className="dashboard-grid">
          <main className="dashboard-center">
            <section className="panel daily-actions-panel">
              <div className="panel-heading daily-actions-heading">
                <div className="heading-icon"><CheckCircle2 size={25}/></div>
                <div>
                  <p>TODAY</p>
                  <h2>Standards & Next Steps</h2>
                  <span>Everything you committed to today, in one place.</span>
                </div>
                <div className="daily-actions-buttons">
                  <button className="text-btn" onClick={() => setStandardsEditor("all")}><Settings size={16}/> Manage Standards</button>
                  <button className="gold-btn" onClick={() => newStep()}><Plus size={18}/> Add Next Step</button>
                </div>
              </div>

              <div className="daily-action-grid">
                {standardsForToday.map(s => {
                  const done = standardDone(s);
                  const linkedGoal = goals.find(g => g.id === s.goalId);
                  return (
                    <article key={"standard-"+s.id} className={"daily-action-card standard-action " + (done ? "is-complete" : "is-incomplete")}>
                      <button className="daily-action-icon" onClick={() => setStandardsEditor(s.id)} title="Edit this standard">
                        <StandardIcon type={s.icon} size={28}/>
                        <Pencil size={13} className="icon-edit-mark"/>
                      </button>
                      <div className="daily-action-copy">
                        <small>STANDARD · {standardScheduleLabel(s)}</small>
                        <h3>{s.text}</h3>
                        <p>{linkedGoal ? <>Moves toward: <b>{linkedGoal.title}</b></> : "Recurring commitment"}</p>
                      </div>
                      <button className="daily-complete-btn" onClick={() => toggleStandardCompletion(s.id)}>
                        <CheckCircle2 size={21}/>{done ? "Complete" : "Mark Complete"}
                      </button>
                    </article>
                  );
                })}
                {topMoves.map(move => (
                  <article key={"move-"+move.id} className={"daily-action-card next-step-action " + (move.done ? "is-complete" : "is-incomplete")}>
                    <button className="daily-action-icon" onClick={() => editMove(move)} title="Edit this next step">
                      {move.type === "event" ? <CalendarDays size={28}/> : move.category === "health" ? <Dumbbell size={28}/> : move.category === "personal" ? <BookOpen size={28}/> : <BriefcaseBusiness size={28}/>}
                      <Pencil size={13} className="icon-edit-mark"/>
                    </button>
                    <div className="daily-action-copy">
                      <small>NEXT STEP · {categories.find(c => c.id === move.category)?.label || "Personal"}</small>
                      <h3>{move.text}</h3>
                      <p>Moves toward: <b>{move.goalTitle}</b>{move.time ? <> · {move.time}</> : null}</p>
                    </div>
                    <button className="daily-complete-btn" onClick={() => completeMove(move)}>
                      <CheckCircle2 size={21}/>{move.done ? "Complete" : "Mark Complete"}
                    </button>
                  </article>
                ))}
                {!standardsForToday.length && !topMoves.length && <div className="clear-card"><CheckCircle2 size={34}/><b>You’re clear for today.</b><span>Add a standard or next step to get started.</span></div>}
              </div>
            </section>

            <section className="panel goals-panel">
              <div className="section-heading">
                <div className="heading-icon"><Target size={24}/></div>
                <div><h2>90-Day Goals</h2><span>Big vision. Focused execution.</span></div>
                <button className="text-btn" onClick={newGoal}>View All Goals <ChevronRight size={16}/></button>
              </div>
              <div className="compact-goals">
                {goals.slice(0,4).map(goal => (
                  <article className="compact-goal" key={goal.id}>
                    <div className="compact-goal-top">
                      <span className={"mini-icon " + goal.category}><Target size={16}/></span>
                      <small>{categories.find(c=>c.id===goal.category)?.label}</small>
                      <button className="icon" onClick={() => setEditing({...goal})}><Pencil size={14}/></button>
                    </div>
                    <h3>{goal.title}</h3>
                    <strong>{goal.progress}%</strong>
                    <div className="goal-progress"><i style={{width: goal.progress+"%"}}/></div>
                    <p><b>Next Step:</b> {goal.priorities.find(p=>!p.done)?.text || "Add next step"}</p>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside className="dashboard-right">
            <section className="quote-card">
              <span className="quote-mark">“</span>
              <h3>Discipline creates<br/>freedom.</h3>
              <i></i>
              <p>A MORE INTENTIONAL YOU.<br/>A BRIGHTER TOMORROW.</p>
            </section>

            <section className="streak-card">
              <div className="streak-top"><Flame size={34}/><b>{streak}</b><span>Day Streak</span><ChevronRight size={18}/></div>
              <div className="week-dots">
                {["M","T","W","T","F","S","S"].map((d,i)=><div key={i}><span>{d}</span><i className={i<5?"hit":""}></i></div>)}
              </div>
            </section>

            <section className="calendar-card">
              <div className="calendar-head">
                <h3>{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h3>
                <div>
                  <button onClick={() => setMonth(new Date(year, monthIndex-1,1))}>‹</button>
                  <button onClick={() => setMonth(new Date(year, monthIndex+1,1))}>›</button>
                </div>
              </div>
              <div className="weekday-row">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d=><span key={d}>{d}</span>)}</div>
              <div className="calendar-grid">
                {monthCells.map((day,idx) => {
                  if (!day) return <span key={idx} className="blank"></span>;
                  const key = `${year}-${pad(monthIndex+1)}-${pad(day)}`;
                  const hasEvent = events.some(e => e.date===key) || standardsForDate(key).length > 0;
                  const isSelected = key===selectedDate;
                  const isToday = key===dateKey(today);
                  return <button key={idx} className={(isSelected?"selected ":"")+(isToday?"today ":"")} onClick={()=>setSelectedDate(key)}>
                    {day}{hasEvent && <i></i>}
                  </button>
                })}
              </div>
              <button className="gold-btn full" onClick={addCalendarEvent}><Plus size={16}/> Add Event</button>

              <div className="calendar-items">
                <div className="calendar-items-head"><h4>{selectedDate===dateKey(today)?"Today’s Calendar Items":"Selected Day"}</h4></div>
                {selectedStandards.map(s => (
                  <button className={"calendar-item calendar-linked-item " + (standardDone(s,selectedDate) ? "done" : "")} key={"std-"+s.id} onClick={()=>setStandardsEditor(s.id)}>
                    <StandardIcon type={s.icon} size={15}/><span>Standard</span><b>{s.text}</b>
                  </button>
                ))}
                {selectedEvents.map(e => (
                  <button className={"calendar-item calendar-linked-item " + (e.done ? "done" : "")} key={e.id} onClick={() => {
                    const g = goals.find(x=>x.id===e.goalId);
                    editMove({id:e.id,text:e.title,type:"event",category:g?.category||"personal",goalTitle:g?.title||"Calendar",progress:g?.progress||0,time:e.time||"",sourcePriorityId:e.sourcePriorityId||"",goalId:e.goalId||"",duration:e.duration||30,reminder:e.reminder||"15",repeat:e.repeat||"none",done:Boolean(e.done),date:e.date});
                  }}>
                    <CalendarDays size={15}/><span>{e.time || "Next Step"}</span><b>{e.title}</b>
                  </button>
                ))}
                {!selectedStandards.length && !selectedEvents.length && <p className="no-items">Nothing scheduled.</p>}
              </div>
            </section>
          </aside>
        </div>
        ) : activePage === "goals" ? (
          <section className="page-shell">
            <div className="page-title"><div><p>BIG VISION</p><h2>My 90-Day Goals</h2><span>Set the outcome, then keep the next move visible.</span></div><button className="gold-btn" onClick={newGoal}><Plus size={18}/> Add Goal</button></div>
            <div className="goals-page-grid">
              {goals.map(goal => <article className="goal-page-card" key={goal.id}>
                <div className="compact-goal-top"><span className={"mini-icon "+goal.category}><Target size={17}/></span><small>{categories.find(c=>c.id===goal.category)?.label}</small><button className="icon" onClick={()=>setEditing({...goal})}><Pencil size={16}/></button></div>
                <h3>{goal.title}</h3><p>{goal.why}</p>
                <div className="goal-page-progress"><strong>{goal.progress}%</strong><span>complete</span></div>
                <div className="goal-progress"><i style={{width:goal.progress+"%"}}/></div>
                <div className="goal-next"><small>NEXT MOVE</small><b>{goal.priorities.find(p=>!p.done)?.text || "Add a next step"}</b></div>
              </article>)}
            </div>
          </section>
        ) : activePage === "steps" ? (
          <section className="page-shell">
            <div className="page-title"><div><p>ACTION</p><h2>Next Steps</h2><span>Every action stays connected to the goal it moves forward.</span></div><button className="gold-btn" onClick={()=>newStep()}><Plus size={18}/> Add Next Step</button></div>
            <div className="steps-section-heading">
              <div><p>RECURRING</p><h3>Today’s Standards</h3><span>These populate automatically from the schedule you choose.</span></div>
              <button className="text-btn" onClick={() => setStandardsEditor("all")}><Settings size={16}/> Manage Standards</button>
            </div>
            <div className="steps-page-grid standards-next-steps">
              {standardsForToday.map(s => {
                const done = standardDone(s);
                const linkedGoal = goals.find(g => g.id === s.goalId);
                return <article className={"step-page-card standard-step-card "+(done?"done":"")} key={s.id}>
                  <span className="mini-icon health"><StandardIcon type={s.icon} size={18}/></span>
                  <div><small>STANDARD - {standardScheduleLabel(s)}</small><h3>{s.text}</h3><p>{linkedGoal ? <><Target size={13}/> {linkedGoal.title}</> : "Recurring commitment"}</p></div>
                  <div className="step-actions"><span className="standard-score-chip">{done ? "Done today" : "Due today"}</span><button className="complete-round" onClick={()=>toggleStandardCompletion(s.id)}><CheckCircle2 size={22}/></button></div>
                </article>;
              })}
              {!standardsForToday.length && <div className="empty-state-inline">No recurring standards are scheduled for today.</div>}
            </div>

            <div className="steps-section-heading goal-steps-heading">
              <div><p>GOALS</p><h3>Goal Next Steps</h3><span>One-time actions tied directly to your 90-day goals.</span></div>
            </div>
            <div className="steps-page-grid">
              {incompleteGoalMoves.map(move => <article className="step-page-card" key={move.id}>
                <span className={"mini-icon "+move.category}><ListTodo size={17}/></span>
                <div><small>{categories.find(c=>c.id===move.category)?.label}</small><h3>{move.text}</h3><p><Target size={13}/> {move.goalTitle}</p>{(move.date||move.time) && <p className="step-time"><Clock size={13}/> {move.date || "Unscheduled"} {move.time ? " • "+move.time : ""}</p>}</div>
                <div className="step-actions"><button className="timeblock-btn" onClick={()=>editStep(move)}><CalendarDays size={17}/> {move.date ? "Edit Block" : "Time Block"}</button><button className="complete-round" onClick={()=>completeMove(move)}><CheckCircle2 size={22}/></button></div>
              </article>)}
            </div>
          </section>
        ) : activePage === "calendar" ? (
          <section className="page-shell">
            <div className="page-title"><div><p>PLAN WITH PURPOSE</p><h2>Calendar</h2><span>Schedule the actions that move your goals forward.</span></div><button className="gold-btn" onClick={()=>newStep("",selectedDate)}><Plus size={18}/> Add Goal Block</button></div>
            <div className="calendar-page-layout">
              <section className="calendar-card large-calendar">
                <div className="calendar-head"><h3>{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h3><div><button onClick={()=>setMonth(new Date(year,monthIndex-1,1))}>‹</button><button onClick={()=>setMonth(new Date(year,monthIndex+1,1))}>›</button></div></div>
                <div className="weekday-row">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d=><span key={d}>{d}</span>)}</div>
                <div className="calendar-grid">{monthCells.map((day,idx)=>{if(!day)return <span key={idx} className="blank"></span>;const key=`${year}-${pad(monthIndex+1)}-${pad(day)}`;const hasEvent=events.some(e=>e.date===key)||standardsForDate(key).length>0;return <button key={idx} className={(key===selectedDate?"selected ":"")+(key===dateKey(today)?"today ":"")} onClick={()=>setSelectedDate(key)}>{day}{hasEvent&&<i/>}</button>})}</div>
              </section>
              <section className="panel day-agenda">
                <h3>{selectedDate===dateKey(today)?"Today":"Selected Day"}</h3>
                {selectedStandards.map(s=><button className={"agenda-item agenda-linked "+(standardDone(s,selectedDate)?"done":"")} key={"std-"+s.id} onClick={()=>setStandardsEditor(s.id)}><StandardIcon type={s.icon} size={18}/><div><b>{s.text}</b><span>Standard · {standardScheduleLabel(s)}</span><small>{standardDone(s,selectedDate)?"Complete":"Scheduled"}</small></div></button>)}
                {selectedEvents.map(e=><button className={"agenda-item agenda-linked "+(e.done?"done":"")} key={e.id} onClick={()=>{const g=goals.find(x=>x.id===e.goalId);editMove({id:e.id,text:e.title,type:"event",category:g?.category||"personal",goalTitle:g?.title||"Calendar",progress:g?.progress||0,time:e.time||"",sourcePriorityId:e.sourcePriorityId||"",goalId:e.goalId||"",duration:e.duration||30,reminder:e.reminder||"15",repeat:e.repeat||"none",done:Boolean(e.done),date:e.date});}}><CalendarDays size={18}/><div><b>{e.title}</b><span>{e.time||"Anytime"}</span><small>{goals.find(g=>g.id===e.goalId)?.title||"Not linked to a goal"}</small></div></button>)}
                {!selectedStandards.length&&!selectedEvents.length&&<p className="no-items">Nothing scheduled yet.</p>}
              </section>
            </div>
          </section>
        ) : activePage === "standards" ? (
          <section className="page-shell">
            <div className="page-title"><div><p>THE NON-NEGOTIABLES</p><h2>Daily Standards</h2><span>Keep the habits that define who you are becoming.</span></div><button className="gold-btn" onClick={() => setStandardsEditor("all")}><Pencil size={17}/> Edit Standards</button></div>
            <div className="standards-page-grid">{standards.map(s=><button key={s.id} className={"standard-page-card "+(s.done?"done":"")} onClick={()=>setStandards(old=>old.map(x=>x.id===s.id?{...x,done:!x.done}:x))}><span className="standard-icon"><StandardIcon type={s.icon} size={30}/></span><h3>{s.text}</h3><p>{s.done?"Complete today":"Tap when complete"}</p><CheckCircle2 size={24}/></button>)}</div>
          </section>
        ) : activePage === "progress" ? (
          <section className="page-shell">
            <div className="page-title"><div><p>MEASURED DAILY</p><h2>Progress</h2><span>See whether your daily execution is matching your intentions.</span></div></div>
            <div className="progress-page-grid">
              <article className="metric-card"><span>GOALS</span><strong>{goals.length}</strong><p>Active 90-day outcomes</p></article>
              <article className="metric-card"><span>NEXT STEPS DONE</span><strong>{goals.flatMap(g=>g.priorities).filter(p=>p.done).length}</strong><p>Completed actions</p></article>
              <article className="metric-card"><span>STANDARDS TODAY</span><strong>{standardsForToday.filter(s=>standardDone(s)).length}/{standardsForToday.length}</strong><p>Scheduled recurring actions</p></article>
              <article className="metric-card"><span>WEEKLY STANDARD SCORE</span><strong>{weeklyStandardStats.score}%</strong><p>{weeklyStandardStats.completed}/{weeklyStandardStats.expected} scheduled completions</p></article>
              <article className="metric-card"><span>STREAK</span><strong>{streak}</strong><p>Consecutive scheduled days completed</p></article>
            </div>
            <section className="panel progress-goals"><h3>90-Day Goal Progress</h3>{goals.map(g=><div className="progress-line" key={g.id}><span>{g.title}</span><b>{g.progress}%</b><div className="goal-progress"><i style={{width:g.progress+"%"}}/></div></div>)}</section>
          </section>
        ) : (
          <section className="page-shell coming-page">
            <div className="coming-icon">{activePage==="finances"?<DollarSign size={34}/>:activePage==="projects"?<FolderKanban size={34}/>:activePage==="notes"?<FileText size={34}/>:activePage==="accountability"?<Users size={34}/>:activePage==="settings"?<Settings size={34}/>:<HelpCircle size={34}/>}</div>
            <p>COMING NEXT</p><h2>{activePage==="finances"?"Finances":activePage==="projects"?"Projects":activePage==="notes"?"Notes & Docs":activePage==="accountability"?"Accountability":activePage==="settings"?"Settings":"Help"}</h2>
            <span>This section is wired into the sidebar now. We’ll build the working tools here next.</span>
            <button className="gold-btn" onClick={()=>setActivePage("home")}>Back to Home</button>
          </section>
        )}

        <footer className="brand-footer">
          <div><b>A MORE INTENTIONAL YOU.</b><b>A BRIGHTER TOMORROW.</b></div>
          <span>PURPOSE&nbsp;&nbsp; | &nbsp;&nbsp;DISCIPLINE&nbsp;&nbsp; | &nbsp;&nbsp;GROWTH&nbsp;&nbsp; | &nbsp;&nbsp;FREEDOM&nbsp;&nbsp; | &nbsp;&nbsp;FAITH&nbsp;&nbsp; | &nbsp;&nbsp;LEGACY</span>
        </footer>
      </div>

      {editing && <GoalModal goal={editing} onClose={() => setEditing(null)} onSave={saveGoal} onDelete={deleteGoal}/>}
      {stepEditor && <StepModal step={stepEditor} goals={goals} onClose={()=>setStepEditor(null)} onSave={saveStep}/>}
      {standardsEditor && <StandardsModal standards={standards} goals={goals} initialStandardId={standardsEditor==="all" ? null : standardsEditor} onClose={()=>setStandardsEditor(null)} onSave={saveStandards} onReset={resetStandards}/>}
    </div>
  );
}

function GoalModal({ goal, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(goal);
  const [newPriority, setNewPriority] = useState("");

  function addPriority() {
    const text = newPriority.trim();
    if (!text) return;
    setDraft(d => ({...d, priorities: [...d.priorities, {id: crypto.randomUUID(), text, done: false}]}));
    setNewPriority("");
  }

  return <div className="modal-backdrop" onMouseDown={e => e.target===e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-head"><div><p className="eyebrow">{draft.isNew ? "NEW 90-DAY GOAL" : "EDIT 90-DAY GOAL"}</p><h2>{draft.isNew ? "What are you committed to achieving?" : "Keep the goal clear and actionable."}</h2></div><button className="icon" onClick={onClose}><X/></button></div>
      <label>Category<select value={draft.category} onChange={e=>setDraft(d => d.isNew ? {...d,category:e.target.value,title:"",why:"",progress:0,priorities:[]} : {...d,category:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
      <label>90-Day Goal<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
      <label>Why this matters<textarea value={draft.why} onChange={e=>setDraft({...draft,why:e.target.value})}/></label>
      <label>Progress — {draft.progress}%<input className="range" type="range" min="0" max="100" step="5" value={draft.progress} onChange={e=>setDraft({...draft,progress:Number(e.target.value)})}/></label>
      <div className="priority-editor">
        <div className="priority-head"><b>Next Steps</b><span>{draft.priorities.length}</span></div>
        {draft.priorities.map(p=><div className="edit-priority" key={p.id}><input value={p.text} onChange={e=>setDraft(d=>({...d,priorities:d.priorities.map(x=>x.id===p.id?{...x,text:e.target.value}:x)}))}/><button className="icon danger" onClick={()=>setDraft(d=>({...d,priorities:d.priorities.filter(x=>x.id!==p.id)}))}><Trash2 size={16}/></button></div>)}
        <div className="new-priority"><input value={newPriority} onChange={e=>setNewPriority(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPriority()} placeholder="Add a next step..."/><button onClick={addPriority}><Plus size={17}/> Add</button></div>
      </div>
      <div className="modal-actions">
        {!draft.isNew && <button className="danger-btn" onClick={()=>{onDelete(draft.id);onClose();}}>Delete</button>}
        <button className="secondary" onClick={onClose}>Cancel</button>
        <button className="primary" disabled={!draft.title.trim()} onClick={()=>onSave(draft)}><Save size={17}/> Save Goal</button>
      </div>
    </div>
  </div>
}

function StepModal({ step, goals, onClose, onSave }) {
  const [draft, setDraft] = useState(step);
  const timed = Boolean(draft.date || draft.time);
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal step-modal">
      <div className="modal-head"><div><p className="eyebrow">NEXT STEP</p><h2>{draft.isNew ? "What moves the goal forward?" : "Edit Next Step"}</h2></div><button className="icon" onClick={onClose}><X/></button></div>
      <label>Next Step<input autoFocus value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})} placeholder="Example: Call 5 investors"/></label>
      <label>Moves Toward<select value={draft.goalId} onChange={e=>setDraft({...draft,goalId:e.target.value})}><option value="">Choose a 90-day goal</option>{goals.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
      <div className="quick-date-row">
        <button onClick={()=>setDraft({...draft,date:dateKey(today)})}>Today</button>
        <button onClick={()=>{const d=new Date();d.setDate(d.getDate()+1);setDraft({...draft,date:dateKey(d)})}}>Tomorrow</button>
        <button onClick={()=>setDraft({...draft,date:"",time:""})}>Someday</button>
      </div>
      <div className="schedule-grid">
        <label>Date<input type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label>
        <label>Start Time<input type="time" value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})}/></label>
        <label>Duration<select value={draft.duration} onChange={e=>setDraft({...draft,duration:Number(e.target.value)})}><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hour</option><option value="90">90 min</option><option value="120">2 hours</option></select></label>
        <label>Reminder<select value={draft.reminder} onChange={e=>setDraft({...draft,reminder:e.target.value})}><option value="none">None</option><option value="0">At start</option><option value="15">15 min before</option><option value="30">30 min before</option><option value="60">1 hour before</option></select></label>
        <label>Repeat<select value={draft.repeat} onChange={e=>setDraft({...draft,repeat:e.target.value})}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option></select></label>
        <label>Priority<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})}><option value="normal">Normal</option><option value="top3">Top 3</option></select></label>
      </div>
      {timed && <div className="timeblock-note"><CalendarDays size={17}/><span>This step will appear on your calendar and on Today when its date arrives.</span></div>}
      <div className="notification-note"><Bell size={17}/><span>Browser reminders work while this web app is open. Reliable background phone push is the next notification layer we’ll add.</span></div>
      <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!draft.text.trim()||!draft.goalId} onClick={()=>onSave(draft)}><Save size={17}/> Save Next Step</button></div>
    </div>
  </div>
}

function StandardsModal({ standards, goals, initialStandardId, onClose, onSave, onReset }) {
  const [draft, setDraft] = useState(standards.map(s => ({...s, days:[...(s.days || [])], completions:{...(s.completions || {})}})));

  function updateStandard(id, changes) {
    setDraft(items => items.map(s => s.id === id ? {...s, ...changes} : s));
  }

  function toggleDay(id, day) {
    setDraft(items => items.map(s => {
      if (s.id !== id) return s;
      const days = (s.days || []).includes(day)
        ? s.days.filter(d => d !== day)
        : [...(s.days || []), day].sort((a,b)=>a-b);
      return {...s, days};
    }));
  }

  function removeStandard(id) {
    setDraft(items => items.filter(s => s.id !== id));
  }

  function addStandard() {
    setDraft(items => [...items, {
      id: crypto.randomUUID(),
      text: "New Standard",
      icon: "check",
      scheduleMode: "days",
      days: [1,2,3,4,5],
      weeklyTarget: 5,
      trackScore: true,
      trackStreak: true,
      goalId: "",
      completions: {},
    }]);
  }

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal standards-modal">
      <div className="modal-head">
        <div><p className="eyebrow">{initialStandardId ? "EDIT STANDARD" : "RECURRING NEXT STEPS"}</p><h2>{initialStandardId ? "Edit this standard." : "Build your weekly standards."}</h2></div>
        <button className="icon" onClick={onClose}><X/></button>
      </div>
      <p className="standards-help">Choose exactly when each standard should appear in Next Steps. Specific-day standards can build streaks; flexible standards track a weekly target.</p>
      <div className="standards-editor-list">
        {draft.filter(s => !initialStandardId || s.id === initialStandardId).map((s, index) => (
          <div className="standard-edit-row standard-edit-expanded" key={s.id}>
            <span className="standard-edit-icon"><StandardIcon type={s.icon}/></span>
            <div className="standard-edit-fields">
              <small>STANDARD {index + 1}</small>
              <input
                value={s.text}
                onChange={e => updateStandard(s.id, {text:e.target.value})}
                placeholder="Name this standard"
              />
              <div className="standard-config-grid">
                <label>Schedule
                  <select value={s.scheduleMode || "days"} onChange={e=>updateStandard(s.id,{scheduleMode:e.target.value})}>
                    <option value="days">Specific days</option>
                    <option value="flexible">Flexible weekly target</option>
                  </select>
                </label>
                <label>Linked 90-day goal
                  <select value={s.goalId || ""} onChange={e=>updateStandard(s.id,{goalId:e.target.value})}>
                    <option value="">Not linked</option>
                    {goals.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </label>
              </div>
              {s.scheduleMode === "flexible" ? (
                <label className="weekly-target-label">Weekly target
                  <input type="number" min="1" max="14" value={s.weeklyTarget || 1} onChange={e=>updateStandard(s.id,{weeklyTarget:Math.max(1,Number(e.target.value)||1)})}/>
                </label>
              ) : (
                <div className="day-picker" aria-label={"Days for "+s.text}>
                  {dayLabels.map((label, day)=><button type="button" key={label} className={(s.days || []).includes(day)?"selected":""} onClick={()=>toggleDay(s.id,day)}>{label}</button>)}
                </div>
              )}
              <div className="standard-track-row">
                <label><input type="checkbox" checked={s.trackScore !== false} onChange={e=>updateStandard(s.id,{trackScore:e.target.checked})}/> Include in weekly score</label>
                <label><input type="checkbox" checked={s.trackStreak !== false && s.scheduleMode !== "flexible"} disabled={s.scheduleMode === "flexible"} onChange={e=>updateStandard(s.id,{trackStreak:e.target.checked})}/> Track streak</label>
              </div>
            </div>
            <button className="icon danger" aria-label={"Delete " + s.text} onClick={() => removeStandard(s.id)}><Trash2 size={17}/></button>
          </div>
        ))}
      </div>
      <button className="add-standard-btn" onClick={addStandard}><Plus size={17}/> Add Standard</button>
      <div className="modal-actions">
        <button className="reset-btn" onClick={onReset}><RotateCcw size={16}/> Reset Defaults</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
        <button className="primary" disabled={!draft.some(s => s.text.trim())} onClick={() => onSave(draft)}><Save size={17}/> Save Standards</button>
      </div>
    </div>
  </div>
}
