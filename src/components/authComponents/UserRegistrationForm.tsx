import { FormEvent, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../redux/store";
import { registerNewUser } from "../../redux/auth/authActions";
import { clearError, setError } from "../../redux/auth/authSlice";
import { useAppSelector } from "../../redux/hooks";
import GoogleLoginComponent from "./login/GoogleLoginComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faGlobe, faEarthAmericas, faTv, faEye, faEyeSlash, faCheck } from "@fortawesome/free-solid-svg-icons";

const badDisplayNames = [
  "fuck", "bitch", "cunt", "shit", "crap", "dick", "cock", "pussy", "twat",
  "penis", "vagina", "testicles", "cum", "sperm", "spunk", "orgasm",
  "cunnilingus", "analingus", "sex", "coitus", "anal",
];

const UserRegistrationForm = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [displayNameFocused, setDisplayNameFocused] = useState(false);

  const hasMinLength = password.length >= 7;
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const knownErrors = ["Email already exists.", "*Inappropriate display name.*", "*Passwords do not match.*"];

  const isLoading = useAppSelector((state) => state.auth.loading);
  const isError = useAppSelector((state) => state.auth.error);
  const errMsg = useAppSelector((state) => state.auth.errorMsg);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(clearError());
  }, []);

  const handleDisplayNameChange = (e: string) => {
    setDisplayName(e);
    if (buttonDisabled) setButtonDisabled(false);
    dispatch(clearError());
  };

  const handlePasswordChange = (e: string) => {
    setPassword(e);
    if (buttonDisabled) setButtonDisabled(false);
    dispatch(clearError());
  };

  const handleConfirmedPasswordChange = (e: string) => {
    setConfirmedPassword(e);
    if (buttonDisabled) setButtonDisabled(false);
    dispatch(clearError());
  };

  const passwordCheck = () => {
    if (password.trim() !== confirmedPassword.trim()) {
      dispatch(setError("*Passwords do not match.*"));
      passwordRef.current?.focus();
      setButtonDisabled(true);
      return false;
    }
    return true;
  };

  const displayNameCheck = () => {
    if (displayName === "") return true;
    const holderVal = displayName.trim().toLocaleLowerCase();
    for (let i = 0; i < badDisplayNames.length; i++) {
      if (holderVal.includes(badDisplayNames[i])) {
        dispatch(setError("*Inappropriate display name.*"));
        displayNameRef.current?.focus();
        setButtonDisabled(true);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordCheck()) return;
    if (!displayNameCheck()) return;

    dispatch(
      registerNewUser({
        email: email.trim(),
        displayName: displayName.trim(),
        password: password.trim(),
      })
    )
      .unwrap()
      .then(() => {
        navigate("/login");
      })
      .catch(() => {});
  };

  return (
    <section className="min-h-[calc(100vh_-_48px)] flex justify-center items-center px-4 py-12 short:py-4">
      <div className="flex md:flex-row xsm:flex-col w-full max-w-5xl rounded-xl overflow-hidden border border-white/10" style={{ boxShadow: '0 0 120px rgba(255,255,255,0.18), 0 0 40px rgba(255,255,255,0.08), 0 8px 48px rgba(0,0,0,0.8)' }}>

        {/* Left — branding panel (hidden on small screens) */}
        <div className="md:flex xsm:hidden md:w-5/12 flex-col justify-start gap-6 px-10 py-14 bg-[#07080b] border-r border-white/10 relative overflow-hidden">

          {/* Site name */}
          <div>
            <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-2">Welcome to</p>
            <h1 className="font-black text-3xl text-white leading-tight">
              <span className="text-blue-primary">Balisong</span> Flipping Center
            </h1>
          </div>

          {/* Tagline */}
          <div>
            <p className="text-white/70 text-lg leading-relaxed">
              Start your flipping journey today. Join a community of collectors, flippers, and makers from around the world.
            </p>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 w-fit">
            <FontAwesomeIcon icon={faUsers} className="text-blue-primary text-sm" />
            <span className="text-white/60 text-sm">
              Join <span className="text-white font-semibold">2,400+</span> flippers worldwide
            </span>
          </div>

          {/* Pillars */}
          <div className="flex flex-col gap-3 mt-2">
            {[
              { icon: faGlobe, label: "Community", desc: "Posts, collections & profiles" },
              { icon: faEarthAmericas, label: "Product World", desc: "Knives, makers & specs" },
              { icon: faTv, label: "Tutorial Center", desc: "Tricks, combos & clips" },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-primary/10 border border-blue-primary/20 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={icon} className="text-blue-primary text-xs" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-none">{label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider + Login link */}
          <div className="border-t border-white/10 pt-5 mt-auto flex items-center gap-2 text-sm text-white/50">
            <span>Already have an account?</span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-primary hover:brightness-125 transition-[filter] duration-200 font-medium"
            >
              Sign in
            </button>
          </div>
        </div>

        {/* Right — form panel */}
        <form
          className="md:w-7/12 xsm:w-full flex flex-col gap-4 px-10 py-14 bg-dark-neutral-offset md:rounded-none xsm:rounded-xl"
          onSubmit={handleSubmit}
        >
          <h2 className="text-white font-extrabold text-4xl mb-1">Create an account</h2>

          {/* Google Sign Up */}
          <GoogleLoginComponent label="Sign up with Google" />

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
              <p className={`text-red text-xs transition-opacity duration-200 ${isError && errMsg === "Email already exists." ? "opacity-100" : "opacity-0"}`}>
                Email already exists.
              </p>
            </div>
            <input
              type="email"
              required
              ref={emailRef}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-white/25"
            />
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-white/60 text-sm font-medium">
                Display Name <span className="text-white/30 font-normal">(optional)</span>
              </label>
              <p className={`text-red text-xs transition-opacity duration-200 ${isError && errMsg === "*Inappropriate display name.*" ? "opacity-100" : "opacity-0"}`}>
                Inappropriate display name.
              </p>
            </div>
            <input
              type="text"
              ref={displayNameRef}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              onFocus={() => setDisplayNameFocused(true)}
              onBlur={() => setDisplayNameFocused(false)}
              value={displayName}
              placeholder="How you'll appear to others"
              className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-white/25"
            />

            {/* Focus-triggered hints */}
            <div
              className="overflow-hidden transition-all duration-700 ease-in-out flex flex-col gap-1.5"
              style={{ maxHeight: displayNameFocused ? "5rem" : "0", opacity: displayNameFocused ? 1 : 0 }}
            >
              <p className="text-xs text-white/25">
                Letters, numbers and ! . _ allowed · Minimum 4 characters
              </p>
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-xs">Preview:</span>
                <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <span className="text-white text-xs font-medium">{displayName.trim() || "YourName"}</span>
                  <span className="text-white/20 text-xs">#4821</span>
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                ref={passwordRef}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                value={password}
                placeholder="••••••••"
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
            {/* Password requirements */}
            <div
              className="overflow-hidden transition-all duration-700 ease-in-out"
              style={{ maxHeight: passwordFocused ? "6rem" : "0", opacity: passwordFocused ? 1 : 0 }}
            >
              <div className="flex flex-col gap-1 pt-0.5">
                {[
                  { label: "At least 7 characters", met: hasMinLength },
                  { label: "One capital letter", met: hasCapital },
                  { label: "One special character", met: hasSpecial },
                ].map(({ label, met }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faCheck}
                      className={`text-[10px] transition-colors duration-200 ${met ? "text-green" : "text-white/20"}`}
                    />
                    <span className={`text-xs transition-colors duration-200 ${met ? "text-green" : "text-white/30"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-white/60 text-sm font-medium">Confirm Password</label>
              <p className={`text-red text-xs transition-opacity duration-200 ${isError && errMsg === "*Passwords do not match.*" ? "opacity-100" : "opacity-0"}`}>
                Passwords do not match.
              </p>
            </div>
            <div className="relative">
              <input
                type={showConfirmedPassword ? "text" : "password"}
                required
                ref={confirmPasswordRef}
                onChange={(e) => handleConfirmedPasswordChange(e.target.value)}
                value={confirmedPassword}
                placeholder="••••••••"
                className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 pr-10 outline-none transition-colors duration-200 placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={() => setShowConfirmedPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={showConfirmedPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Mobile — already have an account */}
          <p className="md:hidden xsm:block text-center text-sm text-white/50">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-primary hover:brightness-125 transition-[filter] duration-200 font-medium"
            >
              Sign in
            </button>
          </p>

          <div className="relative h-4 -mt-2">
            <p className={`absolute inset-0 text-red text-xs text-center transition-opacity duration-200 ${isError && errMsg && !knownErrors.includes(errMsg) ? "opacity-100" : "opacity-0"}`}>
              {errMsg && !knownErrors.includes(errMsg) ? errMsg : ""}
            </p>
          </div>

          {/* Submit */}
          {isLoading ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-lg bg-blue-primary/50 text-white/50 font-semibold text-sm cursor-not-allowed mt-1"
            >
              Creating account...
            </button>
          ) : (
            <button
              type="submit"
              disabled={buttonDisabled}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm mt-1 transition-[filter] duration-200 ${
                buttonDisabled
                  ? "bg-blue-primary/40 text-white/40 cursor-not-allowed"
                  : "bg-blue-primary text-white hover:brightness-110"
              }`}
            >
              Create Account
            </button>
          )}
        </form>

      </div>
    </section>
  );
};

export default UserRegistrationForm;







