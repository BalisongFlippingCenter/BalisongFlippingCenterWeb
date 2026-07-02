import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { AppDispatch } from "../../../redux/store";
import { loginWithGoogle } from "../../../redux/auth/authActions";
import { setCollection } from "../../../redux/collection/collectionSlice";
import { mapCollection } from "../../../redux/collection/collectionActions";

interface Props {
  iconOnly?: boolean;
  label?: string;
}

const GoogleLoginComponent = ({ iconOnly = false, label = "Sign in with Google" }: Props) => {
  const dispatch   = useDispatch<AppDispatch>();
  const navigate   = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setIsLoading(true);
      setError("");
      dispatch(loginWithGoogle(tokenResponse.access_token))
        .unwrap()
        .then((res: any) => {
          dispatch(setCollection(mapCollection(res.collection)));
          // isNewUser flag from backend signals the user needs to pick a display name
          if (res.isNewUser) {
            navigate("/google/setup");
          } else {
            navigate("/community");
          }
        })
        .catch((err: any) => {
          setError(typeof err === "string" ? err : "Google sign-in failed. Please try again.");
        })
        .finally(() => setIsLoading(false));
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed.");
    },
  });

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        disabled={isLoading}
        className="disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faGoogle} style={{ color: "black" }} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        disabled={isLoading}
        className="flex items-center w-full justify-center gap-3 px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all duration-200 text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white/60 animate-spin" />
        ) : (
          <FontAwesomeIcon icon={faGoogle} className="text-blue-primary text-base" style={{ display: "block", transform: "translateY(-1px)" }} />
        )}
        <span style={{ lineHeight: 1 }}>{isLoading ? "Signing in..." : label}</span>
      </button>
      {error && <p className="text-red text-xs text-center">{error}</p>}
    </div>
  );
};

export default GoogleLoginComponent;
