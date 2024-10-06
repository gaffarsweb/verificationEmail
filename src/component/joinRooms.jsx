import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import PlayGround from "./playGround";

const JoinRoome = () => {
    const SOCKET_SERVER_URL = "http://localhost:3001";
    const [loading, setLoading] = useState(false);
    const [showPlayGround, setShowPlayGround] = useState(false);
    const [userName, setUserName] = useState('');
    const [socket, setSocket] = useState(null); // Single socket instance
    const [roomId, setroomId] = useState(null); // Single socket instance

    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };

    const query = useQuery();
    const gameId = query.get("gameId");

    const handleJoinRoom = async () => {
        if (!userName) {
            alert("Please enter a username");
            return;
        }

        try {
            const response = await axios.post(`http://localhost:3001/v1/playing-room/create-update`, { userName });
            if (response.data.code === 200 || response.data.code === 201) {
                const roomId = response.data.data.data._id;
                setLoading(true);
                setroomId(roomId)
                socket.emit('joinedRoom', { roomId });

                socket.on('roomUpdates', (e) => {
                    console.log('response socket', e);
                    if (e?.roomData?.status === 'playing') {
                        setShowPlayGround(true);
                    }
                });
            }
        } catch (error) {
            console.error("Error joining room:", error);
        }
    };

    useEffect(() => {
        // Initialize the socket connection once
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        // Cleanup on component unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <div>
            {showPlayGround ? (
                <PlayGround roomId = {roomId} userName={userName} socket={socket} />
            ) : (
                <div>
                    {loading ? (
                        <p style={{ color: "white", fontSize: '20px' }}>Loading....</p>
                    ) : (
                        <div>
                            <input
                                type="text"
                                placeholder="Enter Username"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                            <button onClick={handleJoinRoom}>Join Room</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JoinRoome;
