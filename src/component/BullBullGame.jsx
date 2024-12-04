import React, { useState } from 'react';
import axios from 'axios';
import './BullBullGame.css'; // Import the CSS file

function BullBullGame() {
    const [gameData, setGameData] = useState(null);
    const [results, setResults] = useState([]);

    const handleShuffle = async () => {
        try {
            // const response = await axios.post('http://localhost:3001/shuffle');
            const response = await axios.post('https://bullbullapi.onrender.com/shuffle');
            setGameData(response.data);
        } catch (error) {
            console.error("Error shuffling the deck", error);
        }
    };

    const handleFinish = async () => {
        try {
            // const response = await axios.post('http://localhost:3001/finish');
            const response = await axios.post('https://bullbullapi.onrender.com/finish');
            setResults(response.data.results);
        } catch (error) {
            console.error("Error calculating results", error);
        }
    };

    return (
        <div className="game-container">
            <div className="game-box">
                <h1 className="game-title">Bull Bull Poker Game</h1>

                <div className="game-controls">
                    <button
                        onClick={handleShuffle}
                        className="shuffle-button"
                    >
                        Shuffle Cards
                    </button>
                    <button
                        onClick={handleFinish}
                        className="finish-button"
                    >
                        Finish Game
                    </button>
                </div>

                {gameData && (
                    <div className="cards-section">
                        <div className="players-cards">
                            <h2 className="cards-title">Players' Cards</h2>
                            <div className="players-list">
                                {gameData.players.map(player => (
                                    <div key={player.id} className="player-card">
                                        <h3 className="player-name">Player {player.id}</h3>
                                        <div className="cards-list">
                                            {player.cards.map((card, index) => (
                                                <p key={index} className="card-detail">{card.value} of {card.suit}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="dealer-cards">
                            <h2 className="cards-title">Dealer's Cards</h2>
                            <div className="dealer-card">
                                <h3 className="dealer-name">Dealer</h3>
                                <div className="cards-list">
                                    {gameData.dealer.cards.map((card, index) => (
                                        <p key={index} className="card-detail">{card.value} of {card.suit}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="results-section">
                        <h2 className="results-title">Game Results</h2>
                        {results.map(result => (
                            <div key={result.player} className="result-item">
                                <p className="result-name">{result.player}</p>
                                <p className="result-detail">{result.result}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BullBullGame;
