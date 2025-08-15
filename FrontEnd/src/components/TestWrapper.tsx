import React from "react";
import { useParams } from "react-router-dom";
import TestViewer from "./TestViewer";

interface TestWrapperProps {
  testId?: number;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ testId: propTestId }) => {
  const { testId: urlTestId } = useParams();
  const testId = propTestId || Number(urlTestId);

  return <TestViewer testId={testId} />;
};

export default TestWrapper;
