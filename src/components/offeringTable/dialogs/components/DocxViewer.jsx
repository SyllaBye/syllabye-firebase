import { useEffect, useState, useRef } from "react"
import { renderAsync } from "docx-preview"


function DocxViewer({
    url,
    currentPageIndex,
    viewportWidth,
    viewportHeight,
    onPageCountChange,
    onClick
}) {
    const containerRef = useRef(null)
    const pagesRef = useRef([])

    const [documentReady, setDocumentReady] = useState(false) // true when the document is ready to be displayed


    // Display and scale the selected page.
    function updatePageDisplay() {
        const pages = pagesRef.current

        // Check if we are safe to display
        if (!documentReady) {return}
        if (pages.length === 0) {return} // are we done fetching the document?
        if (viewportWidth <= 0 || viewportHeight <= 0) {return} // is the viewport container set up?

        // Reset pages to their original dimensions.
        pages.forEach(page => {
            page.style.zoom = "1"
        })

        // Hide all pages except the selected one.
        pages.forEach((page, index) => {
            page.style.display = (index === currentPageIndex ? "" : "none")
        })

        const selectedPage = pages[currentPageIndex]

        if (!selectedPage) {
            console.error("Selected page does not exist! Page Index:", currentPageIndex)
            return
        }

        // Measure the selected page at its original size.
        const { width, height } = selectedPage.getBoundingClientRect()

        // Calculate the scale needed to fit the viewport.
        const pageScale = Math.min(
            1,
            viewportWidth > 0 ? viewportWidth / width : 1,
            viewportHeight > 0 ? viewportHeight / height : 1
        )

        selectedPage.style.zoom = pageScale
        
        // Clicking the document changes pages except on the last page. Modify the cursor accordingly
        selectedPage.style.cursor = currentPageIndex < pages.length - 1 ? "pointer" : "default"
        
        // Reveal the document only after scaling is complete.
        containerRef.current.style.visibility = "visible"
    }

    // Fetch and render DOCX.
    useEffect(() => {
        const controller = new AbortController()

        async function loadDocument() {
            setDocumentReady(false)
            pagesRef.current = []
            onPageCountChange(0)

            try {
                const response = await fetch(url, {
                    signal: controller.signal
                })

                if (!response.ok) {
                    throw new Error("Failed to fetch DOCX")
                }

                const data = await response.arrayBuffer()

                if (controller.signal.aborted) return

                containerRef.current.innerHTML = ""
                containerRef.current.style.visibility = "hidden"

                await renderAsync(
                    data,
                    containerRef.current,
                    containerRef.current,
                    {
                        breakPages: true,
                        ignoreLastRenderedPageBreak: false
                    }
                )

                if (controller.signal.aborted) return

                pagesRef.current = Array.from(
                    containerRef.current.querySelectorAll("section.docx")
                )

                onPageCountChange(pagesRef.current.length)

                setDocumentReady(true)
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Failed to render DOCX:", error)
                    onPageCountChange(0)
                }
            }
        }

        loadDocument()

        return () => {
            controller.abort()
            pagesRef.current = []

            if (containerRef.current) {
                containerRef.current.innerHTML = ""
            }
        }
    }, [url, onPageCountChange])

    // Update page visibility and scale when necessary.
    useEffect(() => {
        updatePageDisplay()
    }, [currentPageIndex, viewportWidth, viewportHeight, documentReady])

    return (
        <div className="flex min-h-full min-w-full items-center justify-center">
            <style>
                {`
                    .docx-wrapper {
                        padding: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        background: none !important;
                    }

                    .docx-wrapper > section.docx {
                        margin: 0 !important;
                        outline: none !important;
                        border: none !important;
                        box-shadow: var(--shadow-md) !important;
                    }
                `}
            </style>

            <div
                ref={containerRef}
                onClick={event => {
                    if (event.target.closest("section.docx")) {
                        onClick?.()
                    }
                }}
            />
        </div>
    )
}


export default DocxViewer
