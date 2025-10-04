import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Spinner = ({ path = "login" }) => {
  const [count, setCount] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevValue) => {
        const newValue = prevValue - 1;
        if (newValue <= 0) {
          // Build correct path
          const targetPath = path ? `/${path}` : '/';
          navigate(targetPath, {
            state: location.pathname,
          });
          return 0; // Prevent further countdown
        }
        return newValue;
      });
    }, 1000);

    // Clean up timer
    return () => clearInterval(interval);
  }, [navigate, location.pathname, path]); // Remove count dependency

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <h1 className="text-center">
        redirecting to you in {count} {count === 1 ? 'second' : 'seconds'}
      </h1>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;