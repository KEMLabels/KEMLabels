import axios from "axios";
import { isDevelopmentEnv } from "../utils/Helpers";

const endpoint = isDevelopmentEnv()
  ? process.env.REACT_APP_DEV_BACKEND_SERVER || ""
  : process.env.REACT_APP_PROD_BACKEND_SERVER || "";
export default axios.create({
  baseURL: endpoint + "/api/v1",
});
