import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearSession } from "../redux/actions/UserAction";
import axios from "../api/axios";
import Log from "./Log";

export default function InactivityTimer() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const inactivityThreshold = 600000; // 10 minutes (600000 milliseconds)
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  useEffect(() => {
    if (isLoggedIn) {
      const checkInactivity = async () => {
        const currentTime = Date.now();
        if (currentTime - lastActivityTime > inactivityThreshold) {
          await axios
            .get("/logout", { withCredentials: true })
            .then((res) => {
              Log(res);
              dispatch(clearSession());
              window.location.reload();
            })
            .catch((err) => Log("Error: ", err));
        }
      };

      const resetActivityTimer = () => {
        setLastActivityTime(Date.now());
      };

      const intervalId = setInterval(checkInactivity, 1000); // Check every second

      // Reset the activity timer when there is user activity (e.g., mousemove, keydown)
      window.addEventListener("mousemove", resetActivityTimer);
      window.addEventListener("keydown", resetActivityTimer);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener("mousemove", resetActivityTimer);
        window.removeEventListener("keydown", resetActivityTimer);
      };
    }
  }, [dispatch, isLoggedIn, inactivityThreshold, lastActivityTime]);

  return null; // This component doesn't render anything
}
