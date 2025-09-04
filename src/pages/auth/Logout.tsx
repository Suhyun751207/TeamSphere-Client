import { useEffect } from "react";
import AuthServer from "../../api/auth/auth";


function Logout(){
    useEffect(() => {
        AuthServer.Logout();
        window.location.href = "/auth/login";
    }, []);
    return(
        <></>
    )
}

export default Logout;