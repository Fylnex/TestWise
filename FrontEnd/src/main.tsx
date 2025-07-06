import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SectionPdfViewer from "./pages/learning/sections/SectionPdfViewer.tsx";
import TestQuestionBuilder from "./pages/learning/tests/TestQuestionBuilder.tsx";

createRoot(document.getElementById("root")!).render(<App />);
