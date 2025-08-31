import api from "../../Api";

async function RoomsSelect() {
    return await api.get("/user/rooms");
}




const RoomsService = {
    RoomsSelect,

}

export default RoomsService;