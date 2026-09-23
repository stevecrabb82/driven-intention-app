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
  { id: "steps", text: "10K Steps", icon: "steps", done: false },
  { id: "lift", text: "Lift / Sauna", icon: "lift", done: false },
  { id: "nutrition", text: "Clean Nutrition", icon: "nutrition", done: false },
  { id: "hydrate", text: "Hydrate", icon: "hydrate", done: false },
  { id: "mindset", text: "Mindset / Prayer", icon: "mindset", done: false },
  { id: "read", text: "Read", icon: "read", done: false },
  { id: "am", text: "AM Review", icon: "am", done: false },
  { id: "pm", text: "PM Review", icon: "pm", done: false },
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
    if (!Array.isArray(raw) || raw.length < 5) return standardDefaults;
    return raw;
  } catch {
    return standardDefaults;
  }
}

const pad = n => String(n).padStart(2, "0");
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = new Date();

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
    () => events.filter(e => e.date === dateKey(today) && !e.done),
    [events]
  );

  const topMoves = useMemo(() => {
    const scheduled = todayEvents.map(e => {
      const g = goals.find(x => x.id === e.goalId);
      return {
        id: e.id, text: e.title, type: "event", category: g?.category || "personal",
        goalTitle: g?.title || "Calendar", progress: g?.progress || 0, time: e.time || "",
        sourcePriorityId: e.sourcePriorityId || "", goalId: e.goalId || "", duration: e.duration || 30
      };
    });
    return [...scheduled, ...incompleteGoalMoves].slice(0, 3);
  }, [todayEvents, goals, incompleteGoalMoves]);

  const streak = 7;

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
      priorities: g.priorities.map(p => p.id === priorityId ? { ...p, done: !p.done } : p)
    } : g));
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

  const selectedEvents = events.filter(e => e.date === selectedDate && !e.done);
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
          <button className={activePage==="standards"?"nav-active":""} onClick={()=>setActivePage("standards")}><CheckCircle2 size={20}/> Daily Standards</button>
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
            <section className="panel moves-panel">
              <div className="panel-heading">
                <div className="heading-icon"><CheckCircle2 size={25}/></div>
                <div>
                  <p>TODAY</p>
                  <h2>Your Top 3 Moves</h2>
                  <span>Small steps. Big results.</span>
                </div>
                <button className="gold-btn" onClick={() => newStep()}><Plus size={18}/> Add Next Step</button>
              </div>

              <div className="top-moves-grid">
                {topMoves.map((move, i) => (
                  <article className="top-move" key={move.id}>
                    <div className="top-move-head">
                      <div className={"move-icon " + move.category}>
                        {move.type === "event" ? <CalendarDays size={25}/> : move.category === "health" ? <Dumbbell size={25}/> : move.category === "personal" ? <BookOpen size={25}/> : <BriefcaseBusiness size={25}/>}
                      </div>
                      <div className="move-title">
                        <small>{categories.find(c => c.id === move.category)?.label || "Personal"}</small>
                        <h3>{move.text}</h3>
                        <span>{move.time || (move.category === "health" ? "30–45 minutes" : "Move it forward today")}</span>
                      </div>
                      <ChevronRight size={20}/>
                    </div>
                    <div className="moves-toward">
                      <span>Moves You Toward:</span>
                      <b>{move.goalTitle}</b>
                      <div className="goal-progress"><i style={{width: move.progress + "%"}}/></div>
                    </div>
                    <button className="complete-btn" onClick={() => completeMove(move)}><CheckCircle2 size={20}/> Mark Complete</button>
                  </article>
                ))}
                {!topMoves.length && <div className="clear-card"><CheckCircle2 size={34}/><b>You’re clear for today.</b><span>Add a next step or calendar item.</span></div>}
              </div>
            </section>

            <section className="panel standards-panel">
              <div className="section-heading">
                <div className="heading-icon"><CheckCircle2 size={24}/></div>
                <div><h2>Daily Standards</h2><span>The non-negotiables.</span></div>
                <button className="text-btn">Edit Standards <ChevronRight size={16}/></button>
              </div>
              <div className="standards-row">
                {standards.map(s => (
                  <button key={s.id} className={"standard-circle " + (s.done ? "done" : "")} onClick={() => setStandards(old => old.map(x => x.id === s.id ? {...x, done: !x.done} : x))}>
                    <span className="standard-icon"><StandardIcon type={s.icon}/></span>
                    <b>{s.text}</b>
                    <small>{s.done ? "1/1" : "0/1"}</small>
                  </button>
                ))}
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
                  const hasEvent = events.some(e => e.date===key && !e.done);
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
                {selectedEvents.length ? selectedEvents.map(e => (
                  <div className="calendar-item" key={e.id}>
                    <CalendarDays size={15}/><span>{e.time || "Anytime"}</span><b>{e.title}</b>
                  </div>
                )) : <p className="no-items">Nothing scheduled.</p>}
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
                <div className="calendar-grid">{monthCells.map((day,idx)=>{if(!day)return <span key={idx} className="blank"></span>;const key=`${year}-${pad(monthIndex+1)}-${pad(day)}`;const hasEvent=events.some(e=>e.date===key&&!e.done);return <button key={idx} className={(key===selectedDate?"selected ":"")+(key===dateKey(today)?"today ":"")} onClick={()=>setSelectedDate(key)}>{day}{hasEvent&&<i/>}</button>})}</div>
              </section>
              <section className="panel day-agenda"><h3>{selectedDate===dateKey(today)?"Today":"Selected Day"}</h3>{selectedEvents.length?selectedEvents.map(e=><div className="agenda-item" key={e.id}><CalendarDays size={18}/><div><b>{e.title}</b><span>{e.time||"Anytime"}</span><small>{goals.find(g=>g.id===e.goalId)?.title||"Not linked to a goal"}</small></div></div>):<p className="no-items">Nothing scheduled yet.</p>}</section>
            </div>
          </section>
        ) : activePage === "standards" ? (
          <section className="page-shell">
            <div className="page-title"><div><p>THE NON-NEGOTIABLES</p><h2>Daily Standards</h2><span>Keep the habits that define who you are becoming.</span></div></div>
            <div className="standards-page-grid">{standards.map(s=><button key={s.id} className={"standard-page-card "+(s.done?"done":"")} onClick={()=>setStandards(old=>old.map(x=>x.id===s.id?{...x,done:!x.done}:x))}><span className="standard-icon"><StandardIcon type={s.icon} size={30}/></span><h3>{s.text}</h3><p>{s.done?"Complete today":"Tap when complete"}</p><CheckCircle2 size={24}/></button>)}</div>
          </section>
        ) : activePage === "progress" ? (
          <section className="page-shell">
            <div className="page-title"><div><p>MEASURED DAILY</p><h2>Progress</h2><span>See whether your daily execution is matching your intentions.</span></div></div>
            <div className="progress-page-grid">
              <article className="metric-card"><span>GOALS</span><strong>{goals.length}</strong><p>Active 90-day outcomes</p></article>
              <article className="metric-card"><span>NEXT STEPS DONE</span><strong>{goals.flatMap(g=>g.priorities).filter(p=>p.done).length}</strong><p>Completed actions</p></article>
              <article className="metric-card"><span>STANDARDS TODAY</span><strong>{standards.filter(s=>s.done).length}/{standards.length}</strong><p>Daily consistency</p></article>
              <article className="metric-card"><span>STREAK</span><strong>{streak}</strong><p>Days of momentum</p></article>
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