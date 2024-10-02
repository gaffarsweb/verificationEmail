import React, { useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  };

  const query = useQuery();
  console.log(query)
  const paramValue = query.get("token"); // Replace 'yourParam' with your query param key
  console.log(paramValue)

  const handleVerifyClick = async () => {
    setLoading(true);
    setApiFailed(false);

    try {
      const response = await axios.post(`http://localhost:3001/v1/user/verify-mail?token=${paramValue}`, { /* data */ });
      console.log(response)
      if (response.data.code === 200) {

        setVerified(true);
      }
    } catch (error) {
      
      setApiFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    setResendLoading(true);

    try {
      const response = await axios.post("https://example.com/api/resend-link", { /* data */ });
      if (response.status === 200) {
        setResendSuccess(true);
      }
    } catch (error) {
      console.error("Resend link failed", error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {!verified && !resendSuccess && (
        <>
          {/* Verify Button */}
          <button
            style={{
              ...styles.button,
              backgroundColor: verified ? "green" : "#007bff",
              cursor: loading || resendLoading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
            onClick={handleVerifyClick}
            disabled={loading || resendLoading}
          >
            {loading ? "Loading..." : verified ? "Verified" : "Verify"}
          </button>

          {/* Resend Button */}
          {apiFailed && (
            <button
              style={{
                ...styles.button,
                backgroundColor: resendLoading ? "#007bff" : "#dc3545",
                cursor: resendLoading ? "not-allowed" : "pointer",
                marginTop: "10px",
                opacity: resendLoading ? 0.6 : 1
              }}
              onClick={handleResendClick}
              disabled={resendLoading || loading}
            >
              {resendLoading ? "Resending..." : "Resend Link"}
            </button>
          )}
        </>
      )}

      {/* Message after Resend Success */}
      {resendSuccess && (
        <p style={styles.successText}>Link sent to your email, please check your inbox.</p>
      )}
      {verified && (
        <p style={styles.successText}>Your email has been verified! You can now enjoy your game.</p>
      )}
      {apiFailed && !resendSuccess ?
        <p style={styles.successText}>The token has expired. You can resend the verification link.</p>
      : null}
    </div>
  );
};

// Basic styles for the container and buttons
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "50px"
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    transition: "background-color 0.3s ease",
  },
  successText: {
    marginTop: "20px",
    fontSize: "16px",
    color: "green",
  }
};

export default Home;
