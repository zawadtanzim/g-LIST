import axios from "axios";
import supabase from "./client";

const getAxiosClient = async () => {
  
  const currentSession = await supabase.auth.getSession();

  const instance = axios.create({
    headers: {
      Authorization: `Bearer ${currentSession.data.session.access_token}`,
    },
  });

  return instance;
};

export default getAxiosClient;
