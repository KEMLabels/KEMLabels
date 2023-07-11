import React, {useEffect, useState} from 'react';
import {useNavigate, Link} from "react-router-dom";
import axios from "axios";

function Login() {

  const history = useNavigate();

  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')

  async function submit(e) {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8081/Signin", {
        email,password
      })
      .then(res=>{
        if(res.data = "exists") {
          history("/");
        } else {
          alert("NOT WORKING!!!");
        }
      })
      .catch(e=> {
        alert("wrong details");
        console.log(e);
      })
    } catch {
      console.log(e);
    }
  }

  return (
    <div className='login'>
      <form action='POST'>
        <input type='text' onChange={(e) => { setEmail(e.target.value) }} placeholder='Email' name='' id='' />
        <input type='text' onChange={(e) => { setPassword(e.target.value) }} placeholder='Password' name='' id='' />

        <input type='submit' onClick={submit}/>
      </form>
      <br />
      <p>If you don't have an account please sign up: <Link to="/Signup">Here</Link></p>
      <br />
    </div>
  )
}

export default Login