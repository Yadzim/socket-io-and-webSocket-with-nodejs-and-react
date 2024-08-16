import "./App.css";
import {io} from "socket.io-client";
import { useEffect, useState } from "react";

// const socket = io.connect("http://localhost:3001");
// const URL = "ws://213.230.109.85:8045/ws";
const URL = "http://localhost:8081";
export const socket = io(URL);

function App() {

  const [isConnected, setIsConnected] = useState(socket.connected);

  //Room State
  const [room, setRoom] = useState("");

  // Messages States
  const [message, setMessage] = useState("");
  const [messageReceived, setMessageReceived] = useState<string[]>([]);

  const joinRoom = () => {
    if (room !== "") {
      socket.emit("join_room", room);
    }
  };

  const sendMessage = () => {
    socket.emit("send_message", { message, room });
  };

  useEffect(() => {

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on("receive_message", (data) => {
      console.log(data);
      
      setMessageReceived( p => [ ...p, data.message]);
    });

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('receive_message')
    };
  }, [socket]);

  return (
    <div className="App">
      <p>State: { '' + isConnected }</p>
      <input
        placeholder="Room Number..."
        onChange={(event) => {
          setRoom(event.target.value);
        }}
      />
      <button onClick={joinRoom}> Join Room</button>
      <br />
      <br />
      <input
        placeholder="Message..."
        onChange={(event) => {
          setMessage(event.target.value);
        }}
      />
      <button onClick={sendMessage}> Send Message</button>
      <h1> Message:</h1>
      {messageReceived?.map(e => <p>{e}</p>)}
    </div>
  );
}

export default App;