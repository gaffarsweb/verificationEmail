import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import './index.css'
import TrumpBtn from "./trumpBtn";
import PlayerAloneModel from "./playaloneModel";

const PlayGround = ({ teamTwo, playerTwo, setplayerTwo, setplayerFour, playerFour, setplayerThree, playerThree, setpartner, partner, teamOne, setteamTwo, setteamOne, socketValue, TrumpSelected, setTrumpSelected, setSocketValue, setremaningCards, Opponents, selfPlayer, roomId, userName, socket, setSelfPlayer, setOpponents, remaningCards, }) => {
    // const SOCKET_SERVER_URL = "http://localhost:3001";
    // const socket = io(SOCKET_SERVER_URL);

    const [playedCards, setPlayedCards] = useState([])
    const [players, setplayers] = useState([])
    const [playedGame, setplayedGame] = useState()
    const [playaloneShow, setplayaloneShow] = useState(false)

    const users = [
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

    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };

    const selectedSymboles = (item) => {

        try {
            let username = Number(userName)
            socket.emit('TrumpCardSuitSelected', { roomId, card: item });


            socket.on('roomUpdates', async (e) => {
                console.log('eeeee', e)
                setSocketValue(e?.roomData)
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

                    setplayedGame(false)

                }
            });
        } catch (error) {
            console.log(error)
        }

    }
    const removeExtraCard = (item) => {

        try {
            let username = Number(userName)

            socket.emit('removeExtraCard', { roomId, card: item });


            socket.on('roomUpdates', async (e) => {
                console.log('eeeee', e)
                setSocketValue(e?.roomData)
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

                    setplayedGame(false)

                }
            });
        } catch (error) {
            console.log(error)
        }

    }
    const PlayedGame = (item) => {
        try {
            setplayedGame(true)
            socket.emit('gamPlayed', { roomId, card: item });

            let username = Number(userName)

            socket.on('roomUpdates', async (e) => {
                console.log('eeeee', e)
                setSocketValue(e?.roomData)
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

                    setplayedGame(false)

                }
            });
        } catch (error) {

        } finally {
            setplayedGame(false)
        }
    }
    // const query = useQuery();
    // const roomId = query.get("roomId");
    // const userName = query.get("userName");

    useEffect(() => {






    }, [roomId]);
    socket.on('roomUpdates', async (e) => {
        let username = Number(userName)

        console.log('eeeee', e)
        setSocketValue(e?.roomData)
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

            setplayedGame(false)

        }
    });
    return (
        <div class="">
            <div class="pontTable">
                {
                    players ?
                        players && players.map((p) => {

                            return (
                                p ?
                                    <div style={{ display: 'flex', color: "white", justifyContent: 'start', gap: "20px", margin: '5px 0px' }}>
                                        <p style={{ color: 'white' }}>{p?.userName}</p> :
                                        <p style={{ color: 'white' }}>{p?.points} Points</p>
                                    </div>
                                    : null
                            )
                        })
                        : null
                }
            </div>
            <div class="table">
                <p>Table</p>
            </div>
            <div class="remaningCards">
                {
                    socketValue?.isTrumpSelected && socketValue?.trumpSuit
                        ?
                        <p>{socketValue?.trumpSuit}</p>
                        :
                        <p>{remaningCards[0]}</p>

                }
            </div>
            {
                playedCards && playedCards.map((item, i) => {
                    // Define the marginLeft values based on the index
                    const marginLeftValues = ['-120px', '-80px', '-40px', '-0px', '40px', '80px', '120px', '160px'];
                    const marginLeft = marginLeftValues[i] || '0px'; // Default to '0px' if the index is out of range

                    return (
                        item
                            ?
                            <div key={i} style={{ marginLeft }} className="playedCards">
                                <p>{item?.card ? item?.card : item}</p>
                            </div> : null


                    );
                })

            }

            <div class="player player1">
                {
                    selfPlayer?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }

                <div style={{ color: 'white' }}>
                    {
                        selfPlayer?.isTurn && selfPlayer?.isTurn && socketValue?.isStarted ? 'Your Turn' : null
                    }
                </div>
                <div class="cards">
                    {selfPlayer?.cards?.length > 5 ? (
                        <div >
                            <p style={{ color: "white", fontSize: "18px" }}>Please Remove one Card</p>
                            <div class="cards">
                                {
                                    selfPlayer?.cards && selfPlayer?.cards.map((item) => (
                                        item !== 0 && item ?
                                            (
                                                <button onClick={() => removeExtraCard(item)} class="card">{item?.card ? item?.card : item}</button>
                                            ) : ''
                                    ))
                                }</div>
                        </div>) :
                        selfPlayer?.cards && selfPlayer?.cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={socketValue.isStarted == true && (playedGame) || !selfPlayer.isTurn || !selfPlayer?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">Player : {selfPlayer?.userName}</p>
            </div>

            <div class="player player2">
                {
                    playerTwo?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }
                <div style={{ color: 'white' }}>
                    {
                        playerTwo?.isTurn && playerTwo?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        playerTwo?.cards && playerTwo.cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={socketValue.isStarted == false && (playedGame) || !playerTwo.isTurn || !playerTwo?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {playerTwo?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player3">
                {
                    playerThree?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }
                <div style={{ color: 'white' }}>
                    {
                        playerThree?.isTurn && playerThree?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        playerThree?.cards && playerThree.cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={socketValue.isStarted == true && (playedGame) || !playerThree.isTurn || !playerThree?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {playerThree?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player4">
                {
                    playerFour?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }
                <div style={{ color: 'white' }}>
                    {
                        playerFour?.isTurn && playerFour?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        playerFour?.cards && playerFour.cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={socketValue.isStarted == true && (playedGame) || !playerFour.isTurn || !playerFour?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {playerFour?.userName || 'Waiting...'}
                </p>
            </div>
            <div style={{ position: "absolute", top: "60px", left: '38%' }}>
                {selfPlayer?.isTrumpShow && TrumpSelected == false ? (<TrumpBtn setplayaloneShow={setplayaloneShow} trumpRound={socketValue?.trumpRound} selectedSymboles={selectedSymboles} TrumpSelected={TrumpSelected} setTrumpSelected={setTrumpSelected} remaningCards={remaningCards} socket={socket} roomId={roomId} />) : null}
                {playaloneShow ? (<PlayerAloneModel setplayaloneShow={setplayaloneShow} userName={userName} trumpRound={socketValue?.trumpRound} selectedSymboles={selectedSymboles} TrumpSelected={TrumpSelected} setTrumpSelected={setTrumpSelected} remaningCards={remaningCards} socket={socket} roomId={roomId} />) : null}
            </div>
        </div>
    );
};
export default PlayGround;
