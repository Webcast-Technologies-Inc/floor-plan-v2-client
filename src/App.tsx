import { Route, Routes } from "react-router-dom";
import FloorPlan from "./pages/FloorPlan";
import Home from "./pages/Home";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/floor-plan" element={<FloorPlan />} />
        </Routes>
    );
}

export default App;
