import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const SectionPdfViewer = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    // Здесь нужно получить pdfUrl для секции (например, из API или контекста)
    // Для примера: пусть pdfUrl формируется по sectionId
    // В реальном проекте — заменить на реальный источник
    setPdfUrl(`/pdfs/section_${sectionId}.pdf`);
  }, [sectionId]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold mb-4">PDF-файл секции</h1>
        {pdfUrl ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div>Загрузка PDF...</div>}
            error={<div>Ошибка загрузки PDF</div>}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
        ) : (
          <div>PDF не найден</div>
        )}
      </div>
    </Layout>
  );
};

export default SectionPdfViewer; 