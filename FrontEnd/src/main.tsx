import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SectionPdfViewer from "./pages/SectionPdfViewer";
import TestQuestionBuilder from "./pages/TestQuestionBuilder";

createRoot(document.getElementById("root")!).render(<App />);
