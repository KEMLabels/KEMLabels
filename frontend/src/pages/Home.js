import React from 'react'
import './css/Home.css';
import Navbar from '../components/Navbar';

function Home() {
  return (
    <div className='Home'>
      <Navbar/>
      <header className="header">
        <h1>Welcome</h1>
      </header>
      <main className="main-content">
        {/* Rest of your content goes here */}
      </main>
    </div>
  )
}

export default Home