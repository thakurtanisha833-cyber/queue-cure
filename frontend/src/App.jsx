import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import "./App.css";
 
const socket = io("http://localhost:5000");
 
function App() {
 
  const [loggedIn, setLoggedIn] = useState(false);
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
 
  const [patientName,setPatientName] = useState("");
  const [patients,setPatients] = useState([]);
  const [token,setToken] = useState(1);
  const [currentToken,setCurrentToken] = useState(null);
  const [avgTime,setAvgTime] = useState(10);
  const [servedCount,setServedCount] = useState(0);
  const [doctor,setDoctor] = useState("Dr. Sharma");
  const [priority,setPriority] = useState("Normal");
  const [search,setSearch] = useState("");
  const [history,setHistory] = useState([]);
  const [time,setTime] = useState(new Date());
  const [appointmentName,setAppointmentName] = useState("");
  const [appointmentDate,setAppointmentDate] = useState("");
  const [appointments,setAppointments] = useState([]);
 
  useEffect(()=>{
    const timer = setInterval(()=>setTime(new Date()),1000);
    return ()=>clearInterval(timer);
  },[]);

  // Load patients from localStorage on mount
  useEffect(()=>{
    const saved=localStorage.getItem("patients");
    if(saved){
      setPatients(JSON.parse(saved));
    }
  },[]);

  // Save patients to localStorage on every change
  useEffect(()=>{
    localStorage.setItem("patients",JSON.stringify(patients));
  },[patients]);

  useEffect(()=>{
 
    socket.on("queueUpdate",(data)=>{
 
      setPatients(data.patients || []);
      setCurrentToken(data.currentToken || null);
      setServedCount(data.servedCount || 0);
      setAvgTime(data.avgTime || 10);
 
    });
 
 
    return ()=>socket.off("queueUpdate");
 
  },[]);
 
 
 
  const login=()=>{
 
    if(username==="admin" && password==="admin123"){
      setLoggedIn(true);
    }
    else{
      alert("Invalid Credentials");
    }
 
  };
 
 
 
  const addPatient=()=>{
 
    if(!patientName.trim()) return;
 
    const newPatient={
      tokenNo:token,
      name:patientName,
      doctor:doctor,
      priority:priority
    };
 
    let updated;

    if(priority==="Emergency"){
      updated=[newPatient,...patients];
    }
    else{
      updated=[...patients,newPatient];
    }
 
    setPatients(updated);
 
    socket.emit("queueUpdate",{
      patients:updated,
      currentToken,
      servedCount,
      avgTime
    });
 
    setToken(token+1);
    setPatientName("");
 
  };
 
 
 
 
  const callNext=()=>{
 
    if(patients.length===0)return;
 
 
    const next=patients[0];
 
    const updated=patients.slice(1);
 
 
    setCurrentToken(next);
    setPatients(updated);

    speechSynthesis.speak(
      new SpeechSynthesisUtterance(
        `Token number ${next.tokenNo} please proceed`
      )
    );
 
 
    socket.emit("queueUpdate",{
      patients:updated,
      currentToken:next,
      servedCount,
      avgTime
    });
 
  };
 
 
 
  const completeConsultation=()=>{
 
    if(!currentToken)return;
 
 
    setHistory([...history,currentToken]);

    const count=servedCount+1;
 
 
    setCurrentToken(null);
    setServedCount(count);
 
 
    socket.emit("queueUpdate",{
      patients,
      currentToken:null,
      servedCount:count,
      avgTime
    });
 
  };
 
 
 
  const skipPatient=()=>{
    callNext();
  };

  const downloadQueue=()=>{
    const data=patients.map(
      p=>`${p.tokenNo},${p.name},${p.doctor},${p.priority}`
    ).join("\n");

    const blob=new Blob(
      ["Token,Name,Doctor,Priority\n"+data],
      {type:"text/csv"}
    );

    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="queue.csv";
    a.click();
  };

  const bookAppointment=()=>{

    if(!appointmentName || !appointmentDate) return;

    const newAppointment={
      name:appointmentName,
      doctor:doctor,
      date:appointmentDate
    };

    setAppointments([...appointments,newAppointment]);

    setAppointmentName("");
    setAppointmentDate("");

  };
 
 
 
 
  if(!loggedIn){
 
    return(
 
      <div className="login-page">
 
        <div className="login-card">
 
          <h1>🏥 Queue Cure</h1>
 
          <p>
            Smart Clinic Queue Management
          </p>
 
 
          <input
          placeholder="Username"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          />
 
 
          <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          />
 
 
          <button onClick={login}>
            Login
          </button>
 
 
          <span>
            Demo Login: admin / admin123
          </span>
 
        </div>
 
      </div>
 
    );
 
  }
 
 
 
 
return(
 
<div className="dashboard">
 
 
<header className="hero">
 
<h1>
🏥 Queue Cure '26
</h1>
 
 
<p>
Real-Time Digital Queue Management for Clinics
</p>
 
 
<p className="hero-sub">
Receptionist assigns tokens in under 10 seconds.
Patients receive live queue updates instantly.
</p>

<h3>{time.toLocaleTimeString()}</h3>

<button
  className="done"
  onClick={()=>setLoggedIn(false)}
>
  Logout
</button>


</header>
 
 
 
 
 
<div className="stats-grid">
 
 
<div className="stat-card">
<h3>Patients Served</h3>
<h2>{servedCount}</h2>
</div>
 
 
<div className="stat-card">
<h3>Waiting Queue</h3>
<h2>{patients.length}</h2>
</div>
 
 
<div className="stat-card">
<h3>Average Time</h3>
<h2>{avgTime} min</h2>
</div>
 
 
<div className="stat-card">
<h3>Now Serving</h3>
<h2>
{currentToken ? currentToken.tokenNo : "--"}
</h2>
</div>

<div className="stat-card">
<h3>Emergency Cases</h3>
<h2>
{patients.filter(p=>p.priority==="Emergency").length}
</h2>
</div>


</div>
 
 
 
 
 
<div className="main-grid">
 
 
<div className="panel">
 
<h2>Reception Desk</h2>
 
<label>Select Doctor</label>
<select
  value={doctor}
  onChange={(e)=>setDoctor(e.target.value)}
  className="doctor-select"
>
  <option>Dr. Sharma</option>
  <option>Dr. Gupta</option>
  <option>Dr. Singh</option>
  <option>Dr. Mehta</option>
</select>

<label>Priority</label>
<select
  value={priority}
  onChange={(e)=>setPriority(e.target.value)}
  className="doctor-select"
>
  <option>Normal</option>
  <option>Emergency</option>
</select>
 
<input
placeholder="Enter Patient Name"
value={patientName}
onChange={(e)=>setPatientName(e.target.value)}
onKeyDown={(e)=>{
if(e.key==="Enter")addPatient()
}}
/>
 
 
<div className="button-grid">
 
 
<button className="add" onClick={addPatient}>
Add Patient
</button>
 
 
<button className="next" onClick={callNext}>
Call Next
</button>
 
 
<button className="skip" onClick={skipPatient}>
Skip
</button>
 
 
<button className="done" onClick={completeConsultation}>
Complete
</button>
 
 
</div>
 
 
<div className="avg-box">
 
<label>
Consultation Time (mins)
</label>
 
 
<input
type="number"
value={avgTime}
onChange={(e)=>setAvgTime(Number(e.target.value))}
 />
 
</div>
 
 
</div>
 
 
 
 
 
<div className="panel">
 
<h2>Current Patient</h2>
 
 
<div className="current-token">
 
{
currentToken ?
 
<>
 
<h1>
#{currentToken.tokenNo}
</h1>
 
<h3>{currentToken.name}</h3>
<p>
👨‍⚕️ {currentToken.doctor}
<br/>
{currentToken.priority==="Emergency"
 ? "🔴 Emergency Patient"
 : "🟢 Normal Patient"}
</p>
 
</>
 
:
 
<h2>
No Active Patient
</h2>
 
}
 
 
</div>
 
 
</div>
 
 
</div>
 
 
 
 
 
<div className="waiting-room">
 
 
<h2>Patient Waiting Room</h2>
 
 
<div className="waiting-stats">
 
 
<div>
<h4>Current Token</h4>
<h1>
{currentToken ? currentToken.tokenNo:"--"}
</h1>
</div>
 
 
<div>
<h4>Patients Ahead</h4>
<h1>
{patients.length}
</h1>
</div>
 
 
<div>
<h4>Estimated Wait</h4>
<h1>
{patients.length*avgTime} min
</h1>
</div>
 
 
</div>
 
 
</div>
 
 
 
 
 
<div className="queue-list">
 
 
<h2>Waiting Queue</h2>

<button className="next" onClick={downloadQueue}>
📥 Export Queue
</button>

<input
  placeholder="🔍 Search by name or token..."
  value={search}
  onChange={(e)=>setSearch(e.target.value)}
  style={{marginBottom:"12px"}}
/>
 
 
{
 
patients.filter(p=>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  String(p.tokenNo).includes(search)
).length===0 ?
 
<p>No Patients Found</p>
 
:
 
patients.filter(p=>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  String(p.tokenNo).includes(search)
).map((p,index)=>(
 
<div className="queue-item" key={p.tokenNo}>
 
<strong>
🎫 Token #{p.tokenNo}
</strong>
 
<div>
  <div>{p.name}</div>
  <small>
    👨‍⚕️ {p.doctor} | {p.priority==="Emergency" ? "🔴 Emergency" : "🟢 Normal"}
  </small>
  <small>Position: {index+1}</small>
</div>
 
 
</div>
 
))
 
}
 
 

 
 
 
 </div>


<div className="panel appointment-panel">

<h2>📅 Appointment Booking</h2>

<input
placeholder="Patient Name"
value={appointmentName}
onChange={(e)=>setAppointmentName(e.target.value)}
/>

<br/><br/>

<input
type="date"
value={appointmentDate}
onChange={(e)=>setAppointmentDate(e.target.value)}
/>

<br/><br/>

<button
className="add"
onClick={bookAppointment}
>
Book Appointment
</button>

<br/><br/>

{
appointments.length===0 ?

<p>No Appointments</p>

:

appointments.map((a,index)=>(

<div className="queue-item" key={index}>

<div>
<strong>{a.name}</strong>
<br/>
<small>👨‍⚕️ {a.doctor}</small>
</div>

<span>{a.date}</span>

<button
className="done"
onClick={()=>setAppointments(appointments.filter((_,i)=>i!==index))}
>
Delete
</button>

</div>

))
}

</div>


<div className="panel appointment-panel">

<h2>📋 Consultation History</h2>

{
history.length===0 ?

<p>No Patients Served Yet</p>

:

history.map((p,index)=>(

<div className="queue-item" key={index}>

<div>
<strong>#{p.tokenNo}</strong>
<br/>
{p.name}
</div>

<small>
👨‍⚕️ {p.doctor}
</small>

</div>

))
}

</div>


<div className="panel appointment-panel">

<h2>📊 Dashboard Overview</h2>

<BarChart width={420} height={220} data={[
  {name:"Served", value:servedCount},
  {name:"Waiting", value:patients.length},
  {name:"Emergency", value:patients.filter(p=>p.priority==="Emergency").length},
  {name:"Appointments", value:appointments.length}
]}>
  <CartesianGrid strokeDasharray="3 3"/>
  <XAxis dataKey="name"/>
  <YAxis allowDecimals={false}/>
  <Tooltip/>
  <Bar dataKey="value" fill="#3b82f6"/>
</BarChart>

</div>


<footer>

Queue Cure '26 • Real-Time Clinic Queue Management

</footer>
 

 
 
</div>
 
 
);
 
 
}
 
 
export default App;