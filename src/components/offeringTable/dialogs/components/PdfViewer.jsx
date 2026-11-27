import { useEffect, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString()


function PdfViewer({
    url,
    currentPageIndex,
    viewportWidth,
    viewportHeight,
    onPageCountChange,
    onClick
}) {
    const [pdfData, setPdfData] = useState(null)
    const [pdfDocument, setPdfDocument] = useState(null)
    const [pageDimensions, setPageDimensions] = useState(null)

    const [numPages, setNumPages] = useState(0)

    // Fetch PDF.
    useEffect(() => {
        const controller = new AbortController() // allows us to abort requests

        async function loadPdf() {
            setPdfData(null)
            setPdfDocument(null)
            setNumPages(0)
            onPageCountChange(0)

            try {
                const response = await fetch(url, {
                    signal: controller.signal
                })

                if (!response.ok) {
                    throw new Error("Failed to fetch PDF")
                }

                const data = await response.arrayBuffer()

                if (controller.signal.aborted) return

                setPdfData(data)
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Failed to load PDF:", error)
                    onPageCountChange(0)
                }
            }
        }

        loadPdf()

        return () => {controller.abort()}
    }, [url, onPageCountChange])

    // Get actual dimensions of the selected PDF page.
    useEffect(() => {
        if (!pdfDocument) return

        let cancelled = false

        async function loadPageDimensions() {
            setPageDimensions(null)

            try {
                const page = await pdfDocument.getPage(currentPageIndex + 1)
                const viewport = page.getViewport({ scale: 1 })

                if (!cancelled) {
                    setPageDimensions({
                        width: viewport.width,
                        height: viewport.height
                    })
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load PDF page:", error)
                }
            }
        }

        loadPageDimensions()

        return () => {cancelled = true}
    }, [pdfDocument, currentPageIndex])

    // Calculate page scale
    const pageScale = pageDimensions ? Math.min(
        1,
        viewportWidth > 0 ? (viewportWidth / pageDimensions.width) : 1,
        viewportHeight > 0 ? (viewportHeight / pageDimensions.height) : 1
    ) : 1

    function onDocumentLoadSuccess(pdf) {
        setPdfDocument(pdf)
        setNumPages(pdf.numPages)
        onPageCountChange(pdf.numPages)
    }

    function onDocumentLoadError(error) {
        console.error("Failed to render PDF:", error)
        onPageCountChange(0)
    }


    return (
        <div className="flex min-h-full min-w-full items-center justify-center">
            {pdfData && (
                <Document
                    file={pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    error={null}
                >
                    {numPages > 0 && pageDimensions && (
                        <div className="flex items-center justify-center">
                            <div 
                                className={`shadow-md ${currentPageIndex < numPages - 1 ? "cursor-pointer" : ""}`} 
                                onClick={onClick}
                            >
                                <Page
                                    key={`${url}-${currentPageIndex}`}
                                    pageNumber={currentPageIndex + 1}
                                    scale={pageScale}
                                />
                            </div>
                        </div>
                    )}
                </Document>
            )}
        </div>
    )
}


export default PdfViewer
