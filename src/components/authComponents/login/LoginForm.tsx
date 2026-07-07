import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../../redux/store";
import { login } from "../../../redux/auth/authActions";
import { setToRememberLoginInfo, toggleOffRememberLoginInfo } from "../../../redux/auth/authSlice";
import { setCollection } from "../../../redux/collection/collectionSlice";
import { mapCollection } from "../../../redux/collection/collectionActions";
import { addUIToast } from "../../../redux/uiToast/uiToastSlice";
import GoogleLoginComponent from "./GoogleLoginComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const LoginForm = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topError, setTopError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const rememberInfo = useSelector((state: RootState) => state.auth.rememberLoginCredentials);

  const clearErrors = () => {
    setTopError("");
    setPasswordError("");
    setEmailError("");
  };

  const handleOnChangeEmail = (e: string) => {
    setEmail(e);
    if (buttonDisabled) setButtonDisabled(false);
    clearErrors();
  };

  const handleOnChangePassword = (e: string) => {
    setPassword(e);
    if (buttonDisabled) setButtonDisabled(false);
    clearErrors();
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (email.trim() === "" || password.trim() === "") return;

    setIsLoading(true);
    dispatch(login({ email, password }))
      .unwrap()
      .then((res) => {
        if (rememberInfo) localStorage.setItem("saved-user-email", email);
        dispatch(setCollection(mapCollection(res.collection)));
        dispatch(addUIToast({ type: "success", message: "Welcome back!" }));
        navigate("/community");
      })
      .catch((err: string) => {
        const msg = (err ?? "").toLowerCase();
        if (msg.includes("password") || msg.includes("invalid") || msg.includes("credentials")) {
          setPasswordError(err);
        } else if (msg.includes("verif") || msg.includes("unverified")) {
          setEmailError(err);
        } else {
          setTopError(err);
        }
        dispatch(addUIToast({ type: "error", message: "Sign in failed. Please check your credentials." }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (rememberInfo) {
      const fetchedEmail = localStorage.getItem("saved-user-email");
      if (fetchedEmail) setEmail(fetchedEmail);
    }
  }, []);

  return (
    <section className="h-[calc(100vh_-_48px)] flex justify-center items-center px-4 py-12">
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-dark-neutral-offset px-10 py-14 flex flex-col gap-4"
        style={{ boxShadow: '0 0 120px rgba(255,255,255,0.18), 0 0 40px rgba(255,255,255,0.08), 0 8px 48px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div className="mb-1">
          <p className="text-white/30 text-sm font-medium mb-1">
            <span className="text-blue-primary">Balisong</span> Flipping Center
          </p>
          <h2 className="text-white font-extrabold text-4xl">Welcome back</h2>
        </div>

        {/* Top error — generic/unexpected */}
        <p className={`text-red text-sm text-center transition-opacity duration-200 -mb-1 ${topError ? "opacity-100" : "opacity-0"}`}>
          {topError || "​"}
        </p>

        {/* Google Sign In */}
        <GoogleLoginComponent label="Sign in with Google" />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-white/60 text-sm font-medium">Email</label>
            <p className={`text-red text-xs transition-opacity duration-200 ${emailError ? "opacity-100" : "opacity-0"}`}>
              {emailError || "​"}
            </p>
          </div>
          <input
            type="email"
            ref={emailRef}
            required
            autoComplete="off"
            placeholder="you@example.com"
            onChange={(e) => handleOnChangeEmail(e.target.value)}
            value={email}
            className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-white/25"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-white/60 text-sm font-medium">Password</label>
            <p className={`text-red text-xs transition-opacity duration-200 ${passwordError ? "opacity-100" : "opacity-0"}`}>
              {passwordError || "​"}
            </p>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              ref={passwordRef}
              required
              placeholder="••••••••"
              onChange={(e) => handleOnChangePassword(e.target.value)}
              value={password}
              className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 pr-10 outline-none transition-colors duration-200 placeholder:text-white/25"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between px-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!rememberInfo}
              onChange={() => rememberInfo ? dispatch(toggleOffRememberLoginInfo()) : dispatch(setToRememberLoginInfo())}
              className="accent-blue-primary w-3.5 h-3.5"
            />
            <span className="text-white/50 text-xs">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-white/50 text-xs hover:text-blue-primary transition-colors duration-200"
          >
            Forgot password?
          </button>
        </div>


        {/* Submit */}
        {isLoading ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 rounded-lg bg-blue-primary/50 text-white/50 font-semibold text-sm cursor-not-allowed mt-1"
          >
            Signing in...
          </button>
        ) : (
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={buttonDisabled}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm mt-1 transition-[filter] duration-200 ${
              buttonDisabled
                ? "bg-blue-primary/40 text-white/40 cursor-not-allowed"
                : "bg-blue-primary text-white hover:brightness-110"
            }`}
          >
            Sign In
          </button>
        )}

        {/* Register link */}
        <p className="text-center text-sm text-white/50 mt-1">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-blue-primary hover:brightness-125 transition-[filter] duration-200 font-medium"
          >
            Create one
          </button>
        </p>

      </div>
    </section>
  );
};

export default LoginForm;

