export const AppContext = React.createContext();
export const AppProvider = ({ children }) => {
  const [globalState, setGlobalState] = useState({
    sim_background_color: "#10009eb2",
    sim_foreground_color: "#10009eb2",
  });
  return (
    <AppContext.Provider value={{ globalState, setGlobalState }}>
      {" "}
      {children}{" "}
    </AppContext.Provider>
  );
};
