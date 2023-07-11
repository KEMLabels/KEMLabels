import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Navbar.css';

function Navbar() {

    return (
        <header id="header">
            <div id="headContainer">
                <a id="logo" href="/">
                    <h2>LabelMaster</h2>
                </a>

                <div id="navbar">
                    <ul id="navMenu">
                        
                    </ul>
                </div>
            </div>
        </header>
    );
}

export default Navbar;
