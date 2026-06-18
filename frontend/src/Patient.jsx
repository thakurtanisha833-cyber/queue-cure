import {useState,useEffect} from "react";
import {io} from "socket.io-client";
import "./App.css";

const socket=io("http://localhost:5000");


function Patient(){

const [data,setData]=useState({
patients:[],
currentToken:null,
avgTime:10
});


useEffect(()=>{

socket.on("queueUpdate",(d)=>{
setData(d);
});


return ()=>socket.off("queueUpdate");

},[]);



return(

<div className="login-page">

<div className="login-card">


<h1>🏥 Queue Cure</h1>


<h2>
Now Serving
</h2>


<h1>
{
data.currentToken
?
"#"+data.currentToken.tokenNo
:
"--"
}
</h1>


<h2>
Patients Ahead
</h2>


<h1>
{data.patients.length}
</h1>



<h2>
Estimated Wait
</h2>


<h1>
{data.patients.length * data.avgTime} min
</h1>


</div>

</div>

)


}


export default Patient;