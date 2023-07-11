import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/Signin" element={<Login/>}></Route>
          <Route path="/Signup" element={<Signup/>}></Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
