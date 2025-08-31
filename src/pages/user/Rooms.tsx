import RoomsService from "../../api/user/rooms/rooms";

function Rooms() {
    const RoomsSelect = async () => {
        const res = await RoomsService.RoomsSelect();
        console.log(res.data);
    }
    return (
        <>
            <button onClick={RoomsSelect}>RoomsSelect</button>
        </>
    );
};
export default Rooms;