import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import PlayGround from "./playGround";

const JoinRoome = () => {
    const SOCKET_SERVER_URL = "http://localhost:3001";
    const [loading, setLoading] = useState(false);
    const [ifapiSuccess, setifapiSuccess] = useState(false);
    const [showPlayGround, setShowPlayGround] = useState(false);
    const [TrumpSelected, setTrumpSelected] = useState(false);
    const [userName, setUserName] = useState();
    const [socket, setSocket] = useState(null); // Single socket instance
    const [roomId, setroomId] = useState(null); // Single socket instance
    const [remaningCards, setremaningCards] = useState([])
    const [playedCards, setPlayedCards] = useState([])
    const [selfPlayer, setSelfPlayer] = useState({})
    const [playerTwo, setplayerTwo] = useState({})
    const [playerThree, setplayerThree] = useState({})
    const [playerFour, setplayerFour] = useState({})
    const [Opponents, setOpponents] = useState([])
    const [players, setplayers] = useState([])
    const [socketValue, setSocketValue] = useState(null)
    const [partner, setpartner] = useState([])
    const [socketId, setsocketId] = useState('');
    const [roomTimout, setroomTimout] = useState(0);

    const [teamOne, setteamOne] = useState(null)
    const [teamTwo, setteamTwo] = useState(null)

    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };
    const users = [
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLMm1tajMxOXFMY0xEUmZjQ09SaG1OUDNPeU5jIiwidHlwIjoiSldUIn0.eyJVc2VySWQiOiJVMm5RQ1Z3cjFtRmNENFJtSXBHSm56U2JPYmZ4IiwiYW1yIjpbInB3ZCJdLCJkcm4iOiJEU1IiLCJlbWFpbCI6InNlcGl0NjI5MTdAcGF4bncuY29tIiwiZXhwIjoxNzMxMzE3NTk3LCJpYXQiOjE3Mjg4OTgzOTcsImlzcyI6IlAybW1qMnpDakFDWFZ0YUs0aHczZTZzcXE1ZUYiLCJzdWIiOiJVMm5RQ1Z3cjFtRmNENFJtSXBHSm56U2JPYmZ4In0.h0ciwf0cWj9NgY5hMWWZEwZkoaHFR0qdKaEpe5NhUPL4xOJQUIQWkYL3ErGy0J6haXfpPYOX1m2_s0m2yEi6EQ2yiY3t16IJmt0Qk3Q4XCfaRHoM0i6sljU-iGrwoGc1yjTUg0_IOmyoGK36eAxE-iRW-xsYSM7jSs0GAILC1EUB6ZvxLCm7MZf6EomveHWDfqbQ0mD23Bqv08wUTxwMP61OpDZn7g8j8VjxEXuOffU_-fwl3-dfnEgMO0_sFyXrnWTTTL11IjqT4l7Wyr059EC01fUlCINowQ5m4vNVs1RV96qiBc-evTmVO2gJjp7F6QfwiI83ilYwpFQ0sWY7cg',
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLMm1tajMxOXFMY0xEUmZjQ09SaG1OUDNPeU5jIiwidHlwIjoiSldUIn0.eyJVc2VySWQiOiJVMm5RQ09JcDRhendBeERDeUNYc0NodWdhdEFzIiwiYW1yIjpbInB3ZCJdLCJkcm4iOiJEU1IiLCJlbWFpbCI6InJleW9saTMwOTNAc2tyYW5rLmNvbSIsImV4cCI6MTczMTMxNzY0MiwiaWF0IjoxNzI4ODk4NDQyLCJpc3MiOiJQMm1tajJ6Q2pBQ1hWdGFLNGh3M2U2c3FxNWVGIiwic3ViIjoiVTJuUUNPSXA0YXp3QXhEQ3lDWHNDaHVnYXRBcyJ9.QwWL23P_MsZNqhhJSsP5hNniKqtsk5zCt-8QP3CegQVTkIC7WCAwwzpudth-6IV3FVdfaF330dgRFt9QFFxOpXrnRn9JziFFQPmtcT9R9fbVE-HgyNrG8CEflXc4A2WksxckeJro_q4-wdBE-yxxDl59KY8MYxdtzWNg9HRO8lgm_Z8PhdUfR2FlrvqPm-AbX5Vl2eBDb9rtojG-8WCUjeAZQ_f7BluRwf2T0nv6VIybABEKVabIYEuF6kCrNslJ6NdBKpIGt0kIsDwJuQODbpuWsJ-OYprN9ZASt7GVd0TlFS8-01eQpZTT4imvaWrvW9Gz1u4Y1llgbaB38gWa8g',
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLMm1tajMxOXFMY0xEUmZjQ09SaG1OUDNPeU5jIiwidHlwIjoiSldUIn0.eyJVc2VySWQiOiJVMm5RQjBhb0ZyNXNpM0hoUXZFQ1pZR1JUUGpnIiwiYW1yIjpbInB3ZCJdLCJkcm4iOiJEU1IiLCJlbWFpbCI6ImZpY2FuZTI0MjNAcGF4bncuY29tIiwiZXhwIjoxNzMxMzE3Njc3LCJpYXQiOjE3Mjg4OTg0NzcsImlzcyI6IlAybW1qMnpDakFDWFZ0YUs0aHczZTZzcXE1ZUYiLCJzdWIiOiJVMm5RQjBhb0ZyNXNpM0hoUXZFQ1pZR1JUUGpnIn0.Xrv487vyUcUwFVz-2Rt-ex3h1YAqzSYk496yRAbM2GvO1S0_p2WEt2UnhBw6BB3Kow-0fxJ_pgvoaTQ3BQdLivCtcRob5i74YsW0p3hNu8zvWBStXwiNAOHEV2MFeU-zT8mkJzINdyeF79Y9gN2cRUtMkidQGP12pFjXFOOyVdYGz6F8k8b6cLTK3ouuvcIIapgAKeS5vL3qMA2L2Z2Z6PPcv75cj3EhXdOos3Pb9TGAX_ULKqrsNblwCZv8QH9pReu5oJCGYhEmDIWfla3LiFpfJQkA-m-26-Ywu-mObJMhu-2phrO_OtMKC0NN4kP_XlECriDibYUYJ2jZ6OnCGw',
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLMm1tajMxOXFMY0xEUmZjQ09SaG1OUDNPeU5jIiwidHlwIjoiSldUIn0.eyJVc2VySWQiOiJVMm5RQVJCTWNhWGxsd0xtaUlHSVBSMkRiRU4wIiwiYW1yIjpbInB3ZCJdLCJkcm4iOiJEU1IiLCJlbWFpbCI6InNvY2lwMzI0NDNAc2NhcmRlbi5jb20iLCJleHAiOjE3MzEzMTc3MTEsImlhdCI6MTcyODg5ODUxMSwiaXNzIjoiUDJtbWoyekNqQUNYVnRhSzRodzNlNnNxcTVlRiIsInN1YiI6IlUyblFBUkJNY2FYbGx3TG1pSUdJUFIyRGJFTjAifQ.I_sOnPSafrl2hutuHfMYghEFtHwWFISgzzckGNo2EymmFNTnT8XSm3zU9ppiAbo8LeqJHn_vABa5meCTT0_J8HHgUxPx1zw9a0ivCOfUDQlKnpkbGTWEZZZmVsyvK0AzltmCXrFBZmgMfsP-08zwnTfR4ZEfRxt-WOlDFHrmyTA7WiiIoYV1VIInpbqx-SMUbbYgH6ehfgoXCEejv3n1buHidpgH1PEzxHDOu754L34_kN6lZ2fgogc2Uk35sB--uONasdy3gU2inhkFDLuHvJgLgocGtsy5U9KkdKQom2nlAD5BKy0J2E0IJwirWunNBgNU6h7PjOhO3cuTzbRviA'
    ];
    const nameusers = [
        'sepit62917@paxnw.com',
        'reyoli3093@skrank.com',
        'ficane2423@paxnw.com',
        'socip32443@scarden.com'
    ]
    const userIds = [
        'U2nQCVwr1mFcD4RmIpGJnzSbObfx',
        'U2nQCOIp4azwAxDCyCXsChugatAs',
        'U2nQB0aoFr5si3HhQvECZYGRTPjg',
        'U2nQARBMcaXllwLmiIGIPR2DbEN0'
    ]
    const query = useQuery();
    const gameId = query.get("gameId");

    const handleJoinRoom = async () => {
        if (!userName) {
            alert("Please enter a username");
            return;
        }

        try {
            let username = Number(userName)
            const config = {
                headers: {
                    'Authorization': `Bearer ${users[username]}`
                }
            };
            console.log('type ofname', typeof username)
            setLoading(true);
            const response = await axios.post(`http://localhost:3001/v1/playing-room/create-update`, { socketId }, config);
            if (response.data.code === 200 || response.data.code === 201) {
                const roomId = response.data.data.data._id;
                setLoading(true);
                setroomId(roomId);
                setroomTimout(response.data.data.data?.timeOut)
                window.localStorage.setItem('roomId', roomId)
                socket.emit('joinedRoom', { roomId });

                socket.on('roomUpdates', (e) => {
                    console.log('response socket', e);
                    if (e?.roomData?.status === 'playing') {
                        setShowPlayGround(true);
                    }
                });
                setTimeout(() => {
                    if (response.data.data.data?.timeOut !== 0) {
                        let number = 4 - response.data.data.data.players.length;
                        console.log('in bot connection', number);
                
                        for (let i = 0; i < number; i++) {
                            setTimeout(() => {
                                socket.emit('joinBot', { roomId });
                                console.log('timer out is existed');
                            }, i * 8000); // Delay each iteration by i * 8000 milliseconds
                        }
                        setroomTimout(0);
                    }
                }, 30000); // 60000 milliseconds = 60 seconds
            }
        } catch (error) {
            console.error("Error joining room:", error);
        } finally {
        }
    };
    const handleCheckRoomExi = async (userName) => {
        try {
            console.log('user name sdfsfsdfdfd', userName)
            let username = Number(userName)
            const config = {
                headers: {
                    'Authorization': `Bearer ${users[username]}`
                }
            };
            console.log('type ofname', username)
            const response = await axios.get(`http://localhost:3001/v1/playing-room/check-room-status`, config);
            if (response.data.code === 200 || response.data.code === 201) {
                const roomId = response.data.data.data._id;
                setroomId(roomId)
                window.localStorage.setItem('roomId', roomId)
                if (response.data.data.data?.status === 'playing') {
                    setShowPlayGround(true);
                }
                if (response.data.data.data) {
                    let selfPlayer = response.data.data.data?.teamOne.find(p => p?.userName === users[username])
                        || response.data.data.data?.teamTwo.find(p => p?.userName === users[username]);
                    setSelfPlayer(selfPlayer);

                    let partner = [];
                    let opponents = [];
                    setTrumpSelected(response.data.data.data?.isTrumpSelected)

                    if (selfPlayer) {
                        if (response.data.data.data.teamOne[0]?.userName === selfPlayer.userName) {
                            setplayerThree(response.data.data.data.teamOne[1]);
                            setplayerTwo(response.data.data.data.teamTwo[0])
                            setplayerFour(response.data.data.data.teamTwo[1])
                        } else if (response.data.data.data.teamOne[1]?.userName === selfPlayer.userName) {
                            setplayerThree(response.data.data.data.teamOne[0]);
                            setplayerTwo(response.data.data.data.teamTwo[1])
                            setplayerFour(response.data.data.data.teamTwo[0])
                        }
                        if (response.data.data.data.teamTwo[0]?.userName === selfPlayer.userName) {
                            setplayerThree(response.data.data.data.teamTwo[1]);
                            setplayerTwo(response.data.data.data.teamOne[1])
                            setplayerFour(response.data.data.data.teamOne[0])
                        } else if (response.data.data.data.teamTwo[1]?.userName === selfPlayer.userName) {
                            setplayerThree(response.data.data.data.teamTwo[0]);
                            setplayerTwo(response.data.data.data.teamOne[0])
                            setplayerFour(response.data.data.data.teamOne[1])
                        }

                    }
                    // setTimeout(() => {
                    //     if (roomTimout !== 0) {
                    //         console.log('in bot connection', players);
                    //         for (let i = 0; i < players.length; i++) {
                    //             newSocket.emit('joinBot', { roomId });
                    //             console.log('timer out is existed');
                    //         }
                    //         setroomTimout(0);
                    //     }
                    // }, 60000); // 60000 milliseconds = 60 seconds    


                    setteamOne(response.data.data.data.teamOne);
                    setteamTwo(response.data.data.data.teamTwo);
                    setplayers(response.data.data.data.players);

                    console.log('eddddddddddddddddddddd', response.data.data.data)
                    if (response.data.data.data?.playedCards) {
                        setPlayedCards(response.data.data.data?.playedCards)
                    }
                    if (response.data.data.data?.totalCards) {
                        setremaningCards(response.data.data.data?.totalCards)
                    }
                    if (response.data.data.data?.status == 'playing') {
                        console.log('playing updated')
                    }

                    // setplayedGame(false)

                }
            }
        } catch (error) {
            console.error("Error joining room:", error);
        } finally {
        }
    };

    useEffect(() => {
        // Initialize the socket connection once
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);
        newSocket.on('connected', (e) => {
            if (e.socketId) {
                setsocketId(e.socketId)
            }
        })
        // Emit to the server that the user has joined a room
        newSocket.emit('joinedRoom', { roomId });
        let username = Number(userName)

        // Listen for room updates from the server
        newSocket.on('PlayerJoined', (e) => {
            console.log('players playaers', e)
        })
        newSocket.on('roomUpdates', (e) => {
            setSocketValue(e.roomData)
            if (e?.roomData) {
                let selfPlayer = e?.roomData?.teamOne.find(p => p?.userName === users[username])
                    || e?.roomData?.teamTwo.find(p => p?.userName === users[username]);
                setSelfPlayer(selfPlayer);

                let partner = [];
                let opponents = [];
                setTrumpSelected(e?.roomData?.isTrumpSelected)

                if (selfPlayer) {
                    if (e.roomData.teamOne[0]?.userName === selfPlayer.userName) {
                        setplayerThree(e.roomData.teamOne[1]);
                        setplayerTwo(e.roomData.teamTwo[0])
                        setplayerFour(e.roomData.teamTwo[1])
                    } else if (e.roomData.teamOne[1]?.userName === selfPlayer.userName) {
                        setplayerThree(e.roomData.teamOne[0]);
                        setplayerTwo(e.roomData.teamTwo[1])
                        setplayerFour(e.roomData.teamTwo[0])
                    }
                    if (e.roomData.teamTwo[0]?.userName === selfPlayer.userName) {
                        setplayerThree(e.roomData.teamTwo[1]);
                        setplayerTwo(e.roomData.teamOne[1])
                        setplayerFour(e.roomData.teamOne[0])
                    } else if (e.roomData.teamTwo[1]?.userName === selfPlayer.userName) {
                        setplayerThree(e.roomData.teamTwo[0]);
                        setplayerTwo(e.roomData.teamOne[0])
                        setplayerFour(e.roomData.teamOne[1])
                    }

                }


                setteamOne(e.roomData.teamOne);
                setteamTwo(e.roomData.teamTwo);
                setplayers(e.roomData.players);

                console.log('eddddddddddddddddddddd', e?.roomData)
                if (e?.roomData?.playedCards) {
                    setPlayedCards(e?.roomData?.playedCards)
                }
                if (e?.roomData?.totalCards) {
                    setremaningCards(e?.roomData?.totalCards)
                }
                if (e?.roomData?.status == 'playing') {
                    console.log('playing updated')
                }

                // setplayedGame(false)

            }
        });
        // users.map((item,i)=>{
        //     handleCheckRoomExi(i)
        // })
        // Cleanup on component unmount

               

        newSocket.on('PlayerJoined', (e) => {
            console.log('PlayerJoined', e)
        });
        newSocket.on('InitializeRound', (e) => {
            console.log('InitializeRound', e)
        });
        newSocket.on('NotifyTrumpSelectorPlayer', (e) => {
            console.log('NotifyTrumpSelectorPlayer', e)
        });
        newSocket.on('OrderPassCall', (e) => {
            console.log('OrderPassCall', e)
        });
        newSocket.on('CardPlayed', (e) => {
            console.log('CardPlayed', e)
        });
        newSocket.on('NextTurn', (e) => {
            console.log('NextTurn', e)
        });
        newSocket.on('TrickEndResult', (e) => {
            console.log('TrickEndResult', e)
        });
        newSocket.on('RoundEndResult', (e) => {
            console.log('RoundEndResult', e)
        });
        newSocket.on('RemovedCard', (e) => {
            console.log('RemovedCard', e)
        });
        newSocket.on('AskTeamOrAlone', (e) => {
            console.log('AskTeamOrAlone', e)
        });
        return () => {
            newSocket.disconnect();
        };


    }, [showPlayGround,]);

    return (
        <div>
            {showPlayGround ? (
                <PlayGround setplayerFour={setplayerFour} playerFour={playerFour} setplayerThree={setplayerThree} playerThree={playerThree} setplayerTwo={setplayerTwo} playerTwo={playerTwo} partner={partner} setpartner={setpartner} setteamOne={setteamOne} setteamTwo={setteamTwo} teamOne={teamOne} teamTwo={teamTwo} TrumpSelected={TrumpSelected} setTrumpSelected={setTrumpSelected} setplayers={setplayers} players={players} playedCards={playedCards} setPlayedCards={setPlayedCards} setSocketValue={setSocketValue} socketValue={socketValue} setremaningCards={setremaningCards} selfPlayer={selfPlayer} Opponents={Opponents} setOpponents={setOpponents} setSelfPlayer={setSelfPlayer} remaningCards={remaningCards} roomId={roomId} userName={userName} socket={socket} />
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
