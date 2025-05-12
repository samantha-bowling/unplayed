import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type SteamUser = {
  steamId: string;
  personaName: string;
  avatar: string;
};

type SteamSessionContextType = {
  user: SteamUser | null;
  setUser: (user: SteamUser | null) => void;
  logout: () => void;
};

const SteamSessionContext = createContext<SteamSessionContextType | undefined>(undefined);

export const SteamSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<SteamUser | null>(null);

  useEffect(() => {
    const steamId = localStorage.getItem("steamId");
    const personaName = localStorage.getItem("personaName");
    const avatar = localStorage.getItem("avatar");

    if (steamId && personaName && avatar) {
      setUserState({ steamId, personaName, avatar });
    }
  }, []);

  const setUser = (user: SteamUser | null) => {
    if (user) {
      localStorage.setItem("steamId", user.steamId);
      localStorage.setItem("personaName", user.personaName);
      localStorage.setItem("avatar", user.avatar);
    } else {
      localStorage.removeItem("steamId");
      localStorage.removeItem("personaName");
      localStorage.removeItem("avatar");
    }

    setUserState(user);
  };

  const logout = () => {
    setUser(null);
    window.location.href = "/"; // or use `navigate()` if using react-router
  };

  return (
    <SteamSessionContext.Provider value={{ user, setUser, logout }}>
      {children}
    </SteamSessionContext.Provider>
  );
};

export const useSteamSession = (): SteamSessionContextType => {
  const context = useContext(SteamSessionContext);
  if (!context) {
    throw new Error("useSteamSession must be used within a SteamSessionProvider");
  }
  return context;
};
