import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { BsChatDotsFill, BsPersonCircle, BsPeopleFill } from "react-icons/bs";
import { IoSendSharp, IoExitOutline } from "react-icons/io5";
import { FiSettings } from "react-icons/fi";
import { RiSignalTowerLine } from "react-icons/ri";

const URL = "http://localhost:8081";
export const socket = io(URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: string;
}

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState(`User-${Math.floor(Math.random() * 1000)}`);
  const [isJoined, setIsJoined] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const joinRoom = useCallback(() => {
    if (room.trim() === "") {
      toast.error("Please enter a room name");
      return;
    }
    if (username.trim() === "") {
      toast.error("Please enter a username");
      return;
    }
    socket.emit("join_room", room);
    setIsJoined(true);
    toast.success(`Joined room: ${room}`);
  }, [room, username]);

  const leaveRoom = useCallback(() => {
    socket.emit("leave_room", room);
    setIsJoined(false);
    setMessages([]);
    toast.success("Left the room");
  }, [room]);

  const sendMessage = useCallback(() => {
    if (message.trim() === "") return;

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      text: message,
      timestamp: new Date().toISOString(),
      sender: username,
    };

    socket.emit("send_message", { message: newMessage, room });
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  }, [message, room, username]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isJoined) {
          joinRoom();
        } else {
          sendMessage();
        }
      }
    },
    [isJoined, joinRoom, sendMessage]
  );

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      toast.success("Connected to server");
    };
    const onDisconnect = () => {
      setIsConnected(false);
      toast.error("Disconnected from server");
    };
    const onReceiveMessage = (data: { message: Message }) => {
      setMessages((prev) => [...prev, data.message]);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive_message", onReceiveMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive_message", onReceiveMessage);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto p-4 h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <BsChatDotsFill className="h-7 w-7" />
                <div>
                  <h1 className="text-2xl font-bold">Real-Time Chat</h1>
                  <p className="text-violet-200 text-sm">Connected Users: {messages.length}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-violet-500/30 px-3 py-1.5 rounded-full">
                  <RiSignalTowerLine className={`h-4 w-4 ${isConnected ? "text-green-400" : "text-red-400"}`} />
                  <span className="text-sm font-medium">{isConnected ? "Connected" : "Disconnected"}</span>
                </div>
                {isJoined && (
                  <button
                    onClick={leaveRoom}
                    className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <IoExitOutline className="h-4 w-4" />
                    <span className="text-sm font-medium">Leave Room</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 hover:bg-violet-500/30 rounded-full transition-colors"
                >
                  <FiSettings className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {!isJoined ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                  >
                    <div className="text-center mb-8">
                      <div className="bg-violet-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BsPersonCircle className="h-10 w-10 text-violet-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Welcome to Chat</h2>
                      <p className="mt-2 text-gray-600">Join a room to start chatting</p>
                    </div>
                    <div className="space-y-6 bg-white p-8 rounded-2xl shadow-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow hover:shadow-md"
                          placeholder="Enter your username..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                        <input
                          type="text"
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow hover:shadow-md"
                          placeholder="Enter room name..."
                        />
                      </div>
                      <button
                        onClick={joinRoom}
                        className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium"
                      >
                        Join Room
                      </button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex ${msg.sender === username ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl p-4 shadow-md ${
                                msg.sender === username
                                  ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white"
                                  : "bg-white border border-gray-100"
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <BsPersonCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">{msg.sender}</span>
                              </div>
                              <p className="text-sm">{msg.text}</p>
                              <div className="mt-1 text-xs opacity-75 text-right">
                                {format(new Date(msg.timestamp), "HH:mm")}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  <div className="p-4 border-t bg-white">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-3 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow hover:shadow-md"
                        placeholder="Type your message..."
                      />
                      <button
                        onClick={sendMessage}
                        className="px-6 bg-violet-600 text-white rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                      >
                        <IoSendSharp className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            {showSidebar && isJoined && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80 border-l bg-gray-50 p-4"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <BsPeopleFill className="mr-2" /> Room Information
                  </h3>
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <p className="text-sm text-gray-600">Room Name:</p>
                    <p className="text-lg font-medium text-gray-900">{room}</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Your Username:</p>
                      <p className="text-lg font-medium text-gray-900">{username}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;